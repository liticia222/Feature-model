"""Test calling solver twice (simulates Flask calls)."""
from solver import validate_configuration

model = {
    "nodes": [
        {"id": "f_1", "type": "feature", "name": "Car", "x": 250, "y": 94},
        {"id": "xor_2", "type": "xor", "name": "XOR", "x": 150, "y": 294},
        {"id": "f_3", "type": "feature", "name": "Gas", "x": 50, "y": 444},
        {"id": "f_4", "type": "feature", "name": "Electric", "x": 250, "y": 444},
    ],
    "edges": [
        {"id": "e_5", "from": "f_1", "to": "xor_2", "type": "mandatory"},
        {"id": "e_6", "from": "xor_2", "to": "f_3", "type": "mandatory"},
        {"id": "e_7", "from": "xor_2", "to": "f_4", "type": "mandatory"},
    ],
}

print("=== Call 1 ===")
r1 = validate_configuration(model, ["f_1", "f_3"])
print(r1)

print("\n=== Call 2 (same input) ===")
r2 = validate_configuration(model, ["f_1", "f_3"])
print(r2)
