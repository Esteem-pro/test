// js/01-utils.js
// Утилиты и константы

var Ctx = React.createContext(null);
var useCtx = function() { return React.useContext(Ctx); };
var cmix = function(c,p) { return 'color-mix(in srgb, ' + c + ' ' + p + '%, transparent)'; };

// Даты
var DAY = 864e5;
var today = function() { var d=new Date(); d.setHours(0,0,0,0); return d; };
var addDays = function(n) { var d=today(); d.setDate(d.getDate()+n); return d; };
var pdate = function(s) { var parts=s.split('-').map(Number); return new Date(parts[0],parts[1]-1,parts[2]); };
var iso = function(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
var fmt = function(d) { return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(d).replace('.',''); };
var fmtL = function(d) { return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(d); };
var fmtT = function(ts) { return new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts)); };
var daysLeft = function(s) { return Math.round((pdate(s)-today())/DAY); };
var fmtDur = function(s) {
  s=Math.max(0,Math.floor(s));
  var h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;
  return h>0?h+':'+String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0'):m+':'+String(ss).padStart(2,'0');
};
var elapsed = function(t,now) { return t.time ? t.time.s + (t.time.run ? Math.floor((now-t.time.run)/1000) : 0) : 0; };

// Доски и статусы
var BOARD_COLS = {
  main:[
    {id:'backlog', t:'Бэклог', c:'#98A29B'},
    {id:'progress',t:'В работе', c:'#2E6BFF'},
    {id:'review', t:'На согласовании', c:'#FF8A00'},
    {id:'done', t:'Готово', c:'#0FA36B'},
  ],
  photo:[
    {id:'p_future',t:'Съёмки на будущее', c:'#0EA5C6'},
    {id:'p_shoot', t:'В процессе съёмки', c:'#F0447E'},
    {id:'p_queue', t:'В очереди на обработку', c:'#98A29B'},
    {id:'p_edit', t:'В обработке', c:'#FF8A00'},
    {id:'p_done', t:'Готово', c:'#0FA36B'},
  ],
  video:[
    {id:'v_future',t:'Съёмки на будущее', c:'#0EA5C6'},
    {id:'v_shoot', t:'В процессе съёмки', c:'#F0447E'},
    {id:'v_queue', t:'В очереди на обработку', c:'#98A29B'},
    {id:'v_edit', t:'В обработке', c:'#FF8A00'},
    {id:'v_done', t:'Готово', c:'#0FA36B'},
  ],
};
var BOARDS = {
  main: {title:'Основная', short:'Доска', bc:'#2E6BFF', soft:'#E0E9FF', text:'#1E4FD6'},
  photo:{title:'Фото', short:'Фото', bc:'#F0447E', soft:'#FCE0EB', text:'#A81448'},
  video:{title:'Видео', short:'Видео', bc:'#8B5CF6', soft:'#ECE4FD', text:'#6A34E0'},
};
var colsOf = function(b) { return BOARD_COLS[b||'main']||BOARD_COLS.main; };
var doneCol = function(b) { var cs=colsOf(b); return cs[cs.length-1].id; };
var isDone = function(t) { return t.col===doneCol(t.board||'main'); };
var colMeta = function(t) { return colsOf(t.board||'main').find(function(c){return c.id===t.col;})||{t:'?',c:'#98A29B'}; };

var DAY_BUCKETS = [
  {id:'over', t:'Просрочено', c:'#E5484D'},
  {id:'today', t:'Сегодня', c:'#FF5A2D'},
  {id:'tomorrow',t:'Завтра', c:'#E8930C'},
  {id:'week', t:'Эта неделя', c:'#2E6BFF'},
  {id:'later', t:'Позже', c:'#98A29B'},
  {id:'done', t:'Готово', c:'#0FA36B'},
];
var bucketOf = function(t) {
  if(isDone(t)) return 'done';
  var dl=daysLeft(t.due);
  if(dl<0) return 'over';
  if(dl===0) return 'today';
  if(dl===1) return 'tomorrow';
  if(dl<=7) return 'week';
  return 'later';
};

// Приоритеты
var PR = {
  high:{label:'высокий', arrow:'▲', c:'#E5484D'},
  mid: {label:'средний', arrow:'●', c:'#E8930C'},
  low: {label:'низкий', arrow:'▽', c:'#5BA26B'},
};
var PRW = {high:3, mid:2, low:1};

// Повторы
var REPEAT = {
  none: {l:'Без повтора'},
  daily: {l:'Каждый день', short:'день', d:1},
  weekly: {l:'Каждую неделю', short:'нед', d:7},
  biweekly:{l:'Раз в 2 недели', short:'2 нед',d:14},
  monthly: {l:'Каждый месяц', short:'мес', m:1},
};
var nextDue = function(dueISO,kind) {
  var r=REPEAT[kind]; if(!r) return dueISO;
  var nd=pdate(dueISO);
  var step=function(){ if(r.m) nd.setMonth(nd.getMonth()+1); else nd.setDate(nd.getDate()+r.d); };
  step(); while(nd<=today()) step();
  return iso(nd);
};

// Месяцы и дни недели
var MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
var DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
var DUE_OPTS = [['all','Все даты'],['today','Сегодня'],['soon','Ближайшие 3 дня'],['week','Эта неделя'],['over','Просрочено']];

// Настройки видимости карточки
var DEFAULT_CARD_FIELDS = {
  channel:true, assignee:true, priority:true, due:true, subtasks:true,
  comments:true, timer:true, types:true, project:true, desc:true
};

// Persistence
var LS_KEY = 'potok-mk-v3';
var loadState = function(){
  try{
    var raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    var p = JSON.parse(raw);
    if(!p || !Array.isArray(p.tasks)) return null;
    return p;
  }catch(e){ return null; }
};
var normTask = function(t){
  var b=BOARDS[t.board]?t.board:'main';
  var col=t.col;
  if(!colsOf(b).some(function(c){return c.id===col;})) col=colsOf(b)[0].id;
  var time=t.time||null;
  if(time&&time.run){
    time={s:time.s+Math.min(Math.round((Date.now()-time.run)/1000),7200),run:null};
  }
  return Object.assign({},t,{board:b,col:col,types:t.types||[],repeat:t.repeat||'none',time:time,
    project:t.project||null,pinned:!!t.pinned,fav:!!t.fav});
};

// Информация о дедлайне
var dueInfo = function(t) {
  if(isDone(t)) return {cls:'', txt:'✓ '+fmt(pdate(t.due))};
  var dl = daysLeft(t.due);
  if(dl<0) return {cls:'bad', txt:'просрочено '+(-dl)+' д'};
  if(dl===0)return {cls:'warn', txt:'сегодня'};
  if(dl===1)return {cls:'warn', txt:'завтра'};
  return {cls: dl<=2?'warn':'', txt: fmt(pdate(t.due))};
};

console.log('✓ 01-utils.js загружен');
