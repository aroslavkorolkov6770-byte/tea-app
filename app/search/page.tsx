"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
  region?: string; brewGuide?: string; advice?: string; analogsDiff?: string;
  quiz?: { q: string; o: string[]; c: number }[];
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

// --- МАКСИМАЛЬНО ПОЛНАЯ БАЗА (30 ПОЗИЦИЙ) ---
const INITIAL_DATABASE: Tea[] = [
  // ЧАЙ (15 позиций)
  { 
    id: 1, name: "Лунцзин", type: "Чай", category: "Зеленый", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Король зеленых чаев. Плоский лист, ручная обжарка в котлах.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false,
    region: "Ханчжоу, Сиху", brewGuide: "75°C, 2-3 мин", advice: "Для ценителей классики и мягкости.", analogsDiff: "Сладковатый ореховый финиш.",
    quiz: [{q: "Метод обработки?", o: ["Пар", "Обжарка в котле", "Сушка на солнце"], c: 1}]
  },
  { id: 2, name: "Би Ло Чунь", type: "Чай", category: "Зеленый", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спирали с ворсом. Растет среди фруктовых садов.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false, region: "Цзянсу", brewGuide: "80°C", advice: "Любителям ярких ароматов.", analogsDiff: "Более цветочный, чем Лунцзин.", quiz: [{q: "Где растет?", o: ["В лесу", "Среди фруктовых садов"], c: 1}] },
  { id: 3, name: "Тайпин Хоукуй", type: "Чай", category: "Зеленый", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья. Уникальный внешний вид.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Аньхой", brewGuide: "85°C", advice: "Для тех, кто ищет эффектную подачу.", analogsDiff: "Самый крупный лист.", quiz: [{q: "Размер листа?", o: ["Мелкий", "Средний", "Очень крупный"], c: 2}] },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Чай", category: "Белый", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только верхушечные почки. Самый нежный белый чай.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "70°C", advice: "Для утреннего чаепития.", analogsDiff: "Высший сорт белого чая.", quiz: [{q: "Что в составе?", o: ["Листья", "Почки"], c: 1}] },
  { id: 5, name: "Бай Му Дань", type: "Чай", category: "Белый", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион. Сочетание почки и двух верхних листьев.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Фудин", brewGuide: "75°C", advice: "Баланс нежности и вкуса.", analogsDiff: "Насыщеннее Инь Чжэня.", quiz: [{q: "Как переводится?", o: ["Белый лотос", "Белый пион"], c: 1}] },
  { id: 6, name: "Те Гуань Инь", type: "Чай", category: "Улун", strength: "Мягкий", info: "85°C", summary: "Орхидея и сирень.", desc: "Классический светлый улун. Плотные изумрудные гранулы.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true, region: "Аньси", brewGuide: "85°C", advice: "Для релаксации.", analogsDiff: "Сливочный, цветочный профиль.", quiz: [{q: "Степень ферментации?", o: ["Светлый", "Темный"], c: 0}] },
  { id: 7, name: "Да Хун Пао", type: "Чай", category: "Улун", strength: "Крепкий", info: "95°C", summary: "Огонь, дым, карамель.", desc: "Утесный темный улун сильной прожарки.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Уишань", brewGuide: "95°C", advice: "Для вечерних бесед.", analogsDiff: "Мощная прожарка.", quiz: [{q: "Где растет?", o: ["В горах", "На равнине"], c: 0}] },
  { id: 8, name: "Габа Алишань", type: "Чай", category: "Улун", strength: "Средний", info: "90°C", summary: "Печеные яблоки, кислинка.", desc: "Чай, прошедший ферментацию без доступа кислорода.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Тайвань", brewGuide: "90°C", advice: "Для концентрации внимания.", analogsDiff: "Содержит ГАМК.", quiz: [{q: "Главная особенность?", o: ["Цвет", "ГАМК (GABA)"], c: 1}] },
  { id: 9, name: "Дянь Хун", type: "Чай", category: "Красный", strength: "Средний", info: "95°C", summary: "Мед и сухофрукты.", desc: "Юньнаньский красный чай с обилием золотистых почек.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false, region: "Юньнань", brewGuide: "95°C", advice: "Классический согревающий чай.", analogsDiff: "Более сладкий, чем Сяо Чжун.", quiz: [{q: "Цвет почек?", o: ["Черные", "Золотистые"], c: 1}] },
  { id: 10, name: "Лапсанг Сушонг", type: "Чай", category: "Красный", strength: "Крепкий", info: "95°C", summary: "Дым, чернослив, костер.", desc: "Копченый на сосновых дровах красный чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "95°C", advice: "Для любителей необычных вкусов.", analogsDiff: "Характерный дегтярный аромат.", quiz: [{q: "Чем пахнет?", o: ["Цветами", "Дымом/Костром"], c: 1}] },
  { id: 11, name: "Шу Пуэр", type: "Чай", category: "Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, орехи, кора.", desc: "Чай ускоренной ферментации. Плотный, темный настой.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false, region: "Юньнань", brewGuide: "100°C", advice: "Для бодрости.", analogsDiff: "Не дает горечи при перестое.", quiz: [{q: "Цвет настоя?", o: ["Прозрачный", "Черный/Нефтяной"], c: 1}] },
  { id: 12, name: "Шен Пуэр", type: "Чай", category: "Пуэр", strength: "Средний", info: "90°C", summary: "Курага, дымок, свежесть.", desc: "Естественно состаренный пуэр. Профиль меняется со временем.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false, region: "Мэнхай", brewGuide: "90°C", advice: "Ценителям сложных переходов.", analogsDiff: "Фруктовая кислинка.", quiz: [{q: "Вкус со временем?", o: ["Портится", "Становится глубже"], c: 1}] },
  { id: 13, name: "Сяо Чжун", type: "Чай", category: "Красный", strength: "Средний", info: "95°C", summary: "Хлеб, ржаная корочка.", desc: "Красный чай без копчения. Глубокий хлебный вкус.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false, region: "Уишань", brewGuide: "95°C", advice: "Уютный вечерний чай.", analogsDiff: "Мягче Лапсанга.", quiz: [{q: "Нота?", o: ["Хлебная", "Морская"], c: 0}] },
  { id: 14, name: "Най Сян Улун", type: "Чай", category: "Улун", strength: "Мягкий", info: "85°C", summary: "Сливки, карамель.", desc: "Молочный улун. Ароматизированный сорт.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "85°C", advice: "Для начинающих путь в чай.", analogsDiff: "Яркий молочный аромат.", quiz: [{q: "Аромат?", o: ["Древесный", "Молочно-сливочный"], c: 1}] },
  { id: 15, name: "Габа Изумруд", type: "Чай", category: "Улун", strength: "Средний", info: "90°C", summary: "Ягоды, винная нота.", desc: "Светлая габа слабой прожарки. Травянисто-ягодный профиль.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Тайвань", brewGuide: "90°C", advice: "Для спокойного отдыха.", analogsDiff: "Кислее обычного улуна.", quiz: [{q: "Профиль?", o: ["Землистый", "Ягодно-кислый"], c: 1}] },

  // КОФЕ (15 позиций)
  { id: 101, name: "Эфиопия Иргачефф", type: "Кофе", category: "Арабика", strength: "Мягкий", info: "V60", summary: "Бергамот, жасмин, лимон.", desc: "Высокогорная арабика с чайным телом.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Эфиопия", brewGuide: "93°C", advice: "Любителям легкого кофе.", analogsDiff: "Высокая кислотность.", quiz: [{q: "Нота?", o: ["Шоколад", "Цветы/Цитрус"], c: 1}] },
  { id: 102, name: "Бразилия Сантос", type: "Кофе", category: "Арабика", strength: "Средний", info: "Эспрессо", summary: "Орехи, молочный шоколад.", desc: "Классический сбалансированный вкус.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Бразилия", brewGuide: "94°C", advice: "Идеально с молоком.", analogsDiff: "Низкая кислотность.", quiz: [{q: "Основная нота?", o: ["Орехово-шоколадная", "Ягодная"], c: 0}] },
  { id: 103, name: "Колумбия Супремо", type: "Кофе", category: "Арабика", strength: "Средний", info: "Фильтр", summary: "Карамель, красное яблоко.", desc: "Сорт с крупным зерном и чистым вкусом.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Колумбия", brewGuide: "92°C", advice: "Универсальный выбор.", analogsDiff: "Сладкий профиль.", quiz: [{q: "Кислотность?", o: ["Яблочная", "Лимонная"], c: 0}] },
  { id: 104, name: "Кения АА", type: "Кофе", category: "Арабика", strength: "Крепкий", info: "V60", summary: "Смородина, вишня, томаты.", desc: "Самый яркий кофе с винной кислотностью.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Кения", brewGuide: "94°C", advice: "Для кофейных гурманов.", analogsDiff: "Яркая ягодность.", quiz: [{q: "Главная нота?", o: ["Орех", "Черная смородина"], c: 1}] },
  { id: 105, name: "Суматра Манделин", type: "Кофе", category: "Азия", strength: "Крепкий", info: "Френч-пресс", summary: "Специи, табак, дерево.", desc: "Плотный, мужской кофе с низкой кислотностью.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Индонезия", brewGuide: "95°C", advice: "Любителям горечи и плотности.", analogsDiff: "Очень землистый.", quiz: [{q: "Тело кофе?", o: ["Легкое", "Плотное/Тяжелое"], c: 1}] },
  { id: 106, name: "Коста-Рика Тарразу", type: "Кофе", category: "Арабика", strength: "Средний", info: "Фильтр", summary: "Абрикос, коричневый сахар.", desc: "Мягкий кофе с фруктовым послевкусием.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Коста-Рика", brewGuide: "92°C", advice: "Сладкий утренний фильтр.", analogsDiff: "Сбалансирован.", quiz: [{q: "Нота?", o: ["Фруктовая", "Земляная"], c: 0}] },
  { id: 107, name: "Гватемала Антигуа", type: "Кофе", category: "Арабика", strength: "Средний", info: "Воронка", summary: "Дым, темный шоколад.", desc: "Вулканические почвы.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Гватемала", brewGuide: "93°C", advice: "Для ценителей шоколада.", analogsDiff: "Дымное послевкусие.", quiz: [{q: "Почва?", o: ["Глина", "Вулканическая"], c: 1}] },
  { id: 108, name: "Вьетнам Робуста", type: "Кофе", category: "Робуста", strength: "Крепкий", info: "Фин", summary: "Табак, злаки, кофеин.", desc: "Горький кофе для бодрости.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Вьетнам", brewGuide: "96°C", advice: "Сгущенка сгладит горечь.", analogsDiff: "Больше кофеина.", quiz: [{q: "Вид зерна?", o: ["Арабика", "Робуста"], c: 1}] },
  { id: 109, name: "Гондурас SHG", type: "Кофе", category: "Арабика", strength: "Средний", info: "Фильтр", summary: "Кедр, карамель.", desc: "Кофе высокогорного выращивания.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Гондурас", brewGuide: "93°C", advice: "Повседневный выбор.", analogsDiff: "Древесные ноты.", quiz: [{q: "Маркировка SHG?", o: ["Низкогорный", "Высокогорный"], c: 1}] },
  { id: 110, name: "Сальвадор Пакамара", type: "Кофе", category: "Арабика", strength: "Мягкий", info: "V60", summary: "Тропики, сладость.", desc: "Сорт с очень крупными зернами.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Сальвадор", brewGuide: "91°C", advice: "Для гурманов.", analogsDiff: "Крупное зерно.", quiz: [{q: "Размер зерна?", o: ["Крупный", "Мелкий"], c: 0}] },
  { id: 111, name: "Никарагуа Хинотега", type: "Кофе", category: "Арабика", strength: "Средний", info: "Турка", summary: "Какао, мед.", desc: "Плотный шоколадный профиль.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Никарагуа", brewGuide: "94°C", advice: "Хорошо в турке.", analogsDiff: "Мягкая шоколадность.", quiz: [{q: "Нота?", o: ["Какао", "Бергамот"], c: 0}] },
  { id: 112, name: "Панама Гейша", type: "Кофе", category: "Премиум", strength: "Мягкий", info: "Калита", summary: "Бергамот, жасмин.", desc: "Элитный и дорогой кофе.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Панама", brewGuide: "90°C", advice: "Особый случай.", analogsDiff: "Схож с чаем.", quiz: [{q: "Аромат?", o: ["Шоколадный", "Цветочный"], c: 1}] },
  { id: 113, name: "Руанда Бурбон", type: "Кофе", category: "Арабика", strength: "Мягкий", info: "Фильтр", summary: "Красная смородина.", desc: "Сладкий ягодный кофе.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Руанда", brewGuide: "92°C", advice: "Любителям ягод.", analogsDiff: "Чистый вкус.", quiz: [{q: "Кислотность?", o: ["Высокая", "Низкая"], c: 0}] },
  { id: 114, name: "Бурунди Мытый", type: "Кофе", category: "Арабика", strength: "Средний", info: "Аэропресс", summary: "Грейпфрут, травы.", desc: "Терпкий цитрусовый вкус.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Бурунди", brewGuide: "94°C", advice: "Бодрящий фильтр.", analogsDiff: "Травянистые ноты.", quiz: [{q: "Нота?", o: ["Цитрусовая", "Ореховая"], c: 0}] },
  { id: 115, name: "Танзания Пиберри", type: "Кофе", category: "Спешиалти", strength: "Средний", info: "V60", summary: "Вишня, лемонграсс.", desc: "Зерна круглой формы.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Танзания", brewGuide: "93°C", advice: "Показать гостю форму зерна.", analogsDiff: "Зерно-горошина.", quiz: [{q: "Форма зерна?", o: ["Плоское", "Круглое (Пиберри)"], c: 1}] }
];

export default function SearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Tea[]>([]);
  const [teaSubCategories] = useState(["Зеленый", "Белый", "Улун", "Красный", "Пуэр"]);
  const [coffeeSubCategories] = useState(["Арабика", "Робуста", "Азия", "Премиум", "Спешиалти"]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [topCategory, setTopCategory] = useState("Все");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  
  const [quizResults, setQuizResults] = useState<{[key: number]: number[]}>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<Tea>>({
    name: '', type: 'Чай', category: 'Зеленый', strength: 'Мягкий', summary: '', desc: '', img: '', isDayTea: false, region: '', brewGuide: '', advice: '', analogsDiff: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setIsAdmin(localStorage.getItem('isLoggedIn') === 'true' && role === 'admin');
    
    // Единый ключ для всех
    const saved = localStorage.getItem('tea_master_unified_v1');
    if (saved) setProducts(JSON.parse(saved));
    else {
      setProducts(INITIAL_DATABASE);
      localStorage.setItem('tea_master_unified_v1', JSON.stringify(INITIAL_DATABASE));
    }
    setIsMounted(true);
  }, []);

  const saveToLocal = (list: Tea[]) => {
    setProducts(list);
    localStorage.setItem('tea_master_unified_v1', JSON.stringify(list));
  };

  const handleSave = () => {
    let list = [...products];
    const newId = editingId || Date.now();
    const data = { ...formData, id: newId } as Tea;

    if (data.isDayTea) list = list.map(p => p.type === data.type ? { ...p, isDayTea: false } : p);
    if (editingId) list = list.map(p => p.id === editingId ? data : p);
    else list.push(data);

    saveToLocal(list);
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Чай', category: 'Зеленый', strength: 'Мягкий', summary: '', desc: '', img: '', isDayTea: false, region: '', brewGuide: '', advice: '' });
  };

  const deleteProduct = (id: number) => {
    if (confirm("Удалить продукт?")) saveToLocal(products.filter(p => p.id !== id));
  };

  const filtered = products.filter(p => {
    const mSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const mTop = topCategory === "Все" || p.type === topCategory;
    const mSub = activeCategory === "Все" || p.category === activeCategory;
    const mStr = activeStrength === "Все" || p.strength === activeStrength;
    return mSearch && mTop && mSub && mStr;
  });

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' }}>
      <Navigation />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px', display: 'grid', gridTemplateColumns: isAdmin ? '1fr 340px' : '1fr', gap: '40px' }}>
        
        <section>
          {/* ПРОДУКТ ДНЯ С УМНЫМ ЗАГОЛОВКОМ */}
          {filtered.find(p => p.isDayTea) && !search && (
            <div onClick={() => setSelectedTea(filtered.find(p => p.isDayTea)!)} style={dayTeaCard}>
              <span style={{ color: '#4CAF50', fontSize: '11px', fontWeight: '900' }}>
                 ⭐ {filtered.find(p => p.isDayTea)?.type === 'Чай' ? 'ЧАЙ ДНЯ' : 'КОФЕ ДНЯ'}
              </span>
              <h2 style={{ fontSize: '36px', margin: '12px 0' }}>{filtered.find(p => p.isDayTea)?.name}</h2>
              <p style={{ color: '#888' }}>{filtered.find(p => p.isDayTea)?.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            {["Все", "Чай", "Кофе"].map(c => (
              <div key={c} onClick={() => {setTopCategory(c); setActiveCategory("Все");}} style={{ ...badge, backgroundColor: topCategory === c ? '#4CAF50' : '#161816', color: topCategory === c ? '#000' : '#fff' }}>{c}</div>
            ))}
          </div>

          {(topCategory === "Чай" || topCategory === "Кофе") && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px' }}>
              <div onClick={() => setActiveCategory("Все")} style={{ ...badge, fontSize: '13px', backgroundColor: activeCategory === "Все" ? '#333' : '#161816' }}>Все виды</div>
              {(topCategory === "Чай" ? teaSubCategories : coffeeSubCategories).map(s => (
                <div key={s} onClick={() => setActiveCategory(s)} style={{ ...badge, fontSize: '13px', backgroundColor: activeCategory === s ? '#333' : '#161816' }}>{s}</div>
              ))}
            </div>
          )}

          {/* ПОДРАЗДЕЛЫ КРЕПОСТИ (РАБОТАЮТ И ДЛЯ ЧАЯ, И ДЛЯ КОФЕ) */}
          <div style={strengthFilterRow}>
            {STRENGTHS.map(s => (
              <div key={s} onClick={() => setActiveStrength(s)} style={{ ...badge, fontSize: '12px', padding: '8px 16px', backgroundColor: activeStrength === s ? '#4CAF50' : '#111', color: activeStrength === s ? '#000' : '#555' }}>{s}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedTea(p)} style={productRow}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{p.name} {p.isDayTea && "⭐"}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#555', fontSize: '13px' }}>{p.summary}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setFormData(p); setShowForm(true); }} style={{ color: '#4CAF50', cursor: 'pointer' }}>✎</span>
                      <span onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} style={{ color: '#ff7675', cursor: 'pointer' }}>✕</span>
                    </div>
                  )}
                  <div style={{ color: '#4CAF50', fontWeight: '900', fontSize: '11px', border: '1px solid #4CAF5044', padding: '4px 10px', borderRadius: '8px' }}>{p.strength}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ПРОДУМАННАЯ МАСТЕР-ПАНЕЛЬ (Quick Add Sidebar) */}
        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' }}>
            <div style={adminSidebar}>
              <h3 style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '25px', textAlign: 'center', fontWeight: '900' }}>БЫСТРОЕ ДОБАВЛЕНИЕ</h3>
              <input style={adminIn} placeholder="Название продукта" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select style={adminIn} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Чай">Чай</option>
                  <option value="Кофе">Кофе</option>
                </select>
                <select style={adminIn} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>
                  {STRENGTHS.filter(s => s !== "Все").map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input style={adminIn} placeholder="Регион (напр. Китай, Юньнань)" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
              <textarea style={{ ...adminIn, height: '80px' }} placeholder="Краткое описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <input style={adminIn} placeholder="URL фото" value={formData.img} onChange={e => setFormData({...formData, img: e.target.value})} />
              <button onClick={handleSave} style={saveBtn}>+ СОХРАНИТЬ В БАЗУ</button>
              <p style={{ fontSize: '11px', color: '#444', textAlign: 'center', marginTop: '15px', lineHeight: '1.5' }}>
                 Все изменения мгновенно увидят сотрудники. Детали и тесты можно настроить через <b>✎</b>.
              </p>
            </div>
          </aside>
        )}

        {/* ДЕТАЛИ ПРОДУКТА (МОДАЛКА) */}
        {selectedTea && (
          <div style={fullOverlay}>
            <div style={{ maxWidth: '750px', margin: '0 auto' }}>
              <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '30px', cursor: 'pointer', fontWeight: '900' }}>← ЗАКРЫТЬ</div>
              <h2 style={{ fontSize: '48px', color: '#4CAF50', margin: '0 0 10px 0' }}>{selectedTea.name}</h2>
              <div style={fullImageWrap}><img src={selectedTea.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={selectedTea.name} /></div>
              <p style={{ fontSize: '20px', lineHeight: '1.8', color: '#ccc', marginBottom: '40px' }}>{selectedTea.desc}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div style={infoBox}><div style={infoTag}>🌍 РЕГИОН</div>{selectedTea.region || '—'}</div>
                <div style={infoBox}><div style={infoTag}>🌡️ ЗАВАРИВАНИЕ</div>{selectedTea.brewGuide || selectedTea.info}</div>
                <div style={infoBox}><div style={infoTag}>💡 СОВЕТ</div>{selectedTea.advice || '—'}</div>
                <div style={infoBox}><div style={infoTag}>🔄 ОТЛИЧИЕ</div>{selectedTea.analogsDiff || '—'}</div>
              </div>

              <button onClick={() => { setQuizResults({}); setShowQuiz(true); }} style={checkBtn}>🧠 ПРОВЕРИТЬ СЕБЯ</button>
            </div>
          </div>
        )}

        {/* ТЕСТ ( overlay ) */}
        {showQuiz && selectedTea && (
          <div style={{ ...modalOverlay, zIndex: 30000 }}>
            <div style={modalContent}>
              <h3 style={{ color: '#4CAF50', marginBottom: '25px' }}>ТЕСТ: {selectedTea.name}</h3>
              {(selectedTea.quiz || [{q: "Профиль продукта понятен?", o: ["Да", "Нет", "Частично"], c: 0}]).map((q, idx) => (
                <div key={idx} style={{ marginBottom: '25px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>{q.q}</p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {q.o.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.c;
                      const isSelected = quizResults[selectedTea.id]?.includes(oIdx);
                      return (
                        <div key={oIdx} onClick={() => setQuizResults({...quizResults, [selectedTea.id]: [...(quizResults[selectedTea.id] || []), oIdx]})} style={{ padding: '18px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#000', borderRadius: '12px', cursor: 'pointer', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                          {opt} <span>{isSelected && (isCorrect ? '✅' : '❌')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div onClick={() => setShowQuiz(false)} style={{ textAlign: 'center', marginTop: '20px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ЗАВЕРШИТЬ ТЕСТ</div>
            </div>
          </div>
        )}

        {/* МОДАЛКА ПОЛНОГО РЕДАКТИРОВАНИЯ */}
        {showForm && editingId && (
          <div style={modalOverlay}>
            <div style={{ ...modalContent, maxWidth: '500px' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>ПОЛНЫЙ РЕДАКТОР</h2>
              <input style={adminIn} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <textarea style={{ ...adminIn, height: '100px' }} placeholder="Полное описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <input style={adminIn} placeholder="Регион" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
              <input style={adminIn} placeholder="Инструкция по завариванию" value={formData.brewGuide} onChange={e => setFormData({...formData, brewGuide: e.target.value})} />
              <input style={adminIn} placeholder="Что советовать клиенту" value={formData.advice} onChange={e => setFormData({...formData, advice: e.target.value})} />
              <label style={{ display: 'flex', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> ⭐ Сделать продуктом дня</label>
              <button onClick={handleSave} style={saveBtn}>ОБНОВИТЬ ДАННЫЕ</button>
              <div onClick={() => setShowForm(false)} style={{ textAlign: 'center', marginTop: '20px', color: '#666', cursor: 'pointer' }}>ОТМЕНА</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- СТИЛИ С ПРАВИЛЬНЫМИ ТИПАМИ TYPESCRIPT ---
const badge: React.CSSProperties = { padding: '10px 24px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' };
const dayTeaCard: React.CSSProperties = { background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '40px', borderRadius: '35px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '35px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' };
const strengthFilterRow: React.CSSProperties = { background: '#121412', padding: '12px', borderRadius: '20px', border: '1px solid #222', marginBottom: '25px', display: 'flex', gap: '10px', overflowX: 'auto' };
const productRow: React.CSSProperties = { background: '#161816', padding: '24px 30px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };
const adminSidebar: React.CSSProperties = { background: '#161816', padding: '30px', borderRadius: '35px', border: '1px solid #222' };
const adminIn: React.CSSProperties = { width: '100%', padding: '14px', background: '#000', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '15px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' };
const fullOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, padding: '40px 20px', overflowY: 'auto' };
const fullImageWrap: React.CSSProperties = { height: '300px', borderRadius: '30px', overflow: 'hidden', marginBottom: '30px' };
const infoBox: React.CSSProperties = { background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' };
const infoTag: React.CSSProperties = { color: '#4CAF50', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' };
const checkBtn: React.CSSProperties = { width: '100%', padding: '20px', background: 'transparent', color: '#4CAF50', border: '2px solid #4CAF50', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', fontSize: '16px', marginTop: '20px' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContent: React.CSSProperties = { background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' };