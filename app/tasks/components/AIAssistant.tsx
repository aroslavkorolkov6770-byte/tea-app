"use client";
import React, { useState, useEffect, useRef } from 'react';
import CustomIcon from '@/app/components/CustomIcon';
import { isClientAdminView } from '@/app/lib/authClient';
import { fetchStorageBatch } from '@/app/lib/storageClient';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
    isPinned?: boolean; 
}

type SiteSearchRecord = {
    id: string;
    type: 'route' | 'test' | 'assortment' | 'product' | 'document';
    title: string;
    section: string;
    text: string;
    hint?: string;
};

const SITE_CONTEXT_CACHE_KEY = 'th_ai_site_context_v2';
const SITE_CONTEXT_CACHE_TTL_MS = 1000 * 60;

const normalizeSearchValue = (value: unknown) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

const buildAssortmentRecords = (nodes: any[], bucket: SiteSearchRecord[] = [], parentTrail: string[] = []) => {
    nodes.forEach((node: any) => {
        if (!node) {
            return;
        }

        const title = String(node.title || '').trim();
        const desc = String(node.desc || '').trim();
        const content = String(node.content || '').trim();
        const trail = [...parentTrail, title].filter(Boolean);

        if (title || desc || content) {
            bucket.push({
                id: String(node.id || `assortment_${bucket.length}`),
                type: 'assortment',
                title: title || 'Раздел ассортимента',
                section: trail.slice(0, -1).join(' -> ') || 'Ассортимент',
                text: [title, desc, content].filter(Boolean).join(' | '),
                hint: node.id ? `/tasks?tab=assortment&assortmentId=${node.id}` : '/tasks?tab=assortment',
            });
        }

        if (Array.isArray(node.children) && node.children.length > 0) {
            buildAssortmentRecords(node.children, bucket, trail);
        }
    });

    return bucket;
};

const buildSiteKnowledgeIndex = (siteData: Record<string, any>) => {
    const records: SiteSearchRecord[] = [];

    const routes = Array.isArray(siteData.tea_hub_dynamic_route_v2) ? siteData.tea_hub_dynamic_route_v2 : [];
    routes.forEach((route: any) => {
        if (route?.isPlaceholder) {
            return;
        }

        records.push({
            id: String(route.id || `route_${records.length}`),
            type: 'route',
            title: String(route.title || 'Тема без названия'),
            section: String(route.section || 'Обучение'),
            text: [
                route.title,
                route.h1,
                route.t1,
                route.h2,
                route.t2,
                route.h3,
                route.t3,
                route.videoDesc,
            ].filter(Boolean).join(' | '),
            hint: route.id ? `/tasks?tab=edu&routeId=${route.id}` : '/tasks?tab=edu',
        });
    });

    const tests = Array.isArray(siteData.tea_hub_dynamic_tests_v1) ? siteData.tea_hub_dynamic_tests_v1 : [];
    tests.forEach((test: any) => {
        if (test?.isPlaceholder) {
            return;
        }

        records.push({
            id: String(test.id || `test_${records.length}`),
            type: 'test',
            title: String(test.title || 'Тест без названия'),
            section: String(test.section || 'Тестирование'),
            text: [
                test.title,
                test.subtitle,
                test.theory,
                ...(Array.isArray(test.quiz) ? test.quiz.flatMap((item: any) => [item?.q, ...(Array.isArray(item?.o) ? item.o : [])]) : []),
            ].filter(Boolean).join(' | '),
            hint: test.id ? `/tasks?tab=edu&testId=${test.id}` : '/tasks?tab=edu',
        });
    });

    const assortment = Array.isArray(siteData.tea_hub_assortment_matrix_v2) ? siteData.tea_hub_assortment_matrix_v2 : [];
    buildAssortmentRecords(assortment, records);

    const products = Array.isArray(siteData.tea_hub_products_v1) ? siteData.tea_hub_products_v1 : [];
    products.forEach((product: any) => {
        records.push({
            id: String(product.id || `product_${records.length}`),
            type: 'product',
            title: String(product.name || 'Товар без названия'),
            section: String(product.category || 'Продукты'),
            text: [
                product.name,
                product.code,
                product.category,
                product.subcategory,
                product.groupPath,
                product.priority ? `Приоритет ${product.priority}` : '',
                product.desc,
                product.isHit ? 'Обязательно к продаже' : '',
            ].filter(Boolean).join(' | '),
            hint: `/tasks?tab=products&productId=${encodeURIComponent(product.id || product.code || product.name || '')}`,
        });
    });

    const documents = Array.isArray(siteData.tea_hub_urgent_files_v1) ? siteData.tea_hub_urgent_files_v1 : [];
    documents.forEach((file: any) => {
        if (file?.isTest || String(file?.id || '').startsWith('deadline_')) {
            return;
        }

        records.push({
            id: String(file.id || `document_${records.length}`),
            type: 'document',
            title: String(file.name || file.section || 'Документ'),
            section: String(file.section || 'База документов'),
            text: [
                file.name,
                file.section,
                file.size,
                file.date,
                file.isDocPlaceholder ? 'Раздел документов' : 'Документ',
            ].filter(Boolean).join(' | '),
            hint: '/tasks?tab=docs',
        });
    });

    return records;
};

