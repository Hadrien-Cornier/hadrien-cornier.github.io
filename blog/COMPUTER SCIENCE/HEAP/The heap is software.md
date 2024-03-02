The stack is hardware


Heap source code : https://youtube.com/shorts/ZbU-lokFhfY?si=c_2K3i8oS15_yB8D


https://sourceware.org/glibc/wiki/MallocInternals

Malloc is essentially a memory management software layer that rarely does calls to the operating system and when you free something you just return it to the application to use for a different purpose but not to the OS.

Also there is a complex tiering system with fastbins. Small chunks and large chunks.

There is also a system to handle concurrency with multiple arenas that can serve the malloc requests of multiple threads at once


The main problems to overcome are :

- contention (when multiple threads try to acquire the mutex lock for the same chunk of memory)
- heap fragmentation (when even though there is free memory we cannot find a big enough contiguous block)
- Heap corruption. What is this ?