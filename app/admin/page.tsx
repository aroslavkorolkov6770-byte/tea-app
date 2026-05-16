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
  const [userSearchQuery, setUserSearchQuery] = useState("");

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
  
  // СОСТОЯНИЕ МОДАЛЬНОГО ОКНА СПИСКА ФАЙЛОВ И ПРЕДПРОСМОТРА
  const [showFilesList, setShowFilesList] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // --- СОСТОЯНИЯ ФИРМЕННЫХ МОДАЛЬНЫХ ОКОН ---
  const [showSuccessModal, setShowSuccessModal] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });
  const [errorModal, setErrorModal] = useState({ show: false, text: '' });
  const [confirmModal, setConfirmModal] = useState<{show: boolean, type: 'user'|'file'|null, id: string, title: string, text: string}>({ show: false, type: null, id: '', title: '', text: '' });

  // --- СОСТОЯНИЯ ДЛЯ МОДАЛКИ РЕЗУЛЬТАТОВ ТЕСТОВ ---
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTestUser, setSelectedTestUser] = useState("Все");

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
          setErrorModal({ show: true, text: "Заполните все поля для создания сотрудника!" });
          return;
      }
      if (users.find(u => u.login === newUser.login.trim())) {
          setErrorModal({ show: true, text: "Пользователь с таким логином уже существует!" });
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
          setErrorModal({ show: true, text: "Базовые системные аккаунты удалить нельзя!" });
          return;
      }
      
      setConfirmModal({
          show: true,
          type: 'user',
          id: id,
          title: 'УДАЛЕНИЕ СОТРУДНИКА',
          text: 'Вы уверены, что хотите удалить учетную запись этого сотрудника? Это действие необратимо.'
      });
  };

  // --- ЛОГИКА: ЧИТАЕМ ФАЙЛ И СОХРАНЯЕМ В BASE64 ---
  const handleSaveFile = () => {
      if (!selectedFile) return;

      const reader = new FileReader();
      
      reader.onload = (e) => {
          const fileData = e.target?.result;

          const newFile = {
              id: 'file_' + Date.now(),
              name: selectedFile.name,
              size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
              date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
              data: fileData 
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

      reader.readAsDataURL(selectedFile);
  };

  const handleDeleteFile = (id: string) => {
      setConfirmModal({
          show: true,
          type: 'file',
          id: id,
          title: 'УДАЛЕНИЕ МАТЕРИАЛА',
          text: 'Вы действительно хотите удалить этот учебный материал у всех сотрудников?'
      });
  };

  // Выполнение подтвержденного удаления
  const executeConfirmAction = () => {
      if (confirmModal.type === 'user') {
          const updatedUsers = users.filter(u => u.id !== confirmModal.id);
          setUsers(updatedUsers);
          saveDataToServer('tea_hub_users_v1', updatedUsers);
      } else if (confirmModal.type === 'file') {
          const updatedFiles = urgentFiles.filter(f => f.id !== confirmModal.id);
          setUrgentFiles(updatedFiles);
          saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);
      }
      setConfirmModal({ ...confirmModal, show: false });
  };

  const handleDownloadFile = (file: any) => {
      if (!file.data) {
          setErrorModal({ show: true, text: "Этот файл был загружен в старой версии платформы и недоступен для скачивания." });
          return;
      }
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  // --- ФУНКЦИЯ ОТПРАВКИ УВЕДОМЛЕНИЯ С ТОЧНЫМ ВРЕМЕНЕМ ---
  const handleSendNotification = async () => {
    if (!notifText.trim()) return;
    
    const res = await fetch('/api/storage?key=tea_hub_notifications_v1');
    const currentNotifs = await res.json().catch(() => []);
    const arr = Array.isArray(currentNotifs) ? currentNotifs : [];

    const formattedTime = new Date().toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const newNotif = {
        id: Date.now(),
        title: selectedStaff === 'Все' ? 'Общее уведомление' : 'Личное сообщение',
        text: notifText.trim(),
        time: formattedTime, 
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

  // --- ЛОГИКА ФИЛЬТРАЦИИ ПОЛЬЗОВАТЕЛЕЙ ПО ПОИСКУ ---
  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
      u.login.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  if (!isMounted) {
    return (
      <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', display: 'flex' }}>
        <Navigation />
        <div style={{ width: '260px', flexShrink: 0 }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', transition: '0.3s' }}>
      <Navigation />
      
      {/* Прячем распорку на телефонах */}
      <div className="desktop-sidebar-spacer" style={{ width: isSidebarOpen ? '260px' : '0', transition: '0.3s', flexShrink: 0 }} />

      <main className="admin-main" style={{ flex: 1, padding: '110px 40px 40px 40px', transition: '0.3s', boxSizing: 'border-box', maxWidth: '100%' }}>
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
                   <div style={{ background: '#000', padding: '15px', borderRadius: '20px', display: 'inline-block', border: '1px solid #333', maxWidth: '100%', wordBreak: 'break-word' }}>
                       <div style={{ color: '#0abab5', fontWeight: '900', fontSize: '14px', marginBottom: '10px' }}>
                           📎 {selectedFile.name}
                       </div>
                       <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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

            {/* СЕТКА: КОНТЕНТ + КАЛЕНДАРЬ */}
            <div className="admin-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', marginBottom: '30px', marginTop: '40px' }}>
              <section style={{ maxWidth: '100%', overflow: 'hidden' }}>
                
                {/* --- УПРАВЛЕНИЕ ПЕРСОНАЛОМ (С ПОИСКОМ И СКРОЛЛОМ) --- */}
                <div className="admin-flex-space" style={flexSpace}>
                  <h2 className="admin-section-title" style={sectionTitle}>Управление персоналом</h2>
                  <span onClick={() => setShowUserForm(true)} style={actionBtn}>+ Новый сотрудник</span>
                </div>

                {/* Строка поиска сотрудников */}
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '15px', opacity: 0.5, fontSize: '14px' }}>🔍</span>
                    <input 
                        type="text"
                        placeholder="Поиск по имени или логину..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        style={{ ...adminIn, paddingLeft: '45px', marginBottom: 0, background: '#111' } as any}
                    />
                </div>
                
                {/* Внутренний скролл для карточек */}
                <div className="custom-scroll" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '5px' }}>
                    <div className="admin-user-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {filteredUsers.length === 0 ? (
                          <div style={{ color: '#555', padding: '20px 0', fontSize: '14px', fontWeight: 'bold', gridColumn: '1 / -1', textAlign: 'center' }}>Сотрудники не найдены</div>
                      ) : (
                          filteredUsers.map(u => (
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
                          ))
                      )}
                    </div>
                </div>

                {/* --- КНОПКА ОТКРЫТИЯ РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ --- */}
                <div className="admin-flex-space" style={{ ...flexSpace, marginTop: '40px' }}>
                  <h2 
                    className="admin-section-title"
                    style={{ ...sectionTitle, cursor: 'pointer', color: '#0abab5', textDecoration: 'underline' }}
                    onClick={() => setShowTestModal(true)}
                  >
                    Результаты тестирования ↗
                  </h2>
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Всего записей: {testResults.length}</span>
                </div>

                {/* ОТПРАВКА УВЕДОМЛЕНИЙ */}
                <div style={{ ...adminCard, marginTop: '30px', padding: '25px' } as any}>
                    <h2 className="admin-section-title" style={{ ...sectionTitle, fontSize: '18px', marginBottom: '15px' }}>Отправить уведомление</h2>
                    <div className="admin-action-bar" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
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
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '100%' }}>
                <div style={adminCard}>
                    <h2 className="admin-section-title" style={{ ...sectionTitle, fontSize: '18px', marginBottom: '20px' }}>Ближайшие события</h2>
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
                    <div className="admin-flex-space" style={flexSpace}>
                        <h2 className="admin-section-title" style={sectionTitle}>Статистика обучения</h2>
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
                            <div key={user.id} className="admin-user-card" style={{ background: '#0d0d0d', borderRadius: '25px', padding: '25px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '15px' }}>
                                <div className="admin-user-avatar-col" style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '0 0 250px' }}>
                                    <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: '#222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                                        <span style={{ fontSize: '24px' }}>👤</span>
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#fff', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</h3>
                                        <div style={{ fontSize: '12px', color: '#0abab5', fontWeight: 'bold', marginTop: '3px' }}>@{user.login}</div>
                                    </div>
                                </div>

                                <div className="admin-user-bars-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '1px solid #222', paddingLeft: '30px' }}>
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

                                <div className="admin-user-actions-col" style={{ display: 'flex', gap: '12px', height: '50px', alignItems: 'flex-end', borderLeft: '1px solid #222', paddingLeft: '30px' }}>
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

      {/* МЕНЮ С ДОКУМЕНТАМИ В ЦЕНТРЕ ЭКРАНА (АДМИН) */}
      {showFilesList && (
          <div style={modalOverlay as any}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '550px' } as any}>
                  <h2 style={{ color: '#0abab5', fontWeight: '900', marginBottom: '25px', textAlign: 'center' }}>ЗАГРУЖЕННЫЕ МАТЕРИАЛЫ</h2>
                  
                  <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '25px', paddingRight: '10px' }} className="custom-scroll">
                      {urgentFiles.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#666' }}>Список пуст</p>
                      ) : (
                          urgentFiles.map(file => (
                              <div key={file.id} style={{ background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                  <div style={{ overflow: 'hidden', flex: '1 1 150px', paddingRight: '10px' }}>
                                      <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#fff' }}>📄 {file.name}</div>
                                      <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{file.date} • {file.size}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <button onClick={() => setPreviewFile(file)} style={{ background: 'transparent', border: 'none', color: '#0abab5', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>ОТКРЫТЬ</button>
                                      <button onClick={() => handleDownloadFile(file)} style={{ background: 'transparent', border: 'none', color: '#0abab5', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>СКАЧАТЬ</button>
                                      <button onClick={() => handleDeleteFile(file.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', padding: '0 5px' }}>✕</button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  <button onClick={() => setShowFilesList(false)} style={saveBtn as any}>← НАЗАД К ПАНЕЛИ</button>
              </div>
          </div>
      )}

      {/* --- НОВОЕ МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ --- */}
      {showTestModal && (
          <div style={modalOverlay as any} onClick={() => setShowTestModal(false)}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '650px', padding: '35px' } as any} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <h2 style={{ color: '#0abab5', fontWeight: '900', margin: 0, letterSpacing: '1px', fontSize: '18px' }}>РЕЗУЛЬТАТЫ ТЕСТОВ</h2>
                      <div onClick={() => setShowTestModal(false)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', lineHeight: 1, fontWeight: 'bold' }}>✕</div>
                  </div>

                  <select
                      style={{ ...adminIn, marginBottom: '25px', border: '1px solid #333' } as any}
                      value={selectedTestUser}
                      onChange={(e) => setSelectedTestUser(e.target.value)}
                  >
                      <option value="Все">Показать всех сотрудников</option>
                      {users.filter(u => u.role === 'staff').map(u => (
                          <option key={u.id} value={u.name}>{u.name} ({u.login})</option>
                      ))}
                  </select>

                  <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }} className="custom-scroll">
                      {testResults
                          .filter(res => selectedTestUser === 'Все' || res.userName === selectedTestUser)
                          .map((res: any) => {
                              const isPassed = res.score >= 80;
                              const scoreColor = isPassed ? '#0abab5' : '#ff4d4d';

                              return (
                                  <div key={res.id} style={{ background: '#000', border: '1px solid #222', padding: '20px', borderRadius: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                                      <div style={{ flex: 1, minWidth: '150px' }}>
                                          <div style={{ fontWeight: '900', color: '#fff', fontSize: '16px', marginBottom: '6px' }}>{res.testName}</div>
                                          <div style={{ fontSize: '13px', color: '#888' }}>Сотрудник: <span style={{color: '#ccc', fontWeight: 'bold'}}>{res.userName}</span> • Попыток: {res.attempts}</div>
                                      </div>
                                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                          <div style={{ fontWeight: '900', color: scoreColor, fontSize: '20px' }}>{res.score}%</div>
                                          <span style={statusBadge(scoreColor)}>{isPassed ? 'Пройден' : 'Не пройден'}</span>
                                      </div>
                                  </div>
                              );
                      })}
                      {testResults.filter(res => selectedTestUser === 'Все' || res.userName === selectedTestUser).length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', padding: '30px', fontWeight: 'bold', fontSize: '15px' }}>У этого сотрудника пока нет пройденных тестов</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- ФИРМЕННЫЕ МОДАЛЬНЫЕ ОКНА (УВЕДОМЛЕНИЯ) --- */}

      {/* 1. ОКНО УСПЕХА */}
      {showSuccessModal.show && (
          <div style={modalOverlay as any} onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '420px', padding: '35px', textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
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

      {/* 2. ОКНО ПОДТВЕРЖДЕНИЯ (УДАЛЕНИЕ) */}
      {confirmModal.show && (
          <div style={modalOverlay as any} onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '400px', padding: '35px', textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                  <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{confirmModal.title}</h2>
                  <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>
                      {confirmModal.text}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <button onClick={() => setConfirmModal({ ...confirmModal, show: false })} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, minWidth: '100px' } as any}>ОТМЕНА</button>
                      <button onClick={executeConfirmAction} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, minWidth: '100px' } as any}>УДАЛИТЬ</button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. ОКНО ОШИБКИ */}
      {errorModal.show && (
          <div style={modalOverlay as any} onClick={() => setErrorModal({ show: false, text: '' })}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '380px', padding: '35px', textAlign: 'center' } as any} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '50px', marginBottom: '20px' }}>⛔</div>
                  <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>ОШИБКА</h2>
                  <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{errorModal.text}</p>
                  <button onClick={() => setErrorModal({ show: false, text: '' })} style={{ ...saveBtn, background: '#333', color: '#fff' } as any}>ПОНЯТНО</button>
              </div>
          </div>
      )}

      {/* 4. ОКНО ПРЕДПРОСМОТРА ФАЙЛА */}
      {previewFile && (
          <div style={modalOverlay as any} onClick={() => setPreviewFile(null)}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '80%', height: '85vh', padding: '25px', display: 'flex', flexDirection: 'column' } as any} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                      <h2 style={{ color: '#0abab5', fontWeight: '900', fontSize: '18px', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile.name}</h2>
                      <div onClick={() => setPreviewFile(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1 }}>✕</div>
                  </div>
                  <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                      {previewFile.data ? (
                          <iframe src={previewFile.data} style={{ width: '100%', height: '100%', border: 'none' }} title="Предпросмотр файла" />
                      ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>
                              Нет данных для отображения (загружено в старой версии)
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* 5. МОДАЛКА СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ */}
      {showUserForm && (
        <div style={modalOverlay as any}>
            <div className="admin-modal-content" style={modalContentSmall as any}>
                <h2 style={{color:'#0abab5', marginBottom:'25px', fontWeight: '900', textAlign: 'center'}}>НОВЫЙ СОТРУДНИК</h2>
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

      {/* 6. ПАНЕЛЬ ЗАМЕТОК (САЙДБАР) */}
      {selectedDateKey && (
        <div style={noteOverlayStyle as any} onClick={closeNotePanel}>
          <div style={noteSidebarStyle as any} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0abab5' }}>ЗАМЕТКА</h2>
              <div onClick={closeNotePanel} style={{ cursor: 'pointer', fontSize: '20px', opacity: 0.5 }}>✕</div>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#ccc' }}>Дата: {formattedSelectedDate()}</p>
            <textarea autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Текст заметки..." style={noteTextarea} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={saveNote} style={{...adminSendBtn, flex: 1, minWidth: '100px'} as any}>СОХРАНИТЬ</button>
                {notes[selectedDateKey] && <button onClick={deleteNote} style={{...noteDeleteBtn, flex: 1, minWidth: '100px'} as any}>УДАЛИТЬ</button>}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        * { box-sizing: border-box; }
        
        /* ⚠️ ИСПРАВЛЕНИЕ: ДОБАВЛЕНО overflow-y: auto !important; ДЛЯ ДЕСКТОПНОГО СКРОЛЛА ⚠️ */
        html, body { 
            overflow-x: hidden !important; 
            overflow-y: auto !important; 
            width: 100vw; 
            margin: 0; 
            padding: 0; 
            background: #0d0f0d; 
        }

        .cal-day { position: relative; font-size: 13px; padding: 10px 0; border-radius: 12px; font-weight: 800; color: #fff; cursor: pointer; transition: 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 38px; }
        .cal-day:hover { background: #0abab5; color: #000; }
        .cal-day.today { background: #0abab5; color: #000; }
        .note-dot { position: absolute; bottom: 4px; width: 4px; height: 4px; background: #0abab5; border-radius: 50%; }
        .cal-day:hover .note-dot, .cal-day.today .note-dot { background: #000; }
        
        /* Стилизация скроллбара для модальных окон */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

        /* --- ПРАВИЛА ИСКЛЮЧИТЕЛЬНО ДЛЯ ТЕЛЕФОНОВ (до 768px) --- */
        @media (max-width: 768px) {
            .desktop-sidebar-spacer { display: none !important; width: 0 !important; }
            .admin-main { padding: 90px 15px 50px 15px !important; }
            .admin-layout-grid { grid-template-columns: 1fr !important; gap: 20px !important; margin-top: 20px !important; }
            
            .admin-section-title { font-size: 20px !important; margin-bottom: 20px !important; }
            .admin-flex-space { flex-direction: column; align-items: flex-start !important; gap: 15px !important; margin-bottom: 25px !important; }
            
            /* Сетка пользователей */
            .admin-user-grid { grid-template-columns: 1fr !important; }
            
            /* Карточка статистики сотрудника (разворачиваем в колонку) */
            .admin-user-card { 
                flex-direction: column !important; 
                align-items: flex-start !important; 
                gap: 20px !important; 
                padding: 20px !important;
            }
            .admin-user-avatar-col { flex: auto !important; width: 100% !important; margin-bottom: 0 !important; }
            .admin-user-bars-col { 
                border-left: none !important; 
                padding-left: 0 !important; 
                width: 100% !important; 
                border-top: 1px solid #222; 
                padding-top: 20px !important; 
            }
            .admin-user-actions-col { 
                border-left: none !important; 
                padding-left: 0 !important; 
                width: 100% !important; 
                justify-content: flex-end; 
                height: auto !important; 
                border-top: 1px solid #222; 
                padding-top: 20px !important;
            }

            /* Панель отправки уведомлений */
            .admin-action-bar { flex-direction: column; align-items: stretch !important; gap: 15px !important; }
            .admin-action-bar > * { width: 100% !important; }

            /* Модальные окна */
            .admin-modal-content {
                padding: 30px 20px !important;
                width: 95% !important;
                border-radius: 25px !important;
            }
        }
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
const scheduleItem: any = { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px', padding: '15px', background: '#0d0d0d', borderRadius: '20px', border: '1px solid #1a1a1a' };
const dateBox: any = { background: '#0abab5', color: '#000', padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', textAlign: 'center', minWidth: '45px' };
const calNavBtn: any = { cursor: 'pointer', opacity: 0.5, fontSize: '16px' };
const calendarGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' };
const calDayHead: any = { fontSize: '11px', opacity: 0.3, fontWeight: '900', marginBottom: '10px' };
const statusBadge = (color: string): any => ({ background: `${color}15`, color: color, padding: '6px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900' });
const barStyle = (h: number): any => ({ width: '12px', height: `${h}%`, background: 'linear-gradient(to top, #0abab5, #0abab533)', borderRadius: '4px 4px 2px 2px', transition: '1s ease' });
const adminSendBtn: any = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '18px', fontWeight: '900', cursor: 'pointer' };
const adminIn = { width: '100%', padding: '16px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' as any };
const saveBtn = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };
const modalOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30000, backdropFilter: 'blur(15px)', padding: '20px', boxSizing: 'border-box' };
const modalContentSmall: any = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxSizing: 'border-box' };
const noteOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 20000, display: 'flex', justifyContent: 'flex-end' };
const noteSidebarStyle = { width: '100%', maxWidth: '400px', height: '100%', background: '#000', borderLeft: '1px solid #222', padding: '40px 30px', animation: 'slideInRight 0.3s ease', boxShadow: '-20px 0 50px rgba(0,0,0,0.8)', boxSizing: 'border-box' as any };
const noteTextarea = { width: '100%', height: '200px', background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '20px', color: '#fff', outline: 'none', fontSize: '15px', resize: 'none' as any, lineHeight: '1.5', boxSizing: 'border-box' as any };
const noteDeleteBtn = { width: '100%', padding: '18px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '18px', fontWeight: '900', cursor: 'pointer' };