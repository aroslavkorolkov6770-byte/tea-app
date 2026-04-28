"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../supabaseClient';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    EDU_PROGRESS: 'tea_hub_edu_progress', // ИСПРАВЛЕНО: теперь совпадает с вызовом
    ONBOARDING: 'tea_hub_onboard_v2',
    CUSTOM_LESSONS: 'tea_hub_custom_lessons'
};

// --- БАЗА ОБУЧЕНИЯ НОВИЧКА (10 РАЗДЕЛОВ) ---
const ONBOARDING_DATA = [
  {
    id: "sec_1",
    title: "🏮 01. История и Бренд",
    desc: "Миссия Tea Master Store и наши ценности.",
    content: "Мы основаны в 2024 году. Наша миссия — транслировать чайную культуру через состояние. Мы не просто продаем продукт, мы учим людей замедляться. Каждый мастер — это проводник в мир вкуса.",
    quiz: [
      { q: "В каком году основан бренд?", o: ["2022", "2024", "2021"], c: 1 },
      { q: "Наша главная цель?", o: ["Продажи", "Состояние гостя", "Реклама"], c: 1 },
      { q: "Кто такой чайный мастер?", o: ["Продавец", "Проводник", "Технолог"], c: 1 }
    ]
  },
  { id: "sec_2", title: "🌱 02. Ботаника чая", desc: "Растение, терруар и сбор листа.", content: "Весь чай делается из Camellia Sinensis. Вкус зависит от почвы, климата и мастерства технолога.", quiz: [{q: "Как зовут растение?", o: ["Роза", "Камелия", "Мята"], c: 1}, {q: "Зависит ли вкус от почвы?", o: ["Да", "Нет", "Только от погоды"], c: 0}, {q: "Сколько видов растений для чая?", o: ["Много", "Одно", "Десять"], c: 1}] },
  { id: "sec_3", title: "🧬 03. Ферментация", desc: "Как лист превращается в разные виды.", content: "Ферментация — это окисление сока в листе. Зеленый почти не окислен, Красный — почти на 100%.", quiz: [{q: "Что такое ферментация?", o: ["Сушка", "Окисление", "Заварка"], c: 1}, {q: "Какой чай не окислен?", o: ["Черный", "Зеленый", "Пуэр"], c: 1}, {q: "Сильнее всего окислен?", o: ["Белый", "Красный", "Улун"], c: 1}] },
  { id: "sec_4", title: "🍵 04. Зеленый чай", desc: "Сорта, заваривание и польза.", content: "Ценится за свежесть. Лунцзин (Колодец Дракона) — эталон. Заваривать водой 75-80°C. Кипяток даст горечь.", quiz: [{q: "Температура для зеленого?", o: ["100°C", "75-80°C", "50°C"], c: 1}, {q: "Что такое Лунцзин?", o: ["Гора", "Колодец Дракона", "Озеро"], c: 1}, {q: "Кипяток дает?", o: ["Сладость", "Горечь", "Аромат"], c: 1}] },
  { id: "sec_5", title: "🌑 05. Пуэры", desc: "Отличия Шу от Шена.", content: "Шен зреет годами (кислинка/фрукты). Шу проходит Во Дуй (земля/орехи).", quiz: [{q: "Землистый вкус у?", o: ["Шен", "Шу", "Белый"], c: 1}, {q: "Процесс для Шу?", o: ["Шай Цин", "Во Дуй", "Хун Пэй"], c: 1}, {q: "Вкус Шена?", o: ["Сливки", "Сухофрукты", "Шоколад"], c: 1}] },
  { id: "sec_6", title: "🌀 06. Улуны", desc: "Светлые и темные бирюзовые чаи.", content: "Светлые (Те Гуань Инь) — цветы. Темные (Да Хун Пао) — огонь и пряность.", quiz: [{q: "Те Гуань Инь это?", o: ["Темный", "Светлый", "Красный"], c: 1}, {q: "Темные улуны пахнут?", o: ["Травой", "Огнем/Прожаркой", "Лимоном"], c: 1}, {q: "В Габе много?", o: ["Сахара", "ГАМК", "Кофеина"], c: 1}] },
  { id: "sec_7", title: "🍂 07. Красный чай", desc: "Уют, согрев и энергия.", content: "То, что в Европе зовут 'черным'. Юньнань (Дянь Хун) — лидер. Мед, хлеб, курага.", quiz: [{q: "В Европе это чай?", o: ["Темный", "Черный", "Золотой"], c: 1}, {q: "Ноты красного чая?", o: ["Трава", "Мед и хлеб", "Рыба"], c: 1}, {q: "Родина Дянь Хуна?", o: ["Пекин", "Юньнань", "Тайвань"], c: 1}] },
  { id: "sec_8", title: "🏺 08. Посуда", desc: "Инструменты мастера.", content: "Гайвань — для пролива. Исин — для темных чаев. Чахай — для ровного настоя.", quiz: [{q: "Зачем Чахай?", o: ["Хранение", "Слив настоя", "Красота"], c: 1}, {q: "Материал Исина?", o: ["Стекло", "Глина", "Сталь"], c: 1}, {q: "Гайвань это?", o: ["Чайник", "Чашка с крышкой", "Термос"], c: 1}] },
  { id: "sec_9", title: "👐 09. Сервис", desc: "Стандарты работы.", content: "Подаем двумя руками. Рабочее место (чабань) всегда сухое и чистое. Улыбка и тишина.", quiz: [{q: "Сколько рук?", o: ["Одна", "Две", "Три"], c: 1}, {q: "Чабань должна быть?", o: ["Мокрой", "Чистой и сухой", "В крошках"], c: 1}, {q: "Главное в мастере?", o: ["Голос", "Внимание к деталям", "Вес"], c: 1}] },
  { id: "sec_10", title: "🎓 10. Аттестация", desc: "Финал обучения.", content: "Слепая дегустация. Нужно определить вид чая и рассказать историю. Удачи!", quiz: [{q: "Что в финале?", o: ["Уборка", "Слепая дегустация", "Сон"], c: 1}, {q: "Нужно знать?", o: ["Цены", "Историю чая", "Улицы"], c: 1}, {q: "После сдачи ты?", o: ["Уволен", "Мастер школы", "Стажер"], c: 1}] }
];

