"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

const STORAGE_KEYS = {
    TAB: 'tea_hub_active_tab'
};

export default function ShiftPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  
  // Данные сотрудника
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  // Данные админа
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  
  // Модалка нового урока
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '', content: '', question: '', 
    opt1: '', opt2: '', opt3: '', correct: 0
  });

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  // --- ИНИЦИАЛИЗАЦИЯ ---
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const savedTab = localStorage.getItem(STORAGE_KEYS.TAB);
    
    setIsAdmin(role === 'admin');
    if (savedTab) setActiveTab(savedTab as any);

    fetchData();
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    const myId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');

    // 1. Загружаем все уроки (для всех)
    const { data: les } = await supabase.from('lessons').select('*').order('created_at', { ascending: true });
    if (les) setLessons(les);

    // 2. Загружаем задачи (для сотрудника - свои, для админа - все)
    const taskQuery = supabase.from('tasks').select('*').order('id', { ascending: true });
    if (role !== 'admin') taskQuery.or(`assigned_to.is.null,assigned_to.eq.${myId}`);
    const { data: tks } = await taskQuery;
    if (tks) setTasks(tks);

    // 3. Загружаем прогресс
    if (role === 'admin') {
        const { data: profs } = await supabase.from('profiles').select('*').order('status', { ascending: false });
        const { data: prog } = await supabase.from('lesson_progress').select('*');
        if (profs) setAllProfiles(profs);
        if (prog) setAllProgress(prog);
    } else {
        const { data: myProg } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', myId);
        if (myProg) setCompletedLessons(myProg.map(p => p.lesson_id));
    }
  };

  // --- ОБРАБОТЧИКИ ---
  const handleUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    fetchData();
  };

  const createLesson = async () => {
    const { error } = await supabase.from('lessons').insert([{
        title: newLesson.title,
        content: newLesson.content,
        question: newLesson.question,
        options: [newLesson.opt1, newLesson.opt2, newLesson.opt3],
        correct_index: Number(newLesson.correct)
    }]);
    if (!error) {
        setShowLessonForm(false);
        setNewLesson({title:'', content:'', question:'', opt1:'', opt2:'', opt3:'', correct:0});
        fetchData();
    }
  };

  const handleAnswer = async (index: number, correct: number, lessonId: string) => {
    const myId = localStorage.getItem('userId');
    setActiveAnswer(index);
    if (index === correct && !completedLessons.includes(lessonId)) {
      await supabase.from('lesson_progress').insert([{ user_id: myId, lesson_id: lessonId }]);
      fetchData();
    }
  };

  const assignTask = async (userId: string) => {
    const text = prompt("Введите задачу для этого сотрудника:");
    if (text) {
        await supabase.from('tasks').insert([{ text, done: false, assigned_to: userId }]);
        alert("Задача отправлена!");
        fetchData();
    }
  };

  // Расчеты
  const getPlayerProgress = (userId: string) => {
    if (lessons.length === 0) return 0;
    const userDone = allProgress.filter(p => p.user_id === userId).length;
    return Math.round((userDone / lessons.length) * 100);
  };

  if (!isMounted) return null;

  const currentLesson = lessons.find(l => l.id === selectedLessonId);
  const myProgressPercent = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', fontFamily: 'Inter, sans-serif' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '140px 20px 100px 20px' } as any}>
        
        {/* ТАБЫ */}
        <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '25px', marginBottom: '60px', border: '1px solid #222' } as any}>
          <div onClick={() => { setActiveTab('checklist'); localStorage.setItem(STORAGE_KEYS.TAB, 'checklist'); }} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555', transition: '0.4s' } as any}>
            {isAdmin ? '👥 СОТРУДНИКИ' : '📋 МОЯ СМЕНА'}
          </div>
          <div onClick={() => { setActiveTab('edu'); localStorage.setItem(STORAGE_KEYS.TAB, 'edu'); }} style={{ flex: 1, padding: '20px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: '900', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#555', transition: '0.4s' } as any}>
            {isAdmin ? '📚 УПРАВЛЕНИЕ КУРСОМ' : '🎓 КУРС МАСТЕРА'}
          </div>
        </div>

        {/* ВКЛАДКА 1 */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {isAdmin ? (
              <>
                <h2 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px' }}>МОНИТОРИНГ</h2>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {allProfiles.map(profile => (
                    <div key={profile.id} style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: '800' }}>{profile.login}</div>
                        <div style={{ color: profile.status === 'approved' ? '#4CAF50' : '#ff7675', fontSize: '12px', fontWeight: 'bold' }}>{profile.status.toUpperCase()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {profile.status === 'pending' ? (
                          <>
                            <div onClick={() => handleUserStatus(profile.id, 'approved')} style={{ padding: '10px 20px', background: '#4CAF50', color: '#000', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ПРИНЯТЬ</div>
                            <div onClick={() => handleUserStatus(profile.id, 'rejected')} style={{ padding: '10px 20px', background: '#222', color: '#ff7675', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ОТКЛОНИТЬ</div>
                          </>
                        ) : (
                          <>
                            <div onClick={() => assignTask(profile.id)} style={{ padding: '10px 20px', border: '1px solid #333', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>+ ЗАДАЧА</div>
                            <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                <div style={{ color: '#4CAF50', fontWeight: '900', fontSize: '22px' }}>{getPlayerProgress(profile.id)}%</div>
                                <div style={{ fontSize: '9px', color: '#444' }}>ПРОГРЕСС</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '40px' }}>ЧЕК-ЛИСТ</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' } as any}>
                  {tasks.map(t => (
                    <div key={t.id} onClick={async () => { 
                        await supabase.from('tasks').update({ done: !t.done }).eq('id', t.id);
                        fetchData();
                    }} style={{ background: t.done ? 'rgba(76, 175, 80, 0.05)' : '#161816', padding: '30px', borderRadius: '25px', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', display: 'flex', alignItems: 'center', cursor: 'pointer' } as any}>
                      <div style={{ width: '28px', height: '28px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '20px', borderRadius: '8px', textAlign: 'center', color: '#000', fontWeight: '900', lineHeight: '24px' } as any}>{t.done && '✓'}</div>
                      <span style={{ flex: 1, fontSize: '18px', color: t.done ? '#444' : '#fff' }}>{t.text}</span>
                      {t.assigned_to && <div style={{ fontSize: '9px', color: '#4CAF50', border: '1px solid #4CAF50', padding: '2px 5px', borderRadius: '4px' }}>ЛИЧНОЕ</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ВКЛАДКА 2 */}
        {activeTab === 'edu' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' } as any}>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0 }}>ЗНАНИЯ</h2>
                    {isAdmin ? (
                        <div onClick={() => setShowLessonForm(true)} style={{ padding: '15px 30px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' } as any}>+ СОЗДАТЬ УРОК</div>
                    ) : (
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: '#4CAF50' }}>{myProgressPercent}%</span>
                            <div style={{ fontSize: '10px', color: '#444' }}>ВАШ ПРОГРЕСС</div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' } as any}>
                  {lessons.map((l, index) => {
                    const isDone = completedLessons.includes(l.id);
                    return (
                      <div key={l.id} onClick={() => { if(!isAdmin) { setSelectedLessonId(l.id); setActiveAnswer(null); } }} style={{ background: '#161816', padding: '40px', borderRadius: '35px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: isAdmin ? 'default' : 'pointer', position: 'relative', overflow: 'hidden' } as any}>
                        <span style={{ position: 'absolute', top: '20px', right: '30px', fontSize: '60px', fontWeight: '900', color: 'rgba(255,255,255,0.03)' }}>0{index+1}</span>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: isDone ? '#4CAF50' : '#fff' }}>{l.title}</h3>
                        {isAdmin && <div onClick={async () => { if(confirm("Удалить урок?")) { await supabase.from('lessons').delete().eq('id', l.id); fetchData(); } }} style={{ color: '#ff7675', fontSize: '11px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }}>УДАЛИТЬ УРОК</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* ВИД УРОКА */
              <div style={{ background: '#161816', padding: '60px', borderRadius: '40px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedLessonId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '40px', fontWeight: 'bold' }}>← НАЗАД</div>
                <h2 style={{ fontSize: '36px', fontWeight: '900' }}>{currentLesson?.title}</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#bbb', margin: '40px 0' }}>{currentLesson?.content}</p>
                <div style={{ borderTop: '1px solid #222', paddingTop: '40px' } as any}>
                    <h4 style={{ color: '#4CAF50', fontSize: '20px', marginBottom: '30px' }}>📝 ТЕСТ: {currentLesson?.question}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' } as any}>
                        {currentLesson?.options.map((o: string, i: number) => {
                            const isCorrect = i === currentLesson?.correct_index;
                            const isSelected = activeAnswer === i;
                            return (
                                <div key={i} onClick={() => handleAnswer(i, currentLesson.correct_index, currentLesson.id)} style={{ padding: '25px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '20px', cursor: 'pointer', border: '1px solid #222', color: isSelected ? '#fff' : '#888', fontWeight: 'bold', textAlign: 'center' } as any}>{o}</div>
                            );
                        })}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* МОДАЛКА УРОКА */}
        {showLessonForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 15000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' } as any}>
                <div style={{ background: '#111', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '600px', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' } as any}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: '900' }}>НОВЫЙ УРОК</h2>
                    <input style={inS as any} placeholder="Заголовок" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} />
                    <textarea style={{ ...inS, height: '120px' } as any} placeholder="Контент" value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} />
                    <input style={inS as any} placeholder="Вопрос теста" value={newLesson.question} onChange={e => setNewLesson({...newLesson, question: e.target.value})} />
                    <input style={inS as any} placeholder="Вариант 1 (Правильный)" value={newLesson.opt1} onChange={e => setNewLesson({...newLesson, opt1: e.target.value})} />
                    <input style={inS as any} placeholder="Вариант 2" value={newLesson.opt2} onChange={e => setNewLesson({...newLesson, opt2: e.target.value})} />
                    <input style={inS as any} placeholder="Вариант 3" value={newLesson.opt3} onChange={e => setNewLesson({...newLesson, opt3: e.target.value})} />
                    <button onClick={createLesson} style={{ width: '100%', padding: '20px', background: '#4CAF50', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>ОПУБЛИКОВАТЬ</button>
                    <button onClick={() => setShowLessonForm(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#444', marginTop: '10px', cursor: 'pointer' }}>ОТМЕНА</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

const inS = { width: '100%', padding: '15px', background: '#000', border: '1px solid #222', borderRadius: '12px', color: '#fff', marginBottom: '10px', outline: 'none' };