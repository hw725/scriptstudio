// Import backup JSON from a previous ScriptStudio/Base44 version into current schema
// Usage from browser console:
//   await window.ScriptStudio.importBackupJSON(yourJsonObject, { mode: 'upsert' })
// - mode: 'insert' | 'upsert' (default 'upsert')

import {
  Note,
  Folder,
  Project,
  Reference,
  Template,
  NoteVersion,
  DailyNote,
  CitationStyle,
  ProjectSettings,
} from "@/api/entities";
import { syncManager } from "@/sync/syncManager";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MongoDB ID to UUID mapping
const idMap = new Map();

function isMongoId(id) {
  // MongoDB ObjectId는 24자 hex 문자열
  return typeof id === "string" && /^[0-9a-f]{24}$/i.test(id);
}

function generateUUID() {
  return crypto.randomUUID();
}

function convertId(oldId) {
  if (!oldId) return null;
  if (!isMongoId(oldId)) return oldId; // 이미 UUID면 그대로

  // 이미 변환된 적 있으면 같은 UUID 반환
  if (idMap.has(oldId)) {
    return idMap.get(oldId);
  }

  // 새 UUID 생성하고 매핑 저장
  const newId = generateUUID();
  idMap.set(oldId, newId);
  return newId;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function mapTimestamps(item) {
  const created = item.created_date || item.createdAt || item.created_at;
  const updated = item.updated_date || item.updatedAt || item.updated_at;
  if (created) item.created_date = new Date(created).toISOString();
  if (updated) item.updated_date = new Date(updated).toISOString();
  return item;
}

function mapNote(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);
  if (i.project_id) i.project_id = convertId(i.project_id);
  if (i.folder_id) i.folder_id = convertId(i.folder_id);

  // content/html mapping fallback
  if (!i.content && i.html) i.content = i.html;
  if (!i.tags && typeof i.tagString === "string")
    i.tags = i.tagString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  // whitelist handled by supabase client; we just pass plausible fields
  return pick(i, [
    "id",
    "project_id",
    "folder_id",
    "title",
    "content",
    "html_content",
    "tags",
    "status",
    "word_count",
    "char_count",
    "reading_time",
    "metadata",
    "created_date",
    "updated_date",
  ]);
}

function mapFolder(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);
  if (i.project_id) i.project_id = convertId(i.project_id);
  if (i.parent_id) i.parent_id = convertId(i.parent_id);

  if (i.path && Array.isArray(i.path)) i.path = i.path.join("/");
  return pick(i, [
    "id",
    "project_id",
    "name",
    "parent_id",
    "path",
    "created_date",
    "updated_date",
  ]);
}

function mapProject(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);

  return pick(i, [
    "id",
    "title",
    "description",
    "settings",
    "created_date",
    "updated_date",
  ]);
}

function mapReference(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);
  if (i.project_id) i.project_id = convertId(i.project_id);

  return pick(i, [
    "id",
    "project_id",
    "type",
    "title",
    "authors",
    "year",
    "publisher",
    "url",
    "doi",
    "isbn",
    "metadata",
    "created_date",
    "updated_date",
  ]);
}

function mapTemplate(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);

  return pick(i, [
    "id",
    "name",
    "description",
    "content",
    "category",
    "is_public",
    "created_date",
    "updated_date",
  ]);
}

function mapNoteVersion(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);
  if (i.note_id) i.note_id = convertId(i.note_id);

  // fallbacks
  if (!i.note_id && i.noteId) i.note_id = convertId(i.noteId);
  if (!i.version_number && (i.version || i.number))
    i.version_number = i.version || i.number;
  return pick(i, [
    "id",
    "note_id",
    "version_number",
    "content",
    "html_content",
    "change_summary",
    "created_date",
    "updated_date",
  ]);
}

