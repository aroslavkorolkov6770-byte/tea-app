"use client";
import React from 'react';

export default function Footer() {
  return (
    <>
      <footer style={footerStyle as any}>
         <div style={docsContainer}>
             {/* 💡 НОВОЕ: Ссылки теперь открывают новую вкладку страницы /privacy */}
             <a href="https://tea-hub.ru/privacy/" target="_blank" rel="noopener noreferrer" className="doc-link" style={docLinkStyle}>Политика конфиденциальности</a>
             <span style={{ color: '#333' }}>|</span>
             <a href="https://tea-hub.ru/privacy/" target="_blank" rel="noopener noreferrer" className="doc-link" style={docLinkStyle}>Пользовательское соглашение</a>
             <span style={{ color: '#333' }}>|</span>
             <a href="https://tea-hub.ru/privacy/" target="_blank" rel="noopener noreferrer" className="doc-link" style={docLinkStyle}>Соглашение с файлами cookie</a>
         </div>

         {/* --- БЛОК СЛУЖБЫ ПОДДЕРЖКИ (ЗАГОТОВКА ПОЧТЫ) --- */}
         <div style={{ marginTop: '25px', color: '#888', fontSize: '13px', fontWeight: '500' }}>
             Служба технической поддержки: <a href="mailto:support@teahub-example.ru" style={{ color: '#0abab5', textDecoration: 'none', fontWeight: 'bold' }}>support@teahub-example.ru</a>
         </div>

         {/* СТРОГИЙ КОПИРАЙТ ПО ГОСТ Р 7.0.1—2003 */}
         <p style={{ marginTop: '15px', color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>© Корольков Я.Д., 2026 | HUB СОТРУДНИКА</p>
      </footer>

      <style jsx global>{`
        .doc-link { transition: 0.2s; color: #888; text-decoration: none; }
        .doc-link:hover { color: #0abab5 !important; }
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
const docLinkStyle = { fontSize: '13px', padding: '5px 10px', fontWeight: '600', outline: 'none' };