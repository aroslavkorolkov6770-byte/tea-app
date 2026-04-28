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
  
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');
    if (auth === 'true') {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = () => {
    if (login === "11" && pass === "11") {
      setIsLoggedIn(true);
      setUserRole('admin');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'admin');
      setShowLoginModal(false);
      setLogin(""); setPass("");
      router.push('/search');
    } 
    else if (login === "1" && pass === "1") {
      setIsLoggedIn(true);
      setUserRole('staff');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'staff');
      setShowLoginModal(false);
      setLogin(""); setPass("");
      router.push('/tasks');
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

  const navItems = [
    {id: '/', label: 'ГЛАВНАЯ', icon: '🏠'},
    {id: '/tasks', label: 'СМЕНА', icon: '📋'},
    {id: '/search', label: 'БАЗА', icon: '🍃'},
  ];

  return (
    <>
      {/* ШАПКА САЙТА */}
      <header style={headerCenterStyle as any}>
        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          style={bigBurgerStyle as any}
          onMouseEnter={(e: any) => {
            e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e: any) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '18px' }}>{isMenuOpen ? '✕' : '☰'}</span>
          <span style={{ letterSpacing: '2px' }}>{isMenuOpen ? 'ЗАКРЫТЬ' : 'ВХОД'}</span>
        </div>
        
        {isMenuOpen && (
          <div style={menuDropdownCenterStyle as any}>
            {!isLoggedIn ? (
              <div onClick={() => {setShowLoginModal(true); setIsMenuOpen(false)}} style={menuItemStyle as any}>
                🔑 Авторизация
              </div>
            ) : (
              <>
                <div style={{...menuItemStyle, color: '#4CAF50', fontSize: '11px', cursor: 'default', opacity: 0.7} as any}>
                  STATUS: {userRole?.toUpperCase()}
                </div>
                <div onClick={handleLogout} style={{...menuItemStyle, color: '#ff7675', borderBottom: 'none'} as any}>
                  ВЫЙТИ
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* МОДАЛКА ЛОГИНА */}
      {showLoginModal && (
        <div style={modalOverlayStyle as any}>
          <div style={modalContentStyle as any}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#fff', fontSize: '20px', fontWeight: '800' }}>IDENTIFICATION</h2>
            <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} style={inputStyle as any} />
            <input type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={inputStyle as any} />
            <div onClick={handleLogin} style={loginButtonStyle as any}>ПОДТВЕРДИТЬ</div>
            <div onClick={() => setShowLoginModal(false)} style={{ textAlign: 'center', color: '#444', marginTop: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>ОТМЕНА</div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ НАВИГАЦИЯ */}
      {isLoggedIn && (
        <nav style={navBarStyle as any}>
          {navItems
            .filter(item => item.id !== '/')
            .map(t => (
              <Link key={t.id} href={t.id} style={{ ...navItemStyle, color: pathname === t.id ? '#4CAF50' : '#888' } as any}>
                <span style={{ fontSize: '22px' }}>{t.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>{t.label}</span>
              </Link>
          ))}
        </nav>
      )}
    </>
  );
}

// --- НОВЫЙ ДИЗАЙН КНОПКИ (BIG BURGER) ---
const bigBurgerStyle = { 
  background: 'rgba(0, 0, 0, 0.6)', 
  color: '#fff', 
  border: '1px solid rgba(76, 175, 80, 0.5)', 
  padding: '12px 30px', 
  borderRadius: '15px', 
  fontSize: '13px', 
  fontWeight: '800', 
  cursor: 'pointer', 
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 10002
};

// --- ОСТАЛЬНЫЕ СТИЛИ ---
const headerCenterStyle = { position: 'fixed', top: '40px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10000 };
const menuDropdownCenterStyle = { position: 'absolute', top: '80px', backgroundColor: '#111', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.9)', width: '220px', overflow: 'hidden', border: '1px solid #222' };
const menuItemStyle = { padding: '20px', borderBottom: '1px solid #1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', display: 'block', textDecoration: 'none', cursor: 'pointer', textAlign: 'center' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 };
const modalContentStyle = { background: '#111', padding: '50px 40px', borderRadius: '40px', width: '340px', border: '1px solid #222' };
const inputStyle = { width: '100%', padding: '18px', marginBottom: '15px', borderRadius: '15px', background: '#000', border: '1px solid #222', color: '#fff', boxSizing: 'border-box', outline: 'none', fontSize: '14px' };
const loginButtonStyle = { width: '100%', padding: '20px', borderRadius: '15px', background: '#4CAF50', color: '#000', fontWeight: '900', cursor: 'pointer', textAlign: 'center', letterSpacing: '1px' };
const navBarStyle = { position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '320px', height: '80px', backgroundColor: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', zIndex: 9998 };
const navItemStyle = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', transition: '0.3s ease' };