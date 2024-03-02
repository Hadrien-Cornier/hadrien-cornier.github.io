


The stack is safer for programmers 
It takes care of memory leaks

The heap is dangerous but flexible
It can hold global variables that last over many functions 
In purely functional programming we would have to all variables of a function into its arguments, which might lead to inefficient copying when we switch stack fames.



#gpt4 

Yes, that's a fair characterization for languages with automatic memory management and destructors, like C++. When an object is created within a function scope, it is automatically destroyed when the function exits, and the object goes out of scope. This process is managed by the stack, where local variables are stored. Here's how it works:

1. **Automatic Construction**: When you declare an object of a class within a function, the constructor for that class is automatically called, initializing the object.

2. **Scope-Limited Lifetime**: The object exists and is accessible within the scope of the function. Its lifetime is tied to the function's execution.

3. **Automatic Destruction**: As soon as the function exits, any objects declared within that function's scope are automatically destroyed. The destructor for each object is called, allowing for any necessary cleanup activities, such as releasing resources, closing file handles, etc.

This automatic construction and destruction mechanism helps manage memory efficiently and reduces the likelihood of memory leaks, especially in complex programs with many function calls and objects. It ensures that memory and resources are properly released when they are no longer needed, without requiring explicit cleanup code from the programmer.

This behavior is a key feature of RAII (Resource Acquisition Is Initialization), a programming idiom used in C++ and similar languages, where resource allocation is tied to object lifetime, ensuring deterministic resource management.







Questions:

Why is the stack limited in size compared to the heap

Is there an inefficient copy step when a function calls another and passes in a value in the argument of the called function ? Do we have to physically write again the variable in the new frame of the stack trace ? Would it be fair to say that the stack trace pays for its memory leak safety by lower performance for sharing a data variable between functions?

Is the return pointer of a function on the stack just pointing to the element just below the stack ?

How is an exception raised through the stack ?