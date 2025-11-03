import { base44 } from "./base44Client";

// Base44 SDK entities를 오프라인 지원으로 래핑
// 각 entity의 메서드들이 자동으로 오프라인 지원을 받습니다

export const Note = base44.entities.Note;

export const Folder = base44.entities.Folder;

export const Reference = base44.entities.Reference;

export const ProjectSettings = base44.entities.ProjectSettings;

export const Project = base44.entities.Project;

export const CitationStyle = base44.entities.CitationStyle;

export const NoteVersion = base44.entities.NoteVersion;

export const Template = base44.entities.Template;

export const DailyNote = base44.entities.DailyNote;

// auth sdk:
export const User = base44.auth;

/**
 * 오프라인 지원 엔티티 헬퍼
 * Base44 SDK의 entity가 내부적으로 사용하는 HTTP 클라이언트가
 * offlineWrapper로 래핑되어 있어 자동으로 오프라인 지원됩니다.
 *
 * 사용 예:
 * - 온라인: Note.list() → API 호출 + 로컬 캐시
 * - 오프라인: Note.list() → 로컬 캐시만 사용
 * - Note.create() → 로컬 저장 + 동기화 큐 추가
 */
