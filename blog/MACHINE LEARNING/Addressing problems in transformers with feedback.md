


We are looking at problems where we see a history and predict the next step


Example : GPT

Recurrent neural networks : All models build representations of this input data and build latent representations 

The inputs are fed into a network that creates a hidden representation (the embedding) 


Layers stacked upon layers of Recurrent neural networks

you cannot solve the world linearily 
You cannot solve XOR or simple IF conditions 

You must have nonlinearities to attain universal approximations


The transformer + MLP is a powerful class of learners which is the most powerful ever discovered

1 step of reasoning is 1 layer of nonlinearity





Decoder only transformer : 

Usually what people do is causal masking, everytime we want to predict the same thing.
Essentially a chain of $x_{t+1}=f(x_1,x_2,…, x_t)$

The causal masking simply prunes the transformer in a temporal shape to learn temporal progression. 

It sees the temporal progression with the position embedding.



SOme transformers have only forward connections and no lateral connections which is obviously less expressive. 


Essentially someone was like : MLP, you are weak, I will increase the ways I can customize you by adding a dynamic connection pattern. And then someone saw that and was like : Rookie mistake, you have to look at your predecessor neuron in the layer (directional or bidirectional neuron connections)


Now what is the next step : COnnect every node to every other at every layer and between layers

Kind of like a massive graph that represents a brain

Now this paper thinks about doing skip connections in between the stacks of attention layers

We have to be smart about this because otherwise we would have too many connections to compute

They inject memory units which will store a value at the lower layers and make it available to all subsequent levels



Switch transformer is a transformer that forward propagates token by token and builds a memory and the following layer has access to that memory 

The memory is just an average of the inputs



In a transformer the reasoning steps were per sequence 

In the feedback transformer every token is a reasoning step, which is more powerful obviously


In a regular transformer the top layer has to query neuron by neuron in the lower layer
They add a memory unit which for instance could be the average of all the outputs of a layer and then the following layer can attend to that memory to be able to see all the previous sequence with a single connection instead of being connected to every input neuron

The feedback transformer is just a stacking of the transformer over the time dimension

Every Timestep saves its state in an average variable

The following steps read the previous memory on top of their input









