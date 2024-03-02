

This is from https://youtu.be/MnctEW1oL-E?si=9k4sy-L4bbbiIhA7


C++ has typedef allowing custom types.
This means the parser (first step of compiling) has to make sure the identifier it just read has not been mapped to a custom type in the preceding code. 

So it makes parsing slower and more sequential. 

Having fixed types makes compiler writing easier.