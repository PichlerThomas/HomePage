#!/bin/bash
# Start local HTTP server for development
# Usage: ./start-local-server.sh [PORT]

PORT=${1:-8000}
DIR=$(dirname "$0")

echo "Starting local HTTP server on port $PORT..."
echo "Serving directory: $DIR"
echo ""
echo "Access the site at: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$DIR"
python3 -m http.server "$PORT"

