
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Reference } from '@/api/entities';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Loader2, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useData } from '../providers/DataProvider';

const ReferenceField = ({ label, value, onChange }) => (
    <div className="mb-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full p-2 mt-1 border-b-2 border-transparent focus:border-indigo-400 focus:outline-none transition-colors bg-transparent text-slate-800"
        />
    </div>
);

const VALID_TYPES = ["article", "book", "website", "journal"];

export default function ReferenceViewer({ referenceId }) {
    const { updateReferenceInState } = useData();
    const [reference, setReference] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDataLossWarning, setShowDataLossWarning] = useState(false);
    const [currentReferenceId, setCurrentReferenceId] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [justSaved, setJustSaved] = useState(false);
    
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [year, setYear] = useState('');
    const [publication, setPublication] = useState('');
    const [type, setType] = useState('article');
    const [notes, setNotes] = useState('');
    const [isContentLoaded, setIsContentLoaded] = useState(false);

    const isMountedRef = useRef(true);
    const autoSaveTimer = useRef(null);
    const quillRef = useRef(null); // Added useRef for ReactQuill

    // 컴포넌트 언마운트 추적
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            // Clear any pending auto-save timer when component unmounts
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
            }
        };
    }, []);

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

    const fetchReference = useCallback(async () => {
        if (!referenceId) {
            setLoadError('참고문헌 ID가 제공되지 않았습니다.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadError(null);
        setIsContentLoaded(false);
        try {
            const data = await Reference.get(referenceId);
            if (!isMountedRef.current) return;
            
            const refData = {
                title: data.title || '',
                authors: data.authors || '',
                year: data.year || '',
                publication: data.publication || '',
                type: VALID_TYPES.includes(data.type) ? data.type : 'article',
                notes: data.notes || ''
            };
            
            setReference(data);
            setTitle(refData.title);
            setAuthors(refData.authors);
            setYear(refData.year);
            setPublication(refData.publication);
            setType(refData.type);
            setNotes(refData.notes);
            setOriginalData(refData);
            setCurrentReferenceId(referenceId);
            setHasUnsavedChanges(false);
            setJustSaved(false);
            setTimeout(() => setIsContentLoaded(true), 0);
        } catch (e) {
            if (!isMountedRef.current) return;
            
            console.error("Failed to fetch reference", e);
            
            const is404 = (
                (e.message && (e.message.includes('404') || e.message.includes('not found'))) || 
                (e.response && e.response.status === 404) ||
                (e.status === 404)
            );
            
            if (is404) {
                setLoadError('이 참고문헌이 삭제되었거나 존재하지 않습니다.');
            } else {
                setLoadError('참고문헌을 불러오는 중 오류가 발생했습니다: ' + e.message);
            }
            setReference(null);
        }
        setIsLoading(false);
    }, [referenceId]);

    // 참고문헌 변경 시 데이터 손실 경고 처리
    useEffect(() => {
        if (referenceId && referenceId !== currentReferenceId) {
            // 기존에 저장하지 않은 변경사항이 있다면 경고
            if (hasUnsavedChanges && !justSaved) {
                setShowDataLossWarning(true);
                return;
            }
            
            // 새 참고문헌 로드
            fetchReference();
        }
    }, [referenceId, currentReferenceId, hasUnsavedChanges, justSaved, fetchReference]);

    // 변경사항 감지 - justSaved 상태일 때는 감지하지 않음
    useEffect(() => {
        if (!originalData || isSaving || justSaved) return;
        
        const hasChanges = (
            title !== originalData.title || 
            authors !== originalData.authors || 
            year !== originalData.year || 
            publication !== originalData.publication || 
            type !== originalData.type || 
            notes !== originalData.notes
        );

        setHasUnsavedChanges(hasChanges);
    }, [title, authors, year, publication, type, notes, originalData, isSaving, justSaved]);

    // 저장 함수 (자동/수동 겸용)
    const handleSave = useCallback(async (isAutoSave = false) => {
        if (!referenceId || isSaving) return;

        // 자동 저장 시 빈 제목 저장 방지
        if (isAutoSave && !title.trim()) {
            return;
        }

        setIsSaving(true);
        // Clear any pending auto-save timer immediately when a save (manual or auto) is triggered
        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = null;
        }

        try {
            const updatePayload = { 
                title,
                authors,
                year: year ? Number(year) : null,
                publication,
                type,
                notes
            };
            await Reference.update(referenceId, updatePayload);
            
            // 앱 상태 업데이트
            updateReferenceInState({ id: referenceId, ...updatePayload });

            const newOriginalData = { title, authors, year, publication, type, notes };
            setOriginalData(newOriginalData);
            setHasUnsavedChanges(false);
            setJustSaved(true);
            
            setTimeout(() => {
                if (isMountedRef.current) setJustSaved(false);
            }, 3000);
            
        } catch (error) {
            console.error('저장 실패:', error);
            const is404 = (error.response && error.response.status === 404) || (error.message && error.message.includes('404'));
            
            if (is404) {
              setLoadError('이 참고문헌이 삭제되어 저장할 수 없습니다. 목록을 새로고침 해주세요.');
              setReference(null);
            } else {
              if (!isAutoSave) alert('저장에 실패했습니다: ' + error.message);
            }
        } finally {
            if (isMountedRef.current) setIsSaving(false);
        }
    }, [referenceId, isSaving, title, authors, year, publication, type, notes, updateReferenceInState]);

    // 자동 저장 로직
    useEffect(() => {
        if (!isContentLoaded || !hasUnsavedChanges) {
            return;
        }

        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
        }

        autoSaveTimer.current = setTimeout(() => {
            handleSave(true);
        }, 2000);

        return () => {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
            }
        };
    }, [title, authors, year, publication, type, notes, isContentLoaded, hasUnsavedChanges, handleSave]);
    
    const handleManualSave = useCallback(() => {
        handleSave(false);
    }, [handleSave]);


    // Ctrl+S 저장 기능
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleManualSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleManualSave]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin" />
                <span className="ml-2">참고문헌을 불러오는 중...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white relative">
            {showDataLossWarning && originalData && (
                <Alert className="m-4 border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <p className="font-medium">저장하지 않은 변경사항이 있습니다!</p>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    onClick={async () => {
                                        await handleManualSave();
                                        setShowDataLossWarning(false);
                                        fetchReference();
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    먼저 저장하기
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                        if (window.confirm('정말로 저장하지 않고 다른 참고문헌으로 이동하시겠습니까? 변경사항이 모두 사라집니다.')) {
                                            setShowDataLossWarning(false);
                                            setHasUnsavedChanges(false);
                                            fetchReference();
                                        }
                                    }}
                                    className="text-red-600"
                                >
                                    변경사항 버리고 이동
                                </Button>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {loadError ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">오류가 발생했습니다</h3>
                    <p className="text-slate-500">{loadError}</p>
                </div>
            ) : !reference ? (
                <div className="p-4 text-sm text-red-600">참고문헌을 불러오지 못했습니다.</div>
            ) : (
                <>
                    <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="text-xl font-semibold w-full focus:outline-none bg-transparent text-slate-800"
                            placeholder="참고문헌 제목"
                        />
                        <div className="flex items-center gap-3">
                            <div className="text-sm whitespace-nowrap">
                                {isSaving ? (
                                    <span className="text-blue-600 font-medium">저장중...</span>
                                ) : hasUnsavedChanges ? (
                                    <span className="text-orange-600 font-medium">저장 안됨</span>
                                ) : (
                                    <span className="text-green-600">저장됨</span>
                                )}
                            </div>
                            <Button 
                                onClick={handleManualSave} 
                                disabled={isSaving} 
                                variant={hasUnsavedChanges ? "default" : "outline"} 
                                size="sm" 
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? '저장중...' : '저장'}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-shrink-0 border-b border-slate-200 bg-slate-50/50">
                        <ReferenceField label="저자" value={authors} onChange={setAuthors} />
                        <div className="grid grid-cols-2 gap-6">
                            <ReferenceField label="연도" value={year} onChange={setYear} />
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">유형</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    className="w-full p-2 mt-1 bg-transparent focus:outline-none border-b-2 border-transparent focus:border-indigo-400 transition-colors"
                                >
                                    <option value="article">Article</option>
                                    <option value="book">Book</option>
                                    <option value="website">Website</option>
                                    <option value="journal">Journal</option>
                                </select>
                            </div>
                        </div>
                        <ReferenceField label="저널/출판사" value={publication} onChange={setPublication} />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={notes}
                            onChange={setNotes}
                            placeholder="여기에 리서치 노트를 작성하세요..."
                            className="h-full reference-editor-no-spellcheck"
                            modules={{ toolbar: [['bold', 'italic', 'underline'], [{'list': 'bullet'}]] }}
                        />
                    </div>
                </>
            )}
            
            <style>{`
                .ql-toolbar { 
                    border-left: none !important; 
                    border-right: none !important; 
                    border-top-width: 1px !important; 
                    background-color: #fafafa;
                    min-height: 42px !important;
                }
                .ql-container { border: none !important; }
                .ql-editor { padding: 1.5rem; font-size: 16px; line-height: 1.7; color: #334155; }
                
                /* 맞춤법 검사 완전히 비활성화 */
                .reference-editor-no-spellcheck .ql-editor {
                  -webkit-text-decoration-skip: none !important;
                  text-decoration-skip-ink: none !important;
                }
                .reference-editor-no-spellcheck .ql-editor,
                .reference-editor-no-spellcheck .ql-editor * {
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
