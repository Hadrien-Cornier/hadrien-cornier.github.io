


The problem we are tackling is the making of a hardware solution to compare two 8 bit integers and be able to output 1 if the first one is strictly less than the second or else 0


What I mean is the assembly of a chip, in terms of logic gates to tackle the problem instead of an assembly programming way of doing it, where we could define loops of subtractions until one of them becomes 0. 

Essentially We now have a conditional which is the compare operation performed by the OVERTURE computer (for instance the assembly instruction IF_R3_l_0)

And the comparison of A and B integers is also a conditional, and so this means the problem could easily be solved in the world of programming. 

In the world of hardware it seems to me that the design of the hardware based comparison with signed arithmetic is easier (I am talking about the binary format with the leading bit meaning -128, instead of 128, which casts the array into $$Unsigned [0,255] \to Signed 
[-128,127]$$


So I think signed is easier because we have a trivial way of knowing if a number is negative : just look at the leading bit

The unsigned does not have this property 


I think because of the design of the progress map, I am supposed to use the equality gate to bring the 8bit problem down into the 1bit space

But can I do this using only equalities and basic operations ? 

Maybe I should draw the truth table ? 


# Signed Integer Comparison Hardware Gate 

	 Commentary :
	We are partitioning the space to solve this problem, 
	which is the same thing that discrete probability distributions do. 
	Partitioning the space is a powerful problem solving technique

A , B , IS A<B ? 

IF (A<0) AND (B>0) : TRUE
IF (A>0) AND (B<0) : FALSE
IF A=B                        : FALSE

IF (A>0) AND (B>0) : { IF A-B<0 : }
IF (A<0) AND (B<0) :


___

IF (A>0) AND (B>0) :   Solve $A<B$ ?   

$01000000 = A = 64$
$00100000 = B = 32$  
$10111111 = NOT(A)$
$11011111= NOT(B)$

___


You have two ways to get to a number : from below and from above


From below : 

64 = 31+33 = 30 + 34 = 29 + 35 ...
or 
From above : 
64 = 127-63 = 126-64 = 125-65




**The core of the problem is how to deal with the overflow in the subtraction operation**

We can either : 
1. Detect the overflow and correct the answer when the detection triggers
2. Modify the inputs in such a way that overflow is impossible and then we don't need to check

# **The core of the problem is how to deal with the overflow in the subtraction operation** 


![[Screenshot 2024-02-03 at 11.02.08 AM.png]]



Actually we did not need to detect the overflow, because the mitigation techniques can be made condition on auxillkiuary booleans that predict the same thing as the overflow




# In the unsigned case I think the core of the problem is how can we we use the overflow of the ADD operation as a negative ? 



