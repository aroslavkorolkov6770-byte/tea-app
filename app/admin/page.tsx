"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient'; // ПУТЬ: выйти из admin в app

export default function AdminPage() {
  const [teas, setTeas] = useState<any[]>([]);
  const fetchTeas = async () => {
    const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
    if (data) setTeas(data);
  };
  useEffect(() => { fetchTeas(); }, []);
  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px' } as any}>
        <h1>Админ-панель</h1>
        <div style={{ display: 'grid', gap: '10px', marginTop: '30px' }}>
          {teas.map(t => (
            <div key={t.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' } as any}>
              {t.name}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}