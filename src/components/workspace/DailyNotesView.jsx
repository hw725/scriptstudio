import React, { useState, useEffect } from 'react';
import { DailyNote } from '@/api/entities';
import DailyNoteEditor from './DailyNoteEditor';
import { Calendar, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

const moodEmojis = {
  great: '😄',
  good: '😊',
  okay: '😐',
  bad: '😔',
  terrible: '😢'
};

export default function DailyNotesView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEditor, setShowEditor] = useState(false);
  const [dailyNotes, setDailyNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDailyNotes = async () => {
    setIsLoading(true);
    try {
      const notes = await DailyNote.list('-date', 30); // 최근 30개
      setDailyNotes(notes);
    } catch (error) {
      console.error('데일리 노트 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDailyNotes();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowEditor(true);
  };

  const handleBackToCalendar = () => {
    setShowEditor(false);
    loadDailyNotes(); // 목록 새로고침
  };

  const getDailyNoteForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyNotes.find(note => note.date === dateString);
  };

  if (showEditor) {
    return (
      <DailyNoteEditor
        selectedDate={selectedDate}
        onBack={handleBackToCalendar}
      />
    );
  }

  // 달력 뷰
  const currentMonth = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarDays = eachDayOfInterval({ start: currentMonth, end: monthEnd });

  const prevMonth = () => setSelectedDate(subDays(selectedDate, 30));
  const nextMonth = () => setSelectedDate(addDays(selectedDate, 30));

  return (
    <div className="h-full bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            데일리 노트
          </h1>
          <Button onClick={() => handleDateSelect(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            오늘 일기 쓰기
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 달력 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{format(selectedDate, 'yyyy년 M월')}</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={prevMonth} variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={nextMonth} variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-slate-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(day => {
                  const note = getDailyNoteForDate(day);
                  const hasNote = !!note;
                  const todayClass = isToday(day) ? 'ring-2 ring-primary' : '';
                  
                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDateSelect(day)}
                      className={`
                        p-2 h-16 border rounded-lg hover:bg-slate-100 transition-colors
                        ${hasNote ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}
                        ${todayClass}
                      `}
                    >
                      <div className="text-sm font-medium">{format(day, 'd')}</div>
                      {hasNote && (
                        <div className="flex items-center justify-center mt-1">
                          <span className="text-lg">{moodEmojis[note.mood] || '📝'}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 최근 노트 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 일기</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">로딩중...</div>
              ) : dailyNotes.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  아직 작성된 일기가 없습니다
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyNotes.slice(0, 10).map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleDateSelect(new Date(note.date))}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {format(new Date(note.date), 'M월 d일')}
                        </span>
                        <span className="text-lg">{moodEmojis[note.mood]}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {note.title}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {note.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}