const rankSiteRecords = (records: SiteSearchRecord[], query: string) => {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) {
        return records.slice(0, 12);
    }

    const words = normalizedQuery.split(' ').filter(Boolean);

    return records
        .map((record) => {
            const haystack = normalizeSearchValue(`${record.title} ${record.section} ${record.text}`);
            let score = 0;

            if (haystack.includes(normalizedQuery)) {
                score += 10;
            }

            words.forEach((word) => {
                if (!word) {
                    return;
                }

                if (normalizeSearchValue(record.title).includes(word)) {
                    score += 5;
                }

                if (normalizeSearchValue(record.section).includes(word)) {
                    score += 3;
                }

                if (haystack.includes(word)) {
                    score += 2;
                }
            });

            return { record, score };
        })
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 18)
        .map((item) => item.record);
};

const buildSiteContextPrompt = (records: SiteSearchRecord[], query: string) => {
    const scopedResults = rankSiteRecords(records, query);
    const countsByType = records.reduce<Record<string, number>>((acc, record) => {
        acc[record.type] = (acc[record.type] || 0) + 1;
        return acc;
    }, {});

    const overview = [
        `Обучение: ${countsByType.route || 0}`,
        `Тесты: ${countsByType.test || 0}`,
        `Ассортимент: ${countsByType.assortment || 0}`,
        `Продукты: ${countsByType.product || 0}`,
        `Документы: ${countsByType.document || 0}`,
    ].join(', ');

    const lines = scopedResults.map((record, index) => {
        return `${index + 1}. [${record.type.toUpperCase()}] ${record.title} | Раздел: ${record.section} | Данные: ${record.text}${record.hint ? ` | Ссылка: ${record.hint}` : ''}`;
    });

    return [
        '=== ВНУТРЕННИЙ ПОИСК ПО ВСЕЙ ПЛАТФОРМЕ ВАТЭС ===',
        `Общий охват данных: ${overview}.`,
        scopedResults.length > 0
            ? `Найдено релевантных совпадений по запросу "${query}":\n${lines.join('\n')}`
            : `По прямому совпадению для запроса "${query}" ничего не найдено. Используй общий охват сайта и дай честный ответ, если в данных нет нужной информации.`,
        'Правило ответа: опирайся только на найденные данные сайта. Если информации не хватает, скажи это прямо и предложи, где искать дальше на сайте.',
        '=== КОНЕЦ ВНУТРЕННЕГО ПОИСКА ===',
    ].join('\n');
};

