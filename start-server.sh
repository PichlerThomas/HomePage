#!/bin/bash
# Start HTTP server with CORS support

cd "$(dirname "$0")"

echo "🚀 Starting Creator Mode Server with CORS support..."
echo ""

# Kill any existing server on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start the CORS-enabled server
python3 server-with-cors.py




