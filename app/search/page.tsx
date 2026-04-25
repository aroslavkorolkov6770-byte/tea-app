"use client";
import React, { useState } from 'react';
import Navigation from '../components/Navigation';

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
}

const TEA_DATABASE: Tea[] = [
  { id: 1, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Свежий аромат орхидеи.", desc: "Легендарный улун из Аньси. Сладкое послевкусие.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 2, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дымный, хлебный вкус.", desc: "Утесный чай из гор Уи. Проходит сильную обжарку на углях.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 3, name: "Шу Пуэр 'Винтажный'", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, плотный настой.", desc: "Сильно ферментированный чай. Дает мощный заряд энергии.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 4, name: "Шен Пуэр (Мэнхай)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "80-85°C", summary: "Травянистый, легкая горчинка.", desc: "Молодой необработанный пуэр. Оставляет приятную свежесть.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 5, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Вкус жареных семечек.", desc: "Самый знаменитый зеленый чай Китая. Нежный и ореховый.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 6, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Средний", info: "90°C", summary: "Медовая сладость.", desc: "Элитный чай из почек. Очень сладкий и деликатный.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 7, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Тонкий вкус хвои.", desc: "Минимум обработки. Напоминает березовый сок.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Помогает сосредоточиться и снять стресс.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 10, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Аромат костра.", desc: "Копченый вкус.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" }
];

const CATEGORIES = ["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"];
const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  
  // Уровни фильтрации
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");

  const filteredTeas = TEA_DATABASE.filter(tea => {
    const matchesSearch = tea.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Все" || tea.type === activeCategory;
    const matchesStrength = activeStrength === "Все" || tea.strength === activeStrength;
    return matchesSearch && matchesCategory && matchesStrength;
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' } as any}>
        {!selectedTea ? (
          <>
            <input 
              type="text" 
              placeholder="Поиск сорта..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '20px', outline: 'none' } as any} 
            />

            {/* ГЛАВНЫЕ КАТЕГОРИИ */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '20px' } as any}>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveStrength("Все"); // сброс при смене категории
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '25px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    backgroundColor: activeCategory === cat ? '#4CAF50' : '#1a1c1a',
                    color: activeCategory === cat ? '#000' : '#fff',
                    transition: '0.3s'
                  } as any}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* ПОДФИЛЬТРЫ (ХАРАКТЕР) — Показываются если категория не "Все" */}
            {activeCategory !== "Все" && (
              <div style={{ 
                background: '#161816', 
                padding: '15px', 
                borderRadius: '15px', 
                marginBottom: '20px',
                border: '1px dashed #333' 
              } as any}>
                <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#555', fontWeight: 'bold' } as any}>ВЫБЕРИТЕ ХАРАКТЕР:</p>
                <div style={{ display: 'flex', gap: '8px' } as any}>
                  {STRENGTHS.map(str => (
                    <button 
                      key={str}
                      onClick={() => setActiveStrength(str)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        cursor: 'pointer',
                        fontSize: '12px',
                        backgroundColor: activeStrength === str ? '#4CAF50' : 'transparent',
                        color: activeStrength === str ? '#000' : '#777',
                      } as any}
                    >
                      {str}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* СПИСОК КАРТОЧЕК */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' } as any}>
              {filteredTeas.map(tea => (
                <div 
                  key={tea.id} 
                  onClick={() => setSelectedTea(tea)} 
                  style={{ 
                    background: '#161816', 
                    padding: '20px', 
                    borderRadius: '20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    border: '1px solid #222', 
                    cursor: 'pointer' 
                  } as any}
                >
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' } as any}>{tea.name}</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' } as any}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' } as any}>{tea.summary}</p>
                      <span style={{ fontSize: '10px', color: '#4CAF50', border: '1px solid #4CAF50', padding: '2px 6px', borderRadius: '4px', opacity: 0.6 } as any}>
                        {tea.strength}
                      </span>
                    </div>
                  </div>
                  <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' } as any}>{tea.category}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ДЕТАЛЬНАЯ СТРАНИЦА (без изменений) */
          <div>
            <button onClick={() => setSelectedTea(null)} style={{ background: '#222', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', cursor: 'pointer' } as any}>← Назад</button>
            <div style={{ background: '#161816', borderRadius: '25px', overflow: 'hidden', display: 'flex', border: '1px solid #222', minHeight: '300px' } as any}>
              <div style={{ flex: 1, maxWidth: '35%' } as any}><img src={selectedTea.img} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>
              <div style={{ flex: 1.5, padding: '20px' } as any}>
                <h2 style={{ margin: '0 0 10px 0', color: '#4CAF50' } as any}>{selectedTea.name}</h2>
                <div style={{ background: '#222', display: 'inline-block', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', marginBottom: '10px' } as any}>Температура: {selectedTea.info}</div>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#bbb' } as any}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}