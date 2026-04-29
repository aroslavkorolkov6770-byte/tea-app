"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';

function ProfileContent() {
    const [isMounted, setIsMounted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userRole, setUserRole] = useState('staff');
    
    // Данные профиля
    const [userData, setUserData] = useState({
        name: '',
        avatar: '',
        tg: '',
        phone: ''
    });

    // Прогресс сотрудника
    const [progress, setProgress] = useState({
        route: 0,
        basics: 0,
        deadline: ''
    });

    // Статистика админа
    const [adminStats, setAdminStats] = useState({
        totalTeas: 0,
        totalLessons: 0,
        totalStandards: 0
    });

    useEffect(() => {
        try {
            const role = localStorage.getItem('userRole') || 'staff';
            setUserRole(role);

            // РАЗДЕЛЕНИЕ КЛЮЧЕЙ: админ и сотрудник теперь хранятся отдельно
            const prefix = role === 'admin' ? 'admin_' : 'user_';
            
            const savedName = localStorage.getItem(prefix + 'name');
            const savedAv = localStorage.getItem(prefix + 'avatar');
            const savedTg = localStorage.getItem(prefix + 'tg');
            const savedPhone = localStorage.getItem(prefix + 'phone');
            const firstLogin = localStorage.getItem('first_login_date');

            setUserData({
                name: savedName || (role === 'admin' ? 'Главный Мастер' : 'Сотрудник'),
                avatar: savedAv || '',
                tg: savedTg || (role === 'admin' ? '@admin_tea' : '@username'),
                phone: savedPhone || ''
            });

            // Логика дедлайна
            let dl = "";
            if (!firstLogin) {
                const now = new Date();
                localStorage.setItem('first_login_date', now.toISOString());
                dl = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            } else {
                dl = new Date(new Date(firstLogin).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            }

            // Загрузка прогресса (для сотрудника)
            const sRoute = JSON.parse(localStorage.getItem('tea_hub_onboard_route_v1') || '[]');
            const sBasics = JSON.parse(localStorage.getItem('tea_hub_basics_progress_v1') || '[]');
            setProgress({ route: sRoute.length, basics: sBasics.length, deadline: dl });

            // ИСПРАВЛЕННЫЙ ПОДСЧЕТ СТАТИСТИКИ (для админа)
            // Берем ключи в точности как в admin/page.tsx и tasks/page.tsx
            const teaDb = JSON.parse(localStorage.getItem('local_tea_db') || '[]');
            const basicsDb = JSON.parse(localStorage.getItem('tea_hub_dynamic_basics_v1') || '[]');
            const standardsDb = JSON.parse(localStorage.getItem('tea_hub_dynamic_standards_v1') || '[]');

            setAdminStats({
                totalTeas: teaDb.length,
                totalLessons: basicsDb.reduce((acc: number, sec: any) => acc + (sec.modules?.length || 0), 0),
                totalStandards: standardsDb.length
            });

        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsMounted(true);
    }, []);

    const handleSave = () => {
        const prefix = userRole === 'admin' ? 'admin_' : 'user_';
        localStorage.setItem(prefix + 'name', userData.name);
        localStorage.setItem(prefix + 'avatar', userData.avatar);
        localStorage.setItem(prefix + 'tg', userData.tg);
        localStorage.setItem(prefix + 'phone', userData.phone);
        setIsEditing(false);
    };

    if (!isMounted) return <div style={{backgroundColor: '#0d0f0d', minHeight: '100vh'}} />;

    return (
        <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
            <Navigation />
            
            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '120px 20px 140px 20px' }}>
                
                {/* ШАПКА */}
                <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '40px', backgroundColor: '#161816', margin: '0 auto 20px', border: '2px solid #4CAF50', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(76, 175, 80, 0.2)' }}>
                        {userData.avatar ? (
                            <img src={userData.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                        ) : (
                            <span style={{ fontSize: '40px' }}>{userRole === 'admin' ? '👑' : '👤'}</span>
                        )}
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 5px 0' }}>{userData.name}</h2>
                    <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px', margin: 0, letterSpacing: '2px' }}>
                        {userRole === 'admin' ? 'ГЛАВНЫЙ МАСТЕР (ADMIN)' : 'ЧАЙНЫЙ МАСТЕР (УЧЕНИК)'}
                    </p>
                    <div onClick={() => setIsEditing(true)} style={{ color: '#666', fontSize: '12px', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}>редактировать профиль</div>
                </section>

                {/* КОНТЕНТ ДЛЯ АДМИНА */}
                {userRole === 'admin' ? (
                    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                            <div style={statCard}><span style={statNum}>{adminStats.totalTeas}</span><span style={statLabel}>СОРТОВ</span></div>
                            <div style={statCard}><span style={statNum}>{adminStats.totalLessons}</span><span style={statLabel}>УРОКОВ</span></div>
                            <div style={statCard}><span style={statNum}>{adminStats.totalStandards}</span><span style={statLabel}>ПРАВИЛ</span></div>
                        </div>

                        <section style={{ background: '#161816', padding: '25px', borderRadius: '30px', border: '1px solid #222', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: '900', marginBottom: '20px', color: '#4CAF50', letterSpacing: '1px' }}>УПРАВЛЕНИЕ СИСТЕМОЙ</h3>
                            <Link href="/admin" style={adminLinkStyle}>⚙️ Таблица мониторинга сотрудников</Link>
                            <Link href="/tasks?tab=welcome" style={adminLinkStyle}>📝 Конструктор уроков и тестов</Link>
                            <Link href="/search" style={adminLinkStyle}>🍃 Редактор базы продуктов</Link>
                        </section>
                    </div>
                ) : (
                    /* КОНТЕНТ ДЛЯ СОТРУДНИКА */
                    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                        <section style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', marginBottom: '30px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                                    <span>ПЛАН НЕДЕЛИ</span>
                                    <span style={{ color: '#4CAF50' }}>{progress.route}/5</span>
                                </div>
                                <div style={pBarBg}><div style={{ ...pBarFill, width: `${(progress.route/5)*100}%` }} /></div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                                    <span>ОСНОВЫ</span>
                                    <span style={{ color: '#4CAF50' }}>{progress.basics}/10</span>
                                </div>
                                <div style={pBarBg}><div style={{ ...pBarFill, width: `${(progress.basics/10)*100}%` }} /></div>
                            </div>
                        </section>
                    </div>
                )}

                {/* СВЯЗЬ */}
                <section style={{ background: '#161816', padding: '25px', borderRadius: '30px', border: '1px solid #222' }}>
                    <div style={{ fontSize: '11px', color: '#444', marginBottom: '15px', fontWeight: '900', letterSpacing: '1px' }}>СВЯЗЬ</div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{userData.tg}</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>{userData.phone || 'номер не указан'}</div>
                        </div>
                    </div>
                </section>

                {/* МОДАЛКА */}
                {isEditing && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <h2 style={{ marginBottom: '30px', textAlign: 'center', fontWeight: '900' }}>РЕДАКТОР</h2>
                            <input value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} placeholder="Твое имя" style={inputS} />
                            <input value={userData.avatar} onChange={e => setUserData({...userData, avatar: e.target.value})} placeholder="URL аватара" style={inputS} />
                            <input value={userData.tg} onChange={e => setUserData({...userData, tg: e.target.value})} placeholder="Telegram" style={inputS} />
                            <input value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} placeholder="Телефон" style={inputS} />
                            <button onClick={handleSave} style={saveB}>СОХРАНИТЬ</button>
                            <div onClick={() => setIsEditing(false)} style={{ textAlign: 'center', marginTop: '20px', color: '#444', cursor: 'pointer', fontSize: '13px' }}>ОТМЕНА</div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Стили
const statCard = { background: '#161816', padding: '20px 5px', borderRadius: '20px', border: '1px solid #222', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const statNum = { fontSize: '24px', fontWeight: '900', color: '#4CAF50' };
const statLabel = { fontSize: '9px', color: '#555', marginTop: '5px', fontWeight: 'bold', letterSpacing: '1px' };
const adminLinkStyle = { display: 'block', padding: '20px', background: '#0d0f0d', borderRadius: '15px', marginBottom: '10px', border: '1px solid #222', textDecoration: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold', transition: '0.2s' };
const pBarBg = { width: '100%', height: '8px', background: '#000', borderRadius: '10px', overflow: 'hidden' };
const pBarFill = { height: '100%', background: '#4CAF50', transition: '1s ease-in-out' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px' } as any;
const modalContent = { background: '#111', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #222' };
const inputS = { width: '100%', padding: '18px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none' };
const saveB = { width: '100%', padding: '20px', background: '#4CAF50', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };

export default function ProfilePage() {
    return <Suspense fallback={<div style={{backgroundColor: '#0d0f0d', minHeight: '100vh'}} />}><ProfileContent /></Suspense>;
}