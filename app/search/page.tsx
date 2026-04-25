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

const CATEGORIES = ["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"];

export default function SearchPage() {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('teas').select('*');
        if (data) setTeas(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const mCat = activeCategory === "Все" || t.type === activeCategory;
    return mSearch && mCat;
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        {!selectedTea ? (
          <>
            <input type="text" placeholder="Поиск сорта..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any} />
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px' } as any}>
              {CATEGORIES.map(cat => <div key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '12px 24px', borderRadius: '25px', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816', color: activeCategory === cat ? '#000' : '#fff', fontWeight: 'bold' } as any}>{cat}</div>)}
            </div>
            <div style={{ display: 'grid', gap: '15px' } as any}>
              {filtered.map(tea => (
                <div key={tea.id} onClick={() => setSelectedTea(tea)} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div><h3 style={{ margin: 0, fontSize: '20px' }}>{tea.name}</h3><p style={{ margin: 0, color: '#666' }}>{tea.summary}</p></div>
                  <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>{tea.strength}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div onClick={() => setSelectedTea(null)} style={{ color: '#fff', cursor: 'pointer', marginBottom: '25px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: '#161816', borderRadius: '15px', border: '1px solid #333' } as any}><span>←</span> Назад</div>
            <div style={{ background: '#161816', borderRadius: '35px', overflow: 'hidden', border: '1px solid #222' } as any}>
              <img src={selectedTea.img} style={{ width: '100%', height: '350px', objectFit: 'cover' } as any} />
              <div style={{ padding: '35px' }}>
                <h2 style={{ color: '#4CAF50', margin: '0 0 10px 0', fontSize: '32px' }}>{selectedTea.name}</h2>
                <p style={{ color: '#bbb', lineHeight: '1.8' }}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}