// js/06-app.js
// Главный компонент приложения

function App(){
  var saved = useRef(loadState()).current || {};

  // Основные состояния
  var ref1 = useState('board'), view = ref1[0], setView = ref1[1];
  var ref2 = useState(saved.ui && saved.ui.mode || 'board'), mode = ref2[0], setMode = ref2[1];
  var ref3 = useState(saved.ui && saved.ui.group || 'status'), group = ref3[0], setGroup = ref3[1];
  var ref4 = useState(saved.ui && saved.ui.sort || 'due-asc'), sort = ref4[0], setSort = ref4[1];
  var ref5 = useState(saved.theme === 'dark' ? 'dark' : 'light'), theme = ref5[0], setTheme = ref5[1];
  var ref6 = useState((saved.tasks || SEED).map(normTask)), tasks = ref6[0], setTasks = ref6[1];
  var ref7 = useState(saved.log || SEED_LOG), log = ref7[0], setLog = ref7[1];
  var ref8 = useState(saved.channels && Object.keys(saved.channels).length ? saved.channels : DEFAULT_CHANNELS), channels = ref8[0], setChannels = ref8[1];

  var ref9 = useState(function(){
    var src = saved.members && Object.keys(saved.members).length ? saved.members : DEFAULT_MEMBERS;
    return Object.fromEntries(Object.entries(src).map(function(entry){
      var k = entry[0], v = entry[1];
      return [k, Object.assign({role: k==='ak' ? 'admin' : 'member'}, v)];
    }));
  }), members = ref9[0], setMembers = ref9[1];

  var ref10 = useState(function(){
    var src = saved.members && Object.keys(saved.members).length ? saved.members : DEFAULT_MEMBERS;
    return saved.me && src[saved.me] ? saved.me : Object.keys(src)[0];
  }), me = ref10[0], setMe = ref10[1];

  var ref11 = useState(saved.sprint || DEFAULT_SPRINT), sprint = ref11[0], setSprint = ref11[1];
  var ref12 = useState(saved.projects && Object.keys(saved.projects).length ? saved.projects : DEFAULT_PROJECTS), projects = ref12[0], setProjects = ref12[1];
  var ref13 = useState(saved.taskTypes && Object.keys(saved.taskTypes).length ? saved.taskTypes : DEFAULT_TASK_TYPES), taskTypes = ref13[0], setTaskTypes = ref13[1];
  var ref14 = useState(saved.templates && saved.templates.length ? saved.templates : DEFAULT_TEMPLATES), templates = ref14[0], setTemplates = ref14[1];
  var ref15 = useState(saved.cardFields || DEFAULT_CARD_FIELDS), cardFields = ref15[0], setCardFields = ref15[1];
  var ref16 = useState(saved.scratch || ''), scratch = ref16[0], setScratch = ref16[1];

  // Фильтры
  var ref17 = useState(''), q = ref17[0], setQ = ref17[1];
  var ref18 = useState([]), chF = ref18[0], setChF = ref18[1];
  var ref19 = useState([]), whoF = ref19[0], setWhoF = ref19[1];
  var ref20 = useState([]), tagF = ref20[0], setTagF = ref20[1];
  var ref21 = useState([]), prjF = ref21[0], setPrjF = ref21[1];
  var ref22 = useState('any'), tagMode = ref22[0], setTagMode = ref22[1];
  var ref23 = useState('all'), prF = ref23[0], setPrF = ref23[1];
  var ref24 = useState('all'), dueF = ref24[0], setDueF = ref24[1];

  // UI состояния
  var ref25 = useState(null), modal = ref25[0], setModal = ref25[1];
  var ref26 = useState([]), toasts = ref26[0], setToasts = ref26[1];
  var ref27 = useState(false), notifOpen = ref27[0], setNotifOpen = ref27[1];
  var ref28 = useState(Date.now()), now = ref28[0], setNow = ref28[1];
  var ref29 = useState(false), showCardSettings = ref29[0], setShowCardSettings = ref29[1];
  var ref30 = useState(null), quickDD = ref30[0], setQuickDD = ref30[1];
  var ref31 = useState([]), selectedIds = ref31[0], setSelectedIds = ref31[1];
  var ref32 = useState(false), cmdOpen = ref32[0], setCmdOpen = ref32[1];

  var kRef = useRef(0);
  var searchRef = useRef(null);

  // Тема
  useEffect(function(){
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Сохранение в localStorage
  useEffect(function(){
    try{
      localStorage.setItem(LS_KEY, JSON.stringify({
        tasks: tasks, log: log, channels: channels, members: members, me: me,
        sprint: sprint, projects: projects, taskTypes: taskTypes,
        templates: templates, cardFields: cardFields, scratch: scratch, theme: theme,
        ui: {mode: mode, group: group, sort: sort}
      }));
    }catch(e){}
  }, [tasks, log, channels, members, me, sprint, projects, taskTypes, templates, cardFields, scratch, theme, mode, group, sort]);

  // Тик таймеров
  var anyRunning = useMemo(function(){
    return tasks.some(function(t){return t.time && t.time.run;});
  }, [tasks]);

  useEffect(function(){
    if(!anyRunning) return;
    setNow(Date.now());
    var iv = setInterval(function(){setNow(Date.now());}, 1000);
    return function(){clearInterval(iv);};
  }, [anyRunning]);

  var toggleTimer = function(id){
    var t = tasks.find(function(x){return x.id===id;});
    if(!t) return;
    var wasRunning = t.time && t.time.run;
    setTasks(function(ts){
      return ts.map(function(x){
        if(x.id===id){
          var cur = x.time || {s:0, run:null};
          if(cur.run) return Object.assign({}, x, {time:{s:cur.s+Math.round((Date.now()-cur.run)/1000), run:null}});
          return Object.assign({}, x, {time:{s:cur.s, run:Date.now()}});
        }
        if(x.time && x.time.run) return Object.assign({}, x, {time:{s:x.time.s+Math.round((Date.now()-x.time.run)/1000), run:null}});
        return x;
      });
    });
    if(!wasRunning) toast('Таймер запущен: «'+(t.title.length>30?t.title.slice(0,30)+'…':t.title)+'»');
  };

  var resetTimer = function(id){
    setTasks(function(ts){
      return ts.map(function(x){
        return x.id===id ? Object.assign({}, x, {time:{s:0, run:null}}) : x;
      });
    });
    toast('Таймер сброшен');
  };

  var ctx = useMemo(function(){
    return {
      channels: channels, members: members, me: me, now: now,
      toggleTimer: toggleTimer, resetTimer: resetTimer,
      projects: projects, taskTypes: taskTypes, cardFields: cardFields
    };
  }, [channels, members, me, now, tasks, projects, taskTypes, cardFields]);

  var toast = function(msg, action, type){
    var id = Date.now() + Math.random();
    setToasts(function(t){return t.concat([{id:id, msg:msg, action:action, type:type}]);});
    setTimeout(function(){
      setToasts(function(t){return t.filter(function(x){return x.id!==id;});});
    }, 3400);
  };
  var killToast = function(id){
    setToasts(function(t){return t.filter(function(x){return x.id!==id;});});
  };

  var logEv = function(type, text){
    setLog(function(l){
      return [{id:'e'+Date.now()+Math.random().toString(16).slice(2), ts:Date.now(), type:type, text:text}].concat(l).slice(0,160);
    });
  };

  var toggle = function(val, cur, set){
    set(cur.includes(val) ? cur.filter(function(x){return x!==val;}) : cur.concat([val]));
  };

  var resetF = function(){
    setQ(''); setChF([]); setWhoF([]); setTagF([]); setPrjF([]); setPrF('all'); setDueF('all');
  };

  var hasF = !!(q.trim() || chF.length || whoF.length || tagF.length || prjF.length || prF!=='all' || dueF!=='all');

  var openModal = function(m){
    kRef.current++;
    setModal(Object.assign({}, m, {k:kRef.current}));
  };

  // Предупреждение о просроченных
  var warned = useRef(false);
  useEffect(function(){
    if(warned.current) return;
    warned.current = true;
    var n = tasks.filter(function(t){return !isDone(t) && daysLeft(t.due)<0;}).length;
    if(n>0) setTimeout(function(){toast('Просроченных задач: '+n+' — загляните в колокольчик');}, 800);
  }, []);

  // Горячие клавиши
  useEffect(function(){
    var h = function(e){
      if(e.key==='Escape'){setNotifOpen(false);setCmdOpen(false);setQuickDD(null);return;}
      var tag=(e.target.tagName||'').toLowerCase();
      var inInput = tag==='input' || tag==='textarea' || tag==='select';
      if(e.metaKey || e.ctrlKey){
        if(e.key==='k' || e.key==='K' || e.key==='л' || e.key==='Л'){e.preventDefault();setCmdOpen(true);return;}
        return;
      }
      if(e.altKey) return;
      if(modal) return;
      if(inInput) return;
      if(e.key==='/'){e.preventDefault();setView('board');setTimeout(function(){searchRef.current&&searchRef.current.focus();},30);}
      else if(e.key==='n' || e.key==='т') openModal({mode:'new',board:'main'});
      else if(e.key==='t' || e.key==='е') setTheme(function(t){return t==='dark'?'light':'dark';});
      else{
        var v={'1':'board','2':'photo','3':'video','4':'mine','5':'cal','6':'stats','7':'files','8':'feed','9':'admin','0':'fav'}[e.key];
        if(v) setView(v);
      }
    };
    window.addEventListener('keydown', h);
    return function(){window.removeEventListener('keydown', h);};
  }, [modal]);

  // Фильтры
  var base = useMemo(function(){
    return tasks.filter(function(t){
      if(chF.length && !chF.includes(t.ch)) return false;
      if(whoF.length && !whoF.includes(t.who)) return false;
      if(prjF.length && !prjF.includes(t.project)) return false;
      if(tagF.length){
        var tt = t.tags || [];
        if(tagMode==='all' ? !tagF.every(function(tg){return tt.includes(tg);}) : !tagF.some(function(tg){return tt.includes(tg);})) return false;
      }
      if(prF!=='all' && t.pr!==prF) return false;
      if(q.trim()){
        var s = (t.title+' '+(t.desc||'')+' '+(t.tags||[]).join(' ')).toLowerCase();
        if(!s.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [tasks, q, chF, whoF, prjF, tagF, tagMode, prF]);

  var dueCounts = useMemo(function(){
    var cnt = {today:0, soon:0, week:0, over:0};
    base.forEach(function(t){
      var dl = daysLeft(t.due);
      if(dl<0 && !isDone(t)) cnt.over++;
      if(isDone(t)) return;
      if(dl===0) cnt.today++;
      if(dl>=0 && dl<=3) cnt.soon++;
      if(dl>=0 && dl<=7) cnt.week++;
    });
    return cnt;
  }, [base]);

  var visible = useMemo(function(){
    return base.filter(function(t){
      if(dueF==='all') return true;
      var dl = daysLeft(t.due);
      if(dueF==='over') return dl<0 && !isDone(t);
      if(isDone(t)) return false;
      if(dueF==='today') return dl===0;
      if(dueF==='soon') return dl>=0 && dl<=3;
      if(dueF==='week') return dl>=0 && dl<=7;
      return true;
    });
  }, [base, dueF]);

  var sortFn = useMemo(function(){
    var fns = {
      'due-asc': function(a,b){return a.due.localeCompare(b.due);},
      'due-desc': function(a,b){return b.due.localeCompare(a.due);},
      'pr': function(a,b){return PRW[b.pr]-PRW[a.pr] || a.due.localeCompare(b.due);},
      'ch': function(a,b){return ((channels[a.ch]||{}).label||'').localeCompare((channels[b.ch]||{}).label||'', 'ru');},
      'who': function(a,b){return ((members[a.who]||{}).short||'').localeCompare((members[b.who]||{}).short||'', 'ru');},
      'title': function(a,b){return a.title.localeCompare(b.title, 'ru');},
      'pinned': function(a,b){return (b.pinned?1:0)-(a.pinned?1:0) || a.due.localeCompare(b.due);},
    };
    return fns[sort] || function(){return 0;};
  }, [sort, channels, members]);

  var tagList = useMemo(function(){
    var map = {};
    tasks.forEach(function(t){
      (t.tags||[]).forEach(function(tg){map[tg]=(map[tg]||0)+1;});
    });
    return Object.entries(map).sort(function(a,b){return b[1]-a[1];});
  }, [tasks]);

  var favCount = useMemo(function(){
    return tasks.filter(function(t){return t.fav && !isDone(t);}).length;
  }, [tasks]);

  var tplCount = templates.length;

  // Уведомления
  var notif = useMemo(function(){
    var open = tasks.filter(function(t){return !isDone(t);});
    return {
      over: open.filter(function(t){return daysLeft(t.due)<0;}).sort(function(a,b){return a.due.localeCompare(b.due);}),
      today: open.filter(function(t){return daysLeft(t.due)===0;}),
      tomorrow: open.filter(function(t){return daysLeft(t.due)===1;}),
    };
  }, [tasks]);

  var notifCount = notif.over.length + notif.today.length;

  // Действия
  var spawnRepeat = function(t){
    var nd = nextDue(t.due, t.repeat);
    var nt = Object.assign({}, t, {
      id:_id++, col:colsOf(t.board||'main')[0].id, due:nd, time:null, coms:[],
      sub:(t.sub||[]).map(function(s){return Object.assign({}, s, {done:false});}),
      pinned:false, fav:false
    });
    setTasks(function(ts){return [nt].concat(ts);});
    logEv('repeat', 'Повтор: «'+t.title+'» → '+fmt(pdate(nd)));
    toast('Повторяющаяся задача: следующий срок '+fmt(pdate(nd)));
  };

  var moveTo = function(id, col){
    var t = tasks.find(function(x){return x.id===id;});
    if(!t || t.col===col) return;
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id ? Object.assign({}, x, {col:col}) : x;});
    });
    var ct = (colsOf(t.board||'main').find(function(c){return c.id===col;}) || {t:'?'}).t;
    if(col===doneCol(t.board||'main')){
      logEv('done', '«'+t.title+'» — готово');
      toast('Готово: «'+(t.title.length>28?t.title.slice(0,28)+'…':t.title)+'»');
      if(t.repeat!=='none') spawnRepeat(Object.assign({}, t, {col:col}));
    } else {
      logEv('move', '«'+t.title+'» → '+ct);
      toast('Перенесено в «'+ct+'»');
    }
  };

  var dayDrop = function(id, bucket){
    var t = tasks.find(function(x){return x.id===id;});
    if(!t) return;
    if(bucket==='done'){moveTo(id, doneCol(t.board||'main'));return;}
    if(bucket==='over'){toast('Нельзя запланировать в прошлое');return;}
    var off = {today:0, tomorrow:1, week:4, later:10}[bucket];
    var nd = iso(addDays(off));
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id ? Object.assign({}, x, {due:nd}) : x;});
    });
    var bl = (DAY_BUCKETS.find(function(b){return b.id===bucket;}) || {}).t;
    logEv('move', '«'+t.title+'» → '+bl);
    toast('Дедлайн: '+bl.toLowerCase() + (bucket==='week'||bucket==='later'?' ('+fmt(pdate(nd))+')':''));
  };

  var togglePin = function(id){
    var t = tasks.find(function(x){return x.id===id;});
    if(!t) return;
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id ? Object.assign({}, x, {pinned:!x.pinned}) : x;});
    });
    logEv('pin', '«'+t.title+'» '+(t.pinned?'откреплена':'закреплена'));
    toast(t.pinned?'Задача откреплена':'Задача закреплена 📌');
  };

  var toggleFav = function(id){
    var t = tasks.find(function(x){return x.id===id;});
    if(!t) return;
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id ? Object.assign({}, x, {fav:!x.fav}) : x;});
    });
    logEv('fav', '«'+t.title+'» '+(t.fav?'убрана из избранного':'добавлена в избранное'));
    toast(t.fav?'Убрано из избранного':'Добавлено в избранное ⭐');
  };

  var saveTask = function(f){
    if(modal.mode==='edit'){
      var cur = tasks.find(function(x){return x.id===f.id;});
      var merged = Object.assign({}, f, {time:cur?cur.time:null});
      setTasks(function(ts){
        return ts.map(function(x){return x.id===f.id ? merged : x;});
      });
      logEv('edit', 'Изменена «'+f.title+'»');
      toast('Изменения сохранены');
      if(cur && !isDone(cur) && isDone(merged) && merged.repeat!=='none') spawnRepeat(merged);
    } else {
      var t = Object.assign({}, f, {id:_id++});
      setTasks(function(ts){return [t].concat(ts);});
      logEv('create', 'Создана «'+t.title+'»');
      toast('Задача создана');
    }
    setModal(null);
  };

  var deleteTask = function(id){
    var t = tasks.find(function(x){return x.id===id;});
    setTasks(function(ts){return ts.filter(function(x){return x.id!==id;});});
    setModal(null);
    logEv('del', 'Удалена «'+t.title+'»');
    toast('Задача удалена', {label:'Вернуть', fn:function(){
      setTasks(function(ts){return [t].concat(ts);});
      logEv('create', 'Восстановлена «'+t.title+'»');
    }});
  };

  var resetDemo = function(){
    try{localStorage.removeItem(LS_KEY);}catch(e){}
    setTasks(SEED.map(normTask));
    setLog(SEED_LOG);
    setChannels(DEFAULT_CHANNELS);
    setMembers(DEFAULT_MEMBERS);
    setProjects(DEFAULT_PROJECTS);
    setTaskTypes(DEFAULT_TASK_TYPES);
    setTemplates(DEFAULT_TEMPLATES);
    setCardFields(DEFAULT_CARD_FIELDS);
    setScratch('');
    setMe('ak');
    setSprint(DEFAULT_SPRINT);
    resetF();
    setSelectedIds([]);
    toast('Демо-данные восстановлены');
  };

  // Быстрые действия на карточке
  var handleFieldClick = function(field, taskId, e){
    var target = e ? e.currentTarget : null;
    setQuickDD({field:field, taskId:taskId, target:target});
  };

  var applyQuick = function(value){
    if(!quickDD) return;
    var field = quickDD.field, taskId = quickDD.taskId;
    var t = tasks.find(function(x){return x.id===taskId;});
    if(!t) return;
    if(field==='channel'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId ? Object.assign({}, x, {ch:value}) : x;});});
      toast('Канал: '+channels[value].label);
    } else if(field==='assignee'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId ? Object.assign({}, x, {who:value}) : x;});});
      toast('Исполнитель: '+members[value].short);
    } else if(field==='priority'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId ? Object.assign({}, x, {pr:value}) : x;});});
      toast('Приоритет: '+PR[value].label);
    } else if(field==='project'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId ? Object.assign({}, x, {project:value||null}) : x;});});
      toast(value ? 'Проект: '+projects[value].name : 'Проект снят');
    } else if(field==='types'){
      openModal({mode:'edit', t:t});
    } else if(field==='due'){
      openModal({mode:'edit', t:t});
    }
  };

  var quickOptions = useMemo(function(){
    if(!quickDD) return [];
    var t = tasks.find(function(x){return x.id===quickDD.taskId;});
    if(quickDD.field==='channel') return Object.entries(channels).map(function(entry){return {value:entry[0],label:entry[1].label,color:entry[1].c};});
    if(quickDD.field==='assignee') return Object.entries(members).map(function(entry){return {value:entry[0],label:entry[1].name,color:entry[1].c};});
    if(quickDD.field==='priority') return [['high','▲ Высокий'],['mid','● Средний'],['low','▽ Низкий']].map(function(entry){return {value:entry[0],label:entry[1],color:PR[entry[0]].c};});
    if(quickDD.field==='project'){
      var opts = [{value:null,label:'— Без проекта —',color:'#98A29B'}];
      Object.entries(projects).filter(function(entry){return !entry[1].archived;}).forEach(function(entry){
        opts.push({value:entry[0],label:entry[1].name,color:entry[1].c});
      });
      return opts;
    }
    return [];
  }, [quickDD, channels, members, projects]);

  // Выделение
  var toggleSelect = function(id){
    setSelectedIds(function(s){return s.includes(id) ? s.filter(function(x){return x!==id;}) : s.concat([id]);});
  };
  var shiftSelect = function(id){
    setSelectedIds(function(s){return s.includes(id) ? s.filter(function(x){return x!==id;}) : s.concat([id]);});
  };
  var clearSelection = function(){setSelectedIds([]);};

  // Массовые действия
  var massMoveTo = function(col){
    setTasks(function(ts){
      return ts.map(function(x){return selectedIds.includes(x.id) ? Object.assign({}, x, {col:col}) : x;});
    });
    toast('Перемещено задач: '+selectedIds.length);
    clearSelection();
  };
  var massDelete = function(){
    if(!confirm('Удалить '+selectedIds.length+' задач?')) return;
    setTasks(function(ts){return ts.filter(function(x){return !selectedIds.includes(x.id);});});
    toast('Удалено задач: '+selectedIds.length);
    clearSelection();
  };
  var massPin = function(){
    setTasks(function(ts){
      return ts.map(function(x){return selectedIds.includes(x.id) ? Object.assign({}, x, {pinned:true}) : x;});
    });
    toast('Закреплено: '+selectedIds.length);
    clearSelection();
  };

  // Command palette
  var handleCmdSelect = function(item){
    setCmdOpen(false);
    if(item.kind==='task'){
      var t = tasks.find(function(x){return x.id===item.id;});
      if(t) openModal({mode:'edit', t:t});
    } else if(item.kind==='view'){
      setView(item.id);
    } else if(item.kind==='channel'){
      setChF([item.id]);
    } else if(item.kind==='project'){
      setPrjF([item.id]);
    } else if(item.kind==='action'){
      if(item.id==='new') openModal({mode:'new', board:'main'});
    }
  };

  // Производные для текущей доски
  var isBoardView = view==='board' || view==='photo' || view==='video';
  var bkey = view==='board' ? 'main' : view;
  var btAll = useMemo(function(){
    return tasks.filter(function(t){return (t.board||'main')===bkey;});
  }, [tasks, bkey]);
  var btVisible = useMemo(function(){
    return visible.filter(function(t){return (t.board||'main')===bkey;});
  }, [visible, bkey]);
  var btSorted = useMemo(function(){
    var pinned = btVisible.filter(function(t){return t.pinned && !isDone(t);});
    var rest = btVisible.filter(function(t){return !t.pinned || isDone(t);});
    return pinned.sort(sortFn).concat(rest.sort(sortFn));
  }, [btVisible, sortFn]);
  var runningTask = tasks.find(function(t){return t.time && t.time.run;});

  var VIEW_H = {
    board:'Основная доска', photo:'Доска · Фото', video:'Доска · Видео', mine:'Мои задачи',
    fav:'Избранное', cal:'Календарь дедлайнов', stats:'Аналитика', files:'Файлы команды',
    tpl:'Шаблоны задач', feed:'История изменений', admin:'Админ-панель'
  };

  // Рендер
  return React.createElement(Ctx.Provider, {value:ctx},
    React.createElement('div', {className:'app'},
      // Sidebar
      React.createElement('aside', {className:'side'},
        React.createElement('div', {className:'brand'},
          React.createElement('div', {className:'logo'}, 'П'),
          React.createElement('div', null,
            React.createElement('b', null, 'ПОТОК'),
            React.createElement('span', null, 'marketing desk')
          )
        ),
        React.createElement('nav', {className:'nav'},
          React.createElement('button', {className:view==='board'?'on':'', onClick:function(){setView('board');}},
            React.createElement(Icon, {d:IC.board}), 'Доска'
          ),
          React.createElement('div', {className:'grp'}, 'Производство'),
          React.createElement('button', {className:view==='photo'?'on':'', onClick:function(){setView('photo');}},
            React.createElement(Icon, {d:IC.camera}), 'Фото'
          ),
          React.createElement('button', {className:view==='video'?'on':'', onClick:function(){setView('video');}},
            React.createElement(Icon, {d:IC.video}), 'Видео'
          ),
          React.createElement('div', {className:'grp'}, 'Остальное'),
          React.createElement('button', {className:view==='mine'?'on':'', onClick:function(){setView('mine');}},
            React.createElement(Icon, {d:IC.user}), 'Мои задачи',
            tasks.filter(function(t){return t.who===me && !isDone(t);}).length > 0 &&
              React.createElement('span', {className:'cnt'}, tasks.filter(function(t){return t.who===me && !isDone(t);}).length)
          ),
          React.createElement('button', {className:view==='fav'?'on':'', onClick:function(){setView('fav');}},
            React.createElement(Icon, {d:IC.star}), 'Избранное',
            favCount > 0 && React.createElement('span', {className:'cnt'}, favCount)
          ),
          React.createElement('button', {className:view==='cal'?'on':'', onClick:function(){setView('cal');}},
            React.createElement(Icon, {d:IC.cal}), 'Календарь'
          ),
          React.createElement('button', {className:view==='stats'?'on':'', onClick:function(){setView('stats');}},
            React.createElement(Icon, {d:IC.chart}), 'Аналитика'
          ),
          React.createElement('button', {className:view==='tpl'?'on':'', onClick:function(){setView('tpl');}},
            React.createElement(Icon, {d:IC.template}), 'Шаблоны',
            tplCount > 0 && React.createElement('span', {className:'cnt'}, tplCount)
          ),
          React.createElement('button', {className:view==='files'?'on':'', onClick:function(){setView('files');}},
            React.createElement(Icon, {d:IC.folder}), 'Файлы'
          ),
          React.createElement('button', {className:view==='feed'?'on':'', onClick:function(){setView('feed');}},
            React.createElement(Icon, {d:IC.clock}), 'История'
          ),
          React.createElement('button', {className:view==='admin'?'on':'', onClick:function(){setView('admin');}},
            React.createElement(Icon, {d:IC.shield}), 'Админ-панель'
          )
        ),
        React.createElement('div', {className:'sb'},
          React.createElement('h5', null, 'Проекты'),
          Object.entries(projects).filter(function(entry){return !entry[1].archived;}).slice(0,6).map(function(entry){
            var k = entry[0], p = entry[1];
            var n = tasks.filter(function(t){return t.project===k && !isDone(t);}).length;
            return React.createElement('button', {
              key:k, className:'srow', title:p.goal||'Без цели',
              onClick:function(){setView('board');}
            },
              React.createElement('span', {className:'dot', style:{background:p.c}}),
              React.createElement('span', {style:{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}, p.name),
              React.createElement('span', {className:'cnt'}, n)
            );
          })
        ),
        React.createElement('div', {className:'sb'},
          React.createElement('h5', null, 'Каналы'),
          Object.entries(channels).map(function(entry){
            var k = entry[0], c = entry[1];
            var n = tasks.filter(function(t){return t.ch===k && !isDone(t);}).length;
            return React.createElement('button', {
              key:k, className:'srow'+(chF.includes(k)?' on':''),
              onClick:function(){toggle(k, chF, setChF);}
            },
              React.createElement('span', {className:'dot', style:{background:c.c}}),
              c.label,
              React.createElement('span', {className:'cnt'}, n)
            );
          })
        ),
        React.createElement('div', {className:'sb'},
          React.createElement('h5', null, 'Команда'),
          Object.entries(members).map(function(entry){
            var k = entry[0], m = entry[1];
            var n = tasks.filter(function(t){return t.who===k && !isDone(t);}).length;
            return React.createElement('button', {
              key:k, className:'srow'+(whoF.includes(k)?' on':''),
              onClick:function(){toggle(k, whoF, setWhoF);}
            },
              React.createElement(Avatar, {id:k, size:22}),
              m.short,
              React.createElement('span', {className:'cnt'}, n)
            );
          })
        ),
        React.createElement('div', {className:'sprint'},
          React.createElement('div', {className:'live'},
            React.createElement('span', {className:'pulse'}),
            'Кампания активна'
          ),
          React.createElement('b', null, sprint.name.length>20 ? sprint.name.slice(0,20)+'…' : sprint.name),
          React.createElement('small', null,
            fmt(pdate(sprint.start))+' — '+fmt(pdate(sprint.end)),
            React.createElement('br'),
            Math.max(0, Math.round((pdate(sprint.end)-today())/DAY))+' дней до конца'
          ),
          sprint.goal && React.createElement('div', {className:'sprint-goal'}, '🎯 '+sprint.goal)
        ),
        React.createElement('div', {className:'scratch'},
          React.createElement('h5', null,
            React.createElement(Icon, {d:IC.note, size:12}),
            'Заметки'
          ),
          React.createElement('textarea', {
            placeholder:'Быстрые мысли, идеи, список дел…',
            value:scratch,
            onChange:function(e){setScratch(e.target.value);}
          })
        ),
        React.createElement('button', {className:'reset', onClick:resetDemo},
          React.createElement(Icon, {d:IC.redo, size:13}),
          'Сбросить демо-данные'
        ),
        React.createElement('div', {className:'hotkeys'},
          React.createElement('b', null, 'N'), ' задача · ',
          React.createElement('b', null, '/'), ' поиск · ',
          React.createElement('b', null, 'Ctrl+K'), ' палитра · ',
          React.createElement('b', null, 'T'), ' тема · ',
          React.createElement('b', null, '1–9'), ' разделы'
        )
      ),

      // Main
      React.createElement('main', {className:'main'},
        React.createElement('header', {className:'topbar'},
          React.createElement('div', null,
            React.createElement('span', {className:'kicker'},
              React.createElement('i'),
              'Поток · команда маркетинга'
            ),
            React.createElement('h1', null,
              VIEW_H[view],
              React.createElement('em', null, '.')
            )
          ),
          React.createElement('div', {className:'tools'},
            isBoardView && React.createElement(React.Fragment, null,
              React.createElement('label', {className:'search'},
                React.createElement(Icon, {d:IC.search, size:15}),
                React.createElement('input', {
                  ref:searchRef,
                  placeholder:'Поиск…  ( / )',
                  value:q,
                  onChange:function(e){setQ(e.target.value);}
                }),
                q && React.createElement('button', {className:'x', onClick:function(){setQ('');}},
                  React.createElement(Icon, {d:IC.x, size:13})
                )
              ),
              React.createElement('div', {className:'seg'},
                [['all','Все'],['high','▲ Высокий'],['mid','● Средний'],['low','▽ Низкий']].map(function(entry){
                  var v = entry[0], l = entry[1];
                  return React.createElement('button', {
                    key:v, className:prF===v?'on':'',
                    onClick:function(){setPrF(v);}
                  }, l);
                })
              )
            ),
            runningTask && React.createElement('button', {
              className:'livechip', title:'Открыть задачу',
              onClick:function(){openModal({mode:'edit', t:runningTask});}
            },
              React.createElement('span', {className:'rdot'}),
              React.createElement('span', {className:'lct'}, runningTask.title),
              React.createElement('b', null, fmtDur(elapsed(runningTask, now)))
            ),
            selectedIds.length > 0 && React.createElement('div', {style:{display:'flex',gap:6,alignItems:'center'}},
              React.createElement('span', {style:{font:'600 12px Golos Text',color:'var(--accent)'}}, 'Выбрано: '+selectedIds.length),
              React.createElement('button', {className:'btn xs ghost', onClick:function(){massPin();}},
                React.createElement(Icon, {d:IC.pin, size:11}), 'Закрепить'
              ),
              React.createElement('select', {
                className:'sortsel', style:{padding:'6px 10px',fontSize:11}, value:'',
                onChange:function(e){if(e.target.value) massMoveTo(e.target.value); e.target.value='';}
              },
                React.createElement('option', {value:''}, 'Переместить…'),
                colsOf(bkey).map(function(c){
                  return React.createElement('option', {key:c.id, value:c.id}, c.t);
                })
              ),
              React.createElement('button', {className:'btn xs danger', onClick:massDelete},
                React.createElement(Icon, {d:IC.trash, size:11}), 'Удалить'
              ),
              React.createElement('button', {className:'btn xs ghost', onClick:clearSelection}, 'Снять')
            ),
            React.createElement('div', {className:'bellwrap'},
              React.createElement('button', {
                className:'iconbtn'+(notifCount>0?' has':''),
                title:'Уведомления',
                onClick:function(){setNotifOpen(function(o){return !o;});}
              },
                React.createElement(Icon, {d:IC.bell, size:17}),
                notifCount>0 && React.createElement('span', {className:'bbadge'}, notifCount)
              ),
              notifOpen && React.createElement(React.Fragment, null,
                React.createElement('div', {className:'bback', onClick:function(){setNotifOpen(false);}}),
                React.createElement('div', {className:'bpanel'},
                  React.createElement('div', {className:'bp-head'},
                    React.createElement('b', null, 'Требуют внимания'),
                    notifCount>0 && React.createElement('span', null, notifCount)
                  ),
                  notifCount===0 && notif.tomorrow.length===0 &&
                    React.createElement('div', {className:'bp-empty'}, 'Всё спокойно — горящих дедлайнов нет 🎉'),
                  notif.over.length>0 && React.createElement(React.Fragment, null,
                    React.createElement('div', {className:'bp-sec'}, 'Просрочено'),
                    notif.over.map(function(t){
                      var ch = channels[t.ch] || {c:'#98A29B'};
                      return React.createElement('button', {
                        key:t.id, className:'bp-row',
                        onClick:function(){openModal({mode:'edit',t:t});setNotifOpen(false);}
                      },
                        React.createElement('span', {className:'dot', style:{background:ch.c}}),
                        React.createElement('span', {className:'t'}, t.title),
                        React.createElement('span', {className:'d'}, daysLeft(t.due)<0 ? (-daysLeft(t.due))+' д назад' : 'сегодня')
                      );
                    })
                  ),
                  notif.today.length>0 && React.createElement(React.Fragment, null,
                    React.createElement('div', {className:'bp-sec'}, 'Сегодня'),
                    notif.today.map(function(t){
                      var ch = channels[t.ch] || {c:'#98A29B'};
                      return React.createElement('button', {
                        key:t.id, className:'bp-row',
                        onClick:function(){openModal({mode:'edit',t:t});setNotifOpen(false);}
                      },
                        React.createElement('span', {className:'dot', style:{background:ch.c}}),
                        React.createElement('span', {className:'t'}, t.title),
                        React.createElement('span', {className:'d'}, 'сегодня')
                      );
                    })
                  ),
                  notif.tomorrow.length>0 && React.createElement(React.Fragment, null,
                    React.createElement('div', {className:'bp-sec'}, 'Завтра'),
                    notif.tomorrow.map(function(t){
                      var ch = channels[t.ch] || {c:'#98A29B'};
                      return React.createElement('button', {
                        key:t.id, className:'bp-row',
                        onClick:function(){openModal({mode:'edit',t:t});setNotifOpen(false);}
                      },
                        React.createElement('span', {className:'dot', style:{background:ch.c}}),
                        React.createElement('span', {className:'t'}, t.title),
                        React.createElement('span', {className:'d'}, 'завтра')
                      );
                    })
                  ),
                  notif.over.length>0 && React.createElement('button', {
                    className:'bp-all',
                    onClick:function(){setView('board');setMode('board');setGroup('day');setDueF('over');setNotifOpen(false);}
                  }, 'Показать просроченные →')
                )
              )
            ),
            React.createElement('button', {
              className:'iconbtn', title:'Настройки карточки',
              onClick:function(){setShowCardSettings(true);}
            },
              React.createElement(Icon, {d:IC.cog, size:16})
            ),
            React.createElement('button', {
              className:'iconbtn', title:'Command Palette (Ctrl+K)',
              onClick:function(){setCmdOpen(true);}
            },
              React.createElement(Icon, {d:IC.bolt, size:16})
            ),
            React.createElement('button', {
              className:'iconbtn', title:'Переключить тему (T)',
              onClick:function(){setTheme(function(t){return t==='dark'?'light':'dark';});}
            },
              React.createElement(Icon, {d:theme==='dark'?IC.sun:IC.moon, size:16})
            ),
            React.createElement('button', {
              className:'btn pri',
              onClick:function(){openModal({mode:'new', board:isBoardView?bkey:'main'});}
            },
              React.createElement(Icon, {d:IC.plus, size:15, sw:2.4}),
              'Новая задача'
            )
          )
        ),

        // Фильтры
        hasF && React.createElement('div', {className:'fbar'},
          q.trim() && React.createElement('span', {className:'achip'},
            React.createElement('span', {className:'l'}, 'Поиск: «'+q.trim()+'»'),
            React.createElement('button', {onClick:function(){setQ('');}},
              React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
            )
          ),
          chF.map(function(k){
            return React.createElement('span', {key:k, className:'achip'},
              React.createElement('span', {className:'dot', style:{background:(channels[k]||{c:'#999'}).c,width:7,height:7}}),
              React.createElement('span', {className:'l'}, (channels[k]||{label:k}).label),
              React.createElement('button', {onClick:function(){toggle(k,chF,setChF);}},
                React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
              )
            );
          }),
          whoF.map(function(k){
            return React.createElement('span', {key:k, className:'achip'},
              React.createElement('span', {className:'dot', style:{background:(members[k]||{c:'#999'}).c,width:7,height:7}}),
              React.createElement('span', {className:'l'}, (members[k]||{short:k}).short),
              React.createElement('button', {onClick:function(){toggle(k,whoF,setWhoF);}},
                React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
              )
            );
          }),
          prjF.map(function(k){
            return React.createElement('span', {key:k, className:'achip'},
              React.createElement('span', {className:'dot', style:{background:(projects[k]||{c:'#999'}).c,width:7,height:7}}),
              React.createElement('span', {className:'l'}, (projects[k]||{name:k}).name),
              React.createElement('button', {onClick:function(){toggle(k,prjF,setPrjF);}},
                React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
              )
            );
          }),
          tagF.map(function(tg){
            return React.createElement('span', {key:tg, className:'achip'},
              React.createElement('span', {className:'l'}, '#'+tg),
              React.createElement('button', {onClick:function(){toggle(tg,tagF,setTagF);}},
                React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
              )
            );
          }),
          tagF.length>1 && React.createElement('span', {className:'fbar-note'}, 'теги: '+(tagMode==='any'?'любой из':'все сразу')),
          prF!=='all' && React.createElement('span', {className:'achip'},
            React.createElement('span', {className:'l'}, 'Приоритет: '+PR[prF].label),
            React.createElement('button', {onClick:function(){setPrF('all');}},
              React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
            )
          ),
          dueF!=='all' && React.createElement('span', {className:'achip'},
            React.createElement('span', {className:'l'}, (DUE_OPTS.find(function(d){return d[0]===dueF;})||[])[1]),
            React.createElement('button', {onClick:function(){setDueF('all');}},
              React.createElement(Icon, {d:IC.x, size:10, sw:2.6})
            )
          ),
          React.createElement('button', {className:'achip clear', onClick:resetF}, 'Сбросить всё')
        ),

        // Доска
        isBoardView && React.createElement(React.Fragment, null,
          React.createElement('div', {className:'ctrl'},
            React.createElement('div', {className:'vseg'},
              React.createElement('button', {className:mode==='board'?'on':'', onClick:function(){setMode('board');}},
                React.createElement(Icon, {d:IC.kanban, size:13}), 'Доска'
              ),
              React.createElement('button', {className:mode==='list'?'on':'', onClick:function(){setMode('list');}},
                React.createElement(Icon, {d:IC.list, size:13}), 'Список'
              )
            ),
            React.createElement('div', {className:'vseg', title:'Группировка колонок'},
              React.createElement('button', {className:group==='status'?'on':'', onClick:function(){setGroup('status');}}, 'По статусу'),
              React.createElement('button', {className:group==='day'?'on':'', onClick:function(){setGroup('day');}}, 'По дням')
            ),
            React.createElement('div', {className:'fchips'},
              DUE_OPTS.map(function(entry){
                var v = entry[0], l = entry[1];
                return React.createElement('button', {
                  key:v, className:'fchip'+(dueF===v?' on':''),
                  onClick:function(){setDueF(v);}
                },
                  l,
                  v!=='all' && dueCounts[v]>0 && React.createElement('b', null, dueCounts[v])
                );
              })
            ),
            React.createElement('span', {style:{flex:1}}),
            React.createElement('select', {
              className:'sortsel', value:sort,
              onChange:function(e){setSort(e.target.value);},
              title:'Сортировка'
            },
              React.createElement('option', {value:'pinned'}, 'Закреплённые сверху'),
              React.createElement('option', {value:'due-asc'}, 'Дедлайн ↑'),
              React.createElement('option', {value:'due-desc'}, 'Дедлайн ↓'),
              React.createElement('option', {value:'pr'}, 'Приоритет'),
              React.createElement('option', {value:'ch'}, 'Канал'),
              React.createElement('option', {value:'who'}, 'Исполнитель'),
              React.createElement('option', {value:'title'}, 'Название')
            )
          ),
          React.createElement('section', {className:'stats'},
            React.createElement(Stat, {
              lbl:'Открыто',
              n:btAll.filter(function(t){return !isDone(t);}).length,
              sub:'из '+btAll.length+' на доске',
              c:'var(--blue)'
            }),
            React.createElement(Stat, {
              lbl:'Горит',
              n:btAll.filter(function(t){return !isDone(t) && daysLeft(t.due)>=0 && daysLeft(t.due)<=2;}).length,
              sub:'дедлайн ≤ 2 дней',
              c:'var(--amber)'
            }),
            React.createElement(Stat, {
              lbl:'Просрочено',
              n:btAll.filter(function(t){return !isDone(t) && daysLeft(t.due)<0;}).length,
              sub:btAll.filter(function(t){return !isDone(t) && daysLeft(t.due)<0;}).length ? 'требует внимания' : 'всё по плану',
              c:'var(--red)',
              alert:btAll.filter(function(t){return !isDone(t) && daysLeft(t.due)<0;}).length > 0
            }),
            React.createElement(Stat, {
              lbl:'Готово',
              n:btAll.filter(function(t){return isDone(t);}).length,
              sub:'завершено',
              c:'var(--green)'
            }),
            React.createElement('div', {className:'ringbox'},
              React.createElement(Ring, {
                pct:btAll.length ? btAll.filter(function(t){return isDone(t);}).length/btAll.length : 0
              }),
              React.createElement('div', null,
                React.createElement('b', null, BOARDS[bkey].title),
                React.createElement('small', null, group==='day' ? 'группировка по дням' : 'группировка по статусу')
              )
            )
          ),

          // Закреплённые
          btVisible.some(function(t){return t.pinned && !isDone(t);}) &&
            React.createElement('div', {className:'pinned'},
              React.createElement('h3', null,
                React.createElement(Icon, {d:IC.pin, size:13}),
                'Закреплённые'
              ),
              React.createElement('div', {className:'pinned-grid'},
                btVisible.filter(function(t){return t.pinned && !isDone(t);}).map(function(t){
                  return React.createElement(TaskCard, {
                    key:t.id, t:t,
                    onEdit:function(t2){openModal({mode:'edit',t:t2});},
                    onPin:togglePin, onFav:toggleFav, onFieldClick:handleFieldClick,
                    cardFields:cardFields,
                    selected:selectedIds.includes(t.id),
                    onToggleSelect:toggleSelect,
                    onShiftClick:shiftSelect
                  });
                })
              )
            ),

          // Канбан или список
          mode==='board'
            ? React.createElement(Kanban, {
                all:btAll,
                visible:btSorted.filter(function(t){return !t.pinned || isDone(t);}),
                group:group, hasF:hasF,
                cols:group==='day' ? DAY_BUCKETS : colsOf(bkey),
                onEdit:function(t){openModal({mode:'edit',t:t});},
                onNew:function(col){openModal({mode:'new',board:bkey,col:col});},
                onDropCard:function(id,cid){group==='day' ? dayDrop(id,cid) : moveTo(id,cid);},
                onPin:togglePin, onFav:toggleFav, onFieldClick:handleFieldClick,
                selectedIds:selectedIds, onToggleSelect:toggleSelect, onShiftClick:shiftSelect
              })
            : btSorted.length > 0
              ? (group==='status'
                ? React.createElement('div', {className:'ltab'},
                    React.createElement('div', {className:'lrow lhead'},
                      React.createElement('div', null, 'Задача'),
                      React.createElement('div', null, 'Канал'),
                      React.createElement('div', null, 'Исполнитель'),
                      React.createElement('div', null, 'Дедлайн'),
                      React.createElement('div', null, 'Прогресс'),
                      React.createElement('div', null, 'Статус')
                    ),
                    btSorted.map(function(t){
                      return React.createElement(TaskRow, {
                        key:t.id, t:t,
                        onEdit:function(t2){openModal({mode:'edit',t:t2});},
                        onMove:moveTo
                      });
                    })
                  )
                : DAY_BUCKETS.map(function(b,gi){
                    var list = btSorted.filter(function(t){return bucketOf(t)===b.id;});
                    if(!list.length) return null;
                    return React.createElement('div', {key:b.id, className:'mgroup', style:{animationDelay:(gi*60)+'ms'}},
                      React.createElement('div', {className:'mgt'},
                        React.createElement('span', {className:'col-dot', style:{background:b.c}}),
                        React.createElement('h4', null, b.t),
                        React.createElement('span', {className:'n'}, list.length)
                      ),
                      React.createElement('div', {className:'ltab'},
                        list.map(function(t){
                          return React.createElement(TaskRow, {
                            key:t.id, t:t,
                            onEdit:function(t2){openModal({mode:'edit',t:t2});},
                            onMove:moveTo
                          });
                        })
                      )
                    );
                  }))
              : null,

          btSorted.length===0 && React.createElement('div', {className:'nothing'},
            React.createElement('b', null, 'Ничего не нашлось'),
            'Попробуйте изменить фильтры или поисковый запрос'
          )
        ),

        // Другие вьюхи
        view==='mine' && React.createElement(MineView, {
          tasks:tasks,
          onEdit:function(t){openModal({mode:'edit',t:t});},
          onMove:moveTo
        }),
        view==='fav' && React.createElement(FavoritesView, {
          tasks:tasks,
          onEdit:function(t){openModal({mode:'edit',t:t});},
          onMove:moveTo
        }),
        view==='cal' && React.createElement('div', null, 'Календарь (в разработке)'),
        view==='stats' && React.createElement('div', null, 'Аналитика (в разработке)'),
        view==='tpl' && React.createElement('div', null, 'Шаблоны (в разработке)'),
        view==='files' && React.createElement('div', null, 'Файлы (в разработке)'),
        view==='feed' && React.createElement(FeedView, {
          log:log,
          onClear:function(){setLog([]);toast('История очищена');}
        }),
        view==='admin' && ((members[me]||{}).role==='admin'
          ? React.createElement('div', null, 'Админ-панель (в разработке)')
          : React.createElement(LockScreen, {
              login:function(k){
                setMe(k);
                logEv('admin', 'Админ: вошли как '+members[k].name);
                toast('Вы вошли как '+members[k].name+' (админ)');
              }
            })
        )
      ),

      // Модалка задачи
      modal && React.createElement('div', {className:'overlay',
        onMouseDown:function(e){if(e.target===e.currentTarget) setModal(null);}
      },
        React.createElement('div', {className:'modal'},
          React.createElement('button', {className:'mclose', onClick:function(){setModal(null);}},
            React.createElement(Icon, {d:IC.x, size:16})
          ),
          React.createElement('h3', null, modal.mode==='edit' ? 'Редактировать задачу' : 'Новая задача'),
          React.createElement('p', null, 'Задача: '+(modal.t ? modal.t.title : 'новая')),
          React.createElement('div', {className:'mfoot'},
            React.createElement('span', {style:{flex:1}}),
            React.createElement('button', {className:'btn ghost', onClick:function(){setModal(null);}}, 'Отмена')
          )
        )
      ),

      // Тосты
      React.createElement('div', {className:'toasts'},
        toasts.map(function(t){
          return React.createElement('div', {key:t.id, className:'toast'+(t.type==='warn'?' warn':'')},
            React.createElement('span', {className:'tdot'}),
            t.msg,
            t.action && React.createElement('button', {
              className:'tact',
              onClick:function(){t.action.fn();killToast(t.id);}
            }, t.action.label)
          );
        })
      )
    )
  );
}

// Запуск приложения
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));

console.log('✓ 06-app.js загружен. Приложение запущено.');
