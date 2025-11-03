import React, { useState, useEffect } from 'react';
import { Reference } from '@/api/entities';
import { CitationStyle } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function CitationGenerator() {
  const [references, setReferences] = useState([]);
  const [styles, setStyles] = useState([]);
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [bibliography, setBibliography] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [refs, citationStyles] = await Promise.all([
          Reference.list(),
          CitationStyle.list()
        ]);
        setReferences(refs || []);
        setStyles(citationStyles || []);
        if (citationStyles && citationStyles.length > 0) {
          setSelectedStyleId(citationStyles[0].id);
        }
      } catch (error) {
        console.error("인용 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const generateBibliography = () => {
    const selectedStyle = styles.find(s => s.id === selectedStyleId);
    if (!selectedStyle || !references) {
        setBibliography('스타일 또는 참고문헌을 찾을 수 없습니다.');
        return;
    }

    const generatedText = (references || []).map(ref => {
      let citation = selectedStyle.template;
      citation = citation.replace('{{authors}}', ref.authors || '');
      citation = citation.replace('{{title}}', ref.title || '');
      citation = citation.replace('{{year}}', ref.year || '');
      citation = citation.replace('{{publication}}', ref.publication || '');
      return citation;
    }).join('\n');
    
    setBibliography(generatedText);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bibliography);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>참고문헌 생성기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">인용 스타일</label>
            <Select value={selectedStyleId} onValueChange={setSelectedStyleId}>
              <SelectTrigger>
                <SelectValue placeholder="스타일 선택..." />
              </SelectTrigger>
              <SelectContent>
                {(styles || []).map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateBibliography}>생성하기</Button>
          
          {bibliography && (
            <div>
              <Textarea 
                readOnly 
                value={bibliography} 
                className="min-h-[200px] bg-slate-50"
              />
              <Button onClick={copyToClipboard} variant="outline" size="sm" className="mt-2">
                클립보드에 복사
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}