"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { supabase } from '../lib/supabaseClient';

interface Tea { id: number; name: string; type: string; category: string; strength: string; info: string; summary: string; desc: string; img: string; isDayTea?: boolean; }

export default function Home() {
  const [dayTea, setDayTea] = useState<Tea | null>(null);

  useEffect(() => {
    const fetchDayTea = async () => {
      try {
        const { data } = await supabase.from('teas').select('*').eq('isDayTea', true).maybeSingle();
        if (data) setDayTea(data);
      } catch (err) { console.error(err); }
    };
    fetchDayTea();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative', overflowX: 'hidden' } as any}>
      <Navigation />
      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '150px' } as any}>
        <section style={{ height: '90vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', filter: 'brightness(0.3)' } as any} />
          <h1 style={{ position: 'relative', fontSize: '48px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' } as any}>Tea Master <span style={{ color: '#4CAF50' }}>Store</span></h1>
        </section>
        {dayTea && (
          <section style={{ padding: '0 25px' } as any}>
             <div style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '40px', borderRadius: '40px', border: '1px solid #4CAF50' } as any}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                <h3 style={{ fontSize: '32px', margin: '10px 0' }}>{dayTea.name}</h3>
                <p style={{ color: '#aaa', fontSize: '18px' }}>{dayTea.summary}</p>
             </div>
          </section>
        )}
      </main>
    </div>
  );
}