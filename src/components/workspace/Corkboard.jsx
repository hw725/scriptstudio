
import React, { useState } from 'react';
import { Note } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useData } from '@/components/providers/DataProvider';

const getCharCount = (text) => {
  if (!text) return 0;
  return text.replace(/<[^>]*>/g, '').length;
};

const getContentPreview = (content, maxLength = 150) => {
  if (!content) return '';
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + '...';
};

const StatusColors = {
  not_started: "bg-gray-100 text-gray-800",
  first_draft: "bg-blue-100 text-blue-800", 
  revised_draft: "bg-yellow-100 text-yellow-800",
  final_draft: "bg-green-100 text-green-800",
  done: "bg-purple-100 text-purple-800"
};

const LabelColors = {
  none: "",
  important: "bg-red-100 text-red-800",
  idea: "bg-cyan-100 text-cyan-800", 
  research: "bg-amber-100 text-amber-800",
  character: "bg-pink-100 text-pink-800",
  scene: "bg-indigo-100 text-indigo-800"
};

const NoteCard = ({ note, onSelect, onUpdate, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState({
    title: note.title,
    synopsis: note.synopsis || '',
    status: note.status || 'not_started',
    label: note.label || 'none',
    target_words: note.target_words || ''
  });

  const handleSave = async () => {
    try {
      await Note.update(note.id, {
        ...editData,
        target_words: editData.target_words ? Number(editData.target_words) : null
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("카드 업데이트 실패:", error);
    }
  };

  const charCount = getCharCount(note.content);
  const contentPreview = getContentPreview(note.content, isExpanded ? 300 : 120);

  return (
    <Draggable draggableId={note.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card className="h-auto min-h-[240px] bg-card cursor-pointer hover:shadow-lg transition-shadow border">
            <CardContent className="p-4 h-full flex flex-col">
              {isEditing ? (
                <div className="space-y-2 h-full flex flex-col">
                  <Input 
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-sm font-medium"
                  />
                  <Textarea 
                    value={editData.synopsis}
                    onChange={(e) => setEditData(prev => ({ ...prev, synopsis: e.target.value }))}
                    placeholder="개요..."
                    className="flex-1 text-xs resize-none"
                  />
                  <div className="flex gap-1">
                    <Select value={editData.status} onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">시작 전</SelectItem>
                        <SelectItem value="first_draft">초안</SelectItem>
                        <SelectItem value="revised_draft">수정안</SelectItem>
                        <SelectItem value="final_draft">최종안</SelectItem>
                        <SelectItem value="done">완료</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={editData.label} onValueChange={(value) => setEditData(prev => ({ ...prev, label: value }))}>
                      <SelectTrigger className="h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">라벨 없음</SelectItem>
                        <SelectItem value="important">중요</SelectItem>
                        <SelectItem value="idea">아이디어</SelectItem>
                        <SelectItem value="research">리서치</SelectItem>
                        <SelectItem value="character">인물</SelectItem>
                        <SelectItem value="scene">장면</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={handleSave} size="sm" className="flex-1 h-6 text-xs">저장</Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="flex-1 h-6 text-xs">취소</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="flex-1 min-h-0"
                    onClick={() => onSelect(note.id)}
                    onDoubleClick={() => setIsEditing(true)}
                  >
                    <h3 className="font-semibold text-base mb-2 line-clamp-2">{note.title}</h3>
                    
                    {/* 개요가 있으면 개요를, 없으면 내용 미리보기를 표시 */}
                    {note.synopsis ? (
                      <p className="text-sm text-slate-600 line-clamp-3 mb-2">{note.synopsis}</p>
                    ) : contentPreview ? (
                      <div className="text-sm text-slate-500 mb-2">
                        <p className={isExpanded ? '' : 'line-clamp-4'}>{contentPreview}</p>
                        {getCharCount(note.content) > 120 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExpanded(!isExpanded);
                            }}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {isExpanded ? '접기' : '더보기'}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="flex-shrink-0 mt-auto pt-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.status && note.status !== 'not_started' && (
                        <Badge className={`text-xs py-0 ${StatusColors[note.status] || StatusColors['not_started']}`}>
                          {note.status.replace('_', ' ')}
                        </Badge>
                      )}
                      {note.label && note.label !== 'none' && (
                        <Badge className={`text-xs py-0 ${LabelColors[note.label] || ''}`}>
                          {note.label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                      <span>{charCount.toLocaleString()} 글자</span>
                      {note.target_words && (
                        <span>목표: {note.target_words.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default function Corkboard({ notes, folders, onSelectNote, onShowNewNoteModal }) { // Changed prop
  const [selectedFolder, setSelectedFolder] = useState(null);
  const { currentProject, refetchData } = useData();
  
  const filteredNotes = selectedFolder 
    ? notes.filter(note => note.folder_id === selectedFolder) 
    : notes.filter(note => !note.folder_id);

  // 정렬 순서대로 정렬
  const sortedNotes = [...filteredNotes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleCreateNote = () => {
    onShowNewNoteModal(selectedFolder); // Show modal with current folder context
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reorderedNotes = Array.from(sortedNotes);
    const [removed] = reorderedNotes.splice(source.index, 1);
    reorderedNotes.splice(destination.index, 0, removed);

    // 새로운 순서로 sort_order 업데이트
    const updates = reorderedNotes.map((note, index) => ({
      id: note.id,
      sort_order: index
    }));

    try {
      // 모든 노트의 순서를 업데이트
      await Promise.all(
        updates.map(({ id, sort_order }) => 
          Note.update(id, { sort_order })
        )
      );
      refetchData();
    } catch (error) {
      console.error("순서 변경 실패:", error);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-100/70">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">코르크보드</h2>
            {currentProject && (
              <Badge className="bg-blue-100 text-blue-800">{currentProject.title}</Badge>
            )}
            <Select value={selectedFolder || "root"} onValueChange={(value) => setSelectedFolder(value === "root" ? null : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="폴더 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">루트 폴더</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateNote} className="gap-2">
            <Plus className="h-4 w-4" />
            새 문서 카드
          </Button>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="corkboard">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
              >
                {sortedNotes.map((note, index) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    onSelect={onSelectNote}
                    onUpdate={refetchData}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {sortedNotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">이 {selectedFolder ? '폴더' : '프로젝트'}에 문서가 없습니다.</p>
            <Button onClick={handleCreateNote} variant="outline" className="mt-4">
              첫 문서 만들기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
