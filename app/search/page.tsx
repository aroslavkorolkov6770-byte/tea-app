"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

const INITIAL_DATABASE: Tea[] = [
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
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классический юньнаньский чай.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Шен пуэр с выдержкой более 10 лет.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
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

  // Состояния модалок
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
    const cachedTeas = localStorage.getItem('tea_master_vfinal_cache');
    const cachedTypes = localStorage.getItem('tea_types_vfinal_cache');
    if (cachedTeas) setTeas(JSON.parse(cachedTeas)); else setTeas(INITIAL_DATABASE);
    if (cachedTypes) setTeaTypes(JSON.parse(cachedTypes));

    try {
      const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setTeas(data);
        localStorage.setItem('tea_master_vfinal_cache', JSON.stringify(data));
      }
    } catch (e) { console.log("Работаем на кэше"); }
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
    let newList = [...teas];
    const newTeaData = { ...formData, id: editingId || Date.now() };

    if (formData.isDayTea) newList = newList.map(t => ({ ...t, isDayTea: false }));
    if (editingId) newList = newList.map(t => t.id === editingId ? newTeaData as Tea : t);
    else newList.push(newTeaData as Tea);

    setTeas(newList);
    localStorage.setItem('tea_master_vfinal_cache', JSON.stringify(newList));
    setShowTeaForm(false);
    
    try {
      if (formData.isDayTea) await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
      if (editingId) await supabase.from('teas').update(formData).eq('id', editingId);
      else await supabase.from('teas').insert([formData]);
    } catch (e) {}
    resetTeaForm();
  };

  const toggleDayTea = async (e: React.MouseEvent, tea: Tea) => {
    e.stopPropagation();
    const newList = teas.map(t => ({ ...t, isDayTea: t.id === tea.id ? !t.isDayTea : false }));
    setTeas(newList);
    localStorage.setItem('tea_master_vfinal_cache', JSON.stringify(newList));
    try {
      await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
      await supabase.from('teas').update({ isDayTea: !tea.isDayTea }).eq('id', tea.id);
    } catch (e) {}
  };

  const confirmDeleteTea = async () => {
    if (teaIdToDelete) {
      const newList = teas.filter(t => t.id !== teaIdToDelete);
      setTeas(newList);
      localStorage.setItem('tea_master_vfinal_cache', JSON.stringify(newList));
      setShowTeaDeleteModal(false);
      try { await supabase.from('teas').delete().eq('id', teaIdToDelete); } catch(e){}
    }
  };

  const handleAddType = () => {
    if (newTypeName && !teaTypes.includes(newTypeName)) {
      const up = [...teaTypes, newTypeName];
      setTeaTypes(up);
      localStorage.setItem('tea_types_vfinal_cache', JSON.stringify(up));
      setNewTypeName(""); setShowTypeForm(false);
    }
  };

  const deleteCategory = () => {
    const up = teaTypes.filter(t => t !== typeToDelete);
    setTeaTypes(up);
    localStorage.setItem('tea_types_vfinal_cache', JSON.stringify(up));
    setShowDeleteModal(false);
  };

  const filteredTeas = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const mCat = activeCategory === "Все" || t.type === activeCategory;
    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mCat && mStr;
  });

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px', display: 'grid', gridTemplateColumns: isAdmin ? '1fr 320px' : '1fr', gap: '40px', alignItems: 'start' } as any}>
        <section>
          {teas.find(t => t.isDayTea) && activeCategory === "Все" && !search && (
            <div onClick={() => setSelectedTea(teas.find(t => t.isDayTea)!)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #0d0f0d 100%)', padding: '50px', borderRadius: '40px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' } as any}>
              <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: '900', letterSpacing: '3px' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
              <h2 style={{ fontSize: '42px', margin: '15px 0', fontWeight: '900' }}>{teas.find(t => t.isDayTea)?.name}</h2>
              <p style={{ color: '#aaa', fontSize: '18px', maxWidth: '600px' }}>{teas.find(t => t.isDayTea)?.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск по коллекции..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle as any} />
          
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '20px', alignItems: 'center' } as any}>
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
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '30px', display: 'flex', gap: '10px' } as any}>
                {STRENGTHS.map(str => (
                  <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' } as any}>
            {filteredTeas.map(tea => (
              <div key={tea.id} onClick={() => setSelectedTea(tea)} style={{ background: '#161816', padding: '30px', borderRadius: '35px', border: '1px solid #222', cursor: 'pointer' } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#4CAF50', letterSpacing: '2px' }}>{tea.type.toUpperCase()}</span>
                    {!isAdmin && <div style={{ fontSize: '10px', color: '#4CAF50' }}>{tea.strength}</div>}
                </div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>{tea.name}</h3>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #222' }}>
                    <div onClick={(e) => toggleDayTea(e, tea)} style={{ color: tea.isDayTea ? '#4CAF50' : '#333', fontSize: '20px' }}>⭐</div>
                    <div onClick={(e:any) => {e.stopPropagation(); setEditingId(tea.id); setFormData(tea); setShowTeaForm(true);}} style={{ color: '#4CAF50' }}>✎</div>
                    <div onClick={(e:any) => {e.stopPropagation(); setTeaIdToDelete(tea.id); setShowTeaDeleteModal(true);}} style={{ color: '#ff7675' }}>✕</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' } as any}>
              <h3 style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '20px', fontWeight: '900' }}>МАСТЕР-ПАНЕЛЬ</h3>
              <div onClick={() => { resetTeaForm(); setShowTeaForm(true); }} style={btnMain as any}>+ ДОБАВИТЬ ЧАЙ</div>
            </div>
          </aside>
        )}

        {/* МОДАЛКИ (УДАЛЕНИЕ / ФОРМЫ) */}
        {(showDeleteModal || showTeaDeleteModal) && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ?</h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>Это действие необратимо.</p>
              <button onClick={showDeleteModal ? deleteCategory : confirmDeleteTea} style={{...btnMain, background: '#ff7675'} as any}>ДА, УДАЛИТЬ</button>
              <button onClick={() => {setShowDeleteModal(false); setShowTeaDeleteModal(false);}} style={btnCancel as any}>ОТМЕНА</button>
            </div>
          </div>
        )}

        {showTypeForm && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>НОВЫЙ ТИП</h2>
              <input style={inS as any} value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Название..." />
              <button onClick={handleAddType} style={btnMain as any}>СОХРАНИТЬ</button>
              <button onClick={() => setShowTypeForm(false)} style={btnCancel as any}>ОТМЕНА</button>
            </div>
          </div>
        )}

        {showTeaForm && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight:'900' }}>{editingId ? 'РЕДАКТИРОВАНИЕ' : 'НОВЫЙ ЧАЙ'}</h2>
              <input style={inS as any} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}>
                <select style={inS as any} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>{teaTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select style={inS as any} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>{["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <textarea style={{...inS, height: '120px'} as any} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{display:'flex', gap:'15px', marginBottom:'30px', cursor:'pointer'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> <span style={{fontWeight:'bold'}}>ЧАЙ ДНЯ ⭐</span></label>
              <button onClick={handleSaveTea} style={btnMain as any}>СОХРАНИТЬ</button>
              <button onClick={() => setShowTeaForm(false)} style={btnCancel as any}>ОТМЕНА</button>
            </div>
          </div>
        )}

        {selectedTea && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, padding: '60px 20px', overflowY: 'auto' } as any}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '40px', cursor: 'pointer', fontWeight: '900' }}>← НАЗАД</div>
              <div style={{ background: '#161816', borderRadius: '40px', padding: '60px', border: '1px solid #222' } as any}>
                <h2 style={{ fontSize: '48px', color: '#fff', margin: '0 0 20px 0', fontWeight: '900' }}>{selectedTea.name}</h2>
                <p style={{ lineHeight: '2', color: '#bbb', fontSize: '18px' }}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// СТИЛИ
const typeBadge = { padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', transition: '0.4s' };
const deleteTypeBtn = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff7675', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0d0f0d' };
const inS = { width: '100%', padding: '20px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 13000 };
const modalContent = { background: '#111', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '500px', border: '1px solid #222' };
const btnMain = { width: '100%', padding: '20px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };
const btnCancel = { width: '100%', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' };
const inputStyle = { width: '100%', padding: '25px', borderRadius: '25px', background: '#161816', border: '1px solid #222', color: '#fff', outline: 'none', fontSize: '18px' };