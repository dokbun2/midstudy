#!/bin/bash

# GitHub 저장소 URL을 여기에 입력하세요
# 예: https://github.com/yourusername/midjourney-prompt-builder.git
REPO_URL="YOUR_GITHUB_REPO_URL"

# Remote origin 추가
git remote add origin $REPO_URL

# Main 브랜치로 푸시
git push -u origin main

echo "✅ GitHub에 성공적으로 배포되었습니다!"
echo "🌐 GitHub Pages를 활성화하려면:"
echo "1. GitHub 저장소 Settings로 이동"
echo "2. Pages 섹션에서 Source를 'Deploy from a branch' 선택"
echo "3. Branch를 'main' 선택하고 '/ (root)' 선택"
echo "4. Save 클릭"