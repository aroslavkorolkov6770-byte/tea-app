"use client";
import React, { useState, useEffect } from 'react';

// --- ДАННЫЕ (База чая с фото) ---
const INITIAL_TEA_DATABASE = [
  { 
    id: 1, 
    name: "Те Гуань Инь", 
    category: "Светлый Улун", 
    info: "85°C", 
    desc: "Свежий аромат орхидеи. Собирается в уезде Аньси. Освежает и расслабляет.", 
    img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=500" 
  },
  { 
    id: 2, 
    name: "Да Хун Пао", 
    category: "Темный Улун", 
    info: "95°C", 
    desc: "Утесный чай с нотками дыма и сухофруктов. Дает глубокое согревающее состояние.", 
    img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=500" 
  },
  { 
    id: 3, 
    name: "Шу Пуэр 'Винтажный'", 
    category: "Пуэр", 
    info: "100°C", 
    desc: "Плотный, нефтяной настой. Вкус шоколада и орехов. Идеален для бодрого утра.", 
    img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=500" 
  },
  { 
    id: 4, 
    name: "Габа Алишань", 
    category: "Тайвань", 
    info: "90°C", 
    desc: "Чай с высоким содержанием ГАМК. Помогает при стрессе. Вкус ягодного пирога.", 
    img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=500" 
  }
];

const OPENING_CHECKLIST = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
  { id: 4, text: "Проверить актуальность ценников", done: false },
  { id: 5, text: "Подготовить дегустационный чай дня", done: false },
];

