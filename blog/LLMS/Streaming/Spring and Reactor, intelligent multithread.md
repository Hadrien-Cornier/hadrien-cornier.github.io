
TLDR : Spring WebFlux and Project Reactor application have a certain fixed number of threads that await incoming connections. Each thread can handle many input conections because with non blocking i/o the thread can send a request to an api and instead of being frozen waiting for a response, it can handle other requests in the meantime. It's more efficient than 1 thread per request which is not scalable because each new thread brings overhead such that there is a limited total number of threads  


Spring Framework, particularly with Spring WebFlux and Project Reactor, adopts a different threading model compared to traditional servlet-based Spring MVC applications. Here's how it works:

### Traditional Servlet-based Model

In a traditional servlet-based application, such as those built with Spring MVC, the server typically spawns a new thread for each incoming HTTP request. This model is straightforward but can become inefficient under high load, as each thread consumes system resources, and there's a practical limit to how many threads can be active at any given time.

### Reactive Model with Spring WebFlux and Project Reactor

Spring WebFlux, built on Project Reactor, uses a non-blocking, reactive programming model that is designed to handle concurrency with fewer threads, leveraging the reactive streams specification. Here's the key difference in its approach:

- **Non-blocking I/O operations**: Spring WebFlux uses non-blocking I/O, which means it does not require a dedicated thread to wait for the I/O operation to complete. Instead, I/O operations are executed, and when the data is ready, a callback is triggered to continue processing. This allows a small number of threads to manage many concurrent connections.

- **Event Loop Model**: Much like the Node.js event loop, WebFlux operates on an event loop model where a small number of threads (event loop workers) can handle many connections. It does this by scheduling tasks to be executed on these threads whenever data is available or an operation is completed, instead of blocking the thread waiting for the operation to finish.

- **Multi-threaded, but Efficiently**: While WebFlux is indeed multi-threaded, it doesn't spawn a new thread per request. Instead, it uses a fixed-size pool of threads more efficiently. The default configuration uses the number of available CPU cores to determine the optimal size of the thread pool, ensuring that the application can scale with the hardware it runs on without overwhelming the system with too many threads.

### Scalability and Efficiency

This reactive model allows Spring WebFlux applications to be highly scalable and efficient, capable of handling a large number of connections with fewer system resources. It's particularly well-suited for applications that perform a lot of I/O operations, such as those calling external APIs, performing database operations, or serving a large number of concurrent clients, where traditional thread-per-request models might struggle.

In summary, Spring WebFlux and Project Reactor do not spawn a new thread for each incoming request. Instead, they are designed to handle requests asynchronously and non-blockingly, scheduling them on a limited number of threads, which allows for better resource utilization and scalability.