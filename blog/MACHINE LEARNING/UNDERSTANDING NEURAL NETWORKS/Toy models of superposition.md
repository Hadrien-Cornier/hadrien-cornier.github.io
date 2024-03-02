



> - Statistical Efficiency. Representing features as different directions may allow non-local generalization in models with linear transformations (such as the weights of neural nets), increasing their statistical efficiency relative to models which can only locally generalize. This view is especially advocated in some of Bengio's writing. A more accessible argument can be found in [this blog post](https://colah.github.io/posts/2014-07-NLP-RNNs-Representations/#word-embeddings).

___


the neural networks we observe in practice are in some sense noisily simulating larger, highly sparse networks


essentially if we had an infinite neural network each neuron would fire only for a single "feature" ie "bird, plane, grandma" etc...

but because we have limited space the same neuron has to be part of multiple features
this is called **feature superposition**

related to [[compressed sensing]] and [[distributed, dense and population codes in neuroscience]]



superposition might be related to [[grokking]] (when a network that was overfitting snaps into generalization after training a long time)

Why do some neurons correspond to an easily identifiable feature and other not ? 
- superposition when the model is not big enough
- privileged basis : this is the opposite of superposition, it means that the design of the network is such that features correspond to directions in the activation space (ie : bird = a unique linear combination of the hidden layer neurons)





Features as direction means that linear representations are privileged.

- statistical efficiency : essentially the same argument as symbolic learning. It is less noisy to extrapolate and generalize non locally
- if a feature activates a specific linear combination of activations, a neuron in the layer above can be made such that it fires most when the pattern is activated. Essentially given a neuron and the incoming weights there is a linear direction of the previous layer of maximal activation, thet call this **linearly accessible**. It means it can be accessed by a linear combination of the previous layer's activations



Superposition allows a hidden layer of dimension N to store more than N different "directions" or features. 


# Privileged vs Non-privileged Bases


