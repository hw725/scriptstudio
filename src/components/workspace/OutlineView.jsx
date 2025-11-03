
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Note } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  Book,
  Hash,
  Target
} from 'lucide-react';

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

const getCharCount = (content) => {
  if (!content) return 0;
  return content.replace(/<[^>]*>/g, '').length;
};

const CollapsibleOutlineItem = ({ note, index, onSelect, selectedNoteId, onUpdate, level = 0, children, onToggleCollapse, isCollapsed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: note.title,
    synopsis: note.synopsis || '',
    status: note.status || 'not_started',
    label: note.label || 'none',
    target_words: note.target_words || ''
  });

  const charCount = getCharCount(note.content);
  const targetProgress = note.target_words ? Math.min((charCount / note.target_words) * 100, 100) : 0;
  const isSelected = selectedNoteId === note.id;
  const hasChildren = children && children.length > 0;

  const handleSave = async () => {
    try {
      await Note.update(note.id, {
        ...editData,
        target_words: editData.target_words ? Number(editData.target_words) : null
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("노트 업데이트 실패:", error);
    }
  };

  return (
    // The draggable item itself. `mb-2` ensures spacing between items and their child blocks.
    <Draggable draggableId={note.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-2 ${snapshot.isDragging ? 'opacity-60' : ''}`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <Card className={`border transition-all ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div 
                  {...provided.dragHandleProps}
                  className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className="mt-0.5 h-6 w-6 p-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        className="font-medium"
                      />
                      <textarea
                        value={editData.synopsis}
                        onChange={(e) => setEditData(prev => ({ ...prev, synopsis: e.target.value }))}
                        placeholder="개요 또는 요약..."
                        className="w-full p-2 border rounded text-sm resize-none h-16"
                      />
                      <div className="flex gap-2">
                        <Select 
                          value={editData.status} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
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
                        <Select 
                          value={editData.label} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, label: value }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
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
                        <Input
                          type="number"
                          value={editData.target_words}
                          onChange={(e) => setEditData(prev => ({ ...prev, target_words: e.target.value }))}
                          placeholder="목표 글자 수"
                          className="h-8 text-sm w-32"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm" className="h-7">저장</Button>
                        <Button 
                          onClick={() => setIsEditing(false)} 
                          variant="outline" 
                          size="sm" 
                          className="h-7"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer"
                      onClick={() => onSelect(note.id)}
                      onDoubleClick={() => setIsEditing(true)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-900 flex-1">{note.title}</h3>
                        <div className="flex gap-1 ml-2">
                          {note.status && note.status !== 'not_started' && (
                            <Badge className={`text-xs h-5 ${StatusColors[note.status]}`}>
                              {note.status.replace('_', ' ')}
                            </Badge>
                          )}
                          {note.label && note.label !== 'none' && (
                            <Badge className={`text-xs h-5 ${LabelColors[note.label]}`}>
                              {note.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {note.synopsis && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{note.synopsis}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {charCount.toLocaleString()} 글자
                          </span>
                          {note.target_words && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              목표: {note.target_words.toLocaleString()} 글자
                            </span>
                          )}
                        </div>
                        {note.target_words && (
                          <Badge variant="outline" className="h-4 text-xs">
                            {Math.round(targetProgress)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default function OutlineView({ notes, folders, onSelectNote, selectedNoteId, currentProject, refetchData, onShowNewNoteModal }) { 
  const [sortedNotes, setSortedNotes] = useState([]);
  const [collapsedItems, setCollapsedItems] = useState(new Set());
  
  useEffect(() => {
    // Sort all notes by their sort_order (flat list for D&D operations)
    const sorted = [...notes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setSortedNotes(sorted);
  }, [notes]);

  const handleToggleCollapse = (noteId) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Function to build a hierarchical structure from a flat list of notes
  const buildHierarchy = (notesToProcess, parentId = null) => {
    return notesToProcess
      .filter(note => (note.parent_note_id || null) === parentId)
      .map(note => ({
        ...note,
        children: buildHierarchy(notesToProcess, note.id)
      }));
  };

  // Function to recursively render hierarchical items
  const renderHierarchicalItems = (items, level = 0) => {
    return items.map((item) => {
      // Find the global index of the item in the flat sortedNotes array for DragDropContext
      const globalIndex = sortedNotes.findIndex(note => note.id === item.id);
      if (globalIndex === -1) return null; // Should ideally not happen

      return (
        <CollapsibleOutlineItem
          key={item.id}
          note={item}
          index={globalIndex} // Pass the global index for D&D
          level={level}
          onSelect={onSelectNote}
          selectedNoteId={selectedNoteId}
          onUpdate={refetchData}
          children={item.children.length > 0 ? renderHierarchicalItems(item.children, level + 1) : null}
          onToggleCollapse={() => handleToggleCollapse(item.id)}
          isCollapsed={collapsedItems.has(item.id)}
        />
      );
    });
  };

  const handleCreateNote = async () => {
    onShowNewNoteModal(null); // Show modal for new note
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    // If dropped in the same position, do nothing
    if (source.index === destination.index) return;

    const reorderedNotes = Array.from(sortedNotes);
    const [removed] = reorderedNotes.splice(source.index, 1);
    reorderedNotes.splice(destination.index, 0, removed);

    // Optimistically update UI
    setSortedNotes(reorderedNotes);

    try {
      // Prepare updates for the database
      const updates = reorderedNotes.map((note, index) => ({
        id: note.id,
        sort_order: index // Update sort_order based on new flat position
      }));

      // Send updates to the database
      await Promise.all(
        updates.map(({ id, sort_order }) => 
          Note.update(id, { sort_order })
        )
      );
      refetchData(); // Re-fetch data to ensure consistency and re-render hierarchy
    } catch (error) {
      console.error("순서 변경 실패:", error);
      // Revert to original state if API call fails
      setSortedNotes(notes);
    }
  };

  // Build the hierarchical structure for rendering
  const hierarchicalNotes = buildHierarchy(sortedNotes);

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Book className="h-6 w-6" />
              아웃라인
            </h2>
            {currentProject && (
              <Badge className="bg-blue-100 text-blue-800">{currentProject.title}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCollapsedItems(new Set())} 
              size="sm"
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              모두 펼치기
            </Button>
            <Button onClick={handleCreateNote} className="gap-2">
              <Plus className="h-4 w-4" />
              새 장/절 추가
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="outline">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-0" // Removed mb-2 from individual items, let the draggable div handle it
              >
                {renderHierarchicalItems(hierarchicalNotes)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {sortedNotes.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">아직 생성된 장/절이 없습니다.</p>
            <Button onClick={handleCreateNote} variant="outline">
              첫 번째 장/절 만들기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
