"use client";
import React, { useState } from 'react';

// --- БАЗА ЧАЯ (10 СОРТОВ + ПРЕВЬЮ + ПОЛНОЕ ОПИСАНИЕ) ---
const INITIAL_TEA_DATABASE = [
  { id: 1, name: "Те Гуань Инь", category: "Светлый Улун", info: "85°C", summary: "Свежий аромат орхидеи и весенних цветов.", desc: "Легендарный улун из Аньси. Обладает выраженным цветочным ароматом и длительным сладким послевкусием. Идеален для расслабления.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 2, name: "Да Хун Пао", category: "Темный Улун", info: "95°C", summary: "Дымный, хлебный вкус с нотами огня.", desc: "Утесный чай из гор Уи. Проходит сильную обжарку на углях. Во вкусе ноты сухофруктов, шоколада и легкий дымный оттенок.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 3, name: "Шу Пуэр 'Винтажный'", category: "Пуэр", info: "100°C", summary: "Землистый, плотный настой для бодрости.", desc: "Сильно ферментированный чай. Вкус густой, 'нефтяной' с нотами грецкого ореха и чернослива. Дает мощный заряд энергии.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 4, name: "Шен Пуэр (Мэнхай)", category: "Пуэр", info: "80-85°C", summary: "Травянистый профиль с легкой горчинкой.", desc: "Молодой необработанный пуэр. Имеет светлый настой и аромат луговых цветов. Оставляет приятную свежесть во рту.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 5, name: "Лунцзин", category: "Зеленый чай", info: "75°C", summary: "Вкус жареных семечек и нежность утра.", desc: "Плоский лист, ручная обжарка. Самый знаменитый зеленый чай Китая. Нежный, ореховый профиль, очень легкий и чистый.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 6, name: "Цзинь Цзюнь Мэй", category: "Красный чай", info: "90°C", summary: "Медовая сладость из золотых почек.", desc: "Элитный красный чай. Состоит только из молодых почек. Очень сладкий, деликатный, с богатым фруктовым ароматом.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 7, name: "Бай Хао Инь Чжэнь", category: "Белый чай", info: "70°C", summary: "Тонкий вкус березового сока и хвои.", desc: "Белый чай высшей категории. Минимум обработки. Вкус почти прозрачный, напоминает свежесть леса и белые цветы.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 8, name: "Габа Алишань", category: "Тайвань", info: "90°C", summary: "Ягодная кислинка и эффект спокойствия.", desc: "Ферментируется без доступа кислорода. Имеет уникальный вкус с нотами печеных яблок. Помогает сосредоточиться и снять стресс.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 9, name: "Най Сян (Молочный)", category: "Улун", info: "85°C", summary: "Сливочный аромат и мягкий вкус.", desc: "Популярный улун со светлой ферментацией. Очень ароматный, мягкий, напоминает карамель и парное молоко.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800" },
  { id: 10, name: "Лапсанг Сушонг", category: "Красный чай", info: "95°C", summary: "Копченый аромат соснового костра.", desc: "Чай сушится над огнем из сосновых дров. Вкус специфический, копченый. Напоминает хороший виски или чернослив.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" }
];

const OPENING_CHECKLIST = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
  { id: 4, text: "Подготовить чай дня", done: false },
  { id: 5, text: "Актуализировать ценники", done: false },
];

