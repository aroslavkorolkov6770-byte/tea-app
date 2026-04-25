"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

export default function ShiftPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('tasks').select('*').order('id', { ascending: true });
      if (data) setTasks(data);
    };
    fetchData();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <h2 style={{ fontSize: '28px' }}>Рабочая смена 📋</h2>
        <div style={{ display: 'grid', gap: '10px', marginTop: '30px' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ background: '#161816', padding: '20px', borderRadius: '18px', border: '1px solid #222' } as any}>
              {t.text}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}