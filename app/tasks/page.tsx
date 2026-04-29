"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../supabaseClient';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v1',
    BASICS_PROGRESS: 'tea_hub_basics_progress_v1',
    DYNAMIC_ROUTE: 'tea_hub_dynamic_route_v1',
    DYNAMIC_STANDARDS: 'tea_hub_dynamic_standards_v1',
    DYNAMIC_BASICS: 'tea_hub_dynamic_basics_v1'
};

// --- ИСХОДНЫЕ ДАННЫЕ (Backup) ---
const INITIAL_ROUTE = [
  { id: "route_1", title: "🏮 О компании и бренде", time: "3 мин", content: "Мы — Tea Master Store. Наша цель: сделать чайную культуру доступной. Мы ценим честность, тишину и качество листа." },
  { id: "route_2", title: "💳 Работа с кассой", time: "5 мин", content: "Открытие смены в 09:50. Проверка остатков. Работа в системе учета. Закрытие смены и Z-отчет." },
  { id: "route_3", title: "🍃 Как рассказывать о чае", time: "7 мин", content: "Не грузи гостя терминами. Спрашивай: 'Что вы хотите почувствовать?'. Описывай вкус через ассоциации: мед, семечки, лес." },
  { id: "route_4", title: "🤝 Стандарты сервиса", time: "4 мин", content: "Подача пиалы двумя руками. Мастер всегда следит за уровнем воды в чайнике гостя. Улыбка — это база." },
  { id: "route_5", title: "🧹 Чистота и посуда", time: "5 мин", content: "Исинские чайники моем ТОЛЬКО водой. Гайвани — до блеска. Чабань всегда должна быть сухой." }
];

const INITIAL_STANDARDS = [
  { id: "std_1", title: "👋 ПРИВЕТСТВИЕ И СКРИПТ", color: "#4CAF50", items: ["Улыбка и зрительный контакт — в первые 3 секунды.", "Фраза: 'Добрый день! Подберем чай под ваше состояние или что-то конкретное?'", "Если гость молчит: дайте 30 секунд осмотреться."] },
  { id: "std_2", title: "💰 ВОЗРАЖЕНИЕ «ДОРОГО»", color: "#4CAF50", items: ["Не спорьте. Согласитесь: 'Да, цена выше средней'.", "Аргумент 1: Этот чай выдерживает до 10 проливов.", "Аргумент 2: Это ручной сбор."] },
  { id: "std_3", title: "🖼️ ВИТРИНА И ВЫКЛАДКА", color: "#4CAF50", items: ["Баночки стоят этикеткой строго на покупателя.", "Стекло витрины — без единого отпечатка.", "Ценники актуальны."] },
  { id: "std_4", title: "🍵 ПРАВИЛА ДЕГУСТАЦИЙ", color: "#4CAF50", items: ["Температура воды идеальна для сорта.", "Чистые дегустационные чашки.", "История чая во время питья."] }
];

const INITIAL_BASICS = [
  { id: "sec_1", title: "🏮 01. История и Бренд", modules: [{ id: "m1_1", title: "Философия мастера", text: "Мастер — это не официант. Это проводник.", quiz: [{q: "Главная ценность?", o: ["Состояние", "Цена", "Скорость"], c: 0}, {q: "Кто такой мастер?", o: ["Официант", "Проводник", "Продавец"], c: 1}] }] },
  { id: "sec_2", title: "🌱 01. Ботаника чая", modules: [{ id: "m2_1", title: "Camellia Sinensis", text: "Единственное растение для чая.", quiz: [{q: "Имя куста?", o: ["Камелия", "Дуб", "Роза"], c: 0}] }] }
];

const INITIAL_TASKS = [
    { id: 1, text: "🏮 Проверить чистоту чабани", completed: false },
    { id: 2, text: "🏮 Наполнить термопот водой", completed: false },
    { id: 15, text: "🏮 Проверить остатки упаковки", completed: false }
];

function ShiftContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState('staff');
  const [activeTab, setActiveTab] = useState<'welcome' | 'checklist' | 'standards' | 'edu'>('welcome');
  
  const [dynamicRoute, setDynamicRoute] = useState<any[]>([]);
  const [dynamicStandards, setDynamicStandards] = useState<any[]>([]);
  const [dynamicBasics, setDynamicBasics] = useState<any[]>([]);

  const [completedRoute, setCompletedRoute] = useState<string[]>([]);
  const [completedBasics, setCompletedBasics] = useState<string[]>([]);
  const [selectedRouteStep, setSelectedRouteStep] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Состояния редактора
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<any>(null);
  const [editorTarget, setEditorTarget] = useState<'route' | 'standard' | 'basic' | 'module' | null>(null);

  const [localTasks, setLocalTasks] = useState<{id: number, text: string, completed: boolean}[]>([]);
  const [taskInput, setTaskInput] = useState('');

  useEffect(() => {
    const load = () => {
        const urlTab = searchParams.get('tab');
        if (urlTab) setActiveTab(urlTab as any);
        const role = localStorage.getItem('userRole') || 'staff';
        setUserRole(role);

        const sDynRoute = localStorage.getItem(STORAGE_KEYS.DYNAMIC_ROUTE);
        const sDynStds = localStorage.getItem(STORAGE_KEYS.DYNAMIC_STANDARDS);
        const sDynBasics = localStorage.getItem(STORAGE_KEYS.DYNAMIC_BASICS);
        
        setDynamicRoute(sDynRoute ? JSON.parse(sDynRoute) : INITIAL_ROUTE);
        setDynamicStandards(sDynStds ? JSON.parse(sDynStds) : INITIAL_STANDARDS);
        setDynamicBasics(sDynBasics ? JSON.parse(sDynBasics) : INITIAL_BASICS);

        const sRoute = localStorage.getItem(STORAGE_KEYS.ONBOARD_ROUTE);
        const sBasics = localStorage.getItem(STORAGE_KEYS.BASICS_PROGRESS);
        const sTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        
        if (sRoute) setCompletedRoute(JSON.parse(sRoute));
        if (sBasics) setCompletedBasics(JSON.parse(sBasics));
        if (sTasks) setLocalTasks(JSON.parse(sTasks)); else setLocalTasks(INITIAL_TASKS);
        
        setIsMounted(true);
    };
    load();
  }, [searchParams]);

  const saveAllData = (type: string, data: any) => {
      if (type === 'route') { localStorage.setItem(STORAGE_KEYS.DYNAMIC_ROUTE, JSON.stringify(data)); setDynamicRoute(data); }
      if (type === 'standard') { localStorage.setItem(STORAGE_KEYS.DYNAMIC_STANDARDS, JSON.stringify(data)); setDynamicStandards(data); }
      if (type === 'basic' || type === 'module') { localStorage.setItem(STORAGE_KEYS.DYNAMIC_BASICS, JSON.stringify(data)); setDynamicBasics(data); }
      setIsEditorOpen(false);
  };

  const openEditor = (type: any, item: any = null) => {
      setEditorTarget(type);
      if (type === 'module') {
          setEditorData(item ? {...item} : { id: 'm_' + Date.now(), title: '', text: '', quiz: [{q: '', o: ['', '', ''], c: 0}] });
      } else {
          setEditorData(item ? {...item} : { id: Date.now().toString(), title: '', content: '', time: '', items: [], modules: [] });
      }
      setIsEditorOpen(true);
  };

  const handleDelete = (type: string, id: string) => {
      if (!confirm("Удалить?")) return;
      if (type === 'route') saveAllData('route', dynamicRoute.filter(i => i.id !== id));
      if (type === 'standard') saveAllData('standard', dynamicStandards.filter(i => i.id !== id));
      if (type === 'basic') saveAllData('basic', dynamicBasics.filter(i => i.id !== id));
      if (type === 'module') {
          const newBasics = dynamicBasics.map(sec => ({...sec, modules: sec.modules.filter((m: any) => m.id !== id)}));
          saveAllData('basic', newBasics);
          setSelectedSection(newBasics.find(s => s.id === selectedSection.id));
      }
  };

  const addTask = (e?: any) => {
    if (e) e.preventDefault();
    if (!taskInput.trim()) return;
    const newTask = { id: Date.now(), text: taskInput, completed: false };
    const updated = [...localTasks, newTask];
    setLocalTasks(updated);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    setTaskInput('');
  };

  const toggleTask = (id: number) => {
    const updated = localTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setLocalTasks(updated);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  };

  const deleteTask = (id: number) => {
    const updated = localTasks.filter(t => t.id !== id);
    setLocalTasks(updated);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  };

  const routePercent = Math.round((completedRoute.length / dynamicRoute.length) * 100);
  const basicsTotalModules = dynamicBasics.reduce((acc, s) => acc + (s.modules?.length || 0), 0);
  const basicsPercent = Math.round((completedBasics.length / (basicsTotalModules || 1)) * 100);

  const handleRouteComplete = (id: string) => {
    const newProg = completedRoute.includes(id) ? completedRoute.filter(i => i !== id) : [...completedRoute, id];
    setCompletedRoute(newProg);
    localStorage.setItem(STORAGE_KEYS.ONBOARD_ROUTE, JSON.stringify(newProg));
    setSelectedRouteStep(null);
  };

  const resetBasicsProgress = () => setShowResetModal(true);
  const confirmReset = () => { setCompletedBasics([]); localStorage.removeItem(STORAGE_KEYS.BASICS_PROGRESS); setShowResetModal(false); };

  const handleQuizAnswer = (idx: number) => {
    setActiveAnswer(idx);
    if (idx === selectedModule.quiz[currentQuizStep].c) {
        if (currentQuizStep < selectedModule.quiz.length - 1) {
            setTimeout(() => { setCurrentQuizStep(v => v + 1); setActiveAnswer(null); }, 500);
        } else {
            const newComp = [...completedBasics, selectedModule.id];
            setCompletedBasics(newComp);
            localStorage.setItem(STORAGE_KEYS.BASICS_PROGRESS, JSON.stringify(newComp));
            setTimeout(() => { setSelectedModule(null); setCurrentQuizStep(0); setActiveAnswer(null); }, 600);
        }
    } else { setShowErrorModal(true); setActiveAnswer(null); }
  };

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* СКРЫТАЯ ВЕРХНЯЯ ПАНЕЛЬ */}
        <div style={{ display: 'none' }}>
            <div onClick={() => setActiveTab('checklist')}>📋</div>
            <div onClick={() => setActiveTab('standards')}>💡</div>
            <div onClick={() => setActiveTab('edu')}>🎓</div>
        </div>

        {/* РАЗДЕЛ СТАНДАРТОВ */}
        {activeTab === 'standards' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#4CAF50' }}>💡 КАК МЫ РАБОТАЕМ</h2>
                {userRole === 'admin' && <button onClick={() => openEditor('standard')} style={adminAddBtn}>+ ДОБАВИТЬ КАРТОЧКУ</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
              {dynamicStandards.map((std) => (
                <div key={std.id} style={{ position: 'relative', background: 'linear-gradient(145deg, #161816, #0d0f0d)', padding: '30px', borderRadius: '25px', border: `1px solid #4CAF5044`, boxShadow: `0 10px 30px #4CAF5011` } as any}>
                  {userRole === 'admin' && (
                      <div style={adminToolBox}><span onClick={() => openEditor('standard', std)}>✎</span><span onClick={() => handleDelete('standard', std.id)}>✕</span></div>
                  )}
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#4CAF50', fontWeight: '900' }}>{std.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {std.items.map((item: string, j: number) => (
                      <div key={j} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: '#bbb' }}><span style={{ color: '#4CAF50' }}>•</span>{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* РАЗДЕЛ ЗАДАЧ */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '30px' }}>📋 ЗАДАЧИ НА СМЕНУ</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
              <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Добавить новую задачу..." style={{ flex: 1, background: '#161816', border: '1px solid #333', padding: '18px 25px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
              <button type="button" onClick={() => addTask()} style={{ background: '#4CAF50', color: '#000', border: 'none', padding: '0 30px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '24px' }}>+</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {localTasks.map(task => (
                <div key={task.id} style={{ background: '#161816', padding: '18px 25px', borderRadius: '18px', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', flex: 1 }} onClick={() => toggleTask(task.id)}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid #4CAF50', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: task.completed ? '#4CAF50' : 'transparent' }}>
                      {task.completed && <span style={{ color: '#000', fontWeight: '900' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '17px', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#444' : '#fff' }}>{task.text}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: '#cc4444', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* РАЗДЕЛ ОСНОВ */}
        {activeTab === 'welcome' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedSection && !selectedRouteStep && (
              <section style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' } as any}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>ПЛАН НА НЕДЕЛЮ</h2>
                    <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                        {userRole === 'admin' && <button onClick={() => openEditor('route')} style={adminAddBtnSmall}>+</button>}
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#4CAF50' }}>{routePercent}%</span>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '15px' } as any}>
                  {dynamicRoute.map((step, idx) => {
                    const isDone = completedRoute.includes(step.id);
                    return (
                      <div key={step.id} onClick={() => setSelectedRouteStep(step)} style={{ position: 'relative', background: isDone ? 'rgba(76, 175, 80, 0.1)' : '#161816', padding: '24px 20px', borderRadius: '20px', border: '1px solid', borderColor: isDone ? '#4CAF50' : '#222', cursor: 'pointer', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                        {userRole === 'admin' && (
                            <div style={adminToolBox}><span onClick={(e) => { e.stopPropagation(); openEditor('route', step); }}>✎</span><span onClick={(e) => { e.stopPropagation(); handleDelete('route', step.id); }}>✕</span></div>
                        )}
                        <div style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '900', marginBottom: '6px' }}>ШАГ 0{idx+1}</div>
                        <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '800' }}>{step.title}</h4>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {!selectedSection && !selectedRouteStep ? (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' } as any}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>ОСНОВЫ</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {userRole === 'admin' && <button onClick={() => openEditor('basic')} style={adminAddBtnSmall}>+</button>}
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#4CAF50' }}>{basicsPercent}%</span>
                        <div onClick={resetBasicsProgress} style={{ fontSize: '12px', color: '#cc4444', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>сброс</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' } as any}>
                  {dynamicBasics.map((sec) => {
                    const isSectionDone = sec.modules.every((m: any) => completedBasics.includes(m.id));
                    return (
                      <div key={sec.id} style={{ position: 'relative' }}>
                        <div onClick={() => setSelectedSection(sec)} style={{ background: '#161816', padding: '22px 35px', borderRadius: '18px', border: '1px solid', borderColor: isSectionDone ? '#2e7d32' : '#222', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: isSectionDone ? '#4CAF50' : '#fff' }}>{sec.title}</span>
                            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                                {userRole === 'admin' && (
                                    <div style={{display: 'flex', gap: '10px', marginRight: '15px', color: '#666'}}>
                                        <span onClick={(e) => { e.stopPropagation(); openEditor('basic', sec); }}>✎</span>
                                        <span onClick={(e) => { e.stopPropagation(); handleDelete('basic', sec.id); }}>✕</span>
                                    </div>
                                )}
                                <span style={{ color: '#4CAF50' }}>{isSectionDone ? '✓' : '→'}</span>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : selectedRouteStep ? (
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedRouteStep(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← НАЗАД</div>
                <h2 style={{ fontSize: '72px', fontWeight: '900' }}>{selectedRouteStep.title}</h2>
                <p style={{ fontSize: '36px', lineHeight: '1.8', color: '#bbb', margin: '40px 0' }}>{selectedRouteStep.content}</p>
                <button onClick={() => handleRouteComplete(selectedRouteStep.id)} style={{ padding: '20px 40px', background: '#4CAF50', color: '#000', borderRadius: '15px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>{completedRoute.includes(selectedRouteStep.id) ? 'ОТМЕНИТЬ ВЫПОЛНЕНИЕ' : 'Я ИЗУЧИЛ ЭТОТ ШАГ'}</button>
              </div>
            ) : !selectedModule ? (
              <>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                    <div onClick={() => setSelectedSection(null)} style={{ color: '#4CAF50', cursor: 'pointer', fontWeight: 'bold' }}>← К ГЛАВНОМУ ПЛАНУ</div>
                    {userRole === 'admin' && <button onClick={() => openEditor('module')} style={adminAddBtn}>+ ДОБАВИТЬ УРОК</button>}
                </div>
                <h2 style={{ fontSize: '36px', marginBottom: '40px' }}>{selectedSection.title}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {selectedSection.modules.map((m: any) => (
                    <div key={m.id} style={{position:'relative'}}>
                        <div onClick={() => setSelectedModule(m)} style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid', borderColor: completedBasics.includes(m.id) ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                        <h3 style={{ margin: 0, fontSize: '22px' }}>{m.title}</h3>
                        <div style={{ marginTop: '15px', color: completedBasics.includes(m.id) ? '#4CAF50' : '#444', fontWeight: 'bold' }}>{completedBasics.includes(m.id) ? 'ПРОЙДЕНО ✓' : 'НАЧАТЬ →'}</div>
                        </div>
                        {userRole === 'admin' && (
                            <div style={adminToolBox}><span onClick={(e) => {e.stopPropagation(); openEditor('module', m);}}>✎</span><span onClick={(e) => {e.stopPropagation(); handleDelete('module', m.id);}}>✕</span></div>
                        )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' } as any}>
                <div style={{ background: '#111', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '650px', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' } as any}>
                    <div onClick={() => {setSelectedModule(null); setCurrentQuizStep(0);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← ВЕРНУТЬСЯ</div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>{selectedModule.title}</h2>
                    <p style={{ lineHeight: '1.8', color: '#bbb', margin: '30px 0' }}>{selectedModule.text}</p>
                    <div style={{ borderTop: '1px solid #222', paddingTop: '30px' }}>
                        <h4 style={{ color: '#4CAF50', marginBottom: '20px' }}>ВОПРОС {currentQuizStep + 1} / {selectedModule.quiz.length}: <span style={{color:'#fff'}}>{selectedModule.quiz[currentQuizStep].q}</span></h4>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {selectedModule.quiz[currentQuizStep].o.map((opt: string, i: number) => (
                                <div key={i} onClick={() => handleQuizAnswer(i)} style={{ padding: '20px', background: activeAnswer === i ? '#4CAF50' : '#0d0f0d', color: activeAnswer === i ? '#000' : '#888', borderRadius: '15px', cursor: 'pointer', border: '1px solid #222', fontWeight: 'bold', textAlign: 'center' } as any}>{opt}</div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* МОДАЛКА РЕДАКТОРА */}
        {isEditorOpen && (
            <div style={editorOverlay}>
                <div style={editorContainer}>
                    <h2 style={{color: '#4CAF50', marginBottom: '20px'}}>КОНСТРУКТОР: {editorTarget?.toUpperCase()}</h2>
                    <input style={editorInput} placeholder="Заголовок" value={editorData.title} onChange={e => setEditorData({...editorData, title: e.target.value})} />
                    
                    {editorTarget === 'standard' ? (
                        <textarea style={editorTextarea} placeholder="Пункты чек-листа (каждый с новой строки)" value={editorData.items?.join('\n')} onChange={e => setEditorData({...editorData, items: e.target.value.split('\n')})} />
                    ) : (
                        <textarea style={editorTextarea} placeholder="Основной текст контента" value={editorData.content || editorData.text || ''} onChange={e => setEditorData({...editorData, content: e.target.value, text: e.target.value})} />
                    )}
                    
                    {editorTarget === 'route' && <input style={editorInput} placeholder="Время (напр. 5 мин)" value={editorData.time} onChange={e => setEditorData({...editorData, time: e.target.value})} />}

                    {/* КОНСТРУКТОР ТЕСТА (ТОЛЬКО ДЛЯ МОДУЛЕЙ) */}
                    {editorTarget === 'module' && (
                        <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px'}}>
                            <h3 style={{fontSize:'14px', color:'#888', marginBottom:'15px'}}>КОНСТРУКТОР ТЕСТА (Вопрос 1)</h3>
                            <input style={editorInput} placeholder="Вопрос" value={editorData.quiz[0]?.q} onChange={e => { let q = [...editorData.quiz]; q[0].q = e.target.value; setEditorData({...editorData, quiz: q})}} />
                            <div style={{display:'grid', gap:'10px', marginBottom:'15px'}}>
                                {editorData.quiz[0].o.map((opt:any, idx:any) => (
                                    <input key={idx} style={editorInput} placeholder={`Вариант ${idx+1}`} value={opt} onChange={e => { let q = [...editorData.quiz]; q[0].o[idx] = e.target.value; setEditorData({...editorData, quiz: q})}} />
                                ))}
                            </div>
                            <select style={editorInput} value={editorData.quiz[0].c} onChange={e => { let q = [...editorData.quiz]; q[0].c = parseInt(e.target.value); setEditorData({...editorData, quiz: q})}}>
                                <option value={0}>Верный: Вариант 1</option>
                                <option value={1}>Верный: Вариант 2</option>
                                <option value={2}>Верный: Вариант 3</option>
                            </select>
                        </div>
                    )}

                    <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
                        <button style={saveBtn} onClick={() => {
                            let newList = [];
                            if (editorTarget === 'route') newList = dynamicRoute.some(i => i.id === editorData.id) ? dynamicRoute.map(i => i.id === editorData.id ? editorData : i) : [...dynamicRoute, editorData];
                            if (editorTarget === 'standard') newList = dynamicStandards.some(i => i.id === editorData.id) ? dynamicStandards.map(i => i.id === editorData.id ? editorData : i) : [...dynamicStandards, editorData];
                            if (editorTarget === 'basic') newList = dynamicBasics.some(i => i.id === editorData.id) ? dynamicBasics.map(i => i.id === editorData.id ? editorData : i) : [...dynamicBasics, editorData];
                            if (editorTarget === 'module') {
                                const exists = selectedSection.modules.some((m:any) => m.id === editorData.id);
                                const newModules = exists ? selectedSection.modules.map((m:any) => m.id === editorData.id ? editorData : m) : [...selectedSection.modules, editorData];
                                newList = dynamicBasics.map(sec => sec.id === selectedSection.id ? {...sec, modules: newModules} : sec);
                                setSelectedSection(newList.find(s => s.id === selectedSection.id));
                            }
                            saveAllData(editorTarget === 'module' ? 'basic' : editorTarget!, newList);
                        }}>СОХРАНИТЬ</button>
                        <button style={cancelBtn} onClick={() => setIsEditorOpen(false)}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {showResetModal && (
          <div style={editorOverlay}><div style={editorContainer}>
              <h2 style={{ color: '#fff', marginBottom: '15px', fontWeight: '900' }}>СБРОСИТЬ ПРОГРЕСС?</h2>
              <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => setShowResetModal(false)} style={cancelBtn}>ОТМЕНА</button><button onClick={confirmReset} style={{...saveBtn, background:'#cc4444'}}>СБРОСИТЬ</button></div>
          </div></div>
        )}
      </main>
      <style jsx global>{` @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </div>
  );
}

const adminToolBox: any = { position: 'absolute', top: '10px', right: '15px', display: 'flex', gap: '12px', fontSize: '16px', color: '#444', cursor: 'pointer', zIndex: 10 };
const adminAddBtn: any = { background: '#4CAF50', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' };
const adminAddBtnSmall: any = { background: '#333', color: '#4CAF50', border: '1px solid #4CAF50', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' };
const editorOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const editorContainer: any = { background: '#111', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '600px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' };
const editorInput: any = { width: '100%', padding: '15px', background: '#000', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '15px', outline: 'none' };
const editorTextarea: any = { width: '100%', height: '150px', padding: '15px', background: '#000', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '15px', outline: 'none', resize: 'none' };
const saveBtn: any = { flex: 1, padding: '18px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };
const cancelBtn: any = { flex: 1, padding: '18px', background: '#222', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };

export default function ShiftPage() {
    return <Suspense><ShiftContent /></Suspense>
}