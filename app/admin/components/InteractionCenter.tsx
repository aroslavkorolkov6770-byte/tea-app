"use client";
import React, { useState } from 'react';
import { adminCard, adminIn, adminSendBtn, adminActionBtn } from './adminStyles';

export default function InteractionCenter({
    users, interactionTab, setInteractionTab, selectedStaff, setSelectedStaff,
    notifText, setNotifText, testType, setTestType, handleSendNotification,
    handleOpenTestEditor, handleQuickSendTest, isProcessing,
    testTypesList, handleUpdateTestTypes
}: any) {
    const [isManagingTypes, setIsManagingTypes] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');

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
                    <div className="interaction-center-row" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div className="interaction-center-label" style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '15px' }}>Тип теста:</div>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select style={{ ...adminIn, flex: 1, marginBottom: 0 } as any} value={testType} onChange={(e) => setTestType(e.target.value)}>
                                    {testTypesList.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                                <button onClick={() => setIsManagingTypes(!isManagingTypes)} style={{ ...adminActionBtn, padding: '0 15px', borderRadius: '15px' } as any}>⚙️ Настроить</button>
                            </div>

                            {isManagingTypes && (
                                <div style={{ background: '#000', padding: '15px', borderRadius: '15px', border: '1px solid #333' }}>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '10px' }}>УПРАВЛЕНИЕ ТИПАМИ</div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input style={{ ...adminIn, marginBottom: 0, padding: '10px', fontSize: '13px' } as any} placeholder="Новый тип..." value={newTypeName} onChange={e => setNewTypeName(e.target.value)} />
                                        <button onClick={() => {
                                            if (newTypeName.trim()) {
                                                handleUpdateTestTypes([...testTypesList, { id: 'type_' + Date.now(), name: newTypeName.trim() }]);
                                                setNewTypeName('');
                                            }
                                        }} style={{ background: '#0abab5', color: '#000', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Добавить</button>
                                    </div>
                                    <div style={{ maxHeight: '120px', overflowY: 'auto' }} className="custom-scroll">
                                        {testTypesList.map((t: any) => (
                                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111', borderRadius: '8px', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '13px', color: '#ccc' }}>{t.name}</span>
                                                {testTypesList.length > 1 && (
                                                    <span style={{ color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', padding: '0 5px' }} onClick={() => {
                                                        const newL = testTypesList.filter((type: any) => type.id !== t.id);
                                                        handleUpdateTestTypes(newL);
                                                        if (testType === t.name) setTestType(newL[0].name);
                                                    }}>✕</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <button onClick={handleOpenTestEditor} disabled={isProcessing} style={{ ...adminActionBtn, padding: '14px 20px', borderRadius: '15px', flex: 1 } as any}>РЕДАКТОР</button>
                                <button onClick={handleQuickSendTest} disabled={isProcessing} style={{ ...adminSendBtn, padding: '14px 25px', fontSize: '13px', borderRadius: '15px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1, flex: 2 } as any}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ СТАНДАРТНЫЙ'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}