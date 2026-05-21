"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { useRouter } from 'next/navigation';

// --- ХЕЛПЕР ДЛЯ ЧТЕНИЯ COOKIES ---
const getAppCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const raw = parts.pop()?.split(';').shift();
        return raw ? decodeURIComponent(raw) : null;
    }
    return null;
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cookieAuth = getAppCookie('isLoggedIn');
    const localAuth = localStorage.getItem('isLoggedIn');
    const isLoggedIn = cookieAuth === 'true' || localAuth === 'true';

    const cookieRole = getAppCookie('userRole');
    const localRole = localStorage.getItem('userRole');
    const role = cookieRole || localRole;

    if (isLoggedIn) {
        if (role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/tasks?tab=welcome');
        }
    } else {
        setIsCheckingAuth(false);
        setIsMounted(true);
    }
  }, [router]);

  if (isCheckingAuth || !isMounted) {
      return <div style={{ minHeight: '100vh', backgroundColor: '#000' }} />;
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      
      {/* 1. ФОНОВОЕ ФОТО */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://u.9111s.ru/uploads/202402/17/a0254a12ef37da5aaf5c5646a30baab8.webp")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -2,
        backgroundColor: '#000'
      }} />
      
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)', zIndex: -1 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />

        <main className="home-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '160px 20px 80px 20px', flex: 1 }}>
          <section style={{ textAlign: 'center', marginBottom: '100px', animation: 'fadeInUp 1s ease' }}>
            <div className="home-badge" style={badgeStyle}>E-learning Master Platform</div>
            <h1 style={heroTitleStyle}>TEA <span style={{ color: '#0ABAB5' }}>HUB</span></h1>
            <p style={heroSubTitleStyle}>Профессиональная среда для обучения и развития. <br/> Ваш путь от новичка до эксперта начинается здесь.</p>
          </section>

          <section className="home-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '100px' }}>
              {[
                  { title: 'База знаний', desc: 'Более 50 уроков по ботанике, географии и химии чайного листа.' },
                  { title: 'Техника пролива', desc: 'Пошаговые инструкции работы с профессиональной посудой.' },
                  { title: 'Стандарты сервиса', desc: 'Скрипты общения и правила гостеприимства нашего бренда.' }
              ].map((box, i) => (
                  <div key={i} style={infoBoxStyle}>
                      <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0', color: '#fff' }}>{box.title}</h3>
                      <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '15px', margin: 0 }}>{box.desc}</p>
                  </div>
              ))}
          </section>
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        
        body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            overflow-x: hidden; 
            overflow-y: auto !important;
            width: 100vw;
        }

        * { box-sizing: border-box; }

        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

        @media (max-width: 768px) {
            .home-main { padding: 120px 15px 50px 15px !important; }
            .home-features { grid-template-columns: 1fr !important; gap: 15px !important; }
            .home-badge { white-space: normal !important; height: auto !important; line-height: 1.5 !important; }
        }
      `}</style>
    </div>
  );
}

// --- СТИЛИ ---
const heroTitleStyle = { fontSize: 'calc(32px + 4vw)', fontWeight: '900', color: '#fff', margin: '20px 0', lineHeight: '1', letterSpacing: '-2px' };
const heroSubTitleStyle = { color: '#aaa', fontSize: '19px', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' };
const badgeStyle = { display: 'inline-block', background: 'rgba(255,255,255,0.05)', color: '#0ABAB5', padding: '8px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' as any, letterSpacing: '1.5px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', marginBottom: '20px' };
const infoBoxStyle = { background: 'rgba(20,20,20,0.6)', padding: '50px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)', textAlign: 'center' as any, transition: '0.3s ease' };