https://arxiv.org/abs/2206.14486



Current models scale their performance at an power law rate with respect to the training data,
but the catch is that the exponent is super small 

For instance in the case of image classification on ImageNet $$CCELoss= P^{-\nu}, \nu=0.095 \implies 10 \times P \equiv CCELoss - 0.6 nat$$
So one order of magnitude more $ = tiny bit better model.

So scaling is terrible.

What is a **nat** ? It is the unit of the categorical cross entropy, it corresponds to an average surprise of the model over the training data. 

CCE would be 0 nat on average if there was no stochasticity in the data and we could learn to predict it with 0 errors (think of symbolic regression)

In reality of course it is only possible to drive down CCE to the inherent nat due to randomness of speech (conditioning on communication intent, all speech is a distribution over vocabulary which incorporates some randomness in the sampling process)


This paper proposes a way to filter the training data such that convergence happens much faster and cheaper.


The paper has a theoretical explanation and it underpins 2 predictions that they make : 

- In Low data setting, the optimal sampling policy is to discard the hard examples (This is why we don't teach calculus in elementary school).
- In High data settings, the optimal sampling is actually to keep only the high difficulty data (which is the data that is exceptional and must be memorized by the model because it does not flow from the other already present data, so essentially high difficulty =  is an outlier). This makes sense. This is why we don't teach the alphabet in college, because the model already knows it and it would be a waste of time to teach it again.



> Classical results (**[Statistical mechanics of learning from examples](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.45.6056)**) have shown that training examples chosen by maximizing the disagreement of a committee of student perceptrons can provide an asymptotically finite information rate, leading to exponential decay in test error


information gain is the derivative of the entropy

$$I(\alpha_{tot})=-\frac{d}{d\alpha_{tot}}S(\alpha_{tot})$$



The posterior entropy represents the uncertainty of the model after being trained on a dataset of size $\alpha_{tot}$ 

The Cross entropy takes 2 distributions : 

$$CCELoss = -\Sigma_{i=1}^{\alpha_{tot}} p_i \log(q_i)$$
Where 
- $q_i$ is the predicted value by the model
- $p_i$ is the actual value 




What this paper does is: 

1- Train a selector model that will be naive and small and we will use its uncertainty (margin) to select the samples for the big model
2- Run this selection filter on the training data and then train the bigger model with it (for us this would be the main teacher model)



