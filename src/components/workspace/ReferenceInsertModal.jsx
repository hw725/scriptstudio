import React, { useState } from "react";
import { useData } from "@/components/providers/DataProvider";
// import { syncRefManager } from "@/api/functions"; // Edge Function 필요 - 제거됨
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  // Search, Download, Loader2, CheckCircle2 - RefManager 기능 제거로 불필요
  BookOpen,
  Copy,
  ArrowRight,
} from "lucide-react";

const CitationFormats = {
  apa: {
    name: "APA 스타일",
    format: (ref) =>
      `${ref.authors} (${ref.year}). ${ref.title}. ${ref.publication}.`,
  },
  mla: {
    name: "MLA 스타일",
    format: (ref) =>
      `${ref.authors}. 「${ref.title}」 『${ref.publication}』, ${ref.year}.`,
  },
  chicago: {
    name: "Chicago 스타일",
    format: (ref) =>
      `${ref.authors}, 「${ref.title},」 ${ref.publication} (${ref.year}).`,
  },
  korean: {
    name: "한국어 논문 스타일",
    format: (ref) =>
      `${ref.authors}, 「${ref.title}」, 『${ref.publication}』, ${ref.year}.`,
  },
};

export default function ReferenceInsertModal({ isOpen, onClose, onInsert }) {
  const { references } = useData(); // refetchData 제거됨
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("korean");
  const [selectedRefs, setSelectedRefs] = useState([]);

  // RefManager 관련 상태 제거됨 - Edge Function 필요
  // const [refManagerRefs, setRefManagerRefs] = useState([]);
  // const [isLoadingRefManager, setIsLoadingRefManager] = useState(false);
  // const [refManagerError, setRefManagerError] = useState(null);
  // const [selectedRefManagerIds, setSelectedRefManagerIds] = useState([]);
  // const [isImporting, setIsImporting] = useState(false);

  const filteredReferences = references.filter(
    (ref) =>
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.authors &&
        ref.authors.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInsertSelected = () => {
    if (selectedRefs.length === 0) return;

    const format = CitationFormats[selectedFormat];
    const citations = selectedRefs.map((ref) => format.format(ref));
    const citationText = citations.join(" ");

    onInsert({ citationText, references: selectedRefs });
    onClose();
    setSelectedRefs([]);
  };

  const handleCopyToClipboard = async () => {
    if (selectedRefs.length === 0) return;

    const format = CitationFormats[selectedFormat];
    const citations = selectedRefs.map((ref) => format.format(ref));
    const citationText = citations.join("\n");

    try {
      await navigator.clipboard.writeText(citationText);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  const toggleReferenceSelection = (ref) => {
    setSelectedRefs((prev) => {
      const isSelected = prev.some((r) => r.id === ref.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== ref.id);
      } else {
        return [...prev, ref];
      }
    });
  };

  // RefManager 동기화 함수들 제거됨 - Edge Function 필요
  // const loadRefManagerReferences = async () => { ... }
  // const handleImportFromRefManager = async () => { ... }
  // const toggleRefManagerSelection = (refId) => { ... }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            참고문헌 삽입
          </DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="local"
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-1 mx-6 mt-4 mb-0 shrink-0">
            <TabsTrigger value="local">내 참고문헌</TabsTrigger>
            {/* RefManager 탭 제거 - Edge Function 필요 */}
          </TabsList>

          <TabsContent
            value="local"
            className="flex-1 min-h-0"
          >
            <div className="flex flex-col h-full p-6 space-y-4">
              <div className="flex gap-4 shrink-0">
                <div className="flex-1">
                  <Input
                    placeholder="제목 또는 저자로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select
                  value={selectedFormat}
                  onValueChange={setSelectedFormat}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CitationFormats).map(([key, format]) => (
                      <SelectItem
                        key={key}
                        value={key}
                      >
                        {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto border rounded-lg bg-slate-50">
                <div className="space-y-2 p-4">
                  {filteredReferences.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>검색 결과가 없습니다</p>
                    </div>
                  ) : (
                    filteredReferences.map((ref) => {
                      const isSelected = selectedRefs.some(
                        (r) => r.id === ref.id
                      );
                      const previewText =
                        CitationFormats[selectedFormat].format(ref);

                      return (
                        <Card
                          key={ref.id}
                          className={`cursor-pointer transition-all border hover:shadow-sm ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          onClick={() => toggleReferenceSelection(ref)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 mb-1 truncate">
                                  {ref.title}
                                </h4>
                                <div className="flex items-center gap-2 mb-2">
                                  {ref.authors && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {ref.authors}
                                    </Badge>
                                  )}
                                  {ref.year && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {ref.year}
                                    </Badge>
                                  )}
                                </div>
                                <div className="bg-slate-100 p-2 rounded text-sm text-slate-700 font-mono">
                                  {previewText}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center ml-2 shrink-0">
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-200 shrink-0">
                <div className="text-sm text-slate-600">
                  {selectedRefs.length}개 선택됨
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyToClipboard}
                    disabled={selectedRefs.length === 0}
                    variant="outline"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    복사하기
                  </Button>
                  <Button
                    onClick={handleInsertSelected}
                    disabled={selectedRefs.length === 0}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ArrowRight className="h-4 w-4" />
                    삽입하기
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* RefManager 탭 제거됨 - Edge Function 필요 */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
