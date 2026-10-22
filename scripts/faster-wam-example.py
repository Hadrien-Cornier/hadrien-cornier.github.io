#!/usr/bin/env python3
"""Real LIBERO data through actual LeRobot modules, all model weights random.
See assets/robotics/faster-wam-in-lerobot/README.md for versions and conditions.
"""
import sys, types, json, hashlib, time
from pathlib import Path
import numpy as np
import torch
from PIL import Image
import pyarrow.parquet as pq
from diffusers import AutoencoderKLWan
from transformers import AutoTokenizer, UMT5Config, UMT5EncoderModel

import argparse, subprocess
from urllib.request import urlretrieve
parser=argparse.ArgumentParser(description="Reproduce the explicitly random-weight LIBERO worked example. Does not train or drive a robot.")
parser.add_argument('--lerobot-source', type=Path, required=True, help='LeRobot checkout, containing src/lerobot')
parser.add_argument('--data-dir', type=Path, required=True, help='Download/cache/output directory outside the blog checkout')
args=parser.parse_args()
ROOT=args.data_dir.resolve();ROOT.mkdir(parents=True,exist_ok=True)
SOURCE=args.lerobot_source.resolve()/'src'
base='https://huggingface.co/datasets/yuanty/LIBERO-fastwam/resolve/ee018b997c430bb12b5bf3c892d744798c5a2f91/lerobot_v30/libero_spatial_no_noops_lerobot/'
for remote,local in [('data/chunk-000/file-000.parquet','sample-data.parquet'),('meta/tasks.parquet','sample-tasks.parquet'),('meta/stats.json','sample-stats.json')]:
 if not (ROOT/local).exists():urlretrieve(base+remote,ROOT/local)
(ROOT/'frames').mkdir(exist_ok=True)
for camera,key in [('agent','observation.images.image'),('wrist','observation.images.wrist_image')]:
 if not (ROOT/'frames'/f'{camera}-033.png').exists():
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',base+f'videos/{key}/chunk-000/file-000.mp4','-t','1.65','-vf','fps=20','-frames:v','33',str(ROOT/'frames'/f'{camera}-%03d.png')],check=True)
# Load unmodified component modules without importing the unrelated full policy registry.
for name, rel in [('lerobot','lerobot'),('lerobot.utils','lerobot/utils'),('lerobot.policies','lerobot/policies'),('lerobot.policies.fastwam','lerobot/policies/fastwam'),('lerobot.policies.fastwam.wan','lerobot/policies/fastwam/wan')]:
 m=types.ModuleType(name);m.__path__=[str(SOURCE/rel)];sys.modules[name]=m
from lerobot.policies.fastwam.wan import modular as mod
from lerobot.policies.fastwam.wan.video_dit import WanVideoDiT
from lerobot.policies.fastwam.wan.adapters import WanVideoVAE38

torch.set_num_threads(2)
torch.manual_seed(1234)
rows=pq.read_table(ROOT/'sample-data.parquet').slice(0,33).to_pylist()
task=pq.read_table(ROOT/'sample-tasks.parquet').to_pylist()[0]['__index_level_0__']
stats=json.loads((ROOT/'sample-stats.json').read_text())
raw_actions=torch.tensor([r['action'] for r in rows[:32]])
raw_state=torch.tensor(rows[0]['observation.state'])
mean=torch.tensor(stats['action']['mean']);std=torch.tensor(stats['action']['std']).clamp(min=1e-8)
state_mean=torch.tensor(stats['observation.state']['mean']);state_std=torch.tensor(stats['observation.state']['std']).clamp(min=1e-8)
actions=((raw_actions-mean)/std).unsqueeze(0)
state=((raw_state-state_mean)/state_std).unsqueeze(0)
images=[]
for i in range(0,33,4):
 pair=[Image.open(ROOT/'frames'/f'{camera}-{i+1:03d}.png').convert('RGB').resize((224,224),Image.Resampling.BILINEAR) for camera in ['agent','wrist']]
 canvas=Image.new('RGB',(448,224));canvas.paste(pair[0],(0,0));canvas.paste(pair[1],(224,0));images.append(canvas)
