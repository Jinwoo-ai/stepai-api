FROM node:18-alpine

WORKDIR /app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 간단 빌드
RUN npm run build:simple

# 포트 설정
EXPOSE $PORT

# 서버 시작
CMD ["npm", "start"]