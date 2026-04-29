"use client";
import React, { useState, useEffect } from 'react';
// ВЕРНУЛИ ИМПОРТ НАВИГАЦИИ
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
  // НОВЫЕ ПОЛЯ
  region?: string;
  brewGuide?: string;
  advice?: string;
  analogsDiff?: string;
  quiz?: { q: string; o: string[]; c: number }[];
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

// --- ПОЛНАЯ РЕЗЕРВНАЯ БАЗА (15 СОРТОВ ЧАЯ + 15 СОРТОВ КОФЕ) ---
const INITIAL_DATABASE: Tea[] = [
  { 
    id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false,
    region: "Китай, пров. Чжэцзян, Ханчжоу", brewGuide: "75-80°C, методом пролива: 5г на 120мл. Первый пролив — 10 сек.", advice: "Предлагайте тем, кто любит свежесть и легкую сладость.", analogsDiff: "В отличие от Би Ло Чунь, имеет более маслянистую текстуру.",
    quiz: [{q: "Какая нота доминирует?", o: ["Дым", "Орех/Семечки", "Ягоды"], c: 1}, {q: "Температура заваривания?", o: ["100°C", "75°C", "60°C"], c: 1}]
  },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false, region: "Цзянсу", brewGuide: "80°C", advice: "Для ценителей аромата.", analogsDiff: "Более цветочный, чем Лунцзин.", quiz: [{q: "Форма листа?", o: ["Спираль", "Игла"], c: 0}] },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Аньхой", brewGuide: "85°C", advice: "Для эффектной подачи в стекле.", analogsDiff: "Самый крупный лист среди зеленых.", quiz: [{q: "Где растет?", o: ["Аньхой", "Юньнань"], c: 0}] },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "70°C", advice: "Чай для медитации.", analogsDiff: "Дороже и нежнее Бай Му Даня.", quiz: [{q: "Что в составе?", o: ["Листья", "Почки"], c: 1}] },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Фудин", brewGuide: "75°C", advice: "Базовый белый чай.", analogsDiff: "Более насыщенный, чем Инь Чжэнь.", quiz: [{q: "Название?", o: ["Пион", "Роза"], c: 0}] },
  { id: 101, name: "Эфиопия Иргачефф", type: "Кофе", category: "Арабика", strength: "Мягкий", info: "V60", summary: "Цветы, лимон, чайное тело.", desc: "Классика мытой Эфиопии.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Эфиопия, Иргачефф", brewGuide: "93°C, 1:16, помол как сахар.", advice: "Для тех, кто ищет легкость и кислотность.", analogsDiff: "Кислее Бразилии.", quiz: [{q: "Профиль?", o: ["Орех", "Цветы"], c: 1}] },
  { id: 102, name: "Бразилия Сантос", type: "Кофе", category: "Арабика", strength: "Средний", info: "Эспрессо", summary: "Орехи, шоколад.", desc: "Самый популярный сорт в мире.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Бразилия", brewGuide: "94°C, 18г кофе -> 36г напитка.", advice: "Идеально с молоком.", analogsDiff: "Менее кислый, чем Эфиопия.", quiz: [{q: "Кислотность?", o: ["Низкая", "Высокая"], c: 0}] },
  { id: 103, name: "Колумбия Супремо", type: "Кофе", category: "Арабика", strength: "Средний", info: "Фильтр", summary: "Красное яблоко, карамель.", desc: "Сбалансированный кофе.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Колумбия", brewGuide: "92°C", advice: "Универсальный сорт.", analogsDiff: "Слаще Вьетнама.", quiz: [{q: "Размер зерна?", o: ["Крупный", "Мелкий"], c: 0}] },
  { id: 104, name: "Кения АА", type: "Кофе", category: "Арабика", strength: "Крепкий", info: "V60", summary: "Смородина, томаты.", desc: "Яркая сочная кислотность.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Кения", brewGuide: "94°C", advice: "Для экстремалов в мире кофе.", analogsDiff: "Ярче Колумбии.", quiz: [{q: "Нота?", o: ["Шоколад", "Ягоды"], c: 1}] },
  { id: 105, name: "Суматра Манделин", type: "Кофе", category: "Азия", strength: "Крепкий", info: "Френч-пресс", summary: "Землистый, специи.", desc: "Кофе с минимальной кислотностью.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Индонезия", brewGuide: "95°C", advice: "Для любителей плотности.", analogsDiff: "Похож по духу на Шу Пуэр.", quiz: [{q: "Тело?", o: ["Легкое", "Плотное"], c: 1}] },
  { id: 106, name: "Коста-Рика Тарразу", type: "Кофе", category: "Арабика", strength: "Средний", info: "Фильтр", summary: "Абрикос, мед.", desc: "Высокогорный сорт.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Коста-Рика", brewGuide: "92°C", advice: "Сладкий кофе.", analogsDiff: "Мягче Кении.", quiz: [{q: "Высота?", o: ["Высоко", "Низко"], c: 0}] },
  { id: 107, name: "Гватемала Антигуа", type: "Кофе", category: "Арабика", strength: "Средний", info: "Воронка", summary: "Дымный шоколад.", desc: "Вулканические почвы.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Гватемала", brewGuide: "93°C", advice: "Для любителей классики.", analogsDiff: "Более дымный, чем Бразилия.", quiz: [{q: "Почва?", o: ["Вулканическая", "Глина"], c: 0}] },
  { id: 108, name: "Вьетнам Робуста", type: "Кофе", category: "Робуста", strength: "Крепкий", info: "Фин", summary: "Горький шоколад, табак.", desc: "Максимальный кофеин.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Вьетнам", brewGuide: "96°C", advice: "Для тех, кому нужно проснуться.", analogsDiff: "Горьче арабики.", quiz: [{q: "Кофеин?", o: ["Много", "Мало"], c: 0}] },
  { id: 109, name: "Гондурас SHG", type: "Кофе", category: "Арабика", strength: "Средний", info: "Фильтр", summary: "Груша, орех.", desc: "Сорт строго высокогорного выращивания.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Гондурас", brewGuide: "93°C", advice: "Сбалансированный завтрак.", analogsDiff: "Кислее Бразилии.", quiz: [{q: "Высота?", o: ["Низкая", "Высокая"], c: 1}] },
  { id: 110, name: "Сальвадор Пакамара", type: "Кофе", category: "Арабика", strength: "Мягкий", info: "V60", summary: "Тропики, сладость.", desc: "Крупные зерна.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Сальвадор", brewGuide: "91°C", advice: "Для гурманов.", analogsDiff: "Очень крупные зерна.", quiz: [{q: "Зерно?", o: ["Крупное", "Среднее"], c: 0}] },
  { id: 111, name: "Никарагуа Хинотега", type: "Кофе", category: "Арабика", strength: "Средний", info: "Турка", summary: "Кедр, какао.", desc: "Плотный шоколадный профиль.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Никарагуа", brewGuide: "94°C", advice: "Хорошо в турке.", analogsDiff: "Менее кислый чем Коста-Рика.", quiz: [{q: "Горчинка?", o: ["Есть", "Нет"], c: 0}] },
  { id: 112, name: "Панама Гейша", type: "Кофе", category: "Премиум", strength: "Мягкий", info: "Калита", summary: "Жасмин, бергамот.", desc: "Самый дорогой кофе в мире.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Панама", brewGuide: "90°C", advice: "Для особых случаев.", analogsDiff: "Схож с элитным зеленым чаем.", quiz: [{q: "Аромат?", o: ["Земля", "Жасмин"], c: 1}] },
  { id: 113, name: "Руанда Бурбон", type: "Кофе", category: "Арабика", strength: "Мягкий", info: "Фильтр", summary: "Красная смородина.", desc: "Сладкий ягодный кофе.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Руанда", brewGuide: "92°C", advice: "Для ценителей ягод.", analogsDiff: "Похож на Эфиопию.", quiz: [{q: "Сладость?", o: ["Высокая", "Низкая"], c: 0}] },
  { id: 114, name: "Бурунди Мытый", type: "Кофе", category: "Арабика", strength: "Средний", info: "Аэропресс", summary: "Грейпфрут, специи.", desc: "Терпкий ягодный вкус.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Бурунди", brewGuide: "94°C", advice: "Для Аэропресса.", analogsDiff: "Более терпкий чем Руанда.", quiz: [{q: "Кислотность?", o: ["Ягодная", "Цитрус"], c: 1}] },
  { id: 115, name: "Танзания Пиберри", type: "Кофе", category: "Спешиалти", strength: "Средний", info: "V60", summary: "Лемонграсс, вишня.", desc: "Зерна круглой формы.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Танзания", brewGuide: "93°C", advice: "Показать гостю круглые зерна.", analogsDiff: "Яркая кислотность.", quiz: [{q: "Форма зерна?", o: ["Плоское", "Круглое"], c: 1}] },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: false },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки из гор Уи.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из почек.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классический юньнаньский чай.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Шен пуэр с выдержкой более 10 лет.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false }
];

