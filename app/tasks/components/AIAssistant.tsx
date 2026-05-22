"use client";
import React, { useState, useEffect, useRef } from 'react';

// --- ТИПЫ ДАННЫХ ДЛЯ ЧАТА ---
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
}

export default function AIAssistant({ userId }: { userId?: string }) {
    // --- СОСТОЯНИЯ ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    
    // Состояние для мобильной шторки истории
    const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const currentUserId = userId || 'guest';

    // --- БЫСТРЫЕ ПОДСКАЗКИ (CHIPS) ---
    const quickPrompts = [
        "Как правильно заваривать Те Гуань Инь?",
        "Что делать, если сломалась кофемашина?",
        "Какой штраф за опоздание на смену?",
        "Сценарий общения, если гость грубит"
    ];

    // --- ЗАГРУЗКА ИСТОРИИ ИЗ LOCALSTORAGE (Имитация БД) ---
    useEffect(() => {
        const savedSessions = localStorage.getItem(`th_ai_history_${currentUserId}`);
        if (savedSessions) {
            const parsed = JSON.parse(savedSessions);
            setSessions(parsed);
            if (parsed.length > 0) {
                setActiveSessionId(parsed[0].id);
            }
        } else {
            createNewSession();
        }
    }, [currentUserId]);

    // --- ИСПРАВЛЕННЫЙ АВТОСКРОЛЛ (Без прыжков страницы) ---
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId, isTyping]);

    // --- ФУНКЦИИ УПРАВЛЕНИЯ СЕССИЯМИ ---
    const saveSessions = (newSessions: ChatSession[]) => {
        setSessions(newSessions);
        localStorage.setItem(`th_ai_history_${currentUserId}`, JSON.stringify(newSessions));
    };

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: `chat_${Date.now()}`,
            title: "Новый диалог",
            messages: [],
            updatedAt: Date.now()
        };
        saveSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
        setIsMobileHistoryOpen(false); // закрываем шторку на мобильных при создании нового
    };

    const clearHistory = () => {
        localStorage.removeItem(`th_ai_history_${currentUserId}`);
        setSessions([]);
        setShowClearConfirm(false);
        setIsMobileHistoryOpen(false);
        createNewSession();
    };

    // --- ОТПРАВКА СООБЩЕНИЯ И ИНТЕГРАЦИЯ ИИ ---
    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !activeSessionId) return;

        const userMsg: Message = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        let updatedSessions = sessions.map(s => {
            if (s.id === activeSessionId) {
                const newTitle = s.messages.length === 0 ? text.slice(0, 25) + "..." : s.title;
                return { ...s, title: newTitle, messages: [...s.messages, userMsg], updatedAt: Date.now() };
            }
            return s;
        }).sort((a, b) => b.updatedAt - a.updatedAt); 

        saveSessions(updatedSessions);
        setInputValue("");
        setIsTyping(true);

        // ====================================================================
        // 👉 ЗДЕСЬ ПОДКЛЮЧАТЬ ИИ (API ЗАПРОС К БЭКЕНДУ)
        // ====================================================================
        // Пример:
        // try {
        //     const response = await fetch('/api/ai-chat', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ prompt: text, history: currentSessionHistory })
        //     });
        //     const data = await response.json();
        //     const aiText = data.answer;
        // } catch (e) { console.error(e); }
        // ====================================================================

        // ⏳ ИМИТАЦИЯ ЗАДЕРЖКИ ОТВЕТА ИИ
        setTimeout(() => {
            const aiMsg: Message = {
                id: `msg_${Date.now() + 1}`,
                role: 'ai',
                content: `Я ИИ-ассистент. В данный момент я нахожусь на стадии разработки и подключения к вашей базе данных.\n\nВаш запрос: "${text}" сохранен в историю.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const finalSessions = updatedSessions.map(s => 
                s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
            );
            saveSessions(finalSessions);
            setIsTyping(false);
        }, 1500); 
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    const activeSession = sessions.find(s => s.id === activeSessionId);

    return (
        <section className="ai-monolithic-section" style={{ animation: 'fadeInUp 0.5s ease' }}>
            
            <div className="ai-monolithic-container">
                
                {/* --- БОКОВАЯ ПАНЕЛЬ: ИСТОРИЯ СЕССИЙ --- */}
                {/* На мобилках показываем затемнение, если шторка открыта */}
                {isMobileHistoryOpen && (
                    <div className="ai-mobile-overlay" onClick={() => setIsMobileHistoryOpen(false)}></div>
                )}
                
                <div className={`ai-sidebar custom-scroll ${isMobileHistoryOpen ? 'open' : ''}`}>
                    <div style={{ padding: '20px' }}>
                        <button 
                            onClick={createNewSession}
                            style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #0abab5', color: '#0abab5', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <span style={{ fontSize: '18px' }}>+</span> НОВЫЙ ДИАЛОГ
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', paddingLeft: '10px' }}>ИСТОРИЯ ЗАПРОСОВ</div>
                        {sessions.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => { setActiveSessionId(s.id); setIsMobileHistoryOpen(false); }}
                                style={{ 
                                    padding: '14px 15px', 
                                    marginBottom: '8px', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    background: activeSessionId === s.id ? '#1a1a1a' : 'transparent',
                                    border: activeSessionId === s.id ? '1px solid #333' : '1px solid transparent',
                                    transition: '0.2s'
                                }}
                            >
                                <div style={{ color: activeSessionId === s.id ? '#0abab5' : '#aaa', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {s.title}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid #1a1a1a' }}>
                        <button 
                            onClick={() => setShowClearConfirm(true)}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}
                        >
                            ОЧИСТИТЬ ИСТОРИЮ
                        </button>
                    </div>
                </div>

                {/* --- ГЛАВНЫЙ ЭКРАН: ОКНО ЧАТА --- */}
                <div className="ai-chat-area">
                    
                    {/* Мобильная шапка (появляется только на телефонах) */}
                    <div className="ai-mobile-header">
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '16px' }}>TeaMaster <span style={{ color: '#0abab5' }}>AI</span></div>
                        <button onClick={() => setIsMobileHistoryOpen(true)} className="ai-history-btn">
                            🕒 История
                        </button>
                    </div>

                    {/* Список сообщений */}
                    <div className="ai-messages custom-scroll" ref={chatContainerRef}>
                        
                        {activeSession?.messages.length === 0 ? (
                            <div className="ai-empty-state">
                                <div style={{ fontSize: '50px', marginBottom: '20px' }}>🤖</div>
                                <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', marginBottom: '10px' }}>TeaMaster AI</h3>
                                <p style={{ color: '#666', fontSize: '15px', marginBottom: '30px', lineHeight: '1.5' }}>
                                    Задайте любой вопрос по регламентам, стандартам сервиса или товарной матрице компании.
                                </p>
                                <div className="quick-prompts-container">
                                    {quickPrompts.map((prompt, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSendMessage(prompt)}
                                            className="quick-prompt"
                                        >
                                            {prompt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            activeSession?.messages.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                        <div className={`ai-avatar ${msg.role}`}>
                                            {msg.role === 'user' ? '👤' : '🤖'}
                                        </div>
                                        <div className={`ai-bubble ${msg.role}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#555', marginTop: '6px', padding: msg.role === 'user' ? '0 52px 0 0' : '0 0 0 52px' }}>
                                        {msg.timestamp}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Индикатор печати ИИ */}
                        {isTyping && (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', maxWidth: '85%', marginBottom: '20px' }}>
                                <div className="ai-avatar ai">🤖</div>
                                <div className="ai-bubble ai" style={{ padding: '15px 25px' }}>
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Поле ввода сообщения */}
                    <div className="ai-input-wrapper">
                        <div className="ai-input-box">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Спросить TeaMaster AI..."
                                className="custom-scroll ai-textarea"
                                rows={1}
                            />
                            <button 
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                                className="ai-send-btn"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className="ai-footer-text">
                            ИИ может допускать ошибки. Проверяйте важную информацию по регламентам.
                        </div>
                    </div>
                </div>
            </div>

            {/* --- МОДАЛЬНОЕ ОКНО ОЧИСТКИ ИСТОРИИ --- */}
            {showClearConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#111', padding: '40px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
                        <h2 style={{ fontSize: '22px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ ИСТОРИЮ?</h2>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                            Вы собираетесь безвозвратно удалить все диалоги с нейросетью. Это действие нельзя отменить.
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={clearHistory} style={{ flex: 1, padding: '15px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>УДАЛИТЬ</button>
                            <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ОТМЕНА</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                /* Монолитный контейнер */
                .ai-monolithic-section {
                    /* Компенсируем паддинги главного <main> чтобы чат прилип к краям */
                    margin: -20px -60px -60px -60px;
                    height: calc(100vh - 100px);
                    display: flex;
                    flex-direction: column;
                }
                
                .ai-monolithic-container {
                    display: flex;
                    flex: 1;
                    background: transparent;
                    height: 100%;
                }

                /* Боковая панель */
                .ai-sidebar {
                    width: 300px;
                    border-right: 1px solid #1a1a1a;
                    display: flex;
                    flex-direction: column;
                    background: transparent;
                    transition: 0.3s ease;
                }

                /* Основная зона чата */
                .ai-chat-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: transparent;
                    position: relative;
                }

                .ai-mobile-header {
                    display: none;
                }

                /* Область сообщений */
                .ai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                }

                .ai-empty-state {
                    margin: auto;
                    text-align: center;
                    max-width: 550px;
                }

                /* Быстрые подсказки */
                .quick-prompts-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                }

                .quick-prompt {
                    background: #111;
                    border: 1px solid #222;
                    padding: 12px 18px;
                    border-radius: 20px;
                    color: #0abab5;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .quick-prompt:hover {
                    background: rgba(10,186,181,0.05);
                    border-color: #0abab5;
                    transform: translateY(-2px);
                }

                /* Бабблы сообщений */
                .ai-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 20px;
                }
                .ai-avatar.user { background: #0abab5; color: #000; }
                .ai-avatar.ai { background: #161816; border: 1px solid #333; }

                .ai-bubble {
                    padding: 16px 22px;
                    border-radius: 20px;
                    font-size: 15px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                }
                .ai-bubble.user {
                    background: rgba(10,186,181,0.1);
                    border: 1px solid rgba(10,186,181,0.3);
                    color: #fff;
                    border-bottom-right-radius: 6px;
                }
                .ai-bubble.ai {
                    background: #111;
                    border: 1px solid #222;
                    color: #ddd;
                    border-bottom-left-radius: 6px;
                }

                /* Зона ввода */
                .ai-input-wrapper {
                    padding: 20px 40px 30px 40px;
                    background: transparent;
                }

                .ai-input-box {
                    position: relative;
                    display: flex;
                    align-items: flex-end;
                    background: #111;
                    border: 1px solid #222;
                    border-radius: 24px;
                    padding: 6px;
                    transition: 0.2s;
                }
                .ai-input-box:focus-within {
                    border-color: #0abab5;
                    box-shadow: 0 0 15px rgba(10,186,181,0.1);
                }

                .ai-textarea {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #fff;
                    padding: 16px 20px;
                    font-size: 16px; /* 16px предотвращает зум на iOS! */
                    outline: none;
                    resize: none;
                    max-height: 150px;
                    min-height: 56px;
                    font-family: inherit;
                }

                .ai-send-btn {
                    margin: 8px;
                    width: 44px;
                    height: 44px;
                    border-radius: 16px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                }
                .ai-send-btn:not(:disabled) {
                    background: #0abab5;
                    color: #000;
                    cursor: pointer;
                }
                .ai-send-btn:not(:disabled):hover {
                    transform: scale(1.05);
                }
                .ai-send-btn:disabled {
                    background: #1a1a1a;
                    color: #555;
                    cursor: not-allowed;
                }

                .ai-footer-text {
                    text-align: center;
                    font-size: 12px;
                    color: #555;
                    margin-top: 12px;
                }

                /* Индикатор печати */
                .typing-indicator { display: flex; gap: 4px; padding: 2px 0; }
                .typing-indicator span {
                    width: 8px; height: 8px; background: #0abab5; border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }

                .ai-mobile-overlay { display: none; }

                /* --- МОБИЛЬНАЯ АДАПТАЦИЯ --- */
                @media (max-width: 768px) {
                    .ai-monolithic-section {
                        /* Компенсация паддингов мобильного <main> */
                        margin: -10px -15px -50px -15px;
                        height: calc(100vh - 70px); 
                    }

                    .ai-mobile-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px 20px;
                        border-bottom: 1px solid #1a1a1a;
                        background: #0a0a0a;
                    }

                    .ai-history-btn {
                        background: rgba(10,186,181,0.1);
                        color: #0abab5;
                        border: 1px solid rgba(10,186,181,0.3);
                        padding: 8px 16px;
                        border-radius: 10px;
                        font-weight: 800;
                        font-size: 13px;
                    }

                    /* Шторка истории на мобильных */
                    .ai-sidebar {
                        position: fixed;
                        top: 0;
                        left: -300px; /* спрятано */
                        width: 280px !important;
                        height: 100vh;
                        background: #000;
                        z-index: 10006;
                        box-shadow: 10px 0 30px rgba(0,0,0,0.8);
                    }
                    .ai-sidebar.open {
                        left: 0;
                    }

                    .ai-mobile-overlay {
                        display: block;
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.7);
                        z-index: 10005;
                        backdrop-filter: blur(4px);
                    }

                    .ai-messages { padding: 20px 15px; }
                    .ai-input-wrapper { padding: 15px; }
                    .quick-prompt { font-size: 13px; padding: 10px 14px; }
                    .ai-bubble { font-size: 14px; padding: 12px 16px; }
                }
            `}</style>
        </section>
    );
}