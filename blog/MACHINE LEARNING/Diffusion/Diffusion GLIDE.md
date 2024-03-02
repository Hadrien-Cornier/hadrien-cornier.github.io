
Openai paper 2021 > DALL-E


GAN: Noise -> Image, 1-step

Diffusion :  Image <- Noise, N-steps


Obviously doing N-steps allows us to get better precision on the image at the end

Image -> Image + $\epsilon_1$ ->  Image + $\epsilon_2$ -> ... -> Pure noise

we train a network to go backwards step by step, predicting the noise knowing the step (we need to know the step because there is a rescaling at every step but this is not necessarily needed)

Then we can sample the pure noise and go backwards until we get an image. 
So we run multiple pass throughs for each image



*Guided Diffusion*


imagine we have a class label, we can add that as an input to the network at every step by embedding it


What about text ? 
We put the text through its own network and then mix it into the denoising model


Is this enough ? There is better, guided diffusion

Imagine we have a classifier like ImageNet classifier. 
We can go through the gradient of that 


CLIP model : Image + Text -> Do these fit together ?

Essentially we add a loss that depends on an external classifier
WE can also see this an an adversarial example but towards the correct class

There is also classifier free method, a technique for guiding  
We simply sample the true label sometimes and sometimes we just leave apart the label.
If we have unlabeled data we can bring it in in this way


given the image what is the less noisy version of the image + scale * (difference between the conditional predicted noise and the non conditional one)


$\hat{\epsilon_{\theta}}(x_t,y) = \epsilon_{\theta}(x_t,\emptyset)+ s*( \epsilon_{\theta}(x_t,y)-\epsilon_{\theta}(x_t,\emptyset))$ 


-> we mix the direction of the conditioned and non-conditioned model


the classifier must be trained on noisy images because otherwise the noised images would be OOD




Can we improve more ? 

Yes after the diffusion we upsample with a dedicated upsampling model

Noise -> Low-res image -> High-res image


We can do inpainting for free with diffusion models but we can also train it to inpaint