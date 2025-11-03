
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note } from '@/api/entities';
import { NoteVersion } from '@/api/entities';
import TiptapEditor from './TiptapEditor';
import './TiptapEditor.css';
import _ from 'lodash';
import { BookText, Plus, BookOpen, BarChart3, ChevronsLeft, GripVertical, History, AlertTriangle, Save, ListTree, Link2, Download, Languages, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FootnotePanel from './FootnotePanel';
import TableOfContentsPanel from './TableOfContentsPanel';
import ReferenceInsertModal from './ReferenceInsertModal';
import EditorProgressBar from './EditorProgressBar';
import WritingStats from './WritingStats';
import PomoFlowPanel from './PomoFlowPanel';
import VersionHistoryPanel from './VersionHistoryPanel';
import BiDirectionalLinks, { renderLinksInContent } from './BiDirectionalLinks';
import { useData } from '@/components/providers/DataProvider';
import TagInput from './TagInput';
import ExportModal from './ExportModal';
import NoteSuggestionPopover from './NoteSuggestionPopover';

const getCharCount = (html) => {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>/g, '');
    return text.length;
};

const ResizablePanel = ({ children, initialWidth, onResize, handlePosition = 'left' }) => {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    const handleMouseDown = (e) => {
        e.preventDefault();
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e) => {
        if (!isResizing.current) return;
        let newWidth;
        if (handlePosition === 'left') {
            newWidth = window.innerWidth - e.clientX;
        } else {
            newWidth = e.clientX;
        }
        
        if (newWidth > 250 && newWidth < window.innerWidth * 0.7) {
            setWidth(newWidth);
            if (onResize) onResize(newWidth);
        }
    }, [handlePosition, onResize]);

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleClass = handlePosition === 'left' ? 'left-0' : 'right-0';

    return (
        <div style={{ width: `${width}px` }} className="relative h-full flex-shrink-0">
            <div
                onMouseDown={handleMouseDown}
                className={`absolute ${handleClass} top-0 h-full w-2 cursor-col-resize z-10 flex items-center justify-center group`}
            >
                <GripVertical className="h-6 w-3 text-slate-300 group-hover:text-primary transition-colors" />
            </div>
            {children}
        </div>
    );
};

