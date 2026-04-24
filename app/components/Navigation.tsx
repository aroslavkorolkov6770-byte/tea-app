"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    if (auth === 'true') setIsLoggedIn(true);
  }, []);

  const handleLogin = () => {
    if (login === "1" && pass === "1") {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setShowLoginModal(false);
      router.push('/tasks');
    } else {
      alert("Неверные данные");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  return (
    <>
      <header style={headerStyle}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={burgerButtonStyle}>{isMenuOpen ? '✕' : '☰'}</button>
        {isMenuOpen && (
          <div style={menuDropdownStyle}>
            {!isLoggedIn ? (
              <button onClick={() => {setShowLoginModal(true); setIsMenuOpen(false)}} style={menuItemStyle}>🔑 Войти</button>
            ) : (
              <button onClick={() => {handleLogout(); setIsMenuOpen(false)}} style={{...menuItemStyle, color: '#ff7675'}}>Выйти</button>
            )}
            <Link href="/admin" onClick={() => setIsMenuOpen(false)} style={menuItemStyle}>⚙️ Настройки</Link>
          </div>
        )}
      </header>

      {showLoginModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Авторизация</h2>
            <input type="text" placeholder="Логин (1)" value={login} onChange={(e) => setLogin(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Пароль (1)" value={pass} onChange={(e) => setPass(e.target.value)} style={inputStyle} />
            <button onClick={handleLogin} style={loginButtonStyle}>Войти</button>
            <button onClick={() => setShowLoginModal(false)} style={{ background: 'none', border: 'none', color: '#444', width: '100%', marginTop: '15px' }}>Закрыть</button>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <nav style={navBarStyle}>
          {[
            {id: '/', label: 'ГЛАВНАЯ', icon: '🏠'},
            {id: '/tasks', label: 'СМЕНА', icon: '📋'},
            {id: '/search', label: 'БАЗА', icon: '🍃'},
          ].map(t => (
            <Link key={t.id} href={t.id} style={{ ...navItemStyle, color: pathname === t.id ? '#4CAF50' : '#444' }}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

// ИСПРАВЛЕННЫЕ СТИЛИ (добавлено "as const")
const headerStyle = { position: 'fixed' as const, top: 0, width: '100%', height: '70px', display: 'flex', justifyContent: 'flex-end' as const, alignItems: 'center', padding: '0 60px', zIndex: 1000 };
const burgerButtonStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer', color: '#fff', fontSize: '20px' };
const menuDropdownStyle = { position: 'absolute' as const, top: '80px', right: '60px', backgroundColor: '#161816', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: '200px', overflow: 'hidden', border: '1px solid #222' };
const menuItemStyle = { padding: '16px', border: 'none', background: 'none', width: '100%', textAlign: 'left' as const, color: '#fff', fontSize: '14px', borderBottom: '1px solid #222', display: 'block', textDecoration: 'none' };
const navBarStyle = { position: 'fixed' as const, bottom: '25px', left: '20px', right: '20px', height: '75px', backgroundColor: 'rgba(22, 24, 22, 0.95)', backdropFilter: 'blur(15px)', borderRadius: '25px', display: 'flex', border: '1px solid #222', zIndex: 999 };
const navItemStyle = { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '10px', fontWeight: 'bold', textDecoration: 'none' };
const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContentStyle = { background: '#161816', padding: '35px', borderRadius: '30px', width: '300px', border: '1px solid #333' };
const inputStyle = { width: '100%', padding: '15px', marginBottom: '12px', borderRadius: '12px', background: '#222', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' as const };
const loginButtonStyle = { width: '100%', padding: '16px', borderRadius: '15px', background: '#4CAF50', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' };