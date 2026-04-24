"use client";
import React, { useState, useEffect } from 'react';

// --- ПОЛНЫЙ СПИСОК ЧАЯ (10 СОРТОВ) ---
const INITIAL_TEA_DATABASE = [
  { id: 1, name: "Те Гуань Инь", category: "Светлый Улун", info: "85°C", desc: "Свежий аромат орхидеи. Собирается в уезде Аньси. Освежает и расслабляет." },
  { id: 2, name: "Да Хун Пао", category: "Темный Улун", info: "95°C", desc: "Утесный чай с нотками дыма и сухофруктов. Дает глубокое согревающее состояние." },
  { id: 3, name: "Шу Пуэр 'Винтажный'", category: "Пуэр", info: "100°C", desc: "Плотный, нефтяной настой. Вкус шоколада и орехов. Идеален для бодрого утра." },
  { id: 4, name: "Шен Пуэр (Мэнхай)", category: "Пуэр", info: "80-85°C", desc: "Молодой пуэр. Вкус луговых трав и сухофруктов с легкой горчинкой." },
  { id: 5, name: "Лунцзин", category: "Зеленый чай", info: "75°C", desc: "Король зеленых чаев. Вкус жареных семечек и тыквенных семян. Очень нежный." },
  { id: 6, name: "Цзинь Цзюнь Мэй", category: "Красный чай", info: "90°C", desc: "Золотые брови. Элитный чай из почек. Медово-цветочный, сладкий аромат." },
  { id: 7, name: "Бай Хао Инь Чжэнь", category: "Белый чай", info: "70°C", desc: "Серебряные иглы. Только почки. Вкус дыни и освежающего березового сока." },
  { id: 8, name: "Габа Алишань", category: "Тайвань", info: "90°C", desc: "Чай с ГАМК. Помогает при стрессе. Вкус ягодного пирога с кислинкой." },
  { id: 9, name: "Най Сян (Молочный)", category: "Улун", info: "85°C", desc: "Легкий улун с ароматом сливок. Самый популярный сорт среди новичков." },
  { id: 10, name: "Лапсанг Сушонг", category: "Красный чай", info: "95°C", desc: "Копченый на сосновых дровах. Аромат костра, чернослива и смолы." }
];

// --- ЧЕК-ЛИСТ ПЕРЕД ОТКРЫТИЕМ (10 ПУНКТОВ) ---
const OPENING_CHECKLIST = [
  { id: 1, text: "Проверить фильтры и наполнить чайники свежей водой", done: false },
  { id: 2, text: "Протереть стеклянные витрины и полки от пыли", done: false },
  { id: 3, text: "Включить весы и проверить их калибровку", done: false },
  { id: 4, text: "Актуализировать ценники (проверить наличие на всех банках)", done: false },
  { id: 5, text: "Проверить влажность в зале (идеально 40-60%)", done: false },
  { id: 6, text: "Подготовить бумажные пакеты и наклейки на смену", done: false },
  { id: 7, text: "Выставить свежий 'Чай дня' для дегустации", done: false },
  { id: 8, text: "Включить фоновую музыку и отрегулировать свет", done: false },
  { id: 9, text: "Очистить все чайные инструменты (гайвани, пиалы)", done: false },
  { id: 10, text: "Проверить кассовую ленту и терминал оплаты", done: false }
];

const COURSES = [
  { id: 1, title: "Вода: Основа вкуса", content: "Для чая нельзя использовать дистиллят или водопроводную воду. Оптимальная минерализация — 70-120 мг/л. Если вода слишком жесткая, чай будет плоским и горьким.", question: "Какая минерализация воды лучшая для раскрытия вкуса?", options: ["500 мг/л", "100 мг/л", "0 мг/л"], correct: 1 },
  { id: 2, title: "Температурные режимы", content: "Белый и зеленый чай — 70-80°C. Улуны — 85-90°C. Пуэры и Красный чай — 95-100°C. Никогда не варите нежный зеленый чай крутым кипятком!", question: "При какой температуре заваривать белый чай?", options: ["100°C", "70-75°C", "95°C"], correct: 1 },
  { id: 3, title: "Техника продажи", content: "Клиент покупает не чай, а состояние. Спрашивайте: 'Что вы хотите почувствовать: бодрость или спокойствие?'. Всегда давайте подышать ароматом из банки.", question: "Как лучше начать диалог с покупателем?", options: ["Что вам подсказать?", "Какой эффект вы ищете в чае?", "У нас сегодня скидки!"], correct: 1 }
];

