"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/app/components/Navigation';
import { useSearchParams } from 'next/navigation';

// --- КЛЮЧИ ПАМЯТИ ---
const STORAGE_KEYS = {
    ONBOARD_ROUTE: 'tea_hub_onboard_route_v1',
    BASICS_PROGRESS: 'tea_hub_basics_progress_v1',
    DYNAMIC_BASICS: 'tea_hub_dynamic_basics_v1',
    DYNAMIC_ROUTE: 'tea_hub_dynamic_route_v1',
    DYNAMIC_STANDARDS: 'tea_hub_dynamic_standards_v1',
    URGENT_FILES: 'tea_hub_urgent_files_v1'
};

// --- ХЕЛПЕР ДЛЯ ЗАПИСИ ДАННЫХ НА СЕРВЕР ---
const saveDataToServer = (key: string, data: any) => {
    fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
    }).catch(err => console.error("Ошибка сохранения на сервер:", err));
};

// Функция для удаления эмодзи из строк
const stripEmoji = (str: string) => {
    if (!str) return '';
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

// --- МАСШТАБНАЯ БАЗА ОБУЧЕНИЯ ---
const INITIAL_BASICS = [
  { 
    id: "sec_1", title: "01. История и Бренд", 
    modules: [
        { id: "m1_1", title: "Философия Tea Master", t1: "Мастер — это лицо бренда. Мы не просто продаем продукт, мы создаем атмосферу и состояние.", t2: "Важно понимать психологию гостя. Кому-то нужна тишина, кому-то — подробный рассказ.", t3: "Эстетика в деталях: от чистоты полотенца до постановки пиалы.", quiz: [{q: "Кто такой мастер?", o: ["Продавец", "Проводник", "Официант"], c: 1}] },
        { id: "m1_2", title: "История основания", t1: "Бренд зародился из любви к путешествиям по Китаю. Первая точка открылась в 2020 году.", t2: "Основатели лично отбирали каждый сорт в провинциях Юньнань и Фуцзянь.", t3: "Сегодня HUB — это сердце нашего обучения. Мы передаем накопленный опыт.", quiz: [{q: "Год основания?", o: ["2020", "2018", "2024"], c: 0}] },
        { id: "m1_3", title: "Наши ценности", t1: "Честность перед гостем.", t2: "Качество каждого листа.", t3: "Постоянное саморазвитие мастера.", quiz: [{q: "Сколько главных ценностей?", o: ["1", "5", "3"], c: 2}] },
        { id: "m1_4", title: "Миссия компании", t1: "Популяризация культуры.", t2: "Доступность элитных сортов.", t3: "Обучение мастеров.", quiz: [{q: "В чем наша миссия?", o: ["Популяризация", "Быстрая прибыль", "Скорость работы"], c: 0}] },
        { id: "m1_5", title: "Корпоративный этикет", t1: "Взаимовыручка.", t2: "Дисциплина.", t3: "Развитие.", quiz: [{q: "Важна ли вежливость в команде?", o: ["Второстепенна", "Нет", "Да, это основа"], c: 2}] },
    ]
  },
  { id: "sec_2", title: "02. Ботаника чая", modules: [
        { id: "m2_1", title: "Camellia Sinensis", t1: "Это вечнозеленый куст.", t2: "Существует два основных подвида.", t3: "Китайская и ассамская разновидности.", quiz: [{q: "Как называется чайный куст?", o: ["Камелия", "Акация", "Фикус"], c: 0}] },
        { id: "m2_2", title: "Терруар и почва", t1: "Минеральный состав почвы.", t2: "Кислотность.", t3: "Дренаж воды.", quiz: [{q: "Влияет ли почва на вкус?", o: ["Никак не влияет", "Формирует вкус", "Только на цвет настоя"], c: 1}] },
        { id: "m2_3", title: "Высота произрастания", t1: "Высокогорный чай.", t2: "Влияние туманов.", t3: "Концентрация веществ.", quiz: [{q: "Важна ли высота плантации?", o: ["Важна", "Не имеет значения", "Влияет только на размер"], c: 0}] },
        { id: "m2_4", title: "Строение листа", t1: "Почка (типс).", t2: "Верхние листочки.", t3: "Флеш.", quiz: [{q: "Что такое типс?", o: ["Нижний старый лист", "Стебель", "Почка"], c: 2}] },
        { id: "m2_5", title: "Химия листа", t1: "Теанин.", t2: "Кофеин.", t3: "Полифенолы.", quiz: [{q: "Какое вещество дает бодрость?", o: ["Кофеин", "Теанин", "Полифенолы"], c: 0}] },
  ]},
  { id: "sec_3", title: "03. Зеленый чай", modules: [
        { id: "m3_1", title: "Лунцзин", t1: "История сорта.", t2: "Технология плоской прожарки.", t3: "Вкусовой профиль: семечки.", quiz: [{q: "Какая форма листа у Лунцзина?", o: ["Плоский", "Спираль", "Шар"], c: 0}] },
        { id: "m3_2", title: "Би Ло Чунь", t1: "Сбор почек.", t2: "Аромат фруктовых деревьев.", t3: "Ворсистость листа.", quiz: [{q: "Какая форма у Би Ло Чунь?", o: ["Плоский", "Спираль", "Связанный"], c: 1}] },
        { id: "m3_3", title: "Убийство зелени", t1: "Остановка ферментации.", t2: "Температурный удар.", t3: "Сохранение цвета.", quiz: [{q: "Какова цель этого этапа?", o: ["Усилить цвет", "Высушить лист", "Остановить окисление"], c: 2}] },
        { id: "m3_4", title: "Японская Сенча", t1: "Обработка паром.", t2: "Морской вкус.", t3: "Отличие от Китая.", quiz: [{q: "Основной метод фиксации в Японии?", o: ["Прожарка", "Пар", "Копчение"], c: 1}] },
        { id: "m3_5", title: "Температура воды", t1: "Почему нельзя кипяток.", t2: "Раскрытие нежности.", t3: "Оптимально 75-80C.", quiz: [{q: "Какая температура оптимальна?", o: ["95-100°C", "60-65°C", "75-80°C"], c: 2}] },
  ]},
  { id: "sec_4", title: "04. Белый чай", modules: [
        { id: "m4_1", title: "Бай Хао Инь Чжэнь", t1: "Высший сорт.", t2: "Только почки.", t3: "Ворсистость.", quiz: [{q: "Из чего делают этот чай?", o: ["Только почки", "Почка и лист", "Крупные листья"], c: 0}] },
        { id: "m4_2", title: "Бай Му Дань", t1: "Лист + почка.", t2: "Цветочный вкус.", t3: "Классика Фудина.", quiz: [{q: "Как переводится Бай Му Дань?", o: ["Белый лотос", "Белый пион", "Белая орхидея"], c: 1}] },
        { id: "m4_3", title: "Обработка", t1: "Солнечная сушка.", t2: "Отсутствие скрутки.", t3: "Минимальное вмешательство.", quiz: [{q: "Какая обжарка у белого чая?", o: ["Сильная", "Слабая", "Её нет (солнечная сушка)"], c: 2}] },
        { id: "m4_4", title: "Хранение", t1: "Года делают его лучше.", t2: "Трансформация вкуса.", t3: "Лечебные свойства.", quiz: [{q: "Что происходит при старении?", o: ["Становится лучше", "Портится за год", "Теряет вкус"], c: 0}] },
        { id: "m4_5", title: "Польза", t1: "Антиоксиданты.", t2: "Охлаждающий эффект.", t3: "Витамины.", quiz: [{q: "Главный регион производства?", o: ["Аньси", "Фудин", "Тайвань"], c: 1}] },
  ]},
  { id: "sec_5", title: "05. Улуны", modules: [
        { id: "m5_1", title: "Те Гуань Инь", t1: "Железная Бодхисаттва Милосердия.", t2: "Светлый улун сферической скрутки.", t3: "Аромат сирени и свежего молока.", quiz: [{q: "К какому виду он относится?", o: ["Темный улун", "Светлый улун", "Красный чай"], c: 1}] },
        { id: "m5_2", title: "Да Хун Пао", t1: "Большой Красный Халат.", t2: "Темный утесный улун из гор Уи.", t3: "Прожарка на углях дает вкус огня.", quiz: [{q: "Где растет Да Хун Пао?", o: ["Горы Уишань", "Аньси", "Юньнань"], c: 0}] },
        { id: "m5_3", title: "Скрутка листа", t1: "Сферическая (шарики) — южные улуны.", t2: "Продольная (полоски) — северные.", t3: "Степень скрутки влияет на экстракцию.", quiz: [{q: "Какая скрутка у Те Гуань Инь?", o: ["Продольная", "Прессованная", "Сферическая"], c: 2}] },
        { id: "m5_4", title: "Габа чаи", t1: "Ферментация в азотной среде.", t2: "Повышенное содержание ГАМК.", t3: "Успокаивает и концентрирует мозг.", quiz: [{q: "Что уникального в этом чае?", o: ["Витамин С", "ГАМК (GABA)", "Кофеин"], c: 1}] },
        { id: "m5_5", title: "Аромат", t1: "Улуны — самые ароматные чаи.", t2: "Метод производства: встряхивание.", t3: "Эфирные масла выходят на края.", quiz: [{q: "Насколько они ароматны?", o: ["Самые ароматные", "Слабый аромат", "Пахнут рыбой"], c: 0}] },
  ]},
  { id: "sec_6", title: "06. Красный чай", modules: [
        { id: "m6_1", title: "Дянь Хун", t1: "Юньнаньский красный чай.", t2: "Вкус хлеба, меда и шоколада.", t3: "Много золотистых почек.", quiz: [{q: "Какой это регион?", o: ["Фуцзянь", "Юньнань", "Сычуань"], c: 1}] },
        { id: "m6_2", title: "Сяо Чжун", t1: "Дымная сушка.", t2: "История сорта.", t3: "Копченые ноты.", quiz: [{q: "Какой у него характерный запах?", o: ["Ягоды", "Цветы", "Дым и костер"], c: 2}] },
        { id: "m6_3", title: "Окисление", t1: "Биохимия.", t2: "Темный настой.", t3: "Прогрев.", quiz: [{q: "Степень окисления красного чая?", o: ["Полное", "Частичное", "Без окисления"], c: 0}] },
        { id: "m6_4", title: "Названия", t1: "В Европе это 'Черный чай'.", t2: "В Китае — 'Красный' по цвету настоя.", t3: "Важно не путать термины.", quiz: [{q: "Как его называют в Китае?", o: ["Зеленый", "Черный", "Красный"], c: 2}] },
        { id: "m6_5", title: "Польза", t1: "Сильно согревает организм.", t2: "Улучшает кровообращение.", t3: "Идеален для зимнего времени.", quiz: [{q: "Как он влияет на тело?", o: ["Охлаждает", "Сильно согревает", "Нейтрален"], c: 1}] },
  ]},
  { id: "sec_7", title: "07. Пуэр: Шу и Шен", modules: [
        { id: "m7_1", title: "Шен Пуэр", t1: "Зеленый пуэр естественного старения.", t2: "Вкус сухофруктов, дыма и травы.", t3: "Дает сильное 'чайное состояние'.", quiz: [{q: "Какой цвет настоя у молодого Шена?", o: ["Светлый (зеленый)", "Нефтяной", "Красный"], c: 0}] },
        { id: "m7_2", title: "Шу Пуэр", t1: "Черный пуэр ускоренной ферментации.", t2: "Землистый, ореховый, древесный.", t3: "Очень мягкий и плотный настой.", quiz: [{q: "Какой профиль у Шу пуэра?", o: ["Цветочный", "Землистый и древесный", "Морской"], c: 1}] },
        { id: "m7_3", title: "Во Дуй", t1: "Технология влажного скирдования.", t2: "Лист накрывают тканью и поливают.", t3: "Процесс занимает 45-60 дней.", quiz: [{q: "Что такое Во Дуй?", o: ["Прожарка", "Скрутка", "Влажное скирдование"], c: 2}] },
        { id: "m7_4", title: "Прессовка", t1: "Традиционная форма — блин 357г.", t2: "Бывают кирпичи, грибы и точи.", t3: "Легкость транспортировки.", quiz: [{q: "Классический вес блина?", o: ["357г", "100г", "250г"], c: 0}] },
        { id: "m7_5", title: "Хранение", t1: "Пуэр — живой продукт.", t2: "Нужен доступ воздуха и влажность.", t3: "Нельзя хранить в шкафу со специями.", quiz: [{q: "Как правильно хранить?", o: ["В вакууме", "С доступом воздуха", "В холодильнике"], c: 1}] },
  ]},
  { id: "sec_8", title: "08. Посуда", modules: [
        { id: "m8_1", title: "Гайвань", t1: "Крышка, чаша, блюдце.", t2: "Крышка — Небо, блюдце — Земля.", t3: "Мастер — человек посередине.", quiz: [{q: "Что это такое?", o: ["Чашка с крышкой", "Чайник", "Деревянный поднос"], c: 0}] },
        { id: "m8_2", title: "Исинский чайник", t1: "Пористая глина из города Исин.", t2: "Впитывает эфирные масла годами.", t3: "Один чайник — под один вид чая.", quiz: [{q: "Из чего он сделан?", o: ["Стекло", "Исинская глина", "Фарфор"], c: 1}] },
        { id: "m8_3", title: "Чахай", t1: "Справедливая чаша.", t2: "Выравнивает крепость чая.", t3: "В пиалы попадает одинаковый вкус.", quiz: [{q: "Зачем нужен Чахай?", o: ["Для охлаждения", "Для красоты", "Выравнивание крепости"], c: 2}] },
        { id: "m8_4", title: "Пиалы", t1: "Маленький объем для концентрации.", t2: "Материал: фарфор, керамика, стекло.", t3: "Форма влияет на восприятие аромата.", quiz: [{q: "Какой у них объем?", o: ["Маленький", "Средний", "Большой"], c: 0}] },
        { id: "m8_5", title: "Уход", t1: "Только вода.", t2: "Никаких моющих средств.", t3: "Тщательная просушка после смены.", quiz: [{q: "Как мыть чайную посуду?", o: ["С мылом", "Только горячей водой", "В посудомойке"], c: 1}] },
  ]},
  { id: "sec_9", title: "09. Сервис", modules: [
        { id: "m9_1", title: "Встреча гостя", t1: "Улыбка и зрительный контакт.", t2: "Приветствие в первые 5 секунд.", t3: "Расположение гостя к диалогу.", quiz: [{q: "Главное при встрече?", o: ["Улыбка и контакт", "Строгость", "Игнор до заказа"], c: 0}] },
        { id: "m9_2", title: "Выявление вкуса", t1: "Задавайте открытые вопросы.", t2: "Спрашивайте о желаемом состоянии.", t3: "Предлагайте 2-3 варианта на выбор.", quiz: [{q: "Как понять гостя?", o: ["Молча налить", "Задать вопросы", "Дать меню"], c: 1}] },
        { id: "m9_3", title: "Подача", t1: "Пиалу подаем двумя руками.", t2: "Следим за уровнем воды в чайнике.", t3: "Мастер всегда незаметен, но рядом.", quiz: [{q: "Как подавать пиалу?", o: ["Одной левой", "Одной правой", "Двумя руками"], c: 2}] },
        { id: "m9_4", title: "Чистота", t1: "Чабань всегда сухая.", t2: "Никаких крошек листа на столе.", t3: "Порядок — это часть церемонии.", quiz: [{q: "Правило чабани?", o: ["Она всегда сухая", "Можно оставить лужи", "Убираем раз в день"], c: 0}] },
        { id: "m9_5", title: "Прощание", t1: "Поблагодарите за визит.", t2: "Пригласите вернуться снова.", t3: "Подарите доброе пожелание.", quiz: [{q: "Что делаем при уходе гостя?", o: ["Просто киваем", "Искренне прощаемся", "Молча убираем стол"], c: 1}] },
  ]},
  { id: "sec_10", title: "10. Аттестация", modules: [
        { id: "m10_1", title: "Теория", t1: "Проверка всех знаний по ботанике.", t2: "История сортов и регионов.", t3: "Химия и воздействие на организм.", quiz: [{q: "Что нужно сдать?", o: ["Всю базу знаний", "Только цены", "Только названия сортов"], c: 0}] },
        { id: "m10_2", title: "Практика", t1: "Техника работы с гайванью.", t2: "Контроль температуры воды.", t3: "Плавность и красота движений.", quiz: [{q: "Что главное в практике?", o: ["Скорость", "Плавность и техника", "Количество чая"], c: 1}] },
        { id: "m10_3", title: "Слепая дегустация", t1: "Узнать чай только по аромату.", t2: "Описать вкусовой профиль.", t3: "Назвать примерную цену за 100г.", quiz: [{q: "В чем суть этого этапа?", o: ["Узнать сорт по цвету", "Узнать по форме", "Узнать вслепую по аромату"], c: 2}] },
        { id: "m10_4", title: "Работа в зале", t1: "Обслуживание нескольких столов.", t2: "Коммуникация в стрессе.", t3: "Знание кассовой дисциплины.", quiz: [{q: "Что проверяется в зале?", o: ["Реальное обслуживание", "Мытье полов", "Работа курьером"], c: 0}] },
        { id: "m10_5", title: "Статус Мастера", t1: "Получение фирменного значка.", t2: "Право проводить церемонии.", t3: "Вход в элиту сообщества HUB.", quiz: [{q: "Что дает успешная сдача?", o: ["Скидку", "Право проводить церемонии", "Новую форму"], c: 1}] },
  ]},
];

const INITIAL_ROUTE = [
  { id: "route_1", title: "О компании и бренде", time: "3 мин", content: "Мы — Tea Master Store. Наша цель: сделать чайную культуру доступной." },
  { id: "route_2", title: "Работа с кассой", time: "5 мин", content: "Открытие смены в 09:50. Работа в системе учета." },
  { id: "route_3", title: "Как рассказывать о чае", time: "7 мин", content: "Не грузи гостя терминами. Спрашивай о чувствах." },
  { id: "route_4", title: "Стандарты сервиса", time: "4 мин", content: "Подача пиалы двумя руками. Улыбка — это база." },
  { id: "route_5", title: "Чистота и посуда", time: "5 мин", content: "Гайвани — до блеска. Чабань всегда должна быть сухой." }
];

// --- СТИЛИ ---
const wideChartCard: React.CSSProperties = { background: '#161816', padding: '45px', borderRadius: '40px', border: '1px solid #222', marginBottom: '40px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' };
const rankBadge: React.CSSProperties = { background: 'rgba(10,186,181,0.08)', color: '#0abab5', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', fontSize: '13px', border: '1px solid rgba(10,186,181,0.2)' };
const dashboardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px', width: '100%' };
const statCardMain: React.CSSProperties = { background: '#161816', padding: '35px', borderRadius: '35px', border: '1px solid #222', boxSizing: 'border-box' };
const cardHeaderLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1.5px', marginBottom: '15px' };
const bigStatVal: React.CSSProperties = { fontSize: '48px', fontWeight: '900', color: '#fff' };
const cardSubText: React.CSSProperties = { fontSize: '14px', opacity: 0.5, marginBottom: '25px' };
const segmentedBar: React.CSSProperties = { display: 'flex', gap: '8px', height: '10px', marginTop: '10px', width: '100%' };
const segment = (active: boolean): React.CSSProperties => ({ flex: 1, background: active ? '#0abab5' : '#000', borderRadius: '5px', transition: '0.3s' });
const sectionTitle: React.CSSProperties = { fontSize: '28px', fontWeight: '900', marginBottom: '35px' };

const courseGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', width: '100%', boxSizing: 'border-box' };

const courseCard: React.CSSProperties = { background: '#161816', borderRadius: '35px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #222', transition: '0.3s', position:'relative', minWidth: '0' }; 
const cardImgMock: React.CSSProperties = { height: '80px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const pBarBg: React.CSSProperties = { height: '10px', background: '#000', borderRadius: '20px', marginTop: '20px' };
const pBarFill = (w: number): React.CSSProperties => ({ width: `${w}%`, height: '100%', background: '#0abab5', borderRadius: '20px', transition: '1s' });
const cardFooter: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px', fontWeight: '800', opacity: 0.4 };
const backLink: React.CSSProperties = { color: '#0abab5', fontWeight: '900', marginBottom: '30px', cursor: 'pointer', display: 'inline-block', fontSize: '15px' };
const topicRow: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '25px 30px', background: '#161816', borderRadius: '25px', border: '1px solid #222', cursor: 'pointer', transition: '0.2s', marginBottom: '10px', position: 'relative', width: '100%', boxSizing: 'border-box' };
const checkIcon = (done: boolean): React.CSSProperties => ({ width: '28px', height: '28px', border: '2px solid #0abab5', borderRadius: '50%', marginRight: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0abab5', fontWeight: '900', background: done ? 'rgba(10,186,181,0.1)' : 'transparent', flexShrink: 0 });
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', padding: '20px', boxSizing: 'border-box' };
const modalContent: React.CSSProperties = { background: '#000', padding: '60px', borderRadius: '50px', maxWidth: '1100px', width: '100%', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' };
const modalContentSmall: React.CSSProperties = { background: '#161816', padding: '40px', borderRadius: '40px', width: '100%', maxWidth: '400px', border: '1px solid #333' };
const theoryBlock: React.CSSProperties = { background: '#0d0d0d', padding: '30px', borderRadius: '25px', border: '1px solid #222' };
const theoryLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '900', color: '#0abab5', letterSpacing: '2px', marginBottom: '15px' };
const theoryText: React.CSSProperties = { fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0 };
const checkKnowledgeBtn: React.CSSProperties = { width: '100%', padding: '25px', background: 'transparent', border: '2px solid #0abab5', color: '#0abab5', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', transition: '0.3s' };
const quizBox: React.CSSProperties = { borderTop: '1px solid #222', paddingTop: '40px', marginTop: '10px' };
const flexSpace: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' };

const ansBtn = (active: boolean, isCorrect: boolean): React.CSSProperties => ({ padding: '20px 30px', background: active ? (isCorrect ? '#0abab5' : '#ff4d4d') : '#111', color: active ? (isCorrect ? '#000' : '#fff') : '#fff', borderRadius: '18px', cursor: 'pointer', border: '1px solid #222', fontWeight: '800', marginBottom: '12px', transition: '0.2s' });

const errorOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 40000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' };
const errorModalContent: React.CSSProperties = { background: '#111', padding: '50px', borderRadius: '40px', border: '2px solid #ff4d4d', textAlign: 'center', maxWidth: '450px', boxShadow: '0 20px 50px rgba(255, 77, 77, 0.15)' };
const errorBtnStyle: React.CSSProperties = { background: '#ff4d4d', color: '#fff', border: 'none', padding: '18px 40px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', letterSpacing: '1px', marginTop: '15px' };

const adminIn: React.CSSProperties = { width: '100%', padding: '16px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '15px', outline: 'none', fontSize: '15px' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '20px', background: '#0abab5', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', marginTop: '10px', fontSize: '16px' };
const adminActionBtn: React.CSSProperties = { background: 'rgba(10,186,181,0.1)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.3)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', transition: '0.2s' };
const editIconStyle: React.CSSProperties = { background: '#111', color: '#0abab5', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };
const delIconStyle: React.CSSProperties = { background: '#111', color: '#ff4d4d', border: '1px solid #222', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: '0.2s', flexShrink: 0 };

function ShiftContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeFormData, setRouteFormData] = useState({ id: '', title: '', time: '', content: '' });
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionFormData, setSectionFormData] = useState({ id: '', title: '' });
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({
      id: '', title: '', t1: '', t2: '', t3: '',
      quiz: [{ q: '', o: ['', '', ''], c: 0 }] 
  });
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const [dynamicBasics, setDynamicBasics] = useState<any[]>([]);
  const [dynamicRoute, setDynamicRoute] = useState<any[]>([]);
  const [completedRoute, setCompletedRoute] = useState<string[]>([]);
  const [completedBasics, setCompletedBasics] = useState<string[]>([]);
  
  const [urgentFiles, setUrgentFiles] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const [selectedRouteStep, setSelectedRouteStep] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [moduleView, setModuleView] = useState<'content' | 'quiz'>('content');

  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const loadAllData = async (currentUserId: string) => {
      try {
          const sFiles = await fetch('/api/storage?key=' + STORAGE_KEYS.URGENT_FILES).then(r => r.json()).catch(() => []);
          setUrgentFiles(Array.isArray(sFiles) ? sFiles : []);

          const cRoute = await fetch(`/api/storage?key=prog_route_${currentUserId}`).then(r => r.json()).catch(() => []);
          setCompletedRoute(Array.isArray(cRoute) ? cRoute : []);

          const cBasics = await fetch(`/api/storage?key=prog_basics_${currentUserId}`).then(r => r.json()).catch(() => []);
          setCompletedBasics(Array.isArray(cBasics) ? cBasics : []);

          let sBasics = await fetch('/api/storage?key=' + STORAGE_KEYS.DYNAMIC_BASICS).then(r => r.json()).catch(() => []);
          if (!Array.isArray(sBasics) || sBasics.length === 0) {
              sBasics = INITIAL_BASICS;
              saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, sBasics);
          }
          setDynamicBasics(sBasics);

          let sRoute = await fetch('/api/storage?key=' + STORAGE_KEYS.DYNAMIC_ROUTE).then(r => r.json()).catch(() => []);
          if (!Array.isArray(sRoute) || sRoute.length === 0) {
              sRoute = INITIAL_ROUTE;
              saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, sRoute);
          }
          setDynamicRoute(sRoute);
      } catch (e) {
          console.error("Ошибка синхронизации с сервером", e);
      }
  };

  useEffect(() => {
    setIsMounted(true);
    
    const role = localStorage.getItem('userRole');
    const currentId = localStorage.getItem('current_user_id') || 'guest';
    setIsAdmin(role === 'admin');
    setUserId(currentId);

    loadAllData(currentId);

    const urlTab = searchParams.get('tab');
    if (urlTab) setActiveTab(urlTab);

    const loadUrlParams = async () => {
        const sBasics = await fetch('/api/storage?key=' + STORAGE_KEYS.DYNAMIC_BASICS).then(r => r.json()).catch(() => INITIAL_BASICS);
        const sRoute = await fetch('/api/storage?key=' + STORAGE_KEYS.DYNAMIC_ROUTE).then(r => r.json()).catch(() => INITIAL_ROUTE);
        
        const sectionId = searchParams.get('sectionId');
        const moduleId = searchParams.get('moduleId');
        const routeId = searchParams.get('routeId');

        if (sectionId) {
            const foundSection = sBasics.find((s: any) => s.id === sectionId);
            if (foundSection) {
                setSelectedSection(foundSection);
                if (moduleId) {
                    const foundModule = foundSection.modules?.find((m: any) => m.id === moduleId);
                    if (foundModule) {
                        setSelectedModule(foundModule);
                        setModuleView('content');
                    }
                }
            }
        }

        if (routeId) {
            const foundRoute = sRoute.find((r: any) => r.id === routeId);
            if (foundRoute) {
                setSelectedRouteStep(foundRoute);
            }
        }
    };
    loadUrlParams();

    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('sidebarToggle', handleToggle);
    
    const syncInterval = setInterval(() => loadAllData(currentId), 5000);
    const focusHandler = () => loadAllData(currentId);
    window.addEventListener('focus', focusHandler);

    return () => {
        window.removeEventListener('sidebarToggle', handleToggle);
        clearInterval(syncInterval);
        window.removeEventListener('focus', focusHandler);
    };
  }, [searchParams]);

  const handleSaveRoute = () => {
    if (!routeFormData.title.trim()) return;
    let newList = [...dynamicRoute];
    if (routeFormData.id) {
        newList = newList.map(r => r.id === routeFormData.id ? routeFormData : r);
    } else {
        newList.push({ ...routeFormData, id: 'route_' + Date.now() });
    }
    setDynamicRoute(newList);
    saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, newList);
    setShowRouteForm(false);
  };

  const handleDeleteRoute = () => {
    if (!routeToDelete) return;
    const newList = dynamicRoute.filter(r => r.id !== routeToDelete);
    setDynamicRoute(newList);
    saveDataToServer(STORAGE_KEYS.DYNAMIC_ROUTE, newList);
    setRouteToDelete(null);
  };

  const handleSaveSection = () => {
      if (!sectionFormData.title.trim()) return;
      let newList = [...dynamicBasics];
      if (sectionFormData.id) {
          newList = newList.map(s => s.id === sectionFormData.id ? { ...s, title: sectionFormData.title } : s);
      } else {
          newList.push({ id: 'sec_' + Date.now(), title: sectionFormData.title, modules: [] });
      }
      setDynamicBasics(newList);
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setShowSectionForm(false);
  };

  const handleDeleteSection = () => {
      if (!sectionToDelete) return;
      const newList = dynamicBasics.filter(s => s.id !== sectionToDelete);
      setDynamicBasics(newList);
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setSectionToDelete(null);
  };

  const updateQuizQuestion = (index: number, field: string, value: any) => {
      const newQuiz = [...moduleFormData.quiz];
      if (field === 'q') newQuiz[index].q = value;
      if (field === 'c') newQuiz[index].c = value;
      if (field.startsWith('o')) {
          const oIndex = parseInt(field.replace('o', ''));
          newQuiz[index].o[oIndex] = value;
      }
      setModuleFormData({...moduleFormData, quiz: newQuiz});
  };

  const addQuizQuestion = () => {
      setModuleFormData({
          ...moduleFormData, 
          quiz: [...moduleFormData.quiz, { q: '', o: ['', '', ''], c: 0 }]
      });
  };

  const removeQuizQuestion = (index: number) => {
      const newQuiz = moduleFormData.quiz.filter((_, i) => i !== index);
      setModuleFormData({...moduleFormData, quiz: newQuiz});
  };

  const handleSaveModule = () => {
      if (!moduleFormData.title.trim() || !selectedSection) return;
      
      const newModule = {
          id: moduleFormData.id || ('m_' + Date.now()),
          title: moduleFormData.title,
          t1: moduleFormData.t1,
          t2: moduleFormData.t2,
          t3: moduleFormData.t3,
          quiz: moduleFormData.quiz.map(q => ({
              q: q.q || 'Без вопроса?',
              o: [q.o[0] || 'Да', q.o[1] || 'Нет', q.o[2] || 'Не знаю'],
              c: q.c
          }))
      };

      const newList = dynamicBasics.map(s => {
          if (s.id === selectedSection.id) {
              let updatedModules = [...(s.modules || [])];
              if (moduleFormData.id) {
                  updatedModules = updatedModules.map((m:any) => m.id === moduleFormData.id ? newModule : m);
              } else {
                  updatedModules.push(newModule);
              }
              return { ...s, modules: updatedModules };
          }
          return s;
      });

      setDynamicBasics(newList);
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setSelectedSection(newList.find(s => s.id === selectedSection.id));
      setShowModuleForm(false);
  };

  const handleDeleteModule = () => {
      if (!moduleToDelete || !selectedSection) return;
      const newList = dynamicBasics.map(s => {
          if (s.id === selectedSection.id) {
              return { ...s, modules: s.modules.filter((m:any) => m.id !== moduleToDelete) };
          }
          return s;
      });
      setDynamicBasics(newList);
      saveDataToServer(STORAGE_KEYS.DYNAMIC_BASICS, newList);
      setSelectedSection(newList.find(s => s.id === selectedSection.id));
      setModuleToDelete(null);
  };

  const handleRouteComplete = (id: string) => {
    if (!completedRoute.includes(id)) {
        const newProg = [...completedRoute, id];
        setCompletedRoute(newProg);
        saveDataToServer(`prog_route_${userId}`, newProg);
    }
    setSelectedRouteStep(null);
  };

  const handleQuizAnswer = (idx: number) => {
    if (activeAnswer !== null) return; 
    
    setActiveAnswer(idx);
    
    if (idx === selectedModule.quiz[currentQuizStep].c) {
        if (currentQuizStep < selectedModule.quiz.length - 1) {
            setTimeout(() => { 
                setCurrentQuizStep(v => v + 1); 
                setActiveAnswer(null); 
            }, 500);
        } else {
            if (!completedBasics.includes(selectedModule.id)) {
                const newComp = [...completedBasics, selectedModule.id];
                setCompletedBasics(newComp);
                saveDataToServer(`prog_basics_${userId}`, newComp);
            }
            setTimeout(() => { 
                setSelectedModule(null); 
                setModuleView('content'); 
                setCurrentQuizStep(0); 
                setActiveAnswer(null); 
            }, 600);
        }
    } else { 
        setTimeout(() => {
            setShowErrorModal(true); 
            setActiveAnswer(null); 
        }, 400); 
    }
  };

  const handleDownloadFile = (file: any) => {
      if (!file.data) {
          alert("Этот файл был загружен в старой версии платформы и содержит только название.");
          return;
      }
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (!isMounted) return null;

  const totalBasicsModules = dynamicBasics.reduce((acc, s) => acc + (s.modules?.length || 0), 0);
  const routePercent = Math.round((completedRoute.length / (dynamicRoute.length || 1)) * 100);
  const basicsPercent = Math.round((completedBasics.length / (totalBasicsModules || 1)) * 100);
  const totalHubPercent = basicsPercent;

  let cumulativeModulesDone = 0;
  const chartPoints = [0]; 
  dynamicBasics.forEach((sec) => {
      const doneInSec = sec.modules?.filter((m:any) => completedBasics.includes(m.id)).length || 0;
      cumulativeModulesDone += doneInSec;
      chartPoints.push((cumulativeModulesDone / (totalBasicsModules || 1)) * 100);
  });

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#fff', display: 'flex', transition: '0.3s', overflowX: 'hidden' }}>
      <Navigation />
      <div style={{ width: isSidebarOpen ? '260px' : '0', transition: '0.3s', flexShrink: 0 }} />

      <main style={{ flex: 1, padding: '120px 60px 60px 60px', transition: '0.3s', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        
        {activeTab === 'welcome' && (
            <div style={{ animation: 'fadeInUp 0.6s ease' }}>
                <h1 style={{fontSize:'36px', fontWeight:'900', marginBottom:'40px'}}>Центр управления мастером</h1>
                
                <section style={wideChartCard}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'40px', flexWrap: 'wrap', gap:'20px'}}>
                        <div>
                            <div style={{fontSize:'11px', fontWeight:'900', color:'#0abab5', letterSpacing:'2px', marginBottom:'8px', textTransform:'uppercase'}}>ОБЩАЯ ДИНАМИКА РАЗВИТИЯ</div>
                            <div style={{fontSize:'48px', fontWeight:'900', color:'#fff', display:'flex', alignItems:'baseline', gap:'12px'}}>
                                {totalHubPercent}% <span style={{fontSize:'15px', opacity:0.4, fontWeight:'500'}}>общего прогресса HUB</span>
                            </div>
                        </div>
                        <div style={rankBadge}>{totalHubPercent < 40 ? '🌱 НОВИЧОК' : totalHubPercent < 80 ? '⚖️ ЭРУДИТ' : '🏮 МАСТЕР'}</div>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: '40px', marginBottom: '20px' }}>
                        {[0, 20, 40, 60, 80, 100].map(v => (
                            <div key={v} style={{ position: 'absolute', bottom: `${v}%`, left: 0, width: '100%', borderBottom: '1px dashed rgba(255,255,255,0.05)', zIndex: 1 }} />
                        ))}
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0abab5" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#0abab5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={`M 0 100 ${chartPoints.map((p, i) => `L ${i * 10} ${100 - p}`).join(' ')} L 100 100 Z`} fill="url(#glowGrad)" style={{ transition: '1s ease' }} />
                            <path d={`M ${chartPoints.map((p, i) => `${i * 10} ${100 - p}`).join(' L ')}`} fill="none" stroke="#0abab5" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ transition: '1s ease' }} />
                        </svg>
                        {chartPoints.map((p, i) => (
                            <div key={`dot-${i}`} style={{ position: 'absolute', left: `${i * 10}%`, bottom: `${p}%`, transform: 'translate(-50%, 50%)', width: '16px', height: '16px', borderRadius: '50%', background: '#161816', border: '4px solid #0abab5', zIndex: 3, transition: '1s ease', boxShadow: '0 0 10px rgba(10,186,181,0.5)' }} />
                        ))}
                        {['Старт', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].map((lbl, i) => (
                            <div key={`lbl-${i}`} style={{ position: 'absolute', left: `${i * 10}%`, bottom: '-35px', transform: 'translateX(-50%)', fontSize: '11px', color: '#666', fontWeight: '800' }}>{lbl}</div>
                        ))}
                    </div>
                </section>

                <div style={dashboardGrid}>
                      <div style={statCardMain}>
                         <div style={cardHeaderLabel}>ПЛАН НА НЕДЕЛЮ</div>
                         <div style={bigStatVal}>{completedRoute.length} <span style={{fontSize:'20px', opacity:0.4}}>/ {dynamicRoute.length}</span></div>
                         <p style={cardSubText}>шагов пройдено</p>
                          <div style={segmentedBar}>{dynamicRoute.map((step, i) => (<div key={i} style={segment(completedRoute.includes(step.id))} />))}</div>
                      </div>
                      
                      <div style={statCardMain}>
                         <div style={cardHeaderLabel}>БАЗА ЗНАНИЙ</div>
                         <div style={bigStatVal}>{basicsPercent}%</div>
                         <p style={cardSubText}>пройдено тем обучения</p>
                         <div style={pBarBg}><div style={pBarFill(basicsPercent)} /></div>
                      </div>
                </div>
            </div>
        )}

        {activeTab === 'edu' && (
          <section style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '100%' }}>
             {!selectedSection ? (
               <>
                  <div style={{ marginBottom: '60px', width: '100%', boxSizing: 'border-box' }}>
                      <div style={flexSpace}>
                          <h2 style={{ ...sectionTitle, color: '#0abab5', margin: 0 }}>⚠️ Срочно к прохождению</h2>
                      </div>
                      {urgentFiles.length > 0 ? (
                          <div style={courseGrid}> 
                              {urgentFiles.map((file) => (
                                  <div key={file.id} style={{ ...courseCard, background: '#161816', border: '1px solid #0abab5', padding: '25px', display: 'flex', flexDirection: 'column', minHeight: '160px' }}>
                                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#0abab5' }} />
                                      <div style={{ fontSize: '11px', color: '#0abab5', fontWeight: '900', marginBottom: '10px', opacity: 0.8 }}>{file.date}</div>
                                      <h4 style={{ margin: '0 0 10px 0', fontSize: '17px', fontWeight: '900', wordBreak: 'break-word', color: '#fff', flex: 1 }}>📄 {file.name}</h4>
                                      <div style={{ color: '#555', fontSize: '12px', marginBottom: '15px' }}>{file.size}</div>
                                      
                                      <div style={{ display: 'flex', gap: '20px' }}>
                                          <div onClick={() => setPreviewFile(file)} style={{ color: '#0abab5', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>ОТКРЫТЬ</div>
                                          <div onClick={() => handleDownloadFile(file)} style={{ color: '#0abab5', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>СКАЧАТЬ ↓</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div style={{ marginTop: '20px', color: '#666', fontSize: '14px', background: '#111', padding: '30px', borderRadius: '30px', border: '1px dashed #222', textAlign: 'center' }}>
                              Пока нет файлов для срочного изучения.
                          </div>
                      )}
                  </div>

                  {/* 1. ПЛАН НА НЕДЕЛЮ */}
                  <div style={flexSpace}>
                     <h2 style={sectionTitle}>1. Твой план на неделю</h2>
                     {isAdmin && <button onClick={() => { setRouteFormData({ id: '', title: '', time: '', content: '' }); setShowRouteForm(true); }} style={adminActionBtn}>+ НОВЫЙ ШАГ</button>}
                  </div>
                  
                  <div style={{ ...courseGrid, marginBottom: '60px' }}>
                     {dynamicRoute.map((step, idx) => {
                        const isDone = completedRoute.includes(step.id);
                        return (
                           <div key={step.id} onClick={() => setSelectedRouteStep(step)} style={courseCard}>
                              {isAdmin && (
                                  <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                      <div onClick={(e) => { e.stopPropagation(); setRouteFormData(step); setShowRouteForm(true); }} style={editIconStyle}>✎</div>
                                      <div onClick={(e) => { e.stopPropagation(); setRouteToDelete(step.id); }} style={delIconStyle}>✕</div>
                                  </div>
                              )}
                              <div style={cardImgMock} />
                              <div style={{padding:'25px'}}>
                                 <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900'}}>Шаг 0{idx+1}</span>
                                 <h4 style={{fontSize:'18px', margin:'12px 0', fontWeight:'800', wordBreak: 'break-word'}}>{stripEmoji(step.title)}</h4>
                                 <div style={pBarBg}><div style={pBarFill(isDone ? 100 : 0)} /></div>
                                 <div style={cardFooter}><span>{isDone ? 'Выполнено' : 'Начать'}</span><span>{step.time}</span></div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* 2. КАТАЛОГ КУРСОВ */}
                  <div style={flexSpace}>
                      <h2 style={sectionTitle}>2. Каталог курсов (Основы)</h2>
                      {isAdmin && <button onClick={() => { setSectionFormData({ id: '', title: '' }); setShowSectionForm(true); }} style={adminActionBtn}>+ НОВЫЙ РАЗДЕЛ</button>}
                  </div>
                  
                  <div style={courseGrid}>
                     {dynamicBasics.map((sec) => {
                        const doneCount = sec.modules?.filter((m:any) => completedBasics.includes(m.id)).length || 0;
                        const progress = sec.modules?.length ? Math.round((doneCount / sec.modules.length) * 100) : 0;
                        return (
                          <div key={sec.id} onClick={() => setSelectedSection(sec)} style={courseCard}>
                             {isAdmin && (
                                  <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                      <div onClick={(e) => { e.stopPropagation(); setSectionFormData({id: sec.id, title: sec.title}); setShowSectionForm(true); }} style={editIconStyle}>✎</div>
                                      <div onClick={(e) => { e.stopPropagation(); setSectionToDelete(sec.id); }} style={delIconStyle}>✕</div>
                                  </div>
                              )}
                             <div style={cardImgMock} />
                             <div style={{padding:'25px'}}>
                                <span style={{fontSize:'12px', color:'#0abab5', fontWeight:'900'}}>Раздел</span>
                                <h4 style={{fontSize:'18px', margin:'12px 0', fontWeight:'800', wordBreak: 'break-word'}}>{stripEmoji(sec.title)}</h4>
                                <div style={pBarBg}><div style={pBarFill(progress)} /></div>
                                <div style={cardFooter}><span>{sec.modules?.length || 0} Тем</span><span style={{color: '#0abab5'}}>{progress}%</span></div>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </>
             ) : (
               <div style={{animation: 'fadeInUp 0.4s ease', maxWidth: '100%'}}>
                  <div onClick={() => setSelectedSection(null)} style={backLink}>← Назад к обучению</div>
                  
                  <div style={flexSpace}>
                      <h2 style={{fontSize:'36px', color:'#0abab5', fontWeight:'900', margin: 0}}>{stripEmoji(selectedSection.title)}</h2>
                      {isAdmin && <button onClick={() => { 
                          setModuleFormData({ 
                              id: '', title: '', t1: '', t2: '', t3: '', 
                              quiz: [{ q: '', o: ['', '', ''], c: 0 }] 
                          }); 
                          setShowModuleForm(true); 
                      }} style={adminActionBtn}>+ НОВЫЙ УРОК</button>}
                  </div>
                  
                  <div style={{display:'flex', flexDirection:'column', gap:'15px', width: '100%'}}>
                     {selectedSection.modules?.length === 0 && <div style={{color: '#666'}}>Уроков пока нет.</div>}
                     {selectedSection.modules?.map((m:any) => {
                        const isDone = completedBasics.includes(m.id);
                        return (
                          <div key={m.id} onClick={() => { setSelectedModule(m); setModuleView('content'); }} style={topicRow}>
                             {isAdmin && (
                                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '25px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                      <div onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setModuleFormData({
                                              id: m.id, title: m.title, t1: m.t1, t2: m.t2, t3: m.t3,
                                              quiz: m.quiz && m.quiz.length > 0 ? JSON.parse(JSON.stringify(m.quiz)) : [{ q: '', o: ['', '', ''], c: 0 }]
                                          }); 
                                          setShowModuleForm(true); 
                                      }} style={{...editIconStyle, width: '30px', height: '30px'}}>✎</div>
                                      <div onClick={(e) => { e.stopPropagation(); setModuleToDelete(m.id); }} style={{...delIconStyle, width: '30px', height: '30px'}}>✕</div>
                                  </div>
                             )}
                             <div style={checkIcon(isDone)}>{isDone ? '✓' : ''}</div>
                             <span style={{fontSize:'17px', fontWeight:'700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{stripEmoji(m.title)}</span>
                             {!isAdmin && <span style={{marginLeft:'auto', opacity:0.3, flexShrink: 0}}>→</span>}
                          </div>
                        );
                     })}
                  </div>
               </div>
             )}
          </section>
        )}

        {/* --- УМНОЕ ОКНО ПРЕДПРОСМОТРА ФАЙЛА --- */}
        {previewFile && (
            <div style={modalOverlay as any} onClick={() => setPreviewFile(null)}>
                <div style={{ ...modalContentSmall, maxWidth: '80%', height: '85vh', padding: '25px', display: 'flex', flexDirection: 'column' } as any} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                        <h2 style={{ color: '#0abab5', fontWeight: '900', fontSize: '18px', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile.name}</h2>
                        <div onClick={() => setPreviewFile(null)} style={{ cursor: 'pointer', fontSize: '24px', color: '#ff4d4d', fontWeight: 'bold', lineHeight: 1 }}>✕</div>
                    </div>
                    <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden' }}>
                        {previewFile.data ? (
                            /* Если файл - это Word, Excel или Архивы, выводим красивую заглушку */
                            previewFile.name.toLowerCase().match(/\.(docx|doc|xls|xlsx|ppt|pptx|zip|rar)$/i) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', textAlign: 'center', padding: '20px' }}>
                                    <div style={{ fontSize: '60px', marginBottom: '15px' }}>📄</div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Формат не поддерживается для просмотра</h3>
                                    <p style={{ color: '#555', fontSize: '14px', maxWidth: '350px', lineHeight: '1.5' }}>
                                        Браузеры не умеют открывать файлы Word и Excel прямо внутри сайта. Вы можете скачать этот файл для изучения.
                                    </p>
                                    <button onClick={() => handleDownloadFile(previewFile)} style={{ ...saveBtn, width: 'auto', padding: '12px 30px', marginTop: '20px', borderRadius: '12px' } as any}>СКАЧАТЬ ФАЙЛ</button>
                                </div>
                            ) : (
                                /* Иначе (PDF, Картинки, TXT) - просто открываем в iFrame */
                                <iframe src={previewFile.data} style={{ width: '100%', height: '100%', border: 'none' }} title="Предпросмотр файла" />
                            )
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#000', fontWeight: 'bold' }}>
                                Нет данных для отображения (загружено в старой версии)
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- МОДАЛКИ ДЛЯ АДМИНА --- */}

        {showRouteForm && (
            <div style={modalOverlay}>
                <div style={{...modalContent, maxWidth: '500px'}}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{routeFormData.id ? 'РЕДАКТОР ШАГА' : 'НОВЫЙ ШАГ ПЛАНА'}</h2>
                    <input style={adminIn} placeholder="Название шага" value={routeFormData.title} onChange={e => setRouteFormData({...routeFormData, title: e.target.value})} />
                    <input style={adminIn} placeholder="Время (напр. 5 мин)" value={routeFormData.time} onChange={e => setRouteFormData({...routeFormData, time: e.target.value})} />
                    <textarea style={{...adminIn, height: '140px'}} placeholder="Теория или описание задачи..." value={routeFormData.content} onChange={e => setRouteFormData({...routeFormData, content: e.target.value})} />
                    <button onClick={handleSaveRoute} style={saveBtn}>СОХРАНИТЬ ШАГ</button>
                    <div onClick={() => setShowRouteForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                </div>
            </div>
        )}

        {routeToDelete && (
            <div style={errorOverlayStyle}>
                <div style={errorModalContent}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ ШАГ?</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDeleteRoute} style={{...errorBtnStyle, flex: 1}}>УДАЛИТЬ</button>
                        <button onClick={() => setRouteToDelete(null)} style={{...errorBtnStyle, background: '#333', flex: 1}}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {showSectionForm && (
            <div style={modalOverlay}>
                <div style={{...modalContent, maxWidth: '500px'}}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{sectionFormData.id ? 'РЕДАКТОР РАЗДЕЛА' : 'НОВЫЙ РАЗДЕЛ'}</h2>
                    <input style={adminIn} placeholder="Название раздела" value={sectionFormData.title} onChange={e => setSectionFormData({...sectionFormData, title: e.target.value})} />
                    <button onClick={handleSaveSection} style={saveBtn}>СОХРАНИТЬ РАЗДЕЛ</button>
                    <div onClick={() => setShowSectionForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                </div>
            </div>
        )}

        {sectionToDelete && (
            <div style={errorOverlayStyle}>
                <div style={errorModalContent}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ РАЗДЕЛ?</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDeleteSection} style={{...errorBtnStyle, flex: 1}}>УДАЛИТЬ</button>
                        <button onClick={() => setSectionToDelete(null)} style={{...errorBtnStyle, background: '#333', flex: 1}}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {showModuleForm && (
            <div style={{...modalOverlay, alignItems: 'flex-start', padding: '40px 20px'}}>
                <div style={{...modalContent, maxWidth: '900px', margin: '0 auto'}}>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0abab5', fontWeight: '900' }}>{moduleFormData.id ? 'РЕДАКТОР УРОКА' : 'НОВЫЙ УРОК'}</h2>
                    <input style={adminIn} placeholder="Введите название..." value={moduleFormData.title} onChange={e => setModuleFormData({...moduleFormData, title: e.target.value})} />
                    
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', margin: '20px 0'}}>
                        <textarea style={{...adminIn, height: '120px'}} placeholder="Теория 1" value={moduleFormData.t1} onChange={e => setModuleFormData({...moduleFormData, t1: e.target.value})} />
                        <textarea style={{...adminIn, height: '120px'}} placeholder="Теория 2" value={moduleFormData.t2} onChange={e => setModuleFormData({...moduleFormData, t2: e.target.value})} />
                        <textarea style={{...adminIn, height: '120px'}} placeholder="Теория 3" value={moduleFormData.t3} onChange={e => setModuleFormData({...moduleFormData, t3: e.target.value})} />
                    </div>

                    <div style={{borderTop: '1px solid #222', paddingTop: '30px'}}>
                        <h3 style={{fontSize: '20px', color: '#0abab5', marginBottom: '25px', fontWeight: '900'}}>НАСТРОЙКА ТЕСТА</h3>
                        {moduleFormData.quiz.map((q, qIdx) => (
                            <div key={qIdx} style={{background: '#0d0f0d', padding: '25px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px', position: 'relative'}}>
                                {moduleFormData.quiz.length > 1 && <div onClick={() => removeQuizQuestion(qIdx)} style={{...delIconStyle, position: 'absolute', top: '15px', right: '15px'}}>✕</div>}
                                <input style={adminIn} placeholder="Текст вопроса..." value={q.q} onChange={e => updateQuizQuestion(qIdx, 'q', e.target.value)} />
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px'}}>
                                    {[0,1,2].map(i => (
                                        <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                            <label style={{display:'flex', gap:'5px', cursor:'pointer', color: q.c === i ? '#0abab5' : '#fff'}}><input type="radio" checked={q.c === i} onChange={() => updateQuizQuestion(qIdx, 'c', i)} /> Вариант {i+1}</label>
                                            <input style={{...adminIn, marginBottom: 0, borderColor: q.c === i ? '#0abab5' : '#222'}} placeholder={`Ответ ${i+1}`} value={q.o[i]} onChange={e => updateQuizQuestion(qIdx, `o${i}`, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={addQuizQuestion} style={{...adminActionBtn, width: '100%', padding: '15px', background: 'transparent'}}>+ ДОБАВИТЬ ЕЩЕ ВОПРОС</button>
                    </div>
                    <button onClick={handleSaveModule} style={{...saveBtn, marginTop: '30px'}}>СОХРАНИТЬ УРОК И ТЕСТ</button>
                    <div onClick={() => setShowModuleForm(false)} style={{ textAlign: 'center', marginTop: '25px', color: '#666', cursor: 'pointer', fontWeight: 'bold' }}>ОТМЕНА</div>
                </div>
            </div>
        )}

        {moduleToDelete && (
            <div style={{...errorOverlayStyle, zIndex: 50000}}>
                <div style={errorModalContent}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#ff4d4d', marginBottom: '15px', fontWeight: '900' }}>УДАЛИТЬ УРОК?</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDeleteModule} style={{...errorBtnStyle, flex: 1}}>УДАЛИТЬ</button>
                        <button onClick={() => setModuleToDelete(null)} style={{...errorBtnStyle, background: '#333', flex: 1}}>ОТМЕНА</button>
                    </div>
                </div>
            </div>
        )}

        {selectedModule && !showModuleForm && (
           <div style={modalOverlay}>
              <div style={modalContent}>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                    <div onClick={() => {setSelectedModule(null); setModuleView('content'); setCurrentQuizStep(0);}} style={{...backLink, margin:0}}>← НАЗАД</div>
                    <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(selectedModule.title)}</h2>
                    <div style={{width:'80px'}} />
                 </div>

                 {moduleView === 'content' ? (
                    <div style={{animation: 'fadeInUp 0.3s ease'}}>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px', marginBottom:'50px'}}>
                            {[selectedModule.t1, selectedModule.t2, selectedModule.t3].map((t, i) => (
                                <div key={i} style={theoryBlock}>
                                    <h3 style={theoryLabel}>ТЕОРИЯ {i+1}</h3>
                                    <p style={theoryText}>{t || "Информация раздела."}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setModuleView('quiz')} style={checkKnowledgeBtn}>ПРОВЕРИТЬ ЗНАНИЯ</button>
                    </div>
                 ) : (
                    <div style={{animation: 'fadeInUp 0.3s ease'}}>
                        <div style={quizBox}>
                            <h4 style={{color:'#0abab5', marginBottom:'20px', fontWeight:'900'}}>ВОПРОС {currentQuizStep + 1} / {selectedModule.quiz?.length || 1}</h4>
                            <p style={{fontSize:'22px', fontWeight:'800', marginBottom:'30px'}}>{selectedModule.quiz?.[currentQuizStep]?.q}</p>
                            <div style={{display:'grid', gap:'15px'}}>
                               {selectedModule.quiz?.[currentQuizStep]?.o.map((opt:any, i:any) => (
                                    <div key={i} onClick={() => handleQuizAnswer(i)} style={ansBtn(activeAnswer === i, i === selectedModule.quiz[currentQuizStep].c)}>{opt}</div>
                               ))}
                            </div>
                        </div>
                    </div>
                 )}
              </div>
           </div>
        )}

        {selectedRouteStep && !showRouteForm && (
           <div style={modalOverlay}>
              <div style={modalContent}>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                    <div onClick={() => {setSelectedRouteStep(null); setModuleView('content');}} style={{...backLink, margin:0}}>← НАЗАД</div>
                    <h2 style={{fontSize:'28px', color:'#0abab5', fontWeight:'900', textAlign:'center', flex: 1, padding: '0 20px'}}>{stripEmoji(selectedRouteStep.title)}</h2>
                    <div style={{width:'80px'}} />
                 </div>
                 <div style={{animation: 'fadeInUp 0.3s ease'}}>
                     <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px', marginBottom:'50px'}}>
                         <div style={theoryBlock}><h3 style={theoryLabel}>ЗАДАЧА</h3><p style={theoryText}>{selectedRouteStep.content}</p></div>
                         <div style={theoryBlock}><h3 style={theoryLabel}>ИНСТРУКЦИЯ</h3><p style={theoryText}>Соблюдайте регламенты и правила при выполнении данного шага.</p></div>
                         <div style={theoryBlock}><h3 style={theoryLabel}>ИТОГ</h3><p style={theoryText}>После завершения шага вы получите необходимые навыки для работы.</p></div>
                     </div>
                     <button onClick={() => handleRouteComplete(selectedRouteStep.id)} style={checkKnowledgeBtn}>Я ИЗУЧИЛ ЭТОТ ШАГ</button>
                 </div>
              </div>
           </div>
        )}

        {showErrorModal && (
            <div style={{...errorOverlayStyle, zIndex: 60000}}>
                <div style={errorModalContent}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
                    <h2 style={{ fontSize: '32px', color: '#ff4d4d', marginBottom: '35px', fontWeight: '900' }}>НЕВЕРНЫЙ ОТВЕТ</h2>
                    <button onClick={() => setShowErrorModal(false)} style={{...errorBtnStyle, marginTop: 0}}>ПОПРОБОВАТЬ СНОВА</button>
                </div>
            </div>
        )}
      </main>

      <style jsx global>{` 
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } 
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        body { overflow-x: hidden; width: 100vw; }
      `}</style>
    </div>
  );
}

export default function ShiftPage() {
    return <Suspense><ShiftContent /></Suspense>;
}