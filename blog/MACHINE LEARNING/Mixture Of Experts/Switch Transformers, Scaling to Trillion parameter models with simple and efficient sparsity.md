


The switch transformer only routes the information to one expert at a time


They have a way to scale the model without scaling the required flops at every forward pass

The Switch models require more storage for our wrights but this memory can be distributed, can be sharded. They use the mesh transformer transformer library which allows for efficient sharding. WHat we gain is training speed in terms of time and number of steps


We take the input output sequence 




MHA -> FFL : We pass each element in the sequence through the same layer

In step 1 : every neuron is connected to every other
In step 2 : Neurons are connected one by one 


The transformer alternates both of these steps

The switch switches the feedforward layer 

The router is like an attention mechanism where the queries are learned and the keys and values are from the previous layer

THis is why the feed forward part of the transformer is the part that holds the memories !
The memory is the learned weights of the router, the query Q of a pseudo attention where the queries are learned 

The softmax normalisation allows for more sparsity of the inputs

Sparsity is good for model quality and also for computation speed improvement 

We can efficiently shard the workers on many many machines. 
Obviously exporting a model Mixture of Experts is probably a lot of data



TODO : Look at the sizes in Gb of the weights of all the open source LLMs. 
Are Mixture of experts models more difficult to put on embedded systems ? DOes it have more weight ?


# The 4 types of parralelism

Data parallelism 
Sharded : We copy the model N times, pass each batch of the data through a copy of the model that processes the batch 


Data parallelism : every core has only one bit of the data
In model parallelism : every code has only a piece of the model but all of the data
model parallelism : when the model doesn’t fit on one machine
Modeo parallelism really screws us because of the overhead of the communication time between parts of the model which slows down training

Model and data parallelism : 

This is what the paper does :
**Expert and data parallelism** :each shard of data is routed to only one expert which lives on one core

We can even shard the expert and do model parallelism But that would be slow


To do the trillion parameter model

