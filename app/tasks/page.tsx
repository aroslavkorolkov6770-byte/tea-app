"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '../supabaseClient';

// --- РАСШИРЕННАЯ БАЗА ЗНАНИЙ (РАДИКАЛЬНО ДОПОЛНЕНА) ---
const LESSONS_DATABASE = [
  {
    id: "lesson_1",
    title: "🍃 Основы: Ферментация",
    content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай. Зеленый чай почти не окислен (5-10%), поэтому он сохраняет свежесть. Красный чай окислен почти на 100%, что дает медовый и хлебный вкус.",
    question: "Какой процент окисления у красного чая?",
    options: ["5-10%", "40-60%", "90-100%"],
    correct: 2 
  },
  {
    id: "lesson_2",
    title: "🍵 Температурные режимы",
    content: "Светлые чаи (белый, зеленый) заваривают водой 75-80°C, чтобы не «сжечь» лист. Улуны любят 85-90°C. Черные чаи и Шу Пуэры требуют крутого кипятка 95-100°C для полного раскрытия вкуса.",
    question: "Какая температура нужна для заваривания Шу Пуэра?",
    options: ["80°C", "95-100°C", "70°C"],
    correct: 1
  },
  {
    id: "lesson_3",
    title: "🧘 Габа: ГАМК и спокойствие",
    content: "Габа-чай ферментируется без доступа кислорода. Это заставляет лист вырабатывать ГАМК — аминокислоту, которая успокаивает нервную систему, улучшает сон и помогает при стрессе.",
    question: "В какой среде проходит ферментация Габа-чая?",
    options: ["В вакууме (без кислорода)", "На открытом солнце", "В печах"],
    correct: 0
  },
  {
    id: "lesson_4",
    title: "🌑 Пуэры: Шу против Шена",
    content: "Шен Пуэр — это «сырой» чай, он созревает годами. Шу Пуэр — это «готовый» чай, он проходит ускоренную ферментацию (Во Дуй). Шен — кислый и фруктовый, Шу — землистый и плотный.",
    question: "Как называется процесс ускоренной ферментации Шу Пуэра?",
    options: ["Шай Цин", "Во Дуй", "Хун Пэй"],
    correct: 1
  },
  {
    id: "lesson_5",
    title: "🏺 Посуда: Исинская глина",
    content: "Чайники из исинской глины имеют пористую структуру. Они «запоминают» чай, который в них заваривают. Поэтому мастера рекомендуют использовать один чайник под один вид чая (например, только для темных улунов).",
    question: "Почему для одного чайника выбирают один вид чая?",
    options: ["Глина впитывает ароматы", "Чтобы чайник не треснул", "Это просто традиция"],
    correct: 0
  }
];

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Загрузка данных из Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Задачи
      const { data: tasksData } = await supabase.from('tasks').select('*').order('id', { ascending: true });
      if (tasksData) setTasks(tasksData);

      // 2. Прогресс обучения (уникальные значения)
      const { data: progressData } = await supabase.from('lesson_progress').select('lesson_id');
      if (progressData) {
          const uniqueIds = Array.from(new Set(progressData.map(p => p.lesson_id)));
          setCompletedLessons(uniqueIds);
      }
    } catch (err) {
      console.error("Ошибка сети:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ЛОГИКА ЧЕК-ЛИСТА ---
  const addTask = async () => {
    if (!newTaskText.trim()) return;
    const { error } = await supabase.from('tasks').insert([{ text: newTaskText, done: false }]);
    if (!error) {
      setNewTaskText("");
      fetchData();
    }
  };

  const deleteTask = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchData();
  };

  const toggleTask = async (id: number, currentDone: boolean) => {
    const { error } = await supabase.from('tasks').update({ done: !currentDone }).eq('id', id);
    if (!error) fetchData();
  };

  // --- ЛОГИКА ОБУЧЕНИЯ ---
  const saveLessonProgress = async (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
        await supabase.from('lesson_progress').insert([{ lesson_id: lessonId }]);
        fetchData(); // Обновляем прогресс-бар
    }
  };

  const resetProgress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Внимание! Весь прогресс обучения будет удален из облака. Продолжить?")) {
      const { error } = await supabase.from('lesson_progress').delete().neq('lesson_id', 'null');
      if (!error) {
        setCompletedLessons([]);
        fetchData();
      }
    }
  };

  // Расчет процента прогресса
  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        {/* ВКЛАДКИ (ТАБЫ) */}
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px', border: '1px solid #222' } as any}>
          {['checklist', 'edu'].map((tab) => (
            <div 
              key={`tab-${tab}-${activeTab === tab}`}
              onClick={() => { setActiveTab(tab as any); setSelectedLessonId(null); setActiveAnswer(null); }}
              style={{
                flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent',
                color: activeTab === tab ? '#000' : '#555', transition: '0.3s'
              } as any}
            >
              {tab === 'checklist' ? '📋 Чек-лист' : '🎓 Обучение'}
            </div>
          ))}
        </div>

        {/* --- РАЗДЕЛ: ЧЕК-ЛИСТ --- */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '28px' }}>Рабочая смена</h2>
            
            {/* ПОЛЕ ДОБАВЛЕНИЯ ЗАДАЧИ */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
                <input 
                    type="text" 
                    placeholder="Что нужно сделать?" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' } as any}
                />
                <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '20px' } as any}>+</div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.length === 0 && !loading && <p style={{textAlign:'center', color:'#444'}}>Задач нет. Добавьте первую!</p>}
              {tasks.map(t => (
                <div 
                  key={`task-item-${t.id}-${t.done}`}
                  onClick={() => toggleTask(t.id, t.done)}
                  style={{ 
                    background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', gap: '20px', 
                    alignItems: 'center', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222',
                    opacity: t.done ? 0.4 : 1, transition: '0.2s'
                  } as any}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', color: '#000', textAlign: 'center', lineHeight: '22px', fontWeight: 'bold' } as any}>
                    {t.done && '✓'}
                  </div>
                  <span style={{ flex: 1, fontSize: '16px', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  <div onClick={(e) => deleteTask(t.id, e)} style={{ color: '#444', fontSize: '18px', cursor: 'pointer', padding: '5px' } as any}>✕</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- РАЗДЕЛ: ОБУЧЕНИЕ --- */}
        {activeTab === 'edu' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {!selectedLessonId ? (
              <>
                {/* ШКАЛА ПРОГРЕССА И КНОПКА СБРОСА */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' } as any}>
                    <h2 style={{ fontSize: '28px', margin: 0 }}>База знаний</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' } as any}>
                        <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: 'bold' }}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{ padding: '8px 12px', background: '#1a1a1a', borderRadius: '10px', fontSize: '10px', color: '#cc4444', cursor: 'pointer', border: '1px solid #331111', fontWeight: 'bold', letterSpacing: '1px' } as any}>СБРОСИТЬ</div>
                    </div>
                </div>
                
                {/* ПОЛОСКА ПРОГРЕССА */}
                <div style={{ flex: 1, height: '12px', background: '#161816', borderRadius: '20px', overflow: 'hidden', border: '1px solid #222', marginBottom: '35px' } as any}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: 'width 0.8s ease', boxShadow: '0 0 15px rgba(76, 175, 80, 0.3)' } as any} />
                </div>

                {/* СПИСОК УРОКОВ (СЕТКА) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {LESSONS_DATABASE.map(lesson => {
                    const isDone = completedLessons.includes(lesson.id);
                    return (
                      <div 
                        key={`lesson-card-${lesson.id}-${isDone}`} 
                        onClick={() => setSelectedLessonId(lesson.id)}
                        style={{ 
                          background: '#161816', padding: '30px', borderRadius: '24px', border: '1px solid', 
                          borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer', transition: '0.3s'
                        } as any}
                      >
                        <h3 style={{ margin: '0 0 10px 0', color: isDone ? '#4CAF50' : '#fff' }}>{lesson.title}</h3>
                        <div style={{ fontSize: '13px', color: isDone ? '#2e7d32' : '#555', fontWeight: 'bold' }}>
                            {isDone ? 'ПРОЙДЕНО ✓' : 'НАЧАТЬ ИЗУЧЕНИЕ →'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* ПРОСМОТР УРОКА И ТЕСТ */
              <div key={`view-${selectedLessonId}`} style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' } as any}>
                <div onClick={() => {setSelectedLessonId(null); setActiveAnswer(null);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' } as any}>← Назад к темам</div>
                
                <h2 style={{ marginBottom: '20px', fontSize: '26px' }}>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.8', color: '#ccc', marginBottom: '40px', fontSize: '16px' }}>{currentLesson?.content}</p>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '35px' } as any}>
                  <h4 style={{ marginBottom: '25px', color: '#4CAF50', fontSize: '18px' }}>📝 ПРОВЕРКА ЗНАНИЙ: {currentLesson?.question}</h4>
                  <div style={{ display: 'grid', gap: '15px' } as any}>
                    {currentLesson?.options.map((opt, idx) => {
                      const isCorrect = idx === currentLesson.correct;
                      const isSelected = activeAnswer === idx;
                      return (
                        <div 
                          key={`ans-choice-${selectedLessonId}-${idx}-${isSelected}`}
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             setActiveAnswer(idx);
                             if (isCorrect) saveLessonProgress(currentLesson.id);
                          }}
                          style={{ 
                            padding: '18px 25px', borderRadius: '16px', cursor: 'pointer', border: '1px solid', fontSize: '15px',
                            backgroundColor: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d',
                            borderColor: isSelected ? (isCorrect ? '#4CAF50' : '#ff5252') : '#333',
                            color: isSelected ? '#fff' : '#888', transition: '0.1s'
                          } as any}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}