import React, { useState, useEffect } from 'react';
import { Template } from '@/api/entities';
import TemplateEditor from '@/components/workspace/TemplateEditor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTemplates = async () => {
        setIsLoading(true);
        const data = await Template.list('-created_date');
        setTemplates(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async (templateData) => {
        if (templateData.id) {
            await Template.update(templateData.id, templateData);
        } else {
            await Template.create(templateData);
        }
        await fetchTemplates();
        setSelectedTemplate(null);
        setIsCreating(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('정말로 이 템플릿을 삭제하시겠습니까?')) {
            await Template.delete(id);
            await fetchTemplates();
            setSelectedTemplate(null);
        }
    };

    if (isLoading) {
        return <div className="p-6">템플릿을 불러오는 중...</div>;
    }
    
    if (selectedTemplate || isCreating) {
        return (
            <TemplateEditor
                template={selectedTemplate}
                onSave={handleSave}
                onDelete={handleDelete}
                onBack={() => { setSelectedTemplate(null); setIsCreating(false); }}
            />
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">템플릿 관리</h1>
                        <p className="text-slate-500">자주 사용하는 문서 구조를 템플릿으로 만들어 관리하세요.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl('Dashboard')}>
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> 대시보드로 돌아가기
                            </Button>
                        </Link>
                        <Button onClick={() => setIsCreating(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> 새 템플릿 만들기
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        {template.title}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTemplate(template)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </CardTitle>
                                <CardDescription>{template.description || '설명 없음'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    className="text-sm text-slate-600 line-clamp-3 border-t pt-3"
                                    dangerouslySetInnerHTML={{ __html: template.content || '내용 없음' }}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {templates.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-700">생성된 템플릿이 없습니다</h3>
                        <p className="text-slate-500 mt-2 mb-4">새 템플릿을 만들어보세요.</p>
                        <Button onClick={() => setIsCreating(true)}>
                            <Plus className="h-4 w-4 mr-2" /> 첫 템플릿 만들기
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}