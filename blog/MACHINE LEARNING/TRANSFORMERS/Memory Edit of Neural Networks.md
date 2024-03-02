

ROME, Locating and Editing Factual Associations in GPT

https://arxiv.org/pdf/2202.05262.pdf

The MLP and the Attention are complementary 

MLP is what memorizes facts that the deeper layer Attention is later on taking as context

It would probbaly not help to have full attention with no MLP ? => Question



> Based on causal traces, we posit a specific mechanism for storage of factual associations: each midlayer MLP module accepts inputs that encode a subject, then produces outputs that recall memorized properties about that subject. Middle layer MLP outputs accumulate information, then the summed information is copied to the last token by attention at high layers. This hypothesis localizes factual association along three dimensions, placing it (i) in the MLP modules (ii) at specific middle layers (iii) and specifically at the processing of the subject’s last token. It is consistent with the Geva et al. (2021) view that MLP layers store knowledge, and the Elhage et al. (2021) study showing an information-copying role for self-attention. Furthermore, informed by the Zhao et al. (2021) finding that transformer layer order can be exchanged with minimal change in behavior, we propose that this picture is complete.



How can I use this : MLPs are useful in conjunction with attention


Interesting. : a rank 1 update to a matrix inside the Transformer corresponds to a fact

Problem : "Bill Gates is CEO of Microsoft" != "The CEO of microsoft is Bill Gates"
Because of unidirectional attention


LLMS are unidirectional because it is much more efficient to compute. We can cache the past instead of recomputing it


Also humans are constrained to live through time so it seems like a more nature aligned brain architecture