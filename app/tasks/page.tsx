"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import { useSearchParams } from 'next/navigation';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab',
    TASKS: 'tea_hub_local_tasks',
    EDU_PROGRESS: 'tea_hub_edu_progress', 
    ONBOARDING: 'tea_hub_onboard_v3', // Версия 3 для новой структуры
};

// --- ДАННЫЕ ОБУЧЕНИЯ (10 РАЗДЕЛОВ И ТЕМЫ) ---
const ONBOARDING_DATA = [
  {
    id: "sec_1",
    title: "🏮 История и Бренд",
    modules: [
      { 
        id: "m1_1", title: "О компании Tea Master", text: "Мы открылись в 2024 году. Наша философия — честный чай без лишнего пафоса. Мы работаем напрямую с фермерами и верим, что чай — это инструмент управления состоянием.", 
        quiz: [
            {q: "В каком году основан бренд?", o: ["2022", "2024", "2020"], c: 1},
            {q: "С кем мы работаем напрямую?", o: ["С перекупами", "С фермерами", "С заводами кофе"], c: 1},
            {q: "Чай для нас это?", o: ["Просто товар", "Инструмент состояния", "Модный напиток"], c: 1}
        ]
      },
      { id: "m1_2", title: "Этикет мастера", text: "Чайный мастер — это лицо заведения. Главные правила: чистота рук, отсутствие резких запахов парфюма и умение слушать гостя.", quiz: [{q: "Что запрещено мастеру?", o: ["Улыбаться", "Резкий парфюм", "Тихая речь"], c: 1}, {q: "Главное качество?", o: ["Скорость", "Умение слушать", "Сила"], c: 1}, {q: "Рабочее место должно быть?", o: ["В крошках", "Идеально чистым", "Залито чаем"], c: 1}] }
    ]
  },
  {
    id: "sec_2",
    title: "🌱 Ботаника чая",
    modules: [
      { id: "m2_1", title: "Camellia Sinensis", text: "Все виды чая происходят от одного растения — Камелии Китайской. Вкус меняется из-за почвы, климата и высоты произрастания.", quiz: [{q: "Как зовут растение?", o: ["Роза", "Камелия", "Жасмин"], c: 1}, {q: "Сколько видов растений для чая?", o: ["100", "Одно", "Десять"], c: 1}, {q: "Что влияет на вкус?", o: ["Цвет горшка", "Почва и климат", "Настроение"], c: 1}] },
      { id: "m2_2", title: "Сбор листа", text: "Самый ценный чай — почечный. Чем меньше и нежнее лист, тем тоньше аромат. Флеш — это почка и два верхних листика.", quiz: [{q: "Что самое ценное?", o: ["Стебель", "Почка", "Старый лист"], c: 1}, {q: "Что такое флеш?", o: ["Корень", "Почка + 2 листа", "Весь куст"], c: 1}, {q: "Когда собирают лучший чай?", o: ["Зимой", "Весной", "Осенью"], c: 1}] }
    ]
  },
  { id: "sec_3", title: "🧬 Ферментация", modules: [
      { id: "m3_1", title: "Процесс окисления", text: "Ферментация — это химическая реакция сока листа с кислородом. Зеленый чай почти не окислен, Красный — на 100%.", quiz: [{q: "Что такое ферментация?", o: ["Сушка", "Окисление", "Заварка"], c: 1}, {q: "Зеленый чай это?", o: ["Сильно окислен", "Почти не окислен", "Вареный"], c: 1}, {q: "Красный чай окислен на?", o: ["10%", "50%", "100%"], c: 2}] }
  ]},
  { id: "sec_4", title: "🍵 Зеленый чай", modules: [
      { id: "m4_1", title: "Лунцзин", text: "Король зеленых чаев. Лист плоский, обжаривается вручную в котлах. Вкус семечек и орехов.", quiz: [{q: "Форма листа?", o: ["Шар", "Плоский", "Игла"], c: 1}, {q: "Вкус?", o: ["Рыба", "Семечки и орех", "Мята"], c: 1}, {q: "Где делают?", o: ["Тайвань", "Ханчжоу", "Пекин"], c: 1}] }
  ]},
  { id: "sec_5", title: "🌑 Пуэры", modules: [
      { id: "m5_1", title: "Шу Пуэр", text: "Черный пуэр. Проходит ускоренную ферментацию 'Во Дуй'. Вкус земли, коры, орехов. Дает бодрость.", quiz: [{q: "Процесс для Шу?", o: ["Сушка", "Во Дуй", "Жарка"], c: 1}, {q: "Вкус Шу?", o: ["Лимон", "Земля и орехи", "Цветы"], c: 1}, {q: "Эффект?", o: ["Снотворный", "Бодрость", "Никакого"], c: 1}] }
  ]},
  { id: "sec_6", title: "🌀 Улуны", modules: [
      { id: "m6_1", title: "Те Гуань Инь", text: "Светлый улун. Вкус сирени и орхидеи. Дарит состояние 'весны' и легкости.", quiz: [{q: "Это какой улун?", o: ["Темный", "Светлый", "Красный"], c: 1}, {q: "Аромат?", o: ["Дым", "Цветы (сирень)", "Рыба"], c: 1}, {q: "Цвет настоя?", o: ["Черный", "Золотисто-зеленый", "Красный"], c: 1}] }
  ]},
  { id: "sec_7", title: "🍂 Красный чай", modules: [
      { id: "m7_1", title: "Дянь Хун", text: "Классика Юньнани. Много золотых почек. Согревает, пахнет медом и курагой.", quiz: [{q: "Родина Дянь Хуна?", o: ["Пекин", "Юньнань", "Тайвань"], c: 1}, {q: "Нота вкуса?", o: ["Трава", "Мед", "Дым"], c: 1}, {q: "Идеален для?", o: ["Жары", "Холода", "Сна"], c: 1}] }
  ]},
  { id: "sec_8", title: "🏺 Посуда", modules: [
      { id: "m8_1", title: "Гайвань", text: "Чашка с крышкой для пролива. Самый честный инструмент, не скрывает дефекты чая.", quiz: [{q: "Что такое Гайвань?", o: ["Чайник", "Чашка с крышкой", "Термос"], c: 1}, {q: "Материал?", o: ["Пластик", "Фарфор/Стекло", "Дерево"], c: 1}, {q: "Для чего она?", o: ["Хранение", "Заваривание проливом", "Варка"], c: 1}] }
  ]},
  { id: "sec_9", title: "👐 Сервис", modules: [
      { id: "m9_1", title: "Подача гостю", text: "Пиалу подаем двумя руками. Рассказываем о вкусе кратко, не перегружая гостя терминами.", quiz: [{q: "Сколько рук?", o: ["Одна", "Две", "Неважно"], c: 1}, {q: "Как рассказываем?", o: ["Молчим", "Кратко и понятно", "Лекция на час"], c: 1}, {q: "Что важно?", o: ["Цена", "Внимание к гостю", "Скорость"], c: 1}] }
  ]},
  { id: "sec_10", title: "🎓 Аттестация", modules: [
      { id: "m10_1", title: "Финальный тест", text: "Это проверка всего, что ты выучил. После прохождения ты получишь статус Мастера.", quiz: [{q: "Готов?", o: ["Нет", "Да", "Не знаю"], c: 1}, {q: "Будешь учиться дальше?", o: ["Нет", "Всегда", "Возможно"], c: 1}, {q: "Чай — это?", o: ["Вода", "Путь", "Еда"], c: 1}] }
  ]}
];

function ShiftContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'checklist' | 'edu'>('welcome');
  
  // Состояния
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  useEffect(() => {
    const load = () => {
        const urlTab = searchParams.get('tab');
        if (urlTab) setActiveTab(urlTab as any);
        const sOnboard = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
        if (sOnboard) setCompletedModules(JSON.parse(sOnboard));
        setIsMounted(true);
    };
    load();
  }, [searchParams]);

  // Прогресс
  const totalModules = ONBOARDING_DATA.reduce((acc, s) => acc + s.modules.length, 0);
  const progressPercent = Math.round((completedModules.length / totalModules) * 100);

  const handleQuizAnswer = (idx: number) => {
    setActiveAnswer(idx);
    if (idx === selectedModule.quiz[currentQuizStep].c) {
        if (currentQuizStep < 2) {
            setTimeout(() => { setCurrentQuizStep(v => v + 1); setActiveAnswer(null); }, 500);
        } else {
            const newComp = [...completedModules, selectedModule.id];
            setCompletedModules(newComp);
            localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(newComp));
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
        
        {/* ВНУТРЕННИЕ ТАБЫ */}
        <div style={{ display: activeTab === 'welcome' ? 'none' : 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '25px', marginBottom: '60px', border: '1px solid #222' } as any}>
          <div onClick={() => setActiveTab('checklist')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555' } as any}>📋 СМЕНА</div>
          <div onClick={() => setActiveTab('edu')} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#555' } as any}>🎓 ОБУЧЕНИЕ</div>
        </div>

        {/* --- РАЗДЕЛ ОСНОВЫ --- */}
        {activeTab === 'welcome' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedSection ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' } as any}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>ОСНОВЫ</h2>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#4CAF50' }}>{progressPercent}%</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' } as any}>
                  {ONBOARDING_DATA.map((sec) => (
                    <div key={sec.id} onClick={() => setSelectedSection(sec)} style={{ background: '#161816', padding: '25px 40px', borderRadius: '20px', border: '1px solid #222', cursor: 'pointer', transition: '0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                      <span style={{ fontSize: '20px', fontWeight: '800' }}>{sec.title}</span>
                      <span style={{ color: '#4CAF50' }}>→</span>
                    </div>
                  ))}
                </div>
              </>
            ) : !selectedModule ? (
              /* СПИСОК ТЕМ ВНУТРИ РАЗДЕЛА */
              <>
                <div onClick={() => setSelectedSection(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← НАЗАД К РАЗДЕЛАМ</div>
                <h2 style={{ fontSize: '36px', marginBottom: '40px' }}>{selectedSection.title}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {selectedSection.modules.map((m: any) => (
                    <div key={m.id} onClick={() => setSelectedModule(m)} style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid', borderColor: completedModules.includes(m.id) ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                      <h3 style={{ margin: 0, fontSize: '22px' }}>{m.title}</h3>
                      <div style={{ marginTop: '15px', color: completedModules.includes(m.id) ? '#4CAF50' : '#444', fontWeight: 'bold', fontSize: '12px' }}>{completedModules.includes(m.id) ? 'ИЗУЧЕНО ✓' : 'НАЧАТЬ →'}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* КАРТОЧКА ИЗУЧЕНИЯ + ТЕСТ */
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' } as any}>
                <div style={{ background: '#111', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '650px', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' } as any}>
                    <div onClick={() => {setSelectedModule(null); setCurrentQuizStep(0);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← НАЗАД</div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>{selectedModule.title}</h2>
                    <p style={{ lineHeight: '1.8', color: '#bbb', marginBottom: '40px', fontSize: '17px' }}>{selectedModule.text}</p>
                    
                    <div style={{ borderTop: '1px solid #222', paddingTop: '35px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h4 style={{ color: '#4CAF50', margin: 0 }}>ВОПРОС {currentQuizStep + 1} / 3</h4>
                        </div>
                        <p style={{ fontSize: '18px', marginBottom: '25px', fontWeight: 'bold' }}>{selectedModule.quiz[currentQuizStep].q}</p>
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

        {/* --- ЧЕК-ЛИСТ И БАЗА ЗНАНИЙ (БЕЗ ИЗМЕНЕНИЙ) --- */}
        {activeTab === 'checklist' && <div style={{textAlign:'center', padding:'100px'}}>Тут твой чек-лист...</div>}
        {activeTab === 'edu' && <div style={{textAlign:'center', padding:'100px'}}>Тут общая база знаний...</div>}

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