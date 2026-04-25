"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { supabase } from '../lib/supabaseClient';

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

const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки из гор Уи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" }
];

export default function Home() {
  const [dayTea, setDayTea] = useState<Tea | null>(null);

  useEffect(() => {
    const fetchDayTea = async () => {
      try {
        const { data } = await supabase.from('teas').select('*').eq('isDayTea', true).maybeSingle();
        if (data) setDayTea(data);
        else setDayTea(INITIAL_TEA_DATABASE[0]);
      } catch (err) {
        setDayTea(INITIAL_TEA_DATABASE[0]);
      }
    };
    fetchDayTea();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', position: 'relative', overflowX: 'hidden' } as any}>
      <Navigation />
      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '150px' } as any}>
        <section style={{ height: '90vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' } as any}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' } as any} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10, animation: 'fadeInUp 1.5s ease-out' } as any}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-2px', textTransform: 'uppercase' } as any}>Tea Master <span style={{ color: '#4CAF50' }}>Store</span></h1>
            <p style={{ color: '#aaa', letterSpacing: '4px', fontSize: '12px', marginTop: '15px', fontWeight: '300' } as any}>Искусство в каждой капле</p>
          </div>
        </section>
        <section style={{ padding: '0 25px 60px 25px' } as any}>
          <h2 style={{ fontSize: '14px', color: '#4CAF50', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' } as any}>Наша философия</h2>
          <p style={{ fontSize: '22px', lineHeight: '1.6', fontWeight: '500', color: '#fff', marginBottom: '30px' } as any}>«Мы создаем пространство, где время замирает. Каждая чашка — это не просто напиток, а ритуал, соединяющий традицию и ритм города.»</p>
        </section>
        {dayTea && (
          <section style={{ padding: '0 25px', marginBottom: '60px' } as any}>
             <div style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '40px', borderRadius: '40px', border: '1px solid #4CAF50', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', animation: 'fadeInUp 1s ease' } as any}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '14px' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
                <h3 style={{ fontSize: '36px', color: '#fff', margin: '15px 0' } as any}>{dayTea.name}</h3>
                <p style={{ color: '#aaa', fontSize: '18px', lineHeight: '1.6' } as any}>{dayTea.summary}</p>
                <div style={{ display: 'inline-block', padding: '10px 20px', background: '#4CAF50', color: '#000', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px' } as any}>Заваривать при {dayTea.info}</div>
             </div>
          </section>
        )}
      </main>
      <style jsx global>{` @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } } body { margin: 0; padding: 0; background-color: #0d0f0d; } `}</style>
    </div>
  );
}