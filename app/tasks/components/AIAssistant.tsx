"use client";
import React from 'react';

export default function AIAssistant() {
    return (
        <section style={{ animation: 'fadeInUp 0.5s ease', maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
            <h2 className="tasks-title" style={{ fontSize: '32px', fontWeight: '900', marginBottom: '15px', color: '#fff' }}>
                ИИ-Помощник <span style={{ color: '#0abab5' }}>TeaMaster</span>
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '35px', lineHeight: '1.5', maxWidth: '700px' }}>
                Интеллектуальный ассистент на базе искусственного интеллекта. Здесь вы сможете задавать любые вопросы по стандартам сервиса, рецептурам и внутренним регламентам, получая мгновенные и точные ответы.
            </p>

            <div style={{
                background: '#111',
                border: '1px solid #222',
                borderRadius: '30px',
                padding: '50px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <div style={{ 
                    fontSize: '60px', 
                    marginBottom: '20px',
                    animation: 'pulse 2s infinite ease-in-out'
                }}>
                    🤖
                </div>
                <h3 style={{ color: '#0abab5', fontSize: '20px', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    МОДУЛЬ В СТАДИИ ОБУЧЕНИЯ
                </h3>
                <p style={{ color: '#888', fontSize: '15px', maxWidth: '450px', lineHeight: '1.6', margin: '0 0 30px 0' }}>
                    В данный момент мы «скармливаем» нашей нейросети гигабайты корпоративной базы знаний, чтобы она могла безошибочно помогать вам в любых рабочих ситуациях.
                </p>
                <div style={{
                    padding: '16px 35px',
                    background: 'rgba(10,186,181,0.1)',
                    color: '#0abab5',
                    borderRadius: '16px',
                    fontWeight: '900',
                    fontSize: '14px',
                    border: '1px dashed rgba(10,186,181,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Скоро релиз
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
            `}</style>
        </section>
    );
}