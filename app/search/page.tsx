"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
  region?: string;
  brewGuide?: string;
  advice?: string;
  analogsDiff?: string;
  quiz?: { q: string; o: string[]; c: number }[];
}

const STRENGTHS = ["Все", "Мягкий", "Средний", "Крепкий"];

// --- МАКСИМАЛЬНО ИНФОРМАТИВНАЯ БАЗА (30 ПОЗИЦИЙ) ---
const INITIAL_DATABASE: Tea[] = [
  // ЧАЙ (15 позиций)
  { 
    id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Король зеленых чаев. Плоский лист, ручная обжарка в котлах.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false,
    region: "Ханчжоу, Сиху", brewGuide: "75°C, 2-3 мин", advice: "Для ценителей классики и мягкости.", analogsDiff: "Сладковатый ореховый финиш.",
    quiz: [{q: "Метод обработки?", o: ["Пар", "Обжарка в котле", "Сушка на солнце"], c: 1}]
  },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спирали с ворсом. Растет среди фруктовых садов.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false, region: "Цзянсу", brewGuide: "80°C", advice: "Любителям ярких ароматов.", analogsDiff: "Более цветочный, чем Лунцзин.", quiz: [{q: "Где растет?", o: ["В лесу", "Среди фруктовых садов"], c: 1}] },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья. Уникальный внешний вид.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Аньхой", brewGuide: "85°C", advice: "Для тех, кто ищет эффектную подачу.", analogsDiff: "Самый крупный лист.", quiz: [{q: "Размер листа?", o: ["Мелкий", "Средний", "Очень крупный"], c: 2}] },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только верхушечные почки. Самый нежный белый чай.", img: "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "70°C", advice: "Для утреннего чаепития.", analogsDiff: "Высший сорт белого чая.", quiz: [{q: "Что в составе?", o: ["Листья", "Почки"], c: 1}] },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион. Сочетание почки и двух верхних листьев.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Фудин", brewGuide: "75°C", advice: "Баланс нежности и вкуса.", analogsDiff: "Насыщеннее Инь Чжэня.", quiz: [{q: "Как переводится?", o: ["Белый лотос", "Белый пион"], c: 1}] },
  { id: 6, name: "Те Гуань Инь", type: "Улун", category: "Улун", strength: "Мягкий", info: "85°C", summary: "Орхидея и сирень.", desc: "Классический светлый улун. Плотные изумрудные гранулы.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: true, region: "Аньси", brewGuide: "85°C", advice: "Для релаксации.", analogsDiff: "Сливочный, цветочный профиль.", quiz: [{q: "Степень ферментации?", o: ["Светлый", "Темный"], c: 0}] },
  { id: 7, name: "Да Хун Пао", type: "Улун", category: "Улун", strength: "Крепкий", info: "95°C", summary: "Огонь, дым, карамель.", desc: "Утесный темный улун сильной прожарки.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Уишань", brewGuide: "95°C", advice: "Для вечерних бесед.", analogsDiff: "Мощная прожарка.", quiz: [{q: "Где растет?", o: ["В горах", "На равнине"], c: 0}] },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Улун", strength: "Средний", info: "90°C", summary: "Печеные яблоки, кислинка.", desc: "Чай, прошедший ферментацию без доступа кислорода.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Тайвань", brewGuide: "90°C", advice: "Для концентрации внимания.", analogsDiff: "Содержит ГАМК.", quiz: [{q: "Главная особенность?", o: ["Цвет", "ГАМК (GABA)"], c: 1}] },
  { id: 9, name: "Дянь Хун", type: "Красный", category: "Красный", strength: "Средний", info: "95°C", summary: "Мед и сухофрукты.", desc: "Юньнаньский красный чай с обилием золотистых почек.", img: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=800", isDayTea: false, region: "Юньнань", brewGuide: "95°C", advice: "Классический согревающий чай.", analogsDiff: "Более сладкий, чем Сяо Чжун.", quiz: [{q: "Цвет почек?", o: ["Черные", "Золотистые"], c: 1}] },
  { id: 10, name: "Лапсанг Сушонг", type: "Красный", category: "Красный", strength: "Крепкий", info: "95°C", summary: "Дым, чернослив, костер.", desc: "Копченый на сосновых дровах красный чай.", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "95°C", advice: "Для любителей необычных вкусов.", analogsDiff: "Характерный дегтярный аромат.", quiz: [{q: "Чем пахнет?", o: ["Цветами", "Дымом/Костром"], c: 1}] },
  { id: 11, name: "Шу Пуэр", type: "Пуэр", category: "Пуэр", strength: "Крепкий", info: "100°C", summary: "Земля, орехи, кора.", desc: "Чай ускоренной ферментации. Плотный, темный настой.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false, region: "Юньнань", brewGuide: "100°C", advice: "Для бодрости.", analogsDiff: "Не дает горечи при перестое.", quiz: [{q: "Цвет настоя?", o: ["Прозрачный", "Черный/Нефтяной"], c: 1}] },
  { id: 12, name: "Шен Пуэр", type: "Пуэр", category: "Пуэр", strength: "Средний", info: "90°C", summary: "Курага, дымок, свежесть.", desc: "Естественно состаренный пуэр. Профиль меняется со временем.", img: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?q=80&w=800", isDayTea: false, region: "Мэнхай", brewGuide: "90°C", advice: "Ценителям сложных переходов.", analogsDiff: "Фруктовая кислинка.", quiz: [{q: "Вкус со временем?", o: ["Портится", "Становится глубже"], c: 1}] },
  { id: 13, name: "Сяо Чжун", type: "Красный", category: "Красный", strength: "Средний", info: "95°C", summary: "Хлеб, ржаная корочка.", desc: "Красный чай без копчения. Глубокий хлебный вкус.", img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=800", isDayTea: false, region: "Уишань", brewGuide: "95°C", advice: "Уютный вечерний чай.", analogsDiff: "Мягче Лапсанга.", quiz: [{q: "Нота?", o: ["Хлебная", "Морская"], c: 0}] },
  { id: 14, name: "Най Сян Улун", type: "Улун", category: "Улун", strength: "Мягкий", info: "85°C", summary: "Сливки, карамель.", desc: "Молочный улун. Ароматизированный сорт.", img: "https://images.unsplash.com/photo-1594631252845-29fc4586d517?q=80&w=800", isDayTea: false, region: "Фуцзянь", brewGuide: "85°C", advice: "Для начинающих путь в чай.", analogsDiff: "Яркий молочный аромат.", quiz: [{q: "Аромат?", o: ["Древесный", "Молочно-сливочный"], c: 1}] },
  { id: 15, name: "Габа Изумруд", type: "Улун", category: "Улун", strength: "Средний", info: "90°C", summary: "Ягоды, винная нота.", desc: "Светлая габа слабой прожарки. Травянисто-ягодный профиль.", img: "https://images.unsplash.com/photo-1544787210-2213d2427517?q=80&w=800", isDayTea: false, region: "Тайвань", brewGuide: "90°C", advice: "Для спокойного отдыха.", analogsDiff: "Кислее обычного улуна.", quiz: [{q: "Профиль?", o: ["Землистый", "Ягодно-кислый"], c: 1}] },

  // КОФЕ (15 позиций)
  { id: 101, name: "Эфиопия Иргачефф", type: "Кофе", category: "Кофе", strength: "Мягкий", info: "V60", summary: "Бергамот, жасмин, лимон.", desc: "Высокогорная арабика с чайным телом.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Эфиопия", brewGuide: "93°C", advice: "Любителям легкого кофе.", analogsDiff: "Высокая кислотность.", quiz: [{q: "Нота?", o: ["Шоколад", "Цветы/Цитрус"], c: 1}] },
  { id: 102, name: "Бразилия Сантос", type: "Кофе", category: "Кофе", strength: "Средний", info: "Эспрессо", summary: "Орехи, молочный шоколад.", desc: "Классический сбалансированный вкус без лишней кислоты.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Бразилия", brewGuide: "94°C", advice: "Идеально с молоком.", analogsDiff: "Низкая кислотность.", quiz: [{q: "Основная нота?", o: ["Орехово-шоколадная", "Ягодная"], c: 0}] },
  { id: 103, name: "Колумбия Супремо", type: "Кофе", category: "Кофе", strength: "Средний", info: "Фильтр", summary: "Карамель, красное яблоко.", desc: "Сорт с крупным зерном и чистым вкусом.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Колумбия", brewGuide: "92°C", advice: "Универсальный выбор.", analogsDiff: "Сладкий профиль.", quiz: [{q: "Кислотность?", o: ["Яблочная", "Лимонная"], c: 0}] },
  { id: 104, name: "Кения АА", type: "Кофе", category: "Кофе", strength: "Крепкий", info: "V60", summary: "Смородина, вишня, томаты.", desc: "Самый яркий кофе с винной кислотностью.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Кения", brewGuide: "94°C", advice: "Для кофейных гурманов.", analogsDiff: "Яркая ягодность.", quiz: [{q: "Главная нота?", o: ["Орех", "Черная смородина"], c: 1}] },
  { id: 105, name: "Суматра Манделин", type: "Кофе", category: "Кофе", strength: "Крепкий", info: "Френч-пресс", summary: "Специи, табак, дерево.", desc: "Плотный, мужской кофе с низкой кислотностью.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Индонезия", brewGuide: "95°C", advice: "Любителям горечи и плотности.", analogsDiff: "Очень землистый.", quiz: [{q: "Тело кофе?", o: ["Легкое", "Плотное/Тяжелое"], c: 1}] },
  { id: 106, name: "Коста-Рика Тарразу", type: "Кофе", category: "Кофе", strength: "Средний", info: "Фильтр", summary: "Абрикос, коричневый сахар.", desc: "Мягкий кофе с фруктовым послевкусием.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Коста-Рика", brewGuide: "92°C", advice: "Сладкий утренний фильтр.", analogsDiff: "Сбалансирован.", quiz: [{q: "Нота?", o: ["Фруктовая", "Земляная"], c: 0}] },
  { id: 107, name: "Гватемала Антигуа", type: "Кофе", category: "Кофе", strength: "Средний", info: "Воронка", summary: "Дым, темный шоколад.", desc: "Вулканические почвы дают уникальный дымный оттенок.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Гватемала", brewGuide: "93°C", advice: "Для ценителей шоколада.", analogsDiff: "Дымное послевкусие.", quiz: [{q: "Почва?", o: ["Глина", "Вулканическая"], c: 1}] },
  { id: 108, name: "Вьетнам Робуста", type: "Кофе", category: "Кофе", strength: "Крепкий", info: "Фин", summary: "Табак, злаки, кофеин.", desc: "Горький кофе для максимальной бодрости.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Вьетнам", brewGuide: "96°C", advice: "Сгущенка сгладит горечь.", analogsDiff: "Больше кофеина.", quiz: [{q: "Вид зерна?", o: ["Арабика", "Робуста"], c: 1}] },
  { id: 109, name: "Гондурас SHG", type: "Кофе", category: "Кофе", strength: "Средний", info: "Фильтр", summary: "Кедр, карамель.", desc: "Кофе строго высокогорного выращивания.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Гондурас", brewGuide: "93°C", advice: "Повседневный выбор.", analogsDiff: "Древесные ноты.", quiz: [{q: "Маркировка SHG?", o: ["Низкогорный", "Высокогорный"], c: 1}] },
  { id: 110, name: "Сальвадор Пакамара", type: "Кофе", category: "Кофе", strength: "Мягкий", info: "V60", summary: "Тропики, сладость.", desc: "Гибридный сорт с очень крупными зернами.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Сальвадор", brewGuide: "91°C", advice: "Для гурманов.", analogsDiff: "Крупное зерно.", quiz: [{q: "Размер зерна?", o: ["Крупный", "Мелкий"], c: 0}] },
  { id: 111, name: "Никарагуа Хинотега", type: "Кофе", category: "Кофе", strength: "Средний", info: "Турка", summary: "Какао, мед.", desc: "Плотный шоколадный профиль.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Никарагуа", brewGuide: "94°C", advice: "Хорошо в турке.", analogsDiff: "Мягкая шоколадность.", quiz: [{q: "Нота?", o: ["Какао", "Бергамот"], c: 0}] },
  { id: 112, name: "Панама Гейша", type: "Кофе", category: "Кофе", strength: "Мягкий", info: "Калита", summary: "Бергамот, жасмин.", desc: "Самый элитный и дорогой кофе в мире.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Панама", brewGuide: "90°C", advice: "Особый случай.", analogsDiff: "Схож с чаем.", quiz: [{q: "Аромат?", o: ["Шоколадный", "Цветочный"], c: 1}] },
  { id: 113, name: "Руанда Бурбон", type: "Кофе", category: "Кофе", strength: "Мягкий", info: "Фильтр", summary: "Красная смородина.", desc: "Сладкий ягодный кофе.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800", isDayTea: false, region: "Руанда", brewGuide: "92°C", advice: "Любителям ягод.", analogsDiff: "Чистый вкус.", quiz: [{q: "Кислотность?", o: ["Высокая", "Низкая"], c: 0}] },
  { id: 114, name: "Бурунди Мытый", type: "Кофе", category: "Кофе", strength: "Средний", info: "Аэропресс", summary: "Грейпфрут, травы.", desc: "Терпкий цитрусовый вкус.", img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800", isDayTea: false, region: "Бурунди", brewGuide: "94°C", advice: "Бодрящий фильтр.", analogsDiff: "Травянистые ноты.", quiz: [{q: "Нота?", o: ["Цитрусовая", "Ореховая"], c: 0}] },
  { id: 115, name: "Танзания Пиберри", type: "Кофе", category: "Кофе", strength: "Средний", info: "V60", summary: "Вишня, лемонграсс.", desc: "Зерна круглой формы (мутация). Яркая кислотность.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800", isDayTea: false, region: "Танзания", brewGuide: "93°C", advice: "Показать гостю форму зерна.", analogsDiff: "Зерно-горошина.", quiz: [{q: "Форма зерна?", o: ["Плоское", "Круглое (Пиберри)"], c: 1}] }
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
  const [topCategory, setTopCategory] = useState("Все");
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
    let mLevel = true;
    if (topCategory === "Кофе") mLevel = t.type === "Кофе";
    else if (topCategory === "Чай") {
      if (activeCategory === "Все") mLevel = t.type !== "Кофе";
      else mLevel = t.type === activeCategory;
    }
    const mStr = activeStrength === "Все" || t.strength === activeStrength;
    return mSearch && mLevel && mStr;
  });

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 20px', display: 'grid', gridTemplateColumns: isAdmin ? '1fr 320px' : '1fr', gap: '40px', alignItems: 'start' } as any}>
        <section>
          {teas.find(t => t.isDayTea) && activeCategory === "Все" && !search && (
            <div onClick={() => {setSelectedTea(teas.find(t => t.isDayTea)!); setShowQuiz(false);}} style={{ background: 'linear-gradient(135deg, #1b3d1d 0%, #161816 100%)', padding: '35px', borderRadius: '35px', border: '1px solid #4CAF50', cursor: 'pointer', marginBottom: '35px' } as any}>
              <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>⭐ РЕКОМЕНДАЦИЯ ДНЯ</span>
              <h2 style={{ fontSize: '32px', margin: '10px 0' }}>{teas.find(t => t.isDayTea)?.name}</h2>
              <p style={{ color: '#aaa' }}>{teas.find(t => t.isDayTea)?.summary}</p>
            </div>
          )}

          <input type="text" placeholder="Поиск сорта..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle as any} />
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            {["Все", "Чай", "Кофе"].map(cat => (
              <div key={cat} onClick={() => {setTopCategory(cat); setActiveCategory("Все");}} style={{ ...typeBadge, backgroundColor: topCategory === cat ? '#4CAF50' : '#161816', color: topCategory === cat ? '#000' : '#fff' } as any}>{cat}</div>
            ))}
          </div>

          {topCategory === "Чай" && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '15px' } as any}>
              {teaTypes.filter(type => type !== "Кофе").map(type => (
                <div key={type} onClick={() => setActiveCategory(type)} style={{ ...typeBadge, backgroundColor: activeCategory === type ? '#333' : '#161816', color: '#fff', border: '1px solid #333' } as any}>{type}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredTeas.map(tea => (
              <div key={tea.id} onClick={() => { setSelectedTea(tea); setShowQuiz(false); }} style={{ background: '#161816', padding: '22px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' } as any}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{tea.name}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>{tea.summary}</p>
                </div>
                {isAdmin && <div style={{color:'#4CAF50'}}>✎</div>}
              </div>
            ))}
          </div>
        </section>

        {isAdmin && (
          <aside style={{ position: 'sticky', top: '120px' } as any}>
            <div style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222' } as any}>
              <button onClick={() => { resetTeaForm(); setShowTeaForm(true); }} style={btnMain as any}>+ ДОБАВИТЬ</button>
            </div>
          </aside>
        )}

        {selectedTea && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0f0d', zIndex: 15000, padding: '40px 20px', overflowY: 'auto' } as any}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div onClick={() => setSelectedTea(null)} style={{ color: '#4CAF50', marginBottom: '30px', cursor: 'pointer', fontWeight: 'bold' }}>← Закрыть</div>
              <h2 style={{ fontSize: '42px', color: '#4CAF50' }}>{selectedTea.name}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '40px 0' } as any}>
                <div style={infoBlock}><div style={infoLabel}>🌍 РЕГИОН</div>{selectedTea.region || 'Китай'}</div>
                <div style={infoBlock}><div style={infoLabel}>🌡️ ЗАВАРИВАНИЕ</div>{selectedTea.brewGuide || selectedTea.info}</div>
                <div style={infoBlock}><div style={infoLabel}>💡 СОВЕТ</div>{selectedTea.advice}</div>
                <div style={infoBlock}><div style={infoLabel}>🔄 ОТЛИЧИЕ</div>{selectedTea.analogsDiff}</div>
              </div>
              <div style={{ background: '#161816', padding: '30px', borderRadius: '25px', border: '1px solid #222' } as any}>
                <button onClick={() => { setQuizResults({}); setShowQuiz(true); }} style={{...btnMain, fontSize:'18px'} as any}>🧠 ПРОВЕРИТЬ СЕБЯ</button>
              </div>
            </div>
          </div>
        )}

        {showQuiz && selectedTea && (
          <div style={{ ...modalOverlay, zIndex: 20000 } as any}>
            <div style={{ ...modalContent, maxWidth: '600px' } as any}>
              <h3 style={{ color: '#4CAF50', fontSize: '24px', marginBottom: '25px' }}>МИНИ-ТЕСТ</h3>
              {(selectedTea.quiz || [{q: "Это отличный сорт?", o: ["Да", "Нет"], c: 0}]).map((q, qIdx) => (
                <div key={qIdx}>
                  <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '15px' }}>{qIdx + 1}. {q.q}</p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {q.o.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.c;
                      const isSelected = quizResults[selectedTea.id]?.includes(oIdx);
                      return (
                        <div key={oIdx} onClick={() => { if(!quizResults[selectedTea.id]?.includes(oIdx)) setQuizResults({...quizResults, [selectedTea.id]: [...(quizResults[selectedTea.id] || []), oIdx]}); }} style={{ padding: '20px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '15px', cursor: 'pointer', border: '1px solid #333', fontWeight: 'bold', display:'flex', justifyContent:'space-between' } as any}>
                          {opt} <span>{isSelected && (isCorrect ? '✅' : '❌')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button onClick={() => { setShowQuiz(false); setQuizResults({}); }} style={btnCancel as any}>Завершить тест</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const typeBadge: React.CSSProperties = { padding: '10px 24px', borderRadius: '25px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' };
const inputStyle = { width: '100%', padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #222', color: '#fff', marginBottom: '25px', outline: 'none' };
const infoBlock = { background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' };
const infoLabel = { color: '#4CAF50', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' };
const btnMain = { width: '100%', padding: '15px', background: '#4CAF50', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContent = { background: '#161816', padding: '40px', borderRadius: '35px', width: '90%', border: '1px solid #333' };