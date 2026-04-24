"use client";
import React, { useState } from 'react';
import Navigation from '../components/Navigation';

const TEA_DATABASE = [
  { id: 1, name: "Те Гуань Инь", category: "Светлый Улун", info: "85°C", summary: "Свежий аромат орхидеи.", desc: "Легендарный улун из Аньси. Сладкое послевкусие.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 2, name: "Да Хун Пао", category: "Темный Улун", info: "95°C", summary: "Дымный, хлебный вкус.", desc: "Утесный чай из гор Уи. Проходит сильную обжарку на углях.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 3, name: "Шу Пуэр 'Винтажный'", category: "Пуэр", info: "100°C", summary: "Землистый, плотный настой.", desc: "Сильно ферментированный чай. Дает мощный заряд энергии.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 4, name: "Шен Пуэр (Мэнхай)", category: "Пуэр", info: "80-85°C", summary: "Травянистый, легкая горчинка.", desc: "Молодой необработанный пуэр. Оставляет приятную свежесть.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 5, name: "Лунцзин", category: "Зеленый чай", info: "75°C", summary: "Вкус жареных семечек.", desc: "Самый знаменитый зеленый чай Китая. Нежный и ореховый.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 6, name: "Цзинь Цзюнь Мэй", category: "Красный чай", info: "90°C", summary: "Медовая сладость.", desc: "Элитный чай из почек. Очень сладкий и деликатный.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  { id: 7, name: "Бай Хао Инь Чжэнь", category: "Белый чай", info: "70°C", summary: "Тонкий вкус хвои.", desc: "Минимум обработки. Напоминает березовый сок.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 8, name: "Габа Алишань", category: "Тайвань", info: "90°C", summary: "Ягодная кислинка.", desc: "Помогает сосредоточиться и снять стресс.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 9, name: "Най Сян (Молочный)", category: "Улун", info: "85°C", summary: "Сливочный аромат.", desc: "Мягкий вкус карамели и парного молока.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800" },
  { id: 10, name: "Лапсанг Сушонг", category: "Красный чай", info: "95°C", summary: "Аромат костра.", desc: "Копченый вкус. Напоминает чернослив на огне.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" }
];

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<any>(null);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' }}>
      <Navigation />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' }}>
        {!selectedTea ? (
          <>
            <input type="text" placeholder="Поиск сорта..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} />
            {TEA_DATABASE.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map(tea => (
              <div key={tea.id} onClick={() => setSelectedTea(tea)} style={teaListItemStyle}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{tea.name}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>{tea.summary}</p>
                </div>
                <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '11px' }}>{tea.category}</span>
              </div>
            ))}
          </>
        ) : (
          <div>
            <button onClick={() => setSelectedTea(null)} style={backButtonStyle}>← Назад</button>
            <div style={teaDetailCardStyle}>
              <div style={{ flex: 1, maxWidth: '35%' }}><img src={selectedTea.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ flex: 1.5, padding: '20px' }}>
                <h2 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>{selectedTea.name}</h2>
                <div style={{ background: '#222', display: 'inline-block', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', marginBottom: '10px' }}>{selectedTea.info}</div>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#bbb' }}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Стили из твоего кода
const searchInputStyle = { width: '100%', padding: '16px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '20px', outline: 'none' };
const teaListItemStyle = { background: '#161816', padding: '18px 20px', borderRadius: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222', cursor: 'pointer' };
const backButtonStyle = { background: '#222', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', cursor: 'pointer' };
const teaDetailCardStyle = { background: '#161816', borderRadius: '25px', overflow: 'hidden', display: 'flex', border: '1px solid #222', minHeight: '300px' };