export default function TeaMasterApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<any>(null);
  const [tasks, setTasks] = useState(OPENING_CHECKLIST);
  const [shopName, setShopName] = useState("Tea Master Store");

  const handleLogin = () => {
    if (login === "1" && pass === "1") {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setActiveTab('tasks');
    } else {
      alert("Неверные данные (Логин: 1, Пароль: 1)");
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, system-ui, sans-serif', backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' }}>
      
      {/* HEADER (Бургер с отступом) */}
      <header style={{ position: 'fixed', top: 0, width: '100%', height: '70px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 30px', zIndex: 1000 }}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={burgerButtonStyle}>
          {isMenuOpen ? '✕' : '☰'}
        </button>

        {isMenuOpen && (
          <div style={menuDropdownStyle}>
            {!isLoggedIn ? (
              <button onClick={() => {setShowLoginModal(true); setIsMenuOpen(false)}} style={menuItemStyle}>🔑 Войти</button>
            ) : (
              <button onClick={() => {setIsLoggedIn(false); setActiveTab('home'); setIsMenuOpen(false)}} style={{...menuItemStyle, color: '#ff7675'}}>Выйти</button>
            )}
            <button onClick={() => {setActiveTab('admin'); setIsMenuOpen(false)}} style={menuItemStyle}>⚙️ Настройки</button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' }}>
        
        {/* HOME SCREEN */}
        {activeTab === 'home' && (
          <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
            <section style={heroSectionStyle}>
              <div style={heroImageOverlay} />
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', margin: 0 }}>{shopName}</h1>
                <p style={{ color: '#888', letterSpacing: '2px', fontSize: '14px', marginTop: '10px' }}>HUB СОТРУДНИКА</p>
                <div style={{marginTop: '20px', fontSize: '20px', color: '#4CAF50'}}>↓</div>
              </div>
            </section>
            <section style={{ padding: '40px 25px' }}>
              <h2 style={{ fontSize: '26px', color: '#4CAF50', marginBottom: '15px' }}>О заведении</h2>
              <p style={{ lineHeight: '1.7', color: '#999', marginBottom: '25px' }}>
                Мы — пространство чайной культуры. Каждая чашка здесь — результат мастерства. Эта база поможет тебе изучить ассортимент и следить за порядком в смене.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                 <div style={{ borderRadius: '20px', height: '160px', backgroundImage: 'url("https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=500")', backgroundSize: 'cover' }} />
                 <div style={{ borderRadius: '20px', height: '160px', backgroundImage: 'url("https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=500")', backgroundSize: 'cover' }} />
              </div>
            </section>
          </div>
        )}

        {/* СМЕНА */}
        {activeTab === 'tasks' && isLoggedIn && (
          <div style={{ padding: '100px 25px 20px 25px', animation: 'fadeIn 0.3s' }}>
            <h2 style={{ marginBottom: '20px' }}>Чек-лист открытия 📋</h2>
            {tasks.map(t => (
              <div key={t.id} onClick={() => setTasks(tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i))} style={{ ...cardStyle, border: t.done ? '1px solid #2e7d32' : '1px solid #222', opacity: t.done ? 0.6 : 1 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', textAlign: 'center', color: '#fff' }}>{t.done && '✓'}</div>
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* БАЗА ЧАЯ */}
        {activeTab === 'search' && isLoggedIn && (
          <div style={{ padding: '100px 25px 20px 25px', animation: 'fadeIn 0.3s' }}>
             {!selectedTea ? (
               <>
                 <input type="text" placeholder="Поиск среди 10 сортов..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} />
                 {INITIAL_TEA_DATABASE.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(tea => (
                   <div key={tea.id} onClick={() => setSelectedTea(tea)} style={teaListItemStyle}>
                     <div style={{ flex: 1 }}>
                       <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{tea.name}</h3>
                       <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>{tea.summary}</p>
                     </div>
                     <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '11px' }}>{tea.category}</span>
                   </div>
                 ))}
               </>
             ) : (
               <div style={{ animation: 'fadeIn 0.2s' }}>
                 <button onClick={() => setSelectedTea(null)} style={backButtonStyle}>← Назад</button>
                 <div style={teaDetailCardStyle}>
                    <div style={teaDetailImagePart}>
                      <img src={selectedTea.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="tea" />
                    </div>
                    <div style={teaDetailTextPart}>
                      <span style={{ fontSize: '10px', color: '#4CAF50', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedTea.category}</span>
                      <h2 style={{ margin: '5px 0', color: '#fff', fontSize: '22px' }}>{selectedTea.name}</h2>
                      <div style={{ background: '#222', display: 'inline-block', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', marginBottom: '10px' }}>{selectedTea.info}</div>
                      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#bbb', margin: 0 }}>{selectedTea.desc}</p>
                    </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* АДМИН */}
        {activeTab === 'admin' && (
          <div style={{ padding: '100px 25px 20px 25px' }}>
             <h2>Настройки HUB ⚙️</h2>
             <div style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
                <label style={{display: 'block', marginBottom: '10px'}}>Название заведения:</label>
                <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} style={inputStyle} />
                <button onClick={() => setActiveTab('home')} style={loginButtonStyle}>Сохранить</button>
             </div>
          </div>
        )}

      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Авторизация</h2>
            <input type="text" placeholder="Логин (1)" value={login} onChange={(e) => setLogin(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Пароль (1)" value={pass} onChange={(e) => setPass(e.target.value)} style={inputStyle} />
            <button onClick={handleLogin} style={loginButtonStyle}>Войти</button>
            <button onClick={() => setShowLoginModal(false)} style={{ background: 'none', border: 'none', color: '#444', width: '100%', marginTop: '15px' }}>Закрыть</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION (СКРЫТА ДО ВХОДА) */}
      {isLoggedIn && (
        <nav style={navBarStyle}>
          {[
            {id: 'home', label: 'ГЛАВНАЯ', icon: '🏠'},
            {id: 'tasks', label: 'СМЕНА', icon: '📋'},
            {id: 'search', label: 'БАЗА', icon: '🍃'},
          ].map(t => (
            <button key={t.id} onClick={() => {setActiveTab(t.id); setSelectedTea(null)}} style={{ flex: 1, border: 'none', background: 'none', color: activeTab === t.id ? '#4CAF50' : '#444', fontSize: '10px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; padding: 0; background-color: #0d0f0d; overflow-x: hidden; }
      `}</style>
    </div>
  );
}

// --- СТИЛИ КОНСТАНТЫ ---
const burgerButtonStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer', color: '#fff', fontSize: '20px' };
const menuDropdownStyle = { position: 'absolute' as const, top: '80px', right: '30px', backgroundColor: '#161816', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: '200px', overflow: 'hidden', border: '1px solid #222' };
const menuItemStyle = { padding: '16px', border: 'none', background: 'none', width: '100%', textAlign: 'left' as const, color: '#fff', fontSize: '14px', borderBottom: '1px solid #222' };
const heroSectionStyle = { height: '65vh', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const heroImageOverlay = { position: 'absolute' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' };
const cardStyle = { background: '#161816', padding: '18px', borderRadius: '15px', display: 'flex', gap: '15px', marginBottom: '10px', cursor: 'pointer' };
const searchInputStyle = { width: '100%', padding: '16px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '20px', outline: 'none' };
const teaListItemStyle = { background: '#161816', padding: '18px 20px', borderRadius: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222', cursor: 'pointer' };
const backButtonStyle = { background: '#222', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', cursor: 'pointer', fontSize: '14px' };
const teaDetailCardStyle = { background: '#161816', borderRadius: '25px', overflow: 'hidden', display: 'flex', border: '1px solid #222', minHeight: '300px' };
const teaDetailImagePart = { flex: '1', maxWidth: '35%' };
const teaDetailTextPart = { flex: '1.5', padding: '20px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' };
const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContentStyle = { background: '#161816', padding: '35px', borderRadius: '30px', width: '300px', border: '1px solid #333' };
const inputStyle = { width: '100%', padding: '15px', marginBottom: '12px', borderRadius: '12px', background: '#222', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' as const };
const loginButtonStyle = { width: '100%', padding: '16px', borderRadius: '15px', background: '#4CAF50', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' };
const navBarStyle = { position: 'fixed' as const, bottom: '25px', left: '20px', right: '20px', height: '75px', backgroundColor: 'rgba(22, 24, 22, 0.95)', backdropFilter: 'blur(15px)', borderRadius: '25px', display: 'flex', border: '1px solid #222', zIndex: 999 };