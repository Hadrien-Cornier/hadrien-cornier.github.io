---
title: 'Robot brains, robot bodies'
description: 'A map of robotics companies, and a question: when brains become reusable, who makes the robot useful?'
date: '2026-10-08'
slug: 'robot-brains-robot-bodies'
---

Suppose a warehouse wants a robot to pack boxes. One company offers a complete machine. Another makes a model that can control several kinds of robot. A third puts the hardware and software together and gets it working on the floor.

Who is solving the hard part? And if the model improves next month, who gets the benefit?

I want to separate two questions that often get mixed together. **How many different things can the brain learn to do? How many different things can the body physically do?** They make a useful map, provided we keep track of what companies have actually shown.

Read left to right as task and model breadth: from a focused workflow toward skills that transfer across tasks, objects and environments. Read bottom to top as mechanical versatility: from a bounded machine or workcell toward a mobile robot that can reach and manipulate in more places. A model that works on several robot types has another kind of breadth, **cross-body transfer**, which is shown separately.

```robotics-market
{"data":"/assets/robotics/brain-body/companies.json"}
```

This is a selection from my robotics reading and conversations, not a complete market census. These are evidence-informed approximations, not scores. The company details give the public evidence and its limits. A model supplier has no single deployed body, so it sits in a separate rail. Infrastructure and uncertain identities stay in the directory rather than getting a misleading position.

## A versatile body can have a focused job

[Agility's Digit](https://www.agilityrobotics.com/solutions) has legs and arms, but its commercial work centers on moving totes. Agility reports [more than 100,000 tote moves](https://www.agilityrobotics.com/content/digit-moves-over-100k-totes). That makes it a useful example of a mechanically versatile body doing a bounded job. The shape of the robot doesn't establish the breadth of its intelligence.

[Ultra's OP1](https://www.ultra.tech/) shows the other distinction. It's a stationary machine aimed at packing, sorting and kitting, using [Physical Intelligence's models](https://www.pi.website/blog/partner). A broad pretrained model can become part of a focused product. Casters that let someone reposition a machine don't make it an autonomously mobile robot.

Figure and 1X build both humanoids and their intelligence. Their direction is broad, but the evidence still needs a task attached. Figure's [Helix 2.5 study](https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization) reports 56% aggregate success across three behaviors in 30 unseen homes, with task-specific training. [1X's world-model work](https://www.1x.tech/discover/world-model-self-learning) studies short-horizon learning on NEO. Neither result establishes a robot that can reliably handle every household chore.

So the upper right of the map needs two labels: the direction a company is taking, and the range it has demonstrated.

## Building both doesn't mean building a narrow brain

Vertical integration answers **who owns the pieces**, not how general the model is. A company can build a body, collect its own data and train a model intended to learn many tasks. Figure, 1X and [Sunday](https://www.sunday.ai/) take different versions of that route. Sunday's wheeled Memo and [laundry work](https://www.sunday.ai/blog/act-2-preview) also make the point that a robot doesn't need legs to pursue useful work around a home.

[Dexterity](https://dexterity.ai/platform) combines intelligence, hardware and deployment around industrial manipulation. Its [Foresight direction](https://dexterity.ai/blog/foresight) is broader than its demonstrated logistics footprint. [Reflex](https://www.reflexrobotics.com/) combines a mobile manipulator with its own intelligence and a real-time human reliability layer. For a customer, that layer is part of how the job gets done. It also means delivered work and fully autonomous work are different measurements.

The question I want to ask these companies is concrete: when they add a task, which parts carry over? The model? The data collection? The hand? Or mostly the team that knows how to get a deployment working?

## Reusable brains move the integration work

Physical Intelligence's [partner program](https://www.pi.website/blog/partner) puts its models into products made by companies such as Ultra and Weave. [Skild's S1](https://www.skild.ai/blogs/s1) pursues transfer across bodies, and Skild also [acquired Zebra's Robotics Automation business](https://www.skild.ai/blogs/skild-zebra). Even a company associated with reusable intelligence can move deeper into deployment.

Reusable brains don't remove integration; they move it. Someone still has to choose the grippers, connect the workflow, handle failures and maintain the machine. A customer needs the box packed, including the awkward box that arrived after the demo.

Could a deployment company become independent of any one model supplier? Suppose it can compare models on the customer's actual work, replace one when another performs better, and keep the rest of the operation running. That's a possible role. Ultra's PI partnership alone doesn't prove it has that independence.

The practical test would be how much work a swap requires. Do the cameras and action commands line up? Does the replacement need new demonstrations? Do failure recovery and safety checks still work? A model that transfers between bodies isn't automatically interchangeable with another model.

## What gets easier at the next customer?

That is the moat question I want this map to help answer. A better model can make each robot more capable. A deployment team can learn how to install, operate and recover it. Both improvements matter; the evidence is in what happens on the next site.

Does deployment get cheaper because the intelligence transfers? Because the workflow is now understood? Or because people intervene less often? Who owns the failure data, and can it improve the next customer's robot?

Then there is the business question: if model suppliers make intelligence easier to buy, do integrators keep the customer relationship and margins? Or does the model become so useful that deployment companies are easy to replace?

I don't have an answer from a quadrant. I have a better set of questions: what transfers, what still needs a person, and who makes the next installation easier to launch and run?
