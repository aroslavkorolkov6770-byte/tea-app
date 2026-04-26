"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800", isDayTea: false },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: false },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из почек.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классика Юньнани.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Выдержанный шен.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false }
];

export default function SearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  
  // Динамические категории
  const [teaTypes, setTeaTypes] = useState<string[]>(["Зеленый", "Белый", "Улун", "Красный", "Пуэр"]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  useEffect(() => {
    const savedTeas = localStorage.getItem('tea_master_db');
    const savedTypes = localStorage.getItem('tea_types');
    const userRole = localStorage.getItem('userRole');

    if (savedTeas) setTeas(JSON.parse(savedTeas));
    else setTeas(INITIAL_TEA_DATABASE);

    if (savedTypes) setTeaTypes(JSON.parse(savedTypes));
    
    if (userRole === 'admin') setIsAdmin(true);
    setIsMounted(true);
  }, []);

  const updateTeas = (newList: Tea[]) => {
    setTeas(newList);
    localStorage.setItem('tea_master_db', JSON.stringify(newList));
  };

  const addTeaType = () => {
    const newType = prompt("Введите название нового типа чая:");
    if (newType && !teaTypes.includes(newType)) {
      const updatedTypes = [...teaTypes, newType];
      setTeaTypes(updatedTypes);
      localStorage.setItem('tea_types', JSON.stringify(updatedTypes));
    }
  };

  const deleteTeaType = (typeToDelete: string) => {
    if (confirm(`Удалить категорию "${typeToDelete}"?`)) {
      const updatedTypes = teaTypes.filter(t => t !== typeToDelete);
      setTeaTypes(updatedTypes);
      localStorage.setItem('tea_types', JSON.stringify(updatedTypes));
    }
  };

  const handleSaveNewTea = () => {
    let newList = [...teas];
    if (formData.isDayTea) newList = newList.map(t => ({ ...t, isDayTea: false }));
    const newEntry = { ...formData, id: Date.now() } as Tea;
    newList.push(newEntry);
    updateTeas(newList);
    setShowForm(false);
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
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
        
        <section>
          {dayTea && !search && activeCategory === "Все" && (
            <div onClick={() => setSelectedTea(dayTea)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '30px', borderRadius: '25px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '40px' } as any}>
              <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>⭐ ЧАЙ ДНЯ</div>
              <h2 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>{dayTea.name}</h2>
              <p style={{ color: '#aaa', fontSize: '14px' }}>{dayTea.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск сорта..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any} />
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', alignItems: 'center' } as any}>
            <div onClick={() => setActiveCategory("Все")} style={{ ...typeBadge, backgroundColor: activeCategory === "Все" ? '#4CAF50' : '#161816', color: activeCategory === "Все" ? '#000' : '#fff' } as any}>Все</div>
            
            {teaTypes.map(type => (
              <div key={type} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div onClick={() => setActiveCategory(type)} style={{ ...typeBadge, backgroundColor: activeCategory === type ? '#4CAF50' : '#161816', color: activeCategory === type ? '#000' : '#fff' } as any}>
                  {type}
                </div>
                {isAdmin && (
                  <span onClick={() => deleteTeaType(type)} style={deleteTypeBtn as any}>✕</span>
                )}
              </div>
            ))}

            {isAdmin && (
              <div onClick={addTeaType} style={{ ...typeBadge, border: '1px dashed #4CAF50', color: '#4CAF50', background: 'none' } as any}>+</div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '12px', marginTop: '30px' }}>
            {filteredTeas.map(tea => (
              <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <div onClick={() => setSelectedTea(tea)} style={{ flex: 1, cursor: 'pointer' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{tea.name}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                </div>
                {isAdmin ? (
                  <div onClick={() => {if(confirm("Удалить чай?")) updateTeas(teas.filter(t => t.id !== tea.id))}} style={{color:'#ff7675', cursor:'pointer', padding:'10px'}}>✕</div>
                ) : (
                  <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px' }}>{tea.strength}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222' } as any}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#4CAF50' }}>МАСТЕР-ПАНЕЛЬ</h3>
              <button onClick={() => setShowForm(true)} style={{ width: '100%', background: '#4CAF50', color: '#000', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>+ Добавить чай</button>
              <p style={{ fontSize: '11px', color: '#444', textAlign: 'center', marginTop: '15px' }}>Вы вошли как администратор. Все изменения сохраняются мгновенно.</p>
            </div>
          </aside>
        )}

        {showForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
                <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', border: '1px solid #333' } as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Новый сорт</h2>
                    <input style={inS} placeholder="Название" onChange={e => setFormData({...formData, name: e.target.value})} />
                    <select style={inS} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        {teaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea style={{...inS, height: '100px'}} placeholder="Описание" onChange={e => setFormData({...formData, desc: e.target.value})} />
                    <label style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
                    <div onClick={handleSaveNewTea} style={{ background: '#4CAF50', color: '#000', padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ</div>
                    <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '10px', color: '#555', cursor: 'pointer' }}>Отмена</div>
                </div>
            </div>
        )}

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

// СТИЛИ (С ТИПИЗАЦИЕЙ)
const typeBadge: React.CSSProperties = { padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', transition: '0.3s' };
const deleteTypeBtn: React.CSSProperties = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff7675', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0d0f0d' };
const inS = { width: '100%', padding: '12px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '10px', color: '#fff', marginBottom: '10px', outline: 'none' } as any;