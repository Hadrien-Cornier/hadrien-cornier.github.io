---
title: 'Who captures the value in robotics?'
description: 'If a robot company can buy intelligence, what does it still need to own? A map of models, deployments, and customer outcomes.'
date: '2026-10-08'
slug: 'robot-brains-robot-bodies'
---

Suppose a robot company can buy a capable brain. It chooses a model, connects it to a robot, and sells the work that robot does.

Who captures the value? The company that trained the brain? The company that made the machine? Or the one responsible when the robot stops working halfway through a customer's shift?

I want to understand where a robotics company can build an advantage if intelligence becomes something it buys. This map puts that question on two axes. **Left to right: task-specific intelligence toward intelligence intended to work across tasks and robot bodies. Bottom to top: supplying intelligence toward owning field deployments and customer outcomes.**

```robotics-market
{"data":"/assets/robotics/brain-body/landscape.json"}
```

The horizontal axis covers intelligence a company **builds or deploys**. A packaging product can use a broad model while doing a bounded job. Color shows where that intelligence comes from; arrows show verified supplier relationships. The positions describe strategies, not capability scores. Each company entry separates ambition, evidence and commercial scope.

## Two routes to a reusable brain

[Physical Intelligence](https://www.pi.website/blog/partner) and [Skild](https://www.skild.ai/blogs/s1) start with a robotics problem: train intelligence that can carry skills between tasks and bodies. If that works, each robot maker could use a shared model instead of learning everything again for its own machine.

There is another route. Could a flagship model from OpenAI or Anthropic, already trained to understand images, language and problems, become a robot brain with an action interface and additional training?

[Anthropic's July experiments](https://www.anthropic.com/research/claude-plays-robotics) tested models on simulated and real robots. They did much better supervising pretrained controllers than driving joints directly. On the manipulation benchmark, adding a language-model supervisor still performed worse than the action policy alone. Its [Model Hardware Standard preview](https://www.anthropic.com/news/model-hardware-standard-research-preview) makes programmable equipment accessible to agents. That is an orchestration interface, rather than a universal learned action model.

[OpenAI's robotics team](https://openai.com/careers/software-engineer-distributed-data-systems-robotics-san-francisco/) states a general-purpose ambition across robot forms. That's work underway, rather than a released general control product. DeepMind supplies a more developed comparison: [Gemini Robotics 2](https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/) combines reasoning and action models, with reported transfer across embodiments. The routes are already starting to overlap.

The distinction matters. A model that decides to pick up a cup can delegate the movement. Producing that movement means dealing with contact, timing and a particular body. The question is how much robotics-specific training remains a lasting advantage as broader models improve.

## Dependence doesn't disappear at deployment

[Ultra uses Physical Intelligence's models](https://www.pi.website/blog/partner) in its packing, sorting and kitting product. That makes the dependency concrete: one company supplies learned capability; another turns it into work a customer can use.

Could the deployment company switch suppliers? It would need to compare models on actual work, adapt their camera and action interfaces, and preserve recovery and safety behavior. Buying a model doesn't make it interchangeable with another one.

An advantage could sit in making those swaps cheap. It could also sit in the opposite arrangement: tightly combining a model, hardware and data so the complete system improves faster. Vertical integration doesn't imply narrow intelligence. [Skild's acquisition of Zebra's Robotics Automation business](https://www.skild.ai/blogs/skild-zebra) also shows that an intelligence supplier can move toward deployment.

## Can the field make the company smarter?

[Field AI describes a concrete loop](https://www.fieldai.com/news/fieldai-and-nvidia-omniverse-building-the-next-generation-of-industrial-ai): robots running its Field Foundation Models collect sensor data during customer missions. That data becomes digital reconstructions of real sites, used with NVIDIA Isaac Sim and Isaac Lab for training and validation. Its [Big-D partnership](https://www.fieldai.com/news/bringing-general-purpose-robots-to-every-construction-site-inside-big-d-constructions-expansion-with-fieldai) reports expanding construction-site deployments. The clearest evidence is around navigation, inspection and site capture, rather than universal manipulation.

Does running robots in the field create an advantage that a model supplier cannot easily buy?

Consider a failure at one site. Someone records it, identifies the cause, improves the system, and tests whether the fix carries to the next site. Deployments could improve both the shared model and the machinery that adapts it to a customer.

```robotics-value-loop
```

The evidence for that flywheel would be fewer interventions, faster launches, and improvements that transfer between customers. Field AI's published pipeline doesn't establish exclusive ownership of customer data. Who can reuse the failure examples, including if the deployment company changes model suppliers?

## The customer may buy something else entirely

[Hadrian](https://www.hadrian.co/) operates factories with its own Opus automation platform. It sells precision parts, manufacturing capacity and operated factories. The customer can buy a production outcome without buying a robot brain.

[Standard Bots](https://standardbots.com/ai) designs and assembles its arms, including actuators, in Glen Cove, New York. Its offering combines vision, motion and agent software with deployment support. The cited material doesn't establish the underlying foundation-model supplier.

Reliable hardware, production capacity and responsibility for delivery can create value even when intelligence comes from elsewhere. For these businesses, the useful question is whether better models make their own product easier to deliver or make it easier for someone else to compete.

For each company, I want to ask the same thing: **what gets better as the model suppliers improve, and what can the company improve on its own?**

A universal brain could strengthen a deployment business by making new work cheaper to automate. It could also give the supplier more bargaining power. The next customer, the next failure, and the cost of changing models would tell us who captures the value.
