# ⚡ ScriptStudio 빠른 시작 가이드

## 🎯 5분 안에 온라인 모드 활성화하기

### 1️⃣ Supabase 프로젝트 생성 (2분)

1. https://supabase.com 접속 → 로그인
2. "New Project" 클릭
3. 프로젝트 생성:
   ```
   Name: scriptstudio
   Database Password: [안전한 비밀번호]
   Region: Northeast Asia (Seoul)
   ```
4. "Create new project" 클릭 ⏱️ (2분 대기)

---

### 2️⃣ 데이터베이스 설정 (1분)

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. `supabase-schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭 (또는 Ctrl+Enter)
5. ✅ "Success. No rows returned" 확인

---

### 3️⃣ API 키 설정 (1분)

1. 왼쪽 메뉌에서 **Settings** → **API** 클릭
2. 다음 값들 복사:

**Project URL:**
```
https://xxxxx.supabase.co
```

**anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. `.env.local` 파일 열기
4. 복사한 값으로 교체:

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # ← 여기에 붙여넣기
VITE_SUPABASE_ANON_KEY=eyJhbGci...           # ← 여기에 붙여넣기

# 온라인 모드 활성화
VITE_OFFLINE_MODE=false  # ← false로 변경
```

---

### 4️⃣ 서버 재시작 (30초)

터미널에서:

```bash
# Ctrl + C로 서버 중지
# 다시 시작
npm run dev
```

---

### 5️⃣ 동작 확인 (30초)

1. 브라우저 열기: http://localhost:5173
2. F12 → Console 탭
3. 다음 메시지 확인:

```
🌐 온라인 모드 활성화 (Supabase + 오프라인 지원)
```

4. 노트 생성 테스트
5. Supabase 대시보드 → **Table Editor** → `notes` 테이블 확인

✅ **성공!** 이제 온라인 모드로 작동합니다!

---

## 🔄 모드 전환 (즉시)

### 오프라인 모드로 전환

브라우저 콘솔 (F12)에서:

```javascript
window.__scriptstudio_offline_set(true)
```

### 온라인 모드로 전환

```javascript
window.__scriptstudio_offline_set(false)
```

### 현재 모드 확인

```javascript
window.__scriptstudio_offline_get()  // true or false
```

---

## ❓ 문제 발생 시

### "Failed to fetch" 에러

➡️ `.env.local` 파일에서 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 확인

### "Table does not exist" 에러

➡️ Supabase SQL Editor에서 `supabase-schema.sql` 다시 실행

### 콘솔에 "오프라인 모드" 메시지

➡️ `.env.local`에서 `VITE_OFFLINE_MODE=false` 확인 후 서버 재시작

---

## 📚 더 자세한 정보

- **완벽 가이드**: `HYBRID_MODE_GUIDE.md` 참조
- **테스트 가이드**: `INTEGRATION_TEST_GUIDE.md` 참조
- **데이터베이스 스키마**: `supabase-schema.sql` 참조

---

**다음 단계**: 프로덕션 배포를 위해 `HYBRID_MODE_GUIDE.md`의 "프로덕션 준비" 섹션을 확인하세요!
