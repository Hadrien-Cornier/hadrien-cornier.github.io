
All RL is about only three types of problems : 

- Generalization : You never see the SAME image twice and yet you can know how to answer
- Credit Assignment : You want to to know which actions are responsible for the reward
- Exploration : You want to maximize the amount of information that you learn about the world in order to help you solve the other problems



There are currently ways to solve 2 of these at a time. 

Contextual Bandits solves generalization and Exploration

Policy Learning Q-learning solves generalization and credit assignment (the value function)

MDP learning (??) solves Generaliaztion and Credit Assignment (what could this be ? )

___ 


Can we solve all 3 at the same time ? 

Need a good policy to collect good data
Need a good data to get a good policy


Can we solve all three aspects together ? 

We need to be clear on what are the shortcomings of the 3 main solutions. 
In other words, why do they not solve the opposite vertex of the triangle ? 


Can we use priors ? Yes. 
Structural priors. It's natural to create them. We can easily create some for the kind of problems which is tractable to solve

___ 

What does good data mean ? 

Good data is the data necessary to solve a problem. 
This is a problem-dependent question
The art of ml is the skillful application of theory to reality

Brittleness is about having the wrong bias but also about whether we have enough data to be able to solve the problem 


Does a similar chicken and egg problem happen in other settings ? 

Yes. Often we can unwind things step by step.

Some things that do not work in general. 



Approaches that will NOT solve RL : 


## Bottleneck Autoencoder

The failure mode is latent collapse. Trivial solutions. Uniform Noise. Infinite Temoerature.

n-bits -> 1-bit -> n-bits

you can reduce your entropy by outputting noise instead of the true answer.

This is the problem for learning. 


## Other technique : trying to predict the previous action from the previous and the current observation

Predict previous action through bottleneck

superposition of states

