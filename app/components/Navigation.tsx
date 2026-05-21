"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// --- ХЕЛПЕРЫ ДЛЯ РАБОТЫ С COOKIES (ПАРАЛЛЕЛЬНАЯ ЗАПИСЬ) ---
const setAppCookie = (name: string, value: string, days: number | null = 7) => {
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`;
    } else {
        // Если days = null, создается сессионная cookie (уничтожается при закрытии вкладки)
        document.cookie = `${name}=${encodeURIComponent(value)};path=/`;
    }
};

const deleteAppCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// --- ХЕЛПЕР ДЛЯ ЗАПИСИ ДАННЫХ НА СЕРВЕР ---
const saveDataToServer = (key: string, data: any) => {
    fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

// --- РЕЗЕРВНЫЕ БАЗЫ ДЛЯ ПОИСКА (ЕСЛИ СЕРВЕР ПУСТОЙ) ---
const FALLBACK_ROUTE = [
  { id: "route_1", title: "О компании и бренде", content: "Мы — Tea Master Store. Наша цель: сделать чайную культуру доступной." },
  { id: "route_2", title: "Работа с кассой", content: "Открытие смены в 09:50. Работа в системе учета." },
  { id: "route_3", title: "Как рассказывать о чае", content: "Не грузи гостя терминами. Спрашивай о чувствах." },
  { id: "route_4", title: "Стандарты сервиса", content: "Подача пиалы двумя руками. Улыбка — это база." },
  { id: "route_5", title: "Чистота и посуда", content: "Гайвани — до блеска. Чабань всегда должна быть сухой." }
];

const FALLBACK_BASICS = [
  { id: "sec_1", title: "01. История и Бренд", modules: [ { id: "m1_1", title: "Философия Tea Master", t1: "Мастер — это лицо бренда.", t2: "Важно понимать психологию гостя.", t3: "Эстетика в деталях." } ] },
  { id: "sec_2", title: "02. Ботаника чая", modules: [ { id: "m2_1", title: "Camellia Sinensis", t1: "Это вечнозеленый куст.", t2: "Существует два основных подвида.", t3: "Китайская и ассамская разновидности." } ] },
  { id: "sec_3", title: "03. Зеленый чай", modules: [ { id: "m3_1", title: "Лунцзин", t1: "История сорта.", t2: "Технология плоской прожарки." } ] },
  { id: "sec_5", title: "05. Улуны", modules: [ { id: "m5_1", title: "Те Гуань Инь", t1: "Железная Бодхисаттва Милосердия.", t2: "Светлый улун." }, { id: "m5_4", title: "Габа чаи", t1: "Ферментация в азотной среде.", t2: "Повышенное содержание ГАМК." } ] }
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [searchDbProducts, setSearchDbProducts] = useState<any[]>([]);
  const [searchDbBasics, setSearchDbBasics] = useState<any[]>(FALLBACK_BASICS);
  const [searchDbRoutes, setSearchDbRoutes] = useState<any[]>(FALLBACK_ROUTE);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // На мобилках по умолчанию закрываем меню при загрузке страницы
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setIsSidebarOpen(false);
    }

    // ЧЕСТНАЯ ПРОВЕРКА АВТОРИЗАЦИИ: ищем и в Local, и в Session
    const auth = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    if (auth === 'true') {
      setIsLoggedIn(true);
      setUserRole(role);
    }

    const loadServerData = async () => {
        try {
            // ЧЕСТНЫЙ ПОИСК ID: ищем и в Local, и в Session
            const currentUserId = localStorage.getItem('current_user_id') || sessionStorage.getItem('current_user_id') || 'guest';
            
            const notifsRes = await fetch('/api/storage?key=tea_hub_notifications_v1').then(r => r.json()).catch(() => []);
            if (Array.isArray(notifsRes)) {
                const myNotifs = notifsRes.filter((n: any) => n.target === 'Все' || n.target === currentUserId || !n.target);
                setNotifications(myNotifs);
            }

            const pRes = await fetch('/api/storage?key=tea_master_unified_v1').then(r => r.json()).catch(() => []);
            if (Array.isArray(pRes)) setSearchDbProducts(pRes);

            const bRes = await fetch('/api/storage?key=tea_hub_dynamic_basics_v1').then(r => r.json()).catch(() => []);
            if (Array.isArray(bRes) && bRes.length > 0) setSearchDbBasics(bRes);

            const rRes = await fetch('/api/storage?key=tea_hub_dynamic_route_v1').then(r => r.json()).catch(() => []);
            if (Array.isArray(rRes) && rRes.length > 0) setSearchDbRoutes(rRes);

        } catch (e) {
            console.error("Ошибка синхронизации Navigation:", e);
        }
    };

    loadServerData();
    const syncInterval = setInterval(loadServerData, 5000);
    return () => clearInterval(syncInterval);
  }, []);

  const handleLogout = () => {
    // ВЫЧИЩАЕМ ВСЁ, НЕЗАВИСИМО ОТ ТОГО, ГДЕ ОНО БЫЛО
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('current_user_name');

    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('current_user_id');
    sessionStorage.removeItem('current_user_name');

    deleteAppCookie('isLoggedIn');
    deleteAppCookie('userRole');
    deleteAppCookie('current_user_id');
    deleteAppCookie('current_user_name');
    
    setIsLoggedIn(false);
    router.push('/');
  };

  const removeNotification = async (id: number) => {
    try {
        const res = await fetch('/api/storage?key=tea_hub_notifications_v1');
        const allNotifs = await res.json().catch(() => []);
        
        if (Array.isArray(allNotifs)) {
            const updated = allNotifs.filter((n: any) => n.id !== id);
            saveDataToServer('tea_hub_notifications_v1', updated);
            
            const currentUserId = localStorage.getItem('current_user_id') || sessionStorage.getItem('current_user_id') || 'guest';
            const myNotifs = updated.filter((n: any) => n.target === 'Все' || n.target === currentUserId || !n.target);
            setNotifications(myNotifs);
        }
    } catch (e) {
        console.error("Не удалось удалить уведомление:", e);
    }
  };

  // --- НОВАЯ ФУНКЦИЯ ДЛЯ ОЧИСТКИ ВСЕХ УВЕДОМЛЕНИЙ ---
  const clearAllNotifications = async () => {
    try {
        const res = await fetch('/api/storage?key=tea_hub_notifications_v1');
        const allNotifs = await res.json().catch(() => []);

        if (Array.isArray(allNotifs)) {
            const currentUserId = localStorage.getItem('current_user_id') || sessionStorage.getItem('current_user_id') || 'guest';
            
            // Фильтруем базу: оставляем только те уведомления, которые НЕ предназначены нам
            const updated = allNotifs.filter((n: any) => {
                const isMyNotif = n.target === 'Все' || n.target === currentUserId || !n.target;
                return !isMyNotif; // Если это мое уведомление - удаляем его из базы
            });
            
            saveDataToServer('tea_hub_notifications_v1', updated);
            
            // Сразу очищаем список на экране, не дожидаясь авто-синхронизации
            setNotifications([]);
        }
    } catch (e) {
        console.error("Не удалось очистить уведомления:", e);
    }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const q = val.toLowerCase();
    const results: any[] = [];

    searchDbProducts.forEach((p: any) => {
      const allText = [
        p.name, p.type, p.category, p.strength,
        p.summary, p.desc, p.info, p.region,
        p.brewGuide, p.advice, p.analogsDiff,
        ...(p.quiz ? p.quiz.map((qItem: any) => qItem.q + " " + qItem.o.join(" ")) : [])
      ].filter(Boolean).join(" ").toLowerCase();

      if (allText.includes(q)) {
        results.push({ id: `p_${p.id}`, title: p.name, subtitle: `Каталог • ${p.type} (${p.category})`, link: `/search?productId=${p.id}` });
      }
    });

    searchDbBasics.forEach((sec: any) => {
      const secText = [sec.title, sec.desc].filter(Boolean).join(" ").toLowerCase();
      if (secText.includes(q)) {
        results.push({ id: `e_${sec.id}`, title: sec.title, subtitle: `Обучение • Раздел`, link: `/tasks?tab=edu&sectionId=${sec.id}` });
      }
      
      sec.modules?.forEach((m: any) => {
        const mText = JSON.stringify(m).toLowerCase();
        if (mText.includes(q)) {
          results.push({ id: `m_${m.id}`, title: m.title, subtitle: `Обучение • Урок`, link: `/tasks?tab=edu&sectionId=${sec.id}&moduleId=${m.id}` });
        }
      });
    });

    searchDbRoutes.forEach((route: any) => {
      const rText = [route.title, route.content].filter(Boolean).join(" ").toLowerCase();
      if (rText.includes(q)) {
        results.push({ id: `r_${route.id}`, title: route.title, subtitle: `План обучения`, link: `/tasks?tab=edu&routeId=${route.id}` });
      }
    });

    setSearchResults(results.slice(0, 6)); 
    setIsSearchOpen(true);
  };

  const handleResultClick = (link: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    
    if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
    }
    router.push(link);
  };

  const sideItems = [
    { id: userRole === 'admin' ? '/admin' : '/tasks?tab=welcome', label: 'Статистика' },
    { id: '/tasks?tab=edu', label: 'Обучение' },
    { id: '/tasks?tab=assortment', label: 'Ассортимент' },
    { id: '/tasks?tab=standards', label: 'ИИ Помощник' },
  ];

  return (
    <>
      {!isLoggedIn ? (
        <header style={guestHeader} className="guest-header">
           <Link href="/login" style={{ textDecoration: 'none' }}><div style={loginBtn}>ВХОД</div></Link>
        </header>
      ) : (
        <>
          {isSidebarOpen && <div className="sidebar-mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

          <aside style={{ ...sidebarStyle, left: isSidebarOpen ? 0 : '-260px', transition: '0.3s ease' }} className="nav-sidebar">
            <div style={logoArea}>
                <div onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="desktop-hamburger" style={logoIcon}>≡</div>
                <span style={logoText}>Меню</span>
                <div onClick={() => setIsSidebarOpen(false)} className="mobile-close-btn" style={{ marginLeft: 'auto', fontSize: '24px', cursor: 'pointer', color: '#ff4d4d' }}>✕</div>
             </div>
             
             <nav style={sideNav}>
                {sideItems.map(item => {
                    const isActive = (pathname + (typeof window !== 'undefined' ? window.location.search : '')) === item.id;
                    return (
                        <Link key={item.id} href={item.id} className={`nav-item ${isActive ? 'active' : ''}`}>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
             </nav>
          </aside>

          <header style={{ ...topBarStyle, left: isSidebarOpen ? '260px' : '0', transition: '0.3s ease' }} className="nav-topbar">
             <div style={searchBox} className="search-box-container">
                {!isSidebarOpen && <div onClick={() => setIsSidebarOpen(true)} className="desktop-hamburger" style={{ cursor: 'pointer', fontSize: '20px', marginRight: '10px' }}>☰</div>}
                
                <div onClick={() => setIsSidebarOpen(true)} className="mobile-hamburger" style={{ cursor: 'pointer', fontSize: '24px' }}>☰</div>
                
                <span style={{opacity: 0.5}}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Поиск по базе знаний..." 
                  style={searchInput} 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                />

                {isSearchOpen && (
                  <div style={searchDropdownStyle as any}>
                    {searchResults.length > 0 ? (
                      searchResults.map(res => (
                        <div key={res.id} onMouseDown={() => handleResultClick(res.link)} className="search-result-item" style={searchResultItem as any}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{res.title}</div>
                          <div style={{ fontSize: '11px', color: '#0abab5', fontWeight: '900', marginTop: '5px' }}>{res.subtitle}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px', fontWeight: 'bold' }}>Ничего не найдено</div>
                    )}
                  </div>
                )}
              </div>
             
             <div style={topActions} className="top-actions">
                <div onClick={() => setIsNotifOpen(true)} className="top-icon-btn" style={topIcon}>
                  🔔
                  {notifications.length > 0 && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ff4d4d', borderRadius: '50%' }}></div>
                  )}
                </div>
                
                <div onClick={() => setIsProfileOpen(!isProfileOpen)} style={profileTrigger}>
                   👤
                   {isProfileOpen && (
                     <div style={profileDropdown}>
                        <Link href="/profile" className="drop-item">👤 Мой Профиль</Link>
                        <div onClick={handleLogout} className="drop-item logout-item" style={{ borderBottom: 'none' }}>Выйти</div>
                     </div>
                   )}
                </div>
             </div>
          </header>

          {isNotifOpen && (
            <div style={notifOverlayStyle as any} onClick={() => setIsNotifOpen(false)}>
              <div style={notifSidebarStyle as any} className="notif-sidebar-custom" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', margin: 0 }}>УВЕДОМЛЕНИЯ</h2>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginLeft: 'auto' }}>
                      {notifications.length > 0 && (
                          <span onClick={clearAllNotifications} style={{ fontSize: '11px', color: '#ff4d4d', cursor: 'pointer', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px dashed #ff4d4d', transition: '0.2s', whiteSpace: 'nowrap' }}>Очистить всё</span>
                      )}
                      <div onClick={() => setIsNotifOpen(false)} style={{ cursor: 'pointer', fontSize: '20px', opacity: 0.5, flexShrink: 0 }}>✕</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {notifications.length === 0 ? (
                     <div style={{ color: '#555', textAlign: 'center', marginTop: '40px', fontSize: '14px', fontWeight: 'bold' }}>Нет новых уведомлений</div>
                  ) : (
                     notifications.map(n => (
                      <div key={n.id} style={notifItemStyle as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#0abab5' }}>{n.title}</div>
                          <div onClick={() => removeNotification(n.id)} style={{ cursor: 'pointer', fontSize: '16px', color: '#666', paddingLeft: '10px' }}>✕</div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.4' }}>{n.text}</div>
                        <div style={{ fontSize: '10px', color: '#555', marginTop: '10px', fontWeight: 'bold' }}>{n.time}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
         @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        body {
            margin: 0;
            padding: 0;
            overflow-x: hidden !important;
        }
        * {
            box-sizing: border-box;
        }
        .custom-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 10px;
        }

        /* =================================================================
           АНИМАЦИИ НАВЕДЕНИЯ И КЛИКА ДЛЯ БОКОВОГО МЕНЮ (NAVIGATION)
        ================================================================= */
        .nav-item {
            display: flex;
            align-items: center;
            gap: 15px;
            color: #555;
            text-decoration: none;
            padding: 16px;
            border-radius: 18px;
            background: transparent;
            font-weight: 800;
            font-size: 15px;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        /* Активный пункт меню */
        .nav-item.active {
            color: #fff;
            background: #111;
        }

        /* Эффект наведения (сдвиг вправо + легкая подсветка) */
        .nav-item:hover {
            color: #0abab5;
            background: rgba(10, 186, 181, 0.05);
            transform: translateX(6px);
        }

        /* Эффект нажатия (вдавливание) */
        .nav-item:active {
            transform: scale(0.96) translateX(0);
            background: rgba(10, 186, 181, 0.15);
        }

        /* =================================================================
           АНИМАЦИИ ДЛЯ ВЫПАДАЮЩЕГО МЕНЮ ПРОФИЛЯ
        ================================================================= */
        .drop-item {
            display: block;
            padding: 20px;
            color: #fff;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            border-bottom: 1px solid #1a1a1a;
            transition: 0.2s ease;
            cursor: pointer;
        }

        .drop-item:hover {
            background: #1a1a1a;
            color: #0abab5;
            padding-left: 28px; /* Сдвигаем текст */
        }

        /* Кнопка "Выйти" - красная при наведении */
        .logout-item:hover {
            color: #ff4d4d !important;
            background: rgba(255, 77, 77, 0.1) !important;
        }
        
        .search-result-item:hover {
            background: rgba(10, 186, 181, 0.1);
        }

        .top-icon-btn:hover {
            opacity: 1 !important;
            transform: scale(1.1);
        }

        /* КЛАССЫ СКРЫТЫЕ НА ДЕСКТОПЕ ПО УМОЛЧАНИЮ */
        .sidebar-mobile-overlay { display: none; }
        .mobile-hamburger { display: none; }
        .mobile-close-btn { display: none; }

        /* --- ПРАВИЛА ИСКЛЮЧИТЕЛЬНО ДЛЯ ТЕЛЕФОНОВ (до 768px) --- */
        @media (max-width: 768px) {
            /* Шапка и Навигация */
            .nav-topbar {
                left: 0 !important;
                padding: 0 15px !important;
                height: 70px !important;
            }
            .nav-sidebar {
                z-index: 10005 !important;
            }
            .sidebar-mobile-overlay {
                display: block !important;
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.6);
                z-index: 10004;
                backdrop-filter: blur(5px);
            }
            .desktop-hamburger { display: none !important; }
            .mobile-hamburger { 
                display: block !important; 
                margin-right: 15px; 
                color: #fff;
            }
            .mobile-close-btn { display: block !important; }

            /* Строка поиска */
            .search-box-container {
                width: auto !important;
                flex: 1;
                padding: 10px 15px !important;
                margin-right: 15px;
            }

            /* Кнопка "Вход" для неавторизованных */
            .guest-header {
                right: 15px !important;
                top: 15px !important;
            }

            /* Всплывающие модальные окна */
            .modal-content-custom {
                padding: 30px 20px !important;
                width: 95% !important;
            }

            /* Панель уведомлений */
            .notif-sidebar-custom {
                width: 100% !important;
                border-left: none !important;
            }
        }
      `}</style>
    </>
  );
}

