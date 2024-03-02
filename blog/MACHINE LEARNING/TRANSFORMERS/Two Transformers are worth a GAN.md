

1/2 of the network is just ViT vision transformer
and the other half is Noise -> Transformer -> upsampling -> transformer -> flatten 


WE start with lots of channels, few pixels and we end up with lots of pixels and few channels

WE start out with a lot of channels 
and each time we unroll and upsample the resolution by 2, we divide the number of channels by 4
We essentially unroll the vector which represents at each coordinate the value of Channel $i$ for pixel $P_i$ .


They find that they could easily replace the generator part of the GAN with a transformer (which is weird because it is the inverted unrolling algorithm that generates an image from noise)


But when they try to change the discriminator they lose a lot in performance.

transformers work well by having a lot of data because it does not have a lot of inductive bias. 

They perfom masking during the generation part of the transformer

This is basically an attention version of a convolution,

This technique is just to help the GAN do training

