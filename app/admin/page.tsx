"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

interface Lesson {
  id: number;
  title: string;
  content: string;
  date: string;
}

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'lessons' | 'staff'>('lessons');

  // Стейты для Уроков
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonFormData, setLessonFormData] = useState({ title: '', content: '' });

  // Стейт для Сотрудников
  const [staffData, setStaffData] = useState<any>(null);

  useEffect(() => {
    // 1. Грузим уроки
    const savedLessons = localStorage.getItem('local_lessons_db');
    if (savedLessons) setLessons(JSON.parse(savedLessons));

    // 2. Расчет данных сотрудника
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
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <div onClick={() => setActiveTab('lessons')} style={activeTab === 'lessons' ? activeTabStyle : inactiveTabStyle as any}>📚 Уроки</div>
            <div onClick={() => setActiveTab('staff')} style={activeTab === 'staff' ? activeTabStyle : inactiveTabStyle as any}>👥 Сотрудники</div>
          </div>

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
                    <div onClick={() => deleteLesson(lesson.id)} style={{ cursor: 'pointer', color: '#ff7675' }}>✕</div>
                  </div>
                </div>
              ))}
            </div>
          )}

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

        <aside style={{ position: 'sticky', top: '120px' }}>
            <div style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' } as any}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4CAF50', letterSpacing: '1px' }}>МАСТЕР-ПАНЕЛЬ</h3>
                {activeTab === 'lessons' ? (
                  <div onClick={() => { setEditingLessonId(null); setLessonFormData({ title: '', content: '' }); setShowLessonForm(true); }}
                       style={btnMainStyle as any}>+ СОЗДАТЬ УРОК</div>
                ) : (
                   <p style={{ fontSize: '12px', color: '#888' }}>Мониторинг прогресса локального сотрудника.</p>
                )}
                <p style={{ fontSize: '11px', color: '#444', marginTop: '20px', lineHeight: '1.6' }}>Управление контентом и персоналом.</p>
            </div>
        </aside>

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
      </main>
    </div>
  );
}

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