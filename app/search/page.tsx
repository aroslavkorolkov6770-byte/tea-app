"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

export default function SearchPage() {
  const [teas, setTeas] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('teas').select('*');
      if (data) setTeas(data);
    };
    load();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <h1>База чая 🍃</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
          {teas.map(tea => (
            <div key={tea.id} style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' } as any}>
              <h3>{tea.name}</h3>
              <p style={{ color: '#666' }}>{tea.summary}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}