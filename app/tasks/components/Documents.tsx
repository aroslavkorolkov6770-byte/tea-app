"use client";
import React, { useState } from 'react';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    URGENT_FILES: 'tea_hub_urgent_files_v1'        
};

const saveDataToServer = (key: string, data: any) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

export default function Documents({ isAdmin, userId, urgentFiles, setUrgentFiles }: any) {
    const [previewFile, setPreviewFile] = useState<any>(null);

    // --- СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ПАПКАМИ ---
    const [promptSection, setPromptSection] = useState<{isOpen: boolean, name: string}>({ isOpen: false, name: '' });
    const [renameSectionPrompt, setRenameSectionPrompt] = useState<{isOpen: boolean, oldName: string, newName: string}>({ isOpen: false, oldName: '', newName: '' });
    const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, type: 'section'|'file', targetId: string, name: string}>({ isOpen: false, type: 'file', targetId: '', name: '' });
    
    // --- СОСТОЯНИЯ ДЛЯ ПЕРЕМЕЩЕНИЯ ФАЙЛОВ ---
    const [movingItem, setMovingItem] = useState<string | null>(null);
    const [moveNewSectionName, setMoveNewSectionName] = useState('');

    // Фильтруем ТОЛЬКО нормативные документы (исключаем дедлайны и тесты)
    const allDocs = (urgentFiles || []).filter((f: any) => {
        if (f.isDocPlaceholder) return true;
        if (f.id?.startsWith('deadline_') || f.isTest) return false;
        return true;
    });

    // 💡 Единая функция для безопасного обновления стейта, кэша и сервера (устраняет мерцание)
    const updateFilesState = (newFiles: any[]) => {
        setUrgentFiles(newFiles);
        localStorage.setItem('th_cache_files', JSON.stringify(newFiles));
        saveDataToServer(STORAGE_KEYS.URGENT_FILES, newFiles);
    };

    const handleDownloadFile = (file: any) => {
        if (!file.data && !file.hasSeparateData) {
            alert("Этот файл был загружен в старой версии платформы и недоступен.");
            return;
        }
        
        if (file.data) {
            const link = document.createElement('a');
            link.href = file.data;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            fetch(`/api/storage?t=${Date.now()}&key=file_data_${file.id}`)
                .then(r => r.json())
                .then(fileBase64 => {
                    if (fileBase64) {
                        const link = document.createElement('a');
                        link.href = fileBase64;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        alert("Файл не найден на сервере.");
                    }
                })
                .catch(() => alert("Ошибка при скачивании файла."));
        }
    };

    const handleOpenPreview = async (file: any) => {
        if (!file.data && !file.hasSeparateData) {
            alert("Этот файл был загружен в старой версии и недоступен для просмотра.");
            return;
        }

        if (file.data) {
            setPreviewFile(file);
        } else {
            try {
                const res = await fetch(`/api/storage?t=${Date.now()}&key=file_data_${file.id}`);
                const fileBase64 = await res.json();
                if (fileBase64) {
                    setPreviewFile({ ...file, data: fileBase64 });
                } else {
                    alert("Данные файла не найдены.");
                }
            } catch (e) {
                alert("Ошибка загрузки предпросмотра.");
            }
        }
    };

    // --- ЛОГИКА УПРАВЛЕНИЯ РАЗДЕЛАМИ ---
    const confirmPromptSection = () => {
        if (!promptSection.name.trim()) return;
        const newSecName = promptSection.name.trim();
        const placeholder = { id: 'doc_placeholder_' + Date.now(), section: newSecName, isDocPlaceholder: true };
        const updated = [...(urgentFiles || []), placeholder];
        updateFilesState(updated);
        setPromptSection({ isOpen: false, name: '' });
    };

    const confirmRenameSection = () => {
        if (!renameSectionPrompt.newName.trim()) return;
        const newName = renameSectionPrompt.newName.trim();
        const oldName = renameSectionPrompt.oldName;

        const updated = (urgentFiles || []).map((f: any) => {
            const isDoc = f.isDocPlaceholder || !(f.id?.startsWith('deadline_') || f.isTest);
            if (isDoc && (f.section?.trim() || 'Основной раздел') === oldName) {
                return { ...f, section: newName };
            }
            return f;
        });
        
        updateFilesState(updated);
        setRenameSectionPrompt({ isOpen: false, oldName: '', newName: '' });
    };

    const executeDelete = () => {
        let updated = [];
        if (confirmDelete.type === 'section') {
            updated = (urgentFiles || []).filter((f: any) => {
                const isDoc = f.isDocPlaceholder || !(f.id?.startsWith('deadline_') || f.isTest);
                if (isDoc && (f.section?.trim() || 'Основной раздел') === confirmDelete.name) return false;
                return true;
            });
        } else {
            const itemToDelete = (urgentFiles || []).find((f: any) => f.id === confirmDelete.targetId);
            const sourceSection = itemToDelete?.section?.trim() || 'Основной раздел';
            
            updated = (urgentFiles || []).filter((f: any) => f.id !== confirmDelete.targetId);
            saveDataToServer(`file_data_${confirmDelete.targetId}`, null);

            // 💡 Защита от пропадания папки: если мы удалили последний файл, создаем заглушку
            const sourceHasItems = updated.some((f: any) => {
                const isDoc = f.isDocPlaceholder || !(f.id?.startsWith('deadline_') || f.isTest);
                return isDoc && (f.section?.trim() || 'Основной раздел') === sourceSection;
            });
            
            if (!sourceHasItems && sourceSection !== 'Основной раздел') {
                updated.push({ id: 'doc_placeholder_' + Date.now(), section: sourceSection, isDocPlaceholder: true });
            }
        }
        updateFilesState(updated);
        setConfirmDelete({ isOpen: false, type: 'file', targetId: '', name: '' });
    };

    const handleMoveItem = (targetSection: string) => {
        if (!movingItem) return;
        
        const itemToMove = (urgentFiles || []).find((f: any) => f.id === movingItem);
        const sourceSection = itemToMove?.section?.trim() || 'Основной раздел';

        let updated = (urgentFiles || []).map((f: any) => f.id === movingItem ? { ...f, section: targetSection } : f);
        
        // 💡 Защита от пропадания папки: если мы забрали последний файл, оставляем заглушку
        const sourceHasItems = updated.some((f: any) => {
            const isDoc = f.isDocPlaceholder || !(f.id?.startsWith('deadline_') || f.isTest);
            return isDoc && (f.section?.trim() || 'Основной раздел') === sourceSection;
        });
        
        if (!sourceHasItems && sourceSection !== 'Основной раздел') {
            updated.push({ id: 'doc_placeholder_' + Date.now(), section: sourceSection, isDocPlaceholder: true });
        }

        updateFilesState(updated);
        setMovingItem(null);
        setMoveNewSectionName('');
    };

    // --- ГРУППИРОВКА ФАЙЛОВ ПО РАЗДЕЛАМ ---
    const groupItems = (items: any[]) => {
        const groups: Record<string, any[]> = {};
        items.forEach((item: any) => {
            const sec = item.section?.trim() || 'Основной раздел';
            if (!groups[sec]) groups[sec] = [];
            // Добавляем в массив только реальные файлы, игнорируем плейсхолдеры
            if (!item.isDocPlaceholder) {
                groups[sec].push(item);
            }
        });
        return groups;
    };

    const docGroups = groupItems(allDocs);

    return (
        <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
            
            <div style={flexSpace as any}>
               <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: 0 }}>Нормативные документы</h2>
               {isAdmin && (
                   <button onClick={() => setPromptSection({isOpen: true, name: ''})} style={adminActionBtn as any}>
                       + НОВЫЙ РАЗДЕЛ
                   </button>
               )}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.keys(docGroups).length === 0 ? (
                   <div style={{ color: '#666', fontSize: '15px', background: '#111', padding: '40px', borderRadius: '30px', border: '1px dashed #333', textAlign: 'center', lineHeight: '1.5' }}>
                       {isAdmin ? 'В этом разделе пока нет документов.\nНажмите «+ НОВЫЙ РАЗДЕЛ», чтобы создать первую папку.' : 'Нет доступных нормативных документов.'}
                   </div>
               ) : (
                   Object.entries(docGroups).map(([secName, items]: any) => (
                       <div key={secName} style={{ marginBottom: '40px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px' }}>
                               <h3 style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>📁 {secName}</h3>
                               {isAdmin && secName !== 'Основной раздел' && (
                                   <div style={{display: 'flex', gap: '15px'}}>
                                       <span onClick={() => setRenameSectionPrompt({isOpen: true, oldName: secName, newName: secName})} style={{ color: '#0abab5', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✎ РЕДАКТИРОВАТЬ</span>
                                       <span onClick={() => setConfirmDelete({isOpen: true, type: 'section', targetId: secName, name: secName})} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✕ УДАЛИТЬ</span>
                                   </div>
                               )}
                           </div>
                           
                           <div className="premium-cards-container">
                               {items.length === 0 ? (
                                   <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic', padding: '10px 5px' }}>
                                       В этом разделе пока нет документов...
                                   </div>
                               ) : (
                                   items.map((file: any) => (
                                       <div key={file.id} className="premium-card">
                                          
                                          {isAdmin && (
                                              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                                  <div onClick={(e) => { e.stopPropagation(); setMovingItem(file.id); }} style={moveIconStyle as any} title="Переместить">📦</div>
                                                  <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, type: 'file', targetId: file.id, name: file.name}); }} style={delIconStyle as any} title="Удалить">✕</div>
                                              </div>
                                          )}
                                          
                                          <span style={{fontSize:'11px', color:'#0abab5', fontWeight:'800', marginBottom: '6px', opacity: 0.8}}>{file.date || 'Документ'}</span>
                                          <h4 style={{fontSize:'16px', margin:'0 0 15px 0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3', paddingRight: isAdmin ? '70px' : '0'}}>📄 {file.name}</h4>
                                          
                                          <div style={{ color: '#555', fontSize: '12px', marginBottom: '15px', fontWeight: 'bold' }}>Вес: {file.size}</div>
                                          
                                          <div style={{ marginTop: 'auto', display: 'flex', gap: '15px' }}>
                                              <div onClick={() => handleOpenPreview(file)} style={{ color: '#0abab5', fontSize: '12px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>ОТКРЫТЬ</div>
                                              <div onClick={() => handleDownloadFile(file)} style={{ color: '#0abab5', fontSize: '12px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>СКАЧАТЬ ↓</div>
                                          </div>
                                       </div>
                                   ))
                               )}
                           </div>
                       </div>
                   ))
               )}
            </div>

            {/* МИНИ-ОКНА АДМИНА */}
            {promptSection.isOpen && (
                <div style={modalOverlay as any} onClick={() => setPromptSection({isOpen: false, name: ''})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900'}}>НОВЫЙ РАЗДЕЛ</h2>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название раздела</div>
                        <input style={adminIn as any} autoFocus placeholder="Например: Должностные инструкции" value={promptSection.name} onChange={e => setPromptSection({...promptSection, name: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setPromptSection({isOpen: false, name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={confirmPromptSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОЗДАТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {renameSectionPrompt.isOpen && (
                <div style={modalOverlay as any} onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>ПЕРЕИМЕНОВАТЬ РАЗДЕЛ</h2>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Новое название</div>
                        <input style={adminIn as any} autoFocus placeholder="Название..." value={renameSectionPrompt.newName} onChange={e => setRenameSectionPrompt({...renameSectionPrompt, newName: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={confirmRenameSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОХРАНИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {movingItem && (
                <div style={modalOverlay as any} onClick={() => { setMovingItem(null); setMoveNewSectionName(''); }}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>Переместить документ</h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px'}} className="custom-scroll">
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginLeft: '5px' }}>Выбрать существующий:</div>
                            {Array.from(new Set(allDocs.map((i: any) => i.section?.trim() || 'Основной раздел'))).map((sec: any) => (
                                <button key={sec} onClick={() => handleMoveItem(sec)} style={{...adminIn, textAlign: 'left', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #333'} as any}>{sec}</button>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Или создать новый раздел:</div>
                            <input style={adminIn as any} placeholder="Название нового раздела..." value={moveNewSectionName} onChange={e => setMoveNewSectionName(e.target.value)} />
                            <button onClick={() => {
                                if (moveNewSectionName.trim()) handleMoveItem(moveNewSectionName.trim());
                            }} style={{ background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', width: '100%', marginTop: '10px' }}>СОЗДАТЬ И ПЕРЕМЕСТИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmDelete({isOpen: false, type: 'file', targetId: '', name: ''})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>УДАЛИТЬ?</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>
                            {confirmDelete.type === 'section' 
                                ? `Вы уверены, что хотите удалить весь раздел "${confirmDelete.name}" и ВСЕ документы внутри него? Это действие необратимо.` 
                                : `Удалить документ "${confirmDelete.name}" безвозвратно?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <button onClick={() => setConfirmDelete({isOpen: false, type: 'file', targetId: '', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={executeDelete} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>УДАЛИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ПРЕДПРОСМОТР ФАЙЛА */}
            {previewFile && (
                <div style={modalOverlay as any} onClick={() => setPreviewFile(null)}>
                    <div className="tasks-modal" style={{ background: '#111', padding: '30px', borderRadius: '30px', width: '100%', maxWidth: '80%', height: '85vh', border: '1px solid #333', display: 'flex', flexDirection: 'column' } as any} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                            <h2 style={{ color: '#0abab5', fontWeight: '900', fontSize: '18px', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile?.name}</h2>
                            <div onClick={() => setPreviewFile(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1 }}>✕</div>
                        </div>
                        <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                            {previewFile.data ? (
                                previewFile.name?.toLowerCase().match(/\.(docx|doc|xls|xlsx|ppt|pptx|zip|rar)$/i) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', textAlign: 'center', padding: '20px' }}>
                                        <div style={{ fontSize: '60px', marginBottom: '15px' }}>📄</div>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Формат не поддерживается</h3>
                                        <p style={{ color: '#555', fontSize: '14px', maxWidth: '350px', lineHeight: '1.5' }}>Браузеры не умеют открывать этот формат прямо внутри сайта. Вы можете скачать файл.</p>
                                        <button onClick={() => handleDownloadFile(previewFile)} style={{ ...saveBtn, width: 'auto', padding: '12px 30px', marginTop: '20px', borderRadius: '12px' } as any}>СКАЧАТЬ ФАЙЛ</button>
                                    </div>
                                ) : (
                                    <iframe src={previewFile.data} style={{ width: '100%', height: '100%', border: 'none' }} title="Предпросмотр файла" />
                                )
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>
                                    Загрузка документа...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 💡 ДОБАВЛЕНЫ СТИЛИ СЕТКИ (УСТРАНЯЕТ РАСТЯГИВАНИЕ КАРТОЧЕК НА ВЕСЬ ЭКРАН) */}
            <style jsx global>{`
                @media (min-width: 769px) {
                    .premium-cards-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
                        gap: 20px;
                        width: 100%;
                    }
                }

                .premium-card {
                    background: #111;
                    border-radius: 14px; 
                    border: 1px solid #222;
                    transition: all 0.2s ease;
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-height: 140px; 
                    padding: 20px; 
                    box-sizing: border-box; 
                    overflow: hidden;
                }

                .premium-card:hover {
                    border-color: #0abab5;
                    transform: translateY(-3px);
                }

                .premium-card:active {
                    background: rgba(10, 186, 181, 0.05); 
                    border-color: #0abab5;
                    transform: scale(0.98); 
                }

                @media (max-width: 768px) {
                    .premium-cards-container { 
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 10px !important; 
                    }
                    .premium-card {
                        width: 100% !important;
                        max-width: none !important; 
                        padding: 15px !important;
                        min-height: 120px !important;
                    }
                    .premium-card h4 { font-size: 13px !important; margin-bottom: 10px !important; }
                    .premium-card span { font-size: 10px !important; }
                }
            `}</style>
        </section>
    );
}

// --- СТИЛИ ---
const flexSpace = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };
const adminActionBtn = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 18px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' };
const moveIconStyle = { background: '#1a1a1a', color: '#fff', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const delIconStyle = { background: '#1a1a1a', color: '#ff4d4d', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)', padding: '20px', boxSizing: 'border-box' };
const modalContentSmall = { background: '#111', padding: '40px 30px', borderRadius: '30px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const adminIn = { width: '100%', padding: '16px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', marginBottom: '0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const saveBtn = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '25px', fontSize: '15px', letterSpacing: '1px' };