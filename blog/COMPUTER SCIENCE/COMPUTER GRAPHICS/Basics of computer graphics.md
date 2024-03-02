


Jonathan blow video on graphics 3h video binge

What is rendering ? 
rendering is the solution of the problem where you have a virtual world, an observer and a screen and you have to decide what colors to draw on the screen to reflect the world. 

The observer is determined by his distance to the screen (non zero for numerical reasons ,otherwise there would be a thales theorem division by zero) and also by the vector of the direction in which he is looking at

Why do we use triangles ? 
- It is less expensive than ray tracing because we only need to compute 3 points on the screen and then we can fill the interior with the triangle's color
- Because we are guaranteed that the 3 points are on the same plane 

How do we not draw what is behind something ? 
We do not render the triangles which are facing away from the observer
Each triangle has a normal vector of where it is facing

This technique obviously only works for "thick" objects. A piece of paper needs triangles on both size of itself for this to work


How do we represent an object that has $N$ vertices in its triangle approximation
We represent it as a Tensor of size $[N,3]$

But we also need colors, albedo (light property), reflectance etc... to add to the triangle


Questions I have : 
- How do we deal with the fact that pixels have a non zero size ? How do we resolve what to draw if two surfaces of different colors land on the same pixel ? 
- What are [[Shaders]] ? 
- What are [[Texture Maps]]  ? 
- What is [[UV mapping]] ? 
- What is [[Albedo]] ? 
- What light properties are attached to the rendering of a triangle model ? 
- What is [[Anti Aliasing]] ? 
- What is a [[Mesh File]] ?
- What is [[Rasterization]] ?
- What is a hit box ?
- What is a collision grid ? 
- What is a Z-Buffer ?
- Is there any Neural Network rendering engine ?



rendering a triangle is easy because we know the slope is constant when we render by scanning line by line and compute the extent of the line with the slopes and the starting point


GPU rendering : 

most of the data exists on the gpu and then we send over a small amount of parameters at each frame such as

- position
- lighting
- surfaces
- scale
- orientation
- object id
- shader


Problems : 

1- rasterize with line by line filling the triangle on the screen does not work
How do we make sure we overwrite background with foreground in the correct order ?

Basically how to we render a object by object and not have problems with correct foreground rendering ? What order to draw the objects in ? 


Sometimes we can have cycles where there is not even a defined foreground and background


Being correct in that cycle problem is slow because we would have to sort the triangle mesh by distance to the observer and that is not as fast as gpu full object rendering

SOLUTION: ZBUFFER
Z buffer sorts pixels by distance to the observer and does not render covered pixels


[[How translucency happens ?]]











