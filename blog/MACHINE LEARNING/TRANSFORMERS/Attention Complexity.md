
From Attention Is All You Need : 

| Layer Type             | Complexity per Layer | Sequential Operations | Maximum Path Length |
|------------------------|----------------------|-----------------------|---------------------|
| Self-Attention         | $O(n^2 \cdot d)$ | $O(1)$            | $O(1)$          |
| Recurrent              | $O(n \cdot d^2)$ | $O(n)$            | $O(n)$          |
| Convolutional          | $O(k \cdot n \cdot d^2)$ | $O(1)$    | $O(\log(n))$    |
| Self-Attention (restricted) | $O(r \cdot n \cdot d)$ | $O(1)$ | $O(n/r)$       |

$n$: sequence length
$d$: hidden dimension
$k$: kernel size of convolutions
$r$: size of the neighborhood in restricted self-attention