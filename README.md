# Feature Model Studio

A web-based feature model creator and configuration instantiator. The project allows users to graphically construct feature models (with Mandatory, Optional, XOR, OR, and Cardinality relationships) and validate configurations against the PyCSP3 constraint solver.

## Architecture

The project consists of two main parts:
1. **Frontend**: A Single Page Application (SPA) built with Vanilla JS, Vite, and HTML5 Canvas.
2. **Backend**: A Python Flask REST API utilizing the `pycsp3` constraint solver library.

## Quick Start

We have provided two bash scripts to make running the application easy. 

### Starting the Application

To start both the frontend and backend in the background, run:

```bash
./start.sh
```

This will:
- Start the Flask backend on `http://localhost:5000`
- Start the Vite frontend on `http://localhost:5173`
- Create `.log` files in the respective directories for debugging

### Stopping the Application

To safely shut down the background processes, run:

```bash
./stop.sh
```

---

## Manual Setup & Run

If you prefer to run the components manually in separate terminals:

### 1. Backend (Terminal 1)
```bash
cd backend
# Make sure you have the requirements installed: pip install -r requirements.txt
python3 app.py
```
*(Runs on port 5000)*

### 2. Frontend (Terminal 2)
```bash
cd frontend
# Make sure you have npm modules installed: npm install
npm run dev
```
*(Runs on port 5173)*
