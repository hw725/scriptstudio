-- =======================================
-- ScriptStudio 스키마 완전 초기화
-- =======================================
-- ⚠️ 경고: 이 스크립트는 모든 데이터를 삭제합니다!
-- 데이터가 없거나 초기화가 필요한 경우에만 사용하세요.

-- Step 1: 기존 테이블 삭제 (CASCADE로 관련 데이터도 함께 삭제)
DROP TABLE IF EXISTS daily_notes CASCADE;
DROP TABLE IF EXISTS citation_styles CASCADE;
DROP TABLE IF EXISTS project_settings CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS references CASCADE;
DROP TABLE IF EXISTS note_versions CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Step 2: 기존 함수 삭제
DROP FUNCTION IF EXISTS update_updated_date() CASCADE;

-- =======================================
-- 이제 supabase-schema.sql을 실행하세요!
-- =======================================
-- 1. 이 파일(supabase-schema-reset.sql)을 먼저 실행
-- 2. 그 다음 supabase-schema.sql 전체 실행
-- 
-- 결과: 깨끗한 새 스키마가 생성됩니다 ✅
