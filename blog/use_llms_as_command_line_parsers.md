```
$ ollama run llama2 "Summarize this file: $(cat README.md)"
 Ollama is a lightweight, extensible framework for building and running language models on the local machine. It provides a simple API for creating, running, and managing models, as well as a library of pre-built models that can be easily used in a variety of applications.
```

```
$ ollama run llama2 "sum the count of each category and return it :  $(cat shopping_list.md)"
```

```
$ ollama run llama2 "what is the cause of the error ?  $(tail error.log)"
```