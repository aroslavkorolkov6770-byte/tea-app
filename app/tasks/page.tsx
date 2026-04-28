"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';

// --- КОНСТАНТЫ ПАМЯТИ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    EDU: 'tea_hub_completed_lessons',
    LESSON: 'tea_hub_selected_lesson'
};

// --- БАЗА ЗНАНИЙ (РАСШИРЕННАЯ) ---
const LESSONS_DATABASE = [
  {
    id: "lesson_1",
    title: "🍃 Основы: Ферментация",
    content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай. Зеленый чай почти не окислен (5-10%), Красный — окислен полностью.",
    question: "Какой процент окисления у красного чая?",
    options: ["5-10%", "40-60%", "90-100%"],
    correct: 2 
  },
  {
    id: "lesson_2",
    title: "🍵 Температурные режимы",
    content: "Светлые чаи заваривают при 75-80°C. Темные и Пуэры требуют кипяток 95-100°C.",
    question: "Как правильно заварить Шу Пуэр?",
    options: ["Водой 80°C", "Крутым кипятком", "Холодной водой"],
    correct: 1
  },
  {
    id: "lesson_3",
    title: "🧘 Габа: Спокойствие",
    content: "Габа-чай ферментируется без доступа кислорода. Это заставляет лист вырабатывать ГАМК — аминокислоту, успокаивающую нервную систему.",
    question: "В чем особенность Габа-чая?",
    options: ["Много кофеина", "Содержит ГАМК", "Копченый вкус"],
    correct: 1
  },
  {
    id: "lesson_4",
    title: "🌑 Пуэры: Шу и Шен",
    content: "Шу Пуэр — темный и землистый. Шен — светлый, с фруктовой кислинкой.",
    question: "Какой пуэр имеет вкус «земли и дерева»?",
    options: ["Шен Пуэр", "Шу Пуэр", "Оба"],
    correct: 1
  }
];

const DEFAULT_TASKS = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
];

