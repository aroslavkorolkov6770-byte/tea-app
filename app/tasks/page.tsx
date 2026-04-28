"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    EDU: 'tea_hub_completed_lessons',
    LESSON: 'tea_hub_selected_lesson',
    CUSTOM_LESSONS: 'tea_hub_custom_lessons',
    ONBOARDING: 'tea_hub_onboarding_progress' // Новый ключ для приветствия
};

// --- БАЗА ШАГОВ ПРИВЕТСТВИЯ (НОВОЕ) ---
const ONBOARDING_STEPS = [
  {
    id: "step_1",
    title: "🏮 О компании и бренде",
    time: "3 мин",
    desc: "История Tea Master Store, наша миссия и почему мы выбираем именно этот чай. Коротко о ценностях команды.",
    content: "Мы начали в 2024 году с идеи сделать чай доступным и понятным. Наша цель — не просто продать лист, а подарить состояние спокойствия в хаосе города."
  },
  {
    id: "step_2",
    title: "💳 Правила работы с кассой",
    time: "5 мин",
    desc: "Как открывать смену, пробивать позиции, делать возвраты и закрывать отчет. Базовые кнопки системы.",
    content: "Каждый честный пролив начинается с чека. Помни: сначала выбираем сорт в системе, затем проверяем вес на весах, после — принимаем оплату."
  },
  {
    id: "step_3",
    title: "🍃 Как рассказывать о чае",
    time: "7 мин",
    desc: "Шпаргалка: как не напугать новичка сложными терминами и помочь выбрать чай под настроение.",
    content: "Если гость просит 'что-то бодрящее' — это Шу Пуэр. Если 'цветочное и легкое' — Те Гуань Инь. Главное — говорить на языке ощущений."
  },
  {
    id: "step_4",
    title: "🤝 Стандарты обслуживания",
    time: "4 мин",
    desc: "Как встречать гостя, подавать чай в дегустационной зоне и прощаться, чтобы человек вернулся.",
    content: "Улыбка — это база. Но чайный мастер — это еще и тишина. Умей чувствовать, когда гостю нужно общение, а когда — уединение с пиалой."
  },
  {
    id: "step_5",
    title: "🧹 Чистота и порядок",
    time: "3 мин",
    desc: "Чек-лист по уходу за посудой: как мыть исинские чайники (только водой!) и где хранить чабань.",
    content: "Гайвань — лицо мастера. После каждого гостя посуда должна сиять. Помни: глина не терпит химии, моем только горячей водой!"
  }
];

// --- СТАНДАРТНЫЕ УРОКИ ---
const INITIAL_LESSONS = [
  { id: "lesson_1", title: "🍃 Основы: Ферментация", content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай. Зеленый чай почти не окислен (5-10%), Красный — окислен полностью.", question: "Какой процент окисления у красного чая?", options: ["5-10%", "40-60%", "90-100%"], correct: 2 },
  { id: "lesson_2", title: "🍵 Температурные режимы", content: "Светлые чаи заваривают при 75-80°C. Темные и Пуэры требуют кипяток 95-100°C.", question: "Как правильно заварить Шу Пуэр?", options: ["Водой 80°C", "Крутым кипятком", "Холодной водой"], correct: 1 },
  { id: "lesson_3", title: "🧘 Габа: Спокойствие", content: "Габа-чай ферментируется без доступа кислорода. Это заставляет лист вырабатывать ГАМК.", question: "В чем особенность Габа-чая?", options: ["Много кофеина", "Содержит ГАМК", "Копченый вкус"], correct: 1 },
  { id: "lesson_4", title: "🌑 Пуэры: Шу и Шен", content: "Шу Пуэр — темный и землистый. Шен — светлый, с фруктовой кислинкой.", question: "Какой пуэр имеет вкус «земли и дерева»?", options: ["Шен Пуэр", "Шу Пуэр", "Оба"], correct: 1 }
];

const DEFAULT_TASKS = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
];

