"use client";
import React from 'react';
import { modalOverlay, modalContentSmall, adminIn, delIconStyle, adminActionBtn, saveBtn } from './adminStyles';

export default function TestEditorModal({
    testFormData, setTestFormData, dynamicTests, updateTestQuestion,
    removeTestQuestion, addTestQuestion, handleSendTest, isProcessing, setShowTestEditor
}: any) {
    return (
        <div style={{...modalOverlay, alignItems: 'flex-start'} as any}>
            <div className="admin-modal-content custom-scroll" style={{...modalContentSmall, maxWidth: '900px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'} as any}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>РЕДАКТОР ТЕСТА: {testFormData.title}</h2>
                <input style={adminIn as any} placeholder="Название теста" value={testFormData.title} onChange={e => setTestFormData({...testFormData, title: e.target.value})} />
                
                <div style={{borderTop: '1px solid #222', paddingTop: '30px', marginTop: '15px'}}>
                    <h3 style={{fontSize: '20px', color: '#fff', marginBottom: '25px', fontWeight: '900'}}>ВОПРОСЫ И ОТВЕТЫ</h3>
                    {testFormData.quiz.map((q: any, qIdx: number) => (
                        <div key={qIdx} style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                            {testFormData.quiz.length > 1 && <div onClick={() => removeTestQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'} as any}>✕</div>}
                            <div style={{fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px'}}>ВОПРОС {qIdx + 1}</div>
                            <input style={adminIn as any} placeholder="Текст вопроса..." value={q.q} onChange={e => updateTestQuestion(qIdx, 'q', e.target.value)} />
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '10px'}}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                        <label style={{display:'flex', gap:'5px', cursor:'pointer', color: q.c === i ? '#0abab5' : '#888', fontWeight: 'bold', fontSize: '13px'}}><input type="radio" checked={q.c === i} onChange={() => updateTestQuestion(qIdx, 'c', i)} /> Верный вариант {i+1}</label>
                                        <input style={{...adminIn, marginBottom: 0, borderColor: q.c === i ? '#0abab5' : '#222'} as any} placeholder={`Ответ ${i+1}`} value={q.o[i]} onChange={e => updateTestQuestion(qIdx, `o${i}`, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={addTestQuestion} disabled={isProcessing} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'} as any}>+ ДОБАВИТЬ ВОПРОС</button>
                </div>
                <button onClick={handleSendTest} disabled={isProcessing} style={{...saveBtn, marginTop: '30px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1} as any}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ СОТРУДНИКУ'}</button>
                <div onClick={() => setShowTestEditor(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
            </div>
        </div>
    );
}