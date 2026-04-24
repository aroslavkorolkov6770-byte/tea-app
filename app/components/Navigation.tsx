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
      alert("Вход: 1 и 1");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  return (
    <>
      {/* КНОПКА ВХОДА ЦЕНТРИРОВАННАЯ СВЕРХУ */}
      <header style={headerCenterStyle}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={bigBurgerStyle}>
          {isMenuOpen ? '✕' : '☰ ВХОД'}
        </button>
        
        {isMenuOpen && (
          <div style={menuDropdownCenterStyle}>
            {!isLoggedIn ? (
              <button onClick={() => {setShowLoginModal(true); setIsMenuOpen(false)}} style={menuItemStyle}>🔑 Авторизация</button>
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
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>Доступ сотрудника</h2>
            <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} style={inputStyle} />
            <button onClick={handleLogin} style={loginButtonStyle}>Войти</button>
            <button onClick={() => setShowLoginModal(false)} style={{ background: 'none', border: 'none', color: '#666', width: '100%', marginTop: '15px', cursor: 'pointer' }}>Закрыть</button>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ - ВАРИАНТ "ПАРЯЩАЯ КАПСУЛА" */}
      {isLoggedIn && (
        <nav style={navBarStyle}>
          {[
            {id: '/', label: 'ГЛАВНАЯ', icon: '🏠'},
            {id: '/tasks', label: 'СМЕНА', icon: '📋'},
            {id: '/search', label: 'БАЗА', icon: '🍃'},
          ].map(t => (
            <Link key={t.id} href={t.id} style={{ ...navItemStyle, color: pathname === t.id ? '#4CAF50' : '#888' }}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '800' }}>{t.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

// СТИЛИ ВЕРХНЕЙ ЧАСТИ
const headerCenterStyle = { position: 'fixed' as const, top: '30px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10000 };
const bigBurgerStyle = { background: '#4CAF50', color: 'white', border: '4px solid white', padding: '10px 25px', borderRadius: '50px', fontSize: '18px', fontWeight: 'bold' as const, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '10px' };
const menuDropdownCenterStyle = { position: 'absolute' as const, top: '70px', backgroundColor: '#161816', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', width: '220px', overflow: 'hidden', border: '1px solid #333' };
const menuItemStyle = { padding: '18px', border: 'none', background: 'none', width: '100%', textAlign: 'left' as const, color: '#fff', fontSize: '15px', borderBottom: '1px solid #222', display: 'block', textDecoration: 'none' };

// СТИЛИ МОДАЛКИ
const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 };
const modalContentStyle = { background: '#161816', padding: '35px', borderRadius: '35px', width: '300px', border: '1px solid #333' };
const inputStyle = { width: '100%', padding: '15px', marginBottom: '12px', borderRadius: '15px', background: '#222', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' as const };
const loginButtonStyle = { width: '100%', padding: '18px', borderRadius: '18px', background: '#4CAF50', border: 'none', color: '#fff', fontWeight: 'bold' as const, cursor: 'pointer' };

// --- ОБНОВЛЕННАЯ НИЖНЯЯ ПАНЕЛЬ (КАПСУЛА) ---
const navBarStyle = { 
  position: 'fixed' as const, 
  bottom: '30px',          // Отступ от низа
  left: '50%',             // Центрирование
  transform: 'translateX(-50%)', 
  width: '90%',            // Ширина на мобильных
  maxWidth: '380px',       // Ограничение ширины на десктопе
  height: '75px', 
  backgroundColor: 'rgba(22, 24, 22, 0.85)', // Полупрозрачный темный
  backdropFilter: 'blur(15px)',             // Размытие фона
  borderRadius: '40px',     // Эффект капсулы
  display: 'flex', 
  justifyContent: 'space-around', 
  alignItems: 'center',
  padding: '0 15px',
  border: '1px solid rgba(255, 255, 255, 0.1)', 
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)', 
  zIndex: 9998 
};

const navItemStyle = { 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column' as const, 
  alignItems: 'center', 
  justifyContent: 'center', 
  gap: '4px', 
  textDecoration: 'none',
  transition: '0.3s ease'
};