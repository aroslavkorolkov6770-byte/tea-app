"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import CustomIcon from '@/app/components/CustomIcon';
import { fetchStorageBatch, saveDataToServer } from '@/app/lib/storageClient';
import { DEFAULT_TRAINING_TESTS } from '@/app/tasks/data/defaultTrainingTests';
import { useSearchParams, useRouter } from 'next/navigation';
import { clearClientAuthState, isClientAdminView } from '@/app/lib/authClient';

// --- ИМПОРТ НАШИХ МОДУЛЕЙ ---
import Education from './components/Education';
import Assortment from './components/Assortment';
import AIAssistant from './components/AIAssistant';
import Documents from './components/Documents';
import Products from './components/Products'; // ДОБАВЛЕН ИМПОРТ НОВОГО РАЗДЕЛА ПРОДУКТОВ
import LearningPaths from './components/LearningPaths';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v2',
    DYNAMIC_TESTS: 'tea_hub_dynamic_tests_v1',   
    DYNAMIC_ROUTE: 'tea_hub_dynamic_route_v2',     
    TESTS_PROGRESS: 'tea_hub_tests_progress_v1',
    URGENT_FILES: 'tea_hub_urgent_files_v1'        
};

const CLIENT_CACHE_KEYS = {
    URGENT_FILES: 'th_cache_urgent_files_v1',
    DYNAMIC_ROUTE: 'th_cache_dynamic_route_v2',
    DYNAMIC_TESTS: 'th_cache_dynamic_tests_v1',
    ASSORTMENT: 'th_cache_assortment_matrix_v2',
};

function ShiftContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const backgroundSessionCheckRef = React.useRef(0);
  const activeTabRef = React.useRef('welcome');
  const latestLoadRequestRef = React.useRef(0);
  
  const [isMounted, setIsMounted] = useState(false);
  const [isSessionValidated, setIsSessionValidated] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // --- ГЛОБАЛЬНЫЕ ДАННЫЕ (ПЕРЕДАЮТСЯ В МОДУЛИ КАК PROPS) ---
  const [dynamicRoute, setDynamicRoute] = useState<any[]>([]);
  const [dynamicTests, setDynamicTests] = useState<any[]>(DEFAULT_TRAINING_TESTS);
  const [completedRoute, setCompletedRoute] = useState<string[]>([]);
  const [completedTests, setCompletedTests] = useState<string[]>([]); 
  const [urgentFiles, setUrgentFiles] = useState<any[]>([]);
  const [passedTests, setPassedTests] = useState<string[]>([]);
  const [dismissedTasks, setDismissedTasks] = useState<string[]>([]);
  const [assortmentMatrix, setAssortmentMatrix] = useState<any[]>([]);

  // --- СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ МОДАЛКАМИ ИЗ ПОИСКА ---
  const [selectedRouteStep, setSelectedRouteStep] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null); 

  // --- СОСТОЯНИЕ УВЕДОМЛЕНИЙ PUSH ---
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('granted');
  const [isPushBound, setIsPushBound] = useState(false);

  useEffect(() => {
      activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
      const refreshViewMode = () => {
          setIsAdmin(isClientAdminView());
      };

      window.addEventListener('teaHubViewModeChanged', refreshViewMode);
      window.addEventListener('storage', refreshViewMode);

      return () => {
          window.removeEventListener('teaHubViewModeChanged', refreshViewMode);
          window.removeEventListener('storage', refreshViewMode);
      };
  }, []);

  const hydrateCachedData = (currentUserId: string) => {
      if (typeof window === 'undefined') {
          return;
      }

      try {
          const cachedUrgentFiles = localStorage.getItem(CLIENT_CACHE_KEYS.URGENT_FILES);
          const cachedDynamicRoute = localStorage.getItem(CLIENT_CACHE_KEYS.DYNAMIC_ROUTE);
          const cachedDynamicTests = localStorage.getItem(CLIENT_CACHE_KEYS.DYNAMIC_TESTS);
          const cachedAssortment = localStorage.getItem(CLIENT_CACHE_KEYS.ASSORTMENT);
          const cachedCompletedRoute = localStorage.getItem(`th_prog_route_${currentUserId}`);
          const cachedCompletedTests = localStorage.getItem(`th_prog_tests_${currentUserId}`);
          const cachedPassedTests = localStorage.getItem(`th_cache_passed_tests_${currentUserId}`);
          const cachedDismissedTasks = localStorage.getItem(`th_dismissed_tasks_${currentUserId}`);

          if (cachedUrgentFiles) {
              const parsed = JSON.parse(cachedUrgentFiles);
              if (Array.isArray(parsed)) setUrgentFiles(parsed);
          }

          if (cachedDynamicRoute) {
              const parsed = JSON.parse(cachedDynamicRoute);
              if (Array.isArray(parsed)) setDynamicRoute(parsed);
          }

          if (cachedDynamicTests) {
              const parsed = JSON.parse(cachedDynamicTests);
              if (Array.isArray(parsed) && parsed.length > 0) setDynamicTests(parsed);
          }

          if (cachedAssortment) {
              const parsed = JSON.parse(cachedAssortment);
              if (Array.isArray(parsed)) setAssortmentMatrix(parsed);
          }

          if (cachedCompletedRoute) {
              const parsed = JSON.parse(cachedCompletedRoute);
              if (Array.isArray(parsed)) setCompletedRoute(parsed);
          }

          if (cachedCompletedTests) {
              const parsed = JSON.parse(cachedCompletedTests);
              if (Array.isArray(parsed)) setCompletedTests(parsed);
          }

          if (cachedPassedTests) {
              const parsed = JSON.parse(cachedPassedTests);
              if (Array.isArray(parsed)) setPassedTests(parsed);
          }

          if (cachedDismissedTasks) {
              const parsed = JSON.parse(cachedDismissedTasks);
              if (Array.isArray(parsed)) setDismissedTasks(parsed);
          }
      } catch (error) {
          console.error('Ошибка чтения локального кеша задач:', error);
      }
  };

  const loadAllData = async (currentUserId: string, checkUrl = false) => {
      const requestId = latestLoadRequestRef.current + 1;
      latestLoadRequestRef.current = requestId;

      try {
          const storageData = await fetchStorageBatch([
              STORAGE_KEYS.URGENT_FILES,
              `prog_route_${currentUserId}`,
              `prog_tests_${currentUserId}`,
              STORAGE_KEYS.DYNAMIC_TESTS,
              STORAGE_KEYS.DYNAMIC_ROUTE,
              `th_passed_tests_${currentUserId}`,
              'tea_hub_assortment_matrix_v2',
              `dismissed_tasks_${currentUserId}`,
          ]);

          const sFiles = storageData[STORAGE_KEYS.URGENT_FILES];
          const cRoute = storageData[`prog_route_${currentUserId}`];
          const cTests = storageData[`prog_tests_${currentUserId}`];
          const sTestsData = storageData[STORAGE_KEYS.DYNAMIC_TESTS];
          const sRouteData = storageData[STORAGE_KEYS.DYNAMIC_ROUTE];
          const pTestsRes = storageData[`th_passed_tests_${currentUserId}`];
          const sAssortment = storageData['tea_hub_assortment_matrix_v2'];
          const sDismissed = storageData[`dismissed_tasks_${currentUserId}`];

          if (requestId !== latestLoadRequestRef.current) {
              return;
          }

          if (Array.isArray(sFiles)) {
              setUrgentFiles(sFiles);
              localStorage.setItem(CLIENT_CACHE_KEYS.URGENT_FILES, JSON.stringify(sFiles));
          }

          if (Array.isArray(cRoute)) {
              setCompletedRoute(cRoute);
              localStorage.setItem(`th_prog_route_${currentUserId}`, JSON.stringify(cRoute));
          }

          if (Array.isArray(cTests)) {
              setCompletedTests(cTests);
              localStorage.setItem(`th_prog_tests_${currentUserId}`, JSON.stringify(cTests));
          }

          if (Array.isArray(pTestsRes)) {
              setPassedTests(pTestsRes);
              localStorage.setItem(`th_cache_passed_tests_${currentUserId}`, JSON.stringify(pTestsRes));
          }

          if (Array.isArray(sDismissed)) {
              setDismissedTasks(sDismissed);
              localStorage.setItem(`th_dismissed_tasks_${currentUserId}`, JSON.stringify(sDismissed));
          }

          if (Array.isArray(sTestsData)) {
              const resolvedTests = sTestsData.length > 0 ? sTestsData : DEFAULT_TRAINING_TESTS;
              setDynamicTests(resolvedTests);
              localStorage.setItem(CLIENT_CACHE_KEYS.DYNAMIC_TESTS, JSON.stringify(resolvedTests));
          }

          if (Array.isArray(sRouteData)) {
              setDynamicRoute(sRouteData);
              localStorage.setItem(CLIENT_CACHE_KEYS.DYNAMIC_ROUTE, JSON.stringify(sRouteData));
          }

          if (Array.isArray(sAssortment)) {
              setAssortmentMatrix(sAssortment);
              localStorage.setItem(CLIENT_CACHE_KEYS.ASSORTMENT, JSON.stringify(sAssortment));
          }

      } catch (e) {
          console.error("Ошибка синхронизации с сервером", e);
      }
  };

  const subscribeToPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          alert("Браузер не поддерживает Web Push уведомления.");
          return;
      }
      const currentId = localStorage.getItem('current_user_id') || 'guest';
      if (currentId === 'guest' || !currentId) {
          alert(" Перед включением уведомлений нужно войти в свой аккаунт на этом устройстве! Пожалуйста, сначала авторизуйтесь под логином сотрудника и попробуйте снова.");
          return;
      }
      try {
          const permission = await Notification.requestPermission();
          setPushStatus(permission);
          if (permission === 'granted') {
              const swUrl = `/sw.js?v=${Date.now()}`;
              const registration = await navigator.serviceWorker.register(swUrl);
              let subscription = await registration.pushManager.getSubscription();

              if (!subscription) {
                  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                  if (!vapidPublicKey) {
                      console.warn("VAPID ключ не найден в .env");
                      return;
                  }
                  const urlBase64ToUint8Array = (base64String: string) => {
                      const cleanKey = base64String.replace(/["']/g, '').trim();
                      const padding = '='.repeat((4 - cleanKey.length % 4) % 4);
                      const base64 = (cleanKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                      const rawData = window.atob(base64);
                      const outputArray = new Uint8Array(rawData.length);
                      for (let i = 0; i < rawData.length; ++i) {
                          outputArray[i] = rawData.charCodeAt(i);
                      }
                      return outputArray;
                  };
                  subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                  });
              }

              const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_push_subs_v1`);
              let subs = await res.json().catch(() => []);
              if (!Array.isArray(subs)) subs = [];

              let filteredSubs = subs.filter((s: any) => s.sub.endpoint !== subscription?.endpoint);
              filteredSubs.push({ userId: currentId, sub: subscription });
              
              await fetch('/api/storage', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: 'tea_hub_push_subs_v1', data: filteredSubs })
              }).catch(err => console.error(err));
              
              localStorage.setItem('tea_hub_push_bound', 'true');
              setIsPushBound(true);

              alert(` Устройство успешно зарегистрировано и привязано к вашему аккаунту!`);
          } else {
              alert(" Вы заблокировали уведомления в браузере.");
          }
      } catch (error) {
          console.error('Ошибка подписки на Push:', error);
          alert("Ошибка привязки устройства: " + error);
      }
  };

  useEffect(() => {
    setIsMounted(true);
    let isDisposed = false;

    const verifyProtectedSession = async (redirectOnUnauthorized: boolean) => {
        try {
            let sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });

            if (sessionResponse.status === 401) {
                await new Promise((resolve) => setTimeout(resolve, 250));
                sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
            }

            if (sessionResponse.status === 401) {
                if (redirectOnUnauthorized) {
                    clearClientAuthState();
                    if (!isDisposed) {
                        setIsSessionValidated(false);
                        router.replace('/');
                    }
                }
                return false;
            }

            if (!sessionResponse.ok) {
                return null;
            }

            const currentId = localStorage.getItem('current_user_id') || 'guest';
            if (!isDisposed) {
                setIsAdmin(isClientAdminView());
                setUserId(currentId);
                setIsSessionValidated(true);
            }

            if (typeof window !== 'undefined' && !isDisposed) {
                if (!('Notification' in window)) setPushStatus('unsupported');
                else setPushStatus(Notification.permission as any);
                setIsPushBound(localStorage.getItem('tea_hub_push_bound') === 'true');
            }

            return currentId;
        } catch (error) {
            console.error('Ошибка проверки защищенной сессии:', error);
            return null;
        }
    };

    const bootPage = async () => {
        const currentId = await verifyProtectedSession(true);
        if (!currentId) {
            return;
        }

        hydrateCachedData(currentId);
        await loadAllData(currentId, true);

        const urlTab = searchParams.get('tab');
        if (urlTab && !isDisposed) setActiveTab(urlTab);
    };

    bootPage();

    const syncInterval = setInterval(async () => {
        if (document.visibilityState !== 'visible') {
            return;
        }

        if (activeTabRef.current === 'products') {
            return;
        }

        const currentId = localStorage.getItem('current_user_id') || 'guest';
        if (currentId && currentId !== 'guest') {
            loadAllData(currentId, false);
        }

        const now = Date.now();
        if (now - backgroundSessionCheckRef.current > 60_000) {
            backgroundSessionCheckRef.current = now;
            await verifyProtectedSession(false);
        }
    }, 20000);

    const focusHandler = async () => {
        if (activeTabRef.current === 'products') {
            return;
        }
        const currentId = await verifyProtectedSession(false);
        if (currentId) {
            loadAllData(currentId, false);
        }
    };
    window.addEventListener('focus', focusHandler);

    return () => {
        isDisposed = true;
        clearInterval(syncInterval);
        window.removeEventListener('focus', focusHandler);
    };
  }, [router]);

  useEffect(() => {
      const urlTab = searchParams.get('tab');
      if (urlTab && urlTab !== activeTab) {
          setActiveTab(urlTab);
      }
  }, [activeTab, searchParams]);

  const lastHandledParams = React.useRef("");
  useEffect(() => {
      if (!isMounted) return;
      const currentParams = searchParams.toString();
      
      if (lastHandledParams.current === currentParams) return; 
      if (dynamicRoute.length === 0 && dynamicTests.length === 0 && assortmentMatrix.length === 0) return; 

      let handled = false;
      
      const rId = searchParams.get('routeId');
      if (rId && dynamicRoute.length > 0) {
          const step = dynamicRoute.find(r => r.id === rId);
          if (step) {
              setSelectedRouteStep(step);
              handled = true;
          }
      }

      const tId = searchParams.get('testId');
      if (tId && dynamicTests.length > 0) {
          const testIdx = dynamicTests.findIndex(t => t.id === tId);
          if (testIdx !== -1) {
              const isUnlocked = testIdx === 0 || completedTests.includes(dynamicTests[testIdx - 1].id);
              if (isUnlocked) {
                  setSelectedTest(dynamicTests[testIdx]);
              } else {
                  alert(`Для разблокировки этого этапа сначала необходимо успешно сдать Тест ${testIdx}`);
              }
              handled = true;
          }
      }

      const aId = searchParams.get('assortmentId');
      if (aId && assortmentMatrix.length > 0) handled = true;
      
      if (handled) lastHandledParams.current = currentParams;
  }, [searchParams, dynamicRoute, dynamicTests, assortmentMatrix, completedTests, isMounted]);

  const closeRouteModal = () => {
      setSelectedRouteStep(null);
      if (searchParams.has('routeId')) {
          router.replace('/tasks?tab=edu', { scroll: false });
      }
  };

  const closeTestModal = () => {
      setSelectedTest(null);
      if (searchParams.has('testId')) {
          router.replace('/tasks?tab=edu', { scroll: false });
      }
  };

  const closeLinkedDocument = () => {
      if (searchParams.has('documentId')) {
          router.replace('/tasks?tab=docs');
      }
  };

  if (!isMounted || !isSessionValidated) return null;

  const routePercent = Math.round((completedRoute.length / (Math.max(dynamicRoute.length, 1))) * 100);
  const testsPercent = Math.round((completedTests.length / (Math.max(dynamicTests.length, 1))) * 100);
  const totalHubPercent = Math.round((routePercent + testsPercent) / 2);

  const statusSteps = [
      { min: 0, label: 'НОВИЧОК', hint: 'Первый этап адаптации' },
      { min: 15, label: 'ОСВАИВАЕТСЯ', hint: 'Погружение в базу знаний' },
      { min: 35, label: 'УВЕРЕННЫЙ СТАРТ', hint: 'Хорошая рабочая база' },
      { min: 55, label: 'В РАБОЧЕМ РИТМЕ', hint: 'Стабильное продвижение' },
      { min: 75, label: 'СИЛЬНЫЙ СОТРУДНИК', hint: 'Высокий уровень освоения' },
      { min: 90, label: 'МАСТЕР HUB', hint: 'Почти полный контроль материалов' }
  ];
  const currentStatus = [...statusSteps].reverse().find(step => totalHubPercent >= step.min) || statusSteps[0];
  const pct = totalHubPercent;
  const startX = 0;
  const startY = 100;
  const endX = pct;
  const cpX = pct * 0.5;
  const dotY = Math.max(pct, 2);
  const lineEndY = 100 - dotY;
  const pathArea = `M ${startX} ${startY} Q ${cpX} ${startY}, ${endX} ${lineEndY} L ${endX} ${startY} Z`;
  const pathLine = `M ${startX} ${startY} Q ${cpX} ${startY}, ${endX} ${lineEndY}`;
  const openEducationSection = (sectionId: 'topics' | 'tests') => {
      router.push(`/tasks?tab=edu#${sectionId}`, { scroll: false });
  };

  return (
    <div className="vates-app-page vates-tasks-page" style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', transition: '0.3s', overflowX: 'hidden' }}>
      <Navigation />
      
      <div className="desktop-sidebar-spacer" aria-hidden="true" />

      <main className="tasks-main" style={{ flex: 1, padding: '120px 60px 60px 60px', transition: '0.3s', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        
        {(!isPushBound && (pushStatus === 'default' || pushStatus === 'granted') && userId !== 'guest') && (
            <div className="tasks-push-binding-banner" style={{ background: '#111', border: '1px solid #0abab5', borderRadius: '18px', padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', animation: 'fadeInUp 0.4s ease' }}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0abab5', fontWeight: '900' }}>Синхронизация уведомлений</h3>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>Нажмите кнопку справа, чтобы жестко привязать это устройство к вашему рабочему аккаунту.</p>
                </div>
                <button onClick={subscribeToPush} style={{ background: '#0abab5', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>ПРИВЯЗАТЬ</button>
            </div>
        )}

        {/* --- ВКЛАДКА 1: СТАТИСТИКА (ДАШБОРД) --- */}
        {activeTab === 'welcome' && (
            <div className="vates-staff-dashboard" style={{ animation: 'fadeInUp 0.6s ease' }}>
                <header className="vates-page-heading">
                    <div>
                        <span className="vates-eyebrow">Рабочее пространство</span>
                        <h1>Моё обучение</h1>
                        <p>Ваш прогресс, обязательные материалы и ближайшие учебные шаги.</p>
                    </div>
                </header>

                <section className="vates-staff-progress-hero">
                    <div>
                        <span className="vates-eyebrow">Общий прогресс</span>
                        <h2>{currentStatus.label}</h2>
                        <p>Продолжайте обучение, чтобы последовательно открыть следующие темы и тесты.</p>
                    </div>
                    <div className="vates-staff-progress-ring" style={{ '--staff-progress': `${totalHubPercent * 3.6}deg` } as React.CSSProperties}>
                        <span>{totalHubPercent}%</span>
                    </div>
                </section>

                <div className="vates-staff-kpis">
                    <button type="button" className="vates-staff-kpi" onClick={() => openEducationSection('topics')} aria-label="Перейти к темам">
                        <CustomIcon name="book" size={22} color="var(--vates-accent)" />
                        <span>Темы</span>
                        <strong>{completedRoute.length}/{dynamicRoute.length}</strong>
                    </button>
                    <button type="button" className="vates-staff-kpi" onClick={() => openEducationSection('tests')} aria-label="Перейти к тестам">
                        <CustomIcon name="cap" size={22} color="var(--vates-accent)" />
                        <span>Тесты</span>
                        <strong>{completedTests.length}/{dynamicTests.length}</strong>
                    </button>
                    <button type="button" className="vates-staff-kpi" onClick={() => router.push('/tasks?tab=docs')} aria-label="Перейти к документам">
                        <CustomIcon name="file" size={22} color="var(--vates-accent)" />
                        <span>Документы</span>
                        <strong>{urgentFiles.length}</strong>
                    </button>
                </div>
                
                <section className="tasks-chart-card" style={wideChartCard}>
                    <div className="tasks-flex-space" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap: 'wrap', gap:'20px'}}>
                        <div>
                            <div style={{fontSize:'11px', fontWeight:'900', color:'#0abab5', letterSpacing:'2px', marginBottom:'8px', textTransform:'uppercase'}}>ОБЩАЯ ДИНАМИКА РАЗВИТИЯ</div>
                            <div className="tasks-big-val" style={{fontSize:'48px', fontWeight:'900', color:'#fff', display:'flex', alignItems:'baseline', gap:'12px'}}>
                                {totalHubPercent}%
                            </div>
                        </div>
                        <div style={rankBadge}>{currentStatus.label}</div>
                    </div>

                    <div className="tasks-chart-container" style={{ position: 'relative', width: '100%', height: '130px', marginTop: '30px', marginBottom: '30px' }}>
                        {[0, 25, 50, 75, 100].map(v => (
                            <div key={`h-${v}`} style={{ position: 'absolute', bottom: `${v}%`, left: 0, width: '100%', borderBottom: '1px solid rgba(255,255,255,0.03)', zIndex: 1 }} />
                        ))}
                        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                            <div key={`v-${v}`} style={{ position: 'absolute', bottom: 0, left: `${v}%`, height: '100%', borderLeft: '1px solid rgba(255,255,255,0.03)', zIndex: 1 }} />
                        ))}

                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="flatGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0abab5" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#0abab5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={pathArea} fill="url(#flatGrad)" style={{ transition: '1s ease' }} />
                            <path d={pathLine} fill="none" stroke="#0abab5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ transition: '1s ease' }} />
                        </svg>

                        <div style={{ 
                            position: 'absolute', left: `${endX}%`, bottom: `${dotY}%`, 
                            transform: 'translate(-50%, 50%)', width: '10px', height: '10px', 
                            borderRadius: '50%', background: '#0abab5', border: '2px solid #111', 
                            zIndex: 3, transition: '1s ease' 
                        }} />

                        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                            <div key={`lbl-${p}`} style={{ position: 'absolute', left: `${p}%`, bottom: '-25px', transform: 'translateX(-50%)', fontSize: '10px', color: '#666', fontWeight: 'bold' }}>{p}%</div>
                        ))}
                    </div>
                </section>

                <div className="tasks-dashboard-grid" style={dashboardGrid}>
                      <div className="tasks-stat-card" style={statCardMain}>
                         <div style={cardHeaderLabel}>ТЕОРИЯ</div>
                         <div className="tasks-big-val" style={bigStatVal}>{completedRoute.length} <span style={{fontSize:'20px', opacity:0.4}}>/ {dynamicRoute.length}</span></div>
                         <p style={cardSubText}>тем пройдено</p>
                          <div style={segmentedBar}>
                              {dynamicRoute.map((step, i) => (
                                  <div key={i} style={segment(completedRoute.includes(step.id))} />
                              ))}
                         </div>
                         {dynamicRoute.length === 0 && (
                             <div style={{ ...pBarBg, marginTop: '18px' }}>
                                 <div style={pBarFill(0)} />
                             </div>
                         )}
                      </div>
                </div>
            </div>
        )}

        {/* --- ВКЛАДКА 2: ОБУЧЕНИЕ --- */}
        {activeTab === 'edu' && (
            <Education 
                isAdmin={isAdmin}
                userId={userId}
                dynamicRoute={dynamicRoute} setDynamicRoute={setDynamicRoute}
                completedRoute={completedRoute} setCompletedRoute={setCompletedRoute}
                dynamicTests={dynamicTests} setDynamicTests={setDynamicTests}
                completedTests={completedTests} setCompletedTests={setCompletedTests}
                urgentFiles={urgentFiles}
                passedTests={passedTests} setPassedTests={setPassedTests}
                dismissedTasks={dismissedTasks} setDismissedTasks={setDismissedTasks}
                selectedRouteStep={selectedRouteStep} setSelectedRouteStep={setSelectedRouteStep}
                closeRouteModal={closeRouteModal}
                selectedTest={selectedTest} setSelectedTest={setSelectedTest}
                closeTestModal={closeTestModal}
            />
        )}

        {/* --- ВКЛАДКА 2.1: УЧЕБНЫЕ ПУТИ --- */}
        {activeTab === 'paths' && (
            <LearningPaths
                isAdmin={isAdmin}
                dynamicRoute={dynamicRoute}
                dynamicTests={dynamicTests}
            />
        )}

        {/* --- ВКЛАДКА 2.2: ДОКУМЕНТЫ --- */}
        {activeTab === 'docs' && (
            <Documents 
                isAdmin={isAdmin}
                userId={userId}
                urgentFiles={urgentFiles}
                setUrgentFiles={setUrgentFiles}
                linkedDocumentId={searchParams.get('documentId')}
                onCloseLinkedDocument={closeLinkedDocument}
            />
        )}

        {/* --- ВКЛАДКА 3: АССОРТИМЕНТ --- */}
        {activeTab === 'assortment' && (
            <Assortment 
                assortmentMatrix={assortmentMatrix} 
                assortmentId={searchParams.get('assortmentId')} 
            />
        )}

        {/* НОВОЕ: ВКЛАДКА 3.1: ПРОДУКТЫ */}
        {activeTab === 'products' && (
            <Products 
                isAdmin={isAdmin} 
                userId={userId}
                assortmentMatrix={assortmentMatrix}
                setAssortmentMatrix={setAssortmentMatrix}
            />
        )}

        {/* --- ВКЛАДКА 4: ИИ ПОМОЩНИК --- */}
        {activeTab === 'standards' && (
            <AIAssistant userId={userId} isAdmin={isAdmin} />
        )}

      </main>

      <style jsx global>{` 
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } 
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        
        * { box-sizing: border-box; }
        body { overflow-x: hidden; width: 100vw; margin: 0; padding: 0; }

        @media (max-width: 767px) {
            .desktop-sidebar-spacer { display: none !important; width: 0 !important; }
            
            .tasks-main { padding: 90px 15px 50px 15px !important; }
            .tasks-title { font-size: 26px !important; margin-bottom: 25px !important; line-height: 1.2 !important; }
            .tasks-chart-card { padding: 25px 20px !important; border-radius: 25px !important; }
            .tasks-stat-card { padding: 25px 20px !important; border-radius: 25px !important; }
            
            .tasks-dashboard-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
            
            .tasks-big-val { font-size: 38px !important; flex-wrap: wrap; }
            .tasks-chart-container { height: 160px !important; margin-top: 25px !important; }

            .tasks-flex-space { flex-direction: column; align-items: flex-start !important; gap: 15px !important; margin-bottom: 25px !important; }
        }
      `}</style>
    </div>
  );
}

