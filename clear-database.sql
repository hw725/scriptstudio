-- 모든 데이터 삭제 (외래키 순서 고려)
-- 1. 노트 관련
DELETE FROM note_versions;
DELETE FROM daily_notes;
DELETE FROM notes;

-- 2. 폴더
DELETE FROM folders;

-- 3. 레퍼런스
DELETE FROM "references";

-- 4. 템플릿
DELETE FROM templates;

-- 5. 설정
DELETE FROM citation_styles;
DELETE FROM project_settings;

-- 6. 프로젝트 (마지막)
DELETE FROM projects;

-- 확인
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'folders', COUNT(*) FROM folders
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'references', COUNT(*) FROM "references"
UNION ALL
SELECT 'templates', COUNT(*) FROM templates;
