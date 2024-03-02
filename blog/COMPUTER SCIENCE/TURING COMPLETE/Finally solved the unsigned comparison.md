

I solved it by building a tiny python program to help me experiment with different bit combinations : 

```python 
# Number object for performing string based bitwise operations,
# which is basically like a tiny version of a HDL for logic gates

class Number():
	
	def __init__(self, number):
		self.bits = np.binary_repr(number, width=8)
	
	def __repr__(self):
		return self.bits
	
	def flip(self):
		self.bits = Number.not_op(self.bits)
	
	def __iadd__(self, other):
		self.bits = Number.add_op(self.bits, other.bits)
		return self
	
	def __neg__(self):
		self.flip()
		self += Number(1)
		return self
	
	@staticmethod
	def and_op(a, b):
		return ''.join('1' if a[i] == '1' and b[i] == '1' else '0' \
		 for i in range(len(a)))
	
	@staticmethod
	def or_op(a, b):
		return ''.join('1' if a[i] == '1' or b[i] == '1' else '0' \
		 for i in range(len(a)))
	
	@staticmethod
	def xor_op(a, b):
		return ''.join('1' if a[i] != b[i] else '0' for i in range(len(a)))
	
	@staticmethod
	def not_op(a):
		return ''.join('1' if bit == '0' else '0' for bit in a)
	
	@staticmethod
	def add_op(a, b):
		a = list(a)
		b = list(b)
		carry = 0
		for i in range(len(a) - 1, -1, -1):
		a[i] = int(a[i])
		b[i] = int(b[i])
		a[i], carry = (a[i] ^ b[i] ^ carry), (a[i] & b[i]) | (a[i] & carry) | \
		(b[i] & carry)
		return ''.join(str(bit) for bit in a)
	
	@property
	def decimal(self):
		return int(self.bits, 2)
	
	@property
	def signed(self):
		return self.decimal - 256 if self.bits[0] == '1' else self.decimal
```



I then realized that I could get a simple order preserving transformation by just XOR the first digit with 1 and then use the signed comparison gate


![[Screenshot 2024-02-04 at 12.09.09 AM.png]]