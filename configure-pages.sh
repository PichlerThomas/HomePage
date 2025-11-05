#!/bin/bash

# GitHub Pages Configuration Script
# Usage: ./configure-pages.sh [GITHUB_TOKEN]
#   or: GITHUB_TOKEN=<token> ./configure-pages.sh

set -e

# Check for token in argument or environment variable
if [ -z "$1" ] && [ -z "$GITHUB_TOKEN" ]; then
    echo "Usage: $0 <GITHUB_TOKEN>"
    echo "   or: GITHUB_TOKEN=<token> $0"
    echo ""
    echo "To create a GitHub Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Give it a name (e.g., 'GitHub Pages Config')"
    echo "4. Select scopes: 'repo' and 'pages'"
    echo "5. Click 'Generate token' and copy it"
    echo ""
    echo "Then run: $0 <your_token>"
    echo "   or: GITHUB_TOKEN=<your_token> $0"
    exit 1
fi

GITHUB_TOKEN="${1:-$GITHUB_TOKEN}"
REPO_OWNER="PichlerThomas"
REPO_NAME="HomePage"

API_BASE="https://api.github.com"
REPO_URL="${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}"

echo "🔍 Checking repository access..."
REPO_INFO=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "${REPO_URL}")

if echo "$REPO_INFO" | grep -q '"message"'; then
    echo "❌ Error accessing repository:"
    echo "$REPO_INFO" | grep -o '"message":"[^"]*"' | head -1
    exit 1
fi

echo "✅ Repository access confirmed"
echo ""

echo "🔍 Checking current GitHub Pages configuration..."
PAGES_URL="${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/pages"
PAGES_INFO=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "${PAGES_URL}")

if echo "$PAGES_INFO" | grep -q '"message"'; then
    echo "⚠️  No Pages configuration found (or error):"
    echo "$PAGES_INFO" | grep -o '"message":"[^"]*"' | head -1
    echo ""
    echo "📝 Configuring GitHub Pages..."
    
    # Configure Pages to use main branch
    CONFIG_RESPONSE=$(curl -s -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -d '{
            "source": {
                "branch": "main",
                "path": "/"
            }
        }' \
        "${PAGES_URL}")
    
    if echo "$CONFIG_RESPONSE" | grep -q '"message"'; then
        echo "❌ Error configuring Pages:"
        echo "$CONFIG_RESPONSE" | grep -o '"message":"[^"]*"' | head -1
        exit 1
    else
        echo "✅ GitHub Pages configured successfully!"
    fi
else
    echo "✅ Current GitHub Pages configuration:"
    echo "$PAGES_INFO" | grep -E '"url"|"html_url"|"source"' | head -5
    echo ""
fi

echo ""
echo "🔍 Verifying Pages status..."
sleep 2
PAGES_INFO=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "${PAGES_URL}")

if echo "$PAGES_INFO" | grep -q '"html_url"'; then
    HTML_URL=$(echo "$PAGES_INFO" | grep -o '"html_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "🌐 Your site should be available at:"
    echo "   $HTML_URL"
    echo ""
    echo "⏳ Note: It may take a few minutes for the site to become active."
else
    echo "⚠️  Pages configuration found but status unclear"
fi

