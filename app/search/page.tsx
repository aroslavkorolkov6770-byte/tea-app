"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800", isDayTea: false },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: false },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки из гор Уи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из почек.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классический юньнаньский чай с золотистыми почками.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай с ароматом костра.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен. Дает легкую бодрость и очищение.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, старое дерево.", desc: "Шен пуэр с выдержкой более 10 лет.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false }
];

export default function SearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>(INITIAL_TEA_DATABASE);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [teaTypes, setTeaTypes] = useState<string[]>(["Зеленый", "Белый", "Улун", "Красный", "Пуэр"]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);

  // Состояния модалок
  const [showTeaForm, setShowTeaForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const fetchData = async () => {
    try {
      const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data && data.length > 0) setTeas(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const savedTypes = localStorage.getItem('tea_types');
    if (savedTypes) setTeaTypes(JSON.parse(savedTypes));
    setIsAdmin(localStorage.getItem('userRole') === 'admin');
    setIsMounted(true);
  }, []);

  const resetTeaForm = () => {
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    setEditingId(null);
  };

  // --- ЛОГИКА ТИПОВ ЧАЯ (КАТЕГОРИЙ) ---
  const handleAddType = () => {
    if (newTypeName && !teaTypes.includes(newTypeName)) {
      const updated = [...teaTypes, newTypeName];
      setTeaTypes(updated);
      localStorage.setItem('tea_types', JSON.stringify(updated));
      setNewTypeName("");
      setShowTypeForm(false);
    }
  };

  const handleDeleteType = () => {
    const updated = teaTypes.filter(t => t !== typeToDelete);
    setTeaTypes(updated);
    localStorage.setItem('tea_types', JSON.stringify(updated));
    setShowDeleteModal(false);
    if (activeCategory === typeToDelete) setActiveCategory("Все");
  };

  // --- ЛОГИКА ЧАЯ ---
  const handleSaveTea = async () => {
    if (formData.isDayTea) await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    if (editingId) await supabase.from('teas').update(formData).eq('id', editingId);
    else await supabase.from('teas').insert([formData]);
    setShowTeaForm(false); resetTeaForm(); fetchData();
  };

  const toggleDayTea = async (e: React.MouseEvent, tea: Tea) => {
    e.stopPropagation();
    await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    await supabase.from('teas').update({ isDayTea: !tea.isDayTea }).eq('id', tea.id);
    fetchData();
  };

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

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px', display: 'grid', gridTemplateColumns: isAdmin ? '1fr 300px' : '1fr', gap: '40px', alignItems: 'start' } as any}>
        <section>
          {/* ЧАЙ ДНЯ */}
          {teas.find(t => t.isDayTea) && activeCategory === "Все" && !search && (
            <div onClick={() => setSelectedTea(teas.find(t => t.isDayTea)!)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '30px', borderRadius: '35px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '35px' } as any}>
              <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
              <h2 style={{ fontSize: '28px', margin: '10px 0' }}>{teas.find(t => t.isDayTea)?.name}</h2>
              <p style={{ color: '#aaa', fontSize: '14px' }}>{teas.find(t => t.isDayTea)?.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск сорта..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          
          {/* КАТЕГОРИИ */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', alignItems: 'center' } as any}>
            <div onClick={() => {setActiveCategory("Все"); setActiveStrength("Все");}} style={{ ...typeBadge, backgroundColor: activeCategory === "Все" ? '#4CAF50' : '#161816', color: activeCategory === "Все" ? '#000' : '#fff' } as any}>Все</div>
            {teaTypes.map(type => (
              <div key={type} style={{ position: 'relative' }}>
                <div onClick={() => {setActiveCategory(type); setActiveStrength("Все");}} style={{ ...typeBadge, backgroundColor: activeCategory === type ? '#4CAF50' : '#161816', color: activeCategory === type ? '#000' : '#fff' } as any}>{type}</div>
                {isAdmin && <span onClick={(e) => { e.stopPropagation(); setTypeToDelete(type); setShowDeleteModal(true); }} style={deleteTypeBtn as any}>✕</span>}
              </div>
            ))}
            {isAdmin && <div onClick={() => setShowTypeForm(true)} style={{ ...typeBadge, border: '1px dashed #4CAF50', color: '#4CAF50' } as any}>+</div>}
          </div>

          {/* ХАРАКТЕР */}
          {activeCategory !== "Все" && (
            <div style={{ background: '#121412', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '25px', display: 'flex', gap: '10px' } as any}>
                {STRENGTHS.map(str => (
                  <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredTeas.map(tea => (
              <div key={tea.id} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                  <h3 style={{ margin: 0 }}>{tea.name}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span onClick={(e) => toggleDayTea(e, tea)} style={{ cursor: 'pointer', fontSize: '20px', color: tea.isDayTea ? '#4CAF50' : '#333' }}>⭐</span>
                    <span onClick={() => { setEditingId(tea.id); setFormData(tea); setShowTeaForm(true); }} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</span>
                    <span onClick={async () => { if(confirm("Удалить?")) { await supabase.from('teas').delete().eq('id', tea.id); fetchData(); } }} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222' } as any}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#4CAF50' }}>МАСТЕР-ПАНЕЛЬ</h3>
              <button onClick={() => { resetTeaForm(); setShowTeaForm(true); }} style={btnMain}>+ ДОБАВИТЬ ЧАЙ</button>
            </div>
          </aside>
        )}

        {/* МОДАЛКА: НОВЫЙ ТИП (ИСПРАВЛЕНО) */}
        {showTypeForm && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Новый тип чая</h2>
              <input style={inS} value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Название..." />
              <button onClick={handleAddType} style={btnMain}>СОХРАНИТЬ</button>
              <button onClick={() => setShowTypeForm(false)} style={btnCancel}>Отмена</button>
            </div>
          </div>
        )}

        {/* МОДАЛКА: УДАЛЕНИЕ ТИПА */}
        {showDeleteModal && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Удалить категорию?</h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Вы уверены, что хотите удалить "{typeToDelete}"?</p>
              <button onClick={handleDeleteType} style={{...btnMain, background: '#ff7675'}}>ДА, УДАЛИТЬ</button>
              <button onClick={() => setShowDeleteModal(false)} style={btnCancel}>ОТМЕНА</button>
            </div>
          </div>
        )}

        {/* МОДАЛКА: ДОБАВЛЕНИЕ ЧАЯ */}
        {showTeaForm && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{editingId ? 'Редактировать' : 'Новый чай'}</h2>
              <input style={inS} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}>
                <select style={inS} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>{teaTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select style={inS} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>{["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <textarea style={{...inS, height: '100px'}} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{display:'flex', gap:'10px', marginBottom:'20px'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
              <button onClick={handleSaveTea} style={btnMain}>СОХРАНИТЬ</button>
              <button onClick={() => setShowTeaForm(false)} style={btnCancel}>Отмена</button>
            </div>
          </div>
        )}

        {/* ДЕТАЛИ */}
        {selectedTea && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, padding: '40px 20px', overflowY: 'auto' } as any}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }}>← Назад</div>
              <h2 style={{ fontSize: '32px', color: '#4CAF50' }}>{selectedTea.name}</h2>
              <p style={{ lineHeight: '1.6', color: '#bbb' }}>{selectedTea.desc}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// СТИЛИ
const typeBadge: React.CSSProperties = { padding: '10px 24px', borderRadius: '25px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', transition: '0.2s' };
const deleteTypeBtn: React.CSSProperties = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff7675', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0d0f0d' };
const inS = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' } as any;
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContent = { background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', border: '1px solid #333' };
const btnMain = { width: '100%', padding: '15px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' };
const btnCancel = { width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any;