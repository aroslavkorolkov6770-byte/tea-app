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

  // Проверка авторизации при загрузке страницы
  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');
    if (auth === 'true') {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = () => {
    // 1. ВХОД ДЛЯ АДМИНА
    if (login === "11" && pass === "11") {
      setIsLoggedIn(true);
      setUserRole('admin');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'admin');
      setShowLoginModal(false);
      setLogin(""); setPass("");
      router.push('/admin');
    } 
    // 2. ВХОД ДЛЯ СОТРУДНИКА
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
      alert("Неверный логин или пароль! (Админ: 11/11, Сотрудник: 1/1)");
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

  return (
    <>
      {/* ШАПКА САЙТА */}
      <header style={headerCenterStyle as any}>
        <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={bigBurgerStyle as any}>
          {isMenuOpen ? '✕' : '☰ МЕНЮ'}
        </div>
        
        {isMenuOpen && (
          <div style={menuDropdownCenterStyle as any}>
            {!isLoggedIn ? (
              <div onClick={() => {setShowLoginModal(true); setIsMenuOpen(false)}} style={menuItemStyle as any}>
                🔑 Авторизация
              </div>
            ) : (
              <>
                <div style={{...menuItemStyle, color: '#4CAF50', fontSize: '12px', cursor: 'default'} as any}>
                  Статус: {userRole === 'admin' ? 'Администратор' : 'Сотрудник'}
                </div>
                
                {/* ПАНЕЛЬ УПРАВЛЕНИЯ — ВИДНА ТОЛЬКО АДМИНУ */}
                {userRole === 'admin' && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} style={menuItemStyle as any}>
                    ⚙️ Панель управления
                  </Link>
                )}

                <div onClick={handleLogout} style={{...menuItemStyle, color: '#ff7675'} as any}>
                  Выйти из системы
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
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#fff' }}>Вход в HUB</h2>
            <input 
              type="text" 
              placeholder="Логин" 
              value={login} 
              onChange={(e) => setLogin(e.target.value)} 
              style={inputStyle as any} 
            />
            <input 
              type="password" 
              placeholder="Пароль" 
              value={pass} 
              onChange={(e) => setPass(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={inputStyle as any} 
            />
            <div onClick={handleLogin} style={loginButtonStyle as any}>ВОЙТИ</div>
            <div 
              onClick={() => setShowLoginModal(false)} 
              style={{ textAlign: 'center', color: '#666', marginTop: '20px', cursor: 'pointer', fontSize: '14px' }}
            >
              Отмена
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ НАВИГАЦИЯ (КАПСУЛА) */}
      {isLoggedIn && (
        <nav style={navBarStyle as any}>
          {[
            {id: '/', label: 'ГЛАВНАЯ', icon: '🏠'},
            {id: '/tasks', label: 'СМЕНА', icon: '📋'},
            {id: '/search', label: 'БАЗА', icon: '🍃'},
          ].map(t => (
            <Link key={t.id} href={t.id} style={{ ...navItemStyle, color: pathname === t.id ? '#4CAF50' : '#888' } as any}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '800' }}>{t.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

// --- СТИЛИ КОМПОНЕНТА ---

const headerCenterStyle = { 
  position: 'fixed', top: '30px', left: 0, width: '100%', 
  display: 'flex', justifyContent: 'center', zIndex: 10000 
};

const bigBurgerStyle = { 
  background: '#4CAF50', color: 'white', border: '4px solid white', 
  padding: '10px 25px', borderRadius: '50px', fontSize: '16px', 
  fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
  display: 'flex', alignItems: 'center', gap: '10px' 
};

const menuDropdownCenterStyle = { 
  position: 'absolute', top: '70px', backgroundColor: '#161816', 
  borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', 
  width: '240px', overflow: 'hidden', border: '1px solid #333' 
};

const menuItemStyle = { 
  padding: '18px', borderBottom: '1px solid #222', background: 'none', 
  width: '100%', textAlign: 'left', color: '#fff', fontSize: '15px', 
  display: 'block', textDecoration: 'none', cursor: 'pointer' 
};

const modalOverlayStyle = { 
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
  backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', 
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 
};

const modalContentStyle = { 
  background: '#161816', padding: '40px', borderRadius: '35px', 
  width: '320px', border: '1px solid #333' 
};

const inputStyle = { 
  width: '100%', padding: '15px', marginBottom: '12px', borderRadius: '15px', 
  background: '#222', border: '1px solid #333', color: '#fff', boxSizing: 'border-box',
  outline: 'none'
};

const loginButtonStyle = { 
  width: '100%', padding: '18px', borderRadius: '18px', background: '#4CAF50', 
  color: '#000', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' 
};

const navBarStyle = { 
  position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', 
  width: '90%', maxWidth: '380px', height: '75px', 
  backgroundColor: 'rgba(22, 24, 22, 0.9)', backdropFilter: 'blur(15px)', 
  borderRadius: '40px', display: 'flex', justifyContent: 'space-around', 
  alignItems: 'center', padding: '0 15px', border: '1px solid rgba(255, 255, 255, 0.1)', 
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 9998 
};

const navItemStyle = { 
  flex: 1, display: 'flex', flexDirection: 'column', 
  alignItems: 'center', justifyContent: 'center', gap: '4px', 
  textDecoration: 'none', transition: '0.3s ease' 
};