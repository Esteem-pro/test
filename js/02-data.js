// js/02-data.js
// Демо-данные и справочники

var DEFAULT_CHANNELS = {
  smm:      {label:'SMM',        c:'#F0447E'},
  perf:     {label:'Перформанс', c:'#FF8A00'},
  email:    {label:'Email',      c:'#2E6BFF'},
  content:  {label:'Контент',    c:'#0FA36B'},
  design:   {label:'Дизайн',     c:'#8B5CF6'},
  analytics:{label:'Аналитика',  c:'#0EA5C6'},
};

var DEFAULT_MEMBERS = {
  ak:{name:'Аня Ковалёва', short:'Аня К.',  ini:'АК', c:'#FF5A2D', role:'admin'},
  ml:{name:'Марк Ли',      short:'Марк Л.', ini:'МЛ', c:'#2E6BFF', role:'member'},
  sr:{name:'Соня Рай',     short:'Соня Р.', ini:'СР', c:'#0FA36B', role:'member'},
  tb:{name:'Тимур Бек',    short:'Тимур Б.',ini:'ТБ', c:'#8B5CF6', role:'member'},
  lv:{name:'Лера Ветер',   short:'Лера В.', ini:'ЛВ', c:'#F0447E', role:'member'},
};

var DEFAULT_PROJECTS = {
  'pr1':{name:'Летняя кампания',   c:'#FF5A2D', goal:'+30% регистраций на вебинар', archived:false},
  'pr2':{name:'Ребрендинг',        c:'#8B5CF6', goal:'Обновить визуальные гайдлайны', archived:false},
  'pr3':{name:'Операционка',       c:'#0FA36B', goal:'Поддержка текущих активностей', archived:false},
  'pr4':{name:'Запуск продукта X', c:'#0EA5C6', goal:'Вывести на рынок в сентябре', archived:false},
};

var DEFAULT_TASK_TYPES = {
  'creative':  {label:'Креатив',      c:'#F0447E'},
  'analytics': {label:'Аналитика',    c:'#0EA5C6'},
  'production':{label:'Продакшн',     c:'#FF8A00'},
  'admin':     {label:'Админка',      c:'#98A29B'},
  'research':  {label:'Исследование', c:'#8B5CF6'},
  'launch':    {label:'Запуск',       c:'#FF5A2D'},
  'report':    {label:'Отчёт',        c:'#5BA26B'},
};

var DEFAULT_TEMPLATES = [
  {id:'tpl1',name:'SMM-пост',desc:'Шаблон поста для соцсетей',
    data:{board:'main',ch:'smm',pr:'mid',types:['creative'],
      sub:[{t:'Написать текст',done:false},{t:'Подобрать визуал',done:false},{t:'Согласовать',done:false}]}},
  {id:'tpl2',name:'Еженедельный отчёт',desc:'Шаблон отчёта по каналам',
    data:{board:'main',ch:'analytics',pr:'mid',types:['report','analytics'],
      sub:[{t:'Собрать данные',done:false},{t:'Проанализировать',done:false},{t:'Оформить выводы',done:false}],
      repeat:'weekly'}},
  {id:'tpl3',name:'Запуск таргета',desc:'Полный цикл рекламной кампании',
    data:{board:'main',ch:'perf',pr:'high',types:['launch','analytics'],
      sub:[{t:'Сегменты аудитории',done:false},{t:'Креативы',done:false},{t:'Настройка в кабинете',done:false},{t:'Запуск и мониторинг',done:false}]}},
];

var DEFAULT_SPRINT = {name:'Запуск летней кампании', start:iso(addDays(-8)), end:iso(addDays(6))};

// Генератор демо-задач
var _id = 1;
var S = function(arr,done) {
  done = done || 0;
  return arr.map(function(t,i){ return {t:t, done:i<done}; });
};
var C = function(who,h,text) {
  return {who:who, ts:Date.now()-h*36e5, text:text};
};
var T = function(col,title,desc,ch,who,pr,due,x) {
  x = x || {};
  return {
    id:_id++, board:x.board||'main', col:col, title:title, desc:desc, ch:ch, who:who, pr:pr,
    due:iso(addDays(due)), sub:x.sub||[], coms:x.coms||[], types:x.types||[],
    repeat:x.repeat||'none', time:x.time||null, project:x.project||'pr3',
    pinned:x.pinned||false, fav:x.fav||false
  };
};

