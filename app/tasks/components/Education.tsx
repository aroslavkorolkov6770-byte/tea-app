"use client";
import React, { useState } from 'react';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v2',
    DYNAMIC_TESTS: 'tea_hub_dynamic_tests_v1',   
    DYNAMIC_ROUTE: 'tea_hub_dynamic_route_v2',     
    TESTS_PROGRESS: 'tea_hub_tests_progress_v1',
    URGENT_FILES: 'tea_hub_urgent_files_v1'        
};

const saveDataToServer = (key: string, data: any) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

const stripEmoji = (str: string) => {
    if (!str) return '';
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

export default function Education({
    isAdmin,
    userId,
    dynamicRoute, setDynamicRoute,
    completedRoute, setCompletedRoute,
    dynamicTests, setDynamicTests,
    completedTests, setCompletedTests,
    urgentFiles,
    passedTests, setPassedTests,
    dismissedTasks, setDismissedTasks,
    selectedRouteStep, setSelectedRouteStep, closeRouteModal,
    selectedTest, setSelectedTest, closeTestModal
}: any) {
    
    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ ДЛЯ РЕДАКТОРОВ И МОДАЛОК ---
    const [showRouteForm, setShowRouteForm] = useState(false);
    const [routeFormData, setRouteFormData] = useState({ 
        id: '', title: '', time: '5 мин', section: '', subsection: '',
        h1: '', t1: '', h2: '', t2: '', h3: '', t3: '' 
    });
    const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

    const [showTestForm, setShowTestForm] = useState(false);
    const [testFormData, setTestFormData] = useState({
        id: '', title: '', subtitle: '', theory: '', section: '', subsection: '',
        quiz: [{ q: '', o: ['', '', '', ''], c: 0 }] 
    });
    const [testToDelete, setTestToDelete] = useState<string | null>(null);

    // Состояние для функции перемещения карточки
    const [movingItem, setMovingItem] = useState<{id: string, type: 'route' | 'test'} | null>(null);

    const [previewFile, setPreviewFile] = useState<any>(null);

    const [activeTestSession, setActiveTestSession] = useState<any>(null); 
    const [currentQuizStep, setCurrentQuizStep] = useState(0);
    const [testAnswers, setTestAnswers] = useState<number[]>([]);
    const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

    const [lockedTestAlert, setLockedTestAlert] = useState({show: false, message: ''});

    const [testResultModal, setTestResultModal] = useState<{
        show: boolean, score: number, isPassed: boolean, title: string, 
        mistakes: Array<{q: string, userAns: string, correctAns: string}>
    }>({show: false, score: 0, isPassed: false, title: '', mistakes: []});

    const [activeUrgentTest, setActiveUrgentTest] = useState<any>(null);
    const [urgentTestStep, setUrgentTestStep] = useState(0);
    const [urgentTestAnswers, setUrgentTestAnswers] = useState<number[]>([]);

    const [showDocsModal, setShowDocsModal] = useState(false);

    // --- ЛОГИКА ФИЛЬТРАЦИИ ФАЙЛОВ ---
    const handleDismissTask = (id: string) => {
        const newDismissed = [...dismissedTasks, id];
        setDismissedTasks(newDismissed);
        localStorage.setItem(`th_dismissed_tasks_${userId}`, JSON.stringify(newDismissed));
    };

    const visibleUrgentFiles = urgentFiles.filter((f: any) => {
        let taskCreatedAt = 0;
        if (f.id && typeof f.id === 'string') {
            const parts = f.id.split('_');
            const timePart = parseInt(parts[parts.length - 1]);
            if (!isNaN(timePart)) taskCreatedAt = timePart;
        }
        let userCreatedAt = 0;
        if (userId && userId !== 'u_admin' && userId !== 'u_staff') {
            const uParts = userId.split('_');
            const uTimePart = parseInt(uParts[uParts.length - 1]);
            if (!isNaN(uTimePart)) userCreatedAt = uTimePart;
        }
        let isForMe = false;
        if (f.target === userId) {
            isForMe = true;
        } else if (!f.target || f.target === 'Все') {
            if (!f.isTest && !(f.id && f.id.startsWith('deadline_'))) {
                isForMe = true;
            } else {
                isForMe = taskCreatedAt >= userCreatedAt;
            }
        }
        const isPassed = f.isTest && passedTests.includes(f.id);
        const isDismissed = dismissedTasks.includes(f.id);
        return isForMe && !isPassed && !isDismissed;
    });

    const urgentTasks = visibleUrgentFiles.filter((f: any) => f.id?.startsWith('deadline_') || f.isTest);
    const normativeDocs = visibleUrgentFiles.filter((f: any) => !(f.id?.startsWith('deadline_') || f.isTest));

    const handleDownloadFile = (file: any) => {
        if (!file.data) {
            alert("Этот файл был загружен в старой версии платформы и содержит только название.");
            return;
        }
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- ЛОГИКА ТЕОРИИ ---
    const handleSaveRoute = () => {
        if (!routeFormData.title.trim()) return;
        let newList = [...dynamicRoute];
        if (routeFormData.id) {
            newList = newList.map((r: any) => r.id === routeFormData.id ? routeFormData : r);
        } else {
            newList.push({ ...routeFormData, id: 'route_' + Date.now() });
        }
        setDynamicRoute(newList);
        localStorage.setItem('th_cache_route', JSON.stringify(newList));
        saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, newList);
        setShowRouteForm(false);
    };

    const handleDeleteRoute = () => {
        if (!routeToDelete) return;
        const newList = dynamicRoute.filter((r: any) => r.id !== routeToDelete);
        setDynamicRoute(newList);
        localStorage.setItem('th_cache_route', JSON.stringify(newList));
        saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, newList);
        setRouteToDelete(null);
    };

    const handleRouteComplete = (id: string) => {
        if (!completedRoute.includes(id)) {
            const newProg = [...completedRoute, id];
            setCompletedRoute(newProg);
            localStorage.setItem(`th_prog_route_${userId}`, JSON.stringify(newProg));
            saveDataToServer(`prog_route_${userId}`, newProg);
        }
        closeRouteModal();
    };

    // --- ЛОГИКА РЕДАКТОРА ТЕСТОВ ---
    const updateTestQuestion = (index: number, field: string, value: any) => {
        const newQuiz = [...testFormData.quiz];
        if (field === 'q') newQuiz[index].q = value;
        if (field === 'c') newQuiz[index].c = value;
        if (field.startsWith('o')) {
            const oIndex = parseInt(field.replace('o', ''));
            newQuiz[index].o[oIndex] = value;
        }
        setTestFormData({...testFormData, quiz: newQuiz});
    };

    const addTestQuestion = () => {
        setTestFormData({ ...testFormData, quiz: [...testFormData.quiz, { q: '', o: ['', '', '', ''], c: 0 }] });
    };

    const removeTestQuestion = (index: number) => {
        const newQuiz = testFormData.quiz.filter((_, i) => i !== index);
        setTestFormData({...testFormData, quiz: newQuiz});
    };

    const handleSaveTestForm = () => {
        if (!testFormData.title.trim()) return;
        const newTest = {
            id: testFormData.id || ('t_' + Date.now()),
            title: testFormData.title,
            subtitle: testFormData.subtitle,
            theory: testFormData.theory,
            section: testFormData.section,
            subsection: testFormData.subsection,
            quiz: testFormData.quiz.map(q => ({
                q: q.q || 'Без вопроса?',
                o: [q.o[0] || '1', q.o[1] || '2', q.o[2] || '3', q.o[3] || '4'],
                c: q.c
            }))
        };

        let newList = [...dynamicTests];
        if (testFormData.id) {
            newList = newList.map((t: any) => t.id === testFormData.id ? newTest : t);
        } else {
            newList.push(newTest);
        }
        setDynamicTests(newList);
        localStorage.setItem('th_cache_tests', JSON.stringify(newList));
        saveDataToServer(STORAGE_KEYS.DYNAMIC_TESTS, newList);
        setShowTestForm(false);
    };

    const handleDeleteTest = () => {
        if (!testToDelete) return;
        const newList = dynamicTests.filter((t: any) => t.id !== testToDelete);
        setDynamicTests(newList);
        localStorage.setItem('th_cache_tests', JSON.stringify(newList));
        saveDataToServer(STORAGE_KEYS.DYNAMIC_TESTS, newList);
        setTestToDelete(null);
    };

    // --- ФУНКЦИЯ ПЕРЕМЕЩЕНИЯ (НОВОЕ) ---
    const handleMoveItem = (targetSection: string) => {
        if (!movingItem) return;
        if (movingItem.type === 'route') {
            const updated = dynamicRoute.map((r: any) => r.id === movingItem.id ? { ...r, section: targetSection, subsection: '' } : r);
            setDynamicRoute(updated);
            saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, updated);
        } else {
            const updated = dynamicTests.map((t: any) => t.id === movingItem.id ? { ...t, section: targetSection, subsection: '' } : t);
            setDynamicTests(updated);
            saveDataToServer(STORAGE_KEYS.DYNAMIC_TESTS, updated);
        }
        setMovingItem(null);
    };

    // --- УДАЛЕНИЕ ЦЕЛОГО РАЗДЕЛА (НОВОЕ) ---
    const handleDeleteSection = (sectionName: string, type: 'route' | 'test') => {
        if (!confirm(`Вы уверены, что хотите удалить весь раздел "${sectionName}" и ВСЕ материалы внутри него?`)) return;
        if (type === 'route') {
            const updated = dynamicRoute.filter((r: any) => (r.section?.trim() || 'Основной раздел') !== sectionName);
            setDynamicRoute(updated);
            saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, updated);
        } else {
            const updated = dynamicTests.filter((t: any) => (t.section?.trim() || 'Основной раздел') !== sectionName);
            setDynamicTests(updated);
            saveDataToServer(STORAGE_KEYS.DYNAMIC_TESTS, updated);
        }
    };

    // --- ГРУППИРОВКА ДАННЫХ ДЛЯ РЕНДЕРА ---
    const groupItems = (items: any[]) => {
        const groups: Record<string, Record<string, any[]>> = {};
        items.forEach(item => {
            const sec = item.section?.trim() || 'Основной раздел';
            const subsec = item.subsection?.trim() || '';
            if (!groups[sec]) groups[sec] = {};
            if (!groups[sec][subsec]) groups[sec][subsec] = [];
            groups[sec][subsec].push(item);
        });
        return groups;
    };

    const theoryGroups = groupItems(dynamicRoute || []);
    const testGroups = groupItems(dynamicTests || []);

    // --- ПРОХОЖДЕНИЕ ОСНОВНОГО ТЕСТА ---
    const handleTestAnswer = (idx: number) => {
        if (activeAnswer !== null) return; 
        setActiveAnswer(idx);
        const newAnswers = [...testAnswers, idx];
        setTestAnswers(newAnswers);
        setTimeout(() => { 
            if (currentQuizStep < activeTestSession.quiz.length - 1) {
                setCurrentQuizStep(v => v + 1); 
                setActiveAnswer(null); 
            } else {
                finishMainTest(newAnswers);
            }
        }, 400); 
    };

    const finishMainTest = async (answers: number[]) => {
        let correctCount = 0;
        let mistakesArray: Array<{q: string, userAns: string, correctAns: string}> = [];

        activeTestSession.quiz.forEach((q: any, i: number) => {
            if (q.c === answers[i]) {
                correctCount++;
            } else {
                mistakesArray.push({
                    q: q.q, userAns: q.o[answers[i]], correctAns: q.o[q.c]
                });
            }
        });

        const score = Math.round((correctCount / activeTestSession.quiz.length) * 100);
        const isPassed = score >= 80;
        
        const currentUserName = localStorage.getItem('current_user_name') || 'Сотрудник';
        const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

        try {
            const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_test_results_v1`);
            let results = await res.json().catch(() => []);
            if (!Array.isArray(results)) results = [];

            const previousAttempts = results.filter((r: any) => r.testId === activeTestSession.id && r.userName === currentUserName).length;
            const currentAttemptCount = previousAttempts + 1;
            
            const newResult = {
                id: Date.now(), testId: activeTestSession.id, userName: currentUserName,
                testName: activeTestSession.title, score: score, attempts: currentAttemptCount, date: formattedTime
            };
            saveDataToServer('tea_hub_test_results_v1', [newResult, ...results]);

            const notifRes = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_notifications_v1`);
            let notifs = await notifRes.json().catch(() => []);
            if (!Array.isArray(notifs)) notifs = [];

            const adminNotif = {
                id: Date.now() + 1, title: 'Результат теста (База знаний)',
                text: `Сотрудник ${currentUserName} завершил тест "${activeTestSession.title}" с результатом ${score}%. Попытка: ${currentAttemptCount}.`,
                time: formattedTime, target: 'u_admin'
            };
            saveDataToServer('tea_hub_notifications_v1', [adminNotif, ...notifs]);

            if (isPassed && !completedTests.includes(activeTestSession.id)) {
                const newComp = [...completedTests, activeTestSession.id];
                setCompletedTests(newComp);
                localStorage.setItem(`th_prog_tests_${userId}`, JSON.stringify(newComp));
                saveDataToServer(`prog_tests_${userId}`, newComp);
            }
            
            setTestResultModal({ show: true, score, isPassed, title: activeTestSession.title, mistakes: mistakesArray });
            setActiveTestSession(null);
            setCurrentQuizStep(0);
            setTestAnswers([]);
            setActiveAnswer(null);
        } catch (e) { console.error("Ошибка сохранения результатов", e); }
    };

    // --- ПРОХОЖДЕНИЕ СРОЧНОЙ АТТЕСТАЦИИ ---
    const handleUrgentTestAnswer = (idx: number) => {
        if (activeAnswer !== null) return; 
        setActiveAnswer(idx);
        const newAnswers = [...urgentTestAnswers, idx];
        setUrgentTestAnswers(newAnswers);

        setTimeout(() => { 
            if (urgentTestStep < activeUrgentTest.quiz.length - 1) {
                setUrgentTestStep(v => v + 1); 
                setActiveAnswer(null); 
            } else {
                finishUrgentTest(newAnswers);
            }
        }, 500); 
    };

    const finishUrgentTest = async (answers: number[]) => {
        let correct = 0;
        activeUrgentTest.quiz.forEach((q: any, i: number) => { if (q.c === answers[i]) correct++; });
        const score = Math.round((correct / activeUrgentTest.quiz.length) * 100);
        const isPassed = score >= 80;
        const currentUserName = localStorage.getItem('current_user_name') || 'Сотрудник';
        const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

        try {
            const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_test_results_v1`);
            let results = await res.json().catch(() => []);
            if (!Array.isArray(results)) results = [];

            const previousAttempts = results.filter((r: any) => r.testId === activeUrgentTest.id && r.userName === currentUserName).length;
            const currentAttemptCount = previousAttempts + 1;
            
            const newResult = {
                id: Date.now(), testId: activeUrgentTest.id, userName: currentUserName,
                testName: activeUrgentTest.name, score: score, attempts: currentAttemptCount, date: formattedTime
            };
            saveDataToServer('tea_hub_test_results_v1', [newResult, ...results]);

            const notifRes = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_notifications_v1`);
            let notifs = await notifRes.json().catch(() => []);
            if (!Array.isArray(notifs)) notifs = [];

            const adminNotif = {
                id: Date.now() + 1, title: 'Результат аттестации',
                text: `Сотрудник ${currentUserName} завершил тест "${activeUrgentTest.name}" с результатом ${score}%. Потребовалось попыток: ${currentAttemptCount}.`,
                time: formattedTime, target: 'u_admin'
            };
            saveDataToServer('tea_hub_notifications_v1', [adminNotif, ...notifs]);

            if (isPassed) {
                const newPassed = [...passedTests, activeUrgentTest.id];
                setPassedTests(newPassed);
                localStorage.setItem(`th_cache_passed_tests_${userId}`, JSON.stringify(newPassed));
                saveDataToServer(`th_passed_tests_${userId}`, newPassed);
            }
            
            setTestResultModal({ show: true, score, isPassed, title: activeUrgentTest.name, mistakes: [] });
            setActiveUrgentTest(null);
            setUrgentTestStep(0);
            setUrgentTestAnswers([]);
            setActiveAnswer(null);
        } catch (e) { console.error("Ошибка", e); }
    };

    return (
        <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
            
            {/* --- СРОЧНО К ПРОХОЖДЕНИЮ --- */}
            <div style={{ marginBottom: '40px', width: '100%', boxSizing: 'border-box' }}>
                <div className="tasks-flex-space" style={flexSpace}>
                    <h2 className="tasks-title" style={{ ...sectionTitle, color: '#0abab5', margin: 0 }}>Срочно к прохождению</h2>
                </div>
                {urgentTasks.length > 0 ? (
                    <div className="premium-cards-container"> 
                        {urgentTasks.map((file: any) => (
                            file.id && file.id.startsWith('deadline_') ? (
                                <div key={file.id} className="premium-card deadline-card" style={{ borderColor: '#ff4d4d', borderWidth: '1px' }}>
                                    <div onClick={(e) => { e.stopPropagation(); handleDismissTask(file.id); }} style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer', color: '#ff4d4d', fontWeight: 'bold', fontSize: '18px', zIndex: 10 }}>✕</div>
                                    <span style={{fontSize:'12px', color:'#ff4d4d', fontWeight:'900', marginBottom: '8px', display: 'inline-block'}}>⚠️ ДЕДЛАЙН</span>
                                    <h4 style={{fontSize:'15px', margin:'0 0 10px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.4'}}>{file.name.replace('⚠️ Дедлайн: ', '')}</h4>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ color: '#ff4d4d', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>{file.size}</div>
                                        <div style={{ color: '#555', fontSize: '11px', fontWeight: 'bold' }}>Назначено: {file.date}</div>
                                    </div>
                                </div>
                            ) : (
                                <div key={file.id} className="premium-card" onClick={() => setActiveUrgentTest(file)}>
                                    <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px'}}>🎓 АТТЕСТАЦИЯ</span>
                                    <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(file.name)}</h4>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={cardFooter}><span>Пройти тестирование</span><span style={{color: '#0abab5'}}>{file.quiz?.length || 0} вопр.</span></div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div style={{ color: '#666', fontSize: '14px', background: '#111', padding: '30px', borderRadius: '30px', border: '1px dashed #222', textAlign: 'center' }}>
                        У вас нет срочных заданий.
                    </div>
                )}
            </div>

            {/* --- КНОПКА "НОРМАТИВНЫЕ ДОКУМЕНТЫ" --- */}
            <div style={{ marginBottom: '60px', width: '100%', boxSizing: 'border-box' }}>
                <button 
                    onClick={() => setShowDocsModal(true)} 
                    className="normative-docs-btn"
                >
                     Нормативные документы <span className="doc-count-badge">{normativeDocs.length}</span>
                </button>
            </div>

            {/* --- БЛОК 1: ТЕОРИЯ --- */}
            <div className="tasks-flex-space" style={flexSpace}>
               <h2 className="tasks-title" style={sectionTitle}>Теория</h2>
               {isAdmin && <button onClick={() => { 
                   setRouteFormData({ id: '', title: '', time: '5 мин', section: '', subsection: '', h1: '', t1: '', h2: '', t2: '', h3: '', t3: '' }); 
                   setShowRouteForm(true); 
               }} style={adminActionBtn}>+ НОВАЯ ТЕМА</button>}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.entries(theoryGroups).map(([secName, subsecs]: any) => (
                   <div key={secName} style={{ marginBottom: '40px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px' }}>
                           <h3 style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>📁 {secName}</h3>
                           {isAdmin && secName !== 'Основной раздел' && (
                               <span onClick={() => handleDeleteSection(secName, 'route')} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>УДАЛИТЬ РАЗДЕЛ</span>
                           )}
                       </div>
                       
                       {Object.entries(subsecs).map(([subsecName, items]: any) => (
                           <div key={subsecName} style={{ marginBottom: '20px' }}>
                               {subsecName && (
                                   <h4 style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px', marginLeft: '5px' }}>• {subsecName}</h4>
                               )}
                               <div className="premium-cards-container">
                                   {items.map((step: any, idx: number) => {
                                       const isDone = completedRoute.includes(step.id);
                                       return (
                                           <div key={step.id} onClick={() => setSelectedRouteStep(step)} className="premium-card">
                                              {isAdmin && (
                                                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                                      <div onClick={(e) => { e.stopPropagation(); setMovingItem({id: step.id, type: 'route'}); }} style={moveIconStyle}>📦</div>
                                                      <div onClick={(e) => { 
                                                          e.stopPropagation(); 
                                                          setRouteFormData({
                                                              id: step.id, title: step.title, time: step.time || '5 мин', 
                                                              section: step.section || '', subsection: step.subsection || '',
                                                              h1: step.h1, t1: step.t1, h2: step.h2, t2: step.t2, h3: step.h3, t3: step.t3
                                                          }); 
                                                          setShowRouteForm(true); 
                                                      }} style={editIconStyle}>✎</div>
                                                      <div onClick={(e) => { e.stopPropagation(); setRouteToDelete(step.id); }} style={delIconStyle}>✕</div>
                                                  </div>
                                              )}
                                              <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px'}}>Урок {idx+1}</span>
                                              <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(step.title)}</h4>
                                              
                                              <div style={{ marginTop: 'auto' }}>
                                                  <div style={pBarBg}>
                                                      <div style={pBarFill(isDone ? 100 : 0)} />
                                                  </div>
                                                  <div style={cardFooter}><span>{isDone ? 'Выполнено' : 'Начать'}</span><span>{step.time}</span></div>
                                              </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       ))}
                   </div>
               ))}
            </div>

            {/* --- БЛОК 2: ТЕСТЫ --- */}
            <div className="tasks-flex-space" style={flexSpace}>
                <h2 className="tasks-title" style={sectionTitle}>Тесты</h2>
                {isAdmin && <button onClick={() => { 
                    setTestFormData({ id: '', title: '', subtitle: '', theory: '', section: '', subsection: '', quiz: [{ q: '', o: ['', '', '', ''], c: 0 }] }); 
                    setShowTestForm(true); 
                }} style={adminActionBtn}>+ НОВЫЙ ТЕСТ</button>}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.entries(testGroups).map(([secName, subsecs]: any) => (
                   <div key={secName} style={{ marginBottom: '40px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px' }}>
                           <h3 style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>📋 {secName}</h3>
                           {isAdmin && secName !== 'Основной раздел' && (
                               <span onClick={() => handleDeleteSection(secName, 'test')} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>УДАЛИТЬ РАЗДЕЛ</span>
                           )}
                       </div>
                       
                       {Object.entries(subsecs).map(([subsecName, items]: any) => (
                           <div key={subsecName} style={{ marginBottom: '20px' }}>
                               {subsecName && (
                                   <h4 style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px', marginLeft: '5px' }}>• {subsecName}</h4>
                               )}
                               <div className="premium-cards-container">
                                   {items.map((test: any, idx: number) => {
                                       const isDone = completedTests.includes(test.id);
                                       const globalIdx = dynamicTests.findIndex((t: any) => t.id === test.id);
                                       const isUnlocked = isAdmin || globalIdx === 0 || completedTests.includes(dynamicTests[globalIdx - 1]?.id);
                                       
                                       return (
                                           <div key={test.id} onClick={() => { 
                                                   if (isUnlocked) setSelectedTest(test); 
                                                   else setLockedTestAlert({show: true, message: `Сначала необходимо успешно сдать предыдущий тест.`});
                                               }} 
                                               className="premium-card" 
                                               style={{ borderColor: isUnlocked ? '#222' : '#111', cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
                                           >
                                              {!isUnlocked && (
                                                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '14px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                                                      <span style={{ fontSize: '40px' }}>🔒</span>
                                                  </div>
                                              )}

                                              {isAdmin && (
                                                   <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                                       <div onClick={(e) => { e.stopPropagation(); setMovingItem({id: test.id, type: 'test'}); }} style={moveIconStyle}>📦</div>
                                                       <div onClick={(e) => { 
                                                           e.stopPropagation(); 
                                                           setTestFormData({
                                                               id: test.id, title: test.title, subtitle: test.subtitle, theory: test.theory,
                                                               section: test.section || '', subsection: test.subsection || '',
                                                               quiz: test.quiz && test.quiz.length > 0 ? JSON.parse(JSON.stringify(test.quiz)) : [{ q: '', o: ['', '', '', ''], c: 0 }]
                                                           }); 
                                                           setShowTestForm(true); 
                                                       }} style={editIconStyle}>✎</div>
                                                       <div onClick={(e) => { e.stopPropagation(); setTestToDelete(test.id); }} style={delIconStyle}>✕</div>
                                                   </div>
                                               )}

                                              <span style={{fontSize:'12px', color: isUnlocked ? '#0abab5' : '#555', fontWeight:'800', marginBottom: '6px', opacity: isUnlocked ? 1 : 0.5}}>Тест {idx+1}</span>
                                              <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: isUnlocked ? '#fff' : '#666', lineHeight: '1.3'}}>{stripEmoji(test.title)}</h4>
                                              
                                              <div style={{ marginTop: 'auto', opacity: isUnlocked ? 1 : 0.5 }}>
                                                  <div style={pBarBg}>
                                                      <div style={pBarFill(isDone ? 100 : 0)} />
                                                  </div>
                                                  <div style={cardFooter}><span>{isDone ? 'Сдан' : 'Не сдан'}</span><span>{test.quiz?.length || 0} вопр.</span></div>
                                              </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       ))}
                   </div>
               ))}
            </div>

            {/* --- ОКНО ПЕРЕМЕЩЕНИЯ --- */}
            {movingItem && (
                <div style={modalOverlay as any} onClick={() => setMovingItem(null)}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900'}}>ПЕРЕМЕСТИТЬ В РАЗДЕЛ</h2>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto'}} className="custom-scroll">
                            {Array.from(new Set(
                                (movingItem.type === 'route' ? dynamicRoute : dynamicTests)
                                .map((i: any) => i.section?.trim() || 'Основной раздел')
                            )).map((sec: any) => (
                                <button key={sec} onClick={() => handleMoveItem(sec)} style={adminIn as any}>{sec}</button>
                            ))}
                            <button onClick={() => {
                                const newSec = prompt("Введите название нового раздела:");
                                if (newSec && newSec.trim()) handleMoveItem(newSec.trim());
                            }} style={{...adminActionBtn, marginTop: '10px', width: '100%', padding: '15px'} as any}>+ СОЗДАТЬ НОВЫЙ РАЗДЕЛ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ОКНО ОШИБКИ "ЭТАП ЗАБЛОКИРОВАН" --- */}
            {lockedTestAlert.show && (
                <div style={{...errorOverlayStyle, zIndex: 50000} as any} onClick={() => setLockedTestAlert({show: false, message: ''})}>
                    <div className="tasks-modal" style={errorModalContent as any} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔒</div>
                        <h2 style={{ fontSize: '20px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>ЭТАП ЗАБЛОКИРОВАН</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>{lockedTestAlert.message}</p>
                        <button onClick={() => setLockedTestAlert({show: false, message: ''})} style={{...errorBtnStyle, background: '#333', color: '#fff', marginTop: 0} as any}>ПОНЯТНО</button>
                    </div>
                </div>
            )}

            {/* --- ПРЕДПРОСМОТР КАРТОЧКИ "ТЕОРИЯ" --- */}
            {selectedRouteStep && !showRouteForm && (
                <div style={modalOverlay as any} onClick={closeRouteModal}>
                    <div className="tasks-modal custom-scroll" style={{...modalContent, maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'30px'}}>
                            <div>
                                <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase'}}>ТЕОРИЯ • {selectedRouteStep.time}</span>
                                <h2 style={{fontSize:'28px', color:'#fff', fontWeight:'900', marginTop:'5px', margin:'0'}}>{selectedRouteStep.title}</h2>
                            </div>
                            <div onClick={closeRouteModal} style={{cursor:'pointer', fontSize:'28px', color:'#ff4d4d', fontWeight:'bold', lineHeight: 1}}>✕</div>
                        </div>

                        <div className="tasks-theory-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '35px'}}>
                            {selectedRouteStep.h1 && (
                                <div className="tasks-theory-block" style={theoryBlock as any}>
                                    <div style={theoryLabel as any}>{selectedRouteStep.h1}</div>
                                    <p style={theoryText as any}>{selectedRouteStep.t1}</p>
                                </div>
                            )}
                            {selectedRouteStep.h2 && (
                                <div className="tasks-theory-block" style={theoryBlock as any}>
                                    <div style={theoryLabel as any}>{selectedRouteStep.h2}</div>
                                    <p style={theoryText as any}>{selectedRouteStep.t2}</p>
                                </div>
                            )}
                            {selectedRouteStep.h3 && (
                                <div className="tasks-theory-block" style={theoryBlock as any}>
                                    <div style={theoryLabel as any}>{selectedRouteStep.h3}</div>
                                    <p style={theoryText as any}>{selectedRouteStep.t3}</p>
                                </div>
                            )}
                        </div>

                        {completedRoute.includes(selectedRouteStep.id) ? (
                            <button onClick={closeRouteModal} style={{...checkKnowledgeBtn, background: '#111', color: '#0abab5', border: '1px solid #0abab5'} as any}>
                                МАТЕРИАЛ ПРОЙДЕН (ЗАКРЫТЬ)
                            </button>
                        ) : (
                            <button onClick={() => handleRouteComplete(selectedRouteStep.id)} style={checkKnowledgeBtn as any}>
                                ПОДТВЕРДИТЬ ПРОХОЖДЕНИЕ
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- РЕДАКТОР АДМИНА ДЛЯ ТЕОРИИ --- */}
            {showRouteForm && (
                <div style={{...modalOverlay, alignItems: 'flex-start'} as any}>
                    <div className="tasks-modal custom-scroll" style={{...modalContent, maxWidth: '900px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'} as any}>
                        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{routeFormData.id ? 'РЕДАКТОР ТЕМЫ' : 'НОВАЯ ТЕМА'}</h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px'}}>
                            <input style={adminIn as any} placeholder="Название темы" value={routeFormData.title} onChange={e => setRouteFormData({...routeFormData, title: e.target.value})} />
                            <input style={adminIn as any} placeholder="Время на изучение (напр. 10 мин)" value={routeFormData.time} onChange={e => setRouteFormData({...routeFormData, time: e.target.value})} />
                        </div>

                        <div style={{display: 'flex', gap: '15px', marginBottom: '30px'}}>
                            <div style={{flex: 1}}>
                                <input list="route-sections" style={{...adminIn, marginBottom: 0} as any} placeholder="Раздел (Папка)" value={routeFormData.section} onChange={e => setRouteFormData({...routeFormData, section: e.target.value})} />
                                <datalist id="route-sections">
                                    {Array.from(new Set(dynamicRoute.map((r: any) => r.section).filter(Boolean))).map((sec: any) => <option key={sec} value={sec} />)}
                                </datalist>
                            </div>
                            <div style={{flex: 1}}>
                                <input list="route-subsections" style={{...adminIn, marginBottom: 0} as any} placeholder="Подраздел" value={routeFormData.subsection} onChange={e => setRouteFormData({...routeFormData, subsection: e.target.value})} />
                                <datalist id="route-subsections">
                                    {Array.from(new Set(dynamicRoute.map((r: any) => r.subsection).filter(Boolean))).map((subsec: any) => <option key={subsec} value={subsec} />)}
                                </datalist>
                            </div>
                        </div>

                        <div style={{borderTop: '1px solid #222', paddingTop: '30px'}}>
                            <h3 style={{fontSize: '20px', color: '#0abab5', marginBottom: '25px', fontWeight: '900'}}>БЛОКИ С ТЕКСТОМ (ДО 3-Х)</h3>
                            
                            <div style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px'}}>
                                <input style={{...adminIn, fontWeight: 'bold'} as any} placeholder="Заголовок блока 1" value={routeFormData.h1} onChange={e => setRouteFormData({...routeFormData, h1: e.target.value})} />
                                <textarea style={{...adminIn, height: '100px', resize: 'vertical'} as any} placeholder="Текст блока 1..." value={routeFormData.t1} onChange={e => setRouteFormData({...routeFormData, t1: e.target.value})} />
                            </div>

                            <div style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px'}}>
                                <input style={{...adminIn, fontWeight: 'bold'} as any} placeholder="Заголовок блока 2" value={routeFormData.h2} onChange={e => setRouteFormData({...routeFormData, h2: e.target.value})} />
                                <textarea style={{...adminIn, height: '100px', resize: 'vertical'} as any} placeholder="Текст блока 2..." value={routeFormData.t2} onChange={e => setRouteFormData({...routeFormData, t2: e.target.value})} />
                            </div>

                            <div style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px'}}>
                                <input style={{...adminIn, fontWeight: 'bold'} as any} placeholder="Заголовок блока 3" value={routeFormData.h3} onChange={e => setRouteFormData({...routeFormData, h3: e.target.value})} />
                                <textarea style={{...adminIn, height: '100px', resize: 'vertical'} as any} placeholder="Текст блока 3..." value={routeFormData.t3} onChange={e => setRouteFormData({...routeFormData, t3: e.target.value})} />
                            </div>
                        </div>

                        <button onClick={handleSaveRoute} style={{...saveBtn, marginTop: '30px'} as any}>СОХРАНИТЬ ТЕМУ</button>
                        <div onClick={() => setShowRouteForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {/* --- ОКНО УДАЛЕНИЯ ТЕОРИИ --- */}
            {routeToDelete && (
                <div style={{...errorOverlayStyle, zIndex: 50000} as any}>
                    <div className="tasks-modal" style={errorModalContent as any}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ ТЕМУ?</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDeleteRoute} style={{...errorBtnStyle, flex: 1} as any}>УДАЛИТЬ</button>
                            <button onClick={() => setRouteToDelete(null)} style={{...errorBtnStyle, background: '#333', color: '#fff', flex: 1} as any}>ОТМЕНА</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- МОДАЛЬНОЕ ОКНО "НОРМАТИВНЫЕ ДОКУМЕНТЫ" --- */}
            {showDocsModal && (
                <div style={modalOverlay as any} onClick={() => setShowDocsModal(false)}>
                    <div className="tasks-modal custom-scroll" style={{...modalContent, maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                            <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', margin:0}}>📚 Нормативные документы</h2>
                            <div onClick={() => setShowDocsModal(false)} style={{cursor:'pointer', fontSize:'28px', color:'#ff4d4d', fontWeight:'bold', lineHeight: 1}}>✕</div>
                        </div>

                        {normativeDocs.length > 0 ? (
                            <div className="premium-cards-container">
                                {normativeDocs.map((file: any) => (
                                    <div key={file.id} className="premium-card">
                                        <div style={{ fontSize: '11px', color: '#0abab5', fontWeight: '900', marginBottom: '8px', opacity: 0.8 }}>{file.date || 'Документ'}</div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-word', color: '#fff' }}>📄 {file.name}</h4>
                                        <div style={{ color: '#555', fontSize: '12px', marginBottom: '15px' }}>{file.size}</div>
                                        <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
                                            <div onClick={() => setPreviewFile(file)} style={{ color: '#0abab5', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>ОТКРЫТЬ</div>
                                            <div onClick={() => handleDownloadFile(file)} style={{ color: '#0abab5', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>СКАЧАТЬ ↓</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: '#666', fontSize: '15px', background: '#111', padding: '40px', borderRadius: '30px', border: '1px dashed #333', textAlign: 'center' }}>
                                Нет доступных нормативных документов.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- ПРЕВЬЮ ЭКРАН ТЕСТА --- */}
            {selectedTest && !activeTestSession && !showTestForm && (
               <div style={modalOverlay as any} onClick={closeTestModal}>
                  <div className="tasks-modal" style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'25px'}}>
                        <div>
                            <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase'}}>ПРЕДПРОСМОТР</span>
                            <h2 style={{fontSize:'24px', color:'#fff', fontWeight:'900', marginTop:'5px', marginBottom:'15px'}}>{selectedTest.title}</h2>
                            <p style={{fontSize:'14px', color:'#0abab5', fontWeight:'bold', margin:0, lineHeight:'1.4'}}>{selectedTest.subtitle}</p>
                        </div>
                        <div onClick={closeTestModal} style={{cursor:'pointer', fontSize:'24px', color:'#ff4d4d', fontWeight:'bold', paddingLeft:'15px'}}>✕</div>
                     </div>
                     <div style={{background: '#0d0f0d', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '30px'}}>
                         <h4 style={{fontSize:'11px', color:'#888', fontWeight:'900', marginBottom:'10px', textTransform:'uppercase'}}>РАЗДЕЛЫ ТЕОРИИ:</h4>
                         <p style={{fontSize:'14px', color:'#ccc', lineHeight:'1.5', margin:'0 0 15px 0'}}>{selectedTest.theory}</p>
                         <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #1a1a1a', paddingTop:'15px'}}>
                             <span style={{fontSize:'13px', color:'#888', fontWeight:'bold'}}>Вопросов: <span style={{color:'#fff'}}>{selectedTest.quiz.length}</span></span>
                             <span style={{fontSize:'13px', color:'#888', fontWeight:'bold'}}>Порог: <span style={{color:'#0abab5'}}>80%</span></span>
                         </div>
                     </div>
                     <button onClick={() => { setActiveTestSession(selectedTest); setSelectedTest(null); }} style={saveBtn as any}>ПРИСТУПИТЬ К ТЕСТУ</button>
                  </div>
               </div>
            )}

            {/* --- АКТИВНАЯ СЕССИЯ ТЕСТА (ANTI-CHEAT) --- */}
            {activeTestSession && (
               <div style={modalOverlay as any}>
                  <div className="tasks-modal" style={{...modalContent, maxWidth: '800px'} as any}>
                     <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                        <div onClick={() => {
                            if (confirm("Вы уверены, что хотите прервать тест? Прогресс будет потерян.")) {
                                setActiveTestSession(null); setCurrentQuizStep(0); setActiveAnswer(null); setTestAnswers([]); closeTestModal();
                            }
                        }} style={{...backLink, margin:0, color: '#ff4d4d'} as any}>← ПРЕРВАТЬ</div>
                        <h2 style={{fontSize:'24px', color:'#fff', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(activeTestSession.title)}</h2>
                        <div className="desktop-spacer" style={{width:'80px'}} />
                     </div>
                     <div className="anti-cheat" style={{ animation: 'fadeInUp 0.3s ease', userSelect: 'none', WebkitUserSelect: 'none' } as any} onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()}>
                        <div style={quizBox as any}>
                            <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {currentQuizStep + 1} / {activeTestSession.quiz?.length || 1}</h4>
                            <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{activeTestSession.quiz?.[currentQuizStep]?.q}</p>
                            <div style={{display:'grid', gap:'15px'}}>
                               {activeTestSession.quiz?.[currentQuizStep]?.o.map((opt:any, i:any) => (
                                   <div key={i} onClick={() => handleTestAnswer(i)} className={`test-answer-btn ${activeAnswer === i ? 'selected' : ''}`}>
                                       {opt}
                                   </div>
                               ))}
                            </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- МОДАЛКА РЕЗУЛЬТАТОВ ОСНОВНОГО ТЕСТА С ОШИБКАМИ --- */}
            {testResultModal.show && (
                <div style={{...errorOverlayStyle, zIndex: 60000} as any}>
                    <div className="tasks-modal custom-scroll" style={{...errorModalContent, maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderColor: testResultModal.isPassed ? '#0abab5' : '#ff4d4d'} as any}>
                        <div style={{ fontSize: '70px', marginBottom: '15px' }}>{testResultModal.isPassed ? '🏆' : '❌'}</div>
                        <h2 style={{ fontSize: '28px', color: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', marginBottom: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                            {testResultModal.isPassed ? 'ТЕСТ СДАН!' : 'ТЕСТ НЕ СДАН'}
                        </h2>
                        <p style={{ color: '#ccc', fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>{testResultModal.title}</p>
                        <div style={{ fontSize: '60px', fontWeight: '900', color: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', marginBottom: '20px' }}>{testResultModal.score}%</div>
                        {!testResultModal.isPassed && <p style={{ color: '#888', fontSize: '14px', marginBottom: '25px' }}>Минимум для прохождения: 80%</p>}

                        {testResultModal.score === 100 ? (
                            <div style={{background: 'rgba(10,186,181,0.1)', color: '#0abab5', padding: '20px', borderRadius: '15px', fontWeight: 'bold', marginBottom: '30px'}}>
                                Вы ответили правильно на все вопросы! Идеальный результат.
                            </div>
                        ) : (
                            <div style={{textAlign: 'left', marginBottom: '30px'}}>
                                <h4 style={{color: '#fff', fontSize: '18px', fontWeight: '900', marginBottom: '15px'}}>Разбор ошибок:</h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    {testResultModal.mistakes.map((m, idx) => (
                                        <div key={idx} style={{background: '#0d0f0d', padding: '20px', borderRadius: '15px', border: '1px solid #333'}}>
                                            <p style={{color: '#fff', fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0'}}>{m.q}</p>
                                            <p style={{color: '#ff4d4d', fontSize: '13px', margin: '0 0 5px 0'}}>❌ Ваш ответ: {m.userAns}</p>
                                            <p style={{color: '#0abab5', fontSize: '13px', margin: 0}}>✅ Верный ответ: {m.correctAns}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button onClick={() => { setTestResultModal({show: false, score: 0, isPassed: false, title: '', mistakes: []}); closeTestModal(); }} style={{...errorBtnStyle, background: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', color: testResultModal.isPassed ? '#000' : '#fff', marginTop: 0} as any}>
                            {testResultModal.isPassed ? 'ОТЛИЧНО' : 'ПОНЯТНО'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- СРОЧНАЯ АТТЕСТАЦИЯ (ANTI-CHEAT) --- */}
            {activeUrgentTest && (
               <div style={modalOverlay as any}>
                  <div className="tasks-modal" style={modalContent as any}>
                     <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                        <div onClick={() => {setActiveUrgentTest(null); setUrgentTestStep(0); setActiveAnswer(null); setUrgentTestAnswers([]);}} style={{...backLink, margin:0} as any}>← ОТЛОЖИТЬ</div>
                        <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(activeUrgentTest.name)}</h2>
                        <div className="desktop-spacer" style={{width:'80px'}} />
                     </div>
                     <div className="anti-cheat" style={{ animation: 'fadeInUp 0.3s ease', userSelect: 'none', WebkitUserSelect: 'none' } as any} onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()}>
                        <div style={quizBox as any}>
                            <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {urgentTestStep + 1} / {activeUrgentTest.quiz?.length || 1}</h4>
                            <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{activeUrgentTest.quiz?.[urgentTestStep]?.q}</p>
                            <div style={{display:'grid', gap:'15px'}}>
                               {activeUrgentTest.quiz?.[urgentTestStep]?.o.map((opt:any, i:any) => (
                                   <div key={i} onClick={() => handleUrgentTestAnswer(i)} className={`test-answer-btn ${activeAnswer === i ? 'selected' : ''}`}>
                                       {opt}
                                   </div>
                               ))}
                            </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- РЕДАКТОР АДМИНА ДЛЯ ТЕСТОВ --- */}
            {showTestForm && (
                <div style={{...modalOverlay, alignItems: 'flex-start'} as any}>
                    <div className="tasks-modal custom-scroll" style={{...modalContent, maxWidth: '900px', margin: '0 auto'} as any}>
                        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{testFormData.id ? 'РЕДАКТОР ТЕСТА' : 'НОВЫЙ ТЕСТ'}</h2>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px'}}>
                            <input style={{...adminIn, marginBottom: 0} as any} placeholder="Название теста" value={testFormData.title} onChange={e => setTestFormData({...testFormData, title: e.target.value})} />
                            <input style={{...adminIn, marginBottom: 0} as any} placeholder="Подзаголовок (описание)" value={testFormData.subtitle} onChange={e => setTestFormData({...testFormData, subtitle: e.target.value})} />
                            <input style={{...adminIn, marginBottom: 0} as any} placeholder="Разделы теории (через запятую)" value={testFormData.theory} onChange={e => setTestFormData({...testFormData, theory: e.target.value})} />
                        </div>
                        
                        <div style={{display: 'flex', gap: '15px', marginBottom: '30px'}}>
                            <div style={{flex: 1}}>
                                <input list="test-sections" style={{...adminIn, marginBottom: 0} as any} placeholder="Раздел (Папка)" value={testFormData.section} onChange={e => setTestFormData({...testFormData, section: e.target.value})} />
                                <datalist id="test-sections">
                                    {Array.from(new Set(dynamicTests.map((t: any) => t.section).filter(Boolean))).map((sec: any) => <option key={sec} value={sec} />)}
                                </datalist>
                            </div>
                            <div style={{flex: 1}}>
                                <input list="test-subsections" style={{...adminIn, marginBottom: 0} as any} placeholder="Подраздел" value={testFormData.subsection} onChange={e => setTestFormData({...testFormData, subsection: e.target.value})} />
                                <datalist id="test-subsections">
                                    {Array.from(new Set(dynamicTests.map((t: any) => t.subsection).filter(Boolean))).map((subsec: any) => <option key={subsec} value={subsec} />)}
                                </datalist>
                            </div>
                        </div>

                        <div style={{borderTop: '1px solid #222', paddingTop: '30px'}}>
                            <h3 style={{fontSize: '20px', color: '#0abab5', marginBottom: '25px', fontWeight: '900'}}>ВОПРОСЫ ({testFormData.quiz.length})</h3>
                            {testFormData.quiz.map((q: any, qIdx: number) => (
                                <div key={qIdx} style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                                    {testFormData.quiz.length > 1 && <div onClick={() => removeTestQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'} as any}>✕</div>}
                                    <input style={{...adminIn, fontWeight: 'bold'} as any} placeholder="Текст вопроса..." value={q.q} onChange={e => updateTestQuestion(qIdx, 'q', e.target.value)} />
                                    <div className="tasks-quiz-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                        {[0,1,2,3].map((i: number) => (
                                            <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                                <label style={{display:'flex', gap:'5px', cursor:'pointer', color: q.c === i ? '#0abab5' : '#fff', fontWeight: 'bold'}}><input type="radio" checked={q.c === i} onChange={() => updateTestQuestion(qIdx, 'c', i)} /> Правильный: Вариант {i+1}</label>
                                                <input style={{...adminIn, marginBottom: 0, borderColor: q.c === i ? '#0abab5' : '#222'} as any} placeholder={`Текст варианта ${i+1}`} value={q.o[i]} onChange={e => updateTestQuestion(qIdx, `o${i}`, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button onClick={addTestQuestion} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'} as any}>+ ДОБАВИТЬ ВОПРОС</button>
                        </div>
                        <button onClick={handleSaveTestForm} style={{...saveBtn, marginTop: '30px'} as any}>СОХРАНИТЬ ТЕСТ</button>
                        <div onClick={() => setShowTestForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {testToDelete && (
                <div style={{...errorOverlayStyle, zIndex: 50000} as any}>
                    <div className="tasks-modal" style={errorModalContent as any}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ ТЕСТ?</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDeleteTest} style={{...errorBtnStyle, flex: 1} as any}>УДАЛИТЬ</button>
                            <button onClick={() => setTestToDelete(null)} style={{...errorBtnStyle, background: '#333', color: '#fff', flex: 1} as any}>ОТМЕНА</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ПРЕДПРОСМОТР ЛЮБОГО ФАЙЛА --- */}
            {previewFile && (
                <div style={{...modalOverlay, zIndex: 20000} as any} onClick={() => setPreviewFile(null)}>
                    <div className="tasks-modal" style={{ ...modalContentSmall, maxWidth: '80%', height: '85vh', padding: '25px', display: 'flex', flexDirection: 'column' } as any} onClick={e => e.stopPropagation()}>
                        <div className="tasks-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                            <h2 style={{ color: '#0abab5', fontWeight: '900', fontSize: '18px', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile?.name}</h2>
                            <div onClick={() => setPreviewFile(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1 }}>✕</div>
                        </div>
                        <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                            {previewFile.data ? (
                                previewFile.name?.toLowerCase().match(/\.(docx|doc|xls|xlsx|ppt|pptx|zip|rar)$/i) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', textAlign: 'center', padding: '20px' }}>
                                        <div style={{ fontSize: '60px', marginBottom: '15px' }}>📄</div>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Формат не поддерживается</h3>
                                        <p style={{ color: '#555', fontSize: '14px', maxWidth: '350px', lineHeight: '1.5' }}>Браузеры не умеют открывать этот формат прямо внутри сайта. Вы можете скачать файл.</p>
                                        <button onClick={() => handleDownloadFile(previewFile)} style={{ ...saveBtn, width: 'auto', padding: '12px 30px', marginTop: '20px', borderRadius: '12px' } as any}>СКАЧАТЬ ФАЙЛ</button>
                                    </div>
                                ) : (
                                    <iframe src={previewFile.data} style={{ width: '100%', height: '100%', border: 'none' }} title="Предпросмотр файла" />
                                )
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>
                                    Нет данных для отображения (загружено в старой версии)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ГЛОБАЛЬНЫЕ СТИЛИ КОМПОНЕНТА */}
            <style jsx global>{`
                .anti-cheat { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
                .test-answer-btn { padding: 20px 30px; background: #111; color: #fff; border-radius: 18px; cursor: pointer; border: 1px solid #222; font-weight: 800; margin-bottom: 12px; transition: all 0.2s ease; }
                .test-answer-btn:hover { border-color: #0abab5; background: rgba(10, 186, 181, 0.05); transform: translateY(-2px); }
                .test-answer-btn.selected { background: #0abab5 !important; color: #000 !important; border-color: #0abab5 !important; transform: scale(0.98); }
                
                .normative-docs-btn {
                    width: 100%;
                    padding: 22px;
                    background: #111;
                    color: #fff;
                    border: 1px solid #222;
                    border-radius: 20px;
                    font-size: 18px;
                    font-weight: 900;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    transition: 0.3s;
                }
                .normative-docs-btn:hover {
                    border-color: #0abab5;
                    box-shadow: 0 5px 25px rgba(10,186,181,0.15);
                    transform: translateY(-2px);
                }
                .doc-count-badge {
                    background: #0abab5;
                    color: #000;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 14px;
                }

                @media (min-width: 769px) {
                    .premium-cards-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
                        gap: 20px;
                        width: 100%;
                    }
                }

                .premium-card {
                    background: #111;
                    border-radius: 14px; 
                    border: 1px solid #222;
                    transition: all 0.2s ease;
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-height: 140px; 
                    padding: 20px; 
                    box-sizing: border-box; 
                    overflow: hidden;
                }

                .premium-card:hover {
                    border-color: #0abab5;
                    transform: translateY(-3px);
                }

                .premium-card:active {
                    background: rgba(10, 186, 181, 0.05); 
                    border-color: #0abab5;
                    transform: scale(0.98); 
                }

                .deadline-card:hover {
                    border-color: #ff4d4d !important;
                    box-shadow: 0 8px 25px rgba(255, 77, 77, 0.15) !important;
                }
                .deadline-card:active {
                    background: rgba(255, 77, 77, 0.05) !important;
                    border-color: #ff4d4d !important;
                }

                @media (max-width: 768px) {
                    .premium-cards-container { 
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 10px !important; 
                    }
                    .premium-card {
                        width: 100% !important;
                        max-width: none !important; 
                        padding: 15px !important;
                        min-height: 120px !important;
                    }
                    .premium-card h4 { font-size: 13px !important; margin-bottom: 10px !important; }
                    .premium-card span { font-size: 10px !important; }
                    
                    .tasks-theory-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-quiz-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
                    
                    .tasks-modal { 
                        padding: 30px 20px !important; 
                        border-radius: 25px !important; 
                        width: 95% !important; 
                        max-height: 90vh !important; 
                    }
                    .tasks-theory-block { padding: 20px !important; border-radius: 20px !important; }
                    
                    .tasks-modal-header { flex-direction: column; align-items: flex-start !important; gap: 15px; margin-bottom: 25px !important; }
                    .tasks-modal-header h2 { font-size: 20px !important; padding: 0 !important; text-align: left !important; }
                    .desktop-spacer { display: none !important; }
                    
                    .normative-docs-btn {
                        padding: 16px;
                        font-size: 15px;
                    }
                }
            `}</style>
        </section>
    );
}

// --- СТИЛИ БЛОКОВ И КАРТОЧЕК ---
const pBarBg: React.CSSProperties = { height: '8px', background: '#222', borderRadius: '4px', marginTop: '15px', marginBottom: '10px' };
const pBarFill = (w: number): React.CSSProperties => ({ width: `${w}%`, height: '100%', background: '#0abab5', borderRadius: '4px', transition: '1s' });
const sectionTitle: React.CSSProperties = { fontSize: '28px', fontWeight: '900', marginBottom: '35px' };
const cardFooter: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '800', color: '#666' };
const backLink: React.CSSProperties = { color: '#0abab5', fontWeight: '900', marginBottom: '30px', cursor: 'pointer', display: 'inline-block', fontSize: '15px' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', padding: '20px', boxSizing: 'border-box' };
const modalContent: React.CSSProperties = { background: '#000', padding: '60px', borderRadius: '50px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentSmall: React.CSSProperties = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #333' };
const theoryBlock: React.CSSProperties = { background: '#0d0d0d', padding: '30px', borderRadius: '25px', border: '1px solid #222' };
const theoryLabel: React.CSSProperties = { fontSize: '15px', fontWeight: '800', color: '#0abab5', letterSpacing: '0.5px', marginBottom: '12px' };
const theoryText: React.CSSProperties = { fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0 };
const checkKnowledgeBtn: React.CSSProperties = { width: '100%', padding: '25px', background: 'transparent', border: '2px solid #0abab5', color: '#0abab5', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', transition: '0.3s' };
const quizBox: React.CSSProperties = { borderTop: '1px solid #222', paddingTop: '40px', marginTop: '10px' };
const flexSpace: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };
const errorOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 40000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' };
const errorModalContent: React.CSSProperties = { background: '#111', padding: '50px', borderRadius: '40px', border: '2px solid #222', textAlign: 'center', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' };
const errorBtnStyle: React.CSSProperties = { border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', letterSpacing: '1px', marginTop: '15px', width: '100%' };
const adminIn: React.CSSProperties = { width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '15px' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '20px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '10px', fontSize: '16px' };
const adminActionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const editIconStyle: React.CSSProperties = { background: '#111', color: '#0abab5', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };
const delIconStyle: React.CSSProperties = { background: '#111', color: '#ff4d4d', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };
const moveIconStyle: React.CSSProperties = { background: '#111', color: '#fff', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };