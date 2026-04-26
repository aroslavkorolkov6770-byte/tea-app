"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

export default function SearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Состояния категорий
  const [teaTypes, setTeaTypes] = useState<string[]>(["Зеленый", "Белый", "Улун", "Красный", "Пуэр"]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);

  // Модалки
  const [showTeaForm, setShowTeaForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data) setTeas(data);
    } catch (err) { console.error("Ошибка загрузки"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const savedTypes = localStorage.getItem('tea_types');
    if (savedTypes) setTeaTypes(JSON.parse(savedTypes));
    setIsAdmin(localStorage.getItem('userRole') === 'admin');
    setIsMounted(true);
  }, []);

  // --- ЛОГИКА КАТЕГОРИЙ ---
  const handleAddType = () => {
    if (newTypeName && !teaTypes.includes(newTypeName)) {
      const updated = [...teaTypes, newTypeName];
      setTeaTypes(updated);
      localStorage.setItem('tea_types', JSON.stringify(updated));
      setNewTypeName("");
      setShowTypeForm(false);
    }
  };

  const deleteTeaType = (e: React.MouseEvent, typeToDelete: string) => {
    e.stopPropagation();
    if (confirm(`Удалить категорию "${typeToDelete}"?`)) {
      const updated = teaTypes.filter(t => t !== typeToDelete);
      setTeaTypes(updated);
      localStorage.setItem('tea_types', JSON.stringify(updated));
    }
  };

  // --- ЛОГИКА ЧАЯ ---
  const handleSaveTea = async () => {
    // Если ставим "Чай дня", сбрасываем у остальных в базе
    if (formData.isDayTea) {
      await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    }

    if (editingId) {
      await supabase.from('teas').update(formData).eq('id', editingId);
    } else {
      await supabase.from('teas').insert([formData]);
    }
    setShowTeaForm(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    fetchData();
  };

  const toggleDayTea = async (e: React.MouseEvent, tea: Tea) => {
    e.stopPropagation();
    const newState = !tea.isDayTea;
    if (newState) {
      await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    }
    await supabase.from('teas').update({ isDayTea: newState }).eq('id', tea.id);
    fetchData();
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

      <main style={{ 
        maxWidth: '1200px', margin: '0 auto', padding: '120px 20px', display: 'grid',
        gridTemplateColumns: isAdmin ? '1fr 300px' : '1fr', gap: '40px', alignItems: 'start'
      } as any}>
        
        {/* ЛЕВАЯ ЧАСТЬ (КОНТЕНТ) */}
        <section>
          {/* ЧАЙ ДНЯ */}
          {dayTea && activeCategory === "Все" && !search && (
            <div onClick={() => setSelectedTea(dayTea)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '35px', borderRadius: '35px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '35px' } as any}>
              <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
              <h2 style={{ fontSize: '32px', margin: '10px 0' }}>{dayTea.name}</h2>
              <p style={{ color: '#aaa' }}>{dayTea.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск сорта..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          
          {/* КАТЕГОРИИ */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', alignItems: 'center' } as any}>
            <div onClick={() => {setActiveCategory("Все"); setActiveStrength("Все");}} style={{ ...typeBadge, backgroundColor: activeCategory === "Все" ? '#4CAF50' : '#161816', color: activeCategory === "Все" ? '#000' : '#fff' } as any}>Все</div>
            {teaTypes.map(type => (
              <div key={type} style={{ position: 'relative' }}>
                <div onClick={() => {setActiveCategory(type); setActiveStrength("Все");}} style={{ ...typeBadge, backgroundColor: activeCategory === type ? '#4CAF50' : '#161816', color: activeCategory === type ? '#000' : '#fff' } as any}>{type}</div>
                {isAdmin && <span onClick={(e) => deleteTeaType(e, type)} style={deleteTypeBtn as any}>✕</span>}
              </div>
            ))}
            {isAdmin && <div onClick={() => setShowTypeForm(true)} style={{ ...typeBadge, border: '1px dashed #4CAF50', color: '#4CAF50' } as any}>+</div>}
          </div>

          {/* ХАРАКТЕР (ВОССТАНОВЛЕНО) */}
          {activeCategory !== "Все" && (
            <div style={{ background: '#121412', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '25px', display: 'flex', gap: '10px' } as any}>
                {STRENGTHS.map(str => (
                  <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                ))}
            </div>
          )}

          {/* СПИСОК КАРТОЧЕК */}
          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredTeas.map(tea => (
              <div key={tea.id} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                  <h3 style={{ margin: 0 }}>{tea.name}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {isAdmin && (
                    <>
                      <span onClick={(e) => toggleDayTea(e, tea)} style={{ cursor: 'pointer', fontSize: '20px', color: tea.isDayTea ? '#4CAF50' : '#333' }}>⭐</span>
                      <span onClick={() => { setEditingId(tea.id); setFormData(tea); setShowTeaForm(true); }} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</span>
                      <span onClick={async () => { if(confirm("Удалить?")) { await supabase.from('teas').delete().eq('id', tea.id); fetchData(); } }} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</span>
                    </>
                  )}
                  {!isAdmin && <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px' }}>{tea.strength}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ПРАВАЯ ЧАСТЬ (АДМИН) */}
        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222' } as any}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#4CAF50' }}>МАСТЕР-ПАНЕЛЬ</h3>
              <button onClick={() => { setEditingId(null); setShowTeaForm(true); }} style={{ width: '100%', background: '#4CAF50', color: '#000', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>+ ДОБАВИТЬ ЧАЙ</button>
            </div>
          </aside>
        )}

        {/* МОДАЛКА: ДОБАВЛЕНИЕ КАТЕГОРИИ (ЭТАП 1) */}
        {showTypeForm && (
            <div style={modalOverlay as any}>
                <div style={modalContent as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Новый тип чая</h2>
                    <input style={inS} value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Название (например, Желтый)" />
                    <button onClick={handleAddType} style={btnMain}>СОХРАНИТЬ ТИП</button>
                    <button onClick={() => setShowTypeForm(false)} style={btnCancel}>Отмена</button>
                </div>
            </div>
        )}

        {/* МОДАЛКА: ДОБАВЛЕНИЕ ЧАЯ (ЭТАП 2) */}
        {showTeaForm && (
            <div style={modalOverlay as any}>
                <div style={modalContent as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{editingId ? 'Редактировать' : 'Новый чай'}</h2>
                    <input style={inS} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <div style={{display:'flex', gap:'10px'}}>
                        <select style={inS} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            {teaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select style={inS} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>
                            {["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <textarea style={{...inS, height: '100px'}} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
                    <label style={{display:'flex', gap:'10px', marginBottom:'20px'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
                    <button onClick={handleSaveTea} style={btnMain}>СОХРАНИТЬ В ОБЛАКО</button>
                    <button onClick={() => setShowTeaForm(false)} style={btnCancel}>Отмена</button>
                </div>
            </div>
        )}

        {/* ДЕТАЛЬНЫЙ ПРОСМОТР */}
        {selectedTea && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, padding: '40px 20px', overflowY: 'auto' } as any}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '20px', cursor: 'pointer' }}>← Назад</div>
              <h2 style={{ fontSize: '32px', color: '#4CAF50' }}>{selectedTea.name}</h2>
              <p style={{ lineHeight: '1.6', color: '#bbb' }}>{selectedTea.desc}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Стили
const typeBadge = { padding: '10px 24px', borderRadius: '25px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', transition: '0.2s' };
const deleteTypeBtn = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff7675', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0d0f0d' };
const inS = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' } as any;
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContent = { background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', border: '1px solid #333' };
const btnMain = { width: '100%', padding: '15px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' };
const btnCancel = { width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any;