video=torch.tensor(np.stack([np.asarray(i).copy() for i in images])).permute(3,0,1,2).float().unsqueeze(0)/255
print('input',video.shape,flush=True)
vae_config=dict(base_dim=4,decoder_base_dim=4,z_dim=48,dim_mult=[1,2,2,2],num_res_blocks=1,latents_mean=[0.]*48,latents_std=[1.]*48,is_residual=True,in_channels=12,out_channels=12,patch_size=2,scale_factor_temporal=4,scale_factor_spatial=16)
vae=WanVideoVAE38(pretrained=AutoencoderKLWan(**vae_config),device='cpu')
video_config=dict(hidden_dim=12,in_dim=48,ffn_dim=24,out_dim=48,text_dim=24,freq_dim=8,eps=1e-6,patch_size=(1,2,2),num_heads=2,attn_head_dim=6,num_layers=30,seperated_timestep=True,video_attention_mask_mode='first_frame_causal',fp32_attention=False)
action_config=dict(hidden_dim=12,action_dim=7,ffn_dim=24,text_dim=24,freq_dim=8,eps=1e-6,num_heads=2,attn_head_dim=6,num_layers=1,fp32_attention=False,use_text_cross_attention=False)
video_expert=WanVideoDiT(**video_config)
action_expert=mod.ActionDiT(**action_config)
fusion=mod.LiteKVFusion(1,2,30)
mot=mod.MoT({'video':video_expert,'action':action_expert},mot_checkpoint_mixed_attn=False,lite_kv_fusion=fusion,retracted_1d_rope=True)
model=mod.FastWAM(video_expert,action_expert,mot,vae,text_dim=24,proprio_dim=8,world_model_only_conditioning=True)
# The actual tokenizer and transformer architecture, explicitly random text weights.
# This is a separate reduced-width mechanics probe, not the production pretrained-encoder recipe.
tokenizer=AutoTokenizer.from_pretrained('google/umt5-xxl')
prompt="A video recorded from a robot's point of view executing the following instruction: "+task
ids=tokenizer(prompt,return_tensors='pt',max_length=128,padding='max_length',truncation=True)
text_config=UMT5Config(vocab_size=tokenizer.vocab_size,d_model=24,d_kv=12,d_ff=48,num_layers=1,num_heads=2,dropout_rate=0.)
text_encoder=UMT5EncoderModel(text_config).eval()
with torch.no_grad():
 context=text_encoder(**ids).last_hidden_state
 context[~ids['attention_mask'].bool()]=0
mask=torch.ones_like(ids['attention_mask'],dtype=torch.bool)
sample={'video':video,'action':actions,'proprio':state.unsqueeze(1),'context':context,'context_mask':mask}
record={}
original_targets=model._sample_training_targets
original_run=model._run_training_mot
def capture_targets(inputs):
 targets=original_targets(inputs);record['targets']=targets;record['inputs']=inputs;return targets
def capture_run(inputs,targets):
 out=original_run(inputs,targets);record['training_prediction']=out;return out
model._sample_training_targets=capture_targets
model._run_training_mot=capture_run
start=time.monotonic()
with torch.no_grad():
 loss,metrics=model.training_loss(sample)
print('loss',loss.item(),metrics,'seconds',time.monotonic()-start,flush=True)
record['inference_states']=[]
original_prefill=model.mot.prefill_video_cache
def capture_prefill(*args,**kwargs):
 out=original_prefill(*args,**kwargs);record['kv']=out;return out
model.mot.prefill_video_cache=capture_prefill
original_pre=video_expert.pre_dit
def capture_pre(*args,**kwargs):
 out=original_pre(*args,**kwargs);record['pre']=out;return out
