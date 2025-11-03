import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Trash2, ArrowLeft } from 'lucide-react';

export default function TemplateEditor({ template, onSave, onDelete, onBack }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        setTitle(template?.title || '');
        setDescription(template?.description || '');
        setContent(template?.content || '');
    }, [template]);

    const handleSave = () => {
        onSave({ ...template, title, description, content });
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    뒤로
                </Button>
                <div className="flex items-center gap-2">
                    {template?.id && (
                        <Button onClick={() => onDelete(template.id)} variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            삭제
                        </Button>
                    )}
                    <Button onClick={handleSave} size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        저장
                    </Button>
                </div>
            </div>
            <div className="space-y-4 mb-4">
                <Input 
                    placeholder="템플릿 제목" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-lg font-semibold"
                />
                <Textarea 
                    placeholder="템플릿 설명 (어떤 용도인지 적어주세요)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="h-20"
                />
            </div>
            <div className="flex-1 h-0">
                <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    className="h-full"
                    modules={{ toolbar: [[{ 'header': [1, 2, 3, false] }],['bold', 'italic', 'underline','strike', 'blockquote'],[{'list': 'ordered'}, {'list': 'bullet'}],['clean']]}}
                />
            </div>
        </div>
    );
}