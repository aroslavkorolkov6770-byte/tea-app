'use client';

import { useState, type FormEvent } from 'react';
import CustomIcon from '@/app/components/CustomIcon';

interface Props {
    currentLogin: string;
    employeeName?: string;
    onClose: () => void;
    onSave: (login: string, currentPassword: string) => Promise<void>;
}

// Один диалог сохраняет единый внешний вид в профиле и в списке сотрудников.
export default function LoginChangeDialog({ currentLogin, employeeName, onClose, onSave }: Props) {
    const [login, setLogin] = useState(currentLogin);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setError('');
        try {
            await onSave(login.trim(), password);
            setPassword('');
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось сохранить логин. Попробуйте ещё раз.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <div className="vates-own-profile-overlay" onClick={() => { if (!saving) onClose(); }}>
            <section className="vates-own-profile-dialog vates-own-profile-password-dialog" role="dialog" aria-modal="true" aria-labelledby="change-login-title" onClick={event => event.stopPropagation()}>
                <header>
                    <div><span className="vates-eyebrow">Данные для входа</span><h2 id="change-login-title">Смена логина</h2></div>
                    <button type="button" className="vates-icon-button" disabled={saving} onClick={onClose} aria-label="Закрыть смену логина"><CustomIcon name="close" size={18} color="currentColor" /></button>
                </header>
                {employeeName ? (
                    <p className="vates-login-warning" role="note">Вы меняете логин сотрудника <strong>«{employeeName}»</strong>. Ему потребуется войти заново с новым логином. Пароль останется прежним.</p>
                ) : <p>После сохранения входите с новым логином. Пароль и учебный прогресс сохранятся.</p>}
                <form onSubmit={submit}>
                    <div className="vates-own-profile-form-grid">
                        <label><span>Новый логин</span><input autoFocus autoComplete="username" maxLength={120} required value={login} onChange={event => setLogin(event.target.value)} disabled={saving} /></label>
                        {!employeeName && <label><span>Текущий пароль</span><input type="password" autoComplete="current-password" maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} disabled={saving} /></label>}
                    </div>
                    {error && <p role="alert">{error}</p>}
                    <div className="vates-own-profile-dialog-actions"><button type="button" className="vates-button secondary" disabled={saving} onClick={onClose}>Отмена</button><button type="submit" className="vates-button primary" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить логин'}</button></div>
                </form>
            </section>
        </div>
    );
}
