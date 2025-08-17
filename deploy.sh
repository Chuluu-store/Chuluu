#!/bin/bash

# Chuluu 자동 배포 스크립트
# 사용법: ./deploy.sh

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

echo -e "${BLUE}🚀 Chuluu 배포 시작...${NC}"

# 1. 로컬 빌드 테스트
echo -e "${YELLOW}📦 로컬에서 프로젝트 빌드 테스트 중...${NC}"
yarn build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 로컬 빌드 완료${NC}"
else
    echo -e "${RED}❌ 로컬 빌드 실패${NC}"
    exit 1
fi

# 2. 서버 접속 및 배포
echo -e "${YELLOW}🔗 서버에 접속하여 배포 실행 중...${NC}"

# SSH 명령 결정
if [ -n "$SERVER_PASSWORD" ]; then
    echo -e "${BLUE}🔐 자동 비밀번호 인증으로 서버 접속 중...${NC}"
    SSH_CMD="sshpass -p $SERVER_PASSWORD ssh -o StrictHostKeyChecking=no -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
else
    echo -e "${BLUE}🔑 SSH 키 인증으로 서버 접속 중...${NC}"
    SSH_CMD="ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
fi

# 서버에서 실행할 스크립트 작성
cat > /tmp/deploy_script.sh << 'SCRIPT_EOF'
set -e

# 환경변수 받기
SERVER_PATH="$1"
MONGODB_URI="$2"
UPLOAD_PATH="$3"
MAX_FILE_SIZE="$4"
NODE_ENV="$5"
SERVER_HOST="$6"
PROJECT_NAME="$7"

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🖥️  서버 배포 시작...${NC}"

# 프로젝트 디렉토리로 이동
cd $SERVER_PATH

echo -e "${YELLOW}📥 최신 코드 가져오는 중...${NC}"
git fetch origin
git reset --hard origin/main
git clean -fd

echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
# 기존 파일들 정리
rm -rf node_modules yarn.lock package-lock.json

# Yarn 사용해서 의존성 설치
yarn install --production=false

echo -e "${YELLOW}🔡 폰트 파일 확인 중...${NC}"
# 폰트 디렉토리 생성
mkdir -p public/fonts

# Inter 폰트 다운로드 (파일이 없거나 크기가 작을 때만)
cd public/fonts

if [ ! -f "Inter-Regular.woff2" ] || [ $(stat -f%z "Inter-Regular.woff2" 2>/dev/null || echo 0) -lt 20000 ]; then
  echo "Inter-Regular.woff2 다운로드 중..."
  curl -o "Inter-Regular.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
fi

if [ ! -f "Inter-Medium.woff2" ] || [ $(stat -f%z "Inter-Medium.woff2" 2>/dev/null || echo 0) -lt 20000 ]; then
  echo "Inter-Medium.woff2 다운로드 중..."
  curl -o "Inter-Medium.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2"
fi

if [ ! -f "Inter-SemiBold.woff2" ] || [ $(stat -f%z "Inter-SemiBold.woff2" 2>/dev/null || echo 0) -lt 20000 ]; then
  echo "Inter-SemiBold.woff2 다운로드 중..."
  curl -o "Inter-SemiBold.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiA.woff2"
fi

if [ ! -f "Inter-Bold.woff2" ] || [ $(stat -f%z "Inter-Bold.woff2" 2>/dev/null || echo 0) -lt 20000 ]; then
  echo "Inter-Bold.woff2 다운로드 중..."
  curl -o "Inter-Bold.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2"
fi

cd ../..
echo -e "${GREEN}✅ 폰트 파일 확인 완료${NC}"

echo -e "${YELLOW}📝 환경변수 설정 중...${NC}"
# .env.local 파일 생성
cat > .env.local << EOF
MONGODB_URI=$MONGODB_URI
UPLOAD_PATH=$UPLOAD_PATH
MAX_FILE_SIZE=$MAX_FILE_SIZE
NODE_ENV=$NODE_ENV
NEXT_PUBLIC_APP_URL=https://$SERVER_HOST
EOF

echo -e "${YELLOW}🏗️  프로덕션 빌드 중...${NC}"
yarn build

echo -e "${YELLOW}🚚 애플리케이션 배포 중...${NC}"

# PM2로 기존 프로세스 중지
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# PM2로 Next.js 서버 시작 (포트 3000)
cd .next/standalone
pm2 start server.js --name $PROJECT_NAME

# PM2 상태 확인
echo -e "${YELLOW}🔍 PM2 상태 확인 중...${NC}"
pm2 status $PROJECT_NAME

# 몇 초 대기 후 앱 시작 확인
echo -e "${YELLOW}⏳ 애플리케이션 시작 대기 중...${NC}"
sleep 5

# 포트 3000에서 실행 중인지 확인
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 애플리케이션이 정상적으로 시작되었습니다!${NC}"
else
    echo -e "${RED}❌ 애플리케이션 시작에 문제가 있습니다. PM2 로그를 확인하세요.${NC}"
    pm2 logs $PROJECT_NAME --lines 10
    exit 1
fi

pm2 save

echo -e "${GREEN}✅ 서버 배포 완료!${NC}"
echo -e "${BLUE}🌐 https://$SERVER_HOST 에서 확인하세요${NC}"
SCRIPT_EOF

# 스크립트를 서버로 전송하고 실행
if [ -n "$SERVER_PASSWORD" ]; then
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/deploy_script.sh $SERVER_USER@$SERVER_HOST:/tmp/
else
    scp -o StrictHostKeyChecking=no /tmp/deploy_script.sh $SERVER_USER@$SERVER_HOST:/tmp/
fi

$SSH_CMD "chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh '$SERVER_PATH' '$MONGODB_URI' '$UPLOAD_PATH' '$MAX_FILE_SIZE' '$NODE_ENV' '$SERVER_HOST' '$PROJECT_NAME'"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 배포가 성공적으로 완료되었습니다!${NC}"
    echo -e "${BLUE}🌐 https://$SERVER_HOST${NC}"
    
    # 브라우저에서 자동으로 열기 (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "https://$SERVER_HOST"
    fi
else
    echo -e "${RED}❌ 배포 중 오류가 발생했습니다.${NC}"
    exit 1
fi

# 임시 파일 정리
rm -f /tmp/deploy_script.sh