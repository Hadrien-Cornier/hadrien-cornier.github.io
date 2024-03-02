

Writing an interpreter for BrainFuck is easier than writing a compiler 


interpret = What is the state after step N ? 
compile = Translate this into another programming language

So the flow looks like : 
high-level language -> (compile -> compile ... -> compile)-> interpret

the compile chain is optional, but probably makes it faster