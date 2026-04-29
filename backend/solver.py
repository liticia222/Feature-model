"""
solver.py — PyCsp3-based constraint solver for feature model configurations.

Translates a feature model graph into CSP constraints and checks if
a given configuration (set of selected features) is satisfiable.
"""

from pycsp3 import *


def validate_configuration(model, selected_features):
    """
    Validate whether the selected features satisfy the feature model constraints.

    Parameters
    ----------
    model : dict
        Serialized graph with 'nodes' and 'edges'.
    selected_features : list[str]
        IDs of selected feature nodes.

    Returns
    -------
    dict
        { "valid": bool, "message": str }
    """
    clear()  # Reset PyCsp3 state

    nodes = model.get("nodes", [])
    edges = model.get("edges", [])

    if not nodes:
        return {"valid": True, "message": "Empty model — trivially valid"}

    # Build lookup structures
    node_map = {n["id"]: n for n in nodes}
    feature_nodes = [n for n in nodes if n["type"] == "feature"]

    if not feature_nodes:
        return {"valid": True, "message": "No feature nodes in model"}

    # Create a boolean CSP variable for each feature node
    # 1 = selected, 0 = not selected
    feat_ids = [n["id"] for n in feature_nodes]
    x = VarArray(size=len(feat_ids), dom={0, 1})
    feat_var = dict(zip(feat_ids, x))

    # Also create boolean variables for reified nodes (XOR, OR, Cardinality)
    reified_nodes = [n for n in nodes if n["type"] in ("xor", "or", "cardinality")]
    r_ids = [n["id"] for n in reified_nodes]
    if r_ids:
        r = VarArray(size=len(r_ids), dom={0, 1})
        reified_var = dict(zip(r_ids, r))
    else:
        reified_var = {}

    # All variables
    all_vars = {**feat_var, **reified_var}

    # Build adjacency: for each node, which edges go IN and which go OUT
    children_of = {}   # parent_id -> [(child_id, edge_type)]
    parents_of = {}    # child_id -> [(parent_id, edge_type)]
    for e in edges:
        children_of.setdefault(e["from"], []).append((e["to"], e["type"]))
        parents_of.setdefault(e["to"], []).append((e["from"], e["type"]))

    # ── Constraint generation ──

    # 1. Root feature must be selected (the feature with no parents)
    root_features = [
        fid for fid in feat_ids
        if fid not in parents_of
    ]
    
    if len(root_features) != 1:
        return {
            "valid": False, 
            "message": f"Invalid model: A feature model must have exactly one root feature (found {len(root_features)}).",
            "problematicFeatures": root_features
        }
        
    for rf in root_features:
        satisfy(feat_var[rf] == 1)

    # 2. Mandatory edges: parent selected ⟹ child selected
    #    Optional edges: child selected ⟹ parent selected
    for e in edges:
        from_id = e["from"]
        to_id = e["to"]
        etype = e["type"]

        if from_id not in all_vars or to_id not in all_vars:
            continue

        if from_id in reified_var:
            # Edges originating from a reified node to its children are 
            # logically handled by the reified group constraints below.
            continue

        f = all_vars[from_id]
        t = all_vars[to_id]

        if etype == "mandatory":
            # parent on ⟹ child on, child on ⟹ parent on
            satisfy(f == t)
        elif etype == "optional":
            # child on ⟹ parent on  (but parent on does NOT require child)
            satisfy(t <= f)

    # 3. Reified node constraints
    for rn in reified_nodes:
        rid = rn["id"]
        rtype = rn["type"]
        rv = reified_var[rid]

        # Get children of this reified node
        child_ids = [cid for cid, _ in children_of.get(rid, [])]
        child_feat_vars = [all_vars[cid] for cid in child_ids if cid in all_vars]

        if not child_feat_vars:
            continue

        if rtype == "xor":
            # Exactly one child selected when reified node is active
            satisfy(Sum(child_feat_vars) == rv)

        elif rtype == "or":
            # At least one child selected when reified node is active
            satisfy(Sum(child_feat_vars) >= rv)
            satisfy(Sum(child_feat_vars) <= len(child_feat_vars) * rv)

        elif rtype == "cardinality":
            cmin = rn.get("min", 1)
            cmax = rn.get("max", len(child_feat_vars))
            satisfy(Sum(child_feat_vars) >= cmin * rv)
            satisfy(Sum(child_feat_vars) <= cmax * rv)

    # 4. Fix the selected features according to user's configuration
    selected_set = set(selected_features)
    for fid in feat_ids:
        if fid in selected_set:
            satisfy(feat_var[fid] == 1)
        else:
            satisfy(feat_var[fid] == 0)

    # ── Solve ──
    result = solve()

    if result is SAT:
        return {"valid": True, "message": "Configuration satisfies all constraints"}
    else:
        return {
            "valid": False,
            "message": "Configuration violates model constraints",
        }
