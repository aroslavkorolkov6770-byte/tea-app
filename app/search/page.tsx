"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';

// --- 1. СТРУКТУРА ДАННЫХ (ИНТЕРФЕЙС БЕЗ КАРТИНОК) ---
interface Tea {
  id: number;
  name: string;
  type: string;
  category: string;
  strength: string;
  info: string;
  summary: string;
  desc: string;
  isDayTea: boolean;
}

// --- 2. БАЗА ЧАЯ (ПОЛЯ IMG УДАЛЕНЫ) ---
const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", isDayTea: false },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", isDayTea: false },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья.", isDayTea: false },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", isDayTea: false },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", isDayTea: false },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", isDayTea: false },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун.", isDayTea: true },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", isDayTea: false },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки.", isDayTea: false },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из почек.", isDayTea: false },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классика Юньнани.", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Выдержанный шен.", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", isDayTea: false }
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', isDayTea: false
  });

  useEffect(() => {
    // СВЯЗЬ С ОБЛАКОМ: Здесь будет загрузка из Supabase
    const savedTeas = localStorage.getItem('tea_master_db');
    const userRole = localStorage.getItem('userRole');

    if (savedTeas) setTeas(JSON.parse(savedTeas));
    else {
      setTeas(INITIAL_TEA_DATABASE);
      localStorage.setItem('tea_master_db', JSON.stringify(INITIAL_TEA_DATABASE));
    }

    if (userRole === 'admin') setIsAdmin(true);
    setIsMounted(true);
  }, []);

  const updateDatabase = (newList: Tea[]) => {
    setTeas(newList);
    localStorage.setItem('tea_master_db', JSON.stringify(newList));
  };

  const handleSaveNewTea = () => {
    let newList = [...teas];
    if (formData.isDayTea) newList = newList.map(t => ({ ...t, isDayTea: false }));
    const newTea: Tea = { ...formData, id: Date.now() };
    newList.push(newTea);
    updateDatabase(newList);
    setShowForm(false);
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', isDayTea: false });
  };

  const deleteTea = (id: number) => {
    if (confirm("Удалить этот сорт?")) {
      const newList = teas.filter(t => t.id !== id);
      updateDatabase(newList);
    }
  };

  const dayTea = teas.find(t => t.isDayTea);
  const filteredTeas = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const mCat = activeCategory === "Все" || t.type === activeCategory;
    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mCat && mStr;
  });

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />

      {/* НОВЫЙ КОНТЕЙНЕР: БЕЗ ОГРОМНЫХ ОТСТУПОВ И КАРТИНОК */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 20px 150px 20px' } as any}>
        
        {/* АДМИН-ПАНЕЛЬ */}
        {isAdmin && (
          <section style={{ marginBottom: '30px' } as any}>
            <div style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '2px dashed #4CAF50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
              <h2 style={{ fontSize: '16px', color: '#4CAF50', margin: 0 }}>Управление</h2>
              <button onClick={() => setShowForm(true)} style={{ background: '#4CAF50', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ Добавить чай</button>
            </div>
          </section>
        )}

        {/* ЧАЙ ДНЯ */}
        {dayTea && !search && activeCategory === "Все" && (
          <section style={{ marginBottom: '40px' } as any}>
            <div onClick={() => setSelectedTea(dayTea)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '30px', borderRadius: '25px', border: '1px solid #4CAF50', cursor: 'pointer' } as any}>
              <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</div>
              <h2 style={{ fontSize: '32px', color: '#fff', margin: '0 0 5px 0' }}>{dayTea.name}</h2>
              <p style={{ color: '#aaa', fontSize: '16px' }}>{dayTea.summary}</p>
            </div>
          </section>
        )}

        {/* ПОИСК И ФИЛЬТРЫ */}
        <section style={{ marginBottom: '30px' } as any}>
            <input type="text" placeholder="Поиск сорта..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '20px', outline: 'none' } as any} />
            
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px' } as any}>
                {["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(cat => (
                    <div key={cat} onClick={() => {setActiveCategory(cat); setActiveStrength("Все");}} style={{ padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816', color: activeCategory === cat ? '#000' : '#fff', fontSize: '14px' } as any}>{cat}</div>
                ))}
            </div>

            {activeCategory !== "Все" && (
                <div style={{ background: '#121412', padding: '15px', borderRadius: '15px', border: '1px solid #222', marginTop: '5px', display: 'flex', gap: '8px' } as any}>
                    {["Все", "Мягкий", "Средний", "Крепкий"].map(str => (
                        <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1c1a', color: activeStrength === str ? '#000' : '#666', fontSize: '12px' } as any}>{str}</div>
                    ))}
                </div>
            )}
        </section>

        {/* СПИСОК КАРТОЧЕК */}
        <section style={{ display: 'grid', gap: '12px' } as any}>
            {filteredTeas.map(tea => (
                <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{tea.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                    </div>
                    {isAdmin ? (
                        <div onClick={() => deleteTea(tea.id)} style={{ color: '#cc4444', cursor: 'pointer', padding: '10px' }}>✕</div>
                    ) : (
                        <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '11px' }}>{tea.strength}</div>
                    )}
                </div>
            ))}
        </section>

        {/* МОДАЛКА ДОБАВЛЕНИЯ */}
        {showForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
                <div style={{ background: '#161816', padding: '30px', borderRadius: '30px', width: '90%', maxWidth: '450px', border: '1px solid #333' } as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Добавить чай</h2>
                    <input style={inS} placeholder="Название" onChange={e => setFormData({...formData, name: e.target.value})} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select style={inS} onChange={e => setFormData({...formData, type: e.target.value})}>
                            {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select style={inS} onChange={e => setFormData({...formData, strength: e.target.value})}>
                            {["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <input style={inS} placeholder="Категория" onChange={e => setFormData({...formData, category: e.target.value})} />
                    <textarea style={{...inS, height: '60px'}} placeholder="Краткое описание" onChange={e => setFormData({...formData, summary: e.target.value})} />
                    <textarea style={{...inS, height: '100px'}} placeholder="Полная история" onChange={e => setFormData({...formData, desc: e.target.value})} />
                    <label style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}><input type="checkbox" onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
                    <div onClick={handleSaveNewTea} style={{ background: '#4CAF50', color: '#000', padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ</div>
                    <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '10px', color: '#555', cursor: 'pointer' }}>Отмена</div>
                </div>
            </div>
        )}

        {/* ДЕТАЛЬНЫЙ ПРОСМОТР */}
        {selectedTea && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, overflowY: 'auto', padding: '40px 20px' } as any}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }}>← Назад</div>
                    <div style={{ background: '#161816', borderRadius: '30px', padding: '30px', border: '1px solid #222' } as any}>
                        <h2 style={{ fontSize: '28px', color: '#4CAF50', margin: '0 0 10px 0' }}>{selectedTea.name}</h2>
                        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#bbb' }}>{selectedTea.desc}</p>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

const inS = { width: '100%', padding: '12px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none' } as any;