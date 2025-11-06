// Node.js에서 실행: node remove-duplicates.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, "전체문서-backup-1762352884667.json");
const outputFile = path.join(__dirname, "cleaned-backup.json");

console.log("📦 백업 파일 읽는 중...");
const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

console.log(
  `원본 - 프로젝트: ${data.projects.length}, 폴더: ${data.folders.length}, 노트: ${data.notes.length}`
);

// 중복 제거 함수
function removeDuplicates(items, keyFn) {
  const seen = new Map();
  const unique = [];

  items.forEach((item) => {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.set(key, item);
      unique.push(item);
    } else {
      // 더 최근 것으로 업데이트
      const existing = seen.get(key);
      if (new Date(item.updated_date) > new Date(existing.updated_date)) {
        seen.set(key, item);
        const index = unique.indexOf(existing);
        unique[index] = item;
      }
    }
  });

  return unique;
}

// 프로젝트 중복 제거 (title + description + created_date 기준)
data.projects = removeDuplicates(
  data.projects,
  (p) => `${p.title}|${p.description || ""}|${p.created_date}`
);

// 폴더 중복 제거 (name + parent_id + 생성시간 기준)
data.folders = removeDuplicates(
  data.folders,
  (f) => `${f.name}|${f.parent_id || "root"}|${f.created_date}`
);

// 노트 중복 제거 (title + content만으로 판단 - 폴더/프로젝트 무관)
data.notes = removeDuplicates(
  data.notes,
  (n) => `${n.title}|${(n.content || "").substring(0, 200)}`
);

console.log(
  `정리 후 - 프로젝트: ${data.projects.length}, 폴더: ${data.folders.length}, 노트: ${data.notes.length}`
);

// 파일 저장
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");
console.log(`\n✅ 중복 제거 완료: ${outputFile}`);
