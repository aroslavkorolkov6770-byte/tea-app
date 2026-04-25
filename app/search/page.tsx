"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea { id: number; name: string; type: string; category: string; strength: string; info: string; summary: string; desc: string; img: string; isDayTea?: boolean; }

const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Плотный, травянистый.", desc: "Огромные плоские листья.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Золотые брови.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" }
];

export default function SearchPage() {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('teas').select('*');
      if (data && data.length > 0) setTeas(data);
      else setTeas(INITIAL_TEA_DATABASE);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = teas.filter(t => {
    const s = t.name.toLowerCase().includes(search.toLowerCase());
    const c = activeCategory === "Все" || t.type === activeCategory;
    const st = activeStrength === "Все" || t.strength === activeStrength;
    return s && c && st;
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        {!selectedTea ? (
          <>
            <input type="text" placeholder="Поиск сорта..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' } as any} />
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px' } as any}>
              {["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(cat => (
                <div key={cat} onClick={() => { setActiveCategory(cat); setActiveStrength("Все"); }} style={{ padding: '12px 24px', borderRadius: '25px', cursor: 'pointer', backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816', color: activeCategory === cat ? '#000' : '#fff', fontWeight: 'bold' } as any}>{cat}</div>
              ))}
            </div>
            {activeCategory !== "Все" && (
              <div style={{ background: '#121412', padding: '20px', borderRadius: '18px', border: '1px solid #222', marginBottom: '25px' } as any}>
                <div style={{ display: 'flex', gap: '10px' } as any}>
                  {["Все", "Мягкий", "Средний", "Крепкий"].map(str => (
                    <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gap: '15px' }}>
              {filtered.map(tea => (
                <div key={tea.id} onClick={() => setSelectedTea(tea)} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div style={{ flex: 1 }}><h3>{tea.name}</h3><p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{tea.summary}</p></div>
                  <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>{tea.strength}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div onClick={() => setSelectedTea(null)} style={{ color: '#fff', cursor: 'pointer', marginBottom: '25px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: '#161816', borderRadius: '15px', border: '1px solid #333' } as any}>← Назад</div>
            <div style={{ background: '#161816', borderRadius: '35px', overflow: 'hidden', border: '1px solid #222' } as any}>
              <img src={selectedTea.img} style={{ width: '100%', height: '350px', objectFit: 'cover' } as any} />
              <div style={{ padding: '35px' }}><h2>{selectedTea.name}</h2><p style={{ color: '#bbb', lineHeight: '1.8' }}>{selectedTea.desc}</p></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}