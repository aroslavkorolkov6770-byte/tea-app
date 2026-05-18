"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const DAYS_OF_WEEK = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const saveDataToServer = (key: string, data: any) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

// ============================================================================
// СТИЛИ АДМИНКИ
// ============================================================================
const uploadZoneStyle: React.CSSProperties = { background: '#111', border: '2px dashed', borderRadius: '35px', padding: '25px 20px', textAlign: 'center', transition: '0.3s ease', cursor: 'pointer' };
const flexSpace: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' };
const sectionTitle: React.CSSProperties = { fontSize: '22px', fontWeight: '900', color: '#fff' };
const actionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const adminCard: React.CSSProperties = { background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222' };
const userCardStyle: React.CSSProperties = { background: '#111', padding: '25px', borderRadius: '25px', border: '1px solid #222', transition: '0.3s' };
const dateBox: React.CSSProperties = { color: '#000', padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', textAlign: 'center', minWidth: '42px' };
const calNavBtn: React.CSSProperties = { cursor: 'pointer', opacity: 0.5, fontSize: '16px' };
const calendarGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' };
const calDayHead: React.CSSProperties = { fontSize: '11px', opacity: 0.3, fontWeight: '900', marginBottom: '10px' };
const statusBadge = (color: string): React.CSSProperties => ({ background: `${color}15`, color: color, padding: '6px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900' });
const barStyle = (h: number): React.CSSProperties => ({ width: '12px', height: `${h}%`, background: 'linear-gradient(to top, #0abab5, #0abab533)', borderRadius: '4px 4px 2px 2px', transition: '1s ease' });
const adminSendBtn: React.CSSProperties = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '18px', fontWeight: '900', cursor: 'pointer' };
const adminIn: React.CSSProperties = { width: '100%', padding: '16px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '12px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30000, backdropFilter: 'blur(15px)', padding: '20px', boxSizing: 'border-box' };
const modalContentSmall: React.CSSProperties = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxSizing: 'border-box' };
const noteOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 20000, display: 'flex', justifyContent: 'flex-end' };
const noteSidebarStyle: React.CSSProperties = { width: '100%', maxWidth: '400px', height: '100%', background: '#000', borderLeft: '1px solid #222', padding: '40px 30px', animation: 'slideInRight 0.3s ease', boxShadow: '-20px 0 50px rgba(0,0,0,0.8)', boxSizing: 'border-box', overflowY: 'auto' };
const noteTextarea: React.CSSProperties = { width: '100%', background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '20px', color: '#fff', outline: 'none', fontSize: '15px', resize: 'none', lineHeight: '1.5', boxSizing: 'border-box' };
const noteDeleteBtn: React.CSSProperties = { width: '100%', padding: '18px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '18px', fontWeight: '900', cursor: 'pointer' };
const adminActionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const editIconStyle: React.CSSProperties = { background: '#111', color: '#0abab5', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };
const delIconStyle: React.CSSProperties = { background: '#111', color: '#ff4d4d', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };
const profileBtnStyle: React.CSSProperties = { marginTop: '8px', fontSize: '10px', background: '#222', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-block', color: '#aaa', fontWeight: 'bold', transition: '0.2s' };

const profileHeaderCardStyle: React.CSSProperties = { position: 'relative', backgroundColor: '#161816', padding: '40px 30px', borderRadius: '40px', border: '1px solid #222', textAlign: 'center', marginBottom: '25px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' };
const profileSectionTitle: React.CSSProperties = { fontSize: '12px', fontWeight: '900', color: '#888', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase' };
const progressSectionStyle: React.CSSProperties = { background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid #222', marginBottom: '35px' };
const labelRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', fontWeight: '900' };
const barBg: React.CSSProperties = { width: '100%', height: '10px', background: '#000', borderRadius: '12px', overflow: 'hidden' };
const barFill: React.CSSProperties = { height: '100%', background: '#0abab5', transition: '1.2s cubic-bezier(0.4, 0, 0.2, 1)' };
const badgeStyle: React.CSSProperties = { background: '#111', height: '80px', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', border: '1px solid #222', transition: '0.4s' };
const contactCardStyle: React.CSSProperties = { background: '#161816', padding: '30px', borderRadius: '30px', border: '1px solid #222', marginBottom: '35px' };
const contactIconStyle: React.CSSProperties = { width: '45px', height: '45px', background: '#000', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' };

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('granted');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  
  const [noteType, setNoteType] = useState<'personal' | 'deadline'>('personal');
  const [deadlineTarget, setDeadlineTarget] = useState<string>('Все');
  const [eventTab, setEventTab] = useState<'personal' | 'deadline'>('personal');

  const [users, setUsers] = useState<any[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', login: '', pass: '', role: 'staff' });
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedProfileUser, setSelectedProfileUser] = useState<any>(null);

  const [interactionTab, setInteractionTab] = useState<'notif' | 'test'>('notif');
  const [selectedStaff, setSelectedStaff] = useState("Все");
  const [notifText, setNotifText] = useState("");
  const [testType, setTestType] = useState('final');
  const [showTestEditor, setShowTestEditor] = useState(false);
  const [testFormData, setTestFormData] = useState({ title: 'Итоговая аттестация', quiz: [{ q: '', o: ['', '', ''], c: 0 }] });

  const [totalBasicsModules, setTotalBasicsModules] = useState(50);
  const [totalRouteSteps, setTotalRouteSteps] = useState(5);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [usersStats, setUsersStats] = useState<Record<string, {route: number, basics: number}>>({});
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urgentFiles, setUrgentFiles] = useState<any[]>([]);
  
  const [showFilesList, setShowFilesList] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const [showSuccessModal, setShowSuccessModal] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });
  const [errorModal, setErrorModal] = useState({ show: false, text: '' });
  const [confirmModal, setConfirmModal] = useState<{show: boolean, type: 'user'|'file'|null, id: string, title: string, text: string}>({ show: false, type: null, id: '', title: '', text: '' });

  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTestUser, setSelectedTestUser] = useState("Все");

  useEffect(() => {
    setIsMounted(true);
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('sidebarToggle', handleToggle);

    if (typeof window !== 'undefined') {
        if (!('Notification' in window)) {
            setPushStatus('unsupported');
        } else {
            setPushStatus(Notification.permission as any);
        }
    }

    const loadAllData = async () => {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            
            const notesRes = await fetch(`/api/storage${cacheBuster}&key=admin_cal_notes_v1`);
            const notesData = await notesRes.json();
            if (notesData && Object.keys(notesData).length > 0 && !Array.isArray(notesData)) setNotes(notesData);

            const usersRes = await fetch(`/api/storage${cacheBuster}&key=tea_hub_users_v1`);
            let usersData = await usersRes.json();
            if (!Array.isArray(usersData) || usersData.length === 0) {
                usersData = [
                    { id: 'u_admin', login: '11', pass: '11', role: 'admin', name: 'Главный Мастер' },
                    { id: 'u_staff', login: '1', pass: '1', role: 'staff', name: 'Ярик' }
                ];
                saveDataToServer('tea_hub_users_v1', usersData);
            }
            setUsers(usersData);

            const testRes = await fetch(`/api/storage${cacheBuster}&key=tea_hub_test_results_v1`);
            let testData = await testRes.json();
            if (!Array.isArray(testData) || testData.length === 0) testData = [];
            setTestResults(testData);

            const filesRes = await fetch(`/api/storage${cacheBuster}&key=tea_hub_urgent_files_v1`);
            const filesData = await filesRes.json();
            if (Array.isArray(filesData)) setUrgentFiles(filesData);

            const bRes = await fetch(`/api/storage${cacheBuster}&key=tea_hub_dynamic_basics_v2`);
            const bDb = await bRes.json().catch(() => []);
            const rRes = await fetch(`/api/storage${cacheBuster}&key=tea_hub_dynamic_route_v2`);
            const rDb = await rRes.json().catch(() => []);
            
            setTotalBasicsModules((Array.isArray(bDb) ? bDb : []).reduce((acc: number, s: any) => acc + (s.modules?.length || 0), 0) || 50);
            setTotalRouteSteps(Array.isArray(rDb) ? rDb.length : 5);

            const stats: Record<string, {route: number, basics: number}> = {};
            const avatarsFound: Record<string, string> = {};
            const profilesFound: Record<string, any> = {};

            await Promise.all(usersData.map(async (u: any) => {
                if (u.avatar) avatarsFound[u.id] = u.avatar;
                try {
                    const profData = await fetch(`/api/storage${cacheBuster}&key=profile_data_${u.id}`).then(r => r.json()).catch(() => null);
                    if (profData && !Array.isArray(profData)) {
                        profilesFound[u.id] = profData;
                        if (profData.avatar) avatarsFound[u.id] = profData.avatar;
                    }
                } catch(e) {}

                if (u.role === 'staff') {
                    try {
                        const [uRouteData, uBasicsData] = await Promise.all([
                            fetch(`/api/storage${cacheBuster}&key=prog_route_${u.id}`).then(r => r.json()).catch(() => []),
                            fetch(`/api/storage${cacheBuster}&key=prog_basics_${u.id}`).then(r => r.json()).catch(() => [])
                        ]);
                        stats[u.id] = {
                            route: Array.isArray(uRouteData) ? uRouteData.length : 0,
                            basics: Array.isArray(uBasicsData) ? uBasicsData.length : 0
                        };
                    } catch(e) {
                        stats[u.id] = { route: 0, basics: 0 };
                    }
                }
            }));
            
            setUsersStats(stats);
            setUserAvatars(avatarsFound);
            setUserProfiles(profilesFound);

        } catch (error) {
            console.error("Ошибка загрузки данных с сервера:", error);
        }
    };

    loadAllData();
    return () => window.removeEventListener('sidebarToggle', handleToggle);
  }, []);

  const subscribeToPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          alert("Браузер не поддерживает Web Push уведомления.");
          return;
      }
      
      const currentId = localStorage.getItem('current_user_id') || 'guest';
      
      if (currentId === 'guest' || !currentId) {
          alert("⚠️ Перед включением уведомлений нужно войти в свой аккаунт на этом устройстве!");
          return;
      }

      try {
          const permission = await Notification.requestPermission();
          setPushStatus(permission);
          
          if (permission === 'granted') {
              const swUrl = `/sw.js?v=${Date.now()}`;
              const registration = await navigator.serviceWorker.register(swUrl);
              let subscription = await registration.pushManager.getSubscription();

              if (!subscription) {
                  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                  if (!vapidPublicKey) {
                      alert("⚠️ Ошибка: VAPID ключ не найден! Убедитесь, что NEXT_PUBLIC_VAPID_PUBLIC_KEY прописан в .env и сервер перезапущен.");
                      return;
                  }

                  const urlBase64ToUint8Array = (base64String: string) => {
                      const cleanKey = base64String.replace(/["']/g, '').trim();
                      const padding = '='.repeat((4 - cleanKey.length % 4) % 4);
                      const base64 = (cleanKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                      const rawData = window.atob(base64);
                      const outputArray = new Uint8Array(rawData.length);
                      for (let i = 0; i < rawData.length; ++i) {
                          outputArray[i] = rawData.charCodeAt(i);
                      }
                      return outputArray;
                  };

                  subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                  });

                  const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_push_subs_v1`);
                  let subs = await res.json().catch(() => []);
                  if (!Array.isArray(subs)) subs = [];

                  const exists = subs.find((s: any) => s.sub.endpoint === subscription?.endpoint);
                  if (!exists) {
                      subs.push({ userId: currentId, sub: subscription });
                      saveDataToServer('tea_hub_push_subs_v1', subs);
                      alert("✅ Вы успешно подписались на уведомления!");
                  } else {
                      alert("✅ Вы уже были подписаны.");
                  }
              }
          } else {
              alert("❌ Вы заблокировали уведомления в браузере.");
          }
      } catch (error) {
          console.error('Ошибка подписки на Push:', error);
          alert("Критическая ошибка при попытке подписки: " + error);
      }
  };

  // ⚠️ УЛУЧШЕННАЯ ФУНКЦИЯ ОПОВЕЩЕНИЯ НА EMAIL С ЖЕСТКИМИ СИСТЕМНЫМИ ALERTS ДЛЯ ОТЛАДКИ ⚠️
  const sendEmailNotification = async (targetUserId: string, subject: string, text: string) => {
      try {
          let emailsToSend: string[] = [];

          if (targetUserId === 'Все') {
              users.filter(u => u.role === 'staff').forEach(u => {
                  const email = userProfiles[u.id]?.email || u.email;
                  if (email) emailsToSend.push(email);
              });
          } else {
              const targetUser = users.find(u => u.id === targetUserId);
              const email = userProfiles[targetUserId]?.email || targetUser?.email;
              if (email) emailsToSend.push(email);
          }

          if (emailsToSend.length === 0) {
              alert("ℹ️ Отладка Email:\nВ профиле получателя (или у всех сотрудников) отсутствует Email-адрес! Отправка письма автоматически отменена.");
              return false;
          }

          const to = emailsToSend.join(', ');
          alert(`📨 Отладка Email:\nЗапускаем отправку на ящик: ${to}\nТема: ${subject}`);

          const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, text })
          });

          const responseText = await res.text();
          let data = {};
          try { data = JSON.parse(responseText); } catch(e) {}

          if (res.ok) {
              alert(`✅ Отладка Email:\nПочтовый робот успешно отправил письмо на адрес: ${to}! Проверяйте Входящие / Спам.`);
              return true;
          } else {
              alert(`❌ Отладка Email (ОШИБКА SMTP СЕРВЕРА):\nКод ответа: ${res.status}\nОписание ошибки: ${(data as any).error || responseText || 'Неизвестный сбой SMTP'}`);
              return false;
          }
      } catch (e: any) {
          alert(`💥 Отладка Email (КРИТИЧЕСКИЙ СБОЙ СЕТИ):\nНе удалось связаться с /api/send-email.\nПричина: ${e.message}`);
          return false;
      }
  };

  // 🔔 ФУНКЦИЯ ДЛЯ ОТПРАВКИ WEB-PUSH 🔔
  const sendPushNotification = async (targetUserId: string, payload: { title: string, body: string, url?: string }) => {
      try {
          const subsRes = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_push_subs_v1`, { cache: 'no-store' });
          const subs = await subsRes.json().catch(() => []);
          
          if (!Array.isArray(subs) || subs.length === 0) {
              console.log("⚠️ ПРЕДУПРЕЖДЕНИЕ: База подписок пуста! Пуш не отправлен.");
              return false;
          }

          const targetSubs = targetUserId === 'Все' 
              ? subs 
              : subs.filter((s: any) => s.userId === targetUserId);

          if (targetSubs.length === 0) {
              console.log(`⚠️ ПРЕДУПРЕЖДЕНИЕ: У пользователя (${targetUserId}) нет привязанных устройств.`);
              return false;
          }

          const apiRes = await fetch('/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  subscriptions: targetSubs.map((s: any) => s.sub),
                  payload: payload
              })
          });

          if (!apiRes.ok) {
              console.log("СЕРВЕРНАЯ ОШИБКА Push API");
              return false;
          }

          return true;
      } catch (e) {
          console.error("Ошибка при отправке Web Push:", e);
          return false;
      }
  };

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
      
      setShowSuccessModal({ show: true, title: 'СОТРУДНИК СОЗДАН', text: `Учетная запись для ${newUser.name} успешно добавлена в базу данных.` });
      setNewUser({ name: '', login: '', pass: '', role: 'staff' });
  };

  const handleDeleteUser = (id: string) => {
      if (id === 'u_admin' || id === 'u_staff') {
          setErrorModal({ show: true, text: "Базовые системные аккаунты удалить нельзя!" });
          return;
      }
      setConfirmModal({ show: true, type: 'user', id: id, title: 'УДАЛЕНИЕ СОТРУДНИКА', text: 'Вы уверены, что хотите удалить учетную запись этого сотрудника? Это действие необратимо.' });
  };

  const handleSaveFile = () => {
      if (!selectedFile || isProcessing) return;
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const fileData = e.target?.result;
              const newFile = {
                  id: 'file_' + Date.now(),
                  name: selectedFile.name,
                  size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                  date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                  data: fileData 
              };
              
              const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_urgent_files_v1`);
              let currentFiles = await res.json().catch(() => []);
              if (!Array.isArray(currentFiles)) currentFiles = [];

              const updatedFiles = [newFile, ...currentFiles];
              setUrgentFiles(updatedFiles);
              await saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);
              
              await sendPushNotification('Все', {
                  title: '📚 Новый учебный материал',
                  body: `В базу добавлен файл: ${selectedFile.name}`,
                  url: '/tasks?tab=edu'
              });
              
              await sendEmailNotification('Все', '📚 Новый учебный материал', `Администратор добавил новый файл в базу знаний: ${selectedFile.name}`);

              setShowSuccessModal({ show: true, title: 'МАТЕРИАЛ ОТПРАВЛЕН', text: `Файл "${selectedFile.name}" успешно загружен и появится у сотрудников.` });
              setSelectedFile(null);
          } finally {
              setIsProcessing(false);
          }
      };
      reader.readAsDataURL(selectedFile);
  };

  const handleDeleteFile = (id: string) => {
      setConfirmModal({ show: true, type: 'file', id: id, title: 'УДАЛЕНИЕ МАТЕРИАЛА', text: 'Вы действительно хотите удалить этот учебный материал у всех сотрудников?' });
  };

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

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const shiftStartDay = startDayIndex === 0 ? 6 : startDayIndex - 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = (d: number) => today.getDate() === d && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const openNotePanel = (day: number) => {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
      setSelectedDateKey(key);
      setNoteText(notes[key] || "");
      setNoteType('personal');
      setDeadlineTarget('Все');
  };

  const closeNotePanel = () => {
      setSelectedDateKey(null);
      setNoteText("");
  };

  const saveNote = async () => {
      if (!selectedDateKey) return;
      
      if (!noteText.trim()) {
          const newNotes = { ...notes };
          delete newNotes[selectedDateKey];
          setNotes(newNotes);
          saveDataToServer('admin_cal_notes_v1', newNotes);
          closeNotePanel();
          return;
      }

      if (isProcessing) return;
      setIsProcessing(true);

      try {
          const newNotes = { ...notes };
          let adminNoteText = noteText.trim();
          
          if (noteType === 'deadline') {
              const targetName = deadlineTarget === 'Все' ? 'Всем' : users.find(u => u.id === deadlineTarget)?.name || deadlineTarget;
              adminNoteText = `[Дедлайн: ${targetName}]\n${noteText.trim()}`;
              
              const newDeadlineTask = {
                  id: 'deadline_' + Date.now(),
                  name: '⚠️ Дедлайн: ' + noteText.trim(),
                  size: 'Выполнить до: ' + formattedSelectedDate(),
                  date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                  target: deadlineTarget,
                  isTest: false
              };

              const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_urgent_files_v1`);
              let currentFiles = await res.json().catch(() => []);
              if (!Array.isArray(currentFiles)) currentFiles = [];

              const updatedFiles = [newDeadlineTask, ...currentFiles];
              setUrgentFiles(updatedFiles);
              await saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);

              newNotes[selectedDateKey] = adminNoteText;
              setNotes(newNotes);
              saveDataToServer('admin_cal_notes_v1', newNotes);

              await sendPushNotification(deadlineTarget, {
                  title: '⚠️ Новый дедлайн',
                  body: noteText.trim(),
                  url: '/tasks?tab=edu'
              });
              
              await sendEmailNotification(deadlineTarget, '⚠️ Внимание: Новый дедлайн!', `Вам назначен дедлайн (выполнить до: ${formattedSelectedDate()}).\nЗадача: ${noteText.trim()}`);

              setShowSuccessModal({ show: true, title: 'ДЕДЛАЙН НАЗНАЧЕН', text: `Задача сохранена в расписание и отправлена на устройства.` });
          } else {
              newNotes[selectedDateKey] = adminNoteText;
              setNotes(newNotes);
              saveDataToServer('admin_cal_notes_v1', newNotes);
          }
      } finally {
          setIsProcessing(false);
          closeNotePanel();
      }
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

  const handleSendNotification = async () => {
    if (!notifText.trim() || isProcessing) return;
    setIsProcessing(true);
    
    try {
        const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_notifications_v1`);
        const currentNotifs = await res.json().catch(() => []);
        const arr = Array.isArray(currentNotifs) ? currentNotifs : [];
        const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
        
        const newNotif = { 
            id: Date.now(), 
            title: selectedStaff === 'Все' ? 'Общее уведомление' : 'Личное сообщение', 
            text: notifText.trim(), 
            time: formattedTime, 
            target: selectedStaff 
        };

        await saveDataToServer('tea_hub_notifications_v1', [newNotif, ...arr]);

        await sendPushNotification(selectedStaff, {
            title: newNotif.title,
            body: newNotif.text,
            url: '/tasks?tab=welcome'
        });
        
        await sendEmailNotification(selectedStaff, newNotif.title, newNotif.text);

        setShowSuccessModal({ show: true, title: 'СООБЩЕНИЕ ОТПРАВЛЕНО', text: 'Уведомление доставлено сотрудникам.' });
        setNotifText("");
    } finally {
        setIsProcessing(false);
    }
  };

  const getBaseQuizTemplate = () => [
      { q: 'Какой водой заваривать зеленый чай?', o: ['100°C', '75-80°C', '60°C'], c: 1 },
      { q: 'Что такое Гайвань?', o: ['Чайник', 'Чашка с крышкой', 'Поднос'], c: 1 },
      { q: 'Какая скрутка у Те Гуань Инь?', o: ['Продольная', 'Сферическая', 'Прессованная'], c: 1 }
  ];

  const handleOpenTestEditor = () => {
      setTestFormData({
          title: testType === 'final' ? 'Итоговая аттестация' : 'Переаттестация',
          quiz: getBaseQuizTemplate()
      });
      setShowTestEditor(true);
  };

  const handleQuickSendTest = async () => {
      if (isProcessing) return;
      setIsProcessing(true);

      try {
          const title = testType === 'final' ? 'Итоговая аттестация' : 'Переаттестация';
          const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
          
          const newTestTask = {
              id: 'test_' + Date.now(),
              name: title,
              size: 'Интерактивный тест',
              date: formattedTime,
              isTest: true,
              target: selectedStaff,
              quiz: getBaseQuizTemplate()
          };

          const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_urgent_files_v1`);
          let currentFiles = await res.json().catch(() => []);
          if (!Array.isArray(currentFiles)) currentFiles = [];

          const updatedFiles = [newTestTask, ...currentFiles];
          setUrgentFiles(updatedFiles);
          await saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);
          
          await sendPushNotification(selectedStaff, {
              title: '🎓 Новая аттестация',
              body: `Вам назначен тест: ${title}`,
              url: '/tasks?tab=edu'
          });
          
          await sendEmailNotification(selectedStaff, '🎓 Вам назначена новая аттестация', `Администратор назначил вам новый тест для прохождения: ${title}. Зайдите в Tea Hub, чтобы его выполнить.`);

          setShowSuccessModal({ show: true, title: 'АТТЕСТАЦИЯ НАЗНАЧЕНА', text: `Тест успешно отправлен сотрудникам.` });
      } catch (e) {
          console.error("Ошибка при отправке теста", e);
      } finally {
          setIsProcessing(false);
      }
  };

  const updateTestQuestion = (index: number, field: string, value: any) => {
      const newQuiz = [...testFormData.quiz];
      if (field === 'q') newQuiz[index].q = value;
      if (field === 'c') newQuiz[index].c = value;
      if (field.startsWith('o')) {
          const oIndex = parseInt(field.replace('o', ''));
          newQuiz[index].o[oIndex] = value;
      }
      setTestFormData({...testFormData, quiz: newQuiz});
  };

  const addTestQuestion = () => {
      setTestFormData({...testFormData, quiz: [...testFormData.quiz, { q: '', o: ['', '', ''], c: 0 }]});
  };

  const removeTestQuestion = (index: number) => {
      const newQuiz = testFormData.quiz.filter((_, i) => i !== index);
      setTestFormData({...testFormData, quiz: newQuiz});
  };

  const handleSendTest = async () => {
      if (testFormData.quiz.some(q => !q.q.trim() || q.o.some(opt => !opt.trim()))) {
          setErrorModal({ show: true, text: 'Все вопросы и варианты ответов должны быть заполнены!' });
          return;
      }
      
      if (isProcessing) return;
      setIsProcessing(true);

      try {
          const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
          const newTestTask = {
              id: 'test_' + Date.now(),
              name: testFormData.title,
              size: 'Интерактивный тест',
              date: formattedTime,
              isTest: true,
              target: selectedStaff,
              quiz: testFormData.quiz
          };

          const res = await fetch('/api/storage?key=tea_hub_urgent_files_v1');
          let currentFiles = await res.json().catch(() => []);
          if (!Array.isArray(currentFiles)) currentFiles = [];

          const updatedFiles = [newTestTask, ...currentFiles];
          setUrgentFiles(updatedFiles);
          await saveDataToServer('tea_hub_urgent_files_v1', updatedFiles);
          
          await sendPushNotification(selectedStaff, {
              title: '🎓 Новая аттестация',
              body: `Вам назначен тест: ${testFormData.title}`,
              url: '/tasks?tab=edu'
          });
          
          await sendEmailNotification(selectedStaff, '🎓 Вам назначена новая аттестация', `Администратор назначил вам новый тест для прохождения: ${testFormData.title}. Зайдите в Tea Hub, чтобы его выполнить.`);

          setShowSuccessModal({ show: true, title: 'АТТЕСТАЦИЯ НАЗНАЧЕНА', text: `Тест "${testFormData.title}" успешно отправлен.` });
          setShowTestEditor(false);
      } catch (e) {
          console.error("Ошибка при отправке теста", e);
      } finally {
          setIsProcessing(false);
      }
  };

  const parsedEvents = Object.entries(notes)
    .map(([key, text]) => {
      const [y, m, d] = key.split('-').map(Number);
      const dateObj = new Date(y, m, d);
      const isDeadline = text.startsWith('[Дедлайн:');
      
      let title = text;
      let desc = '';
      let target = '';

      if (isDeadline) {
          const match = text.match(/\[Дедлайн: (.*?)\]\n?([\s\S]*)/);
          if (match) {
              target = match[1];
              const cleanText = match[2];
              const lines = cleanText.split('\n');
              title = lines[0] || 'Без названия';
              desc = lines.slice(1).join(' ');
          }
      } else {
          const lines = text.split('\n');
          title = lines[0] || 'Без названия';
          desc = lines.slice(1).join(' ');
      }
      
      return { key, text, dateObj, d, isDeadline, target, title, desc };
    })
    .filter(event => event.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const filteredEvents = parsedEvents.filter(e => eventTab === 'personal' ? !e.isDeadline : e.isDeadline);
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.login.toLowerCase().includes(userSearchQuery.toLowerCase()));
  const uploadedMaterials = urgentFiles.filter(f => !f.isTest && !f.id.startsWith('deadline_'));

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', transition: '0.3s' }}>
      <Navigation />
      <div className="desktop-sidebar-spacer" style={{ width: isSidebarOpen ? '260px' : '0', transition: '0.3s', flexShrink: 0 }} />
      <main className="admin-main" style={{ flex: 1, padding: '110px 40px 40px 40px', transition: '0.3s', boxSizing: 'border-box', maxWidth: '100%' }}>
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            {pushStatus === 'default' && (
                <div style={{ background: '#111', border: '1px solid #0abab5', borderRadius: '18px', padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0abab5', fontWeight: '900' }}>Включите Web-Push (Тестовый режим)</h3>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>Нажмите "Разрешить", чтобы протестировать получение пушей прямо на этот компьютер.</p>
                    </div>
                    <button onClick={subscribeToPush} style={{ background: '#0abab5', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>РАЗРЕШИТЬ</button>
                </div>
            )}
            
            <div 
              style={{ ...uploadZoneStyle, borderColor: isDragging ? '#0abab5' : '#333', opacity: isProcessing ? 0.5 : 1 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { 
                e.preventDefault(); 
                setIsDragging(false); 
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setSelectedFile(e.dataTransfer.files[0]);
              }}
            >
               <div style={{ fontSize: '28px', marginBottom: '10px' }}>📁</div>
               <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginBottom: '5px' }}>Загрузка учебных материалов</h3>
               {!selectedFile ? (
                   <>
                       <p style={{ color: '#888', fontSize: '13px', marginBottom: '15px', maxWidth: '500px', margin: '0 auto 15px auto', lineHeight: '1.4' }}>Перетащите сюда документ (PDF, DOCX, TXT) или нажмите кнопку ниже.</p>
                       <input type="file" id="file-upload-admin" style={{ display: 'none' }} disabled={isProcessing} onChange={(e) => { if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]); }} />
                       <button onClick={() => document.getElementById('file-upload-admin')?.click()} disabled={isProcessing} style={{ ...actionBtn, background: '#0abab5', color: '#000', border: 'none', padding: '10px 25px', fontSize: '13px' }}>ВЫБРАТЬ ФАЙЛ</button>
                       {uploadedMaterials.length > 0 && <div onClick={() => setShowFilesList(true)} style={{ marginTop: '15px', color: '#0abab5', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', opacity: 0.8 }}>Загруженный материал ({uploadedMaterials.length})</div>}
                   </>
               ) : (
                   <div style={{ background: '#000', padding: '15px', borderRadius: '20px', display: 'inline-block', border: '1px solid #333', maxWidth: '100%', wordBreak: 'break-word' }}>
                       <div style={{ color: '#0abab5', fontWeight: '900', fontSize: '14px', marginBottom: '10px' }}>📎 {selectedFile.name}</div>
                       <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                           <button onClick={handleSaveFile} disabled={isProcessing} style={{ ...saveBtn, padding: '10px 20px', width: 'auto', fontSize: '12px', borderRadius: '10px' }}>{isProcessing ? 'ОТПРАВКА...' : 'ПРИКРЕПИТЬ'}</button>
                           <button onClick={() => setSelectedFile(null)} disabled={isProcessing} style={{ ...saveBtn, background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '10px 20px', width: 'auto', fontSize: '12px', borderRadius: '10px' }}>ОТМЕНИТЬ</button>
                       </div>
                   </div>
               )}
            </div>

            <div className="admin-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', marginBottom: '30px', marginTop: '40px' }}>
              <section style={{ minWidth: 0 }}>
                <div style={flexSpace}>
                  <h2 style={sectionTitle}>Управление персоналом</h2>
                  <span onClick={() => setShowUserForm(true)} style={actionBtn}>+ Новый сотрудник</span>
                </div>
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '15px', opacity: 0.5, fontSize: '14px' }}>🔍</span>
                    <input type="text" placeholder="Поиск по имени или логину..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} style={{ ...adminIn, paddingLeft: '45px', marginBottom: 0, background: '#111' }} />
                </div>
                <div className="custom-scroll" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '5px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {filteredUsers.length === 0 ? (
                          <div style={{ color: '#555', padding: '20px 0', fontSize: '14px', fontWeight: 'bold', gridColumn: '1 / -1', textAlign: 'center' }}>Сотрудники не найдены</div>
                      ) : (
                          filteredUsers.map(u => {
                              const avatarImg = userAvatars[u.id] || u.avatar;
                              return (
                                <div key={u.id} style={userCardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: '#222', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                                                {avatarImg ? <img src={avatarImg} alt="Аватар" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px' }}>👤</span>}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: '18px', color: '#fff', marginBottom: '4px' }}>{u.name}</div>
                                                <div style={{ fontSize: '12px', color: u.role === 'admin' ? '#ff7675' : '#0abab5', fontWeight: 'bold' }}>{u.role === 'admin' ? 'Администратор' : 'Сотрудник'}</div>
                                            </div>
                                        </div>
                                        {(u.id !== 'u_admin' && u.id !== 'u_staff') && (
                                            <div onClick={() => handleDeleteUser(u.id)} style={{ cursor: 'pointer', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>✕</div>
                                        )}
                                    </div>
                                    <div style={{ background: '#000', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{ color: '#666' }}>Логин:</span><span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{u.login}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#666' }}>Пароль:</span><span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{u.pass}</span></div>
                                    </div>
                                </div>
                              )
                          })
                      )}
                    </div>
                </div>

                <div style={{ ...flexSpace, marginTop: '40px' }}>
                  <h2 style={{ ...sectionTitle, cursor: 'pointer', color: '#0abab5', textDecoration: 'underline' }} onClick={() => setShowTestModal(true)}>Результаты тестирования ↗</h2>
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Всего записей: {testResults.length}</span>
                </div>

                <div style={{ ...adminCard, marginTop: '30px', padding: '0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
                        <div onClick={() => setInteractionTab('notif')} style={{ flex: 1, padding: '20px', textAlign: 'center', cursor: 'pointer', background: interactionTab === 'notif' ? 'rgba(10,186,181,0.05)' : 'transparent', color: interactionTab === 'notif' ? '#0abab5' : '#666', fontWeight: '900', fontSize: '13px', letterSpacing: '1px' }}>УВЕДОМЛЕНИЯ</div>
                        <div onClick={() => setInteractionTab('test')} style={{ flex: 1, padding: '20px', textAlign: 'center', cursor: 'pointer', background: interactionTab === 'test' ? 'rgba(10,186,181,0.05)' : 'transparent', color: interactionTab === 'test' ? '#0abab5' : '#666', fontWeight: '900', fontSize: '13px', letterSpacing: '1px', borderLeft: '1px solid #222' }}>АТТЕСТАЦИЯ</div>
                    </div>
                    <div style={{ padding: '25px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Получатель:</div>
                            <select style={{ ...adminIn, flex: 1, marginBottom: 0 }} value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                                <option value="Все">Всем сотрудникам</option>
                                {users.filter(u => u.role === 'staff').map(u => <option key={u.id} value={u.id}>{u.name} ({u.login})</option>)}
                            </select>
                        </div>
                        {interactionTab === 'notif' ? (
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Текст:</div>
                                <input type="text" style={{ ...adminIn, flex: 1, marginBottom: 0 }} placeholder="Введите текст сообщения..." value={notifText} onChange={(e) => setNotifText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendNotification()} disabled={isProcessing} />
                                <button onClick={handleSendNotification} disabled={isProcessing} style={{ ...adminSendBtn, width: 'auto', padding: '14px 25px', fontSize: '13px' }}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ width: '150px', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Тип теста:</div>
                                <select style={{ ...adminIn, flex: 1, marginBottom: 0 }} value={testType} onChange={(e) => setTestType(e.target.value)}>
                                    <option value="final">🎓 Итоговый тест (Аттестация)</option>
                                    <option value="re-attestation">🔄 Переаттестация</option>
                                </select>
                                <button onClick={handleOpenTestEditor} disabled={isProcessing} style={{ ...adminActionBtn, padding: '14px 20px', borderRadius: '15px' }}>РЕДАКТОР</button>
                                <button onClick={handleQuickSendTest} disabled={isProcessing} style={{ ...adminSendBtn, width: 'auto', padding: '14px 25px', fontSize: '13px', borderRadius: '15px' }}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}</button>
                            </div>
                        )}
                    </div>
                </div>
              </section>

              <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px', minWidth: 0 }}>
                <div style={{ ...adminCard, padding: '20px' }}>
                    <h2 className="admin-section-title" style={{ ...sectionTitle, fontSize: '18px', margin: '0 0 15px 0' }}>Ближайшие события</h2>
                    <div style={{ position: 'relative', display: 'flex', background: '#111', borderRadius: '25px', padding: '4px', marginBottom: '15px', border: '1px solid #222' }}>
                        <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: '4px', width: 'calc(50% - 4px)', background: eventTab === 'personal' ? '#0abab5' : '#ff4d4d', borderRadius: '20px', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: eventTab === 'personal' ? 'translateX(0)' : 'translateX(100%)' }} />
                        <div onClick={() => setEventTab('personal')} style={{ position: 'relative', zIndex: 1, flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', color: eventTab === 'personal' ? '#000' : '#888', fontWeight: '900', fontSize: '12px' }}>ЗАМЕТКИ</div>
                        <div onClick={() => setEventTab('deadline')} style={{ position: 'relative', zIndex: 1, flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', color: eventTab === 'deadline' ? '#000' : '#888', fontWeight: '900', fontSize: '12px' }}>ДЕДЛАЙНЫ</div>
                    </div>
                    <div className="custom-scroll" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                        {filteredEvents.length === 0 ? (
                            <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0', fontWeight: 'bold' }}>Нет записей</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredEvents.slice(0, 10).map((event) => (
                                    <div key={event.key} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '12px', background: '#0d0d0d', borderRadius: '15px', border: `1px solid ${event.isDeadline ? 'rgba(255,77,77,0.2)' : 'rgba(10,186,181,0.1)'}` }}>
                                        <div style={{ ...dateBox, background: event.isDeadline ? '#ff4d4d' : '#0abab5' }}>{event.d} <br/> <span style={{ fontSize: '10px', opacity: 0.8 }}>{DAYS_OF_WEEK[event.dateObj.getDay()]}</span></div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{event.title}</div>
                                            {event.isDeadline ? <div style={{ fontSize: '11px', color: '#ff4d4d', marginTop: '4px', fontWeight: 'bold' }}>Кому: {event.target}</div> : event.desc && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.desc}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={adminCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <span style={{ fontWeight: '900', fontSize: '18px' }}>{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <div style={{ display: 'flex', gap: '15px' }}><span onClick={handlePrevMonth} style={calNavBtn}>←</span><span onClick={handleNextMonth} style={calNavBtn}>→</span></div>
                    </div>
                    <div style={calendarGrid}>
                        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => <div key={d} style={calDayHead}>{d}</div>)}
                        {Array.from({length: shiftStartDay}).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({length: daysInMonth}).map((_, i) => {
                            const dayNumber = i + 1;
                            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayNumber}`;
                            const noteTextStr = notes[dateKey];
                            const hasNote = !!noteTextStr;
                            const isDeadlineNote = hasNote && noteTextStr.startsWith('[Дедлайн:');
                            const isTdy = isToday(dayNumber);
                            return (
                                <div key={dayNumber} className={`cal-day ${isTdy ? 'today' : ''}`} onClick={() => openNotePanel(dayNumber)}>
                                    <span>{dayNumber}</span>
                                    {hasNote && <div className={`note-dot ${isDeadlineNote ? 'deadline-dot' : ''}`} />}
                                </div>
                            )
                        })}
                    </div>
                </div>
              </aside>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <section style={{...adminCard, padding: '35px'}}>
                    <div style={flexSpace}>
                        <h2 style={sectionTitle}>Статистика обучения</h2>
                        <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Сотрудников в базе: {users.filter(u => u.role === 'staff').length}</span>
                    </div>
                    {users.filter(u => u.role === 'staff').length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: '30px', fontWeight: 'bold' }}>Нет добавленных сотрудников</div>}
                    {users.filter(u => u.role === 'staff').map(user => {
                        const routeLen = usersStats[user.id]?.route || 0;
                        const basicsLen = usersStats[user.id]?.basics || 0;
                        const planPercent = Math.round((routeLen / (totalRouteSteps || 1)) * 100);
                        const basicsPercent = Math.round((basicsLen / (totalBasicsModules || 1)) * 100);
                        const avatarImg = userAvatars[user.id] || user.avatar;
                        return (
                            <div key={user.id} style={{ background: '#0d0d0d', borderRadius: '25px', padding: '25px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '0 0 250px' }}>
                                    <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: '#222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                                        {avatarImg ? <img src={avatarImg} alt="Аватар" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>👤</span>}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#fff', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</h3>
                                        <div style={{ fontSize: '12px', color: '#0abab5', fontWeight: 'bold', marginTop: '3px' }}>@{user.login}</div>
                                        <div onClick={() => setSelectedProfileUser(user)} style={profileBtnStyle}>ПРОФИЛЬ ↗</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '1px solid #222', paddingLeft: '30px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '45px', fontSize: '11px', fontWeight: '900', color: '#555' }}>ПЛАН</div>
                                        <div style={barBg}><div style={{ width: `${planPercent}%`, height: '100%', background: '#0abab5', borderRadius: '10px' }} /></div>
                                        <div style={{ width: '45px', fontSize: '13px', fontWeight: '900', color: '#0abab5', textAlign: 'right' }}>{planPercent}%</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '45px', fontSize: '11px', fontWeight: '900', color: '#555' }}>БАЗА</div>
                                        <div style={barBg}><div style={{ width: `${basicsPercent}%`, height: '100%', background: '#0abab5', borderRadius: '10px' }} /></div>
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

      {selectedProfileUser && (
        <div style={modalOverlay} onClick={() => setSelectedProfileUser(null)}>
            <div className="custom-scroll" style={{ background: '#0d0f0d', padding: '40px 20px', borderRadius: '40px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}><div onClick={() => setSelectedProfileUser(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold' }}>✕</div></div>
                {(() => {
                    const pData = userProfiles[selectedProfileUser.id] || {};
                    const routeLen = usersStats[selectedProfileUser.id]?.route || 0;
                    const basicsLen = usersStats[selectedProfileUser.id]?.basics || 0;
                    const profileAvatar = userAvatars[selectedProfileUser.id] || selectedProfileUser.avatar;
                    const tg = pData.tg || selectedProfileUser.tg || '';
                    const email = pData.email || selectedProfileUser.email || '';
                    const phone = pData.phone || selectedProfileUser.phone || '';
                    const planPercent = Math.min((routeLen / (totalRouteSteps || 1)) * 100, 100);
                    const basicsPercent = Math.min((basicsLen / (totalBasicsModules || 1)) * 100, 100);
                    return (
                        <>
                            <section style={profileHeaderCardStyle}>
                                <div style={{ width: '130px', height: '130px', borderRadius: '45px', backgroundColor: '#000', margin: '0 auto 25px', border: '2px solid #4CAF50', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(76, 175, 80, 0.2)' }}>
                                    {profileAvatar ? <img src={profileAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" /> : <span style={{ fontSize: '45px' }}>👤</span>}
                                </div>
                                <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', color: '#fff' }}>{selectedProfileUser.name}</h2>
                                <p style={{ color: '#0abab5', fontWeight: 'bold', fontSize: '13px', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>ЧАЙНЫЙ МАСТЕР (УЧЕНИК)</p>
                            </section>
                            <div style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)', padding: '15px', borderRadius: '20px', marginBottom: '35px', display: 'flex', justifyContent: 'space-around' }}>
                                <div style={{textAlign: 'center'}}><div style={{fontSize: '11px', color: '#ff7675', fontWeight: 'bold', marginBottom: '5px'}}>ЛОГИН ДОСТУПА</div><div style={{fontFamily: 'monospace', fontSize: '15px', color: '#fff', fontWeight: 'bold'}}>{selectedProfileUser.login}</div></div>
                                <div style={{textAlign: 'center'}}><div style={{fontSize: '11px', color: '#ff7675', fontWeight: 'bold', marginBottom: '5px'}}>ПАРОЛЬ</div><div style={{fontFamily: 'monospace', fontSize: '15px', color: '#fff', fontWeight: 'bold'}}>{selectedProfileUser.pass}</div></div>
                            </div>
                            <section style={progressSectionStyle}>
                                <div style={{ marginBottom: '25px' }}><div style={labelRow}><span style={{color:'#888'}}>ПЛАН НА НЕДЕЛЮ</span><span style={{color:'#0abab5'}}>{routeLen}/{totalRouteSteps}</span></div><div style={barBg}><div style={{ ...barFill, width: `${planPercent}%` }} /></div></div>
                                <div style={{ marginBottom: '10px' }}><div style={labelRow}><span style={{color:'#888'}}>ОСНОВЫ ОБУЧЕНИЯ</span><span style={{color:'#0abab5'}}>{basicsLen}/{totalBasicsModules}</span></div><div style={barBg}><div style={{ ...barFill, width: `${basicsPercent}%` }} /></div></div>
                            </section>
                            <h3 style={profileSectionTitle}>ЛИЧНЫЕ ДОСТИЖЕНИЯ</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '35px' }}>
                                <div title="Старт" style={{ ...badgeStyle, opacity: routeLen >= 1 ? 1 : 0.1 }}>🌱</div>
                                <div title="План" style={{ ...badgeStyle, opacity: routeLen >= 5 ? 1 : 0.1 }}>🚀</div>
                                <div title="Теория" style={{ ...badgeStyle, opacity: basicsLen >= 5 ? 1 : 0.1 }}>📚</div>
                                <div title="Мастер" style={{ ...badgeStyle, opacity: basicsLen >= 10 ? 1 : 0.1 }}>🏮</div>
                            </div>
                            <h3 style={profileSectionTitle}>СВЯЗЬ</h3>
                            <section style={contactCardStyle}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={contactIconStyle}>💬</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>{tg || 'telegram не указан'}</div>
                                        <div style={{ fontSize: '14px', color: '#0abab5', fontWeight: 'bold', marginBottom: '2px' }}>{email || 'e-mail не указан'}</div>
                                        <div style={{ fontSize: '13px', color: '#555' }}>{phone || 'телефон не указан'}</div>
                                    </div>
                                </div>
                            </section>
                            <h3 style={profileSectionTitle}>История аттестаций</h3>
                            <div style={{ background: '#000', padding: '10px', borderRadius: '20px', border: '1px solid #222' }}>
                                {testResults.filter(r => r.userName === selectedProfileUser.name && r.testName?.toLowerCase().includes('аттестация')).length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px', fontWeight: 'bold' }}>Сотрудник еще не сдавал аттестации</div>
                                ) : (
                                    testResults.filter(r => r.userName === selectedProfileUser.name && r.testName?.toLowerCase().includes('аттестация')).map((res: any) => {
                                        const isPassed = res.score === 100;
                                        const scoreColor = isPassed ? '#0abab5' : '#ff4d4d';
                                        return (
                                            <div key={res.id} style={{ padding: '15px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '900', color: '#fff', fontSize: '14px', marginBottom: '4px' }}>{res.testName}</div>
                                                    <div style={{ fontSize: '11px', color: '#888' }}>{res.date} • Попытка: {res.attempts}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '900', color: scoreColor, fontSize: '16px' }}>{res.score}%</div>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', color: scoreColor }}>{isPassed ? 'ПРОЙДЕН' : 'ПРОФАЛ'}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
      )}

      {showTestEditor && (
        <div style={{...modalOverlay, alignItems: 'flex-start'}}>
            <div className="admin-modal-content custom-scroll" style={{...modalContentSmall, maxWidth: '900px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'}}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>РЕДАКТОР ТЕСТА: {testFormData.title}</h2>
                <input style={adminIn} placeholder="Название теста" value={testFormData.title} onChange={e => setTestFormData({...testFormData, title: e.target.value})} />
                <div style={{borderTop: '1px solid #222', paddingTop: '30px', marginTop: '15px'}}>
                    <h3 style={{fontSize: '20px', color: '#fff', marginBottom: '25px', fontWeight: '900'}}>ВОПРОСЫ И ОТВЕТЫ</h3>
                    {testFormData.quiz.map((q, qIdx) => (
                        <div key={qIdx} style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                            {testFormData.quiz.length > 1 && <div onClick={() => removeTestQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'}}>✕</div>}
                            <div style={{fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px'}}>ВОПРОС {qIdx + 1}</div>
                            <input style={adminIn} placeholder="Текст вопроса..." value={q.q} onChange={e => updateTestQuestion(qIdx, 'q', e.target.value)} />
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '10px'}}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                        <label style={{display:'flex', gap:'5px', cursor:'pointer', color: q.c === i ? '#0abab5' : '#888', fontWeight: 'bold', fontSize: '13px'}}><input type="radio" checked={q.c === i} onChange={() => updateTestQuestion(qIdx, 'c', i)} /> Верный вариант {i+1}</label>
                                        <input style={{...adminIn, marginBottom: 0, borderColor: q.c === i ? '#0abab5' : '#222'}} placeholder={`Ответ \${i+1}`} value={q.o[i]} onChange={e => updateTestQuestion(qIdx, `o\${i}`, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={addTestQuestion} disabled={isProcessing} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'}}>+ ДОБАВИТЬ ВОПРОС</button>
                </div>
                <button onClick={handleSendTest} disabled={isProcessing} style={{...saveBtn, marginTop: '30px'}}>{isProcessing ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ СОТРУДНИКУ'}</button>
                <div onClick={() => setShowTestEditor(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
            </div>
        </div>
      )}

      {showFilesList && (
          <div style={modalOverlay}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '550px' }}>
                  <h2 style={{ color: '#0abab5', fontWeight: '900', marginBottom: '25px', textAlign: 'center' }}>ЗАГРУЖЕННЫЕ МАТЕРИАЛЫ</h2>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '25px', paddingRight: '10px' }} className="custom-scroll">
                      {uploadedMaterials.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#666' }}>Список пуст</p>
                      ) : (
                          uploadedMaterials.map(file => (
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
                  <button onClick={() => setShowFilesList(false)} style={saveBtn}>← НАЗАД К ПАНЕЛИ</button>
              </div>
          </div>
      )}

      {showTestModal && (
          <div style={modalOverlay} onClick={() => setShowTestModal(false)}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '650px', padding: '35px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <h2 style={{ color: '#0abab5', fontWeight: '900', margin: 0, letterSpacing: '1px', fontSize: '18px' }}>РЕЗУЛЬТАТЫ ТЕСТОВ</h2>
                      <div onClick={() => setShowTestModal(false)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', lineHeight: 1, fontWeight: 'bold' }}>✕</div>
                  </div>
                  <select style={{ ...adminIn, marginBottom: '25px', border: '1px solid #333' }} value={selectedTestUser} onChange={(e) => setSelectedTestUser(e.target.value)}>
                      <option value="Все">Показать всех сотрудников</option>
                      {users.filter(u => u.role === 'staff').map(u => <option key={u.id} value={u.name}>{u.name} ({u.login})</option>)}
                  </select>
                  <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }} className="custom-scroll">
                      {testResults
                          .filter(res => (selectedTestUser === 'Все' || res.userName === selectedTestUser) && res.testName?.toLowerCase().includes('аттестация'))
                          .map((res: any) => {
                              const isPassed = res.score === 100;
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
                      {testResults.filter(res => (selectedTestUser === 'Все' || res.userName === selectedTestUser) && res.testName?.toLowerCase().includes('аттестация')).length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', padding: '30px', fontWeight: 'bold', fontSize: '15px' }}>Нет результатов аттестаций</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showSuccessModal.show && (
          <div style={modalOverlay} onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '420px', padding: '35px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '50px', marginBottom: '20px' }}>✅</div>
                  <h2 style={{ color: '#0abab5', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{showSuccessModal.title}</h2>
                  <p style={{ color: '#ccc', fontSize: '16px', lineHeight: '1.6', marginBottom: '25px' }}>{showSuccessModal.text}</p>
                  <button onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })} style={saveBtn}>ПОНЯТНО</button>
              </div>
          </div>
      )}

      {confirmModal.show && (
          <div style={modalOverlay} onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '400px', padding: '35px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                  <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>{confirmModal.title}</h2>
                  <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{confirmModal.text}</p>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <button onClick={() => setConfirmModal({ ...confirmModal, show: false })} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, minWidth: '100px' }}>ОТМЕНА</button>
                      <button onClick={executeConfirmAction} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, minWidth: '100px' }}>УДАЛИТЬ</button>
                  </div>
              </div>
          </div>
      )}

      {errorModal.show && (
          <div style={modalOverlay} onClick={() => setErrorModal({ show: false, text: '' })}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '380px', padding: '35px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '50px', marginBottom: '20px' }}>⛔</div>
                  <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>ОШИБКА</h2>
                  <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{errorModal.text}</p>
                  <button onClick={() => setErrorModal({ show: false, text: '' })} style={{ ...saveBtn, background: '#333', color: '#fff' }}>ПОНЯТНО</button>
              </div>
          </div>
      )}

      {previewFile && (
          <div style={modalOverlay} onClick={() => setPreviewFile(null)}>
              <div className="admin-modal-content" style={{ ...modalContentSmall, maxWidth: '80%', height: '85vh', padding: '25px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                      <h2 style={{ color: '#0abab5', fontWeight: '900', fontSize: '18px', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile.name}</h2>
                      <div onClick={() => setPreviewFile(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1 }}>✕</div>
                  </div>
                  <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                      {previewFile.data ? <iframe src={previewFile.data} style={{ width: '100%', height: '100%', border: 'none' }} title="Предпросмотр файла" /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '20px' }}>Нет данных для отображения (загружено в старой версии)</div>}
                  </div>
              </div>
          </div>
      )}

      {showUserForm && (
        <div style={modalOverlay}>
            <div className="admin-modal-content" style={modalContentSmall}>
                <h2 style={{color:'#0abab5', marginBottom:'25px', fontWeight: '900', textAlign: 'center'}}>НОВЫЙ СОТРУДНИК</h2>
                <input style={adminIn} placeholder="Имя (напр. Анна)" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} />
                <input style={adminIn} placeholder="Придумайте Логин" value={newUser.login} onChange={e=>setNewUser({...newUser, login: e.target.value})} />
                <input style={adminIn} placeholder="Придумайте Пароль" value={newUser.pass} onChange={e=>setNewUser({...newUser, pass: e.target.value})} />
                <div style={{ textAlign: 'left', marginBottom: '15px', color: '#888', fontSize: '13px', fontWeight: 'bold', marginLeft: '5px' }}>Роль пользователя:</div>
                <select style={adminIn} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                    <option value="staff">🍵 Чайный мастер (Сотрудник)</option>
                    <option value="admin">👑 Администратор</option>
                </select>
                <button onClick={handleCreateUser} style={{...saveBtn, marginTop: '20px'}}>СОЗДАТЬ УЧЕТКУ</button>
                <div onClick={()=>setShowUserForm(false)} style={{textAlign:'center', marginTop:'20px', cursor:'pointer', color:'#666', fontWeight:'bold'}}>ОТМЕНА</div>
            </div>
        </div>
      )}

      {selectedDateKey && (
        <div style={noteOverlayStyle} onClick={closeNotePanel}>
          <div style={noteSidebarStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0abab5' }}>ЗАМЕТКА</h2>
              <div onClick={closeNotePanel} style={{ cursor: 'pointer', fontSize: '20px', opacity: 0.5 }}>✕</div>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#ccc' }}>Дата: {formattedSelectedDate()}</p>
            <div style={{ position: 'relative', display: 'flex', background: '#111', borderRadius: '14px', marginBottom: '20px', padding: '4px', border: '1px solid #222' }}>
                <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: noteType === 'personal' ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)', background: '#222', borderRadius: '10px', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #333' }} />
                <div onClick={() => setNoteType('personal')} style={{ position: 'relative', zIndex: 1, flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', color: noteType === 'personal' ? '#0abab5' : '#666', fontWeight: '900', fontSize: '13px' }}>Для себя</div>
                <div onClick={() => setNoteType('deadline')} style={{ position: 'relative', zIndex: 1, flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', color: noteType === 'deadline' ? '#0abab5' : '#666', fontWeight: '900', fontSize: '13px' }}>Дедлайн</div>
            </div>
            {noteType === 'deadline' && (
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>Кому назначить:</div>
                    <select style={{ ...adminIn, marginBottom: 0, padding: '12px' }} value={deadlineTarget} onChange={e => setDeadlineTarget(e.target.value)}>
                        <option value="Все">Всем сотрудникам</option>
                        {users.filter(u => u.role === 'staff').map(u => <option key={u.id} value={u.id}>{u.name} ({u.login})</option>)}
                    </select>
                </div>
            )}
            <textarea autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={noteType === 'deadline' ? "Текст задачи..." : "Текст заметки..."} style={{...noteTextarea, height: noteType === 'deadline' ? '135px' : '200px'}} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={saveNote} disabled={isProcessing} style={{...adminSendBtn, flex: 1, minWidth: '100px'}}>{isProcessing ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}</button>
                {notes[selectedDateKey] && <button onClick={deleteNote} disabled={isProcessing} style={{...noteDeleteBtn, flex: 1, minWidth: '100px'}}>УДАЛИТЬ</button>}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        * { box-sizing: border-box; }
        body { overflow-x: hidden; margin: 0; padding: 0; background: #0d0f0d; }
        .cal-day { position: relative; font-size: 13px; padding: 10px 0; border-radius: 12px; font-weight: 800; color: #fff; cursor: pointer; transition: 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 38px; }
        .cal-day:hover, .cal-day.today { background: #0abab5; color: #000; }
        .note-dot { position: absolute; bottom: 4px; width: 4px; height: 4px; background: #0abab5; border-radius: 50%; }
        .deadline-dot { background: #ff4d4d; }
        .cal-day:hover .note-dot, .cal-day.today .note-dot { background: #000; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        @media (max-width: 768px) {
            .desktop-sidebar-spacer { display: none !important; width: 0 !important; }
            .admin-main { padding: 90px 15px 50px 15px !important; }
            .admin-layout-grid { grid-template-columns: 1fr !important; gap: 20px !important; margin-top: 20px !important; }
            .admin-flex-space { flex-direction: column; align-items: flex-start !important; gap: 15px !important; margin-bottom: 25px !important; }
            .admin-user-grid { grid-template-columns: 1fr !important; }
            .admin-user-card { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; padding: 20px !important;}
            .admin-user-avatar-col { flex: auto !important; width: 100% !important; }
            .admin-user-bars-col, .admin-user-actions-col { border-left: none !important; padding-left: 0 !important; width: 100% !important; border-top: 1px solid #222; padding-top: 20px !important; }
            .interaction-center-tabs { flex-direction: column; }
            .interaction-center-tabs > div { border-left: none !important; border-bottom: 1px solid #222; }
            .interaction-center-row { flex-direction: column; align-items: stretch !important; gap: 15px !important; }
            .interaction-center-label { width: 100% !important; margin-bottom: -5px; }
            .admin-modal-content { padding: 30px 20px !important; width: 95% !important; border-radius: 25px !important; }
        }
      `}</style>
    </div>
  );
}