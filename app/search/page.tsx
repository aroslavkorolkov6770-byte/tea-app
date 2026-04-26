
"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

export const dynamic = 'force-dynamic';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea?: boolean;
}

const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" }
];

export default function SearchPage() {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data && data.length > 0) setTeas(data);
      else setTeas(INITIAL_TEA_DATABASE);
    } catch (err) { setTeas(INITIAL_TEA_DATABASE); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    setIsAdmin(localStorage.getItem('userRole') === 'admin');
  }, []);

  const saveTea = async () => {
    try {
      // 1. Если этот чай — Чай дня, сначала снимаем галочку у всех остальных в облаке
      if (formData.isDayTea) {
        await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
      }

      if (editingId) {
        // ОБНОВЛЯЕМ
        const { error } = await supabase.from('teas').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        // СОЗДАЕМ
        const { error } = await supabase.from('teas').insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
      fetchData(); // Перезагрузка списка
    } catch (err: any) { alert("Ошибка сохранения: " + err.message); }
  };

  const startEdit = (tea: Tea) => {
    setEditingId(tea.id);
    setFormData({
      name: tea.name || '', type: tea.type || 'Зеленый', category: tea.category || '',
      strength: tea.strength || 'Мягкий', info: tea.info || '90°C',
      summary: tea.summary || '', desc: tea.desc || '', img: tea.img || '',
      isDayTea: tea.isDayTea ?? false
    });
    setShowForm(true);
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
            {/* 1. БЛОК ЧАЙ ДНЯ (ВСЕГДА САМЫЙ ВЕРХНИЙ) */}
            {dayTea && activeCategory === "Все" && !search && (
              <div onClick={() => setSelectedTea(dayTea)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '35px', borderRadius: '35px', marginBottom: '20px', border: '1px solid #4CAF50', cursor: 'pointer' } as any}>
                <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                <h2 style={{ margin: '10px 0', fontSize: '32px' }}>{dayTea.name}</h2>
                <p style={{ color: '#aaa' }}>{dayTea.summary}</p>
              </div>
            )}

            {/* 2. ПАНЕЛЬ УПРАВЛЕНИЯ (ТЕПЕРЬ НИЖЕ ЧАЯ ДНЯ) */}
            {isAdmin && (
              <div style={{ background: '#161816', padding: '20px', borderRadius: '25px', marginBottom: '30px', border: '2px dashed #4CAF50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <span style={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '14px' }}>УПРАВЛЕНИЕ БАЗОЙ</span>
                <button onClick={() => { setEditingId(null); setShowForm(true); }} style={{ background: '#4CAF50', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ ДОБАВИТЬ ЧАЙ</button>
              </div>
            )}

            <input type="text" placeholder="Поиск сорта..." value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />

            {/* 3. ФИЛЬТРЫ ТИПА */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px' } as any}>
              {["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(cat => (
                <div key={cat} onClick={() => { setActiveCategory(cat); setActiveStrength("Все"); }} style={{ padding: '12px 24px', borderRadius: '25px', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816', color: activeCategory === cat ? '#000' : '#fff', fontWeight: 'bold' } as any}>{cat}</div>
              ))}
            </div>

            {/* 4. ФИЛЬТР ХАРАКТЕРА */}
            {activeCategory !== "Все" && (
              <div key={activeCategory} style={{ background: '#121412', padding: '20px', borderRadius: '18px', border: '1px solid #222', marginBottom: '25px' } as any}>
                <div style={{ display: 'flex', gap: '10px' } as any}>
                  {["Все", "Мягкий", "Средний", "Крепкий"].map(str => (
                    <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. СПИСОК ЧАЕВ */}
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredTeas.map(tea => (
                <div key={tea.id} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                    <h3 style={{ margin: 0 }}>{tea.name}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                  </div>
                  {isAdmin ? (
                    <div style={{ display: 'flex', gap: '15px', marginLeft: '20px' }}>
                      <span onClick={() => startEdit(tea)} style={{ cursor: 'pointer', color: '#4CAF50', fontSize: '20px' }}>✎</span>
                      <span onClick={async () => { if(confirm("Удалить?")) { await supabase.from('teas').delete().eq('id', tea.id); fetchData(); } }} style={{ cursor: 'pointer', color: '#ff5252', fontSize: '20px' }}>✕</span>
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
                <p style={{ color: '#bbb', lineHeight: '1.8' }}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* УДОБНАЯ МОДЕЛЬ РЕДАКТИРОВАНИЯ */}
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' } as any}>
              <h2 style={{ marginBottom: '25px', textAlign: 'center' }}>{editingId ? 'Редактировать' : 'Новый чай'}</h2>
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
              <textarea style={{...inS, height: '100px'}} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{display:'flex', gap:'10px', marginBottom:'20px', cursor:'pointer'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
              <div onClick={saveTea} style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' } as any}>СОХРАНИТЬ В ОБЛАКО</div>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#555' }}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none', boxSizing: 'border-box' } as any;
const inS = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' } as any;