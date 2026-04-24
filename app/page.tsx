"use client";
import React from 'react';
import Navigation from './components/Navigation';

export default function Home() {
  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative' }}>
      
      <Navigation />

      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' }}>
        <section style={{ height: '80vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' }} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', margin: 0 }}>Tea Master Store</h1>
            <p style={{ color: '#aaa', letterSpacing: '2px', fontSize: '14px', marginTop: '10px' }}>HUB СОТРУДНИКА</p>
          </div>
        </section>
      </main>
    </div>
  );
}