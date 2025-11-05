#!/bin/bash
# Stop local HTTP server
# Usage: ./stop-local-server.sh [PORT]

PORT=${1:-8000}

echo "Stopping local HTTP server on port $PORT..."

# Find and kill the process
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "No server found running on port $PORT"
    exit 0
fi

kill "$PID" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "Server stopped successfully"
else
    echo "Failed to stop server. Trying force kill..."
    kill -9 "$PID" 2>/dev/null
    echo "Server force stopped"
fi

