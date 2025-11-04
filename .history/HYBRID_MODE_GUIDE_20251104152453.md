# 🚀 ScriptStudio 하이브리드 모드 완벽 가이드

## 🎯 핵심 개념

ScriptStudio는 **오프라인 우선 (Offline-First)** 아키텍처를 사용합니다:

- **오프라인 모드**: 100% 로컬 IndexedDB만 사용 (네트워크 불필요)
- **온라인 모드**: Supabase 백엔드 + 로컬 캐싱 + 자동 동기화

---

## 📋 설정 방법

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: scriptstudio
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: 가까운 지역 선택 (예: Northeast Asia - Seoul)
4. "Create new project" 클릭 (약 2분 소요)

### 2단계: 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 클릭
2. "New query" 클릭
3. `supabase-schema.sql` 파일 내용 전체 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭 (Ctrl/Cmd + Enter)
6. ✅ "Success" 메시지 확인

### 3단계: API 키 복사

1. Supabase 대시보드에서 **Settings** → **API** 클릭
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4단계: 환경 변수 설정

`.env.local` 파일 수정:

```bash
# Supabase 설정 (복사한 값으로 교체)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 온라인 모드 활성화
VITE_OFFLINE_MODE=false
```

### 5단계: 개발 서버 재시작

```bash
# 서버 중지 (Ctrl + C)
# 서버 재시작
npm run dev
```

---

## ✅ 동작 확인

### 브라우저 콘솔에서 확인

개발자 도구 (F12) → Console 탭:

```
🌐 온라인 모드 활성화 (Supabase + 오프라인 지원)
```

위 메시지가 보이면 성공! ✨

### 오프라인 모드로 확인하려면

```
📦 로컬 전용 모드 활성화
```

---

## 🔄 모드 전환 방법

### 방법 1: 환경 변수 수정 (영구적)

`.env.local` 파일에서:

```bash
# 오프라인 모드
VITE_OFFLINE_MODE=true

# 온라인 모드
VITE_OFFLINE_MODE=false
```

서버 재시작 필요

### 방법 2: 런타임 전환 (즉시)

브라우저 콘솔에서:

```javascript
// 오프라인 모드로 전환
window.__scriptstudio_offline_set(true)

// 온라인 모드로 전환
window.__scriptstudio_offline_set(false)

// 현재 모드 확인
window.__scriptstudio_offline_get() // true or false
```

페이지가 자동으로 새로고침됩니다.

---

## 🧪 테스트 시나리오

### 시나리오 1: 온라인 모드 기본 동작

1. ✅ `.env.local`에서 `VITE_OFFLINE_MODE=false` 설정
2. ✅ 앱 시작
3. ✅ 새 프로젝트 생성
4. ✅ 새 노트 작성
5. ✅ Supabase 대시보드에서 데이터 확인:
   - **Table Editor** → `projects` 테이블
   - **Table Editor** → `notes` 테이블
6. ✅ 데이터가 있으면 성공!

### 시나리오 2: 오프라인 → 온라인 동기화

1. ✅ 온라인 모드에서 노트 생성
2. ✅ 개발자 도구 (F12) → Network 탭
3. ✅ "Offline" 체크박스 활성화 (네트워크 차단)
4. ✅ 새 노트 작성 (로컬에만 저장됨)
5. ✅ Console에 `⚠️ 생성 실패, 동기화 큐에 추가` 메시지 확인
6. ✅ "Offline" 체크박스 비활성화 (네트워크 복원)
7. ✅ 페이지 새로고침
8. ✅ Supabase에 노트가 동기화되었는지 확인

### 시나리오 3: 완전 오프라인 모드

1. ✅ `.env.local`에서 `VITE_OFFLINE_MODE=true` 설정
2. ✅ 앱 시작
3. ✅ 노트 생성/수정/삭제
4. ✅ IndexedDB에만 저장 (네트워크 요청 없음)
5. ✅ Supabase에 데이터 없음 (정상)

---

## 📊 데이터 흐름 이해하기

### 온라인 모드 (VITE_OFFLINE_MODE=false)

```
사용자 작업
    ↓
로컬 IndexedDB 저장 (즉시, UX 개선)
    ↓
Supabase API 호출 시도
    ↓
성공? → 로컬 업데이트 (sync_status: synced)
실패? → 동기화 큐에 추가 (sync_status: pending)
    ↓
온라인 복귀 시 자동 동기화
```

