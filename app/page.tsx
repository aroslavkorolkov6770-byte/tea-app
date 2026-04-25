"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
// Подключаем облако (путь под твою структуру)
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [dayTea, setDayTea] = useState<any>(null);

  // Загружаем чай дня из облака при открытии сайта
  useEffect(() => {
    const fetchDayTea = async () => {
      try {
        const { data, error } = await supabase
          .from('teas')
          .select('*')
          .eq('isDayTea', true)
          .limit(1)
          .single();
        
        if (data) setDayTea(data);
      } catch (err) {
        console.log("Чай дня еще не назначен в админке");
      }
    };
    fetchDayTea();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative', overflowX: 'hidden' }}>
      
      <Navigation />

      {/* ГЛАВНЫЙ КОНТЕНТ */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '150px' }}>
        
        {/* 1. ЭКРАН ПРИВЕТСТВИЯ (HERO) */}
        <section style={{ height: '90vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', 
            backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' 
          }} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10, animation: 'fadeInUp 1.5s ease-out' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-2px', textTransform: 'uppercase' }}>
              Tea Master <span style={{ color: '#4CAF50' }}>Store</span>
            </h1>
            <p style={{ color: '#aaa', letterSpacing: '4px', fontSize: '12px', marginTop: '15px', fontWeight: '300' }}>
              Искусство в каждой капле
            </p>
            <div style={{ marginTop: '50px', animation: 'bounce 2s infinite', color: '#4CAF50', fontSize: '24px' }}>↓</div>
          </div>
        </section>

        {/* 2. СЕКЦИЯ: ФИЛОСОФИЯ */}
        <section style={{ padding: '0 25px 60px 25px' }}>
          <h2 style={{ fontSize: '14px', color: '#4CAF50', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>Наша философия</h2>
          <p style={{ fontSize: '22px', lineHeight: '1.6', fontWeight: '500', color: '#fff', marginBottom: '30px' }}>
            «Мы создаем пространство, где время замирает. Каждая чашка — это не просто напиток, а ритуал, соединяющий древние традиции с ритмом большого города.»
          </p>
          <div style={{ height: '1px', width: '60px', backgroundColor: '#4CAF50' }}></div>
        </section>

        {/* 3. ГАЛЕРЕЯ (BENTO GRID) */}
        <section style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '60px' }}>
          <div style={{ ...galleryItem, gridRow: 'span 2', backgroundImage: 'url("https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600")' } as any}></div>
          <div style={{ ...galleryItem, height: '180px', backgroundImage: 'url("https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=600")' } as any}></div>
          <div style={{ ...galleryItem, height: '180px', backgroundImage: 'url("https://images.unsplash.com/photo-1571934811356-5cc561b6821f?q=80&w=600")' } as any}></div>
          <div style={{ ...galleryItem, gridColumn: 'span 2', height: '220px', backgroundImage: 'url("https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000")' } as any}></div>
        </section>

        {/* 4. НОВОЕ: ИНТЕГРАЦИЯ ЧАЯ ДНЯ ИЗ ОБЛАКА */}
        {dayTea && (
          <section style={{ padding: '0 25px', marginBottom: '60px' }}>
             <div style={{ 
               background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', 
               padding: '40px', borderRadius: '40px', border: '1px solid #4CAF50',
               boxShadow: '0 20px 40px rgba(0,0,0,0.4)', animation: 'fadeInUp 1s ease'
             } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>{dayTea.type}</span>
                </div>
                <h3 style={{ fontSize: '36px', color: '#fff', margin: '0 0 15px 0' }}>{dayTea.name}</h3>
                <p style={{ color: '#aaa', fontSize: '18px', lineHeight: '1.6', marginBottom: '25px' }}>{dayTea.summary}</p>
                <div style={{ display: 'inline-block', padding: '10px 20px', background: '#4CAF50', color: '#000', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' }}>
                    Заваривать при {dayTea.info}
                </div>
             </div>
          </section>
        )}

        {/* 5. СЕКЦИЯ: ТЕКСТ О МАСТЕРСТВЕ */}
        <section style={{ padding: '0 25px', marginBottom: '80px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ fontSize: '28px', color: '#fff', marginBottom: '20px' }}>Мастерство пролива</h3>
            <p style={{ lineHeight: '1.8', color: '#aaa', fontSize: '16px' }}>
              В Tea Master Store мы учим сотрудников чувствовать лист. Температура воды, материал посуды и ваше состояние — три столпа, на которых строится идеальный вкус. Этот HUB поможет вам освоить все тонкости нашей школы.
            </p>
          </div>
        </section>

        {/* 6. ФУТЕР */}
        <section style={{ textAlign: 'center', padding: '0 25px' }}>
          <p style={{ color: '#444', fontSize: '12px', letterSpacing: '1px' }}>© 2024 TEA MASTER STORE | HUB СОТРУДНИКА</p>
        </section>

      </main>

      {/* АНИМАЦИИ */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-10px);}
          60% {transform: translateY(-5px);}
        }
        body { margin: 0; padding: 0; background-color: #0d0f0d; }
      `}</style>
    </div>
  );
}

const galleryItem = {
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '30px',
  transition: 'transform 0.4s ease',
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.1)'
};