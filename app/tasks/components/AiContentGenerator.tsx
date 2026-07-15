"use client";

import React, { useRef, useState } from 'react';

export type AiDraftKind = 'topic' | 'test';

export type AiTopicDraft = {
    kind: 'topic';
    title: string;
    time: string;
    section: string;
    blocks: Array<{
        heading: string;
        text: string;
    }>;
};

export type AiTestDraft = {
    kind: 'test';
    title: string;
    subtitle: string;
    theory: string;
    section: string;
    questions: Array<{
        question: string;
        options: string[];
        correctIndex: number;
    }>;
};

export type AiGeneratedDraftResult = {
    draft: AiTopicDraft | AiTestDraft;
    warnings: string[];
    sourceFiles: string[];
};

type AiContentGeneratorProps = {
    initialKind: AiDraftKind;
    sections: string[];
    onClose: () => void;
    onGenerated: (result: AiGeneratedDraftResult) => void;
};

const MAX_FILES = 8;
const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
        return `${Math.max(1, Math.round(size / 1024))} КБ`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function AiContentGenerator({
    initialKind,
    sections,
    onClose,
    onGenerated,
}: AiContentGeneratorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [kind, setKind] = useState<AiDraftKind>(initialKind);
    const [files, setFiles] = useState<File[]>([]);
    const [section, setSection] = useState('');
    const [detailLevel, setDetailLevel] = useState('средний');
    const [difficulty, setDifficulty] = useState('средняя');
    const [questionCount, setQuestionCount] = useState(5);
    const [instructions, setInstructions] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const addFiles = (newFiles: File[]) => {
        setError('');
        const existingKeys = new Set(files.map(getFileKey));
        const uniqueFiles = newFiles.filter((file) => !existingKeys.has(getFileKey(file)));
        const nextFiles = [...files, ...uniqueFiles];

        if (nextFiles.length > MAX_FILES) {
            setError(`Можно добавить не более ${MAX_FILES} файлов.`);
            return;
        }

        const oversizedFile = nextFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
        if (oversizedFile) {
            setError(`Файл «${oversizedFile.name}» больше 10 МБ.`);
            return;
        }

        const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > MAX_TOTAL_SIZE_BYTES) {
            setError('Общий размер файлов не должен превышать 25 МБ.');
            return;
        }

        setFiles(nextFiles);
    };

    const removeFile = (fileToRemove: File) => {
        setFiles((currentFiles) => currentFiles.filter((file) => getFileKey(file) !== getFileKey(fileToRemove)));
        setError('');
    };

    const moveToSettings = () => {
        if (files.length === 0) {
            setError('Добавьте хотя бы один документ.');
            return;
        }

        setError('');
        setStep(2);
    };

    const generateDraft = async () => {
        if (files.length === 0 || isLoading) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            formData.append('kind', kind);
            formData.append('section', section);
            formData.append('detailLevel', detailLevel);
            formData.append('difficulty', difficulty);
            formData.append('questionCount', String(questionCount));
            formData.append('instructions', instructions);

            const response = await fetch('/api/ai-content-draft', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json().catch(() => null) as (AiGeneratedDraftResult & { error?: string }) | null;

            if (!response.ok || !result?.draft) {
                throw new Error(result?.error || 'Не удалось создать черновик.');
            }

            onGenerated({
                draft: result.draft,
                warnings: Array.isArray(result.warnings) ? result.warnings : [],
                sourceFiles: Array.isArray(result.sourceFiles) ? result.sourceFiles : files.map((file) => file.name),
            });
        } catch (generationError) {
            setError(generationError instanceof Error ? generationError.message : 'Не удалось создать черновик.');
        } finally {
            setIsLoading(false);
        }
    };

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return (
        <div className="ai-generator-overlay" role="presentation">
            <div className="ai-generator-shell" role="dialog" aria-modal="true" aria-labelledby="ai-generator-title">
                <div className="ai-generator-rail">
                    <div className="ai-generator-mark">AI</div>
                    <div>
                        <div className="ai-generator-kicker">ALICE AI</div>
                        <h2 id="ai-generator-title">Черновик материала</h2>
                    </div>
                    <div className="ai-generator-steps" aria-label="Этапы создания">
                        <div className={step === 1 ? 'is-active' : 'is-complete'}>
                            <span>01</span>
                            <strong>Документы</strong>
                        </div>
                        <div className={step === 2 ? 'is-active' : ''}>
                            <span>02</span>
                            <strong>Настройка</strong>
                        </div>
                        <div>
                            <span>03</span>
                            <strong>Проверка в редакторе</strong>
                        </div>
                    </div>
                    <p className="ai-generator-note">
                        Alice AI подготовит текст. Материал появится на сайте только после вашей проверки и сохранения.
                    </p>
                </div>

                <div className="ai-generator-main">
                    <div className="ai-generator-head">
                        <div>
                            <span>Шаг {step} из 2</span>
                            <h3>{step === 1 ? 'Добавьте источники' : 'Настройте результат'}</h3>
                        </div>
                        <button type="button" onClick={onClose} disabled={isLoading} aria-label="Закрыть">×</button>
                    </div>

                    {step === 1 ? (
                        <div className="ai-generator-content">
                            <div className="ai-kind-switch" aria-label="Тип материала">
                                <button type="button" className={kind === 'topic' ? 'is-selected' : ''} onClick={() => setKind('topic')}>
                                    <span>ТЕМА</span>
                                    Учебный материал
                                </button>
                                <button type="button" className={kind === 'test' ? 'is-selected' : ''} onClick={() => setKind('test')}>
                                    <span>ТЕСТ</span>
                                    Вопросы и ответы
                                </button>
                            </div>

                            <button
                                type="button"
                                className={`ai-drop-zone${isDragging ? ' is-dragging' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                                onDragOver={(event) => event.preventDefault()}
                                onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);
                                    addFiles(Array.from(event.dataTransfer.files));
                                }}
                            >
                                <span className="ai-drop-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M5 13V19H19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <strong>Перетащите документы сюда</strong>
                                <span>или нажмите, чтобы выбрать файлы</span>
                                <small>PDF, Word, Excel, PowerPoint, ODT, RTF, TXT, CSV, JSON и другие текстовые форматы</small>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                hidden
                                onChange={(event) => {
                                    addFiles(Array.from(event.target.files || []));
                                    event.target.value = '';
                                }}
                            />

                            {files.length > 0 && (
                                <div className="ai-file-stack">
                                    <div className="ai-file-summary">
                                        <strong>Файлы: {files.length}</strong>
                                        <span>{formatFileSize(totalSize)} из 25 МБ</span>
                                    </div>
                                    {files.map((file) => (
                                        <div className="ai-file-row" key={getFileKey(file)}>
                                            <span className="ai-file-type">{file.name.split('.').pop()?.slice(0, 4).toUpperCase() || 'FILE'}</span>
                                            <span className="ai-file-name">{file.name}<small>{formatFileSize(file.size)}</small></span>
                                            <button type="button" onClick={() => removeFile(file)} aria-label={`Удалить ${file.name}`}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="ai-generator-content">
                            <div className="ai-source-summary">
                                <span>ИСТОЧНИКИ</span>
                                <strong>{files.length} файл(а), {formatFileSize(totalSize)}</strong>
                                <button type="button" onClick={() => setStep(1)}>Изменить</button>
                            </div>

                            <div className="ai-settings-grid">
                                <label>
                                    <span>Раздел</span>
                                    <input list="ai-content-sections" value={section} onChange={(event) => setSection(event.target.value)} placeholder="Основной раздел" />
                                    <datalist id="ai-content-sections">
                                        {sections.map((sectionName) => <option key={sectionName} value={sectionName} />)}
                                    </datalist>
                                </label>
                                <label>
                                    <span>Детализация</span>
                                    <select value={detailLevel} onChange={(event) => setDetailLevel(event.target.value)}>
                                        <option value="краткий">Кратко</option>
                                        <option value="средний">Средне</option>
                                        <option value="подробный">Подробно</option>
                                    </select>
                                </label>
                                {kind === 'test' && (
                                    <>
                                        <label>
                                            <span>Количество вопросов</span>
                                            <input type="number" min="1" max="20" value={questionCount} onChange={(event) => setQuestionCount(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} />
                                        </label>
                                        <label>
                                            <span>Сложность</span>
                                            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                                                <option value="простая">Простая</option>
                                                <option value="средняя">Средняя</option>
                                                <option value="сложная">Сложная</option>
                                            </select>
                                        </label>
                                    </>
                                )}
                            </div>

                            <label className="ai-instructions">
                                <span>Дополнительные пожелания <small>необязательно</small></span>
                                <textarea
                                    value={instructions}
                                    onChange={(event) => setInstructions(event.target.value.slice(0, 1500))}
                                    placeholder="Например: сделай акцент на стандартах обслуживания и добавь практические примеры"
                                />
                                <small>{instructions.length}/1500</small>
                            </label>

                            <div className="ai-review-reminder">
                                <span>ВАЖНО</span>
                                <p>После генерации откроется обычный редактор. Проверьте факты и правильные ответы перед созданием.</p>
                            </div>
                        </div>
                    )}

                    {error && <div className="ai-generator-error" role="alert">{error}</div>}

                    <div className="ai-generator-footer">
                        <button type="button" className="ai-secondary-button" onClick={step === 1 ? onClose : () => setStep(1)} disabled={isLoading}>
                            {step === 1 ? 'Отмена' : 'Назад'}
                        </button>
                        <button type="button" className="ai-primary-button" onClick={step === 1 ? moveToSettings : generateDraft} disabled={isLoading}>
                            {isLoading ? <><span className="ai-spinner" />Alice AI готовит черновик</> : (step === 1 ? 'Продолжить' : `Создать черновик ${kind === 'topic' ? 'темы' : 'теста'}`)}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .ai-generator-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 50000;
                    display: grid;
                    place-items: center;
                    padding: 24px;
                    background: rgba(2, 7, 7, 0.82);
                    backdrop-filter: blur(14px);
                }
                .ai-generator-shell {
                    width: min(920px, 100%);
                    max-height: min(760px, calc(100vh - 48px));
                    display: grid;
                    grid-template-columns: 250px minmax(0, 1fr);
                    overflow: hidden;
                    color: #f5fbfa;
                    background: #101413;
                    border: 1px solid rgba(120, 255, 236, 0.18);
                    border-radius: 30px;
                    box-shadow: 0 35px 90px rgba(0, 0, 0, 0.55);
                }
                .ai-generator-rail {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    padding: 34px 28px;
                    overflow: hidden;
                    background:
                        radial-gradient(circle at 20% 0%, rgba(10, 186, 181, 0.28), transparent 38%),
                        linear-gradient(155deg, #102c29 0%, #07100f 72%);
                    border-right: 1px solid rgba(120, 255, 236, 0.12);
                }
                .ai-generator-rail::after {
                    content: '';
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    right: -100px;
                    bottom: 70px;
                    border: 1px solid rgba(120, 255, 236, 0.13);
                    border-radius: 50%;
                    box-shadow: 0 0 0 28px rgba(120, 255, 236, 0.025), 0 0 0 56px rgba(120, 255, 236, 0.02);
                    pointer-events: none;
                }
                .ai-generator-mark {
                    width: 44px;
                    height: 44px;
                    display: grid;
                    place-items: center;
                    margin-bottom: 26px;
                    color: #001817;
                    background: #20dfd3;
                    border-radius: 14px 14px 14px 4px;
                    font-weight: 950;
                    letter-spacing: -1px;
                }
                .ai-generator-kicker {
                    margin-bottom: 8px;
                    color: #55e9df;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 2px;
                }
                .ai-generator-rail h2 {
                    max-width: 170px;
                    margin: 0;
                    color: #fff;
                    font-size: 25px;
                    line-height: 1.08;
                    letter-spacing: -0.7px;
                }
                .ai-generator-steps {
                    display: grid;
                    gap: 22px;
                    margin-top: 48px;
                }
                .ai-generator-steps > div {
                    display: grid;
                    grid-template-columns: 31px 1fr;
                    align-items: center;
                    gap: 10px;
                    color: #6f8581;
                }
                .ai-generator-steps span {
                    width: 31px;
                    height: 31px;
                    display: grid;
                    place-items: center;
                    border: 1px solid #28403d;
                    border-radius: 50%;
                    font-size: 10px;
                    font-weight: 900;
                }
                .ai-generator-steps strong { font-size: 12px; line-height: 1.3; }
                .ai-generator-steps .is-active { color: #f2fffd; }
                .ai-generator-steps .is-active span { color: #001817; background: #20dfd3; border-color: #20dfd3; }
                .ai-generator-steps .is-complete { color: #55e9df; }
                .ai-generator-note {
                    position: relative;
                    z-index: 1;
                    margin: auto 0 0;
                    color: #88a19d;
                    font-size: 11px;
                    line-height: 1.55;
                }
                .ai-generator-main {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    max-height: min(760px, calc(100vh - 48px));
                    background: linear-gradient(180deg, #121716 0%, #0d1110 100%);
                }
                .ai-generator-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    padding: 28px 34px 20px;
                }
                .ai-generator-head span { color: #6f8581; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
                .ai-generator-head h3 { margin: 5px 0 0; color: #f5fbfa; font-size: 22px; letter-spacing: -0.4px; }
                .ai-generator-head > button,
                .ai-file-row > button {
                    border: 0;
                    color: #77908c;
                    background: transparent;
                    cursor: pointer;
                }
                .ai-generator-head > button { width: 36px; height: 36px; border-radius: 10px; font-size: 28px; line-height: 1; }
                .ai-generator-head > button:hover { color: #fff; background: #202725; }
                .ai-generator-content {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 8px 34px 22px;
                }
                .ai-kind-switch {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 18px;
                }
                .ai-kind-switch button {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 15px;
                    color: #8fa29f;
                    background: #161c1a;
                    border: 1px solid #27312f;
                    border-radius: 14px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 700;
                    text-align: left;
                }
                .ai-kind-switch button span {
                    padding: 6px 8px;
                    color: #76a7a1;
                    background: #202826;
                    border-radius: 7px;
                    font-size: 10px;
                    font-weight: 950;
                    letter-spacing: 0.6px;
                }
                .ai-kind-switch button.is-selected { color: #eafffc; background: rgba(10, 186, 181, 0.1); border-color: rgba(32, 223, 211, 0.52); }
                .ai-kind-switch button.is-selected span { color: #001817; background: #20dfd3; }
                .ai-drop-zone {
                    width: 100%;
                    min-height: 210px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    color: #8fa29f;
                    background:
                        linear-gradient(90deg, rgba(32, 223, 211, 0.035) 1px, transparent 1px),
                        linear-gradient(rgba(32, 223, 211, 0.035) 1px, transparent 1px),
                        #101513;
                    background-size: 22px 22px;
                    border: 1px dashed #3d5c57;
                    border-radius: 20px;
                    cursor: pointer;
                    text-align: center;
                    transition: 160ms ease;
                }
                .ai-drop-zone:hover,
                .ai-drop-zone.is-dragging { border-color: #20dfd3; background-color: rgba(10, 186, 181, 0.08); transform: translateY(-1px); }
                .ai-drop-icon { width: 52px; height: 52px; display: grid; place-items: center; margin-bottom: 14px; color: #20dfd3; background: rgba(32, 223, 211, 0.09); border: 1px solid rgba(32, 223, 211, 0.2); border-radius: 17px; }
                .ai-drop-zone strong { color: #f2fffd; font-size: 16px; }
                .ai-drop-zone > span:not(.ai-drop-icon) { margin-top: 5px; font-size: 12px; }
                .ai-drop-zone small { max-width: 430px; margin-top: 15px; color: #657672; font-size: 10px; line-height: 1.45; }
                .ai-file-stack { margin-top: 16px; }
                .ai-file-summary { display: flex; justify-content: space-between; margin-bottom: 8px; color: #8fa29f; font-size: 11px; }
                .ai-file-summary strong { color: #dff7f4; }
                .ai-file-row {
                    display: grid;
                    grid-template-columns: 45px minmax(0, 1fr) 32px;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    margin-top: 7px;
                    background: #151b19;
                    border: 1px solid #252f2d;
                    border-radius: 13px;
                }
                .ai-file-type { padding: 7px 5px; color: #20dfd3; background: rgba(32, 223, 211, 0.08); border-radius: 7px; font-size: 9px; font-weight: 950; text-align: center; }
                .ai-file-name { min-width: 0; overflow: hidden; color: #e9f5f3; font-size: 12px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
                .ai-file-name small { display: block; margin-top: 3px; color: #6f8581; font-size: 10px; font-weight: 600; }
                .ai-file-row > button { font-size: 20px; }
                .ai-source-summary {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 15px;
                    margin-bottom: 22px;
                    background: rgba(32, 223, 211, 0.07);
                    border: 1px solid rgba(32, 223, 211, 0.18);
                    border-radius: 14px;
                }
                .ai-source-summary > span { color: #20dfd3; font-size: 9px; font-weight: 950; letter-spacing: 1px; }
                .ai-source-summary strong { color: #dff7f4; font-size: 12px; }
                .ai-source-summary button { border: 0; color: #20dfd3; background: transparent; cursor: pointer; font-size: 11px; font-weight: 850; }
                .ai-settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .ai-settings-grid label,
                .ai-instructions { display: grid; gap: 8px; color: #cfe0dd; font-size: 11px; font-weight: 800; }
                .ai-settings-grid input,
                .ai-settings-grid select,
                .ai-instructions textarea {
                    width: 100%;
                    box-sizing: border-box;
                    color: #f4fbfa;
                    background: #0b0f0e;
                    border: 1px solid #2a3633;
                    border-radius: 12px;
                    outline: none;
                    font: inherit;
                    font-size: 13px;
                }
                .ai-settings-grid input,
                .ai-settings-grid select { height: 46px; padding: 0 13px; }
                .ai-settings-grid input:focus,
                .ai-settings-grid select:focus,
                .ai-instructions textarea:focus { border-color: #20dfd3; box-shadow: 0 0 0 3px rgba(32, 223, 211, 0.08); }
                .ai-instructions { position: relative; margin-top: 18px; }
                .ai-instructions > span { display: flex; justify-content: space-between; }
                .ai-instructions > span small { color: #677a76; font-weight: 650; }
                .ai-instructions textarea { min-height: 105px; padding: 13px; resize: vertical; line-height: 1.5; }
                .ai-instructions > small { position: absolute; right: 10px; bottom: 8px; color: #596a67; font-size: 9px; }
                .ai-review-reminder { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 12px; padding: 14px; margin-top: 18px; background: rgba(223, 171, 59, 0.07); border: 1px solid rgba(223, 171, 59, 0.18); border-radius: 13px; }
                .ai-review-reminder span { padding: 4px 7px; color: #dfab3b; background: rgba(223, 171, 59, 0.12); border-radius: 5px; font-size: 8px; font-weight: 950; letter-spacing: 0.8px; }
                .ai-review-reminder p { margin: 0; color: #ad9e7b; font-size: 11px; line-height: 1.5; }
                .ai-generator-error { margin: 0 34px 14px; padding: 11px 13px; color: #ff8d8d; background: rgba(255, 77, 77, 0.08); border: 1px solid rgba(255, 77, 77, 0.22); border-radius: 11px; font-size: 12px; }
                .ai-generator-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 18px 34px 26px; border-top: 1px solid #202725; }
                .ai-generator-footer button { min-height: 45px; padding: 0 20px; border-radius: 12px; cursor: pointer; font-weight: 900; }
                .ai-generator-footer button:disabled { cursor: wait; opacity: 0.7; }
                .ai-secondary-button { color: #9badaa; background: transparent; border: 1px solid #2d3936; }
                .ai-primary-button { min-width: 205px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; color: #001817; background: #20dfd3; border: 1px solid #20dfd3; }
                .ai-primary-button:hover:not(:disabled) { background: #5bf3e9; border-color: #5bf3e9; }
                .ai-spinner { width: 15px; height: 15px; border: 2px solid rgba(0, 24, 23, 0.24); border-top-color: #001817; border-radius: 50%; animation: ai-spin 0.8s linear infinite; }
                @keyframes ai-spin { to { transform: rotate(360deg); } }

                html[data-theme="light"] .ai-generator-overlay { background: rgba(230, 239, 237, 0.78); }
                html[data-theme="light"] .ai-generator-shell { color: #17211f; background: #f7faf9; border-color: #c8d8d4; box-shadow: 0 35px 90px rgba(31, 59, 53, 0.23); }
                html[data-theme="light"] .ai-generator-rail { background: radial-gradient(circle at 20% 0%, rgba(10, 186, 181, 0.22), transparent 40%), linear-gradient(155deg, #e4f4f1 0%, #d9e8e4 72%); border-right-color: #c3d5d1; }
                html[data-theme="light"] .ai-generator-rail h2,
                html[data-theme="light"] .ai-generator-head h3 { color: #14211f; }
                html[data-theme="light"] .ai-generator-steps > div { color: #778985; }
                html[data-theme="light"] .ai-generator-steps .is-active { color: #17312d; }
                html[data-theme="light"] .ai-generator-note { color: #627570; }
                html[data-theme="light"] .ai-generator-main { background: linear-gradient(180deg, #ffffff 0%, #f4f8f7 100%); }
                html[data-theme="light"] .ai-generator-head > button:hover { color: #15211f; background: #e8efed; }
                html[data-theme="light"] .ai-kind-switch button { color: #657672; background: #f2f6f5; border-color: #d8e1df; }
                html[data-theme="light"] .ai-kind-switch button span { color: #44706a; background: #e3ecea; }
                html[data-theme="light"] .ai-kind-switch button.is-selected { color: #12302c; background: rgba(10, 186, 181, 0.09); border-color: #2dbab2; }
                html[data-theme="light"] .ai-drop-zone { color: #687a76; background-color: #f5f9f8; border-color: #9eb9b3; }
                html[data-theme="light"] .ai-drop-zone strong,
                html[data-theme="light"] .ai-file-summary strong,
                html[data-theme="light"] .ai-file-name,
                html[data-theme="light"] .ai-source-summary strong,
                html[data-theme="light"] .ai-settings-grid label,
                html[data-theme="light"] .ai-instructions { color: #172421; }
                html[data-theme="light"] .ai-file-row { background: #f1f6f4; border-color: #d8e3e0; }
                html[data-theme="light"] .ai-source-summary { background: #eaf8f5; border-color: #b8e1db; }
                html[data-theme="light"] .ai-settings-grid input,
                html[data-theme="light"] .ai-settings-grid select,
                html[data-theme="light"] .ai-instructions textarea { color: #172421; background: #fff; border-color: #cddbd7; }
                html[data-theme="light"] .ai-generator-footer { border-top-color: #dce6e3; }
                html[data-theme="light"] .ai-secondary-button { color: #52635f; border-color: #cbd8d5; }

                @media (max-width: 760px) {
                    .ai-generator-overlay { padding: 10px; }
                    .ai-generator-shell { max-height: calc(100vh - 20px); grid-template-columns: 1fr; border-radius: 22px; }
                    .ai-generator-rail { display: none; }
                    .ai-generator-main { max-height: calc(100vh - 20px); }
                    .ai-generator-head { padding: 22px 20px 16px; }
                    .ai-generator-content { padding: 6px 20px 18px; }
                    .ai-generator-footer { padding: 15px 20px 20px; }
                    .ai-generator-error { margin-right: 20px; margin-left: 20px; }
                    .ai-kind-switch,
                    .ai-settings-grid { grid-template-columns: 1fr; }
                    .ai-drop-zone { min-height: 185px; }
                }
                @media (max-width: 460px) {
                    .ai-generator-head h3 { font-size: 19px; }
                    .ai-generator-footer { display: grid; grid-template-columns: 1fr; }
                    .ai-generator-footer button { width: 100%; }
                    .ai-primary-button { grid-row: 1; min-width: 0; }
                    .ai-source-summary { grid-template-columns: 1fr auto; }
                    .ai-source-summary > span { grid-column: 1 / -1; }
                }
            `}</style>
        </div>
    );
}