// --- СТИЛИ БЛОКОВ И КАРТОЧЕК ДЛЯ ДАШБОРДА ---
const wideChartCard: React.CSSProperties = { background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', marginBottom: '30px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' };
const rankBadge: React.CSSProperties = { background: 'rgba(10,186,181,0.08)', color: '#0abab5', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', fontSize: '13px', border: '1px solid rgba(10,186,181,0.2)' };
const dashboardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px', width: '100%' };
const statCardMain: React.CSSProperties = { background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid #222', boxSizing: 'border-box' };
const cardHeaderLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', marginBottom: '15px' };
const bigStatVal: React.CSSProperties = { fontSize: '48px', fontWeight: '900', color: '#fff' };
const cardSubText: React.CSSProperties = { fontSize: '14px', opacity: 0.5, marginBottom: '25px' };

const segmentedBar: React.CSSProperties = { display: 'flex', gap: '8px', height: '8px', marginTop: '10px', width: '100%' };
const segment = (active: boolean): React.CSSProperties => ({ flex: 1, background: active ? '#0abab5' : '#222', borderRadius: '4px', transition: '0.3s' });
const pBarBg: React.CSSProperties = { height: '8px', background: '#222', borderRadius: '4px', marginTop: '15px', marginBottom: '10px' };
const pBarFill = (w: number): React.CSSProperties => ({ width: `${w}%`, height: '100%', background: '#0abab5', borderRadius: '4px', transition: '1s' });

export default function ShiftPage() {
    return <Suspense><ShiftContent /></Suspense>;
}
