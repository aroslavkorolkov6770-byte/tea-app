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

// 💡 Умный парсер CSV для импорта из Excel
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
    
    // Модалки
    const [showProductForm, setShowProductForm] = useState(false);
    // 💡 ДОБАВЛЕНО dateAdded: '' чтобы не ругался TypeScript
    const [productFormData, setProductFormData] = useState({
        id: '', name: '', category: '', price: '', stock: '', desc: '', image: '', isHit: false, isHidden: false, dateAdded: ''
    });
    const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string, name: string}>({ isOpen: false, id: '', name: '' });
    const [viewProduct, setViewProduct] = useState<any>(null);
    const [zoomedImg, setZoomedImg] = useState<string | null>(null);

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

    // 💡 ТУМБЛЕРЫ ХИТОВ И СКРЫТИЯ
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Файл слишком большой! Максимум 5 МБ."); return; }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setProductFormData(prev => ({ ...prev, image: event.target!.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    // 💡 СКАЧАТЬ ШАБЛОН EXCEL (CSV)
    const downloadTemplate = () => {
        const bom = "\uFEFF"; // Для правильной кириллицы в Excel
        const header = "Название;Категория;Цена;Остаток;Описание;Ссылка_на_фото\n";
        const example = "Те Гуань Инь Ван;Светлые улуны;1500;500г;Премиальный улун с цветочным ароматом;https://example.com/img.jpgn";
        const blob = new Blob([bom + header + example], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "template_products.csv";
        link.click();
    };

    // 💡 ЗАГРУЗИТЬ ТОВАРЫ ИЗ EXCEL (CSV)
    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const rows = parseCSV(text).filter(r => r.length > 1 && r[0].trim() !== ''); // Убираем пустые строки
            
            if (rows.length <= 1) {
                alert("Файл пуст или содержит только заголовки.");
                return;
            }

            const newProds = [];
            // Пропускаем первую строку (заголовки)
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i];
                newProds.push({
                    id: 'prod_' + Date.now() + '_' + i,
                    name: cols[0] || 'Без названия',
                    category: cols[1] || '',
                    price: cols[2] || '',
                    stock: cols[3] || '',
                    desc: cols[4] || '',
                    image: cols[5] || '',
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
        e.target.value = ''; // Сбрасываем инпут
    };

    // 💡 ФИЛЬТРАЦИЯ (Обычные сотрудники не видят скрытые товары)
    const baseFiltered = products.filter(p => isAdmin || !p.isHidden);
    
    const searchedProducts = baseFiltered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Хиты продаж (только те, что помечены звездочкой и не скрыты от сотрудника)
    const hitProducts = baseFiltered.filter(p => p.isHit);

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

    return (
        <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#fff' }}>Товары и Продукты</h2>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={downloadTemplate} style={{...adminActionBtn, background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid #333'} as any}>📥 ШАБЛОН</button>
                        <input type="file" accept=".csv" id="csv-upload" style={{display: 'none'}} onChange={handleImportCSV} />
                        <button onClick={() => document.getElementById('csv-upload')?.click()} style={{...adminActionBtn, background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid #333'} as any}>📤 ИМПОРТ ИЗ ФАЙЛА</button>
                        <button onClick={() => {
                            setProductFormData({ id: '', name: '', category: '', price: '', stock: '', desc: '', image: '', isHit: false, isHidden: false, dateAdded: '' });
                            setShowProductForm(true);
                        }} style={{...adminActionBtn, background: '#0abab5', color: '#000'} as any}>+ НОВЫЙ ТОВАР</button>
                    </div>
                )}
            </div>

            <div style={{ position: 'relative', marginBottom: '30px' }}>
                <span style={{ position: 'absolute', left: '16px', top: '15px', opacity: 0.5, fontSize: '14px' }}>🔍</span>
                <input 
                    type="text" 
                    placeholder="Поиск по названию или категории..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    style={{ ...adminIn, paddingLeft: '45px', background: '#111', border: '1px solid #222' } as any} 
                />
            </div>

            {/* 💡 БЛОК: ХИТЫ ПРОДАЖ */}
            {!searchQuery && hitProducts.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '20px', color: '#0abab5', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>🔥 ХИТЫ ПРОДАЖ</h3>
                        <div style={{ height: '1px', background: '#222', flex: 1 }}></div>
                    </div>
                    <div className="hits-scroll-container custom-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '15px', scrollSnapType: 'x mandatory' }}>
                        {hitProducts.map(product => (
                            <div key={`hit-${product.id}`} className="premium-card hit-card" onClick={() => setViewProduct(product)} style={{ minWidth: '240px', flex: '0 0 auto', padding: 0, overflow: 'hidden', scrollSnapAlign: 'start', opacity: product.isHidden ? 0.4 : 1, filter: product.isHidden ? 'grayscale(100%)' : 'none' }}>
                                {isAdmin && (
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                        <div onClick={(e) => toggleHit(e, product.id)} style={{...editIconStyle, background: 'rgba(0,0,0,0.7)', color: '#ffd700'} as any} title="Убрать из хитов">⭐</div>
                                        <div onClick={(e) => toggleHidden(e, product.id)} style={{...editIconStyle, background: 'rgba(0,0,0,0.7)', color: product.isHidden ? '#ff4d4d' : '#fff'} as any} title={product.isHidden ? "Показать сотрудникам" : "Скрыть от сотрудников"}>{product.isHidden ? '🙈' : '👁️'}</div>
                                    </div>
                                )}
                                <div style={{ height: '120px', background: '#222', width: '100%', position: 'relative' }}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', opacity: 0.2 }}>📦</div>
                                    )}
                                </div>
                                <div style={{ padding: '15px' }}>
                                    <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', fontWeight: 'bold', color: '#fff', lineHeight: '1.3' }}>{product.name}</h4>
                                    <div style={{ color: '#0abab5', fontWeight: '900', fontSize: '16px' }}>{product.price ? `${product.price} ₽` : '—'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ОСНОВНОЙ КАТАЛОГ --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', color: '#fff', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>КАТАЛОГ</h3>
                <div style={{ height: '1px', background: '#222', flex: 1 }}></div>
            </div>

            <div className="premium-cards-container">
                {searchedProducts.length === 0 ? (
                    <div style={{ color: '#555', fontSize: '14px', background: '#111', padding: '30px', borderRadius: '30px', border: '1px dashed #222', textAlign: 'center', gridColumn: '1 / -1' }}>
                        Товары не найдены
                    </div>
                ) : (
                    searchedProducts.map((product) => (
                        <div key={product.id} className="premium-card" onClick={() => setViewProduct(product)} style={{ padding: 0, overflow: 'hidden', opacity: product.isHidden ? 0.4 : 1, filter: product.isHidden ? 'grayscale(100%)' : 'none' }}>
                            {isAdmin && (
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                    <div onClick={(e) => toggleHit(e, product.id)} style={{...editIconStyle, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', color: product.isHit ? '#ffd700' : '#888'} as any} title="В хиты">⭐</div>
                                    <div onClick={(e) => toggleHidden(e, product.id)} style={{...editIconStyle, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', color: product.isHidden ? '#ff4d4d' : '#fff'} as any} title="Скрыть/Показать">{product.isHidden ? '🙈' : '👁️'}</div>
                                    <div onClick={(e) => { e.stopPropagation(); setProductFormData(product); setShowProductForm(true); }} style={{...editIconStyle, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)'} as any} title="Редактировать">✎</div>
                                    <div onClick={(e) => { e.stopPropagation(); setConfirmDelete({isOpen: true, id: product.id, name: product.name}); }} style={{...delIconStyle, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)'} as any} title="Удалить">✕</div>
                                </div>
                            )}
                            
                            {/* Метка скрытого товара */}
                            {isAdmin && product.isHidden && (
                                <div style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', background: '#ff4d4d', color: '#fff', padding: '5px 15px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', zIndex: 5, whiteSpace: 'nowrap' }}>
                                    СКРЫТ ОТ СОТРУДНИКОВ
                                </div>
                            )}

                            <div style={{ height: '160px', background: '#222', width: '100%', position: 'relative' }}>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', opacity: 0.2 }}>📦</div>
                                )}
                                {product.category && (
                                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(10,186,181,0.9)', color: '#000', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                        {product.category}
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ padding: '20px' }}>
                                <h4 style={{ fontSize: '16px', margin: '0 0 15px 0', fontWeight: 'bold', wordBreak: 'break-word', color: '#fff', lineHeight: '1.3' }}>{product.name}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Остаток:</div>
                                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{product.stock || '—'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Цена:</div>
                                        <div style={{ fontSize: '18px', color: '#0abab5', fontWeight: '900' }}>{product.price ? `${product.price} ₽` : '—'}</div>
                                    </div>
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
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Фотография товара</div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input style={{...adminIn, flex: 1, marginBottom: 0} as any} placeholder="Ссылка на фото (URL)" value={productFormData.image} onChange={e => setProductFormData({...productFormData, image: e.target.value})} />
                                    <input type="file" accept="image/*" id="prod-img-upload" style={{ display: 'none' }} onChange={handleImageUpload}/>
                                    <button onClick={(e) => { e.preventDefault(); document.getElementById('prod-img-upload')?.click(); }} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '0 20px', height: '52px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.2s' }}>📁 ФАЙЛ</button>
                                </div>
                                {productFormData.image && (
                                    <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', width: 'fit-content', background: '#000', height: '80px' }}>
                                        <img src={productFormData.image} alt="preview" style={{ height: '100%', display: 'block', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '5px', marginLeft: '5px' }}>Описание</div>
                                <textarea style={{...adminIn, height: '100px', resize: 'none'} as any} placeholder="Описание, вкус, особенности..." value={productFormData.desc} onChange={e => setProductFormData({...productFormData, desc: e.target.value})} />
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
                    <div className="tasks-modal custom-scroll" style={{...modalContentLarge, maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0', overflow: 'hidden'} as any} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'relative', width: '100%', height: '350px', background: '#111' }}>
                            {viewProduct.image ? (
                                <img src={viewProduct.image} alt={viewProduct.name} onClick={() => setZoomedImg(viewProduct.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', opacity: 0.1 }}>📦</div>
                            )}
                            <div onClick={() => setViewProduct(null)} style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer', fontSize: '28px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1, background: 'rgba(0,0,0,0.5)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>✕</div>
                        </div>
                        
                        <div style={{ padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    {viewProduct.category && <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900', letterSpacing:'1px', textTransform:'uppercase', background: 'rgba(10,186,181,0.1)', padding: '5px 12px', borderRadius: '8px', display: 'inline-block', marginBottom: '10px'}}>{viewProduct.category}</span>}
                                    <h2 style={{fontSize:'32px', color:'#fff', fontWeight:'900', margin:'0'}}>{viewProduct.name}</h2>
                                    {viewProduct.isHit && <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' }}>⭐ ХИТ ПРОДАЖ</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>Цена:</div>
                                    <div style={{ fontSize: '32px', color: '#0abab5', fontWeight: '900', lineHeight: 1 }}>{viewProduct.price ? `${viewProduct.price} ₽` : '—'}</div>
                                    <div style={{ fontSize: '13px', color: '#888', marginTop: '10px' }}>Наличие: <span style={{color: '#fff', fontWeight: 'bold'}}>{viewProduct.stock || 'Уточняйте'}</span></div>
                                </div>
                            </div>

                            {viewProduct.desc && (
                                <div style={{ background: '#111', padding: '25px', borderRadius: '20px', border: '1px solid #222' }}>
                                    <h4 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '15px' }}>Описание</h4>
                                    <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{viewProduct.desc}</p>
                                </div>
                            )}
                        </div>
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

            {/* --- LIGHTBOX ДЛЯ ФОТО --- */}
            {zoomedImg && (
                <div style={lightboxOverlay as any} onClick={() => setZoomedImg(null)}>
                    <div onClick={() => setZoomedImg(null)} style={{position: 'absolute', top: '20px', right: '30px', cursor: 'pointer', fontSize: '40px', color: '#ff4d4d', fontWeight: 'bold', zIndex: 90001, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>✕</div>
                    <img src={zoomedImg} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '15px'}} alt="Zoomed" />
                </div>
            )}

            <style jsx global>{`
                .premium-cards-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; width: 100%; }
                .premium-card { background: #111; border-radius: 18px; border: 1px solid #222; transition: all 0.2s ease; position: relative; cursor: pointer; display: flex; flex-direction: column; width: 100%; min-height: 140px; box-sizing: border-box; overflow: hidden; word-break: break-word; overflow-wrap: anywhere; }
                .premium-card:hover { border-color: #0abab5; transform: translateY(-3px); }
                .premium-card:active { background: rgba(10, 186, 181, 0.05); border-color: #0abab5; transform: scale(0.98); }
                
                .hits-scroll-container::-webkit-scrollbar { height: 6px; }
                .hits-scroll-container::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                
                .hit-card:hover { border-color: #ffd700; box-shadow: 0 5px 15px rgba(255,215,0,0.1); }

                @media (max-width: 768px) {
                    .premium-cards-container { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                    .premium-card h4 { font-size: 13px !important; margin-bottom: 10px !important; }
                    .tasks-modal { padding: 30px 20px !important; border-radius: 25px !important; width: 95% !important; max-height: 90vh !important; }
                    .hit-card { min-width: 180px !important; }
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
const editIconStyle = { background: '#1a1a1a', color: '#0abab5', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const delIconStyle = { background: '#1a1a1a', color: '#ff4d4d', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: '0.2s', flexShrink: 0, fontWeight: 'bold' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px', boxSizing: 'border-box' };
const lightboxOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 90000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', cursor: 'zoom-out' };
const modalContentLarge = { background: '#000', borderRadius: '40px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentMedium = { background: '#111', padding: '40px 30px', borderRadius: '35px', width: '100%', maxWidth: '550px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };
const modalContentSmall = { background: '#111', padding: '40px 30px', borderRadius: '30px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' };