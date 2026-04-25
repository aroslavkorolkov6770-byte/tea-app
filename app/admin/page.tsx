"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabaseClient';

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
  const [formData, setFormData] = useState({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });

  const fetchTeas = async () => {
    try {
      const { data, error } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data) setTeas(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTeas(); }, []);

  const saveTea = async () => {
    try {
      if (editingId) {
        await supabase.from('teas').update(formData).eq('id', editingId);
      } else {
        await supabase.from('teas').insert([formData]);
      }
      setShowForm(false);
      resetForm();
      fetchTeas();
    } catch (err: any) { alert(err.message); }
  };

  const deleteTea = async (id: number) => {
    if (confirm("Удалить этот сорт чая?")) {
      await supabase.from('teas').delete().eq('id', id);
      fetchTeas();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    setEditingId(null);
  };

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' } as any}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Админ-панель ⚙️</h1>
          <div onClick={() => { resetForm(); setShowForm(true); }} style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' } as any}>+ Добавить чай</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '40px' } as any}>
          <div style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' } as any}>
            <div style={{ fontSize: '10px', color: '#555' }}>ВСЕГО СОРТОВ</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{teas.length}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{tea.name}</span>
                <div style={{ fontSize: '12px', color: '#555' }}>{tea.type} | {tea.strength}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div onClick={() => { setEditingId(tea.id); setFormData(tea as any); setShowForm(true); }} style={{ background: '#222', padding: '10px', borderRadius: '10px', cursor: 'pointer' } as any}>✎</div>
                <div onClick={() => deleteTea(tea.id)} style={{ background: '#222', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#ff5252' } as any}>✕</div>
              </div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '100%', maxWidth: '450px', border: '1px solid #333' } as any}>
              <input style={inStyle} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <select style={inStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea style={{ ...inStyle, height: '100px' } as any} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Установить как Чай Дня ⭐</label>
              <div onClick={saveTea} style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' } as any}>СОХРАНИТЬ В ОБЛАКО</div>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', color: '#555', marginTop: '15px', cursor: 'pointer' }}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
const inStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' } as any;