export default function AIAssistant({ userId, isAdmin }: { userId?: string, isAdmin?: boolean }) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
    const [historyQuery, setHistoryQuery] = useState("");
    
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const siteKnowledgeCacheRef = useRef<SiteSearchRecord[] | null>(null);

    // =========================================================================
    // ОПРЕДЕЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (АДМИН - 100% ПРИОРИТЕТ)
    // =========================================================================
    useEffect(() => {
        const determineUser = () => {
            const storedUserId = localStorage.getItem('current_user_id') || localStorage.getItem('login') || localStorage.getItem('userId');
            const isSystemAccount = localStorage.getItem('is_system_account') === 'true';

            if (isSystemAccount) {
                const normalizedSystemId = String(userId || storedUserId || 'system').replace(/[^a-zA-Z0-9_-]/g, '_');
                return `system_admin_${normalizedSystemId}`;
            }

            if (isAdmin === true || isClientAdminView() || userId === 'admin') {
                return 'admin_master'; 
            }

            if (userId && userId !== 'guest' && userId.trim() !== '') {
                return 'emp_' + String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
            }

            let foundId = storedUserId;
            if (foundId && foundId !== 'guest' && foundId !== 'null') {
                return 'emp_' + String(foundId).replace(/[^a-zA-Z0-9_-]/g, '_');
            }

            let guestId = localStorage.getItem('th_stable_guest_id');
            if (!guestId) {
                guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('th_stable_guest_id', guestId);
            }
            return guestId;
        };

        const activeUser = determineUser();
        setCurrentUserId(activeUser);

        const loadHistory = async () => {
            let serverDataFound = false;
            try {
                const res = await fetch(`/api/storage?key=th_ai_history_${activeUser}&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setSessions(data);
                        setActiveSessionId(data[0].id);
                        serverDataFound = true;
                    }
                }
            } catch (e) {
                console.warn("Сервер недоступен, читаем из памяти");
            }

            if (!serverDataFound) {
                const savedSessions = localStorage.getItem(`th_ai_history_${activeUser}`);
                if (savedSessions) {
                    try {
                        const parsed = JSON.parse(savedSessions);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setSessions(parsed);
                            setActiveSessionId(parsed[0].id);
                        }
                    } catch(e) {}
                }
            }
        };

        loadHistory();
    }, [userId, isAdmin]); 

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId, isTyping]);

    useEffect(() => {
        if (!showClearConfirm) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowClearConfirm(false);
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [showClearConfirm]);

    const loadSiteKnowledge = async () => {
        if (siteKnowledgeCacheRef.current) {
            return siteKnowledgeCacheRef.current;
        }

        const now = Date.now();

        try {
            const cachedRaw = localStorage.getItem(SITE_CONTEXT_CACHE_KEY);
            if (cachedRaw) {
                const cached = JSON.parse(cachedRaw);
                if (cached?.expiresAt > now && Array.isArray(cached?.records)) {
                    siteKnowledgeCacheRef.current = cached.records;
                    return cached.records as SiteSearchRecord[];
                }
            }
        } catch (error) {
            console.warn('Не удалось прочитать кеш контекста сайта', error);
        }

        const storageData = await fetchStorageBatch([
            'tea_hub_dynamic_route_v2',
            'tea_hub_dynamic_tests_v1',
            'tea_hub_assortment_matrix_v2',
            'tea_hub_products_v1',
            'tea_hub_urgent_files_v1',
        ]);

        const builtRecords = buildSiteKnowledgeIndex(storageData);
        siteKnowledgeCacheRef.current = builtRecords;

        try {
            localStorage.setItem(SITE_CONTEXT_CACHE_KEY, JSON.stringify({
                expiresAt: now + SITE_CONTEXT_CACHE_TTL_MS,
                records: builtRecords,
            }));
        } catch (error) {
            console.warn('Не удалось сохранить кеш контекста сайта', error);
        }

        return builtRecords;
    };

    const saveSessions = (newSessions: ChatSession[]) => {
        setSessions(newSessions);
        if (!currentUserId) return;

        localStorage.setItem(`th_ai_history_${currentUserId}`, JSON.stringify(newSessions));
        
        fetch('/api/storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: `th_ai_history_${currentUserId}`,
                data: newSessions 
            })
        }).catch(err => console.error("Ошибка сохранения на сервер", err));
    };

    const focusComposer = () => {
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    const createNewSession = () => {
        const existingEmptySession = sessions.find((session) => session.messages.length === 0);

        if (existingEmptySession) {
            setActiveSessionId(existingEmptySession.id);
            setHistoryQuery("");
            setIsMobileHistoryOpen(false);
            focusComposer();
            return;
        }

        const newSession: ChatSession = {
            id: `chat_${Date.now()}`,
            title: "Новый диалог",
            messages: [],
            updatedAt: Date.now()
        };
        saveSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
        setHistoryQuery("");
        setIsMobileHistoryOpen(false);
        focusComposer();
    };

    const clearHistory = () => {
        saveSessions([]);
        setActiveSessionId(null);
        setShowClearConfirm(false);
        setIsMobileHistoryOpen(false);
    };

    const deleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); 
        const filtered = sessions.filter((s: ChatSession) => s.id !== sessionId);
        saveSessions(filtered);
        
        if (activeSessionId === sessionId) {
            setActiveSessionId(filtered.length > 0 ? sortedSessions.filter(s => s.id !== sessionId)[0]?.id || null : null);
        }
    };

    const togglePin = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = sessions.map(s => s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s);
        saveSessions(updated);
    };

    const sortedSessions = [...sessions].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
    });

    const normalizedHistoryQuery = normalizeSearchValue(historyQuery);
    const visibleSessions = sortedSessions.filter((session) => {
        if (!normalizedHistoryQuery) {
            return true;
        }

        return normalizeSearchValue(`${session.title} ${session.messages.map((message) => message.content).join(' ')}`).includes(normalizedHistoryQuery);
    });

    const formatMessageCount = (count: number) => {
        const lastTwoDigits = count % 100;
        const lastDigit = count % 10;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            return `${count} сообщений`;
        }

        if (lastDigit === 1) {
            return `${count} сообщение`;
        }

        if (lastDigit >= 2 && lastDigit <= 4) {
            return `${count} сообщения`;
        }

        return `${count} сообщений`;
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !currentUserId || isTyping) return;

        let currentActiveId = activeSessionId;
        let currentSessions = [...sessions];

        if (!currentActiveId || currentSessions.length === 0) {
            const newSession: ChatSession = {
                id: `chat_${Date.now()}`,
                title: text.slice(0, 25) + "...",
                messages: [],
                updatedAt: Date.now()
            };
            currentSessions = [newSession, ...currentSessions];
            currentActiveId = newSession.id;
            setActiveSessionId(currentActiveId);
        }

        const userMsg: Message = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        let updatedSessions = currentSessions.map((s: ChatSession) => {
            if (s.id === currentActiveId) {
                const newTitle = s.messages.length === 0 ? text.slice(0, 25) + "..." : s.title;
                return { ...s, title: newTitle, messages: [...s.messages, userMsg], updatedAt: Date.now() };
            }
            return s;
        }); 

        saveSessions(updatedSessions);
        setInputValue("");
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
        setIsTyping(true);

        try {
            const routeCache = JSON.parse(localStorage.getItem('th_cache_route') || '[]');
            const testsCache = JSON.parse(localStorage.getItem('th_cache_tests') || '[]');
            
            let siteContext = "";
            if (routeCache.length > 0 || testsCache.length > 0) {
                siteContext += "=== СЕКРЕТНЫЙ КОНТЕКСТ (БАЗА ЗНАНИЙ КОМПАНИИ ИЗ ПАНЕЛИ АДМИНА) ===\n";
                
                if (routeCache.length > 0) {
                    siteContext += "РАЗДЕЛ 'ТЕОРИЯ' (Сгруппировано по папкам):\n";
                    const routeGroups: Record<string, any[]> = {};
                    routeCache.forEach((route: any) => {
                        const sec = route.section?.trim() || 'Основной раздел';
                        if (!routeGroups[sec]) routeGroups[sec] = [];
                        if (!route.isPlaceholder) routeGroups[sec].push(route);
                    });

                    Object.entries(routeGroups).forEach(([secName, items]) => {
                        siteContext += `\nПАПКА: "${secName}"\n`;
                        items.forEach((route: any, idx: number) => {
                            siteContext += `  - Урок ${idx + 1}: ${route.title} (ID: ${route.id})\n`;
                            
                            // ИСПРАВЛЕНИЕ: Теперь ИИ видит описание видеоуроков
                            if (route.mediaType === 'video') {
                                if (route.videoDesc) siteContext += `    * Описание видео: ${route.videoDesc}\n`;
                            } else {
                                if (route.h1) siteContext += `    * ${route.h1}: ${route.t1}\n`;
                                if (route.h2) siteContext += `    * ${route.h2}: ${route.t2}\n`;
                                if (route.h3) siteContext += `    * ${route.h3}: ${route.t3}\n`;
                            }
                        });
                    });
                }
                
                if (testsCache.length > 0) {
                    siteContext += "\nРАЗДЕЛ 'ТЕСТЫ' (Сгруппировано по папкам):\n";
                    const testGroups: Record<string, any[]> = {};
                    testsCache.forEach((test: any) => {
                        const sec = test.section?.trim() || 'Основной раздел';
                        if (!testGroups[sec]) testGroups[sec] = [];
                        if (!test.isPlaceholder) testGroups[sec].push(test);
                    });

                    Object.entries(testGroups).forEach(([secName, items]) => {
                        siteContext += `\nПАПКА: "${secName}"\n`;
                        items.forEach((test: any, idx: number) => {
                            siteContext += `  - Тест ${idx + 1}: ${test.title} (${test.subtitle}). База: ${test.theory}\n`;
                        });
                    });
                }
                
                siteContext += "\n=== КОНЕЦ БАЗЫ ЗНАНИЙ ===\n";
                
                siteContext += "ВАЖНОЕ ПРАВИЛО НАВИГАЦИИ ПО УРОКАМ: Все уроки и тесты сгруппированы по папкам (разделам). Нумерация (Урок 1, Урок 2) начинается ЗАНОВО внутри каждой папки! Если пользователь просит 'Включи урок 1' или 'Расскажи первую тему', ты должен ОБЯЗАТЕЛЬНО понять из контекста или переспросить: 'Урок 1 из какого раздела (папки) вас интересует?'.\nОпирайся СТРОГО на этот текст.\n\n";
            }

            try {
                const siteRecords = await loadSiteKnowledge();
                siteContext += `${buildSiteContextPrompt(siteRecords, text)}\n\n`;
            } catch (contextError) {
                console.warn('Не удалось загрузить глобальный контекст сайта для ИИ', contextError);
            }

            const currentSession = updatedSessions.find((s: ChatSession) => s.id === currentActiveId);
            
            const apiMessages = currentSession ? currentSession.messages.map((m, index) => {
                let finalContent = m.content;
                if (index === currentSession.messages.length - 1 && m.role === 'user') {
                    finalContent = `${siteContext}ВОПРОС ПОЛЬЗОВАТЕЛЯ:\n${m.content}`;
                }
                return { role: m.role === 'ai' ? 'assistant' : 'user', content: finalContent };
            }) : [];

            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });

            const data = await response.json();

            // ИСПРАВЛЕНИЕ: Перехват ошибки о закончившихся токенах (внутри ответа 200 OK)
            if (data.error) {
                const errStr = JSON.stringify(data.error).toLowerCase();
                if (errStr.includes('quota') || errStr.includes('token') || errStr.includes('limit') || errStr.includes('баланс') || errStr.includes('429')) {
                    throw new Error("TOKEN_LIMIT_EXCEEDED");
                }
                throw new Error(JSON.stringify(data.error));
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);

            let aiText = "";
            if (Array.isArray(data.output)) {
                const msgObj = data.output.find((o: any) => o.type === 'message' && o.content);
                if (msgObj && Array.isArray(msgObj.content) && msgObj.content[0]?.text) {
                    aiText = msgObj.content[0].text;
                }
            }
            
            if (!aiText) {
                aiText = data.output_text || data.text || data.message?.text || data.message?.content?.text || data.choices?.[0]?.message?.content;
            }

            if (!aiText) {
                aiText = `СЫРОЙ ОТВЕТ ЯНДЕКСА:\n${JSON.stringify(data, null, 2)}`;
            }

            const aiMsg: Message = {
                id: `msg_${Date.now() + 1}`,
                role: 'ai',
                content: aiText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const finalSessions = updatedSessions.map((s: ChatSession) => 
                s.id === currentActiveId ? { ...s, messages: [...s.messages, aiMsg] } : s
            );
            saveSessions(finalSessions);

        } catch (error: any) {
            console.error("ОШИБКА:", error);

            let displayError = `СИСТЕМНАЯ ОШИБКА:\n\n${error.message}`;
            const errStr = error.message?.toLowerCase() || '';
            
            // ИСПРАВЛЕНИЕ: Перехват системной ошибки о токенах
            if (errStr.includes('token') || errStr.includes('quota') || errStr.includes('429') || errStr.includes('402') || errStr.includes('limit') || errStr.includes('баланс') || errStr.includes('too many requests')) {
                displayError = "Токены закончились, просьба обратиться к администратору.";
            }

            const errorMsg: Message = {
                id: `msg_${Date.now() + 1}`, role: 'ai',
                content: displayError,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            const finalSessions = updatedSessions.map((s: ChatSession) => 
                s.id === currentActiveId ? { ...s, messages: [...s.messages, errorMsg] } : s
            );
            saveSessions(finalSessions);
        } finally {
            setIsTyping(false); 
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    const activeSession = sessions.find((s: ChatSession) => s.id === activeSessionId);

    if (!currentUserId) {
        return null;
    }

    return (
        <section className="ai-monolithic-section">
            <header className="vates-page-heading vates-ai-heading">
                <div>
                    <span className="vates-eyebrow">Ватэс AI</span>
                    <h1>AI-ассистент</h1>
                    <p>Быстрые ответы по регламентам, обучению, документам и товарной базе компании.</p>
                </div>
            </header>

            <div className="ai-monolithic-container">
                {isMobileHistoryOpen && (
                    <button
                        type="button"
                        className="ai-mobile-overlay"
                        aria-label="Закрыть историю диалогов"
                        onClick={() => setIsMobileHistoryOpen(false)}
                    />
                )}

                <aside className={`ai-sidebar custom-scroll ${isMobileHistoryOpen ? 'open' : ''}`}>
                    <div className="ai-sidebar-create">
                        <div className="ai-sidebar-heading">
                            <strong>История</strong>
                        </div>

                        <button
                            type="button"
                            className="hover-unified-app ai-new-session-button"
                            onClick={createNewSession}
                        >
                            <CustomIcon name="chat" size={17} color="currentColor" accent="none" />
                            Новый чат
                        </button>

                        {sessions.length > 0 && (
                            <label className="ai-history-search">
                                <span className="ai-history-search-icon" aria-hidden="true" />
                                <input
                                    type="search"
                                    value={historyQuery}
                                    onChange={(event) => setHistoryQuery(event.target.value)}
                                    placeholder="Поиск"
                                    aria-label="Поиск по истории диалогов"
                                />
                            </label>
                        )}
                    </div>

                    <div className="ai-sidebar-history custom-scroll">
                        {visibleSessions.length === 0 ? (
                            <div className="ai-history-empty">
                                <strong>{sessions.length === 0 ? 'Диалогов пока нет' : 'Ничего не найдено'}</strong>
                                <p>{sessions.length === 0 ? 'Задайте первый вопрос — чат появится здесь.' : 'Измените поисковый запрос.'}</p>
                            </div>
                        ) : (
                            visibleSessions.map((session: ChatSession) => (
                                <div key={session.id} className={`ai-session-item ${activeSessionId === session.id ? 'active' : ''}`}>
                                    <button
                                        type="button"
                                        className="ai-session-select"
                                        onClick={() => {
                                            setActiveSessionId(session.id);
                                            setIsMobileHistoryOpen(false);
                                            focusComposer();
                                        }}
                                    >
                                        <span className="ai-session-icon">
                                            <CustomIcon name={session.isPinned ? 'star' : 'chat'} size={16} color="currentColor" accent="none" />
                                        </span>
                                        <span className="ai-session-copy">
                                            <strong className="ai-session-title">{session.title}</strong>
                                            <small>{formatMessageCount(session.messages.length)} · {new Date(session.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</small>
                                        </span>
                                    </button>

                                    <div className={`ai-session-actions ${session.isPinned ? 'pinned' : ''}`}>
                                        <button
                                            type="button"
                                            className={`ai-pin-btn ${session.isPinned ? 'active' : ''}`}
                                            onClick={(event) => togglePin(session.id, event)}
                                            title={session.isPinned ? 'Открепить' : 'Закрепить'}
                                            aria-label={session.isPinned ? 'Открепить диалог' : 'Закрепить диалог'}
                                        >
                                            <CustomIcon name="star" size={15} color="currentColor" accent="none" />
                                        </button>
                                        <button
                                            type="button"
                                            className="ai-session-del-btn"
                                            onClick={(event) => deleteSession(session.id, event)}
                                            title="Удалить диалог"
                                            aria-label="Удалить диалог"
                                        >
                                            <CustomIcon name="close" size={15} color="currentColor" accent="none" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {sessions.length > 0 && (
                        <div className="ai-sidebar-clear">
                            <button
                                type="button"
                                className="hover-unified-app ai-clear-history-button"
                                onClick={() => setShowClearConfirm(true)}
                            >
                                Очистить историю
                            </button>
                        </div>
                    )}
                </aside>

                <div className="ai-chat-area">
                    <header className="ai-chat-toolbar">
                        <button type="button" onClick={() => setIsMobileHistoryOpen(true)} className="ai-history-btn">
                            <CustomIcon name="chat" size={16} color="currentColor" accent="none" />
                            История
                        </button>

                        <div className="ai-active-dialog">
                            <strong>{activeSession?.title || 'Новый чат'}</strong>
                        </div>
                    </header>

                    <div className="ai-messages custom-scroll" ref={chatContainerRef}>
                        {activeSession && activeSession.messages.length > 0 && (
                            activeSession.messages.map((message: Message) => (
                                <div key={message.id} className={`ai-message-row ${message.role}`}>
                                    <div className={`ai-avatar ${message.role}`}>
                                        <CustomIcon
                                            name={message.role === 'user' ? 'user' : 'brain'}
                                            size={18}
                                            color="currentColor"
                                            accent="none"
                                        />
                                    </div>
                                    <div className="ai-message-body">
                                        <div className={`ai-bubble ${message.role} ${message.content.includes('СИСТЕМНАЯ ОШИБКА') || message.content.includes('СЫРОЙ ОТВЕТ') ? 'is-error' : ''}`}>
                                            {message.content}
                                        </div>
                                        <time>{message.timestamp}</time>
                                    </div>
                                </div>
                            ))
                        )}

                        {isTyping && (
                            <div className="ai-message-row ai">
                                <div className="ai-avatar ai">
                                    <CustomIcon name="brain" size={18} color="currentColor" accent="none" />
                                </div>
                                <div className="ai-message-body">
                                    <div className="ai-bubble ai ai-typing-bubble">
                                        <div className="typing-indicator"><span /><span /><span /></div>
                                    </div>
                                    <time>Формирует ответ</time>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ai-input-wrapper">
                        <div className="ai-input-box">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(event) => {
                                    setInputValue(event.target.value);
                                    event.currentTarget.style.height = 'auto';
                                    event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 144)}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Напишите сообщение..."
                                aria-label="Вопрос для AI-ассистента"
                                className="custom-scroll ai-textarea"
                                rows={1}
                            />
                            <button
                                type="button"
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                                className="ai-send-btn"
                                aria-label="Отправить вопрос"
                            >
                                <CustomIcon name="send" size={19} color="currentColor" accent="none" />
                                <span>Отправить</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showClearConfirm && (
                <div className="ai-confirm-overlay" role="presentation" onClick={() => setShowClearConfirm(false)}>
                    <section className="ai-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-clear-history-title" onClick={(event) => event.stopPropagation()}>
                        <span className="ai-confirm-icon"><CustomIcon name="alert" size={30} color="currentColor" /></span>
                        <span className="vates-eyebrow">Необратимое действие</span>
                        <h2 id="ai-clear-history-title">Удалить всю историю?</h2>
                        <p>Все диалоги AI-ассистента будут удалены. Восстановить их после подтверждения не получится.</p>
                        <div className="ai-confirm-actions">
                            <button type="button" className="vates-button secondary" onClick={() => setShowClearConfirm(false)}>Отмена</button>
                            <button type="button" className="vates-button danger" onClick={clearHistory}>Удалить историю</button>
                        </div>
                    </section>
                </div>
            )}

            <style jsx global>{`
                .ai-monolithic-section { margin: -20px -60px -60px -60px; height: calc(100vh - 100px); display: flex; flex-direction: column; }
                .ai-monolithic-container { display: flex; flex: 1; background: transparent; height: 100%; }
                .ai-sidebar { width: 300px; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; background: transparent; transition: 0.3s ease; }
                .ai-session-item { position: relative; padding: 14px 15px; margin-bottom: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; }
                .ai-session-item.active { background: #1a1a1a; border-color: #333; }
                .ai-session-item:hover { border-color: #ff4d4d !important; box-shadow: 0 0 10px rgba(255, 77, 77, 0.15); background: rgba(255, 77, 77, 0.02); }
                .ai-session-title { color: #aaa; font-size: 14px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; padding-right: 10px; }
                .ai-session-item.active .ai-session-title { color: #0abab5; }
                
                .ai-session-actions { display: flex; align-items: center; gap: 8px; opacity: 0; transition: opacity 0.2s ease; }
                .ai-session-item:hover .ai-session-actions { opacity: 1; }
                .ai-session-actions.pinned { opacity: 1; }

                .ai-pin-btn { background: transparent; border: none; cursor: pointer; color: #555; transition: all 0.2s ease; padding: 2px; display: flex; align-items: center; justify-content: center; }
                .ai-pin-btn:hover { color: #ffd700; transform: scale(1.15); }
                .ai-pin-btn.active { color: #ffd700; }

                .ai-session-del-btn { background: transparent; border: none; color: #ff4d4d; cursor: pointer; transition: transform 0.1s ease, color 0.2s ease; padding: 2px; display: flex; align-items: center; justify-content: center; }
                .ai-session-del-btn:hover { color: #ff1a1a; }
                .ai-session-del-btn:active { transform: scale(0.85); } 

                .ai-chat-area { flex: 1; display: flex; flex-direction: column; background: transparent; position: relative; }
                .ai-mobile-header { display: none; }
                .ai-messages { flex: 1; overflow-y: auto; padding: 40px; display: flex; flex-direction: column; }
                .ai-empty-state { margin: auto; text-align: center; max-width: 550px; }
                .quick-prompts-container { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
                .quick-prompt { background: #111; border: 1px solid #222; padding: 12px 18px; border-radius: 20px; color: #0abab5; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .quick-prompt:hover { background: rgba(10,186,181,0.05); border-color: #0abab5; transform: translateY(-2px); }
                .ai-avatar { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px; }
                .ai-avatar.user { background: #0abab5; color: #000; }
                .ai-avatar.ai { background: #161816; border: 1px solid #333; }
                .ai-bubble { padding: 16px 22px; border-radius: 20px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
                .ai-bubble.user { background: rgba(10,186,181,0.1); border: 1px solid rgba(10,186,181,0.3); color: #fff; border-bottom-right-radius: 6px; }
                .ai-bubble.ai { background: #111; border: 1px solid #222; color: #ddd; border-bottom-left-radius: 6px; }
                .ai-input-wrapper { padding: 20px 40px 30px 40px; background: transparent; }
                .ai-input-box { position: relative; display: flex; align-items: flex-end; background: #111; border: 1px solid #222; border-radius: 24px; padding: 6px; transition: 0.2s; }
                .ai-input-box:focus-within { border-color: #0abab5; box-shadow: 0 0 15px rgba(10,186,181,0.1); }
                .ai-textarea { flex: 1; background: transparent; border: none; color: #fff; padding: 16px 20px; font-size: 16px; outline: none; resize: none; max-height: 150px; min-height: 56px; font-family: inherit; }
                .ai-send-btn { margin: 8px; width: 44px; height: 44px; border-radius: 16px; border: none; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .ai-send-btn:not(:disabled) { background: #0abab5; color: #000; cursor: pointer; }
                .ai-send-btn:not(:disabled):hover { transform: scale(1.05); }
                .ai-send-btn:disabled { background: #1a1a1a; color: #555; cursor: not-allowed; }
                .ai-footer-text { text-align: center; font-size: 12px; color: #555; margin-top: 12px; }
                .typing-indicator { display: flex; gap: 4px; padding: 2px 0; }
                .typing-indicator span { width: 8px; height: 8px; background: #0abab5; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                .ai-mobile-overlay { display: none; }
                @media (max-width: 768px) {
                    .ai-monolithic-section { margin: -10px -15px -50px -15px; height: calc(100vh - 70px); }
                    .ai-mobile-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #1a1a1a; background: #0a0a0a; }
                    .ai-history-btn { display: inline-flex; align-items: center; gap: 8px; background: rgba(10,186,181,0.1); color: #0abab5; border: 1px solid rgba(10,186,181,0.3); padding: 8px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s ease; }
                    .ai-history-btn:hover { transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10, 186, 181, 0.24); background: rgba(10,186,181,0.14); border-color: rgba(10,186,181,0.45); color: #fff; }
                    .ai-history-btn:active { transform: translateY(2px) scale(0.97); box-shadow: inset 0 3px 8px rgba(0,0,0,0.24); }
                    .ai-sidebar { position: fixed; top: 0; left: -300px; width: 280px !important; height: 100vh; background: #000; z-index: 10006; box-shadow: 10px 0 30px rgba(0,0,0,0.8); }
                    .ai-sidebar.open { left: 0; }
                    .ai-mobile-overlay { display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10005; backdrop-filter: blur(4px); }
                    .ai-messages { padding: 20px 15px; }
                    .ai-input-wrapper { padding: 15px; }
                    .quick-prompt { font-size: 13px; padding: 10px 14px; }
                    .ai-bubble { font-size: 14px; padding: 12px 16px; }
                }
            `}</style>
        </section>
    );
}
