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
  // fallbacks
  if (!i.note_id && i.noteId) i.note_id = i.noteId;
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
  return pick(i, [
    "id",
    "project_id",
    "key",
    "value",
    "created_date",
    "updated_date",
  ]);
}

async function upsertEntity(entity, mappers, items, keyName = "id") {
  const results = { created: 0, updated: 0, skipped: 0, errors: 0 };
  for (const raw of items) {
    try {
      const data = mappers(raw);
      if (!data || (keyName && !data[keyName])) {
        // allow create with generated id if missing
      }
      // Try existence check
      let exists = null;
      if (data?.id) {
        try {
          exists = await entity.get(data.id);
        } catch (_err) {
          // 존재 여부 조회 실패는 신규 생성 경로로 처리
          exists = null;
        }
      }
      if (!exists) {
        await entity.create(data);
        results.created++;
      } else {
        await entity.update(exists.id, data);
        results.updated++;
      }
      // brief yield to avoid rate limits
      await sleep(20);
    } catch (e) {
      console.error("Import item failed:", e, raw);
      results.errors++;
    }
  }
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
  const report = {};

  // 1) Projects
  const projects = extractList(json, ["projects", "Projects"]);
  report.projects = await upsertEntity(Project, mapProject, projects);

  // 2) Folders
  const folders = extractList(json, ["folders", "Folders"]);
  report.folders = await upsertEntity(Folder, mapFolder, folders);

  // 3) Notes
  const notes = extractList(json, ["notes", "Notes", "documents"]);
  report.notes = await upsertEntity(Note, mapNote, notes);

  // 4) Note Versions
  const versions = extractList(json, [
    "note_versions",
    "NoteVersions",
    "versions",
  ]);
  report.note_versions = await upsertEntity(
    NoteVersion,
    mapNoteVersion,
    versions
  );

  // 5) Templates
  const templates = extractList(json, ["templates", "Templates"]);
  report.templates = await upsertEntity(Template, mapTemplate, templates);

  // 6) References
  const references = extractList(json, ["references", "References"]);
  report.references = await upsertEntity(Reference, mapReference, references);

  // 7) Daily Notes
  const dailyNotes = extractList(json, ["daily_notes", "DailyNotes"]);
  report.daily_notes = await upsertEntity(DailyNote, mapDailyNote, dailyNotes);

  // 8) Citation Styles
  const citationStyles = extractList(json, [
    "citation_styles",
    "CitationStyles",
  ]);
  report.citation_styles = await upsertEntity(
    CitationStyle,
    mapCitationStyle,
    citationStyles
  );

  // 9) Project Settings
  const projectSettings = extractList(json, [
    "project_settings",
    "ProjectSettings",
  ]);
  report.project_settings = await upsertEntity(
    ProjectSettings,
    mapProjectSettings,
    projectSettings
  );

  // Trigger a sync just in case (online mode)
  try {
    await syncManager.sync();
  } catch (_err) {
    // 네트워크/오프라인 등으로 동기화가 불가능한 경우 무시 (다음 주기로 재시도됨)
  }

  return report;
}

// Convenience: attach to window for quick use via DevTools
if (typeof window !== "undefined") {
  window.ScriptStudio = window.ScriptStudio || {};
  window.ScriptStudio.importBackupJSON = importBackupJSON;
}
