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
  const [formData, setFormData] = useState({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });

  const fetchTeas = async () => {
    const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
    if (data) setTeas(data);
  };

  useEffect(() => { fetchTeas(); }, []);

  const saveTea = async () => {
    await supabase.from('teas').insert([formData]);
    setShowForm(false);
    fetchTeas();
  };

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' } as any}>
          <h1>Админ-панель ⚙️</h1>
          <div onClick={() => setShowForm(true)} style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' } as any}>+ Добавить</div>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' } as any}>
              <strong>{tea.name}</strong>
              <div onClick={async () => { await supabase.from('teas').delete().eq('id', tea.id); fetchTeas(); }} style={{ color: '#ff5252', cursor: 'pointer' }}>✕</div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', width: '350px' } as any}>
              <input style={{ width: '100%', padding: '12px', marginBottom: '10px', background: '#000', border: '1px solid #333', color: '#fff' }} placeholder="Название" onChange={e => setFormData({...formData, name: e.target.value})} />
              <button onClick={saveTea} style={{ width: '100%', padding: '15px', background: '#4CAF50', borderRadius: '10px', fontWeight: 'bold', border: 'none' }}>СОХРАНИТЬ</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}