"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

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

// --- ПОЛНАЯ БАЗА (15 СОРТОВ) ДЛЯ СТАРТА ---
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
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классический юньнаньский чай.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Шен пуэр с выдержкой более 10 лет.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false }
];

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', 
    info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  // Загрузка из памяти браузера
  useEffect(() => {
    const saved = localStorage.getItem('local_tea_db');
    if (saved) setTeas(JSON.parse(saved));
    else {
      setTeas(INITIAL_TEA_DATABASE);
      localStorage.setItem('local_tea_db', JSON.stringify(INITIAL_TEA_DATABASE));
    }
    setIsMounted(true);
  }, []);

  const saveToLocal = (newList: Tea[]) => {
    setTeas(newList);
    localStorage.setItem('local_tea_db', JSON.stringify(newList));
  };

  // --- УПРАВЛЕНИЕ "ЧАЕМ ДНЯ" (ЗВЕЗДА) ---
  const toggleDayTea = (id: number) => {
    const newList = teas.map(t => ({
      ...t,
      isDayTea: t.id === id ? !t.isDayTea : false // Только один чай может быть "днем"
    }));
    saveToLocal(newList);
  };

  // --- СОХРАНЕНИЕ / РЕДАКТИРОВАНИЕ ---
  const handleSave = () => {
    let newList = [...teas];
    
    if (formData.isDayTea) {
      newList = newList.map(t => ({ ...t, isDayTea: false }));
    }

    if (editingId) {
      // Редактируем существующий
      newList = newList.map(t => t.id === editingId ? { ...formData, id: editingId } : t);
    } else {
      // Добавляем новый
      const newTea = { ...formData, id: Date.now() };
      newList.push(newTea);
    }

    saveToLocal(newList);
    setShowForm(false);
    resetForm();
  };

  const deleteTea = (id: number) => {
    if (confirm("Удалить этот чай?")) {
      saveToLocal(teas.filter(t => t.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    setEditingId(null);
  };

  const startEdit = (tea: Tea) => {
    setEditingId(tea.id);
    setFormData(tea);
    setShowForm(true);
  };

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 25px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' } as any}>
        
        {/* ЛЕВАЯ ЧАСТЬ: СПИСОК ЧАЕВ */}
        <section>
          <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Управление базой ⚙️</h1>
          <div style={{ display: 'grid', gap: '12px' }}>
            {teas.map(tea => (
              <div key={tea.id} style={adminTeaCardStyle as any}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{tea.name}</span>
                    {tea.isDayTea && <span style={{ color: '#4CAF50', fontSize: '10px', fontWeight: 'bold' }}>[ЧАЙ ДНЯ]</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{tea.type} | {tea.strength}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {/* РАБОЧАЯ ЗВЕЗДА */}
                  <div 
                    onClick={() => toggleDayTea(tea.id)} 
                    style={{ fontSize: '22px', cursor: 'pointer', color: tea.isDayTea ? '#4CAF50' : '#222', transition: '0.2s' }}
                  >⭐</div>
                  
                  <div onClick={() => startEdit(tea)} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</div>
                  <div onClick={() => deleteTea(tea.id)} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ПРАВАЯ ЧАСТЬ: МАСТЕР-ПАНЕЛЬ */}
        <aside style={{ position: 'sticky', top: '120px' }}>
            <div style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' } as any}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4CAF50', letterSpacing: '1px' }}>МАСТЕР-ПАНЕЛЬ</h3>
                <div 
                    onClick={() => { resetForm(); setShowForm(true); }}
                    style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' } as any}
                >+ ДОБАВИТЬ ЧАЙ</div>
                <p style={{ fontSize: '11px', color: '#444', marginTop: '20px', lineHeight: '1.6' }}>Нажмите кнопку выше для быстрого добавления нового сорта в локальную базу.</p>
            </div>
        </aside>

        {/* МОДАЛЬНОЕ ОКНО (ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ) */}
        {showForm && (
          <div style={modalOverlayStyle as any}>
            <div style={modalContentStyle as any}>
              <h2 style={{ marginBottom: '25px', textAlign: 'center' }}>{editingId ? 'Редактировать' : 'Новый чай'}</h2>
              
              <input style={inputStyle as any} placeholder="Название чая" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select style={inputStyle as any} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select style={inputStyle as any} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>
                  {["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <input style={inputStyle as any} placeholder="Категория (напр. Шен Пуэр)" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              <input style={inputStyle as any} placeholder="Температура (напр. 95°C)" value={formData.info} onChange={e => setFormData({...formData, info: e.target.value})} />
              <textarea style={{ ...inputStyle, height: '100px' } as any} placeholder="Полное описание истории и вкуса" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 25px 0', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} />
                Установить как Чай Дня ⭐
              </label>

              <div onClick={handleSave} style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' } as any}>
                СОХРАНИТЬ В ПАМЯТЬ
              </div>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#555' }}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// СТИЛИ
const adminTeaCardStyle = { background: '#161816', padding: '20px 25px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContentStyle = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '450px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' };
const inputStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '14px' };