var SEED = [
  T('backlog','Гайд по оформлению кейсов','Единая сетка, обложки и шаблон цитат для страницы клиентов','design','tb','mid',6,{sub:S(['Сетка и шаблоны','Примеры цитат'],0),types:['creative','production'],project:'pr2'}),
  T('backlog','Семантика для поисковой кампании','Собрать ядро и кластеры под новую категорию','analytics','ml','mid',8,{types:['analytics','research'],project:'pr1'}),
  T('backlog','Подкаст с клиентом: структура','Список вопросов, хронометраж, обложка выпуска','content','sr','low',10,{types:['creative'],project:'pr4'}),
  T('backlog','Ретаргетинг: сегменты','Сегменты аудитории и отдельные креативы под каждый','perf','ml','high',4,{sub:S(['Сегменты','Креативы','Офферы'],0),types:['analytics','launch'],project:'pr1'}),
  T('progress','Рилс к запуску коллекции','3 сцены + титры, до 20 секунд, вертикаль 9:16','smm','lv','high',1,{sub:S(['Сценарий','Раскадровка','Съёмка','Монтаж'],2),coms:[C('lv',5,'Залила черновик, гляньте тайминг'),C('ak',3,'Вторая сцена длинная — сокращаем')],types:['production','creative'],project:'pr1',pinned:true}),
  T('progress','Email-цепочка к вебинару','4 письма: анонс, польза, напоминание, догон','email','ak','high',2,{sub:S(['Анонс','Польза','Напоминание','Догон','Вёрстка'],3),coms:[C('ml',8,'Тема второго письма: «3 ошибки в рассылках» — ок?'),C('ak',6,'Да, ставлю в план')],types:['creative'],project:'pr1'}),
  T('progress','Лендинг акции −20%','Первый экран + блок преимуществ, адаптив','design','tb','high',0,{sub:S(['Первый экран','Преимущества','Адаптив'],1),types:['production','creative'],project:'pr1',fav:true}),
  T('progress','Дьюти-пост в телеграме','Пост дня по контент-плану, чередование рубрик','smm','ak','mid',0,{repeat:'daily',types:['creative'],project:'pr3'}),
  T('progress','Медиаплан на август','Прогноз бюджета по каналам, цели по CPL','perf','ml','mid',3,{coms:[C('ml',26,'Жду лимиты бюджета от финансов')],types:['analytics','report'],project:'pr1'}),
  T('review','Креативы таргета: сет A/B','6 статик + 2 видео, форматы сторис и ленты','design','lv','high',1,{coms:[C('lv',12,'Сет А в папке, сет Б доснимаем'),C('lv',2,'Готово, обе версии в файлах')],types:['creative','production'],project:'pr1'}),
  T('review','Еженедельная сводка по каналам','Короткий отчёт команде по пятницам','analytics','ml','mid',2,{repeat:'weekly',types:['report','analytics'],project:'pr3'}),
  T('review','Отчёт по CPL за июнь','Сводка по каналам + выводы и план на июль','analytics','tb','low',-1,{coms:[C('tb',30,'Сводка готова, дописываю выводы'),C('ak',24,'Приоритизируй, пожалуйста, — дедлайн был вчера')],types:['report','analytics'],project:'pr1'}),
  T('done','Анонс вебинара в телеграме','Пост + кружок, посев по партнёрам','smm','ak','mid',-2,{coms:[C('ml',50,'+124 регистрации, отлично зашло')],types:['creative','launch'],project:'pr1'}),
  T('done','Пиксель на новом лендинге','Установка, проверка событий, тест конверсий','perf','ml','high',-1,{types:['production','analytics'],project:'pr1'}),
  T('done','Иллюстрации для статьи в блог','4 разворота в фирменном стиле','design','sr','mid',-3,{types:['creative','production'],project:'pr2'}),
  T('p_future','Пакшоты новой линейки','Белый фон + лайфстайл, 18 SKU','design','tb','mid',5,{board:'photo',types:['production'],project:'pr1'}),
  T('p_future','Имиджи для осенней кампании','Мудборд собран, ждём локации','smm','lv','low',9,{board:'photo',types:['creative','research'],project:'pr1'}),
  T('p_shoot','Лукбук: съёмка на локации','2 образа уже отсняты, осталось 4','smm','lv','high',1,{board:'photo',coms:[C('lv',4,'Свет выставили, начинаем')],types:['production'],project:'pr1'}),
  T('p_queue','Каталог: пересъёмка 12 артикулов','Брак по цвету на прошлой съёмке','content','sr','mid',2,{board:'photo',types:['production'],project:'pr1'}),
  T('p_edit','Отбор и ретушь репортажа','≈300 кадров, отдать 40','design','tb','high',0,{board:'photo',sub:S(['Отбор','Цветокор','Ретушь'],1),time:{s:2715,run:null},types:['production'],project:'pr3'}),
  T('p_done','Тестовая съёмка с блогером','Материал согласован, исходники в архиве','smm','ak','mid',-1,{board:'photo',types:['production'],project:'pr1'}),
  T('v_future','Интервью с основателем','Вопросы готовы, ищем студию','content','sr','mid',7,{board:'video',types:['creative','production'],project:'pr4'}),
  T('v_future','Бэкстейдж осенней съёмки','Снять параллельно с фотоднём','smm','lv','low',10,{board:'video',types:['production'],project:'pr1'}),
  T('v_shoot','Рилс: съёмка бэкстейджа','Вертикаль, без звука, титры потом','smm','lv','high',1,{board:'video',types:['production'],project:'pr1'}),
  T('v_queue','Обзор продукта: исходники в монтаж','46 минут сырого материала','content','ak','mid',2,{board:'video',types:['production'],project:'pr4'}),
  T('v_edit','Видео-креатив 15 сек','Финальный монтаж под таргет','perf','ml','high',0,{board:'video',sub:S(['Черновой монтаж','Титры','Цветокор','Экспорт'],2),time:{s:1240,run:Date.now()-1520000},types:['production','creative'],project:'pr1'}),
  T('v_done','Тизер мастер-класса','Отдан в публикацию','smm','sr','mid',-2,{board:'video',types:['production','launch'],project:'pr1'}),
];

