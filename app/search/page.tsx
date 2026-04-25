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
  { id: 4, name: "Шен Пуэр (Мэнхай)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "80-85°C", summary: "Травянистый, легкая горчинка.", desc: "Молодой необработанный пуэр. Оставляет приятную свежесть.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 5, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Вкус жареных семечек.", desc: "Самый знаменитый зеленый чай Китая. Нежный и ореховый.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 6, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Средний", info: "90°C", summary: "Медовая сладость.", desc: "Элитный чай из почек. Очень сладкий и деликатный.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 7, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Тонкий вкус хвои.", desc: "Минимум обработки. Напоминает березовый сок.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Помогает сосредоточиться и снять стресс.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 10, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Аромат костра.", desc: "Копченый вкус.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" }
];

const CATEGORIES = ["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"];

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");

  const filteredTeas = TEA_DATABASE.filter(tea => {
    const matchesSearch = tea.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Все" || tea.type === activeCategory;
    return matchesSearch && matchesCategory;
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

            <div style={{ display: 'flex', gap: '8px', overflow: 'auto', paddingBottom: '15px', marginBottom: '10px' } as any}>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #222',
                    cursor: 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease',
                    backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816',
                    color: activeCategory === cat ? '#000' : '#777',
                    borderColor: activeCategory === cat ? '#4CAF50' : '#222',
                  } as any}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredTeas.map(tea => (
              <div 
                key={tea.id} 
                onClick={() => setSelectedTea(tea)} 
                style={{ background: '#161816', padding: '18px 20px', borderRadius: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222', cursor: 'pointer' } as any}
              >
                <div style={{ flex: 1 } as any}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' } as any}>{tea.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' } as any}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#777' } as any}>{tea.summary}</p>
                    <span style={{ fontSize: '10px', color: '#555', border: '1px solid #333', padding: '1px 5px', borderRadius: '4px' } as any}>
                      {tea.strength}
                    </span>
                  </div>
                </div>
                <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '11px' } as any}>{tea.category}</span>
              </div>
            ))}
          </>
        ) : (
          <div>
            <button 
              onClick={() => setSelectedTea(null)} 
              style={{ background: '#222', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', cursor: 'pointer' } as any}
            >
              ← Назад
            </button>
            <div style={{ background: '#161816', borderRadius: '25px', overflow: 'hidden', display: 'flex', border: '1px solid #222', minHeight: '300px' } as any}>
              <div style={{ flex: 1, maxWidth: '35%' } as any}>
                <img src={selectedTea.img} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} alt={selectedTea.name} />
              </div>
              <div style={{ flex: 1.5, padding: '20px' } as any}>
                <h2 style={{ margin: '0 0 10px 0', color: '#4CAF50' } as any}>{selectedTea.name}</h2>
                <div style={{ background: '#222', display: 'inline-block', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', marginBottom: '10px' } as any}>
                   Температура: {selectedTea.info}
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#bbb' } as any}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}