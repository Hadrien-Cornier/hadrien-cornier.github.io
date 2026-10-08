---
title: "A few predictions about robotics"
description: "If intelligence keeps getting cheaper, the robotics industry may start to look more like a combination of AI infrastructure, industrial services, and manufacturing."
date: '2026-10-08'
slug: 'robot-brains-robot-bodies'
layout: essay
---

I find it useful to think about robotics through what is happening with language models. A capability that once required a research team can become something another company buys, adapts, and builds a business around. As that capability becomes easier to obtain, the advantage moves toward whatever remains difficult.

Something similar could happen with robots. But the analogy only goes so far. Software can be copied almost instantly. A robot needs a body, a place to work, and someone to repair it.

These differences lead me to a few predictions about how the industry might develop.

## Routine work will use cheaper models

My first prediction is that routine physical work will increasingly run on inexpensive models, including open models. Frontier intelligence will command a premium where it meaningfully changes the outcome.

The language-model market gives us a reason to consider this scenario. [Stanford’s 2025 AI Index](https://hai.stanford.edu/ai-index/2025-ai-index-report) documented a large decline in the price of reaching a fixed level of benchmark performance. That does not establish that open models caused the decline, or that everyone chooses the cheapest model. It does suggest that yesterday’s expensive capability can become widely accessible.

Robotics already has part of this foundation. [OpenVLA](https://openvla.github.io/) built robot-action prediction on a pretrained vision-language model and released its weights and training code. [Physical Intelligence’s π0.5 research](https://www.pi.website/blog/pi05) showed how web knowledge and experience from different robots could contribute to handling unfamiliar homes.

I expect these routes to converge further. General models can contribute understanding and planning; robotics training provides the connection to action. Choosing the right object and manipulating it safely remain different problems. Dexterity also depends on the hand, sensors, contact, and control.

If several models can perform a particular job reliably, competition should put pressure on what they can charge for that job. An open model could trail the frontier by a few months and still be economically equivalent for a job whose requirements both models exceed. The premium remains where a better model handles valuable exceptions, reduces supervision, or makes previously impossible work practical.

I would change this prediction if frontier models kept a large advantage in total operating cost even on familiar, repetitive tasks.

## Reliability will decide the economics

There is a limit to how much faster thinking alone can make a physical task.

Imagine a robot spends 90 seconds moving and 10 seconds deciding what to do. If decision time falls to zero while everything else stays fixed, the cycle falls from 100 seconds to 90. Throughput improves by about 11%.

Better intelligence can also choose shorter movements, avoid mistakes, or reorganize the work. Those benefits could be much larger. But once a particular task is being done well, another improvement in general reasoning may have little effect on its economics.

Reliability is different. Moving from 99% success to 99.9% cuts the failure rate tenfold. Across 1,000 comparable attempts, that means an expected ten failures becoming one. Whether this matters depends on what a failure costs: a retry, a technician visit, damaged inventory, or an unsafe event.

<figure class="rf-figure" aria-labelledby="rf-arithmetic-title">
  <p class="rf-kicker">Illustrative assumptions</p>
  <p class="rf-title" id="rf-arithmetic-title">Cycle time and reliability</p>
  <div class="rf-arithmetic">
    <div class="rf-card">
      <strong class="rf-stage-name">Less decision time</strong>
      <div class="rf-cycle">
        <span class="rf-cycle-total">100-second cycle</span>
        <div class="rf-cycle-bar" aria-hidden="true"><span class="rf-motion"></span><span class="rf-decision"></span></div>
        <span class="rf-stage-work">90 s motion + 10 s decision</span>
      </div>
      <div class="rf-cycle">
        <span class="rf-cycle-total">90-second cycle</span>
        <div class="rf-cycle-bar rf-cycle-faster" aria-hidden="true"><span class="rf-motion"></span></div>
        <span class="rf-stage-work">90 s motion + 0 s decision</span>
      </div>
      <strong class="rf-result">About 11% more throughput</strong>
      <span class="rf-stage-work">Motion time stays fixed.</span>
    </div>
    <div class="rf-card rf-card-reliability">
      <strong class="rf-stage-name">Higher task reliability</strong>
      <div class="rf-failure-case">
        <span class="rf-cycle-total">99% success</span>
        <strong class="rf-failure-count">10 <span>expected failures</span></strong>
      </div>
      <div class="rf-failure-case">
        <span class="rf-cycle-total">99.9% success</span>
        <strong class="rf-failure-count">1 <span>expected failure</span></strong>
      </div>
      <strong class="rf-result">10× lower failure rate</strong>
      <span class="rf-stage-work">In 1,000 comparable attempts.</span>
    </div>
  </div>
  <figcaption>Separate illustrations, not measured results or forecasts. Each changes one factor.</figcaption>
</figure>

My prediction is that buyers will increasingly evaluate robots by the cost of a verified successful task. That includes maintenance, supervision, downtime, and recovery. A cheap model that needs frequent help can be more expensive than a frontier model.

This also changes what progress looks like. A less impressive-looking robot that works through a full shift may create more value than one with a broader repertoire that needs constant attention.

The important test is whether extra model capability keeps lowering the full cost of familiar tasks. If it does, paying for the frontier can remain rational long after the basic task looks solved.

## A neocloud model for robots

Another possibility is that large robotics businesses emerge around owning and operating fleets.

Neoclouds provide a useful comparison. They acquire GPU infrastructure, make it usable, and sell access to capacity. Their business depends on financing, utilization, reliability, and customer demand. [CoreWeave’s infrastructure-backed financing](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Closes-Landmark-8-5-Billion-Financing-Facility-Achieving-First-Investment-Grade-Rated-GPU-backed-Financing/default.aspx) shows how closely this model connects technology to capital.

A robotics operator could buy machines, license models, deploy them at customer sites, and charge for useful work. Customers would avoid managing equipment and coordinating several suppliers. The operator would take responsibility for keeping the service running.

Part of this business could resemble real estate: commit capital up front, secure demand, keep assets productive, and earn a return over time. Robots would add substantial maintenance and obsolescence risk.

There are also important differences from GPU rentals. A robot in one warehouse cannot instantly serve another customer across the country. Machines have different bodies and capabilities. Customer sites need integration. Safety and physical wear affect what can be promised.

<figure class="rf-figure" aria-labelledby="rf-operator-title">
  <p class="rf-kicker">The operator analogy</p>
  <p class="rf-title" id="rf-operator-title">From assets to a customer outcome</p>
  <div class="rf-flows">
    <ol class="rf-flow" aria-label="GPU cloud business">
      <li><strong class="rf-flow-name">GPU suppliers</strong></li>
      <li><strong class="rf-flow-name">Cloud operator</strong></li>
      <li><strong class="rf-flow-name">Compute capacity</strong></li>
    </ol>
    <ol class="rf-flow rf-flow-robots" aria-label="Robot fleet business">
      <li><strong class="rf-flow-name">Robot and model suppliers</strong></li>
      <li>
        <strong class="rf-flow-name">Fleet operator</strong>
        <ul class="rf-responsibilities">
          <li>Financing</li>
          <li>Integration</li>
          <li>Maintenance</li>
          <li>Service guarantees</li>
        </ul>
      </li>
      <li><strong class="rf-flow-name">Completed physical work</strong></li>
    </ol>
  </div>
  <figcaption>Both operators carry capital costs and need useful utilization. GPU clouds also need servers, power and cooling.</figcaption>
</figure>

I therefore expect successful operators to develop operational expertise alongside financing. They may coordinate different robot brands, choose models for each job, manage spare parts and human assistance, and guarantee a level of service. Open platforms and common interfaces could make mixing suppliers easier; each combination would still need task-specific validation and safety checks.

The test is whether each new deployment becomes cheaper and easier. If every customer requires a new engineering project, the operator may struggle to scale. If manufacturers offer equally good service more cheaply, independent operators may have little room.

## The bottleneck will keep moving

If models become accessible, a large fleet’s data may seem like the obvious remaining advantage. I am less certain that raw data volume will be enough.

Simulation offers another way to acquire experience. Research such as [DeXtreme](https://arxiv.org/abs/2210.13702) has demonstrated transfer from simulated training to real dexterous manipulation on a bounded task. If that transfer becomes broader and more reliable, competitors may reproduce useful training experience without owning an equally large fleet.

Field experience could still matter enormously. Someone has to find what the simulation misses: worn components, unexpected contact, unusual objects, and failures that only appear after prolonged use. I expect the advantage to shift toward identifying those gaps, calibrating the system, and verifying that a fix works elsewhere.

A fleet becomes more valuable when its experience makes the next deployment more reliable. A growing archive of recordings is weaker evidence.

Hardware may follow a similar pattern. If AI makes mechanical design faster, more companies could produce plausible robot designs. Manufacturing them consistently, validating their lifetime, and servicing them would still take resources and time.

This is why I am cautious about jumping from “robots can build robots” to nearly free hardware. Automated assembly would help, but it would still depend on chips, motors, energy, tooling, and upstream factories. [The IEA’s work on critical minerals](https://www.iea.org/reports/global-critical-minerals-outlook-2026/market-overview) shows how concentrated some of these supply chains remain. Better designs can substitute materials or reduce demand, but expanding industrial capacity is a separate challenge.

There is also an optimistic version: if robots help expand mining, energy, component production, and factories as well as final assembly, productive capacity could compound. Those constraints could ease, and the returns to owning scarce capacity could fall.

My prediction is that advances in intelligence will make these physical constraints more visible. Sustained declines in production lead times and field failure rates, while robot output grows rapidly, would make me more optimistic about hardware becoming widely interchangeable.

## What remains scarce?

These scenarios can coexist. Cheap models could handle routine work while frontier models earn a premium on difficult jobs. Operators could build useful businesses around fleets while manufacturers retain advantages in production and service. Simulation could reduce the value of ordinary training data while making carefully diagnosed failures more important.

Even nearly free hardware would not automatically mean model companies capture all the value. If adequate intelligence also becomes cheap, much of the benefit could reach customers through lower prices.

The question I would keep asking is: what becomes abundant next, and which of today’s moats disappear when it does?
