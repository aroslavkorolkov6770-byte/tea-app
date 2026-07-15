"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '@/app/components/CustomIcon';
import SectionCollapseButton from '@/app/components/SectionCollapseButton';
import useCollapsedSections from '@/app/hooks/useCollapsedSections';
import { saveDataToServer } from '@/app/lib/storageClient';
import {
    LinkedMaterialsEditor,
    LinkedMaterialsList,
    type LinkedMaterialReference,
} from './LinkedMaterials';
import AiContentGenerator, {
    type AiDraftKind,
    type AiGeneratedDraftResult,
} from './AiContentGenerator';

const STORAGE_KEYS = {
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v2',
    DYNAMIC_TESTS: 'tea_hub_dynamic_tests_v1',   
    DYNAMIC_ROUTE: 'tea_hub_dynamic_route_v2',     
    TESTS_PROGRESS: 'tea_hub_tests_progress_v1',
    URGENT_FILES: 'tea_hub_urgent_files_v1'        
};
const AI_SITE_CONTEXT_CACHE_KEY = 'th_ai_site_context_v2';

const stripEmoji = (str: string) => {
    if (!str) return '';
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

const normalizeText = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const normalizeEmbeddedPlayerMarkup = (markup: string) => {
    if (!markup) {
        return '';
    }

    return markup
        .replace(/\s(width|height)=("|')[^"']*("|')/gi, '')
        .replace(/\sstyle=("|')([^"']*)("|')/gi, (_match, quoteStart, styleContent, quoteEnd) => {
            const cleanedStyle = String(styleContent)
                .replace(/(?:^|;)\s*width\s*:\s*[^;]+;?/gi, '')
                .replace(/(?:^|;)\s*height\s*:\s*[^;]+;?/gi, '')
                .replace(/(?:^|;)\s*max-width\s*:\s*[^;]+;?/gi, '')
                .replace(/(?:^|;)\s*min-height\s*:\s*[^;]+;?/gi, '')
                .trim()
                .replace(/^;|;$/g, '');

            const responsiveStyle = `${cleanedStyle ? `${cleanedStyle}; ` : ''}width: 100% !important; height: 100% !important; max-width: 100% !important;`;
            return ` style=${quoteStart}${responsiveStyle}${quoteEnd}`;
        })
        .replace(/<(iframe|embed|object)\b/gi, '<$1 class="embedded-player-frame"');
};

const MemoizedVideoPlayer = React.memo(({ iframeStr, descText }: { iframeStr: string, descText: string }) => {
    const normalizedIframeMarkup = normalizeEmbeddedPlayerMarkup(iframeStr);

    return (
        <div className="video-player-card" style={{ background: '#0d0d0d', padding: '20px', borderRadius: '25px', border: '1px solid #222', marginBottom: '35px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {normalizedIframeMarkup ? (
                <div className="video-wrapper">
                    <div className="video-embed-shell" dangerouslySetInnerHTML={{ __html: normalizedIframeMarkup }} />
                </div>
            ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontStyle: 'italic', background: '#111', borderRadius: '15px' }}>Видео не прикреплено</div>
            )}
            {descText && <p className="video-player-description" style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0, marginTop: '20px', padding: '0 10px', whiteSpace: 'pre-wrap' }}>{descText}</p>}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.iframeStr === nextProps.iframeStr && prevProps.descText === nextProps.descText;
});

const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
};

const normalizeSectionName = (section: string) => section?.trim() || 'Основной раздел';

const sortSectionEntries = (items: any[]) => {
    return [...items].sort((left: any, right: any) => {
        const leftOrder = typeof left.order === 'number' ? left.order : Number.MAX_SAFE_INTEGER;
        const rightOrder = typeof right.order === 'number' ? right.order : Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }

        return String(left.title || left.name || '').localeCompare(String(right.title || right.name || ''), 'ru');
    });
};

const reindexSectionItems = (items: any[]) => {
    return sortSectionEntries(items).map((item: any, index: number) => ({ ...item, order: index + 1 }));
};

const upsertOrderedSectionItem = (collection: any[], nextItem: any) => {
    const targetSection = normalizeSectionName(nextItem.section);
    const otherItems = collection.filter((item: any) => item.id !== nextItem.id);
    const sectionItems = otherItems.filter((item: any) => !item.isPlaceholder && normalizeSectionName(item.section) === targetSection);
    const desiredOrderRaw = Number(nextItem.order);
    const maxOrder = sectionItems.length + 1;
    const desiredOrder = Number.isFinite(desiredOrderRaw) && desiredOrderRaw > 0 ? Math.min(Math.max(1, Math.trunc(desiredOrderRaw)), maxOrder) : maxOrder;

    const orderedSectionItems = reindexSectionItems(sectionItems);
    orderedSectionItems.splice(desiredOrder - 1, 0, { ...nextItem, section: targetSection, order: desiredOrder });
    const normalizedSectionItems = orderedSectionItems.map((item: any, index: number) => ({ ...item, order: index + 1 }));

    return [
        ...otherItems.filter((item: any) => normalizeSectionName(item.section) !== targetSection || item.isPlaceholder),
        ...normalizedSectionItems,
    ];
};

const normalizeOrderedCollection = (collection: any[]) => {
    const placeholders = collection.filter((item: any) => item.isPlaceholder);
    const realItems = collection.filter((item: any) => !item.isPlaceholder);
    const sections = Array.from(new Set(realItems.map((item: any) => normalizeSectionName(item.section))));

    const normalizedItems = sections.flatMap((sectionName) => {
        const sectionItems = realItems.filter((item: any) => normalizeSectionName(item.section) === sectionName);
        return reindexSectionItems(sectionItems.map((item: any) => ({ ...item, section: sectionName })));
    });

    return [...normalizedItems, ...placeholders];
};

