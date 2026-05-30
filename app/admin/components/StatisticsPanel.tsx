"use client";
import React from 'react';
import { flexSpace, sectionTitle, adminCard, profileBtnStyle, barStyle } from './adminStyles';

export default function StatisticsPanel({
    users, usersStats, totalRouteSteps, totalBasicsModules, userAvatars, setSelectedProfileUser
}: any) {
    const staffUsers = users.filter((u: any) => u.role === 'staff');

    return (
        <section style={{...adminCard, padding: '35px'} as any}>
            <div style={flexSpace as any}>
                <h2 style={sectionTitle as any}>Статистика обучения</h2>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Сотрудников в базе: {staffUsers.length}</span>
            </div>
            
            {staffUsers.length === 0 && (
                <div style={{ color: '#555', textAlign: 'center', padding: '30px', fontWeight: 'bold' }}>Нет добавленных сотрудников</div>
            )}

            {staffUsers.map((user: any) => {
                const routeLen = usersStats[user.id]?.route || 0;
                const basicsLen = usersStats[user.id]?.basics || 0;
                const planPercent = Math.round((routeLen / (totalRouteSteps || 1)) * 100);
                const basicsPercent = Math.round((basicsLen / (totalBasicsModules || 1)) * 100);
                const avatarImg = userAvatars[user.id] || user.avatar;

                return (
                    <div key={user.id} style={{ background: '#0d0d0d', borderRadius: '25px', padding: '25px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '0 0 250px' }}>
                            <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: '#222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {avatarImg ? <img src={avatarImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>👤</span>}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#fff', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</h3>
                                <div style={{ fontSize: '12px', color: '#0abab5', fontWeight: 'bold', marginTop: '3px' }}>@{user.login}</div>
                                <div onClick={() => setSelectedProfileUser(user)} style={profileBtnStyle as any}>ПРОФИЛЬ ↗</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '1px solid #222', paddingLeft: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '45px', fontSize: '11px', fontWeight: '900', color: '#555' }}>ПЛАН</div>
                                <div style={{ flex: 1, height: '8px', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${planPercent}%`, height: '100%', background: '#0abab5', borderRadius: '10px', transition: '1.5s ease' }} />
                                </div>
                                <div style={{ width: '45px', fontSize: '13px', fontWeight: '900', color: '#0abab5', textAlign: 'right' }}>{planPercent}%</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '45px', fontSize: '11px', fontWeight: '900', color: '#555' }}>БАЗА</div>
                                <div style={{ flex: 1, height: '8px', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${basicsPercent}%`, height: '100%', background: '#0abab5', borderRadius: '10px', transition: '1.5s ease' }} />
                                </div>
                                <div style={{ width: '45px', fontSize: '13px', fontWeight: '900', color: '#0abab5', textAlign: 'right' }}>{basicsPercent}%</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', height: '50px', alignItems: 'flex-end', borderLeft: '1px solid #222', paddingLeft: '30px' }}>
                            <div style={barStyle(planPercent) as any} />
                            <div style={barStyle(basicsPercent) as any} />
                        </div>
                    </div>
                )
            })}
        </section>
    );
}