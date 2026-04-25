"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { supabase } from './supabaseClient'; // ПУТЬ: в этой же папке

export default function Home() {
  const [dayTea, setDayTea] = useState<any>(null);
  useEffect(() => {
    const fetchDayTea = async () => {
      const { data } = await supabase.from('teas').select('*').eq('isDayTea', true).maybeSingle();
      if (data) setDayTea(data);
    };
    fetchDayTea();
  }, []);
  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '150px 20px' } as any}>
        <h1 style={{textAlign: 'center', fontSize: '48px'}}>Tea Master Store</h1>
        {dayTea && <div style={{background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #4CAF50', marginTop: '40px'} as any}>
          <h2>{dayTea.name}</h2><p>{dayTea.summary}</p>
        </div>}
      </main>
    </div>
  );
}