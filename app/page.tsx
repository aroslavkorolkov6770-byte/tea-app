"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [dayTea, setDayTea] = useState<any>(null);

  useEffect(() => {
    const fetchDayTea = async () => {
      try {
        const { data } = await supabase.from('teas').select('*').eq('isDayTea', true).maybeSingle();
        if (data) setDayTea(data);
      } catch (err) { console.log(err); }
    };
    fetchDayTea();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative', overflowX: 'hidden' } as any}>
      <Navigation />
      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '150px' } as any}>
        <section style={{ height: '90vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' } as any}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' } as any} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase' } as any}>Tea Master <span style={{ color: '#4CAF50' }}>Store</span></h1>
            <p style={{ color: '#aaa', letterSpacing: '4px', fontSize: '12px', marginTop: '15px' }}>Искусство в каждой капле</p>
          </div>
        </section>
        {dayTea && (
          <section style={{ padding: '0 25px', marginBottom: '60px' } as any}>
             <div style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '40px', borderRadius: '40px', border: '1px solid #4CAF50' } as any}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                <h3 style={{ fontSize: '36px', color: '#fff', margin: '15px 0' }}>{dayTea.name}</h3>
                <p style={{ color: '#aaa' }}>{dayTea.summary}</p>
             </div>
          </section>
        )}
      </main>
    </div>
  );
}