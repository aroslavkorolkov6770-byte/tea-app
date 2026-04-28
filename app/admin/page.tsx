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

const INITIAL_TEA_DATABASE: Tea[] = [
  // ... (здесь ваш массив чаев из исходника, я сократил для читаемости, вставьте свои 15 сортов)
  { id: 1, name: "Лунцзин", type: "Зеленый", category: "Зеленый чай", strength: "Мягкий", info: "75°C", summary: "Ореховый профиль, семечки.", desc: "Классика из Ханчжоу. Нежный весенний вкус.", img: "", isDayTea: false },
];

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'teas' | 'lessons'>('teas'); // Управление вкладками

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

  // Загрузка данных
  useEffect(() => {
    // Грузим чай
    const savedTeas = localStorage.getItem('local_tea_db');
    if (savedTeas) setTeas(JSON.parse(savedTeas));
    else {
      setTeas(INITIAL_TEA_DATABASE);
      localStorage.setItem('local_tea_db', JSON.stringify(INITIAL_TEA_DATABASE));
    }

    // Грузим уроки
    const savedLessons = localStorage.getItem('local_lessons_db');
    if (savedLessons) setLessons(JSON.parse(savedLessons));

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
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 25px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' } as any}>
        
        {/* ЛЕВАЯ ЧАСТЬ */}
        <section>
          {/* ВКЛАДКИ */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <div onClick={() => setActiveTab('teas')} style={activeTab === 'teas' ? activeTabStyle : inactiveTabStyle as any}>🍵 База чая</div>
            <div onClick={() => setActiveTab('lessons')} style={activeTab === 'lessons' ? activeTabStyle : inactiveTabStyle as any}>📚 Уроки (Сотрудники)</div>
          </div>

          {/* КОНТЕНТ ВКЛАДКИ: ЧАЙ */}
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

          {/* КОНТЕНТ ВКЛАДКИ: УРОКИ */}
          {activeTab === 'lessons' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {lessons.length === 0 && <p style={{ color: '#555' }}>Уроков пока нет. Создайте первый урок для стажеров!</p>}
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
        </section>

        {/* ПРАВАЯ ЧАСТЬ: МАСТЕР-ПАНЕЛЬ */}
        <aside style={{ position: 'sticky', top: '120px' }}>
            <div style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' } as any}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4CAF50', letterSpacing: '1px' }}>МАСТЕР-ПАНЕЛЬ</h3>
                
                {activeTab === 'teas' ? (
                  <div onClick={() => { setEditingTeaId(null); setTeaFormData({ name: '', type: 'Зеленый', category: '', strength: 'Мягкий', info: '90°C', summary: '', desc: '', img: '', isDayTea: false }); setShowTeaForm(true); }}
                       style={btnMainStyle as any}>+ ДОБАВИТЬ ЧАЙ</div>
                ) : (
                  <div onClick={() => { setEditingLessonId(null); setLessonFormData({ title: '', content: '' }); setShowLessonForm(true); }}
                       style={btnMainStyle as any}>+ СОЗДАТЬ УРОК</div>
                )}
                
                <p style={{ fontSize: '11px', color: '#444', marginTop: '20px', lineHeight: '1.6' }}>
                  {activeTab === 'teas' ? 'Добавление нового сорта в базу.' : 'Материалы появятся в разделе "Смена" у сотрудников.'}
                </p>
            </div>
        </aside>

        {/* МОДАЛКА: УРОКИ */}
        {showLessonForm && (
          <div style={modalOverlayStyle as any}>
            <div style={modalContentStyle as any}>
              <h2 style={{ marginBottom: '25px', textAlign: 'center' }}>{editingLessonId ? 'Редактировать урок' : 'Новый урок'}</h2>
              <input style={inputStyle as any} placeholder="Название урока (напр. Как заваривать Пуэр)" value={lessonFormData.title} onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})} />
              <textarea style={{ ...inputStyle, height: '200px' } as any} placeholder="Текст урока или инструкции..." value={lessonFormData.content} onChange={e => setLessonFormData({...lessonFormData, content: e.target.value})} />
              <div onClick={handleSaveLesson} style={btnMainStyle as any}>СОХРАНИТЬ УРОК</div>
              <div onClick={() => setShowLessonForm(false)} style={btnCancelStyle as any}>Отмена</div>
            </div>
          </div>
        )}

        {/* МОДАЛКА: ЧАЙ (ваша стандартная) */}
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

// --- СТИЛИ ---
const activeTabStyle = { padding: '12px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const inactiveTabStyle = { padding: '12px 25px', background: '#161816', color: '#fff', borderRadius: '15px', border: '1px solid #333', cursor: 'pointer', transition: '0.2s' };
const adminCardStyle = { background: '#161816', padding: '20px 25px', borderRadius: '25px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContentStyle = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '450px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' };
const inputStyle = { width: '100%', padding: '14px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '14px' };
const btnMainStyle = { background: '#4CAF50', color: '#000', padding: '18px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' as const };
const btnCancelStyle = { textAlign: 'center' as const, marginTop: '15px', cursor: 'pointer', color: '#555' };