"""Test OR and Cardinality formulations for PyCsp3."""
from pycsp3 import *

# === OR test: at least one child when active ===
print("=== OR Tests ===")

# Test: parent=1, or=1, child1=1, child2=0  (should be SAT)
clear()
v = VarArray(size=4, dom={0, 1})  # parent, or_node, child1, child2
satisfy(v[0] == 1)   # root
satisfy(v[0] == v[1]) # mandatory parent->or
# OR: when active, at least 1 child. When inactive, 0 children
# Approach: sum_children >= or_var AND sum_children <= n * or_var
n_children = 2
satisfy(Sum(v[2:4]) >= v[1])       # if or=1, sum>=1
satisfy(Sum(v[2:4]) <= n_children * v[1])  # if or=0, sum<=0 (i.e., sum=0)
satisfy(v[2] == 1)
satisfy(v[3] == 0)
result = solve()
print(f"  OR parent=1, c1=1, c2=0 => {result} (expected SAT)")

# Test: parent=1, or=1, child1=1, child2=1  (should be SAT for OR)
clear()
v = VarArray(size=4, dom={0, 1})
satisfy(v[0] == 1)
satisfy(v[0] == v[1])
satisfy(Sum(v[2:4]) >= v[1])
satisfy(Sum(v[2:4]) <= n_children * v[1])
satisfy(v[2] == 1)
satisfy(v[3] == 1)
result = solve()
print(f"  OR parent=1, c1=1, c2=1 => {result} (expected SAT)")

# Test: parent=1, or=1, child1=0, child2=0  (should be UNSAT for OR)
clear()
v = VarArray(size=4, dom={0, 1})
satisfy(v[0] == 1)
satisfy(v[0] == v[1])
satisfy(Sum(v[2:4]) >= v[1])
satisfy(Sum(v[2:4]) <= n_children * v[1])
satisfy(v[2] == 0)
satisfy(v[3] == 0)
result = solve()
print(f"  OR parent=1, c1=0, c2=0 => {result} (expected UNSAT)")


# === Cardinality test [1..2] ===
print("\n=== Cardinality [1..2] Tests ===")

# Test: parent=1, card=1, c1=1, c2=1, c3=0  (sum=2 in [1..2], should SAT)
clear()
v = VarArray(size=5, dom={0, 1})  # parent, card, c1, c2, c3
satisfy(v[0] == 1)
satisfy(v[0] == v[1])
cmin, cmax = 1, 2
n_c = 3
# card active: cmin <= sum <= cmax
# card inactive: sum = 0
# Formulate: sum >= cmin * card AND sum <= cmax * card  (not quite right for cmin>0)
# Better: sum >= cmin * card AND sum <= cmax + (n_c - cmax) * (1 - card)
# Simplest working: separate into card==1 implies, card==0 implies
# Since If/Then doesn't work, use arithmetic:
# sum_children - card * cmin >= 0 means sum >= cmin when card=1, sum >= 0 when card=0
# sum_children - card * cmax <= 0 means sum <= cmax when card=1, sum <= 0 when card=0
satisfy(Sum(v[2:5]) >= cmin * v[1])
satisfy(Sum(v[2:5]) <= cmax * v[1])
satisfy(v[2] == 1)
satisfy(v[3] == 1)
satisfy(v[4] == 0)
result = solve()
print(f"  Card[1..2] parent=1, c1=1, c2=1, c3=0 (sum=2) => {result} (expected SAT)")

# Test: all 3 children on (sum=3 > max=2, should UNSAT)
clear()
v = VarArray(size=5, dom={0, 1})
satisfy(v[0] == 1)
satisfy(v[0] == v[1])
satisfy(Sum(v[2:5]) >= cmin * v[1])
satisfy(Sum(v[2:5]) <= cmax * v[1])
satisfy(v[2] == 1)
satisfy(v[3] == 1)
satisfy(v[4] == 1)
result = solve()
print(f"  Card[1..2] parent=1, c1=1, c2=1, c3=1 (sum=3) => {result} (expected UNSAT)")
