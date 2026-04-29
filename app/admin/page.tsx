"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

interface Tea {
  id: number; name: string; type: string; category: string; strength: string;
  info: string; summary: string; desc: string; img: string; isDayTea: boolean;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  date: string;
}

// --- ПОЛНАЯ БАЗА ИЗ 15 СОРТОВ (БЕЗ СОКРАЩЕНИЙ) ---
const INITIAL_TEA_DATABASE: Tea[] = [
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "", isDayTea: false },
  { id: 2, name: "Би Ло Чунь", type: "Зеленый", category: "Зеленый чай", strength: "Средний", info: "80°C", summary: "Цветочный аромат.", desc: "Скрученные спиралью почки с нежным ворсом.", img: "", isDayTea: false },
  { id: 3, name: "Тайпин Хоукуй", type: "Зеленый", category: "Зеленый чай", strength: "Крепкий", info: "85°C", summary: "Травянистый, мощный.", desc: "Огромные плоские листья.", img: "", isDayTea: false },
  { id: 4, name: "Бай Хао Инь Чжэнь", type: "Белый", category: "Белый чай", strength: "Мягкий", info: "70°C", summary: "Медовые ноты, хвоя.", desc: "Только серебристые почки.", img: "", isDayTea: false },
  { id: 5, name: "Бай Му Дань", type: "Белый", category: "Белый чай", strength: "Средний", info: "75°C", summary: "Полевые цветы.", desc: "Белый пион.", img: "", isDayTea: false },
  { id: 6, name: "Лао Шоу Мэй", type: "Белый", category: "Белый чай", strength: "Крепкий", info: "90°C", summary: "Сухофрукты, древесный.", desc: "Выдержанный белый чай.", img: "", isDayTea: false },
  { id: 7, name: "Те Гуань Инь", type: "Улун", category: "Светлый Улун", strength: "Мягкий", info: "85°C", summary: "Сирень и свежесть.", desc: "Легендарный светлый улун из уезда Аньси.", img: "", isDayTea: true },
  { id: 8, name: "Габа Алишань", type: "Улун", category: "Тайвань", strength: "Средний", info: "90°C", summary: "Ягодная кислинка.", desc: "Чай для снятия стресса.", img: "", isDayTea: false },
  { id: 9, name: "Да Хун Пао", type: "Улун", category: "Темный Улун", strength: "Крепкий", info: "95°C", summary: "Дым, хлебная корка.", desc: "Утесный улун сильной прожарки из гор Уи.", img: "", isDayTea: false },
  { id: 10, name: "Цзинь Цзюнь Мэй", type: "Красный", category: "Красный чай", strength: "Мягкий", info: "90°C", summary: "Сладкий, цветочный.", desc: "Элитный сорт из почек.", img: "", isDayTea: false },
  { id: 11, name: "Дянь Хун", type: "Красный", category: "Красный чай", strength: "Средний", info: "95°C", summary: "Сухофрукты и солод.", desc: "Классический юньнаньский чай.", img: "", isDayTea: false },
  { id: 12, name: "Лапсанг Сушонг", type: "Красный", category: "Красный чай", strength: "Крепкий", info: "95°C", summary: "Дым сосновых дров.", desc: "Тот самый «копченый» чай.", img: "", isDayTea: false },
  { id: 13, name: "Шен Пуэр (Молодой)", type: "Пуэр", category: "Шен Пуэр", strength: "Мягкий", info: "85°C", summary: "Трава и курага.", desc: "Свежий шен.", img: "", isDayTea: false },
  { id: 14, name: "Шен Пуэр (Лао)", type: "Пуэр", category: "Шен Пуэр", strength: "Средний", info: "95°C", summary: "Камфора, дерево.", desc: "Шен пуэр с выдержкой более 10 лет.", img: "", isDayTea: false },
  { id: 15, name: "Шу Пуэр", type: "Пуэр", category: "Шу Пуэр", strength: "Крепкий", info: "100°C", summary: "Землистый, кофейный.", desc: "Сильная ферментация. Мощная бодрость.", img: "", isDayTea: false }
];

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'teas' | 'lessons' | 'staff'>('teas');

  // Стейты для Чая
  const [teas, setTeas] = useState<Tea[]>([]);
  const [showTeaForm, setShowTeaForm] = useState(false);
  const [editingTeaId, setEditingTeaId] = useState<number | null>(null);
  const [teaFormData, setTeaFormData] = useState({
    name: '', type: 'Зеленый', category: '', strength: 'Мягкий', 
    info: '90°C', summary: '', desc: '', img: '', isDayTea: false
  });

  // Стейты для Уроков
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonFormData, setLessonFormData] = useState({ title: '', content: '' });

  // Стейт для Сотрудников
  const [staffData, setStaffData] = useState<any>(null);

  // Загрузка всех данных
  useEffect(() => {
    // 1. Грузим чай
    const savedTeas = localStorage.getItem('local_tea_db');
    if (savedTeas) setTeas(JSON.parse(savedTeas));
    else {
      setTeas(INITIAL_TEA_DATABASE);
      localStorage.setItem('local_tea_db', JSON.stringify(INITIAL_TEA_DATABASE));
    }

    // 2. Грузим уроки
    const savedLessons = localStorage.getItem('local_lessons_db');
    if (savedLessons) setLessons(JSON.parse(savedLessons));

    // 3. Расчет данных сотрудника (из логики второго кода)
    const name = localStorage.getItem('user_name') || 'Сотрудник 1/1';
    const routeProg = JSON.parse(localStorage.getItem('tea_hub_onboard_route_v1') || '[]');
    const basicsProg = JSON.parse(localStorage.getItem('tea_hub_basics_progress_v1') || '[]');
    const startDate = localStorage.getItem('first_login_date');

    let isOverdue = false;
    let daysLeft = 7;
    if (startDate) {
        const start = new Date(startDate).getTime();
        const now = new Date().getTime();
        const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        daysLeft = 7 - diffDays;
        if (diffDays > 7 && (routeProg.length < 5 || basicsProg.length < 10)) {
            isOverdue = true;
        }
    }

    setStaffData({
        name,
        routePercent: Math.round((routeProg.length / 5) * 100),
        basicsPercent: Math.round((basicsProg.length / 10) * 100),
        isOverdue,
        daysLeft: daysLeft < 0 ? 0 : daysLeft
    });

    setIsMounted(true);
  }, []);

  // --- ЛОГИКА ЧАЯ ---
  const saveTeasToLocal = (newList: Tea[]) => {
    setTeas(newList);
    localStorage.setItem('local_tea_db', JSON.stringify(newList));
  };

  const toggleDayTea = (id: number) => {
    const newList = teas.map(t => ({ ...t, isDayTea: t.id === id ? !t.isDayTea : false }));
    saveTeasToLocal(newList);
  };

  const handleSaveTea = () => {
    let newList = [...teas];
    if (teaFormData.isDayTea) newList = newList.map(t => ({ ...t, isDayTea: false }));
    if (editingTeaId) newList = newList.map(t => t.id === editingTeaId ? { ...teaFormData, id: editingTeaId } : t);
    else newList.push({ ...teaFormData, id: Date.now() });

    saveTeasToLocal(newList);
    setShowTeaForm(false);
    setTeaFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false });
    setEditingTeaId(null);
  };

  const deleteTea = (id: number) => {
    if (confirm("Удалить этот чай?")) saveTeasToLocal(teas.filter(t => t.id !== id));
  };

  // --- ЛОГИКА УРОКОВ ---
  const saveLessonsToLocal = (newList: Lesson[]) => {
    setLessons(newList);
    localStorage.setItem('local_lessons_db', JSON.stringify(newList));
  };

  const handleSaveLesson = () => {
    if (!lessonFormData.title || !lessonFormData.content) return alert("Заполните все поля!");
    let newList = [...lessons];
    
    if (editingLessonId) {
      newList = newList.map(l => l.id === editingLessonId ? { ...l, ...lessonFormData } : l);
    } else {
      newList.push({ 
        id: Date.now(), 
        ...lessonFormData, 
        date: new Date().toLocaleDateString('ru-RU') 
      });
    }

    saveLessonsToLocal(newList);
    setShowLessonForm(false);
    setLessonFormData({ title: '', content: '' });
    setEditingLessonId(null);
  };

  const deleteLesson = (id: number) => {
    if (confirm("Удалить этот урок?")) saveLessonsToLocal(lessons.filter(l => l.id !== id));
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setLessonFormData({ title: lesson.title, content: lesson.content });
    setShowLessonForm(true);
  };

  if (!isMounted) return null;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 25px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' } as any}>
        
        <section>
          {/* ВКЛАДКИ (ОБЪЕДИНЕННЫЕ) */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <div onClick={() => setActiveTab('teas')} style={activeTab === 'teas' ? activeTabStyle : inactiveTabStyle as any}>🍵 База чая</div>
            <div onClick={() => setActiveTab('lessons')} style={activeTab === 'lessons' ? activeTabStyle : inactiveTabStyle as any}>📚 Уроки</div>
            <div onClick={() => setActiveTab('staff')} style={activeTab === 'staff' ? activeTabStyle : inactiveTabStyle as any}>👥 Сотрудники</div>
          </div>

          {/* КОНТЕНТ: ЧАЙ */}
          {activeTab === 'teas' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {teas.map(tea => (
                <div key={tea.id} style={adminCardStyle as any}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{tea.name}</span>
                      {tea.isDayTea && <span style={{ color: '#4CAF50', fontSize: '10px', fontWeight: 'bold' }}>[ЧАЙ ДНЯ]</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{tea.type} | {tea.strength}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div onClick={() => toggleDayTea(tea.id)} style={{ fontSize: '22px', cursor: 'pointer', color: tea.isDayTea ? '#4CAF50' : '#222' }}>⭐</div>
                    <div onClick={() => { setEditingTeaId(tea.id); setTeaFormData(tea); setShowTeaForm(true); }} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</div>
                    <div onClick={() => deleteTea(tea.id)} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* КОНТЕНТ: УРОКИ */}
          {activeTab === 'lessons' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {lessons.length === 0 && <p style={{ color: '#555' }}>Уроков пока нет.</p>}
              {lessons.map(lesson => (
                <div key={lesson.id} style={adminCardStyle as any}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>{lesson.title}</span>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Добавлено: {lesson.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div onClick={() => startEditLesson(lesson)} style={{ cursor: 'pointer', color: '#4CAF50' }}>✎</div>
                    <div onClick={() => deleteLesson(lesson.id)} style={{ cursor: 'pointer', color: '#ff5252' }}>✕</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* КОНТЕНТ: СОТРУДНИКИ (ИЗ ВТОРОГО КОДА) */}
          {activeTab === 'staff' && (
             <div style={{ background: '#161816', borderRadius: '30px', border: '1px solid #222', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#222', color: '#888', fontSize: '11px', letterSpacing: '1px' }}>
                            <th style={thStyle}>ИМЯ</th>
                            <th style={thStyle}>ПЛАН НЕДЕЛИ</th>
                            <th style={thStyle}>ОСНОВЫ</th>
                            <th style={thStyle}>СТАТУС</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffData && (
                            <tr style={{ borderBottom: '1px solid #222' }}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{staffData.name}</div>
                                    <div style={{ fontSize: '11px', color: '#555' }}>ID: LOCAL_STAFF_1</div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={progressBg}><div style={{ ...progressFill, width: `${staffData.routePercent}%` }} /></div>
                                        <span style={{ fontSize: '12px' }}>{staffData.routePercent}%</span>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={progressBg}><div style={{ ...progressFill, width: `${staffData.basicsPercent}%` }} /></div>
                                        <span style={{ fontSize: '12px' }}>{staffData.basicsPercent}%</span>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    {staffData.isOverdue ? (
                                        <span style={{ background: 'rgba(255, 118, 117, 0.1)', color: '#ff7675', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>ПРОСРОЧЕНО</span>
                                    ) : (
                                        <span style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>В СРОКЕ ({staffData.daysLeft}д)</span>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
          )}
        </section>

        {/* ПРАВАЯ ПАНЕЛЬ */}
        <aside style={{ position: 'sticky', top: '120px' }}>
            <div style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' } as any}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4CAF50', letterSpacing: '1px' }}>МАСТЕР-ПАНЕЛЬ</h3>
                
                {activeTab === 'teas' && (
                  <div onClick={() => { setEditingTeaId(null); setTeaFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false }); setShowTeaForm(true); }}
                       style={btnMainStyle as any}>+ ДОБАВИТЬ ЧАЙ</div>
                )}
                {activeTab === 'lessons' && (
                  <div onClick={() => { setEditingLessonId(null); setLessonFormData({ title: '', content: '' }); setShowLessonForm(true); }}
                       style={btnMainStyle as any}>+ СОЗДАТЬ УРОК</div>
                )}
                {activeTab === 'staff' && (
                   <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>Здесь отображается прогресс локального сотрудника 1/1.</p>
                )}
                
                <p style={{ fontSize: '11px', color: '#444', marginTop: '20px', lineHeight: '1.6' }}>
                  {activeTab === 'teas' ? 'База сортов чая.' : activeTab === 'lessons' ? 'Материалы обучения.' : 'Мониторинг прогресса.'}
                </p>
            </div>
        </aside>

        {/* МОДАЛКИ (ВСЕ СОХРАНЕНЫ) */}
        {showLessonForm && (
          <div style={modalOverlayStyle as any}>
            <div style={modalContentStyle as any}>
              <h2 style={{ marginBottom: '25px', textAlign: 'center' }}>{editingLessonId ? 'Редактировать урок' : 'Новый урок'}</h2>
              <input style={inputStyle as any} placeholder="Название урока" value={lessonFormData.title} onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})} />
              <textarea style={{ ...inputStyle, height: '200px' } as any} placeholder="Текст инструкции..." value={lessonFormData.content} onChange={e => setLessonFormData({...lessonFormData, content: e.target.value})} />
              <div onClick={handleSaveLesson} style={btnMainStyle as any}>СОХРАНИТЬ УРОК</div>
              <div onClick={() => setShowLessonForm(false)} style={btnCancelStyle as any}>Отмена</div>
            </div>
          </div>
        )}

        {showTeaForm && (
          <div style={modalOverlayStyle as any}>
            <div style={modalContentStyle as any}>
              <h2 style={{ marginBottom: '25px', textAlign: 'center' }}>{editingTeaId ? 'Редактировать' : 'Новый чай'}</h2>
              <input style={inputStyle as any} placeholder="Название чая" value={teaFormData.name} onChange={e => setTeaFormData({...teaFormData, name: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select style={inputStyle as any} value={teaFormData.type} onChange={e => setTeaFormData({...teaFormData, type: e.target.value})}>
                  {["Зеленый", "Белый", "Улун", "Красный", "Пуэр"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select style={inputStyle as any} value={teaFormData.strength} onChange={e => setTeaFormData({...teaFormData, strength: e.target.value})}>
                  {["Мягкий", "Средний", "Крепкий"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <textarea style={{ ...inputStyle, height: '100px' } as any} placeholder="Описание" value={teaFormData.desc} onChange={e => setTeaFormData({...teaFormData, desc: e.target.value})} />
              <div onClick={handleSaveTea} style={btnMainStyle as any}>СОХРАНИТЬ ЧАЙ</div>
              <div onClick={() => setShowTeaForm(false)} style={btnCancelStyle as any}>Отмена</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- СТИЛИ (ОБЪЕДИНЕНЫ) ---
const activeTabStyle = { padding: '12px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' };
const inactiveTabStyle = { padding: '12px 25px', background: '#161816', color: '#fff', borderRadius: '15px', border: '1px solid #333', cursor: 'pointer' };
const adminCardStyle = { background: '#161816', padding: '20px 25px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContentStyle = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '450px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' };
const inputStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none' };
const btnMainStyle = { background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' as const };
const btnCancelStyle = { textAlign: 'center' as const, marginTop: '15px', cursor: 'pointer', color: '#555' };
const thStyle = { padding: '15px 20px', fontWeight: '900' };
const tdStyle = { padding: '20px' };
const progressBg = { width: '80px', height: '5px', background: '#000', borderRadius: '10px', overflow: 'hidden' };
const progressFill = { height: '100%', background: '#4CAF50', transition: '1s' };