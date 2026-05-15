"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';

// --- ХЕЛПЕР ДЛЯ ЗАПИСИ ДАННЫХ НА СЕРВЕР ---
const saveDataToServer = (key: string, data: any) => {
    fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

function ProfileContent() {
    const [isMounted, setIsMounted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Состояния авторизации (берутся из сессии браузера)
    const [userRole, setUserRole] = useState('staff');
    const [userId, setUserId] = useState('guest');
    
    // Состояние профиля (ДОБАВЛЕНО ПОЛЕ EMAIL)
    const [profile, setProfile] = useState({
        name: '',
        avatar: '',
        tg: '',
        phone: '',
        email: ''
    });

    // Состояние прогресса (для сотрудника)
    const [progress, setProgress] = useState({
        routeCount: 0,
        basicsCount: 0,
        deadline: '',
        isOverdue: false
    });

    // Состояние статистики (для админа)
    const [adminStats, setAdminStats] = useState({
        teas: 0,
        lessons: 0,
        rules: 0
    });

    useEffect(() => {
        const loadProfileData = async () => {
            const role = localStorage.getItem('userRole') || 'staff';
            const currentId = localStorage.getItem('current_user_id') || 'guest';
            const currentName = localStorage.getItem('current_user_name') || (role === 'admin' ? 'Главный Мастер' : 'Сотрудник');
            
            setUserRole(role);
            setUserId(currentId);

            try {
                // 1. Загрузка личных данных профиля с сервера
                let pData = await fetch(`/api/storage?key=profile_data_${currentId}`).then(r => r.json()).catch(() => null);
                
                let dlDate = new Date();
                
                // Если профиль на сервере еще не создан (первый вход)
                if (!pData || Array.isArray(pData) || Object.keys(pData).length === 0) {
                    pData = {
                        avatar: '',
                        tg: role === 'admin' ? '@admin_tea' : '@username',
                        phone: '',
                        email: '', // Инициализируем пустое поле для почты
                        firstLogin: dlDate.toISOString()
                    };
                    saveDataToServer(`profile_data_${currentId}`, pData);
                    dlDate.setDate(dlDate.getDate() + 7);
                } else {
                    // Если зайден не в первый раз, проверяем дату
                    if (!pData.firstLogin) {
                        pData.firstLogin = dlDate.toISOString();
                        saveDataToServer(`profile_data_${currentId}`, pData);
                    }
                    dlDate = new Date(new Date(pData.firstLogin).getTime() + 7 * 24 * 60 * 60 * 1000);
                }

                // ЗАГРУЖАЕМ ПОЧТУ ИЗ БД В STATE
                setProfile({
                    name: currentName,
                    avatar: pData.avatar || '',
                    tg: pData.tg || '',
                    phone: pData.phone || '',
                    email: pData.email || '' 
                });

                // 2. Изолированный прогресс сотрудника с сервера
                const routeData = await fetch(`/api/storage?key=prog_route_${currentId}`).then(r => r.json()).catch(() => []);
                const basicsData = await fetch(`/api/storage?key=prog_basics_${currentId}`).then(r => r.json()).catch(() => []);
                
                const rCount = Array.isArray(routeData) ? routeData.length : 0;
                const bCount = Array.isArray(basicsData) ? basicsData.length : 0;

                setProgress({
                    routeCount: rCount,
                    basicsCount: bCount,
                    deadline: dlDate.toLocaleDateString(),
                    isOverdue: new Date() > dlDate && (rCount < 5 || bCount < 10)
                });

                // 3. Расчет статистики для админа
                if (role === 'admin') {
                    const teaDb = await fetch('/api/storage?key=tea_master_unified_v1').then(r => r.json()).catch(() => []);
                    const basicsDb = await fetch('/api/storage?key=tea_hub_dynamic_basics_v1').then(r => r.json()).catch(() => []);
                    const standardsDb = await fetch('/api/storage?key=tea_hub_dynamic_standards_v1').then(r => r.json()).catch(() => []);

                    setAdminStats({
                        teas: Array.isArray(teaDb) ? teaDb.length : 0,
                        lessons: Array.isArray(basicsDb) ? basicsDb.reduce((acc: number, s: any) => acc + (s.modules?.length || 0), 0) : 0,
                        rules: Array.isArray(standardsDb) ? standardsDb.length : 0
                    });
                }

                setIsMounted(true);
            } catch (error) {
                console.error("Ошибка загрузки профиля:", error);
                setIsMounted(true); // Показываем как есть при сбое
            }
        };

        loadProfileData();
    }, []);

    const handleSaveProfile = async () => {
        // Имя для текущей сессии браузера
        localStorage.setItem('current_user_name', profile.name);
        
        try {
            // Скачиваем текущий объект профиля, чтобы не затереть дату первого входа (firstLogin)
            let pData = await fetch(`/api/storage?key=profile_data_${userId}`).then(r => r.json()).catch(() => ({}));
            if (Array.isArray(pData)) pData = {};
            
            pData.avatar = profile.avatar;
            pData.tg = profile.tg;
            pData.phone = profile.phone;
            pData.email = profile.email; // СОХРАНЯЕМ ИЗМЕНЕННУЮ ПОЧТУ
            
            // Сохраняем личные данные на сервер
            saveDataToServer(`profile_data_${userId}`, pData);

            // Синхронизируем имя в общей базе пользователей (чтобы у админа обновилось в списке)
            const users = await fetch('/api/storage?key=tea_hub_users_v1').then(r => r.json()).catch(() => []);
            if (Array.isArray(users)) {
                const updatedUsers = users.map((u:any) => u.id === userId ? { ...u, name: profile.name } : u);
                saveDataToServer('tea_hub_users_v1', updatedUsers);
            }
        } catch (error) {
            console.error("Ошибка сохранения профиля:", error);
        }

        setIsEditing(false);
    };

    if (!isMounted) return <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh' }} />;

    return (
        <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
            <Navigation />
            
            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '120px 20px 140px 20px' }}>
                
                {/* ВЕРХНЯЯ КАРТОЧКА */}
                <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '45px', backgroundColor: '#161816', margin: '0 auto 25px', border: '2px solid #4CAF50', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(76, 175, 80, 0.2)' }}>
                        {profile.avatar ? (
                            <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                        ) : (
                            <span style={{ fontSize: '45px' }}>{userRole === 'admin' ? '👑' : '👤'}</span>
                        )}
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', color: '#fff' }}>{profile.name}</h2>
                    <p style={{ color: '#0abab5', fontWeight: 'bold', fontSize: '13px', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {userRole === 'admin' ? 'ГЛАВНЫЙ МАСТЕР (ADMIN)' : 'ЧАЙНЫЙ МАСТЕР (УЧЕНИК)'}
                    </p>
                    <div onClick={() => setIsEditing(true)} style={{ color: '#555', fontSize: '12px', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }}>настроить профиль</div>
                </section>

                {/* КОНТЕНТ АДМИНА */}
                {userRole === 'admin' ? (
                    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '35px' }}>
                            <div style={statCardStyle}><span style={statNum}>{adminStats.teas}</span><span style={statLabel}>ПРОДУКТОВ</span></div>
                            <div style={statCardStyle}><span style={statNum}>{adminStats.lessons}</span><span style={statLabel}>УРОКОВ</span></div>
                            <div style={statCardStyle}><span style={statNum}>{adminStats.rules}</span><span style={statLabel}>ПРАВИЛ</span></div>
                        </div>
                        <h3 style={sectionTitle}>ИНСТРУМЕНТЫ МАСТЕРА</h3>
                        <div style={adminPanelStyle}>
                            <Link href="/admin" style={adminLinkStyle}>📊 Управление персоналом и статистика</Link>
                            <Link href="/tasks?tab=edu" style={adminLinkStyle}>✍️ Конструктор базы знаний</Link>
                        </div>
                    </div>
                ) : (
                    /* КОНТЕНТ СОТРУДНИКА */
                    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
                        <section style={progressSectionStyle}>
                            <div style={{ marginBottom: '25px' }}>
                                <div style={labelRow}><span style={{color:'#888'}}>ПЛАН НА НЕДЕЛЮ</span><span style={{color:'#0abab5'}}>{progress.routeCount}/5</span></div>
                                <div style={barBg}><div style={{ ...barFill, width: `${(progress.routeCount/5)*100}%` }} /></div>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={labelRow}><span style={{color:'#888'}}>ОСНОВЫ ОБУЧЕНИЯ</span><span style={{color:'#0abab5'}}>{progress.basicsCount}/10</span></div>
                                <div style={barBg}><div style={{ ...barFill, width: `${(progress.basicsCount/10)*100}%` }} /></div>
                            </div>
                            <div style={deadlineStyle}>
                                ДЕДЛАЙН: <span style={{ color: progress.isOverdue ? '#ff7675' : '#0abab5', fontWeight: '900' }}>{progress.deadline}</span>
                            </div>
                        </section>

                        <h3 style={sectionTitle}>ЛИЧНЫЕ ДОСТИЖЕНИЯ</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '35px' }}>
                            <div title="Старт" style={{ ...badgeStyle, opacity: progress.routeCount >= 1 ? 1 : 0.1 }}>🌱</div>
                            <div title="План" style={{ ...badgeStyle, opacity: progress.routeCount >= 5 ? 1 : 0.1 }}>🚀</div>
                            <div title="Теория" style={{ ...badgeStyle, opacity: progress.basicsCount >= 5 ? 1 : 0.1 }}>📚</div>
                            <div title="Мастер" style={{ ...badgeStyle, opacity: progress.basicsCount >= 10 ? 1 : 0.1 }}>🏮</div>
                        </div>
                    </div>
                )}

                {/* КОНТАКТЫ */}
                <h3 style={sectionTitle}>СВЯЗЬ</h3>
                <section style={contactCardStyle}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={contactIconStyle}>💬</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>{profile.tg || 'telegram не указан'}</div>
                            <div style={{ fontSize: '14px', color: '#0abab5', fontWeight: 'bold', marginBottom: '2px' }}>{profile.email || 'e-mail не указан'}</div>
                            <div style={{ fontSize: '13px', color: '#555' }}>{profile.phone || 'телефон не указан'}</div>
                        </div>
                    </div>
                </section>

                {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
                {isEditing && (
                    <div style={overlayStyle}>
                        <div style={modalStyle}>
                            <h2 style={{ marginBottom: '30px', textAlign: 'center', fontWeight: '900', letterSpacing: '1px' }}>РЕДАКТОР ПРОФИЛЯ</h2>
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Твое имя" style={inputItemStyle} />
                                <input value={profile.avatar} onChange={e => setProfile({...profile, avatar: e.target.value})} placeholder="Ссылка на фото (URL)" style={inputItemStyle} />
                                <input value={profile.tg} onChange={e => setProfile({...profile, tg: e.target.value})} placeholder="Telegram (напр. @nik_name)" style={inputItemStyle} />
                                <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="E-mail адрес" style={inputItemStyle} />
                                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Номер телефона" style={inputItemStyle} />
                            </div>
                            <button onClick={handleSaveProfile} style={saveButtonStyle}>СОХРАНИТЬ ИЗМЕНЕНИЯ</button>
                            <div onClick={() => setIsEditing(false)} style={cancelButtonStyle}>ОТМЕНА</div>
                        </div>
                    </div>
                )}
            </main>

            <style jsx global>{` @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } `}</style>
        </div>
    );
}

