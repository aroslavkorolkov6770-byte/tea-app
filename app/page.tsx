"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { useRouter } from 'next/navigation';

// --- ХЕЛПЕР ДЛЯ ЧТЕНИЯ COOKIES ---
const getAppCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const raw = parts.pop()?.split(';').shift();
        return raw ? decodeURIComponent(raw) : null;
    }
    return null;
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cookieAuth = getAppCookie('isLoggedIn');
    const localAuth = localStorage.getItem('isLoggedIn');
    const isLoggedIn = cookieAuth === 'true' || localAuth === 'true';

    const cookieRole = getAppCookie('userRole');
    const localRole = localStorage.getItem('userRole');
    const role = cookieRole || localRole;

    if (isLoggedIn) {
        if (role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/tasks?tab=welcome');
        }
    } else {
        setIsCheckingAuth(false);
        setIsMounted(true);
    }
  }, [router]);

  if (isCheckingAuth || !isMounted) {
      return <div style={{ minHeight: '100vh', backgroundColor: '#000' }} />;
  }

  return (
    <div style={{ 
        minHeight: '100vh', 
        position: 'relative', 
        color: '#fff', 
        fontFamily: 'Inter, sans-serif', 
        overflowX: 'hidden',
        width: '100vw' 
    }}>
      
      {/* 1. ФОНОВОЕ ФОТО */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://u.9111s.ru/uploads/202402/17/a0254a12ef37da5aaf5c5646a30baab8.webp")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -2,
        backgroundColor: '#000'
      }} />
      
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)', zIndex: -1 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        <Navigation />

        <main className="home-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '160px 20px 80px 20px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
          <section style={{ textAlign: 'center', marginBottom: '100px', animation: 'fadeInUp 1s ease' }}>
            <div className="home-badge" style={badgeStyle}>E-learning Master Platform</div>
            <h1 style={heroTitleStyle}>TEA <span style={{ color: '#0ABAB5' }}>HUB</span></h1>
            <p style={heroSubTitleStyle}>Профессиональная среда для обучения и развития. <br/> Ваш путь от новичка до эксперта начинается здесь.</p>
          </section>

          <section className="home-features" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '30px', 
              marginBottom: '100px',
              width: '100%'
          }}>
              {[
                  { title: 'База знаний', desc: 'Более 50 уроков по ботанике, географии и химии чайного листа.' },
                  { title: 'Техника пролива', desc: 'Пошаговые инструкции работы с профессиональной посудой.' },
                  { title: 'Стандарты сервиса', desc: 'Скрипты общения и правила гостеприимства нашего бренда.' }
              ].map((box, i) => (
                  <div key={i} style={infoBoxStyle}>
                      <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0', color: '#fff' }}>{box.title}</h3>
                      <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '15px', margin: 0 }}>{box.desc}</p>
                  </div>
              ))}
          </section>
        </main>

        <footer style={footerStyle as any}>
           <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1px' }}>О НАС</h2>
           <div style={docsContainer}>
               <button onClick={() => setActiveDoc('privacy')} className="doc-link" style={docLinkStyle}>Политика конфиденциальности</button>
               <span style={{ color: '#444' }}>|</span>
               <button onClick={() => setActiveDoc('terms')} className="doc-link" style={docLinkStyle}>Пользовательское соглашение</button>
               <span style={{ color: '#444' }}>|</span>
               <button onClick={() => setActiveDoc('cookies')} className="doc-link" style={docLinkStyle}>Соглашение с файлами cookie</button>
           </div>
           {/* ИСПРАВЛЕННЫЙ КОПИРАЙТ ПО ГОСТ Р 7.0.1—2003 */}
           <p style={{ marginTop: '50px', color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>© Корольков Я.Д., 2026 | HUB СОТРУДНИКА</p>
        </footer>
      </div>

      {/* МОДАЛЬНЫЕ ОКНА ПОЛИТИК (В ЕДИНОМ СТИЛЕ С БАННЕРОМ) */}
      {activeDoc && (
        <div style={modalOverlayStyle as any} onClick={() => setActiveDoc(null)}>
          <div style={modalContentStyle as any} onClick={e => e.stopPropagation()}>
            
            {activeDoc === 'privacy' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#0abab5', fontSize: '20px', fontWeight: '900' }}>Политика конфиденциальности</h2>
                  <div onClick={() => setActiveDoc(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div>
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
              </>
            )}

            {activeDoc === 'terms' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#0abab5', fontSize: '20px', fontWeight: '900' }}>Пользовательское соглашение</h2>
                  <div onClick={() => setActiveDoc(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div>
                </div>
                
                <div className="custom-scroll" style={modalScrollArea as any}>
                  <h4 style={{ color: '#fff', marginBottom: '10px' }}>1. Предмет соглашения</h4>
                  <p>Используя образовательную платформу TEA HUB, вы соглашаетесь с настоящими правилами и условиями. Платформа предоставляется для внутреннего использования сотрудниками компании.</p>
                  
                  <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>2. Права и обязанности</h4>
                  <p>Пользователь обязуется не передавать свои учетные данные третьим лицам и не копировать учебные материалы (тексты, тесты, документы) в коммерческих или иных целях вне рамок рабочего процесса.</p>
                  
                  <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>3. Интеллектуальная собственность</h4>
                  <p>Все материалы, размещенные на платформе TEA HUB, включая уроки по ботанике, истории брендов, методы заваривания и регламенты, являются интеллектуальной собственностью компании.</p>
                  
                  <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>4. Аттестация и контроль</h4>
                  <p>Администрация оставляет за собой право использовать результаты тестирования и прохождения модулей для оценки профессиональных компетенций сотрудников.</p>
                </div>
              </>
            )}

            {activeDoc === 'cookies' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#0abab5', fontSize: '20px', fontWeight: '900' }}>Соглашение о Cookie</h2>
                  <div onClick={() => setActiveDoc(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div>
                </div>
                
                <div className="custom-scroll" style={modalScrollArea as any}>
                  <h4 style={{ color: '#fff', marginBottom: '10px' }}>1. Что такое файлы Cookie?</h4>
                  <p>Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении веб-сайта. Они помогают платформе «запоминать» вас и ваши настройки.</p>
                  
                  <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>2. Как мы используем Cookie</h4>
                  <p>В Tea Hub файлы cookie используются строго в технических целях: для поддержания вашей сессии активной (чтобы вам не приходилось постоянно вводить пароль) и для локального кэширования учебных материалов (для мгновенной загрузки контента).</p>
                  
                  <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>3. Управление Cookie</h4>
                  <p>Вы имеете право отказаться от использования файлов cookie на длительный срок. В этом случае данные авторизации будут удалены сразу после закрытия вкладки браузера, и вам придется вводить логин заново при следующем посещении.</p>
                </div>
              </>
            )}

            <button onClick={() => setActiveDoc(null)} style={closeModalBtnStyle as any}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleInModal { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            overflow-x: hidden; 
            width: 100vw;
        }

        .doc-link:hover { color: #0abab5 !important; }

        * { box-sizing: border-box; }

        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

        @media (max-width: 768px) {
            .home-main { padding: 120px 15px 50px 15px !important; }
            .home-features { grid-template-columns: 1fr !important; gap: 15px !important; }
            .home-badge { white-space: normal !important; height: auto !important; line-height: 1.5 !important; }
            .modal-content-style { width: 95% !important; padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}

// --- СТИЛИ ---
const heroTitleStyle = { fontSize: 'calc(32px + 4vw)', fontWeight: '900', color: '#fff', margin: '20px 0', lineHeight: '1', letterSpacing: '-2px' };
const heroSubTitleStyle = { color: '#aaa', fontSize: '19px', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' };
const badgeStyle = { display: 'inline-block', background: 'rgba(255,255,255,0.05)', color: '#0ABAB5', padding: '8px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' as any, letterSpacing: '1.5px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', marginBottom: '20px' };
const infoBoxStyle = { background: 'rgba(20,20,20,0.6)', padding: '50px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)', textAlign: 'center' as any, transition: '0.3s ease' };
const footerStyle = { textAlign: 'center', padding: '80px 20px', background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const docsContainer = { display: 'flex', gap: '20px', flexWrap: 'wrap' as any, justifyContent: 'center', alignItems: 'center' };
const docLinkStyle = { background: 'none', border: 'none', color: '#aaa', fontSize: '14px', cursor: 'pointer', padding: '5px 10px', fontWeight: '600', transition: '0.2s', outline: 'none' };

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
  zIndex: 60000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px', boxSizing: 'border-box', animation: 'fadeInOverlay 0.3s ease'
};

const modalContentStyle = {
  background: '#111', padding: '35px', borderRadius: '25px', border: '1px solid #333',
  maxWidth: '550px', width: '100%', display: 'flex', flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', animation: 'scaleInModal 0.3s ease'
};

const modalScrollArea = {
  maxHeight: '60vh', overflowY: 'auto', color: '#ccc', fontSize: '14px',
  lineHeight: '1.6', paddingRight: '15px', marginBottom: '20px'
};

const closeModalBtnStyle = {
  width: '100%', padding: '16px', background: '#222', color: '#fff',
  border: '1px solid #333', borderRadius: '15px', fontWeight: '900',
  cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s'
};