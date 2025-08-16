#!/bin/bash

# Chuluu 빠른 배포 스크립트 (Git 커밋 없이)
# 사용법: ./deploy-quick.sh

set -e  # 오류 발생시 즉시 종료

# 환경 변수 로드
if [ -f ".deploy.env" ]; then
    source .deploy.env
fi

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚡ Chuluu 빠른 배포 시작... (Git 커밋 건너뛰기)${NC}"

# 1. 로컬 빌드
echo -e "${YELLOW}📦 로컬에서 프로젝트 빌드 중...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 로컬 빌드 완료${NC}"
else
    echo -e "${RED}❌ 로컬 빌드 실패${NC}"
    exit 1
fi

# 2. 서버 접속 및 배포 (Git 없이 현재 로컬 코드 직접 복사)
echo -e "${YELLOW}🔗 서버에 직접 파일 전송 및 배포 중...${NC}"

# 로컬의 현재 코드를 서버에 직접 복사
if [ -n "$SERVER_PASSWORD" ]; then
    echo -e "${BLUE}🔐 자동 비밀번호 인증으로 rsync 실행 중...${NC}"
    sshpass -p "$SERVER_PASSWORD" rsync -avz -e "ssh -o StrictHostKeyChecking=no" --exclude=node_modules --exclude=.git --exclude=.next --exclude=out \
        ./ $SERVER_USER@$SERVER_HOST:$SERVER_HOME/$PROJECT_NAME-temp/
else
    echo -e "${BLUE}🔑 SSH 키 인증으로 rsync 실행 중...${NC}"
    rsync -avz --exclude=node_modules --exclude=.git --exclude=.next --exclude=out \
        ./ $SERVER_USER@$SERVER_HOST:$SERVER_HOME/$PROJECT_NAME-temp/
fi

# SSH 자동 비밀번호 입력
if [ -n "$SERVER_PASSWORD" ]; then
    echo -e "${BLUE}🔐 자동 비밀번호 인증으로 서버 접속 중...${NC}"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
else
    echo -e "${BLUE}🔑 SSH 키 인증으로 서버 접속 중...${NC}"
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
fi
set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🖥️  서버 빠른 배포 시작...${NC}"

# 임시 디렉토리에서 실제 디렉토리로 이동
if [ -d "$SERVER_PATH" ]; then
    rm -rf $SERVER_PATH.backup
    mv $SERVER_PATH $SERVER_PATH.backup
fi

mv $SERVER_HOME/$PROJECT_NAME-temp $SERVER_PATH
cd $SERVER_PATH

echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
npm ci

echo -e "${YELLOW}🏗️  프로덕션 빌드 중...${NC}"
npm run build

echo -e "${YELLOW}🚚 Next.js 애플리케이션 배포 중...${NC}"

# PM2로 기존 프로세스 중지
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# 환경변수 파일 생성 및 복사
echo -e "${YELLOW}📝 환경변수 파일 설정 중...${NC}"

# .env.production 파일 생성 (서버용 - 환경변수에서 가져옴)
cat > $SERVER_PATH/.env.production << EOF
# MongoDB
MONGODB_URI=$MONGODB_URI

# File Upload
UPLOAD_PATH=$UPLOAD_PATH
MAX_FILE_SIZE=$MAX_FILE_SIZE

# App Configuration
NODE_ENV=$NODE_ENV
NEXT_PUBLIC_APP_URL=https://$SERVER_HOST
EOF

# standalone 디렉토리로 환경변수 파일 복사
if [ -f "$SERVER_PATH/.env.local" ]; then
    cp $SERVER_PATH/.env.local $SERVER_PATH/.next/standalone/
fi
if [ -f "$SERVER_PATH/.env.production" ]; then
    cp $SERVER_PATH/.env.production $SERVER_PATH/.next/standalone/
fi

# PM2로 Next.js 서버 시작 (포트 3000)
cd $SERVER_PATH/.next/standalone
pm2 start server.js --name $PROJECT_NAME

pm2 save

echo -e "${GREEN}✅ 빠른 배포 완료!${NC}"
echo -e "${BLUE}🌐 https://$SERVER_HOST 에서 확인하세요${NC}"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 빠른 배포가 성공적으로 완료되었습니다!${NC}"
    echo -e "${BLUE}🌐 https://$SERVER_HOST${NC}"
    
    # 브라우저에서 자동으로 열기 (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "https://$SERVER_HOST"
    fi
else
    echo -e "${RED}❌ 배포 중 오류가 발생했습니다.${NC}"
    exit 1
fi