// --- СТИЛИ ---
const sectionTitle: any = { fontSize: '12px', fontWeight: '900', color: '#444', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase' };
const statCardStyle: any = { background: '#161816', padding: '25px 10px', borderRadius: '25px', border: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const statNum: any = { fontSize: '28px', fontWeight: '900', color: '#0abab5' };
const statLabel: any = { fontSize: '10px', color: '#555', marginTop: '5px', fontWeight: 'bold' };
const adminPanelStyle: any = { background: '#161816', padding: '20px', borderRadius: '30px', border: '1px solid #222' };
const adminLinkStyle: any = { display: 'block', padding: '18px 22px', background: '#0d0f0d', borderRadius: '18px', marginBottom: '12px', border: '1px solid #222', textDecoration: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold' };
const progressSectionStyle: any = { background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid #222', marginBottom: '35px' };
const labelRow: any = { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', fontWeight: '900' };
const barBg: any = { width: '100%', height: '10px', background: '#000', borderRadius: '12px', overflow: 'hidden' };
const barFill: any = { height: '100%', background: '#0abab5', transition: '1.2s cubic-bezier(0.4, 0, 0.2, 1)' };
const deadlineStyle: any = { marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #222', fontSize: '11px', color: '#555', textAlign: 'center' };
const badgeStyle: any = { background: '#111', height: '80px', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', border: '1px solid #222', transition: '0.4s' };
const contactCardStyle: any = { background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222' };
const contactIconStyle: any = { width: '45px', height: '45px', background: '#000', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' };
const overlayStyle: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px', backdropFilter: 'blur(15px)' };
const modalStyle: any = { background: '#111', padding: '50px 40px', borderRadius: '45px', width: '100%', maxWidth: '420px', border: '1px solid #222' };
const inputItemStyle: any = { width: '100%', padding: '20px', background: '#000', border: '1px solid #222', borderRadius: '18px', color: '#fff', outline: 'none', fontSize: '16px' };
const saveButtonStyle: any = { width: '100%', padding: '22px', background: '#0abab5', border: 'none', borderRadius: '18px', fontWeight: '900', color: '#000', cursor: 'pointer', marginTop: '20px', fontSize: '15px' };
const cancelButtonStyle: any = { textAlign: 'center', marginTop: '25px', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' };

export default function ProfilePage() {
    return <Suspense fallback={<div style={{backgroundColor: '#0d0f0d', minHeight: '100vh'}} />}><ProfileContent /></Suspense>;
}