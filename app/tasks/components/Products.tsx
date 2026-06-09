"use client";
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import CustomIcon from "../../components/CustomIcon";
import { saveDataToServer } from "@/app/lib/storageClient";
import {
    exportProductsToCsv,
    importProductsFromRows,
    normalizeProduct,
    parseGroupPath,
    type CatalogProduct,
} from "@/app/lib/productCatalog";

const STORAGE_KEYS = {
    PRODUCTS: "tea_hub_products_v1",
};

const buildProductSearchText = (product: CatalogProduct) =>
    [
        product.name,
        product.code,
        product.category,
        product.subcategory,
        product.groupPath,
        product.priority,
        product.desc,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

const getCategoryLabel = (product: CatalogProduct) => product.category || "Без категории";

const getProductSecondaryLine = (product: CatalogProduct) => product.subcategory || product.groupPath || "Группа не указана";

const getMetaItems = (product: CatalogProduct) =>
    [
        product.code ? { label: "Код", value: product.code } : null,
        product.priority ? { label: "Приоритет", value: product.priority } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;

type ProductTreeNode = {
    label: string;
    key: string;
    path: string[];
    count: number;
    children: ProductTreeNode[];
};

type PreparedCatalogProduct = CatalogProduct & {
    searchText: string;
    pathSegments: string[];
};

declare global {
    interface Window {
        XLSX?: {
            read: (data: ArrayBuffer, options: { type: string; dense: boolean }) => {
                SheetNames: string[];
                Sheets: Record<string, unknown>;
            };
            utils: {
                sheet_to_json: <T>(sheet: unknown, options: {
                    header: number;
                    raw: boolean;
                    defval: string;
                    blankrows: boolean;
                }) => T[];
            };
        };
    }
}

const getProductPathSegments = (product: CatalogProduct) => {
    const parsedGroup = parseGroupPath(product.groupPath);
    return [parsedGroup.category, ...parsedGroup.subcategory.split(" / ")].map((segment) => segment.trim()).filter(Boolean);
};

const prepareProduct = (product: CatalogProduct): PreparedCatalogProduct => ({
    ...product,
    searchText: buildProductSearchText(product),
    pathSegments: getProductPathSegments(product),
});

const loadBrowserXlsx = async () => {
    if (typeof window === "undefined") {
        throw new Error("XLSX недоступен вне браузера.");
    }

    if (window.XLSX) {
        return window.XLSX;
    }

    await new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>('script[data-xlsx-loader="true"]');
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Не удалось загрузить XLSX.")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
        script.async = true;
        script.dataset.xlsxLoader = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Не удалось загрузить XLSX."));
        document.head.appendChild(script);
    });

    if (!window.XLSX) {
        throw new Error("XLSX не инициализировался после загрузки.");
    }

    return window.XLSX;
};

const insertTreeNode = (nodes: ProductTreeNode[], path: string[], depth = 0): ProductTreeNode[] => {
    if (depth >= path.length) {
        return nodes;
    }

    const label = path[depth];
    const existingNode = nodes.find((node) => node.label === label);

    if (existingNode) {
        existingNode.count += 1;
        existingNode.children = insertTreeNode(existingNode.children, path, depth + 1);
        return nodes;
    }

    const nextPath = path.slice(0, depth + 1);
    const newNode: ProductTreeNode = {
        label,
        key: nextPath.join("::"),
        path: nextPath,
        count: 1,
        children: insertTreeNode([], path, depth + 1),
    };

    return [...nodes, newNode];
};

const sortTreeNodes = (nodes: ProductTreeNode[]): ProductTreeNode[] =>
    nodes
        .map((node) => ({ ...node, children: sortTreeNodes(node.children) }))
        .sort((left, right) => left.label.localeCompare(right.label, "ru"));

const buildProductTree = (products: PreparedCatalogProduct[]) => {
    let tree: ProductTreeNode[] = [];

    products.forEach((product) => {
        const path = product.pathSegments;
        if (path.length > 0) {
            tree = insertTreeNode(tree, path);
        }
    });

    return sortTreeNodes(tree);
};

const isPathSelected = (candidatePath: string[], selectedPath: string[]) =>
    candidatePath.length === selectedPath.length && candidatePath.every((segment, index) => selectedPath[index] === segment);

const isPathPrefix = (candidatePath: string[], selectedPath: string[]) =>
    selectedPath.length > 0 && candidatePath.every((segment, index) => selectedPath[index] === segment);

const matchesSelectedPath = (product: PreparedCatalogProduct, selectedPath: string[]) =>
    selectedPath.length === 0 || selectedPath.every((segment, index) => product.pathSegments[index] === segment);

