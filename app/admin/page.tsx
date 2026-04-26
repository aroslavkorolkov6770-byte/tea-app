"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

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
  isDayTea?: boolean;
}

export default function AdminPage() {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Поля формы
  const [formData, setFormData] = useState({
    name: '', 
    type: 'Зеленый', 
    category: '', 
    strength: 'Мягкий', 
    info: '90°C', 
    summary: '', 
    desc: '', 
    img: '', 
    isDayTea: false
  });

  // Загрузка базы из Supabase
  const fetchTeas = async () => {
    try {
      const { data, error } = await supabase
        .from('teas')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) {
        console.error("Ошибка загрузки:", error.message);
      } else if (data) {
        setTeas(data);
      }
    } catch (err) {
      console.error("Системная ошибка:", err);
    }
  };

  useEffect(() => {
    fetchTeas();
  }, []);

  // Функция сохранения в облако
  const saveTea = async () => {
    try {
      if (editingId) {
        // Редактирование существующего
        const { error } = await supabase
          .from('teas')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // Создание нового
        const { error } = await supabase
          .from('teas')
          .insert([formData]);
        if (error) throw error;
      }
      
      setShowForm(false);
      resetForm();
      fetchTeas(); // Обновляем список из базы
    } catch (err: any) {
      alert("Ошибка сохранения: " + err.message);
    }
  };

  // Удаление из облака
  const deleteTea = async (id: number) => {
    if (confirm("Удалить этот сорт чая?")) {
      try {
        const { error } = await supabase
          .from('teas')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchTeas();
      } catch (err: any) {
        alert("Ошибка удаления: " + err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
        name: '', type: 'Зеленый', category: '', strength: 'Мягкий', 
        info: '90°C', summary: '', desc: '', img: '', isDayTea: false 
    });
    setEditingId(null);
  };

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' } as any}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Админ-панель ⚙️</h1>
          <div 
            onClick={() => { resetForm(); setShowForm(true); }} 
            style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' } as any}
          >
            + Добавить чай
          </div>
        </div>

        {/* СТАТИСТИКА */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '40px' } as any}>
          <div style={statCardStyle as any}>
            <div style={statLabelStyle as any}>ВСЕГО СОРТОВ</div>
            <div style={statValueStyle as any}>{teas.length}</div>
          </div>
          <div style={statCardStyle as any}>
            <div style={statLabelStyle as any}>ПУЭРЫ</div>
            <div style={statValueStyle as any}>{teas.filter(t => t.type === 'Пуэр').length}</div>
          </div>
          <div style={statCardStyle as any}>
            <div style={statLabelStyle as any}>УЛУНЫ</div>
            <div style={statValueStyle as any}>{teas.filter(t => t.type === 'Улун').length}</div>
          </div>
        </div>

        {/* СПИСОК ЧАЕВ ДЛЯ УПРАВЛЕНИЯ */}
        <div style={{ display: 'grid', gap: '12px' } as any}>
          {teas.map(tea => (
            <div key={tea.id} style={adminTeaCardStyle as any}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{tea.name}</span>
                  {tea.isDayTea && <span style={{ background: '#4CAF50', color: '#000', fontSize: '10px', padding: '2px 6px', borderRadius: '5px', fontWeight: 'bold' }}>ЧАЙ ДНЯ ⭐</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{tea.type} | {tea.strength} | {tea.category}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div 
                  onClick={() => { setEditingId(tea.id); setFormData(tea as any); setShowForm(true); }} 
                  style={{ background: '#222', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#fff' } as any}
                >✎</div>
                <div 
                  onClick={() => deleteTea(tea.id)} 
                  style={{ background: '#222', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#ff5252' } as any}
                >✕</div>
              </div>
            </div>
          ))}
        </div>

        {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ */}
        {showForm && (
          <div style={modalOverlayStyle as any}>
            <div style={modalContentStyle as any}>
              <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{editingId ? 'Редактировать чай' : 'Новый сорт'}</h2>
              
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
              <input style={inputStyle as any} placeholder="Краткое описание (нотки)" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
              <textarea style={{ ...inputStyle, height: '100px' } as any} placeholder="Полное описание истории и вкуса" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <input style={inputStyle as any} placeholder="Ссылка на фото (URL)" value={formData.img} onChange={e => setFormData({...formData, img: e.target.value})} />
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 25px 0', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} />
                Установить как Чай Дня ⭐
              </label>

              <div 
                onClick={saveTea} 
                style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' } as any}
              >
                СОХРАНИТЬ В ОБЛАКО
              </div>
              
              <div 
                onClick={() => setShowForm(false)} 
                style={{ textAlign: 'center', color: '#555', marginTop: '15px', cursor: 'pointer', fontSize: '14px' }}
              >
                Отмена
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const statCardStyle = { background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' };
const statLabelStyle = { fontSize: '10px', color: '#555', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' };
const statValueStyle = { fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' };
const adminTeaCardStyle = { background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContentStyle = { background: '#161816', padding: '40px', borderRadius: '35px', width: '100%', maxWidth: '450px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' };
const inputStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '14px' };