const INITIAL_EDU_LESSONS = [
    { id: "edu_1", title: "🍃 Глубокая ферментация", content: "Разбор химии процесса окисления..." },
    { id: "edu_2", title: "🍵 Вода для чая", content: "Почему pH воды меняет вкус напитка..." }
];

function ShiftContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'checklist' | 'edu'>('welcome');
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedOnboarding, setCompletedOnboarding] = useState<string[]>([]);
  const [completedEdu, setCompletedEdu] = useState<string[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  
  const [selectedOnboard, setSelectedOnboard] = useState<any>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    const load = () => {
        const urlTab = searchParams.get('tab');
        const role = localStorage.getItem('userRole');
        const sTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        const sOnboard = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
        const sEdu = localStorage.getItem(STORAGE_KEYS.EDU_PROGRESS);
        const sCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_LESSONS);

        if (urlTab) setActiveTab(urlTab as any);
        if (sTasks) setTasks(JSON.parse(sTasks));
        if (sOnboard) setCompletedOnboarding(JSON.parse(sOnboard));
        if (sEdu) setCompletedEdu(JSON.parse(sEdu));
        if (sCustom) setCustomLessons(JSON.parse(sCustom));
        
        if (role === 'admin') setIsAdmin(true);
        setIsMounted(true);
    };
    load();
  }, [searchParams]);

  const handleOnboardAnswer = (idx: number) => {
    setActiveAnswer(idx);
    if (idx === selectedOnboard.quiz[currentQuizStep].c) {
        if (currentQuizStep < 2) {
            setTimeout(() => { setCurrentQuizStep(v => v + 1); setActiveAnswer(null); }, 600);
        } else {
            const newProgress = [...completedOnboarding, selectedOnboard.id];
            setCompletedOnboarding(newProgress);
            localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(newProgress));
            setTimeout(() => { setSelectedOnboard(null); setCurrentQuizStep(0); setActiveAnswer(null); }, 800);
        }
    } else {
        alert("Неверно, попробуй еще раз");
        setActiveAnswer(null);
    }
  };

  const resetOnboarding = () => {
    if (confirm("Сбросить прогресс основ?")) {
      setCompletedOnboarding([]);
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    }
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newList = [...tasks, { id: Date.now(), text: newTaskText, done: false }];
    setTasks(newList);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newList));
    setNewTaskText("");
  };

  if (!isMounted) return null;

  const onboardPercent = Math.round((completedOnboarding.length / ONBOARDING_DATA.length) * 100);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* ТАБЫ */}
        <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '25px', marginBottom: '60px', border: '1px solid #222' } as any}>
          <div onClick={() => setActiveTab('welcome')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'welcome' ? '#4CAF50' : 'transparent', color: activeTab === 'welcome' ? '#000' : '#555', transition:'0.3s' } as any}>👋 ОСНОВЫ</div>
          <div onClick={() => setActiveTab('checklist')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555', transition:'0.3s' } as any}>📋 СМЕНА</div>
          <div onClick={() => setActiveTab('edu')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#555', transition:'0.3s' } as any}>🎓 ОБУЧЕНИЕ</div>
        </div>

        {/* --- РАЗДЕЛ: ОСНОВЫ --- */}
        {activeTab === 'welcome' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedOnboard ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' } as any}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>ОСНОВЫ</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' } as any}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#4CAF50' }}>{onboardPercent}%</span>
                        <div onClick={resetOnboarding} style={{ fontSize: '12px', color: '#cc4444', cursor: 'pointer', fontWeight: 'bold' }}>сброс</div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '12px', background: '#161816', borderRadius: '100px', overflow: 'hidden', marginBottom: '60px', border:'1px solid #222' }}>
                    <div style={{ width: `${onboardPercent}%`, height: '100%', background: '#4CAF50', transition: '1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' } as any}>
                  {ONBOARDING_DATA.map((sec, idx) => {
                    const isDone = completedOnboarding.includes(sec.id);
                    return (
                      <div key={sec.id} onClick={() => { setSelectedOnboard(sec); setCurrentQuizStep(0); setActiveAnswer(null); }} style={{ background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer', transition: '0.4s', position: 'relative', overflow: 'hidden' } as any}>
                        <span style={{ position: 'absolute', top: '20px', right: '30px', fontSize: '60px', fontWeight: '900', color: 'rgba(255,255,255,0.03)' }}>0{idx+1}</span>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: isDone ? '#4CAF50' : '#fff', position: 'relative' }}>{sec.title}</h3>
                        <p style={{ color: '#555', fontSize: '14px', marginTop: '15px' }}>{sec.desc}</p>
                        <div style={{ marginTop: '20px', color: isDone ? '#2e7d32' : '#444', fontWeight: 'bold', fontSize: '12px' }}>{isDone ? 'ИЗУЧЕНО ✓' : 'НАЧАТЬ →'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222', boxShadow: '0 30px 100px rgba(0,0,0,0.8)' } as any}>
                <div onClick={() => setSelectedOnboard(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '40px', fontWeight: 'bold' }}>← НАЗАД К ТЕМАМ</div>
                <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '20px' }}>{selectedOnboard.title}</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb', marginBottom: '50px', maxWidth: '800px' }}>{selectedOnboard.content}</p>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '40px' } as any}>
                    <h4 style={{ color: '#4CAF50', fontSize: '20px', marginBottom: '30px', fontWeight: '800' }}>📝 ТЕСТ {currentQuizStep + 1}/3: <span style={{color: '#fff'}}>{selectedOnboard.quiz[currentQuizStep].q}</span></h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' } as any}>
                        {selectedOnboard.quiz[currentQuizStep].o.map((o: string, i: number) => {
                            const isSelected = activeAnswer === i;
                            return (
                                <div key={i} onClick={() => handleOnboardAnswer(i)} style={{ padding: '25px', background: isSelected ? '#4CAF50' : '#0d0f0d', borderRadius: '20px', cursor: 'pointer', border: '1px solid #222', color: isSelected ? '#000' : '#888', fontWeight: 'bold', textAlign: 'center', transition: '0.2s' } as any}>{o}</div>
                            );
                        })}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- РАЗДЕЛ: СМЕНА --- */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px' }}>ЧЕК-ЛИСТ</h2>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' } as any}>
                <input type="text" placeholder="Новая задача..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '25px', borderRadius: '20px', background: '#161816', border: '1px solid #222', color: '#fff', outline: 'none', fontSize: '18px' } as any} />
                <div onClick={addTask} style={{ padding: '0 40px', background: '#4CAF50', color: '#000', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '24px' } as any}>+</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' } as any}>
                {tasks.map(t => (
                    <div key={t.id} onClick={() => {
                        const nl = tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i);
                        setTasks(nl); localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(nl));
                    }} style={{ background: t.done ? 'rgba(76, 175, 80, 0.05)' : '#161816', padding: '30px', borderRadius: '25px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', transition: '0.3s' } as any}>
                        <div style={{ width: '28px', height: '28px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '20px', borderRadius: '8px', textAlign: 'center', color: '#000', fontWeight: '900', lineHeight: '24px' } as any}>{t.done && '✓'}</div>
                        <span style={{ flex: 1, fontSize: '18px', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#444' : '#fff' }}>{t.text}</span>
                        <div onClick={(e: any) => { e.stopPropagation(); const nl = tasks.filter(x => x.id !== t.id); setTasks(nl); localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(nl)); }} style={{ color: '#333', fontSize: '20px', cursor: 'pointer' }}>✕</div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- РАЗДЕЛ: ОБУЧЕНИЕ --- */}
        {activeTab === 'edu' && (
            <div style={{ animation: 'fadeInUp 0.6s ease' }}>
                <h2 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px' }}>БАЗА ЗНАНИЙ</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' } as any}>
                    {INITIAL_EDU_LESSONS.map(l => (
                        <div key={l.id} style={{ background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid #222' } as any}>
                            <h3 style={{ margin: 0, fontSize: '22px' }}>{l.title}</h3>
                            <p style={{ color: '#444', marginTop: '15px' }}>Скоро будет доступно...</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; padding: 0; background-color: #0d0f0d; scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

export default function ShiftPage() {
    return <Suspense><ShiftContent /></Suspense>
}