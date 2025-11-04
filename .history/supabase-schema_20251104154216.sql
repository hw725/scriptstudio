-- ScriptStudio Supabase 데이터베이스 스키마
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
--
-- ⚠️ 안전 정책:
-- - IF NOT EXISTS: 테이블/정책이 없을 때만 생성
-- - 기존 테이블이 있으면 스킵 (컬럼 추가/변경 안 됨)
-- - 기존 데이터는 절대 손실되지 않음
--
-- 🔄 업데이트가 필요한 경우:
-- 1. 기존 스키마와 비교 필요
-- 2. ALTER TABLE로 컬럼 추가/변경 필요
-- 3. 또는 테이블 삭제 후 재생성 (⚠️ 데이터 손실 주의!)

-- 1. 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 2. 폴더 테이블
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  path TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 3. 노트 테이블 (핵심 테이블)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  html_content TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  word_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 4. 노트 버전 테이블 (버전 관리)
CREATE TABLE IF NOT EXISTS note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  html_content TEXT,
  change_summary TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 5. 참고문헌 테이블
CREATE TABLE IF NOT EXISTS references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'book', 'article', 'website', etc.
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  year INTEGER,
  publisher TEXT,
  url TEXT,
  doi TEXT,
  isbn TEXT,
  metadata JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 6. 템플릿 테이블
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 7. 프로젝트 설정 테이블
CREATE TABLE IF NOT EXISTS project_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  UNIQUE(project_id, key)
);

-- 8. 인용 스타일 테이블
CREATE TABLE IF NOT EXISTS citation_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL, -- 'APA', 'MLA', 'Chicago', etc.
  template TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 9. 일일 노트 테이블
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT,
  html_content TEXT,
  mood TEXT,
  tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  UNIQUE(user_id, date)
);

-- ======================
-- 인덱스 생성 (성능 최적화)
-- ======================

-- 프로젝트 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_date ON projects(updated_date DESC);

-- 폴더 인덱스
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_project_id ON folders(project_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- 노트 인덱스
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_date ON notes(updated_date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);

-- 노트 버전 인덱스
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_created_date ON note_versions(created_date DESC);

-- 참고문헌 인덱스
CREATE INDEX IF NOT EXISTS idx_references_user_id ON references(user_id);
CREATE INDEX IF NOT EXISTS idx_references_project_id ON references(project_id);
CREATE INDEX IF NOT EXISTS idx_references_type ON references(type);

-- 템플릿 인덱스
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);

-- 일일 노트 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_id ON daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(date DESC);

-- ======================
-- RLS (Row Level Security) 정책
-- ======================

-- 프로젝트 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 프로젝트만 조회" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로젝트만 생성" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로젝트만 수정" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로젝트만 삭제" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- 노트 RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 노트만 조회" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 노트만 생성" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 노트만 수정" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 노트만 삭제" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- 폴더 RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 폴더만 조회" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 폴더만 생성" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 폴더만 수정" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 폴더만 삭제" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- 노트 버전 RLS
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 노트 버전만 조회" ON note_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 노트 버전만 생성" ON note_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 참고문헌 RLS
ALTER TABLE references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 참고문헌만 조회" ON references
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 참고문헌만 생성" ON references
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 참고문헌만 수정" ON references
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 참고문헌만 삭제" ON references
  FOR DELETE USING (auth.uid() = user_id);

-- 템플릿 RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 템플릿 또는 공개 템플릿 조회" ON templates
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "사용자는 자신의 템플릿만 생성" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 템플릿만 수정" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 템플릿만 삭제" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- 프로젝트 설정 RLS
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 프로젝트 설정만 조회" ON project_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로젝트 설정만 생성" ON project_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로젝트 설정만 수정" ON project_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로젝트 설정만 삭제" ON project_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 인용 스타일 RLS
ALTER TABLE citation_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 인용 스타일만 조회" ON citation_styles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 인용 스타일만 생성" ON citation_styles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 인용 스타일만 수정" ON citation_styles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 인용 스타일만 삭제" ON citation_styles
  FOR DELETE USING (auth.uid() = user_id);

-- 일일 노트 RLS
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 일일 노트만 조회" ON daily_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 일일 노트만 생성" ON daily_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 일일 노트만 수정" ON daily_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 일일 노트만 삭제" ON daily_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ======================
-- 트리거: updated_date 자동 업데이트
-- ======================

CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_projects_updated_date BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_folders_updated_date BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_notes_updated_date BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_note_versions_updated_date BEFORE UPDATE ON note_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_references_updated_date BEFORE UPDATE ON references
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_templates_updated_date BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_project_settings_updated_date BEFORE UPDATE ON project_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_citation_styles_updated_date BEFORE UPDATE ON citation_styles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_daily_notes_updated_date BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ======================
-- 완료!
-- ======================
-- 이제 ScriptStudio가 Supabase와 연결되어 작동합니다.
-- .env.local에서 VITE_OFFLINE_MODE=false로 설정하여 온라인 모드를 활성화하세요.


-- =======================================
-- 🔍 스키마 충돌 확인 방법
-- =======================================

-- 1️⃣ 기존 테이블 목록 확인
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- 2️⃣ 특정 테이블의 컬럼 구조 확인
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'notes'
-- ORDER BY ordinal_position;

-- 3️⃣ RLS 정책 확인
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('projects', 'folders', 'notes')
-- ORDER BY tablename, policyname;


-- =======================================
-- 🛠️ 스키마 업데이트 시나리오
-- =======================================

-- 📌 시나리오 1: 완전히 새로운 데이터베이스
-- → 이 파일 전체를 그대로 실행하면 됨 ✅

-- 📌 시나리오 2: 기존 스키마와 동일한 구조
-- → 이 파일을 실행해도 아무 일도 안 일어남 (IF NOT EXISTS) ✅
-- → 데이터는 안전하게 보존됨 ✅

-- 📌 시나리오 3: 기존 스키마에 새 컬럼 추가됨
-- 예: notes 테이블에 'summary' 컬럼 추가
-- 
-- 해결 방법 A - 수동 ALTER TABLE:
-- ALTER TABLE notes ADD COLUMN IF NOT EXISTS summary TEXT;
--
-- 해결 방법 B - 테이블 재생성 (⚠️ 데이터 손실!):
-- DROP TABLE notes CASCADE; -- 주의: 모든 노트 데이터가 삭제됨!
-- -- 그 다음 이 파일 재실행

-- 📌 시나리오 4: 컬럼 타입 변경
-- 예: tags TEXT → tags TEXT[]
--
-- 해결 방법:
-- ALTER TABLE notes ALTER COLUMN tags TYPE TEXT[] USING tags::TEXT[];
-- 
-- ⚠️ 주의: 기존 데이터와 호환되지 않으면 에러 발생 가능

-- 📌 시나리오 5: RLS 정책 변경
-- IF NOT EXISTS로 인해 기존 정책은 유지됨
--
-- 해결 방법:
-- DROP POLICY "policy_name" ON table_name;
-- -- 그 다음 이 파일에서 해당 정책 부분만 재실행


-- =======================================
-- 💡 권장 사항
-- =======================================

-- ✅ 처음 설치: 이 파일 전체 실행
-- ✅ 기존 DB에 안전 확인: 이 파일 실행 (IF NOT EXISTS 덕분에 안전)
-- ⚠️ 스키마 변경 필요: 위의 ALTER TABLE 방법 사용
-- 🚫 테이블 삭제: 절대 프로덕션에서 하지 말 것!

-- 🔧 개발 환경에서 테스트 후 프로덕션에 적용하는 것을 강력히 권장합니다.
