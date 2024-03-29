
From Wikipedia, the free encyclopedia

[![](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Linker.svg/220px-Linker.svg.png)](https://en.wikipedia.org/wiki/File:Linker.svg)

An illustration of the linking process. Object files and [static libraries](https://en.wikipedia.org/wiki/Static_library "Static library") are assembled into a new library or executable

In [computing](https://en.wikipedia.org/wiki/Computing "Computing"), a **linker** or **link editor** is a computer [system program](https://en.wikipedia.org/wiki/System_software "System software") that takes one or more [object files](https://en.wikipedia.org/wiki/Object_file "Object file") (generated by a [compiler](https://en.wikipedia.org/wiki/Compiler "Compiler") or an [assembler](https://en.wikipedia.org/wiki/Assembler_(computing) "Assembler (computing)")) and combines them into a single [executable](https://en.wikipedia.org/wiki/Executable "Executable") file, [library](https://en.wikipedia.org/wiki/Library_(computing) "Library (computing)") file, or another "object" file.

A simpler version that writes its [output](https://en.wikipedia.org/wiki/Input/output "Input/output") directly to [memory](https://en.wikipedia.org/wiki/Computer_memory "Computer memory") is called the _loader_, though [loading](https://en.wikipedia.org/wiki/Loader_(computing) "Loader (computing)") is typically considered a separate process.[[1]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-IBM_1972-1)[[2]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-Barron_1978_Consolidator-2)

## Overview

Computer programs typically are composed of several parts or modules; these parts/modules do not need to be contained within a single [object file](https://en.wikipedia.org/wiki/Object_file "Object file"), and in such cases refer to each other by means of [symbols](https://en.wikipedia.org/wiki/Debug_symbol "Debug symbol") as addresses into other modules, which are mapped into memory addresses when linked for execution.

While the process of linking is meant to ultimately combine these independent parts, there are many good reasons to develop those separately at the [source](https://en.wikipedia.org/wiki/Source_code "Source code")-level. Among these reasons are the ease of organizing several smaller pieces over a [monolithic](https://en.wikipedia.org/wiki/Monolithic_codebase "Monolithic codebase") whole and the ability to better define the purpose and responsibilities of each individual piece, which is essential for managing complexity and increasing long-term maintainability in [software architecture](https://en.wikipedia.org/wiki/Software_architecture "Software architecture").

Typically, an object file can contain three kinds of symbols:

- defined "external" symbols, sometimes called "public" or "entry" symbols, which allow it to be called by other modules,
- undefined "external" symbols, which reference other modules where these symbols are defined, and
- local symbols, used internally within the object file to facilitate [relocation](https://en.wikipedia.org/wiki/Relocation_(computer_science) "Relocation (computer science)").

For most compilers, each object file is the result of compiling one input source code file. When a program comprises multiple object files, the linker combines these files into a unified executable program, resolving the symbols as it goes along.

Linkers can take objects from a collection called a [library](https://en.wikipedia.org/wiki/Library_(computing) "Library (computing)") or [runtime library](https://en.wikipedia.org/wiki/Runtime_library "Runtime library"). Most linkers do not include all the object files in a [static library](https://en.wikipedia.org/wiki/Static_library "Static library") in the output executable; they include only those object files from the library that are referenced by other object files or libraries directly or indirectly. But for a [shared library](https://en.wikipedia.org/wiki/Shared_libraries "Shared libraries"), the entire library has to be loaded during runtime as it is not known which functions or methods will be called during runtime. Library linking may thus be an iterative process, with some referenced modules requiring additional modules to be linked, and so on. Libraries exist for diverse purposes, and one or more system libraries are usually linked in by default.

The linker also takes care of arranging the objects in a program's [address space](https://en.wikipedia.org/wiki/Address_space "Address space"). This may involve _relocating_ code that assumes a specific [base address](https://en.wikipedia.org/wiki/Base_address "Base address") into another base. Since a compiler seldom knows where an object will reside, it often assumes a fixed base location (for example, [zero](https://en.wikipedia.org/wiki/Zero_base "Zero base")). Relocating machine code may involve re-targeting of absolute jumps, loads and stores.

The executable output by the linker may need another relocation pass when it is finally loaded into memory (just before execution). This pass is usually omitted on [hardware](https://en.wikipedia.org/wiki/Computer_hardware "Computer hardware") offering [virtual memory](https://en.wikipedia.org/wiki/Virtual_memory "Virtual memory"): every program is put into its own address space, so there is no conflict even if all programs load at the same base address. This pass may also be omitted if the executable is a [position independent](https://en.wikipedia.org/wiki/Position_independent "Position independent") executable.

On some [Unix](https://en.wikipedia.org/wiki/Unix "Unix") variants, such as [SINTRAN III](https://en.wikipedia.org/wiki/SINTRAN_III "SINTRAN III"), the process performed by a linker (assembling object files into a program) was called _[loading](https://en.wikipedia.org/wiki/Loader_(computing) "Loader (computing)")_ (as in loading executable code onto a file).[[3]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-BRF_1984-3) Additionally, in some operating systems, the same program handles both the jobs of linking and loading a program ([dynamic linking](https://en.wikipedia.org/wiki/Dynamic_linking "Dynamic linking")).

## Dynamic linking

See also: [Dynamic linker](https://en.wikipedia.org/wiki/Dynamic_linker "Dynamic linker")

Many [operating system](https://en.wikipedia.org/wiki/Operating_system "Operating system") environments allow dynamic linking, deferring the resolution of some undefined symbols until a program is run. That means that the executable code still contains undefined symbols, plus a list of objects or libraries that will provide definitions for these. Loading the program will load these objects/libraries as well, and perform a final linking.

This approach offers two advantages:

- Often-used libraries (for example the standard system libraries) need to be stored in only one location, not duplicated in every single executable file, thus saving limited [memory](https://en.wikipedia.org/wiki/Computer_memory "Computer memory") and [disk](https://en.wikipedia.org/wiki/Disk_storage "Disk storage") space.
- If a bug in a library function is corrected by replacing the library or [performance](https://en.wikipedia.org/wiki/Computer_performance "Computer performance") is improved, all programs using it dynamically will benefit from the correction after restarting them. Programs that included this function by static linking would have to be re-linked first.

There are also disadvantages:

- Known on the [Windows](https://en.wikipedia.org/wiki/Windows "Windows") platform as "[DLL hell](https://en.wikipedia.org/wiki/DLL_hell "DLL hell")", an incompatible updated library will break executables that depended on the behavior of the previous version of the library if the newer version is not correctly [backward compatible](https://en.wikipedia.org/wiki/Backward_compatible "Backward compatible").
- A program, together with the libraries it uses, might be certified (e.g. as to correctness, documentation requirements, or performance) as a package, but not if components can be replaced (this also argues against automatic OS updates in critical systems; in both cases, the OS and libraries form part of a _qualified_ environment).

[Contained](https://en.wikipedia.org/wiki/Containerization_(computing) "Containerization (computing)") or [virtual](https://en.wikipedia.org/wiki/OS-level_virtualization "OS-level virtualization") environments may further allow [system administrators](https://en.wikipedia.org/wiki/System_administrator "System administrator") to mitigate or trade-off these individual pros and cons.

## Static linking

Static linking is the result of the linker copying all library routines used in the program into the executable image. This may require more disk space and memory than dynamic linking, but is more portable, since it does not require the presence of the [library](https://en.wikipedia.org/wiki/Dynamic-link_library "Dynamic-link library") on the system where it runs. Static linking also prevents "DLL hell", since each program includes exactly the versions of library routines that it requires, with no conflict with other programs. A program using just a few routines from a library does not require the entire library to be installed.

## Relocation

As the compiler has no information on the layout of objects in the final output, it cannot take advantage of shorter or more efficient instructions that place a requirement on the address of another object. For example, a jump instruction can reference an absolute address or an offset from the current location, and the offset could be expressed with different lengths depending on the distance to the target. By first generating the most conservative instruction (usually the largest relative or absolute variant, depending on platform) and adding _relaxation hints_, it is possible to substitute shorter or more efficient instructions during the final link. In regard to jump optimizations this is also called _automatic jump-sizing_.[[4]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-Salomon_1992-4) This step can be performed only after all input objects have been read and assigned temporary addresses; the **linker relaxation** pass subsequently reassigns addresses, which may in turn allow more potential relaxations to occur. In general, the substituted sequences are shorter, which allows this process to always converge on the best solution given a fixed order of objects; if this is not the case, relaxations can conflict, and the linker needs to weigh the advantages of either option.

While instruction relaxation typically occurs at link-time, inner-module relaxation can already take place as part of the optimizing process at [compile-time](https://en.wikipedia.org/wiki/Compile-time "Compile-time"). In some cases, relaxation can also occur at [load-time](https://en.wikipedia.org/wiki/Load-time "Load-time") as part of the relocation process or combined with [dynamic dead-code elimination](https://en.wikipedia.org/wiki/Dynamic_dead-code_elimination "Dynamic dead-code elimination") techniques.

## Linkage editor

In IBM [System/360](https://en.wikipedia.org/wiki/System/360 "System/360") [mainframe](https://en.wikipedia.org/wiki/Mainframe_computer "Mainframe computer") environments such as [OS/360](https://en.wikipedia.org/wiki/OS/360 "OS/360"), including [z/OS](https://en.wikipedia.org/wiki/Z/OS "Z/OS") for the [z/Architecture](https://en.wikipedia.org/wiki/Z/Architecture "Z/Architecture") mainframes, this type of program is known as a _linkage editor_. As the name implies a linkage _editor_ has the additional capability of allowing the addition, replacement, and/or deletion of individual program sections. Operating systems such as OS/360 have format for executable load-modules containing supplementary data about the component sections of a program, so that an individual program section can be replaced, and other parts of the program updated so that relocatable addresses and other references can be corrected by the linkage editor, as part of the process.

One advantage of this is that it allows a program to be maintained without having to keep all of the intermediate object files, or without having to re-compile program sections that haven't changed. It also permits program updates to be distributed in the form of small files (originally [card decks](https://en.wikipedia.org/wiki/Card_deck_(computing) "Card deck (computing)")), containing only the object module to be replaced. In such systems, object code is in the form and format of 80-byte punched-card images, so that updates can be introduced into a system using that medium. In later releases of OS/360 and in subsequent systems, load-modules contain additional data about versions of components modules, to create a traceable record of updates. It also allows one to add, change, or remove an [overlay](https://en.wikipedia.org/wiki/Overlay_(programming) "Overlay (programming)") structure from an already linked load module.

The term "linkage editor" should not be construed as implying that the program operates in a user-interactive mode like a text editor. It is intended for batch-mode execution, with the editing commands being supplied by the user in sequentially organized files, such as [punched cards](https://en.wikipedia.org/wiki/Punched_card "Punched card"), [DASD](https://en.wikipedia.org/wiki/Direct-access_storage_device "Direct-access storage device"), or [magnetic tape](https://en.wikipedia.org/wiki/Magnetic_tape "Magnetic tape").

_Linkage editing_ ([IBM](https://en.wikipedia.org/wiki/IBM "IBM") nomenclature) or _consolidation_ or _collection_ ([ICL](https://en.wikipedia.org/wiki/International_Computers_Limited "International Computers Limited") nomenclature) refers to the _linkage editor's_ or _consolidator's_ act of combining the various pieces into a relocatable binary, whereas the loading and relocation into an absolute binary at the target address is normally considered a separate step.[[2]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-Barron_1978_Consolidator-2)

## Linker Control Scripts

In the beginning linkers gave users very limited control over the arrangement of generated output object files. As the target systems became complex with different memory requirements such as embedded systems, it became necessary to give users control to generate output object files with their specific requirements such as defining base addresses' of segments. Linkers control scripts were used for this.

## Common implementations

On Unix and Unix-like systems, the linker is known as "ld". Origins of the name "ld" are "LoaDer" and "Link eDitor". The term "loader" was used to describe the process of loading external symbols from other programs during the process of linking.[[5]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-UNIX_V6_manuals-5)

### GNU linker

The GNU linker (or GNU ld) is the [GNU Project](https://en.wikipedia.org/wiki/GNU_Project "GNU Project")'s [free software](https://en.wikipedia.org/wiki/Free_software "Free software") implementation of the Unix command ld. GNU ld runs the linker, which creates an executable file (or a library) from object files created during compilation of a software project. A _linker script_ may be passed to GNU ld to exercise greater control over the linking process.[[6]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-GNU_2018_Binutils-6) The GNU linker is part of the [GNU Binary Utilities](https://en.wikipedia.org/wiki/GNU_Binary_Utilities "GNU Binary Utilities") (binutils). Two versions of ld are provided in binutils: the traditional GNU ld based on [bfd](https://en.wikipedia.org/wiki/Binary_File_Descriptor_library "Binary File Descriptor library"), and a "streamlined" ELF-only version called [gold](https://en.wikipedia.org/wiki/Gold_(linker) "Gold (linker)").

The command-line and linker script syntaxes of GNU ld is the _de facto_ standard in much of the [Unix-like](https://en.wikipedia.org/wiki/Unix-like "Unix-like") world. The [LLVM](https://en.wikipedia.org/wiki/LLVM "LLVM") project's linker, _lld_, is designed to be drop-in compatible,[[7]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-7) and may be used directly with the GNU compiler. Another drop-in replacement, mold, is a highly parallelized and faster alternative which is also supported by GNU tools.[[8]](https://en.wikipedia.org/wiki/Linker_(computing)#cite_note-8)