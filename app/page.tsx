"use client";
import React from 'react';
import Navigation from './components/Navigation';

export default function Home() {
  return (
    <div style={{ fontFamily: '-apple-system, system-ui, sans-serif', backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' }}>
      <Navigation />
      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' }}>
        <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <section style={heroSectionStyle}>
            <div style={heroImageOverlay} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', margin: 0 }}>Tea Master Store</h1>
              <p style={{ color: '#888', letterSpacing: '2px', fontSize: '14px', marginTop: '10px' }}>HUB СОТРУДНИКА</p>
              <div style={{marginTop: '20px', fontSize: '20px', color: '#4CAF50'}}>↓</div>
            </div>
          </section>
          <section style={{ padding: '40px 25px' }}>
            <h2 style={{ fontSize: '26px', color: '#4CAF50', marginBottom: '15px' }}>О заведении</h2>
            <p style={{ lineHeight: '1.7', color: '#999', marginBottom: '25px' }}>
              Мы — пространство чайной культуры. Каждая чашка здесь — результат мастерства.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
               <div style={{ borderRadius: '20px', height: '160px', backgroundImage: 'url("https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=500")', backgroundSize: 'cover' }} />
               <div style={{ borderRadius: '20px', height: '160px', backgroundImage: 'url("https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=500")', backgroundSize: 'cover' }} />
            </div>
          </section>
        </div>
      </main>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; padding: 0; background-color: #0d0f0d; overflow-x: hidden; }
      `}</style>
    </div>
  );
}

const heroSectionStyle = { height: '65vh', position: 'relative' as any, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const heroImageOverlay = { position: 'absolute' as any, top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' };