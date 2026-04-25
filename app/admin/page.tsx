"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
// ПУТЬ ИСПРАВЛЕН: Выходим из admin и заходим в lib внутри app
import { supabase } from '../lib/supabaseClient';

interface Tea { id: number; name: string; type: string; category: string; strength: string; info: string; summary: string; desc: string; img: string; isDayTea?: boolean; }

export default function AdminPage() {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });

  const fetchTeas = async () => {
    const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
    if (data) setTeas(data);
  };

  useEffect(() => { fetchTeas(); }, []);

  const saveTea = async () => {
    if (editingId) { await supabase.from('teas').update(formData).eq('id', editingId); }
    else { await supabase.from('teas').insert([formData]); }
    setShowForm(false); resetForm(); fetchTeas();
  };

  const deleteTea = async (id: number) => {
    if (confirm("Удалить?")) { await supabase.from('teas').delete().eq('id', id); fetchTeas(); }
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
        <div style={{ display: 'grid', gap: '12px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' } as any}>
              <div><strong>{tea.name}</strong> {tea.isDayTea && '⭐'}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div onClick={() => { setEditingId(tea.id); setFormData(tea); setShowForm(true); }} style={{ cursor: 'pointer' }}>✎</div>
                <div onClick={() => deleteTea(tea.id)} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</div>
              </div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', width: '100%', maxWidth: '450px' } as any}>
              <input style={inStyle} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div onClick={saveTea} style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' } as any}>СОХРАНИТЬ</div>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#555' }}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
const inStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px' } as any;