"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '@/app/supabaseClient'; 

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

const FALLBACK_TEA = {
  name: "Те Гуань Инь",
  type: "Улун",
  summary: "Классический светлый улун с ароматом весенних цветов. Идеален для глубокого погружения в культуру.",
  info: "85°C",
  isDayTea: true
};

export default function Home() {
  const [dayTea, setDayTea] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchDayTea = async () => {
      try {
        const { data } = await supabase.from('teas').select('*').eq('isDayTea', true).maybeSingle();
        if (data) setDayTea(data);
        else setDayTea(FALLBACK_TEA);
      } catch (err) { setDayTea(FALLBACK_TEA); }
    };
    fetchDayTea();
  }, []);

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />

      {/* 1. HERO SECTION */}
      <section style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400")', 
          backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.2)' 
        } as any} />
        
        <div style={{ position: 'relative', textAlign: 'center', zIndex: 10, maxWidth: '1200px', padding: '0 20px' } as any}>
          <span style={{ color: '#4CAF50', letterSpacing: '4px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px', display: 'block' } as any}>
            Tea Master HUB
          </span>
          <h1 style={{ fontSize: 'calc(40px + 4vw)', fontWeight: '900', color: '#fff', margin: '0 0 20px 0', lineHeight: '0.9', letterSpacing: '-3px' } as any}>
            ИСКУССТВО <br /> <span style={{ color: '#4CAF50' }}>ЧАЙНОЙ ШКОЛЫ</span>
          </h1>
          <p style={{ color: '#888', fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' } as any}>
            Профессиональная платформа для обучения чайных мастеров. От основ культуры до техник пролива.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' } as any}>
             <div style={{ padding: '15px 40px', background: '#4CAF50', color: '#000', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' } as any}>Начать обучение</div>
             <div style={{ padding: '15px 40px', border: '1px solid #333', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' } as any}>База знаний</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '40px', animation: 'bounce 2s infinite', color: '#4CAF50', fontSize: '24px' } as any}>↓</div>
      </section>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px' } as any}>
        
        {/* 2. ПУТЬ МАСТЕРА */}
        <section style={{ marginBottom: '150px' } as any}>
            <div style={{ textAlign: 'center', marginBottom: '80px' } as any}>
                <span style={badgeStyle as any}>Onboarding system</span>
                <h2 style={{ fontSize: '48px', fontWeight: '800', marginTop: '20px' } as any}>ПУТЬ <span style={{ color: '#4CAF50' }}>МАСТЕРА</span></h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' } as any}>
                <div style={stepCard as any}>
                    <span style={stepNumber as any}>01</span>
                    <h3 style={{ fontSize: '24px', marginBottom: '15px' } as any}>Основы культуры</h3>
                    <p style={{ color: '#888', lineHeight: '1.6' } as any}>История чая, география плантаций и философия нашего бренда. Твои первые шаги в HUB.</p>
                </div>
                <div style={stepCard as any}>
                    <span style={stepNumber as any}>02</span>
                    <h3 style={{ fontSize: '24px', marginBottom: '15px' } as any}>Техника пролива</h3>
                    <p style={{ color: '#888', lineHeight: '1.6' } as any}>Мастерство работы с гайванью и исинскими чайниками. Температурные режимы и тайминги.</p>
                </div>
                <div style={stepCard as any}>
                    <span style={stepNumber as any}>03</span>
                    <h3 style={{ fontSize: '24px', marginBottom: '15px' } as any}>Финальная аттестация</h3>
                    <p style={{ color: '#888', lineHeight: '1.6' } as any}>Слепая дегустация и проведение полноценной церемонии. Получение ранга Мастера.</p>
                </div>
            </div>
        </section>

        {/* 3. БЛОК: ЧАЙ ДНЯ */}
        {dayTea && (
          <section style={{ marginBottom: '150px' } as any}>
             <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px', background: '#161816', padding: '60px', borderRadius: '50px', border: '1px solid #222' } as any}>
                <div style={{ flex: '1 1 400px' } as any}>
                    <span style={badgeStyle as any}>Recommendation</span>
                    <h2 style={{ fontSize: '56px', margin: '20px 0', lineHeight: '1' } as any}>ЧАЙ <span style={{ color: '#4CAF50' }}>ДНЯ</span></h2>
                    <h3 style={{ fontSize: '28px', color: '#fff', marginBottom: '20px' } as any}>{dayTea.name}</h3>
                    <p style={{ color: '#aaa', fontSize: '18px', lineHeight: '1.7', marginBottom: '30px' } as any}>{dayTea.summary}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', padding: '12px 25px', background: '#222', borderRadius: '15px', border: '1px solid #333' } as any}>
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' } as any}>{dayTea.info}</span>
                        <span style={{ color: '#444' } as any}>|</span>
                        <span style={{ fontSize: '14px' } as any}>{dayTea.type}</span>
                    </div>
                </div>
                <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' } as any}>
                    <div style={{ width: '300px', height: '400px', background: 'linear-gradient(45deg, #1b3d1d, #0d0f0d)', borderRadius: '30px', border: '1px solid #4CAF50', padding: '30px', position: 'relative' } as any}>
                         <div style={{ width: '50px', height: '50px', background: '#4CAF50', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '24px', fontWeight: 'bold' } as any}>🍵</div>
                         <div style={{ marginTop: '100px', height: '4px', background: '#222', borderRadius: '2px' } as any}><div style={{ width: '70%', height: '100%', background: '#4CAF50' } as any} /></div>
                         <p style={{ fontSize: '12px', color: '#4CAF50', marginTop: '10px' } as any}>ИЗУЧЕНО НА 70%</p>
                         <h4 style={{ position: 'absolute', bottom: '30px', left: '30px', fontSize: '24px' } as any}>{dayTea.name}</h4>
                    </div>
                </div>
             </div>
          </section>
        )}

        {/* 4. ГАЛЕРЕЯ */}
        <section style={{ marginBottom: '100px' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' } as any}>
                <h2 style={{ fontSize: '48px', fontWeight: '800' } as any}>ЭСТЕТИКА <br /> <span style={{ color: '#4CAF50' }}>TMS</span></h2>
                <p style={{ color: '#666', maxWidth: '400px', textAlign: 'right' } as any}>Визуальное погружение в пространство Tea Master Store через детали и ритуалы.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '250px', gap: '20px' } as any}>
                <div style={{ ...galleryItem, gridColumn: 'span 2', gridRow: 'span 2', backgroundImage: 'url("https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800")' } as any}></div>
                <div style={{ ...galleryItem, gridColumn: 'span 2', backgroundImage: 'url("https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800")' } as any}></div>
                <div style={{ ...galleryItem, backgroundImage: 'url("https://images.unsplash.com/photo-1571934811356-5cc561b6821f?q=80&w=600")' } as any}></div>
                <div style={{ ...galleryItem, backgroundImage: 'url("https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600")' } as any}></div>
            </div>
        </section>

        {/* 5. ФУТЕР */}
        <footer style={{ borderTop: '1px solid #1a1a1a', paddingTop: '60px', textAlign: 'center' } as any}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' } as any}>TEA MASTER STORE</h2>
          <p style={{ color: '#444', fontSize: '14px', letterSpacing: '2px' } as any}>HUB СОТРУДНИКА | EST 2024</p>
        </footer>

      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;800;900&display=swap');
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-10px);} 60% {transform: translateY(-5px);} }
        body { margin: 0; padding: 0; background-color: #0d0f0d; scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

// --- СТИЛИ ---

const badgeStyle = {
    background: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
    padding: '8px 20px',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    border: '1px solid rgba(76, 175, 80, 0.2)'
};

const stepCard = {
    background: '#161816',
    padding: '50px 40px',
    borderRadius: '40px',
    border: '1px solid #222',
    position: 'relative',
    overflow: 'hidden',
    transition: '0.4s ease',
    cursor: 'default'
};

const stepNumber = {
    position: 'absolute',
    top: '-20px',
    right: '10px',
    fontSize: '100px',
    fontWeight: '900',
    color: 'rgba(255,255,255,0.02)',
    zIndex: 0
};

const galleryItem: any = {
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '40px',
  transition: 'transform 0.5s ease, filter 0.5s ease',
  cursor: 'pointer',
  border: '1px solid #222',
  filter: 'grayscale(0.5)'
};