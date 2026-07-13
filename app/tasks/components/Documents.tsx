"use client";
import React, { useEffect, useRef, useState } from 'react';
import CustomIcon from '@/app/components/CustomIcon';
import SectionCollapseButton from '@/app/components/SectionCollapseButton';
import useCollapsedSections from '@/app/hooks/useCollapsedSections';
import { fetchStorageBatch, saveDataToServer } from '@/app/lib/storageClient';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    URGENT_FILES: 'tea_hub_urgent_files_v1'        
};
const AI_SITE_CONTEXT_CACHE_KEY = 'th_ai_site_context_v2';

// Конвертер: Превращает текстовый код файла в настоящий виртуальный файл
const base64ToBlobUrl = (base64Data: string) => {
    try {
        const arr = base64Data.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("Ошибка конвертации Blob", e);
        return base64Data;
    }
};

const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';

const getPreviewKind = (fileName: string) => {
    const extension = getFileExtension(fileName);
    if (extension === 'docx') return 'docx';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return 'audio';
    if (['txt', 'md', 'json', 'csv'].includes(extension)) return 'text';
    if (['doc', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar'].includes(extension)) return 'unsupported';
    return 'iframe';
};

type LinkedDocumentPreview = {
    file: any;
    objectUrl: string;
    kind: string;
    loading: boolean;
    error: string;
};

const buildDocxPreviewHtml = (objectUrl: string) => `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
        html, body { margin: 0; min-height: 100%; background: #141716; color: #fff; font-family: Arial, sans-serif; }
        #document-container { min-height: 100vh; }
        #loading { padding: 70px 20px; color: #0abab5; text-align: center; font-weight: 700; }
        .docx-wrapper { background: transparent !important; padding: 24px 12px !important; }
        .docx-wrapper > section.docx { margin: 0 auto 24px !important; box-shadow: 0 12px 40px rgba(0,0,0,.45) !important; }
        @media (max-width: 700px) { .docx-wrapper { padding: 10px 0 !important; } }
    </style>
    <script src="https://unpkg.com/jszip/dist/jszip.min.js"></script>
    <script src="https://unpkg.com/docx-preview/dist/docx-preview.min.js"></script>
</head>
<body>
    <div id="document-container"><div id="loading">Подготовка документа...</div></div>
    <script>
        const documentUrl = ${JSON.stringify(objectUrl)};
        fetch(documentUrl)
            .then((response) => {
                if (!response.ok) throw new Error('Не удалось получить документ');
                return response.blob();
            })
            .then((blob) => {
                const container = document.getElementById('document-container');
                const loading = document.getElementById('loading');
                return window.docx.renderAsync(blob, container).then(() => loading.remove());
            })
            .catch((error) => {
                document.getElementById('loading').textContent = 'Не удалось открыть документ.';
                console.error(error);
            });
    </script>
</body>
</html>`;

export default function Documents({ isAdmin, userId, urgentFiles, setUrgentFiles, linkedDocumentId, onCloseLinkedDocument }: any) {
    const { isSectionCollapsed, toggleSection } = useCollapsedSections('tea_hub_document_collapsed_sections_v1');
    // --- СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ПАПКАМИ ---
    const [promptSection, setPromptSection] = useState<{isOpen: boolean, name: string}>({ isOpen: false, name: '' });
    const [renameSectionPrompt, setRenameSectionPrompt] = useState<{isOpen: boolean, oldName: string, newName: string}>({ isOpen: false, oldName: '', newName: '' });
    const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, type: 'section'|'file', targetId: string, name: string}>({ isOpen: false, type: 'file', targetId: '', name: '' });
    
    // --- СОСТОЯНИЯ ДЛЯ ПЕРЕМЕЩЕНИЯ ФАЙЛОВ ---
    const [movingItem, setMovingItem] = useState<string | null>(null);
    const [copyingItem, setCopyingItem] = useState<string | null>(null);

    // --- СОСТОЯНИЯ ДЛЯ ЗАГРУЗКИ ---
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadSection, setUploadSection] = useState('Основной раздел');
    const [isCreatingNewUploadSection, setIsCreatingNewUploadSection] = useState(false);
    const [newUploadSectionName, setNewUploadSectionName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [successModal, setSuccessModal] = useState({ show: false, title: '', text: '' });
    const [errorModal, setErrorModal] = useState({ show: false, text: '' });
    const [linkedPreview, setLinkedPreview] = useState<LinkedDocumentPreview | null>(null);
    const linkedPreviewIdRef = useRef<string | null>(null);
    const linkedPreviewObjectUrlRef = useRef<string>('');

    // Фильтруем ТОЛЬКО нормативные документы (исключаем дедлайны и тесты)
    const allDocs = (urgentFiles || []).filter((f: any) => {
        if (f.isDocPlaceholder) return true;
        if (f.id?.startsWith('deadline_') || f.isTest) return false;
        return true;
    });

    const existingDocSections = Array.from(new Set(
        allDocs.map((f: any) => f.section?.trim() || 'Основной раздел')
    ));

    const releaseLinkedPreviewObjectUrl = () => {
        if (linkedPreviewObjectUrlRef.current) {
            URL.revokeObjectURL(linkedPreviewObjectUrlRef.current);
            linkedPreviewObjectUrlRef.current = '';
        }
    };

    const closeLinkedPreview = () => {
        releaseLinkedPreviewObjectUrl();
        linkedPreviewIdRef.current = null;
        setLinkedPreview(null);
        if (typeof onCloseLinkedDocument === 'function') {
            onCloseLinkedDocument();
        }
    };

    useEffect(() => {
        if (!linkedDocumentId || linkedPreviewIdRef.current === linkedDocumentId) {
            return;
        }

        const targetDocument = allDocs.find((file: any) => file.id === linkedDocumentId && !file.isDocPlaceholder);
        if (!targetDocument) {
            return;
        }

        linkedPreviewIdRef.current = linkedDocumentId;
        const targetSection = targetDocument.section?.trim() || 'Основной раздел';
        if (isSectionCollapsed(targetSection)) {
            toggleSection(targetSection);
        }

        releaseLinkedPreviewObjectUrl();
        setLinkedPreview({ file: targetDocument, objectUrl: '', kind: getPreviewKind(targetDocument.name || ''), loading: true, error: '' });

        const loadLinkedDocument = async () => {
            try {
                let fileBase64 = targetDocument.data;
                if (!fileBase64 && targetDocument.hasSeparateData) {
                    const response = await fetch(`/api/storage?t=${Date.now()}&key=file_data_${targetDocument.id}`, { cache: 'no-store' });
                    if (!response.ok) {
                        throw new Error('Сервер не вернул данные документа');
                    }
                    fileBase64 = await response.json();
                }

                if (!fileBase64) {
                    throw new Error('Данные документа не найдены на сервере');
                }

                const objectUrl = base64ToBlobUrl(fileBase64);
                linkedPreviewObjectUrlRef.current = objectUrl;
                setLinkedPreview({ file: targetDocument, objectUrl, kind: getPreviewKind(targetDocument.name || ''), loading: false, error: '' });

                window.setTimeout(() => {
                    document.getElementById(`document-card-${targetDocument.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150);
            } catch (error) {
                console.error('Ошибка открытия связанного документа:', error);
                setLinkedPreview({
                    file: targetDocument,
                    objectUrl: '',
                    kind: getPreviewKind(targetDocument.name || ''),
                    loading: false,
                    error: error instanceof Error ? error.message : 'Не удалось открыть документ',
                });
            }
        };

        void loadLinkedDocument();
    }, [linkedDocumentId, urgentFiles]);

    useEffect(() => {
        return () => {
            releaseLinkedPreviewObjectUrl();
        };
    }, []);

    const updateFilesState = async (newFiles: any[]) => {
        setUrgentFiles(newFiles);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(AI_SITE_CONTEXT_CACHE_KEY);
        }
        await saveDataToServer(STORAGE_KEYS.URGENT_FILES, newFiles);
    };

    const ensureDocPlaceholderForSection = (items: any[], sectionName: string) => {
        const normalizedSection = sectionName.trim() || 'Основной раздел';
        const hasDocument = items.some((file: any) => {
            const isDoc = file.isDocPlaceholder || !(file.id?.startsWith('deadline_') || file.isTest);
            return isDoc && (file.section?.trim() || 'Основной раздел') === normalizedSection;
        });

        if (hasDocument || normalizedSection === 'Основной раздел') {
            return items;
        }

        return [...items, { id: 'doc_placeholder_' + Date.now(), section: normalizedSection, isDocPlaceholder: true }];
    };

    // --- ФУНКЦИИ ОТПРАВКИ УВЕДОМЛЕНИЙ ---
    const sendPushNotification = async (targetUserId: string, payload: any) => {
        try {
            const subsRes = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_push_subs_v1`, { cache: 'no-store' });
            const subs = await subsRes.json().catch(() => []);
            if (!Array.isArray(subs) || subs.length === 0) return false;
            const targetSubs = targetUserId === 'Все' ? subs : subs.filter((s: any) => s.userId === targetUserId);
            if (targetSubs.length === 0) return false;
            const apiRes = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptions: targetSubs.map((s: any) => s.sub), payload }) });
            return apiRes.ok;
        } catch (e) { return false; }
    };

    const sendEmailNotification = async (targetUserId: string, subject: string, text: string) => {
        try {
            const storageData = await fetchStorageBatch(['tea_hub_users_v1']);
            const users = storageData['tea_hub_users_v1'];
            if (!Array.isArray(users)) return false;

            let emailsToSend: string[] = [];
            const targetUsers = targetUserId === 'Все'
                ? users.filter((u: any) => u.role === 'staff')
                : users.filter((u: any) => u.id === targetUserId);

            const missingProfileKeys = targetUsers
                .filter((u: any) => !u.email)
                .map((u: any) => `profile_data_${u.id}`);

            const profileDataMap = missingProfileKeys.length > 0
                ? await fetchStorageBatch(missingProfileKeys)
                : {};

            if (targetUserId === 'Все') {
                for (const u of targetUsers) {
                    const email = u.email || profileDataMap[`profile_data_${u.id}`]?.email;
                    if (email) emailsToSend.push(email);
                }
            } else {
                const u = targetUsers[0];
                if (u) {
                    const email = u.email || profileDataMap[`profile_data_${u.id}`]?.email;
                    if (email) emailsToSend.push(email);
                }
            }
            if (emailsToSend.length === 0) return false;
            const res = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: emailsToSend.join(', '), subject, text }) });
            return res.ok;
        } catch (e) { return false; }
    };

    // --- ЛОГИКА ЗАГРУЗКИ ФАЙЛОВ ---
    const handleSaveFile = async () => {
        if (selectedFiles.length === 0 || isProcessing) return;
        setIsProcessing(true);
        
        let finalSection = uploadSection.trim();
        if (isCreatingNewUploadSection && newUploadSectionName.trim()) {
            finalSection = newUploadSectionName.trim();
        } else if (!finalSection || finalSection === '__NEW__') {
            finalSection = 'Основной раздел';
        }

        try {
            const fileNames = selectedFiles.map((file) => file.name);
            const newFilesData = [];

            for (let index = 0; index < selectedFiles.length; index += 1) {
                const file = selectedFiles[index];
                const fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result);
                    reader.readAsDataURL(file);
                });

                const fileId = 'file_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 5);
                await saveDataToServer(`file_data_${fileId}`, fileData);

                newFilesData.push({
                    id: fileId,
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                    section: finalSection,
                    hasSeparateData: true,
                });
            }

            const updatedFiles = [...newFilesData, ...(urgentFiles || [])];
            await updateFilesState(updatedFiles);
            
            const namesStr = fileNames.join(', ');
            setSuccessModal({ show: true, title: 'МАТЕРИАЛЫ ОТПРАВЛЕНЫ', text: `Файлы (${selectedFiles.length} шт.) загружены в раздел "${finalSection}".` });
            setSelectedFiles([]); setUploadSection('Основной раздел'); setIsCreatingNewUploadSection(false); setNewUploadSectionName('');

            Promise.allSettled([
                sendPushNotification('Все', { title: 'Новые учебные материалы', body: `Добавлены файлы: ${namesStr}`, url: '/tasks?tab=docs' }),
                sendEmailNotification('Все', 'Новые учебные материалы', `Администратор добавил новые документы: ${namesStr}`),
            ]).catch((error) => {
                console.error('Ошибка фоновой отправки уведомлений по документам', error);
            });
        } catch(e) {
            setErrorModal({ show: true, text: "Произошла ошибка при пакетной загрузке файлов. Возможно, файлы слишком большие." });
        } finally { setIsProcessing(false); }
    };

    const handleDownloadFile = async (file: any) => {
        if (!file.data && !file.hasSeparateData) {
            alert("Этот файл был загружен в старой версии платформы и недоступен.");
            return;
        }
        
        try {
            let fileBase64 = file.data;
            if (!fileBase64 && file.hasSeparateData) {
                const res = await fetch(`/api/storage?t=${Date.now()}&key=file_data_${file.id}`);
                fileBase64 = await res.json();
            }

            if (!fileBase64) {
                alert("Файл не найден на сервере.");
                return;
            }

            const objectUrl = base64ToBlobUrl(fileBase64);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert("Ошибка при скачивании файла.");
        }
    };

    // Интеллектуальный предпросмотр
    const handleOpenPreview = async (file: any) => {
        if (!file.data && !file.hasSeparateData) {
            alert("Этот файл был загружен в старой версии и недоступен для просмотра.");
            return;
        }

        const newWindow = window.open('', '_blank');
        if (!newWindow) {
            alert("Пожалуйста, разрешите всплывающие окна в браузере для предпросмотра документов.");
            return;
        }

        newWindow.document.write('<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#0abab5;font-weight:bold;font-size:20px;">Подготовка документа...</div>');

        try {
            let fileBase64 = file.data;
            if (!fileBase64 && file.hasSeparateData) {
                const res = await fetch(`/api/storage?t=${Date.now()}&key=file_data_${file.id}`);
                fileBase64 = await res.json();
            }

            if (!fileBase64) {
                newWindow.document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#ff4d4d;font-weight:bold;font-size:20px;">Данные файла не найден на сервере.</div>';
                return;
            }

            const objectUrl = base64ToBlobUrl(fileBase64);
            const previewKind = getPreviewKind(file.name || '');
            const isDocx = previewKind === 'docx';
            const isUnsupported = previewKind === 'unsupported';
            const fileExt = file.name.split('.').pop()?.toUpperCase() || 'ФАЙЛ';

            newWindow.document.open();
            newWindow.document.write(`
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Предпросмотр: ${file.name}</title>
                    <style>
                        body { margin: 0; padding: 0; background: #0d0f0d; height: 100vh; display: flex; flex-direction: column; ${isDocx ? 'overflow: auto;' : 'overflow: hidden;'} }
                        iframe, object, embed { width: 100%; height: 100%; border: none; flex: 1; background: #fff; }
                        .unsupported { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #fff; font-family: 'Inter', sans-serif; text-align: center; padding: 20px; }
                        .btn { background: #0abab5; color: #000; padding: 15px 35px; border-radius: 14px; text-decoration: none; font-weight: 900; margin-top: 30px; font-size: 16px; transition: 0.2s; cursor: pointer; border: none; display: inline-block; }
                        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(10,186,181,0.3); }
                        
                        /* Стили специально для чистого отображения DOCX */
                        #docx-container { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
                        .docx-wrapper { background: transparent !important; padding: 50px 20px !important; }
                        .docx-wrapper > section.docx { box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important; border-radius: 10px !important; margin-bottom: 30px !important; border: none !important; }
                        .docx-loading { margin-top: 150px; font-size: 20px; color: #0abab5; font-family: sans-serif; font-weight: bold; text-align: center; width: 100%; }
                    </style>
                    ${isDocx ? `
                    <script src="https://unpkg.com/jszip/dist/jszip.min.js"></script>
                    <script src="https://unpkg.com/docx-preview/dist/docx-preview.min.js"></script>
                    ` : ''}
                </head>
                <body>
                    ${isDocx ? `
                        <div id="docx-container">
                            <div id="loading" class="docx-loading">⏳ Обработка документа...</div>
                        </div>
                        <script>
                            fetch("${objectUrl}")
                                .then(res => res.blob())
                                .then(blob => {
                                    const container = document.getElementById("docx-container");
                                    const loading = document.getElementById("loading");
                                    docx.renderAsync(blob, container)
                                        .then(() => { loading.style.display = 'none'; })
                                        .catch(err => {
                                            loading.innerHTML = '<span style="color:#ff4d4d"> Ошибка при чтении документа.</span><br/><br/><a href="${objectUrl}" download="${file.name}" class="btn">СКАЧАТЬ ФАЙЛ </a>';
                                            console.error(err);
                                        });
                                })
                                .catch(err => {
                                    document.getElementById("loading").innerText = ' Ошибка при получении файла.';
                                    console.error(err);
                                });
                        </script>
                    ` : previewKind === 'text' ? `
                        <iframe src="${objectUrl}" style="background:#fff;"></iframe>
                    ` : previewKind === 'image' ? `
                        <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;box-sizing:border-box;background:#0d0f0d;">
                            <img src="${objectUrl}" alt="${file.name}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,0.45);" />
                        </div>
                    ` : previewKind === 'video' ? `
                        <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;box-sizing:border-box;background:#0d0f0d;">
                            <video controls style="width:100%;max-width:1100px;max-height:100%;border-radius:18px;background:#000;">
                                <source src="${objectUrl}" />
                            </video>
                        </div>
                    ` : previewKind === 'audio' ? `
                        <div class="unsupported">
                            <h2 style="margin:0 0 15px 0;font-size:26px;">Аудиофайл ${fileExt}</h2>
                            <p style="color:#aaa; margin: 0 0 25px 0; max-width:500px; line-height:1.6; font-size:15px;">Аудио можно прослушать прямо здесь или скачать на устройство.</p>
                            <audio controls style="width:min(100%, 720px); margin-bottom:24px;">
                                <source src="${objectUrl}" />
                            </audio>
                            <a href="${objectUrl}" download="${file.name}" class="btn">СКАЧАТЬ ФАЙЛ</a>
                        </div>
                    ` : isUnsupported ? `
                        <div class="unsupported">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
                                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="rgba(10,186,181,0.1)" stroke="#0abab5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 2V8H20" stroke="#0abab5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <h2 style="margin: 0 0 15px 0; font-size: 26px;">Формат ${fileExt} не поддерживается браузером</h2>
                            <p style="color: #aaa; margin: 0; max-width: 500px; line-height: 1.6; font-size: 15px;">
                                К сожалению, этот формат пока нельзя открыть прямо во вкладке.
                                <br/><br/>Но вы можете безопасно скачать этот файл на своё устройство и открыть его в соответствующей программе.
                            </p>
                            <a href="${objectUrl}" download="${file.name}" class="btn">СКАЧАТЬ ФАЙЛ </a>
                        </div>
                    ` : `
                        <iframe src="${objectUrl}"></iframe>
                    `}
                </body>
                </html>
            `);
            newWindow.document.close();
        } catch (e) {
            newWindow.document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#ff4d4d;font-weight:bold;font-size:20px;">Произошла ошибка при загрузке документа.</div>';
        }
    };

    // --- ЛОГИКА УПРАВЛЕНИЯ РАЗДЕЛАМИ ---
    const confirmPromptSection = () => {
        if (!promptSection.name.trim()) return;
        const newSecName = promptSection.name.trim();
        const placeholder = { id: 'doc_placeholder_' + Date.now(), section: newSecName, isDocPlaceholder: true };
        const updated = [...(urgentFiles || []), placeholder];
        void updateFilesState(updated);
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
        
        void updateFilesState(updated);
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

            const sourceHasItems = updated.some((f: any) => {
                const isDoc = f.isDocPlaceholder || !(f.id?.startsWith('deadline_') || f.isTest);
                return isDoc && (f.section?.trim() || 'Основной раздел') === sourceSection;
            });
            
            if (!sourceHasItems && sourceSection !== 'Основной раздел') {
                updated.push({ id: 'doc_placeholder_' + Date.now(), section: sourceSection, isDocPlaceholder: true });
            }
        }
        void updateFilesState(updated);
        setConfirmDelete({ isOpen: false, type: 'file', targetId: '', name: '' });
    };

    const handleMoveItem = (targetSection: string) => {
        if (!movingItem) return;
        
        const itemToMove = (urgentFiles || []).find((f: any) => f.id === movingItem);
        const sourceSection = itemToMove?.section?.trim() || 'Основной раздел';

        let updated = (urgentFiles || []).map((f: any) => f.id === movingItem ? { ...f, section: targetSection } : f);
        
        const sourceHasItems = updated.some((f: any) => {
            const isDoc = f.isDocPlaceholder || !(f.id?.startsWith('deadline_') || f.isTest);
            return isDoc && (f.section?.trim() || 'Основной раздел') === sourceSection;
        });
        
        if (!sourceHasItems && sourceSection !== 'Основной раздел') {
            updated.push({ id: 'doc_placeholder_' + Date.now(), section: sourceSection, isDocPlaceholder: true });
        }

        void updateFilesState(updated);
        setMovingItem(null);
    };

    const handleCopyItem = (targetSection: string) => {
        if (!copyingItem) return;

        const itemToCopy = (urgentFiles || []).find((file: any) => file.id === copyingItem);
        if (!itemToCopy) {
            setCopyingItem(null);
            return;
        }

        const newId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const copiedItem = {
            ...itemToCopy,
            id: newId,
            section: targetSection,
            date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
            copiedFromId: itemToCopy.id,
        };

        let updated = [...(urgentFiles || []), copiedItem];
        updated = ensureDocPlaceholderForSection(updated, targetSection);
        void updateFilesState(updated);

        if (itemToCopy.hasSeparateData) {
            fetch(`/api/storage?t=${Date.now()}&key=file_data_${itemToCopy.id}`, { cache: 'no-store' })
                .then((response) => response.json())
                .then((rawData) => saveDataToServer(`file_data_${newId}`, rawData))
                .catch((error) => console.error('Ошибка копирования данных файла', error));
        } else if (itemToCopy.data) {
            saveDataToServer(`file_data_${newId}`, itemToCopy.data).catch((error) => console.error('Ошибка копирования встроенных данных файла', error));
        }

        setCopyingItem(null);
        setSuccessModal({ show: true, title: 'Документ продублирован', text: `Файл добавлен ещё и в раздел "${targetSection}".` });
    };

    // --- ГРУППИРОВКА ФАЙЛОВ ПО РАЗДЕЛАМ ---
    const groupItems = (items: any[]) => {
        const groups: Record<string, any[]> = {};
        items.forEach((item: any) => {
            const sec = item.section?.trim() || 'Основной раздел';
            if (!groups[sec]) groups[sec] = [];
            if (!item.isDocPlaceholder) {
                groups[sec].push(item);
            }
        });
        return groups;
    };

    const docGroups = groupItems(allDocs);

    const renderLinkedPreviewContent = () => {
        if (!linkedPreview) {
            return null;
        }

        if (linkedPreview.loading) {
            return <div className="linked-document-preview-message">Подготовка документа...</div>;
        }

        if (linkedPreview.error) {
            return <div className="linked-document-preview-message" style={{ color: '#ff4d4d' }}>{linkedPreview.error}</div>;
        }

        if (linkedPreview.kind === 'docx') {
            return <iframe title={`Предпросмотр ${linkedPreview.file.name}`} srcDoc={buildDocxPreviewHtml(linkedPreview.objectUrl)} />;
        }

        if (linkedPreview.kind === 'image') {
            return <img src={linkedPreview.objectUrl} alt={linkedPreview.file.name} />;
        }

        if (linkedPreview.kind === 'video') {
            return <video src={linkedPreview.objectUrl} controls />;
        }

        if (linkedPreview.kind === 'audio') {
            return <audio src={linkedPreview.objectUrl} controls />;
        }

        if (linkedPreview.kind === 'unsupported') {
            return (
                <div className="linked-document-preview-message">
                    Этот формат нельзя надежно показать внутри браузера. Документ выбран и открыт, используйте кнопку скачивания ниже.
                </div>
            );
        }

        return <iframe title={`Предпросмотр ${linkedPreview.file.name}`} src={linkedPreview.objectUrl} />;
    };

    return (
        <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
            
            {/* БЛОК ЗАГРУЗКИ */}
            {isAdmin && (
                <div style={{ marginBottom: '40px' }}>
                    {(!selectedFiles || selectedFiles.length === 0) ? (
                        <div 
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                            style={{
                                border: isDragging ? '2px dashed #0abab5' : '2px dashed #222',
                                borderRadius: '24px', padding: '50px 20px', textAlign: 'center',
                                background: isDragging ? 'rgba(10,186,181,0.05)' : '#0d0f0d',
                                transition: 'all 0.3s ease', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                                opacity: isProcessing ? 0.5 : 1
                            }}
                            onClick={() => document.getElementById('file-upload-admin')?.click()}
                        >
                            <CustomIcon name="folder" size={48} color="#0abab5" />
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: '0 0 8px 0' }}>Загрузить документы</h3>
                                <p style={{ color: '#666', fontSize: '14px', margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>
                                    Перетащите сюда файлы (PDF, DOCX, TXT) или нажмите на это окно для выбора с устройства
                                </p>
                            </div>
                            <input type="file" multiple id="file-upload-admin" style={{ display: 'none' }} disabled={isProcessing} onChange={(e) => { if (e.target.files?.length) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]); }} />
                            <div className="hover-unified-app" style={{...adminActionBtn, padding: '12px 30px', marginTop: '10px'} as any}>ВЫБРАТЬ ФАЙЛЫ</div>
                        </div>
                    ) : (
                        <div style={{ background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0abab5', margin: 0 }}>Подготовка к загрузке</h3>
                                <div style={{ background: 'rgba(10,186,181,0.1)', color: '#0abab5', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{selectedFiles.length} файлов</div>
                            </div>

                            <div className="upload-settings-grid">
                                <div style={{ background: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a', padding: '15px', maxHeight: '200px', overflowY: 'auto' }} className="custom-scroll">
                                    {selectedFiles.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i !== selectedFiles.length - 1 ? '1px dashed #222' : 'none' }}>
                                            <CustomIcon name="attachment" size={14} color="#ccc" />
                                            <span style={{ fontSize: '13px', color: '#ccc', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                                            <span style={{ fontSize: '11px', color: '#666', flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>Папка для сохранения:</div>
                                        {!isCreatingNewUploadSection ? (
                                           <select style={adminIn as any} value={uploadSection} onChange={e => { if (e.target.value === '__NEW__') { setIsCreatingNewUploadSection(true); setNewUploadSectionName(''); } else setUploadSection(e.target.value); }}>
                                               {Array.from(new Set(['Основной раздел', ...existingDocSections])).map(sec => <option key={sec as string} value={sec as string}>{sec as string}</option>)}
                                               <option value="__NEW__" style={{background: '#1a1a1a', color: '#0abab5'}}>+ Создать новую папку...</option>
                                           </select>
                                       ) : (
                                           <div style={{ display: 'flex', gap: '8px' }}>
                                               <input autoFocus style={{ ...adminIn, flex: 1, marginBottom: 0 } as any} placeholder="Название..." value={newUploadSectionName} onChange={e => setNewUploadSectionName(e.target.value)} />
                                               <button className="hover-unified-app" onClick={() => { setUploadSection(newUploadSectionName.trim() || 'Основной раздел'); setIsCreatingNewUploadSection(false); }} style={{ background: '#0abab5', color: '#000', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: '900', cursor: 'pointer' }}>ОК</button>
                                               <button className="hover-unified-app" onClick={() => { setIsCreatingNewUploadSection(false); setUploadSection('Основной раздел'); }} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: '900', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><CustomIcon name="close" size={15} color="#fff" /></button>
                                           </div>
                                       )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                                       <button className="hover-unified-app" onClick={() => { setSelectedFiles([]); setUploadSection('Основной раздел'); setIsCreatingNewUploadSection(false); }} disabled={isProcessing} style={{ ...saveBtn, marginTop: 0, background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', flex: 1, padding: '14px' } as any}>ОТМЕНА</button>
                                       <button className="hover-unified-app" onClick={handleSaveFile} disabled={isProcessing} style={{ ...saveBtn, marginTop: 0, flex: 2, padding: '14px' } as any}>{isProcessing ? 'ОБРАБОТКА...' : 'ЗАГРУЗИТЬ'}</button>
                                   </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={flexSpace as any}>
               <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: 0 }}>Нормативные документы</h2>
               {isAdmin && (
                   <button className="hover-unified-app" onClick={() => setPromptSection({isOpen: true, name: ''})} style={adminActionBtn as any}>
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
                           <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: isSectionCollapsed(secName) ? 0 : '20px' }}>
                               <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
                                   <CustomIcon name="folder" size={22} color="#0abab5" />
                                   {secName}
                                   <SectionCollapseButton
                                       isCollapsed={isSectionCollapsed(secName)}
                                       onToggle={() => toggleSection(secName)}
                                       sectionName={secName}
                                   />
                               </h3>
                               {isAdmin && secName !== 'Основной раздел' && (
                                   <div style={{display: 'flex', gap: '15px'}}>
                                       <span className="hover-link-unified-app" onClick={() => setRenameSectionPrompt({isOpen: true, oldName: secName, newName: secName})} style={{ color: '#0abab5', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><CustomIcon name="edit" size={12} color="#0abab5" /> РЕДАКТИРОВАТЬ</span>
                                       <span className="hover-link-unified-app" onClick={() => setConfirmDelete({isOpen: true, type: 'section', targetId: secName, name: secName})} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '3px', marginBottom: '-2px'}}>
                                               <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                           </svg>
                                           УДАЛИТЬ
                                       </span>
                                   </div>
                               )}
                           </div>
                           
                           {!isSectionCollapsed(secName) && <div className="premium-cards-container section-collapsible-content">
                               {items.length === 0 ? (
                                   <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic', padding: '10px 5px' }}>
                                       В этом разделе пока нет документов...
                                   </div>
                               ) : (
                                   items.map((file: any) => (
                                       <div key={file.id} id={`document-card-${file.id}`} className="premium-card linked-document-card-target">
                                          
                                          {isAdmin && (
                                              <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                                  <div onClick={(e) => { e.stopPropagation(); setMovingItem(file.id); }} className="card-icon-btn move-btn" title="Переместить">
                                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                          <path d="M3 8L12 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      </svg>
                                                  </div>
                                                  <div onClick={(e) => { e.stopPropagation(); setCopyingItem(file.id); }} className="card-icon-btn copy-btn" title="Добавить в другой раздел">
                                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                          <rect x="9" y="9" width="11" height="11" rx="2" stroke="#0abab5" strokeWidth="2"/>
                                                          <path d="M6 15H5C3.89543 15 3 14.1046 3 13V5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V6" stroke="#0abab5" strokeWidth="2" strokeLinecap="round"/>
                                                      </svg>
                                                  </div>
                                                  <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, type: 'file', targetId: file.id, name: file.name}); }} className="card-icon-btn del-btn" title="Удалить">
                                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      </svg>
                                                  </div>
                                              </div>
                                          )}
                                          
                                          {/* Обертка с отступом, чтобы текст не лез под иконки */}
                                          <div style={{ paddingRight: isAdmin ? '85px' : '0', marginBottom: '15px' }}>
                                              <div style={{fontSize:'11px', color:'#0abab5', fontWeight:'800', marginBottom: '8px', opacity: 0.8}}>{file.date || 'Документ'}</div>
                                              
                                              <h4 style={{fontSize:'16px', margin:'0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3', display: 'flex', alignItems: 'flex-start', gap: '10px'}}>
                                                  {/* Новый премиальный векторный значок документа */}
                                                  <CustomIcon name="file" size={22} color="#0abab5" />
                                                  <span>{file.name}</span>
                                              </h4>
                                          </div>
                                          
                                          {/* Фикс скачущего текста: блок кнопок и веса прижат к низу карточки */}
                                          <div style={{ marginTop: 'auto' }}>
                                              <div style={{ color: '#555', fontSize: '12px', marginBottom: '15px', fontWeight: 'bold' }}>Вес: {file.size}</div>
                                              <div style={{ display: 'flex', gap: '10px' }}>
                                                  <button onClick={() => handleOpenPreview(file)} className="doc-action-btn">ОТКРЫТЬ</button>
                                                  <button onClick={() => handleDownloadFile(file)} className="doc-action-btn"><CustomIcon name="download" size={14} color="#0abab5" /> СКАЧАТЬ</button>
                                              </div>
                                          </div>
                                          
                                       </div>
                                   ))
                               )}
                           </div>}
                       </div>
                   ))
               )}
            </div>

            {linkedPreview && (
                <div className="linked-document-preview-overlay" onClick={closeLinkedPreview}>
                    <div className="linked-document-preview-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="linked-document-preview-header">
                            <div>
                                <strong>{linkedPreview.file.name}</strong>
                                <span>{linkedPreview.file.section?.trim() || 'Основной раздел'}</span>
                            </div>
                            <button type="button" className="linked-document-preview-close" onClick={closeLinkedPreview} aria-label="Закрыть документ" title="Закрыть">
                                <CustomIcon name="close" size={20} color="#ff4d4d" />
                            </button>
                        </div>
                        <div className="linked-document-preview-body">
                            {renderLinkedPreviewContent()}
                        </div>
                        <div className="linked-document-preview-actions">
                            <button type="button" onClick={() => handleOpenPreview(linkedPreview.file)}>ОТКРЫТЬ ОТДЕЛЬНО</button>
                            <button type="button" onClick={() => handleDownloadFile(linkedPreview.file)}>СКАЧАТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* МИНИ-ОКНА АДМИНА */}
            {promptSection.isOpen && (
                <div style={modalOverlay as any} onClick={() => setPromptSection({isOpen: false, name: ''})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900'}}>НОВЫЙ РАЗДЕЛ</h2>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название раздела</div>
                        <input style={adminIn as any} autoFocus placeholder="Например: Должностные инструкции" value={promptSection.name} onChange={e => setPromptSection({...promptSection, name: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="hover-unified-app" onClick={() => setPromptSection({isOpen: false, name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button className="hover-unified-app" onClick={confirmPromptSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОЗДАТЬ</button>
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
                            <button className="hover-unified-app" onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button className="hover-unified-app" onClick={confirmRenameSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОХРАНИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {movingItem && (
                <div style={modalOverlay as any} onClick={() => setMovingItem(null)}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>Переместить документ</h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '10px'}} className="custom-scroll">
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginLeft: '5px' }}>Выберите папку:</div>
                            {existingDocSections.map((sec: any) => (
                                <button key={sec} onClick={() => handleMoveItem(sec)} style={{...adminIn, textAlign: 'left', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #333'} as any}>{sec}</button>
                            ))}
                        </div>

                        <button className="hover-unified-app" onClick={() => setMovingItem(null)} style={{ ...saveBtn, background: '#333', color: '#fff', marginTop: '10px' } as any}>ОТМЕНА</button>
                    </div>
                </div>
            )}

            {copyingItem && (
                <div style={modalOverlay as any} onClick={() => setCopyingItem(null)}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>Добавить в другой раздел</h2>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '10px'}} className="custom-scroll">
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginLeft: '5px' }}>Выберите папку:</div>
                            {existingDocSections.map((sec: any) => (
                                <button key={`copy_${sec}`} onClick={() => handleCopyItem(sec)} style={{...adminIn, textAlign: 'left', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #333'} as any}>{sec}</button>
                            ))}
                        </div>
                        <button className="hover-unified-app" onClick={() => setCopyingItem(null)} style={{ ...saveBtn, background: '#333', color: '#fff', marginTop: '10px' } as any}>ОТМЕНА</button>
                    </div>
                </div>
            )}

            {confirmDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmDelete({isOpen: false, type: 'file', targetId: '', name: ''})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ff4d4d" strokeWidth="2"/>
                                <path d="M12 8V13" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="16" r="1" fill="#ff4d4d"/>
                            </svg>
                        </div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>УДАЛИТЬ?</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>
                            {confirmDelete.type === 'section' 
                                ? `Вы уверены, что хотите удалить весь раздел "${confirmDelete.name}" и ВСЕ документы внутри него? Это действие необратимо.` 
                                : `Удалить документ "${confirmDelete.name}" безвозвратно?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <button className="hover-unified-app" onClick={() => setConfirmDelete({isOpen: false, type: 'file', targetId: '', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>ОТМЕНА</button>
                            <button className="hover-unified-app" onClick={executeDelete} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>УДАЛИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {successModal.show && (
                <div style={modalOverlay as any} onClick={() => setSuccessModal({ show: false, title: '', text: '' })}>
                    <div style={{ ...modalContentSmall, textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px', animation: 'scaleIn 0.3s ease' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="rgba(10,186,181,0.1)" stroke="#0abab5" strokeWidth="2"/>
                                <path d="M8 12L11 15L16 9" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 style={{ color: '#0abab5', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{successModal.title}</h2>
                        <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{successModal.text}</p>
                        <button className="hover-unified-app" onClick={() => setSuccessModal({ show: false, title: '', text: '' })} style={saveBtn as any}>ПОНЯТНО</button>
                    </div>
                </div>
            )}

            {errorModal.show && (
                <div style={modalOverlay as any} onClick={() => setErrorModal({ show: false, text: '' })}>
                    <div style={{ ...modalContentSmall, textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="rgba(255,77,77,0.1)" stroke="#ff4d4d" strokeWidth="2"/>
                                <path d="M15 9L9 15M9 9L15 15" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>ОШИБКА</h2>
                        <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{errorModal.text}</p>
                        <button className="hover-unified-app" onClick={() => setErrorModal({ show: false, text: '' })} style={{ ...saveBtn, background: '#333', color: '#fff' } as any}>ПОНЯТНО</button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media (min-width: 769px) {
                    .premium-cards-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
                        gap: 20px;
                        width: 100%;
                    }
                }

                .upload-settings-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    align-items: start;
                }

                .premium-card {
                    background: #111;
                    border-radius: 16px; 
                    border: 1px solid #222;
                    transition: all 0.2s ease;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-height: 140px; 
                    padding: 20px; 
                    box-sizing: border-box; 
                    overflow: hidden;
                }

                .premium-card:hover {
                    border-color: rgba(10, 186, 181, 0.4);
                    transform: translateY(1px) scale(0.985);
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.18);
                }

                /* СТИЛИ ДЛЯ НОВЫХ КНОПОК И ИКОНОК */
                .doc-action-btn {
                    background: rgba(10,186,181,0.05);
                    color: #0abab5;
                    border: 1px solid rgba(10,186,181,0.3);
                    border-radius: 10px;
                    padding: 10px 0;
                    font-size: 11px;
                    font-weight: 900;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    flex: 1;
                    text-align: center;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                .doc-action-btn:hover {
                    background: rgba(10,186,181,0.14);
                    border-color: rgba(10,186,181,0.45);
                    color: #fff;
                    transform: translateY(1px) scale(0.985);
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2);
                }

                .card-icon-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 1px solid #333;
                    background: #1a1a1a;
                }
                .move-btn { color: #fff; }
                .move-btn:hover { background: rgba(10,186,181,0.14); border-color: rgba(10,186,181,0.45); color: #fff; transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2); }

                .copy-btn { color: #0abab5; }
                .copy-btn:hover { background: rgba(10,186,181,0.14); border-color: rgba(10,186,181,0.45); color: #fff; transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2); }

                .del-btn { color: #ff4d4d; }
                .del-btn:hover { background: rgba(10,186,181,0.14); border-color: rgba(10,186,181,0.45); color: #fff; transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2); }

                @media (max-width: 768px) {
                    .upload-settings-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .premium-cards-container { 
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 15px !important; 
                    }
                }
            `}</style>
        </section>
    );
}

// --- СТИЛИ ---
const flexSpace = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };
const adminActionBtn = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 18px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)', padding: '20px', boxSizing: 'border-box' };
const modalContentSmall = { background: '#111', padding: '40px 30px', borderRadius: '30px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const adminIn = { width: '100%', padding: '16px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', marginBottom: '0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const saveBtn = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '25px', fontSize: '15px', letterSpacing: '1px' };
