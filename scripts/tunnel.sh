#!/usr/bin/env bash
# SSH reverse tunnel to VPS for casebridge.live
#
# Routes:
#   casebridge.live     → VPS nginx → SSH tunnel → localhost:5173 (frontend)
#   api.casebridge.live → VPS nginx → SSH tunnel → localhost:8000 (backend)
#
# Make sure both local servers are running first (./scripts/dev.sh)
# Requires: sshpass (apt install sshpass)

set -euo pipefail

VPS_HOST="${CASEBRIDGE_VPS_HOST:-207.246.97.4}"
VPS_USER="${CASEBRIDGE_VPS_USER:-root}"

echo "Starting SSH reverse tunnel → casebridge.live"
echo "  casebridge.live     → localhost:5173"
echo "  api.casebridge.live → localhost:8000"
echo ""
echo "Press Ctrl+C to stop."

ssh -o StrictHostKeyChecking=no -N \
  -R 5173:127.0.0.1:5173 \
  -R 8000:127.0.0.1:8000 \
  "${VPS_USER}@${VPS_HOST}"
