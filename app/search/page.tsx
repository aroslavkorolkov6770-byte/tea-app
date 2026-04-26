"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea?: boolean;
}

// --- РЕЗЕРВНАЯ БАЗА (15 СОРТОВ) ---
const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Плотный, травянистый.", desc: "Огромные плоские листья.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800" },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Улун из Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800" },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из почек.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классика Юньнани.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Копченый чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Выдержанный шен.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" }
];

export default function SearchPage() {
  const [teas, setTeas] = useState<Tea[]>(INITIAL_TEA_DATABASE); // Сразу показываем резерв
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");

  // СОСТОЯНИЕ ФОРМЫ (АДМИН)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data && data.length > 0) setTeas(data);
    } catch (err) { console.log("Работаем на резервной базе"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    setIsAdmin(localStorage.getItem('userRole') === 'admin');
  }, []);

  const saveTea = async () => {
    try {
      if (formData.isDayTea) await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
      if (editingId) {
        await supabase.from('teas').update(formData).eq('id', editingId);
      } else {
        await supabase.from('teas').insert([formData]);
      }
      setShowForm(false);
      setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const dayTea = teas.find(t => t.isDayTea);
  const filteredTeas = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const mCat = activeCategory === "Все" || t.type === activeCategory;
    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mCat && mStr;
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        {!selectedTea ? (
          <>
            {/* АДМИН-ПАНЕЛЬ */}
            {isAdmin && (
              <div style={{ background: '#161816', padding: '20px', borderRadius: '25px', marginBottom: '30px', border: '2px dashed #4CAF50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>УПРАВЛЕНИЕ БАЗОЙ</span>
                <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{ background: '#4CAF50', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ ДОБАВИТЬ ЧАЙ</button>
              </div>
            )}

            {/* ЧАЙ ДНЯ */}
            {dayTea && activeCategory === "Все" && !search && (
              <div onClick={() => setSelectedTea(dayTea)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '35px', borderRadius: '35px', marginBottom: '35px', border: '1px solid #4CAF50', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' } as any}>
                <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                <h2 style={{ margin: '10px 0', fontSize: '32px' }}>{dayTea.name}</h2>
                <p style={{ color: '#aaa' }}>{dayTea.summary}</p>
              </div>
            )}

            <input type="text" placeholder="Поиск сорта..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any} />

            {/* КАТЕГОРИИ */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px' } as any}>
              {["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(cat => (
                <div key={cat} onClick={() => { setActiveCategory(cat); setActiveStrength("Все"); }} style={{ padding: '12px 24px', borderRadius: '25px', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816', color: activeCategory === cat ? '#000' : '#fff', fontWeight: 'bold' } as any}>{cat}</div>
              ))}
            </div>

            {/* ХАРАКТЕР */}
            {activeCategory !== "Все" && (
              <div key={activeCategory} style={{ background: '#121412', padding: '20px', borderRadius: '18px', border: '1px solid #222', marginBottom: '25px' } as any}>
                <div style={{ display: 'flex', gap: '10px' } as any}>
                  {["Все", "Мягкий", "Средний", "Крепкий"].map(str => (
                    <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                  ))}
                </div>
              </div>
            )}

            {/* СПИСОК ЧАЕВ */}
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredTeas.map(tea => (
                <div key={tea.id} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                    <h3 style={{ margin: 0 }}>{tea.name}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                  </div>
                  {isAdmin ? (
                    <div style={{ display: 'flex', gap: '15px', marginLeft: '20px' }}>
                      <span onClick={() => { setEditingId(tea.id); setFormData(tea as any); setShowForm(true); }} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</span>
                      <span onClick={async () => { if(confirm("Удалить?")) { await supabase.from('teas').delete().eq('id', tea.id); fetchData(); } }} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</span>
                    </div>
                  ) : (
                    <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '11px' }}>{tea.strength}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ДЕТАЛЬНАЯ КАРТОЧКА */
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div onClick={() => setSelectedTea(null)} style={{ color: '#fff', cursor: 'pointer', marginBottom: '25px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: '#161816', borderRadius: '15px', border: '1px solid #333' } as any}>← Назад</div>
            <div style={{ background: '#161816', borderRadius: '35px', overflow: 'hidden', border: '1px solid #222' } as any}>
              <img src={selectedTea.img} style={{ width: '100%', height: '350px', objectFit: 'cover' } as any} />
              <div style={{ padding: '35px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '32px', margin: '0 0 10px 0' }}>{selectedTea.name}</h2>
                <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>Температура: {selectedTea.info} | {selectedTea.category}</div>
                <p style={{ color: '#bbb', lineHeight: '1.8' }}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* УДОБНАЯ МОДЕЛЬ ДОБАВЛЕНИЯ (ADMIN ONLY) */}
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' } as any}>
              <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{editingId ? 'Редактировать' : 'Новый чай'}</h2>
              <input style={inS} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}>
                <select style={inS} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select style={inS} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>
                  {["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input style={inS} placeholder="Категория" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              <input style={inS} placeholder="Температура" value={formData.info} onChange={e => setFormData({...formData, info: e.target.value})} />
              <textarea style={{...inS, height: '80px'}} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{display:'flex', gap:'10px', marginBottom:'20px'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
              <button onClick={saveTea} style={{ width: '100%', padding: '15px', background: '#4CAF50', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ В ОБЛАКО</button>
              <button onClick={() => setShowForm(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}>Отмена</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const inS = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' } as any;