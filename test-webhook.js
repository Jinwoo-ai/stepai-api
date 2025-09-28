const axios = require('axios');

const testWebhook = async () => {
  const webhookUrl = 'https://stepai.app.n8n.cloud/webhook/52c29a19-0d80-4753-a3db-eed322e838c9';
  const token = 'r?35f6M6awEmMrjo=_?iggYa}HKfP=ZVC=hEXcZK+)FM_R0p>6o>xfFLZ!n}c4b@';
  
  const payload = [{
    "eventType": "USER_CREATED",
    "eventTimestamp": new Date().toISOString(),
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
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString()
    }
  }];

  try {
    console.log('웹훅 테스트 시작...');
    console.log('URL:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    console.log('웹훅 전송 성공!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('웹훅 전송 실패:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
};

testWebhook();