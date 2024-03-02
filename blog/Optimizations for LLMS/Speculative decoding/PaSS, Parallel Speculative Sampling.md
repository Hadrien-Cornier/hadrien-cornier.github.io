


This paper is about speculative decoding but with only one model
the large model produces multiple tokens as output at each pass and then in a subsequent pass it verifies if the generated sequence has a low perplexity 


It is guaranteed to be faster because each call of the model adds a new token which means it is a least as fast as the vanilla solution of running one token at a time
