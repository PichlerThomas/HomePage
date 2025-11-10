#!/usr/bin/env python3
"""
HTTP Server with CORS support for Creator Mode
Serves files with proper CORS headers to allow cross-origin requests
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 8080

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow requests from any origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # Custom logging to show CORS requests
        print(f"[{self.address_string()}] {format % args}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"🚀 Server running at http://localhost:{PORT}/")
        print(f"✅ CORS enabled - Creator Mode can be loaded from any website")
        print(f"📁 Serving directory: {os.getcwd()}")
        print(f"\n🔗 Access Creator Mode Launcher:")
        print(f"   http://localhost:{PORT}/creator-mode-launcher.html")
        print(f"\n⏹️  Press Ctrl+C to stop\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")




