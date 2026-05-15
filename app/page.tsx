"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { useRouter } from 'next/navigation'; // <-- Добавили роутер для перенаправления

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  // Состояние для открытия нужного документа: 'privacy' | 'terms' | 'cookies' | null
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  useEffect(() => {
    // 1. Проверяем статус входа ДО отрисовки страницы
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');

    if (isLoggedIn === 'true') {
        // 2. Если уже авторизован, моментально перекидываем в нужную панель
        if (role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/tasks?tab=welcome');
        }
    } else {
        // 3. Если не авторизован - разрешаем показать красивый стартовый экран
        setIsMounted(true);
    }
  }, [router]);

  // Пока идет проверка авторизации или редирект — ничего не рисуем (убирает баг с наложением)
  if (!isMounted) return null;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      
      {/* 1. ФОНОВОЕ ФОТО ( Moody Tea & Coffee Atmosphere ) */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://u.9111s.ru/uploads/202402/17/a0254a12ef37da5aaf5c5646a30baab8.webp")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -2,
        backgroundColor: '#000'
      }} />
      
      {/* 2. ГЛУБОКИЙ ГРАДИЕНТ (для премиального вида и читаемости) */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)',
        zIndex: -1
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '160px 20px 80px 20px', flex: 1 }}>
          
          {/* ГЛАВНЫЙ ЗАГОЛОВОК */}
          <section style={{ textAlign: 'center', marginBottom: '100px', animation: 'fadeInUp 1s ease' }}>
            <div style={badgeStyle}>E-learning Master Platform</div>
            <h1 style={heroTitleStyle}>
              TEA <span style={{ color: '#0ABAB5' }}>HUB</span>
            </h1>
            <p style={heroSubTitleStyle}>
              Профессиональная среда для обучения и развития. <br/> 
              Ваш путь от новичка до эксперта начинается здесь.
            </p>
          </section>

          {/* ТРИ ГЛАСС-КАРТОЧКИ */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '100px' }}>
              {[
                  { title: 'База знаний', desc: 'Более 50 уроков по ботанике, географии и химии чайного листа.' },
                  { title: 'Техника пролива', desc: 'Пошаговые инструкции работы с профессиональной посудой.' },
                  { title: 'Стандарты сервиса', desc: 'Скрипты общения и правила гостеприимства нашего бренда.' }
              ].map((box, i) => (
                  <div key={i} style={infoBoxStyle}>
                      <div style={{ fontSize: '32px', marginBottom: '20px' }}></div>
                      <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0', color: '#fff' }}>{box.title}</h3>
                      <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '15px', margin: 0 }}>{box.desc}</p>
                  </div>
              ))}
          </section>

        </main>

        {/* НОВЫЙ ПОДВАЛ (FOOTER) С ДОКУМЕНТАМИ */}
        <footer style={footerStyle as any}>
           <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1px' }}>О НАС</h2>
           
           <div style={docsContainer}>
               <button onClick={() => setActiveDoc('privacy')} className="doc-link" style={docLinkStyle}>Политика конфиденциальности</button>
               <span style={{ color: '#444' }}>|</span>
               <button onClick={() => setActiveDoc('terms')} className="doc-link" style={docLinkStyle}>Пользовательское соглашение</button>
               <span style={{ color: '#444' }}>|</span>
               <button onClick={() => setActiveDoc('cookies')} className="doc-link" style={docLinkStyle}>Соглашение с файлами cookie</button>
           </div>

           <p style={{ marginTop: '50px', color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
             © 2024 TEA MASTER STORE | HUB СОТРУДНИКА
           </p>
        </footer>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ ДОКУМЕНТОВ */}
      {activeDoc && (
        <div style={modalOverlay as any}>
          <div style={modalContent as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
               <button onClick={() => setActiveDoc(null)} style={closeBtnStyle}>✕ ЗАКРЫТЬ</button>
            </div>
            
            <div style={{ color: '#ccc', lineHeight: '1.8', fontSize: '15px' }}>
               
               {activeDoc === 'privacy' && (
                 <div>
                    <h2 style={{ color: '#0abab5', fontSize: '28px', marginBottom: '25px', fontWeight: '900' }}>Политика конфиденциальности</h2>
                    
                    {/* ========================================================================= */}
                    {/* ТУТ ПИСАТЬ ТЕКСТ ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ */}
                    {/* ========================================================================= */}
                    
                    <p>Настоящая Политика конфиденциальности описывает, как мы собираем, используем и храним вашу личную информацию при использовании платформы TEA HUB.</p>
                    <p>1. Мы собираем только те данные, которые необходимы для организации учебного процесса и отслеживания прогресса сотрудников.</p>
                    <p>2. Ваши данные (ФИО, прогресс тестирования, статистика) надежно защищены и не передаются третьим лицам без вашего прямого согласия.</p>
                    <p>3. Вы имеете право в любой момент запросить удаление вашего профиля из базы данных.</p>
                    
                    {/* ========================================================================= */}

                 </div>
               )}

               {activeDoc === 'terms' && (
                 <div>
                    <h2 style={{ color: '#0abab5', fontSize: '28px', marginBottom: '25px', fontWeight: '900' }}>Пользовательское соглашение</h2>
                    
                    {/* ========================================================================= */}
                    {/* ТУТ ПИСАТЬ ТЕКСТ ПОЛЬЗОВАТЕЛЬСКОГО СОГЛАШЕНИЯ */}
                    {/* ========================================================================= */}
                    
                    <p>Используя платформу TEA HUB, вы соглашаетесь с настоящими правилами и условиями.</p>
                    <p>1. Платформа предоставляется "как есть". Мы постоянно работаем над её улучшением, но не гарантируем бесперебойную работу 24/7.</p>
                    <p>2. Все обучающие материалы, статьи, курсы и тесты являются интеллектуальной собственностью компании и не подлежат копированию или распространению за пределами корпоративной среды.</p>
                    <p>3. Администрация оставляет за собой право блокировать учетные записи при нарушении корпоративной этики.</p>
                    
                    {/* ========================================================================= */}

                 </div>
               )}

               {activeDoc === 'cookies' && (
                 <div>
                    <h2 style={{ color: '#0abab5', fontSize: '28px', marginBottom: '25px', fontWeight: '900' }}>Соглашение с файлами cookie</h2>
                    
                    {/* ========================================================================= */}
                    {/* ТУТ ПИСАТЬ ТЕКСТ СОГЛАШЕНИЯ С ФАЙЛАМИ КУКИ */}
                    {/* ========================================================================= */}
                    
                    <p>Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве для обеспечения корректной работы платформы.</p>
                    <p>1. Мы используем технические файлы cookie для того, чтобы вы оставались авторизованными в системе (сохранение сессии).</p>
                    <p>2. Мы используем локальное хранилище браузера (Local Storage) для сохранения вашего прогресса по тестам и изученным материалам.</p>
                    <p>3. Отключая файлы cookie в настройках браузера, вы можете столкнуться с тем, что прогресс обучения не будет сохраняться корректно.</p>
                    
                    {/* ========================================================================= */}

                 </div>
               )}

            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; padding: 0; background: #000; }
        
        /* Эффект наведения для кнопок-ссылок */
        .doc-link:hover {
            color: #0abab5 !important;
        }
      `}</style>
    </div>
  );
}

// --- СТИЛИ ---

const heroTitleStyle = {
  fontSize: 'calc(32px + 4vw)',
  fontWeight: '900',
  color: '#fff',
  margin: '20px 0',
  lineHeight: '1',
  letterSpacing: '-2px'
};

const heroSubTitleStyle = {
  color: '#aaa',
  fontSize: '19px',
  maxWidth: '750px',
  margin: '0 auto',
  lineHeight: '1.6'
};

const badgeStyle = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.05)',
  color: '#0ABAB5',
  padding: '8px 20px',
  borderRadius: '50px',
  fontSize: '11px',
  fontWeight: '800',
  textTransform: 'uppercase' as any,
  letterSpacing: '1.5px',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  marginBottom: '20px'
};

const infoBoxStyle = {
  background: 'rgba(20,20,20,0.6)', 
  padding: '50px 40px',
  borderRadius: '40px',
  border: '1px solid rgba(255,255,255,0.05)',
  backdropFilter: 'blur(15px)',
  textAlign: 'center' as any,
  transition: '0.3s ease'
};

// СТИЛИ НОВОГО ПОДВАЛА
const footerStyle = {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
};

const docsContainer = {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as any,
    justifyContent: 'center',
    alignItems: 'center'
};

const docLinkStyle = {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '5px 10px',
    fontWeight: '600',
    transition: '0.2s',
    outline: 'none'
};

// СТИЛИ МОДАЛЬНОГО ОКНА ДЛЯ ТЕКСТОВ
const modalOverlay = { 
    position: 'fixed', 
    top: 0, left: 0, width: '100%', height: '100%', 
    background: 'rgba(0,0,0,0.92)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    zIndex: 30000, 
    backdropFilter: 'blur(15px)',
    padding: '20px'
};

const modalContent = { 
    background: '#0d0f0d', 
    padding: '50px', 
    borderRadius: '35px', 
    width: '100%', 
    maxWidth: '800px', 
    maxHeight: '85vh',
    overflowY: 'auto',
    border: '1px solid #222', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
};

const closeBtnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #222',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: '900',
    cursor: 'pointer',
    transition: '0.2s'
};