export default function ShiftPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // --- ЛОГИКА ИНИЦИАЛИЗАЦИИ ---
  useEffect(() => {
    const loadData = () => {
        const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        const savedEdu = localStorage.getItem(STORAGE_KEYS.EDU);
        const savedTab = localStorage.getItem(STORAGE_KEYS.TAB);
        const savedLesson = localStorage.getItem(STORAGE_KEYS.LESSON);

        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(DEFAULT_TASKS);

        if (savedEdu) setCompletedLessons(JSON.parse(savedEdu));
        if (savedTab === 'checklist' || savedTab === 'edu') setActiveTab(savedTab as any);
        if (savedLesson) setSelectedLessonId(savedLesson);
        
        setIsMounted(true);
    };
    loadData();
  }, []);

  // --- ФУНКЦИИ СИНХРОНИЗАЦИИ ---
  const updateTab = (tab: 'checklist' | 'edu') => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEYS.TAB, tab);
  };

  const updateLesson = (id: string | null) => {
    setSelectedLessonId(id);
    if (id) localStorage.setItem(STORAGE_KEYS.LESSON, id);
    else localStorage.removeItem(STORAGE_KEYS.LESSON);
  };

  const syncTasks = (newTasks: any[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newList = [...tasks, { id: Date.now(), text: newTaskText, done: false }];
    syncTasks(newList);
    setNewTaskText("");
  };

  const handleAnswer = (index: number, correct: number, lessonId: string) => {
    setActiveAnswer(index);
    if (index === correct && !completedLessons.includes(lessonId)) {
      const newEdu = [...completedLessons, lessonId];
      setCompletedLessons(newEdu);
      localStorage.setItem(STORAGE_KEYS.EDU, JSON.stringify(newEdu));
    }
  };

  const resetProgress = () => {
    if (confirm("Сбросить прогресс обучения?")) {
      setCompletedLessons([]);
      localStorage.removeItem(STORAGE_KEYS.EDU);
      setActiveAnswer(null);
    }
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* ШИРОКИЙ ПЕРЕКЛЮЧАТЕЛЬ */}
        <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '25px', marginBottom: '60px', border: '1px solid #222' } as any}>
          <div 
            onClick={() => updateTab('checklist')} 
            style={{ 
                flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: '900', letterSpacing: '1px', transition: '0.4s',
                backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', 
                color: activeTab === 'checklist' ? '#000' : '#555' 
            } as any}
          >📋 РАБОЧАЯ СМЕНА</div>
          <div 
            onClick={() => updateTab('edu')} 
            style={{ 
                flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: '900', letterSpacing: '1px', transition: '0.4s',
                backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', 
                color: activeTab === 'edu' ? '#000' : '#555' 
            } as any}
          >🎓 КУРС МАСТЕРА</div>
        </div>

        {activeTab === 'checklist' ? (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>ЧЕК-ЛИСТ</h2>
                <span style={{ color: '#444', fontWeight: 'bold' }}>{tasks.filter(t=>t.done).length} / {tasks.length} ВЫПОЛНЕНО</span>
            </div>

            {/* ПОЛЕ ВВОДА */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' } as any}>
                <input type="text" placeholder="Добавить задачу в список..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '25px', borderRadius: '20px', background: '#161816', border: '1px solid #222', color: '#fff', outline: 'none', fontSize: '18px' } as any} />
                <div onClick={addTask} style={{ padding: '0 40px', background: '#4CAF50', color: '#000', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '24px' } as any}>+</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' } as any}>
              {tasks.map(t => (
                <div key={t.id} onClick={() => syncTasks(tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i))} style={{ background: t.done ? 'rgba(76, 175, 80, 0.05)' : '#161816', padding: '30px', borderRadius: '25px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', transition: '0.3s' } as any}>
                  <div style={{ width: '28px', height: '28px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '20px', borderRadius: '8px', textAlign: 'center', color: '#000', fontWeight: '900', lineHeight: '24px' } as any}>{t.done && '✓'}</div>
                  <span style={{ flex: 1, fontSize: '18px', fontWeight: '500', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#444' : '#fff' }}>{t.text}</span>
                  <div onClick={(e: any) => { e.stopPropagation(); syncTasks(tasks.filter(x => x.id !== t.id)); }} style={{ color: '#333', fontSize: '20px', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ОБУЧЕНИЕ - РЕДИЗАЙН КАРТОЧЕК */
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } as any}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>БАЗА ЗНАНИЙ</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' } as any}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#4CAF50' }}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{ padding: '10px 20px', background: 'rgba(204, 68, 68, 0.1)', borderRadius: '10px', fontSize: '12px', color: '#cc4444', cursor: 'pointer', fontWeight: 'bold', border: '1px solid rgba(204, 68, 68, 0.2)' } as any}>СБРОСИТЬ</div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '14px', background: '#161816', borderRadius: '100px', overflow: 'hidden', marginBottom: '60px', border:'1px solid #222' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #2e7d32, #4CAF50)', transition: '1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' } as any}>
                  {LESSONS_DATABASE.map((l, index) => {
                    const isDone = completedLessons.includes(l.id);
                    return (
                      <div key={l.id} onClick={() => { updateLesson(l.id); setActiveAnswer(null); }} style={{ background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer', transition: '0.4s', position: 'relative', overflow: 'hidden' } as any}>
                        <span style={{ position: 'absolute', top: '20px', right: '30px', fontSize: '60px', fontWeight: '900', color: 'rgba(255,255,255,0.03)' }}>0{index+1}</span>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: isDone ? '#4CAF50' : '#fff', position: 'relative' }}>{l.title}</h3>
                        <div style={{ marginTop: '20px', color: isDone ? '#2e7d32' : '#444', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>{isDone ? 'ИЗУЧЕНО ✓' : 'НАЧАТЬ КУРС →'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* ПРОСМОТР УРОКА (ШИРОКИЙ) */
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222', boxShadow: '0 30px 100px rgba(0,0,0,0.8)' } as any}>
                <div onClick={() => updateLesson(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '40px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' } as any}><span>←</span> ВЕРНУТЬСЯ К ТЕМАМ</div>
                <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '20px' }}>{currentLesson?.title}</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb', marginBottom: '50px', maxWidth: '800px' }}>{currentLesson?.content}</p>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '40px' } as any}>
                    <h4 style={{ color: '#4CAF50', fontSize: '20px', marginBottom: '30px', fontWeight: '800' }}>📝 ПРОВЕРКА ЗНАНИЙ: <span style={{color: '#fff'}}>{currentLesson?.question}</span></h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' } as any}>
                        {currentLesson?.options.map((o, i) => {
                            const isCorrect = i === currentLesson?.correct;
                            const isSelected = activeAnswer === i;
                            return (
                                <div key={`ans-${i}-${isSelected}`} onClick={() => handleAnswer(i, currentLesson!.correct, currentLesson!.id)} style={{ padding: '25px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '20px', cursor: 'pointer', border: '1px solid #222', color: isSelected ? '#fff' : '#888', fontWeight: 'bold', textAlign: 'center', transition: '0.2s' } as any}>{o}</div>
                            );
                        })}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}