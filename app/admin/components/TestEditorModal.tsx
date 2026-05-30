"use client";
import React from 'react';
import { modalOverlay, adminIn, delIconStyle, adminActionBtn, saveBtn } from './adminStyles';

// 💡 Локальные стили для красивого компактного окна (как в Обучении)
const modalContentMedium: React.CSSProperties = { background: '#111', padding: '40px 30px', borderRadius: '35px', width: '100%', maxWidth: '550px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const cancelLink: React.CSSProperties = { textAlign: 'center', marginTop: '20px', color: '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };

export default function TestEditorModal({
    testFormData, setTestFormData, updateTestQuestion,
    removeTestQuestion, addTestQuestion, handleSendTest, isProcessing, setShowTestEditor
}: any) {
    return (
        <div style={{...modalOverlay, alignItems: 'center'} as any} onClick={() => setShowTestEditor(false)}>
            <div className="admin-modal-content custom-scroll" style={{...modalContentMedium, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0abab5', fontWeight: '900', textTransform: 'uppercase' }}>
                    РЕДАКТОР АТТЕСТАЦИИ
                </h2>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название аттестации</div>
                        <input autoComplete="new-password" style={adminIn as any} placeholder="Например: Итоговый экзамен" value={testFormData.title} onChange={e => setTestFormData({...testFormData, title: e.target.value})} />
                    </div>
                </div>

                <div style={{borderTop: '1px solid #222', paddingTop: '20px'}}>
                    <h3 style={{fontSize: '16px', color: '#0abab5', marginBottom: '15px', fontWeight: '900'}}>ВОПРОСЫ ({testFormData.quiz.length})</h3>
                    {testFormData.quiz.map((q: any, qIdx: number) => (
                        <div key={qIdx} style={{background: '#0d0f0d', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                            {testFormData.quiz.length > 1 && <div onClick={() => removeTestQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'} as any}>✕</div>}
                            
                            <input autoComplete="new-password" style={{...adminIn, fontWeight: 'bold', marginBottom: '15px', paddingRight: '40px'} as any} placeholder="Текст вопроса..." value={q.q} onChange={e => updateTestQuestion(qIdx, 'q', e.target.value)} />
                            
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                {/* Динамически выводим 4 варианта ответа с красивым выделением */}
                                {[0, 1, 2, 3].map((i: number) => (
                                    <div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', background: q.c === i ? 'rgba(10,186,181,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', border: q.c === i ? '1px solid #0abab5' : '1px solid #222'}}>
                                        <input type="radio" style={{transform: 'scale(1.2)'}} checked={q.c === i} onChange={() => updateTestQuestion(qIdx, 'c', i)} />
                                        <input autoComplete="new-password" style={{...adminIn, padding: '10px', marginBottom: 0, border: 'none', background: 'transparent', width: '100%'} as any} placeholder={`Вариант ${i+1}`} value={q.o[i] || ''} onChange={e => updateTestQuestion(qIdx, `o${i}`, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={addTestQuestion} disabled={isProcessing} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'} as any}>+ ДОБАВИТЬ ВОПРОС</button>
                </div>
                <button onClick={handleSendTest} disabled={isProcessing} style={{...saveBtn, marginTop: '30px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1} as any}>
                    {isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ СОТРУДНИКУ'}
                </button>
                <div onClick={() => setShowTestEditor(false)} style={cancelLink as any}>ОТМЕНА</div>
            </div>
        </div>
    );
}