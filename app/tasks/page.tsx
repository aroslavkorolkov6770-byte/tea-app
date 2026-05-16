"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import { useSearchParams } from 'next/navigation';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v1',
    BASICS_PROGRESS: 'tea_hub_basics_progress_v1',
    DYNAMIC_BASICS: 'tea_hub_dynamic_basics_v1',
    DYNAMIC_ROUTE: 'tea_hub_dynamic_route_v1',
    DYNAMIC_STANDARDS: 'tea_hub_dynamic_standards_v1',
    URGENT_FILES: 'tea_hub_urgent_files_v1'
};

const saveDataToServer = (key: string, data: any) => {
    fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

const stripEmoji = (str: string) => {
    if (!str) return '';
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

const INITIAL_BASICS = [
  { 
    id: "sec_1", title: "01. История и Бренд", 
    modules: [
        { id: "m1_1", title: "Философия Tea Master", t1: "Мастер — это лицо бренда.", t2: "Важно понимать психологию гостя.", t3: "Эстетика в деталях.", quiz: [{q: "Кто такой мастер?", o: ["Продавец", "Проводник", "Официант"], c: 1}] },
    ]
  }
];

const INITIAL_ROUTE = [
  { id: "route_1", title: "О компании и бренде", time: "3 мин", content: "Мы — Tea Master Store. Наша цель: сделать чайную культуру доступной." }
];

// --- СТИЛИ ГРАФИКОВ ---
const wideChartCard: React.CSSProperties = { background: '#161816', padding: '45px', borderRadius: '40px', border: '1px solid #222', marginBottom: '40px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' };
const rankBadge: React.CSSProperties = { background: 'rgba(10,186,181,0.08)', color: '#0abab5', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', fontSize: '13px', border: '1px solid rgba(10,186,181,0.2)' };
const dashboardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px', width: '100%' };
const statCardMain: React.CSSProperties = { background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid #222', boxSizing: 'border-box' };
const cardHeaderLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', marginBottom: '15px' };
const bigStatVal: React.CSSProperties = { fontSize: '48px', fontWeight: '900', color: '#fff' };
const cardSubText: React.CSSProperties = { fontSize: '14px', opacity: 0.5, marginBottom: '25px' };
const segmentedBar: React.CSSProperties = { display: 'flex', gap: '8px', height: '10px', marginTop: '10px', width: '100%' };
const segment = (active: boolean): React.CSSProperties => ({ flex: 1, background: active ? '#0abab5' : '#000', borderRadius: '5px', transition: '0.3s' });
const sectionTitle: React.CSSProperties = { fontSize: '28px', fontWeight: '900', marginBottom: '35px' };

const pBarBg: React.CSSProperties = { height: '6px', background: '#000', borderRadius: '10px', marginTop: '15px', marginBottom: '10px' };
const pBarFill = (w: number): React.CSSProperties => ({ width: `${w}%`, height: '100%', background: '#0abab5', borderRadius: '10px', transition: '1s' });
const cardFooter: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '800', color: '#666' };

const backLink: React.CSSProperties = { color: '#0abab5', fontWeight: '900', marginBottom: '30px', cursor: 'pointer', display: 'inline-block', fontSize: '15px' };
const topicRow: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '25px 30px', background: '#161816', borderRadius: '25px', border: '1px solid #222', cursor: 'pointer', transition: '0.2s', marginBottom: '10px', position: 'relative', width: '100%', boxSizing: 'border-box' };
const checkIcon = (done: boolean): React.CSSProperties => ({ width: '28px', height: '28px', border: '2px solid #0abab5', borderRadius: '50%', marginRight: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0abab5', fontWeight: '900', background: done ? 'rgba(10,186,181,0.1)' : 'transparent', flexShrink: 0 });
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', padding: '20px', boxSizing: 'border-box' };
const modalContent: React.CSSProperties = { background: '#000', padding: '60px', borderRadius: '50px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentSmall: React.CSSProperties = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #333' };
const theoryBlock: React.CSSProperties = { background: '#0d0d0d', padding: '30px', borderRadius: '25px', border: '1px solid #222' };
const theoryLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '900', color: '#0abab5', letterSpacing: '2px', marginBottom: '15px' };
const theoryText: React.CSSProperties = { fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0 };
const checkKnowledgeBtn: React.CSSProperties = { width: '100%', padding: '25px', background: 'transparent', border: '2px solid #0abab5', color: '#0abab5', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', transition: '0.3s' };
const quizBox: React.CSSProperties = { borderTop: '1px solid #222', paddingTop: '40px', marginTop: '10px' };
const flexSpace: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };

const ansBtn = (active: boolean, isCorrect: boolean): React.CSSProperties => ({ padding: '20px 30px', background: active ? (isCorrect ? '#0abab5' : '#ff4d4d') : '#111', color: active ? (isCorrect ? '#000' : '#fff') : '#fff', borderRadius: '18px', cursor: 'pointer', border: '1px solid #222', fontWeight: '800', marginBottom: '12px', transition: '0.2s' });

const errorOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 40000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' };
const errorModalContent: React.CSSProperties = { background: '#111', padding: '50px', borderRadius: '40px', border: '2px solid #222', textAlign: 'center', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' };
const errorBtnStyle: React.CSSProperties = { border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', letterSpacing: '1px', marginTop: '15px', width: '100%' };

const adminIn: React.CSSProperties = { width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '15px' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '20px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '10px', fontSize: '16px' };
const adminActionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const editIconStyle: React.CSSProperties = { background: '#111', color: '#0abab5', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };
const delIconStyle: React.CSSProperties = { background: '#111', color: '#ff4d4d', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };

function ShiftContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeFormData, setRouteFormData] = useState({ id: '', title: '', time: '', content: '' });
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionFormData, setSectionFormData] = useState({ id: '', title: '' });
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({
      id: '', title: '', t1: '', t2: '', t3: '',
      quiz: [{ q: '', o: ['', '', ''], c: 0 }] 
  });
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const [dynamicBasics, setDynamicBasics] = useState<any[]>([]);
  const [dynamicRoute, setDynamicRoute] = useState<any[]>([]);
  const [completedRoute, setCompletedRoute] = useState<string[]>([]);
  const [completedBasics, setCompletedBasics] = useState<string[]>([]);
  
  const [urgentFiles, setUrgentFiles] = useState<any[]>([]);
  const [passedTests, setPassedTests] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const [selectedRouteStep, setSelectedRouteStep] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [moduleView, setModuleView] = useState<'content' | 'quiz'>('content');

  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // --- СОСТОЯНИЯ ДЛЯ АТТЕСТАЦИОННОГО ТЕСТА (Срочно к прохождению) ---
  const [activeUrgentTest, setActiveUrgentTest] = useState<any>(null);
  const [urgentTestStep, setUrgentTestStep] = useState(0);
  const [urgentTestAnswers, setUrgentTestAnswers] = useState<number[]>([]);
  const [testResultModal, setTestResultModal] = useState<{show: boolean, score: number, isPassed: boolean, title: string}>({show: false, score: 0, isPassed: false, title: ''});

  // --- ИДЕАЛЬНО ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА (КЭШ + ФОНОВОЕ ОБНОВЛЕНИЕ) ---
  const loadAllData = async (currentUserId: string, checkUrl = false) => {
      if (typeof window !== 'undefined') {
          const cachedFiles = localStorage.getItem('th_cache_files');
          const cachedRoute = localStorage.getItem('th_cache_route');
          const cachedBasics = localStorage.getItem('th_cache_basics');
          const cachedProgRoute = localStorage.getItem(`th_prog_route_${currentUserId}`);
          const cachedProgBasics = localStorage.getItem(`th_prog_basics_${currentUserId}`);
          const cachedPassedTests = localStorage.getItem(`th_cache_passed_tests_${currentUserId}`);

          if (cachedFiles) setUrgentFiles(JSON.parse(cachedFiles));
          if (cachedRoute) setDynamicRoute(JSON.parse(cachedRoute));
          if (cachedBasics) setDynamicBasics(JSON.parse(cachedBasics));
          if (cachedProgRoute) setCompletedRoute(JSON.parse(cachedProgRoute));
          if (cachedProgBasics) setCompletedBasics(JSON.parse(cachedProgBasics));
          if (cachedPassedTests) setPassedTests(JSON.parse(cachedPassedTests));
      }

      try {
          const [sFiles, cRoute, cBasics, sBasicsData, sRouteData, pTestsRes] = await Promise.all([
              fetch('/api/storage?key=' + STORAGE_KEYS.URGENT_FILES).then(r => r.json()).catch(() => null),
              fetch(`/api/storage?key=prog_route_${currentUserId}`).then(r => r.json()).catch(() => null),
              fetch(`/api/storage?key=prog_basics_${currentUserId}`).then(r => r.json()).catch(() => null),
              fetch('/api/storage?key=' + STORAGE_KEYS.DYNAMIC_BASICS).then(r => r.json()).catch(() => null),
              fetch('/api/storage?key=' + STORAGE_KEYS.DYNAMIC_ROUTE).then(r => r.json()).catch(() => null),
              fetch(`/api/storage?key=th_passed_tests_${currentUserId}`).then(r => r.json()).catch(() => null)
          ]);

          if (Array.isArray(sFiles)) {
              setUrgentFiles(sFiles);
              localStorage.setItem('th_cache_files', JSON.stringify(sFiles));
          }

          if (Array.isArray(cRoute)) {
              setCompletedRoute(cRoute);
              localStorage.setItem(`th_prog_route_${currentUserId}`, JSON.stringify(cRoute));
          }

          if (Array.isArray(cBasics)) {
              setCompletedBasics(cBasics);
              localStorage.setItem(`th_prog_basics_${currentUserId}`, JSON.stringify(cBasics));
          }

          if (Array.isArray(pTestsRes)) {
              setPassedTests(pTestsRes);
              localStorage.setItem(`th_cache_passed_tests_${currentUserId}`, JSON.stringify(pTestsRes));
          }

          let finalBasics = sBasicsData;
          if (!Array.isArray(finalBasics) || finalBasics.length === 0) {
              finalBasics = INITIAL_BASICS;
              saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, finalBasics);
          }
          setDynamicBasics(finalBasics);
          localStorage.setItem('th_cache_basics', JSON.stringify(finalBasics));

          let finalRoute = sRouteData;
          if (!Array.isArray(finalRoute) || finalRoute.length === 0) {
              finalRoute = INITIAL_ROUTE;
              saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, finalRoute);
          }
          setDynamicRoute(finalRoute);
          localStorage.setItem('th_cache_route', JSON.stringify(finalRoute));

          if (checkUrl) {
              const sectionId = searchParams.get('sectionId');
              const moduleId = searchParams.get('moduleId');
              const routeId = searchParams.get('routeId');

              if (sectionId && finalBasics) {
                  const foundSection = finalBasics.find((s: any) => s.id === sectionId);
                  if (foundSection) {
                      setSelectedSection(foundSection);
                      if (moduleId) {
                          const foundModule = foundSection.modules?.find((m: any) => m.id === moduleId);
                          if (foundModule) {
                              setSelectedModule(foundModule);
                              setModuleView('content');
                          }
                      }
                  }
              }

              if (routeId && finalRoute) {
                  const foundRoute = finalRoute.find((r: any) => r.id === routeId);
                  if (foundRoute) {
                      setSelectedRouteStep(foundRoute);
                  }
              }
          }
      } catch (e) {
          console.error("Ошибка синхронизации с сервером", e);
      }
  };

  useEffect(() => {
    setIsMounted(true);
    
    const role = localStorage.getItem('userRole');
    const currentId = localStorage.getItem('current_user_id') || 'guest';
    setIsAdmin(role === 'admin');
    setUserId(currentId);

    loadAllData(currentId, true);

    const urlTab = searchParams.get('tab');
    if (urlTab) setActiveTab(urlTab);

    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('sidebarToggle', handleToggle);
    
    const syncInterval = setInterval(() => loadAllData(currentId, false), 5000);
    const focusHandler = () => loadAllData(currentId, false);
    window.addEventListener('focus', focusHandler);

    return () => {
        window.removeEventListener('sidebarToggle', handleToggle);
        clearInterval(syncInterval);
        window.removeEventListener('focus', focusHandler);
    };
  }, [searchParams]);

  // --- ФИЛЬТРАЦИЯ СРОЧНЫХ ЗАДАНИЙ ДЛЯ ТЕКУЩЕГО ЮЗЕРА ---
  const visibleUrgentFiles = urgentFiles.filter(f => {
      const isForMe = !f.target || f.target === 'Все' || f.target === userId;
      const isPassed = f.isTest && passedTests.includes(f.id);
      return isForMe && !isPassed;
  });

  const handleSaveRoute = () => {
    if (!routeFormData.title.trim()) return;
    let newList = [...dynamicRoute];
    if (routeFormData.id) {
        newList = newList.map(r => r.id === routeFormData.id ? routeFormData : r);
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
    const newList = dynamicRoute.filter(r => r.id !== routeToDelete);
    setDynamicRoute(newList);
    localStorage.setItem('th_cache_route', JSON.stringify(newList));
    saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, newList);
    setRouteToDelete(null);
  };

  const handleSaveSection = () => {
      if (!sectionFormData.title.trim()) return;
      let newList = [...dynamicBasics];
      if (sectionFormData.id) {
          newList = newList.map(s => s.id === sectionFormData.id ? { ...s, title: sectionFormData.title } : s);
      } else {
          newList.push({ id: 'sec_' + Date.now(), title: sectionFormData.title, modules: [] });
      }
      setDynamicBasics(newList);
      localStorage.setItem('th_cache_basics', JSON.stringify(newList));
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setShowSectionForm(false);
  };

  const handleDeleteSection = () => {
      if (!sectionToDelete) return;
      const newList = dynamicBasics.filter(s => s.id !== sectionToDelete);
      setDynamicBasics(newList);
      localStorage.setItem('th_cache_basics', JSON.stringify(newList));
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setSectionToDelete(null);
  };

  const updateQuizQuestion = (index: number, field: string, value: any) => {
      const newQuiz = [...moduleFormData.quiz];
      if (field === 'q') newQuiz[index].q = value;
      if (field === 'c') newQuiz[index].c = value;
      if (field.startsWith('o')) {
          const oIndex = parseInt(field.replace('o', ''));
          newQuiz[index].o[oIndex] = value;
      }
      setModuleFormData({...moduleFormData, quiz: newQuiz});
  };

  const addQuizQuestion = () => {
      setModuleFormData({
          ...moduleFormData, 
          quiz: [...moduleFormData.quiz, { q: '', o: ['', '', ''], c: 0 }]
      });
  };

  const removeQuizQuestion = (index: number) => {
      const newQuiz = moduleFormData.quiz.filter((_, i) => i !== index);
      setModuleFormData({...moduleFormData, quiz: newQuiz});
  };

  const handleSaveModule = () => {
      if (!moduleFormData.title.trim() || !selectedSection) return;
      
      const newModule = {
          id: moduleFormData.id || ('m_' + Date.now()),
          title: moduleFormData.title,
          t1: moduleFormData.t1,
          t2: moduleFormData.t2,
          t3: moduleFormData.t3,
          quiz: moduleFormData.quiz.map(q => ({
              q: q.q || 'Без вопроса?',
              o: [q.o[0] || 'Да', q.o[1] || 'Нет', q.o[2] || 'Не знаю'],
              c: q.c
          }))
      };

      const newList = dynamicBasics.map(s => {
          if (s.id === selectedSection.id) {
              let updatedModules = [...(s.modules || [])];
              if (moduleFormData.id) {
                  updatedModules = updatedModules.map((m:any) => m.id === moduleFormData.id ? newModule : m);
              } else {
                  updatedModules.push(newModule);
              }
              return { ...s, modules: updatedModules };
          }
          return s;
      });

      setDynamicBasics(newList);
      localStorage.setItem('th_cache_basics', JSON.stringify(newList));
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setSelectedSection(newList.find(s => s.id === selectedSection.id));
      setShowModuleForm(false);
  };

  const handleDeleteModule = () => {
      if (!moduleToDelete || !selectedSection) return;
      const newList = dynamicBasics.map(s => {
          if (s.id === selectedSection.id) {
              return { ...s, modules: s.modules.filter((m:any) => m.id !== moduleToDelete) };
          }
          return s;
      });
      setDynamicBasics(newList);
      localStorage.setItem('th_cache_basics', JSON.stringify(newList));
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setSelectedSection(newList.find(s => s.id === selectedSection.id));
      setModuleToDelete(null);
  };

  const handleRouteComplete = (id: string) => {
    if (!completedRoute.includes(id)) {
        const newProg = [...completedRoute, id];
        setCompletedRoute(newProg);
        localStorage.setItem(`th_prog_route_${userId}`, JSON.stringify(newProg));
        saveDataToServer(`prog_route_${userId}`, newProg);
    }
    setSelectedRouteStep(null);
  };

  const handleQuizAnswer = (idx: number) => {
    if (activeAnswer !== null) return; 
    
    setActiveAnswer(idx);
    
    if (idx === selectedModule.quiz[currentQuizStep].c) {
        if (currentQuizStep < selectedModule.quiz.length - 1) {
            setTimeout(() => { 
                setCurrentQuizStep(v => v + 1); 
                setActiveAnswer(null); 
            }, 500);
        } else {
            if (!completedBasics.includes(selectedModule.id)) {
                const newComp = [...completedBasics, selectedModule.id];
                setCompletedBasics(newComp);
                localStorage.setItem(`th_prog_basics_${userId}`, JSON.stringify(newComp));
                saveDataToServer(`prog_basics_${userId}`, newComp);
            }
            setTimeout(() => { 
                setSelectedModule(null); 
                setModuleView('content'); 
                setCurrentQuizStep(0); 
                setActiveAnswer(null); 
            }, 600);
        }
    } else { 
        setTimeout(() => {
            setShowErrorModal(true); 
            setActiveAnswer(null); 
        }, 400); 
    }
  };

  // --- ЛОГИКА АТТЕСТАЦИИ ---
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
      activeUrgentTest.quiz.forEach((q: any, i: number) => {
          if (q.c === answers[i]) correct++;
      });
      const score = Math.round((correct / activeUrgentTest.quiz.length) * 100);
      
      // СТРОГОЕ ТРЕБОВАНИЕ: ТОЛЬКО 100% ДЛЯ УСПЕШНОГО ПРОХОЖДЕНИЯ
      const isPassed = score === 100;
      const currentUserName = localStorage.getItem('current_user_name') || 'Сотрудник';
      const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

      try {
          // 1. Сохраняем результат в базу результатов тестов
          const res = await fetch('/api/storage?key=tea_hub_test_results_v1');
          let results = await res.json().catch(() => []);
          if (!Array.isArray(results)) results = [];

          const previousAttempts = results.filter((r: any) => r.testName === activeUrgentTest.name && r.userName === currentUserName).length;
          
          const newResult = {
              id: Date.now(),
              userName: currentUserName,
              testName: activeUrgentTest.name,
              score: score,
              attempts: previousAttempts + 1,
              date: formattedTime
          };
          
          const newResults = [newResult, ...results];
          saveDataToServer('tea_hub_test_results_v1', newResults);

          // 2. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ АДМИНИСТРАТОРУ О ЗАВЕРШЕНИИ ТЕСТА
          const notifRes = await fetch('/api/storage?key=tea_hub_notifications_v1');
          let notifs = await notifRes.json().catch(() => []);
          if (!Array.isArray(notifs)) notifs = [];

          const adminNotif = {
              id: Date.now() + 1,
              title: 'Результат аттестации',
              text: `Сотрудник ${currentUserName} прошел тест "${activeUrgentTest.name}" с результатом ${score}%.`,
              time: formattedTime,
              target: 'u_admin' // Отправляем главному админу
          };
          saveDataToServer('tea_hub_notifications_v1', [adminNotif, ...notifs]);

          // 3. Обработка прохождения теста сотрудником
          if (isPassed) {
              const newPassed = [...passedTests, activeUrgentTest.id];
              setPassedTests(newPassed);
              localStorage.setItem(`th_cache_passed_tests_${userId}`, JSON.stringify(newPassed));
              saveDataToServer(`th_passed_tests_${userId}`, newPassed);
          }
          
          setTestResultModal({ show: true, score, isPassed, title: activeUrgentTest.name });

          setActiveUrgentTest(null);
          setUrgentTestStep(0);
          setUrgentTestAnswers([]);
          setActiveAnswer(null);

      } catch (e) {
          console.error("Ошибка при сохранении результатов теста", e);
      }
  };

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

  if (!isMounted) return null;

  const totalBasicsModules = dynamicBasics.reduce((acc, s) => acc + (s.modules?.length || 0), 0);
  const routePercent = Math.round((completedRoute.length / (dynamicRoute.length || 1)) * 100);
  const basicsPercent = Math.round((completedBasics.length / (totalBasicsModules || 1)) * 100);
  const totalHubPercent = basicsPercent;

  let cumulativeModulesDone = 0;
  const chartPoints = [0]; 
  dynamicBasics.forEach((sec) => {
      const doneInSec = sec.modules?.filter((m:any) => completedBasics.includes(m.id)).length || 0;
      cumulativeModulesDone += doneInSec;
      chartPoints.push((cumulativeModulesDone / (totalBasicsModules || 1)) * 100);
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', transition: '0.3s', overflowX: 'hidden' }}>
      <Navigation />
      
      <div className="desktop-sidebar-spacer" style={{ width: isSidebarOpen ? '260px' : '0', transition: '0.3s', flexShrink: 0 }} />

      <main className="tasks-main" style={{ flex: 1, padding: '120px 60px 60px 60px', transition: '0.3s', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        
        {activeTab === 'welcome' && (
            <div style={{ animation: 'fadeInUp 0.6s ease' }}>
                <h1 className="tasks-title" style={{fontSize:'36px', fontWeight:'900', marginBottom:'40px'}}>Центр управления мастером</h1>
                
                <section className="tasks-chart-card" style={wideChartCard}>
                    <div className="tasks-flex-space" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'40px', flexWrap: 'wrap', gap:'20px'}}>
                        <div>
                            <div style={{fontSize:'11px', fontWeight:'900', color:'#0abab5', letterSpacing:'2px', marginBottom:'8px', textTransform:'uppercase'}}>ОБЩАЯ ДИНАМИКА РАЗВИТИЯ</div>
                            <div className="tasks-big-val" style={{fontSize:'48px', fontWeight:'900', color:'#fff', display:'flex', alignItems:'baseline', gap:'12px'}}>
                                {totalHubPercent}% <span style={{fontSize:'15px', opacity:0.4, fontWeight:'500'}}>общего прогресса HUB</span>
                            </div>
                        </div>
                        <div style={rankBadge}>{totalHubPercent < 40 ? '🌱 НОВИЧОК' : totalHubPercent < 80 ? '⚖️ ЭРУДИТ' : '🏮 МАСТЕР'}</div>
                    </div>

                    <div className="tasks-chart-container" style={{ position: 'relative', width: '100%', height: '220px', marginTop: '40px', marginBottom: '20px' }}>
                        {[0, 20, 40, 60, 80, 100].map(v => (
                            <div key={v} style={{ position: 'absolute', bottom: `${v}%`, left: 0, width: '100%', borderBottom: '1px dashed rgba(255,255,255,0.05)', zIndex: 1 }} />
                        ))}
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0abab5" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#0abab5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={`M 0 100 ${chartPoints.map((p, i) => `L ${i * 10} ${100 - p}`).join(' ')} L 100 100 Z`} fill="url(#glowGrad)" style={{ transition: '1s ease' }} />
                            <path d={`M ${chartPoints.map((p, i) => `${i * 10} ${100 - p}`).join(' L ')}`} fill="none" stroke="#0abab5" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ transition: '1s ease' }} />
                        </svg>
                        {chartPoints.map((p, i) => (
                            <div key={`dot-${i}`} style={{ position: 'absolute', left: `${i * 10}%`, bottom: `${p}%`, transform: 'translate(-50%, 50%)', width: '16px', height: '16px', borderRadius: '50%', background: '#161816', border: '4px solid #0abab5', zIndex: 3, transition: '1s ease', boxShadow: '0 0 10px rgba(10,186,181,0.5)' }} />
                        ))}
                        {['Старт', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].map((lbl, i) => (
                            <div key={`lbl-${i}`} style={{ position: 'absolute', left: `${i * 10}%`, bottom: '-35px', transform: 'translateX(-50%)', fontSize: '11px', color: '#666', fontWeight: '800' }}>{lbl}</div>
                        ))}
                    </div>
                </section>

                <div className="tasks-dashboard-grid" style={dashboardGrid}>
                      <div className="tasks-stat-card" style={statCardMain}>
                         <div style={cardHeaderLabel}>ПЛАН НА НЕДЕЛЮ</div>
                         <div className="tasks-big-val" style={bigStatVal}>{completedRoute.length} <span style={{fontSize:'20px', opacity:0.4}}>/ {dynamicRoute.length}</span></div>
                         <p style={cardSubText}>шагов пройдено</p>
                          <div style={segmentedBar}>{dynamicRoute.map((step, i) => (<div key={i} style={segment(completedRoute.includes(step.id))} />))}</div>
                      </div>
                      
                      <div className="tasks-stat-card" style={statCardMain}>
                         <div style={cardHeaderLabel}>БАЗА ЗНАНИЙ</div>
                         <div className="tasks-big-val" style={bigStatVal}>{basicsPercent}%</div>
                         <p style={cardSubText}>пройдено тем обучения</p>
                         <div style={pBarBg}><div style={pBarFill(basicsPercent)} /></div>
                      </div>
                </div>
            </div>
        )}

        {activeTab === 'edu' && (
          <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
             {!selectedSection ? (
               <>
                  <div style={{ marginBottom: '60px', width: '100%', boxSizing: 'border-box' }}>
                      <div className="tasks-flex-space" style={flexSpace}>
                          <h2 className="tasks-title" style={{ ...sectionTitle, color: '#0abab5', margin: 0 }}>⚠️ Срочно к прохождению</h2>
                      </div>
                      {visibleUrgentFiles.length > 0 ? (
                          <div className="premium-cards-container"> 
                              {visibleUrgentFiles.map((file) => (
                                  file.isTest ? (
                                      <div key={file.id} className="premium-card" onClick={() => setActiveUrgentTest(file)}>
                                          <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px'}}>🎓 АТТЕСТАЦИЯ</span>
                                          <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(file.name)}</h4>
                                          
                                          <div style={{ marginTop: 'auto' }}>
                                              <div style={cardFooter}><span>Пройти тестирование</span><span style={{color: '#0abab5'}}>{file.quiz?.length || 0} вопр.</span></div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div key={file.id} className="premium-card">
                                          <div style={{ fontSize: '11px', color: '#0abab5', fontWeight: '900', marginBottom: '8px', opacity: 0.8 }}>{file.date}</div>
                                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-word', color: '#fff' }}>📄 {file.name}</h4>
                                          <div style={{ color: '#555', fontSize: '12px', marginBottom: '15px' }}>{file.size}</div>
                                          
                                          <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
                                              <div onClick={() => setPreviewFile(file)} style={{ color: '#0abab5', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>ОТКРЫТЬ</div>
                                              <div onClick={() => handleDownloadFile(file)} style={{ color: '#0abab5', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>СКАЧАТЬ ↓</div>
                                          </div>
                                      </div>
                                  )
                              ))}
                          </div>
                      ) : (
                          <div style={{ marginTop: '20px', color: '#666', fontSize: '14px', background: '#111', padding: '30px', borderRadius: '30px', border: '1px dashed #222', textAlign: 'center' }}>
                              У вас нет срочных заданий.
                          </div>
                      )}
                  </div>

                  <div className="tasks-flex-space" style={flexSpace}>
                     <h2 className="tasks-title" style={sectionTitle}>1. Твой план на неделю</h2>
                     {isAdmin && <button onClick={() => { setRouteFormData({ id: '', title: '', time: '', content: '' }); setShowRouteForm(true); }} style={adminActionBtn}>+ НОВЫЙ ШАГ</button>}
                  </div>
                  
                  <div className="premium-cards-container" style={{ marginBottom: '60px' }}>
                     {dynamicRoute.map((step, idx) => {
                        const isDone = completedRoute.includes(step.id);
                        return (
                           <div key={step.id} onClick={() => setSelectedRouteStep(step)} className="premium-card">
                              {isAdmin && (
                                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                      <div onClick={(e) => { e.stopPropagation(); setRouteFormData(step); setShowRouteForm(true); }} style={editIconStyle}>✎</div>
                                      <div onClick={(e) => { e.stopPropagation(); setRouteToDelete(step.id); }} style={delIconStyle}>✕</div>
                                  </div>
                              )}
                              <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px'}}>Шаг 0{idx+1}</span>
                              <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(step.title)}</h4>
                              
                              <div style={{ marginTop: 'auto' }}>
                                  <div style={pBarBg}><div style={pBarFill(isDone ? 100 : 0)} /></div>
                                  <div style={cardFooter}><span>{isDone ? 'Выполнено' : 'Начать'}</span><span>{step.time}</span></div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  <div className="tasks-flex-space" style={flexSpace}>
                      <h2 className="tasks-title" style={sectionTitle}>2. Каталог курсов (Основы)</h2>
                      {isAdmin && <button onClick={() => { setSectionFormData({ id: '', title: '' }); setShowSectionForm(true); }} style={adminActionBtn}>+ НОВЫЙ РАЗДЕЛ</button>}
                  </div>
                  
                  <div className="premium-cards-container">
                     {dynamicBasics.map((sec, idx) => {
                        const doneCount = sec.modules?.filter((m:any) => completedBasics.includes(m.id)).length || 0;
                        const progress = sec.modules?.length ? Math.round((doneCount / sec.modules.length) * 100) : 0;
                        return (
                          <div key={sec.id} onClick={() => setSelectedSection(sec)} className="premium-card">
                             {isAdmin && (
                                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                      <div onClick={(e) => { e.stopPropagation(); setSectionFormData({id: sec.id, title: sec.title}); setShowSectionForm(true); }} style={editIconStyle}>✎</div>
                                      <div onClick={(e) => { e.stopPropagation(); setSectionToDelete(sec.id); }} style={delIconStyle}>✕</div>
                                  </div>
                              )}
                             <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px'}}>Раздел 0{idx+1}</span>
                             <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(sec.title)}</h4>
                             
                             <div style={{ marginTop: 'auto' }}>
                                 <div style={pBarBg}><div style={pBarFill(progress)} /></div>
                                 <div style={cardFooter}><span>{sec.modules?.length || 0} Тем</span><span>{progress}%</span></div>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </>
             ) : (
               <div style={{animation: 'fadeInUp 0.4s ease', maxWidth: '100%'}}>
                  <div onClick={() => setSelectedSection(null)} style={backLink}>← Назад к обучению</div>
                  
                  <div className="tasks-flex-space" style={flexSpace}>
                      <h2 className="tasks-title" style={{fontSize:'36px', color:'#0abab5', fontWeight:'900', margin: 0}}>{stripEmoji(selectedSection.title)}</h2>
                      {isAdmin && <button onClick={() => { 
                          setModuleFormData({ 
                              id: '', title: '', t1: '', t2: '', t3: '', 
                              quiz: [{ q: '', o: ['', '', ''], c: 0 }] 
                          }); 
                          setShowModuleForm(true); 
                      }} style={adminActionBtn}>+ НОВЫЙ УРОК</button>}
                  </div>
                  
                  <div style={{display:'flex', flexDirection:'column', gap:'15px', width: '100%'}}>
                     {selectedSection.modules?.length === 0 && <div style={{color: '#666'}}>Уроков пока нет.</div>}
                     {selectedSection.modules?.map((m:any) => {
                        const isDone = completedBasics.includes(m.id);
                        return (
                          <div key={m.id} onClick={() => { setSelectedModule(m); setModuleView('content'); }} className="tasks-topic-row" style={topicRow}>
                             {isAdmin && (
                                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '25px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                      <div onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setModuleFormData({
                                              id: m.id, title: m.title, t1: m.t1, t2: m.t2, t3: m.t3,
                                              quiz: m.quiz && m.quiz.length > 0 ? JSON.parse(JSON.stringify(m.quiz)) : [{ q: '', o: ['', '', ''], c: 0 }]
                                          }); 
                                          setShowModuleForm(true); 
                                      }} style={{...editIconStyle, width: '30px', height: '30px'}}>✎</div>
                                      <div onClick={(e) => { e.stopPropagation(); setModuleToDelete(m.id); }} style={{...delIconStyle, width: '30px', height: '30px'}}>✕</div>
                                  </div>
                             )}
                             <div style={checkIcon(isDone)}>{isDone ? '✓' : ''}</div>
                             <span style={{fontSize:'17px', fontWeight:'700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{stripEmoji(m.title)}</span>
                             {!isAdmin && <span style={{marginLeft:'auto', opacity:0.3, flexShrink: 0}}>→</span>}
                          </div>
                        );
                     })}
                  </div>
               </div>
             )}
          </section>
        )}

        {/* --- ОКНО ПРОХОЖДЕНИЯ АТТЕСТАЦИИ (С АНТИ-ЧИТ ЗАЩИТОЙ) --- */}
        {activeUrgentTest && (
           <div style={modalOverlay}>
              <div className="tasks-modal" style={modalContent}>
                 <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                    <div onClick={() => {setActiveUrgentTest(null); setUrgentTestStep(0); setActiveAnswer(null); setUrgentTestAnswers([]);}} style={{...backLink, margin:0}}>← ОТЛОЖИТЬ</div>
                    <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(activeUrgentTest.name)}</h2>
                    <div className="desktop-spacer" style={{width:'80px'}} />
                 </div>
                 
                 <div 
                    style={{
                        animation: 'fadeInUp 0.3s ease',
                        /* CSS ЗАЩИТА ОТ ВЫДЕЛЕНИЯ ТЕКСТА */
                        userSelect: 'none', 
                        WebkitUserSelect: 'none', 
                        MozUserSelect: 'none', 
                        msUserSelect: 'none'
                    }}
                    /* JS ЗАЩИТА ОТ КОПИРОВАНИЯ И КОНТЕКСТНОГО МЕНЮ */
                    onContextMenu={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                            if (e.key === 'c' || e.key === 'x' || e.key === 'p') {
                                e.preventDefault();
                            }
                        }
                    }}
                 >
                    <div style={quizBox}>
                        <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {urgentTestStep + 1} / {activeUrgentTest.quiz?.length || 1}</h4>
                        <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{activeUrgentTest.quiz?.[urgentTestStep]?.q}</p>
                        <div style={{display:'grid', gap:'15px'}}>
                           {activeUrgentTest.quiz?.[urgentTestStep]?.o.map((opt:any, i:any) => (
                               <div key={i} onClick={() => handleUrgentTestAnswer(i)} style={{ padding: '20px 30px', background: activeAnswer === i ? '#0abab5' : '#111', color: activeAnswer === i ? '#000' : '#fff', borderRadius: '18px', cursor: 'pointer', border: '1px solid #222', fontWeight: '800', marginBottom: '12px', transition: '0.2s' }}>
                                   {opt}
                               </div>
                           ))}
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ АТТЕСТАЦИИ --- */}
        {testResultModal.show && (
            <div style={{...errorOverlayStyle, zIndex: 60000}}>
                <div className="tasks-modal" style={{...errorModalContent, borderColor: testResultModal.isPassed ? '#0abab5' : '#ff4d4d'}}>
                    <div style={{ fontSize: '70px', marginBottom: '20px' }}>
                        {testResultModal.isPassed ? '🏆' : '❌'}
                    </div>
                    <h2 style={{ fontSize: '28px', color: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', marginBottom: '15px', fontWeight: '900', textTransform: 'uppercase' }}>
                        {testResultModal.isPassed ? 'ТЕСТ ПРОЙДЕН!' : 'ТЕСТ НЕ ПРОЙДЕН'}
                    </h2>
                    <p style={{ color: '#ccc', fontSize: '16px', marginBottom: '10px' }}>{testResultModal.title}</p>
                    <div style={{ fontSize: '50px', fontWeight: '900', color: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', marginBottom: '20px' }}>
                        {testResultModal.score}%
                    </div>
                    
                    {!testResultModal.isPassed ? (
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px' }}>Минимум для прохождения: 100%</p>
                    ) : (
                        <p style={{ color: '#0abab5', fontSize: '14px', marginBottom: '30px' }}>Результат отправлен администратору.</p>
                    )}
                    
                    <button onClick={() => setTestResultModal({show: false, score: 0, isPassed: false, title: ''})} style={{...errorBtnStyle, background: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', color: testResultModal.isPassed ? '#000' : '#fff', marginTop: 0}}>
                        {testResultModal.isPassed ? 'ОТЛИЧНО' : 'ПОНЯТНО'}
                    </button>
                </div>
            </div>
        )}

        {/* --- УМНОЕ ОКНО ПРЕДПРОСМОТРА ФАЙЛА --- */}
        {previewFile && (
            <div style={modalOverlay as any} onClick={() => setPreviewFile(null)}>
                <div className="tasks-modal" style={{ ...modalContentSmall, maxWidth: '80%', height: '85vh', padding: '25px', display: 'flex', flexDirection: 'column' } as any} onClick={e => e.stopPropagation()}>
                    <div className="tasks-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                        <h2 style={{ color: '#0abab5', fontWeight: '900', fontSize: '18px', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile.name}</h2>
                        <div onClick={() => setPreviewFile(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1 }}>✕</div>
                    </div>
                    <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                        {previewFile.data ? (
                            previewFile.name.toLowerCase().match(/\.(docx|doc|xls|xlsx|ppt|pptx|zip|rar)$/i) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', textAlign: 'center', padding: '20px' }}>
                                    <div style={{ fontSize: '60px', marginBottom: '15px' }}>📄</div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Формат не поддерживается</h3>
                                    <p style={{ color: '#555', fontSize: '14px', maxWidth: '350px', lineHeight: '1.5' }}>
                                        Браузеры не умеют открывать этот формат прямо внутри сайта. Вы можете скачать файл.
                                    </p>
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

        {/* --- МОДАЛКИ ДЛЯ АДМИНА --- */}

        {showRouteForm && (
            <div style={modalOverlay}>
                <div className="tasks-modal" style={{...modalContent, maxWidth: '500px'}}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{routeFormData.id ? 'РЕДАКТОР ШАГА' : 'НОВЫЙ ШАГ ПЛАНА'}</h2>
                    <input style={adminIn} placeholder="Название шага" value={routeFormData.title} onChange={e => setRouteFormData({...routeFormData, title: e.target.value})} />
                    <input style={adminIn} placeholder="Время (напр. 5 мин)" value={routeFormData.time} onChange={e => setRouteFormData({...routeFormData, time: e.target.value})} />
                    <textarea style={{...adminIn, height: '140px'}} placeholder="Теория или описание задачи..." value={routeFormData.content} onChange={e => setRouteFormData({...routeFormData, content: e.target.value})} />
                    <button onClick={handleSaveRoute} style={saveBtn}>СОХРАНИТЬ ШАГ</button>
                    <div onClick={() => setShowRouteForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                </div>
            </div>
        )}

        {routeToDelete && (
            <div style={errorOverlayStyle}>
                <div className="tasks-modal" style={errorModalContent}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ ШАГ?</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDeleteRoute} style={{...errorBtnStyle, flex: 1}}>УДАЛИТЬ</button>
                        <button onClick={() => setRouteToDelete(null)} style={{...errorBtnStyle, background: '#333', flex: 1}}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {showSectionForm && (
            <div style={modalOverlay}>
                <div className="tasks-modal" style={{...modalContent, maxWidth: '500px'}}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{sectionFormData.id ? 'РЕДАКТОР РАЗДЕЛА' : 'НОВЫЙ РАЗДЕЛ'}</h2>
                    <input style={adminIn} placeholder="Название раздела" value={sectionFormData.title} onChange={e => setSectionFormData({...sectionFormData, title: e.target.value})} />
                    <button onClick={handleSaveSection} style={saveBtn}>СОХРАНИТЬ РАЗДЕЛ</button>
                    <div onClick={() => setShowSectionForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                </div>
            </div>
        )}

        {sectionToDelete && (
            <div style={errorOverlayStyle}>
                <div className="tasks-modal" style={errorModalContent}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ РАЗДЕЛ?</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDeleteSection} style={{...errorBtnStyle, flex: 1}}>УДАЛИТЬ</button>
                        <button onClick={() => setSectionToDelete(null)} style={{...errorBtnStyle, background: '#333', flex: 1}}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {showModuleForm && (
            <div style={{...modalOverlay, alignItems: 'flex-start'}}>
                <div className="tasks-modal" style={{...modalContent, maxWidth: '900px', margin: '0 auto'}}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{moduleFormData.id ? 'РЕДАКТОР УРОКА' : 'НОВЫЙ УРОК'}</h2>
                    <input style={adminIn} placeholder="Введите название..." value={moduleFormData.title} onChange={e => setModuleFormData({...moduleFormData, title: e.target.value})} />
                    
                    <div className="tasks-theory-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', margin: '20px 0'}}>
                        <textarea style={{...adminIn, height: '120px'}} placeholder="Теория 1" value={moduleFormData.t1} onChange={e => setModuleFormData({...moduleFormData, t1: e.target.value})} />
                        <textarea style={{...adminIn, height: '120px'}} placeholder="Теория 2" value={moduleFormData.t2} onChange={e => setModuleFormData({...moduleFormData, t2: e.target.value})} />
                        <textarea style={{...adminIn, height: '120px'}} placeholder="Теория 3" value={moduleFormData.t3} onChange={e => setModuleFormData({...moduleFormData, t3: e.target.value})} />
                    </div>

                    <div style={{borderTop: '1px solid #222', paddingTop: '30px'}}>
                        <h3 style={{fontSize: '20px', color: '#0abab5', marginBottom: '25px', fontWeight: '900'}}>НАСТРОЙКА ТЕСТА</h3>
                        {moduleFormData.quiz.map((q, qIdx) => (
                            <div key={qIdx} style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                                {moduleFormData.quiz.length > 1 && <div onClick={() => removeQuizQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'}}>✕</div>}
                                <input style={adminIn} placeholder="Текст вопроса..." value={q.q} onChange={e => updateQuizQuestion(qIdx, 'q', e.target.value)} />
                                <div className="tasks-quiz-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px'}}>
                                    {[0,1,2].map(i => (
                                        <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                            <label style={{display:'flex', gap:'5px', cursor:'pointer', color: q.c === i ? '#0abab5' : '#fff'}}><input type="radio" checked={q.c === i} onChange={() => updateQuizQuestion(qIdx, 'c', i)} /> Вариант {i+1}</label>
                                            <input style={{...adminIn, marginBottom: 0, borderColor: q.c === i ? '#0abab5' : '#222'}} placeholder={`Ответ ${i+1}`} value={q.o[i]} onChange={e => updateQuizQuestion(qIdx, `o${i}`, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={addQuizQuestion} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'}}>+ ДОБАВИТЬ ЕЩЕ ВОПРОС</button>
                    </div>
                    <button onClick={handleSaveModule} style={{...saveBtn, marginTop: '30px'}}>СОХРАНИТЬ УРОК И ТЕСТ</button>
                    <div onClick={() => setShowModuleForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                </div>
            </div>
        )}

        {moduleToDelete && (
            <div style={{...errorOverlayStyle, zIndex: 50000}}>
                <div className="tasks-modal" style={errorModalContent}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ УРОК?</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDeleteModule} style={{...errorBtnStyle, flex: 1}}>УДАЛИТЬ</button>
                        <button onClick={() => setModuleToDelete(null)} style={{...errorBtnStyle, background: '#333', flex: 1}}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {selectedModule && !showModuleForm && (
           <div style={modalOverlay}>
              <div className="tasks-modal" style={modalContent}>
                 <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                    <div onClick={() => {setSelectedModule(null); setModuleView('content'); setCurrentQuizStep(0);}} style={{...backLink, margin:0}}>← НАЗАД</div>
                    <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(selectedModule.title)}</h2>
                    <div className="desktop-spacer" style={{width:'80px'}} />
                 </div>

                 {moduleView === 'content' ? (
                    <div style={{animation: 'fadeInUp 0.3s ease'}}>
                        <div className="tasks-theory-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px', marginBottom:'50px'}}>
                            {[selectedModule.t1, selectedModule.t2, selectedModule.t3].map((t, i) => (
                                <div key={i} className="tasks-theory-block" style={theoryBlock}>
                                    <h3 style={theoryLabel}>ТЕОРИЯ {i+1}</h3>
                                    <p style={theoryText}>{t || "Информация раздела."}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setModuleView('quiz')} style={checkKnowledgeBtn}>ПРОВЕРИТЬ ЗНАНИЯ</button>
                    </div>
                 ) : (
                    <div style={{animation: 'fadeInUp 0.3s ease'}}>
                        <div style={quizBox}>
                            <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {currentQuizStep + 1} / {selectedModule.quiz?.length || 1}</h4>
                            <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{selectedModule.quiz?.[currentQuizStep]?.q}</p>
                            <div style={{display:'grid', gap:'15px'}}>
                               {selectedModule.quiz?.[currentQuizStep]?.o.map((opt:any, i:any) => (
                                    <div key={i} onClick={() => handleQuizAnswer(i)} style={ansBtn(activeAnswer === i, i === selectedModule.quiz[currentQuizStep].c)}>{opt}</div>
                               ))}
                            </div>
                        </div>
                    </div>
                 )}
              </div>
           </div>
        )}

        {selectedRouteStep && !showRouteForm && (
           <div style={modalOverlay}>
              <div className="tasks-modal" style={modalContent}>
                 <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                    <div onClick={() => {setSelectedRouteStep(null); setModuleView('content');}} style={{...backLink, margin:0}}>← НАЗАД</div>
                    <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(selectedRouteStep.title)}</h2>
                    <div className="desktop-spacer" style={{width:'80px'}} />
                 </div>
                 <div style={{animation: 'fadeInUp 0.3s ease'}}>
                     <div className="tasks-theory-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'20px', marginBottom:'50px'}}>
                         <div className="tasks-theory-block" style={theoryBlock}><h3 style={theoryLabel}>ЗАДАЧА</h3><p style={theoryText}>{selectedRouteStep.content}</p></div>
                         <div className="tasks-theory-block" style={theoryBlock}><h3 style={theoryLabel}>ИНСТРУКЦИЯ</h3><p style={theoryText}>Соблюдайте регламенты и правила при выполнении данного шага.</p></div>
                         <div className="tasks-theory-block" style={theoryBlock}><h3 style={theoryLabel}>ИТОГ</h3><p style={theoryText}>После завершения шага вы получите необходимые навыки для работы.</p></div>
                     </div>
                     <button onClick={() => handleRouteComplete(selectedRouteStep.id)} style={checkKnowledgeBtn}>Я ИЗУЧИЛ ЭТОТ ШАГ</button>
                 </div>
              </div>
           </div>
        )}

        {showErrorModal && (
            <div style={{...errorOverlayStyle, zIndex: 60000}}>
                <div className="tasks-modal" style={errorModalContent}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
                    <h2 style={{ fontSize: '32px', color: '#ff4d4d', marginBottom: '35px', fontWeight: '900' }}>НЕВЕРНЫЙ ОТВЕТ</h2>
                    <button onClick={() => setShowErrorModal(false)} style={{...errorBtnStyle, marginTop: 0}}>ПОПРОБОВАТЬ СНОВА</button>
                </div>
            </div>
        )}
      </main>

      <style jsx global>{` 
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } 
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        
        * { box-sizing: border-box; }
        body { overflow-x: hidden; width: 100vw; margin: 0; padding: 0; }

        .premium-cards-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
            gap: 20px;
            width: 100%;
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
        }

        .premium-card:hover {
            border-color: #0abab5;
            box-shadow: 0 8px 25px rgba(10, 186, 181, 0.15);
            transform: translateY(-3px);
        }

        .premium-card:active {
            background: rgba(10, 186, 181, 0.05); 
            border-color: #0abab5;
            transform: scale(0.98); 
        }

        @media (max-width: 768px) {
            .desktop-sidebar-spacer { display: none !important; width: 0 !important; }
            
            .tasks-main { padding: 90px 15px 50px 15px !important; }
            .tasks-title { font-size: 26px !important; margin-bottom: 25px !important; line-height: 1.2 !important; }
            .tasks-chart-card { padding: 25px 20px !important; border-radius: 25px !important; }
            .tasks-stat-card { padding: 25px 20px !important; border-radius: 25px !important; }
            
            .premium-cards-container { 
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important; 
                gap: 15px !important; 
                width: 100% !important;
            }
            .premium-card {
                width: 100% !important;
                max-width: 320px !important; 
            }
            
            .tasks-dashboard-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
            .tasks-theory-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
            .tasks-quiz-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
            
            .tasks-big-val { font-size: 38px !important; flex-wrap: wrap; }
            .tasks-chart-container { height: 160px !important; margin-top: 25px !important; }

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
            
            .tasks-topic-row { padding: 15px 20px !important; }
            
            .tasks-flex-space { flex-direction: column; align-items: flex-start !important; gap: 15px !important; margin-bottom: 25px !important; }
        }
      `}</style>
    </div>
  );
}

export default function ShiftPage() {
    return <Suspense><ShiftContent /></Suspense>;
}