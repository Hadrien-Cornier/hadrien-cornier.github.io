

Quantization = reducing the number of bits

Binary quantization is just an extreme form of quantization

The intuition from signal procressing is that we are going to do approximate our curve with a step function (this is how audio is encoded !)

Floating point representation : 32bits 1 bit=sign 8bits for the exponent and 23 bits of the mantissa 


Floating point 16 is 5 and 10 instead of 8 and 23


Float 16 : loses 3 bits of exponent and 13 bits of mantissa

Int 32 : 1 bit for sign and 31bit number (which is kind of like a mantissa conceptually)

COPY THIS TABLE

FP16 accuracy : 0.5%
Accuracy. : 1/2



Floating point numbers are not normally distributed
A lot of numbers get mapped to the same value
This is why saving 0.00000001 sometimes store 0.000000014

Positive/Negative overflows with integer representations



Cost of operating in difgferemnt formats :


COPY THIS TABLE



8 bit add is the cheapest the most expensive is 32b DRAM Read. S


F16 Mult costs 20 times as much as 16b Add !

BEnefits : memory usage goes down 4x 32bit->8bit
Power consumption : 
Add : 30X energy reduction
Mult : 18.5 energy reduction
Mem access : 4x energy reduction

**On silicon** : 
Add area : 100x smaller
Mult area : 30x smaller



How do we backprop ? 

WE do a straight-through estimator
Setting all the incoming gradients equal to the outgoing gradients
Easy to implement with a hyperbolic tangent function
Hard sigmoid : randge 0,1
H tan h : range -1,+1

Full precision copies of weights are maintained throughput the training process 
Accumulates small changes in gradient 


Main problem : Gradient descent doesn’twork with binary values, the binarized weights cannot be updated during the gradient descent, only the continuous ones



Weights -> clip -> sign -> W
Weights <- STE <- W 


the real weights are constrained to reduce their mismatch to the binary weights

the clipped STE cancels the gradient step on the activation when the activation becomes too large

Implementing the sign layer is the only change required to binarize a neural network. 

Core concepts : 

SIgn : foward , non differentiable
Approximate sign : backward : Slope of 1 between -1,-1, and 1,1 and then capped at -1 and 1
Derivative of approximate sign = step function 1 on the interval -1,1
Forward pass of the weights 
W -> Sign -> Bw
Bw -> STE -> W


This is called quantization aware training because the loss takes into account the departure from the binarized representation

Takes longer to converge during training but during the inference faster than CUDA

Performance used to be terrible but coming close to the SOTA recently

Wide reduced precision network

