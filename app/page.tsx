"use client";
import React from 'react';
import Navigation from './components/Navigation';

export default function Home() {
  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative' }}>
      
      {/* ПОДКЛЮЧАЕМ МЕНЮ */}
      <Navigation />

      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' }}>
        
        {/* HERO SECTION */}
        <section style={heroSectionStyle}>
          <div style={heroImageOverlay} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-2px' }}>Tea Master Store</h1>
            <p style={{ color: '#aaa', letterSpacing: '2px', fontSize: '14px', marginTop: '10px' }}>HUB СОТРУДНИКА</p>
            <div style={{marginTop: '20px', fontSize: '24px', color: '#4CAF50', animation: 'bounce 2s infinite'}}>↓</div>
          </div>
        </section>

        {/* INFO SECTION */}
        <section style={{ padding: '40px 25px', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '28px', color: '#4CAF50', marginBottom: '15px', fontWeight: '800' }}>О пространстве</h2>
          <p style={{ lineHeight: '1.8', color: '#999', fontSize: '16px', marginBottom: '30px' }}>
            Наша чайная — это место, где время замедляется. Мы верим, что правильно заваренный лист может изменить настроение целого дня. 
            Здесь собраны знания для мастеров, чтобы каждый гость получил не просто напиток, а опыт.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ borderRadius: '24px', height: '180px', backgroundImage: 'url("https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=500")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ borderRadius: '24px', height: '180px', backgroundImage: 'url("https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=500")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-10px);} 60% {transform: translateY(-5px);} }
        body { margin: 0; background: #0d0f0d; }
      `}</style>
    </div>
  );
}

const heroSectionStyle = { height: '70vh', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const heroImageOverlay = { 
  position: 'absolute' as const, 
  top: 0, left: 0, width: '100%', height: '100%', 
  backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', 
  backgroundSize: 'cover', 
  backgroundPosition: 'center', 
  filter: 'brightness(0.3)',
  zIndex: 1
};