// --- СТИЛИ ---
const guestHeader: any = { position: 'fixed', top: '20px', right: '40px', zIndex: 1000 };
const loginBtn: any = { background: '#0ABAB5', color: '#000', padding: '12px 35px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize:'14px' };

const sidebarStyle: any = { width: '260px', height: '100vh', background: '#000', position: 'fixed', left: 0, top: 0, padding: '40px 20px', display: 'flex', flexDirection: 'column', zIndex: 1001, borderRight: '1px solid #1a1a1a', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
const logoArea: any = { display: 'flex', alignItems: 'center', gap: '15px', color: '#fff', marginBottom: '50px', paddingLeft: '10px' };
const logoIcon: any = { fontSize: '24px', cursor: 'pointer' };
const logoText: any = { fontSize: '20px', fontWeight: '900', letterSpacing: '1px', color: '#fff' };
const sideNav: any = { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 };

const topBarStyle: any = { position: 'fixed', top: 0, right: 0, height: '90px', background: 'rgba(13, 15, 13, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', zIndex: 1000, boxSizing: 'border-box' };
const searchBox: any = { position: 'relative', background: '#111', padding: '12px 25px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', width: '450px', maxWidth: '40vw', border: '1px solid #222', boxSizing: 'border-box' };
const searchInput: any = { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500' };
const searchDropdownStyle: any = { position: 'absolute', top: '55px', left: 0, width: '100%', background: '#111', border: '1px solid #222', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', zIndex: 10005, display: 'flex', flexDirection: 'column' };
const searchResultItem: any = { padding: '16px 20px', borderBottom: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.2s' };
const topActions: any = { display: 'flex', alignItems: 'center', gap: '30px' };
const topIcon: any = { position: 'relative', fontSize: '22px', color: '#fff', cursor: 'pointer', opacity: 0.5, transition: '0.3s' };
const profileTrigger: any = { width: '48px', height: '48px', background: '#111', border: '1px solid #222', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', cursor: 'pointer', position: 'relative' };
const profileDropdown: any = { position: 'absolute', top: '65px', right: 0, background: '#111', border: '1px solid #222', borderRadius: '20px', width: '220px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', zIndex: 10003 };
const notifOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 20000, display: 'flex', justifyContent: 'flex-end' };
const notifSidebarStyle = { width: '350px', height: '100%', background: '#000', borderLeft: '1px solid #222', padding: '40px 30px', animation: 'slideInRight 0.4s ease', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', overflowY: 'auto' };
const notifItemStyle = { background: '#0d0d0d', padding: '20px', borderRadius: '18px', border: '1px solid #1a1a1a', marginBottom: '10px' };
