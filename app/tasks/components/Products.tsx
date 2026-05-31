"use client";
import React, { useState, useEffect } from 'react';

const STORAGE_KEYS = {
    PRODUCTS: 'tea_hub_products_v1'
};

const saveDataToServer = (key: string, data: any) => {
    return fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

// Умный парсер CSV для импорта из Excel
const parseCSV = (str: string) => {
    const result = [];
    let row = [];
    let inQuotes = false;
    let val = '';
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        if (char === '"') {
            if (inQuotes && str[i+1] === '"') { val += '"'; i++; } 
            else { inQuotes = !inQuotes; }
        } else if ((char === ';' || char === ',') && !inQuotes) {
            row.push(val.trim()); val = '';
        } else if (char === '\n' && !inQuotes) {
            row.push(val.trim()); result.push(row); row = []; val = '';
        } else {
            if (char !== '\r') val += char;
        }
    }
    row.push(val.trim());
    result.push(row);
    return result;
};

export default function Products({ isAdmin, userId }: { isAdmin: boolean, userId: string }) {
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Состояние для активной категории
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    
    // Модалки
    const [showProductForm, setShowProductForm] = useState(false);
    const [productFormData, setProductFormData] = useState({
        id: '', name: '', category: '', price: '', stock: '', desc: '', isHit: false, isHidden: false, dateAdded: ''
    });
    const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string, name: string}>({ isOpen: false, id: '', name: '' });
    const [viewProduct, setViewProduct] = useState<any>(null);

    // Загрузка данных
    useEffect(() => {
        const loadProducts = async () => {
            const cached = localStorage.getItem('th_cache_products');
            if (cached) setProducts(JSON.parse(cached));

            try {
                const res = await fetch(`/api/storage?t=${Date.now()}&key=${STORAGE_KEYS.PRODUCTS}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setProducts(data);
                        localStorage.setItem('th_cache_products', JSON.stringify(data));
                    }
                }
            } catch (e) {
                console.error("Ошибка загрузки продуктов", e);
            }
        };
        loadProducts();
    }, []);

    const handleSaveProduct = () => {
        if (!productFormData.name.trim()) { alert("Введите название продукта!"); return; }
        
        const newProduct = {
            ...productFormData,
            id: productFormData.id || 'prod_' + Date.now(),
            dateAdded: productFormData.id && productFormData.dateAdded ? productFormData.dateAdded : new Date().toLocaleDateString('ru-RU')
        };

        let updatedProducts = [...products];
        if (productFormData.id) {
            updatedProducts = updatedProducts.map(p => p.id === productFormData.id ? newProduct : p);
        } else {
            updatedProducts.unshift(newProduct);
        }

        setProducts(updatedProducts);
        localStorage.setItem('th_cache_products', JSON.stringify(updatedProducts));
        saveDataToServer(STORAGE_KEYS.PRODUCTS, updatedProducts);
        setShowProductForm(false);
    };

    const executeDelete = () => {
        const updatedProducts = products.filter(p => p.id !== confirmDelete.id);
        setProducts(updatedProducts);
        localStorage.setItem('th_cache_products', JSON.stringify(updatedProducts));
        saveDataToServer(STORAGE_KEYS.PRODUCTS, updatedProducts);
        setConfirmDelete({ isOpen: false, id: '', name: '' });
    };

    // ТУМБЛЕРЫ ХИТОВ И СКРЫТИЯ
    const toggleHit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = products.map(p => p.id === id ? { ...p, isHit: !p.isHit } : p);
        setProducts(updated);
        localStorage.setItem('th_cache_products', JSON.stringify(updated));
        saveDataToServer(STORAGE_KEYS.PRODUCTS, updated);
    };

    const toggleHidden = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = products.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p);
        setProducts(updated);
        localStorage.setItem('th_cache_products', JSON.stringify(updated));
        saveDataToServer(STORAGE_KEYS.PRODUCTS, updated);
    };

    // СКАЧАТЬ ШАБЛОН EXCEL (CSV)
    const downloadTemplate = () => {
        const bom = "\uFEFF"; 
        const header = "Название;Категория;Цена;Остаток;Описание\n";
        const example = "Те Гуань Инь Ван;Светлые улуны;1500;500г;Премиальный улун с цветочным ароматом.\n";
        const blob = new Blob([bom + header + example], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "template_products.csv";
        link.click();
    };

    // ЗАГРУЗИТЬ ТОВАРЫ ИЗ EXCEL (CSV)
    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const rows = parseCSV(text).filter(r => r.length > 1 && r[0].trim() !== '');
            
            if (rows.length <= 1) {
                alert("Файл пуст или содержит только заголовки.");
                return;
            }

            const newProds = [];
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i];
                newProds.push({
                    id: 'prod_' + Date.now() + '_' + i,
                    name: cols[0] || 'Без названия',
                    category: cols[1] || '',
                    price: cols[2] || '',
                    stock: cols[3] || '',
                    desc: cols[4] || '',
                    isHit: false,
                    isHidden: false,
                    dateAdded: new Date().toLocaleDateString('ru-RU')
                });
            }

            const updatedProducts = [...newProds, ...products];
            setProducts(updatedProducts);
            localStorage.setItem('th_cache_products', JSON.stringify(updatedProducts));
            saveDataToServer(STORAGE_KEYS.PRODUCTS, updatedProducts);
            alert(`✅ Успешно импортировано товаров: ${newProds.length}`);
        };
        reader.readAsText(file, "UTF-8");
        e.target.value = '';
    };

    // ФИЛЬТРАЦИЯ
    const baseFiltered = products.filter(p => isAdmin || !p.isHidden);
    
    // Получаем уникальные категории из базы
    const categories = Array.from(new Set(baseFiltered.map(p => p.category).filter(Boolean)));

    // Поиск + Фильтр по категории
    const searchedProducts = baseFiltered.filter(p => 
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))) &&
        (!selectedCategory || p.category === selectedCategory)
    );

    // Хиты продаж: фильтруются и по выбранной категории!
    const hitProducts = baseFiltered.filter(p => p.isHit && (!selectedCategory || p.category === selectedCategory));

    return (
        <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
            
            {/* ШАПКА И КНОПКИ АДМИНА */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#fff' }}>Товары и Продукты</h2>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={downloadTemplate} style={{...adminActionBtn, background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid #333'} as any}>📥 ШАБЛОН</button>
                        <input type="file" accept=".csv" id="csv-upload" style={{display: 'none'}} onChange={handleImportCSV} />
                        <button onClick={() => document.getElementById('csv-upload')?.click()} style={{...adminActionBtn, background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid #333'} as any}>📤 ИМПОРТ ИЗ ФАЙЛА</button>
                        <button onClick={() => {
                            setProductFormData({ id: '', name: '', category: '', price: '', stock: '', desc: '', isHit: false, isHidden: false, dateAdded: '' });
                            setShowProductForm(true);
                        }} style={{...adminActionBtn, background: '#0abab5', color: '#000'} as any}>+ НОВЫЙ ТОВАР</button>
                    </div>
                )}
            </div>

            {/* ПОИСК */}
            <div style={{ position: 'relative', marginBottom: '25px' }}>
                <span style={{ position: 'absolute', left: '16px', top: '15px', opacity: 0.5, fontSize: '14px' }}>🔍</span>
                <input 
                    type="text" 
                    placeholder="Поиск по названию..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    style={{ ...adminIn, paddingLeft: '45px', background: '#111', border: '1px solid #222' } as any} 
                />
            </div>

            {/* ПАНЕЛЬ КАТЕГОРИЙ */}
            {categories.length > 0 && (
                <div className="custom-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '35px', paddingBottom: '10px' }}>
                    <div 
                        onClick={() => setSelectedCategory(null)}
                        style={{
                            padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap',
                            background: selectedCategory === null ? '#0abab5' : '#1a1a1a',
                            color: selectedCategory === null ? '#000' : '#888',
                            fontWeight: '900', fontSize: '13px', transition: '0.2s',
                            border: `1px solid ${selectedCategory === null ? '#0abab5' : '#333'}`
                        }}
                    >
                        Все категории
                    </div>
                    {categories.map(cat => (
                        <div 
                            key={cat as string}
                            onClick={() => setSelectedCategory(cat as string)}
                            style={{
                                padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap',
                                background: selectedCategory === cat ? '#0abab5' : '#1a1a1a',
                                color: selectedCategory === cat ? '#000' : '#888',
                                fontWeight: '900', fontSize: '13px', transition: '0.2s',
                                border: `1px solid ${selectedCategory === cat ? '#0abab5' : '#333'}`
                            }}
                        >
                            {cat as string}
                        </div>
                    ))}
                </div>
            )}

            {/* 🔥 БЛОК: ХИТЫ ПРОДАЖ */}
            {!searchQuery && hitProducts.length > 0 && (
                <div style={{ 
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(0,0,0,0) 100%)', 
                    border: '1px solid rgba(255,215,0,0.2)', 
                    borderRadius: '25px', 
                    padding: '30px', 
                    marginBottom: '40px',
                    boxShadow: '0 10px 30px rgba(255,215,0,0.03)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>🔥</div>
                        <h3 style={{ fontSize: '20px', color: '#ffd700', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Хиты продаж</h3>
                    </div>
                    
                    <div className="hits-scroll-container custom-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '10px 5px 20px 5px', margin: '-10px -5px 0 -5px', scrollSnapType: 'x mandatory' }}>
                        {hitProducts.map(product => {
                            const isSingle = hitProducts.length === 1;
                            return (
                                <div key={`hit-${product.id}`} className={`premium-card hit-card ${isSingle ? 'single-hit' : ''}`} onClick={() => setViewProduct(product)} style={{ 
                                    minWidth: isSingle ? '100%' : '280px', flex: isSingle ? '1 1 auto' : '0 0 auto', padding: '25px', scrollSnapAlign: 'start', 
                                    opacity: product.isHidden ? 0.4 : 1, filter: product.isHidden ? 'grayscale(100%)' : 'none',
                                    background: '#111', border: '1px solid rgba(255,215,0,0.4)', display: 'flex', flexDirection: isSingle ? 'row' : 'column',
                                    alignItems: isSingle ? 'center' : 'stretch', justifyContent: isSingle ? 'space-between' : 'flex-start'
                                }}>
                                    {isAdmin && (
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                            <div onClick={(e) => toggleHit(e, product.id)} className="admin-action-icon" style={{...editIconStyle, background: 'rgba(0,0,0,0.8)', color: '#ffd700', border: '1px solid #ffd700'} as any} title="Убрать из хитов">⭐</div>
                                            <div onClick={(e) => toggleHidden(e, product.id)} className="admin-action-icon" style={{...editIconStyle, background: 'rgba(0,0,0,0.8)', color: product.isHidden ? '#ff4d4d' : '#0abab5'} as any} title={product.isHidden ? "Показать сотрудникам" : "Скрыть от сотрудников"}>{product.isHidden ? '🚫' : '👁️'}</div>
                                        </div>
                                    )}
                                    
                                    <div style={{ flex: isSingle ? '1 1 auto' : 'none' }}>
                                        {product.category && <span style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', width: 'fit-content', marginBottom: '15px', display: 'inline-block' }}>{product.category}</span>}
                                        <h4 style={{ fontSize: '18px', margin: isSingle ? '0' : '0 0 20px 0', fontWeight: 'bold', color: '#fff', lineHeight: '1.3', paddingRight: isAdmin && !isSingle ? '80px' : '0' }}>{product.name}</h4>
                                    </div>
                                    
                                    <div className={isSingle ? "single-hit-stats" : ""} style={{ marginTop: isSingle ? '0' : 'auto', display: 'flex', justifyContent: isSingle ? 'flex-end' : 'space-between', alignItems: 'flex-end', gap: isSingle ? '40px' : '0', minWidth: isSingle ? '200px' : 'auto', paddingRight: isAdmin && isSingle ? '100px' : '0' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Остаток:</div>
                                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: 'bold' }}>{product.stock || '—'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Цена:</div>
                                            <div style={{ color: '#ffd700', fontWeight: '900', fontSize: '22px' }}>{product.price ? `${product.price} ₽` : '—'}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- ОСНОВНОЙ КАТАЛОГ --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '20px', color: '#fff', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
                    {selectedCategory ? `КАТАЛОГ: ${selectedCategory}` : 'ВЕСЬ КАТАЛОГ'}
                </h3>
                <div style={{ height: '1px', background: '#222', flex: 1 }}></div>
            </div>

            <div className="premium-cards-container">
                {searchedProducts.length === 0 ? (
                    <div style={{ color: '#555', fontSize: '14px', background: '#111', padding: '30px', borderRadius: '30px', border: '1px dashed #222', textAlign: 'center', gridColumn: '1 / -1' }}>
                        Товары не найдены
                    </div>
                ) : (
                    searchedProducts.map((product) => (
                        <div key={product.id} className="premium-card" onClick={() => setViewProduct(product)} style={{ padding: '25px', opacity: product.isHidden ? 0.4 : 1, filter: product.isHidden ? 'grayscale(100%)' : 'none', display: 'flex', flexDirection: 'column' }}>
                            
                            {isAdmin && (
                                <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                    <div onClick={(e) => toggleHit(e, product.id)} className="admin-action-icon" style={{...editIconStyle, color: product.isHit ? '#ffd700' : '#666'} as any} title="В хиты">{product.isHit ? '⭐' : '☆'}</div>
                                    <div onClick={(e) => toggleHidden(e, product.id)} className="admin-action-icon" style={{...editIconStyle, color: product.isHidden ? '#ff4d4d' : '#0abab5'} as any} title="Скрыть/Показать">{product.isHidden ? '🚫' : '👁️'}</div>
                                    <div onClick={(e) => { e.stopPropagation(); setProductFormData(product); setShowProductForm(true); }} className="admin-action-icon" style={editIconStyle as any} title="Редактировать">✎</div>
                                    <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, id: product.id, name: product.name}); }} className="admin-action-icon" style={delIconStyle as any} title="Удалить">✕</div>
                                </div>
                            )}
                            
                            {isAdmin && product.isHidden && (
                                <div style={{ position: 'absolute', top: '60px', right: '15px', background: '#ff4d4d', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '10px', zIndex: 5 }}>
                                    СКРЫТО
                                </div>
                            )}

                            <div style={{ paddingRight: isAdmin ? '130px' : '0', marginBottom: '20px', marginTop: (isAdmin && product.isHidden) ? '25px' : '0' }}>
                                {product.category && <span style={{ background: 'rgba(10,186,181,0.1)', color: '#0abab5', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', marginBottom: '10px' }}>{product.category}</span>}
                                <h4 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3' }}>{product.name}</h4>
                            </div>
                            
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '15px', borderTop: '1px solid #222' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Остаток:</div>
                                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{product.stock || '—'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Цена:</div>
                                    <div style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900' }}>{product.price ? `${product.price} ₽` : '—'}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- РЕДАКТОР ПРОДУКТА --- */}
            {showProductForm && (
                <div style={modalOverlay as any} onClick={() => setShowProductForm(false)}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentMedium, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'} as any} onClick={e => e.stopPropagation()}>
                        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#0abab5', fontWeight: '900', textTransform: 'uppercase' }}>
                            {productFormData.id ? 'РЕДАКТИРОВАТЬ ТОВАР' : 'НОВЫЙ ТОВАР'}
                        </h2>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px'}}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Название товара *</div>
                                <input style={adminIn as any} placeholder="Например: Те Гуань Инь Ван" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} />
                            </div>
                            
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Цена (₽)</div>
                                    <input type="text" style={adminIn as any} placeholder="0" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Остаток / Вес</div>
                                    <input style={adminIn as any} placeholder="Напр. 500г или 10 шт" value={productFormData.stock} onChange={e => setProductFormData({...productFormData, stock: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Категория</div>
                                <input list="prod-categories" style={adminIn as any} placeholder="Напр. Светлые улуны" value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value})} />
                                <datalist id="prod-categories">{categories.map((c: any) => <option key={c} value={c} />)}</datalist>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Описание</div>
                                <textarea style={{...adminIn, height: '120px', resize: 'none'} as any} placeholder="Описание, вкус, особенности..." value={productFormData.desc} onChange={e => setProductFormData({...productFormData, desc: e.target.value})} />
                            </div>
                        </div>

                        <button onClick={handleSaveProduct} style={saveBtn as any}>СОХРАНИТЬ ТОВАР</button>
                        <div onClick={() => setShowProductForm(false)} style={cancelLink as any}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {/* --- ОКНО ПРОСМОТРА ПРОДУКТА --- */}
            {viewProduct && !showProductForm && (
                <div style={modalOverlay as any} onClick={() => setViewProduct(null)}>
                    <div className="tasks-modal custom-scroll" style={{...modalContentLarge, maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative'} as any} onClick={e => e.stopPropagation()}>
                        
                        <div onClick={() => setViewProduct(null)} style={{ position: 'absolute', top: '25px', right: '25px', cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1, zIndex: 10 }}>✕</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px', paddingRight: '40px' }}>
                            <div>
                                {viewProduct.category && <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase', background: 'rgba(10,186,181,0.1)', padding: '5px 12px', borderRadius: '8px', display: 'inline-block', marginBottom: '15px'}}>{viewProduct.category}</span>}
                                <h2 style={{fontSize:'32px', color:'#fff', fontWeight:'900', margin:'0'}}>{viewProduct.name}</h2>
                                {viewProduct.isHit && <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '13px', marginTop: '10px' }}>⭐ ХИТ ПРОДАЖ</div>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '40px', marginBottom: '35px', background: '#111', padding: '20px 30px', borderRadius: '20px', border: '1px solid #222' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Цена:</div>
                                <div style={{ fontSize: '28px', color: '#0abab5', fontWeight: '900', lineHeight: 1 }}>{viewProduct.price ? `${viewProduct.price} ₽` : '—'}</div>
                            </div>
                            <div style={{ width: '1px', background: '#333' }}></div>
                            <div>
                                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Наличие (Остаток):</div>
                                <div style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold', lineHeight: 1 }}>{viewProduct.stock || 'Уточняйте'}</div>
                            </div>
                        </div>

                        {viewProduct.desc && (
                            <div>
                                <h4 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '15px' }}>Описание</h4>
                                <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{viewProduct.desc}</p>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}

            {/* --- ОКНО УДАЛЕНИЯ --- */}
            {confirmDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmDelete({isOpen: false, id: '', name: ''})}>
                    <div style={{...modalContentSmall, textAlign: 'center'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ color: '#ff4d4d', fontWeight: '900', marginBottom: '15px' }}>УДАЛИТЬ ТОВАР?</h2>
                        <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '25px' }}>Вы уверены, что хотите безвозвратно удалить "{confirmDelete.name}"?</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setConfirmDelete({isOpen: false, id: '', name: ''})} style={{ ...saveBtn, background: '#222', color: '#fff', flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button onClick={executeDelete} style={{ ...saveBtn, background: '#ff4d4d', color: '#fff', flex: 1, marginTop: 0 } as any}>УДАЛИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .premium-cards-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; width: 100%; }
                .premium-card { background: #111; border-radius: 20px; border: 1px solid #222; transition: all 0.2s ease; position: relative; cursor: pointer; box-sizing: border-box; }
                .premium-card:hover { border-color: #0abab5; transform: translateY(-3px); }
                .premium-card:active { transform: scale(0.98); }
                
                .hits-scroll-container::-webkit-scrollbar { height: 6px; }
                .hits-scroll-container::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
                
                .hit-card:hover { border-color: #ffd700 !important; box-shadow: 0 5px 20px rgba(255,215,0,0.15); transform: translateY(-3px); }

                /* 💡 СТИЛЬ ДЛЯ ИКОНОК АДМИНА С БИРЮЗОВОЙ И ЗОЛОТОЙ ОБВОДКОЙ */
                .admin-action-icon {
                    transition: all 0.2s ease;
                }
                
                /* По умолчанию обводка бирюзовая */
                .admin-action-icon:hover {
                    box-shadow: 0 0 0 1.5px #0abab5 !important;
                    border-color: #0abab5 !important;
                    transform: scale(1.1);
                    z-index: 20;
                }

                /* Для иконок внутри хитов обводка золотая */
                .hit-card .admin-action-icon:hover {
                    box-shadow: 0 0 0 1.5px #ffd700 !important;
                    border-color: #ffd700 !important;
                }

                /* 💡 СТИЛЬ ДЛЯ ОДИНОЧНОГО ХИТА (РАСТЯГИВАНИЕ) */
                .single-hit {
                    flex-direction: row !important;
                    align-items: center;
                    justify-content: space-between;
                    padding: 30px 40px !important;
                }

                @media (max-width: 768px) {
                    .premium-cards-container { display: grid !important; grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-modal { padding: 30px 20px !important; border-radius: 25px !important; width: 95% !important; max-height: 90vh !important; }
                    .hit-card { min-width: 240px !important; }
                    
                    .single-hit {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        padding: 25px !important;
                    }
                    .single-hit h4 {
                        margin-bottom: 20px !important;
                    }
                    .single-hit-stats {
                        width: 100%;
                        justify-content: space-between !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>
        </section>
    );
}

// --- СТИЛИ ---
const adminActionBtn = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const adminIn = { width: '100%', padding: '16px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', marginBottom: '0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const saveBtn = { width: '100%', padding: '18px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '25px', fontSize: '15px', letterSpacing: '1px' };
const cancelLink = { textAlign: 'center', marginTop: '20px', color: '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const editIconStyle = { background: '#1a1a1a', border: '1px solid #333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', flexShrink: 0, fontWeight: 'bold' };
const delIconStyle = { background: '#1a1a1a', color: '#ff4d4d', border: '1px solid #333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', flexShrink: 0, fontWeight: 'bold' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px', boxSizing: 'border-box' };
const modalContentLarge = { background: '#000', borderRadius: '40px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentMedium = { background: '#111', padding: '40px 30px', borderRadius: '35px', width: '100%', maxWidth: '550px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const modalContentSmall = { background: '#111', padding: '40px 30px', borderRadius: '30px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };