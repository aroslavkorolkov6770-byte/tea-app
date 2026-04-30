"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false); 
  
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');
    const introSeen = localStorage.getItem('intro_seen');

    if (auth === 'true') {
      setIsLoggedIn(true);
      setUserRole(role);

      if (role === 'staff' && introSeen !== 'true') {
        setShowIntroModal(true);
      }
    }
  }, [pathname, isLoggedIn]);

  const handleLogin = () => {
    if (login === "11" && pass === "11") {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'admin');
      setIsLoggedIn(true);
      setUserRole('admin');
      setShowLoginModal(false);
      router.push('/search');
    } 
    else if (login === "1" && pass === "1") {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'staff');
      setIsLoggedIn(true);
      setUserRole('staff');
      setShowLoginModal(false);

      const introSeen = localStorage.getItem('intro_seen');
      if (introSeen !== 'true') {
          setShowIntroModal(true);
      }
      
      setLogin(""); setPass("");
      router.push('/tasks?tab=welcome');
    } 
    else {
      alert("Неверный логин или пароль!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    setIsMenuOpen(false);
    router.push('/');
  };

  const startTraining = () => {
    localStorage.setItem('intro_seen', 'true'); 
    setShowIntroModal(false); 
    router.push('/tasks?tab=welcome');
  };

  // ПУТИ НАВИГАЦИИ (Продукты переименованы в БАЗА)
  const navItems = [
    { id: '/tasks?tab=welcome', label: 'ОСНОВЫ', icon: '👋' },
    { id: '/tasks?tab=standards', label: 'РАБОТА', icon: '💡' },
    { id: '/tasks?tab=checklist', label: 'СМЕНА', icon: '📋' },
    { id: '/tasks?tab=monitor', label: 'Мониторинг', icon: '📊' },
    { id: '/search', label: 'БАЗА', icon: '🍃' },
  ];

  return (
    <>
      <header style={headerCenterStyle as any}>
        <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={bigBurgerStyle as any}>
          <span style={{ fontSize: '18px' }}>{isMenuOpen ? '✕' : '☰'}</span>
          <span style={{ letterSpacing: '2px' }}>{isMenuOpen ? 'ЗАКРЫТЬ' : 'ВХОД'}</span>
        </div>
        
        {isLoggedIn && (
          <Link href="/profile" style={profileIconStyle as any}>
             👤
          </Link>
        )}

        {isMenuOpen && (
          <div style={menuDropdownCenterStyle as any}>
            {!isLoggedIn ? (
              <div onClick={() => {setShowLoginModal(true); setIsMenuOpen(false)}} style={menuItemStyle as any}>🔑 Авторизация</div>
            ) : (
              <>
                <div style={{...menuItemStyle, color: '#4CAF50', fontSize: '11px', cursor: 'default', opacity: 0.7} as any}>STATUS: {userRole?.toUpperCase()}</div>
                
                {userRole === 'admin' && (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} style={{...menuItemStyle, color: '#4CAF50'} as any}>⚙️ Админ-панель</Link>
                )}

                <Link href="/profile" onClick={() => setIsMenuOpen(false)} style={menuItemStyle as any}>👤 Личный кабинет</Link>
                <div onClick={handleLogout} style={{...menuItemStyle, color: '#ff7675', borderBottom: 'none'} as any}>ВЫЙТИ</div>
              </>
            )}
          </div>
        )}
      </header>

      {showLoginModal && (
        <div style={modalOverlayStyle as any}>
          <div style={modalContentStyle as any}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#fff', fontSize: '20px', fontWeight: '800' }}>IDENTIFICATION</h2>
            <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} style={inputStyle as any} />
            <input type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={inputStyle as any} />
            <div onClick={handleLogin} style={loginButtonStyle as any}>ВОЙТИ</div>
            <div onClick={() => setShowLoginModal(false)} style={{ textAlign: 'center', color: '#444', marginTop: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>ОТМЕНА</div>
          </div>
        </div>
      )}

      {showIntroModal && (
        <div style={modalOverlayStyle as any}>
          <div style={{...modalContentStyle, textAlign: 'center', border: '1px solid #4CAF50'} as any}>
            <div style={{fontSize: '40px', marginBottom: '20px'}}>📖</div>
            <h2 style={{ color: '#fff', marginBottom: '15px', fontWeight: '900' }}>ОБРАТИТЕ ВНИМАНИЕ</h2>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>Для начала работы необходимо изучить раздел Приветствие (Основы)</p>
            <div onClick={startTraining} style={loginButtonStyle as any}>ХОРОШО</div>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <nav style={navBarStyle as any}>
          {/* ФИЛЬТРАЦИЯ: У админа не показывается СМЕНА */}
          {navItems
            .filter(t => !(userRole === 'admin' && t.label === 'СМЕНА'))
            .map(t => (
            <Link key={t.id} href={t.id} style={{ ...navItemStyle, color: (pathname === t.id.split('?')[0]) ? '#4CAF50' : '#888' } as any}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '1px' }}>{t.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

const profileIconStyle = { position: 'fixed', right: '20px', top: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', zIndex: 10002, textDecoration: 'none' };
const bigBurgerStyle = { background: 'rgba(0, 0, 0, 0.6)', color: '#fff', border: '1px solid rgba(76, 175, 80, 0.5)', padding: '12px 30px', borderRadius: '15px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(10px)', zIndex: 10002 };
const headerCenterStyle = { position: 'fixed', top: '40px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10000 };
const menuDropdownCenterStyle = { position: 'absolute', top: '80px', backgroundColor: '#111', borderRadius: '20px', width: '220px', overflow: 'hidden', border: '1px solid #222' };
const menuItemStyle = { padding: '20px', borderBottom: '1px solid #1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 'bold', display: 'block', textDecoration: 'none', cursor: 'pointer', textAlign: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalContentStyle = { background: '#111', padding: '50px 40px', borderRadius: '40px', width: '340px', border: '1px solid #222' };
const inputStyle = { width: '100%', padding: '18px', marginBottom: '15px', borderRadius: '15px', background: '#000', border: '1px solid #222', color: '#fff', boxSizing: 'border-box', outline: 'none' };
const loginButtonStyle = { width: '100%', padding: '20px', borderRadius: '15px', background: '#4CAF50', color: '#000', fontWeight: '900', cursor: 'pointer', textAlign: 'center' };
const navBarStyle = { position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '320px', height: '80px', backgroundColor: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.05)', zIndex: 9998 };
const navItemStyle = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' };