export default function ShiftPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'checklist' | 'edu'>('welcome'); // Начальная вкладка - приветствие
  
  // Данные сотрудника
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [completedOnboarding, setCompletedOnboarding] = useState<string[]>([]); // Прогресс приветствия
  const [lessons, setLessons] = useState<any[]>(INITIAL_LESSONS);
  
  // Состояния уроков
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null); // Выбранный шаг приветствия
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  // Состояния админа
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: '', content: '', question: '', opt1: '', opt2: '', opt3: '', correct: 0
  });

  // --- 1. ЗАГРУЗКА ---
  useEffect(() => {
    const loadEverything = () => {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const savedEdu = localStorage.getItem(STORAGE_KEYS.EDU);
      const savedTab = localStorage.getItem(STORAGE_KEYS.TAB);
      const savedLesson = localStorage.getItem(STORAGE_KEYS.LESSON);
      const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_LESSONS);
      const savedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
      const userRole = localStorage.getItem('userRole');

      if (savedTasks) setTasks(JSON.parse(savedTasks)); else setTasks(DEFAULT_TASKS);
      if (savedEdu) setCompletedLessons(JSON.parse(savedEdu));
      if (savedOnboarding) setCompletedLessons(JSON.parse(savedOnboarding));
      
      // Логика установки вкладки
      if (savedTab) setActiveTab(savedTab as any);
      else setActiveTab('welcome'); // Для новых всегда приветствие

      if (savedLesson) setSelectedLessonId(savedLesson);
      if (savedCustom) setLessons([...INITIAL_LESSONS, ...JSON.parse(savedCustom)]);

      if (userRole === 'admin') setIsAdmin(true);
      setIsMounted(true);
    };
    loadEverything();
  }, []);

  // --- 2. ФУНКЦИИ УПРАВЛЕНИЯ ---

  const updateTab = (tab: 'welcome' | 'checklist' | 'edu') => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEYS.TAB, tab);
  };

  const syncTasks = (newList: any[]) => {
    setTasks(newList);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newList));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newList = [...tasks, { id: Date.now(), text: newTaskText, done: false }];
    syncTasks(newList);
    setNewTaskText("");
  };

  const toggleOnboardingStep = (stepId: string) => {
    let newProgress = [...completedOnboarding];
    if (newProgress.includes(stepId)) {
        newProgress = newProgress.filter(id => id !== stepId);
    } else {
        newProgress.push(stepId);
    }
    setCompletedOnboarding(newProgress);
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(newProgress));
  };

  const handleCreateLesson = () => {
    const { title, content, question, opt1, opt2, opt3 } = newLessonData;
    if (!title || !content || !question || !opt1) return alert("Заполните поля");
    const newLesson = {
      id: "custom_" + Date.now(),
      title: "🎓 " + title,
      content, question,
      options: [opt1, opt2, opt3].filter(o => o !== ""),
      correct: 0 
    };
    const currentCustom = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_LESSONS) || "[]");
    const updatedCustom = [...currentCustom, newLesson];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LESSONS, JSON.stringify(updatedCustom));
    setLessons([...INITIAL_LESSONS, ...updatedCustom]);
    setShowLessonForm(false);
    setNewLessonData({ title: '', content: '', question: '', opt1: '', opt2: '', opt3: '', correct: 0 });
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
    if (confirm("Сбросить твой прогресс обучения?")) {
      setCompletedLessons([]);
      localStorage.removeItem(STORAGE_KEYS.EDU);
      setActiveAnswer(null);
    }
  };

  if (!isMounted) return null;

  const currentLesson = lessons.find(l => l.id === selectedLessonId);
  const currentStep = ONBOARDING_STEPS.find(s => s.id === selectedStepId);
  const onboardingPercent = Math.round((completedOnboarding.length / ONBOARDING_STEPS.length) * 100);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ (ОБНОВЛЕН: 3 ВКЛАДКИ) */}
        <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '25px', marginBottom: '60px', border: '1px solid #222' } as any}>
          <div onClick={() => updateTab('welcome')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '900', backgroundColor: activeTab === 'welcome' ? '#4CAF50' : 'transparent', color: activeTab === 'welcome' ? '#000' : '#555', transition: '0.4s' } as any}>👋 ПРИВЕТСТВИЕ</div>
          <div onClick={() => updateTab('checklist')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '900', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555', transition: '0.4s' } as any}>📋 МОЯ СМЕНА</div>
          <div onClick={() => updateTab('edu')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '900', backgroundColor: activeTab === 'edu' ? '#4CAF50' : '#161816', color: activeTab === 'edu' ? '#000' : '#555', transition: '0.4s' } as any}>🎓 КУРС МАСТЕРА</div>
        </div>

        {/* --- ВКЛАДКА: ПРИВЕТСТВИЕ (ОНБОРДИНГ) --- */}
        {activeTab === 'welcome' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedStepId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } as any}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>ДОБРО ПОЖАЛОВАТЬ</h2>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#4CAF50' }}>{onboardingPercent}%</span>
                </div>
                <p style={{ color: '#666', marginBottom: '40px', fontSize: '18px' }}>Твой план погружения в мир чая на первую неделю. Проходи модули один за другим.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {ONBOARDING_STEPS.map((step, idx) => {
                    const isDone = completedOnboarding.includes(step.id);
                    return (
                      <div key={step.id} onClick={() => setSelectedStepId(step.id)} style={{ background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid', borderColor: isDone ? '#4CAF50' : '#222', cursor: 'pointer', position: 'relative' } as any}>
                        <div style={{ fontSize: '10px', color: '#4CAF50', fontWeight: '900', marginBottom: '10px' }}>ШАГ 0{idx+1} • {step.time}</div>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: isDone ? '#4CAF50' : '#fff' }}>{step.title}</h3>
                        <p style={{ fontSize: '14px', color: '#444', marginTop: '15px', lineHeight: '1.5' }}>{step.desc}</p>
                        {isDone && <div style={{ position: 'absolute', top: '20px', right: '20px', color: '#4CAF50', fontWeight: 'bold' }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedStepId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '40px', fontWeight: 'bold' }}>← К ПЛАНУ НЕДЕЛИ</div>
                <h2 style={{ fontSize: '36px', fontWeight: '900' }}>{currentStep?.title}</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb', margin: '40px 0' }}>{currentStep?.content}</p>
                
                <div onClick={() => { toggleOnboardingStep(currentStep!.id); setSelectedStepId(null); }} style={{ padding: '20px 40px', background: completedOnboarding.includes(currentStep!.id) ? '#222' : '#4CAF50', color: '#000', borderRadius: '15px', display: 'inline-block', fontWeight: '900', cursor: 'pointer' } as any}>
                    {completedOnboarding.includes(currentStep!.id) ? 'ОТМЕНИТЬ ГОТОВНОСТЬ' : 'Я ИЗУЧИЛ ЭТОТ МОДУЛЬ'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ВКЛАДКА: ЧЕК-ЛИСТ (БЕЗ ИЗМЕНЕНИЙ) --- */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px' }}>ЧЕК-ЛИСТ</h2>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' } as any}>
                <input type="text" placeholder="Добавить задачу..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '25px', borderRadius: '20px', background: '#161816', border: '1px solid #222', color: '#fff', outline: 'none', fontSize: '18px' } as any} />
                <div onClick={addTask} style={{ padding: '0 40px', background: '#4CAF50', color: '#000', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '24px' } as any}>+</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' } as any}>
              {tasks.map(t => (
                <div key={t.id} onClick={() => syncTasks(tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i))} style={{ background: t.done ? 'rgba(76, 175, 80, 0.05)' : '#161816', padding: '30px', borderRadius: '25px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', transition: '0.3s' } as any}>
                  <div style={{ width: '28px', height: '28px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '20px', borderRadius: '8px', textAlign: 'center', color: '#000', fontWeight: '900', lineHeight: '24px' } as any}>{t.done && '✓'}</div>
                  <span style={{ flex: 1, fontSize: '18px', color: t.done ? '#444' : '#fff' }}>{t.text}</span>
                  <div onClick={(e: any) => { e.stopPropagation(); syncTasks(tasks.filter(x => x.id !== t.id)); }} style={{ color: '#333', fontSize: '20px', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ВКЛАДКА: ОБУЧЕНИЕ (БЕЗ ИЗМЕНЕНИЙ) --- */}
        {activeTab === 'edu' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } as any}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>БАЗА ЗНАНИЙ</h2>
                    {isAdmin && <div onClick={() => setShowLessonForm(true)} style={{ padding: '15px 30px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' } as any}>+ СОЗДАТЬ УРОК</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' } as any}>
                  {lessons.map((l, index) => {
                    const isDone = completedLessons.includes(l.id);
                    return (
                      <div key={l.id} onClick={() => { setSelectedLessonId(l.id); setActiveAnswer(null); }} style={{ background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer', position: 'relative', overflow: 'hidden' } as any}>
                        <span style={{ position: 'absolute', top: '20px', right: '30px', fontSize: '60px', fontWeight: '900', color: 'rgba(255,255,255,0.03)' }}>0{index+1}</span>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: isDone ? '#4CAF50' : '#fff' }}>{l.title}</h3>
                        <div style={{ marginTop: '20px', color: isDone ? '#2e7d32' : '#444', fontWeight: 'bold', fontSize: '12px' }}>{isDone ? 'ИЗУЧЕНО ✓' : 'НАЧАТЬ КУРС →'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedLessonId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '40px', fontWeight: 'bold' }}>← НАЗАД</div>
                <h2 style={{ fontSize: '36px', fontWeight: '900' }}>{currentLesson?.title}</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb', margin: '40px 0' }}>{currentLesson?.content}</p>
                <div style={{ borderTop: '1px solid #222', paddingTop: '40px' } as any}>
                    <h4 style={{ color: '#4CAF50', fontSize: '20px', marginBottom: '30px', fontWeight: '800' }}>📝 ТЕСТ: {currentLesson?.question}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' } as any}>
                        {currentLesson?.options.map((o: any, i: number) => {
                            const isCorrect = i === currentLesson?.correct;
                            const isSelected = activeAnswer === i;
                            return (
                                <div key={i} onClick={() => handleAnswer(i, currentLesson!.correct, currentLesson!.id)} style={{ padding: '25px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '20px', cursor: 'pointer', border: '1px solid #222', color: isSelected ? '#fff' : '#888', fontWeight: 'bold', textAlign: 'center' } as any}>{o}</div>
                            );
                        })}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* МОДАЛКА (ADMIN ONLY) - БЕЗ ИЗМЕНЕНИЙ */}
        {showLessonForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 15000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' } as any}>
                <div style={{ background: '#111', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '600px', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' } as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: '900' }}>НОВЫЙ УРОК</h2>
                    <input style={inS as any} placeholder="Название" value={newLessonData.title} onChange={e => setNewLessonData({...newLessonData, title: e.target.value})} />
                    <textarea style={{ ...inS, height: '150px' } as any} placeholder="Текст лекции" value={newLessonData.content} onChange={e => setNewLessonData({...newLessonData, content: e.target.value})} />
                    <input style={inS as any} placeholder="Вопрос" value={newLessonData.question} onChange={e => setNewLessonData({...newLessonData, question: e.target.value})} />
                    <button onClick={handleCreateLesson} style={{ width: '100%', padding: '20px', background: '#4CAF50', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>ОПУБЛИКОВАТЬ</button>
                    <button onClick={() => setShowLessonForm(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#444', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

const inS = { width: '100%', padding: '18px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };