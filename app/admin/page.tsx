"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '../supabaseClient';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'teas' | 'stats'>('teas');
  const [teas, setTeas] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Зеленый', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });

  const fetchTeas = async () => {
    const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
    if (data) setTeas(data);
    const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact' });
    setCompletedCount(count || 0);
  };

  useEffect(() => { fetchTeas(); }, []);

  const saveTea = async () => {
    if (formData.isDayTea) await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
    await supabase.from('teas').insert([formData]);
    setShowForm(false); fetchTeas();
  };

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{display:'flex', gap:'10px', marginBottom:'40px'}}>
            <button onClick={() => setActiveTab('teas')} style={{flex:1, padding:'15px', borderRadius:'12px', background: activeTab === 'teas' ? '#4CAF50' : '#161816', border:'none', cursor:'pointer'}}>Чай</button>
            <button onClick={() => setActiveTab('stats')} style={{flex:1, padding:'15px', borderRadius:'12px', background: activeTab === 'stats' ? '#4CAF50' : '#161816', border:'none', cursor:'pointer'}}>Статистика</button>
        </div>

        {activeTab === 'teas' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                <h1>Управление ⚙️</h1>
                <button onClick={() => setShowForm(true)} style={{ background: '#4CAF50', color: '#000', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>+ Добавить</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {teas.map(t => (
                <div key={t.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' } as any}>
                  <span><strong>{t.name}</strong> {t.isDayTea && '⭐'}</span>
                  <div onClick={async () => { await supabase.from('teas').delete().eq('id', t.id); fetchTeas(); }} style={{ color: '#ff5252', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{background:'#161816', padding:'40px', borderRadius:'30px', border:'1px solid #222'}}>
            <h2>Мониторинг обучения</h2>
            <div style={{marginTop:'20px'}}>
                <p>Всего пройдено уроков сотрудниками: <strong style={{color:'#4CAF50'}}>{completedCount}</strong></p>
            </div>
          </div>
        )}

        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 } as any}>
            <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', width: '450px', display: 'flex', flexDirection: 'column' } as any}>
              <h2 style={{marginBottom:'20px'}}>Новый сорт</h2>
              <input style={inS} placeholder="Название" onChange={e => setFormData({...formData, name: e.target.value})} />
              <select style={inS} onChange={e => setFormData({...formData, type: e.target.value})}>
                {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select style={inS} onChange={e => setFormData({...formData, strength: e.target.value})}>
                {["Мягкий", "Средний", "Крепкий"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <textarea style={{...inS, height:'80px'}} placeholder="Описание" onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{marginBottom:'20px'}}><input type="checkbox" onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Чай дня ⭐</label>
              <button onClick={saveTea} style={{ padding: '15px', background: '#4CAF50', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>СОХРАНИТЬ</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#666', marginTop: '15px' }}>Отмена</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
const inS = { width: '100%', padding: '12px', marginBottom: '10px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '10px', color: '#fff' } as any;