FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# public/assets 디렉토리 생성 및 권한 설정
RUN mkdir -p public/assets/categories public/assets/companies public/assets/ai-services && \
    chmod -R 755 public/assets

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"] 