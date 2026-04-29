#!/bin/bash

# stop.sh - Stops both the backend and frontend of the Feature Model Studio

echo "Stopping Feature Model Studio..."

# Try stopping by PID file first
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    echo "Killing Backend (PID $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    echo "Killing Frontend (PID $FRONTEND_PID)..."
    # Killing the npm process also needs to kill the vite subprocess
    pkill -P $FRONTEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    rm .frontend.pid
fi

# Fallback: kill anything running on the specific ports
echo "Cleaning up lingering processes on ports 5000 and 5173..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "✅ Application stopped."
