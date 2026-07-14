"use client";
import React, { useState } from 'react';
import { flexSpace, sectionTitle, actionBtn, adminIn, userCardStyle, modalOverlay, modalContentSmall, saveBtn } from './adminStyles';
import CustomIcon from '@/app/components/CustomIcon';
import { saveDataToServer } from '@/app/lib/storageClient';

export default function UserManagement({
    users, setUsers, userAvatars,
    setShowSuccessModal, setErrorModal, setSelectedProfileUser
}: any) {
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', login: '', pass: '', role: 'staff' });
    const [confirmModal, setConfirmModal] = useState({ show: false, id: '' });
    const [passwordResetModal, setPasswordResetModal] = useState({ show: false, userId: '', userName: '' });
    const [temporaryPassword, setTemporaryPassword] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const filteredUsers = users.filter((u: any) => 
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
        u.login.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const isProtectedUser = (user: any) => {
        return user?.id === 'u_admin' || user?.id === 'u_staff' || user?.systemAccount || user?.ghostAccount;
    };

    const getRoleLabel = (user: any) => {
        if (user?.systemAccount || user?.accountLabel) {
            return user.accountLabel || 'Системный администратор';
        }

        return user?.role === 'admin' ? 'Администратор' : 'Сотрудник';
    };

    const getRoleColor = (user: any) => {
        if (user?.systemAccount || user?.accountLabel) {
            return '#f7c873';
        }

        return user?.role === 'admin' ? '#ff7675' : '#0abab5';
    };

    const getLoginLabel = (user: any) => {
        if (user?.systemAccount || user?.ghostAccount) {
            return 'скрыт';
        }

        return user?.login || '';
    };

    const handleCreateUser = () => {
        if (!newUser.name.trim() || !newUser.login.trim() || !newUser.pass.trim()) {
            setErrorModal({ show: true, text: "Заполните все поля!" }); return;
        }
        if (users.find((u: any) => u.login === newUser.login.trim())) {
            setErrorModal({ show: true, text: "Логин уже существует!" }); return;
        }

        fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newUser.name.trim(),
                login: newUser.login.trim(),
                password: newUser.pass.trim(),
                role: newUser.role,
            }),
        })
            .then(async (response) => {
                const result = await response.json().catch(() => ({}));
                if (!response.ok || !result?.user) {
                    throw new Error(result?.error || 'Не удалось создать сотрудника');
                }

                const updatedUsers = [...users, result.user];
                setUsers(updatedUsers);
                setShowUserForm(false);
                setShowSuccessModal({ show: true, title: 'СОТРУДНИК СОЗДАН', text: `Аккаунт для ${newUser.name} успешно добавлен.` });
                setNewUser({ name: '', login: '', pass: '', role: 'staff' });
            })
            .catch((error) => {
                setErrorModal({ show: true, text: error.message || 'Не удалось создать сотрудника' });
            });
    };

    const handleDeleteUser = (id: string) => {
        const targetUser = users.find((u: any) => u.id === id);
        if (isProtectedUser(targetUser)) {
            setErrorModal({ show: true, text: "Базовые аккаунты удалить нельзя!" }); return;
        }
        setConfirmModal({ show: true, id: id });
    };

    const executeDelete = async () => {
        try {
            const deleteResponse = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: confirmModal.id }),
            });
            const deleteResult = await deleteResponse.json().catch(() => ({}));
            if (!deleteResponse.ok) {
                throw new Error(deleteResult?.error || 'Не удалось удалить сотрудника');
            }

            const updatedUsers = users.filter((u: any) => u.id !== confirmModal.id);
            setUsers(updatedUsers);
            const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_push_subs_v1`);
            const subs = await res.json().catch(() => []);
            if (Array.isArray(subs)) {
                await saveDataToServer('tea_hub_push_subs_v1', subs.filter((s: any) => s.userId !== confirmModal.id));
            }
        } catch (error: any) {
            setErrorModal({ show: true, text: error?.message || 'Не удалось удалить сотрудника' });
        }
        setConfirmModal({ show: false, id: '' });
    };

    const openPasswordResetModal = (user: any) => {
        setTemporaryPassword('');
        setPasswordResetModal({ show: true, userId: user.id, userName: user.name });
    };

    const closePasswordResetModal = () => {
        if (isResettingPassword) {
            return;
        }

        setTemporaryPassword('');
        setPasswordResetModal({ show: false, userId: '', userName: '' });
    };

    const executePasswordReset = async () => {
        if (temporaryPassword.trim().length < 8) {
            setErrorModal({ show: true, text: 'Временный пароль должен содержать не менее 8 символов.' });
            return;
        }

        setIsResettingPassword(true);

        try {
            const response = await fetch('/api/admin/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: passwordResetModal.userId,
                    temporaryPassword: temporaryPassword.trim(),
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result?.user) {
                throw new Error(result?.error || 'Не удалось сбросить пароль сотрудника');
            }

            setUsers(users.map((user: any) => (user.id === result.user.id ? result.user : user)));
            setTemporaryPassword('');
            setPasswordResetModal({ show: false, userId: '', userName: '' });
            setShowSuccessModal({
                show: true,
                title: 'ПАРОЛЬ СБРОШЕН',
                text: `Для ${passwordResetModal.userName} установлен новый временный пароль. Передайте его сотруднику безопасным способом.`,
            });
        } catch (error: any) {
            setErrorModal({ show: true, text: error?.message || 'Не удалось сбросить пароль сотрудника' });
        } finally {
            setIsResettingPassword(false);
        }
    };

    return (
        <>
            <div style={flexSpace as any}>
                <h2 style={sectionTitle as any}>Управление персоналом</h2>
                <span className="hover-unified-app" onClick={() => setShowUserForm(true)} style={actionBtn as any}>+ Новый сотрудник</span>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '15px', opacity: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon /></span>
                <input type="text" placeholder="Поиск по имени или логину..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} style={{ ...adminIn, paddingLeft: '45px', marginBottom: 0, background: '#111' } as any} />
            </div>
            
            <div className="custom-scroll keep-scroll" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredUsers.length === 0 ? (
                        <div style={{ color: '#555', padding: '20px 0', textAlign: 'center' }}>Сотрудники не найдены</div>
                    ) : (
                        filteredUsers.map((u: any) => {
                            const avatarImg = userAvatars[u.id] || u.avatar;
                            return (
                            <div key={u.id} className="user-management-card" style={userCardStyle as any}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: '#222', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {avatarImg ? <img src={avatarImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                                                <span style={avatarFallbackText as any}>
                                                    {u.systemAccount || u.ghostAccount ? <CustomIcon name="gear" size={18} color="#f7c873" /> : 'TH'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '18px', color: '#fff', marginBottom: '4px' }}>{u.name}</div>
                                            <div style={{ fontSize: '12px', color: getRoleColor(u), fontWeight: 'bold' }}>{getRoleLabel(u)}</div>
                                        </div>
                                    </div>
                                    {!isProtectedUser(u) && (
                                        <div className="hover-unified-app" onClick={() => handleDeleteUser(u.id)} style={{ cursor: 'pointer', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex' }}><CustomIcon name="close" size={15} color="#ff4d4d" /></div>
                                    )}
                                </div>
                                <div className="user-management-credentials" style={{ background: '#000', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                        <span style={{ color: '#666' }}>Логин:</span><span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{getLoginLabel(u)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#666' }}>Пароль:</span><span style={{ color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>скрыт</span>
                                    </div>
                                </div>
                                {u.role === 'staff' && !u.systemAccount && !u.ghostAccount && (
                                    <button
                                        type="button"
                                        className="hover-unified-app user-management-password-button"
                                        onClick={() => openPasswordResetModal(u)}
                                    >
                                        СБРОСИТЬ ПАРОЛЬ
                                    </button>
                                )}
                            </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Модалки создания и удаления */}
            {showUserForm && (
                <div style={modalOverlay as any}>
                    <div style={modalContentSmall as any}>
                        <h2 style={{color:'#0abab5', marginBottom:'25px', fontWeight: '900', textAlign: 'center'}}>НОВЫЙ СОТРУДНИК</h2>
                        <input style={adminIn as any} placeholder="Имя (напр. Анна)" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} />
                        <input style={adminIn as any} placeholder="Логин" value={newUser.login} onChange={e=>setNewUser({...newUser, login: e.target.value})} />
                        <input style={adminIn as any} placeholder="Пароль" value={newUser.pass} onChange={e=>setNewUser({...newUser, pass: e.target.value})} />
                        
                        <div style={{ textAlign: 'left', marginBottom: '15px', color: '#888', fontSize: '13px', fontWeight: 'bold', marginLeft: '5px' }}>Роль пользователя:</div>
                        <select style={adminIn as any} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                            <option value="staff"> Чайный мастер (Сотрудник)</option>
                            <option value="admin"> Администратор</option>
                        </select>
                        <button className="hover-unified-app" onClick={handleCreateUser} style={{...saveBtn, marginTop: '20px'} as any}>СОЗДАТЬ УЧЕТКУ</button>
                        <div className="hover-link-unified-app" onClick={()=>setShowUserForm(false)} style={{textAlign:'center', marginTop:'20px', cursor:'pointer', color:'#666', fontWeight:'bold'}}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {confirmModal.show && (
                <div style={modalOverlay as any} onClick={() => setConfirmModal({ show: false, id: '' })}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={warningBadgeStyle as any}><CustomIcon name="alert" size={34} color="#ff4d4d" /></div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px' }}>УДАЛИТЬ?</h2>
                        <p style={{ color: '#ccc', fontSize: '15px', marginBottom: '25px' }}>Вы уверены, что хотите удалить сотрудника?</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="hover-unified-app" onClick={() => setConfirmModal({ show: false, id: '' })} style={{...saveBtn, background: '#222', color: '#fff', flex: 1} as any}>ОТМЕНА</button>
                            <button className="hover-unified-app" onClick={executeDelete} style={{...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1} as any}>УДАЛИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {passwordResetModal.show && (
                <div style={modalOverlay as any} onClick={closePasswordResetModal}>
                    <div className="user-management-reset-modal" style={{ ...modalContentSmall, textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
                        <div style={warningBadgeStyle as any}><CustomIcon name="alert" size={34} color="#ff4d4d" /></div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px' }}>СБРОСИТЬ ПАРОЛЬ?</h2>
                        <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.55, marginBottom: '22px' }}>
                            Старый пароль сотрудника <strong>{passwordResetModal.userName}</strong> перестанет работать сразу после подтверждения. Передайте новый временный пароль только самому сотруднику.
                        </p>
                        <label className="user-management-password-label" htmlFor="temporary-employee-password">Новый временный пароль</label>
                        <input
                            id="temporary-employee-password"
                            type="text"
                            autoComplete="new-password"
                            value={temporaryPassword}
                            onChange={event => setTemporaryPassword(event.target.value)}
                            placeholder="Не менее 8 символов"
                            style={{ ...adminIn, marginBottom: '20px' } as any}
                            disabled={isResettingPassword}
                        />
                        <div className="user-management-reset-actions">
                            <button
                                type="button"
                                className="hover-unified-app"
                                onClick={closePasswordResetModal}
                                style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1 } as any}
                                disabled={isResettingPassword}
                            >
                                ОТМЕНА
                            </button>
                            <button
                                type="button"
                                className="hover-unified-app"
                                onClick={executePasswordReset}
                                style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1 } as any}
                                disabled={isResettingPassword}
                            >
                                {isResettingPassword ? 'СОХРАНЯЕМ...' : 'СБРОСИТЬ'}
                            </button>
                        </div>
                        <p className="user-management-password-hint">После входа сотрудник сможет заменить временный пароль в своём профиле.</p>
                    </div>
                </div>
            )}
        </>
    );
}

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

const avatarFallbackText = {
    color: '#0abab5',
    fontSize: '16px',
    fontWeight: '900',
    letterSpacing: '1px'
};

const warningBadgeStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    border: '1px solid rgba(255,77,77,0.35)',
    background: 'rgba(255,77,77,0.08)',
    color: '#ff4d4d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '900',
    margin: '0 auto 20px auto'
};
