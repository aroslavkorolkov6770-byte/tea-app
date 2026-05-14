"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const DAYS_OF_WEEK = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// --- ХЕЛПЕР ДЛЯ ЗАПИСИ ДАННЫХ НА СЕРВЕР ---
const saveDataToServer = (key: string, data: any) => {
    fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- СОСТОЯНИЯ КАЛЕНДАРЯ И ЗАМЕТОК ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // --- СОСТОЯНИЯ УПРАВЛЕНИЯ ПЕРСОНАЛОМ ---
  const [users, setUsers] = useState<any[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', login: '', pass: '', role: 'staff' });

  // --- СОСТОЯНИЯ ДЛЯ ОТПРАВКИ УВЕДОМЛЕНИЙ ---
  const [notifText, setNotifText] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("Все");

  // --- ДИНАМИЧЕСКИЕ ДАННЫЕ ДЛЯ СТАТИСТИКИ И РЕЗУЛЬТАТОВ ---
  const [totalBasicsModules, setTotalBasicsModules] = useState(50);
  const [totalRouteSteps, setTotalRouteSteps] = useState(5);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [usersStats, setUsersStats] = useState<Record<string, {route: number, basics: number}>>({});
  
  // Состояния для зоны загрузки файлов
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urgentFiles, setUrgentFiles] = useState<any[]>([]);
  
  // СОСТОЯНИЕ МОДАЛЬНОГО ОКНА СПИСКА ФАЙЛОВ
  const [showFilesList, setShowFilesList] = useState(false);

  // СОСТОЯНИЕ ФИРМЕННОГО УВЕДОМЛЕНИЯ ОБ УСПЕХЕ (ВМЕСТО ALERT)
  const [showSuccessModal, setShowSuccessModal] = useState<{show: boolean, title: string, text: string}>({ 
    show: false, 
    title: '', 
    text: '' 
  });

  useEffect(() => {
    setIsMounted(true);
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('sidebarToggle', handleToggle);

    // --- ЗАГРУЗКА ВСЕХ ДАННЫХ С СЕРВЕРА ПРИ ВХОДЕ ---
    const loadAllData = async () => {
        try {
            // Заметки
            const notesRes = await fetch('/api/storage?key=admin_cal_notes_v1');
            const notesData = await notesRes.json();
            if (notesData && Object.keys(notesData).length > 0 && !Array.isArray(notesData)) setNotes(notesData);

            // Пользователи
            const usersRes = await fetch('/api/storage?key=tea_hub_users_v1');
            let usersData = await usersRes.json();
            if (!Array.isArray(usersData) || usersData.length === 0) {
                usersData = [
                    { id: 'u_admin', login: '11', pass: '11', role: 'admin', name: 'Главный Мастер' },
                    { id: 'u_staff', login: '1', pass: '1', role: 'staff', name: 'Ярик' }
                ];
                saveDataToServer('tea_hub_users_v1', usersData);
            }
            setUsers(usersData);

            // Результаты тестов
            const testRes = await fetch('/api/storage?key=tea_hub_test_results_v1');
            let testData = await testRes.json();
            if (!Array.isArray(testData) || testData.length === 0) {
                testData = [
                    { id: 1, userName: 'Ярик', testName: 'История и Бренд', score: 100, attempts: 1, date: '14 Мая, 10:30' },
                    { id: 2, userName: 'Ярик', testName: 'Ботаника чая', score: 60, attempts: 3, date: '13 Мая, 15:20' },
                    { id: 3, userName: 'Ярик', testName: 'Зеленый чай', score: 85, attempts: 2, date: '12 Мая, 18:00' }
                ];
                saveDataToServer('tea_hub_test_results_v1', testData);
            }
            setTestResults(testData);

            // Загруженные файлы
            const filesRes = await fetch('/api/storage?key=tea_hub_urgent_files_v1');
            const filesData = await filesRes.json();
            if (Array.isArray(filesData)) setUrgentFiles(filesData);

            // Данные для статистики
            const bRes = await fetch('/api/storage?key=tea_hub_dynamic_basics_v1');
            const bDb = await bRes.json().catch(() => []);
            const rRes = await fetch('/api/storage?key=tea_hub_dynamic_route_v1');
            const rDb = await rRes.json().catch(() => []);
            
            setTotalBasicsModules((Array.isArray(bDb) ? bDb : []).reduce((acc: number, s: any) => acc + (s.modules?.length || 0), 0) || 50);
            setTotalRouteSteps(Array.isArray(rDb) ? rDb.length : 5);

            // Прогресс каждого сотрудника
            const stats: Record<string, {route: number, basics: number}> = {};
            for (const u of usersData) {
                if (u.role === 'staff') {
                    const uRouteRes = await fetch(`/api/storage?key=prog_route_${u.id}`);
                    const uRouteData = await uRouteRes.json().catch(() => []);
                    const uBasicsRes = await fetch(`/api/storage?key=prog_basics_${u.id}`);
                    const uBasicsData = await uBasicsRes.json().catch(() => []);
                    
                    stats[u.id] = {
                        route: Array.isArray(uRouteData) ? uRouteData.length : 0,
                        basics: Array.isArray(uBasicsData) ? uBasicsData.length : 0
                    };
                }
            }
            setUsersStats(stats);
        } catch (error) {
            console.error("Ошибка загрузки данных с сервера:", error);
        }
    };

    loadAllData();

    return () => window.removeEventListener('sidebarToggle', handleToggle);
  }, []);

  // --- ЛОГИКА УПРАВЛЕНИЯ ПЕРСОНАЛОМ ---
  const handleCreateUser = () => {
      if (!newUser.name.trim() || !newUser.login.trim() || !newUser.pass.trim()) {
          alert("Заполните все поля!");
          return;
      }
      if (users.find(u => u.login === newUser.login.trim())) {
          alert("Пользователь с таким логином уже существует!");
          return;
      }

      const createdUser = {
          id: 'u_' + Date.now(),
          login: newUser.login.trim(),
          pass: newUser.pass.trim(),
          role: newUser.role,
          name: newUser.name.trim()
      };

      const updatedUsers = [...users, createdUser];
      setUsers(updatedUsers);
      saveDataToServer('tea_hub_users_v1', updatedUsers);
      setShowUserForm(false);
      
      setShowSuccessModal({ 
        show: true, 
        title: 'СОТРУДНИК СОЗДАН', 
        text: `Учетная запись для ${newUser.name} успешно добавлена в базу данных.` 
      });

      setNewUser({ name: '', login: '', pass: '', role: 'staff' });
  };

  const handleDeleteUser = (id: string) => {
      if (id === 'u_admin' || id === 'u_staff') {
          alert("Базовые аккаунты удалить нельзя!");
          return;
      }
      if (confirm("Точно удалить учетную запись сотрудника?")) {
          const updatedUsers = users.filter(u => u.id !== id);
          setUsers(updatedUsers);
          saveDataToServer('tea_hub_users_v1', updatedUsers);
      }
  };

  // --- ЛОГИКА СОХРАНЕНИЯ И УДАЛЕНИЯ ФАЙЛА В БАЗУ ---
  const handleSaveFile = () => {
      if (!selectedFile) return;

      const newFile = {
          id: 'file_' + Date.now(),
          name: selectedFile.name,
          size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
          date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      };

      const updatedFiles = [newFile, ...urgentFiles];
      setUrgentFiles(updatedFiles);
      saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);
      
      setShowSuccessModal({ 
        show: true, 
        title: 'МАТЕРИАЛ ОТПРАВЛЕН', 
        text: `Файл "${selectedFile.name}" успешно загружен и появится у сотрудников в разделе обучения.` 
      });

      setSelectedFile(null);
  };

  const handleDeleteFile = (id: string) => {
      if(confirm("Удалить этот файл у всех сотрудников?")) {
          const updatedFiles = urgentFiles.filter(f => f.id !== id);
          setUrgentFiles(updatedFiles);
          saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);
      }
  };

  // --- ФУНКЦИИ КАЛЕНДАРЯ ---
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const shiftStartDay = startDayIndex === 0 ? 6 : startDayIndex - 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = (d: number) => today.getDate() === d && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  // --- ФУНКЦИИ ЗАМЕТОК ---
  const openNotePanel = (day: number) => {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
      setSelectedDateKey(key);
      setNoteText(notes[key] || "");
  };

  const closeNotePanel = () => {
      setSelectedDateKey(null);
      setNoteText("");
  };

  const saveNote = () => {
      if (!selectedDateKey) return;
      const newNotes = { ...notes };
      if (noteText.trim()) {
          newNotes[selectedDateKey] = noteText.trim();
      } else {
          delete newNotes[selectedDateKey];
      }
      setNotes(newNotes);
      saveDataToServer('admin_cal_notes_v1', newNotes);
      closeNotePanel();
  };

  const deleteNote = () => {
      if (!selectedDateKey) return;
      const newNotes = { ...notes };
      delete newNotes[selectedDateKey];
      setNotes(newNotes);
      saveDataToServer('admin_cal_notes_v1', newNotes);
      closeNotePanel();
  };

  const formattedSelectedDate = () => {
      if (!selectedDateKey) return "";
      const [y, m, d] = selectedDateKey.split('-');
      return `${d} ${MONTH_NAMES[parseInt(m)]} ${y}`;
  };

  // --- ФУНКЦИЯ ОТПРАВКИ УВЕДОМЛЕНИЯ ---
  const handleSendNotification = async () => {
    if (!notifText.trim()) return;
    
    // Получаем текущие уведомления с сервера перед добавлением
    const res = await fetch('/api/storage?key=tea_hub_notifications_v1');
    const currentNotifs = await res.json().catch(() => []);
    const arr = Array.isArray(currentNotifs) ? currentNotifs : [];

    const newNotif = {
        id: Date.now(),
        title: selectedStaff === 'Все' ? 'Общее уведомление' : 'Личное сообщение',
        text: notifText.trim(),
        time: 'Только что',
        target: selectedStaff
    };

    saveDataToServer('tea_hub_notifications_v1', [newNotif, ...arr]);
    
    setShowSuccessModal({ 
        show: true, 
        title: 'СООБЩЕНИЕ ОТПРАВЛЕНО', 
        text: 'Ваше уведомление мгновенно доставлено в панели сотрудников.' 
    });

    setNotifText("");
  };

  const upcomingEvents = Object.entries(notes)
    .map(([key, text]) => {
      const [y, m, d] = key.split('-').map(Number);
      const dateObj = new Date(y, m, d);
      return { key, text, dateObj, d };
    })
    .filter(event => event.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, 3);

  if (!isMounted) {
    return (
      <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', display: 'flex' }}>
        <Navigation />
        <div style={{ width: '260px', flexShrink: 0 }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', transition: '0.3s', overflowX: 'hidden' }}>
      <Navigation />
      <div style={{ width: isSidebarOpen ? '260px' : '0', transition: '0.3s', flexShrink: 0 }} />

      <main style={{ flex: 1, padding: '110px 40px 40px 40px', transition: '0.3s' }}>
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            
            {/* ЗОНА: КОМПАКТНОЕ ПРИКРЕПЛЕНИЕ ФАЙЛОВ */}
            <div 
              style={{ ...uploadZoneStyle, borderColor: isDragging ? '#0abab5' : '#333' } as any}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { 
                e.preventDefault(); 
                setIsDragging(false); 
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setSelectedFile(e.dataTransfer.files[0]);
                } 
              }}
            >
               <div style={{ fontSize: '28px', marginBottom: '10px' }}>📁</div>
               <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginBottom: '5px' }}>Загрузка учебных материалов</h3>
               
               {!selectedFile ? (
                   <>
                       <p style={{ color: '#888', fontSize: '13px', marginBottom: '15px', maxWidth: '500px', margin: '0 auto 15px auto', lineHeight: '1.4' }}>
                         Перетащите сюда документ (PDF, DOCX, TXT) или нажмите кнопку ниже.
                       </p>
                       
                       <input 
                          type="file" 
                          id="file-upload-admin" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                  setSelectedFile(e.target.files[0]);
                              }
                          }} 
                       />
                       
                       <button onClick={() => document.getElementById('file-upload-admin')?.click()} style={{ ...actionBtn, background: '#0abab5', color: '#000', border: 'none', padding: '10px 25px', fontSize: '13px' } as any}>
                         ВЫБРАТЬ ФАЙЛ
                       </button>

                       {/* НАДПИСЬ */}
                       {urgentFiles.length > 0 && (
                           <div 
                            onClick={() => setShowFilesList(true)}
                            style={{ marginTop: '15px', color: '#0abab5', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', opacity: 0.8 }}
                           >
                               Загруженный материал ({urgentFiles.length})
                           </div>
                       )}
                   </>
               ) : (
                   <div style={{ background: '#000', padding: '15px', borderRadius: '20px', display: 'inline-block', border: '1px solid #333' }}>
                       <div style={{ color: '#0abab5', fontWeight: '900', fontSize: '14px', marginBottom: '10px' }}>
                           📎 {selectedFile.name}
                       </div>
                       <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                           <button onClick={handleSaveFile} style={{ ...saveBtn, padding: '10px 20px', width: 'auto', fontSize: '12px', borderRadius: '10px' } as any}>
                               ПРИКРЕПИТЬ
                           </button>
                           <button onClick={() => setSelectedFile(null)} style={{ ...saveBtn, background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '10px 20px', width: 'auto', fontSize: '12px', borderRadius: '10px' } as any}>
                               ОТМЕНИТЬ
                           </button>
                       </div>
                   </div>
               )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', marginBottom: '30px', marginTop: '40px' }}>
              <section>
                
                {/* --- УПРАВЛЕНИЕ ПЕРСОНАЛОМ --- */}
                <div style={flexSpace}>
                  <h2 style={sectionTitle}>Управление персоналом</h2>
                  <span onClick={() => setShowUserForm(true)} style={actionBtn}>+ Новый сотрудник</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {users.map(u => (
                    <div key={u.id} style={userCardStyle as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '18px', color: '#fff', marginBottom: '4px' }}>{u.name}</div>
                                <div style={{ fontSize: '12px', color: u.role === 'admin' ? '#ff7675' : '#0abab5', fontWeight: 'bold' }}>
                                    {u.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                                </div>
                            </div>
                            {(u.id !== 'u_admin' && u.id !== 'u_staff') && (
                                <div onClick={() => handleDeleteUser(u.id)} style={{ cursor: 'pointer', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>✕</div>
                            )}
                        </div>
                        
                        <div style={{ background: '#000', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>Логин:</span>
                                <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{u.login}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#666' }}>Пароль:</span>
                                <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{u.pass}</span>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>

                {/* --- ДИНАМИЧЕСКИЙ СПИСОК ЗАДАЧ (РЕЗУЛЬТАТЫ ТЕСТОВ) --- */}
                <div style={{ ...flexSpace, marginTop: '40px' }}>
                  <h2 style={sectionTitle}>Результаты тестирования</h2>
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Всего записей: {testResults.length}</span>
                </div>
                <div style={tableContainer}>
                  <table style={adminTable}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #222' }}>
                        <th style={thStyle}>Сотрудник</th>
                        <th style={thStyle}>Тест</th>
                        <th style={thStyle}>Балл</th>
                        <th style={thStyle}>Попытки</th>
                        <th style={thStyle}>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.length === 0 && (
                          <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#555' }}>Нет данных о прохождении тестов</td></tr>
                      )}
                      {testResults.map((res: any) => {
                          const isPassed = res.score >= 80;
                          const scoreColor = isPassed ? '#0abab5' : '#ff4d4d';
                          
                          return (
                              <tr key={res.id} style={trStyle}>
                                <td style={{ padding: '20px', fontWeight: 'bold' }}>{res.userName}</td>
                                <td style={{ color: '#ccc', fontSize: '14px' }}>{res.testName}</td>
                                <td style={{ fontWeight: '900', color: scoreColor }}>{res.score}%</td>
                                <td style={{ color: '#888', fontSize: '13px' }}>{res.attempts}</td>
                                <td><span style={statusBadge(scoreColor)}>{isPassed ? 'Пройден' : 'Не пройден'}</span></td>
                              </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ОТПРАВКА УВЕДОМЛЕНИЙ */}
                <div style={{ ...adminCard, marginTop: '30px', padding: '25px' } as any}>
                    <h2 style={{ ...sectionTitle, fontSize: '18px', marginBottom: '15px' }}>Отправить уведомление</h2>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <select 
                            style={{ ...adminIn, width: '180px', marginBottom: 0 } as any}
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                        >
                            <option value="Все">Всем сотрудникам</option>
                            {users.filter(u => u.role === 'staff').map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.login})</option>
                            ))}
                        </select>
                        <input 
                            type="text"
                            style={{ ...adminIn, flex: 1, marginBottom: 0 } as any}
                            placeholder="Текст уведомления..."
                            value={notifText}
                            onChange={(e) => setNotifText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendNotification()}
                        />
                        <button onClick={handleSendNotification} style={{ ...adminSendBtn, width: 'auto', padding: '14px 25px', fontSize: '13px' } as any}>ОТПРАВИТЬ</button>
                    </div>
                </div>
              </section>

              {/* ПРАВАЯ КОЛОНКА (Календарь) */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={adminCard}>
                    <h2 style={{ ...sectionTitle, fontSize: '18px', marginBottom: '20px' }}>Ближайшие события</h2>
                    {upcomingEvents.length === 0 ? (
                        <div style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Нет запланированных задач</div>
                    ) : (
                        upcomingEvents.map((event) => {
                            const lines = event.text.split('\n');
                            const title = lines[0];
                            const desc = lines.slice(1).join(' ');
                            return (
                                <div key={event.key} style={scheduleItem}>
                                    <div style={dateBox}>{event.d} <br/> <span style={{ fontSize: '11px', opacity: 0.8 }}>{DAYS_OF_WEEK[event.dateObj.getDay()]}</span></div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                                        {desc && <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div style={adminCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <span style={{ fontWeight: '900', fontSize: '18px' }}>{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <span onClick={handlePrevMonth} style={calNavBtn}>←</span>
                            <span onClick={handleNextMonth} style={calNavBtn}>→</span>
                        </div>
                    </div>
                    <div style={calendarGrid}>
                        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => <div key={d} style={calDayHead}>{d}</div>)}
                        {Array.from({length: shiftStartDay}).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({length: daysInMonth}).map((_, i) => {
                            const dayNumber = i + 1;
                            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayNumber}`;
                            const hasNote = !!notes[dateKey];
                            const isTdy = isToday(dayNumber);
                            return (
                                <div key={dayNumber} className={`cal-day ${isTdy ? 'today' : ''}`} onClick={() => openNotePanel(dayNumber)}>
                                    <span>{dayNumber}</span>
                                    {hasNote && <div className="note-dot" />}
                                </div>
                            )
                        })}
                    </div>
                </div>
              </aside>
            </div>

            {/* СТАТИСТИКА ВСЕХ ДОБАВЛЕННЫХ СОТРУДНИКОВ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <section style={{...adminCard, padding: '35px'} as any}>
                    <div style={flexSpace}>
                        <h2 style={sectionTitle}>Статистика обучения</h2>
                        <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Сотрудников в базе: {users.filter(u => u.role === 'staff').length}</span>
                    </div>
                    
                    {users.filter(u => u.role === 'staff').length === 0 && (
                        <div style={{ color: '#555', textAlign: 'center', padding: '30px', fontWeight: 'bold' }}>Нет добавленных сотрудников</div>
                    )}

                    {users.filter(u => u.role === 'staff').map(user => {
                        const routeLen = usersStats[user.id]?.route || 0;
                        const basicsLen = usersStats[user.id]?.basics || 0;
                        const planPercent = Math.round((routeLen / (totalRouteSteps || 1)) * 100);
                        const basicsPercent = Math.round((basicsLen / (totalBasicsModules || 1)) * 100);

                        return (
                            <div key={user.id} style={{ background: '#0d0d0d', borderRadius: '25px', padding: '25px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '0 0 250px' }}>
                                    <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: '#222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                                        <span style={{ fontSize: '24px' }}>👤</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#fff', margin: 0 }}>{user.name}</h3>
                                        <div style={{ fontSize: '12px', color: '#0abab5', fontWeight: 'bold', marginTop: '3px' }}>@{user.login}</div>
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
                                    <div style={barStyle(planPercent)} />
                                    <div style={barStyle(basicsPercent)} />
                                </div>
                            </div>
                        )
                    })}
               </section>
            </div>
          </div>
      </main>

      {/* МЕНЮ С ДОКУМЕНТАМИ В ЦЕНТРЕ ЭКРАНА */}
      {showFilesList && (
          <div style={modalOverlay as any}>
              <div style={{ ...modalContentSmall, maxWidth: '500px' } as any}>
                  <h2 style={{ color: '#0abab5', fontWeight: '900', marginBottom: '25px', textAlign: 'center' }}>ЗАГРУЖЕННЫЕ МАТЕРИАЛЫ</h2>
                  
                  <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '25px', paddingRight: '10px' }}>
                      {urgentFiles.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#666' }}>Список пуст</p>
                      ) : (
                          urgentFiles.map(file => (
                              <div key={file.id} style={{ background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ overflow: 'hidden', flex: 1 }}>
                                      <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#fff' }}>📄 {file.name}</div>
                                      <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{file.date} • {file.size}</div>
                                  </div>
                                  <button onClick={() => handleDeleteFile(file.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', padding: '0 10px' }}>✕</button>
                              </div>
                          ))
                      )}
                  </div>

                  <button onClick={() => setShowFilesList(false)} style={saveBtn as any}>← НАЗАД К ПАНЕЛИ</button>
              </div>
          </div>
      )}

      {/* --- ФИРМЕННЫЕ МОДАЛЬНЫЕ ОКНА --- */}

      {/* 1. ОКНО УСПЕХА (ВМЕСТО ALERT) */}
      {showSuccessModal.show && (
          <div style={modalOverlay as any} onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })}>
              <div style={{ ...modalContentSmall, maxWidth: '420px', padding: '35px', textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '50px', marginBottom: '20px', animation: 'scaleIn 0.3s ease' }}>✅</div>
                  <h2 style={{ color: '#0abab5', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{showSuccessModal.title}</h2>
                  <p style={{ color: '#ccc', fontSize: '16px', lineHeight: '1.6', marginBottom: '25px' }}>
                      {showSuccessModal.text.includes('"') 
                        ? showSuccessModal.text.split('"').map((part, i) => i === 1 ? <span key={i} style={{fontSize: '18px', color: '#fff', fontWeight: '900'}}>"{part}"</span> : part)
                        : showSuccessModal.text
                      }
                  </p>
                  <button onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })} style={saveBtn as any}>ПОНЯТНО</button>
              </div>
          </div>
      )}

      {/* 2. МОДАЛКА СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ */}
      {showUserForm && (
        <div style={modalOverlay as any}>
            <div style={modalContentSmall as any}>
                <h2 style={{color:'#0abab5', marginBottom:'25px', fontWeight: '900'}}>НОВЫЙ СОТРУДНИК</h2>
                <input style={adminIn as any} placeholder="Имя (напр. Анна)" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} />
                <input style={adminIn as any} placeholder="Придумайте Логин" value={newUser.login} onChange={e=>setNewUser({...newUser, login: e.target.value})} />
                <input style={adminIn as any} placeholder="Придумайте Пароль" value={newUser.pass} onChange={e=>setNewUser({...newUser, pass: e.target.value})} />
                
                <div style={{ textAlign: 'left', marginBottom: '15px', color: '#888', fontSize: '13px', fontWeight: 'bold', marginLeft: '5px' }}>Роль пользователя:</div>
                <select style={adminIn as any} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                    <option value="staff">🍵 Чайный мастер (Сотрудник)</option>
                    <option value="admin">👑 Администратор</option>
                </select>
                
                <button onClick={handleCreateUser} style={{...saveBtn, marginTop: '20px'} as any}>СОЗДАТЬ УЧЕТКУ</button>
                <div onClick={()=>setShowUserForm(false)} style={{textAlign:'center', marginTop:'20px', cursor:'pointer', color:'#666', fontWeight:'bold'}}>ОТМЕНА</div>
            </div>
        </div>
      )}

      {/* 3. ПАНЕЛЬ ЗАМЕТОК (САЙДБАР) */}
      {selectedDateKey && (
        <div style={noteOverlayStyle as any} onClick={closeNotePanel}>
          <div style={noteSidebarStyle as any} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0abab5' }}>ЗАМЕТКА</h2>
              <div onClick={closeNotePanel} style={{ cursor: 'pointer', fontSize: '20px', opacity: 0.5 }}>✕</div>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#ccc' }}>Дата: {formattedSelectedDate()}</p>
            <textarea autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Текст заметки..." style={noteTextarea} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={saveNote} style={adminSendBtn as any}>СОХРАНИТЬ</button>
                {notes[selectedDateKey] && <button onClick={deleteNote} style={noteDeleteBtn as any}>УДАЛИТЬ</button>}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .cal-day { position: relative; font-size: 13px; padding: 10px 0; border-radius: 12px; font-weight: 800; color: #fff; cursor: pointer; transition: 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 38px; }
        .cal-day:hover { background: #0abab5; color: #000; }
        .cal-day.today { background: #0abab5; color: #000; }
        .note-dot { position: absolute; bottom: 4px; width: 4px; height: 4px; background: #0abab5; border-radius: 50%; }
        .cal-day:hover .note-dot, .cal-day.today .note-dot { background: #000; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #222; borderRadius: 10px; }
      `}</style>
    </div>
  );
}

// --- СТИЛИ ---
const uploadZoneStyle = { background: '#111', border: '2px dashed', borderRadius: '35px', padding: '25px 20px', textAlign: 'center' as any, transition: '0.3s ease', cursor: 'pointer' };
const flexSpace: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' };
const sectionTitle: any = { fontSize: '22px', fontWeight: '900', color: '#fff' };
const actionBtn: any = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const adminCard: any = { background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222' };
const userCardStyle: any = { background: '#111', padding: '25px', borderRadius: '25px', border: '1px solid #222', transition: '0.3s' };
const tableContainer: any = { background: '#161816', borderRadius: '30px', border: '1px solid #222', overflow: 'hidden', padding: '10px' };
const adminTable: any = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const thStyle: any = { padding: '20px', fontSize: '12px', opacity: 0.3, textTransform: 'uppercase', letterSpacing: '1px' };
const trStyle: any = { borderBottom: '1px solid #111' };
const statusBadge = (color: string): any => ({ background: `${color}15`, color: color, padding: '6px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900' });
const scheduleItem: any = { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px', padding: '15px', background: '#0d0d0d', borderRadius: '20px', border: '1px solid #1a1a1a' };
const dateBox: any = { background: '#0abab5', color: '#000', padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', textAlign: 'center', minWidth: '45px' };
const calNavBtn: any = { cursor: 'pointer', opacity: 0.5, fontSize: '16px' };
const calendarGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' };
const calDayHead: any = { fontSize: '11px', opacity: 0.3, fontWeight: '900', marginBottom: '10px' };
const barStyle = (h: number): any => ({ width: '12px', height: `${h}%`, background: 'linear-gradient(to top, #0abab5, #0abab533)', borderRadius: '4px 4px 2px 2px', transition: '1s ease' });
const adminSendBtn: any = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '18px', fontWeight: '900', cursor: 'pointer' };
const adminIn = { width: '100%', padding: '16px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '15px' };
const saveBtn = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };
const modalOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30000, backdropFilter: 'blur(15px)' };
const modalContentSmall: any = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #333' };
const noteOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 20000, display: 'flex', justifyContent: 'flex-end' };
const noteSidebarStyle = { width: '400px', height: '100%', background: '#000', borderLeft: '1px solid #222', padding: '40px 30px', animation: 'slideInRight 0.3s ease', boxShadow: '-20px 0 50px rgba(0,0,0,0.8)' };
const noteTextarea = { width: '100%', height: '200px', background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '20px', color: '#fff', outline: 'none', fontSize: '15px', resize: 'none' as any, lineHeight: '1.5' };
const noteDeleteBtn = { width: '100%', padding: '18px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '18px', fontWeight: '900', cursor: 'pointer' };