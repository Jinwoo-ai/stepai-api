#!/bin/bash

# 테스트 웹훅 URL
TEST_URL="https://stepai.app.n8n.cloud/webhook-test/52c29a19-0d80-4753-a3db-eed322e838c9"

# 프로덕션 웹훅 URL  
PROD_URL="https://stepai.app.n8n.cloud/webhook/52c29a19-0d80-4753-a3db-eed322e838c9"

# 인증 토큰
TOKEN="r?35f6M6awEmMrjo=_?iggYa}HKfP=ZVC=hEXcZK+)FM_R0p>6o>xfFLZ!n}c4b@"

# 현재 시간
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 웹훅 페이로드
PAYLOAD='[
  {
    "eventType": "USER_CREATED",
    "eventTimestamp": "'$TIMESTAMP'",
    "userData": {
      "id": 999,
      "name": "테스트사용자",
      "email": "test@example.com",
      "industry": "IT/Software",
      "jobRole": "Backend Developer",
      "jobLevel": "Senior",
      "experienceYears": 5,
      "userType": "member",
      "userStatus": "active",
      "createdAt": "'$TIMESTAMP'",
      "updatedAt": "'$TIMESTAMP'"
    }
  }
]'

echo "=== 웹훅 테스트 시작 ==="
echo "Timestamp: $TIMESTAMP"
echo "Payload: $PAYLOAD"
echo ""

echo "=== 테스트 URL 시도 ==="
curl -X POST "$TEST_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "=== 프로덕션 URL 시도 ==="
curl -X POST "$PROD_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n" \
  -v