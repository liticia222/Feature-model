"""Quick smoke test for PyCsp3 solver availability."""
from pycsp3 import *

clear()
x = VarArray(size=2, dom={0, 1})
satisfy(Sum(x) == 1)
result = solve()
print("Result:", result)
print("Is SAT:", result is SAT)
if result is SAT:
    print("Values:", values(x))
