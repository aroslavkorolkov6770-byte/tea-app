"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';

function ProfileContent() {
    const [isMounted, setIsMounted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userRole, setUserRole] = useState('staff');
    
    const [userData, setUserData] = useState({
        name: 'Сотрудник',
        avatar: '',
        tg: '@username',
        phone: ''
    });

    const [progress, setProgress] = useState({
        route: 0,
        basics: 0,
        deadline: ''
    });

    // Статистика для админа
    const [adminStats, setAdminStats] = useState({
        totalTeas: 0,
        totalLessons: 0,
        totalStandards: 0
    });

    useEffect(() => {
        try {
            const role = localStorage.getItem('userRole') || 'staff';
            setUserRole(role);

            const savedName = localStorage.getItem('user_name');
            const savedAv = localStorage.getItem('user_avatar');
            const savedTg = localStorage.getItem('user_tg');
            const savedPhone = localStorage.getItem('user_phone');
            const firstLogin = localStorage.getItem('first_login_date');

            if (savedName) setUserData(prev => ({ ...prev, name: savedName }));
            if (savedAv) setUserData(prev => ({ ...prev, avatar: savedAv }));
            if (savedTg) setUserData(prev => ({ ...prev, tg: savedTg }));
            if (savedPhone) setUserData(prev => ({ ...prev, phone: savedPhone }));

            // Расчет дедлайна
            let dl = "";
            if (!firstLogin) {
                const now = new Date();
                localStorage.setItem('first_login_date', now.toISOString());
                dl = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            } else {
                dl = new Date(new Date(firstLogin).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
            }

            // Данные для сотрудника
            const sRouteRaw = localStorage.getItem('tea_hub_onboard_route_v1');
            const sBasicsRaw = localStorage.getItem('tea_hub_basics_progress_v1');
            const sRoute = sRouteRaw ? JSON.parse(sRouteRaw) : [];
            const sBasics = sBasicsRaw ? JSON.parse(sBasicsRaw) : [];

            setProgress({
                route: sRoute.length,
                basics: sBasics.length,
                deadline: dl
            });

            // Данные для админа (сбор статистики из разных разделов)
            const teaDb = JSON.parse(localStorage.getItem('local_tea_db') || '[]');
            const basicsDb = JSON.parse(localStorage.getItem('tea_hub_dynamic_basics_v1') || '[]');
            const standardsDb = JSON.parse(localStorage.getItem('tea_hub_dynamic_standards_v1') || '[]');

            setAdminStats({
                totalTeas: teaDb.length,
                totalLessons: basicsDb.reduce((acc: number, sec: any) => acc + (sec.modules?.length || 0), 0),
                totalStandards: standardsDb.length
            });

        } catch (error) {
            console.error("Error loading profile data:", error);
        }
        setIsMounted(true);
    }, []);

    const handleSave = () => {
        localStorage.setItem('user_name', userData.name);
        localStorage.setItem('user_avatar', userData.avatar);
        localStorage.setItem('user_tg', userData.tg);
        localStorage.setItem('user_phone', userData.phone);
        setIsEditing(false);
    };

    if (!isMounted) return <div style={{backgroundColor: '#0d0f0d', minHeight: '100vh'}} />;

    const routePercent = Math.round((progress.route / 5) * 100);
    const basicsPercent = Math.round((progress.basics / 10) * 100);

    return (
        <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
            <Navigation />
            
            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '120px 20px 140px 20px' }}>
                
                {/* ОБЩАЯ ШАПКА ПРОФИЛЯ */}
                <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '40px', backgroundColor: '#161816', margin: '0 auto 20px', border: `2px solid ${userRole === 'admin' ? '#4CAF50' : '#4CAF50'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(76, 175, 80, 0.1)' }}>
                        {userData.avatar ? (
                            <img src={userData.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                        ) : (
                            <span style={{ fontSize: '40px' }}>{userRole === 'admin' ? '👑' : '👤'}</span>
                        )}
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>{userData.name}</h2>
                    <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '12px', margin: 0, letterSpacing: '2px' }}>
                        {userRole === 'admin' ? 'ГЛАВНЫЙ МАСТЕР (ADMIN)' : 'ЧАЙНЫЙ МАСТЕР (УЧЕНИК)'}
                    </p>
                    <div onClick={() => setIsEditing(true)} style={{ color: '#666', fontSize: '12px', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}>редактировать профиль</div>
                </section>

                {/* --- КОНТЕНТ ДЛЯ АДМИНА --- */}
                {userRole === 'admin' ? (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '25px' }}>
                            <div style={statCard}>
                                <span style={statNum}>{adminStats.totalTeas}</span>
                                <span style={statLabel}>СОРТОВ</span>
                            </div>
                            <div style={statCard}>
                                <span style={statNum}>{adminStats.totalLessons}</span>
                                <span style={statLabel}>УРОКОВ</span>
                            </div>
                            <div style={statCard}>
                                <span style={statNum}>{adminStats.totalStandards}</span>
                                <span style={statLabel}>ПРАВИЛ</span>
                            </div>
                        </div>

                        <section style={{ background: '#161816', padding: '25px', borderRadius: '30px', border: '1px solid #222', marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '20px', color: '#4CAF50' }}>УПРАВЛЕНИЕ СИСТЕМОЙ</h3>
                            <Link href="/admin" style={adminLinkStyle}>⚙️ Панель мониторинга сотрудников</Link>
                            <Link href="/tasks?tab=welcome" style={adminLinkStyle}>📝 Конструктор обучения и планов</Link>
                            <Link href="/search" style={adminLinkStyle}>🍃 Редактор базы продуктов</Link>
                        </section>
                    </div>
                ) : (
                    /* --- КОНТЕНТ ДЛЯ СОТРУДНИКА --- */
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <section style={{ background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', marginBottom: '25px' }}>
                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', fontWeight: '900' }}>
                                    <span style={{color: '#aaa'}}>ПЛАН НА НЕДЕЛЮ</span>
                                    <span style={{ color: '#4CAF50' }}>{progress.route}/5</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${routePercent}%`, height: '100%', background: '#4CAF50', transition: '1s ease-in-out' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', fontWeight: '900' }}>
                                    <span style={{color: '#aaa'}}>ОСНОВЫ ОБУЧЕНИЯ</span>
                                    <span style={{ color: '#4CAF50' }}>{progress.basics}/10</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${basicsPercent}%`, height: '100%', background: '#4CAF50', transition: '1s ease-in-out' }} />
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #222', fontSize: '11px', color: '#555', textAlign: 'center' }}>
                                📅 СЛЕДУЮЩИЙ ДЕДЛАЙН: <span style={{ color: '#ff7675', fontWeight: 'bold' }}>{progress.deadline}</span>
                            </div>
                        </section>

                        <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#444', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center' }}>ДОСТИЖЕНИЯ</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '30px' }}>
                            <div title="Первый шаг" style={{ ...badgeStyle, opacity: progress.route >= 1 ? 1 : 0.15 }}>🌱</div>
                            <div title="План выполнен" style={{ ...badgeStyle, opacity: progress.route === 5 ? 1 : 0.15 }}>🚀</div>
                            <div title="Знаток" style={{ ...badgeStyle, opacity: progress.basics >= 5 ? 1 : 0.15 }}>📚</div>
                            <div title="Мастер" style={{ ...badgeStyle, opacity: progress.basics === 10 ? 1 : 0.15 }}>🏮</div>
                        </div>
                    </div>
                )}

                {/* КОНТАКТЫ (ОБЩИЕ) */}
                <section style={{ background: '#161816', padding: '25px', borderRadius: '25px', border: '1px solid #222' }}>
                    <div style={{ fontSize: '11px', color: '#444', marginBottom: '15px', fontWeight: '900', letterSpacing: '1px' }}>СВЯЗЬ</div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: '#fff' }}>
                        <div style={{width: '40px', height: '40px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>💬</div>
                        <div>
                            <div style={{fontSize: '14px', fontWeight: 'bold'}}>{userData.tg}</div>
                            <div style={{fontSize: '11px', color: '#555'}}>{userData.phone || 'телефон не указан'}</div>
                        </div>
                    </div>
                </section>

                {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
                {isEditing && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px', backdropFilter: 'blur(10px)' }}>
                        <div style={{ background: '#111', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #222' }}>
                            <h2 style={{ marginBottom: '30px', textAlign: 'center', fontWeight: '900' }}>{userRole === 'admin' ? 'ДАННЫЕ МАСТЕРА' : 'ПРОФИЛЬ'}</h2>
                            <input value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} placeholder="Твое имя" style={inputStyle} />
                            <input value={userData.avatar} onChange={e => setUserData({...userData, avatar: e.target.value})} placeholder="URL аватара" style={inputStyle} />
                            <input value={userData.tg} onChange={e => setUserData({...userData, tg: e.target.value})} placeholder="Telegram (напр. @tea_master)" style={inputStyle} />
                            <input value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} placeholder="Телефон" style={inputStyle} />
                            <button onClick={handleSave} style={{ width: '100%', padding: '20px', background: '#4CAF50', border: 'none', borderRadius: '15px', fontWeight: '900', color: '#000', cursor: 'pointer', marginTop: '10px' }}>СОХРАНИТЬ</button>
                            <div onClick={() => setIsEditing(false)} style={{ textAlign: 'center', marginTop: '20px', color: '#444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>ОТМЕНА</div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

// Стили компонентов
const badgeStyle = { background: '#111', height: '75px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid #222', transition: '0.3s' };
const inputStyle = { width: '100%', padding: '18px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '15px' };
const statCard = { background: '#161816', padding: '20px 10px', borderRadius: '20px', border: '1px solid #222', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' };
const statNum = { fontSize: '24px', fontWeight: '900', color: '#4CAF50' };
const statLabel = { fontSize: '9px', color: '#555', marginTop: '5px', fontWeight: 'bold', letterSpacing: '1px' };
const adminLinkStyle = { display: 'block', padding: '18px 20px', background: '#0d0f0d', borderRadius: '15px', marginBottom: '10px', border: '1px solid #222', textDecoration: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold' };

export default function ProfilePage() {
    return <Suspense fallback={<div style={{backgroundColor: '#0d0f0d', minHeight: '100vh'}} />}><ProfileContent /></Suspense>;
}