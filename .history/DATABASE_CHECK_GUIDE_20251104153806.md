# 🔍 Supabase 데이터베이스 상태 확인 가이드

## ❓ SQL 스키마를 다시 실행해야 하나요?

### 간단 체크리스트

✅ **다시 실행 필요 없음** - 다음 중 하나라도 해당하면:
- [ ] 이미 한 번 `supabase-schema.sql`을 실행했음
- [ ] Supabase Table Editor에서 테이블들이 보임
- [ ] 앱에서 데이터 저장/조회가 정상 작동함

⚠️ **다시 실행 필요** - 다음 경우:
- [ ] 새로운 Supabase 프로젝트를 생성함
- [ ] 테이블이 하나도 없음
- [ ] RLS 정책이 없어서 접근 거부 에러 발생

---

## 🔍 현재 상태 확인 방법

### 방법 1: Supabase Dashboard (추천)

1. [supabase.com](https://supabase.com) 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴 → **Table Editor**
4. 다음 테이블들이 있는지 확인:

```
✅ projects
✅ folders
✅ notes
✅ note_versions
✅ references
✅ templates
✅ project_settings
✅ citation_styles
✅ daily_notes
```

**모두 있으면 → SQL 재실행 불필요!** ✅

**하나라도 없으면 → SQL 실행 필요!** ⚠️

### 방법 2: SQL Editor로 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**결과:**
```
citation_styles
daily_notes
folders
note_versions
notes
project_settings
projects
references
templates
```

**9개 테이블 모두 있으면 OK!** ✅

### 방법 3: 앱에서 확인

```javascript
// 브라우저 콘솔 (F12)에서 실행
const { data, error } = await supabase.from('notes').select('*')
if (error) {
  console.error('❌ 테이블 없음:', error)
} else {
  console.log('✅ 테이블 존재:', data)
}
```

---

## 📋 상황별 가이드

### 상황 1: 이미 배포된 Vercel 앱이 작동 중

**SQL 재실행:** ❌ **필요 없음**

```
Vercel 앱이 정상 작동
    ↓
이미 Supabase 테이블 생성됨
    ↓
SQL 재실행 불필요 ✅
```

**확인 방법:**
- Vercel 앱에서 노트 생성
- Supabase Table Editor에서 데이터 확인
- 데이터가 보이면 → 이미 설정 완료!

### 상황 2: 새로운 Supabase 프로젝트

**SQL 재실행:** ✅ **필요함**

```
새 Supabase 프로젝트 생성
    ↓
테이블 없음
    ↓
supabase-schema.sql 실행 필요 ⚠️
```

### 상황 3: Base44에서 마이그레이션

**SQL 재실행:** 🔄 **선택적**

```
Base44 앱 → Supabase로 전환
    ↓
Base44 스키마와 다를 수 있음
    ↓
supabase-schema.sql 실행 권장
```

---

## 🔄 SQL을 이미 실행했는데 다시 실행하면?

### 안전합니다! ✅

`supabase-schema.sql`은 **멱등성(idempotent)** 설계:

```sql
CREATE TABLE IF NOT EXISTS projects (...);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ...;
CREATE POLICY IF NOT EXISTS "사용자는 자신의 프로젝트만 조회" ...;
```

**의미:**
- `IF NOT EXISTS` → 이미 있으면 스킵
- 기존 데이터 영향 없음
- 안전하게 재실행 가능

### 예외: DROP 명령어가 있다면

만약 다음과 같은 명령어가 있다면 **주의!**

```sql
DROP TABLE IF EXISTS notes;  -- ⚠️ 데이터 삭제!
```

**현재 `supabase-schema.sql`에는 DROP 없음 → 안전!** ✅

---

## 🎯 Google OAuth 설정 (Base44에서 사용하던 것)

### 1단계: Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com)
2. 프로젝트 선택 (Base44에서 사용하던 프로젝트)
3. **APIs & Services** → **Credentials**
4. OAuth 2.0 Client ID 찾기
5. **Authorized redirect URIs** 확인/추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### 2단계: Supabase 설정

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google** 활성화
3. Base44에서 사용하던:
   - **Client ID** 입력
   - **Client Secret** 입력
4. **Save** 클릭

### 3단계: 테스트

```javascript
// 브라우저에서
// "Google로 계속하기" 버튼 클릭
// → Google 로그인 페이지로 리다이렉트
// → 로그인 완료 후 앱으로 돌아옴 ✅
```

---

## 🔍 문제 해결

### Q1: "Table does not exist" 에러

**원인:** SQL 스키마가 실행되지 않음

**해결:**
```sql
-- Supabase SQL Editor에서
-- supabase-schema.sql 전체 실행
```

### Q2: "Row level security" 에러

**원인:** RLS 정책이 없음

**해결:**
```sql
-- supabase-schema.sql의 RLS 섹션만 재실행
-- 또는 전체 재실행 (안전함)
```

### Q3: Google OAuth 실패

**원인:** Redirect URI 불일치

**해결:**
1. Supabase Dashboard → **Settings** → **API**
2. **URL** 복사 (예: `https://xxxxx.supabase.co`)
3. Google Cloud Console → Authorized redirect URIs:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```

---

## ✅ 최종 체크리스트

### 데이터베이스
- [ ] Supabase Table Editor에서 9개 테이블 확인
- [ ] 테이블에 `user_id` 컬럼 있음 확인
- [ ] RLS 정책 활성화 확인

### Google OAuth (선택사항)
- [ ] Google Cloud Console에서 Redirect URI 추가
- [ ] Supabase에서 Google Provider 활성화
- [ ] Client ID/Secret 입력
- [ ] 테스트 로그인 성공

### 앱 작동
- [ ] 로그인 모달 표시
- [ ] Google 버튼 표시
- [ ] 노트 생성/수정/삭제 가능
- [ ] Supabase에 데이터 저장 확인

---

## 🎉 결론

### SQL 스키마 재실행 여부

| 상황 | 필요 여부 | 이유 |
|------|----------|------|
| 이미 배포된 앱 작동 중 | ❌ 불필요 | 테이블이 이미 존재 |
| 테이블 확인됨 | ❌ 불필요 | 설정 완료 상태 |
| 새 Supabase 프로젝트 | ✅ 필요 | 테이블 생성 필요 |
| 에러 발생 중 | ✅ 권장 | 스키마 재생성 |

### Google OAuth

```
Base44에서 사용하던 Google OAuth
    ↓
동일한 Client ID/Secret 사용 가능
    ↓
Supabase에 설정만 하면 됨
    ↓
즉시 작동! ✅
```

**매우 간단합니다!** 🚀

---

**작성일**: 2025년 11월 4일
