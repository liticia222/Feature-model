# Action Plan: Meaningful Configuration Validation & Color Coding

## Objective
Update the frontend and backend so that invalid configurations return a list of "problematic features" along with a human-readable explanation of why the configuration is invalid. The frontend will then color-code the features: White (unvalidated/idle), Green (valid), Red (problematic).

## Step 1: Backend Structural Analyzer (The "Why")
While the PyCSP3 solver tells us *if* a configuration is SAT/UNSAT, extracting the exact human-readable reason from a CSP mathematical core is extremely difficult and often cryptic. 
Instead, we will add a structural validation step in `app.py` or `solver.py` that runs when the configuration is UNSAT. This analyzer will check the feature model rules against the user's explicit selections and return a precise error message and a list of problematic nodes.
Checks will include:
1. **Missing Parent**: Selected feature X requires parent Y. (Marks X and Y as problematic).
2. **Missing Root**: The root feature is not selected. (Marks Root).
3. **Missing Mandatory Child**: Selected feature X requires mandatory child Y. (Marks X).
4. **XOR Violation**: XOR group under feature X has 0 or >1 selected features. (Marks X and its selected children).
5. **OR Violation**: OR group under feature X has 0 selected features but X is selected. (Marks X).
6. **Cardinality Violation**: Cardinality group under X does not meet min/max limits. (Marks X and its children).

## Step 2: API Response Update
Update the `/api/validate` endpoint to return:
```json
{
  "valid": false,
  "message": "Feature 'Gas' is selected but its parent 'Car' is not.",
  "problematicFeatures": ["f_2", "f_1"]
}
```

## Step 3: Frontend Node State Management
1. Update `graph.js` node data to include an `isValidated` and `isProblematic` state.
2. Update `canvas.js` rendering logic:
   - If `isValidated` is false: Fill color is White (for selected) or Gray (for unselected).
   - If `isValidated` is true AND `isProblematic` is true: Fill/Stroke color is Red.
   - If `isValidated` is true AND `valid` is true: Fill color is Green.
3. Update `config.js` to parse the `problematicFeatures` from the API and update the graph node states accordingly, then redraw the canvas.

## Step 4: UI Error Messaging
Update the validation bar to show the exact `message` returned by the backend, ensuring the text is readable and explicitly states what rule was broken.
