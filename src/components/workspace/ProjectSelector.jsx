import React, { useState } from "react";
import { useData } from "../providers/DataProvider";
import {
  Folder,
  ChevronDown,
  Plus,
  X,
  Trash2,
  Edit2,
  Check,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Project } from "@/api/entities";
import { Note } from "@/api/entities";
import { Folder as FolderEntity } from "@/api/entities";

const ProjectColors = {
  blue: "bg-teal-100 text-teal-800",
  green: "bg-emerald-100 text-emerald-800",
  purple: "bg-violet-100 text-violet-800",
  red: "bg-rose-100 text-rose-800",
  orange: "bg-amber-100 text-amber-800",
  pink: "bg-pink-100 text-pink-800",
};

export default function ProjectSelector() {
  const {
    projects,
    currentProject,
    setCurrentProject,
    refetchData,
    notes,
    folders,
  } = useData();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("blue");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteAction, setDeleteAction] = useState("move"); // 'move' or 'delete'
  const [editProjectName, setEditProjectName] = useState("");

  const handleCreateProject = async () => {
    if (newProjectName.trim() === "") return;
    try {
      const newProject = await Project.create({
        title: newProjectName.trim(),
        color: newProjectColor,
      });
      await refetchData();
      setCurrentProject(newProject);
      setShowNewProject(false);
      setNewProjectName("");
      setNewProjectColor("blue");
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleStartEdit = (project) => {
    setEditingProject(project.id);
    setEditProjectName(project.title);
  };

  const handleSaveEdit = async () => {
    if (!editingProject || editProjectName.trim() === "") return;
    try {
      await Project.update(editingProject, { title: editProjectName.trim() });
      await refetchData();
      setEditingProject(null);
      setEditProjectName("");
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditProjectName("");
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmName !== projectToDelete.title) return;

    try {
      // 해당 프로젝트의 문서와 폴더 찾기
      const projectNotes = notes.filter(
        (note) => note.project_id === projectToDelete.id
      );
      const projectFolders = folders.filter(
        (folder) => folder.project_id === projectToDelete.id
      );

      if (deleteAction === "move") {
        // 문서와 폴더를 미분류로 이동
        await Promise.all([
          ...projectNotes.map((note) =>
            Note.update(note.id, { project_id: null })
          ),
          ...projectFolders.map((folder) =>
            FolderEntity.update(folder.id, { project_id: null })
          ),
        ]);
      } else {
        // 문서와 폴더를 모두 삭제
        await Promise.all([
          ...projectNotes.map((note) => Note.delete(note.id)),
          ...projectFolders.map((folder) => FolderEntity.delete(folder.id)),
        ]);
      }

      // 프로젝트 삭제
      await Project.delete(projectToDelete.id);

      // 현재 선택된 프로젝트가 삭제된 경우 다른 프로젝트로 전환
      if (currentProject?.id === projectToDelete.id) {
        const remainingProjects = projects.filter(
          (p) => p.id !== projectToDelete.id
        );
        setCurrentProject(
          remainingProjects.length > 0 ? remainingProjects[0] : null
        );
      }

      await refetchData();
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      setDeleteConfirmName("");
      setDeleteAction("move");
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const openDeleteDialog = (project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  if (showNewProject) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
        <Input
          placeholder="새 프로젝트 이름..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="h-8"
          onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
            >
              <div
                className={`w-4 h-4 rounded-full ${ProjectColors[newProjectColor]}`}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="p-2 grid grid-cols-3 gap-2">
              {Object.keys(ProjectColors).map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full ${ProjectColors[color]} transition-transform hover:scale-110`}
                  onClick={() => setNewProjectColor(color)}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          onClick={handleCreateProject}
          size="sm"
          className="h-8"
        >
          만들기
        </Button>
        <Button
          onClick={() => setShowNewProject(false)}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 justify-start w-full px-2"
            >
              <Folder className="h-4 w-4 text-primary/80" />
              {currentProject ? (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    ProjectColors[currentProject.color] || ProjectColors.blue
                  }`}
                >
                  {currentProject.title}
                </span>
              ) : (
                <span className="text-slate-500 font-medium">모든 문서</span>
              )}
              <ChevronDown className="h-4 w-4 ml-auto text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuItem
              onClick={() => setCurrentProject(null)}
              className="font-medium"
            >
              <span className="text-slate-500">모든 문서</span>
            </DropdownMenuItem>
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center w-full"
              >
                {editingProject === project.id ? (
                  <div className="flex items-center gap-1 px-2 py-1 w-full">
                    <Input
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      className="h-7 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCancelEdit}
                    >
                      <XIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => setCurrentProject(project)}
                      className="flex-1 cursor-pointer"
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                          ProjectColors[project.color] || ProjectColors.blue
                        }`}
                      >
                        {project.title}
                      </span>
                    </DropdownMenuItem>
                    <div className="pr-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(project);
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-primary/70" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(project);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive/70" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => setShowNewProject(true)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          title="새 프로젝트"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              <strong>{projectToDelete?.title}</strong> 프로젝트를
              삭제하시겠습니까?
            </p>

            <div className="space-y-3">
              <Label>프로젝트 내 문서와 폴더 처리 방법:</Label>
              <RadioGroup
                value={deleteAction}
                onValueChange={setDeleteAction}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="move"
                    id="move"
                  />
                  <Label htmlFor="move">미분류로 이동 (문서와 폴더 보존)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="delete"
                    id="delete"
                  />
                  <Label
                    htmlFor="delete"
                    className="text-red-600"
                  >
                    모두 삭제 (복구 불가능)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">
                확인을 위해 프로젝트 이름{" "}
                <strong>{projectToDelete?.title}</strong>를 입력하세요:
              </Label>
              <Input
                id="confirm"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="프로젝트 이름을 정확히 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteConfirmName !== projectToDelete?.title}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
