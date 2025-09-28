import * as axios from 'axios';

interface UserWebhookData {
  id: number;
  name: string;
  email: string;
  industry?: string;
  jobRole?: string;
  jobLevel?: string;
  experienceYears?: number;
  userType: string;
  userStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface WebhookPayload {
  eventType: string;
  eventTimestamp: string;
  userData: UserWebhookData;
}

export class WebhookService {
  private static readonly TEST_WEBHOOK_URL = 'https://stepai.app.n8n.cloud/webhook-test/52c29a19-0d80-4753-a3db-eed322e838c9';
  private static readonly PROD_WEBHOOK_URL = 'https://stepai.app.n8n.cloud/webhook/52c29a19-0d80-4753-a3db-eed322e838c9';
  private static readonly WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'your-webhook-token';
  
  // 환경에 따른 웹훅 URL 결정
  private static getWebhookUrl(): string {
    const environment = process.env.NODE_ENV || 'development';
    return environment === 'production' ? this.PROD_WEBHOOK_URL : this.TEST_WEBHOOK_URL;
  }

  // 사용자 생성 웹훅 전송
  static async sendUserCreatedWebhook(userData: UserWebhookData): Promise<void> {
    try {
      const payload: WebhookPayload[] = [{
        eventType: 'USER_CREATED',
        eventTimestamp: new Date().toISOString(),
        userData: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry || null,
          jobRole: userData.jobRole || null,
          jobLevel: userData.jobLevel || null,
          experienceYears: userData.experienceYears || null,
          userType: userData.userType,
          userStatus: userData.userStatus,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        }
      }];

      const response = await axios.default.post(this.getWebhookUrl(), payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.WEBHOOK_TOKEN}`
        },
        timeout: 10000 // 10초 타임아웃
      });

      console.log('웹훅 전송 성공:', {
        status: response.status,
        userId: userData.id,
        eventType: 'USER_CREATED'
      });
    } catch (error) {
      console.error('웹훅 전송 실패:', {
        error: error.message,
        userId: userData.id,
        eventType: 'USER_CREATED',
        url: this.getWebhookUrl()
      });
      
      // 웹훅 실패는 회원가입 프로세스를 중단시키지 않음
      // 로그만 남기고 계속 진행
    }
  }

  // 일반적인 웹훅 전송 메서드 (향후 확장용)
  static async sendWebhook(eventType: string, data: any): Promise<void> {
    try {
      const payload = [{
        eventType,
        eventTimestamp: new Date().toISOString(),
        data
      }];

      const response = await axios.default.post(this.getWebhookUrl(), payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.WEBHOOK_TOKEN}`
        },
        timeout: 10000
      });

      console.log('웹훅 전송 성공:', {
        status: response.status,
        eventType
      });
    } catch (error) {
      console.error('웹훅 전송 실패:', {
        error: error.message,
        eventType,
        url: this.getWebhookUrl()
      });
    }
  }
}

export const webhookService = new WebhookService();