export default function TeaMasterApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<any>(null);
  
  // Состояния данных
  const [tasks, setTasks] = useState(OPENING_CHECKLIST);
  const [shopName, setShopName] = useState("Tea Master Store");

  // Загрузка данных из локальной памяти
  useEffect(() => {
    const savedName = localStorage.getItem('tea_shop_name');
    const savedTasks = localStorage.getItem('tea_tasks');
    if (savedName) setShopName(savedName);
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  // Сохранение задач
  const toggleTask = (id: number) => {
    const newTasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
    setTasks(newTasks);
    localStorage.setItem('tea_tasks', JSON.stringify(newTasks));
  };

  const handleSaveName = (name: string) => {
    setShopName(name);
    localStorage.setItem('tea_shop_name', name);
  };

  // Общие стили
  const cardStyle = {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginBottom: '12px',
    border: '1px solid #f0f0f0'
  };

  const menuItemStyle = {
    padding: '15px',
    border: 'none',
    background: 'none',
    textAlign: 'left' as const,
    fontSize: '16px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    color: '#2d3436'
  };

  return (
    <div style={{ fontFamily: '-apple-system, system-ui, sans-serif', backgroundColor: '#fcfdfc', minHeight: '100vh', color: '#2d3436' }}>
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ С БУРГЕРОМ */}
      <header style={{ position: 'fixed', top: 0, width: '100%', height: '60px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 20px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ background: '#fff', border: 'none', width: '45px', height: '45px', borderRadius: '50%', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
        {isMenuOpen && (
          <div style={{ position: 'absolute', top: '70px', right: '20px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', width: '220px', overflow: 'hidden', zIndex: 1001, animation: 'fadeIn 0.2s ease-out' }}>
            <button onClick={() => {setActiveTab('admin'); setIsMenuOpen(false)}} style={menuItemStyle}>⚙️ Админ-панель</button>
            <button onClick={() => {alert('Вход в разработке'); setIsMenuOpen(false)}} style={menuItemStyle}>🔑 Войти</button>
            <button onClick={() => setIsMenuOpen(false)} style={{...menuItemStyle, color: '#ff7675', borderBottom: 'none'}}>Закрыть</button>
          </div>
        )}
      </header>

      {/* ГЛАВНЫЙ КОНТЕНТ */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
        
        {/* Вкладка HOME (Центрированное название + О заведении) */}
        {activeTab === 'home' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <section style={{ height: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#1b5e20', margin: '0 0 15px 0', letterSpacing: '-2px', lineHeight: '1' }}>{shopName}</h1>
              <p style={{ color: '#636e72', fontSize: '18px', fontWeight: '500' }}>HUB СОТРУДНИКА</p>
              <div style={{ marginTop: '40px', animation: 'bounce 2s infinite', fontSize: '24px', color: '#b2bec3' }}>
                ↓
              </div>
            </section>

            <section style={{ padding: '20px 0 40px 0' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '800' }}>О заведении</h2>
              <p style={{ lineHeight: '1.7', color: '#444', fontSize: '16px' }}>
                Добро пожаловать в нашу базу знаний. Здесь собраны все инструменты для качественной работы: от ежедневных задач до подробной энциклопедии чая. 
              </p>
              <div style={{ ...cardStyle, marginTop: '25px', background: '#e8f5e9', border: 'none' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>💡 Памятка</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#1b5e20' }}>Всегда проверяй температуру воды перед завариванием элитных сортов.</p>
              </div>
            </section>
          </div>
        )}

        {/* Вкладка СМЕНА (Чек-лист) */}
        {activeTab === 'tasks' && (
          <div style={{ paddingTop: '80px', animation: 'fadeIn 0.3s' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: '800' }}>Чек-лист открытия 📋</h2>
            {tasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id)} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: t.done ? '#f8f9f8' : '#fff', opacity: t.done ? 0.7 : 1, cursor: 'pointer' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>{t.done && '✓'}</div>
                <span style={{ fontSize: '15px', textDecoration: t.done ? 'line-through' : 'none', fontWeight: t.done ? '400' : '600' }}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Вкладка БАЗА (Чай с деталями) */}
        {activeTab === 'search' && (
          <div style={{ paddingTop: '80px', animation: 'fadeIn 0.3s' }}>
            {!selectedTea ? (
              <>
                <input 
                  type="text" 
                  placeholder="Поиск сорта..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '16px', borderRadius: '18px', border: '1px solid #eee', marginBottom: '20px', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '16px' }} 
                />
                {INITIAL_TEA_DATABASE.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(tea => (
                  <div key={tea.id} onClick={() => setSelectedTea(tea)} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '700' }}>{tea.name}</h3>
                      <span style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tea.category}</span>
                    </div>
                    <span style={{ fontSize: '20px', color: '#ccc' }}>→</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <button onClick={() => setSelectedTea(null)} style={{ background: '#f5f5f5', border: 'none', padding: '10px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', cursor: 'pointer' }}>← Назад</button>
                <div style={{ background: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
                  <img src={selectedTea.img} style={{ width: '100%', height: '240px', objectFit: 'cover' }} alt={selectedTea.name} />
                  <div style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <h2 style={{ margin: 0, color: '#1b5e20', fontSize: '24px', fontWeight: '800' }}>{selectedTea.name}</h2>
                      <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}>{selectedTea.info}</span>
                    </div>
                    <p style={{ lineHeight: '1.7', color: '#555', fontSize: '16px', marginBottom: '20px' }}>{selectedTea.desc}</p>
                    <div style={{ background: '#fcfdfc', padding: '15px', borderRadius: '15px', border: '1px dashed #4CAF50' }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Совет мастера:</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Используйте глиняный чайник для раскрытия плотности этого сорта.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА АДМИН */}
        {activeTab === 'admin' && (
          <div style={{ paddingTop: '80px', animation: 'fadeIn 0.3s' }}>
             <h2 style={{ fontWeight: '800' }}>Настройки ⚙️</h2>
             <div style={cardStyle}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Название магазина:</label>
                <input 
                  type="text" 
                  value={shopName} 
                  onChange={(e) => handleSaveName(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px' }} 
                />
             </div>
             <p style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>Изменения сохраняются локально в вашем браузере.</p>
             <button onClick={() => setActiveTab('home')} style={{ width: '100%', marginTop: '10px', padding: '16px', background: '#1b5e20', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}>Готово</button>
          </div>
        )}

      </main>

      {/* НИЖНЯЯ НАВИГАЦИЯ */}
      <nav style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', height: '75px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(15px)', borderRadius: '28px', display: 'flex', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.3)', zIndex: 999 }}>
        {[
          {id: 'home', label: 'ГЛАВНАЯ', icon: '🏠'},
          {id: 'tasks', label: 'СМЕНА', icon: '📋'},
          {id: 'search', label: 'БАЗА', icon: '🍃'},
        ].map(t => (
          <button key={t.id} onClick={() => {setActiveTab(t.id); setSelectedTea(null);}} style={{ flex: 1, border: 'none', background: 'none', color: activeTab === t.id ? '#1b5e20' : '#b2bec3', fontSize: '11px', fontWeight: '800', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: '0.2s' }}>
            <span style={{ fontSize: '22px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <style jsx global>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-10px);}
          60% {transform: translateY(-5px);}
        }
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}