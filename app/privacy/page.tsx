"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type DocType = 'processing' | 'privacy' | 'terms' | 'cookies';

export default function PrivacyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DocType>('processing');

  // Перечень вкладок для сайдбара
  const menuItems = [
    { id: 'processing', label: 'Обработка персональных данных' },
    { id: 'privacy', label: 'Политика конфиденциальности' },
    { id: 'terms', label: 'Пользовательское соглашение' },
    { id: 'cookies', label: 'Соглашение с файлами cookie' },
  ];

  return (
    <div style={pageWrapper}>
      {/* Фоновые элементы в стиле Tea Hub */}
      <div style={backgroundOverlay} />
      <div style={backgroundBlur} />

      <div style={mainContainer} className="privacy-container">
        
        {/* --- ЛЕВАЯ ПАНЕЛЬ (САЙДБАР) --- */}
        <aside style={sidebarStyle} className="privacy-sidebar">
          <button onClick={() => router.push('/')} style={backBtnStyle} className="back-btn">
            ← НА ГЛАВНУЮ
          </button>
          
          <div style={sidebarTitleArea}>
            <h2 style={sidebarTitle}>ДОКУМЕНТЫ</h2>
            <div style={divider} />
          </div>

          <nav style={navStyle}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as DocType)}
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                style={{
                  ...menuItemStyle,
                  color: activeTab === item.id ? '#fff' : '#666',
                  background: activeTab === item.id ? '#111' : 'transparent',
                  borderColor: activeTab === item.id ? '#0abab5' : 'transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* --- ПРАВАЯ ОБЛАСТЬ (КОНТЕНТ ДОКУМЕНТА) --- */}
        <main style={contentAreaStyle} className="privacy-content custom-scroll">
          
          {/* 1. ОБРАБОТКА ПЕРСОНАЛЬНЫХ ДАННЫХ */}
          {activeTab === 'processing' && (
            <section style={sectionAnimation}>
              <h1 style={contentTitle}>Согласие на обработку персональных данных</h1>
              <p style={metaText}>Действует с момента активации аккаунта пользователем</p>
              
              <h3 style={subTitle}>1. Что включает в себя согласие</h3>
              <p style={textBlock}>
                Принимая условия настоящего соглашения при активации учетной записи на платформе TEA HUB, 
                пользователь свободно, своей волей и в своем интересе выражает безоговорочное согласие на 
                обработку своих персональных данных Администрации платформы.
              </p>

              <h3 style={subTitle}>2. Перечень обрабатываемых данных</h3>
              <p style={textBlock}>
                Для обеспечения учебного процесса и авторизации в системе, обработке подлежат следующие данные:
              </p>
              <ul style={listStyle}>
                <li>Фамилия, Имя, Отчество (для формирования личного профиля);</li>
                <li>Адрес электронной почты (E-mail) для системных уведомлений;</li>
                <li>Идентификатор мессенджера Telegram для оперативной связи;</li>
                <li>Номер контактного телефона;</li>
                <li>Статистика успеваемости, логи авторизации и результаты прохождения тестирований.</li>
              </ul>

              <h3 style={subTitle}>3. Цели обработки данных</h3>
              <p style={textBlock}>
                Персональные данные пользователей обрабатываются исключительно в целях предоставления доступа 
                к базе знаний, контроля прохождения учебных курсов, проведения аттестаций стажеров и бариста, 
                а также предотвращения несанкционированного доступа к конфиденциальной информации компании через систему TeaGuard.
              </p>
            </section>
          )}

          {/* 2. ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ */}
          {activeTab === 'privacy' && (
            <section style={sectionAnimation}>
              <h1 style={contentTitle}>Политика конфиденциальности</h1>
              <p style={metaText}>Редакция от 2026 года</p>
              
              <h3 style={subTitle}>1. Общие положения</h3>
              <p style={textBlock}>
                Настоящая Политика определяет порядок обработки и защиты информации о физических лицах, 
                пользующихся услугами и материалами образовательной платформы TEA HUB. Безопасность ваших 
                данных является для нас абсолютным приоритетом.
              </p>

              <h3 style={subTitle}>2. Безопасность и шифрование</h3>
              <p style={textBlock}>
                Все персональные данные хранятся на защищенных серверах. Мы используем современные алгоритмы 
                криптографической защиты данных и внутренний модуль сетевой безопасности TeaGuard, чтобы 
                полностью исключить утечку, перехват или несанкционированное изменение ваших рабочих профилей.
              </p>

              <h3 style={subTitle}>3. Передача третьим лицам</h3>
              <p style={textBlock}>
                Администрация платформы TEA HUB ни при каких условиях не передает, не продает и не раскрывает 
                персональные, контактные или статистические данные сотрудников сторонним сервисам, рекламным компаниям 
                или третьим лицам. Вся информация используется строго внутри компании.
              </p>
            </section>
          )}

          {/* 3. ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ */}
          {activeTab === 'terms' && (
            <section style={sectionAnimation}>
              <h1 style={contentTitle}>Пользовательское соглашение</h1>
              <p style={metaText}>Внутренний регламент использования платформы</p>
              
              <h3 style={subTitle}>1. Условия использования платформы</h3>
              <p style={textBlock}>
                Платформа TEA HUB является закрытым внутренним корпоративным ресурсом. Доступ к платформе 
                предоставляется сотрудникам, стажерам и руководящему составу исключительно для выполнения 
                учебных задач, ознакомления со стандартами сервиса и матрицей ассортимента.
              </p>

              <h3 style={subTitle}>2. Обязанности пользователя</h3>
              <p style={textBlock}>
                Пользователь обязуется строго соблюдать конфиденциальность учетных данных и не передавать свой 
                логин и пароль третьим лицам. Любая попытка копирования, скачивания или распространения 
                учебных материалов (текстов уроков, рецептур чая, структуры тестов) за пределы компании 
                является нарушением коммерческой тайны.
              </p>

              <h3 style={subTitle}>3. Ответственность</h3>
              <p style={textBlock}>
                В случае выявления фактов передачи аккаунта третьим лицам или умышленного слива базы знаний, 
                администрация оставляет за собой право немедленно заблокировать учетную запись нарушителя без 
                права восстановления и применить меры дисциплинарного взыскания.
              </p>
            </section>
          )}

          {/* 4. СОГЛАШЕНИЕ С ФАЙЛАМИ COOKIE */}
          {activeTab === 'cookies' && (
            <section style={sectionAnimation}>
              <h1 style={contentTitle}>Соглашение об использовании файлов Cookie</h1>
              <p style={metaText}>Технический регламент работы сессий</p>
              
              <h3 style={subTitle}>1. Что такое файлы Cookie</h3>
              <p style={textBlock}>
                Cookie — это небольшие текстовые файлы, которые отправляются на ваше устройство, когда вы посещаете 
                веб-ресурс. Они помогают сайту хранить информацию о ваших действиях и предпочтениях для повышения 
                удобства работы.
              </p>

              <h3 style={subTitle}>2. Как Cookie используются в TEA HUB</h3>
              <p style={textBlock}>
                На нашей платформе файлы cookie используются исключительно в служебных целях:
              </p>
              <ul style={listStyle}>
                <li>Сохранение состояния авторизации (чтобы вам не приходилось заново вводить пароль при переходе между вкладками);</li>
                <li>Кэширование структуры базы знаний для мгновенной загрузки страниц;</li>
                <li>Сохранение персонального токена для изолированного ведения истории в ИИ Помощнике.</li>
              </ul>

              <h3 style={subTitle}>3. Отказ от Cookie</h3>
              <p style={textBlock}>
                Если вы выбрали вариант «НЕТ (только на сеанс)» в куки-баннере, система запишет данные в 
                временную сессионную память. Эти файлы автоматически уничтожатся, как только вы закроете 
                вкладку браузера или выйдете из учетной записи.
              </p>
            </section>
          )}

        </main>
      </div>

      {/* Интерактивные стили для ховеров и скроллбара */}
      <style jsx global>{`
        @keyframes scaleInPrivacy { 
          from { transform: scale(0.98); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
        @keyframes privacyFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
          transition: 0.2s;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #0abab5;
        }

        .menu-item {
          transition: all 0.2s ease !important;
        }
        .menu-item:hover {
          color: #0abab5 !important;
          background: rgba(10, 186, 181, 0.03) !important;
          padding-left: 20px !important;
        }
        .menu-item.active {
          border-left: 3px solid #0abab5 !important;
          padding-left: 20px !important;
        }
        
        .back-btn:hover {
          background: #0abab5 !important;
          color: #000 !important;
          box-shadow: 0 0 15px rgba(10, 186, 181, 0.3);
        }
        .back-btn:active {
          transform: scale(0.98);
        }

        @media (max-width: 900px) {
          .privacy-container {
            flex-direction: column !important;
            height: auto !important;
            max-height: none !important;
          }
          .privacy-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #222;
            padding-bottom: 20px !important;
          }
          .privacy-content {
            height: auto !important;
            padding: 30px 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- СТИЛИ КОМПОНЕНТА ---
const pageWrapper: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '30px 20px',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  backgroundColor: '#000',
};

const backgroundOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundImage: 'url("https://u.9111s.ru/uploads/202402/17/a0254a12ef37da5aaf5c5646a30baab8.webp")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  zIndex: -2,
};

const backgroundBlur: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(5, 5, 5, 0.9)',
  backdropFilter: 'blur(15px)',
  zIndex: -1,
};

const mainContainer: React.CSSProperties = {
  display: 'flex',
  background: '#0a0a0a',
  width: '100%',
  maxWidth: '1000px',
  height: '80vh',
  maxHeight: '750px',
  borderRadius: '35px',
  border: '1px solid #222',
  boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
  overflow: 'hidden',
  animation: 'scaleInPrivacy 0.4s ease',
  boxSizing: 'border-box',
};

const sidebarStyle: React.CSSProperties = {
  width: '320px',
  background: '#070707',
  borderRight: '1px solid #222',
  padding: '40px 25px',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
};

const backBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'transparent',
  border: '1px solid #333',
  color: '#888',
  borderRadius: '14px',
  fontSize: '12px',
  fontWeight: '900',
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: '0.2s ease',
  marginBottom: '40px',
};

const sidebarTitleArea: React.CSSProperties = {
  marginBottom: '25px',
  paddingLeft: '5px',
};

const sidebarTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '16px',
  fontWeight: '900',
  letterSpacing: '2px',
};

const divider: React.CSSProperties = {
  width: '40px',
  height: '2px',
  background: '#0abab5',
  marginTop: '8px',
  borderRadius: '2px',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  flex: 1,
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '16px 15px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '14px',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  lineHeight: '1.3',
  boxSizing: 'border-box',
};

const contentAreaStyle: React.CSSProperties = {
  flex: 1,
  padding: '50px',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

const sectionAnimation: React.CSSProperties = {
  animation: 'privacyFadeUp 0.4s ease forwards',
};

const contentTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '24px',
  fontWeight: '900',
  lineHeight: '1.3',
};

const metaText: React.CSSProperties = {
  margin: '8px 0 35px 0',
  color: '#444',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const subTitle: React.CSSProperties = {
  color: '#0abab5',
  fontSize: '16px',
  fontWeight: '900',
  margin: '30px 0 12px 0',
};

const textBlock: React.CSSProperties = {
  color: '#ccc',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: 0,
};

const listStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '14px',
  lineHeight: '1.7',
  paddingLeft: '20px',
  margin: '10px 0 0 0',
};