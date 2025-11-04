# 👥 ScriptStudio 다중 사용자 가이드

## 🎯 다중 사용자 지원

ScriptStudio는 **여러 명의 사용자**가 동시에 사용할 수 있습니다!

---

## 📋 현재 상태

### ✅ 이미 구현됨

1. **데이터 격리** (Supabase RLS)
   - 각 사용자의 데이터는 완전히 분리됨
   - 다른 사용자의 데이터 접근 불가능

2. **회원가입/로그인 컴포넌트**
   - `src/components/auth/AuthModal.jsx` ✅
   - `src/components/auth/AuthProvider.jsx` ✅

### ⚠️ 추가 작업 필요

**App.jsx에 AuthProvider 추가하기**

---

## 🚀 활성화 방법

### 1단계: App.jsx 수정

`src/App.jsx` 파일을 다음과 같이 수정:

```jsx
import "./App.css";
import Pages from "@/pages/index.jsx";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";  // 추가!

function App() {
  return (
    <AuthProvider>  {/* 추가! */}
      <Pages />
      <Toaster />
    </AuthProvider>  {/* 추가! */}
  );
}

export default App;
```

### 2단계: Supabase 이메일 설정

Supabase 대시보드에서:

1. **Authentication** → **Email Templates**
2. "Confirm signup" 템플릿 확인
3. (선택) 이메일 확인 비활성화:
   - **Settings** → **Authentication**
   - "Enable email confirmations" 끄기 (개발 중)

### 3단계: 테스트

```bash
npm run dev
```

1. 브라우저에서 열기
2. 로그인 모달 자동 표시
3. "회원가입" 탭에서 가입
4. 로그인 후 사용 시작!

---

## 👥 사용 시나리오

### 시나리오 1: 개인 사용자

```
사용자 A
    ↓
회원가입: alice@example.com
    ↓
로그인
    ↓
자신의 노트만 보임 ✅
```

### 시나리오 2: 여러 사용자

```
사용자 A (alice@example.com)
    - 프로젝트 A
    - 노트 1, 2, 3

사용자 B (bob@example.com)
    - 프로젝트 B
    - 노트 4, 5, 6

→ 서로 데이터 못 봄! ✅
→ 완전히 독립적
```

### 시나리오 3: 팀 사용 (URL 공유)

```
팀장: https://scriptstudio.vercel.app 배포
    ↓
팀원 A: 회원가입 → 자기 계정
팀원 B: 회원가입 → 자기 계정
팀원 C: 회원가입 → 자기 계정
    ↓
각자 독립적으로 사용 ✅
```

---

## 🔐 데이터 보안

### RLS (Row Level Security)

```sql
-- 이미 구현됨 (supabase-schema.sql)
CREATE POLICY "사용자는 자신의 노트만 조회" ON notes
  FOR SELECT USING (auth.uid() = user_id);
```

**의미:**
- 사용자 A는 자기 노트만 조회
- 사용자 B는 자기 노트만 조회
- **서로 절대 못 봄!** ✅

---

## 🎨 UI 흐름

### 첫 접속 시

```
1. URL 접속
    ↓
2. 로그인 모달 자동 표시
    ↓
3-1. 계정 있음 → 로그인
3-2. 계정 없음 → 회원가입
    ↓
4. 메인 화면 표시
```

### 로그인 후

```
우측 상단에 사용자 정보 표시:
[👤 alice@example.com] [로그아웃]
```

---

## 🔄 다중 기기 + 다중 사용자

### 사용자 A의 여러 기기

```
사용자 A
    집 PC (alice@example.com 로그인)
    회사 노트북 (alice@example.com 로그인)
    태블릿 (alice@example.com 로그인)
    ↓
모든 기기에서 동일한 데이터 ✅
```

### 여러 사용자

```
사용자 A (alice@example.com)
    - 자기 데이터만 보임

사용자 B (bob@example.com)
    - 자기 데이터만 보임

→ 서로 독립적! ✅
```

---

## 💡 추가 기능 (선택사항)

### 1. 비밀번호 재설정

```javascript
// 이미 구현됨 (supabaseClient.js)
await supabase.auth.resetPasswordForEmail(email)
```

### 2. 소셜 로그인 (GitHub, Google 등)

```javascript
// Supabase에서 지원
await supabase.auth.signInWithOAuth({
  provider: 'github'
})
```

### 3. 프로필 설정

```javascript
// 사용자 메타데이터
await supabase.auth.updateUser({
  data: { name: '홍길동', avatar_url: '...' }
})
```

---

## 🐛 문제 해결

### Q1: 로그인 모달이 안 보여요

**A:** `App.jsx`에 `<AuthProvider>` 추가했는지 확인

### Q2: 이메일 확인이 안 와요

**A:** Supabase 대시보드에서 이메일 확인 비활성화:
```
Settings → Authentication
→ "Enable email confirmations" 끄기
```

### Q3: 다른 사용자 데이터가 보여요

**A:** 불가능합니다! RLS로 차단됨. 로그아웃 후 다시 로그인 확인.

---

## ✅ 체크리스트

### 활성화
- [ ] `AuthModal.jsx` 생성 완료
- [ ] `AuthProvider.jsx` 생성 완료
- [ ] `App.jsx`에 `<AuthProvider>` 추가
- [ ] 개발 서버 재시작
- [ ] 로그인 모달 확인

### 테스트
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 노트 생성/수정
- [ ] 로그아웃 후 데이터 안 보임 확인
- [ ] 다른 계정으로 로그인 → 별개 데이터 확인

---

## 🎉 완료!

이제 ScriptStudio는:

✅ 여러 명의 사용자 지원  
✅ 회원가입/로그인 기능  
✅ 사용자별 데이터 완전 격리  
✅ RLS로 보안 보장  
✅ 다중 기기 + 다중 사용자  

**완벽한 다중 사용자 앱입니다! 🚀**

---

**작성일**: 2025년 11월 4일  
**버전**: 1.0