export default function Education({
    isAdmin, userId, dynamicRoute, setDynamicRoute, completedRoute, setCompletedRoute,
    dynamicTests, setDynamicTests, completedTests, setCompletedTests, urgentFiles,
    passedTests, setPassedTests, dismissedTasks, setDismissedTasks,
    selectedRouteStep, setSelectedRouteStep, closeRouteModal,
    selectedTest, setSelectedTest, closeTestModal
}: any) {
    const router = useRouter();
    const { isSectionCollapsed, toggleSection } = useCollapsedSections('tea_hub_education_collapsed_sections_v1');
    
    const [showRouteForm, setShowRouteForm] = useState(false);
    const [routeFormData, setRouteFormData] = useState({ 
        id: '', title: '', time: '5 мин', section: '', order: '',
        mediaType: 'text', videoIframe: '', videoDesc: '',
        h1: '', t1: '', img1: '', h2: '', t2: '', img2: '', h3: '', t3: '', img3: '',
        linkedMaterials: [] as LinkedMaterialReference[],
    });

    const [showTestForm, setShowTestForm] = useState(false);
    const [testFormData, setTestFormData] = useState({
        id: '', title: '', subtitle: '', theory: '', section: '', order: '', timeLimit: 0,
        quiz: [{ q: '', o: ['', '', '', ''], c: 0 }],
        linkedMaterials: [] as LinkedMaterialReference[],
    });
    const [createMenu, setCreateMenu] = useState<AiDraftKind | null>(null);
    const [aiGeneratorKind, setAiGeneratorKind] = useState<AiDraftKind | null>(null);
    const [aiReview, setAiReview] = useState<{
        kind: AiDraftKind;
        sourceFiles: string[];
        warnings: string[];
    } | null>(null);

    const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, type: 'route'|'test'|'section_route'|'section_test', targetId: string, name: string}>({ isOpen: false, type: 'route', targetId: '', name: '' });
    const [confirmSectionDelete, setConfirmSectionDelete] = useState({ isOpen: false, type: 'route' as 'route'|'test', name: '' });
    const [renameSectionPrompt, setRenameSectionPrompt] = useState<{isOpen: boolean, type: 'route'|'test', oldName: string, newName: string}>({ isOpen: false, type: 'route', oldName: '', newName: '' });
    const [promptSection, setPromptSection] = useState<{isOpen: boolean, type: 'route'|'test', name: string}>({ isOpen: false, type: 'route', name: '' });
    const [movingItem, setMovingItem] = useState<{id: string, type: 'route' | 'test'} | null>(null);
    const [moveNewSectionName, setMoveNewSectionName] = useState('');

    const [activeTestSession, setActiveTestSession] = useState<any>(null); 
    const [currentQuizStep, setCurrentQuizStep] = useState(0);
    const [testAnswers, setTestAnswers] = useState<number[]>([]);
    const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

    const [lockedTestAlert, setLockedTestAlert] = useState({show: false, message: ''});
    const [cancelTestConfirm, setCancelTestConfirm] = useState<{show: boolean, type: 'normal'|'urgent'}>({show: false, type: 'normal'});
    const [reviewTest, setReviewTest] = useState<any>(null);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [testResultModal, setTestResultModal] = useState<{
        show: boolean, score: number, isPassed: boolean, title: string, 
        mistakes: Array<{q: string, userAns: string, correctAns: string}>, isTimeout?: boolean
    }>({show: false, score: 0, isPassed: false, title: '', mistakes: []});

    const [activeUrgentTest, setActiveUrgentTest] = useState<any>(null);
    const [urgentTestStep, setUrgentTestStep] = useState(0);
    const [urgentTestAnswers, setUrgentTestAnswers] = useState<number[]>([]);
    const [zoomedImg, setZoomedImg] = useState<string | null>(null);

    const updateRouteState = (newData: any[]) => {
        const normalizedData = normalizeOrderedCollection(newData);
        setDynamicRoute(normalizedData);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(AI_SITE_CONTEXT_CACHE_KEY);
        }
        saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, normalizedData);
    };
    const updateTestsState = (newData: any[]) => {
        const normalizedData = normalizeOrderedCollection(newData);
        setDynamicTests(normalizedData);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(AI_SITE_CONTEXT_CACHE_KEY);
        }
        saveDataToServer(STORAGE_KEYS.DYNAMIC_TESTS, normalizedData);
    };

    const handleOpenLinkedMaterial = (reference: LinkedMaterialReference) => {
        if (reference.type === 'route') {
            const targetRoute = dynamicRoute.find((route: any) => route.id === reference.id);
            if (!targetRoute) {
                setLockedTestAlert({ show: true, message: 'Связанная тема больше недоступна.' });
                return;
            }

            setSelectedTest(null);
            setSelectedRouteStep(targetRoute);
            router.push(`/tasks?tab=edu&routeId=${encodeURIComponent(reference.id)}`, { scroll: false });
            return;
        }

        const targetDocument = (urgentFiles || []).find((file: any) => file.id === reference.id && !file.isDocPlaceholder);
        if (!targetDocument) {
            setLockedTestAlert({ show: true, message: 'Связанный документ больше недоступен.' });
            return;
        }

        setSelectedRouteStep(null);
        setSelectedTest(null);
        router.push(`/tasks?tab=docs&documentId=${encodeURIComponent(reference.id)}`);
    };

    useEffect(() => {
        let timerId: any;
        if ((activeTestSession || activeUrgentTest) && timeLeft !== null) {
            if (timeLeft > 0) {
                timerId = setInterval(() => setTimeLeft(prev => prev !== null && prev > 0 ? prev - 1 : 0), 1000);
            } else if (timeLeft === 0) {
                handleTimeoutFail();
            }
        }
        return () => { if (timerId) clearInterval(timerId); };
    }, [timeLeft, activeTestSession, activeUrgentTest]);

    const handleTimeoutFail = async () => {
        const testTarget = activeTestSession || activeUrgentTest;
        if (!testTarget) return;

        const isUrgent = !!activeUrgentTest;
        const currentUserName = localStorage.getItem('current_user_name') || 'Сотрудник';
        const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

        try {
            if (isUrgent) {
                const notifRes = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_notifications_v1`);
                const notifs = await notifRes.json().catch(() => []);
                const newNotif = {
                    id: Date.now(), title: 'Провал по таймеру',
                    text: `Сотрудник ${currentUserName} не успел пройти аттестацию "${testTarget.title || testTarget.name}". Время вышло!`,
                    time: formattedTime, target: 'u_admin' 
                };
                await saveDataToServer('tea_hub_notifications_v1', [newNotif, ...(Array.isArray(notifs) ? notifs : [])]);
            }

            const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_test_results_v1`);
            let results = await res.json().catch(() => []);
            if (!Array.isArray(results)) results = [];

            const previousAttempts = results.filter((r: any) => r.testId === testTarget.id && r.userName === currentUserName).length;
            const newResult = {
                id: Date.now(), testId: testTarget.id, userName: currentUserName,
                testName: testTarget.title || testTarget.name, score: 0, attempts: previousAttempts + 1, date: formattedTime
            };
            saveDataToServer('tea_hub_test_results_v1', [newResult, ...results]);
        } catch (e) { console.error("Ошибка при тайм-ауте", e) }

        setTestResultModal({ show: true, score: 0, isPassed: false, title: testTarget.title || testTarget.name, mistakes: [], isTimeout: true });
        setActiveTestSession(null); setActiveUrgentTest(null); setCurrentQuizStep(0); setUrgentTestStep(0);
        setTestAnswers([]); setUrgentTestAnswers([]); setActiveAnswer(null); setTimeLeft(null);
    };

    const executeCancelTest = () => {
        if (cancelTestConfirm.type === 'normal') {
            setActiveTestSession(null); setCurrentQuizStep(0); setActiveAnswer(null); setTestAnswers([]); closeTestModal(); setTimeLeft(null);
        } else {
            setActiveUrgentTest(null); setUrgentTestStep(0); setActiveAnswer(null); setUrgentTestAnswers([]); setTimeLeft(null);
        }
        setCancelTestConfirm({show: false, type: 'normal'});
    };

    const handleDismissTask = (id: string) => {
        const newDismissed = [...dismissedTasks, id];
        setDismissedTasks(newDismissed);
        localStorage.setItem(`th_dismissed_tasks_${userId}`, JSON.stringify(newDismissed));
        saveDataToServer(`dismissed_tasks_${userId}`, newDismissed);
    };

    const visibleUrgentFiles = urgentFiles.filter((f: any) => {
        let taskCreatedAt = 0;
        if (f.id && typeof f.id === 'string') {
            const parts = f.id.split('_');
            const timePart = parseInt(parts[parts.length - 1]);
            if (!isNaN(timePart)) taskCreatedAt = timePart;
        }
        let userCreatedAt = 0;
        if (userId && userId !== 'u_admin' && userId !== 'u_staff') {
            const uParts = userId.split('_');
            const uTimePart = parseInt(uParts[uParts.length - 1]);
            if (!isNaN(uTimePart)) userCreatedAt = uTimePart;
        }
        let isForMe = false;
        if (f.target === userId) {
            isForMe = true;
        } else if (!f.target || f.target === 'Все') {
            if (!f.isTest && !(f.id && f.id.startsWith('deadline_'))) isForMe = true;
            else isForMe = taskCreatedAt >= userCreatedAt;
        }
        const isPassed = f.isTest && passedTests.includes(f.id);
        const isDismissed = dismissedTasks.includes(f.id);
        return isForMe && !isPassed && !isDismissed;
    });

    const urgentTasks = visibleUrgentFiles.filter((f: any) => f.id?.startsWith('deadline_') || f.isTest);
    const pendingAttestations = urgentTasks.filter((t: any) => t.isTest);
    const isLockedByUrgent = pendingAttestations.length > 0;

    const handleSaveRoute = () => {
        if (!routeFormData.title.trim()) { alert("Введите название темы!"); return; }
        const routeDraft = {
            ...routeFormData,
            id: routeFormData.id || ('route_' + Date.now()),
            section: normalizeSectionName(routeFormData.section),
        };
        const newList = upsertOrderedSectionItem([...dynamicRoute], routeDraft);
        updateRouteState(newList);
        setShowRouteForm(false);
        setAiReview(null);
    };

    const handleRouteComplete = (id: string) => {
        if (!completedRoute.includes(id)) {
            const newProg = [...completedRoute, id];
            setCompletedRoute(newProg);
            localStorage.setItem(`th_prog_route_${userId}`, JSON.stringify(newProg));
            saveDataToServer(`prog_route_${userId}`, newProg);
        }
        closeRouteModal();
    };

    const updateTestQuestion = (index: number, field: string, value: any) => {
        const newQuiz = [...testFormData.quiz];
        if (field === 'q') newQuiz[index].q = value;
        if (field === 'c') newQuiz[index].c = value;
        if (field.startsWith('o')) newQuiz[index].o[parseInt(field.replace('o', ''))] = value;
        setTestFormData({...testFormData, quiz: newQuiz});
    };

    const addTestQuestion = () => setTestFormData({ ...testFormData, quiz: [...testFormData.quiz, { q: '', o: ['', '', '', ''], c: 0 }] });
    const removeTestQuestion = (index: number) => setTestFormData({...testFormData, quiz: testFormData.quiz.filter((_: any, i: number) => i !== index)});

    const handleSaveTestForm = () => {
        if (!testFormData.title.trim()) { alert("Введите название теста!"); return; }
        const newTest = {
            id: testFormData.id || ('t_' + Date.now()),
            title: testFormData.title, subtitle: testFormData.subtitle, theory: testFormData.theory,
            section: normalizeSectionName(testFormData.section), order: testFormData.order,
            timeLimit: testFormData.timeLimit || 0,
            linkedMaterials: testFormData.linkedMaterials,
            quiz: testFormData.quiz.map((q: any) => ({ q: q.q || 'Без вопроса?', o: [q.o[0] || '1', q.o[1] || '2', q.o[2] || '3', q.o[3] || '4'], c: q.c }))
        };
        const newList = upsertOrderedSectionItem([...dynamicTests], newTest);
        updateTestsState(newList);
        setShowTestForm(false);
        setAiReview(null);
    };

    const openManualRouteForm = () => {
        setRouteFormData({
            id: '', title: '', time: '5 мин', section: '', order: '',
            mediaType: 'text', videoIframe: '', videoDesc: '',
            h1: '', t1: '', img1: '', h2: '', t2: '', img2: '', h3: '', t3: '', img3: '',
            linkedMaterials: [],
        });
        setAiReview(null);
        setCreateMenu(null);
        setShowRouteForm(true);
    };

    const openManualTestForm = () => {
        setTestFormData({
            id: '', title: '', subtitle: '', theory: '', section: '', order: '', timeLimit: 0,
            quiz: [{ q: '', o: ['', '', '', ''], c: 0 }],
            linkedMaterials: [],
        });
        setAiReview(null);
        setCreateMenu(null);
        setShowTestForm(true);
    };

    const openAiGenerator = (kind: AiDraftKind) => {
        setCreateMenu(null);
        setAiGeneratorKind(kind);
    };

    const handleAiDraftGenerated = (result: AiGeneratedDraftResult) => {
        setAiGeneratorKind(null);
        setAiReview({
            kind: result.draft.kind,
            sourceFiles: result.sourceFiles,
            warnings: result.warnings,
        });

        if (result.draft.kind === 'topic') {
            const [firstBlock, secondBlock, thirdBlock] = result.draft.blocks;
            setRouteFormData({
                id: '',
                title: result.draft.title,
                time: result.draft.time || '5 мин',
                section: result.draft.section || '',
                order: '',
                mediaType: 'text',
                videoIframe: '',
                videoDesc: '',
                h1: firstBlock?.heading || '',
                t1: firstBlock?.text || '',
                img1: '',
                h2: secondBlock?.heading || '',
                t2: secondBlock?.text || '',
                img2: '',
                h3: thirdBlock?.heading || '',
                t3: thirdBlock?.text || '',
                img3: '',
                linkedMaterials: [],
            });
            setShowRouteForm(true);
            return;
        }

        setTestFormData({
            id: '',
            title: result.draft.title,
            subtitle: result.draft.subtitle,
            theory: result.draft.theory,
            section: result.draft.section || '',
            order: '',
            timeLimit: 0,
            quiz: result.draft.questions.map((question) => ({
                q: question.question,
                o: [
                    question.options[0] || '',
                    question.options[1] || '',
                    question.options[2] || '',
                    question.options[3] || '',
                ],
                c: question.correctIndex,
            })),
            linkedMaterials: [],
        });
        setShowTestForm(true);
    };

    const closeRouteEditor = () => {
        setShowRouteForm(false);
        setAiReview(null);
    };

    const closeTestEditor = () => {
        setShowTestForm(false);
        setAiReview(null);
    };

    const handleMoveItem = (targetSection: string) => {
        if (!movingItem) return;
        if (movingItem.type === 'route') {
            const itemToMove = dynamicRoute.find((r: any) => r.id === movingItem.id);
            const sourceSection = itemToMove?.section?.trim() || 'Основной раздел';
            const updated = dynamicRoute.map((r: any) => r.id === movingItem.id ? { ...r, section: targetSection } : r);
            const sourceHasItems = updated.some((r: any) => (r.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            updateRouteState(updated);
        } else {
            const itemToMove = dynamicTests.find((t: any) => t.id === movingItem.id);
            const sourceSection = itemToMove?.section?.trim() || 'Основной раздел';
            const updated = dynamicTests.map((t: any) => t.id === movingItem.id ? { ...t, section: targetSection } : t);
            const sourceHasItems = updated.some((t: any) => (t.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            updateTestsState(updated);
        }
        setMovingItem(null); setMoveNewSectionName('');
    };

    const executeDelete = () => {
        if (confirmDelete.type === 'route') {
            const itemToDelete = dynamicRoute.find((r: any) => r.id === confirmDelete.targetId);
            const sourceSection = itemToDelete?.section?.trim() || 'Основной раздел';
            const updated = dynamicRoute.filter((r: any) => r.id !== confirmDelete.targetId);
            const sourceHasItems = updated.some((r: any) => (r.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            updateRouteState(updated);
        } else if (confirmDelete.type === 'test') {
            const itemToDelete = dynamicTests.find((t: any) => t.id === confirmDelete.targetId);
            const sourceSection = itemToDelete?.section?.trim() || 'Основной раздел';
            const updated = dynamicTests.filter((t: any) => t.id !== confirmDelete.targetId);
            const sourceHasItems = updated.some((t: any) => (t.section?.trim() || 'Основной раздел') === sourceSection);
            if (!sourceHasItems && sourceSection !== 'Основной раздел') updated.push({ id: 'placeholder_' + Date.now(), section: sourceSection, isPlaceholder: true });
            updateTestsState(updated);
        }
        setConfirmDelete({ isOpen: false, type: 'route', targetId: '', name: '' });
    };

    const confirmRenameSection = () => {
        if (!renameSectionPrompt.newName.trim()) return;
        const newName = renameSectionPrompt.newName.trim();
        const oldName = renameSectionPrompt.oldName;
        if (renameSectionPrompt.type === 'route') {
            const updated = dynamicRoute.map((r: any) => (r.section?.trim() || 'Основной раздел') === oldName ? { ...r, section: newName } : r);
            updateRouteState(updated);
        } else {
            const updated = dynamicTests.map((t: any) => (t.section?.trim() || 'Основной раздел') === oldName ? { ...t, section: newName } : t);
            updateTestsState(updated);
        }
        setRenameSectionPrompt({ isOpen: false, type: 'route', oldName: '', newName: '' });
    };

    const confirmPromptSection = () => {
        if (!promptSection.name.trim()) return;
        const newSecName = promptSection.name.trim();
        if (promptSection.type === 'route') {
            const updated = [...dynamicRoute, { id: 'placeholder_' + Date.now(), section: newSecName, isPlaceholder: true }];
            updateRouteState(updated);
        } else {
            const updated = [...dynamicTests, { id: 'placeholder_' + Date.now(), section: newSecName, isPlaceholder: true }];
            updateTestsState(updated);
        }
        setPromptSection({ isOpen: false, type: 'route', name: '' });
    };

    const theoryGroups = (dynamicRoute || []).reduce((groups: any, step: any) => {
        const sec = normalizeSectionName(step.section);
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push(step);
        return groups;
    }, {});

    Object.keys(theoryGroups).forEach((sectionName) => {
        theoryGroups[sectionName] = sortSectionEntries(theoryGroups[sectionName]);
    });

    const testGroups = (dynamicTests || []).reduce((groups: any, test: any) => {
        const sec = normalizeSectionName(test.section);
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push(test);
        return groups;
    }, {});

    Object.keys(testGroups).forEach((sectionName) => {
        testGroups[sectionName] = sortSectionEntries(testGroups[sectionName]);
    });

    const educationSections = Array.from(new Set(
        [...(dynamicRoute || []), ...(dynamicTests || [])]
            .filter((item: any) => !item.isPlaceholder || item.section)
            .map((item: any) => normalizeSectionName(item.section)),
    )).sort((left, right) => left.localeCompare(right, 'ru'));
    
    const getSectionTestSequence = (targetTest: any) => {
        const targetSection = normalizeSectionName(targetTest?.section);

        return sortSectionEntries(
            (dynamicTests || []).filter((test: any) => {
                if (!test || test.isPlaceholder) {
                    return false;
                }

                const isSameSection = normalizeSectionName(test.section) === targetSection;
                const hasQuiz = Array.isArray(test.quiz) && test.quiz.length > 0;

                return isSameSection && hasQuiz;
            }),
        );
    };
    const getUnpassedPreviousSectionTests = (targetTest: any) => {
        const sectionTests = getSectionTestSequence(targetTest);
        const sectionIndex = sectionTests.findIndex((test: any) => test.id === targetTest?.id);

        if (sectionIndex <= 0) {
            return [];
        }

        return sectionTests.slice(0, sectionIndex).filter((test: any) => !completedTests.includes(test.id));
    };
    const buildMissingSectionTestsMessage = (tests: any[]) => {
        return tests.map((test: any) => {
            const sectionTests = getSectionTestSequence(test);
            const sectionIndex = sectionTests.findIndex((sectionTest: any) => sectionTest.id === test.id);
            const displayIndex = typeof test.order === 'number' ? test.order : sectionIndex + 1;

            return `— Тест ${displayIndex}: ${stripEmoji(test.title)}`;
        }).join('\n');
    };

    const handleTestAnswer = (idx: number) => {
        if (activeAnswer !== null) return; 
        setActiveAnswer(idx);
        const newAnswers = [...testAnswers, idx];
        setTestAnswers(newAnswers);
        setTimeout(() => { 
            if (currentQuizStep < activeTestSession.quiz.length - 1) { setCurrentQuizStep((v: number) => v + 1); setActiveAnswer(null); } 
            else finishMainTest(newAnswers);
        }, 400); 
    };

    const finishMainTest = async (answers: number[]) => {
        let correctCount = 0;
        let mistakesArray: Array<{q: string, userAns: string, correctAns: string}> = [];
        activeTestSession.quiz.forEach((q: any, i: number) => {
            if (q.c === answers[i]) correctCount++;
            else mistakesArray.push({ q: q.q, userAns: q.o[answers[i]], correctAns: q.o[q.c] });
        });

        const score = Math.round((correctCount / activeTestSession.quiz.length) * 100);
        const isPassed = score >= 80;
        const currentUserName = localStorage.getItem('current_user_name') || 'Сотрудник';
        const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

        try {
            const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_test_results_v1`);
            let results = await res.json().catch(() => []);
            if (!Array.isArray(results)) results = [];

            const previousAttempts = results.filter((r: any) => r.testId === activeTestSession.id && r.userName === currentUserName).length;
            const newResult = { id: Date.now(), testId: activeTestSession.id, userName: currentUserName, testName: activeTestSession.title, score: score, attempts: previousAttempts + 1, date: formattedTime };
            saveDataToServer('tea_hub_test_results_v1', [newResult, ...results]);

            if (isPassed && !completedTests.includes(activeTestSession.id)) {
                const newComp = [...completedTests, activeTestSession.id];
                setCompletedTests(newComp);
                localStorage.setItem(`th_prog_tests_${userId}`, JSON.stringify(newComp));
                saveDataToServer(`prog_tests_${userId}`, newComp);
            }
            
            setTestResultModal({ show: true, score, isPassed, title: activeTestSession.title, mistakes: mistakesArray });
            setActiveTestSession(null); setCurrentQuizStep(0); setTestAnswers([]); setActiveAnswer(null); setTimeLeft(null);
        } catch (e) { console.error("Ошибка сохранения результатов", e); }
    };

    const handleUrgentTestAnswer = (idx: number) => {
        if (activeAnswer !== null) return; 
        setActiveAnswer(idx);
        const newAnswers = [...urgentTestAnswers, idx];
        setUrgentTestAnswers(newAnswers);
        setTimeout(() => { 
            if (urgentTestStep < activeUrgentTest.quiz.length - 1) { setUrgentTestStep((v: number) => v + 1); setActiveAnswer(null); } 
            else finishUrgentTest(newAnswers);
        }, 500); 
    };

    const finishUrgentTest = async (answers: number[]) => {
        let correct = 0;
        activeUrgentTest.quiz.forEach((q: any, i: number) => { if (q.c === answers[i]) correct++; });
        const score = Math.round((correct / activeUrgentTest.quiz.length) * 100);
        const isPassed = score >= 80;
        const currentUserName = localStorage.getItem('current_user_name') || 'Сотрудник';
        const formattedTime = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

        try {
            const res = await fetch(`/api/storage?t=${Date.now()}&key=tea_hub_test_results_v1`);
            let results = await res.json().catch(() => []);
            if (!Array.isArray(results)) results = [];

            const previousAttempts = results.filter((r: any) => r.testId === activeUrgentTest.id && r.userName === currentUserName).length;
            const newResult = { id: Date.now(), testId: activeUrgentTest.id, userName: currentUserName, testName: activeUrgentTest.name, score: score, attempts: previousAttempts + 1, date: formattedTime };
            saveDataToServer('tea_hub_test_results_v1', [newResult, ...results]);

            if (isPassed) {
                const newPassed = [...passedTests, activeUrgentTest.id];
                setPassedTests(newPassed);
                localStorage.setItem(`th_cache_passed_tests_${userId}`, JSON.stringify(newPassed));
                saveDataToServer(`th_passed_tests_${userId}`, newPassed);
            }
            
            setTestResultModal({ show: true, score, isPassed, title: activeUrgentTest.name, mistakes: [] });
            setActiveUrgentTest(null); setUrgentTestStep(0); setUrgentTestAnswers([]); setActiveAnswer(null); setTimeLeft(null);
        } catch (e) { console.error("Ошибка", e); }
    };

    return (
        <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
            
            {/* --- СРОЧНО К ПРОХОЖДЕНИЮ --- */}
            <div style={{ marginBottom: '50px', width: '100%', boxSizing: 'border-box' }}>
                <div className="tasks-flex-space" style={flexSpace as any}>
                    <h2 className="tasks-title" style={{ ...sectionTitle, color: '#ff4d4d', margin: 0 } as any}>Срочно к прохождению</h2>
                </div>
                {urgentTasks.length > 0 ? (
                    <div className="premium-cards-container"> 
                        {urgentTasks.map((file: any) => (
                            file.id && file.id.startsWith('deadline_') ? (
                                <div key={file.id} className="premium-card deadline-card" style={{ borderColor: '#ff4d4d', borderWidth: '1px', cursor: file.linkedTestId ? 'pointer' : 'default' }}
                                     onClick={() => {
                                         if (file.linkedTestId) {
                                             const targetTest = dynamicTests.find((t:any) => t.id === file.linkedTestId);
                                             if (targetTest) {
                                                 const unpassedTestsBefore = getUnpassedPreviousSectionTests(targetTest);

                                                 if (unpassedTestsBefore.length > 0 && !isAdmin) {
                                                     const missingList = buildMissingSectionTestsMessage(unpassedTestsBefore);
                                                     
                                                     setLockedTestAlert({
                                                         show: true, 
                                                         message: `Для прохождения этого дедлайна необходимо по порядку сдать предыдущие тесты:\n\n${missingList}`
                                                     });
                                                 } else if (isLockedByUrgent && !isAdmin) {
                                                     setLockedTestAlert({show: true, message: `Доступ к тестам закрыт.\nНе пройдены обязательные аттестации:\n${pendingAttestations.map((t:any) => '— ' + stripEmoji(t.name)).join('\n')}`});
                                                 } else {
                                                     setSelectedTest(targetTest);
                                                 }
                                             }
                                         }
                                     }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{fontSize:'12px', color:'#ff4d4d', fontWeight:'900', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 9V13M12 17H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                ДЕДЛАЙН
                                            </span>
                                            <h4 style={{fontSize:'15px', margin:'0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.4'}}>{file.name.replace(' Дедлайн: ', '').replace('Дедлайн: ', '')}</h4>
                                        </div>
                                        <div onClick={(e) => { e.stopPropagation(); handleDismissTask(file.id); }} className="card-icon-btn del-btn" title="Закрыть" style={{ border: 'none', background: 'transparent', flexShrink: 0 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 6L6 18M6 6L18 18" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <div style={boxesFlexWrapStyle as any}>
                                        {file.outlinedItems && file.outlinedItems.map((item: string, idx: number) => (
                                            <div key={idx} style={{
                                                border: '1px solid #ff4d4d',
                                                borderRadius: '8px',
                                                padding: '6px 10px',
                                                fontSize: '11px',
                                                color: '#ff4d4d',
                                                fontWeight: 'bold',
                                                background: 'rgba(255, 77, 77, 0.05)',
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.4'
                                            }}>{normalizeText(item)}</div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ color: '#ff4d4d', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>{file.size}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: '#555', fontSize: '11px', fontWeight: 'bold' }}>Назначено: {file.date}</div>
                                            {file.linkedTestId && <div style={{ fontSize: '11px', color: '#0abab5', fontWeight: 'bold' }}>ПРОЙТИ ТЕСТ ↗</div>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={file.id} className="premium-card" onClick={() => {
                                    setActiveUrgentTest({ ...file, quiz: shuffleArray(file.quiz || []) });
                                    if (file.timeLimit > 0) setTimeLeft(file.timeLimit * 60);
                                    else setTimeLeft(null);
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 4L2 9L12 14L22 9L12 4Z" fill="rgba(10,186,181,0.2)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M6 11V16C6 16 9 19 12 19C15 19 18 16 18 16V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                АТТЕСТАЦИЯ
                                            </span>
                                            <h4 style={{fontSize:'16px', margin:'0', fontWeight:'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3'}}>{stripEmoji(file.name)}</h4>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={cardFooter as any}><span>Пройти тестирование</span><span style={{color: '#0abab5'}}>{file.quiz?.length || 0} вопр.</span></div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div style={{ color: '#666', fontSize: '14px', background: '#111', padding: '30px', borderRadius: '30px', border: '1px dashed #222', textAlign: 'center' }}>
                        У вас нет срочных заданий.
                    </div>
                )}
            </div>

            {/* --- БЛОК 1: ТЕОРИЯ --- */}
            <div className="tasks-flex-space" style={flexSpace as any}>
               <h2 className="tasks-title" style={sectionTitle as any}>Теория</h2>
               {isAdmin && (
                   <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                       <button className="hover-unified-app" onClick={() => setPromptSection({isOpen: true, type: 'route', name: ''})} style={adminActionBtn as any}>+ НОВЫЙ РАЗДЕЛ</button>
                       <div className="education-create-wrap">
                           <button
                               onClick={() => setCreateMenu(createMenu === 'topic' ? null : 'topic')}
                               className="hover-unified-app education-create-trigger"
                               style={{...adminActionBtn, background: '#0abab5', color: '#000'} as any}
                               aria-expanded={createMenu === 'topic'}
                           >
                               + НОВАЯ ТЕМА <span>⌄</span>
                           </button>
                           {createMenu === 'topic' && (
                               <div className="education-create-menu">
                                   <button type="button" onClick={openManualRouteForm}>
                                       <span className="education-create-icon">+</span>
                                       <span><strong>Создать вручную</strong><small>Пустой редактор темы</small></span>
                                   </button>
                                   <button type="button" onClick={() => openAiGenerator('topic')}>
                                       <span className="education-create-icon is-ai">AI</span>
                                       <span><strong>Создать через Alice AI</strong><small>Черновик из документов</small></span>
                                   </button>
                               </div>
                           )}
                       </div>
                   </div>
               )}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.entries(theoryGroups).map(([secName, items]: any) => (
                   <div key={secName} style={{ marginBottom: '40px' }}>
                       <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: isSectionCollapsed('theory:' + secName) ? 0 : '20px' }}>
                           <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px', marginBottom: '-4px'}}>
                                   <path d="M22 19A2 2 0 0 1 20 21H4A2 2 0 0 1 2 19V5A2 2 0 0 1 4 3H9L11 5H20A2 2 0 0 1 22 7V19Z" fill="rgba(10,186,181,0.1)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                               </svg>
                               {secName}
                               <SectionCollapseButton
                                   isCollapsed={isSectionCollapsed('theory:' + secName)}
                                   onToggle={() => toggleSection('theory:' + secName)}
                                   sectionName={secName}
                               />
                           </h3>
                           {isAdmin && secName !== 'Основной раздел' && (
                               <div style={{display: 'flex', gap: '15px'}}>
                                   <span onClick={() => setRenameSectionPrompt({isOpen: true, type: 'route', oldName: secName, newName: secName})} style={{ color: '#0abab5', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '3px', marginBottom: '-2px'}}>
                                           <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                           <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                       </svg>
                                       РЕДАКТИРОВАТЬ
                                   </span>
                                   <span onClick={() => setConfirmSectionDelete({isOpen: true, type: 'route', name: secName})} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '3px', marginBottom: '-2px'}}>
                                           <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                       </svg>
                                       УДАЛИТЬ
                                   </span>
                               </div>
                           )}
                       </div>
                       
                       {!isSectionCollapsed('theory:' + secName) && <div className="premium-cards-container section-collapsible-content">
                           {items.filter((step: any) => step.h1 !== 'DELETE_ME').map((step: any, idx: number) => {
                                   const isDone = completedRoute.includes(step.id);
                                   return (
                                       <div key={step.id} onClick={() => setSelectedRouteStep(step)} className="premium-card">
                                          
                                          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr auto' : '1fr', gap: '10px 15px', alignItems: 'start', marginBottom: '15px' }}>
                                              <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'800', marginBottom: '0', display: 'block'}}>Урок {step.order || idx + 1}</span>
                                              
                                              {isAdmin && (
                                                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, zIndex: 10, gridColumn: '2 / 3', gridRow: '1 / 2' }} onClick={e => e.stopPropagation()}>
                                                      <div onClick={(e) => { e.stopPropagation(); setMovingItem({id: step.id, type: 'route'}); }} className="card-icon-btn move-btn" title="Переместить">
                                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8L12 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                      </div>
                                                      <div onClick={(e) => { e.stopPropagation(); setAiReview(null); setRouteFormData({ id: step.id, title: step.title, time: step.time || '5 мин', section: step.section || '', order: String(step.order || idx + 1), mediaType: step.mediaType || 'text', videoIframe: step.videoIframe || '', videoDesc: step.videoDesc || '', h1: step.h1, t1: step.t1, img1: step.img1 || '', h2: step.h2, t2: step.t2, img2: step.img2 || '', h3: step.h3, t3: step.t3, img3: step.img3 || '', linkedMaterials: Array.isArray(step.linkedMaterials) ? step.linkedMaterials : [] }); setShowRouteForm(true); }} className="card-icon-btn edit-btn" title="Редактировать">
                                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                      </div>
                                                      <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, type: 'route', targetId: step.id, name: step.title}); }} className="card-icon-btn del-btn" title="Удалить">
                                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                      </div>
                                                  </div>
                                              )}

                                              <h4 style={{fontSize:'16px', margin:'0', fontWeight:'bold', color: '#fff', lineHeight: '1.35', display: 'flex', alignItems: 'flex-start', gap: '10px', gridColumn: '1 / -1', minHeight: '64px'}}>
                                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0, marginTop: '1px'}}>
                                                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="rgba(10,186,181,0.15)" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <path d="M14 2V8H20" fill="rgba(10,186,181,0.3)" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <path d="M8 13H16" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <path d="M8 17H13" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                  </svg>
                                                  <span style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'auto'}}>
                                                      {stripEmoji(step.title)}
                                                  </span>
                                              </h4>
                                          </div>
                                          
                                          <div style={{ marginTop: 'auto' }}>
                                              <div style={pBarBg as any}><div style={pBarFill(isDone ? 100 : 0) as any} /></div>
                                              <div style={cardFooter as any}>
                                                  <span>{isDone ? 'Выполнено' : 'Начать'}</span>
                                                  <span>
                                                      {step.mediaType === 'video' ? (
                                                          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                              Видео
                                                          </span>
                                                      ) : (
                                                          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                              Чтение
                                                          </span>
                                                      )} • {step.time}
                                                  </span>
                                              </div>
                                          </div>
                                       </div>
                                   );
                               })
                           }
                       </div>}
                   </div>
               ))}
            </div>

            {/* --- БЛОК 2: ТЕСТЫ --- */}
            <div className="tasks-flex-space" style={flexSpace as any}>
                <h2 className="tasks-title" style={sectionTitle as any}>Тесты</h2>
                {isAdmin && (
                   <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                       <button className="hover-unified-app" onClick={() => setPromptSection({isOpen: true, type: 'test', name: ''})} style={adminActionBtn as any}>+ НОВЫЙ РАЗДЕЛ</button>
                       <div className="education-create-wrap">
                           <button
                               onClick={() => setCreateMenu(createMenu === 'test' ? null : 'test')}
                               className="hover-unified-app education-create-trigger"
                               style={{...adminActionBtn, background: '#0abab5', color: '#000'} as any}
                               aria-expanded={createMenu === 'test'}
                           >
                               + НОВЫЙ ТЕСТ <span>⌄</span>
                           </button>
                           {createMenu === 'test' && (
                               <div className="education-create-menu">
                                   <button type="button" onClick={openManualTestForm}>
                                       <span className="education-create-icon">+</span>
                                       <span><strong>Создать вручную</strong><small>Пустой редактор теста</small></span>
                                   </button>
                                   <button type="button" onClick={() => openAiGenerator('test')}>
                                       <span className="education-create-icon is-ai">AI</span>
                                       <span><strong>Создать через Alice AI</strong><small>Вопросы из документов</small></span>
                                   </button>
                               </div>
                           )}
                       </div>
                   </div>
                )}
            </div>
            
            <div style={{ marginBottom: '60px' }}>
               {Object.entries(testGroups).map(([secName, items]: any) => (
                   <div key={secName} style={{ marginBottom: '40px' }}>
                       <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: isSectionCollapsed('test:' + secName) ? 0 : '20px' }}>
                           <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px', marginBottom: '-4px'}}>
                                   <path d="M9 2H15A1 1 0 0 1 16 3V5A1 1 0 0 1 15 6H9A1 1 0 0 1 8 5V3A1 1 0 0 1 9 2Z" fill="rgba(10,186,181,0.1)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                   <path d="M8 4H5A2 2 0 0 0 3 6V20A2 2 0 0 0 5 22H19A2 2 0 0 0 21 20V6A2 2 0 0 0 19 4H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                   <path d="M9 12H15M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                               </svg>
                               {secName}
                               <SectionCollapseButton
                                   isCollapsed={isSectionCollapsed('test:' + secName)}
                                   onToggle={() => toggleSection('test:' + secName)}
                                   sectionName={secName}
                               />
                           </h3>
                           {isAdmin && secName !== 'Основной раздел' && (
                               <div style={{display: 'flex', gap: '15px'}}>
                                   <span onClick={() => setRenameSectionPrompt({isOpen: true, type: 'test', oldName: secName, newName: secName})} style={{ color: '#0abab5', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '3px', marginBottom: '-2px'}}>
                                           <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                           <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                       </svg>
                                       РЕДАКТИРОВАТЬ
                                   </span>
                                   <span onClick={() => setConfirmSectionDelete({isOpen: true, type: 'test', name: secName})} style={{ color: '#ff4d4d', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '3px', marginBottom: '-2px'}}>
                                           <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                       </svg>
                                       УДАЛИТЬ
                                   </span>
                               </div>
                           )}
                       </div>
                       
                       {!isSectionCollapsed('test:' + secName) && <div className="premium-cards-container section-collapsible-content">
                           {items.filter((test: any) => test.quiz && test.quiz.length > 0).map((test: any, idx: number) => {
                                   const isDone = completedTests.includes(test.id);
                                   const unpassedTestsBefore = getUnpassedPreviousSectionTests(test);
                                   const isUnlocked = isDone || isAdmin || unpassedTestsBefore.length === 0;
                                   
                                   return (
                                       <div key={test.id} onClick={() => { 
                                               if (isDone) {
                                                   setReviewTest(test);
                                               } else if (isLockedByUrgent && !isAdmin) {
                                                   setLockedTestAlert({
                                                       show: true, 
                                                       message: `Доступ к обычным тестам закрыт.\nНе пройдены обязательные аттестации:\n${pendingAttestations.map((t:any) => '— ' + stripEmoji(t.name)).join('\n')}`
                                                   });
                                               } else if (!isUnlocked && !isAdmin) {
                                                   const missingList = buildMissingSectionTestsMessage(unpassedTestsBefore);
                                                   
                                                   setLockedTestAlert({show: true, message: `Сначала необходимо по порядку сдать предыдущие тесты:\n\n${missingList}`});
                                               } else {
                                                   setSelectedTest(test); 
                                               }
                                           }} 
                                           className="premium-card" style={{ borderColor: isUnlocked || isAdmin ? '#222' : '#111', cursor: isUnlocked || isAdmin ? 'pointer' : 'not-allowed' }}
                                       >
                                          {(!isUnlocked && !isAdmin) && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '14px', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="2"/>
                                                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                              </svg>
                                          </div>}
                                          
                                          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr auto' : '1fr', gap: '10px 15px', alignItems: 'start', marginBottom: '15px', opacity: isUnlocked ? 1 : 0.5 }}>
                                              <span style={{fontSize:'12px', color: isUnlocked ? '#0abab5' : '#555', fontWeight:'800', marginBottom: '0', display: 'block'}}>Тест {test.order || idx + 1}</span>
                                              
                                              {isAdmin && (
                                                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, zIndex: 10, gridColumn: '2 / 3', gridRow: '1 / 2' }} onClick={e => e.stopPropagation()}>
                                                      <div onClick={(e) => { e.stopPropagation(); setMovingItem({id: test.id, type: 'test'}); }} className="card-icon-btn move-btn" title="Переместить">
                                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8L12 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                      </div>
                                                      <div onClick={(e) => { 
                                                          e.stopPropagation(); 
                                                          setAiReview(null);
                                                          setTestFormData({
                                                              id: test.id, title: test.title, subtitle: test.subtitle, theory: test.theory,
                                                              section: test.section || '', order: String(test.order || idx + 1), timeLimit: test.timeLimit || 0,
                                                              quiz: test.quiz && test.quiz.length > 0 ? JSON.parse(JSON.stringify(test.quiz)) : [{ q: '', o: ['', '', '', ''], c: 0 }],
                                                              linkedMaterials: Array.isArray(test.linkedMaterials) ? test.linkedMaterials : [],
                                                          }); 
                                                          setShowTestForm(true); 
                                                      }} className="card-icon-btn edit-btn" title="Редактировать">
                                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                      </div>
                                                      <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, type: 'test', targetId: test.id, name: test.title}); }} className="card-icon-btn del-btn" title="Удалить">
                                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                      </div>
                                                  </div>
                                              )}

                                              <h4 style={{fontSize:'16px', margin:'0', fontWeight:'bold', color: isUnlocked ? '#fff' : '#666', lineHeight: '1.35', display: 'flex', alignItems: 'flex-start', gap: '10px', gridColumn: '1 / -1', minHeight: '64px'}}>
                                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0, marginTop: '1px'}}>
                                                      <path d="M9 2H15C15.5523 2 16 2.44772 16 3V5C16 5.55228 15.5523 6 15 6H9C8.44772 6 8 5.55228 8 5V3C8 2.44772 8.44772 2 9 2Z" fill={isUnlocked ? "rgba(10,186,181,0.15)" : "rgba(102,102,102,0.15)"} stroke={isUnlocked ? "#0abab5" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <path d="M8 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4H16" stroke={isUnlocked ? "#0abab5" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <path d="M9 12L11 14L15 10" stroke={isUnlocked ? "#0abab5" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                  </svg>
                                                  <span style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'auto'}}>
                                                      {stripEmoji(test.title)}
                                                  </span>
                                              </h4>
                                          </div>

                                          <div style={{ marginTop: 'auto', opacity: isUnlocked ? 1 : 0.5 }}>
                                              <div style={pBarBg as any}><div style={pBarFill(isDone ? 100 : 0) as any} /></div>
                                              <div style={cardFooter as any}><span>{isDone ? 'Сдан' : 'Не сдан'}</span><span>{test.quiz?.length || 0} вопр.</span></div>
                                          </div>
                                       </div>
                                   );
                               })
                           }
                       </div>}
                   </div>
               ))}
            </div>

            {/* --- МИНИ-ОКНА АДМИНА --- */}
            {promptSection.isOpen && (
                <div style={modalOverlay as any} onClick={() => setPromptSection({isOpen: false, type: 'route', name: ''})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900'}}>НОВЫЙ РАЗДЕЛ</h2>
                        <input style={adminIn as any} autoFocus placeholder="Название раздела" value={promptSection.name} onChange={e => setPromptSection({...promptSection, name: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="hover-unified-app" onClick={() => setPromptSection({isOpen: false, type: 'route', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={confirmPromptSection} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОЗДАТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {renameSectionPrompt.isOpen && (
                <div style={modalOverlay as any} onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>ПЕРЕИМЕНОВАТЬ РАЗДЕЛ</h2>
                        <input style={adminIn as any} autoFocus placeholder="Новое название" value={renameSectionPrompt.newName} onChange={e => setRenameSectionPrompt({...renameSectionPrompt, newName: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="hover-unified-app" onClick={() => setRenameSectionPrompt({...renameSectionPrompt, isOpen: false})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={() => {
                                if (!renameSectionPrompt.newName.trim()) return;
                                const newName = renameSectionPrompt.newName.trim();
                                const oldName = renameSectionPrompt.oldName;
                                if (renameSectionPrompt.type === 'route') {
                                    const updated = dynamicRoute.map((r: any) => (r.section || 'Основной раздел') === oldName ? { ...r, section: newName } : r);
                                    updateRouteState(updated);
                                } else {
                                    const updated = dynamicTests.map((t: any) => (t.section || 'Основной раздел') === oldName ? { ...t, section: newName } : t);
                                    updateTestsState(updated);
                                }
                                setRenameSectionPrompt({ isOpen: false, type: 'route', oldName: '', newName: '' });
                            }} style={{ ...saveBtn, flex: 1, marginTop: 0 } as any}>СОХРАНИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmSectionDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmSectionDelete({isOpen: false, type: 'route', name: ''})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ff4d4d" strokeWidth="2"/>
                                <path d="M12 8V13" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="16" r="1" fill="#ff4d4d"/>
                            </svg>
                        </div>
                        <h2 style={{color: '#ff4d4d', fontWeight: '900', marginBottom: '15px'}}>УДАЛИТЬ РАЗДЕЛ?</h2>
                        <p style={{color: '#ccc', fontSize: '14px', marginBottom: '25px'}}>Вы уверены, что хотите удалить раздел "{confirmSectionDelete.name}" и ВСЕ карточки внутри него?</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="hover-unified-app" onClick={() => setConfirmSectionDelete({isOpen: false, type: 'route', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={() => {
                                if (confirmSectionDelete.type === 'route') {
                                    const updated = dynamicRoute.filter((r: any) => (r.section || 'Основной раздел') !== confirmSectionDelete.name);
                                    updateRouteState(updated);
                                } else {
                                    const updated = dynamicTests.filter((t: any) => (t.section || 'Основной раздел') !== confirmSectionDelete.name);
                                    updateTestsState(updated);
                                }
                                setConfirmSectionDelete({ isOpen: false, type: 'route', name: '' });
                            }} className="hover-unified-app" style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, marginTop: 0 } as any}>УДАЛИТЬ ВСЕ</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmDelete({isOpen: false, type: 'route', targetId: '', name: ''})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ff4d4d" strokeWidth="2"/>
                                <path d="M12 8V13" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="16" r="1" fill="#ff4d4d"/>
                            </svg>
                        </div>
                        <h2 style={{color: '#ff4d4d', fontWeight: '900', marginBottom: '15px'}}>УДАЛИТЬ КАРТОЧКУ?</h2>
                        <p style={{color: '#ccc', fontSize: '14px', marginBottom: '25px'}}>Вы уверены, что хотите удалить карточку?</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="hover-unified-app" onClick={() => setConfirmDelete({isOpen: false, type: 'route', targetId: '', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={() => {
                                if (confirmDelete.type === 'route') updateRouteState(dynamicRoute.filter((r: any) => r.id !== confirmDelete.targetId));
                                else updateTestsState(dynamicTests.filter((t: any) => t.id !== confirmDelete.targetId));
                                setConfirmDelete({ isOpen: false, type: 'route', targetId: '', name: '' });
                            }} className="hover-unified-app" style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, marginTop: 0 } as any}>УДАЛИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {movingItem && (
                <div style={modalOverlay as any} onClick={() => { setMovingItem(null); setMoveNewSectionName(''); }}>
                    <div style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#0abab5', textAlign: 'center', marginBottom: '20px', fontWeight: '900', textTransform: 'uppercase'}}>Переместить в раздел</h2>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px'}} className="custom-scroll">
                            {Array.from(new Set((movingItem.type === 'route' ? dynamicRoute : dynamicTests).map((i: any) => i.section?.trim() || 'Основной раздел'))).map((sec: any) => (
                                <button key={sec} onClick={() => handleMoveItem(sec)} style={{...adminIn, textAlign: 'left', cursor: 'pointer', background: '#1a1a1a', border: '1px solid #333'} as any}>{sec}</button>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                            <input style={adminIn as any} placeholder="Название нового раздела..." value={moveNewSectionName} onChange={e => setMoveNewSectionName(e.target.value)} />
                            <button className="hover-unified-app" onClick={() => { if (moveNewSectionName.trim()) handleMoveItem(moveNewSectionName.trim()); }} style={{...adminActionBtn, marginTop: '10px', width: '100%', padding: '16px'} as any}>СОЗДАТЬ И ПЕРЕМЕСТИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {lockedTestAlert.show && (
                <div style={{...errorOverlayStyle, zIndex: 50000} as any} onClick={() => setLockedTestAlert({show: false, message: ''})}>
                    <div className="tasks-modal" style={errorModalContent as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(255,77,77,0.1)" stroke="#ff4d4d" strokeWidth="2"/>
                                <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '20px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>ДОСТУП ЗАКРЫТ</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6', marginBottom: '25px', whiteSpace: 'pre-wrap' }}>{lockedTestAlert.message}</p>
                        <button onClick={() => setLockedTestAlert({show: false, message: ''})} style={{...errorBtnStyle, background: '#333', color: '#fff', marginTop: 0} as any}>ПОНЯТНО</button>
                    </div>
                </div>
            )}

            {aiGeneratorKind && (
                <AiContentGenerator
                    initialKind={aiGeneratorKind}
                    sections={educationSections}
                    onClose={() => setAiGeneratorKind(null)}
                    onGenerated={handleAiDraftGenerated}
                />
            )}

            {/* --- ПРЕДПРОСМОТР КАРТОЧКИ "ТЕОРИЯ" --- */}
            {selectedRouteStep && !showRouteForm && (
                <div style={modalOverlay as any} onClick={closeRouteModal}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentLarge, maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'30px'}}>
                            <div>
                                <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase'}}>ТЕОРИЯ • {selectedRouteStep.time}</span>
                                <h2 style={{fontSize:'28px', color:'#fff', fontWeight:'900', marginTop:'5px', margin:'0'}}>{selectedRouteStep.title}</h2>
                            </div>
                            <div onClick={closeRouteModal} style={{cursor:'pointer', fontSize:'28px', color:'#ff4d4d', fontWeight:'bold', lineHeight: 1}}>X</div>
                        </div>

                        {selectedRouteStep.mediaType === 'video' ? (
                            <MemoizedVideoPlayer iframeStr={selectedRouteStep.videoIframe || ''} descText={selectedRouteStep.videoDesc || ''} />
                        ) : (
                            <div className="tasks-theory-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '35px'}}>
                                {[1,2,3].map(num => {
                                    const h = selectedRouteStep[`h${num}`];
                                    const t = selectedRouteStep[`t${num}`];
                                    const img = selectedRouteStep[`img${num}`];
                                    if (!h) return null;
                                    return (
                                        <div key={num} className="tasks-theory-block" style={theoryBlock as any}>
                                            {img && (
                                                <div className="image-zoom-container" style={{position:'relative', width:'100%', height:'200px', borderRadius:'15px', overflow:'hidden', cursor:'pointer', marginBottom:'15px'}} onClick={() => setZoomedImg(img)}>
                                                    <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                                    <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'13px', fontWeight:'bold'}}>
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                                                            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <path d="M21 21L16.65 16.65" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <path d="M11 8V14M8 11H14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                        Нажмите, чтобы увеличить
                                                    </div>
                                                </div>
                                            )}
                                            <div style={theoryLabel as any}>{h}</div>
                                            <p style={theoryText as any}>{t}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <LinkedMaterialsList
                            value={selectedRouteStep.linkedMaterials}
                            routes={dynamicRoute}
                            documents={urgentFiles}
                            onOpen={handleOpenLinkedMaterial}
                        />

                        {completedRoute.includes(selectedRouteStep.id) ? (
                            <button className="hover-unified-app" onClick={closeRouteModal} style={{...checkKnowledgeBtn, background: '#111', color: '#0abab5', border: '1px solid #0abab5'} as any}>МАТЕРИАЛ ПРОЙДЕН (ЗАКРЫТЬ)</button>
                        ) : (
                            <button className="hover-unified-app" onClick={() => handleRouteComplete(selectedRouteStep.id)} style={checkKnowledgeBtn as any}>Я ИЗУЧИЛ МАТЕРИАЛ</button>
                        )}
                    </div>
                </div>
            )}

            {/* --- РЕДАКТОР АДМИНА ДЛЯ ТЕОРИИ --- */}
            {showRouteForm && (
                <div style={modalOverlay as any} onClick={closeRouteEditor}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentMedium, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', padding: '40px 30px'} as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#fff', fontWeight: '900' }}>
                            {aiReview?.kind === 'topic' ? 'Проверка AI-черновика' : (routeFormData.id ? 'Редактировать тему' : 'Новая тема')}
                        </h2>

                        {aiReview?.kind === 'topic' && (
                            <div className="ai-review-banner">
                                <div className="ai-review-banner-head"><span>ALICE AI</span><strong>Черновик еще не создан на сайте</strong></div>
                                <p>Проверьте текст и при необходимости исправьте его. Источники: {aiReview.sourceFiles.join(', ')}.</p>
                                {aiReview.warnings.length > 0 && <small>Не прочитано: {aiReview.warnings.join(' ')}</small>}
                            </div>
                        )}
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px'}}>
                            <input autoComplete="new-password" name={"title_" + Date.now()} style={adminIn as any} placeholder="Название темы (напр. История чая)" value={routeFormData.title} onChange={e => setRouteFormData({...routeFormData, title: e.target.value})} />
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: '15px'}}>
                                <input list="route-sections" autoComplete="new-password" name={"sec_" + Date.now()} style={adminIn as any} placeholder="Раздел (Основной раздел)" value={routeFormData.section} onChange={e => setRouteFormData({...routeFormData, section: e.target.value})} />
                                <datalist id="route-sections">{Array.from(new Set(dynamicRoute.map((r: any) => r.section).filter(Boolean))).map((sec: any) => <option key={sec} value={sec} />)}</datalist>
                                <input autoComplete="new-password" style={adminIn as any} placeholder="Время (напр. 10 мин)" value={routeFormData.time} onChange={e => setRouteFormData({...routeFormData, time: e.target.value})} />
                                <input autoComplete="new-password" style={adminIn as any} placeholder="Урок №" value={routeFormData.order} onChange={e => setRouteFormData({...routeFormData, order: e.target.value.replace(/[^\d]/g, '')})} />
                            </div>
                            <div style={{fontSize: '12px', color: '#666', lineHeight: '1.5', marginTop: '-4px'}}>
                                Если указать новый порядковый номер, тема автоматически встанет на это место, а остальные темы в разделе сдвинутся.
                            </div>
                        </div>

                        <div style={{borderTop: '1px solid #222', paddingTop: '20px'}}>
                            <div style={{ display: 'flex', background: '#000', borderRadius: '12px', padding: '5px', marginBottom: '20px' }}>
                                <div onClick={() => setRouteFormData({...routeFormData, mediaType: 'text'})} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '10px', background: routeFormData.mediaType === 'text' ? '#0abab5' : 'transparent', color: routeFormData.mediaType === 'text' ? '#000' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Текст и фото
                                </div>
                                <div onClick={() => setRouteFormData({...routeFormData, mediaType: 'video'})} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '10px', background: routeFormData.mediaType === 'video' ? '#0abab5' : 'transparent', color: routeFormData.mediaType === 'video' ? '#000' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Видеоплеер
                                </div>
                            </div>
                            
                            {routeFormData.mediaType === 'video' ? (
                                <div>
                                    <textarea autoComplete="new-password" style={{...adminIn, height: '100px', resize: 'none', marginBottom: '15px', fontFamily: 'monospace', fontSize: '12px'} as any} placeholder='Код iframe для плеера (напр. <iframe src="..."></iframe>)' value={routeFormData.videoIframe} onChange={e => setRouteFormData({...routeFormData, videoIframe: e.target.value})} />
                                    <textarea autoComplete="new-password" style={{...adminIn, height: '100px', resize: 'none', marginBottom: 0} as any} placeholder="Текстовое описание под плеером..." value={routeFormData.videoDesc} onChange={e => setRouteFormData({...routeFormData, videoDesc: e.target.value})} />
                                </div>
                            ) : (
                                <div>
                                    <h3 style={{fontSize: '16px', color: '#0abab5', marginBottom: '15px', fontWeight: '900'}}>Блоки теории (макс. 3)</h3>
                                    {[1, 2, 3].map((num) => {
                                        const hKey = `h${num}` as 'h1' | 'h2' | 'h3';
                                        const tKey = `t${num}` as 't1' | 't2' | 't3';
                                        const imgKey = `img${num}` as 'img1' | 'img2' | 'img3';

                                        return (
                                            <div key={num} style={{background: '#0d0f0d', padding: '15px', borderRadius: '20px', border: '1px solid #222', marginBottom: '15px'}}>
                                                <input autoComplete="new-password" style={{...adminIn, fontWeight: 'bold', marginBottom: '10px'} as any} placeholder={`Заголовок блока ${num}`} value={routeFormData[hKey]} onChange={e => setRouteFormData({...routeFormData, [hKey]: e.target.value})} />
                                                <textarea autoComplete="new-password" style={{...adminIn, height: '80px', resize: 'none', marginBottom: '10px'} as any} placeholder={`Текст блока ${num}...`} value={routeFormData[tKey]} onChange={e => setRouteFormData({...routeFormData, [tKey]: e.target.value})} />
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <input autoComplete="new-password" style={{...adminIn, marginBottom: '0', fontSize: '13px', flex: 1} as any} placeholder="Ссылка на фото (URL)" value={routeFormData[imgKey]} onChange={e => setRouteFormData({...routeFormData, [imgKey]: e.target.value})} />
                                                    <input type="file" accept="image/*" id={`upload-img-${num}`} style={{ display: 'none' }} onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => setRouteFormData(prev => ({...prev, [imgKey]: ev.target?.result as string}));
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}/>
                                                    <button className="hover-unified-app" onClick={(e) => { e.preventDefault(); document.getElementById(`upload-img-${num}`)?.click(); }} style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Загрузить фото</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <LinkedMaterialsEditor
                            value={routeFormData.linkedMaterials}
                            onChange={(linkedMaterials) => setRouteFormData({ ...routeFormData, linkedMaterials })}
                            routes={dynamicRoute}
                            documents={urgentFiles}
                            currentRouteId={routeFormData.id || undefined}
                        />
                        <button className="hover-unified-app" onClick={handleSaveRoute} style={saveBtn as any}>
                            {aiReview?.kind === 'topic' ? 'ПРОВЕРЕНО: СОЗДАТЬ ТЕМУ' : 'СОХРАНИТЬ ТЕМУ'}
                        </button>
                        <div className="hover-link-unified-app" onClick={closeRouteEditor} style={cancelLink as any}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {/* --- ПРЕДПРОСМОТР КАРТОЧКИ "ТЕСТ" --- */}
            {selectedTest && (
               <div style={modalOverlay as any} onClick={closeTestModal}>
                  <div className="tasks-modal" style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'25px'}}>
                        <div>
                            <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase'}}>ТЕСТИРОВАНИЕ</span>
                            <h2 style={{fontSize:'24px', color:'#fff', fontWeight:'900', marginTop:'5px', marginBottom:'15px'}}>{selectedTest.title}</h2>
                            <p style={{fontSize:'14px', color:'#0abab5', fontWeight:'bold', margin:0, lineHeight:'1.4'}}>{selectedTest.subtitle}</p>
                        </div>
                        <div onClick={closeTestModal} style={{cursor:'pointer', fontSize:'24px', color:'#ff4d4d', fontWeight:'bold', paddingLeft:'15px'}}>X</div>
                     </div>
                     <div style={{background: '#0d0f0d', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '30px'}}>
                         <p style={{fontSize:'14px', color:'#ccc', lineHeight:'1.5', margin:'0 0 15px 0'}}>{selectedTest.theory}</p>
                         <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #1a1a1a', paddingTop:'15px'}}>
                             <span style={{fontSize:'13px', color:'#888', fontWeight:'bold'}}>Вопросов: <span style={{color:'#fff'}}>{selectedTest.quiz.length}</span></span>
                             <span style={{fontSize:'13px', color:'#888', fontWeight:'bold'}}>Порог: <span style={{color:'#0abab5'}}>80%</span></span>
                         </div>
                     </div>
                     <LinkedMaterialsList
                         value={selectedTest.linkedMaterials}
                         routes={dynamicRoute}
                         documents={urgentFiles}
                         onOpen={handleOpenLinkedMaterial}
                     />
                     <button className="hover-unified-app" style={saveBtn as any}>НАЧАТЬ ТЕСТИРОВАНИЕ</button>
                  </div>
               </div>
            )}

            {/* --- РЕДАКТОР АДМИНА ДЛЯ ТЕСТОВ --- */}
            {showTestForm && (
                <div style={modalOverlay as any} onClick={closeTestEditor}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentMedium, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', padding: '40px 30px'} as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#fff', fontWeight: '900' }}>
                            {aiReview?.kind === 'test' ? 'Проверка AI-черновика' : (testFormData.id ? 'Редактировать тест' : 'Новый тест')}
                        </h2>

                        {aiReview?.kind === 'test' && (
                            <div className="ai-review-banner">
                                <div className="ai-review-banner-head"><span>ALICE AI</span><strong>Тест еще не создан на сайте</strong></div>
                                <p>Проверьте каждый вопрос, варианты и отмеченный правильный ответ. Источники: {aiReview.sourceFiles.join(', ')}.</p>
                                {aiReview.warnings.length > 0 && <small>Не прочитано: {aiReview.warnings.join(' ')}</small>}
                            </div>
                        )}
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px'}}>
                            <input autoComplete="new-password" style={adminIn as any} placeholder="Название теста" value={testFormData.title} onChange={e => setTestFormData({...testFormData, title: e.target.value})} />
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 160px', gap: '15px'}}>
                                <input autoComplete="new-password" list="test-sections" style={adminIn as any} placeholder="Раздел" value={testFormData.section} onChange={e => setTestFormData({...testFormData, section: e.target.value})} />
                                <input autoComplete="new-password" style={adminIn as any} placeholder="Тест №" value={testFormData.order} onChange={e => setTestFormData({...testFormData, order: e.target.value.replace(/[^\d]/g, '')})} />
                            </div>
                            <datalist id="test-sections">{Array.from(new Set(dynamicTests.map((t: any) => t.section).filter(Boolean))).map((sec: any) => <option key={sec} value={sec} />)}</datalist>
                            <input autoComplete="new-password" style={adminIn as any} placeholder="Краткое описание" value={testFormData.subtitle} onChange={e => setTestFormData({...testFormData, subtitle: e.target.value})} />
                            <textarea autoComplete="new-password" style={{...adminIn, height: '80px', resize: 'none'} as any} placeholder="Теория перед тестом..." value={testFormData.theory} onChange={e => setTestFormData({...testFormData, theory: e.target.value})} />
                            <div style={{fontSize: '12px', color: '#666', lineHeight: '1.5', marginTop: '-4px'}}>
                                Можно поменять порядковый номер теста прямо здесь. Нумерация внутри раздела перестроится автоматически.
                            </div>
                        </div>

                        <LinkedMaterialsEditor
                            value={testFormData.linkedMaterials}
                            onChange={(linkedMaterials) => setTestFormData({ ...testFormData, linkedMaterials })}
                            routes={dynamicRoute}
                            documents={urgentFiles}
                        />

                        <div style={{borderTop: '1px solid #222', paddingTop: '20px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                <h3 style={{fontSize: '16px', color: '#0abab5', fontWeight: '900', margin: 0}}>Вопросы ({testFormData.quiz.length})</h3>
                                <button className="hover-unified-app" onClick={addTestQuestion} style={adminActionBtn as any}>+ ДОБАВИТЬ ВОПРОС</button>
                            </div>
                            
                            {testFormData.quiz.map((q: any, qIndex: number) => (
                                <div key={qIndex} style={{background: '#0d0f0d', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '15px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                                        <div style={{color: '#0abab5', fontWeight: 'bold'}}>Вопрос {qIndex + 1}</div>
                                        <div onClick={() => removeTestQuestion(qIndex)} style={{color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            Удалить
                                        </div>
                                    </div>
                                    <input autoComplete="new-password" style={{...adminIn, marginBottom: '15px'} as any} placeholder="Текст вопроса" value={q.q} onChange={e => updateTestQuestion(qIndex, 'q', e.target.value)} />
                                    
                                    <div style={{display: 'grid', gap: '10px'}}>
                                        {[0, 1, 2, 3].map(optIndex => (
                                            <div key={optIndex} style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <div 
                                                    onClick={() => updateTestQuestion(qIndex, 'c', optIndex)}
                                                    style={{width: '20px', height: '20px', borderRadius: '50%', border: q.c === optIndex ? '6px solid #0abab5' : '2px solid #555', cursor: 'pointer', flexShrink: 0}}
                                                />
                                                <input autoComplete="new-password" style={{...adminIn, padding: '10px', fontSize: '14px', marginBottom: '0', flex: 1} as any} placeholder={`Вариант ${optIndex + 1}`} value={q.o[optIndex]} onChange={e => updateTestQuestion(qIndex, `o${optIndex}`, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="hover-unified-app" onClick={handleSaveTestForm} style={saveBtn as any}>
                            {aiReview?.kind === 'test' ? 'ПРОВЕРЕНО: СОЗДАТЬ ТЕСТ' : 'СОХРАНИТЬ ТЕСТ'}
                        </button>
                        <div className="hover-link-unified-app" onClick={closeTestEditor} style={cancelLink as any}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {/* НОВОЕ ОКНО: ПРОСМОТР РЕЗУЛЬТАТОВ (ОШИБКИ И ОТВЕТЫ) */}
            {reviewTest && (
               <div style={modalOverlay as any} onClick={() => setReviewTest(null)}>
                  <div className="tasks-modal custom-scroll" style={{...modalContentLarge, maxWidth: '800px'} as any} onClick={e => e.stopPropagation()}>
                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                        <h2 style={{fontSize:'24px', color:'#0abab5', fontWeight:'900', margin:0, textTransform: 'uppercase'}}>ОБЗОР ТЕСТА: {stripEmoji(reviewTest.title || reviewTest.name)}</h2>
                        <div onClick={() => setReviewTest(null)} style={{cursor:'pointer', fontSize:'24px', color:'#ff4d4d', fontWeight:'bold'}}>X</div>
                     </div>
                     <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                         {reviewTest.quiz.map((q: any, i: number) => (
                             <div key={i} style={{background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222'}}>
                                 <p style={{fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '15px'}}>{i+1}. {q.q}</p>
                                 <div style={{background: 'rgba(10,186,181,0.1)', border: '1px solid rgba(10,186,181,0.3)', padding: '15px', borderRadius: '15px', color: '#0abab5', fontWeight: 'bold', fontSize: '14px'}}>
                                     <CustomIcon name="check" size={14} color="#0abab5" /> Верный ответ: {q.o[q.c]}
                                 </div>
                             </div>
                         ))}
                     </div>
                  </div>
               </div>
            )}

            {/* --- ПРЕДПРОСМОТР ЭКРАНА ТЕСТА --- */}
            {selectedTest && !activeTestSession && !showTestForm && (
               <div style={modalOverlay as any} onClick={closeTestModal}>
                  <div className="tasks-modal" style={modalContentSmall as any} onClick={e => e.stopPropagation()}>
                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'25px'}}>
                        <div>
                            <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase'}}>ПРЕДПРОСМОТР</span>
                            <h2 style={{fontSize:'24px', color:'#fff', fontWeight:'900', marginTop:'5px', marginBottom:'15px'}}>{selectedTest.title}</h2>
                            <p style={{fontSize:'14px', color:'#0abab5', fontWeight:'bold', margin:0, lineHeight:'1.4'}}>{selectedTest.subtitle}</p>
                        </div>
                        <div onClick={closeTestModal} style={{cursor:'pointer', fontSize:'24px', color:'#ff4d4d', fontWeight:'bold', paddingLeft:'15px'}}>X</div>
                     </div>
                     <div style={{background: '#0d0f0d', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '30px'}}>
                         <p style={{fontSize:'14px', color:'#ccc', lineHeight:'1.5', margin:'0 0 15px 0'}}>{selectedTest.theory}</p>
                         <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #1a1a1a', paddingTop:'15px'}}>
                             <span style={{fontSize:'13px', color:'#888', fontWeight:'bold'}}>Вопросов: <span style={{color:'#fff'}}>{selectedTest.quiz.length}</span></span>
                             <span style={{fontSize:'13px', color:'#888', fontWeight:'bold'}}>Порог: <span style={{color:'#0abab5'}}>80%</span></span>
                         </div>
                     </div>
                     <LinkedMaterialsList
                         value={selectedTest.linkedMaterials}
                         routes={dynamicRoute}
                         documents={urgentFiles}
                         onOpen={handleOpenLinkedMaterial}
                     />
                     <button onClick={() => { 
                         setActiveTestSession({ ...selectedTest, quiz: shuffleArray(selectedTest.quiz || []) }); 
                         if (selectedTest.timeLimit > 0) setTimeLeft(selectedTest.timeLimit * 60);
                         else setTimeLeft(null);
                         setSelectedTest(null); 
                     }} className="hover-unified-app" style={saveBtn as any}>ПРИСТУПИТЬ К ТЕСТУ</button>
                  </div>
               </div>
            )}

            {/* --- АКТИВНАЯ СЕССИЯ ТЕСТА (ANTI-CHEAT + ТАЙМЕР) --- */}
            {activeTestSession && (
               <div style={modalOverlay as any}>
                  <div className="tasks-modal" style={{...modalContentLarge, maxWidth: '800px'} as any}>
                     <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                        <div onClick={() => setCancelTestConfirm({show: true, type: 'normal'})} style={backLink as any}>← ПРЕРВАТЬ</div>
                        
                        <h2 style={{fontSize:'24px', color:'#fff', fontWeight:'900', textAlign:'center', flex: 2, padding: '0 20px'}}>{stripEmoji(activeTestSession.title)}</h2>
                        
                        <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                            {timeLeft !== null && (
                                <div style={{ 
                                    background: timeLeft < 60 ? 'rgba(255, 77, 77, 0.1)' : 'rgba(10, 186, 181, 0.1)', 
                                    border: `1px solid ${timeLeft < 60 ? '#ff4d4d' : '#0abab5'}`,
                                    color: timeLeft < 60 ? '#ff4d4d' : '#0abab5',
                                    padding: '8px 15px', borderRadius: '12px', fontWeight: '900', fontSize: '18px',
                                    boxShadow: timeLeft < 60 ? '0 0 10px rgba(255, 77, 77, 0.4)' : 'none',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom: '-1px'}}>
                                        <path d="M12 2V22M6 2H18M6 22H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M12 2C12 2 7 5 7 12C7 19 12 22 12 22" fill="currentColor" opacity="0.3"/>
                                        <path d="M12 2C12 2 17 5 17 12C17 19 12 22 12 22" fill="currentColor" opacity="0.3"/>
                                    </svg>
                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            )}
                        </div>
                     </div>
                     <div className="anti-cheat" style={{ animation: 'fadeInUp 0.3s ease', userSelect: 'none', WebkitUserSelect: 'none' } as any} onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()}>
                        <div style={quizBox as any}>
                            <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {currentQuizStep + 1} / {activeTestSession.quiz?.length || 1}</h4>
                            <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{activeTestSession.quiz?.[currentQuizStep]?.q}</p>
                            <div style={{display:'grid', gap:'15px'}}>
                               {activeTestSession.quiz?.[currentQuizStep]?.o.map((opt:any, i:any) => (
                                   <div key={i} onClick={() => handleTestAnswer(i)} className={`test-answer-btn ${activeAnswer === i ? 'selected' : ''}`}>{opt}</div>
                               ))}
                            </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- СРОЧНАЯ АТТЕСТАЦИЯ (ANTI-CHEAT + ТАЙМЕР) --- */}
            {activeUrgentTest && (
               <div style={modalOverlay as any}>
                  <div className="tasks-modal" style={modalContentLarge as any}>
                     <div className="tasks-modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                        <div onClick={() => setCancelTestConfirm({show: true, type: 'urgent'})} style={backLink as any}>← ОТЛОЖИТЬ</div>
                        
                        <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 2, padding: '0 20px'}}>{stripEmoji(activeUrgentTest.name)}</h2>
                        
                        <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                            {timeLeft !== null && (
                                <div style={{ 
                                    background: timeLeft < 60 ? 'rgba(255, 77, 77, 0.1)' : 'rgba(10, 186, 181, 0.1)', 
                                    border: `1px solid ${timeLeft < 60 ? '#ff4d4d' : '#0abab5'}`,
                                    color: timeLeft < 60 ? '#ff4d4d' : '#0abab5',
                                    padding: '8px 15px', borderRadius: '12px', fontWeight: '900', fontSize: '18px',
                                    boxShadow: timeLeft < 60 ? '0 0 10px rgba(255, 77, 77, 0.4)' : 'none',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom: '-1px'}}>
                                        <path d="M12 2V22M6 2H18M6 22H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M12 2C12 2 7 5 7 12C7 19 12 22 12 22" fill="currentColor" opacity="0.3"/>
                                        <path d="M12 2C12 2 17 5 17 12C17 19 12 22 12 22" fill="currentColor" opacity="0.3"/>
                                    </svg>
                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            )}
                        </div>
                     </div>
                     <div className="anti-cheat" style={{ animation: 'fadeInUp 0.3s ease', userSelect: 'none', WebkitUserSelect: 'none' } as any} onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()}>
                        <div style={quizBox as any}>
                            <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {urgentTestStep + 1} / {activeUrgentTest.quiz?.length || 1}</h4>
                            <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{activeUrgentTest.quiz?.[urgentTestStep]?.q}</p>
                            <div style={{display:'grid', gap:'15px'}}>
                               {activeUrgentTest.quiz?.[urgentTestStep]?.o.map((opt:any, i:any) => (
                                   <div key={i} onClick={() => handleUrgentTestAnswer(i)} className={`test-answer-btn ${activeAnswer === i ? 'selected' : ''}`}>{opt}</div>
                               ))}
                            </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* КАСТОМНОЕ ОКНО ПРЕРЫВАНИЯ ТЕСТА */}
            {cancelTestConfirm.show && (
                <div style={modalOverlay as any} onClick={() => setCancelTestConfirm({show: false, type: 'normal'})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '20px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ff4d4d" strokeWidth="2"/>
                                <path d="M12 8V13" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="16" r="1" fill="#ff4d4d"/>
                            </svg>
                        </div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase' }}>ПРЕРВАТЬ ТЕСТ?</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>
                            Вы уверены, что хотите прервать прохождение? Весь текущий прогресс ответов будет потерян.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <button className="hover-unified-app" onClick={() => setCancelTestConfirm({show: false, type: 'normal'})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={executeCancelTest} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, minWidth: '100px', marginTop: 0 } as any}>ПРЕРВАТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- МОДАЛКА РЕЗУЛЬТАТОВ ОСНОВНОГО ТЕСТА С ОШИБКАМИ --- */}
            {testResultModal.show && (
                <div style={{...errorOverlayStyle, zIndex: 60000} as any}>
                    {/* ЖЕСТКАЯ ШИРИНА ДЛЯ ПРАВИЛЬНЫХ ПРОПОРЦИЙ ОКНА */}
                    <div className="tasks-modal custom-scroll" style={{...errorModalContent, width: '100%', minWidth: '320px', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderColor: testResultModal.isPassed ? '#0abab5' : '#ff4d4d'} as any}>
                        <div style={{ marginBottom: '20px', animation: 'scaleIn 0.3s ease' }}>
                            {testResultModal.isPassed ? (
                                <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 21H16M12 17V21M7 4H17M5 4H7V13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13V4H19C20.1046 4 21 4.89543 21 6C21 8.20914 19.2091 10 17 10H16.8913C16.4258 12.836 14.4363 15.197 12 15.8284C9.56371 15.197 7.57423 12.836 7.10874 10H7C4.79086 10 3 8.20914 3 6C3 4.89543 3.89543 4 5 4Z" fill="rgba(10,186,181,0.1)" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            ) : (
                                <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="rgba(255,77,77,0.1)" stroke="#ff4d4d" strokeWidth="2"/>
                                    <path d="M15 9L9 15M9 9L15 15" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            )}
                        </div>
                        <h2 style={{ fontSize: '28px', color: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', marginBottom: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                            {testResultModal.isTimeout ? 'ВРЕМЯ ВЫШЛО!' : (testResultModal.isPassed ? 'ТЕСТ СДАН!' : 'ТЕСТ НЕ СДАН')}
                        </h2>
                        <p style={{ color: '#ccc', fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>{testResultModal.title}</p>
                        <div style={{ fontSize: '60px', fontWeight: '900', color: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', marginBottom: '20px' }}>{testResultModal.score}%</div>
                        
                        {testResultModal.isTimeout ? (
                            <div style={{background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', padding: '20px', borderRadius: '15px', fontWeight: 'bold', marginBottom: '30px'}}>
                                Вы не уложились в отведенное время. Тест автоматически завершен и считается проваленным.
                            </div>
                        ) : testResultModal.score === 100 ? (
                            <div style={{background: 'rgba(10,186,181,0.1)', color: '#0abab5', padding: '20px', borderRadius: '15px', fontWeight: 'bold', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px'}}><CustomIcon name="success" size={24} color="#0abab5" /> Вы ответили правильно на все вопросы! Идеальный результат.</div>
                        ) : testResultModal.mistakes && testResultModal.mistakes.length > 0 ? (
                            <div style={{textAlign: 'left', marginBottom: '30px'}}>
                                <h4 style={{color: '#fff', fontSize: '18px', fontWeight: '900', marginBottom: '15px'}}>Разбор ошибок:</h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    {testResultModal.mistakes.map((m, idx) => (
                                        <div key={idx} style={{background: '#0d0f0d', padding: '20px', borderRadius: '15px', border: '1px solid #333'}}>
                                            <p style={{color: '#fff', fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0'}}>{m.q}</p>
                                            <p style={{color: '#ff4d4d', fontSize: '13px', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '6px'}}><CustomIcon name="x" size={14} color="#ff4d4d" /> Ваш ответ: {m.userAns}</p>
                                            <p style={{color: '#0abab5', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px'}}><CustomIcon name="check" size={14} color="#0abab5" /> Верный ответ: {m.correctAns}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        <button onClick={() => { setTestResultModal({show: false, score: 0, isPassed: false, title: '', mistakes: []}); closeTestModal(); }} style={{...errorBtnStyle, background: testResultModal.isPassed ? '#0abab5' : '#ff4d4d', color: testResultModal.isPassed ? '#000' : '#fff', marginTop: 0} as any}>
                            {testResultModal.isPassed ? 'ОТЛИЧНО' : 'ПОНЯТНО'}
                        </button>
                    </div>
                </div>
            )}

            {/* ФУЛСКРИН LIGHTBOX ДЛЯ ПРОСМОТРА ФОТО */}
            {zoomedImg && (
                <div style={lightboxOverlay as any} onClick={() => setZoomedImg(null)}>
                    <div onClick={() => setZoomedImg(null)} style={{position: 'absolute', top: '20px', right: '30px', cursor: 'pointer', fontSize: '40px', color: '#ff4d4d', fontWeight: 'bold', zIndex: 90001, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>X</div>
                    <img src={zoomedImg} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '15px'}} alt="Zoomed" />
                </div>
            )}

            <style jsx global>{`
                .anti-cheat { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
                .test-answer-btn { padding: 20px 30px; background: #111; color: #fff; border-radius: 18px; cursor: pointer; border: 1px solid #222; font-weight: 800; margin-bottom: 12px; transition: all 0.2s ease; }
                .test-answer-btn:hover { border-color: rgba(10, 186, 181, 0.45); background: rgba(10, 186, 181, 0.14); color: #fff; transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2); }
                .test-answer-btn.selected { background: #0abab5 !important; color: #000 !important; border-color: #0abab5 !important; transform: scale(0.98); }
                
                .premium-cards-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; width: 100%; align-items: stretch; }
                .premium-card { background: #111; border-radius: 14px; border: 1px solid #222; transition: all 0.2s ease; position: relative; cursor: pointer; display: flex; flex-direction: column; width: 100%; min-height: 148px; padding: 16px; box-sizing: border-box; overflow: hidden; word-break: normal; overflow-wrap: break-word; }
                .premium-card:hover { border-color: rgba(10, 186, 181, 0.45); transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.18); }
                .premium-card:active { background: rgba(10, 186, 181, 0.14); border-color: rgba(10,186,181,0.45); transform: translateY(2px) scale(0.97); }
                .premium-card h4 { min-height: 44px; }
                .deadline-card:hover { border-color: #ff4d4d !important; box-shadow: 0 8px 25px rgba(255, 77, 77, 0.15) !important; }
                .deadline-card:active { background: rgba(255, 77, 77, 0.05) !important; border-color: #ff4d4d !important; }

                .education-create-wrap { position: relative; z-index: 30; }
                .education-create-trigger { display: inline-flex; align-items: center; gap: 8px; }
                .education-create-trigger > span { font-size: 15px; line-height: 1; }
                .education-create-menu {
                    position: absolute;
                    top: calc(100% + 9px);
                    right: 0;
                    width: 264px;
                    padding: 7px;
                    background: #121716;
                    border: 1px solid #2b3734;
                    border-radius: 17px;
                    box-shadow: 0 22px 50px rgba(0, 0, 0, 0.42);
                }
                .education-create-menu > button {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 38px minmax(0, 1fr);
                    align-items: center;
                    gap: 11px;
                    padding: 10px;
                    color: #fff;
                    background: transparent;
                    border: 0;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: left;
                }
                .education-create-menu > button:hover { background: rgba(10, 186, 181, 0.1); }
                .education-create-menu > button > span:last-child { min-width: 0; }
                .education-create-menu strong { display: block; font-size: 12px; font-weight: 900; }
                .education-create-menu small { display: block; margin-top: 3px; color: #72827f; font-size: 10px; font-weight: 650; }
                .education-create-icon {
                    width: 36px;
                    height: 36px;
                    display: grid;
                    place-items: center;
                    color: #8da09c;
                    background: #202725;
                    border: 1px solid #303b38;
                    border-radius: 11px;
                    font-size: 18px;
                    font-weight: 950;
                }
                .education-create-icon.is-ai { color: #001817; background: #20dfd3; border-color: #20dfd3; font-size: 10px; }
                .ai-review-banner {
                    padding: 15px;
                    margin: -8px 0 22px;
                    color: #9db0ac;
                    background: linear-gradient(135deg, rgba(10, 186, 181, 0.12), rgba(10, 186, 181, 0.035));
                    border: 1px solid rgba(32, 223, 211, 0.25);
                    border-radius: 15px;
                }
                .ai-review-banner-head { display: flex; align-items: center; gap: 9px; }
                .ai-review-banner-head span { padding: 5px 7px; color: #001817; background: #20dfd3; border-radius: 6px; font-size: 9px; font-weight: 950; letter-spacing: 0.8px; }
                .ai-review-banner-head strong { color: #eafffc; font-size: 12px; }
                .ai-review-banner p { margin: 10px 0 0; font-size: 11px; line-height: 1.55; }
                .ai-review-banner > small { display: block; margin-top: 8px; color: #e0aa55; font-size: 10px; line-height: 1.45; }

                html[data-theme="light"] .education-create-menu { background: #fff; border-color: #cfdcd9; box-shadow: 0 22px 50px rgba(31, 59, 53, 0.18); }
                html[data-theme="light"] .education-create-menu > button { color: #172421; }
                html[data-theme="light"] .education-create-menu > button:hover { background: #eaf8f5; }
                html[data-theme="light"] .education-create-icon { color: #4b625d; background: #edf3f1; border-color: #d5e0dd; }
                html[data-theme="light"] .ai-review-banner { color: #506b65; background: linear-gradient(135deg, #e4f7f3, #f7fbfa); border-color: #acdcd5; }
                html[data-theme="light"] .ai-review-banner-head strong { color: #19332e; }

                /* СТИЛИ КНОПОК ДЕЙСТВИЙ (АДМИН) */
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

                .edit-btn { color: #0abab5; }
                .edit-btn:hover { background: rgba(10,186,181,0.14); border-color: rgba(10,186,181,0.45); color: #fff; transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2); }

                .del-btn { color: #ff4d4d; }
                .del-btn:hover { background: rgba(10,186,181,0.14); border-color: rgba(10,186,181,0.45); color: #fff; transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.2); }

                .video-player-card {
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
                }
                .video-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; background: #050505; border-radius: 18px; overflow: hidden; max-width: 100%; border: 1px solid rgba(255,255,255,0.04); }
                .video-embed-shell { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: hidden; }
                .video-embed-shell :global(.embedded-player-frame),
                .video-embed-shell :global(iframe),
                .video-embed-shell :global(object),
                .video-embed-shell :global(embed),
                .video-embed-shell :global(video) {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    border: none;
                    display: block;
                }
                .video-embed-shell :global(*) {
                    max-width: 100%;
                }

                /* СТИЛИ ДЛЯ КАРТИНОК И ЗУМА */
                .image-zoom-container { position: relative; width: 100%; height: 220px; border-radius: 15px; overflow: hidden; cursor: pointer; margin-bottom: 15px; background: #111; }
                .image-zoom-container img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
                .image-zoom-container:hover img { transform: scale(1.05); }
                .zoom-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
                .image-zoom-container:hover .zoom-overlay { opacity: 1; }
                .zoom-icon { color: #fff; background: rgba(10,186,181,0.9); width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transform: translateY(10px); transition: 0.3s ease; }
                .image-zoom-container:hover .zoom-icon { transform: translateY(0); }
                .tasks-theory-block { word-break: break-word; overflow-wrap: anywhere; }

                @media (max-width: 768px) {
                    /* Решение проблемы: 1 колонка на мобильных, чтобы карточки не ломали свою ширину */
                    .premium-cards-container { 
                        display: grid !important; 
                        grid-template-columns: 1fr !important; 
                        gap: 12px !important; 
                    }
                    .premium-card { 
                        width: 100% !important; 
                        max-width: none !important; 
                        padding: 16px !important; 
                        min-height: 136px !important; 
                    }
                    .premium-card h4 { font-size: 15px !important; min-height: 42px !important; }
                    .tasks-title { font-size: 24px !important; }
                    .tasks-theory-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-quiz-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-modal { padding: 30px 20px !important; border-radius: 25px !important; width: 95% !important; max-height: 90vh !important; }
                    .tasks-theory-block { padding: 20px !important; border-radius: 20px !important; }
                    .tasks-modal-header { flex-direction: column; align-items: flex-start !important; gap: 15px; margin-bottom: 25px !important; }
                    .tasks-modal-header h2 { font-size: 20px !important; padding: 0 !important; text-align: left !important; }
                    .desktop-spacer { display: none !important; }
                    .video-player-card {
                        padding: 12px !important;
                        border-radius: 20px !important;
                        margin-bottom: 24px !important;
                    }
                    .video-wrapper {
                        border-radius: 14px !important;
                        margin-left: -2px !important;
                        margin-right: -2px !important;
                        width: calc(100% + 4px) !important;
                        max-width: calc(100% + 4px) !important;
                    }
                    .video-player-description {
                        margin-top: 14px !important;
                        padding: 0 4px !important;
                        font-size: 14px !important;
                        line-height: 1.5 !important;
                    }
                    .education-create-menu { right: auto; left: 0; width: min(264px, calc(100vw - 40px)); }
                }
            `}</style>
        </section>
    );
}

const pBarBg: React.CSSProperties = { height: '8px', background: '#222', borderRadius: '4px', marginTop: '15px', marginBottom: '10px' };
const pBarFill = (w: number): React.CSSProperties => ({ width: `${w}%`, height: '100%', background: '#0abab5', borderRadius: '4px', transition: '1s' });
const sectionTitle: React.CSSProperties = { fontSize: '28px', fontWeight: '900', marginBottom: '35px' };
const flexSpace: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };
const adminActionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const cardFooter: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '800', color: '#666' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px', boxSizing: 'border-box' };
const modalContentLarge: React.CSSProperties = { background: '#000', padding: '60px', borderRadius: '50px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentSmall: React.CSSProperties = { background: '#111', padding: '40px 30px', borderRadius: '30px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const modalContentMedium: React.CSSProperties = { background: '#111', padding: '40px 30px', borderRadius: '35px', width: '100%', maxWidth: '550px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const checkKnowledgeBtn: React.CSSProperties = { width: '100%', padding: '25px', background: 'transparent', border: '2px solid #0abab5', color: '#0abab5', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', transition: '0.3s' };
const theoryBlock: React.CSSProperties = { background: '#0d0d0d', padding: '30px', borderRadius: '25px', border: '1px solid #222' };
const theoryLabel: React.CSSProperties = { fontSize: '15px', fontWeight: '800', color: '#0abab5', letterSpacing: '0.5px', marginBottom: '12px' };
const theoryText: React.CSSProperties = { fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' };
const lightboxOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' };
const boxesFlexWrapStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' };
const adminIn: React.CSSProperties = { width: '100%', padding: '16px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '15px', fontSize: '15px', letterSpacing: '1px' };
const cancelLink: React.CSSProperties = { textAlign: 'center', marginTop: '20px', color: '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const errorOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 40000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' };
const errorModalContent: React.CSSProperties = { background: '#111', padding: '50px', borderRadius: '40px', border: '2px solid #222', textAlign: 'center', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' };
const errorBtnStyle: React.CSSProperties = { border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', letterSpacing: '1px', marginTop: '15px', width: '100%' };
const quizBox: React.CSSProperties = { borderTop: '1px solid #222', paddingTop: '40px', marginTop: '10px' };
const backLink: React.CSSProperties = { color: '#0abab5', fontWeight: '900', marginBottom: '30px', cursor: 'pointer', display: 'inline-block', fontSize: '15px' };
