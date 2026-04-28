"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import { useSearchParams } from 'next/navigation';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v1', // Прогресс маршрута (5 шагов)
    BASICS_PROGRESS: 'tea_hub_basics_progress_v1' // Прогресс 10 разделов
};

// --- 1. МАРШРУТ НОВИЧКА (ВЕРХНИЙ БЛОК) ---
const WELCOME_ROUTE = [
   { id: "sec_2", title: "🌱 02. Ботаника чая", desc: "Растение, терруар и сбор листа.", content: "Весь чай делается из Camellia Sinensis. Вкус зависит от почвы, климата и мастерства технолога.", quiz: [{q: "Как зовут растение?", o: ["Роза", "Камелия", "Мята"], c: 1}, {q: "Зависит ли вкус от почвы?", o: ["Да", "Нет", "Только от погоды"], c: 0}, {q: "Сколько видов растений для чая?", o: ["Много", "Одно", "Десять"], c: 1}] },
  { id: "sec_3", title: "🧬 03. Ферментация", desc: "Как лист превращается в разные виды.", content: "Ферментация — это окисление сока в листе. Зеленый почти не окислен, Красный — почти на 100%.", quiz: [{q: "Что такое ферментация?", o: ["Сушка", "Окисление", "Заварка"], c: 1}, {q: "Какой чай не окислен?", o: ["Черный", "Зеленый", "Пуэр"], c: 1}, {q: "Сильнее всего окислен?", o: ["Белый", "Красный", "Улун"], c: 1}] },
  { id: "sec_4", title: "🍵 04. Зеленый чай", desc: "Сорта, заваривание и польза.", content: "Зеленый чай ценится за свежесть. Лунцзин — эталон. Заваривать водой 75-80°C. Кипяток даст горечь.", quiz: [{q: "Температура для зеленого?", o: ["100°C", "75-80°C", "50°C"], c: 1}, {q: "Что такое Лунцзин?", o: ["Гора", "Колодец Дракона", "Озеро"], c: 1}, {q: "Кипяток дает?", o: ["Сладость", "Горечь", "Аромат"], c: 1}] },
  { id: "sec_5", title: "🌑 05. Пуэры", desc: "Отличия Шу от Шена.", content: "Шен зреет годами (кислинка/фрукты). Шу проходит Во Дуй (земля/орехи).", quiz: [{q: "Землистый вкус у?", o: ["Шен", "Шу", "Белый"], c: 1}, {q: "Процесс для Шу?", o: ["Шай Цин", "Во Дуй", "Хун Пэй"], c: 1}, {q: "Вкус Шена?", o: ["Сливки", "Сухофрукты", "Шоколад"], c: 1}] },
  { id: "sec_6", title: "🌀 06. Улуны", desc: "Светлые и темные бирюзовые чаи.", content: "Светлые (Те Гуань Инь) — цветы. Темные (Да Хун Пао) — пряность.", quiz: [{q: "Те Гуань Инь это?", o: ["Темный", "Светлый", "Красный"], c: 1}, {q: "Темные улуны пахнут?", o: ["Травой", "Огнем", "Лимоном"], c: 1}, {q: "В Габе много?", o: ["Сахара", "ГАМК", "Кофеина"], c: 1}] },
  { id: "sec_7", title: "🍂 07. Красный чай", desc: "Уют, согрев и энергия.", content: "То, что в Европе зовут 'черным'. Юньнань (Дянь Хун) — лидер. Мед, хлеб, курага.", quiz: [{q: "В Европе это чай?", o: ["Темный", "Черный", "Золотой"], c: 1}, {q: "Ноты красного чая?", o: ["Трава", "Мед и хлеб", "Рыба"], c: 1}, {q: "Родина Дянь Хуна?", o: ["Пекин", "Юньнань", "Тайвань"], c: 1}] },
  { id: "sec_8", title: "🏺 08. Посуда", desc: "Инструменты мастера.", content: "Гайвань — для пролива. Исин — глина. Чахай — для ровного настоя.", quiz: [{q: "Зачем Чахай?", o: ["Хранение", "Слив настоя", "Красота"], c: 1}, {q: "Материал Исина?", o: ["Стекло", "Глина", "Сталь"], c: 1}, {q: "Гайвань это?", o: ["Чайник", "Чашка с крышкой", "Термос"], c: 1}] },
  { id: "sec_9", title: "👐 09. Сервис", desc: "Стандарты работы.", content: "Подаем двумя руками. Рабочее место (чабань) всегда сухое и чистое. Улыбка и тишина.", quiz: [{q: "Сколько рук?", o: ["Одна", "Две", "Три"], c: 1}, {q: "Чабань должна быть?", o: ["Мокрой", "Чистой и сухой", "В крошках"], c: 1}, {q: "Главное в мастере?", o: ["Голос", "Внимание к деталям", "Вес"], c: 1}] },
  { id: "sec_10", title: "🎓 10. Аттестация", desc: "Финал обучения.", content: "Слепая дегустация. Нужно определить вид чая и рассказать историю. Удачи!", quiz: [{q: "Что в финале?", o: ["Уборка", "Слепая дегустация", "Сон"], c: 1}, {q: "Нужно знать?", o: ["Цены", "Историю чая", "Улицы"], c: 1}, {q: "После сдачи ты?", o: ["Уволен", "Мастер школы", "Стажер"], c: 1}] }
];
  

