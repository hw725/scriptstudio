# 🚀 ScriptStudio 배포 가이드 (GitHub + Vercel)

## 📋 배포 개요

이 가이드는 ScriptStudio를 GitHub에 푸시하고 Vercel에 배포하는 과정을 설명합니다.

### 배포 후 가능한 것들

✅ **다중 기기 지원**
- 데스크톱, 노트북, 태블릿에서 동일한 데이터 접근
- 로그인하면 모든 기기에서 동기화

✅ **오프라인/온라인 하이브리드**
- 각 기기에서 독립적으로 오프라인 모드 설정 가능
- 온라인 모드 시 Supabase를 통해 실시간 동기화

✅ **URL 공유**
- 팀원들에게 URL 공유 가능
- 각자 자신의 계정으로 데이터 관리

---

## 🎯 배포 흐름

```
로컬 개발
    ↓
GitHub 푸시
    ↓
Vercel 배포
    ↓
URL 생성 (예: scriptstudio.vercel.app)
    ↓
다른 기기에서도 접속 가능!
```

---

## 📝 사전 준비

### 1. Supabase 설정 완료 확인

✅ Supabase 프로젝트 생성됨  
✅ `supabase-schema.sql` 실행됨  
✅ `.env.local`에 API 키 설정됨

### 2. 로컬에서 테스트

```bash
npm run dev
```

브라우저에서 정상 작동 확인:
- 노트 생성/수정/삭제
- Supabase Table Editor에서 데이터 확인

---

## 🔐 1단계: 환경 변수 정리

### `.env.local` (로컬 개발용)

이 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함).

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 오프라인 모드
VITE_OFFLINE_MODE=false
```

### `.env.example` 생성됨 ✅

다른 개발자를 위한 템플릿이 생성되었습니다.

---

## 🐙 2단계: GitHub에 푸시

### 1. Git 상태 확인

```bash
git status
```

### 2. 변경사항 스테이징

```bash
# 모든 파일 추가
git add .

# 또는 선택적으로 추가
git add src/
git add supabase-schema.sql
git add HYBRID_MODE_GUIDE.md
git add QUICK_START.md
git add .env.example
```

### 3. 커밋

```bash
git commit -m "feat: 하이브리드 모드 구현 - 오프라인/온라인 지원"
```

**커밋 메시지 예시:**

```bash
git commit -m "feat: 하이브리드 모드 구현

- Supabase 온라인 클라이언트 추가
- 오프라인 래퍼 구현 (캐싱 + 동기화)
- 데이터베이스 스키마 추가 (RLS 포함)
- 완벽한 가이드 문서 작성
- 다중 기기 지원 준비 완료"
```

### 4. 원격 저장소 확인

```bash
# 원격 저장소 확인
git remote -v

# 없으면 추가
git remote add origin https://github.com/your-username/scriptstudio.git
```

### 5. 푸시

```bash
# main 브랜치에 푸시
git push origin main

# 또는 첫 푸시인 경우
git push -u origin main
```

---

## 🚀 3단계: Vercel 배포

### 방법 1: Vercel Dashboard (추천)

#### 1. Vercel 로그인

1. [vercel.com](https://vercel.com) 접속
2. GitHub 계정으로 로그인

#### 2. 새 프로젝트 생성

1. **"Add New..."** → **"Project"** 클릭
2. **Import Git Repository** 섹션에서 `scriptstudio` 선택
3. **"Import"** 클릭

#### 3. 프로젝트 설정

**Framework Preset:** Vite (자동 감지됨)

**Root Directory:** `./` (기본값)

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```bash
dist
```

**Install Command:**
```bash
npm install
```

#### 4. 환경 변수 설정 ⭐ 중요!

**Environment Variables** 섹션에서 추가:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (전체 키) |
| `VITE_OFFLINE_MODE` | `false` |

**주의사항:**
- Supabase 대시보드에서 정확히 복사
- `VITE_` 접두사 필수
- 각 환경(Production, Preview, Development)에 모두 적용

#### 5. 배포 시작

**"Deploy"** 버튼 클릭!

⏱️ 배포 시간: 약 2-3분

---

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 환경 변수 추가
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_OFFLINE_MODE

# 프로덕션 배포
vercel --prod
```

---

## ✅ 4단계: 배포 확인

### 1. 배포 완료

Vercel에서 배포가 완료되면:

```
✅ Production: Ready
🌐 https://scriptstudio.vercel.app
```

### 2. 사이트 접속

1. 생성된 URL 클릭
2. 브라우저 콘솔 (F12) 열기
3. 다음 메시지 확인:

```
🌐 온라인 모드 활성화 (Supabase + 오프라인 지원)
```

### 3. 기능 테스트

✅ 새 프로젝트 생성  
✅ 노트 작성  
✅ Supabase Table Editor에서 데이터 확인  
✅ 페이지 새로고침 후 데이터 유지  

---

## 🌐 5단계: 다중 기기 설정

### 시나리오: 집 PC + 회사 노트북

#### 기기 1: 집 PC (이미 설정됨)

```
✅ Vercel URL로 접속
✅ Supabase 계정으로 로그인
✅ 노트 작성
```

#### 기기 2: 회사 노트북

```
1. Vercel URL로 접속
   → https://scriptstudio.vercel.app

2. Supabase 계정으로 로그인
   (동일한 계정 사용!)

3. 기기 1에서 작성한 노트가 자동으로 표시됨!
```

### 각 기기별 모드 설정

