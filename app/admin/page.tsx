"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

export default function AdminPage() {
  const [teas, setTeas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Зеленый', strength: 'Мягкий', desc: '', isDayTea: false });

  const fetchTeas = async () => {
    const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
    if (data) setTeas(data);
  };
  useEffect(() => { fetchTeas(); }, []);

  const saveTea = async () => {
    await supabase.from('teas').insert([formData]);
    setShowForm(false); fetchTeas();
  };

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
          <h1>Админ-панель ⚙️</h1>
          <div onClick={() => setShowForm(true)} style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' } as any}>+ Добавить чай</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '40px 0' } as any}>
            <div style={{ background: '#161816', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '1px solid #222' }}>
                <div style={{ color: '#555', fontSize: '12px' }}>ВСЕГО ЧАЕВ</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{teas.length}</div>
            </div>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' } as any}>
              <span><strong>{tea.name}</strong> {tea.isDayTea && '⭐'}</span>
              <div onClick={async () => { await supabase.from('teas').delete().eq('id', tea.id); fetchTeas(); }} style={{ color: '#ff5252', cursor: 'pointer' }}>✕</div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', width: '350px' } as any}>
              <h2 style={{ marginBottom: '20px' }}>Новый сорт</h2>
              <input style={{ width: '100%', padding: '12px', marginBottom: '10px', background: '#0d0f0d', color: '#fff', border: '1px solid #333', borderRadius: '10px' }} placeholder="Название" onChange={e => setFormData({...formData, name: e.target.value})} />
              <div onClick={saveTea} style={{ background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' } as any}>СОХРАНИТЬ</div>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#555' }}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}