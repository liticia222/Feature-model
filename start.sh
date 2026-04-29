#!/bin/bash

# start.sh - Starts both the backend and frontend of the Feature Model Studio

echo "Starting Feature Model Studio..."

# Stop any existing instances first
./stop.sh 2>/dev/null

echo "Starting Backend (Flask on port 5000)..."
cd backend
# Start in background, appending logs to backend.log
python3 app.py > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Starting Frontend (Vite on port 5173)..."
cd frontend
# Start in background, appending logs to frontend.log
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Save PIDs for the stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "=================================================="
echo "✅ Feature Model Studio is running!"
echo "👉 Application URL: http://localhost:5173"
echo "👉 Backend API URL: http://localhost:5000"
echo "=================================================="
echo "Use './stop.sh' to stop the application."
