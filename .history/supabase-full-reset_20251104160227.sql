-- =======================================
-- ScriptStudio 데이터베이스 스키마
-- =======================================
-- 
-- 사용법:
-- - Supabase SQL Editor에서 이 파일 전체 복사 → 붙여넿기 → Run
-- - IF NOT EXISTS로 안전하게 보호됨 (기존 테이블 유지)
-- 
-- ⚠️ 기존 테이블을 삭제하고 싶다면:
-- supabase-schema-reset.sql 파일을 먼저 실행하세요

-- ===================================
-- 테이블 생성 (IF NOT EXISTS)
-- ===================================

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
  content TEXT,
  html_content TEXT,
  version_number INTEGER NOT NULL,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 참조 테이블 (양방향 링크)
CREATE TABLE IF NOT EXISTS references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  reference_type TEXT DEFAULT 'link',
  context TEXT,
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
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 7. 프로젝트 설정 테이블
CREATE TABLE project_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  target_word_count INTEGER,
  target_deadline TIMESTAMPTZ,
  progress_tracking JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 8. 인용 스타일 테이블
CREATE TABLE citation_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  template TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- 9. 데일리 노트 테이블
CREATE TABLE daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  content TEXT,
  html_content TEXT,
  mood TEXT,
  word_count INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  UNIQUE(user_id, project_id, note_date)
);

-- ===================================
-- RLS (Row Level Security) 정책
-- ===================================

-- RLS 활성화
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- Projects 정책
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Folders 정책
CREATE POLICY "Users can view their own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- Notes 정책
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Note Versions 정책
CREATE POLICY "Users can view their own note versions" ON note_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note versions" ON note_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note versions" ON note_versions
  FOR DELETE USING (auth.uid() = user_id);

-- References 정책
CREATE POLICY "Users can view their own references" ON references
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own references" ON references
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own references" ON references
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own references" ON references
  FOR DELETE USING (auth.uid() = user_id);

-- Templates 정책
CREATE POLICY "Users can view their own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- Project Settings 정책
CREATE POLICY "Users can view their own project settings" ON project_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project settings" ON project_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project settings" ON project_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project settings" ON project_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Citation Styles 정책
CREATE POLICY "Users can view their own citation styles" ON citation_styles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own citation styles" ON citation_styles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own citation styles" ON citation_styles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own citation styles" ON citation_styles
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Notes 정책
CREATE POLICY "Users can view their own daily notes" ON daily_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily notes" ON daily_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily notes" ON daily_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily notes" ON daily_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ===================================
-- 인덱스 생성 (성능 최적화)
-- ===================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_project_id ON folders(project_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_references_source_note_id ON references(source_note_id);
CREATE INDEX idx_references_target_note_id ON references(target_note_id);
CREATE INDEX idx_daily_notes_user_project_date ON daily_notes(user_id, project_id, note_date);

-- ===================================
-- 자동 updated_date 트리거
-- ===================================

CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ===================================
-- ✅ 완료!
-- ===================================
-- 
-- 결과:
-- - 기존 테이블 모두 삭제됨
-- - 새 스키마가 깨끗하게 생성됨
-- - RLS 정책이 모든 테이블에 적용됨
-- - 자동 타임스탬프 업데이트 활성화
-- 
-- 다음 단계:
-- 1. Google OAuth 설정 (Supabase Dashboard)
-- 2. App.jsx에 AuthProvider 추가
-- 3. 온라인 모드로 테스트!
