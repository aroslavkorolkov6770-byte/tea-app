"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SearchPage() {
  const [teas, setTeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('teas').select('*');
      if (data) setTeas(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = teas.filter(tea => tea.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <input type="text" placeholder="Поиск сорта..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any} />
        <div style={{ display: 'grid', gap: '15px' }}>
          {teas.map(tea => (
            <div key={tea.id} onClick={() => setSelectedTea(tea)} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', cursor: 'pointer' } as any}>
              <h3 style={{ margin: 0 }}>{tea.name}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{tea.summary}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}