def analyze_configuration(model, selected_features):
    """
    Analyzes an invalid configuration to find the exact reason and problematic nodes.
    Returns: (message, problematic_features_list)
    """
    nodes = model.get("nodes", [])
    edges = model.get("edges", [])
    selected = set(selected_features)

    node_map = {n["id"]: n for n in nodes}
    feature_nodes = {n["id"]: n for n in nodes if n["type"] == "feature"}
    
    children_of = {}
    parents_of = {}
    for e in edges:
        children_of.setdefault(e["from"], []).append((e["to"], e["type"]))
        parents_of.setdefault(e["to"], []).append((e["from"], e["type"]))

    # Helper to get feature name
    def get_name(node_id):
        return node_map.get(node_id, {}).get("name", node_id)

    # 1. Root Rule: Model must have exactly one root feature, and it must be selected
    root_features = [fid for fid in feature_nodes if fid not in parents_of]
    if len(root_features) != 1:
        return f"Invalid model: A Feature Model must have exactly one root feature (found {len(root_features)}).", root_features
    
    root_id = root_features[0]
    if root_id not in selected:
        return f"The root feature '{get_name(root_id)}' must be selected.", [root_id]

    # 2. Parent Rule: For each selected feature, its parent MUST be selected
    for fid in selected:
        if fid not in feature_nodes:
            continue
        
        # Walk up to find the feature parent
        curr = fid
        parent_feature = None
        while curr in parents_of:
            p_id, _ = parents_of[curr][0] # Assume tree structure (1 parent)
            if node_map[p_id]["type"] == "feature":
                parent_feature = p_id
                break
            curr = p_id
            
        if parent_feature and parent_feature not in selected:
            return f"Feature '{get_name(fid)}' is selected but its parent '{get_name(parent_feature)}' is not.", [fid, parent_feature]

    # 3. Children Rules: Mandatory and Reified group rules
    for fid in feature_nodes:
        if fid not in selected:
            continue
            
        for child_id, etype in children_of.get(fid, []):
            child_node = node_map[child_id]
            
            # Direct feature child
            if child_node["type"] == "feature":
                if etype == "mandatory" and child_id not in selected:
                    return f"Feature '{get_name(fid)}' requires its mandatory child '{get_name(child_id)}'.", [fid, child_id]
            
            # Reified node child (XOR, OR, CARDINALITY)
            else:
                group_children = [c for c, _ in children_of.get(child_id, []) if node_map[c]["type"] == "feature"]
                num_selected = sum(1 for c in group_children if c in selected)
                
                if etype == "mandatory":
                    # Group is active
                    if child_node["type"] == "xor" and num_selected != 1:
                        return f"XOR group under '{get_name(fid)}' must have exactly one feature selected (currently {num_selected}).", [fid] + group_children
                    elif child_node["type"] == "or" and num_selected < 1:
                        return f"OR group under '{get_name(fid)}' must have at least one feature selected.", [fid] + group_children
                    elif child_node["type"] == "cardinality":
                        cmin = child_node.get("min", 1)
                        cmax = child_node.get("max", len(group_children))
                        if not (cmin <= num_selected <= cmax):
                            return f"Cardinality group under '{get_name(fid)}' must have between {cmin} and {cmax} features selected (currently {num_selected}).", [fid] + group_children
                
                elif etype == "optional":
                    # Group is active ONLY if user selected >0 children
                    if num_selected > 0:
                        if child_node["type"] == "xor" and num_selected > 1:
                            return f"Optional XOR group under '{get_name(fid)}' can have at most one feature selected (currently {num_selected}).", [fid] + group_children
                        elif child_node["type"] == "cardinality":
                            cmin = child_node.get("min", 1)
                            cmax = child_node.get("max", len(group_children))
                            if not (cmin <= num_selected <= cmax):
                                return f"Optional Cardinality group under '{get_name(fid)}' must have between {cmin} and {cmax} features selected when active (currently {num_selected}).", [fid] + group_children

    return "Configuration is invalid due to unknown complex constraints.", []
