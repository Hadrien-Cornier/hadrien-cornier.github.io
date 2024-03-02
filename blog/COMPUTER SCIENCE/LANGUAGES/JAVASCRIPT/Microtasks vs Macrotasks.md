


A key part of javascript is the ability to handle i/o operations in a non blocking way

This is done by creating a structure where a program that controls the thread can project itself into the future, yielding control until an eventual result is achieved and when it is achieved, it is able to immediately retake control. Renter its body, with the returned soul. The rentry into the body is the microtask that resolves a Promise. It goes before any other major operation can be attempted. This inequality between microtasks and macro tasks provides safety : Since we gave control away for an i/o operation, we can be expected to do something important with that piece of data and therefore being both the most ancient and senior task in the current system, we are also quite important to do right now because if we wait too long, something might happen to that piece of data and corrupt our programming logic. 

So this imbalance creates a vastly superior system in the context of the Javascript problem. It allows us to flatten the thread, to always be running something forward at every clock cycle, Whereas before we might have had idle time without the possibility of awaits, Now with awaits we can stich ourselves into the future


The insanity of javascript with no micro or macro tasks is that any data structure can cause errors when it is accessed or written to by multiple functions which can potentially lead to race conditions. 




