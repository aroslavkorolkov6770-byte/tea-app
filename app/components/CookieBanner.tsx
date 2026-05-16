"use client";
import React, { useEffect, useState } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  
  // Состояния для модальных окон политик
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);

  useEffect(() => {
    // Проверяем, делал ли пользователь выбор ранее (ищем и в постоянной, и в сессионной памяти)
    const localConsent = localStorage.getItem('cookieConsent');
    const sessionConsent = sessionStorage.getItem('cookieConsent');
    
    // Если выбора нет, показываем плашку с небольшой задержкой в 1 секунду
    if (!localConsent && !sessionConsent) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true'); // Запоминаем навсегда
    setShow(false);
  };

  const handleDecline = () => {
    sessionStorage.setItem('cookieConsent', 'false'); // Запоминаем только до закрытия браузера/вкладки
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <div style={bannerStyle as any}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0abab5', fontWeight: '900' }}>Авторизация и сессия 🍪</h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#ccc', lineHeight: '1.5' }}>
          Мы используем файлы cookie для сохранения вашей сессии. Согласны ли вы оставаться в системе на этом устройстве, чтобы не вводить логин и пароль каждый раз?
        </p>
        
        {/* Кликабельные ссылки на политики */}
        <p style={{ margin: '0 0 20px 0', fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
          Ознакомьтесь с <span onClick={() => setShowPrivacyPolicy(true)} style={linkStyle}>Политикой конфиденциальности</span> и <span onClick={() => setShowCookiePolicy(true)} style={linkStyle}>Соглашением с файлами cookie</span>.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAccept} style={btnYes as any}>ДА, СОГЛАСЕН</button>
          <button onClick={handleDecline} style={btnNo as any}>НЕТ (только на сеанс)</button>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО: ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ */}
      {showPrivacyPolicy && (
        <div style={modalOverlayStyle as any} onClick={() => setShowPrivacyPolicy(false)}>
          <div style={modalContentStyle as any} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#0abab5', fontSize: '20px', fontWeight: '900' }}>Политика конфиденциальности</h2>
              <div onClick={() => setShowPrivacyPolicy(false)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div>
            </div>
            
            <div className="custom-scroll" style={modalScrollArea as any}>
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>1. Общие положения</h4>
              <p>Настоящая политика конфиденциальности устанавливает порядок получения, хранения, обработки, использования и защиты персональных данных пользователей платформы Tea Hub.</p>
              
              <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>2. Сбор данных</h4>
              <p>Мы собираем только те данные, которые необходимы для обеспечения корректной работы образовательной платформы: ваше имя, контактные данные, логин и информацию о прогрессе обучения.</p>
              
              <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>3. Использование информации</h4>
              <p>Ваши данные используются исключительно для персонализации учебного процесса, ведения статистики успеваемости и обеспечения безопасности вашего аккаунта. Мы не передаем данные третьим лицам.</p>

              <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>4. Защита информации</h4>
              <p>Мы применяем современные методы шифрования и системы защиты (включая TeaGuard) для обеспечения безопасности ваших учетных записей от несанкционированного доступа.</p>
            </div>

            <button onClick={() => setShowPrivacyPolicy(false)} style={closeBtnStyle as any}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: СОГЛАШЕНИЕ ПО COOKIE */}
      {showCookiePolicy && (
        <div style={modalOverlayStyle as any} onClick={() => setShowCookiePolicy(false)}>
          <div style={modalContentStyle as any} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#0abab5', fontSize: '20px', fontWeight: '900' }}>Соглашение о Cookie</h2>
              <div onClick={() => setShowCookiePolicy(false)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div>
            </div>
            
            <div className="custom-scroll" style={modalScrollArea as any}>
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>1. Что такое файлы Cookie?</h4>
              <p>Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении веб-сайта. Они помогают платформе «запоминать» вас и ваши настройки.</p>
              
              <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>2. Как мы используем Cookie</h4>
              <p>В Tea Hub файлы cookie используются строго в технических целях: для поддержания вашей сессии активной (чтобы вам не приходилось постоянно вводить пароль) и для локального кэширования учебных материалов (для мгновенной загрузки).</p>
              
              <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>3. Управление Cookie</h4>
              <p>Вы имеете право отказаться от использования файлов cookie на длительный срок, выбрав опцию «Нет (только на сеанс)». В этом случае данные будут удалены сразу после закрытия вкладки браузера.</p>
            </div>

            <button onClick={() => setShowCookiePolicy(false)} style={closeBtnStyle as any}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}

      {/* Анимации и стили скроллбара */}
      <style jsx global>{`
        @keyframes slideInRightCookie {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInModal {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
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
const bannerStyle = {
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  width: '320px',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '20px',
  padding: '25px',
  boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
  zIndex: 50000,
  animation: 'slideInRightCookie 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards'
};

const linkStyle = {
  color: '#0abab5',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: '0.2s'
};

const btnYes = {
  flex: 1, padding: '12px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '11px', transition: '0.2s'
};

const btnNo = {
  flex: 1, padding: '12px', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '11px', transition: '0.2s'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(5px)',
  zIndex: 60000, // Поверх баннера и всего остального
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  boxSizing: 'border-box',
  animation: 'fadeInOverlay 0.3s ease'
};

const modalContentStyle = {
  background: '#111',
  padding: '35px',
  borderRadius: '25px',
  border: '1px solid #333',
  maxWidth: '550px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
  animation: 'scaleInModal 0.3s ease'
};

const modalScrollArea = {
  maxHeight: '60vh',
  overflowY: 'auto',
  color: '#ccc',
  fontSize: '14px',
  lineHeight: '1.6',
  paddingRight: '15px',
  marginBottom: '20px'
};

const closeBtnStyle = {
  width: '100%',
  padding: '16px',
  background: '#222',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '15px',
  fontWeight: '900',
  cursor: 'pointer',
  fontSize: '13px',
  letterSpacing: '1px',
  transition: '0.2s'
};