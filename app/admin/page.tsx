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

  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', 
    info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const fetchTeas = async () => {
    try {
      const { data, error } = await supabase
        .from('teas')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      if (data) setTeas(data as Tea[]);
    } catch (err) {
      console.error("Ошибка при получении данных:", err);
    }
  };

  useEffect(() => {
    fetchTeas();
  }, []);

  const startEdit = (tea: Tea) => {
    setEditingId(tea.id);
    setFormData({
      name: tea.name || '',
      type: tea.type || 'Зеленый',
      category: tea.category || '',
      strength: tea.strength || 'Мягкий',
      info: tea.info || '90°C',
      summary: tea.summary || '',
      desc: tea.desc || '',
      img: tea.img || '',
      isDayTea: tea.isDayTea ?? false
    });
    setShowForm(true);
  };

  const saveTea = async () => {
    try {
      if (editingId) {
        await supabase.from('teas').update(formData).eq('id', editingId);
      } else {
        await supabase.from('teas').insert([formData]);
      }
      setShowForm(false);
      setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
      setEditingId(null);
      fetchTeas();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' } as any}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Админ-панель ⚙️</h1>
          <div 
            onClick={() => { setEditingId(null); setShowForm(true); }} 
            style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' } as any}
          >
            + Добавить чай
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{tea.name}</span>
                {tea.isDayTea && <span style={{ color: '#4CAF50', fontSize: '12px', marginLeft: '10px' }}>⭐ Чай Дня</span>}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div onClick={() => startEdit(tea)} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</div>
                <div onClick={async () => { if(confirm("Удалить?")) { await supabase.from('teas').delete().eq('id', tea.id); fetchTeas(); } }} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' } as any}>
              <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{editingId ? 'Редактировать' : 'Новый сорт'}</h2>
              <input style={inS} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <button onClick={saveTea} style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', border: 'none', width: '100%' } as any}>
                СОХРАНИТЬ
              </button>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#555' }}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const inS = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' } as any;