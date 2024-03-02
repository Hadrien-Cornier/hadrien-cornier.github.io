
All RL is about only three types of problems : 

- Generalization : You never see the SAME image twice and yet you can know how to answer
- Credit Assignment : You want to to know which actions are responsible for the reward
- Exploration : You want to maximize the amount of information that you learn about the world in order to help you solve the other problems



There are currently ways to solve 2 of these at a time. 

Contextual Bandits solves generalization and Exploration

Policy Learning Q-learning solves generalization and credit assignment (the value function)

MDP learning (??) solves Generaliaztion and Credit Assignment (what could this be ? )

___ 


Can we solve all 3 at the same time ? 

Need a good policy to collect good data
Need a good data to get a good policy


Can we solve all three aspects together ? 

We need to be clear on what are the shortcomings of the 3 main solutions. 
In other words, why do they not solve the opposite vertex of the triangle ? 