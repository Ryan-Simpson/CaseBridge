#!/usr/bin/env bash
# Start the Cloudflare Tunnel for casebridge.live
# Requires: ~/cloudflared binary + ~/.cloudflared/config.yml
#
# This tunnels:
#   casebridge.live     → localhost:5173 (frontend)
#   api.casebridge.live → localhost:8000 (backend)
#
# Make sure both servers are running first (./scripts/dev.sh)

set -euo pipefail

if [ ! -f "$HOME/cloudflared" ]; then
    echo "cloudflared not found. Install with:"
    echo "  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/cloudflared && chmod +x ~/cloudflared"
    exit 1
fi

echo "Starting Cloudflare Tunnel → casebridge.live"
echo "  casebridge.live     → http://127.0.0.1:5173"
echo "  api.casebridge.live → http://127.0.0.1:8000"
echo ""

~/cloudflared tunnel run