video_expert.pre_dit=capture_pre
original_step=model.infer_action_scheduler.step
def capture_step(model_output,delta,sample):
 if not record['inference_states']:record['inference_states'].append(sample.detach().clone())
 out=original_step(model_output,delta,sample);record['inference_states'].append(out.detach().clone());return out
model.infer_action_scheduler.step=capture_step
attention=[]
original_attention=mod.fastwam_masked_attention
def capture_attention(q,k,v,num_heads,ctx_mask=None,fp32_attention=True):
 if q.shape[1]==32 and not attention:
  qh=q.view(1,32,num_heads,-1).transpose(1,2).float();kh=k.view(1,k.shape[1],num_heads,-1).transpose(1,2).float()
  scores=qh@kh.transpose(-2,-1)/(qh.shape[-1]**.5)
  if ctx_mask is not None:scores=scores.masked_fill(~ctx_mask,-float('inf'))
  attention.append({'q':qh.detach(),'k':kh.detach(),'v':v.detach(),'weights':scores.softmax(-1).detach()})
 return original_attention(q,k,v,num_heads,ctx_mask,fp32_attention)
mod.fastwam_masked_attention=capture_attention
with torch.no_grad():
 prediction=model.infer_action(None,video[:,:,0],32,proprio=state,context=context,context_mask=mask,num_inference_steps=10,seed=1234)
print('inference',prediction['action'].shape,'attention',len(attention),'states',len(record['inference_states']),flush=True)
targets=record['targets'];pred_video,pred_action=record['training_prediction']
export={'kind':'Dry run: reduced-width random-weight pipeline, real simulation data. All encoders and transformer weights random; no trained policy quality.', 'dataset':{'repo':'yuanty/LIBERO-fastwam','revision':'ee018b997c430bb12b5bf3c892d744798c5a2f91','suite':'libero_spatial_no_noops_lerobot','episode':0,'frame':0,'task':task,'fps':20,'license':'CC BY 4.0'},'shapes':{'image':list(video[:,:,0].shape),'video':list(video.shape),'latents':list(record['inputs']['input_latents'].shape),'context':list(context.shape),'action':list(actions.shape)},'raw_actions':raw_actions.tolist(),'state':raw_state.tolist(),'normalized_actions':actions[0].tolist(),'action_mean':mean.tolist(),'action_std':std.tolist(),'loss':{'total':loss.item(),**metrics,'sigma_video':float(targets['timestep_video'].item()/1000),'sigma_action':float(targets['timestep_action'].item()/1000),'action_weight':model.train_action_scheduler.training_weight(targets['timestep_action']).item(),'action_target':targets['target_action'][0].tolist(),'action_prediction':pred_action[0].tolist()},'prediction':prediction['action'].tolist(),'prediction_raw':(prediction['action']*std+mean).tolist(),'inference_states':[x[0].tolist() for x in record['inference_states']],'configs':{'vae':vae_config,'video':video_config,'action':action_config,'text':text_config.to_dict()},'code_hashes':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in (SOURCE/'lerobot/policies/fastwam/wan').glob('*.py')},'torch':torch.__version__,'seed':1234}
export['video_kv_samples']=[{'k':kv['k'][0,:4].detach().tolist(),'v':kv['v'][0,:4].detach().tolist()} for kv in record.get('kv',[])]
export['pre_keys']=list(record.get('pre',{}))
if attention:
 a=attention[0];export['attention']={'q':a['q'][0,0,:4].tolist(),'k':a['k'][0,0,:98].tolist(),'weights':a['weights'][0,0,:4].tolist(),'video_tokens':98,'action_tokens':32,'head':0,'step':0,'note':'Exact first four query rows, all 130 columns of the joint attention softmax. First 98 columns are video; remaining 32 are action self-attention. Random weights, not semantic saliency.'}
(ROOT/'example-results.json').write_text(json.dumps(export,indent=2)+'\n')
images[0].save(ROOT/'input-pair.png')
print('saved',flush=True)
