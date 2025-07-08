FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# public/assets 디렉토리 생성 및 권한 설정
RUN mkdir -p public/assets/categories public/assets/companies public/assets/ai-services && \
    chmod -R 755 public/assets

# assets 파일들을 명시적으로 복사 (존재하는 경우)
RUN if [ -d "public/assets" ]; then \
      echo "Assets 디렉토리가 존재합니다. 파일을 복사합니다."; \
      ls -la public/assets/; \
      ls -la public/assets/categories/ || echo "categories 디렉토리가 비어있습니다"; \
    else \
      echo "Assets 디렉토리가 존재하지 않습니다."; \
    fi

# 빌드 후 assets 디렉토리 확인
RUN npm run build
RUN echo "빌드 후 assets 디렉토리 확인:" && \
    ls -la public/assets/ || echo "public/assets가 없습니다" && \
    ls -la dist/public/assets/ || echo "dist/public/assets가 없습니다"

EXPOSE 3000

CMD ["npm", "start"] 