### 오프라인 모드 (VITE_OFFLINE_MODE=true)

```
사용자 작업
    ↓
로컬 IndexedDB 저장
    ↓
끝 (네트워크 요청 없음)
```

---

## 🔍 디버깅

### Supabase 연결 확인

브라우저 콘솔에서:

```javascript
// Supabase 클라이언트 테스트
const { supabase } = await import('./src/lib/supabase-client.js')
const { data, error } = await supabase.from('notes').select('*')

if (error) {
  console.error('❌ 연결 실패:', error)
} else {
  console.log('✅ 연결 성공:', data)
}
```

### 로컬 캐시 확인

1. 개발자 도구 (F12)
2. **Application** 탭 (Chrome) / **Storage** 탭 (Firefox)
3. IndexedDB → `scriptstudio-offline`
4. 각 테이블 확인:
   - `notes`
   - `projects`
   - `folders`
   - `sync_queue` (동기화 대기 중인 작업)

### 동기화 큐 확인

브라우저 콘솔에서:

```javascript
const { localDB } = await import('./src/db/localDB.js')
const queue = await localDB.getSyncQueue()
console.log('동기화 대기 중:', queue)
```

---

## ⚠️ 일반적인 문제 해결

### 1. "Failed to fetch" 에러

**원인**: Supabase URL 또는 API 키가 잘못됨

**해결**:
1. `.env.local` 파일 확인
2. Supabase 대시보드에서 API 키 다시 복사
3. 서버 재시작

### 2. "Row Level Security" 에러

**원인**: RLS 정책이 없거나 사용자 인증 실패

**해결**:
1. `supabase-schema.sql` 전체 실행 확인
2. 사용자 로그인 확인
3. Supabase 대시보드 → Authentication 확인

### 3. 데이터가 동기화되지 않음

**원인**: 동기화 매니저가 시작되지 않음

**해결**:
```javascript
// 콘솔에서 수동 동기화 실행
const { syncManager } = await import('./src/sync/syncManager.js')
await syncManager.sync()
```

### 4. "Table does not exist" 에러

**원인**: 데이터베이스 스키마가 생성되지 않음

**해결**:
1. Supabase SQL Editor에서 `supabase-schema.sql` 다시 실행
2. "Success" 메시지 확인
3. Table Editor에서 테이블 존재 확인

---

## 📈 성능 최적화

### 로컬 캐시 우선 전략

온라인 모드에서도 로컬 캐시를 먼저 확인하여 빠른 응답:

```javascript
// offlineWrapper.js에서 자동 처리됨
1. 로컬 캐시 확인 → 즉시 표시
2. 백그라운드에서 서버 동기화
3. 업데이트된 데이터로 UI 갱신
```

### IndexedDB 정기 정리

```javascript
// 30일 이상 된 sync_status: 'synced' 데이터 삭제
const { localDB } = await import('./src/db/localDB.js')
await localDB.cleanOldData(30) // 30일
```

---

## 🎓 추가 학습 자료

### Supabase 공식 문서
- [Supabase 시작하기](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

### 오프라인 우선 패턴
- [Offline First Design Pattern](https://offlinefirst.org/)
- [Progressive Web Apps (PWA)](https://web.dev/progressive-web-apps/)

---

## 🚦 체크리스트

### 초기 설정
- [ ] Supabase 프로젝트 생성
- [ ] `supabase-schema.sql` 실행
- [ ] `.env.local` 파일 설정
- [ ] 서버 재시작
- [ ] 브라우저 콘솔에서 모드 확인

### 기능 테스트
- [ ] 온라인 모드에서 노트 생성
- [ ] Supabase에 데이터 저장 확인
- [ ] 오프라인 시 로컬 저장 확인
- [ ] 온라인 복귀 시 자동 동기화 확인
- [ ] 오프라인 모드 전환 확인

### 프로덕션 준비
- [ ] 환경 변수 프로덕션 설정
- [ ] Supabase RLS 정책 확인
- [ ] 백업 전략 수립
- [ ] 에러 로깅 설정

---

## 🎉 축하합니다!

이제 ScriptStudio가 **완벽한 하이브리드 모드**로 작동합니다!

- ✅ 오프라인에서도 모든 기능 사용 가능
- ✅ 온라인 시 자동 동기화
- ✅ 빠른 로컬 캐시 응답
- ✅ 데이터 손실 방지

---

**작성일**: 2025년 11월 4일  
**버전**: 2.0  
**작성자**: GitHub Copilot
