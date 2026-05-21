"use client";
import React, { useState } from 'react';

export default function Footer() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  return (
    <>
      <footer style={footerStyle as any}>
         <div style={docsContainer}>
             <button onClick={() => setActiveDoc('privacy')} className="doc-link" style={docLinkStyle}>Политика конфиденциальности</button>
             <span style={{ color: '#333' }}>|</span>
             <button onClick={() => setActiveDoc('terms')} className="doc-link" style={docLinkStyle}>Пользовательское соглашение</button>
             <span style={{ color: '#333' }}>|</span>
             <button onClick={() => setActiveDoc('cookies')} className="doc-link" style={docLinkStyle}>Соглашение с файлами cookie</button>
         </div>
         {/* СТРОГИЙ КОПИРАЙТ ПО ГОСТ Р 7.0.1—2003 */}
         <p style={{ marginTop: '40px', color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>© Корольков Я.Д., 2026 | HUB СОТРУДНИКА</p>
      </footer>

      {/* ГЛОБАЛЬНЫЕ МОДАЛЬНЫЕ ОКНА ЮРИДИЧЕСКИХ ДОКУМЕНТОВ */}
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
                  <p>Мы применяем современные методы шифрования и системы защиты для обеспечения безопасности ваших учетных записей от несанкционированного доступа сторонних лиц.</p>
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
                  <p>В Tea Hub файлы cookie используются строго в технических целях: для поддержания вашей сессии активной (чтобы вам не приходилось постоянно вводить пароль) и для локального кэширования учебных материалов для мгновенной загрузки контента.</p>
                  
                  <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>3. Управление Cookie</h4>
                  <p>Вы имеете право отказаться от использования файлов cookie на длительный срок. В этом случае данные авторизации будут удалены сразу после закрытия вкладки браузера, и вам придется вводить логин заново при следующем посещении.</p>
                </div>
              </>
            )}

            <button onClick={() => setActiveDoc(null)} style={closeModalBtnStyle as any}>ЗАКРЫТЬ ОКНО</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .doc-link { transition: 0.2s; color: #888; }
        .doc-link:hover { color: #0abab5 !important; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </>
  );
}

// --- СТИЛИ КОМПОНЕНТА ---
const footerStyle = { 
  width: '100%', 
  textAlign: 'center', 
  padding: '60px 20px', 
  background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', 
  borderTop: '1px solid rgba(255,255,255,0.02)', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center',
  marginTop: 'auto',
  zIndex: 10
};

const docsContainer = { display: 'flex', gap: '15px', flexWrap: 'wrap' as any, justifyContent: 'center', alignItems: 'center' };
const docLinkStyle = { background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', padding: '5px 10px', fontWeight: '600', outline: 'none' };

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
  zIndex: 65000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px', boxSizing: 'border-box', animation: 'fadeInOverlay 0.3s ease'
};

const modalContentStyle = {
  background: '#111', padding: '35px', borderRadius: '25px', border: '1px solid #333',
  maxWidth: '550px', width: '100%', display: 'flex', flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', animation: 'scaleInModal 0.3s ease'
};

const modalScrollArea = {
  maxHeight: '50vh', overflowY: 'auto', color: '#ccc', fontSize: '14px',
  lineHeight: '1.6', paddingRight: '15px', marginBottom: '20px'
};

const closeModalBtnStyle = {
  width: '100%', padding: '16px', background: '#222', color: '#fff',
  border: '1px solid #333', borderRadius: '15px', fontWeight: '900',
  cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s'
};