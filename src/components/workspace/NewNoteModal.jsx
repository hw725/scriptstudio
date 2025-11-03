import React, { useState, useEffect } from "react";
import { Template } from "@/api/entities";
import { Note } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilePlus2, FileText, Loader2 } from "lucide-react";
import { useData } from "../providers/DataProvider";

export default function NewNoteModal({
  isOpen,
  onClose,
  folderId,
  onNoteCreated,
}) {
  const { currentProject } = useData();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("blank");
  const [title, setTitle] = useState("새 문서");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Template.list().then((data) => {
        setTemplates(data);
        setIsLoading(false);
      });
      setTitle("새 문서"); // 모달 열릴 때마다 초기화
      setSelectedTemplateId("blank");
    }
  }, [isOpen]);

  const handleCreate = async () => {
    console.log("📝 새 노트 생성 시작...");
    let content = "";
    if (selectedTemplateId !== "blank") {
      const selectedTemplate = templates.find(
        (t) => t.id === selectedTemplateId
      );
      content = selectedTemplate?.content || "";
    }

    try {
      console.log("📝 Note.create 호출:", {
        title,
        content: content.substring(0, 50),
        project_id: currentProject?.id,
        folder_id: folderId,
      });
      const newNote = await Note.create({
        title,
        content,
        project_id: currentProject?.id || null,
        folder_id: folderId,
      });
      console.log("✅ 노트 생성 성공:", newNote);
      onNoteCreated(newNote);
      onClose();
    } catch (error) {
      console.error("❌ 문서 생성 실패:", error);
      alert("문서 생성에 실패했습니다: " + error.message);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 />새 문서 만들기
          </DialogTitle>
          <DialogDescription>
            문서 제목을 입력하고, 템플릿을 선택하거나 빈 문서로 시작하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">문서 제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>템플릿 선택</Label>
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <RadioGroup
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <ScrollArea className="h-48 border rounded-md p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                      <RadioGroupItem
                        value="blank"
                        id="blank"
                      />
                      <Label
                        htmlFor="blank"
                        className="font-medium flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />빈 문서
                        </div>
                      </Label>
                    </div>
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50"
                      >
                        <RadioGroupItem
                          value={template.id}
                          id={template.id}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={template.id}
                          className="font-normal flex-1 cursor-pointer"
                        >
                          <p className="font-medium">{template.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </RadioGroup>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            취소
          </Button>
          <Button onClick={handleCreate}>생성</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