var SEED_LOG = [
  {id:'e1',ts:Date.now()-2*36e5, type:'comment',text:'Лера В. — комментарий в «Креативы таргета: сет A/B»'},
  {id:'e2',ts:Date.now()-4*36e5, type:'edit',   text:'Изменена «Лендинг акции −20%»'},
  {id:'e3',ts:Date.now()-7*36e5, type:'done',   text:'«Пиксель на новом лендинге» — готово'},
  {id:'e4',ts:Date.now()-9*36e5, type:'done',   text:'«Тизер мастер-класса» — готово'},
  {id:'e5',ts:Date.now()-26*36e5,type:'create', text:'Создана «Лукбук: съёмка на локации»'},
  {id:'e6',ts:Date.now()-30*36e5,type:'comment',text:'Тимур Б. — комментарий в «Отчёт по CPL за июнь»'},
  {id:'e7',ts:Date.now()-50*36e5,type:'move',   text:'«Email-цепочка к вебинару» → В работе'},
  {id:'e8',ts:Date.now()-55*36e5,type:'create', text:'Создана «Ретаргетинг: сегменты»'},
];

var SEED_FILES = [
  {id:'f1',name:'Рилс_коллекция_v2.mp4',     type:'mp4',size:'96 МБ',  who:'lv',ts:Date.now()-2*36e5,   types:['creative','production'],task:5},
  {id:'f2',name:'Креативы_таргет_AB.zip',    type:'zip',size:'24,6 МБ',who:'lv',ts:Date.now()-6*36e5,   types:['creative'],task:10},
  {id:'f3',name:'Лендинг_акция_макет.fig',   type:'fig',size:'18,2 МБ',who:'tb',ts:Date.now()-4*36e5,   types:['production'],task:7},
  {id:'f4',name:'Медиаплан_август.xlsx',     type:'xls',size:'1,1 МБ', who:'ml',ts:Date.now()-8*36e5,   types:['analytics','report'],task:9},
  {id:'f5',name:'Email_цепочка_тексты.docx', type:'doc',size:'84 КБ',  who:'ak',ts:Date.now()-26*36e5,  types:['creative'],task:6},
  {id:'f6',name:'Отчет_CPL_июнь.xlsx',       type:'xls',size:'640 КБ', who:'tb',ts:Date.now()-28*36e5,  types:['report','analytics'],task:12},
  {id:'f7',name:'Брендбук_v3.pdf',           type:'pdf',size:'9,8 МБ', who:'tb',ts:Date.now()-9*DAY,    types:['creative']},
  {id:'f8',name:'Лукбук_исходники.zip',      type:'zip',size:'2,1 ГБ', who:'lv',ts:Date.now()-3*DAY,    types:['production']},
];

var FT = {
  mp4:{c:'#E5484D',l:'MP4'}, zip:{c:'#8B5CF6',l:'ZIP'}, fig:{c:'#0FA36B',l:'FIG'},
  doc:{c:'#2E6BFF',l:'DOC'}, xls:{c:'#0EA5C6',l:'XLS'}, pdf:{c:'#F0447E',l:'PDF'}, img:{c:'#FF8A00',l:'IMG'}
};

console.log('✓ 02-data.js загружен');
