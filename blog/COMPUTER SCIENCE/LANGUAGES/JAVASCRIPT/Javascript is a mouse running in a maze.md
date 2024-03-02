

Single thread, await is a flag that exits the current function and returns resources to the javascript VM which then keeps processing other things



- **Event Loop**: JavaScript utilizes an event loop, which allows it to perform non-blocking, asynchronous operations. The event loop works by executing all operations in the call stack (synchronous code), and then it processes events in the callback queue (asynchronous callbacks that are ready to be executed).
    
- **`await` Keyword**: The `await` keyword is used in async functions to pause the execution of the async function and wait for the Promise to resolve. It does not return resources to the JavaScript VM in the sense of exiting the function entirely; rather, it yields execution back to the event loop, allowing other operations to run while waiting for the Promise to settle. Once the awaited Promise is settled (either fulfilled or rejected), the async function continues execution from the point it was paused.
    
- **Concurrency and Parallelism**: While JavaScript's main execution thread is single-threaded, modern JavaScript environments use web workers in browsers or worker threads in Node.js to achieve concurrency and parallelism. These mechanisms allow JavaScript to perform tasks in the background, separate from the main execution thread, enabling more complex operations without blocking the main thread.





