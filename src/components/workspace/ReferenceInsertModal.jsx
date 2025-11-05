import React, { useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { syncRefManager } from "@/api/functions";
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
  Search,
  BookOpen,
  Download,
  Copy,
  ArrowRight,
  Loader2,
  CheckCircle2,
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
  const { references, refetchData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("korean");
  const [selectedRefs, setSelectedRefs] = useState([]);

  // RefManager 관련 상태
  const [refManagerRefs, setRefManagerRefs] = useState([]);
  const [isLoadingRefManager, setIsLoadingRefManager] = useState(false);
  const [refManagerError, setRefManagerError] = useState(null);
  const [selectedRefManagerIds, setSelectedRefManagerIds] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

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

  // RefManager 동기화 함수들
  const loadRefManagerReferences = async () => {
    setIsLoadingRefManager(true);
    setRefManagerError(null);
    try {
      const response = await syncRefManager({ action: "listReferences" });
      if (response.data.success) {
        setRefManagerRefs(response.data.items);
      } else {
        setRefManagerError(
          response.data.error || "RefManager 목록을 불러오는데 실패했습니다."
        );
      }
    } catch (error) {
      setRefManagerError("RefManager 연결에 실패했습니다: " + error.message);
    } finally {
      setIsLoadingRefManager(false);
    }
  };

  const handleImportFromRefManager = async () => {
    if (selectedRefManagerIds.length === 0) return;

    setIsImporting(true);
    setRefManagerError(null);
    try {
      const response = await syncRefManager({
        action: "importSelectedReferences",
        data: { ids: selectedRefManagerIds },
      });

      if (response.data.success) {
        setSelectedRefManagerIds([]);
        // 성공 시 데이터 새로고침
        await refetchData();
        // 성공 메시지 표시 (선택사항)
        alert(
          `${response.data.imported}개의 참고문헌을 성공적으로 가져왔습니다.`
        );
      } else {
        setRefManagerError(response.data.error || "가져오기에 실패했습니다.");
      }
    } catch (error) {
      console.error("RefManager 가져오기 오류:", error);
      setRefManagerError("가져오기에 실패했습니다: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleRefManagerSelection = (refId) => {
    setSelectedRefManagerIds((prev) =>
      prev.includes(refId)
        ? prev.filter((id) => id !== refId)
        : [...prev, refId]
    );
  };

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
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 mb-0 shrink-0">
            <TabsTrigger value="local">내 참고문헌</TabsTrigger>
            <TabsTrigger value="refmanager">RefManager 동기화</TabsTrigger>
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
                                <CheckCircle2 className="h-5 w-5 text-blue-600 ml-2 shrink-0" />
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

          <TabsContent
            value="refmanager"
            className="flex-1 min-h-0"
          >
            <div className="flex flex-col h-full p-6 space-y-4">
              <div className="flex justify-between items-center shrink-0">
                <p className="text-sm text-slate-600">
                  RefManager에서 참고문헌을 가져와 내 라이브러리에 추가할 수
                  있습니다.
                </p>
                <Button
                  onClick={loadRefManagerReferences}
                  disabled={isLoadingRefManager}
                  variant="outline"
                  className="gap-2"
                >
                  {isLoadingRefManager ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  목록 불러오기
                </Button>
              </div>

              {refManagerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm shrink-0">
                  <strong>오류:</strong> {refManagerError}
                </div>
              )}

              <div className="flex-1 overflow-y-auto border rounded-lg bg-slate-50">
                <div className="space-y-2 p-4">
                  {isLoadingRefManager ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mb-3 text-slate-400" />
                      <p>RefManager에서 데이터를 불러오는 중...</p>
                    </div>
                  ) : refManagerRefs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
                      <Download className="h-12 w-12 mb-3 text-slate-300" />
                      <p>RefManager에서 참고문헌을 불러오세요</p>
                    </div>
                  ) : (
                    refManagerRefs.map((ref) => {
                      const isSelected = selectedRefManagerIds.includes(ref.id);

                      return (
                        <Card
                          key={ref.id}
                          className={`cursor-pointer transition-all border hover:shadow-sm ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          onClick={() => toggleRefManagerSelection(ref.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 mb-1 truncate">
                                  {ref.title}
                                </h4>
                                <div className="flex items-center gap-2">
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
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600 ml-2 shrink-0" />
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
                  {selectedRefManagerIds.length}개 선택됨
                </div>
                <Button
                  onClick={handleImportFromRefManager}
                  disabled={selectedRefManagerIds.length === 0 || isImporting}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  내 라이브러리로 가져오기
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