export default function SearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [teaTypes, setTeaTypes] = useState<string[]>(["Зеленый", "Белый", "Улун", "Красный", "Пуэр", "Кофе"]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeStrength, setActiveStrength] = useState("Все");
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ СИСТЕМЫ РАЗДЕЛОВ
  const [topCategory, setTopCategory] = useState("Все");

  // Состояния для теста
  const [quizResults, setQuizResults] = useState<{[key: number]: number[]}>({});
  const [showQuiz, setShowQuiz] = useState(false);

  // Модалки
  const [showTeaForm, setShowTeaForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTeaDeleteModal, setShowTeaDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState("");
  const [teaIdToDelete, setTeaIdToDelete] = useState<number | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  const syncData = async () => {
    const cachedTeas = localStorage.getItem('tea_master_local_v1');
    const cachedTypes = localStorage.getItem('tea_types_local_v1');
    if (cachedTeas) setTeas(JSON.parse(cachedTeas)); else setTeas(INITIAL_DATABASE);
    if (cachedTypes) setTeaTypes(JSON.parse(cachedTypes));

    try {
      const { data } = await supabase.from('teas').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        setTeas(data);
        localStorage.setItem('tea_master_local_v1', JSON.stringify(data));
      }
    } catch (e) { console.log("Cloud offline"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    syncData();
    setIsAdmin(localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('userRole') === 'admin');
    setIsMounted(true);
  }, []);

  const resetTeaForm = () => {
    setFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    setEditingId(null);
  };

  const handleSaveTea = async () => {
    let newList = [...teas];
    const newId = editingId || Date.now();
    const newTeaData = { ...formData, id: newId };

    if (formData.isDayTea) newList = newList.map(t => ({ ...t, isDayTea: false }));
    if (editingId) newList = newList.map(t => t.id === editingId ? newTeaData : t);
    else newList.push(newTeaData as Tea);

    setTeas(newList);
    localStorage.setItem('tea_master_local_v1', JSON.stringify(newList));
    setShowTeaForm(false);
    
    try {
      if (formData.isDayTea) await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
      if (editingId) await supabase.from('teas').update(formData).eq('id', editingId);
      else await supabase.from('teas').insert([formData]);
    } catch (e) {}
    resetTeaForm();
  };

  const toggleDayTea = async (e: React.MouseEvent, tea: Tea) => {
    e.stopPropagation();
    const newList = teas.map(t => ({ ...t, isDayTea: t.id === tea.id ? !t.isDayTea : false }));
    setTeas(newList);
    localStorage.setItem('tea_master_local_v1', JSON.stringify(newList));
    try {
      await supabase.from('teas').update({ isDayTea: false }).neq('id', 0);
      await supabase.from('teas').update({ isDayTea: !tea.isDayTea }).eq('id', tea.id);
    } catch (e) {}
  };

  const confirmDeleteTea = async () => {
    if (teaIdToDelete) {
      const newList = teas.filter(t => t.id !== teaIdToDelete);
      setTeas(newList);
      localStorage.setItem('tea_master_local_v1', JSON.stringify(newList));
      setShowTeaDeleteModal(false);
      try { await supabase.from('teas').delete().eq('id', teaIdToDelete); } catch(e){}
    }
  };

  const handleAddType = () => {
    if (newTypeName && !teaTypes.includes(newTypeName)) {
      const up = [...teaTypes, newTypeName];
      setTeaTypes(up);
      localStorage.setItem('tea_types_local_v1', JSON.stringify(up));
      setNewTypeName(""); setShowTypeForm(false);
    }
  };

  const deleteCategory = () => {
    const up = teaTypes.filter(t => t !== typeToDelete);
    setTeaTypes(up);
    localStorage.setItem('tea_types_local_v1', JSON.stringify(up));
    setShowDeleteModal(false);
  };

  const filteredTeas = teas.filter(t => {
    const mSearch = t.name.toLowerCase().includes(search.toLowerCase());
    
    // Новая логика фильтрации по уровням
    let mLevel = true;
    if (topCategory === "Кофе") mLevel = t.type === "Кофе";
    else if (topCategory === "Чай") {
      if (activeCategory === "Все") mLevel = t.type !== "Кофе";
      else mLevel = t.type === activeCategory;
    } else {
      mLevel = true; // "Все"
    }

    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mLevel && mStr;
  });

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      {/* ВЕРНУЛИ КОМПОНЕНТ НАВИГАЦИИ */}
      <Navigation />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 20px', display: 'grid', gridTemplateColumns: isAdmin ? '1fr 320px' : '1fr', gap: '40px', alignItems: 'start' } as any}>
        <section>
          {/* ЧАЙ ДНЯ ⭐ */}
          {teas.find(t => t.isDayTea) && activeCategory === "Все" && !search && (
            <div onClick={() => setSelectedTea(teas.find(t => t.isDayTea)!)} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '35px', borderRadius: '35px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' } as any}>
              <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
              <h2 style={{ fontSize: '32px', margin: '10px 0' }}>{teas.find(t => t.isDayTea)?.name}</h2>
              <p style={{ color: '#aaa' }}>{teas.find(t => t.isDayTea)?.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск сорта..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle as any} />
          
          {/* НОВАЯ СИСТЕМА ГЛАВНЫХ РАЗДЕЛОВ */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div onClick={() => {setTopCategory("Все"); setActiveCategory("Все");}} style={{ ...typeBadge, backgroundColor: topCategory === "Все" ? '#4CAF50' : '#161816', color: topCategory === "Все" ? '#000' : '#fff' } as any}>Все</div>
            <div onClick={() => {setTopCategory("Чай"); setActiveCategory("Все");}} style={{ ...typeBadge, backgroundColor: topCategory === "Чай" ? '#4CAF50' : '#161816', color: topCategory === "Чай" ? '#000' : '#fff' } as any}>Чай</div>
            <div onClick={() => {setTopCategory("Кофе"); setActiveCategory("Кофе");}} style={{ ...typeBadge, backgroundColor: topCategory === "Кофе" ? '#4CAF50' : '#161816', color: topCategory === "Кофе" ? '#000' : '#fff' } as any}>Кофе</div>
          </div>

          {/* ПОДРАЗДЕЛЫ (ВИДЫ ЧАЯ) - ПОЯВЛЯЮТСЯ ТОЛЬКО ЕСЛИ ВЫБРАН "ЧАЙ" */}
          {topCategory === "Чай" && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px', alignItems: 'center' } as any}>
              <div onClick={() => setActiveCategory("Все")} style={{ ...typeBadge, padding: '8px 18px', fontSize: '13px', backgroundColor: activeCategory === "Все" ? '#333' : '#161816', color: '#fff', border: '1px solid #333' } as any}>Все виды</div>
              {teaTypes.filter(type => type !== "Кофе").map(type => (
                <div key={type} style={{ position: 'relative' }}>
                  <div onClick={() => {setActiveCategory(type); setActiveStrength("Все");}} style={{ ...typeBadge, padding: '8px 18px', fontSize: '13px', backgroundColor: activeCategory === type ? '#333' : '#161816', color: '#fff', border: '1px solid #333' } as any}>{type}</div>
                  {isAdmin && <span onClick={(e) => { e.stopPropagation(); setTypeToDelete(type); setShowDeleteModal(true); }} style={deleteTypeBtn as any}>✕</span>}
                </div>
              ))}
              {isAdmin && <div onClick={() => setShowTypeForm(true)} style={{ ...typeBadge, padding: '8px 18px', fontSize: '13px', border: '1px dashed #4CAF50', color: '#4CAF50' } as any}>+</div>}
            </div>
          )}

          {activeCategory !== "Все" && (
            <div style={{ background: '#121412', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '25px', display: 'flex', gap: '10px' } as any}>
                {STRENGTHS.map(str => (
                  <div key={str} onClick={() => setActiveStrength(str)} style={{ padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', backgroundColor: activeStrength === str ? '#4CAF50' : '#1a1a1a', color: activeStrength === str ? '#000' : '#666' } as any}>{str}</div>
                ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredTeas.map(tea => (
              <div key={tea.id} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <div onClick={() => { setSelectedTea(tea); setShowQuiz(false); }} style={{ flex: 1, cursor: 'pointer' }}>
                  <h3 style={{ margin: 0 }}>{tea.name}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {isAdmin && (
                    <>
                      <div onClick={(e) => toggleDayTea(e, tea)} style={{ cursor: 'pointer', fontSize: '22px', color: tea.isDayTea ? '#4CAF50' : '#333' }}>⭐</div>
                      <div onClick={(e:any) => {e.stopPropagation(); setEditingId(tea.id); setFormData(tea); setShowTeaForm(true);}} style={{ cursor: 'pointer', color: '#4CAF50', fontSize: '20px' }}>✎</div>
                      <div onClick={(e:any) => {e.stopPropagation(); setTeaIdToDelete(tea.id); setShowTeaDeleteModal(true);}} style={{ cursor: 'pointer', color: '#ff5252', fontSize: '20px' }}>✕</div>
                    </>
                  )}
                  {!isAdmin && <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px' }}>{tea.strength}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ПРАВАЯ ПАНЕЛЬ (МАСТЕР) */}
        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222' } as any}>
              <h3 style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '20px' }}>МАСТЕР-ПАНЕЛЬ</h3>
              <button onClick={() => { resetTeaForm(); setShowTeaForm(true); }} style={btnMain as any}>+ ДОБАВИТЬ ЧАЙ/КОФЕ</button>
            </div>
          </aside>
        )}

        {/* МОДАЛКИ (ТИП / УДАЛЕНИЕ / ЧАЙ) */}
        {showTypeForm && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Новый тип</h2>
              <input style={inS as any} value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Название..." />
              <button onClick={handleAddType} style={btnMain as any}>СОХРАНИТЬ</button>
              <button onClick={() => setShowTypeForm(false)} style={btnCancel as any}>Отмена</button>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Удалить категорию?</h2>
              <button onClick={deleteCategory} style={{...btnMain, background: '#ff7675'} as any}>УДАЛИТЬ</button>
              <button onClick={() => setShowDeleteModal(false)} style={btnCancel as any}>Отмена</button>
            </div>
          </div>
        )}

        {showTeaDeleteModal && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Удалить этот сорт?</h2>
              <button onClick={confirmDeleteTea} style={{...btnMain, background: '#ff7675'} as any}>ДА, УДАЛИТЬ</button>
              <button onClick={() => {setShowTeaDeleteModal(false); setTeaIdToDelete(null);}} style={btnCancel as any}>ОТМЕНА</button>
            </div>
          </div>
        )}

        {showTeaForm && (
          <div style={modalOverlay as any}>
            <div style={modalContent as any}>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{editingId ? 'Редактировать' : 'Новая позиция'}</h2>
              <input style={inS as any} placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}>
                <select style={inS as any} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>{teaTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select style={inS as any} value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})}>{["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <textarea style={{...inS, height: '100px'} as any} placeholder="Описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              <label style={{display:'flex', gap:'10px', marginBottom:'20px', cursor:'pointer'}}><input type="checkbox" checked={formData.isDayTea} onChange={e => setFormData({...formData, isDayTea: e.target.checked})} /> Рекомендация дня ⭐</label>
              <button onClick={handleSaveTea} style={btnMain as any}>СОХРАНИТЬ</button>
              <button onClick={() => { setShowTeaForm(false); resetTeaForm(); }} style={btnCancel as any}>Отмена</button>
            </div>
          </div>
        )}

        {selectedTea && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 12000, padding: '40px 20px', overflowY: 'auto' } as any}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>← Закрыть</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '30px', marginBottom: '40px' } as any}>
                <div>
                  <h2 style={{ fontSize: '42px', color: '#4CAF50', margin: '0 0 10px 0' }}>{selectedTea.name}</h2>
                  <div style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>{selectedTea.type} • {selectedTea.strength}</div>
                  <p style={{ lineHeight: '1.8', color: '#ddd', fontSize: '18px' }}>{selectedTea.desc}</p>
                </div>
                <img src={selectedTea.img} style={{ width: '100%', borderRadius: '25px', objectFit: 'cover', height: '200px', border: '1px solid #333' } as any} alt={selectedTea.name} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' } as any}>
                <div style={infoBlock}>
                  <div style={infoLabel}>🌍 РЕГИОН</div>
                  <div style={{ color: '#fff' }}>{selectedTea.region || 'Не указано'}</div>
                </div>
                <div style={infoBlock}>
                  <div style={infoLabel}>🌡️ КАК ЗАВАРИВАТЬ</div>
                  <div style={{ color: '#fff' }}>{selectedTea.brewGuide || selectedTea.info}</div>
                </div>
                <div style={infoBlock}>
                  <div style={infoLabel}>💡 ЧТО СОВЕТОВАТЬ</div>
                  <div style={{ color: '#fff' }}>{selectedTea.advice || 'Классический профиль'}</div>
                </div>
                <div style={infoBlock}>
                  <div style={infoLabel}>🔄 ОТЛИЧИЕ</div>
                  <div style={{ color: '#fff' }}>{selectedTea.analogsDiff || 'Уникальный лот'}</div>
                </div>
              </div>

              {/* ТЕСТ */}
              <div style={{ background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid #222' } as any}>
                {!showQuiz ? (
                  <button onClick={() => setShowQuiz(true)} style={btnMain as any}>🧠 ПРОВЕРИТЬ СЕБЯ</button>
                ) : (
                  <div>
                    <h3 style={{ marginBottom: '25px', color: '#4CAF50' }}>МИНИ-ТЕСТ</h3>
                    {(selectedTea.quiz || [{q: "Это отличный сорт?", o: ["Да", "Нет"], c: 0}]).map((q, qIdx) => (
                      <div key={qIdx} style={{ marginBottom: '30px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>{qIdx + 1}. {q.q}</p>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {q.o.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.c;
                            const isSelected = quizResults[selectedTea.id]?.includes(oIdx);
                            return (
                              <div 
                                key={oIdx} 
                                onClick={() => {
                                  const current = quizResults[selectedTea.id] || [];
                                  setQuizResults({...quizResults, [selectedTea.id]: [...current, oIdx]});
                                }}
                                style={{ 
                                  padding: '15px 20px', 
                                  background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  border: '1px solid #333'
                                } as any}
                              >
                                {opt} {isSelected && (isCorrect ? '✅' : '❌')}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setShowQuiz(false)} style={btnCancel as any}>Завершить тест</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// СТИЛИ
const typeBadge: React.CSSProperties = { padding: '10px 24px', borderRadius: '25px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', transition: '0.2s' };
const deleteTypeBtn: React.CSSProperties = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff7675', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0d0f0d' };
const inS = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContent = { background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', maxWidth: '450px', border: '1px solid #333' };
const btnMain = { width: '100%', padding: '15px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' };
const btnCancel = { width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center', marginTop: '15px' };
const inputStyle = { width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' };
const infoBlock = { background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' };
const infoLabel = { color: '#4CAF50', fontSize: '11px', fontWeight: 'bold' as any, marginBottom: '8px', letterSpacing: '1px' };