export default function TeaTrainUltimate() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Динамические данные
  const [tasks, setTasks] = useState(OPENING_CHECKLIST);
  const [teaList, setTeaList] = useState(INITIAL_TEA_DATABASE);
  const [shopName, setShopName] = useState("Tea Master Store");
  const [completedCourses, setCompletedCourses] = useState<number[]>([]);

  // --- ЛОГИКА ИНИЦИАЛИЗАЦИИ И СОХРАНЕНИЯ ---
  useEffect(() => {
    const savedTea = localStorage.getItem('v3_tea_list');
    const savedTasks = localStorage.getItem('v3_tasks');
    const savedName = localStorage.getItem('v3_shop_name');
    const savedComp = localStorage.getItem('v3_completed');

    if (savedTea) setTeaList(JSON.parse(savedTea));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedName) setShopName(savedName);
    if (savedComp) setCompletedCourses(JSON.parse(savedComp));
  }, []);

  useEffect(() => {
    localStorage.setItem('v3_tea_list', JSON.stringify(teaList));
    localStorage.setItem('v3_tasks', JSON.stringify(tasks));
    localStorage.setItem('v3_shop_name', shopName);
    localStorage.setItem('v3_completed', JSON.stringify(completedCourses));
  }, [teaList, tasks, shopName, completedCourses]);

  // Функции
  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleQuizAnswer = (idx: number) => {
    if (idx === selectedCourse.correct) {
      setQuizResult('correct');
      if (!completedCourses.includes(selectedCourse.id)) setCompletedCourses([...completedCourses, selectedCourse.id]);
    } else {
      setQuizResult('wrong');
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: '#f9fbf9', minHeight: '100vh', color: '#2d3436' }}>
      
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px', paddingBottom: '100px' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#1b5e20' }}>{shopName}</h1>
            <div style={{ fontSize: '12px', color: '#a0a0a0', fontWeight: '600' }}>ТЕХНОЛОГИЧЕСКАЯ КАРТА v3.0</div>
          </div>
          <button onClick={() => setActiveTab('admin')} style={{ background: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer' }}>⚙️</button>
        </header>

        {/* ВКЛАДКА: СМЕНА */}
        {activeTab === 'tasks' && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Чек-лист открытия 📋</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {tasks.map(t => (
                <div key={t.id} onClick={() => toggleTask(t.id)} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: t.done ? '1px solid #e8f5e9' : '1px solid #fff' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{t.done && '✓'}</div>
                  <span style={{ fontSize: '14px', color: t.done ? '#b2bec3' : '#2d3436', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: БАЗА (ГДЕ 10 ЧАЕВ) */}
        {activeTab === 'search' && (
          <div>
            <input type="text" placeholder="Поиск среди 10 сортов..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', outline: 'none', fontSize: '16px' }} />
            <div style={{ display: 'grid', gap: '15px' }}>
              {teaList.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(tea => (
                <div key={tea.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '6px solid #4CAF50', boxShadow: '0 3px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b5e20', fontSize: '18px' }}>{tea.name}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '8px' }}>{tea.info}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#636e72', marginBottom: '10px', fontWeight: 'bold' }}>{tea.category}</div>
                  <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5', color: '#444' }}>{tea.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА: УЧЕБА */}
        {activeTab === 'study' && (
          <div>
            {!selectedCourse ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Курсы аттестации 🎓</h2>
                {COURSES.map(c => (
                  <div key={c.id} onClick={() => {setSelectedCourse(c); setShowQuiz(false); setQuizResult(null);}} style={{ background: '#fff', padding: '22px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <span style={{ fontWeight: 'bold' }}>{c.title}</span>
                    <span>{completedCourses.includes(c.id) ? '✅' : '🔒'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#fff', padding: '25px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <button onClick={() => setSelectedCourse(null)} style={{ border: 'none', background: '#f5f5f5', padding: '10px 15px', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold' }}>← Назад</button>
                {!showQuiz ? (
                  <div>
                    <h2 style={{ marginBottom: '15px', color: '#1b5e20' }}>{selectedCourse.title}</h2>
                    <p style={{ lineHeight: '1.7', fontSize: '15px' }}>{selectedCourse.content}</p>
                    <button onClick={() => setShowQuiz(true)} style={{ width: '100%', padding: '18px', background: '#1b5e20', color: '#fff', border: 'none', borderRadius: '18px', marginTop: '25px', fontWeight: 'bold', fontSize: '16px' }}>Начать тест</button>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ marginBottom: '20px', lineHeight: '1.4' }}>{selectedCourse.question}</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {selectedCourse.options.map((opt: string, i: number) => (
                        <button key={i} onClick={() => handleQuizAnswer(i)} style={{ padding: '18px', borderRadius: '15px', border: '1px solid #eee', background: quizResult === 'correct' && i === selectedCourse.correct ? '#e8f5e9' : 'white', textAlign: 'left', fontSize: '15px', transition: '0.2s' }}>{opt}</button>
                      ))}
                    </div>
                    {quizResult === 'correct' && <div style={{ color: 'green', textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>🎉 Отлично! Знание подтверждено.</div>}
                    {quizResult === 'wrong' && <div style={{ color: 'red', textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>❌ Ошибка. Перечитай материал.</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА: АДМИН (УПРАВЛЕНИЕ) */}
        {activeTab === 'admin' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Админ-панель</h2>
              <button onClick={() => setActiveTab('tasks')} style={{ border: 'none', background: '#f5f5f5', padding: '8px 12px', borderRadius: '10px' }}>Закрыть</button>
            </div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Имя магазина:</label>
            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '20px', boxSizing: 'border-box' }} />
            
            <p style={{ fontSize: '14px', color: '#666' }}>Все изменения сохраняются автоматически в память браузера.</p>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{ width: '100%', padding: '15px', background: '#ff7675', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '20px' }}>СБРОСИТЬ ВСЁ (WIPE)</button>
          </div>
        )}

      </div>

      {/* NAVIGATION BAR */}
      <nav style={{ position: 'fixed', bottom: '15px', left: '15px', right: '15px', height: '75px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '24px', display: 'flex', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f1f1', zIndex: 1000 }}>
        {[
          {id: 'tasks', label: 'СМЕНА', icon: '📋'},
          {id: 'search', label: 'БАЗА', icon: '🍃'},
          {id: 'study', label: 'УЧЕБА', icon: '🎓'}
        ].map(t => (
          <button key={t.id} onClick={() => {setActiveTab(t.id); setSelectedCourse(null)}} style={{ flex: 1, border: 'none', background: 'none', color: activeTab === t.id ? '#1b5e20' : '#b2bec3', fontSize: '10px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <span style={{ fontSize: '22px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

    </div>
  );
}