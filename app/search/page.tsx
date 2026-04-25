"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
// Подключаем мост к базе данных
import { supabase } from '@/lib/supabaseClient';

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
  // ЗЕЛЕНЫЙ
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Плотный, травянистый.", desc: "Огромные плоские листья с мощным ароматом орхидеи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  // БЕЛЫЙ
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки. Самый деликатный чай.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800" },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы, курага.", desc: "Белый пион. Гармония почки и двух верхних листьев.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800" },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай. Плотный и согревающий.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  // УЛУН
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800" },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай с особым способом ферментации для снятия стресса.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800" },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки из гор Уи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  // КРАСНЫЙ
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Золотые брови. Элитный сорт из крошечных почек.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классический юньнаньский чай с золотистыми почками.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800" },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай с ароматом костра.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800" },
  // ПУЭР
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен. Дает легкую бодрость и очищение.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800" },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, старое дерево.", desc: "Шен пуэр с выдержкой более 10 лет.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800" }
];

const CATEGORIES = ["Все", "Зеленый", "Белый", "Улун", "Красный", "Пуэр"];
const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

export default function SearchPage() {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");

  // Загрузка данных из Supabase
  useEffect(() => {
    const loadTeas = async () => {
      try {
        const { data, error } = await supabase.from('teas').select('*');
        if (data && data.length > 0) {
          setTeas(data);
        } else {
          // Если в облаке еще нет данных, используем начальную базу
          setTeas(INITIAL_TEA_DATABASE);
        }
      } catch (err) {
        console.error("Ошибка подключения к Supabase:", err);
        setTeas(INITIAL_TEA_DATABASE);
      } finally {
        setLoading(false);
      }
    };
    loadTeas();
  }, []);

  const dayTea = teas.find(t => t.isDayTea);

  const filteredTeas = teas.filter(tea => {
    const matchesSearch = tea.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Все" || tea.type === activeCategory;
    const matchesStrength = activeStrength === "Все" || tea.strength === activeStrength;
    return matchesSearch && matchesCategory && matchesStrength;
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        {!selectedTea ? (
          <>
            {/* ЧАЙ ДНЯ ⭐ */}
            {dayTea && activeCategory === "Все" && !search && (
              <div 
                onClick={() => setSelectedTea(dayTea)}
                style={{ 
                  background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', 
                  padding: '30px', borderRadius: '30px', marginBottom: '35px', 
                  border: '1px solid #4CAF50', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
                } as any}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>⭐ ЧАЙ ДНЯ</span>
                </div>
                <h2 style={{ margin: '10px 0', fontSize: '32px' }}>{dayTea.name}</h2>
                <p style={{ margin: 0, color: '#aaa', fontSize: '15px' }}>{dayTea.summary}</p>
              </div>
            )}

            <input 
              type="text" 
              placeholder="Поиск сорта..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none', boxSizing: 'border-box' } as any} 
            />

            {/* ВЕРХНИЕ КАТЕГОРИИ */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px' } as any}>
              {CATEGORIES.map((cat) => (
                <div 
                  key={`cat-main-${cat}-${activeCategory === cat}`}
                  onClick={() => { setActiveCategory(cat); setActiveStrength("Все"); }}
                  style={{
                    padding: '12px 24px', borderRadius: '25px', cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap',
                    backgroundColor: activeCategory === cat ? '#4CAF50' : '#161816',
                    color: activeCategory === cat ? '#000' : '#fff', transition: '0.2s', fontWeight: 'bold'
                  } as any}
                >
                  {cat}
                </div>
              ))}
            </div>

            {/* ХАРАКТЕР (ПОДФИЛЬТР) */}
            {activeCategory !== "Все" && (
              <div 
                key={`strength-box-${activeCategory}`} 
                style={{ background: '#121412', padding: '20px', borderRadius: '18px', border: '1px solid #222', marginBottom: '25px' } as any}
              >
                <div style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' }}>ВЫБЕРИТЕ ХАРАКТЕР:</div>
                <div style={{ display: 'flex', gap: '10px' } as any}>
                  {STRENGTHS.map((str) => {
                    const isActive = activeStrength === str;
                    return (
                      <div 
                        key={`str-btn-${str}-${isActive}`} 
                        onClick={(e) => { e.stopPropagation(); setActiveStrength(str); }}
                        style={{
                          padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
                          backgroundColor: isActive ? '#4CAF50' : '#1a1a1a',
                          color: isActive ? '#000' : '#666',
                          border: '1px solid', borderColor: isActive ? '#4CAF50' : '#333', fontWeight: isActive ? 'bold' : 'normal',
                          transition: '0.1s'
                        } as any}
                      >
                        {str}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* РЕЗУЛЬТАТЫ */}
            <div style={{ display: 'grid', gap: '15px' } as any}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#444' }}>Загрузка базы из облака...</p>
              ) : (
                filteredTeas.map(tea => (
                  <div 
                    key={`tea-list-item-${tea.id}`} 
                    onClick={() => setSelectedTea(tea)} 
                    style={{ 
                      background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', 
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s'
                    } as any}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' } as any}>{tea.name}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' } as any}>{tea.summary}</p>
                    </div>
                    <div style={{ color: '#4CAF50', fontSize: '11px', fontWeight: 'bold', background: 'rgba(76, 175, 80, 0.1)', padding: '5px 10px', borderRadius: '8px' }}>
                      {tea.strength}
                    </div>
                  </div>
                ))
              )}
              {!loading && filteredTeas.length === 0 && (
                <p style={{ textAlign: 'center', color: '#444', marginTop: '20px' }}>Такого чая пока нет в базе...</p>
              )}
            </div>
          </>
        ) : (
          /* ДЕТАЛИ */
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div 
              onClick={() => setSelectedTea(null)} 
              style={{ color: '#fff', cursor: 'pointer', marginBottom: '25px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: '#161816', borderRadius: '15px', border: '1px solid #333' } as any}
            >
              <span>←</span> Назад к поиску
            </div>
            
            <div style={{ background: '#161816', borderRadius: '35px', overflow: 'hidden', border: '1px solid #222', display: 'flex', flexDirection: 'column' } as any}>
              <div style={{ width: '100%', height: '350px' }}>
                <img src={selectedTea.img} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} alt={selectedTea.name} />
              </div>
              <div style={{ padding: '35px' }}>
                <h2 style={{ color: '#4CAF50', margin: '0 0 10px 0', fontSize: '32px' }}>{selectedTea.name}</h2>
                <div style={{ marginBottom: '20px', color: '#666' }}>Заваривать при: {selectedTea.info}</div>
                <p style={{ fontSize: '16px', color: '#bbb', lineHeight: '1.8' }}>{selectedTea.desc}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}