#### 집 PC - 온라인 모드 (기본)

```javascript
// 브라우저 콘솔에서
window.__scriptstudio_offline_get()  // false (온라인)
```

#### 회사 노트북 - 오프라인 모드로 전환

```javascript
// 브라우저 콘솔에서
window.__scriptstudio_offline_set(true)  // 오프라인 모드
```

✅ **각 기기마다 독립적으로 설정 가능!**

---

## 🔄 6단계: 동기화 시나리오

### 시나리오 1: 온라인 → 온라인

```
기기 1 (온라인)
    ↓ 노트 작성
Supabase 저장
    ↓ 실시간 동기화
기기 2 (온라인)
    ↓ 페이지 새로고침
노트 자동 표시 ✅
```

### 시나리오 2: 오프라인 → 온라인

```
기기 1 (오프라인)
    ↓ 노트 작성
로컬 IndexedDB 저장
    ↓ 온라인 모드 전환
동기화 큐 처리
    ↓
Supabase 업로드
    ↓
기기 2 (온라인)
    ↓ 페이지 새로고침
노트 표시 ✅
```

### 시나리오 3: 혼합 사용

```
기기 1: 오프라인 모드 (집)
    - 로컬에만 저장
    - 빠른 응답
    - 인터넷 불필요

기기 2: 온라인 모드 (회사)
    - Supabase 동기화
    - 다른 기기와 공유
    - 백업 자동
```

---

## 🔧 7단계: 도메인 설정 (선택사항)

### Vercel 커스텀 도메인

1. Vercel 대시보드 → **Settings** → **Domains**
2. 도메인 추가:
   ```
   scriptstudio.yourdomain.com
   ```
3. DNS 설정 (도메인 제공업체에서):
   ```
   Type: CNAME
   Name: scriptstudio
   Value: cname.vercel-dns.com
   ```
4. ✅ 도메인 연결 완료!

---

## 🐛 문제 해결

### 1. Vercel 빌드 실패

**에러:** `Module not found`

**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build

# package.json 확인
npm install
```

### 2. 환경 변수가 작동하지 않음

**증상:** 콘솔에 "오프라인 모드" 메시지

**해결:**
1. Vercel 대시보드 → **Settings** → **Environment Variables**
2. `VITE_` 접두사 확인
3. **Production** 환경에 적용 확인
4. **Redeploy** 버튼 클릭

### 3. Supabase 연결 실패

**에러:** `Failed to fetch`

**해결:**
1. Supabase URL 확인 (https:// 포함)
2. anon key 전체 복사 확인
3. Supabase 프로젝트가 일시 중지되지 않았는지 확인

### 4. 다른 기기에서 데이터 안 보임

**원인:** 다른 Supabase 계정 사용

**해결:**
- 동일한 Supabase 계정으로 로그인
- 또는 Supabase 인증 구현 (추후 단계)

---

## 📊 배포 후 모니터링

### Vercel Analytics

1. Vercel 대시보드 → **Analytics**
2. 방문자 수, 페이지뷰 확인

### Supabase Monitoring

1. Supabase 대시보드 → **Database** → **Usage**
2. API 요청 수, 저장 공간 확인

---

## 🔄 업데이트 배포

### 코드 수정 후

```bash
# 로컬에서 테스트
npm run dev

# 커밋 & 푸시
git add .
git commit -m "fix: 버그 수정"
git push origin main
```

✅ **Vercel이 자동으로 재배포!**

---

## 🎓 추가 기능

### 1. Supabase 인증 추가 (추천)

다른 사용자들이 각자의 계정으로 사용할 수 있게:

```javascript
// 회원가입
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// 로그인
const { user, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### 2. PWA (Progressive Web App) 변환

오프라인 앱처럼 사용:

```bash
npm install vite-plugin-pwa
```

### 3. 자동 백업

Supabase 대시보드 → **Database** → **Backups**

---

## ✅ 배포 체크리스트

### GitHub 푸시 전
- [ ] `.env.local`에 올바른 API 키 설정
- [ ] `.env.example` 파일 생성
- [ ] `.gitignore`에 `.env.local` 포함 확인
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] Supabase 테이블 생성 완료

### Vercel 배포 중
- [ ] 올바른 GitHub 저장소 선택
- [ ] Framework Preset: Vite 확인
- [ ] 환경 변수 3개 추가 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OFFLINE_MODE`)
- [ ] Production 환경에 적용 확인

### 배포 완료 후
- [ ] URL 접속 테스트
- [ ] 브라우저 콘솔에서 "온라인 모드" 메시지 확인
- [ ] 노트 생성/수정 테스트
- [ ] Supabase Table Editor에서 데이터 확인
- [ ] 다른 기기에서 접속 테스트

---

## 🎉 축하합니다!

이제 ScriptStudio가:

✅ GitHub에 백업됨  
✅ Vercel에 배포됨  
✅ 전 세계 어디서나 접속 가능  
✅ 다중 기기 동기화 지원  
✅ 오프라인/온라인 하이브리드 모드  

**완벽한 클라우드 앱이 되었습니다! 🚀**

---

## 📚 관련 문서

- [QUICK_START.md](./QUICK_START.md) - Supabase 설정
- [HYBRID_MODE_GUIDE.md](./HYBRID_MODE_GUIDE.md) - 하이브리드 모드 가이드
- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)

---

**작성일**: 2025년 11월 4일  
**작성자**: GitHub Copilot  
**버전**: 1.0
