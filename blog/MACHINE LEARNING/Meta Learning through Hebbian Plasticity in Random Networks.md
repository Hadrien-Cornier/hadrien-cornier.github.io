


we have a quadruped and the goal is to make him walk as far as possible. 

Usually this is done by reinforcement learning

We have inputs= sensors and outputs= force from the actuators 

Reinforcement learning learns a policy directly 

At the beginning of each episode the policy is initialized randomly
During the episode, depending on the input the network is adapted

The algorithm can deal with "damage" on the limbs

Evolutionary methods
Hebbian Plasticity


Reinforcement learning is specific to a task but biological agents can learn very quickly

When an animal is born usually it can walk almost instantly even if one limb is damaged/deformed

Because it brain adapts very rapidly


Offline RL : Observation -> Policy Network -> Action
The policy network is frozen during the test

Hebbian plasticity learning is different. We play the game in episodes and at the beginning of the episode we reinitialize the network and then we learn from scratch again


So what is learned ? Not the weights but the rules that transform a randomly initialized network into a good network

What if we simply encode the winning solution in the update rules ?
=> Well this is not what is happening in real life


During the episode the network can continuously adapt itself to get a higher reward

Hebbian plasticity learning = Online RL ? 

Hebbian Rules : Biologically inspired rules
Policy network : It is a neural network

[A_wo_io_j + B o_i + Co_j + D ]eta_ij= delta w_ij

(correlation between the node values = delta Weights i,j )

It's like a Hopfield Network !
"Fire Together, Wire Together"
=> doing this makes us stronger at what we do, maybe it makes the transmission of information faster

A,B,C,D are learned throughout the episodes

What they do is essentially optimization of hyperparameters based on living multiple lives through multiple agents running concurrently

A,B,C,D are the genes !

the quadrupeds are sometimes disabled in one of the legs => this makes the policy learning more challenging 
A powerful RL approach can deal with this task of course 
But if instead of Hebbian we had to learn a single network it would not work as well because it would not be able to be good at more than 2 out of 3 configurations 

This whole thing happens because we do not TELL the network what environment it is in, of course if we did, as we do with categorical features, then it would be able to adapt, but because we do not tell, this is the perfect playground of life and of course the Algorithms that win have to be learned to fit the environment the best, just like our brains adapt to allow us to live 

So they picked an environment which is the smallest one which displays this behaviour

The Hebbian rules allow you to be competitive with the neural network, but still beaten, but they are much generalizable in more scenarios.

For some reason this was not symmetric and the Hebbian rules focus more on some scenarios. 


Classic RL : 

w -> R -> Delta w -> Delta w R 
We take a gradient with respect to the weights
