function mapDailyNote(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);

  if (i.date) i.date = new Date(i.date).toISOString().slice(0, 10);
  return pick(i, [
    "id",
    "date",
    "content",
    "html_content",
    "mood",
    "tasks",
    "metadata",
    "created_date",
    "updated_date",
  ]);
}

function mapCitationStyle(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);

  return pick(i, [
    "id",
    "name",
    "format",
    "template",
    "is_default",
    "created_date",
    "updated_date",
  ]);
}

function mapProjectSettings(raw) {
  const i = { ...raw };
  mapTimestamps(i);

  // MongoDB ID를 UUID로 변환
  if (i.id) i.id = convertId(i.id);
  if (i.project_id) i.project_id = convertId(i.project_id);

  return pick(i, [
    "id",
    "project_id",
    "key",
    "value",
    "created_date",
    "updated_date",
  ]);
}

async function upsertEntity(
  entity,
  mappers,
  items,
  keyName = "id",
  entityName = "item"
) {
  const results = { created: 0, updated: 0, skipped: 0, errors: 0 };
  const total = items.length;

  console.log(`\n📦 ${entityName} 가져오기 시작 (총 ${total}개)`);

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    try {
      const data = mappers(raw);
      if (!data) {
        results.skipped++;
        continue;
      }

      // MongoDB ID가 UUID로 변환되었으므로 항상 새로 생성
      // (존재 여부 체크 없이 직접 생성)
      await entity.create(data);
      results.created++;

      if (results.created % 10 === 0) {
        console.log(`  ✅ ${entityName} 생성: ${results.created}/${total}`);
      }

      // brief yield to avoid rate limits
      await sleep(50);
    } catch (e) {
      console.error(
        `❌ ${entityName} 가져오기 실패 (${i + 1}/${total}):`,
        e.message
      );
      results.errors++;
    }
  }

  console.log(
    `✅ ${entityName} 완료 - 생성: ${results.created}, 업데이트: ${results.updated}, 에러: ${results.errors}`
  );
  return results;
}

// function ensureArray(x) {
//   return Array.isArray(x) ? x : x ? [x] : [];
// }

function extractList(obj, keys) {
  for (const k of keys) if (Array.isArray(obj[k])) return obj[k];
  // Some exports may nest under data: { notes: [...] }
  if (
    obj &&
    typeof obj === "object" &&
    obj.data &&
    typeof obj.data === "object"
  ) {
    for (const k of keys) if (Array.isArray(obj.data[k])) return obj.data[k];
  }
  return [];
}

