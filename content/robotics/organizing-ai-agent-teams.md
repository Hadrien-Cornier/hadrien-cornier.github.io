---
title: 'What is the best way to organize a team of AI agents?'
description: 'In one week, two of my agent setups failed at the seams between agents: a robot arm stuck behind four layers of permission, and a benchmark where two workers disagreed on a coordinate format. The research measures pieces of the question. Which team shape, and which model in which seat, is still open. A long read with a pinned blackboard.'
date: '2026-10-29'
draft: false
layout: essay
tags: ['agents', 'ai', 'measurement']
thumbnail: '/assets/robotics/organizing-ai-agent-teams/thumbnail.svg'
thumbnail_alt: 'Blackboard drawing: an org chart of AI agents with a red break at the seam between two workers, and a grid of question marks for the team shapes nobody has measured'
---

<div class="article-body rebuild-article">
<div class='rc' id='rc' data-whole='0 0 840 1048' data-views='{"chain":[12,88,396,300],"loop":[432,88,396,300],"cooper":[12,408,396,300],"papers":[432,408,396,300],"matrix":[12,728,396,300],"open":[432,728,396,300]}'><div class='rc-stage'><div class='rc-bar'><button type='button' class='rc-reset'>Whole board</button><p class='rc-where' aria-live='polite'>Whole board</p></div><div class='rc-view'><svg id='rc-ato' class='rc-svg ato-board' viewBox='0 0 840 1048' role='img' aria-label='Blackboard with six panels: the four layers between me and a robot arm, the coordinate format loop in a VLM benchmark, CooperBench scores for one agent versus two, where a team budget pays off, four team shapes and when each wins, and the table of team shapes nobody has measured' data-whole='0 0 840 1048' data-views='{"chain":[12,88,396,300],"loop":[432,88,396,300],"cooper":[12,408,396,300],"papers":[432,408,396,300],"matrix":[12,728,396,300],"open":[432,728,396,300]}'>
<defs><filter id='ato-chalk' x='-5%' y='-5%' width='110%' height='110%'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='3' result='noise'/><feDisplacementMap in='SourceGraphic' in2='noise' scale='1.4' xChannelSelector='R' yChannelSelector='G'/></filter><marker id='ato-arr' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto'><path d='M0,0 L10,5 L0,10 z' fill='#ece8dc'/></marker><marker id='ato-arr-g' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto'><path d='M0,0 L10,5 L0,10 z' fill='#9be39b'/></marker><marker id='ato-arr-r' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto'><path d='M0,0 L10,5 L0,10 z' fill='#ff7a7a'/></marker><style>.ato-board text{fill:#ece8dc;font-size:12px;font-family:inherit;font-variant-ligatures:none;font-feature-settings:"liga" 0}.ato-board .ato-h{font-size:16px;font-weight:700}.ato-board .ato-s{font-size:11px;fill:#c8c3b4}.ato-board .ato-t{font-size:11px}.ato-board .ato-b{fill:#8ab8ff}.ato-board .ato-g{fill:#9be39b}.ato-board .ato-p{fill:#ff9fd0}.ato-board .ato-r{fill:#ff7a7a}.ato-board .ato-y{fill:#f5d76e}.ato-board .ato-frame{fill:none;stroke:#ece8dc;stroke-opacity:.4;stroke-width:1.5}.ato-board .ato-box{fill:none;stroke-width:1.5}.ato-board .ato-ln{fill:none;stroke:#ece8dc;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.ato-board .ato-lead{fill:none;stroke:#ece8dc;stroke-opacity:.45;stroke-width:1}</style></defs>
<rect width='840' height='1048' fill='#1e2622'/>
<text x='420' y='40' text-anchor='middle' style='font-size:22px;font-weight:700'>How should a team of AI agents be organized?</text>
<text class='ato-s' x='420' y='66' text-anchor='middle'><tspan class='ato-y'>me</tspan> · <tspan class='ato-b'>agents</tspan> · <tspan class='ato-r'>stops and failures</tspan> · <tspan class='ato-g'>permission and wins</tspan> · <tspan class='ato-p'>unknown</tspan></text>
<g class='rc-panel' data-panel='chain' transform='translate(12,88)'>
<rect class='ato-frame' width='396' height='300' rx='8' filter='url(#ato-chalk)'/>
<text class='ato-h' x='14' y='26'>1 · Four layers between me and the arm</text>
<rect class='ato-box' x='40' y='40' width='140' height='26' rx='5' stroke='#f5d76e' filter='url(#ato-chalk)'/><text class='ato-y' x='110' y='58' text-anchor='middle'>me</text>
<rect class='ato-box' x='40' y='80' width='140' height='26' rx='5' stroke='#8ab8ff' filter='url(#ato-chalk)'/><text class='ato-b' x='110' y='98' text-anchor='middle'>supervisor agent</text>
<rect class='ato-box' x='40' y='120' width='140' height='26' rx='5' stroke='#8ab8ff' filter='url(#ato-chalk)'/><text class='ato-b' x='110' y='138' text-anchor='middle'>hardware lead agent</text>
<rect class='ato-box' x='40' y='160' width='140' height='26' rx='5' stroke='#8ab8ff' filter='url(#ato-chalk)'/><text class='ato-b' x='110' y='178' text-anchor='middle'>arm worker agent</text>
<rect class='ato-box' x='40' y='200' width='140' height='26' rx='5' stroke='#ece8dc' filter='url(#ato-chalk)'/><text x='110' y='218' text-anchor='middle'>Pi driver → motors</text>
<path class='ato-ln' d='M110 67V77M110 107V117M110 147V157M110 187V197' marker-end='url(#ato-arr)'/>
<path d='M24 53V212' fill='none' stroke='#9be39b' stroke-width='2' marker-end='url(#ato-arr-g)'/>
<path d='M18 93H30M18 133H30M18 173H30' fill='none' stroke='#9be39b' stroke-width='2'/>
<rect x='188' y='87' width='12' height='12' fill='#ff7a7a'/><rect x='188' y='127' width='12' height='12' fill='#ff7a7a'/><rect x='188' y='167' width='12' height='12' fill='#ff7a7a'/>
<text class='ato-r' x='212' y='56'>Any layer adds a stop,</text>
<text class='ato-r' x='212' y='72'>and it holds at once.</text>
<text class='ato-g' x='212' y='104'>Only my words lift it,</text>
<text class='ato-g' x='212' y='120'>rewritten three times</text>
<text class='ato-g' x='212' y='136'>on the way down.</text>
<text class='ato-y' x='212' y='170'>graphite stop: ≈16 h</text>
<text class='ato-y' x='212' y='188'>misread result: idle all night</text>
<path class='ato-lead' d='M14 238H382'/>
<text class='ato-g' x='14' y='258'>next morning: one session, clean context</text>
<text class='ato-g' x='14' y='276'>new ink that morning, a cat by evening</text>
<text class='ato-s' x='14' y='294'>the move also changed the model and the rules</text>
</g>
<g class='rc-panel' data-panel='loop' transform='translate(432,88)'>
<rect class='ato-frame' width='396' height='300' rx='8' filter='url(#ato-chalk)'/>
<text class='ato-h' x='14' y='26'>2 · The format loop</text>
<text class='ato-s' x='14' y='44'>x_1000, y_1000: a point on a 0–1000 grid</text>
<text class='ato-s' x='14' y='58'>u, v: pixel column and row in the image</text>
<rect class='ato-box' x='14' y='70' width='58' height='26' rx='5' stroke='#ece8dc' filter='url(#ato-chalk)'/><text x='43' y='88' text-anchor='middle'>model</text>
<rect class='ato-box' x='88' y='70' width='150' height='26' rx='5' stroke='#8ab8ff' filter='url(#ato-chalk)'/><text class='ato-b ato-t' x='163' y='88' text-anchor='middle'>x_1000=700, y_1000=300</text>
<rect class='ato-box' x='254' y='70' width='128' height='26' rx='5' stroke='#ff9fd0' filter='url(#ato-chalk)'/><text class='ato-p ato-t' x='318' y='88' text-anchor='middle'>u=671, v=120</text>
<path class='ato-ln' d='M73 83H85M239 83H251M318 97V115' marker-end='url(#ato-arr)'/>
<rect class='ato-box' x='232' y='118' width='150' height='26' rx='5' stroke='#ff9fd0' filter='url(#ato-chalk)'/><text class='ato-p ato-t' x='307' y='136' text-anchor='middle'>history: u=671, v=120</text>
<text class='ato-s' x='152' y='126' text-anchor='middle'>shown in the next prompt</text>
<path class='ato-ln' d='M231 131H75' marker-end='url(#ato-arr)'/>
<rect class='ato-box' x='14' y='118' width='58' height='26' rx='5' stroke='#ece8dc' filter='url(#ato-chalk)'/><text x='43' y='136' text-anchor='middle'>model</text>
<path class='ato-ln' d='M43 145V163' marker-end='url(#ato-arr)'/>
<rect class='ato-box' x='14' y='166' width='130' height='26' rx='5' stroke='#ff7a7a' filter='url(#ato-chalk)'/><text class='ato-r ato-t' x='79' y='184' text-anchor='middle'>u=670, v=130</text>
<path d='M145 179H165' fill='none' stroke='#ff7a7a' stroke-width='1.6' marker-end='url(#ato-arr-r)'/>
<rect class='ato-box' x='168' y='166' width='150' height='26' rx='5' stroke='#8ab8ff' filter='url(#ato-chalk)'/><text class='ato-r ato-t' x='243' y='184' text-anchor='middle'>parser: rejected ✗</text>
<text class='ato-s' x='14' y='208'>the model copies the format it sees</text>
<text class='ato-b' x='14' y='226'>blue: worker 1 owns the reply format</text>
<text class='ato-p' x='14' y='242'>pink: worker 2 owns the history</text>
<text class='ato-r' x='14' y='262'>two main models, multi-step: ≈30% rejected</text>
<text class='ato-g' x='14' y='278'>same models, single-step: none rejected</text>
<text class='ato-y' x='14' y='294'>fix: store the history in the reply's format</text>
</g>
<g class='rc-panel' data-panel='cooper' transform='translate(12,408)'>
<rect class='ato-frame' width='396' height='300' rx='8' filter='url(#ato-chalk)'/>
<text class='ato-h' x='14' y='26'>3 · CooperBench: two agents vs one</text>
<text class='ato-s' x='14' y='46'>two features in the same repo; a task passes</text>
<text class='ato-s' x='14' y='60'>when both pass their tests after the merge</text>
<rect x='14' y='73' width='10' height='10' fill='#ece8dc' fill-opacity='.75'/><text class='ato-t' x='28' y='82'>one agent does both</text>
<rect x='170' y='73' width='10' height='10' fill='#ff9fd0' fill-opacity='.8'/><text class='ato-t' x='184' y='82'>two agents, one feature each</text>
<text x='14' y='112'>GPT-5</text>
<rect x='118' y='98' width='193' height='11' fill='#ece8dc' fill-opacity='.75' filter='url(#ato-chalk)'/><text class='ato-t' x='316' y='108'>48.3%</text>
<rect x='118' y='112' width='112' height='11' fill='#ff9fd0' fill-opacity='.8' filter='url(#ato-chalk)'/><text class='ato-p ato-t' x='235' y='122'>28.0%</text>
<text x='14' y='154'>Sonnet 4.5</text>
<rect x='118' y='140' width='188' height='11' fill='#ece8dc' fill-opacity='.75' filter='url(#ato-chalk)'/><text class='ato-t' x='311' y='150'>47.1%</text>
<rect x='118' y='154' width='104' height='11' fill='#ff9fd0' fill-opacity='.8' filter='url(#ato-chalk)'/><text class='ato-p ato-t' x='227' y='164'>25.9%</text>
<text x='14' y='196'>Gemini 3 Flash</text>
<rect x='118' y='182' width='194' height='11' fill='#ece8dc' fill-opacity='.75' filter='url(#ato-chalk)'/><text class='ato-t' x='317' y='192'>48.6%</text>
<rect x='118' y='196' width='105' height='11' fill='#ff9fd0' fill-opacity='.8' filter='url(#ato-chalk)'/><text class='ato-p ato-t' x='228' y='206'>26.2%</text>
<text class='ato-s' x='14' y='226'>% of 652 tasks solved, OpenHands harnesses</text>
<text class='ato-p' x='14' y='248'>paper: pairs ≈30% lower success on average</text>
<text class='ato-s' x='14' y='268'>models listed: GPT-5, Sonnet 4.5, Gemini 3, open models</text>
<text class='ato-r' x='14' y='288'>mine (GPT-6.1 Sol, Opus 5.5): not on it</text>
</g>
<g class='rc-panel' data-panel='papers' transform='translate(432,408)'>
<rect class='ato-frame' width='396' height='300' rx='8' filter='url(#ato-chalk)'/>
<text class='ato-h' x='14' y='26'>4 · Where a team's budget pays off</text>
<text class='ato-b' x='14' y='48'>Teams of coding agents (preprint, Oct 2026)</text>
<text x='14' y='66'>strong lead + cheap planners:</text>
<rect x='14' y='74' width='143' height='11' fill='#9be39b' fill-opacity='.8' filter='url(#ato-chalk)'/><text class='ato-g ato-t' x='163' y='84'>47.5% of an all-strong team's gain</text>
<rect x='14' y='90' width='42' height='11' fill='#f5d76e' fill-opacity='.8' filter='url(#ato-chalk)'/><text class='ato-y ato-t' x='62' y='100'>13.9% of its extra cost</text>
<text class='ato-r' x='14' y='122'>cheap implementers: lower score</text>
<text class='ato-s' x='14' y='138'>ProgramBench teams: 3–7× the solo cost</text>
<text class='ato-b' x='14' y='166'>Teams hold experts back (ICML 2026)</text>
<text x='14' y='184'>4 agents talk for 4 rounds, then vote:</text>
<text class='ato-r' x='14' y='200'>up to 41.1% below following the right agent</text>
<text class='ato-b' x='14' y='228'>TeamBench (preprint, May 2026)</text>
<text class='ato-r' x='14' y='246'>verifiers passed 49% of failing work</text>
<text x='14' y='264'>teams help when one agent struggles,</text>
<text x='14' y='280'>and hurt when one agent does well</text>
</g>
<g class='rc-panel' data-panel='matrix' transform='translate(12,728)'>
<rect class='ato-frame' width='396' height='300' rx='8' filter='url(#ato-chalk)'/>
<text class='ato-h' x='14' y='26'>5 · Four shapes in the studies so far</text>
<text class='ato-g' x='100' y='48'>helped when</text>
<text class='ato-r' x='252' y='48'>hurt when</text>
<circle cx='50' cy='78' r='11' fill='none' stroke='#8ab8ff' stroke-width='1.8' filter='url(#ato-chalk)'/>
<text class='ato-s' x='50' y='106' text-anchor='middle'>one agent</text>
<text class='ato-t' x='100' y='76'>it already does</text><text class='ato-t' x='100' y='92'>well (TeamBench)</text>
<text class='ato-t' x='252' y='76'>broad research</text><text class='ato-t' x='252' y='92'>(Anthropic's team won)</text>
<path class='ato-lead' d='M14 112H382'/>
<circle cx='50' cy='120' r='5' fill='none' stroke='#8ab8ff' stroke-width='1.6'/><circle cx='36' cy='138' r='4' fill='none' stroke='#8ab8ff' stroke-width='1.6'/><circle cx='64' cy='138' r='4' fill='none' stroke='#8ab8ff' stroke-width='1.6'/>
<path d='M47 124L38 134M53 124L62 134M34 142L28 150M38 142L42 150M62 142L58 150M66 142L72 150' fill='none' stroke='#8ab8ff' stroke-width='1.3'/>
<circle cx='28' cy='152' r='2.2' fill='#8ab8ff'/><circle cx='42' cy='152' r='2.2' fill='#8ab8ff'/><circle cx='58' cy='152' r='2.2' fill='#8ab8ff'/><circle cx='72' cy='152' r='2.2' fill='#8ab8ff'/>
<text class='ato-s' x='50' y='164' text-anchor='middle'>hierarchy</text>
<text class='ato-t' x='100' y='130'>a strong manager</text><text class='ato-t' x='100' y='146'>directs a weak worker</text>
<text class='ato-t' x='252' y='130'>authority is relayed,</text><text class='ato-t' x='252' y='146'>oversight piles up</text>
<path class='ato-lead' d='M14 170H382'/>
<circle cx='32' cy='190' r='6' fill='none' stroke='#8ab8ff' stroke-width='1.6'/><circle cx='50' cy='190' r='6' fill='none' stroke='#8ab8ff' stroke-width='1.6'/><circle cx='68' cy='190' r='6' fill='none' stroke='#8ab8ff' stroke-width='1.6'/>
<text class='ato-s' x='50' y='216' text-anchor='middle'>parallel peers</text>
<text class='ato-t' x='100' y='186'>work splits into</text><text class='ato-t' x='100' y='202'>independent pieces</text>
<text class='ato-t' x='252' y='186'>features conflict, or</text><text class='ato-t' x='252' y='202'>they settle by discussion</text>
<path class='ato-lead' d='M14 222H382'/>
<circle cx='40' cy='242' r='10' fill='none' stroke='#8ab8ff' stroke-width='1.8' filter='url(#ato-chalk)'/>
<path d='M50 238L63 232M50 242L66 244M49 247L63 255' fill='none' stroke='#c8c3b4' stroke-width='1.2'/>
<circle cx='66' cy='231' r='3' fill='#c8c3b4'/><circle cx='69' cy='244' r='3' fill='#c8c3b4'/><circle cx='66' cy='257' r='3' fill='#c8c3b4'/>
<text class='ato-s' x='50' y='272' text-anchor='middle'>lead + helpers</text>
<text class='ato-t' x='100' y='238'>cheap planners</text><text class='ato-t' x='100' y='254'>(ProgramBench)</text>
<text class='ato-t' x='252' y='238'>cheap coders</text><text class='ato-t' x='252' y='254'>(ProgramBench)</text>
<text class='ato-y' x='14' y='294'>my week: a hierarchy on coupled work, twice</text>
</g>
<g class='rc-panel' data-panel='open' transform='translate(432,728)'>
<rect class='ato-frame' width='396' height='300' rx='8' filter='url(#ato-chalk)'/>
<text class='ato-h' x='14' y='26'>6 · The table nobody has filled in</text>
<text class='ato-s' x='14' y='46'>score: correct work per dollar and per hour</text>
<text class='ato-s' x='14' y='60'>of my attention, for one task and one budget</text>
<text class='ato-s' x='170' y='118' text-anchor='middle'>robot arm</text><text class='ato-s' x='254' y='118' text-anchor='middle'>benchmark</text><text class='ato-s' x='338' y='118' text-anchor='middle'>this blog</text>
<text class='ato-t' x='14' y='142'>one agent</text><text class='ato-t' x='14' y='172'>hierarchy</text><text class='ato-t' x='14' y='202'>parallel peers</text><text class='ato-t' x='14' y='232'>lead + helpers</text>
<g fill='none' stroke='#ece8dc' stroke-opacity='.35'><rect x='134' y='126' width='72' height='22' rx='4'/><rect x='218' y='126' width='72' height='22' rx='4'/><rect x='302' y='126' width='72' height='22' rx='4'/><rect x='134' y='156' width='72' height='22' rx='4'/><rect x='218' y='156' width='72' height='22' rx='4'/><rect x='302' y='156' width='72' height='22' rx='4'/><rect x='134' y='186' width='72' height='22' rx='4'/><rect x='218' y='186' width='72' height='22' rx='4'/><rect x='302' y='186' width='72' height='22' rx='4'/><rect x='134' y='216' width='72' height='22' rx='4'/><rect x='218' y='216' width='72' height='22' rx='4'/><rect x='302' y='216' width='72' height='22' rx='4'/></g>
<text class='ato-g ato-t' x='170' y='142' text-anchor='middle'>✓ once</text><text class='ato-p' x='254' y='142' text-anchor='middle'>?</text><text class='ato-p' x='338' y='142' text-anchor='middle'>?</text>
<text class='ato-r ato-t' x='170' y='172' text-anchor='middle'>✗ once</text><text class='ato-r ato-t' x='254' y='172' text-anchor='middle'>✗ once</text><text class='ato-p' x='338' y='172' text-anchor='middle'>?</text>
<text class='ato-p' x='170' y='202' text-anchor='middle'>?</text><text class='ato-p' x='254' y='202' text-anchor='middle'>?</text><text class='ato-p' x='338' y='202' text-anchor='middle'>?</text>
<text class='ato-p' x='170' y='232' text-anchor='middle'>?</text><text class='ato-p' x='254' y='232' text-anchor='middle'>?</text><text class='ato-p' x='338' y='232' text-anchor='middle'>?</text>
<text class='ato-s' x='14' y='80'>✓ ✗: one anecdote each, with several changes at once</text>
<text class='ato-p' x='14' y='96'>?: nobody has measured it in public</text>
<text class='ato-y' x='14' y='268'>for this task and budget: which shape,</text>
<text class='ato-y' x='14' y='286'>and which model in which seat?</text>
</g>
</svg></div></div>
<div class='rc-body'>
<p>For the past few weeks I've run most of my work through a small company of AI agents. I talk to one supervisor agent, which hands each project to a lead agent that owns one area, such as my robot arm, a research benchmark or this blog. Each lead then runs its own crew of worker agents that write the code and run the jobs. On paper it looks like a well-run company: every project has an owner, every owner has a manager, and the work keeps moving in parallel while I sleep.</p>
<p>Then two things went wrong in the same week that made me doubt the org chart. In each case the agents followed their own instructions, yet the failure happened in the space between them. Both failures made me wonder whether a single agent with the whole picture would have done better, so I went looking for the right shape. Should you run one strong agent, a hierarchy of supervisors and crews, a few sessions in parallel, or a strong lead with cheap helpers? And how do you decide which model should sit in which seat? I couldn't find an answer anywhere, which surprised me.</p>
<div class='rc-mark' data-panel='chain' data-view='chain' data-title='Four layers between me and the arm'></div>
<h2 id='sec-chain'>The arm that waited for permission</h2>
<p>The first failure was with my robot arm, which I'm teaching to draw with a pen. Between me and its motors there were four layers: the supervisor, the lead agent for hardware, a worker agent that owned the arm, and the driver script on a Raspberry Pi that actually moves the joints. Every layer could stop the arm, a sensible-sounding design for a machine that moves around in the real world.</p>
<p>Here's how it played out: one evening the pen ran out of graphite, so I asked for a stop. As the stop went down the chain, each layer restated it in its own words, and the version that reached the arm carried a condition: the arm stays stopped until I explicitly resume it after the refill. A note in the hardware rules even said that refilling the pen alone was not permission to resume. The arm stayed still for about 16 hours, until I said the words again, even though that same morning I had told the agents I was "tired and exasperated of seeing the arm stopping".</p>
<p>Look at the asymmetry on the board: any layer can add a stop that takes effect at once, while lifting a stop takes my words, which have to survive three rewrites on the way down. So stops pile up over time, and permission leaks away at every handoff. The next night the same thing happened again, more quietly. The hardware lead read an ambiguous result as "physical runs not authorized", ended its turn with nothing running on the arm, then waited for me to answer a question about where to draw. The arm sat idle all night, until the supervisor reported it the next morning.</p>
<p>That morning I gave up on the chain and moved the arm to a single agent session with a clean context, no inherited rules, and sub-agents limited to cheap models. It put new ink on the page within a few hours, then drew a cat by the evening. The comparison is messier than it looks, because the move changed the model, the rules and the eyes on the problem all at once. The fresh session also found that the "pen contacts" the old workers had been counting at full reach were the gripper jaw touching the page. What the cat does show is that the four-layer setup lost whole days to waiting, for reasons that had nothing to do with drawing.</p>
<div class='rc-mark' data-panel='loop' data-view='loop' data-title='The format loop'></div>
<h2 id='sec-loop'>Two workers, one coordinate format</h2>
<p>The second failure came a few days later, in a robotics VLM benchmark I built overnight with agents. A VLM (vision-language model) takes an image and a question and answers in text. In this benchmark the model watches a simulated two-arm robot at a table and decides, one step at a time, which part to pick up and where to put it, by naming a point in the camera image. The supervisor split the build across three workers. One owned the prompt and the format of the model's reply, one owned the simulator side, including the record of what happened at each step, and one wrote the report.</p>
<p>The prompt asked the model for its point on a 0 to 1000 grid, the coordinate convention of the models we tested, whatever the image size. The first worker then read the reply as <code>x_1000</code> and <code>y_1000</code> and converted it to pixel coordinates <code>u</code> (column) and <code>v</code> (row) for the controller. The second worker kept a history of past steps that goes back into the prompt, so the model can see what it already tried, but it stored each action after the conversion, in pixels.</p>
<p>In one recorded episode on the board, the model answers at step 1 <code>x_1000 = 700, y_1000 = 300</code>. The code converts that to the pixel (671, 120) for the arm, so the history now says that the last pick was at <code>u = 671, v = 120</code>. At step 2 the model wants to try a point right next to it. It does the most natural thing a language model can do: it copies the format in front of it and answers <code>u = 670, v = 130</code>. The parser expects <code>x_1000</code> and <code>y_1000</code> but finds <code>u</code> and <code>v</code>, so it rejects the answer as malformed and the step is lost.</p>
<p>Across the multi-step runs, the parser rejected about 30% of the decisions of the two main models, most of them this exact copy. There were no rejections at all in the single-step pointing tests, where there's no history to copy. What bothers me most is that the seam was visible. Someone had noticed that the history and the replies used different formats. I know because the prompt contained a line telling the model that the saved history uses pixel coordinates and is not the format for its new answer. That warning went in where a fix should have gone.</p>
<p>The morning report listed the rejections as "schema errors" with no cause. The supervisor's next instruction then asked the workers to count schema errors as one more failure mode and to keep the controller frozen, which turned a bug into a statistic. I found the cause the next morning in a tutoring session, where one model walked me through both files side by side. With the reply format and the history on the same screen, the bug was obvious, and so was the fix: store the history in the same format that the model is asked to answer in.</p>
<div class='rc-mark' data-panel='cooper' data-view='cooper' data-title='CooperBench: two agents vs one'></div>
<h2 id='sec-cooper'>Competent agents, broken seams</h2>
<p>Put the two stories side by side and the pattern is the same. Each agent followed its own instructions: the hardware lane followed its rules and the worker that kept the history stored exactly what the controller executed. The failures lived at the seams: on the arm, authority had to cross three handoffs and lost a little at each one, whereas in the benchmark a format crossed one boundary between two owners and nobody checked it from end to end.</p>
<p>Walden Yan at Cognition described the same failure in 2025, in a post called <a href='https://cognition.ai/blog/dont-build-multi-agents'>Don't Build Multi-Agents</a>. His example splits a Flappy Bird clone between two subagents, one for the background and pipes and one for the bird, which come back in different visual styles because neither subagent could see what the other was doing. His principle is to share full context, because "actions carry implicit decisions". My history worker made an implicit decision (store what was executed) that clashed with the format worker's decision (answer on the grid), leaving the model caught in the middle.</p>
<p>What sent me looking for research was a Google DeepMind essay, <a href='https://institute.deepmind.com/essays/the-economics-of-intelligence/'>The Economics of Intelligence</a>, published on 29 October. It argues that firms have always been limited by how well people coordinate, then says: "Importantly, none of the constraints that limit human coordination have to apply to AI agents. Today's AI systems coordinate poorly in practice." The potential is large, in the essay's words, because copies of an agent share their weights and can pass each other their complete working state, whole codebases and full context windows included. My week fits both halves, because my agents could have handed each other everything they knew, yet in both failures what crossed each handoff was a rewritten version, the stop in new words and the action in new units.</p>
<p>The words "poorly in practice" link to <a href='https://cooperbench.com/'>CooperBench</a> (<a href='https://arxiv.org/abs/2601.13295'>Khatua, Zhu and colleagues</a>, accepted at COLM 2026). It gives two coding agents two features in the same repository, features that can be built independently but can conflict if the agents don't coordinate. A task passes when both features pass their tests after the two changes are merged. The baseline is one agent that builds both features alone. Across the setups the authors tested, the pairs succeeded about 30% less often than the solo agent, which they call the curse of coordination. On the public leaderboard, GPT-5 in the OpenHands harness (the agent software that runs the model and its tools) solves 48.3% of the 652 tasks alone and 28.0% as a pair.</p>
<p>The leaderboard is the part that surprised me, because the models on it are GPT-5, Claude Sonnet 4.5, Gemini 3 and a few open models. I use GPT-6.1 Sol and Claude Opus 5.5 every day, so the number an essay from this week cites for agent coordination describes models that are about a year old. The project is still active, since the <a href='https://github.com/cooperbench/CooperBench'>code repository</a> added three-agent task subsets in September. The public scoreboard just hasn't caught up with today's models. I take that as a hint of how expensive this kind of measurement is to keep current.</p>
<div class='rc-mark' data-panel='papers' data-view='papers' data-title="Where a team's budget pays off"></div>
<h2 id='sec-papers'>What the newer papers measure</h2>
<p>Of the newer papers, the closest to my question is a preprint from this month, <a href='https://arxiv.org/abs/2610.17471'>Scaling Inference-Time Compute with Teams of Coding Agents</a> (Samway and colleagues), which treats team design as a budget problem. You start from one agent and ask where the next dollar of compute should go: a stronger lead, more workers, better worker models, or a different stage of the work. In their setup a lead agent can hand off planning, implementation or verification to its workers.</p>
<p>The main test is ProgramBench, where agents get only a black-box executable and its documentation and have to rebuild the program. Much of the work is finding out what the program does. On that benchmark, teams beat a solo agent but cost three to seven times as much and, in most configurations, took longer to finish. What a lead delegates turned out to matter a great deal. A lead that hands off only the planning, then writes and checks the code itself, matches a lead that delegates every stage, at half the cost.</p>
<p>Cheap models paid off as planners and hurt as implementers. A strong lead with cheap planners recovered 47.5% of the reward gain of an all-strong team for 13.9% of its extra cost, while cheap implementers lowered the reward. Their best mixed team, one strong lead with 16 cheap planning workers, came within 1.4 points of a strong five-agent team at 70% lower cost, in a single run. The answer depends on the task, though: on a small subset of Commit0, where the repository skeleton already lays out the plan, implementation was the best stage to delegate. That matches the benchmark bug, because a planner only brings back information, while two implementers working on one loop have to agree on every detail.</p>
<p><a href='https://arxiv.org/abs/2602.01011'>Multi-Agent Teams Hold Experts Back</a> (Pappu and colleagues, ICML 2026) looks at the case where agents decide together by talking. Four agents, one of them the expert, discuss a question for four rounds and then vote. On classic teamwork tasks from psychology, where one agent holds all the expertise, the teams fell short of their expert even when they were told who it was. On ML benchmarks the picture is mixed. A team told who the expert was beat the best single model on four of five tests, but every team fell short of always following whichever agent had the right answer, by as much as 41.1% when nobody named the expert. In the conversations, the authors found the team averaging the expert's view with everyone else's, an averaging that grew with team size.</p>
<p><a href='https://arxiv.org/abs/2605.07073'>TeamBench</a>, a preprint from May, splits each task between a planner, an executor and a verifier. It enforces the split with operating-system permissions so that no single role can read the whole spec, edit the code and sign off. Its verifiers approved 49% of the submissions that failed the real grader. Teams also helped when a single agent struggled with a task but hurt when a single agent already did it well.</p>
<div class='rc-mark' data-panel='matrix' data-view='matrix' data-title='Four shapes in the studies so far'></div>
<h2 id='sec-matrix'>Four shapes on one board</h2>
<p>Here's my attempt to put all of this in one table, where each shape gets the conditions under which it helped and hurt in the studies above. In TeamBench, one strong agent held up best on tasks that a single agent already handles well. Both of my own failures happened on tightly coupled work, though two anecdotes don't make a test. Parallel peers should win when the work really does split into independent pieces, but when the pieces can conflict you get the CooperBench drop. Peers that settle an answer by discussion pull the expert toward the average. A strong lead with cheap helpers did well on ProgramBench when the helpers gathered information and planned, though it did worse when they wrote the code.</p>
<p>The hierarchy of supervisors and crews is the shape I run, yet it has the least evidence behind it. In <a href='https://arxiv.org/abs/2603.26458'>one study</a> on SWE-bench Lite, a strong manager directing a weak worker scored 62%, next to 60% for the strong model alone. A weak manager over a weak worker scored 42%, below the 44% of the weak model alone. The authors' summary is that "structure without substance is pure overhead". <a href='https://arxiv.org/abs/2607.27877'>Another study</a>, MSEval, a preprint like the first, gave the same tasks and the same models to teams of different shapes. The shape alone moved scores by more than 30 points, and heavy managerial oversight made results worse.</p>
<div class='rc-mark' data-panel='open' data-view='open' data-title='The table nobody has filled in'></div>
<h2 id='sec-open'>Why nobody has answered it</h2>
<p>Each of these papers answers a slice of my question. Each one fixes a benchmark, a harness and a generation of models, whereas my real work changes all three. In one week my agents drove a robot arm, built and ran a VLM benchmark and worked on this blog. The models I used for the overnight build weren't even out when CooperBench was published. Even the harness around the model matters a lot: on SWE-bench Verified, the same GPT-4o snapshot resolves 23.2% of the issues inside SWE-agent and 38.8% inside Agentless.</p>
<p>I'm a little surprised that this question hasn't come up more. Every lab that sells coding agents must want to know whether a team of its models beats one of its models on the same budget and which model belongs in which seat. Maybe they run exactly these comparisons in-house and keep the results to themselves for now. From the outside, what I have is two anecdotes from my own week and a handful of papers that each fill in one corner of the table on the board.</p>
<p>In the meantime I've changed how I work, starting with the arm, which lives in one session that I talk to directly with nothing in between. After these two failures, tightly coupled work stays with one agent. Cheap helpers get bounded jobs such as searching, reading, or running a command and reporting back. I still run a supervisor for independent projects like this blog, where the pieces share very little.</p>
<p>So here's the question I'd love someone to answer: given a task and a budget, which team shape and which model in each seat give the most correct work per dollar and per hour of my attention, and can I tell before I start? If you've measured this on real multi-hour work, I'd really like to see it.</p>
<details>
<summary>Sources, exact counts and other coordination benchmarks</summary>
<p><strong>My two failures.</strong> The arm timeline comes from my agents' logs for 23 to 25 October 2026: the stop record at 22:14 on 23 October, its relayed lift at 14:25 the next day, the supervisor's report of the idle night, and the first ink and the cat in the new session's history on 25 October. The benchmark counts come from the episode decision logs. In the multi-step runs, the larger model had 59 of 192 decisions rejected (30.7%), 47 of them copies of <code>u</code> and <code>v</code> and the rest with an extra field; the smaller model had 53 of 192 rejected (27.6%), all copies; a third, cheap model had 13 of 192. The single-step pointing tests had no rejections for the two main models. On the board, the camera image is 960 by 400 pixels, so <code>u</code> = ⌊(700 × 959 + 500) / 1000⌋ = 671 and <code>v</code> = ⌊(300 × 399 + 500) / 1000⌋ = 120. In the episode shown, steps 2, 4, 5 and 8 were rejected.</p>
<p><strong>Papers cited above.</strong> <a href='https://arxiv.org/abs/2601.13295'>CooperBench</a>: over 600 tasks across 12 libraries in 4 languages; leaderboard scores read on 29 October 2026. <a href='https://arxiv.org/abs/2610.17471'>Teams of Coding Agents</a> (preprint): GPT-5.6 Sol, Terra and Luna at medium reasoning effort, in teams of one model and in Sol or Terra leads with Luna workers; GPT-5.6 results are means over three runs, and the fixed-size teams are single runs; the Commit0 result is from a 16-task subset in the appendix. <a href='https://arxiv.org/abs/2602.01011'>Teams Hold Experts Back</a>: teams of 4, 4 rounds of discussion, majority vote, 100 problems per ML benchmark; the 41.1% is on HLE (text-only), measured against the At Least One Correct bound with the expert not named. <a href='https://arxiv.org/abs/2605.07073'>TeamBench</a>: role separation enforced by the operating system; public results on a 90-task subset. <a href='https://arxiv.org/abs/2603.26458'>Can AI Models Direct Each Other?</a>: 200 SWE-bench Lite tasks. <a href='https://arxiv.org/abs/2607.27877'>MSEval</a>: 10 full-stack projects, 100 runs. The harness comparison is from the <a href='https://www.swebench.com/'>SWE-bench Verified leaderboard</a>, GPT-4o (2024-05-13) in SWE-agent and in Agentless-1.5.</p>
<p><strong>Other coordination benchmarks.</strong> <a href='https://aclanthology.org/2026.acl-long.1354/'>SILO-BENCH</a> (ACL 2026) gives each agent a fragment of the information on 30 algorithmic tasks; performance collapses as complexity grows, with zero success beyond 50 agents on its hardest level. <a href='https://arxiv.org/abs/2606.08340'>Alem</a> (preprint) runs teams in a survival world with exploration, crafting and trading, and finds that individual task ability does not imply coordination ability; agents average about 6% of the normalised return. <a href='https://arxiv.org/abs/2604.10938'>AgentWebBench</a> (ICML 2026) has a user agent query website-specific agents; coordination lags behind centralized retrieval, and the gap shrinks with model scale. <a href='https://arxiv.org/abs/2512.08296'>Towards a Science of Scaling Agent Systems</a> (Google Research, Google DeepMind and MIT, preprint) finds changes relative to a single agent from +80.8% on decomposable financial reasoning to −70.0% on sequential planning. <a href='https://arxiv.org/abs/2503.13657'>Why Do Multi-Agent LLM Systems Fail?</a> (2025) sorts 14 failure modes into system design, inter-agent misalignment and task verification. Anthropic's <a href='https://www.anthropic.com/engineering/built-multi-agent-research-system'>multi-agent research system</a> beat a single Claude Opus 4 agent by 90.2% on an internal research eval while using about 15 times the tokens of a chat, and the post notes that most coding tasks are less parallelizable than research. <a href='https://arxiv.org/abs/2610.36523'>HSC-Bench</a> (preprint) tests how one agent takes over another's work on 1,039 tasks, and finds that a structured handoff state helps every receiving model recover the relevant evidence.</p>
</details>
</div>
</div>
</div>
