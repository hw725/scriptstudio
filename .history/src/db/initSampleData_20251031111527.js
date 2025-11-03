import { localDB } from '../db/localDB';

/**
 * 로컬 전용 모드 초기 샘플 데이터
 */
export async function initSampleData() {
  // 이미 데이터가 있는지 확인
  const existingProjects = await localDB.getAll('projects');
  if (existingProjects.length > 0) {
    console.log('⏭️ 이미 데이터가 존재함 - 샘플 데이터 생성 건너뜀');
    return;
  }

  console.log('🌱 샘플 데이터 생성 중...');

  const now = Date.now();

  // 1. 샘플 프로젝트 생성
  const sampleProject = {
    id: 'project_1',
    name: '나의 첫 프로젝트',
    description: '로컬 전용 모드에서 시작하는 프로젝트',
    created_date: now,
    updated_date: now,
    sync_status: 'synced'
  };
  await localDB.put('projects', sampleProject);

  // 2. 샘플 폴더 생성
  const sampleFolder = {
    id: 'folder_1',
    name: '아이디어 노트',
    project_id: 'project_1',
    parent_id: null,
    created_date: now,
    updated_date: now,
    sync_status: 'synced'
  };
  await localDB.put('folders', sampleFolder);

  // 3. 샘플 노트 생성
  const sampleNotes = [
    {
      id: 'note_1',
      title: '환영합니다! 🎉',
      content: `# ScriptStudio에 오신 것을 환영합니다!

이것은 로컬 전용 모드로 실행되는 ScriptStudio입니다.

## 주요 기능

- ✅ **완전 오프라인 작동**: 인터넷 연결 없이 사용 가능
- ✅ **로컬 저장**: 모든 데이터는 브라우저의 IndexedDB에 저장됩니다
- ✅ **실시간 자동 저장**: 입력하는 즉시 저장됩니다
- ✅ **프로젝트 관리**: 여러 프로젝트를 만들고 관리하세요
- ✅ **폴더 구조**: 노트를 폴더로 정리하세요

## 시작하기

1. 좌측 사이드바에서 **"+ 새 노트"** 버튼을 클릭하세요
2. 노트를 작성하고 자동으로 저장되는 것을 확인하세요
3. 폴더를 만들어 노트를 정리하세요

즐거운 작업 되세요! 📝`,
      folder_id: 'folder_1',
      project_id: 'project_1',
      created_date: now - 60000,
      updated_date: now - 60000,
      sync_status: 'synced'
    },
    {
      id: 'note_2',
      title: '마크다운 사용 가이드',
      content: `# 마크다운 기본 문법

## 제목
# H1 제목
## H2 제목
### H3 제목

## 강조
**굵게**
*기울임*
~~취소선~~

## 목록
- 항목 1
- 항목 2
  - 하위 항목 2.1
  - 하위 항목 2.2

1. 번호 목록 1
2. 번호 목록 2

## 링크와 이미지
[링크 텍스트](https://example.com)
![이미지 설명](이미지URL)

## 코드
\`인라인 코드\`

\`\`\`javascript
// 코드 블록
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## 인용
> 인용문입니다.
> 여러 줄도 가능합니다.

## 표
| 제목1 | 제목2 |
|------|------|
| 내용1 | 내용2 |
| 내용3 | 내용4 |`,
      folder_id: 'folder_1',
      project_id: 'project_1',
      created_date: now - 120000,
      updated_date: now - 120000,
      sync_status: 'synced'
    },
    {
      id: 'note_3',
      title: '할 일 목록',
      content: `# 오늘의 할 일

- [ ] 프로젝트 계획 수립
- [ ] 첫 번째 장 작성
- [ ] 자료 조사
- [x] 샘플 데이터 확인

## 이번 주 목표

1. 프로젝트 구조 완성
2. 3개의 챕터 초안 작성
3. 참고문헌 정리

## 아이디어 메모

- 캐릭터 설정 보완 필요
- 배경 설명 추가
- 플롯 트위스트 고민`,
      folder_id: null,
      project_id: 'project_1',
      created_date: now,
      updated_date: now,
      sync_status: 'synced'
    }
  ];

  for (const note of sampleNotes) {
    await localDB.put('notes', note);
  }

  // 4. 샘플 템플릿 생성
  const sampleTemplate = {
    id: 'template_1',
    name: '기본 노트 템플릿',
    content: `# 제목

## 개요


## 내용


## 참고사항


---
작성일: ${new Date().toLocaleDateString('ko-KR')}`,
    created_date: now,
    updated_date: now,
    sync_status: 'synced'
  };
  await localDB.put('templates', sampleTemplate);

  console.log('✅ 샘플 데이터 생성 완료!');
  console.log('   - 프로젝트: 1개');
  console.log('   - 폴더: 1개');
  console.log('   - 노트: 3개');
  console.log('   - 템플릿: 1개');
}

export default initSampleData;