export default function Editor({ note, onNavigateToNote, isReadMode: externalReadMode, onEnterTranslationMode }) {
    const { allNotes, updateNoteInState, currentProject, projects, setCurrentProject } = useData();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [footnotes, setFootnotes] = useState([]);
    const [targetWords, setTargetWords] = useState(null);
    const [tags, setTags] = useState([]);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [sidePanelMode, setSidePanelMode] = useState('links');
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [isReadMode, setIsReadMode] = useState(externalReadMode ?? false);
    const [useSerifFont, setUseSerifFont] = useState(false);
    const [isTranslateMode, setIsTranslateMode] = useState(false);
    
    const [originalData, setOriginalData] = useState(null);
    const [currentNoteId, setCurrentNoteId] = useState(null);
    const [isContentLoaded, setIsContentLoaded] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showDataLossWarning, setShowDataLossWarning] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const [versions, setVersions] = useState([]);
    const [showReferenceModal, setShowReferenceModal] = useState(false);
    const [showWritingStats, setShowWritingStats] = useState(false);
    const [showPomoFlowPanel, setShowPomoFlowPanel] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [suggestionState, setSuggestionState] = useState({
        isOpen: false,
        targetRect: null,
        query: '',
        suggestions: [],
        startPos: 0,
        selectedIndex: 0,
    });

    const [currentLine, setCurrentLine] = useState(null);
    const [enableZebraStripes, setEnableZebraStripes] = useState(false);
    const [enableLineHighlight, setEnableLineHighlight] = useState(true);

    const editorRef = useRef(null);
    const editorContainerRef = useRef(null);
    const readOnlyContentRef = useRef(null);
    const autoSaveTimer = useRef(null);

    useEffect(() => {
        if (externalReadMode !== undefined && externalReadMode !== isReadMode) {
            setIsReadMode(externalReadMode);
        }
    }, [externalReadMode, isReadMode]);

    useEffect(() => {
        if (editorRef.current && !isReadMode) {
            const editor = editorRef.current.getEditor();
            if (editor) {
                const editorElement = editor.view.dom;
                editorElement.setAttribute('spellcheck', 'false');
                editorElement.setAttribute('data-gramm', 'false');
                editorElement.setAttribute('data-gramm_editor', 'false');
                editorElement.setAttribute('data-enable-grammarly', 'false');
            }
        }
    }, [isReadMode]);
    
    const closeSuggestionPopover = useCallback(() => {
        setSuggestionState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleEditorChange = useCallback((html) => {
        setContent(html);

        if (isReadMode || !editorRef.current) return;

        const editor = editorRef.current.getEditor();
        if (!editor) return;

        const { from } = editor.state.selection;
        const textBeforeCursor = editorRef.current.getText(0, from);
        
        const linkStartIndex = textBeforeCursor.lastIndexOf('[[');
        const linkEndIndex = textBeforeCursor.lastIndexOf(']]');

        if (linkStartIndex !== -1 && linkStartIndex > linkEndIndex) {
            const query = textBeforeCursor.substring(linkStartIndex + 2);
            
            const filteredSuggestions = allNotes
                .filter(n => n.id !== note.id && n.title.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 10);

            if (query.length > 0 && filteredSuggestions.length > 0) {
                // Tiptap에서 커서 위치 계산
                const coords = editor.view.coordsAtPos(from);
                const editorRect = editor.view.dom.getBoundingClientRect();
                
                setSuggestionState({
                    isOpen: true,
                    targetRect: {
                        left: coords.left - editorRect.left,
                        top: coords.top - editorRect.top,
                        bottom: coords.bottom - editorRect.top,
                        height: coords.bottom - coords.top,
                    },
                    query: query,
                    suggestions: filteredSuggestions,
                    startPos: linkStartIndex + 2,
                    selectedIndex: 0,
                });
            } else {
                closeSuggestionPopover();
            }
        } else {
            closeSuggestionPopover();
        }
    }, [isReadMode, allNotes, note, closeSuggestionPopover]);
    
    const handleSelectSuggestion = useCallback((selectedTitle) => {
        if (!editorRef.current) return;
        
        const { startPos, query } = suggestionState;
        
        editorRef.current.deleteText(startPos - 2, query.length + 2);
        editorRef.current.insertText(`[[${selectedTitle}]]`, startPos - 2);
        editorRef.current.setSelection(startPos - 2 + selectedTitle.length + 4);
        closeSuggestionPopover();
    }, [suggestionState, closeSuggestionPopover]);

    const handleSave = useCallback(async (isAutoSave = false) => {
        if (!note?.id || isSaving) return;

        setIsSaving(true);
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        try {
            if (!isAutoSave && originalData?.content && originalData.content.trim() !== '') {
                await NoteVersion.create({
                    note_id: note.id,
                    title: originalData.title,
                    content: originalData.content,
                    footnotes: originalData.footnotes,
                    tags: originalData.tags,
                });
            }

            const updatePayload = {
                title,
                content,
                footnotes,
                target_words: targetWords,
                tags
            };

            await Note.update(note.id, updatePayload);
            updateNoteInState({ id: note.id, ...updatePayload });

            setOriginalData(updatePayload);
            setHasUnsavedChanges(false);
            setLastSaved(new Date());
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);

        } catch (error) {
            console.error('저장 실패:', error);
        } finally {
            setIsSaving(false);
        }
    }, [note, isSaving, title, content, footnotes, targetWords, tags, originalData, updateNoteInState]);

    useEffect(() => {
        if (isReadMode && readOnlyContentRef.current) {
            const handleClick = (event) => {
                const target = event.target.closest('.bidirectional-link');
                if (target && target.dataset.noteId) {
                    event.preventDefault();
                    const noteId = target.dataset.noteId;
                    if (noteId && onNavigateToNote) {
                        onNavigateToNote(noteId);
                    }
                }
            };
            
            const container = readOnlyContentRef.current;
            container.addEventListener('click', handleClick);
            return () => container.removeEventListener('click', handleClick);
        }
    }, [isReadMode, onNavigateToNote, content]);

    useEffect(() => {
        if (note?.id && note.id !== currentNoteId) {
            if (currentNoteId !== null && hasUnsavedChanges && !justSaved) {
                if (window.confirm("저장되지 않은 변경사항이 있습니다. 저장하고 이동하시겠습니까?")) {
                    handleSave(false);
                } else {
                    setHasUnsavedChanges(false);
                }
            }
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            setIsContentLoaded(false);
            setHasUnsavedChanges(false);
            setJustSaved(false);
            setShowVersionHistory(false);
            setIsTranslateMode(false);
            setIsReadMode(externalReadMode ?? false); 
            closeSuggestionPopover();

            const noteData = {
                title: note.title || '',
                content: note.content || '',
                footnotes: note.footnotes || [],
                target_words: note.target_words || null,
                tags: note.tags || []
            };

            setTitle(noteData.title);
            setContent(noteData.content);
            setFootnotes(noteData.footnotes);
            setTargetWords(noteData.target_words);
            setTags(noteData.tags);
            setOriginalData({ ...noteData });
            
            setCurrentNoteId(note.id);
            setLastSaved(new Date());

            setTimeout(() => {
                setIsContentLoaded(true);
            }, 100);
        } else if (!note) {
            setCurrentNoteId(null);
            setIsContentLoaded(false);
            setContent('');
            setTitle('');
            setFootnotes([]);
            setTargetWords(null);
            setTags([]);
            setOriginalData(null);
            setHasUnsavedChanges(false);
            setJustSaved(false);
            setShowVersionHistory(false);
            setIsTranslateMode(false);
            setIsReadMode(externalReadMode ?? false); 
            closeSuggestionPopover();
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        }
    }, [note, currentNoteId, hasUnsavedChanges, justSaved, handleSave, closeSuggestionPopover, externalReadMode]);

    useEffect(() => {
        if (!isContentLoaded || !originalData || isSaving || justSaved) return;

        const contentChanged = content !== originalData.content;
        const titleChanged = title !== originalData.title;
        const footnotesChanged = JSON.stringify(footnotes) !== JSON.stringify(originalData.footnotes);
        const targetChanged = targetWords !== originalData.target_words;
        const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalData.tags);

        setHasUnsavedChanges(contentChanged || titleChanged || footnotesChanged || targetChanged || tagsChanged);

    }, [title, content, footnotes, targetWords, tags, originalData, isSaving, justSaved, isContentLoaded]);

    useEffect(() => {
        if (hasUnsavedChanges && !isSaving && isContentLoaded && !isReadMode) {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => handleSave(true), 3000);
            return () => clearTimeout(autoSaveTimer.current);
        }
    }, [hasUnsavedChanges, isSaving, isContentLoaded, handleSave, isReadMode]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && !isReadMode) {
                e.preventDefault();
                handleSave(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, isReadMode]);

    // Tiptap에서는 줄 강조와 줄무늬 기능을 CSS로 처리
    // 향후 필요시 Tiptap 플러그인으로 구현 가능

    const loadVersions = useCallback(async () => {
        if (!note?.id) return;
        const fetchedVersions = await NoteVersion.filter({ note_id: note.id }, '-created_date', 50);
        setVersions(fetchedVersions);
    }, [note?.id]);

    const handleToggleVersionHistory = () => {
        if (!showVersionHistory) loadVersions();
        setShowVersionHistory(!showVersionHistory);
    };

    const handleRestoreVersion = async (version) => {
        if (!note?.id || !window.confirm('이 버전으로 복원하시겠습니까? 현재 내용은 덮어쓰여집니다.')) return;

        if (originalData?.content) {
            await NoteVersion.create({
                note_id: note.id,
                title: originalData.title,
                content: originalData.content,
                footnotes: originalData.footnotes,
                tags: originalData.tags,
            });
        }
        
        const restoredRawData = {
            title: version.title,
            content: version.content,
            footnotes: version.footnotes || [],
            target_words: targetWords,
            tags: version.tags || []
        };

        setTitle(restoredRawData.title);
        setContent(restoredRawData.content);
        setFootnotes(restoredRawData.footnotes);
        setTags(restoredRawData.tags);
        setOriginalData(restoredRawData);
        
        await Note.update(note.id, {
            title: restoredRawData.title,
            content: restoredRawData.content,
            footnotes: restoredRawData.footnotes,
            tags: restoredRawData.tags
        });
        updateNoteInState({ id: note.id, ...restoredRawData });
        
        setHasUnsavedChanges(false);
        setShowVersionHistory(false);
        setLastSaved(new Date());
    };

    const handleAddFootnote = () => {
        const newId = footnotes.length > 0 ? Math.max(...footnotes.map(f => f.id)) + 1 : 1;
        setFootnotes([...footnotes, { id: newId, content: '' }]);
        if (editorRef.current) {
            const selection = editorRef.current.getSelection();
            if (selection) {
                editorRef.current.insertText(`[${newId}]`, selection.index);
            }
        }
    };

    const handleReferenceInsert = (data) => {
        if (editorRef.current) {
            const selection = editorRef.current.getSelection();
            if (selection) {
                editorRef.current.insertText(data.citationText, selection.index);
            }
        }
        setShowReferenceModal(false);
    };

    const handleToggleSidePanelMode = () => setSidePanelMode(prev => prev === 'links' ? 'toc' : 'links');

    const projectNotes = currentProject ? allNotes.filter(n => n.project_id === currentProject.id) : allNotes;
    const projectChars = projectNotes.reduce((sum, n) => sum + getCharCount(n.content), 0);
    const projectTarget = projectNotes.reduce((sum, n) => sum + (n.target_words || 0), 0);
    const charCount = getCharCount(content);

    return (
        <div className="h-full flex flex-col bg-white relative">
            
            {showDataLossWarning && (
                <Alert className="m-4 border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <p className="font-medium">저장하지 않은 변경사항이 있습니다!</p>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={async () => { await handleSave(false); setShowDataLossWarning(false); }} className="bg-red-600 hover:bg-red-700">먼저 저장</Button>
                                <Button size="sm" variant="outline" onClick={() => { if (window.confirm('변경사항을 버리시겠습니까?')) { setShowDataLossWarning(false); setHasUnsavedChanges(false); setCurrentNoteId(null); } }} className="text-red-600">변경사항 버리기</Button>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="h-12 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="문서 제목"
                    className="text-xl font-semibold tracking-tight flex-1 focus:outline-none bg-transparent text-slate-800 min-w-0"
                    disabled={isReadMode}
                />
                
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-sm whitespace-nowrap hidden md:block">
                        {isSaving ? (<span className="text-blue-600 font-medium">저장중...</span>)
                        : hasUnsavedChanges ? (<span className="text-orange-600 font-medium">저장 안됨</span>)
                        : (<span className="text-green-600">저장됨</span>)}
                    </div>
                    
                    <Button 
                        onClick={() => handleSave(false)} 
                        disabled={isSaving || !hasUnsavedChanges || isReadMode} 
                        variant={hasUnsavedChanges ? "default" : "outline"} 
                        size="sm" 
                        className="gap-1 h-8 text-xs"
                    >
                        <Save className="h-3 w-3" />
                        <span className="hidden sm:inline">{isSaving ? '저장중' : '저장'}</span>
                    </Button>

                    <div className="hidden lg:flex items-center gap-1">
                        {externalReadMode === undefined && (
                            <Button 
                                onClick={() => setIsReadMode(!isReadMode)} 
                                variant={isReadMode ? "default" : "outline"} 
                                size="sm" 
                                className="gap-1 h-8 text-xs"
                            >
                                {isReadMode ? '편집' : '읽기'}
                            </Button>
                        )}
                        
                        {isReadMode && (
                            <Button 
                                onClick={() => setUseSerifFont(!useSerifFont)} 
                                variant={useSerifFont ? "default" : "outline"} 
                                size="sm" 
                                className="gap-1 h-8 text-xs"
                                title="폰트 변경"
                            >
                                {useSerifFont ? '명조' : '고딕'}
                            </Button>
                        )}
                        
                        {onEnterTranslationMode && note && (
                            <Button 
                                onClick={() => onEnterTranslationMode(note.id)} 
                                variant="outline" 
                                size="sm" 
                                className="gap-1 h-8 text-xs"
                            >
                                <Languages className="h-3 w-3" />
                                번역
                            </Button>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="lg:hidden">
                                {externalReadMode === undefined && (
                                    <DropdownMenuItem onClick={() => setIsReadMode(!isReadMode)}>
                                        {isReadMode ? '편집 모드' : '읽기 모드'}
                                    </DropdownMenuItem>
                                )}
                                
                                {isReadMode && (
                                    <DropdownMenuItem onClick={() => setUseSerifFont(!useSerifFont)}>
                                        폰트: {useSerifFont ? '명조체' : '고딕체'}
                                    </DropdownMenuItem>
                                )}
                                
                                {onEnterTranslationMode && note && (
                                    <DropdownMenuItem onClick={() => onEnterTranslationMode(note.id)}>
                                        <Languages className="h-4 w-4 mr-2" />
                                        번역 모드
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="lg:hidden" />
                            </div>

                            <DropdownMenuItem onClick={handleToggleVersionHistory}>
                                <History className="h-4 w-4 mr-2" />
                                버전 히스토리
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                onClick={() => setShowReferenceModal(true)}
                                disabled={isReadMode}
                            >
                                <BookOpen className="h-4 w-4 mr-2" />
                                참고문헌 삽입
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                onClick={handleAddFootnote}
                                disabled={isReadMode}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                각주 추가
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={handleToggleSidePanelMode}>
                                {sidePanelMode === 'links' ? (
                                    <>
                                        <ListTree className="h-4 w-4 mr-2" />
                                        목차 보기
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4 mr-2" />
                                        링크 보기
                                    </>
                                )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => setShowExportModal(true)}>
                                <Download className="h-4 w-4 mr-2" />
                                내보내기
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                        className="h-8 w-8"
                    >
                        <ChevronsLeft className={`h-4 w-4 transform transition-transform ${isSidePanelOpen ? 'rotate-180' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <TagInput 
                      tags={tags}
                      onChange={setTags}
                      disabled={isReadMode}
                    />
                  </div>
                  
                  {!isReadMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant={enableLineHighlight ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEnableLineHighlight(!enableLineHighlight)}
                        className="h-7 text-xs gap-1"
                        title="현재 줄 강조"
                      >
                        줄 강조
                      </Button>
                      <Button
                        variant={enableZebraStripes ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEnableZebraStripes(!enableZebraStripes)}
                        className="h-7 text-xs gap-1"
                        title="교차 배경색"
                      >
                        줄무늬
                      </Button>
                    </div>
                  )}
                </div>
            </div>

            <div className="flex-1 flex min-h-0">
                <div className="flex-1 flex flex-col min-w-0">
                    <div ref={editorContainerRef} className="flex-1 overflow-y-auto" style={{ height: 0 }}>
                        {isReadMode ? (
                            <div ref={readOnlyContentRef} className={`p-8 prose prose-slate max-w-none dark:prose-invert ${useSerifFont ? 'font-serif-readmode' : 'font-sans-readmode'}`}>
                                <div dangerouslySetInnerHTML={{ __html: renderLinksInContent(content, allNotes, currentProject?.id) }} />
                                {footnotes.length > 0 && (
                                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                                        <h3 className="text-lg font-semibold mb-4">각주</h3>
                                        {footnotes.map((footnote) => (
                                            <div key={footnote.id} className="mb-2">
                                                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">[{footnote.id}]</span>
                                                <span className="ml-2">{footnote.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <TiptapEditor
                                ref={editorRef}
                                content={content}
                                onChange={handleEditorChange}
                                placeholder="노트를 작성하세요..."
                                disabled={isReadMode}
                            />
                        )}
                    </div>
                    <EditorProgressBar 
                        currentChars={charCount} 
                        targetChars={targetWords} 
                        onTargetChange={setTargetWords}
                        projectChars={projectChars}
                        projectTarget={projectTarget}
                        isInProject={!!(note?.project_id)}
                        disabled={isReadMode}
                    />
                </div>

                {showVersionHistory ? (
                    <ResizablePanel initialWidth={450}>
                        <VersionHistoryPanel versions={versions} onRestore={handleRestoreVersion} onClose={() => setShowVersionHistory(false)} />
                    </ResizablePanel>
                ) : isSidePanelOpen && (
                    <ResizablePanel initialWidth={350}>
                        {sidePanelMode === 'toc' ? (
                            <TableOfContentsPanel content={content} editorContainerRef={editorContainerRef} />
                        ) : (
                            <BiDirectionalLinks currentNote={note} onNavigateToNote={onNavigateToNote} />
                        )}
                    </ResizablePanel>
                )}
            </div>

            <NoteSuggestionPopover 
                isOpen={suggestionState.isOpen}
                targetRect={suggestionState.targetRect}
                suggestions={suggestionState.suggestions}
                onSelect={handleSelectSuggestion}
                onClose={closeSuggestionPopover}
                selectedIndex={suggestionState.selectedIndex}
            />
            <ReferenceInsertModal isOpen={showReferenceModal} onClose={() => setShowReferenceModal(false)} onInsert={handleReferenceInsert} />
            <WritingStats content={content} isVisible={showWritingStats} onToggle={() => setShowWritingStats(!showWritingStats)} />
            
            {!onEnterTranslationMode && (
                <PomoFlowPanel note={note} isVisible={showPomoFlowPanel} onToggle={() => setShowPomoFlowPanel(!showPomoFlowPanel)} />
            )}
            
            <ExportModal 
                isOpen={showExportModal} 
                onClose={() => setShowExportModal(false)} 
                noteId={note?.id}
                title={title}
                content={content}
                footnotes={footnotes}
                tags={tags}
            />
            <style>{`
                /* Tiptap 에디터 스타일 */
                .tiptap-editor .ProseMirror { 
                    font-size: 1.1rem; 
                    line-height: 1.8; 
                    padding: 2rem 4rem; 
                }
                
                .prose { 
                    font-size: 1.1rem; 
                    line-height: 1.8; 
                    padding: 2rem 4rem; 
                }
                .prose h1, .prose h2, .prose h3 { 
                    margin-top: 2rem; 
                    margin-bottom: 1rem; 
                }
                .prose p { 
                    margin-bottom: 1rem; 
                }
                
                /* Read mode font styles */
                .font-serif-readmode {
                    font-family: 'Noto Serif KR', serif;
                }
                .font-sans-readmode {
                    font-family: 'Noto Sans KR', sans-serif;
                }

                /* Disable spellcheck decorations */
                .tiptap-editor .ProseMirror {
                  -webkit-text-decoration-skip: none !important;
                  text-decoration-skip-ink: none !important;
                }
                .tiptap-editor .ProseMirror,
                .tiptap-editor .ProseMirror * {
                  text-decoration: none !important;
                  text-decoration-line: none !important;
                  text-decoration-style: none !important;
                }
                .tiptap-editor .ProseMirror [data-grammar-error],
                .tiptap-editor .ProseMirror [data-spelling-error],
                .tiptap-editor .ProseMirror [data-gramm],
                .tiptap-editor .ProseMirror [data-gramm_editor],
                .tiptap-editor .ProseMirror *[data-grammar-error],
                .tiptap-editor .ProseMirror *[data-spelling-error],
                .tiptap-editor .ProseMirror *[data-gramm],
                .tiptap-editor .ProseMirror *[data-gramm_editor] {
                  text-decoration: none !important;
                  border-bottom: none !important;
                  background: none !important;
                }
                  background-color: #f8fafc !important;
                  font-weight: 600;
                  color: #334155;
                }
                
                .ql-editor table tr:hover td {
                  background-color: #f8fafc !important;
                }
                
                .prose table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1rem 0;
                  background-color: white;
                }
                
                .prose table td,
                .prose table th {
                  border: 1px solid #e2e8f0;
                  padding: 0.75rem 1rem;
                  background-color: white;
                  text-align: left;
                  vertical-align: top;
                }
                
                .prose table th {
                  background-color: #f8fafc;
                  font-weight: 600;
                  color: #334155;
                }
                
                .prose table tr:hover td {
                  background-color: #f8fafc;
                }
                
                /* 읽기 모드 전용 스타일 */
                .prose blockquote {
                  border-left: 4px solid #e2e8f0;
                  padding-left: 1rem;
                  margin: 1.5rem 0;
                  font-style: italic;
                  color: #64748b;
                  background-color: #f8fafc;
                  padding: 1rem 1rem 1rem 1.5rem;
                  border-radius: 0.25rem;
                }
                
                .prose code {
                  background-color: #f1f5f9;
                  color: #e11d48;
                  padding: 0.2rem 0.4rem;
                  border-radius: 0.25rem;
                  font-size: 0.9em;
                  font-family: 'Courier New', Courier, monospace;
                }
                
                .prose pre {
                  background-color: #1e293b;
                  color: #e2e8f0;
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                  margin: 1.5rem 0;
                  line-height: 1.6;
                }
                
                .prose pre code {
                  background-color: transparent;
                  color: inherit;
                  padding: 0;
                  font-size: 0.9rem;
                  font-family: 'Courier New', Courier, monospace;
                }
                
                .prose ul, .prose ol {
                  margin: 1rem 0;
                  padding-left: 2rem;
                }
                
                .prose li {
                  margin: 0.5rem 0;
                }
                
                .prose strong {
                  font-weight: 600;
                  color: #1e293b;
                }
                
                .prose em {
                  font-style: italic;
                }
                
                .prose a {
                  color: #2563eb;
                  text-decoration: underline;
                }
                
                .prose a:hover {
                  color: #1d4ed8;
                }
            `}</style>
        </div>
    );
}
