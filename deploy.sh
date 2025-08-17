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

# 1. 로컬 빌드
echo -e "${YELLOW}📦 로컬에서 프로젝트 빌드 중...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 로컬 빌드 완료${NC}"
else
    echo -e "${RED}❌ 로컬 빌드 실패${NC}"
    exit 1
fi

# 2. Git 커밋 및 푸시 (선택사항)
echo -e "${YELLOW}📝 Git 변경사항 확인 중...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}💾 변경사항이 있습니다.${NC}"
    echo "Git에 커밋하고 푸시하시겠습니까? (y/n/skip) [기본값: skip]: "
    read -t 10 git_choice || git_choice="skip"
    
    case $git_choice in
        y|Y|yes|YES)
            echo -e "${YELLOW}💾 변경사항을 Git에 커밋 중...${NC}"
            git add .
            echo "배포 커밋 메시지를 입력하세요 (엔터시 기본 메시지): "
            read commit_message
            if [ -z "$commit_message" ]; then
                commit_message="🚀 자동 배포 $(date '+%Y-%m-%d %H:%M:%S')"
            fi
            git commit -m "$commit_message"
            git push origin $GIT_BRANCH
            echo -e "${GREEN}✅ Git 푸시 완료${NC}"
            ;;
        n|N|no|NO)
            echo -e "${BLUE}ℹ️  Git 커밋 없이 배포를 계속합니다${NC}"
            ;;
        *)
            echo -e "${BLUE}ℹ️  Git 커밋 건너뛰기 (10초 타임아웃)${NC}"
            ;;
    esac
else
    echo -e "${GREEN}✅ 변경사항 없음 - Git 푸시 스킵${NC}"
fi

# 3. 서버 접속 및 배포
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
SERVER_HOME="$2"
PROJECT_NAME="$3"
REPO_URL="$4"
GIT_BRANCH="$5"
NGINX_SITES_PATH="$6"
SSL_CERT_PATH="$7"
SERVER_HOST="$8"

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🖥️  서버 배포 시작...${NC}"

# 프로젝트 디렉토리로 이동 또는 클론
if [ -d "$SERVER_PATH" ]; then
    echo -e "${YELLOW}📁 기존 프로젝트 업데이트 중...${NC}"
    cd $SERVER_PATH
    git fetch origin
    git reset --hard origin/$GIT_BRANCH
    git clean -fd
else
    echo -e "${YELLOW}📥 프로젝트 클론 중...${NC}"
    cd $SERVER_HOME
    git clone $REPO_URL $PROJECT_NAME
    cd $PROJECT_NAME
fi

echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
# 기존 node_modules 제거 (의존성 충돌 방지)
rm -rf node_modules package-lock.json
npm install --production=false

echo -e "${YELLOW}🔡 Google Fonts 다운로드 중...${NC}"
# Inter 폰트 다운로드
mkdir -p public/fonts
cd public/fonts

# Inter Regular
if [ ! -f "Inter-Regular.woff2" ]; then
  curl -o "Inter-Regular.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
fi

# Inter Medium
if [ ! -f "Inter-Medium.woff2" ]; then
  curl -o "Inter-Medium.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2"
fi

# Inter SemiBold
if [ ! -f "Inter-SemiBold.woff2" ]; then
  curl -o "Inter-SemiBold.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiA.woff2"
fi

# Inter Bold
if [ ! -f "Inter-Bold.woff2" ]; then
  curl -o "Inter-Bold.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKfAZ9hiA.woff2"
fi

cd ../..
echo -e "${GREEN}✅ Google Fonts 다운로드 완료${NC}"

echo -e "${YELLOW}🏗️  프로덕션 빌드 중...${NC}"
npm run build

echo -e "${YELLOW}🚚 Next.js 애플리케이션 배포 중...${NC}"

# PM2로 기존 프로세스 중지
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# 환경변수 파일 생성 및 복사
echo -e "${YELLOW}📝 환경변수 파일 설정 중...${NC}"

# .env.production 파일 생성 (서버용 - 환경변수에서 가져옴)
cat > .env.production << EOF
# MongoDB
MONGODB_URI=\$MONGODB_URI

# File Upload
UPLOAD_PATH=\$UPLOAD_PATH
MAX_FILE_SIZE=\$MAX_FILE_SIZE

# App Configuration
NODE_ENV=\$NODE_ENV
NEXT_PUBLIC_APP_URL=https://\$SERVER_HOST
EOF

# standalone 디렉토리로 환경변수 파일 복사
if [ -f ".env.local" ]; then
    cp .env.local .next/standalone/
fi
if [ -f ".env.production" ]; then
    cp .env.production .next/standalone/
fi

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
fi

echo -e "${YELLOW}🔄 Nginx 설정 업데이트 중...${NC}"
# Nginx 설정 파일 생성 (템플릿에서)
if [ -f "$SERVER_PATH/nginx.conf.template" ]; then
    # 템플릿 파일에서 변수 치환하여 실제 설정 파일 생성
    envsubst '$SERVER_HOST $SSL_CERT_PATH $SERVER_PATH' < $SERVER_PATH/nginx.conf.template > /tmp/nginx_$PROJECT_NAME.conf
    sudo cp /tmp/nginx_$PROJECT_NAME.conf $NGINX_SITES_PATH/$SERVER_HOST
    sudo systemctl reload nginx
    rm -f /tmp/nginx_$PROJECT_NAME.conf
    echo -e "${GREEN}✅ Nginx 설정 업데이트 완료${NC}"
else
    echo -e "${YELLOW}⚠️  nginx.conf.template 파일이 없습니다. Nginx 설정을 건너뜁니다.${NC}"
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
$SSH_CMD "chmod +x /tmp/deploy_script.sh && MONGODB_URI='$MONGODB_URI' UPLOAD_PATH='$UPLOAD_PATH' MAX_FILE_SIZE='$MAX_FILE_SIZE' NODE_ENV='$NODE_ENV' /tmp/deploy_script.sh '$SERVER_PATH' '$SERVER_HOME' '$PROJECT_NAME' '$REPO_URL' '$GIT_BRANCH' '$NGINX_SITES_PATH' '$SSL_CERT_PATH' '$SERVER_HOST'"

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