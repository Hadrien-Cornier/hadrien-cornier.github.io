
Alternative to probabilistic modeling to predict but weaker 

More general framework for representing uyndercertaint



if y is a good continuation of x, the energy of x,y should be lower than if it is less likely


Energy is a weaker form of distribution that does not need to be normalized.
It is just a contrast function


We can turn energy based model into probabilitstic models in some cases


Energy based modeling : 

Just train the energy functiuon



# Latent variable EBM : 
#latent

Captures the information in y that is not present in x
computed by minimizing : 

$$\hat{z}=argmin_{z\in Z}E_w(x,y,z)$$


and then $$F_w(x,y) = E_w(x,y,\hat{z})$$

So this is like some sort of projection


# How to train EBM ? 


We need a way to make sure the energy is lower for data samples than from not datasample

*1st step : Contrastive Method :* Popular but "bad" - YLC
GANs 
Denoising autoencoders 
Siamese nets

regularized method : 
limits the volume of stuff that can have low-energy



# EBM Architectures

## Some architectures can lead to a collapse of the energy surface

### a) Prediction / regression - NO COLLAPSE
- Encoder: $s_x=Enc(x)$
- Prediction: $\hat{y}=Pred(s_x)$
- Discrepancy: $D(y, \hat{y})$
- Equation: $s_x \rightarrow Pred(s_x) \rightarrow \hat{y} \rightarrow D(y, \hat{y})$

With  $$G(x,y)=D(y,Enc(x))$$

$$\forall x \in X,\exists! y_x \in Y, y_x=argmin_{y\in Y}(G(x,y))$$

And because of this unicity, there can be no collapse; 

***==Collapse==*** essentially means : $$\exists y_1,y_2 \in Y, y_1 \neq y_2,G(x,y_1)=G(x,y_2)=min_{y \in Y}(G(x,y))$$

Or in other words I cannot tell what the original $x$ data point was if I observe the $y$ of lowest energy in the output

Which means at least one non observed sample is considered equal in likelihood to one observed sample which is a contradiction

So collapse is the opposite of interpolation

Another way to look at collapse is that y_1 and y_2 are not equal which means that they represent for us two distinct states of the world.

And if my world model can take an input action and world and there are two lowest energy states the world can move to, I cannot choose between them and I have to encode both different logical entities into the same spot, which means I have collapsed one unit of meaning

### b) Generative latent-variable Architecture - CAN COLLAPSE
- Encoder: $s_x=Enc(x)$
- Latent variable: $z$
- Prediction: $Pred(s_x, z)$
- Discrepancy: $D(y, \hat{y})$
- Equation: $s_x \rightarrow Pred(s_x, z) \rightarrow \hat{y} \rightarrow D(y, \hat{y})$

This can collapse because for every $x$, I can potentially come up with multiple $y_i$ of lowest energy by tweaking $z$ the latent variable
### c) Auto-Encoder - CAN COLLAPSE
- Encoder: $s_y=Enc(y)$
- Decoder: $Dec(s_y)$
- Discrepancy: $D(y, \hat{y})$
- Equation: $s_y \rightarrow Dec(s_y) \rightarrow \hat{y} \rightarrow D(y, \hat{y})$

### d) Joint Embedding Architecture - CAN COLLAPSE
- Encoder: $s_x=Enc(x)$and $s_y=Enc(y)$
- Discrepancy: $D(s_y, \hat{s_y})$
- Equation: $s_x \rightarrow s_y \rightarrow D(s_y, \hat{s_y})$
