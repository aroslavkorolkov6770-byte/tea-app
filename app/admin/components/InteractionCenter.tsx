"use client";
import React from 'react';
import { adminCard, adminIn, adminSendBtn, adminActionBtn } from './adminStyles';

export default function InteractionCenter({
    users, interactionTab, setInteractionTab, selectedStaff, setSelectedStaff,
    notifText, setNotifText, testType, setTestType, handleSendNotification,
    handleOpenTestEditor, handleQuickSendTest, isProcessing
}: any) {
    return (
        <div style={{ ...adminCard, marginTop: '30px', padding: '0', overflow: 'hidden' } as any}>
            <div className="interaction-center-tabs" style={{ display: 'flex', borderBottom: '1px solid #222' }}>
                <div onClick={() => setInteractionTab('notif')} style={{ flex: 1, padding: '20px', textAlign: 'center', cursor: 'pointer', background: interactionTab === 'notif' ? 'rgba(10,186,181,0.05)' : 'transparent', color: interactionTab === 'notif' ? '#0abab5' : '#666', fontWeight: '900', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' }}>УВЕДОМЛЕНИЯ</div>
                <div onClick={() => setInteractionTab('test')} style={{ flex: 1, padding: '20px', textAlign: 'center', cursor: 'pointer', background: interactionTab === 'test' ? 'rgba(10,186,181,0.05)' : 'transparent', color: interactionTab === 'test' ? '#0abab5' : '#666', fontWeight: '900', fontSize: '13px', letterSpacing: '1px', transition: '0.2s', borderLeft: '1px solid #222' }}>АТТЕСТАЦИЯ</div>
            </div>
            
            <div style={{ padding: '25px' }}>
                <div className="interaction-center-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="interaction-center-label" style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Получатель:</div>
                    <select style={{ ...adminIn, flex: 1, marginBottom: 0 } as any} value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                        <option value="Все">Всем сотрудникам</option>
                        {users.filter((u: any) => u.role === 'staff').map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.login})</option>
                        ))}
                    </select>
                </div>
                
                {interactionTab === 'notif' ? (
                    <div className="interaction-center-row" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="interaction-center-label" style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Текст:</div>
                        <input type="text" style={{ ...adminIn, flex: 1, marginBottom: 0 } as any} placeholder="Введите текст сообщения..." value={notifText} onChange={(e) => setNotifText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendNotification()} disabled={isProcessing} />
                        <button onClick={handleSendNotification} disabled={isProcessing} style={{ ...adminSendBtn, width: 'auto', padding: '14px 25px', fontSize: '13px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 } as any}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}</button>
                    </div>
                ) : (
                    <div className="interaction-center-row" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="interaction-center-label" style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Тип теста:</div>
                        <select style={{ ...adminIn, flex: 1, marginBottom: 0 } as any} value={testType} onChange={(e) => setTestType(e.target.value)}>
                            <option value="final">🎓 Итоговый тест (Аттестация)</option>
                            <option value="re-attestation">🔄 Переаттестация</option>
                        </select>
                        <button onClick={handleOpenTestEditor} disabled={isProcessing} style={{ ...adminActionBtn, padding: '14px 20px', borderRadius: '15px' } as any}>РЕДАКТОР</button>
                        <button onClick={handleQuickSendTest} disabled={isProcessing} style={{ ...adminSendBtn, width: 'auto', padding: '14px 25px', fontSize: '13px', borderRadius: '15px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 } as any}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}</button>
                    </div>
                )}
            </div>
        </div>
    );
}