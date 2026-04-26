"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';

// --- КОНСТАНТЫ И БАЗА ДАННЫХ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    EDU: 'tea_hub_completed_lessons',
    LESSON: 'tea_hub_selected_lesson'
};

const LESSONS_DATABASE = [
  {
    id: "lesson_1",
    title: "🍃 Основы: Ферментация",
    content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай. Зеленый чай почти не окислен (5-10%), поэтому он сохраняет свежесть. Красный чай окислен почти на 100%, что дает медовый вкус.",
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
    content: "Габа-чай ферментируется без доступа кислорода. Это заставляет лист вырабатывать ГАМК — аминокислоту, которая успокаивает нервную систему.",
    question: "В чем главная особенность Габа-чая?",
    options: ["Много кофеина", "Высокое содержание ГАМК", "Копченый вкус"],
    correct: 1
  },
  {
    id: "lesson_4",
    title: "🌑 Пуэры: Шу и Шен",
    content: "Шу Пуэр — темный и землистый. Шен — светлый, с фруктовой кислинкой.",
    question: "Какой пуэр имеет вкус «земли и старого дерева»?",
    options: ["Шен Пуэр", "Шу Пуэр", "Оба одинаковые"],
    correct: 1
  }
];

const DEFAULT_TASKS = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
];

export default function ShiftPage() {
  // --- СОСТОЯНИЯ (STATE) ---
  const [isMounted, setIsMounted] = useState(false); // Флаг готовности клиента
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // --- ЛОГИКА ИНИЦИАЛИЗАЦИИ (СЛОЖНЫЙ ПУТЬ) ---
  
  // 1. Единоразовая загрузка при старте
  useEffect(() => {
    const loadData = () => {
        const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        const savedEdu = localStorage.getItem(STORAGE_KEYS.EDU);
        const savedTab = localStorage.getItem(STORAGE_KEYS.TAB);
        const savedLesson = localStorage.getItem(STORAGE_KEYS.LESSON);

        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(DEFAULT_TASKS);

        if (savedEdu) setCompletedLessons(JSON.parse(savedEdu));
        
        if (savedTab === 'checklist' || savedTab === 'edu') {
            setActiveTab(savedTab as any);
        }

        if (savedLesson) setSelectedLessonId(savedLesson);
        
        // Разрешаем рендер только после того, как данные считаны
        setIsMounted(true);
    };

    loadData();
  }, []);

  // 2. Обёртки для изменения состояния с автоматическим сохранением
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

  const syncEdu = (newEdu: string[]) => {
    setCompletedLessons(newEdu);
    localStorage.setItem(STORAGE_KEYS.EDU, JSON.stringify(newEdu));
  };

  // --- ОБРАБОТЧИКИ (HANDLERS) ---
  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newList = [...tasks, { id: Date.now(), text: newTaskText, done: false }];
    syncTasks(newList);
    setNewTaskText("");
  };

  const toggleTask = (id: number) => {
    const newList = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    syncTasks(newList);
  };

  const deleteTask = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newList = tasks.filter(t => t.id !== id);
    syncTasks(newList);
  };

  const handleAnswer = (index: number, correct: number, lessonId: string) => {
    setActiveAnswer(index);
    if (index === correct && !completedLessons.includes(lessonId)) {
      const newEdu = [...completedLessons, lessonId];
      syncEdu(newEdu);
    }
  };

  const resetProgress = () => {
    if (confirm("Сбросить весь прогресс обучения?")) {
      syncEdu([]);
      setActiveAnswer(null);
    }
  };

  // Расчеты
  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  // Если клиентская часть еще не готова, показываем пустой экран или лоадер
  // Это предотвращает "прыжок" вкладок
  if (!isMounted) return <div style={{ background: '#0d0f0d', minHeight: '100vh' }} />;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        {/* КНОПКИ ПЕРЕКЛЮЧЕНИЯ */}
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px', border: '1px solid #222' } as any}>
          <div 
            onClick={() => updateTab('checklist')} 
            style={{ 
                flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', transition: '0.3s',
                backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', 
                color: activeTab === 'checklist' ? '#000' : '#555' 
            } as any}
          >📋 Чек-лист</div>
          <div 
            onClick={() => updateTab('edu')} 
            style={{ 
                flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', transition: '0.3s',
                backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', 
                color: activeTab === 'edu' ? '#000' : '#555' 
            } as any}
          >🎓 Обучение</div>
        </div>

        {activeTab === 'checklist' ? (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '28px' }}>Рабочая смена</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
                <input type="text" placeholder="Добавить задачу..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' } as any} />
                <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '24px' } as any}>+</div>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div key={t.id} onClick={() => toggleTask(t.id)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', opacity: t.done ? 0.4 : 1, transition: '0.2s' } as any}>
                  <div style={{ width: '24px', height: '24px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px', borderRadius: '6px', textAlign: 'center', color: '#000', fontWeight: 'bold', lineHeight: '22px' } as any}>{t.done && '✓'}</div>
                  <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  <div onClick={(e) => deleteTask(t.id, e)} style={{ color: '#444', fontSize: '18px', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ОБУЧЕНИЕ */
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' } as any}>
                    <h2 style={{ fontSize: '28px', margin: 0 }}>База знаний</h2>
                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                        <span style={{color: '#4CAF50', fontWeight: 'bold'}}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{fontSize:'12px', color:'#cc4444', cursor:'pointer', textDecoration: 'underline'}}>сбросить</div>
                    </div>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#161816', borderRadius: '100px', overflow: 'hidden', marginBottom: '30px', border:'1px solid #222' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: '0.5s' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {LESSONS_DATABASE.map(l => {
                    const isDone = completedLessons.includes(l.id);
                    return (
                      <div key={l.id} onClick={() => { updateLesson(l.id); setActiveAnswer(null); }} style={{ background: '#161816', padding: '30px', borderRadius: '25px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                        <h3 style={{ margin: 0, color: isDone ? '#4CAF50' : '#fff' }}>{l.title}</h3>
                        <p style={{marginTop: '10px', color: '#444', fontSize: '13px'}}>{isDone ? 'Пройдено ✓' : 'Начать →'}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222' } as any}>
                <div onClick={() => updateLesson(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← Назад к темам</div>
                <h2 style={{marginBottom: '20px'}}>{currentLesson?.title}</h2>
                <p style={{lineHeight: '1.8', color: '#bbb', marginBottom: '40px'}}>{currentLesson?.content}</p>
                <div style={{borderTop: '1px solid #333', paddingTop: '30px'}}>
                    <h4 style={{color: '#4CAF50', marginBottom: '20px'}}>📝 ТЕСТ: {currentLesson?.question}</h4>
                    {currentLesson?.options.map((o, i) => {
                        const isCorrect = i === currentLesson?.correct;
                        const isSelected = activeAnswer === i;
                        return (
                            <div key={`ans-${i}-${isSelected}`} onClick={() => handleAnswer(i, currentLesson!.correct, currentLesson!.id)} style={{ padding: '18px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '15px', marginTop: '10px', cursor: 'pointer', border: '1px solid #333', color: isSelected ? '#fff' : '#888' } as any}>{o}</div>
                        );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}