export async function importBackupJSON(json, { _mode = "upsert" } = {}) {
  console.log("\n🚀 백업 가져오기 시작...\n");
  const report = {};

  // 0) 전체 데이터에서 사용된 모든 MongoDB project_id 수집
  const allProjectIds = new Set();
  const notes = extractList(json, ["notes", "Notes", "documents"]);
  const folders = extractList(json, ["folders", "Folders"]);

  notes.forEach((note) => {
    if (note.project_id && isMongoId(note.project_id)) {
      allProjectIds.add(note.project_id);
    }
  });

  folders.forEach((folder) => {
    if (folder.project_id && isMongoId(folder.project_id)) {
      allProjectIds.add(folder.project_id);
    }
  });

  console.log(`🔍 발견된 고유 프로젝트 ID: ${allProjectIds.size}개`);

  // 1) Projects - 먼저 처리해야 함 (foreign key 제약)
  let projectList = [];

  // 단일 project 객체 처리
  if (
    json.project &&
    typeof json.project === "object" &&
    !Array.isArray(json.project)
  ) {
    // 모든 고유한 project_id에 대해 프로젝트 생성
    if (allProjectIds.size > 0) {
      projectList = Array.from(allProjectIds).map((projectId) => ({
        id: projectId,
        title: json.project.title || "전체 문서",
        description: json.project.description || "",
      }));
      console.log(`📝 ${projectList.length}개의 프로젝트 생성 준비`);
    } else if (json.project.id) {
      projectList = [json.project];
    }
  } else {
    projectList = extractList(json, ["projects", "Projects", "project"]);
  }

  if (projectList.length > 0) {
    console.log(`📦 프로젝트 처리: ${projectList.length}개`);
    report.projects = await upsertEntity(
      Project,
      mapProject,
      projectList,
      "id",
      "프로젝트"
    );
  } else {
    console.log("⏭️  프로젝트 없음, 건너뜀");
  }

  // 2) Folders - 두 번째로 처리 (notes가 folder_id 참조)
  if (folders.length > 0) {
    report.folders = await upsertEntity(
      Folder,
      mapFolder,
      folders,
      "id",
      "폴더"
    );
  } else {
    console.log("⏭️  폴더 없음, 건너뜀");
  }

  // 3) Notes - 마지막에 처리 (project_id, folder_id 필요)
  if (notes.length > 0) {
    report.notes = await upsertEntity(Note, mapNote, notes, "id", "노트");
  } else {
    console.log("⏭️  노트 없음, 건너뜀");
  }

  // 4) Note Versions
  const versions = extractList(json, [
    "note_versions",
    "NoteVersions",
    "versions",
  ]);
  if (versions.length > 0) {
    report.note_versions = await upsertEntity(
      NoteVersion,
      mapNoteVersion,
      versions,
      "id",
      "노트 버전"
    );
  } else {
    console.log("⏭️  노트 버전 없음, 건너뜀");
  }

  // 5) Templates
  const templates = extractList(json, ["templates", "Templates"]);
  if (templates.length > 0) {
    report.templates = await upsertEntity(
      Template,
      mapTemplate,
      templates,
      "id",
      "템플릿"
    );
  } else {
    console.log("⏭️  템플릿 없음, 건너뜀");
  }

  // 6) References
  const references = extractList(json, ["references", "References"]);
  if (references.length > 0) {
    report.references = await upsertEntity(
      Reference,
      mapReference,
      references,
      "id",
      "참고문헌"
    );
  } else {
    console.log("⏭️  참고문헌 없음, 건너뜀");
  }

  // 7) Daily Notes
  const dailyNotes = extractList(json, ["daily_notes", "DailyNotes"]);
  if (dailyNotes.length > 0) {
    report.daily_notes = await upsertEntity(
      DailyNote,
      mapDailyNote,
      dailyNotes,
      "id",
      "데일리 노트"
    );
  } else {
    console.log("⏭️  데일리 노트 없음, 건너뜀");
  }

  // 8) Citation Styles
  const citationStyles = extractList(json, [
    "citation_styles",
    "CitationStyles",
  ]);
  if (citationStyles.length > 0) {
    report.citation_styles = await upsertEntity(
      CitationStyle,
      mapCitationStyle,
      citationStyles,
      "id",
      "인용 스타일"
    );
  } else {
    console.log("⏭️  인용 스타일 없음, 건너뜀");
  }

  // 9) Project Settings
  const projectSettings = extractList(json, [
    "project_settings",
    "ProjectSettings",
  ]);
  if (projectSettings.length > 0) {
    report.project_settings = await upsertEntity(
      ProjectSettings,
      mapProjectSettings,
      projectSettings,
      "id",
      "프로젝트 설정"
    );
  } else {
    console.log("⏭️  프로젝트 설정 없음, 건너뜀");
  }

  console.log("\n🎉 백업 가져오기 완료!\n");

  // Trigger a sync just in case (online mode)
  try {
    console.log("🔄 동기화 시작...");
    await syncManager.sync();
    console.log("✅ 동기화 완료");
  } catch (_err) {
    console.log("⚠️  동기화 실패 (오프라인 모드일 수 있음)");
  }

  return report;
}

// Convenience: attach to window for quick use via DevTools
if (typeof window !== "undefined") {
  window.ScriptStudio = window.ScriptStudio || {};
  window.ScriptStudio.importBackupJSON = importBackupJSON;
}