export default function Products({ isAdmin }: { isAdmin: boolean; userId: string }) {
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [successModal, setSuccessModal] = useState({ show: false, title: "", text: "" });
    const [errorModal, setErrorModal] = useState({ show: false, text: "" });
    const [selectedTreePath, setSelectedTreePath] = useState<string[]>([]);
    const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
    const [selectedHitPriority, setSelectedHitPriority] = useState<string>("all");
    const [showProductForm, setShowProductForm] = useState(false);
    const [productFormData, setProductFormData] = useState<CatalogProduct>(normalizeProduct({}));
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: "", name: "" });
    const [viewProduct, setViewProduct] = useState<CatalogProduct | null>(null);
    const hitScrollRef = useRef<HTMLDivElement | null>(null);
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const persistProducts = (nextProducts: CatalogProduct[]) => {
        setProducts(nextProducts);
        saveDataToServer(STORAGE_KEYS.PRODUCTS, nextProducts);
    };

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await fetch(`/api/storage?key=${STORAGE_KEYS.PRODUCTS}`, { cache: "no-store" });
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    setProducts(data.map((product) => normalizeProduct(product)));
                }
            } catch (error) {
                console.error("Ошибка загрузки продуктов", error);
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        setIsSectionMenuOpen(window.innerWidth > 768);
    }, []);

    const handleSaveProduct = () => {
        if (!productFormData.name.trim()) {
            setErrorModal({ show: true, text: "Введите название товара." });
            return;
        }

        const normalizedProduct = normalizeProduct({
            ...productFormData,
            id: productFormData.id || `prod_${Date.now()}`,
            dateAdded: productFormData.dateAdded || new Date().toLocaleDateString("ru-RU"),
        });

        const nextProducts = productFormData.id
            ? products.map((product) => (product.id === productFormData.id ? normalizedProduct : product))
            : [normalizedProduct, ...products];

        persistProducts(nextProducts);
        setShowProductForm(false);
        setProductFormData(normalizeProduct({}));
    };

    const executeDelete = () => {
        const nextProducts = products.filter((product) => product.id !== confirmDelete.id);
        persistProducts(nextProducts);
        setConfirmDelete({ isOpen: false, id: "", name: "" });
    };

    const toggleHit = (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        const nextProducts = products.map((product) => (product.id === id ? normalizeProduct({ ...product, isHit: !product.isHit }) : product));
        persistProducts(nextProducts);
    };

    const toggleHidden = (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        const nextProducts = products.map((product) => (product.id === id ? normalizeProduct({ ...product, isHidden: !product.isHidden }) : product));
        persistProducts(nextProducts);
    };

    const exportToCSV = () => {
        const csvContent = exportProductsToCsv(products);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `products_export_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const XLSX = await loadBrowserXlsx();
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", dense: true });
            const firstSheetName = workbook.SheetNames[0];

            if (!firstSheetName) {
                setErrorModal({ show: true, text: "Не удалось найти лист в файле." });
                return;
            }

            const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(workbook.Sheets[firstSheetName], {
                header: 1,
                raw: false,
                defval: "",
                blankrows: false,
            }).map((row) => row.map((cell) => (cell ?? "").toString().trim()));

            const importResult = importProductsFromRows(rows, products);
            persistProducts(importResult.products);

            setSuccessModal({
                show: true,
                title: "Импорт завершён",
                text: `Добавлено новых товаров: ${importResult.addedCount}. Обновлено существующих: ${importResult.updatedCount}. Пропущено пустых строк: ${importResult.skippedCount}.`,
            });
        } catch (error) {
            console.error("Ошибка импорта файла товаров", error);
            setErrorModal({
                show: true,
                text: "Не удалось обработать файл. Используйте Excel-файл .xls/.xlsx или CSV с колонками из выгрузки.",
            });
        } finally {
            event.target.value = "";
        }
    };

    const preparedProducts = useMemo(() => products.map((product) => prepareProduct(product)), [products]);

    const baseFiltered = useMemo(() => preparedProducts.filter((product) => isAdmin || !product.isHidden), [isAdmin, preparedProducts]);

    const categoryTree = useMemo(() => buildProductTree(baseFiltered), [baseFiltered]);

    const searchedProducts = useMemo(() => {
        const search = deferredSearchQuery.trim().toLowerCase();
        return baseFiltered.filter((product) => {
            const matchesSearch = !search || product.searchText.includes(search);
            const matchesCategory = matchesSelectedPath(product, selectedTreePath);
            return matchesSearch && matchesCategory;
        });
    }, [baseFiltered, deferredSearchQuery, selectedTreePath]);

    const hitProducts = useMemo(() => {
        const search = deferredSearchQuery.trim().toLowerCase();
        return baseFiltered.filter((product) => product.isHit && (!search || product.searchText.includes(search)));
    }, [baseFiltered, deferredSearchQuery]);

    const hitPriorityOptions = useMemo(() => {
        const priorities = Array.from(new Set(hitProducts.map((product) => product.priority).filter(Boolean)));
        return priorities.sort((left, right) => {
            const leftNum = Number(left);
            const rightNum = Number(right);
            if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
                return leftNum - rightNum;
            }
            return left.localeCompare(right, "ru");
        });
    }, [hitProducts]);

    const visibleHitProducts = useMemo(() => {
        if (selectedHitPriority === "all") {
            return hitProducts;
        }
        return hitProducts.filter((product) => product.priority === selectedHitPriority);
    }, [hitProducts, selectedHitPriority]);

    useEffect(() => {
        if (selectedHitPriority !== "all" && !hitPriorityOptions.includes(selectedHitPriority)) {
            setSelectedHitPriority("all");
        }
    }, [hitPriorityOptions, selectedHitPriority]);

    const scrollHitProducts = (direction: "prev" | "next") => {
        if (!hitScrollRef.current) {
            return;
        }

        const firstCard = hitScrollRef.current.querySelector<HTMLElement>(".hit-card");
        const containerStyles = window.getComputedStyle(hitScrollRef.current);
        const gapValue = Number.parseFloat(containerStyles.columnGap || containerStyles.gap || "0");
        const fallbackStep = typeof window !== "undefined" && window.innerWidth <= 768 ? 272 : 340;
        const scrollStep = firstCard ? firstCard.offsetWidth + gapValue : fallbackStep;

        hitScrollRef.current.scrollBy({
            left: direction === "next" ? scrollStep : -scrollStep,
            behavior: "smooth",
        });
    };

    const selectedSectionLabel = selectedTreePath[selectedTreePath.length - 1] || "Все разделы";

    return (
        <section style={{ animation: "fadeInUp 0.6s ease", maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
                <div>
                    <h2 style={{ fontSize: "32px", fontWeight: "900", margin: 0, color: "#fff" }}>Товары и Продукты</h2>
                </div>

                {isAdmin && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button className="hover-unified-app" onClick={exportToCSV} style={{ ...adminActionBtn, background: "rgba(255,255,255,0.05)", color: "#aaa", border: "1px solid #333", display: "inline-flex", alignItems: "center", gap: "8px" } as any}>
                            <CustomIcon name="download" size={16} color="#aaa" /> ЭКСПОРТ CSV
                        </button>
                        <input type="file" accept=".csv,.xls,.xlsx" id="products-upload" style={{ display: "none" }} onChange={handleImportFile} />
                        <button className="hover-unified-app" onClick={() => document.getElementById("products-upload")?.click()} style={{ ...adminActionBtn, background: "rgba(255,255,255,0.05)", color: "#aaa", border: "1px solid #333", display: "inline-flex", alignItems: "center", gap: "8px" } as any}>
                            <CustomIcon name="upload" size={16} color="#aaa" /> ИМПОРТ EXCEL / CSV
                        </button>
                        <button
                            onClick={() => {
                                setProductFormData(normalizeProduct({}));
                                setShowProductForm(true);
                            }}
                            className="hover-unified-app"
                            style={{ ...adminActionBtn, background: "#0abab5", color: "#000" } as any}
                        >
                            + НОВЫЙ ТОВАР
                        </button>
                    </div>
                )}
            </div>

            <div style={{ position: "relative", marginBottom: "25px" }}>
                <span style={{ position: "absolute", left: "16px", top: "15px", opacity: 0.5, fontSize: "14px", display: "flex", alignItems: "center" }}>
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    placeholder="Поиск по названию, коду, категории, описанию..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    style={{ ...adminIn, paddingLeft: "45px", background: "#111", border: "1px solid #222" } as any}
                />
            </div>

            <div className="products-layout-shell" style={{ display: "grid", gridTemplateColumns: categoryTree.length > 0 ? "280px minmax(0, 1fr)" : "1fr", gap: "24px", alignItems: "start" }}>
                {categoryTree.length > 0 && (
                    <aside className="products-sidebar" style={{ background: "#111", border: "1px solid #222", borderRadius: "24px", padding: "18px", position: "sticky", top: "94px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: isSectionMenuOpen ? "14px" : 0 }}>
                            <button
                                className="hover-unified-app products-sidebar-toggle"
                                onClick={() => setIsSectionMenuOpen((prev) => !prev)}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "#151515", border: "1px solid #262626", borderRadius: "16px", color: "#fff", padding: "12px 14px", cursor: "pointer", textAlign: "left" }}
                            >
                                <div>
                                    <div style={{ fontSize: "11px", color: "#888", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Разделы</div>
                                    <div style={{ fontSize: "14px", fontWeight: "900", lineHeight: 1.3 }}>{selectedSectionLabel}</div>
                                </div>
                                <div style={{ color: "#0abab5", fontWeight: "900", fontSize: "18px", lineHeight: 1 }}>{isSectionMenuOpen ? "−" : "+"}</div>
                            </button>
                        </div>

                        <div className={`products-sidebar-content ${isSectionMenuOpen ? "open" : ""}`} style={{ display: isSectionMenuOpen ? "block" : "none" }}>
                            <button
                                className="hover-unified-app"
                                onClick={() => setSelectedTreePath([])}
                                style={{ width: "100%", background: selectedTreePath.length === 0 ? "rgba(10,186,181,0.14)" : "#151515", color: selectedTreePath.length === 0 ? "#fff" : "#cfcfcf", border: `1px solid ${selectedTreePath.length === 0 ? "rgba(10,186,181,0.42)" : "#262626"}`, borderRadius: "14px", padding: "12px 14px", fontWeight: "900", cursor: "pointer", textAlign: "left", marginBottom: "10px" }}
                            >
                                Все разделы
                                <span style={{ float: "right", color: selectedTreePath.length === 0 ? "#0abab5" : "#777", fontSize: "12px" }}>{baseFiltered.length}</span>
                            </button>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {categoryTree.map((node) => (
                                    <SidebarSectionNode key={node.key} node={node} selectedTreePath={selectedTreePath} setSelectedTreePath={setSelectedTreePath} />
                                ))}
                            </div>
                        </div>
                    </aside>
                )}

                <div style={{ minWidth: 0 }}>
                    {hitProducts.length > 0 && (
                        <div
                            style={{
                                background: "linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(0,0,0,0) 100%)",
                                border: "1px solid rgba(255,215,0,0.2)",
                                borderRadius: "25px",
                                padding: "30px",
                                marginBottom: "40px",
                                boxShadow: "0 10px 30px rgba(255,215,0,0.03)",
                            }}
                        >
                            <div className="hits-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "25px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                    <CustomIcon name="flame" size={30} color="#ffd700" />
                                    <h3 style={{ fontSize: "20px", color: "#ffd700", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Обязательно к продаже</h3>
                                </div>
                                {visibleHitProducts.length > 1 && (
                                    <div className="hit-scroll-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <button
                                            type="button"
                                            aria-label="Прокрутить обязательные товары назад"
                                            className="hover-unified-app hit-scroll-button"
                                            onClick={() => scrollHitProducts("prev")}
                                            style={{ background: "#151515", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "14px", width: "42px", height: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "20px", fontWeight: "900", lineHeight: 1 }}
                                        >
                                            ‹
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Прокрутить обязательные товары вперёд"
                                            className="hover-unified-app hit-scroll-button"
                                            onClick={() => scrollHitProducts("next")}
                                            style={{ background: "#151515", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "14px", width: "42px", height: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "20px", fontWeight: "900", lineHeight: 1 }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </div>

                            {hitPriorityOptions.length > 1 && (
                                <div className="hit-priority-switcher custom-scroll" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "18px" }}>
                                    <button
                                        className="hover-unified-app"
                                        onClick={() => setSelectedHitPriority("all")}
                                        style={{ background: selectedHitPriority === "all" ? "rgba(255,215,0,0.16)" : "#151515", color: selectedHitPriority === "all" ? "#ffd700" : "#bdbdbd", border: `1px solid ${selectedHitPriority === "all" ? "rgba(255,215,0,0.42)" : "#2a2a2a"}`, borderRadius: "999px", padding: "9px 14px", fontSize: "12px", fontWeight: "900", cursor: "pointer", whiteSpace: "nowrap" }}
                                    >
                                        Все приоритеты
                                    </button>
                                    {hitPriorityOptions.map((priority) => (
                                        <button
                                            key={priority}
                                            className="hover-unified-app"
                                            onClick={() => setSelectedHitPriority(priority)}
                                            style={{ background: selectedHitPriority === priority ? "rgba(255,215,0,0.16)" : "#151515", color: selectedHitPriority === priority ? "#ffd700" : "#bdbdbd", border: `1px solid ${selectedHitPriority === priority ? "rgba(255,215,0,0.42)" : "#2a2a2a"}`, borderRadius: "999px", padding: "9px 14px", fontSize: "12px", fontWeight: "900", cursor: "pointer", whiteSpace: "nowrap" }}
                                        >
                                            Приоритет {priority}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div ref={hitScrollRef} className="hits-scroll-container custom-scroll" style={{ display: "flex", overflowX: "auto", gap: "16px", padding: "10px 0 20px 0", margin: "-10px 0 0 0", scrollSnapType: "x mandatory" }}>
                                {visibleHitProducts.map((product) => {
                                    const isSingle = visibleHitProducts.length === 1;
                                    const metaItems = getMetaItems(product);
                                    return (
                                        <div
                                            key={`hit-${product.id}`}
                                            className={`premium-card hit-card product-hit-card ${isSingle ? "single-hit" : ""}`}
                                            onClick={() => setViewProduct(product)}
                                            style={{
                                                minWidth: "100%",
                                                width: "100%",
                                                maxWidth: "100%",
                                                flex: isSingle ? "1 1 auto" : "0 0 100%",
                                                padding: "25px",
                                                scrollSnapAlign: "start",
                                                opacity: product.isHidden ? 0.4 : 1,
                                                filter: product.isHidden ? "grayscale(100%)" : "none",
                                                background: "#111",
                                                border: "1px solid rgba(255,215,0,0.4)",
                                                display: "flex",
                                                flexDirection: isSingle ? "row" : "column",
                                                alignItems: isSingle ? "stretch" : "stretch",
                                                justifyContent: isSingle ? "space-between" : "flex-start",
                                            }}
                                        >
                                    {isAdmin && (
                                        <div style={{ position: "absolute", top: "15px", right: "15px", display: "flex", gap: "5px", zIndex: 10 }}>
                                            <div onClick={(event) => toggleHit(event, product.id)} className="admin-action-icon" style={{ ...textIconStyle, background: "rgba(0,0,0,0.8)", color: "#ffd700", border: "1px solid #ffd700" } as any} title="Убрать из обязательных">
                                                <CustomIcon name="flame" size={16} color="#ffd700" />
                                            </div>
                                            <div onClick={(event) => toggleHidden(event, product.id)} className="admin-action-icon" style={{ ...textIconStyle, background: "rgba(0,0,0,0.8)", color: product.isHidden ? "#ff4d4d" : "#0abab5" } as any} title={product.isHidden ? "Показать сотрудникам" : "Скрыть от сотрудников"}>
                                                <CustomIcon name={product.isHidden ? "hidden" : "eye"} size={16} color={product.isHidden ? "#ff4d4d" : "#0abab5"} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="product-card-body" style={{ flex: "1 1 auto", paddingRight: isAdmin && !isSingle ? "80px" : "0" }}>
                                        <span className="product-card-badge" style={{ background: "rgba(255,215,0,0.1)", color: "#ffd700", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", width: "fit-content", marginBottom: "12px", display: "inline-block" }}>
                                            {getCategoryLabel(product)}
                                        </span>
                                        <div style={{ fontSize: "12px", color: "#b4a264", lineHeight: 1.45, marginBottom: "12px", minHeight: "34px" }}>{getProductSecondaryLine(product)}</div>
                                        <h4 className="product-card-title" style={{ fontSize: "18px", margin: 0, fontWeight: "bold", color: "#fff", lineHeight: "1.3" }}>{product.name}</h4>

                                        {metaItems.length > 0 && (
                                            <div className="product-meta-grid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                                                {metaItems.map((item) => (
                                                    <div key={`${product.id}-${item.label}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "6px 10px" }}>
                                                        <div style={{ fontSize: "10px", color: "#8f8f8f", marginBottom: "2px" }}>{item.label}</div>
                                                        <div style={{ fontSize: "12px", color: "#fff", fontWeight: "800" }}>{item.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`product-card-footer ${isSingle ? "single-hit-stats" : ""}`} style={{ marginTop: "18px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", minWidth: isSingle ? "220px" : "auto", paddingRight: isAdmin && isSingle ? "90px" : "0" }}>
                                        <div style={{ flex: 1 }}>
                                            {product.code && <div style={{ fontSize: "11px", color: "#888" }}>Код: {product.code}</div>}
                                        </div>
                                        {product.priority && <div style={{ fontSize: "11px", color: "#b4a264", fontWeight: "900" }}>Приоритет: {product.priority}</div>}
                                    </div>
                                </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
                        <h3 style={{ fontSize: "20px", color: "#fff", fontWeight: "900", margin: 0, textTransform: "uppercase" }}>
                            {selectedTreePath.length > 0 ? `Каталог: ${selectedTreePath[selectedTreePath.length - 1]}` : "Весь каталог"}
                        </h3>
                        <div style={{ height: "1px", background: "#222", flex: 1 }}></div>
                    </div>

                    <div className="premium-cards-container">
                        {searchedProducts.length === 0 ? (
                            <div style={{ color: "#555", fontSize: "14px", background: "#111", padding: "30px", borderRadius: "30px", border: "1px dashed #222", textAlign: "center", gridColumn: "1 / -1" }}>
                                Товары не найдены
                            </div>
                        ) : (
                            searchedProducts.map((product) => {
                                const metaItems = getMetaItems(product);
                                return (
                                    <div key={product.id} className="premium-card product-card" onClick={() => setViewProduct(product)} style={{ padding: "25px", opacity: product.isHidden ? 0.4 : 1, filter: product.isHidden ? "grayscale(100%)" : "none", display: "flex", flexDirection: "column" }}>
                                {isAdmin && (
                                    <div style={{ position: "absolute", top: "15px", right: "15px", display: "flex", gap: "5px", zIndex: 10 }}>
                                        <div onClick={(event) => toggleHit(event, product.id)} className="admin-action-icon" style={{ ...textIconStyle, color: product.isHit ? "#ffd700" : "#666" } as any} title="В обязательные">
                                            <CustomIcon name={product.isHit ? "flame" : "star"} size={16} color={product.isHit ? "#ffd700" : "#666"} />
                                        </div>
                                        <div onClick={(event) => toggleHidden(event, product.id)} className="admin-action-icon" style={{ ...textIconStyle, color: product.isHidden ? "#ff4d4d" : "#0abab5" } as any} title="Скрыть/Показать">
                                            <CustomIcon name={product.isHidden ? "hidden" : "eye"} size={16} color={product.isHidden ? "#ff4d4d" : "#0abab5"} />
                                        </div>
                                        <div onClick={(event) => { event.stopPropagation(); setProductFormData(normalizeProduct(product)); setShowProductForm(true); }} className="admin-action-icon" style={textIconStyle as any} title="Редактировать">
                                            <CustomIcon name="edit" size={16} color="#0abab5" />
                                        </div>
                                        <div onClick={(event) => { event.stopPropagation(); setConfirmDelete({ isOpen: true, id: product.id, name: product.name }); }} className="admin-action-icon" style={delIconStyle as any} title="Удалить">
                                            <CustomIcon name="close" size={16} color="#ff4d4d" />
                                        </div>
                                    </div>
                                )}

                                {isAdmin && product.isHidden && (
                                    <div style={{ position: "absolute", top: "60px", right: "15px", background: "#ff4d4d", color: "#fff", padding: "4px 10px", borderRadius: "8px", fontWeight: "bold", fontSize: "10px", zIndex: 5 }}>
                                        СКРЫТО
                                    </div>
                                )}

                                <div className="product-card-body" style={{ paddingRight: isAdmin ? "130px" : "0", marginBottom: "18px", marginTop: isAdmin && product.isHidden ? "25px" : "0" }}>
                                    <span className="product-card-badge" style={{ background: "rgba(10,186,181,0.1)", color: "#0abab5", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", display: "inline-block", marginBottom: "10px" }}>
                                        {getCategoryLabel(product)}
                                    </span>
                                    <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.45, marginBottom: "12px", minHeight: "34px" }}>{getProductSecondaryLine(product)}</div>
                                    <h4 className="product-card-title" style={{ fontSize: "18px", margin: 0, fontWeight: "bold", wordBreak: "break-word", color: "#fff", lineHeight: "1.3" }}>{product.name}</h4>
                                </div>

                                {metaItems.length > 0 && (
                                    <div className="product-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", marginBottom: "18px" }}>
                                        {metaItems.map((item) => (
                                            <div key={`${product.id}-${item.label}`} style={{ background: "#0d0d0d", border: "1px solid #202020", borderRadius: "12px", padding: "9px 10px" }}>
                                                <div style={{ fontSize: "10px", color: "#777", marginBottom: "4px" }}>{item.label}</div>
                                                <div style={{ fontSize: "12px", color: "#fff", fontWeight: "800", wordBreak: "break-word" }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="product-card-footer" style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", paddingTop: "15px", borderTop: "1px solid #222" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {product.desc ? (
                                            <div style={{ color: "#777", fontSize: "12px", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {product.desc}
                                            </div>
                                        ) : (
                                            <div style={{ color: "#555", fontSize: "12px" }}>Описание не заполнено</div>
                                        )}
                                    </div>
                                    {product.priority && <div style={{ textAlign: "right", flexShrink: 0, fontSize: "11px", color: "#0abab5", fontWeight: "900" }}>Приоритет: {product.priority}</div>}
                                </div>
                            </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {showProductForm && (
                <div style={modalOverlay as any} onClick={() => setShowProductForm(false)}>
                    <div className="tasks-modal custom-scroll" style={{ ...modalContentMedium, margin: "0 auto", maxHeight: "90vh", overflowY: "auto" } as any} onClick={(event) => event.stopPropagation()}>
                        <h2 style={{ textAlign: "center", marginBottom: "25px", color: "#0abab5", fontWeight: "900", textTransform: "uppercase" }}>
                            {productFormData.id ? "Редактировать товар" : "Новый товар"}
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "25px" }}>
                            <div>
                                <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold", marginBottom: "5px", marginLeft: "5px" }}>Наименование *</div>
                                <input style={adminIn as any} placeholder="Например: Те Гуань Инь Ван" value={productFormData.name} onChange={(event) => setProductFormData(normalizeProduct({ ...productFormData, name: event.target.value }))} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold", marginBottom: "5px", marginLeft: "5px" }}>Код</div>
                                    <input type="text" style={adminIn as any} placeholder="Например: 1022" value={productFormData.code} onChange={(event) => setProductFormData(normalizeProduct({ ...productFormData, code: event.target.value }))} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold", marginBottom: "5px", marginLeft: "5px" }}>Приоритет</div>
                                    <input type="text" style={adminIn as any} placeholder="1" value={productFormData.priority} onChange={(event) => setProductFormData(normalizeProduct({ ...productFormData, priority: event.target.value }))} />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold", marginBottom: "5px", marginLeft: "5px" }}>Группы</div>
                                <input
                                    style={adminIn as any}
                                    placeholder="01 ТОВАРЫ/01 ЧАЙ/01 Весовой/классический/01 Китай"
                                    value={productFormData.groupPath}
                                    onChange={(event) => setProductFormData(normalizeProduct({ ...productFormData, groupPath: event.target.value }))}
                                />
                                {(productFormData.category || productFormData.subcategory) && (
                                    <div style={{ marginTop: "8px", marginLeft: "6px", fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                                        <div>Категория: <span style={{ color: "#0abab5" }}>{productFormData.category || "—"}</span></div>
                                        <div>Подкатегория: <span style={{ color: "#fff" }}>{productFormData.subcategory || "—"}</span></div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold", marginBottom: "5px", marginLeft: "5px" }}>Описание</div>
                                <textarea style={{ ...adminIn, height: "140px", resize: "none" } as any} placeholder="Описание, вкус, особенности..." value={productFormData.desc} onChange={(event) => setProductFormData(normalizeProduct({ ...productFormData, desc: event.target.value }))} />
                            </div>
                        </div>

                        <button className="hover-unified-app" onClick={handleSaveProduct} style={saveBtn as any}>СОХРАНИТЬ ТОВАР</button>
                        <div className="hover-link-unified-app" onClick={() => setShowProductForm(false)} style={cancelLink as any}>ОТМЕНА</div>
                    </div>
                </div>
            )}

            {viewProduct && !showProductForm && (
                <div style={modalOverlay as any} onClick={() => setViewProduct(null)}>
                    <div className="tasks-modal custom-scroll" style={{ ...modalContentLarge, maxWidth: "780px", maxHeight: "90vh", overflowY: "auto", padding: "40px", position: "relative" } as any} onClick={(event) => event.stopPropagation()}>
                        <div onClick={() => setViewProduct(null)} style={{ position: "absolute", top: "25px", right: "25px", cursor: "pointer", color: "#ff4d4d", lineHeight: 1, zIndex: 10, display: "inline-flex" }}>
                            <CustomIcon name="close" size={24} color="#ff4d4d" />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "30px", paddingRight: "40px" }}>
                            <div>
                                <span style={{ fontSize: "12px", color: "#0abab5", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", background: "rgba(10,186,181,0.1)", padding: "5px 12px", borderRadius: "8px", display: "inline-block", marginBottom: "12px" }}>
                                    {getCategoryLabel(viewProduct)}
                                </span>
                                {viewProduct.subcategory && <div style={{ fontSize: "13px", color: "#8b8b8b", marginBottom: "14px", lineHeight: 1.5 }}>{viewProduct.subcategory}</div>}
                                <h2 style={{ fontSize: "32px", color: "#fff", fontWeight: "900", margin: "0 0 14px 0" }}>{viewProduct.name}</h2>
                                {viewProduct.isHit && <div style={{ color: "#ffd700", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}><CustomIcon name="flame" size={16} color="#ffd700" /> ОБЯЗАТЕЛЬНО К ПРОДАЖЕ</div>}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", marginBottom: "28px" }}>
                            <InfoCard label="Код" value={viewProduct.code || "—"} />
                            <InfoCard label="Приоритет" value={viewProduct.priority || "—"} />
                        </div>

                        {viewProduct.groupPath && (
                            <div style={{ marginBottom: "28px", background: "#111", padding: "20px 22px", borderRadius: "20px", border: "1px solid #222" }}>
                                <h4 style={{ fontSize: "14px", color: "#888", textTransform: "uppercase", fontWeight: "bold", margin: "0 0 12px 0" }}>Группы из выгрузки</h4>
                                <p style={{ fontSize: "14px", color: "#ddd", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{viewProduct.groupPath}</p>
                            </div>
                        )}

                        {viewProduct.desc && (
                            <div>
                                <h4 style={{ fontSize: "14px", color: "#888", textTransform: "uppercase", fontWeight: "bold", marginBottom: "15px" }}>Описание</h4>
                                <p style={{ fontSize: "15px", color: "#ccc", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{viewProduct.desc}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {confirmDelete.isOpen && (
                <div style={modalOverlay as any} onClick={() => setConfirmDelete({ isOpen: false, id: "", name: "" })}>
                    <div style={{ ...modalContentSmall, textAlign: "center" } as any} onClick={(event) => event.stopPropagation()}>
                        <div style={{ width: "60px", height: "60px", borderRadius: "18px", border: "1px solid rgba(255,77,77,0.35)", background: "rgba(255,77,77,0.08)", color: "#ff4d4d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                            <CustomIcon name="alert" size={34} color="#ff4d4d" />
                        </div>
                        <h2 style={{ color: "#ff4d4d", fontWeight: "900", marginBottom: "15px" }}>УДАЛИТЬ ТОВАР?</h2>
                        <p style={{ color: "#ccc", fontSize: "14px", marginBottom: "25px" }}>Вы уверены, что хотите безвозвратно удалить "{confirmDelete.name}"?</p>
                        <div style={{ display: "flex", gap: "15px" }}>
                            <button className="hover-unified-app" onClick={() => setConfirmDelete({ isOpen: false, id: "", name: "" })} style={{ ...saveBtn, background: "#222", color: "#fff", flex: 1, marginTop: 0 } as any}>ОТМЕНА</button>
                            <button className="hover-unified-app" onClick={executeDelete} style={{ ...saveBtn, background: "#ff4d4d", color: "#fff", flex: 1, marginTop: 0 } as any}>УДАЛИТЬ</button>
                        </div>
                    </div>
                </div>
            )}

            {successModal.show && (
                <div style={modalOverlay as any} onClick={() => setSuccessModal({ show: false, title: "", text: "" })}>
                    <div style={{ ...modalContentSmall, textAlign: "center" } as any} onClick={(event) => event.stopPropagation()}>
                        <div style={{ marginBottom: "20px", animation: "scaleIn 0.3s ease" }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="rgba(10,186,181,0.1)" stroke="#0abab5" strokeWidth="2" />
                                <path d="M8 12L11 15L16 9" stroke="#0abab5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 style={{ color: "#0abab5", fontWeight: "900", marginBottom: "15px", textTransform: "uppercase" }}>{successModal.title}</h2>
                        <p style={{ color: "#ccc", fontSize: "15px", lineHeight: "1.5", marginBottom: "25px" }}>{successModal.text}</p>
                        <button className="hover-unified-app" onClick={() => setSuccessModal({ show: false, title: "", text: "" })} style={saveBtn as any}>ПОНЯТНО</button>
                    </div>
                </div>
            )}

            {errorModal.show && (
                <div style={modalOverlay as any} onClick={() => setErrorModal({ show: false, text: "" })}>
                    <div style={{ ...modalContentSmall, textAlign: "center" } as any} onClick={(event) => event.stopPropagation()}>
                        <div style={{ marginBottom: "20px" }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="rgba(255,77,77,0.1)" stroke="#ff4d4d" strokeWidth="2" />
                                <path d="M15 9L9 15M9 9L15 15" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 style={{ color: "#ff4d4d", fontWeight: "900", marginBottom: "15px", textTransform: "uppercase" }}>Ошибка</h2>
                        <p style={{ color: "#ccc", fontSize: "15px", lineHeight: "1.5", marginBottom: "25px" }}>{errorModal.text}</p>
                        <button className="hover-unified-app" onClick={() => setErrorModal({ show: false, text: "" })} style={{ ...saveBtn, background: "#ff4d4d", color: "#fff" } as any}>ПОНЯТНО</button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .premium-cards-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; width: 100%; }
                .premium-card { background: #111; border-radius: 20px; border: 1px solid #222; transition: all 0.2s ease; position: relative; cursor: pointer; box-sizing: border-box; }
                .premium-card:hover { border-color: rgba(10, 186, 181, 0.45); transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(10,186,181,0.18); }
                .premium-card:active { transform: translateY(2px) scale(0.97); }

                .hits-scroll-container::-webkit-scrollbar { height: 6px; }
                .hits-scroll-container::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
                .hit-scroll-button { flex-shrink: 0; }
                .hit-card { scroll-snap-stop: always; }

                .hit-card:hover { border-color: #ffd700 !important; box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,215,0,0.18), 0 5px 20px rgba(255,215,0,0.15); transform: translateY(1px) scale(0.985); }

                .admin-action-icon {
                    transition: all 0.2s ease;
                }

                .admin-action-icon:hover {
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.18), 0 0 0 1.5px #0abab5 !important;
                    border-color: #0abab5 !important;
                    transform: translateY(1px) scale(0.985);
                    z-index: 20;
                }

                .hit-card .admin-action-icon:hover {
                    box-shadow: 0 0 0 1.5px #ffd700 !important;
                    border-color: #ffd700 !important;
                }

                .single-hit {
                    flex-direction: row !important;
                    align-items: stretch !important;
                    justify-content: space-between;
                    padding: 30px 40px !important;
                }

                @media (max-width: 768px) {
                    .products-layout-shell { grid-template-columns: 1fr !important; gap: 16px !important; }
                    .products-sidebar { position: static !important; top: auto !important; padding: 14px !important; border-radius: 18px !important; }
                    .products-sidebar-toggle { padding: 11px 12px !important; }
                    .premium-cards-container { display: grid !important; grid-template-columns: 1fr !important; gap: 15px !important; }
                    .tasks-modal { padding: 30px 20px !important; border-radius: 25px !important; width: 95% !important; max-height: 90vh !important; }
                    .hits-header-row { align-items: flex-start !important; }
                    .hit-scroll-actions { width: 100%; justify-content: flex-end; }
                    .hits-scroll-container { display: flex !important; flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; gap: 12px !important; padding: 4px 0 14px 0 !important; margin: 0 !important; scroll-padding-left: 0 !important; scroll-padding-right: 0 !important; scroll-snap-type: x mandatory !important; }
                    .hit-priority-switcher { margin-bottom: 14px !important; }
                    .hit-card { min-width: 100% !important; width: 100% !important; max-width: 100% !important; }
                    .product-card,
                    .product-hit-card { border-radius: 16px !important; }
                    .product-card { padding: 14px !important; min-height: 148px !important; }
                    .product-hit-card { padding: 16px !important; min-height: 134px !important; }
                    .product-card-body { margin-bottom: 14px !important; }
                    .product-meta-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .product-card-title { font-size: 16px !important; line-height: 1.25 !important; }
                    .product-card-badge { font-size: 10px !important; margin-bottom: 8px !important; padding: 4px 8px !important; }
                    .product-card-footer { padding-top: 12px !important; }
                    .product-card-body,
                    .product-card-footer { gap: 10px !important; }
                    .product-card-footer { flex-direction: column !important; align-items: flex-start !important; }
                    .products-sidebar-content { margin-top: 10px !important; }

                    .single-hit {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        padding: 18px !important;
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

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function InfoCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div style={{ background: "#111", border: `1px solid ${accent ? "rgba(10,186,181,0.35)" : "#222"}`, padding: "18px 20px", borderRadius: "18px" }}>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</div>
            <div style={{ fontSize: accent ? "24px" : "16px", color: accent ? "#0abab5" : "#fff", fontWeight: "900", lineHeight: 1.25, wordBreak: "break-word" }}>{value}</div>
        </div>
    );
}

function SidebarSectionNode({
    node,
    selectedTreePath,
    setSelectedTreePath,
}: {
    node: ProductTreeNode;
    selectedTreePath: string[];
    setSelectedTreePath: React.Dispatch<React.SetStateAction<string[]>>;
}) {
    const selected = isPathSelected(node.path, selectedTreePath);
    const insideSelected = isPathPrefix(node.path, selectedTreePath);

    return (
        <div>
            <button
                className="hover-unified-app"
                onClick={() => setSelectedTreePath(selected ? [] : node.path)}
                style={{
                    width: "100%",
                    textAlign: "left",
                    background: selected ? "rgba(10,186,181,0.14)" : insideSelected ? "rgba(255,255,255,0.04)" : "#151515",
                    border: `1px solid ${selected ? "rgba(10,186,181,0.45)" : insideSelected ? "rgba(255,255,255,0.08)" : "#262626"}`,
                    color: selected ? "#fff" : "#d7d7d7",
                    borderRadius: "14px",
                    padding: "11px 13px",
                    cursor: "pointer",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div style={{ fontWeight: "900", fontSize: "13px", lineHeight: 1.3 }}>{node.label}</div>
                    <div style={{ color: selected ? "#0abab5" : "#888", fontSize: "11px", fontWeight: "900", flexShrink: 0 }}>{node.count}</div>
                </div>
            </button>

            {node.children.length > 0 && insideSelected && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", marginLeft: "10px", paddingLeft: "10px", borderLeft: "1px solid #202020" }}>
                    {node.children.map((child) => (
                        <SidebarSectionNode key={child.key} node={child} selectedTreePath={selectedTreePath} setSelectedTreePath={setSelectedTreePath} />
                    ))}
                </div>
            )}
        </div>
    );
}

const adminActionBtn = { background: "rgba(10,186,181,0.1)", color: "#0abab5", border: "1px solid rgba(10,186,181,0.3)", padding: "10px 20px", borderRadius: "12px", fontWeight: "900", cursor: "pointer", fontSize: "13px", letterSpacing: "1px", transition: "0.2s" };
const adminIn = { width: "100%", padding: "16px", background: "#000", border: "1px solid #333", borderRadius: "15px", color: "#fff", marginBottom: "0", outline: "none", fontSize: "15px", boxSizing: "border-box" };
const saveBtn = { width: "100%", padding: "18px", background: "#0abab5", color: "#000", border: "none", borderRadius: "15px", fontWeight: "900", cursor: "pointer", marginTop: "25px", fontSize: "15px", letterSpacing: "1px" };
const cancelLink = { textAlign: "center" as const, marginTop: "20px", color: "#666", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const editIconStyle = { background: "#1a1a1a", border: "1px solid #333", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", flexShrink: 0, fontWeight: "bold" };
const textIconStyle = { ...editIconStyle, minWidth: "36px", width: "auto", padding: "0 8px", fontSize: "10px", letterSpacing: "0.5px" };
const delIconStyle = { background: "#1a1a1a", color: "#ff4d4d", border: "1px solid #333", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", flexShrink: 0, fontWeight: "bold" };
const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.92)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: "20px", boxSizing: "border-box" };
const modalContentLarge = { background: "#000", borderRadius: "40px", maxWidth: "1100px", width: "100%", border: "1px solid #222", maxHeight: "90vh", overflowY: "auto" };
const modalContentMedium = { background: "#111", padding: "40px 30px", borderRadius: "35px", width: "100%", maxWidth: "620px", border: "1px solid #333", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" };
const modalContentSmall = { background: "#111", padding: "40px 30px", borderRadius: "30px", width: "100%", maxWidth: "400px", border: "1px solid #333", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" };
