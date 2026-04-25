"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const [teas, setTeas] = useState<any[]>([]);
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
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' } as any}>
          <h1>Админ-панель ⚙️</h1>
          <div onClick={() => { resetForm(); setShowForm(true); }} style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' } as any}>+ Добавить</div>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' } as any}>
              <div><strong>{tea.name}</strong> {tea.isDayTea && '⭐'}</div>
              <div>
                <span onClick={() => { setEditingId(tea.id); setFormData(tea); setShowForm(true); }} style={{cursor: 'pointer', marginRight: '15px'}}>✎</span>
                <span onClick={() => deleteTea(tea.id)} style={{cursor: 'pointer', color: '#ff5252'}}>✕</span>
              </div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '400px' } as any}>
              <input style={inStyle} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <button onClick={saveTea} style={{ background: '#4CAF50', color: '#000', padding: '15px', borderRadius: '15px', width: '100%', border: 'none', fontWeight: 'bold' }}>СОХРАНИТЬ</button>
              <p onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#555' }}>Отмена</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
const inStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px' } as any;