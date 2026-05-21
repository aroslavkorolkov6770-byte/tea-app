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
  const router = useRouter();

  useEffect(() => {
    // Проверяем авторизацию
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

  // Если проверяем авторизацию — ничего не рендерим (или спиннер)
  if (isCheckingAuth) {
      return <div style={{ background: '#0d0f0d', width: '100vw', height: '100vh' }}></div>;
  }

  return (
    <main style={{ 
        width: '100vw', 
        minHeight: '100vh', 
        background: '#0d0f0d', 
        color: '#fff', 
        fontFamily: 'Inter, sans-serif',
        overflowX: 'hidden',
        boxSizing: 'border-box'
    }}>
        {/* Навигация (в гостевом режиме она будет показывать только кнопку Входа) */}
        <Navigation />

        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '80vh',
            padding: '20px',
            textAlign: 'center',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1px' }}>
                TEA <span style={{ color: '#0abab5' }}>HUB</span>
            </h1>
            <p style={{ color: '#888', fontSize: '18px', maxWidth: '500px', marginBottom: '40px' }}>
                Добро пожаловать в закрытую корпоративную систему Tea Master Store. 
                Пожалуйста, войдите, чтобы получить доступ к обучающим материалам.
            </p>
            
            <div style={{ 
                background: '#111', 
                padding: '30px', 
                borderRadius: '25px', 
                border: '1px solid #222',
                width: '100%',
                maxWidth: '400px',
                boxSizing: 'border-box'
            }}>
                <p style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
                    Нужна помощь с доступом?
                </p>
                <p style={{ fontSize: '14px', color: '#fff', marginTop: '10px' }}>
                    Свяжитесь с вашим администратором или руководителем точки.
                </p>
            </div>
        </div>

        <footer style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: '#333', 
            fontSize: '12px',
            borderTop: '1px solid #1a1a1a'
        }}>
            © Корольков Я.Д., 2026 | HUB СОТРУДНИКА
        </footer>

        <style jsx global>{`
            body { margin: 0; padding: 0; overflow-x: hidden; width: 100vw; }
            * { box-sizing: border-box; }
        `}</style>
    </main>
  );
}