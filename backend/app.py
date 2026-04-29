"""
app.py — Flask backend for feature model configuration validation.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import multiprocessing

app = Flask(__name__)
CORS(app)

def _run_solver_process(model, selected_features, return_dict):
    try:
        from solver import validate_configuration
        from analyzer import analyze_configuration
        
        res = validate_configuration(model, selected_features)
        
        if not res["valid"]:
            # Extract detailed error and problematic features
            msg, problematic = analyze_configuration(model, selected_features)
            res["message"] = msg
            res["problematicFeatures"] = problematic
            
        return_dict['result'] = res
    except Exception as e:
        return_dict['error'] = str(e)


@app.route("/api/validate", methods=["POST"])
def validate():
    """
    Validate a configuration against the feature model.

    Expects JSON body:
    {
        "model": { "nodes": [...], "edges": [...] },
        "config": { "selectedFeatures": ["f_1", "f_3", ...] }
    }

    Returns JSON:
    {
        "valid": true/false,
        "message": "..."
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({"valid": False, "message": "No JSON body provided"}), 400

    model = data.get("model")
    config = data.get("config", {})
    selected_features = config.get("selectedFeatures", [])

    if not model:
        return jsonify({"valid": False, "message": "No model provided"}), 400

    try:
        manager = multiprocessing.Manager()
        return_dict = manager.dict()
        
        p = multiprocessing.Process(target=_run_solver_process, args=(model, selected_features, return_dict))
        p.start()
        p.join(timeout=15) # 15 second timeout
        
        if p.is_alive():
            p.terminate()
            p.join()
            return jsonify({"valid": False, "message": "Solver timed out"}), 500
            
        if 'error' in return_dict:
            return jsonify({"valid": False, "message": f"Solver error: {return_dict['error']}"}), 500
            
        if 'result' in return_dict:
            return jsonify(return_dict['result'])
        else:
            return jsonify({"valid": False, "message": "Solver process exited without returning a result"}), 500
            
    except Exception as e:
        return jsonify({"valid": False, "message": f"Server execution error: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
