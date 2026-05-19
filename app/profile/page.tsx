"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- ХЕЛПЕР ДЛЯ ЗАПИСИ ДАННЫХ НА СЕРВЕР ---
const saveDataToServer = (key: string, data: any) => {
    fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

function ProfileContent() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [newPass, setNewPass] = useState('');
    
    // --- СТЕЙТЫ ДЛЯ ОКНА ИНСТРУКЦИИ УВЕДОМЛЕНИЙ ---
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [helpTab, setHelpTab] = useState<'ios' | 'android' | 'desktop'>('ios');
    
    const [userRole, setUserRole] = useState('staff');
    const [userId, setUserId] = useState('guest');
    
    const [profile, setProfile] = useState({
        name: '',
        avatar: '',
        tg: '',
        phone: '',
        email: ''
    });

    const [progress, setProgress] = useState({
        routeCount: 0,
        basicsCount: 0,
        deadline: '',
        isOverdue: false
    });

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
                let pData = await fetch(`/api/storage?key=profile_data_${currentId}`).then(r => r.json()).catch(() => null);
                
                let dlDate = new Date();
                
                if (!pData || Array.isArray(pData) || Object.keys(pData).length === 0) {
                    pData = { avatar: '', tg: role === 'admin' ? '@admin_tea' : '@username', phone: '', email: '', firstLogin: dlDate.toISOString() };
                    saveDataToServer(`profile_data_${currentId}`, pData);
                    dlDate.setDate(dlDate.getDate() + 7);
                } else {
                    if (!pData.firstLogin) {
                        pData.firstLogin = dlDate.toISOString();
                        saveDataToServer(`profile_data_${currentId}`, pData);
                    }
                    dlDate = new Date(new Date(pData.firstLogin).getTime() + 7 * 24 * 60 * 60 * 1000);
                }

                setProfile({
                    name: currentName,
                    avatar: pData.avatar || '',
                    tg: pData.tg || '',
                    phone: pData.phone || '',
                    email: pData.email || '' 
                });

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
                setIsMounted(true); 
            }
        };

        loadProfileData();
    }, []);

    const handleOpenEdit = () => {
        setIsMenuOpen(false);
        setIsEditing(true);
    };

    const handleOpenPassChange = () => {
        setIsMenuOpen(false);
        setIsPassModalOpen(true);
        setNewPass('');
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const handleSaveProfile = async () => {
        localStorage.setItem('current_user_name', profile.name);
        
        try {
            let pData = await fetch(`/api/storage?key=profile_data_${userId}`).then(r => r.json()).catch(() => ({}));
            if (Array.isArray(pData)) pData = {};
            
            pData.avatar = profile.avatar;
            pData.tg = profile.tg;
            pData.phone = profile.phone;
            pData.email = profile.email;
            
            saveDataToServer(`profile_data_${userId}`, pData);

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

    const handleChangePassword = async () => {
        if (!newPass.trim()) return;
        
        try {
            const users = await fetch('/api/storage?key=tea_hub_users_v1').then(r => r.json()).catch(() => []);
            
            if (Array.isArray(users)) {
                const updatedUsers = users.map((u:any) => u.id === userId ? { ...u, pass: newPass.trim() } : u);
                saveDataToServer('tea_hub_users_v1', updatedUsers);
                
                alert("Пароль успешно изменен!");
                setIsPassModalOpen(false);
                setNewPass('');
            }
        } catch (error) {
            console.error("Ошибка смены пароля:", error);
            alert("Не удалось изменить пароль.");
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setProfile(prev => ({ ...prev, avatar: event.target!.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    if (!isMounted) return <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh' }} />;

    return (
        <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', overflowX: 'hidden' }}>
            <Navigation />
            
            {/* БЛОК-РАСПОРКА ДЛЯ САЙДБАРА (КАК НА ДРУГИХ СТРАНИЦАХ) */}
            <div style={{ width: '260px', flexShrink: 0 }} className="sidebar-spacer" />

            <main style={{ flex: 1, padding: '120px 20px 140px 20px', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    
                    <section style={profileHeaderCardStyle}>
                        <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={threeDotsButtonStyle}>•••</div>

                        {isMenuOpen && (
                            <div style={contextMenuStyle}>
                                <div onClick={handleOpenEdit} style={menuItemStyle}>✎ Настроить данные</div>
                                <div onClick={handleOpenPassChange} style={menuItemStyle}>🔒 Сменить пароль</div>
                                <div onClick={handleLogout} style={{ ...menuItemStyle, color: '#ff7675', borderBottom: 'none' }}>✕ Выйти</div>
                            </div>
                        )}

                        <div style={{ width: '130px', height: '130px', borderRadius: '45px', backgroundColor: '#000', margin: '0 auto 25px', border: '2px solid #4CAF50', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(76, 175, 80, 0.2)' }}>
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
                    </section>

                    {userRole === 'admin' ? (
                        <div style={{ animation: 'fadeInUp 0.5s ease' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '35px' }}>
                                <div style={statCardStyle}><span style={statNum}>{adminStats.teas}</span><span style={statLabel}>ПРОДУКТОВ</span></div>
                                <div style={statCardStyle}><span style={statNum}>{adminStats.lessons}</span><span style={statLabel}>УРОКОВ</span></div>
                                <div style={statCardStyle}><span style={statNum}>{adminStats.rules}</span><span style={statLabel}>ПРАВИЛ</span></div>
                            </div>
                        </div>
                    ) : (
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

                    {/* НОВАЯ КНОПКА ПОДКЛЮЧЕНИЯ УВЕДОМЛЕНИЙ */}
                    <button 
                        onClick={() => setIsHelpModalOpen(true)} 
                        style={notificationHelpBtnStyle as any}
                    >
                        🔔 ИНСТРУКЦИЯ: КАК ВКЛЮЧИТЬ УВЕДОМЛЕНИЯ
                    </button>
                </div>

                {/* --- РЕДАКТОР ПРОФИЛЯ --- */}
                {isEditing && (
                    <div style={overlayStyle}>
                        <div style={modalStyle}>
                            <h2 style={{ marginBottom: '30px', textAlign: 'center', fontWeight: '900', letterSpacing: '1px' }}>РЕДАКТОР ПРОФИЛЯ</h2>
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Твое имя" style={inputItemStyle} />
                                
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                                    <input value={profile.avatar} onChange={e => setProfile({...profile, avatar: e.target.value})} placeholder="Ссылка на фото (URL)" style={{ ...inputItemStyle, flex: 1, marginBottom: 0 }} />
                                    <button onClick={() => document.getElementById('avatar-upload')?.click()} style={{ background: '#222', color: '#0abab5', border: '1px solid #333', padding: '0 20px', height: '58px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ЗАГРУЗИТЬ</button>
                                </div>

                                <input value={profile.tg} onChange={e => setProfile({...profile, tg: e.target.value})} placeholder="Telegram (напр. @nik_name)" style={inputItemStyle} />
                                <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="E-mail адрес" style={inputItemStyle} />
                                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Номер телефона" style={inputItemStyle} />
                            </div>
                            <button onClick={handleSaveProfile} style={saveButtonStyle}>СОХРАНИТЬ ИЗМЕНЕНИЯ</button>
                            <div onClick={() => setIsEditing(false)} style={cancelButtonStyle}>ОТМЕНА</div>
                        </div>
                    </div>
                )}

                {/* --- СМЕНА ПАРОЛЯ --- */}
                {isPassModalOpen && (
                    <div style={overlayStyle}>
                        <div style={modalStyle}>
                            <h2 style={{ marginBottom: '30px', textAlign: 'center', fontWeight: '900', letterSpacing: '1px', color: '#fff' }}>СМЕНА ПАРОЛЯ</h2>
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Придумайте новый пароль" style={inputItemStyle} />
                            </div>
                            <button onClick={handleChangePassword} style={saveButtonStyle}>ОБНОВИТЬ ПАРОЛЬ</button>
                            <div onClick={() => setIsPassModalOpen(false)} style={cancelButtonStyle}>ОТМЕНА</div>
                        </div>
                    </div>
                )}

                {/* --- МОДАЛЬНОЕ ОКНО: ИНСТРУКЦИЯ ПО УВЕДОМЛЕНИЯМ --- */}
                {isHelpModalOpen && (
                    <div style={overlayStyle} onClick={() => setIsHelpModalOpen(false)}>
                        <div className="custom-scroll" style={{...modalStyle, maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '35px 25px'}} onClick={e => e.stopPropagation()}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2 style={{ margin: 0, fontWeight: '900', color: '#fff', fontSize: '22px' }}>НАСТРОЙКА УВЕДОМЛЕНИЙ</h2>
                                <div onClick={() => setIsHelpModalOpen(false)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div>
                            </div>

                            <div style={{ display: 'flex', background: '#000', borderRadius: '15px', padding: '4px', marginBottom: '25px', border: '1px solid #222' }}>
                                <div onClick={() => setHelpTab('ios')} style={tabStyle(helpTab === 'ios') as any}>🍎 iOS</div>
                                <div onClick={() => setHelpTab('android')} style={tabStyle(helpTab === 'android') as any}>🤖 Android</div>
                                <div onClick={() => setHelpTab('desktop')} style={tabStyle(helpTab === 'desktop') as any}>💻 ПК</div>
                            </div>

                            {/* ВКЛАДКА IOS */}
                            {helpTab === 'ios' && (
                                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <p style={helpDescStyle as any}>Apple (iPhone/iPad) разрешает получать Push-уведомления с сайтов <b>только если сайт установлен на домашний экран</b>.</p>
                                    
                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>1</div>
                                        <div style={stepTextStyle as any}>Откройте сайт Tea Hub строго в стандартном браузере <b>Safari</b>.</div>
                                    </div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>2</div>
                                        <div style={stepTextStyle as any}>Нажмите на кнопку <b>«Поделиться»</b> (квадрат со стрелочкой вверх внизу экрана).</div>
                                    </div>
                                    {/* ЗАГЛУШКА ПОД СКРИН 1: Для замены картинки положи файл ios-step1.jpg в папку public и раскомментируй строку ниже */}
                                    {/* <img src="/ios-step1.jpg" style={screenshotStyle} alt="Кнопка Поделиться" /> */}
                                    <div style={imgPlaceholderStyle as any}>🖼️ Скриншот: Кнопка «Поделиться» в Safari</div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>3</div>
                                        <div style={stepTextStyle as any}>В появившемся меню пролистайте вниз и выберите <b>«На экран "Домой"»</b>, затем нажмите «Добавить».</div>
                                    </div>
                                    {/* ЗАГЛУШКА ПОД СКРИН 2 */}
                                    {/* <img src="/ios-step2.jpg" style={screenshotStyle} alt="Кнопка На экран домой" /> */}
                                    <div style={imgPlaceholderStyle as any}>🖼️ Скриншот: Пункт «На экран "Домой"»</div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>4</div>
                                        <div style={stepTextStyle as any}>Закройте Safari, найдите иконку <b>Tea Hub на рабочем столе</b> и откройте её.</div>
                                    </div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>5</div>
                                        <div style={stepTextStyle as any}>Авторизуйтесь и в меню появится кнопка <b>«Привязать устройство»</b>. Нажмите её и разрешите уведомления.</div>
                                    </div>
                                </div>
                            )}

                            {/* ВКЛАДКА ANDROID */}
                            {helpTab === 'android' && (
                                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <p style={helpDescStyle as any}>На Android уведомления работают проще, но мы настоятельно рекомендуем использовать <b>Google Chrome</b>.</p>
                                    
                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>1</div>
                                        <div style={stepTextStyle as any}>Зайдите на сайт Tea Hub через Google Chrome (в Яндекс.Браузере могут быть системные сбои).</div>
                                    </div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>2</div>
                                        <div style={stepTextStyle as any}>Войдите в аккаунт и нажмите появившуюся кнопку <b>«ПРИВЯЗАТЬ УСТРОЙСТВО»</b>.</div>
                                    </div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>3</div>
                                        <div style={stepTextStyle as any}>Браузер спросит: <i>«Разрешить tea-hub.ru отправлять вам уведомления?»</i>. Нажмите <b>«Разрешить»</b>.</div>
                                    </div>
                                    {/* ЗАГЛУШКА ПОД СКРИН 1 */}
                                    {/* <img src="/android-step1.jpg" style={screenshotStyle} alt="Разрешить уведомления" /> */}
                                    <div style={imgPlaceholderStyle as any}>🖼️ Скриншот: Плашка «Разрешить уведомления»</div>

                                    <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '15px' }}>
                                        <h4 style={{ color: '#ff4d4d', margin: '0 0 10px 0', fontSize: '14px' }}>⚠️ Если вы случайно заблокировали:</h4>
                                        <p style={{ fontSize: '13px', color: '#ccc', margin: 0, lineHeight: '1.5' }}>Нажмите на значок «Замка» (или настроек) слева от адреса сайта вверху экрана - <b>Разрешения</b> - Уведомления - Разрешить.</p>
                                    </div>
                                </div>
                            )}

                            {/* ВКЛАДКА ПК */}
                            {helpTab === 'desktop' && (
                                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <p style={helpDescStyle as any}>На компьютере (Windows / Mac) включить уведомления можно в 2 клика.</p>
                                    
                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>1</div>
                                        <div style={stepTextStyle as any}>Войдите в свой аккаунт на сайте и нажмите кнопку <b>«ПРИВЯЗАТЬ»</b>. Всплывет окно браузера с запросом прав.</div>
                                    </div>

                                    <div style={stepCardStyle as any}>
                                        <div style={stepNumStyle as any}>2</div>
                                        <div style={stepTextStyle as any}>Нажмите <b>«Разрешить» (Allow)</b>.</div>
                                    </div>

                                    <div style={{ marginTop: '25px', padding: '15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '15px' }}>
                                        <h4 style={{ color: '#0abab5', margin: '0 0 10px 0', fontSize: '14px' }}>Где найти ручные настройки:</h4>
                                        <p style={{ fontSize: '13px', color: '#ccc', margin: 0, lineHeight: '1.5' }}>Если окно не появилось, нажмите на значок <b>«Настройки сайта»</b> (ползунки или замочек слева от адресной строки браузера) и переключите тумблер <b>Уведомления</b> во включенное положение.</p>
                                    </div>
                                    {/* ЗАГЛУШКА ПОД СКРИН 1 */}
                                    {/* <img src="/pc-step1.jpg" style={screenshotStyle} alt="Настройки сайта в браузере" /> */}
                                    <div style={imgPlaceholderStyle as any}>🖼️ Скриншот: Значок замка и тумблер «Уведомления»</div>
                                </div>
                            )}

                            <button onClick={() => setIsHelpModalOpen(false)} style={{ ...saveButtonStyle, marginTop: '30px' } as any}>ПОНЯТНО, ЗАКРЫТЬ</button>
                        </div>
                    </div>
                )}
            </main>

            <style jsx global>{` 
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } 
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                ::-webkit-scrollbar-track { background: transparent; }
                body { overflow-x: hidden; width: 100vw; }
                @media (max-width: 768px) { .sidebar-spacer { display: none; } }
            `}</style>
        </div>
    );
}

// --- СТИЛИ ---

const profileHeaderCardStyle: any = { 
    position: 'relative',
    backgroundColor: '#161816', 
    padding: '40px 30px', 
    borderRadius: '40px', 
    border: '1px solid #222', 
    textAlign: 'center', 
    marginBottom: '40px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
};

const threeDotsButtonStyle: any = { 
    position: 'absolute', 
    top: '25px', 
    right: '30px', 
    color: '#444', 
    fontSize: '22px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    transition: '0.2s',
    letterSpacing: '-1px'
};

const contextMenuStyle: any = { 
    position: 'absolute', 
    top: '60px', 
    right: '30px', 
    backgroundColor: '#111', 
    border: '1px solid #222', 
    borderRadius: '18px', 
    width: '200px', 
    overflow: 'hidden', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.8)', 
    zIndex: 100,
    textAlign: 'left',
    animation: 'fadeIn 0.2s ease'
};

const menuItemStyle: any = { 
    padding: '16px 20px', 
    color: '#eee', 
    fontSize: '14px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    borderBottom: '1px solid #1a1a1a', 
    transition: '0.2s' 
};

const sectionTitle: any = { fontSize: '12px', fontWeight: '900', color: '#444', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase' };
const statCardStyle: any = { background: '#161816', padding: '25px 10px', borderRadius: '25px', border: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const statNum: any = { fontSize: '28px', fontWeight: '900', color: '#0abab5' };
const statLabel: any = { fontSize: '10px', color: '#555', marginTop: '5px', fontWeight: 'bold' };

const progressSectionStyle: any = { background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid #222', marginBottom: '35px' };
const labelRow: any = { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', fontWeight: '900' };
const barBg: any = { width: '100%', height: '10px', background: '#000', borderRadius: '12px', overflow: 'hidden' };
const barFill: any = { height: '100%', background: '#0abab5', transition: '1.2s cubic-bezier(0.4, 0, 0.2, 1)' };
const deadlineStyle: any = { marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #222', fontSize: '11px', color: '#555', textAlign: 'center' };
const badgeStyle: any = { background: '#111', height: '80px', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', border: '1px solid #222', transition: '0.4s' };
const contactCardStyle: any = { background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222' };
const contactIconStyle: any = { width: '45px', height: '45px', background: '#000', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' };
const overlayStyle: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px', backdropFilter: 'blur(15px)' };
const modalStyle: any = { background: '#111', borderRadius: '45px', border: '1px solid #222' };
const inputItemStyle: any = { width: '100%', padding: '20px', background: '#000', border: '1px solid #222', borderRadius: '18px', color: '#fff', outline: 'none', fontSize: '16px', boxSizing: 'border-box' };
const saveButtonStyle: any = { width: '100%', padding: '22px', background: '#0abab5', border: 'none', borderRadius: '18px', fontWeight: '900', color: '#000', cursor: 'pointer', marginTop: '20px', fontSize: '15px' };
const cancelButtonStyle: any = { textAlign: 'center', marginTop: '25px', color: '#444', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' };

// Стили кнопки инструкции
const notificationHelpBtnStyle = {
    width: '100%',
    padding: '20px',
    marginTop: '30px',
    background: 'transparent',
    border: '1px solid #0abab5',
    color: '#0abab5',
    borderRadius: '25px',
    fontWeight: '900',
    cursor: 'pointer',
    fontSize: '14px',
    transition: '0.3s',
};

// Стили для внутренностей модалки инструкций
const tabStyle = (isActive: boolean) => ({
    flex: 1,
    textAlign: 'center',
    padding: '12px',
    cursor: 'pointer',
    color: isActive ? '#000' : '#888',
    background: isActive ? '#0abab5' : 'transparent',
    fontWeight: '900',
    fontSize: '14px',
    borderRadius: '10px',
    transition: '0.2s'
});

const helpDescStyle = {
    fontSize: '14px',
    color: '#ccc',
    lineHeight: '1.5',
    marginBottom: '20px',
    padding: '0 5px'
};

const stepCardStyle = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    background: '#161816',
    padding: '15px',
    borderRadius: '15px',
    border: '1px solid #222',
    marginBottom: '10px'
};

const stepNumStyle = {
    width: '35px',
    height: '35px',
    background: 'rgba(10,186,181,0.1)',
    color: '#0abab5',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '16px',
    flexShrink: 0
};

const stepTextStyle = {
    fontSize: '14px',
    color: '#eee',
    lineHeight: '1.5'
};

const imgPlaceholderStyle = {
    width: '100%',
    height: '140px',
    background: '#1a1a1a',
    border: '1px dashed #333',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#555',
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '15px 0 25px 0'
};

// Раскомментируй и используй этот стиль, когда закинешь реальные скриншоты в папку public
// const screenshotStyle = {
//     width: '100%',
//     borderRadius: '15px',
//     border: '1px solid #333',
//     margin: '15px 0 25px 0'
// };

export default function ProfilePage() {
    return <Suspense fallback={<div style={{backgroundColor: '#0d0f0d', minHeight: '100vh'}} />}><ProfileContent /></Suspense>;
}