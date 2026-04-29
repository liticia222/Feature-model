"""Test the solver.py validate_configuration function directly."""
import json
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

# Test 1: Select only Car + Gas (should be valid for XOR)
print("=== Test 1: Car + Gas ===")
result = validate_configuration(model, ["f_1", "f_3"])
print(json.dumps(result, indent=2))

# Test 2: Select only Gas (no parent) — should be invalid
print("\n=== Test 2: Gas only (no parent) ===")
result = validate_configuration(model, ["f_3"])
print(json.dumps(result, indent=2))

# Test 3: Select Car + Gas + Electric (both children of XOR) — should be invalid
print("\n=== Test 3: Car + Gas + Electric (violates XOR) ===")
result = validate_configuration(model, ["f_1", "f_3", "f_4"])
print(json.dumps(result, indent=2))

# Test 4: Select all features (should be invalid — XOR)
print("\n=== Test 4: Everything selected ===")
result = validate_configuration(model, ["f_1", "f_3", "f_4"])
print(json.dumps(result, indent=2))
