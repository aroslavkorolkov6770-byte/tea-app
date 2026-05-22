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
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
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

    // --- АВТОСКРОЛЛ ВНИЗ ПРИ НОВОМ СООБЩЕНИИ ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    };

    const clearHistory = () => {
        localStorage.removeItem(`th_ai_history_${currentUserId}`);
        setSessions([]);
        setShowClearConfirm(false);
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

        // Обновляем UI: добавляем сообщение пользователя
        let updatedSessions = sessions.map(s => {
            if (s.id === activeSessionId) {
                // Если это первое сообщение, меняем заголовок сессии
                const newTitle = s.messages.length === 0 ? text.slice(0, 20) + "..." : s.title;
                return { ...s, title: newTitle, messages: [...s.messages, userMsg], updatedAt: Date.now() };
            }
            return s;
        }).sort((a, b) => b.updatedAt - a.updatedAt); // Сортируем: новые сверху

        saveSessions(updatedSessions);
        setInputValue("");
        setIsTyping(true);

        // ====================================================================
        // 👉 ЗДЕСЬ ПОДКЛЮЧАТЬ ИИ (API ЗАПРОС К БЭКЕНДУ)
        // ====================================================================
        // Тебе нужно отправить `userMsg.content` (и историю `s.messages`) на свой сервер.
        // Пример того, как это должно выглядеть в реальности:
        // 
        // try {
        //     const response = await fetch('/api/ai-chat', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ prompt: text, history: currentSessionHistory })
        //     });
        //     const data = await response.json();
        //     const aiText = data.answer;
        // } catch (e) {
        //     // обработка ошибки
        // }
        // ====================================================================

        // ⏳ ИМИТАЦИЯ ЗАДЕРЖКИ ОТВЕТА ИИ (ПОКА НЕТ РЕАЛЬНОГО API)
        setTimeout(() => {
            const aiMsg: Message = {
                id: `msg_${Date.now() + 1}`,
                role: 'ai',
                content: `Это демонстрационный ответ ИИ. В будущем здесь будет ответ от вашей дообученной нейросети на вопрос: "${text}". \n\nВам нужно раскомментировать код API-запроса в компоненте AIAssistant.`,
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
        <section style={{ animation: 'fadeInUp 0.5s ease', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="tasks-title" style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px', color: '#fff' }}>
                ИИ-Помощник <span style={{ color: '#0abab5' }}>TeaMaster</span>
            </h2>

            <div className="ai-container" style={{ display: 'flex', flex: 1, background: '#111', borderRadius: '30px', border: '1px solid #222', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                
                {/* --- БОКОВАЯ ПАНЕЛЬ: ИСТОРИЯ СЕССИЙ --- */}
                <div className="ai-sidebar custom-scroll" style={{ width: '280px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                    <div style={{ padding: '20px' }}>
                        <button 
                            onClick={createNewSession}
                            style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #0abab5', color: '#0abab5', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <span style={{ fontSize: '18px' }}>+</span> НОВЫЙ ДИАЛОГ
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px', paddingLeft: '10px' }}>ИСТОРИЯ ЗАПРОСОВ</div>
                        {sessions.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => setActiveSessionId(s.id)}
                                style={{ 
                                    padding: '12px 15px', 
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

                    <div style={{ padding: '20px', borderTop: '1px solid #222' }}>
                        <button 
                            onClick={() => setShowClearConfirm(true)}
                            style={{ width: '100%', padding: '10px', background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                        >
                            ОЧИСТИТЬ ИСТОРИЮ
                        </button>
                    </div>
                </div>

                {/* --- ГЛАВНЫЙ ЭКРАН: ОКНО ЧАТА --- */}
                <div className="ai-chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111' }}>
                    
                    {/* Список сообщений */}
                    <div className="ai-messages custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {activeSession?.messages.length === 0 ? (
                            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '500px' }}>
                                <div style={{ fontSize: '60px', marginBottom: '20px' }}>🤖</div>
                                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>Я TeaMaster AI. Чем могу помочь?</h3>
                                <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                                    Задайте любой вопрос по регламентам, стандартам сервиса или товарной матрице компании.
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                    {quickPrompts.map((prompt, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSendMessage(prompt)}
                                            style={{ background: '#1a1a1a', border: '1px solid #333', padding: '10px 15px', borderRadius: '20px', color: '#0abab5', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                                            className="quick-prompt"
                                        >
                                            {prompt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            activeSession?.messages.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', maxWidth: '80%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                        <div style={{ 
                                            width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            background: msg.role === 'user' ? '#0abab5' : '#222',
                                            fontSize: '18px'
                                        }}>
                                            {msg.role === 'user' ? '👤' : '🤖'}
                                        </div>
                                        <div style={{ 
                                            padding: '15px 20px', 
                                            borderRadius: '20px', 
                                            background: msg.role === 'user' ? 'rgba(10,186,181,0.1)' : '#1a1a1a',
                                            border: msg.role === 'user' ? '1px solid rgba(10,186,181,0.3)' : '1px solid #333',
                                            color: '#fff',
                                            fontSize: '15px',
                                            lineHeight: '1.5',
                                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                                            borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '20px',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#555', marginTop: '5px', padding: '0 45px' }}>{msg.timestamp}</div>
                                </div>
                            ))
                        )}

                        {/* Индикатор печати ИИ */}
                        {isTyping && (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', maxWidth: '80%' }}>
                                <div style={{ width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', fontSize: '18px' }}>🤖</div>
                                <div style={{ padding: '15px 20px', borderRadius: '20px', background: '#1a1a1a', border: '1px solid #333', borderBottomLeftRadius: '4px' }}>
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Поле ввода сообщения */}
                    <div style={{ padding: '20px', borderTop: '1px solid #222', background: '#0a0a0a' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', background: '#111', border: '1px solid #333', borderRadius: '20px', padding: '5px' }}>
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Задайте вопрос нейросети..."
                                className="custom-scroll"
                                style={{
                                    flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '15px', fontSize: '15px', outline: 'none', resize: 'none', maxHeight: '150px', minHeight: '50px', fontFamily: 'inherit'
                                }}
                                rows={1}
                            />
                            <button 
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                                style={{
                                    margin: '10px', width: '40px', height: '40px', borderRadius: '14px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!inputValue.trim() || isTyping) ? 'not-allowed' : 'pointer',
                                    background: (!inputValue.trim() || isTyping) ? '#222' : '#0abab5',
                                    color: (!inputValue.trim() || isTyping) ? '#555' : '#000',
                                    transition: '0.2s'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginTop: '10px' }}>
                            ИИ может допускать ошибки. Проверяйте важную информацию по регламентам.
                        </div>
                    </div>
                </div>
            </div>

            {/* --- МОДАЛЬНОЕ ОКНО ОЧИСТКИ ИСТОРИИ --- */}
            {showClearConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#111', padding: '40px', borderRadius: '30px', border: '1px solid #333', textAlign: 'center', maxWidth: '400px' }}>
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
                .quick-prompt:hover { background: rgba(10,186,181,0.1) !important; border-color: #0abab5 !important; }
                
                .typing-indicator { display: flex; gap: 4px; padding: 5px 0; }
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

                @media (max-width: 768px) {
                    .ai-container { flex-direction: column !important; }
                    .ai-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid #222; max-height: 200px; }
                }
            `}</style>
        </section>
    );
}