


Switches prevent short circuits by allowing you to connect multiple lines to one line such that they never interfere : 

What is mean is that a short-circuit happens on a line if two different input lines have write access on the destination line and they are trying to write concurrent values and by values I mean voltage in the most low level way possible

The switch prevents that because when you choose to not trigger it (with a demultiplexer) then what you get is an inactive output line, which is great because it means you are guaranteed to not short-circuit because two lines are never enabled at the same time 



TWO LINES NEVER ENABLED AT THE SAME TIME => DEMULTIPLEXER


Essentially the demultiplexer converts a binary number into a one hot encoding where every coordinate is one physical wire  

So the DEMULTIPLEXER of rank $K$ is just a chip that takes as input a binary number comprised of $K$ bits and outputs a fan-out of $2^K$ wires where exactly $2^K-1$ are FALSE and $1$ wire has the value TRUE
