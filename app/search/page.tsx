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
  { id: 1, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Свежий аромат орхидеи.", desc: "Легендарный улун из Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 2, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дымный, хлебный вкус.", desc: "Утесный чай из гор Уи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 3, name: "Шу Пуэр 'Винтажный'", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, плотный настой.", desc: "Сильно ферментированный чай.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 4, name: "Шен Пуэр (Мэнхай)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "80-85°C", summary: "Травянистый, легкая горчинка.", desc: "Молодой необработанный пуэр.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 5, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Вкус жареных семечек.", desc: "Самый знаменитый зеленый чай Китая.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 6, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Средний", info: "90°C", summary: "Медовая сладость.", desc: "Элитный чай из почек.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 10, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Аромат костра.", desc: "Копченый вкус.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" }
];

const CATEGORIES = ["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"];
const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  
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
                  key={`cat-${cat}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveStrength("Все");
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '25px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeCategory === cat ? '#4CAF50' : '#1a1c1a',
                    color: activeCategory === cat ? '#000' : '#fff',
                  } as any}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* ПОДФИЛЬТРЫ (ХАРАКТЕР) */}
            {activeCategory !== "Все" && (
              <div style={{ background: '#161816', padding: '15px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #222' } as any}>
                <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#444' } as any}>ХАРАКТЕР ЧАЯ:</p>
                <div style={{ display: 'flex', gap: '8px' } as any}>
                  {STRENGTHS.map(str => {
                    // Проверка активности вынесена в переменную для надежности
                    const isNowActive = activeStrength === str;
                    
                    return (
                      <button 
                        key={`str-${str}`}
                        onClick={() => {
                          console.log("Выбран характер:", str);
                          setActiveStrength(str);
                        }}
                        style={{
                          padding: '8px 15px',
                          borderRadius: '8px',
                          border: '1px solid #333',
                          cursor: 'pointer',
                          fontSize: '12px',
                          // Жесткая проверка стейта для цвета
                          backgroundColor: isNowActive ? '#4CAF50' : 'transparent',
                          color: isNowActive ? '#000' : '#666',
                          transition: 'background 0.2s ease'
                        } as any}
                      >
                        {str}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* СПИСОК ЧАЯ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' } as any}>
              {filteredTeas.map(tea => (
                <div 
                  key={tea.id} 
                  onClick={() => setSelectedTea(tea)} 
                  style={{ background: '#161816', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', border: '1px solid #222', cursor: 'pointer' } as any}
                >
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' } as any}>{tea.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' } as any}>{tea.summary}</p>
                  </div>
                  <span style={{ color: '#4CAF50', fontSize: '12px' } as any}>{tea.strength}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button onClick={() => setSelectedTea(null)} style={{ background: '#222', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px' } as any}>← Назад</button>
            <div style={{ background: '#161816', borderRadius: '25px', overflow: 'hidden', display: 'flex', border: '1px solid #222' } as any}>
                <img src={selectedTea.img} style={{ width: '35%', objectFit: 'cover' } as any} />
                <div style={{ padding: '20px' } as any}>
                    <h2 style={{ color: '#4CAF50' } as any}>{selectedTea.name}</h2>
                    <p>{selectedTea.desc}</p>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}