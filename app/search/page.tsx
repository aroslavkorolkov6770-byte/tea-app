"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

const INITIAL_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки из гор Уи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false }
];

export default function SearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [teaTypes, setTeaTypes] = useState<string[]>(["Зеленый", "Белый", "Улун", "Красный", "Пуэр"]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);

  // Модалки
  const [showTeaForm, setShowTeaForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTeaDeleteModal, setShowTeaDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState("");
  const [teaIdToDelete, setTeaIdToDelete] = useState<number | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const syncData = async () => {
    const cachedTeas = localStorage.getItem('local_tea_db_final');
    const cachedTypes = localStorage.getItem('local_tea_types_final');
    if (cachedTeas) setTeas(JSON.parse(cachedTeas)); else setTeas(INITIAL_DATABASE);
    if (cachedTypes) setTeaTypes(JSON.parse(cachedTypes));

    try {
      const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setTeas(data);
        localStorage.setItem('local_tea_db_final', JSON.stringify(data));
      }
    } catch (err) { console.log("Cloud offline"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    syncData();
    setIsAdmin(localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('userRole') === 'admin');
    setIsMounted(true);
  }, []);

  const resetTeaForm = () => {
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    setEditingId(null);
  };

  const handleSaveTea = async () => {
    if (formData.isDayTea) await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    if (editingId) await supabase.from('teas').update(formData).eq('id', editingId);
    else await supabase.from('teas').insert([formData]);
    setShowTeaForm(false); resetTeaForm(); syncData();
  };

  const toggleDayTea = async (e: React.MouseEvent, tea: Tea) => {
    e.stopPropagation();
    await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    await supabase.from('teas').update({ isDayTea: !tea.isDayTea }).eq('id', tea.id);
    syncData();
  };

  const confirmDeleteTea = async () => {
    if (teaIdToDelete) {
      await supabase.from('teas').delete().eq('id', teaIdToDelete);
      setShowTeaDeleteModal(false); setTeaIdToDelete(null); syncData();
    }
  };

  const handleAddType = () => {
    if (newTypeName && !teaTypes.includes(newTypeName)) {
      const updated = [...teaTypes, newTypeName];
      setTeaTypes(updated);
      localStorage.setItem('local_tea_types_final', JSON.stringify(updated));
      setNewTypeName(""); setShowTypeForm(false);
    }
  };

  const deleteCategory = () => {
    const updated = teaTypes.filter(t => t !== typeToDelete);
    setTeaTypes(updated);
    localStorage.setItem('local_tea_types_final', JSON.stringify(updated));
    setShowDeleteModal(false);
  };

  const filteredTeas = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const mCat = activeCategory === "Все" || t.type === activeCategory;
    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mCat && mStr;
  });

  const dayTea = teas.find(t => t.isDayTea);

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* 1. ПРЕМИАЛЬНЫЙ БЛОК ЧАЯ ДНЯ */}
        {dayTea && activeCategory === "Все" && !search && (
          <section style={{ marginBottom: '80px', animation: 'fadeInUp 0.8s ease' }}>
            <div onClick={() => setSelectedTea(dayTea)} style={{ 
              background: 'linear-gradient(135deg, #1b3d1d 0%, #0d0f0d 100%)', 
              padding: '60px', borderRadius: '40px', border: '1px solid #4CAF50',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)', cursor: 'pointer', position: 'relative', overflow: 'hidden'
            } as any}>
                <div style={{ position: 'absolute', top: '40px', right: '40px', fontSize: '80px', opacity: 0.05, fontWeight: '900' }}>RECOMMENDED</div>
                <span style={{ color: '#4CAF50', fontSize: '14px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                <h2 style={{ fontSize: 'calc(32px + 2vw)', margin: '20px 0', fontWeight: '900', lineHeight: '1' }}>{dayTea.name}</h2>
                <p style={{ color: '#aaa', fontSize: '20px', maxWidth: '600px', lineHeight: '1.6' }}>{dayTea.summary}</p>
                <div style={{ marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: '20px', padding: '15px 30px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '15px', border: '1px solid #4CAF50', color: '#4CAF50', fontWeight: 'bold' }}>
                    ПОДРОБНЕЕ О СОРТЕ <span>→</span>
                </div>
            </div>
          </section>
        )}

        {/* 2. АДМИН-ПАНЕЛЬ (ШИРОКАЯ) */}
        {isAdmin && (
          <div style={{ background: 'rgba(76, 175, 80, 0.05)', padding: '30px', borderRadius: '30px', marginBottom: '60px', border: '1px dashed #4CAF50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
             <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>УПРАВЛЕНИЕ АССОРТИМЕНТОМ</h3>
             <div onClick={() => { resetTeaForm(); setShowTeaForm(true); }} style={{ padding: '15px 40px', background: '#4CAF50', color: '#000', borderRadius: '50px', fontWeight: '900', cursor: 'pointer', fontSize: '14px' } as any}>+ ДОБАВИТЬ НОВЫЙ ЧАЙ</div>
          </div>
        )}

        {/* 3. ПОИСК И ФИЛЬТРЫ (ЦЕНТРИРОВАНО) */}
        <section style={{ marginBottom: '60px' }}>
          <input type="text" placeholder="Поиск по коллекции..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '25px', borderRadius: '25px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '40px', outline: 'none', fontSize: '18px' } as any} />
          
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '20px', alignItems: 'center' } as any}>
            <div onClick={() => {setActiveCategory("Все"); setActiveStrength("Все");}} style={{ ...typeBadge, backgroundColor: activeCategory === "Все" ? '#4CAF50' : '#161816', color: activeCategory === "Все" ? '#000' : '#fff' } as any}>Все</div>
            {teaTypes.map(type => (
              <div key={type} style={{ position: 'relative' }}>
                <div onClick={() => {setActiveCategory(type); setActiveStrength("Все");}} style={{ ...typeBadge, backgroundColor: activeCategory === type ? '#4CAF50' : '#161816', color: activeCategory === type ? '#000' : '#fff' } as any}>{type}</div>
                {isAdmin && <span onClick={(e) => { e.stopPropagation(); setTypeToDelete(type); setShowDeleteModal(true); }} style={deleteTypeBtn as any}>✕</span>}
              </div>
            ))}
            {isAdmin && <div onClick={() => setShowTypeForm(true)} style={{ ...typeBadge, border: '1px dashed #4CAF50', color: '#4CAF50', background: 'none' } as any}>+</div>}
          </div>

          {activeCategory !== "Все" && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginTop: '10px', display: 'flex', gap: '10px', animation: 'fadeIn 0.4s ease' } as any}>
                {STRENGTHS.map(str => (
                  <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '12px 25px', borderRadius: '15px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666', transition: '0.3s' } as any}>{str}</div>
                ))}
            </div>
          )}
        </section>

        {/* 4. СЕТКА ЧАЕВ (GRID 2-3 КОЛОНКИ) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' } as any}>
          {filteredTeas.map(tea => (
            <div 
                key={tea.id} 
                onClick={() => setSelectedTea(tea)}
                style={{ 
                    background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid #222', 
                    cursor: 'pointer', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' 
                } as any}
                onMouseEnter={(e:any) => {e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = '#4CAF50';}}
                onMouseLeave={(e:any) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#222';}}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#4CAF50', letterSpacing: '2px' }}>{tea.type.toUpperCase()}</span>
                {!isAdmin && <div style={{ fontSize: '10px', color: '#4CAF50', border: '1px solid #4CAF50', padding: '4px 8px', borderRadius: '6px' }}>{tea.strength}</div>}
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900' }}>{tea.name}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.5' }}>{tea.summary}</p>
              
              {isAdmin && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '1px solid #222', paddingTop: '20px' }}>
                  <div onClick={(e) => toggleDayTea(e, tea)} style={{ fontSize: '22px', color: tea.isDayTea ? '#4CAF50' : '#222' }}>⭐</div>
                  <div onClick={(e:any) => {e.stopPropagation(); setEditingId(tea.id); setFormData(tea); setShowTeaForm(true);}} style={{ color: '#4CAF50' }}>✎</div>
                  <div onClick={(e:any) => {e.stopPropagation(); setTeaIdToDelete(tea.id); setShowTeaDeleteModal(true);}} style={{ color: '#ff7675' }}>✕</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* МОДАЛКИ (СОХРАНЕНА ВСЯ ЛОГИКА) */}
      {showTypeForm && (
        <div style={modalOverlay as any}>
          <div style={modalContent as any}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', fontWeight: '900' }}>НОВЫЙ ТИП</h2>
            <input style={inS as any} value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Название..." />
            <button onClick={handleAddType} style={btnMain as any}>ДОБАВИТЬ КАТЕГОРИЮ</button>
            <button onClick={() => setShowTypeForm(false)} style={btnCancel as any}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {showTeaForm && (
        <div style={modalOverlay as any}>
          <div style={modalContent as any}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: '900' }}>{editingId ? 'РЕДАКТИРОВАНИЕ' : 'НОВЫЙ ЧАЙ'}</h2>
            <input style={inS as any} placeholder="Название сорта" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <div style={{display:'flex', gap:'10px'}}>
              <select style={inS as any} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>{teaTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select style={inS as any} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>{["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <textarea style={{...inS, height: '120px'} as any} placeholder="Описание вкуса и история" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
            <label style={{display:'flex', gap:'15px', marginBottom:'30px', cursor:'pointer', alignItems:'center'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> <span style={{fontSize:'14px', fontWeight:'bold'}}>УСТАНОВИТЬ КАК ЧАЙ ДНЯ ⭐</span></label>
            <button onClick={handleSaveTea} style={btnMain as any}>СОХРАНИТЬ В ОБЛАКО</button>
            <button onClick={() => setShowTeaForm(false)} style={btnCancel as any}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* МОДАЛКИ УДАЛЕНИЯ (КАК ТЫ ПРОСИЛ) */}
      {(showDeleteModal || showTeaDeleteModal) && (
        <div style={modalOverlay as any}>
          <div style={modalContent as any}>
            <h2 style={{ textAlign: 'center', marginBottom: '15px', fontWeight: '900' }}>ПОДТВЕРЖДЕНИЕ</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px', lineHeight: '1.6' }}>Это действие необратимо. <br/> Вы уверены, что хотите удалить этот элемент?</p>
            <button onClick={showDeleteModal ? deleteCategory : confirmDeleteTea} style={{...btnMain, background: '#ff7675'} as any}>ДА, УДАЛИТЬ</button>
            <button onClick={() => {setShowDeleteModal(false); setShowTeaDeleteModal(false);}} style={btnCancel as any}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* ДЕТАЛИ (ШИРОКИЙ ВИД) */}
      {selectedTea && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, padding: '60px 20px', overflowY: 'auto' } as any}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '40px', cursor: 'pointer', fontWeight: '900', letterSpacing: '2px' }}>← НАЗАД К КОЛЛЕКЦИИ</div>
            <div style={{ background: '#161816', borderRadius: '40px', padding: '60px', border: '1px solid #222', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' } as any}>
              <span style={{ color: '#4CAF50', fontWeight: '900', letterSpacing: '2px' }}>{selectedTea.category.toUpperCase()}</span>
              <h2 style={{ fontSize: '48px', color: '#fff', margin: '20px 0', fontWeight: '900' }}>{selectedTea.name}</h2>
              <div style={{ display: 'inline-flex', gap: '15px', padding: '10px 20px', background: '#0d0f0d', borderRadius: '10px', marginBottom: '40px', border: '1px solid #222' }}>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{selectedTea.info}</span>
                  <span style={{ color: '#333' }}>|</span>
                  <span style={{ color: '#888' }}>{selectedTea.strength}</span>
              </div>
              <p style={{ lineHeight: '2', color: '#bbb', fontSize: '18px' }}>{selectedTea.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// СТИЛИ (ОБНОВЛЕНЫ ДЛЯ ДЕСКТОПА)
const typeBadge = { padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', transition: '0.4s', border: '1px solid transparent' };
const deleteTypeBtn = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff7675', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0d0f0d' };
const inS = { width: '100%', padding: '20px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '16px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 13000 };
const modalContent = { background: '#111', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '500px', border: '1px solid #222' };
const btnMain = { width: '100%', padding: '20px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', letterSpacing: '1px' };
const btnCancel = { width: '100%', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', fontSize: '12px' };
const inputStyle = { width: '100%', padding: '25px', borderRadius: '25px', background: '#161816', border: '1px solid #222', color: '#fff', outline: 'none', fontSize: '18px', transition: '0.3s' };