import crypto from 'crypto';

export class TokenService {
  // 토큰 생성 (30일 만료)
  static generateToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후
    
    return { token, expiresAt };
  }

  // 토큰 검증
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}