import React, { useState } from "react";
import { Folder as FolderEntity } from "@/api/entities";
import { Note } from "@/api/entities";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  PenSquare,
  LayoutGrid,
  List,
  FolderOpen,
  Trash2,
  Download,
  GripVertical,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger, // This was the duplicated import, now correctly here.
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/components/providers/DataProvider";
import TagFilter from "./TagFilter";
import ExportModal from "./ExportModal";

const StatusColors = {
  not_started: "bg-gray-100 text-gray-700",
  first_draft: "bg-blue-100 text-blue-700",
  revised_draft: "bg-yellow-100 text-yellow-700",
  final_draft: "bg-green-100 text-green-700",
  done: "bg-purple-100 text-purple-700",
};

const LabelColors = {
  none: "",
  important: "bg-red-100 text-red-700",
  idea: "bg-cyan-100 text-cyan-700",
  research: "bg-amber-100 text-amber-700",
  character: "bg-pink-100 text-pink-700",
  scene: "bg-indigo-100 text-indigo-700",
};

const ResizableHandle = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-10 flex items-center justify-center group hover:bg-blue-100 transition-colors"
  >
    <GripVertical className="h-6 w-3 text-slate-300 group-hover:text-primary transition-colors" />
  </div>
);

const SectionHeader = ({ title, icon, onAdd, onToggleViewMode, viewMode }) => (
  <div className="h-12 px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-slate-50/80">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {title}
      </span>
    </div>
    <div className="flex items-center gap-1">
      {onToggleViewMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleViewMode}
          className="h-7 w-7 p-0 hover:bg-slate-200/60"
        >
          {viewMode === "editor" ? (
            <LayoutGrid className="h-3.5 w-3.5" />
          ) : viewMode === "corkboard" ? (
            <List className="h-3.5 w-3.5" />
          ) : (
            <PenSquare className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
      {onAdd && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="h-7 w-7 p-0 hover:bg-slate-200/60"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </div>
);

const TreeItem = ({
  item,
  type,
  depth,
  onSelectNote,
  selectedNoteId,
  children,
  onViewItem: _onViewItem,
  isDragging,
  isRenaming,
  onCommitRename,
  onStartRename,
  onMoveToProject,
  onDeleteItem,
  projects,
  currentProject,
  onEnterTranslationMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name || item.title);

  const isSelected = type === "note" && selectedNoteId === item.id;
  const Icon = type === "folder" ? Folder : FileText;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (type === "folder") {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (type === "note") {
      onSelectNote(item.id);
    }
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      onCommitRename(item.id, renameValue);
    } else if (e.key === "Escape") {
      onCommitRename(item.id, null);
    }
  };

  const treeItemContent = (
    <div>
      <div
        onClick={handleSelect}
        className={`group flex items-center px-2 py-2 rounded-md cursor-pointer transition-all duration-150 ${
          isSelected
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "hover:bg-slate-100/70"
        } ${isDragging ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {type === "folder" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-5 w-5 p-0 hover:bg-slate-200/60"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-slate-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-500" />
              )}
            </Button>
          )}
          <Icon
            className={`h-4 w-4 flex-shrink-0 ${
              type === "folder"
                ? "text-primary"
                : type === "note"
                ? "text-slate-500"
                : "text-indigo-600"
            }`}
          />
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={() => onCommitRename(item.id, renameValue)}
                className="h-6 text-sm py-1 px-2"
              />
            ) : (
              <span className="text-sm font-medium text-slate-800 truncate block">
                {item.name || item.title}
              </span>
            )}

            {type === "note" && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {!currentProject && item.project_id && (
                  <Badge
                    variant="outline"
                    className="text-xs py-0 h-4 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {projects.find((p) => p.id === item.project_id)?.title ||
                      "Unknown"}
                  </Badge>
                )}
                {item.translation_of_id && (
                  <Badge
                    variant="outline"
                    className="text-xs py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Languages className="h-2.5 w-2.5 mr-0.5" />
                    연결됨
                  </Badge>
                )}
                {item.status && item.status !== "not_started" && (
                  <Badge
                    className={`text-xs py-0 h-4 ${
                      StatusColors[item.status] || StatusColors["not_started"]
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </Badge>
                )}
                {item.label && item.label !== "none" && (
                  <Badge
                    className={`text-xs py-0 h-4 ${
                      LabelColors[item.label] || ""
                    }`}
                  >
                    {item.label}
                  </Badge>
                )}
                {item.tags &&
                  item.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      #{tag}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {type === "folder" && isExpanded && (
        <div className="mt-1">{children}</div>
      )}
    </div>
  );

  if (type === "folder" || type === "note") {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{treeItemContent}</ContextMenuTrigger>
        <ContextMenuContent>
          {type === "note" && onEnterTranslationMode && (
            <>
              <ContextMenuItem onClick={() => onEnterTranslationMode(item.id)}>
                <Languages className="w-4 h-4 mr-2" />
                번역 모드로 열기
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => onStartRename(item.id)}>
            이름 바꾸기
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderOpen className="w-4 h-4 mr-2" />
              프로젝트로 이동
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onClick={() => onMoveToProject(item, type, null)}
              >
                전체 문서로 이동
              </ContextMenuItem>
              {projects.map((project) => (
                <ContextMenuItem
                  key={project.id}
                  onClick={() => onMoveToProject(item, type, project.id)}
                  disabled={currentProject?.id === project.id}
                >
                  {project.title}로 이동
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem
            onClick={() => onDeleteItem(item.id, type)}
            className="text-red-600 focus:bg-red-100 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return treeItemContent;
};

const NewItemInput = ({ parentId, type, onCommit, onCancel, projectId }) => {
  const [name, setName] = useState("");

  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      if (name.trim()) {
        if (type === "folder") {
          await FolderEntity.create({
            name: name.trim(),
            parent_id: parentId,
            project_id: projectId,
          });
          onCommit();
        }
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="px-2 py-2"
      style={{ paddingLeft: `${(parentId ? 1 : 0) * 16 + 8}px` }}
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        placeholder="폴더 이름"
        className="h-8 text-sm"
      />
    </div>
  );
};

const CollapsedProjectSelector = () => {
  const { projects, currentProject, setCurrentProject } = useData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Folder className="h-4 w-4 text-primary/80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setCurrentProject(null)}>
          모든 문서
        </DropdownMenuItem>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setCurrentProject(project)}
            disabled={currentProject?.id === project.id}
          >
            {project.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function Binder({
  notes,
  folders,
  onSelectNote,
  selectedNoteId,
  collapsed,
  setCollapsed,
  width,
  setWidth,
  onShowNewNoteModal,
  onViewItem,
  onToggleViewMode,
  viewMode,
  currentProject,
  refetchData,
  projects,
  onEnterTranslationMode,
}) {
  const [newItem, setNewItem] = useState(null);
  const [renamingItemId, setRenamingItemId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth > 240 && newWidth < window.innerWidth * 0.5) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))].sort();

  // 현재 프로젝트의 노트만 필터링 + 태그 필터링
  const filteredNotes = notes.filter((note) => {
    // 프로젝트 필터링
    const matchesProject = currentProject
      ? note.project_id === currentProject.id
      : !note.project_id; // 프로젝트 선택 안 했으면 project_id 없는 노트만

    // 태그 필터링
    const matchesTags =
      selectedTags.length > 0
        ? selectedTags.every((tag) => (note.tags || []).includes(tag))
        : true;

    return matchesProject && matchesTags;
  });

  const handleCommitNewItem = async () => {
    setNewItem(null);
    await refetchData(); // await 추가
  };

  const handleCommitRename = async (itemId, newName) => {
    if (newName && itemId) {
      try {
        const isFolder = folders.some((f) => f.id === itemId);
        const isNote = notes.some((n) => n.id === itemId);

        if (isFolder) {
          await FolderEntity.update(itemId, { name: newName });
        } else if (isNote) {
          await Note.update(itemId, { title: newName });
        }
        await refetchData(); // await 추가
      } catch (error) {
        console.error("이름 변경 실패:", error);
        await refetchData(); // 에러 시에도 새로고침
      }
    }
    setRenamingItemId(null);
  };

  const handleStartRename = (itemId) => {
    setRenamingItemId(itemId);
  };

  const handleDeleteItem = async (itemId, type) => {
    if (
      window.confirm(
        "정말로 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      try {
        if (type === "note") {
          await Note.delete(itemId);
        } else if (type === "folder") {
          await FolderEntity.delete(itemId);
        }
        await refetchData(); // await 추가
      } catch (error) {
        console.error("삭제 실패:", error);
        await refetchData(); // 에러 시에도 새로고침
      }
    }
  };

  const handleMoveToProject = async (item, type, projectId) => {
    try {
      if (type === "note") {
        await Note.update(item.id, { project_id: projectId });
      } else if (type === "folder") {
        await FolderEntity.update(item.id, { project_id: projectId });
      }
      await refetchData(); // await 추가
    } catch (error) {
      console.error("프로젝트 이동 실패:", error);
      await refetchData(); // 에러 시에도 새로고침
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      const targetFolderId =
        destination.droppableId === "root"
          ? null
          : destination.droppableId.replace("folder-", "");

      // 노트인지 폴더인지 확인
      const isNote = notes.some((n) => n.id === draggableId);
      const isFolder = folders.some((f) => f.id === draggableId);

      if (isNote) {
        await Note.update(draggableId, { folder_id: targetFolderId });
      } else if (isFolder) {
        await FolderEntity.update(draggableId, { parent_id: targetFolderId });
      }

      await refetchData();
    } catch (error) {
      console.error("드래그 앤 드롭 실패:", error);
      // 에러 발생 시 데이터 새로고침으로 원래 상태로 복구
      await refetchData();
    }
  };

  const renderTree = (parentId = null, depth = 0) => {
    const childFolders = folders.filter((f) => {
      const matchesParent = (f.parent_id || null) === parentId;
      const matchesProject = currentProject
        ? f.project_id === currentProject.id
        : !f.project_id;
      return matchesParent && matchesProject;
    });

    const childNotes = filteredNotes.filter((n) => {
      return (n.folder_id || null) === parentId;
    });

    return (
      <>
        {childFolders.map((folder) => (
          <Droppable
            key={`folder-${folder.id}`}
            droppableId={`folder-${folder.id}`}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={snapshot.isDraggingOver ? "bg-blue-50 rounded" : ""}
              >
                <TreeItem
                  item={folder}
                  type="folder"
                  depth={depth}
                  onSelectNote={onSelectNote}
                  selectedNoteId={selectedNoteId}
                  onViewItem={onViewItem}
                  isRenaming={renamingItemId === folder.id}
                  onCommitRename={handleCommitRename}
                  onStartRename={handleStartRename}
                  onMoveToProject={handleMoveToProject}
                  onDeleteItem={handleDeleteItem}
                  projects={projects}
                  currentProject={currentProject}
                  onEnterTranslationMode={onEnterTranslationMode}
                >
                  {renderTree(folder.id, depth + 1)}
                </TreeItem>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}

        {childNotes.map((note, index) => (
          <Draggable
            key={note.id}
            draggableId={note.id}
            index={index}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <TreeItem
                  item={note}
                  type="note"
                  depth={depth}
                  onSelectNote={onSelectNote}
                  selectedNoteId={selectedNoteId}
                  isDragging={snapshot.isDragging}
                  isRenaming={renamingItemId === note.id}
                  onCommitRename={handleCommitRename}
                  onStartRename={handleStartRename}
                  onMoveToProject={handleMoveToProject}
                  onDeleteItem={handleDeleteItem}
                  projects={projects}
                  currentProject={currentProject}
                  onEnterTranslationMode={onEnterTranslationMode}
                />
              </div>
            )}
          </Draggable>
        ))}
      </>
    );
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-3 gap-3 bg-slate-50 border-r border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          className="h-8 w-8 p-0"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        <CollapsedProjectSelector />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        className="relative flex flex-col h-full bg-white border-r border-slate-200"
        style={{ width: `${width}px` }}
      >
        <ResizableHandle onMouseDown={handleMouseDown} />

        <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between min-w-0">
          <span className="font-semibold text-slate-800 truncate">바인더</span>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowExportModal(true)}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="프로젝트 내보내기"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-7 w-7 p-0 flex-shrink-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onTagSelect={(tag) => setSelectedTags([...selectedTags, tag])}
          onTagDeselect={(tag) =>
            setSelectedTags(selectedTags.filter((t) => t !== tag))
          }
          onClearAll={() => setSelectedTags([])}
        />

        <div className="flex-1 overflow-y-auto">
          <SectionHeader
            title="문서"
            icon={<PenSquare className="h-4 w-4 text-slate-600" />}
            onAdd={() => onShowNewNoteModal(null)}
            onToggleViewMode={onToggleViewMode}
            viewMode={viewMode}
          />

          <Droppable droppableId="root">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="py-2"
              >
                {renderTree()}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <SectionHeader
            title="폴더"
            icon={<Folder className="h-4 w-4 text-primary" />}
            onAdd={() => setNewItem({ type: "folder", parentId: null })}
          />

          {newItem && newItem.type === "folder" && (
            <NewItemInput
              parentId={newItem.parentId}
              type="folder"
              projectId={currentProject?.id}
              onCommit={handleCommitNewItem}
              onCancel={() => setNewItem(null)}
            />
          )}
        </div>

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </DragDropContext>
  );
}
