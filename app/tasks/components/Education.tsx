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

// 💡 ИЗОЛИРОВАННЫЙ ВИДЕОПЛЕЕР (Защита от перезагрузки при тиках таймера)
const MemoizedVideoPlayer = React.memo(({ iframeStr, descText }: { iframeStr: string, descText: string }) => {
    return (
        <div style={{ background: '#0d0d0d', padding: '20px', borderRadius: '25px', border: '1px solid #222', marginBottom: '35px' }}>
            {iframeStr ? (
                <div className="video-wrapper" dangerouslySetInnerHTML={{ __html: iframeStr }} />
            ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontStyle: 'italic', background: '#111', borderRadius: '15px' }}>Видео не прикреплено</div>
            )}
            {descText && <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0, marginTop: '20px', padding: '0 10px' }}>{descText}</p>}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.iframeStr === nextProps.iframeStr && prevProps.descText === nextProps.descText;
});

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
        mediaType: 'text', videoIframe: '', videoDesc: '',
        h1: '', t1: '', img1: '', 
        h2: '', t2: '', img2: '', 
        h3: '', t3: '', img3: '' 
    });

    const [showTestForm, setShowTestForm] = useState(false);
    const [testFormData, setTestFormData] = useState({
        id: '', title: '', subtitle: '', theory: '', section: '', subsection: '',
        quiz: [{ q: '', o: ['', '', '', ''], c: 0 }] 
    });

    const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, type: 'route'|'test'|'section_route'|'section_test', targetId: string, name: string}>({
        isOpen: false, type: 'route', targetId: '', name: ''
    });

    const [renameSectionPrompt, setRenameSectionPrompt] = useState<{isOpen: boolean, type: 'route'|'test', oldName: string, newName: string}>({
        isOpen: false, type: 'route', oldName: '', newName: ''
    });

    const [promptSection, setPromptSection] = useState<{isOpen: boolean, type: 'route'|'test', name: string}>({
        isOpen: false, type: 'route', name: ''
    });

    const [movingItem, setMovingItem] = useState<{id: string, type: 'route' | 'test'} | null>(null);
    const [moveNewSectionName, setMoveNewSectionName] = useState('');

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

    // 💡 ЕДИНЫЕ ФУНКЦИИ СИНХРОНИЗАЦИИ (ФИКС МЕРЦАНИЯ ПРИ УДАЛЕНИИ И СОХРАНЕНИИ)
    const updateRouteState = (newData: any[]) => {
        setDynamicRoute(newData);
        localStorage.setItem('th_cache_route', JSON.stringify(newData));
        saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, newData);
    };

    const updateTestsState = (newData: any[]) => {
        setDynamicTests(newData);
        localStorage.setItem('th_cache_tests', JSON.stringify(newData));
        saveDataToServer(STORAGE_KEYS.DYNAMIC_TESTS, newData);
    };

    // --- ЛОГИКА ФИЛЬТРАЦИИ СРОЧНЫХ ЗАДАНИЙ ---
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

    // --- ЛОГИКА ТЕОРИИ ---
    const handleSaveRoute = () => {
        if (!routeFormData.title.trim()) { alert("Введите название темы!"); return; }
        let newList = [...dynamicRoute];
        if (routeFormData.id) {
            newList = newList.map((r: any) => r.id === routeFormData.id ? routeFormData : r);
        } else {
            newList.push({ ...routeFormData, id: 'route_' + Date.now() });
        }
        updateRouteState(newList);
        setShowRouteForm(false);
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

    // --- ЛОГИКА ТЕСТОВ ---
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
        const newQuiz = testFormData.quiz.filter((_: any, i: number) => i !== index);
        setTestFormData({...testFormData, quiz: newQuiz});
    };

    const handleSaveTestForm = () => {
        if (!testFormData.title.trim()) { alert("Введите название теста!"); return; }
        const newTest = {
            id: testFormData.id || ('t_' + Date.now()),
            title: testFormData.title,
            subtitle: testFormData.subtitle,
            theory: testFormData.theory,
            section: testFormData.section,
            subsection: testFormData.subsection,
            quiz: testFormData.quiz.map((q: any) => ({
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
        updateTestsState(newList);
        setShowTestForm(false);
    };

    // --- УПРАВЛЕНИЕ РАЗДЕЛАМИ ---
    const handleMoveItem = (targetSection: string) => {
        if (!movingItem) return;
        if (movingItem.type === 'route') {
            const itemToMove = dynamicRoute.find((r: any) => r.id === movingItem.id);
            const sourceSection = itemToMove?.section?.trim() || 'Основной раздел';
            
            const updated = dynamicRoute.map((r: any) => r.id === movingItem.id ? { ...r, section: targetSection, subsection: '' } : r);
            
            // Защита: если перенесли последний урок из папки, оставляем пустышку
            const sourceHasItems = updated.some((r: any) => (r.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') {
                updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            }
            updateRouteState(updated);
        } else {
            const itemToMove = dynamicTests.find((t: any) => t.id === movingItem.id);
            const sourceSection = itemToMove?.section?.trim() || 'Основной раздел';
            
            const updated = dynamicTests.map((t: any) => t.id === movingItem.id ? { ...t, section: targetSection, subsection: '' } : t);
            
            // Защита: если перенесли последний тест из папки, оставляем пустышку
            const sourceHasItems = updated.some((t: any) => (t.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') {
                updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            }
            updateTestsState(updated);
        }
        setMovingItem(null);
        setMoveNewSectionName('');
    };

    const executeDelete = () => {
        if (confirmDelete.type === 'section_route') {
            const updated = dynamicRoute.filter((r: any) => (r.section?.trim() || 'Основной раздел') !== confirmDelete.targetId);
            updateRouteState(updated);
        } else if (confirmDelete.type === 'section_test') {
            const updated = dynamicTests.filter((t: any) => (t.section?.trim() || 'Основной раздел') !== confirmDelete.targetId);
            updateTestsState(updated);
        } else if (confirmDelete.type === 'route') {
            const itemToDelete = dynamicRoute.find((r: any) => r.id === confirmDelete.targetId);
            const sourceSection = itemToDelete?.section?.trim() || 'Основной раздел';
            
            const updated = dynamicRoute.filter((r: any) => r.id !== confirmDelete.targetId);
            
            // Защита папки
            const sourceHasItems = updated.some((r: any) => (r.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') {
                updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            }
            updateRouteState(updated);
        } else if (confirmDelete.type === 'test') {
            const itemToDelete = dynamicTests.find((t: any) => t.id === confirmDelete.targetId);
            const sourceSection = itemToDelete?.section?.trim() || 'Основной раздел';
            
            const updated = dynamicTests.filter((t: any) => t.id !== confirmDelete.targetId);
            
            // Защита папки
            const sourceHasItems = updated.some((t: any) => (t.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') {
                updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            }
            updateTestsState(updated);
        }
        setConfirmDelete({ isOpen: false, type: 'route', targetId: '', name: '' });
    };

    const confirmRenameSection = () => {
        if (!renameSectionPrompt.newName.trim()) return;
        const newName = renameSectionPrompt.newName.trim();
        const oldName = renameSectionPrompt.oldName;
        
        if (renameSectionPrompt.type === 'route') {
            const updated = dynamicRoute.map((r: any) => (r.section?.trim() || 'Основной раздел') === oldName ? { ...r, section: newName } : r);
            updateRouteState(updated);
        } else {
            const updated = dynamicTests.map((t: any) => (t.section?.trim() || 'Основной раздел') === oldName ? { ...t, section: newName } : t);
            updateTestsState(updated);
        }
        setRenameSectionPrompt({ isOpen: false, type: 'route', oldName: '', newName: '' });
    };

    const confirmPromptSection = () => {
        if (!promptSection.name.trim()) return;
        const newSecName = promptSection.name.trim();

        if (promptSection.type === 'route') {
            const placeholder = { id: 'placeholder_' + Date.now(), section: newSecName, isPlaceholder: true };
            const updated = [...dynamicRoute, placeholder];
            updateRouteState(updated);
        } else {
            const placeholder = { id: 'placeholder_' + Date.now(), section: newSecName, isPlaceholder: true };
            const updated = [...dynamicTests, placeholder];
            updateTestsState(updated);
        }
        setPromptSection({ isOpen: false, type: 'route', name: '' });
    };

    // --- ГРУППИРОВКА ---
    const groupItems = (items: any[]) => {
        const groups: Record<string, Record<string, any[]>> = {};
        items.forEach((item: any) => {
            const sec = item.section?.trim() || 'Основной раздел';
            const subsec = item.subsection?.trim() || '';
            if (!groups[sec]) groups[sec] = {};
            if (!groups[sec][subsec]) groups[sec][subsec] = [];
            
            if (!item.isPlaceholder) {
                groups[sec][subsec].push(item);
            }
        });
        return groups;
    };

    const theoryGroups = groupItems(dynamicRoute || []);
    const testGroups = groupItems(dynamicTests || []);
    const realTests = (dynamicTests || []).filter((t: any) => !t.isPlaceholder);

    // --- ПРОХОЖДЕНИЕ ТЕСТА ---
    const handleTestAnswer = (idx: number) => {
        if (activeAnswer !== null) return; 
        setActiveAnswer(idx);
        const newAnswers = [...testAnswers, idx];
        setTestAnswers(newAnswers);
        setTimeout(() => { 
            if (currentQuizStep < activeTestSession.quiz.length - 1) {
                setCurrentQuizStep((v: number) => v + 1); 
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
                mistakesArray.push({ q: q.q, userAns: q.o[answers[i]], correctAns: q.o[q.c] });
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

    // --- ПРОХОЖДЕНИЕ АТТЕСТАЦИИ ---
    const handleUrgentTestAnswer = (idx: number) => {
        if (activeAnswer !== null) return; 
        setActiveAnswer(idx);
        const newAnswers = [...urgentTestAnswers, idx];
        setUrgentTestAnswers(newAnswers);

        setTimeout(() => { 
            if (urgentTestStep < activeUrgentTest.quiz.length - 1) {
                setUrgentTestStep((v: number) => v + 1); 
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
            <div style={{ marginBottom: '50px', width: '100%', boxSizing: 'border-box' }}>
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

            {/* --- БЛОК 1: ТЕОРИЯ --- */}
            <div className="tasks-flex-space" style={flexSpace}>
               <h2 className="tasks-title" style={sectionTitle}>Теория</h2>
               {isAdmin && (
                   <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                       <button onClick={() => setPromptSection({isOpen: true, type: 'route', name: ''})} style={adminActionBtn}>+ НОВЫЙ РАЗДЕЛ</button>
                       <button onClick={() => { 
                           setRouteFormData({ id: '', title: '', time: '5 мин', section: '', subsection: '', mediaType: 'text', videoIframe: '', videoDesc: '', h1: '', t1: '', img1: '', h2: '', t2: '', img2: '', h3: '', t3: '', img3: '' }); 
                           setShowRouteForm(true); 
                       }} style={{...adminActionBtn, background: '#0abab5', color: '#000'}}>+ НОВАЯ ТЕМА</button>
                   </div>
               )}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.entries(theoryGroups).map(([secName, subsecs]: any) => (
                   <div key={secName} style={{ marginBottom: '40px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px' }}>
                           <h3 style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>📁 {secName}</h3>
                           {isAdmin && secName !== 'Основной раздел' && (
                               <div style={{display: 'flex', gap: '15px'}}>
                                   <span onClick={() => setRenameSectionPrompt({isOpen: true, type: 'route', oldName: secName, newName: secName})} style={{ color: '#0abab5', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✎ РЕДАКТИРОВАТЬ</span>
                                   <span onClick={() => setConfirmDelete({isOpen: true, type: 'section_route', targetId: secName, name: secName})} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✕ УДАЛИТЬ</span>
                               </div>
                           )}
                       </div>
                       
                       {Object.entries(subsecs).map(([subsecName, items]: any) => (
                           <div key={subsecName} style={{ marginBottom: '20px' }}>
                               {subsecName && (
                                   <h4 style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px', marginLeft: '5px' }}>• {subsecName}</h4>
                               )}
                               <div className="premium-cards-container">
                                   {items.length === 0 ? (
                                       <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic', padding: '10px 5px' }}>
                                           В этом разделе пока нет материалов...
                                       </div>
                                   ) : (
                                       items.map((step: any, idx: number) => {
                                           const isDone = completedRoute.includes(step.id);
                                           return (
                                               <div key={step.id} onClick={() => setSelectedRouteStep(step)} className="premium-card">
                                                  {isAdmin && (
                                                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                                          <div onClick={(e) => { e.stopPropagation(); setMovingItem({id: step.id, type: 'route'}); }} style={moveIconStyle} title="Переместить">📦</div>
                                                          <div onClick={(e) => { 
                                                              e.stopPropagation(); 
                                                              setRouteFormData({
                                                                  id: step.id, title: step.title, time: step.time || '5 мин', 
                                                                  section: step.section || '', subsection: step.subsection || '',
                                                                  mediaType: step.mediaType || 'text', videoIframe: step.videoIframe || '', videoDesc: step.videoDesc || '',
                                                                  h1: step.h1, t1: step.t1, img1: step.img1 || '', 
                                                                  h2: step.h2, t2: step.t2, img2: step.img2 || '', 
                                                                  h3: step.h3, t3: step.t3, img3: step.img3 || ''
                                                              }); 
                                                              setShowRouteForm(true); 
                                                          }} style={editIconStyle} title="Редактировать">✎</div>
                                                          <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, type: 'route', targetId: step.id, name: step.title}); }} style={delIconStyle} title="Удалить">✕</div>
                                                      </div>
                                                  )}
                                                  <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px'}}>Урок {idx+1}</span>
                                                  <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(step.title)}</h4>
                                                  
                                                  <div style={{ marginTop: 'auto' }}>
                                                      <div style={pBarBg}>
                                                          <div style={pBarFill(isDone ? 100 : 0)} />
                                                      </div>
                                                      <div style={cardFooter}><span>{isDone ? 'Выполнено' : 'Начать'}</span><span>{step.mediaType === 'video' ? '🎥 Видео' : '📝 Чтение'} • {step.time}</span></div>
                                                  </div>
                                               </div>
                                           );
                                       })
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               ))}
            </div>

            {/* --- БЛОК 2: ТЕСТЫ --- */}
            <div className="tasks-flex-space" style={flexSpace}>
                <h2 className="tasks-title" style={sectionTitle}>Тесты</h2>
                {isAdmin && (
                   <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                       <button onClick={() => setPromptSection({isOpen: true, type: 'test', name: ''})} style={adminActionBtn}>+ НОВЫЙ РАЗДЕЛ</button>
                       <button onClick={() => { 
                           setTestFormData({ id: '', title: '', subtitle: '', theory: '', section: '', subsection: '', quiz: [{ q: '', o: ['', '', '', ''], c: 0 }] }); 
                           setShowTestForm(true); 
                       }} style={{...adminActionBtn, background: '#0abab5', color: '#000'}}>+ НОВЫЙ ТЕСТ</button>
                   </div>
                )}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.entries(testGroups).map(([secName, subsecs]: any) => (
                   <div key={secName} style={{ marginBottom: '40px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px' }}>
                           <h3 style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>📋 {secName}</h3>
                           {isAdmin && secName !== 'Основной раздел' && (
                               <div style={{display: 'flex', gap: '15px'}}>
                                   <span onClick={() => setRenameSectionPrompt({isOpen: true, type: 'test', oldName: secName, newName: secName})} style={{ color: '#0abab5', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✎ РЕДАКТИРОВАТЬ</span>
                                   <span onClick={() => setConfirmDelete({isOpen: true, type: 'section_test', targetId: secName, name: secName})} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✕ УДАЛИТЬ</span>
                               </div>
                           )}
                       </div>
                       
                       {Object.entries(subsecs).map(([subsecName, items]: any) => (
                           <div key={subsecName} style={{ marginBottom: '20px' }}>
                               {subsecName && (
                                   <h4 style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px', marginLeft: '5px' }}>• {subsecName}</h4>
                               )}
                               <div className="premium-cards-container">
                                   {items.length === 0 ? (
                                       <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic', padding: '10px 5px' }}>
                                           В этом разделе пока нет тестов...
                                       </div>
                                   ) : (
                                       items.map((test: any, idx: number) => {
                                           const isDone = completedTests.includes(test.id);
                                           const globalIdx = realTests.findIndex((t: any) => t.id === test.id);
                                           const isUnlocked = isAdmin || globalIdx <= 0 || completedTests.includes(realTests[globalIdx - 1]?.id);
                                           
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
                                                           <div onClick={(e) => { e.stopPropagation(); setMovingItem({id: test.id, type: 'test'}); }} style={moveIconStyle} title="Переместить">📦</div>
                                                           <div onClick={(e) => { 
                                                               e.stopPropagation(); 
                                                               setTestFormData({
                                                                   id: test.id, title: test.title, subtitle: test.subtitle, theory: test.theory,
                                                                   section: test.section || '', subsection: test.subsection || '',
                                                                   quiz: test.quiz && test.quiz.length > 0 ? JSON.parse(JSON.stringify(test.quiz)) : [{ q: '', o: ['', '', '', ''], c: 0 }]
                                                               }); 
                                                               setShowTestForm(true); 
                                                           }} style={editIconStyle} title="Редактировать">✎</div>
                                                           <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, type: 'test', targetId: test.id, name: test.title}); }} style={delIconStyle} title="Удалить">✕</div>
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
                                       })
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               ))}
            </div>

            {/* --- МИНИ-ОКНО: СОЗДАТЬ НОВЫЙ РАЗДЕЛ --- */}
            {promptSection.isOpen && (
                <div style={modalOverlay as any} onClick={() => setPromptSection({isOpen: false, type: 'route', name: ''})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900'}}>НОВЫЙ РАЗДЕЛ</h2>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название раздела</div>
                        <input style={adminIn as any} autoFocus placeholder="Например: Основы заваривания" value={promptSection.name} onChange={e => setPromptSection({...promptSection, name: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setPromptSection({isOpen: false, type: 'route', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={confirmPromptSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОЗДАТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- МИНИ-ОКНО: ПЕРЕИМЕНОВАТЬ РАЗДЕЛ --- */}
            {renameSectionPrompt.isOpen && (
                <div style={modalOverlay as any} onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>ПЕРЕИМЕНОВАТЬ РАЗДЕЛ</h2>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Новое название</div>
                        <input style={adminIn as any} autoFocus placeholder="Название..." value={renameSectionPrompt.newName} onChange={e => setRenameSectionPrompt({...renameSectionPrompt, newName: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={confirmRenameSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОХРАНИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- МИНИ-ОКНО: ПЕРЕМЕСТИТЬ --- */}
            {movingItem && (
                <div style={modalOverlay as any} onClick={() => { setMovingItem(null); setMoveNewSectionName(''); }}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>Переместить в раздел</h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px'}} className="custom-scroll">
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginLeft: '5px' }}>Выбрать существующий:</div>
                            {Array.from(new Set(
                                (movingItem.type === 'route' ? dynamicRoute : dynamicTests)
                                .map((i: any) => i.section?.trim() || 'Основной раздел')
                            )).map((sec: any) => (
                                <button key={sec} onClick={() => handleMoveItem(sec)} style={{...adminIn, textAlign: 'left', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #333'} as any}>{sec}</button>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Или создать новый раздел:</div>
                            <input style={adminIn as any} placeholder="Название нового раздела..." value={moveNewSectionName} onChange={e => setMoveNewSectionName(e.target.value)} />
                            <button onClick={() => {
                                if (moveNewSectionName.trim()) handleMoveItem(moveNewSectionName.trim());
                            }} style={{...adminActionBtn, marginTop: '10px', width: '100%', padding: '16px'} as any}>СОЗДАТЬ И ПЕРЕМЕСТИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- СТИЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ --- */}
            {confirmDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmDelete({isOpen: false, type: 'route', targetId: '', name: ''})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>УДАЛИТЬ?</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>
                            {confirmDelete.type.startsWith('section') 
                                ? `Вы уверены, что хотите удалить весь раздел "${confirmDelete.name}" и ВСЕ вложенные в него материалы? Это действие необратимо.` 
                                : `Удалить карточку "${confirmDelete.name}" безвозвратно?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <button onClick={() => setConfirmDelete({isOpen: false, type: 'route', targetId: '', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={executeDelete} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>УДАЛИТЬ</button>
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

            {/* --- 💡 ПРЕДПРОСМОТР КАРТОЧКИ "ТЕОРИЯ" (С ВИДЕО И ФОТО) --- */}
            {selectedRouteStep && !showRouteForm && (
                <div style={modalOverlay as any} onClick={closeRouteModal}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentLarge, maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'30px'}}>
                            <div>
                                <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase'}}>ТЕОРИЯ • {selectedRouteStep.time}</span>
                                <h2 style={{fontSize:'28px', color:'#fff', fontWeight:'900', marginTop:'5px', margin:'0'}}>{selectedRouteStep.title}</h2>
                            </div>
                            <div onClick={closeRouteModal} style={{cursor:'pointer', fontSize:'28px', color:'#ff4d4d', fontWeight:'bold', lineHeight: 1}}>✕</div>
                        </div>

                        {/* 💡 ВЫВОД ИЗОЛИРОВАННОГО ВИДЕОПЛЕЕРА ИЛИ ТЕКСТА */}
                        {selectedRouteStep.mediaType === 'video' ? (
                            <MemoizedVideoPlayer 
                                iframeStr={selectedRouteStep.videoIframe || ''} 
                                descText={selectedRouteStep.videoDesc || ''} 
                            />
                        ) : (
                            <div className="tasks-theory-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '35px'}}>
                                {selectedRouteStep.h1 && (
                                    <div className="tasks-theory-block" style={theoryBlock as any}>
                                        {selectedRouteStep.img1 && <img src={selectedRouteStep.img1} alt="" style={{width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '15px', marginBottom: '15px', background: '#111'}} />}
                                        <div style={theoryLabel as any}>{selectedRouteStep.h1}</div>
                                        <p style={theoryText as any}>{selectedRouteStep.t1}</p>
                                    </div>
                                )}
                                {selectedRouteStep.h2 && (
                                    <div className="tasks-theory-block" style={theoryBlock as any}>
                                        {selectedRouteStep.img2 && <img src={selectedRouteStep.img2} alt="" style={{width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '15px', marginBottom: '15px', background: '#111'}} />}
                                        <div style={theoryLabel as any}>{selectedRouteStep.h2}</div>
                                        <p style={theoryText as any}>{selectedRouteStep.t2}</p>
                                    </div>
                                )}
                                {selectedRouteStep.h3 && (
                                    <div className="tasks-theory-block" style={theoryBlock as any}>
                                        {selectedRouteStep.img3 && <img src={selectedRouteStep.img3} alt="" style={{width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '15px', marginBottom: '15px', background: '#111'}} />}
                                        <div style={theoryLabel as any}>{selectedRouteStep.h3}</div>
                                        <p style={theoryText as any}>{selectedRouteStep.t3}</p>
                                    </div>
                                )}
                            </div>
                        )}

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

            {/* 💡 РЕДАКТОР АДМИНА ДЛЯ ТЕОРИИ (С ФИКСАМИ И ЗАГРУЗКОЙ) */}
            {showRouteForm && (
                <div style={{...modalOverlay, alignItems: 'center'} as any} onClick={() => setShowRouteForm(false)}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentMedium, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0abab5', fontWeight: '900', textTransform: 'uppercase' }}>
                            {routeFormData.id ? 'РЕДАКТОР ТЕМЫ' : 'НОВАЯ ТЕМА'}
                        </h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px'}}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название темы</div>
                                <input autoComplete="new-password" style={adminIn as any} placeholder="Например: Основы зеленого чая" value={routeFormData.title} onChange={e => setRouteFormData({...routeFormData, title: e.target.value})} />
                            </div>
                            
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Раздел (Папка)</div>
                                    <input list="route-sections" autoComplete="new-password" style={adminIn as any} placeholder="Напр. Введение" value={routeFormData.section} onChange={e => setRouteFormData({...routeFormData, section: e.target.value})} />
                                    <datalist id="route-sections">{Array.from(new Set(dynamicRoute.map((r: any) => r.section).filter(Boolean))).map((sec: any) => <option key={sec} value={sec} />)}</datalist>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Подраздел</div>
                                    <input list="route-subsections" autoComplete="new-password" style={adminIn as any} placeholder="Напр. Практика" value={routeFormData.subsection} onChange={e => setRouteFormData({...routeFormData, subsection: e.target.value})} />
                                    <datalist id="route-subsections">{Array.from(new Set(dynamicRoute.map((r: any) => r.subsection).filter(Boolean))).map((subsec: any) => <option key={subsec} value={subsec} />)}</datalist>
                                </div>
                            </div>
                            
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Время на изучение</div>
                                <input autoComplete="new-password" style={adminIn as any} placeholder="Напр. 10 мин" value={routeFormData.time} onChange={e => setRouteFormData({...routeFormData, time: e.target.value})} />
                            </div>
                        </div>

                        <div style={{borderTop: '1px solid #222', paddingTop: '20px'}}>
                            
                            {/* Слайдер выбора формата */}
                            <div style={{ display: 'flex', background: '#111', borderRadius: '12px', padding: '4px', marginBottom: '20px', border: '1px solid #222' }}>
                                <div onClick={() => setRouteFormData({...routeFormData, mediaType: 'text'})} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '10px', background: routeFormData.mediaType === 'text' ? '#0abab5' : 'transparent', color: routeFormData.mediaType === 'text' ? '#000' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}>📝 ТЕКСТ / ФОТО</div>
                                <div onClick={() => setRouteFormData({...routeFormData, mediaType: 'video'})} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '10px', background: routeFormData.mediaType === 'video' ? '#0abab5' : 'transparent', color: routeFormData.mediaType === 'video' ? '#000' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}>🎥 ВИДЕО</div>
                            </div>
                            
                            {routeFormData.mediaType === 'video' ? (
                                <div style={{background: '#0d0f0d', padding: '15px', borderRadius: '20px', border: '1px solid #222', marginBottom: '15px'}}>
                                    <div style={{ fontSize: '11px', color: '#0abab5', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Код вставки плеера (Rutube/YouTube)</div>
                                    <textarea autoComplete="new-password" style={{...adminIn, height: '100px', resize: 'none', marginBottom: '15px', fontFamily: 'monospace', fontSize: '12px', color: '#aaa'} as any} placeholder='<iframe width="720" height="405" src="..." ></iframe>' value={routeFormData.videoIframe} onChange={e => setRouteFormData({...routeFormData, videoIframe: e.target.value})} />
                                    
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Текстовое описание под видео</div>
                                    <textarea autoComplete="new-password" style={{...adminIn, height: '100px', resize: 'none', marginBottom: 0} as any} placeholder="О чем это видео..." value={routeFormData.videoDesc} onChange={e => setRouteFormData({...routeFormData, videoDesc: e.target.value})} />
                                </div>
                            ) : (
                                <div>
                                    <h3 style={{fontSize: '16px', color: '#0abab5', marginBottom: '15px', fontWeight: '900'}}>БЛОКИ С ТЕКСТОМ (ДО 3-Х)</h3>
                                    
                                    {[1, 2, 3].map((num) => {
                                        const hKey = `h${num}` as keyof typeof routeFormData;
                                        const tKey = `t${num}` as keyof typeof routeFormData;
                                        const imgKey = `img${num}` as keyof typeof routeFormData;
                                        const imgVal = routeFormData[imgKey] as string;
                                        const isBase64 = imgVal && imgVal.startsWith('data:image');

                                        return (
                                            <div key={num} style={{background: '#0d0f0d', padding: '15px', borderRadius: '20px', border: '1px solid #222', marginBottom: '15px'}}>
                                                <input autoComplete="new-password" style={{...adminIn, fontWeight: 'bold', padding: '12px', marginBottom: '10px'} as any} placeholder={`Заголовок блока ${num}`} value={routeFormData[hKey]} onChange={e => setRouteFormData({...routeFormData, [hKey]: e.target.value})} />
                                                <textarea autoComplete="new-password" style={{...adminIn, height: '80px', resize: 'none', marginBottom: '10px'} as any} placeholder={`Текст блока ${num}...`} value={routeFormData[tKey]} onChange={e => setRouteFormData({...routeFormData, [tKey]: e.target.value})} />
                                                
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    {!isBase64 ? (
                                                        <input autoComplete="new-password" style={{...adminIn, padding: '12px', marginBottom: '0', fontSize: '13px', flex: 1} as any} placeholder="Ссылка на фото (URL)" value={imgVal} onChange={e => setRouteFormData({...routeFormData, [imgKey]: e.target.value})} />
                                                    ) : (
                                                        <div style={{...adminIn, padding: '12px', marginBottom: '0', fontSize: '13px', flex: 1, color: '#0abab5', background: 'rgba(10,186,181,0.1)', border: '1px solid rgba(10,186,181,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'} as any}>
                                                            ✅ Фото загружено с устройства
                                                        </div>
                                                    )}
                                                    
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        id={`upload-img-${num}`}
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    alert("Файл слишком большой! Максимум 5 МБ.");
                                                                    return;
                                                                }
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => {
                                                                    setRouteFormData(prev => ({...prev, [imgKey]: ev.target?.result as string}));
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); document.getElementById(`upload-img-${num}`)?.click(); }}
                                                        style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', transition: '0.2s' }}
                                                    >
                                                        📁 ЗАГРУЗИТЬ
                                                    </button>
                                                    {imgVal && (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setRouteFormData(prev => ({...prev, [imgKey]: ''})); }}
                                                            style={{ background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.3)', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.2s' }}
                                                            title="Удалить фото"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                                {imgVal && (
                                                    <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', width: 'fit-content', background: '#000' }}>
                                                        <img src={imgVal} alt="preview" style={{ height: '80px', display: 'block', objectFit: 'cover' }} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button onClick={handleSaveRoute} style={saveBtn as any}>СОХРАНИТЬ ТЕМУ</button>
                        <div onClick={() => setShowRouteForm(false)} style={cancelLink as any}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {/* --- ПРЕДПРОСМОТР ЭКРАНА ТЕСТА --- */}
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
                  <div className="tasks-modal" style={{...modalContentLarge, maxWidth: '800px'} as any}>
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
                  <div className="tasks-modal" style={modalContentLarge as any}>
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

            {/* КОМПАКТНЫЙ РЕДАКТОР АДМИНА ДЛЯ ТЕСТОВ */}
            {showTestForm && (
                <div style={{...modalOverlay, alignItems: 'center'} as any} onClick={() => setShowTestForm(false)}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentMedium, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0abab5', fontWeight: '900', textTransform: 'uppercase' }}>
                            {testFormData.id ? 'РЕДАКТОР ТЕСТА' : 'НОВЫЙ ТЕСТ'}
                        </h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название теста</div>
                                <input autoComplete="new-password" style={adminIn as any} placeholder="Например: Итоговый экзамен" value={testFormData.title} onChange={e => setTestFormData({...testFormData, title: e.target.value})} />
                            </div>
                            
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Краткое описание</div>
                                <textarea autoComplete="new-password" style={{...adminIn, height: '60px', resize: 'none'} as any} placeholder="Подзаголовок (описание)..." value={testFormData.subtitle} onChange={e => setTestFormData({...testFormData, subtitle: e.target.value})} />
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Раздел (Папка)</div>
                                    <input list="test-sections" autoComplete="new-password" style={adminIn as any} placeholder="Напр. Итоговые" value={testFormData.section} onChange={e => setTestFormData({...testFormData, section: e.target.value})} />
                                    <datalist id="test-sections">{Array.from(new Set(dynamicTests.map((t: any) => t.section).filter(Boolean))).map((sec: any) => <option key={sec} value={sec} />)}</datalist>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Подраздел</div>
                                    <input list="test-subsections" autoComplete="new-password" style={adminIn as any} placeholder="Напр. Для стажеров" value={testFormData.subsection} onChange={e => setTestFormData({...testFormData, subsection: e.target.value})} />
                                    <datalist id="test-subsections">{Array.from(new Set(dynamicTests.map((t: any) => t.subsection).filter(Boolean))).map((subsec: any) => <option key={subsec} value={subsec} />)}</datalist>
                                </div>
                            </div>
                            
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Рекомендуемая теория</div>
                                <textarea autoComplete="new-password" style={{...adminIn, height: '60px', resize: 'none'} as any} placeholder="Разделы теории для изучения перед тестом (через запятую)..." value={testFormData.theory} onChange={e => setTestFormData({...testFormData, theory: e.target.value})} />
                            </div>
                        </div>

                        <div style={{borderTop: '1px solid #222', paddingTop: '20px'}}>
                            <h3 style={{fontSize: '16px', color: '#0abab5', marginBottom: '15px', fontWeight: '900'}}>ВОПРОСЫ ({testFormData.quiz.length})</h3>
                            {testFormData.quiz.map((q: any, qIdx: number) => (
                                <div key={qIdx} style={{background: '#0d0f0d', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                                    {testFormData.quiz.length > 1 && <div onClick={() => removeTestQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'} as any}>✕</div>}
                                    <input autoComplete="new-password" style={{...adminIn, fontWeight: 'bold', marginBottom: '15px'} as any} placeholder="Текст вопроса..." value={q.q} onChange={e => updateTestQuestion(qIdx, 'q', e.target.value)} />
                                    
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                        {[0,1,2,3].map((i: number) => (
                                            <div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', background: q.c === i ? 'rgba(10,186,181,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', border: q.c === i ? '1px solid #0abab5' : '1px solid #222'}}>
                                                <input type="radio" style={{transform: 'scale(1.2)'}} checked={q.c === i} onChange={() => updateTestQuestion(qIdx, 'c', i)} />
                                                <input autoComplete="new-password" style={{...adminIn, padding: '10px', marginBottom: 0, border: 'none', background: 'transparent', width: '100%'} as any} placeholder={`Вариант ${i+1}`} value={q.o[i]} onChange={e => updateTestQuestion(qIdx, `o${i}`, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button onClick={addTestQuestion} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'} as any}>+ ДОБАВИТЬ ВОПРОС</button>
                        </div>
                        <button onClick={handleSaveTestForm} style={{...saveBtn, marginTop: '30px'} as any}>СОХРАНИТЬ ТЕСТ</button>
                        <div onClick={() => setShowTestForm(false)} style={cancelLink as any}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .anti-cheat { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
                .test-answer-btn { padding: 20px 30px; background: #111; color: #fff; border-radius: 18px; cursor: pointer; border: 1px solid #222; font-weight: 800; margin-bottom: 12px; transition: all 0.2s ease; }
                .test-answer-btn:hover { border-color: #0abab5; background: rgba(10, 186, 181, 0.05); transform: translateY(-2px); }
                .test-answer-btn.selected { background: #0abab5 !important; color: #000 !important; border-color: #0abab5 !important; transform: scale(0.98); }
                
                .premium-cards-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; width: 100%; }
                .premium-card { background: #111; border-radius: 14px; border: 1px solid #222; transition: all 0.2s ease; position: relative; cursor: pointer; display: flex; flex-direction: column; width: 100%; min-height: 140px; padding: 20px; box-sizing: border-box; overflow: hidden; }
                .premium-card:hover { border-color: #0abab5; transform: translateY(-3px); }
                .premium-card:active { background: rgba(10, 186, 181, 0.05); border-color: #0abab5; transform: scale(0.98); }
                .deadline-card:hover { border-color: #ff4d4d !important; box-shadow: 0 8px 25px rgba(255, 77, 77, 0.15) !important; }
                .deadline-card:active { background: rgba(255, 77, 77, 0.05) !important; border-color: #ff4d4d !important; }

                .video-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; background: #000; border-radius: 15px; overflow: hidden; }
                .video-wrapper iframe, .video-wrapper object, .video-wrapper embed { position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; border: none; }

                @media (max-width: 768px) {
                    .premium-cards-container { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                    .premium-card { padding: 15px !important; min-height: 120px !important; }
                    .premium-card h4 { font-size: 13px !important; margin-bottom: 10px !important; }
                    .premium-card span { font-size: 10px !important; }
                    .tasks-theory-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-quiz-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-modal { padding: 30px 20px !important; border-radius: 25px !important; width: 95% !important; max-height: 90vh !important; }
                    .tasks-theory-block { padding: 20px !important; border-radius: 20px !important; }
                    .tasks-modal-header { flex-direction: column; align-items: flex-start !important; gap: 15px; margin-bottom: 25px !important; }
                    .tasks-modal-header h2 { font-size: 20px !important; padding: 0 !important; text-align: left !important; }
                    .desktop-spacer { display: none !important; }
                }
            `}</style>
        </section>
    );
}

const pBarBg: React.CSSProperties = { height: '8px', background: '#222', borderRadius: '4px', marginTop: '15px', marginBottom: '10px' };
const pBarFill = (w: number): React.CSSProperties => ({ width: `${w}%`, height: '100%', background: '#0abab5', borderRadius: '4px', transition: '1s' });
const sectionTitle: React.CSSProperties = { fontSize: '28px', fontWeight: '900', marginBottom: '35px' };
const cardFooter: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '800', color: '#666' };
const backLink: React.CSSProperties = { color: '#0abab5', fontWeight: '900', marginBottom: '30px', cursor: 'pointer', display: 'inline-block', fontSize: '15px' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px', boxSizing: 'border-box' };
const modalContentLarge: React.CSSProperties = { background: '#000', padding: '60px', borderRadius: '50px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentMedium: React.CSSProperties = { background: '#111', padding: '40px 30px', borderRadius: '35px', width: '100%', maxWidth: '550px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const modalContentSmall: React.CSSProperties = { background: '#111', padding: '40px 30px', borderRadius: '30px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const theoryBlock: React.CSSProperties = { background: '#0d0d0d', padding: '30px', borderRadius: '25px', border: '1px solid #222' };
const theoryLabel: React.CSSProperties = { fontSize: '15px', fontWeight: '800', color: '#0abab5', letterSpacing: '0.5px', marginBottom: '12px' };
const theoryText: React.CSSProperties = { fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0 };
const checkKnowledgeBtn: React.CSSProperties = { width: '100%', padding: '25px', background: 'transparent', border: '2px solid #0abab5', color: '#0abab5', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', transition: '0.3s' };
const quizBox: React.CSSProperties = { borderTop: '1px solid #222', paddingTop: '40px', marginTop: '10px' };
const flexSpace: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };
const errorOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 40000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' };
const errorModalContent: React.CSSProperties = { background: '#111', padding: '50px', borderRadius: '40px', border: '2px solid #222', textAlign: 'center', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' };
const errorBtnStyle: React.CSSProperties = { border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', letterSpacing: '1px', marginTop: '15px', width: '100%' };
const adminIn: React.CSSProperties = { width: '100%', padding: '16px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', marginBottom: '0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '25px', fontSize: '15px', letterSpacing: '1px' };
const adminActionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const editIconStyle: React.CSSProperties = { background: '#1a1a1a', color: '#0abab5', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const delIconStyle: React.CSSProperties = { background: '#1a1a1a', color: '#ff4d4d', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const moveIconStyle: React.CSSProperties = { background: '#1a1a1a', color: '#fff', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const cancelLink: React.CSSProperties = { textAlign: 'center', marginTop: '20px', color: '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };