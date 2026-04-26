"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';

// --- ПОДГОТОВКА СТРУКТУРЫ (ИНТЕРФЕЙС) ---
interface Tea {
  id: number;
  name: string;
  type: string;
  category: string;
  strength: string;
  info: string;
  summary: string;
  desc: string;
  img: string;
  isDayTea: boolean;
}

// --- ПОЛНАЯ БАЗА ЧАЯ (15 СОРТОВ ДЛЯ ВСЕХ КАТЕГОРИЙ) ---
const INITIAL_TEA_DATABASE: Tea[] = [
  // ЗЕЛЕНЫЙ
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  // БЕЛЫЙ
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800", isDayTea: false },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: false },
  // УЛУН
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  // КРАСНЫЙ
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из крошечных почек.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классика Юньнани.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  // ПУЭР
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Выдержанный шен.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false }
];

export default function Home() {
  // --- СОСТОЯНИЯ (STATE) ---
  const [teas, setTeas] = useState<Tea[]>([]); // База чая
  const [isMounted, setIsMounted] = useState(false); // Для предотвращения ошибок гидратации
  const [isAdmin, setIsAdmin] = useState(false); // Флаг админа
  const [search, setSearch] = useState(""); // Поиск
  const [activeCategory, setActiveCategory] = useState("Все"); // Категории
  const [activeStrength, setActiveStrength] = useState("Все"); // Характер
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null); // Выбранный чай

  // СОСТОЯНИЕ ФОРМЫ (ADMIN)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  // --- ЛОГИКА ЗАГРУЗКИ (LOCAL STORAGE) ---
  useEffect(() => {
    const savedTeas = localStorage.getItem('local_teas_v2');
    const userRole = localStorage.getItem('userRole');
    
    if (savedTeas) setTeas(JSON.parse(savedTeas));
    else {
      setTeas(INITIAL_TEA_DATABASE);
      localStorage.setItem('local_teas_v2', JSON.stringify(INITIAL_TEA_DATABASE));
    }

    if (userRole === 'admin') setIsAdmin(true);
    setIsMounted(true);
  }, []);

  // --- ЛОГИКА УПРАВЛЕНИЯ (ФУНКЦИИ) ---
  
  // Здесь будет запрос к Supabase в будущем
  const saveToStorage = (updatedList: Tea[]) => {
    setTeas(updatedList);
    localStorage.setItem('local_teas_v2', JSON.stringify(updatedList));
  };

  const handleSaveTea = () => {
    let newList = [...teas];
    const newEntry = { ...formData, id: Date.now() };

    // Логика "Чая дня"
    if (formData.isDayTea) {
      newList = newList.map(t => ({ ...t, isDayTea: false }));
    }

    newList.push(newEntry);
    saveToStorage(newList);
    setShowForm(false);
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
  };

  const deleteTea = (id: number) => {
    if (confirm("Удалить этот сорт?")) {
      const newList = teas.filter(t => t.id !== id);
      saveToStorage(newList);
    }
  };

  // --- ФИЛЬТРАЦИЯ ---
  const dayTea = teas.find(t => t.isDayTea);
  const filteredTeas = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const mCat = activeCategory === "Все" || t.type === activeCategory;
    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mCat && mStr;
  });

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative', overflowX: 'hidden' } as any}>
      <Navigation />

      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '150px' } as any}>
        
        {/* 1. HERO ЭКРАН (БЕЗ ИЗМЕНЕНИЙ) */}
        <section style={{ height: '70vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' } as any}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' } as any} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' } as any}>Tea Master <span style={{ color: '#4CAF50' }}>Store</span></h1>
            <p style={{ color: '#aaa', letterSpacing: '4px', fontSize: '12px' }}>Искусство в каждой капле</p>
          </div>
        </section>

        {/* 2. АДМИН-БАР (ВИДЕН ТОЛЬКО ПОД 11/11) */}
        {isAdmin && (
          <section style={{ padding: '0 25px 40px 25px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '30px', border: '2px dashed #4CAF50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
              <h2 style={{ fontSize: '18px', color: '#4CAF50', margin: 0 }}>Управление контентом</h2>
              <button onClick={() => setShowForm(true)} style={{ background: '#4CAF50', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>+ Добавить новый сорт</button>
            </div>
          </section>
        )}

        {/* 3. ЧАЙ ДНЯ (БОЛЬШАЯ ПЛАШКА СО ЗВЕЗДОЙ) */}
        {dayTea && !search && activeCategory === "Все" && (
          <section style={{ padding: '0 25px 60px 25px' } as any}>
            <div onClick={() => setSelectedTea(dayTea)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '45px', borderRadius: '40px', border: '1px solid #4CAF50', cursor: 'pointer', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' } as any}>
              <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px', marginBottom: '15px' }}>⭐ ЧАЙ ДНЯ СЕГОДНЯ</div>
              <h2 style={{ fontSize: '42px', color: '#fff', margin: '0 0 10px 0' }}>{dayTea.name}</h2>
              <p style={{ fontSize: '18px', color: '#aaa', lineHeight: '1.6' }}>{dayTea.summary}</p>
              <div style={{ marginTop: '25px', display: 'inline-block', padding: '10px 20px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50', borderRadius: '12px', color: '#4CAF50', fontWeight: 'bold' }}>Узнать историю →</div>
            </div>
          </section>
        )}

        {/* 4. ПОИСК И ФИЛЬТРЫ */}
        <section style={{ padding: '0 25px 40px 25px' } as any}>
            <input type="text" placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '22px', borderRadius: '20px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none', fontSize: '16px' } as any} />
            
            {/* Группы */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px' } as any}>
                {["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(cat => (
                    <div key={cat} onClick={() => {setActiveCategory(cat); setActiveStrength("Все");}} style={{ padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816', color: activeCategory === cat ? '#000' : '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' } as any}>{cat}</div>
                ))}
            </div>

            {/* Подфильтры характера */}
            {activeCategory !== "Все" && (
                <div style={{ background: '#121412', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginTop: '10px', display: 'flex', gap: '10px' } as any}>
                    {["Все", "Мягкий", "Средний", "Крепкий"].map(str => (
                        <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1c1a', color: activeStrength === str ? '#000' : '#666', fontSize: '13px' } as any}>{str}</div>
                    ))}
                </div>
            )}
        </section>

        {/* 5. СПИСОК КАРТОЧЕК */}
        <section style={{ padding: '0 25px', display: 'grid', gap: '15px' } as any}>
            {filteredTeas.map(tea => (
                <div key={tea.id} style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{tea.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{tea.summary}</p>
                    </div>
                    {isAdmin ? (
                        <div onClick={() => deleteTea(tea.id)} style={{ color: '#cc4444', cursor: 'pointer', padding: '10px' }}>✕</div>
                    ) : (
                        <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px' }}>{tea.strength}</div>
                    )}
                </div>
            ))}
        </section>

        {/* 6. МОДАЛКА УДОБНОГО ДОБАВЛЕНИЯ (ADMIN) */}
        {showForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
                <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #333' } as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Добавить новый сорт</h2>
                    <input style={inS} placeholder="Название чая" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select style={inS} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select style={inS} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>
                            {["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <input style={inS} placeholder="Категория (например, Шен Пуэр)" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    <input style={inS} placeholder="Температура заваривания" value={formData.info} onChange={e => setFormData({...formData, info: e.target.value})} />
                    <textarea style={{...inS, height: '80px'}} placeholder="Краткое описание" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                    <textarea style={{...inS, height: '120px'}} placeholder="Полная история и вкус" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
                    <input style={inS} placeholder="Ссылка на фото" value={formData.img} onChange={e => setFormData({...formData, img: e.target.value})} />
                    <label style={{ display: 'flex', gap: '10px', marginBottom: '25px', cursor: 'pointer' }}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Установить как Чай Дня ⭐</label>
                    <div onClick={handleSaveTea} style={{ background: '#4CAF50', color: '#000', padding: '20px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ В БАЗУ</div>
                    <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', color: '#555', cursor: 'pointer' }}>Отмена</div>
                </div>
            </div>
        )}

        {/* 7. ДЕТАЛЬНЫЙ ПРОСМОТР */}
        {selectedTea && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, overflowY: 'auto' } as any}>
                <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
                    <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '30px', cursor: 'pointer', fontWeight: 'bold' }}>← Назад к списку</div>
                    <div style={{ background: '#161816', borderRadius: '40px', overflow: 'hidden', border: '1px solid #222' } as any}>
                        <img src={selectedTea.img} style={{ width: '100%', height: '400px', objectFit: 'cover' } as any} />
                        <div style={{ padding: '40px' }}>
                            <h2 style={{ fontSize: '36px', color: '#4CAF50', margin: '0 0 10px 0' }}>{selectedTea.name}</h2>
                            <div style={{ color: '#666', marginBottom: '30px' }}>{selectedTea.category} | {selectedTea.info} | {selectedTea.strength}</div>
                            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb' }}>{selectedTea.desc}</p>
                        </div>
                    </div>
                </main>
            </div>
        )}

      </main>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; padding: 0; background-color: #0d0f0d; }
      `}</style>
    </div>
  );
}

const inS = { width: '100%', padding: '15px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '15px', outline: 'none', boxSizing: 'border-box' } as any;