// --- 2. БАЗА ЗНАНИЙ (10 РАЗДЕЛОВ НИЖЕ) ---
const BASICS_DATA = [
  {
    id: "sec_1", title: "🏮 01. История и Бренд",
    modules: [{ 
        id: "m1_1", title: "Философия мастера", text: "Мастер — это не официант. Это проводник.", 
        quiz: [
            {q: "В каком году основан бренд?", o: ["2022", "2024", "2020"], c: 1},
            {q: "Главная ценность?", o: ["Скорость", "Состояние", "Цена"], c: 1},
            {q: "Как мы завариваем?", o: ["В чашке", "Проливом", "В термосе"], c: 1}
        ] 
    }]
  },
  { id: "sec_2", title: "🌱 02. Ботаника чая", modules: [{ id: "m2_1", title: "Camellia Sinensis", text: "Единственное растение для чая.", quiz: [{q: "Имя куста?", o: ["Роза", "Камелия", "Дуб"], c: 1}, {q: "Что дает вкус?", o: ["Почва", "Вода", "Оба"], c: 2}, {q: "Чай это?", o: ["Еда", "Напиток", "Путь"], c: 2}] }] },
  { id: "sec_3", title: "🧬 03. Ферментация", modules: [{ id: "m3_1", title: "Окисление", text: "Процесс изменения листа.", quiz: [{q: "Зеленый чай это?", o: ["Сырой", "Вареный", "Жареный"], c: 0}, {q: "Красный окислен на?", o: ["10%", "50%", "100%"], c: 2}, {q: "Улуны это?", o: ["Между", "Сверху", "Снизу"], c: 0}] }] },
  { id: "sec_4", title: "🍵 04. Зеленый чай", modules: [{ id: "m4_1", title: "Свежесть", text: "Лунцзин и его свойства.", quiz: [{q: "Температура?", o: ["100", "80", "40"], c: 1}, {q: "Вкус?", o: ["Трава", "Мед", "Земля"], c: 0}, {q: "Цвет?", o: ["Черный", "Светлый", "Синий"], c: 1}] }] },
  { id: "sec_5", title: "🌑 05. Пуэры", modules: [{ id: "m5_1", title: "Шу и Шен", text: "Черный и зеленый пуэры.", quiz: [{q: "Земляной вкус?", o: ["Шен", "Шу", "Белый"], c: 1}, {q: "Кислый вкус?", o: ["Шен", "Шу", "Улун"], c: 0}, {q: "Во Дуй это?", o: ["Сушка", "Кучи", "Варка"], c: 1}] }] },
  { id: "sec_6", title: "🌀 06. Улуны", modules: [{ id: "m6_1", title: "Аромат", text: "Те Гуань Инь и Да Хун Пао.", quiz: [{q: "ТГИ это?", o: ["Темный", "Светлый", "Белый"], c: 1}, {q: "ДХП это?", o: ["Светлый", "Темный", "Зеленый"], c: 1}, {q: "Форма ТГИ?", o: ["Лист", "Скрутка", "Кирпич"], c: 1}] }] },
  { id: "sec_7", title: "🍂 07. Красный чай", modules: [{ id: "m7_1", title: "Уют", text: "Дянь Хун и Сяо Чжун.", quiz: [{q: "Цвет в Европе?", o: ["Красный", "Черный", "Серый"], c: 1}, {q: "Нота?", o: ["Мед", "Цветы", "Лед"], c: 0}, {q: "Родина?", o: ["Пекин", "Юньнань", "Москва"], c: 1}] }] },
  { id: "sec_8", title: "🏺 08. Посуда", modules: [{ id: "m8_1", title: "Инструментарий", text: "Гайвань и Исин.", quiz: [{q: "Для чего Гайвань?", o: ["Хранение", "Заварка", "Еда"], c: 1}, {q: "Глина это?", o: ["Стекло", "Исин", "Сталь"], c: 1}, {q: "Чахай это?", o: ["Кружка", "Море чая", "Ложка"], c: 1}] }] },
  { id: "sec_9", title: "👐 09. Сервис", modules: [{ id: "m9_1", title: "Гостеприимство", text: "Правила работы в зале.", quiz: [{q: "Сколько рук?", o: ["Одна", "Две", "Неважно"], c: 1}, {q: "Чабань должна быть?", o: ["Мокрой", "Сухой", "В пыли"], c: 1}, {q: "Главное?", o: ["Деньги", "Гость", "Чай"], c: 1}] }] },
  { id: "sec_10", title: "🎓 10. Аттестация", modules: [{ id: "m10_1", title: "Финальный тест", text: "Проверка знаний мастера.", quiz: [{q: "Готов?", o: ["Да", "Да", "Да"], c: 1}, {q: "Чай — это?", o: ["Вода", "Жизнь", "Товар"], c: 1}, {q: "Будешь профи?", o: ["Нет", "Конечно", "Посмотрим"], c: 1}] }] }
];

function ShiftContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'checklist' | 'edu'>('welcome');
  
  // Данные прогресса
  const [completedRoute, setCompletedRoute] = useState<string[]>([]);
  const [completedBasics, setCompletedBasics] = useState<string[]>([]);
  
  // Состояния выбора
  const [selectedRouteStep, setSelectedRouteStep] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  
  // Тест
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  useEffect(() => {
    const load = () => {
        const urlTab = searchParams.get('tab');
        if (urlTab) setActiveTab(urlTab as any);
        
        const sRoute = localStorage.getItem(STORAGE_KEYS.ONBOARD_ROUTE);
        const sBasics = localStorage.getItem(STORAGE_KEYS.BASICS_PROGRESS);
        if (sRoute) setCompletedRoute(JSON.parse(sRoute));
        if (sBasics) setCompletedBasics(JSON.parse(sBasics));
        
        setIsMounted(true);
    };
    load();
  }, [searchParams]);

  // Расчеты
  const routePercent = Math.round((completedRoute.length / WELCOME_ROUTE.length) * 100);
  const basicsTotalModules = BASICS_DATA.reduce((acc, s) => acc + s.modules.length, 0);
  const basicsPercent = Math.round((completedBasics.length / basicsTotalModules) * 100);

  // --- ОБРАБОТЧИКИ ---
  const handleRouteComplete = (id: string) => {
    const newProg = completedRoute.includes(id) ? completedRoute.filter(i => i !== id) : [...completedRoute, id];
    setCompletedRoute(newProg);
    localStorage.setItem(STORAGE_KEYS.ONBOARD_ROUTE, JSON.stringify(newProg));
    setSelectedRouteStep(null);
  };

  const handleQuizAnswer = (idx: number) => {
    setActiveAnswer(idx);
    if (idx === selectedModule.quiz[currentQuizStep].c) {
        if (currentQuizStep < 2) {
            setTimeout(() => { setCurrentQuizStep(v => v + 1); setActiveAnswer(null); }, 500);
        } else {
            const newComp = [...completedBasics, selectedModule.id];
            setCompletedBasics(newComp);
            localStorage.setItem(STORAGE_KEYS.BASICS_PROGRESS, JSON.stringify(newComp));
            setTimeout(() => { setSelectedModule(null); setCurrentQuizStep(0); setActiveAnswer(null); }, 600);
        }
    } else {
        alert("Попробуй еще раз!");
        setActiveAnswer(null);
    }
  };

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* ВЕРХНИЕ ТАБЫ */}
        {activeTab !== 'welcome' && (
          <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '25px', marginBottom: '60px', border: '1px solid #222' } as any}>
            <div onClick={() => setActiveTab('checklist')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555' } as any}>📋 СМЕНА</div>
            <div onClick={() => setActiveTab('edu')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#555' } as any}>🎓 ОБУЧЕНИЕ</div>
          </div>
        )}

        {activeTab === 'welcome' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            
            {/* --- БЛОК 1: ОНБОРДИНГ (НОВОЕ) --- */}
            {!selectedSection && !selectedRouteStep && (
              <section style={{ marginBottom: '80px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' } as any}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>ПЛАН НА НЕДЕЛЮ</h2>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#4CAF50' }}>{routePercent}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' } as any}>
                  {WELCOME_ROUTE.map((step, idx) => {
                    const isDone = completedRoute.includes(step.id);
                    return (
                      <div key={step.id} onClick={() => setSelectedRouteStep(step)} style={{ background: isDone ? 'rgba(76, 175, 80, 0.1)' : '#161816', padding: '20px', borderRadius: '20px', border: '1px solid', borderColor: isDone ? '#4CAF50' : '#222', cursor: 'pointer' } as any}>
                        <div style={{ fontSize: '10px', color: '#4CAF50', fontWeight: '900' }}>ШАГ 0{idx+1}</div>
                        <h4 style={{ margin: '5px 0 0 0', fontSize: '16px' }}>{step.title}</h4>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* --- БЛОК 2: ОСНОВЫ (БАЗА ЗНАНИЙ) --- */}
            {!selectedSection && !selectedRouteStep ? (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' } as any}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>ОСНОВЫ</h2>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#4CAF50' }}>{basicsPercent}%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' } as any}>
                  {BASICS_DATA.map((sec) => (
                    <div key={sec.id} onClick={() => setSelectedSection(sec)} style={{ background: '#161816', padding: '25px 40px', borderRadius: '20px', border: '1px solid #222', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                      <span style={{ fontSize: '18px', fontWeight: '800' }}>{sec.title}</span>
                      <span style={{ color: '#4CAF50' }}>→</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : selectedRouteStep ? (
              /* КАРТОЧКА ШАГА ОНБОРДИНГА */
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedRouteStep(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← НАЗАД</div>
                <h2 style={{ fontSize: '36px', fontWeight: '900' }}>{selectedRouteStep.title}</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb', margin: '40px 0' }}>{selectedRouteStep.content}</p>
                <button onClick={() => handleRouteComplete(selectedRouteStep.id)} style={{ padding: '20px 40px', background: '#4CAF50', color: '#000', borderRadius: '15px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>
                    {completedRoute.includes(selectedRouteStep.id) ? 'ОТМЕНИТЬ ВЫПОЛНЕНИЕ' : 'Я ИЗУЧИЛ ЭТОТ ШАГ'}
                </button>
              </div>
            ) : !selectedModule ? (
              /* СПИСОК ТЕМ В ОСНОВАХ */
              <>
                <div onClick={() => setSelectedSection(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← К ГЛАВНОМУ ПЛАНУ</div>
                <h2 style={{ fontSize: '36px', marginBottom: '40px' }}>{selectedSection.title}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {selectedSection.modules.map((m: any) => (
                    <div key={m.id} onClick={() => setSelectedModule(m)} style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid', borderColor: completedBasics.includes(m.id) ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                      <h3 style={{ margin: 0, fontSize: '22px' }}>{m.title}</h3>
                      <div style={{ marginTop: '15px', color: completedBasics.includes(m.id) ? '#4CAF50' : '#444', fontWeight: 'bold' }}>{completedBasics.includes(m.id) ? 'ПРОЙДЕНО ✓' : 'НАЧАТЬ →'}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* КАРТОЧКА МОДУЛЯ + ТЕСТ */
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' } as any}>
                <div style={{ background: '#111', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '650px', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' } as any}>
                    <div onClick={() => {setSelectedModule(null); setCurrentQuizStep(0);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← ВЕРНУТЬСЯ</div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900' }}>{selectedModule.title}</h2>
                    <p style={{ lineHeight: '1.8', color: '#bbb', margin: '30px 0' }}>{selectedModule.text}</p>
                    <div style={{ borderTop: '1px solid #222', paddingTop: '30px' }}>
                        <h4 style={{ color: '#4CAF50', marginBottom: '20px' }}>ВОПРОС {currentQuizStep + 1} / 3: <span style={{color:'#fff'}}>{selectedModule.quiz[currentQuizStep].q}</span></h4>
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
      </main>
    </div>
  );
}

export default function ShiftPage() {
    return <Suspense><ShiftContent /></Suspense>
}