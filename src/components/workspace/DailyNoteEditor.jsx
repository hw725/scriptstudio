
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DailyNote } from '@/api/entities';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Calendar, Save, Smile, Meh, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import TagInput from './TagInput';

const moodEmojis = {
  great: { emoji: '😄', label: '최고', color: 'text-green-600' },
  good: { emoji: '😊', label: '좋음', color: 'text-blue-600' },
  okay: { emoji: '😐', label: '보통', color: 'text-yellow-600' },
  bad: { emoji: '😔', label: '나쁨', color: 'text-orange-600' },
  terrible: { emoji: '😢', label: '최악', color: 'text-red-600' }
};

// 한국어 날짜 포맷팅 함수
const formatKoreanDate = (date) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = dayNames[date.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
};

export default function DailyNoteEditor({ selectedDate, onBack }) {
  const [dailyNote, setDailyNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('okay');
  const [tags, setTags] = useState([]);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [wordsWritten, setWordsWritten] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const quillRef = useRef(null);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const displayDate = formatKoreanDate(selectedDate);

  const loadDailyNote = useCallback(async () => {
    setIsLoading(true);
    try {
      const existingNotes = await DailyNote.filter({ date: dateString });
      
      if (existingNotes.length > 0) {
        const note = existingNotes[0];
        setDailyNote(note);
        setTitle(note.title || `${displayDate} 일기`);
        setContent(note.content || '');
        setMood(note.mood || 'okay');
        setTags(note.tags || []);
        setTasksCompleted(note.tasks_completed || 0);
        setWordsWritten(note.words_written || 0);
      } else {
        // 새 데일리 노트 생성
        const newNote = await DailyNote.create({
          date: dateString,
          title: `${displayDate} 일기`,
          content: `# ${displayDate}\n\n## 오늘의 하루\n\n\n## 감사한 일\n\n\n## 내일 계획\n\n`,
          mood: 'okay',
          tags: [],
          tasks_completed: 0,
          words_written: 0
        });
        
        setDailyNote(newNote);
        setTitle(newNote.title);
        setContent(newNote.content);
        setMood(newNote.mood);
        setTags(newNote.tags);
        setTasksCompleted(newNote.tasks_completed);
        setWordsWritten(newNote.words_written);
      }
    } catch (error) {
      console.error('데일리 노트 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateString, displayDate]);

  useEffect(() => {
    loadDailyNote();
  }, [loadDailyNote]);

  // 변경 사항 감지
  useEffect(() => {
    if (!dailyNote) return;
    
    const hasChanges = (
      title !== (dailyNote.title || '') ||
      content !== (dailyNote.content || '') ||
      mood !== (dailyNote.mood || 'okay') ||
      JSON.stringify(tags) !== JSON.stringify(dailyNote.tags || []) ||
      tasksCompleted !== (dailyNote.tasks_completed || 0) ||
      wordsWritten !== (dailyNote.words_written || 0)
    );
    
    setHasUnsavedChanges(hasChanges);
  }, [title, content, mood, tags, tasksCompleted, wordsWritten, dailyNote]);

  const handleSave = useCallback(async () => {
    if (!dailyNote || isSaving) return;
    
    setIsSaving(true);
    try {
      const updateData = {
        title,
        content,
        mood,
        tags,
        tasks_completed: tasksCompleted,
        words_written: wordsWritten
      };
      
      await DailyNote.update(dailyNote.id, updateData);
      setDailyNote({ ...dailyNote, ...updateData });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  }, [dailyNote, isSaving, title, content, mood, tags, tasksCompleted, wordsWritten]);

  // 자동 저장
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, isSaving, handleSave]);

  // ReactQuill 마운트 후 spellcheck 비활성화
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const editorElement = quill.root;
      editorElement.setAttribute('spellcheck', 'false');
      editorElement.setAttribute('data-gramm', 'false');
      editorElement.setAttribute('data-gramm_editor', 'false');
      editorElement.setAttribute('data-enable-grammarly', 'false');
    }
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>데일리 노트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-12 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="sm">
            ← 뒤로
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {displayDate}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">
            {isSaving ? (
              <span className="text-blue-600">저장중...</span>
            ) : hasUnsavedChanges ? (
              <span className="text-orange-600">저장 안됨</span>
            ) : (
              <span className="text-green-600">저장됨</span>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            저장
          </Button>
        </div>
      </div>

      {/* Main content area: now a flex column container to manage vertical space */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden"> 
        {/* 기본 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">오늘의 기분</label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(moodEmojis).map(([key, { emoji, label, color }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{emoji}</span>
                          <span className={color}>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">완료한 작업 수</label>
                <Input
                  type="number"
                  min="0"
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">태그</label>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </CardContent>
        </Card>

        {/* Editor content directly, replacing the "일기 내용" Card. This div will take remaining vertical space */}
        <div className="flex-1 overflow-y-auto min-h-0">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                placeholder="오늘 하루는 어땠나요? 자유롭게 기록해보세요..."
                className="h-full daily-editor-no-spellcheck"
                modules={{
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['blockquote', 'code-block'],
                        ['clean']
                    ]
                }}
            />
        </div>
      </div>
      
      {/* Inline style block for Quill customizations and spellcheck removal */}
      <style jsx="true">{`
          .ql-toolbar.ql-snow {
              border: none;
              border-bottom: 1px solid #e2e8f0;
              background: white;
          }
          .ql-container.ql-snow { border: none; }
          .ql-editor {
              font-size: 1rem;
              line-height: 1.7;
              padding: 2rem;
              color: #334155;
          }
          
          /* 맞춤법 검사 완전히 비활성화 */
          .daily-editor-no-spellcheck .ql-editor {
            -webkit-text-decoration-skip: none !important;
            text-decoration-skip-ink: none !important;
          }
          .daily-editor-no-spellcheck .ql-editor,
          .daily-editor-no-spellcheck .ql-editor * {
            text-decoration: none !important;
            text-decoration-line: none !important;
            text-decoration-style: none !important;
          }
          .ql-editor [data-grammar-error],
          .ql-editor [data-spelling-error],
          .ql-editor [data-gramm],
          .ql-editor [data-gramm_editor] {
            text-decoration: none !important;
            border-bottom: none !important;
            background: none !important;
          }
      `}</style>
    </div>
  );
}
