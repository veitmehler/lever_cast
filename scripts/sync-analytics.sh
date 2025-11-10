#!/bin/bash

# Script to manually sync analytics for published posts
# Usage: ./scripts/sync-analytics.sh

# Get the base URL (defaults to localhost:3000)
BASE_URL="${BASE_URL:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/posts/sync-analytics"

echo "🔄 Syncing analytics for published posts..."
echo "📍 Endpoint: ${ENDPOINT}"
echo ""

# Check if CRON_SECRET is set
if [ -n "$CRON_SECRET" ]; then
  echo "🔐 Using CRON_SECRET for authentication"
  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer ${CRON_SECRET}" "${ENDPOINT}")
else
  echo "⚠️  No CRON_SECRET set - using unauthenticated request (works in development)"
  RESPONSE=$(curl -s -w "\n%{http_code}" "${ENDPOINT}")
fi

# Split response and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo ""
echo "📊 Response (HTTP ${HTTP_CODE}):"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo ""
  echo "✅ Analytics sync completed successfully!"
else
  echo ""
  echo "❌ Analytics sync failed (HTTP ${HTTP_CODE})"
  exit 1
fi

