"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Состояния для формы входа и регистрации
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  
  // Дополнительные поля для регистрации
  const [regName, setRegName] = useState("");
  const [email, setEmail] = useState("");
  const [regTg, setRegTg] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const [searchDbProducts, setSearchDbProducts] = useState<any[]>([]);
  const [searchDbBasics, setSearchDbBasics] = useState<any[]>(FALLBACK_BASICS);
  const [searchDbRoutes, setSearchDbRoutes] = useState<any[]>(FALLBACK_ROUTE);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');
    if (auth === 'true') {
      setIsLoggedIn(true);
      setUserRole(role);
    }

    const loadServerData = async () => {
        try {
            const currentUserId = localStorage.getItem('current_user_id') || 'guest';
            
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

  // --- ЛОГИКА АВТОРИЗАЦИИ ---
  const handleLogin = async () => {
    try {
        const res = await fetch('/api/storage?key=tea_hub_users_v1');
        let users = await res.json().catch(() => []);
        
        if (!Array.isArray(users) || users.length === 0) {
            users = [
                { id: 'u_admin', login: '11', pass: '11', role: 'admin', name: 'Главный Мастер' },
                { id: 'u_staff', login: '1', pass: '1', role: 'staff', name: 'Ярик' }
            ];
            saveDataToServer('tea_hub_users_v1', users);
        }

        const foundUser = users.find((u: any) => u.login === login && u.pass === pass);

        if (foundUser) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', foundUser.role);
          localStorage.setItem('current_user_id', foundUser.id);
          localStorage.setItem('current_user_name', foundUser.name);
          
          setIsLoggedIn(true);
          setUserRole(foundUser.role);
          setShowLoginModal(false);
          
          if (foundUser.role === 'admin') router.push('/admin');
          else router.push('/tasks?tab=welcome');
        } else {
          alert("Неправильно введен логин или пароль!");
        }
    } catch (error) {
        console.error("Ошибка связи с сервером:", error);
        alert("Не удалось подключиться к базе данных.");
    }
  };

  // --- ЛОГИКА АКТИВАЦИИ/РЕГИСТРАЦИИ НОВОГО СОТРУДНИКА ---
  const handleRegister = async () => {
      if (!regName.trim() || !login.trim() || !pass.trim()) {
          alert("Пожалуйста, заполните Имя, Логин и Пароль!");
          return;
      }

      try {
          const res = await fetch('/api/storage?key=tea_hub_users_v1');
          let users = await res.json().catch(() => []);
          if (!Array.isArray(users)) users = [];

          const foundUserIndex = users.findIndex((u: any) => u.login === login.trim() && u.pass === pass.trim());

          if (foundUserIndex === -1) {
              alert("Неправильно введен логин или пароль! Убедитесь, что администратор выдал вам доступы.");
              return;
          }

          const existingUser = users[foundUserIndex];

          users[foundUserIndex] = { ...existingUser, name: regName.trim() };
          saveDataToServer('tea_hub_users_v1', users);

          const initialProfile = {
              avatar: '',
              tg: regTg.trim(),
              phone: regPhone.trim(),
              email: email.trim(),
              firstLogin: new Date().toISOString()
          };
          saveDataToServer(`profile_data_${existingUser.id}`, initialProfile);

          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', existingUser.role);
          localStorage.setItem('current_user_id', existingUser.id);
          localStorage.setItem('current_user_name', regName.trim());

          setIsLoggedIn(true);
          setUserRole(existingUser.role);
          setShowLoginModal(false);
          
          if (existingUser.role === 'admin') router.push('/admin');
          else router.push('/tasks?tab=welcome');

      } catch (error) {
          console.error("Ошибка при регистрации:", error);
          alert("Не удалось подключиться к базе данных для регистрации.");
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('current_user_name');
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
            
            const currentUserId = localStorage.getItem('current_user_id') || 'guest';
            const myNotifs = updated.filter((n: any) => n.target === 'Все' || n.target === currentUserId || !n.target);
            setNotifications(myNotifs);
        }
    } catch (e) {
        console.error("Не удалось удалить уведомление:", e);
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
    router.push(link);
  };

  const sideItems = [
    { id: userRole === 'admin' ? '/admin' : '/tasks?tab=welcome', label: 'Статистика', },
    { id: '/tasks?tab=edu', label: 'Обучение', },
    { id: '/search', label: 'Продукты' },
    { id: '/tasks?tab=standards', label: 'ИИ Помощник' },
  ];

  return (
    <>
      {!isLoggedIn ? (
        <header style={guestHeader}>
           <div onClick={() => setShowLoginModal(true)} style={loginBtn}>ВХОД</div>
        </header>
      ) : (
        <>
          <aside style={{ ...sidebarStyle, left: isSidebarOpen ? 0 : '-260px', transition: '0.3s ease' }}>
            <div style={logoArea}>
                <div onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={logoIcon}>≡</div>
                <span style={logoText}>Dash Board</span>
             </div>
             <nav style={sideNav}>
                {sideItems.map(item => (
                    <Link key={item.id} href={item.id} style={sideLink((pathname + (typeof window !== 'undefined' ? window.location.search : '')) === item.id)}>
                        <span>{item.label}</span>
                    </Link>
                ))}
             </nav>
          </aside>

          <header style={{ ...topBarStyle, left: isSidebarOpen ? '260px' : '0', transition: '0.3s ease' }}>
             <div style={searchBox}>
                {!isSidebarOpen && <div onClick={() => setIsSidebarOpen(true)} style={{ cursor: 'pointer', fontSize: '20px', marginRight: '10px' }}>☰</div>}
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
                        <div key={res.id} onMouseDown={() => handleResultClick(res.link)} style={searchResultItem as any}>
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
             
             <div style={topActions}>
                <div onClick={() => setIsNotifOpen(true)} style={topIcon}>
                  🔔
                  {notifications.length > 0 && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ff4d4d', borderRadius: '50%' }}></div>
                  )}
                </div>
                
                <div onClick={() => setIsProfileOpen(!isProfileOpen)} style={profileTrigger}>
                   👤
                   {isProfileOpen && (
                     <div style={profileDropdown}>
                        <Link href="/profile" style={dropLink}>👤 Мой Профиль</Link>
                        <div onClick={handleLogout} style={{...dropLink, color: '#ff4d4d', borderBottom: 'none'}}>Выйти</div>
                     </div>
                   )}
                </div>
             </div>
          </header>

          {isNotifOpen && (
            <div style={notifOverlayStyle as any} onClick={() => setIsNotifOpen(false)}>
              <div style={notifSidebarStyle as any} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>УВЕДОМЛЕНИЯ</h2>
                  <div onClick={() => setIsNotifOpen(false)} style={{ cursor: 'pointer', fontSize: '20px', opacity: 0.5 }}>✕</div>
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

      {showLoginModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{color:'#fff', textAlign:'center', marginBottom:'25px', fontWeight: '900', letterSpacing: '1px'}}>
                {isLoginMode ? 'ВХОД В СИСТЕМУ' : 'АКТИВАЦИЯ АККАУНТА'}
            </h2>
            
            {!isLoginMode && (
                <input type="text" placeholder="Ваше Имя (для профиля)" value={regName} onChange={(e)=>setRegName(e.target.value)} style={inputS} />
            )}
            
            <input type="text" placeholder="Логин (выданный админом)" value={login} onChange={(e)=>setLogin(e.target.value)} style={inputS} />
            <input type="password" placeholder="Пароль (выданный админом)" value={pass} onChange={(e)=>setPass(e.target.value)} style={inputS} onKeyDown={(e) => { if(e.key === 'Enter') { isLoginMode ? handleLogin() : handleRegister() } }} />
            
            {!isLoginMode && (
                <>
                    <input type="email" placeholder="E-mail адрес" value={email} onChange={(e)=>setEmail(e.target.value)} style={inputS} />
                    <input type="text" placeholder="Telegram (напр. @nik_name)" value={regTg} onChange={(e)=>setRegTg(e.target.value)} style={inputS} />
                    <input type="text" placeholder="Номер телефона" value={regPhone} onChange={(e)=>setRegPhone(e.target.value)} style={inputS} />
                </>
            )}
            
            {isLoginMode ? (
                <div onClick={handleLogin} style={modalLoginBtn}>ВОЙТИ</div>
            ) : (
                <div onClick={handleRegister} style={modalLoginBtn}>ЗАРЕГИСТРИРОВАТЬСЯ</div>
            )}
            
            <div 
                onClick={() => setIsLoginMode(!isLoginMode)} 
                style={{...closeText, color: '#0abab5', marginTop: '15px', textDecoration: 'underline'}}
            >
                {isLoginMode ? 'Первый вход? Завершить регистрацию' : 'Уже настроили профиль? Войти'}
            </div>

            <div onClick={()=> { setShowLoginModal(false); setIsLoginMode(true); }} style={closeText}>ОТМЕНА</div>
          </div>
        </div>
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
        /* Стилизация скроллбара внутри модального окна */
        .custom-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 10px;
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
const sideLink = (active: boolean): any => ({ display: 'flex', alignItems: 'center', gap: '15px', color: active ? '#fff' : '#555', textDecoration: 'none', padding: '16px', borderRadius: '18px', background: active ? '#111' : 'transparent', fontWeight: '800', fontSize: '15px', transition: '0.3s' });

const topBarStyle: any = { position: 'fixed', top: 0, right: 0, height: '90px', background: 'rgba(13, 15, 13, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', zIndex: 1000, boxSizing: 'border-box' };
const searchBox: any = { position: 'relative', background: '#111', padding: '12px 25px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', width: '450px', maxWidth: '40vw', border: '1px solid #222', boxSizing: 'border-box' };
const searchInput: any = { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500' };
const searchDropdownStyle: any = { position: 'absolute', top: '55px', left: 0, width: '100%', background: '#111', border: '1px solid #222', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', zIndex: 10005, display: 'flex', flexDirection: 'column' };
const searchResultItem: any = { padding: '16px 20px', borderBottom: '1px solid #1a1a1a', cursor: 'pointer', transition: '0.2s' };
const topActions: any = { display: 'flex', alignItems: 'center', gap: '30px' };
const topIcon: any = { position: 'relative', fontSize: '22px', color: '#fff', cursor: 'pointer', opacity: 0.5, transition: '0.3s' };
const profileTrigger: any = { width: '48px', height: '48px', background: '#111', border: '1px solid #222', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', cursor: 'pointer', position: 'relative' };
const profileDropdown: any = { position: 'absolute', top: '65px', right: 0, background: '#111', border: '1px solid #222', borderRadius: '20px', width: '220px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', zIndex: 10003 };
const dropLink: any = { display: 'block', padding: '20px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #1a1a1a' };
const notifOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 20000, display: 'flex', justifyContent: 'flex-end' };
const notifSidebarStyle = { width: '350px', height: '100%', background: '#000', borderLeft: '1px solid #222', padding: '40px 30px', animation: 'slideInRight 0.4s ease', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', overflowY: 'auto' };
const notifItemStyle = { background: '#0d0d0d', padding: '20px', borderRadius: '18px', border: '1px solid #1a1a1a', marginBottom: '10px' };
const modalOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30000, backdropFilter: 'blur(15px)', boxSizing: 'border-box' };

// ИСПРАВЛЕННЫЕ СТИЛИ ДЛЯ МОДАЛКИ (Сделал шире, отступы меньше)
const modalContent: any = { 
    background: '#000', 
    padding: '40px 35px', 
    borderRadius: '35px', 
    width: '90%', 
    maxWidth: '440px', // Увеличил ширину для пропорций
    maxHeight: '95vh', // Оставил запас для экранов поменьше
    overflowY: 'auto',
    border: '1px solid #222', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
    boxSizing: 'border-box',
    className: 'custom-scroll' // Добавил класс для тонкого скроллбара
};

// ИСПРАВЛЕННЫЕ СТИЛИ ДЛЯ ИНПУТОВ (Меньше высота, меньше скругление)
const inputS: any = { 
    width: '100%', 
    padding: '14px 20px', 
    marginBottom: '12px', 
    borderRadius: '14px', 
    background: '#0d0d0d', 
    border: '1px solid #222', 
    color: '#fff', 
    outline: 'none', 
    fontSize: '14px', 
    textAlign: 'center', 
    boxSizing: 'border-box' 
};

const modalLoginBtn: any = { 
    width: '100%', 
    padding: '14px', 
    background: '#0ABAB5', 
    color: '#000', 
    textAlign: 'center', 
    borderRadius: '14px', 
    fontWeight: '900', 
    cursor: 'pointer', 
    fontSize: '15px', 
    textTransform: 'uppercase', 
    marginTop: '15px', 
    boxSizing: 'border-box' 
};

const closeText: any = { 
    color: '#444', 
    textAlign: 'center', 
    marginTop: '20px', 
    cursor: 'pointer', 
    fontSize: '12px', 
    fontWeight: '800', 
    textTransform: 'uppercase' 
};