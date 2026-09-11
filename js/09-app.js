// js/09-app.js
// Главный компонент приложения + синхронизация с Firebase RTDB

var el = React.createElement;

function App(){
  var saved = useRef(loadState()).current || {};

  var r1=useState('board'),view=r1[0],setView=r1[1];
  var r2=useState(saved.ui&&saved.ui.mode||'board'),mode=r2[0],setMode=r2[1];
  var r3=useState(saved.ui&&saved.ui.group||'status'),group=r3[0],setGroup=r3[1];
  var r4=useState(saved.ui&&saved.ui.sort||'due-asc'),sort=r4[0],setSort=r4[1];
  var r5=useState(saved.theme==='dark'?'dark':'light'),theme=r5[0],setTheme=r5[1];
  var r6=useState((saved.tasks||SEED).map(normTask)),tasks=r6[0],setTasks=r6[1];
  var r7=useState(saved.log||SEED_LOG),log=r7[0],setLog=r7[1];
  var r8=useState(saved.channels&&Object.keys(saved.channels).length?saved.channels:DEFAULT_CHANNELS),channels=r8[0],setChannels=r8[1];
  var r9=useState(function(){
    var src=saved.members&&Object.keys(saved.members).length?saved.members:DEFAULT_MEMBERS;
    return Object.fromEntries(Object.entries(src).map(function(e){
      return [e[0],Object.assign({role:e[0]==='ak'?'admin':'member'},e[1])];
    }));
  }),members=r9[0],setMembers=r9[1];
  var r10=useState(function(){
    var src=saved.members&&Object.keys(saved.members).length?saved.members:DEFAULT_MEMBERS;
    return saved.me&&src[saved.me]?saved.me:Object.keys(src)[0];
  }),me=r10[0],setMe=r10[1];
  var r11=useState(saved.sprint||DEFAULT_SPRINT),sprint=r11[0],setSprint=r11[1];
  var r12=useState(saved.projects&&Object.keys(saved.projects).length?saved.projects:DEFAULT_PROJECTS),projects=r12[0],setProjects=r12[1];
  var r13=useState(saved.taskTypes&&Object.keys(saved.taskTypes).length?saved.taskTypes:DEFAULT_TASK_TYPES),taskTypes=r13[0],setTaskTypes=r13[1];
  var r14=useState(saved.templates&&saved.templates.length?saved.templates:DEFAULT_TEMPLATES),templates=r14[0],setTemplates=r14[1];
  var r15=useState(saved.cardFields||DEFAULT_CARD_FIELDS),cardFields=r15[0],setCardFields=r15[1];
  var r16=useState(saved.scratch||''),scratch=r16[0],setScratch=r16[1];
  var r17=useState(''),q=r17[0],setQ=r17[1];
  var r18=useState([]),chF=r18[0],setChF=r18[1];
  var r19=useState([]),whoF=r19[0],setWhoF=r19[1];
  var r21=useState([]),prjF=r21[0],setPrjF=r21[1];
  var r23=useState('all'),prF=r23[0],setPrF=r23[1];
  var r24=useState('all'),dueF=r24[0],setDueF=r24[1];
  var r25=useState(null),modal=r25[0],setModal=r25[1];
  var r26=useState([]),toasts=r26[0],setToasts=r26[1];
  var r27=useState(false),notifOpen=r27[0],setNotifOpen=r27[1];
  var r28=useState(Date.now()),now=r28[0],setNow=r28[1];
  var r29=useState(false),showCardSettings=r29[0],setShowCardSettings=r29[1];
  var r30=useState(null),quickDD=r30[0],setQuickDD=r30[1];
  var r31=useState([]),selectedIds=r31[0],setSelectedIds=r31[1];
  var r32=useState(false),cmdOpen=r32[0],setCmdOpen=r32[1];
  var kRef=useRef(0);
  var searchRef=useRef(null);

  /* тема */
  useEffect(function(){
    document.documentElement.classList.toggle('dark',theme==='dark');
  },[theme]);

  /* localStorage */
  useEffect(function(){
    try{
      localStorage.setItem(LS_KEY,JSON.stringify({
        tasks:tasks,log:log,channels:channels,members:members,me:me,sprint:sprint,
        projects:projects,taskTypes:taskTypes,templates:templates,cardFields:cardFields,
        scratch:scratch,theme:theme,ui:{mode:mode,group:group,sort:sort}
      }));
    }catch(e){}
  },[tasks,log,channels,members,me,sprint,projects,taskTypes,templates,cardFields,scratch,theme,mode,group,sort]);

  /* ===== FIREBASE RTDB ===== */
  var fbEnabled=!!(window.firebase&&window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.databaseURL);
  var fbRef=useRef(null);
  var fbSilent=useRef(false);
  useEffect(function(){
    if(!fbEnabled) return;
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      fbRef.current=firebase.database().ref('potok');
      fbRef.current.on('value',function(snap){
        var v=snap.val();
        if(!v) return;
        fbSilent.current=true;
        if(Array.isArray(v.tasks)) setTasks(v.tasks.map(normTask));
        if(v.channels) setChannels(v.channels);
        if(v.members) setMembers(v.members);
        if(v.me) setMe(v.me);
        if(v.sprint) setSprint(v.sprint);
        if(v.projects) setProjects(v.projects);
        if(v.taskTypes) setTaskTypes(v.taskTypes);
        if(Array.isArray(v.templates)) setTemplates(v.templates);
        if(Array.isArray(v.log)) setLog(v.log);
        setTimeout(function(){fbSilent.current=false;},400);
      });
      console.log('✓ Firebase RTDB подключён');
    }catch(e){console.warn('Firebase init failed:',e);}
  },[]);
  useEffect(function(){
    if(!fbEnabled||!fbRef.current||fbSilent.current) return;
    var t=setTimeout(function(){
      try{
        fbRef.current.set({tasks:tasks,channels:channels,members:members,me:me,sprint:sprint,
          projects:projects,taskTypes:taskTypes,templates:templates,log:log.slice(0,60)});
      }catch(e){}
    },800);
    return function(){clearTimeout(t);};
  },[tasks,channels,members,me,sprint,projects,taskTypes,templates,log]);

  /* тик таймеров */
  var anyRunning=useMemo(function(){
    return tasks.some(function(t){return t.time&&t.time.run;});
  },[tasks]);
  useEffect(function(){
    if(!anyRunning) return;
    setNow(Date.now());
    var iv=setInterval(function(){setNow(Date.now());},1000);
    return function(){clearInterval(iv);};
  },[anyRunning]);

  var toggleTimer=function(id){
    var t=tasks.find(function(x){return x.id===id;});
    if(!t) return;
    var wasRunning=t.time&&t.time.run;
    setTasks(function(ts){
      return ts.map(function(x){
        if(x.id===id){
          var cur=x.time||{s:0,run:null};
          if(cur.run) return Object.assign({},x,{time:{s:cur.s+Math.round((Date.now()-cur.run)/1000),run:null}});
          return Object.assign({},x,{time:{s:cur.s,run:Date.now()}});
        }
        if(x.time&&x.time.run) return Object.assign({},x,{time:{s:x.time.s+Math.round((Date.now()-x.time.run)/1000),run:null}});
        return x;
      });
    });
    if(!wasRunning) toast('Таймер запущен: «'+(t.title.length>30?t.title.slice(0,30)+'…':t.title)+'»');
  };
  var resetTimer=function(id){
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id?Object.assign({},x,{time:{s:0,run:null}}):x;});
    });
    toast('Таймер сброшен');
  };

  var ctx=useMemo(function(){
    return {channels:channels,members:members,me:me,now:now,
      toggleTimer:toggleTimer,resetTimer:resetTimer,
      projects:projects,taskTypes:taskTypes,cardFields:cardFields};
  },[channels,members,me,now,tasks,projects,taskTypes,cardFields]);

  var toast=function(msg,action,type){
    var id=Date.now()+Math.random();
    setToasts(function(t){return t.concat([{id:id,msg:msg,action:action,type:type}]);});
    setTimeout(function(){
      setToasts(function(t){return t.filter(function(x){return x.id!==id;});});
    },3400);
  };
  var killToast=function(id){
    setToasts(function(t){return t.filter(function(x){return x.id!==id;});});
  };
  var logEv=function(type,text){
    setLog(function(l){
      return [{id:'e'+Date.now()+Math.random().toString(16).slice(2),ts:Date.now(),type:type,text:text}].concat(l).slice(0,160);
    });
  };
  var toggle=function(val,cur,set){
    set(cur.includes(val)?cur.filter(function(x){return x!==val;}):cur.concat([val]));
  };
  var resetF=function(){setQ('');setChF([]);setWhoF([]);setPrjF([]);setPrF('all');setDueF('all');};
  var hasF=!!(q.trim()||chF.length||whoF.length||prjF.length||prF!=='all'||dueF!=='all');
  var openModal=function(m){
    kRef.current++;
    setModal(Object.assign({},m,{k:kRef.current}));
  };

  var warned=useRef(false);
  useEffect(function(){
    if(warned.current) return;
    warned.current=true;
    var n=tasks.filter(function(t){return !isDone(t)&&daysLeft(t.due)<0;}).length;
    if(n>0) setTimeout(function(){toast('Просроченных задач: '+n+' — загляните в колокольчик');},800);
  },[]);

  /* горячие клавиши */
  useEffect(function(){
    var h=function(e){
      if(e.key==='Escape'){setNotifOpen(false);setCmdOpen(false);setQuickDD(null);return;}
      var tag=(e.target.tagName||'').toLowerCase();
      var inInput=tag==='input'||tag==='textarea'||tag==='select';
      if(e.metaKey||e.ctrlKey){
        if(e.key==='k'||e.key==='K'||e.key==='л'||e.key==='Л'){e.preventDefault();setCmdOpen(true);return;}
        return;
      }
      if(e.altKey) return;
      if(modal) return;
      if(inInput) return;
      if(e.key==='/'){e.preventDefault();setView('board');setTimeout(function(){searchRef.current&&searchRef.current.focus();},30);}
      else if(e.key==='n'||e.key==='т') openModal({mode:'new',board:'main'});
      else if(e.key==='t'||e.key==='е') setTheme(function(t){return t==='dark'?'light':'dark';});
      else{
        var v={'1':'board','2':'photo','3':'video','4':'mine','5':'cal','6':'stats','7':'files','8':'feed','9':'admin','0':'fav'}[e.key];
        if(v) setView(v);
      }
    };
    window.addEventListener('keydown',h);
    return function(){window.removeEventListener('keydown',h);};
  },[modal]);

  /* фильтры */
  var base=useMemo(function(){
    return tasks.filter(function(t){
      if(chF.length&&!chF.includes(t.ch)) return false;
      if(whoF.length&&!whoF.includes(t.who)) return false;
      if(prjF.length&&!prjF.includes(t.project)) return false;
      if(prF!=='all'&&t.pr!==prF) return false;
      if(q.trim()){
        var s=(t.title+' '+(t.desc||'')).toLowerCase();
        if(!s.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  },[tasks,q,chF,whoF,prjF,prF]);

  var dueCounts=useMemo(function(){
    var cnt={today:0,soon:0,week:0,over:0};
    base.forEach(function(t){
      var dl=daysLeft(t.due);
      if(dl<0&&!isDone(t)) cnt.over++;
      if(isDone(t)) return;
      if(dl===0) cnt.today++;
      if(dl>=0&&dl<=3) cnt.soon++;
      if(dl>=0&&dl<=7) cnt.week++;
    });
    return cnt;
  },[base]);

  var visible=useMemo(function(){
    return base.filter(function(t){
      if(dueF==='all') return true;
      var dl=daysLeft(t.due);
      if(dueF==='over') return dl<0&&!isDone(t);
      if(isDone(t)) return false;
      if(dueF==='today') return dl===0;
      if(dueF==='soon') return dl>=0&&dl<=3;
      if(dueF==='week') return dl>=0&&dl<=7;
      return true;
    });
  },[base,dueF]);

  var sortFn=useMemo(function(){
    var fns={
      'due-asc':function(a,b){return a.due.localeCompare(b.due);},
      'due-desc':function(a,b){return b.due.localeCompare(a.due);},
      'pr':function(a,b){return PRW[b.pr]-PRW[a.pr]||a.due.localeCompare(b.due);},
      'ch':function(a,b){return ((channels[a.ch]||{}).label||'').localeCompare((channels[b.ch]||{}).label||'','ru');},
      'who':function(a,b){return ((members[a.who]||{}).short||'').localeCompare((members[b.who]||{}).short||'','ru');},
      'title':function(a,b){return a.title.localeCompare(b.title,'ru');},
      'pinned':function(a,b){return (b.pinned?1:0)-(a.pinned?1:0)||a.due.localeCompare(b.due);}
    };
    return fns[sort]||function(){return 0;};
  },[sort,channels,members]);

  var favCount=useMemo(function(){
    return tasks.filter(function(t){return t.fav&&!isDone(t);}).length;
  },[tasks]);
  var tplCount=templates.length;

  var notif=useMemo(function(){
    var open=tasks.filter(function(t){return !isDone(t);});
    return {
      over:open.filter(function(t){return daysLeft(t.due)<0;}).sort(function(a,b){return a.due.localeCompare(b.due);}),
      today:open.filter(function(t){return daysLeft(t.due)===0;}),
      tomorrow:open.filter(function(t){return daysLeft(t.due)===1;})
    };
  },[tasks]);
  var notifCount=notif.over.length+notif.today.length;

  /* действия */
  var spawnRepeat=function(t){
    var nd=nextDue(t.due,t.repeat);
    var nt=Object.assign({},t,{id:_id++,col:colsOf(t.board||'main')[0].id,due:nd,time:null,coms:[],
      sub:(t.sub||[]).map(function(s){return Object.assign({},s,{done:false});}),
      attachments:[],pinned:false,fav:false});
    setTasks(function(ts){return [nt].concat(ts);});
    logEv('repeat','Повтор: «'+t.title+'» → '+fmt(pdate(nd)));
    toast('Повторяющаяся задача: следующий срок '+fmt(pdate(nd)));
  };
  var moveTo=function(id,col){
    var t=tasks.find(function(x){return x.id===id;});
    if(!t||t.col===col) return;
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id?Object.assign({},x,{col:col}):x;});
    });
    var ct=(colsOf(t.board||'main').find(function(c){return c.id===col;})||{t:'?'}).t;
    if(col===doneCol(t.board||'main')){
      logEv('done','«'+t.title+'» — готово');
      toast('Готово: «'+(t.title.length>28?t.title.slice(0,28)+'…':t.title)+'»');
      if(t.repeat!=='none') spawnRepeat(Object.assign({},t,{col:col}));
    } else {
      logEv('move','«'+t.title+'» → '+ct);
      toast('Перенесено в «'+ct+'»');
    }
  };
  var dayDrop=function(id,bucket){
    var t=tasks.find(function(x){return x.id===id;});
    if(!t) return;
    if(bucket==='done'){moveTo(id,doneCol(t.board||'main'));return;}
    if(bucket==='over'){toast('Нельзя запланировать в прошлое');return;}
    var off={today:0,tomorrow:1,week:4,later:10}[bucket];
    var nd=iso(addDays(off));
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id?Object.assign({},x,{due:nd}):x;});
    });
    var bl=(DAY_BUCKETS.find(function(b){return b.id===bucket;})||{}).t;
    logEv('move','«'+t.title+'» → '+bl);
    toast('Дедлайн: '+bl.toLowerCase()+(bucket==='week'||bucket==='later'?' ('+fmt(pdate(nd))+')':''));
  };
  var togglePin=function(id){
    var t=tasks.find(function(x){return x.id===id;});
    if(!t) return;
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id?Object.assign({},x,{pinned:!x.pinned}):x;});
    });
    logEv('pin','«'+t.title+'» '+(t.pinned?'откреплена':'закреплена'));
    toast(t.pinned?'Задача откреплена':'Задача закреплена 📌');
  };
  var toggleFav=function(id){
    var t=tasks.find(function(x){return x.id===id;});
    if(!t) return;
    setTasks(function(ts){
      return ts.map(function(x){return x.id===id?Object.assign({},x,{fav:!x.fav}):x;});
    });
    logEv('fav','«'+t.title+'» '+(t.fav?'убрана из избранного':'добавлена в избранное'));
    toast(t.fav?'Убрано из избранного':'Добавлено в избранное ⭐');
  };
  var createType=function(label,c){
    var id='tt'+Date.now().toString(36);
    setTaskTypes(function(tt){var o=Object.assign({},tt);o[id]={label:label,c:c};return o;});
    logEv('admin','Создан тип задачи «'+label+'»');
    toast('Тип «'+label+'» создан');
    return id;
  };
  var saveTask=function(f){
    if(modal.mode==='edit'){
      var cur=tasks.find(function(x){return x.id===f.id;});
      var merged=Object.assign({},f,{time:cur?cur.time:null});
      setTasks(function(ts){
        return ts.map(function(x){return x.id===f.id?merged:x;});
      });
      logEv('edit','Изменена «'+f.title+'»');
      toast('Изменения сохранены');
      if(cur&&!isDone(cur)&&isDone(merged)&&merged.repeat!=='none') spawnRepeat(merged);
    } else {
      var t=Object.assign({},f,{id:_id++});
      setTasks(function(ts){return [t].concat(ts);});
      logEv('create','Создана «'+t.title+'»');
      toast('Задача создана');
    }
    setModal(null);
  };
  var deleteTask=function(id){
    var t=tasks.find(function(x){return x.id===id;});
    setTasks(function(ts){return ts.filter(function(x){return x.id!==id;});});
    setModal(null);
    logEv('del','Удалена «'+t.title+'»');
    toast('Задача удалена',{label:'Вернуть',fn:function(){
      setTasks(function(ts){return [t].concat(ts);});
      logEv('create','Восстановлена «'+t.title+'»');
    }});
  };
  var saveAsTemplate=function(t){
    var name=prompt('Название шаблона:',t.title);
    if(!name) return;
    var tpl={id:'tpl'+Date.now(),name:name,desc:t.desc,
      data:{board:t.board,ch:t.ch,pr:t.pr,types:(t.types||[]).slice(),
        sub:(t.sub||[]).map(function(s){return {t:s.t,done:false};}),
        repeat:t.repeat,project:t.project}};
    setTemplates(function(ts){return [tpl].concat(ts);});
    logEv('admin','Создан шаблон «'+name+'»');
    toast('Шаблон сохранён в библиотеку');
  };
  var useTemplate=function(tpl){
    var t=Object.assign({},tpl.data,{id:_id++,title:'Задача из шаблона: '+tpl.name,
      col:colsOf((tpl.data&&tpl.data.board)||'main')[0].id,due:iso(addDays(3)),
      coms:[],time:null,attachments:[],pinned:false,fav:false});
    setTasks(function(ts){return [t].concat(ts);});
    logEv('create','Создана из шаблона «'+tpl.name+'»');
    toast('Задача создана из шаблона');
    openModal({mode:'edit',t:t});
  };
  var delTemplate=function(id){
    setTemplates(function(ts){return ts.filter(function(x){return x.id!==id;});});
    toast('Шаблон удалён');
  };
  var resetDemo=function(){
    try{localStorage.removeItem(LS_KEY);}catch(e){}
    setTasks(SEED.map(normTask)); setLog(SEED_LOG);
    setChannels(DEFAULT_CHANNELS); setMembers(DEFAULT_MEMBERS);
    setProjects(DEFAULT_PROJECTS); setTaskTypes(DEFAULT_TASK_TYPES);
    setTemplates(DEFAULT_TEMPLATES); setCardFields(DEFAULT_CARD_FIELDS);
    setScratch(''); setMe('ak'); setSprint(DEFAULT_SPRINT);
    resetF(); setSelectedIds([]);
    toast('Демо-данные восстановлены');
  };

  /* быстрые действия на карточке */
  var handleFieldClick=function(field,taskId,e){
    if(field==='types'||field==='due'){
      var tt=tasks.find(function(x){return x.id===taskId;});
      if(tt) openModal({mode:'edit',t:tt});
      return;
    }
    setQuickDD({field:field,taskId:taskId,target:e?e.currentTarget:null});
  };
  var applyQuick=function(value){
    if(!quickDD) return;
    var field=quickDD.field,taskId=quickDD.taskId;
    if(field==='channel'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId?Object.assign({},x,{ch:value}):x;});});
      toast('Канал: '+channels[value].label);
    } else if(field==='assignee'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId?Object.assign({},x,{who:value}):x;});});
      toast('Исполнитель: '+members[value].short);
    } else if(field==='priority'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId?Object.assign({},x,{pr:value}):x;});});
      toast('Приоритет: '+PR[value].label);
    } else if(field==='project'){
      setTasks(function(ts){return ts.map(function(x){return x.id===taskId?Object.assign({},x,{project:value||null}):x;});});
      toast(value?'Проект: '+projects[value].name:'Проект снят');
    }
  };
  var quickOptions=useMemo(function(){
    if(!quickDD) return [];
    if(quickDD.field==='channel') return Object.entries(channels).map(function(e){return {value:e[0],label:e[1].label,color:e[1].c};});
    if(quickDD.field==='assignee') return Object.entries(members).map(function(e){return {value:e[0],label:e[1].name,color:e[1].c};});
    if(quickDD.field==='priority') return [['high','▲ Высокий'],['mid','● Средний'],['low','▽ Низкий']].map(function(e){return {value:e[0],label:e[1],color:PR[e[0]].c};});
    if(quickDD.field==='project'){
      var opts=[{value:null,label:'— Без проекта —',color:'#98A29B'}];
      Object.entries(projects).filter(function(e){return !e[1].archived;}).forEach(function(e){
        opts.push({value:e[0],label:e[1].name,color:e[1].c});
      });
      return opts;
    }
    return [];
  },[quickDD,channels,members,projects]);

  /* выделение */
  var toggleSelect=function(id){
    setSelectedIds(function(s){return s.includes(id)?s.filter(function(x){return x!==id;}):s.concat([id]);});
  };
  var clearSelection=function(){setSelectedIds([]);};
  var massMoveTo=function(col){
    setTasks(function(ts){
      return ts.map(function(x){return selectedIds.includes(x.id)?Object.assign({},x,{col:col}):x;});
    });
    toast('Перемещено задач: '+selectedIds.length);
    clearSelection();
  };
  var massDelete=function(){
    if(!confirm('Удалить '+selectedIds.length+' задач?')) return;
    setTasks(function(ts){return ts.filter(function(x){return !selectedIds.includes(x.id);});});
    toast('Удалено задач: '+selectedIds.length);
    clearSelection();
  };
  var massPin=function(){
    setTasks(function(ts){
      return ts.map(function(x){return selectedIds.includes(x.id)?Object.assign({},x,{pinned:true}):x;});
    });
    toast('Закреплено: '+selectedIds.length);
    clearSelection();
  };

  var handleCmdSelect=function(item){
    setCmdOpen(false);
    if(item.kind==='task'){
      var t=tasks.find(function(x){return x.id===item.id;});
      if(t) openModal({mode:'edit',t:t});
    } else if(item.kind==='view') setView(item.id);
    else if(item.kind==='channel') setChF([item.id]);
    else if(item.kind==='project') setPrjF([item.id]);
    else if(item.kind==='action'&&item.id==='new') openModal({mode:'new',board:'main'});
  };

  /* производные для доски */
  var isBoardView=view==='board'||view==='photo'||view==='video';
  var bkey=view==='board'?'main':view;
  var btAll=useMemo(function(){
    return tasks.filter(function(t){return (t.board||'main')===bkey;});
  },[tasks,bkey]);
  var btVisible=useMemo(function(){
    return visible.filter(function(t){return (t.board||'main')===bkey;});
  },[visible,bkey]);
  var btSorted=useMemo(function(){
    var pinned=btVisible.filter(function(t){return t.pinned&&!isDone(t);});
    var rest=btVisible.filter(function(t){return !t.pinned||isDone(t);});
    return pinned.sort(sortFn).concat(rest.sort(sortFn));
  },[btVisible,sortFn]);
  var runningTask=tasks.find(function(t){return t.time&&t.time.run;});

  var VIEW_H={board:'Основная доска',photo:'Доска · Фото',video:'Доска · Видео',mine:'Мои задачи',
    fav:'Избранное',cal:'Календарь дедлайнов',stats:'Аналитика',files:'Файлы команды',
    tpl:'Шаблоны задач',feed:'История изменений',admin:'Админ-панель'};

  var NotifRow=function(t){
    var ch=channels[t.ch]||{c:'#98A29B'};
    return el('button',{key:t.id,className:'bp-row',
      onClick:function(){openModal({mode:'edit',t:t});setNotifOpen(false);}},
      el('span',{className:'dot',style:{background:ch.c}}),
      el('span',{className:'t'},t.title),
      el('span',{className:'d'},daysLeft(t.due)<0?(-daysLeft(t.due))+' д назад':'сегодня')
    );
  };

  /* ===== РЕНДЕР ===== */
  return el(Ctx.Provider,{value:ctx},
    el('div',{className:'app'},
      /* сайдбар */
      el('aside',{className:'side'},
        el('div',{className:'brand'},
          el('div',{className:'logo'},'П'),
          el('div',null,el('b',null,'ПОТОК'),el('span',null,'marketing desk'))
        ),
        el('nav',{className:'nav'},
          el('button',{className:view==='board'?'on':'',onClick:function(){setView('board');}},el(Icon,{d:IC.board}),'Доска'),
          el('div',{className:'grp'},'Производство'),
          el('button',{className:view==='photo'?'on':'',onClick:function(){setView('photo');}},el(Icon,{d:IC.camera}),'Фото'),
          el('button',{className:view==='video'?'on':'',onClick:function(){setView('video');}},el(Icon,{d:IC.video}),'Видео'),
          el('div',{className:'grp'},'Остальное'),
          el('button',{className:view==='mine'?'on':'',onClick:function(){setView('mine');}},el(Icon,{d:IC.user}),'Мои задачи',
            tasks.filter(function(t){return t.who===me&&!isDone(t);}).length>0&&
              el('span',{className:'cnt'},tasks.filter(function(t){return t.who===me&&!isDone(t);}).length)),
          el('button',{className:view==='fav'?'on':'',onClick:function(){setView('fav');}},el(Icon,{d:IC.star}),'Избранное',
            favCount>0&&el('span',{className:'cnt'},favCount)),
          el('button',{className:view==='cal'?'on':'',onClick:function(){setView('cal');}},el(Icon,{d:IC.cal}),'Календарь'),
          el('button',{className:view==='stats'?'on':'',onClick:function(){setView('stats');}},el(Icon,{d:IC.chart}),'Аналитика'),
          el('button',{className:view==='tpl'?'on':'',onClick:function(){setView('tpl');}},el(Icon,{d:IC.template}),'Шаблоны',
            tplCount>0&&el('span',{className:'cnt'},tplCount)),
          el('button',{className:view==='files'?'on':'',onClick:function(){setView('files');}},el(Icon,{d:IC.folder}),'Файлы'),
          el('button',{className:view==='feed'?'on':'',onClick:function(){setView('feed');}},el(Icon,{d:IC.clock}),'История'),
          el('button',{className:view==='admin'?'on':'',onClick:function(){setView('admin');}},el(Icon,{d:IC.shield}),'Админ-панель')
        ),
        el('div',{className:'sb'},
          el('h5',null,'Проекты'),
          Object.entries(projects).filter(function(e){return !e[1].archived;}).slice(0,6).map(function(e){
            var k=e[0],p=e[1];
            return el('button',{key:k,className:'srow',title:p.goal||'Без цели',onClick:function(){setPrjF([k]);setView('board');}},
              el('span',{className:'dot',style:{background:p.c}}),
              el('span',{style:{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}},p.name),
              el('span',{className:'cnt'},tasks.filter(function(t){return t.project===k&&!isDone(t);}).length));
          })
        ),
        el('div',{className:'sb'},
          el('h5',null,'Каналы'),
          Object.entries(channels).map(function(e){
            var k=e[0],c=e[1];
            return el('button',{key:k,className:'srow'+(chF.includes(k)?' on':''),onClick:function(){toggle(k,chF,setChF);}},
              el('span',{className:'dot',style:{background:c.c}}),c.label,
              el('span',{className:'cnt'},tasks.filter(function(t){return t.ch===k&&!isDone(t);}).length));
          })
        ),
        el('div',{className:'sb'},
          el('h5',null,'Команда'),
          Object.entries(members).map(function(e){
            var k=e[0],m=e[1];
            return el('button',{key:k,className:'srow'+(whoF.includes(k)?' on':''),onClick:function(){toggle(k,whoF,setWhoF);}},
              el(Avatar,{id:k,size:22}),m.short,
              el('span',{className:'cnt'},tasks.filter(function(t){return t.who===k&&!isDone(t);}).length));
          })
        ),
        el('div',{className:'sprint'},
          el('div',{className:'live'},el('span',{className:'pulse'}),'Кампания активна'),
          el('b',null,sprint.name.length>20?sprint.name.slice(0,20)+'…':sprint.name),
          el('small',null,fmt(pdate(sprint.start))+' — '+fmt(pdate(sprint.end)),
            el('br'),Math.max(0,Math.round((pdate(sprint.end)-today())/DAY))+' дней до конца'),
          sprint.goal&&el('div',{className:'sprint-goal'},'🎯 '+sprint.goal),
          fbEnabled&&el('div',{className:'sprint-goal'},'☁️ Синхронизация: Firebase')
        ),
        el('div',{className:'scratch'},
          el('h5',null,el(Icon,{d:IC.note,size:12}),'Заметки'),
          el('textarea',{placeholder:'Быстрые мысли, идеи, список дел…',value:scratch,
            onChange:function(e){setScratch(e.target.value);}})
        ),
        el('button',{className:'reset',onClick:resetDemo},el(Icon,{d:IC.redo,size:13}),'Сбросить демо-данные'),
        el('div',{className:'hotkeys'},
          el('b',null,'N'),' задача · ',el('b',null,'/'),' поиск · ',el('b',null,'Ctrl+K'),' палитра · ',
          el('b',null,'T'),' тема · ',el('b',null,'1–9'),' разделы')
      ),

      /* основная часть */
      el('main',{className:'main'},
        el('header',{className:'topbar'},
          el('div',null,
            el('span',{className:'kicker'},el('i'),'Поток · команда маркетинга'),
            el('h1',null,VIEW_H[view],el('em',null,'.'))
          ),
          el('div',{className:'tools'},
            isBoardView&&el(React.Fragment,null,
              el('label',{className:'search'},
                el(Icon,{d:IC.search,size:15}),
                el('input',{ref:searchRef,placeholder:'Поиск…  ( / )',value:q,onChange:function(e){setQ(e.target.value);}}),
                q&&el('button',{className:'x',onClick:function(){setQ('');}},el(Icon,{d:IC.x,size:13}))
              ),
              el('div',{className:'seg'},
                [['all','Все'],['high','▲ Высокий'],['mid','● Средний'],['low','▽ Низкий']].map(function(e){
                  return el('button',{key:e[0],className:prF===e[0]?'on':'',onClick:function(){setPrF(e[0]);}},e[1]);
                })
              )
            ),
            runningTask&&el('button',{className:'livechip',title:'Открыть задачу',
              onClick:function(){openModal({mode:'edit',t:runningTask});}},
              el('span',{className:'rdot'}),
              el('span',{className:'lct'},runningTask.title),
              el('b',null,fmtDur(elapsed(runningTask,now)))
            ),
            selectedIds.length>0&&el('div',{style:{display:'flex',gap:6,alignItems:'center'}},
              el('span',{style:{font:'600 12px Golos Text',color:'var(--accent)'}},'Выбрано: '+selectedIds.length),
              el('button',{className:'btn xs ghost',onClick:massPin},el(Icon,{d:IC.pin,size:11}),'Закрепить'),
              el('select',{className:'sortsel',style:{padding:'6px 10px',fontSize:11},value:'',
                onChange:function(e){if(e.target.value)massMoveTo(e.target.value);e.target.value='';}},
                el('option',{value:''},'Переместить…'),
                colsOf(bkey).map(function(c){return el('option',{key:c.id,value:c.id},c.t);})
              ),
              el('button',{className:'btn xs danger',onClick:massDelete},el(Icon,{d:IC.trash,size:11}),'Удалить'),
              el('button',{className:'btn xs ghost',onClick:clearSelection},'Снять')
            ),
            el('div',{className:'bellwrap'},
              el('button',{className:'iconbtn'+(notifCount>0?' has':''),title:'Уведомления',
                onClick:function(){setNotifOpen(function(o){return !o;});}},
                el(Icon,{d:IC.bell,size:17}),
                notifCount>0&&el('span',{className:'bbadge'},notifCount)),
              notifOpen&&el(React.Fragment,null,
                el('div',{className:'bback',onClick:function(){setNotifOpen(false);}}),
                el('div',{className:'bpanel'},
                  el('div',{className:'bp-head'},el('b',null,'Требуют внимания'),
                    notifCount>0&&el('span',null,notifCount)),
                  notifCount===0&&notif.tomorrow.length===0&&
                    el('div',{className:'bp-empty'},'Всё спокойно — горящих дедлайнов нет 🎉'),
                  notif.over.length>0&&el(React.Fragment,null,
                    el('div',{className:'bp-sec'},'Просрочено'),notif.over.map(NotifRow)),
                  notif.today.length>0&&el(React.Fragment,null,
                    el('div',{className:'bp-sec'},'Сегодня'),notif.today.map(NotifRow)),
                  notif.tomorrow.length>0&&el(React.Fragment,null,
                    el('div',{className:'bp-sec'},'Завтра'),notif.tomorrow.map(NotifRow)),
                  notif.over.length>0&&el('button',{className:'bp-all',onClick:function(){
                    setView('board');setMode('board');setGroup('day');setDueF('over');setNotifOpen(false);
                  }},'Показать просроченные →')
                )
              )
            ),
            el('button',{className:'iconbtn',title:'Настройки карточки',onClick:function(){setShowCardSettings(true);}},
              el(Icon,{d:IC.cog,size:16})),
            el('button',{className:'iconbtn',title:'Command Palette (Ctrl+K)',onClick:function(){setCmdOpen(true);}},
              el(Icon,{d:IC.bolt,size:16})),
            el('button',{className:'iconbtn',title:'Переключить тему (T)',
              onClick:function(){setTheme(function(t){return t==='dark'?'light':'dark';});}},
              el(Icon,{d:theme==='dark'?IC.sun:IC.moon,size:16})),
            el('button',{className:'btn pri',onClick:function(){openModal({mode:'new',board:isBoardView?bkey:'main'});}},
              el(Icon,{d:IC.plus,size:15,sw:2.4}),'Новая задача')
          )
        ),

        hasF&&el('div',{className:'fbar'},
          q.trim()&&el('span',{className:'achip'},el('span',{className:'l'},'Поиск: «'+q.trim()+'»'),
            el('button',{onClick:function(){setQ('');}},el(Icon,{d:IC.x,size:10,sw:2.6}))),
          chF.map(function(k){
            return el('span',{key:k,className:'achip'},
              el('span',{className:'dot',style:{background:(channels[k]||{c:'#999'}).c,width:7,height:7}}),
              el('span',{className:'l'},(channels[k]||{label:k}).label),
              el('button',{onClick:function(){toggle(k,chF,setChF);}},el(Icon,{d:IC.x,size:10,sw:2.6})));
          }),
          whoF.map(function(k){
            return el('span',{key:k,className:'achip'},
              el('span',{className:'dot',style:{background:(members[k]||{c:'#999'}).c,width:7,height:7}}),
              el('span',{className:'l'},(members[k]||{short:k}).short),
              el('button',{onClick:function(){toggle(k,whoF,setWhoF);}},el(Icon,{d:IC.x,size:10,sw:2.6})));
          }),
          prjF.map(function(k){
            return el('span',{key:k,className:'achip'},
              el('span',{className:'dot',style:{background:(projects[k]||{c:'#999'}).c,width:7,height:7}}),
              el('span',{className:'l'},(projects[k]||{name:k}).name),
              el('button',{onClick:function(){toggle(k,prjF,setPrjF);}},el(Icon,{d:IC.x,size:10,sw:2.6})));
          }),
          prF!=='all'&&el('span',{className:'achip'},el('span',{className:'l'},'Приоритет: '+PR[prF].label),
            el('button',{onClick:function(){setPrF('all');}},el(Icon,{d:IC.x,size:10,sw:2.6}))),
          dueF!=='all'&&el('span',{className:'achip'},el('span',{className:'l'},(DUE_OPTS.find(function(d){return d[0]===dueF;})||[])[1]),
            el('button',{onClick:function(){setDueF('all');}},el(Icon,{d:IC.x,size:10,sw:2.6}))),
          el('button',{className:'achip clear',onClick:resetF},'Сбросить всё')
        ),

        isBoardView&&el(React.Fragment,null,
          el('div',{className:'ctrl'},
            el('div',{className:'vseg'},
              el('button',{className:mode==='board'?'on':'',onClick:function(){setMode('board');}},el(Icon,{d:IC.kanban,size:13}),'Доска'),
              el('button',{className:mode==='list'?'on':'',onClick:function(){setMode('list');}},el(Icon,{d:IC.list,size:13}),'Список')
            ),
            el('div',{className:'vseg',title:'Группировка колонок'},
              el('button',{className:group==='status'?'on':'',onClick:function(){setGroup('status');}},'По статусу'),
              el('button',{className:group==='day'?'on':'',onClick:function(){setGroup('day');}},'По дням')
            ),
            el('div',{className:'fchips'},
              DUE_OPTS.map(function(e){
                return el('button',{key:e[0],className:'fchip'+(dueF===e[0]?' on':''),onClick:function(){setDueF(e[0]);}},
                  e[1],e[0]!=='all'&&dueCounts[e[0]]>0&&el('b',null,dueCounts[e[0]]));
              })
            ),
            el('span',{style:{flex:1}}),
            el('select',{className:'sortsel',value:sort,onChange:function(e){setSort(e.target.value);},title:'Сортировка'},
              el('option',{value:'pinned'},'Закреплённые сверху'),
              el('option',{value:'due-asc'},'Дедлайн ↑'),
              el('option',{value:'due-desc'},'Дедлайн ↓'),
              el('option',{value:'pr'},'Приоритет'),
              el('option',{value:'ch'},'Канал'),
              el('option',{value:'who'},'Исполнитель'),
              el('option',{value:'title'},'Название')
            )
          ),
          el('section',{className:'stats'},
            el(Stat,{lbl:'Открыто',n:btAll.filter(function(t){return !isDone(t);}).length,sub:'из '+btAll.length+' на доске',c:'var(--blue)'}),
            el(Stat,{lbl:'Горит',n:btAll.filter(function(t){return !isDone(t)&&daysLeft(t.due)>=0&&daysLeft(t.due)<=2;}).length,sub:'дедлайн ≤ 2 дней',c:'var(--amber)'}),
            el(Stat,{lbl:'Просрочено',n:btAll.filter(function(t){return !isDone(t)&&daysLeft(t.due)<0;}).length,
              sub:btAll.filter(function(t){return !isDone(t)&&daysLeft(t.due)<0;}).length?'требует внимания':'всё по плану',
              c:'var(--red)',alert:btAll.filter(function(t){return !isDone(t)&&daysLeft(t.due)<0;}).length>0}),
            el(Stat,{lbl:'Готово',n:btAll.filter(function(t){return isDone(t);}).length,sub:'завершено',c:'var(--green)'}),
            el('div',{className:'ringbox'},
              el(Ring,{pct:btAll.length?btAll.filter(function(t){return isDone(t);}).length/btAll.length:0}),
              el('div',null,el('b',null,BOARDS[bkey].title),
                el('small',null,group==='day'?'группировка по дням':'группировка по статусу'))
            )
          ),
          btVisible.some(function(t){return t.pinned&&!isDone(t);})&&
            el('div',{className:'pinned'},
              el('h3',null,el(Icon,{d:IC.pin,size:13}),'Закреплённые'),
              el('div',{className:'pinned-grid'},
                btVisible.filter(function(t){return t.pinned&&!isDone(t);}).map(function(t){
                  return el(TaskCard,{key:t.id,t:t,
                    onEdit:function(t2){openModal({mode:'edit',t:t2});},
                    onPin:togglePin,onFav:toggleFav,onFieldClick:handleFieldClick,
                    cardFields:cardFields,selected:selectedIds.includes(t.id),
                    onToggleSelect:toggleSelect,onShiftClick:toggleSelect});
                })
              )
            ),
          mode==='board'
            ? el(Kanban,{all:btAll,
                visible:btSorted.filter(function(t){return !t.pinned||isDone(t);}),
                group:group,hasF:hasF,
                cols:group==='day'?DAY_BUCKETS:colsOf(bkey),
                onEdit:function(t){openModal({mode:'edit',t:t});},
                onNew:function(col){openModal({mode:'new',board:bkey,col:col});},
                onDropCard:function(id,cid){group==='day'?dayDrop(id,cid):moveTo(id,cid);},
                onPin:togglePin,onFav:toggleFav,onFieldClick:handleFieldClick,
                selectedIds:selectedIds,onToggleSelect:toggleSelect,onShiftClick:toggleSelect})
            : btSorted.length>0
              ? (group==='status'
                ? el('div',{className:'ltab'},
                    el('div',{className:'lrow lhead'},
                      el('div',null,'Задача'),el('div',null,'Канал'),el('div',null,'Исполнитель'),
                      el('div',null,'Дедлайн'),el('div',null,'Прогресс'),el('div',null,'Статус')),
                    btSorted.map(function(t){
                      return el(TaskRow,{key:t.id,t:t,
                        onEdit:function(t2){openModal({mode:'edit',t:t2});},onMove:moveTo});
                    })
                  )
                : DAY_BUCKETS.map(function(b,gi){
                    var list=btSorted.filter(function(t){return bucketOf(t)===b.id;});
                    if(!list.length) return null;
                    return el('div',{key:b.id,className:'mgroup',style:{animationDelay:(gi*60)+'ms'}},
                      el('div',{className:'mgt'},
                        el('span',{className:'col-dot',style:{background:b.c}}),
                        el('h4',null,b.t),el('span',{className:'n'},list.length)),
                      el('div',{className:'ltab'},
                        list.map(function(t){
                          return el(TaskRow,{key:t.id,t:t,
                            onEdit:function(t2){openModal({mode:'edit',t:t2});},onMove:moveTo});
                        })
                      )
                    );
                  }))
              : null,
          btSorted.length===0&&el('div',{className:'nothing'},
            el('b',null,'Ничего не нашлось'),'Попробуйте изменить фильтры или поисковый запрос')
        ),

        view==='mine'&&el(MineView,{tasks:tasks,
          onEdit:function(t){openModal({mode:'edit',t:t});},onMove:moveTo}),
        view==='fav'&&el(FavoritesView,{tasks:tasks,
          onEdit:function(t){openModal({mode:'edit',t:t});},onMove:moveTo}),
        view==='cal'&&el(CalendarView,{tasks:tasks,
          onEdit:function(t){openModal({mode:'edit',t:t});},
          onNew:function(d){openModal({mode:'new',board:'main',due:d});}}),
        view==='stats'&&el(StatsView,{tasks:tasks}),
        view==='tpl'&&el(TemplatesView,{templates:templates,onUse:useTemplate,
          onDelete:delTemplate,onCreate:function(){openModal({mode:'new',board:'main']);}}),
        view==='files'&&el(FilesView,{tasks:tasks,
          onOpenTask:function(t){openModal({mode:'edit',t:t});},toast:toast}),
        view==='feed'&&el(FeedView,{log:log,onClear:function(){setLog([]);toast('История очищена');}}),
        view==='admin'&&((members[me]||{}).role==='admin'
          ? el(AdminView,{tasks:tasks,setTasks:setTasks,channels:channels,setChannels:setChannels,
              members:members,setMembers:setMembers,me:me,setMe:setMe,sprint:sprint,setSprint:setSprint,
              projects:projects,setProjects:setProjects,taskTypes:taskTypes,setTaskTypes:setTaskTypes,
              setChF:setChF,setWhoF:setWhoF,logEv:logEv,toast:toast,resetDemo:resetDemo})
          : el(LockScreen,{login:function(k){
              setMe(k);logEv('admin','Админ: вошли как '+members[k].name);
              toast('Вы вошли как '+members[k].name+' (админ)');
            }}))
      ),

      /* модалка задачи */
      modal&&el(TaskModal,{key:modal.k,
        init:modal.mode==='edit'?modal.t:null,
        live:modal.mode==='edit'?(tasks.find(function(x){return x.id===modal.t.id;})||modal.t):null,
        defaultBoard:modal.board,defaultCol:modal.col,defaultDue:modal.due,
        onClose:function(){setModal(null);},
        onSave:saveTask,onDelete:deleteTask,onSaveAsTemplate:saveAsTemplate,
        createType:createType}),

      showCardSettings&&el(CardSettings,{cardFields:cardFields,setCardFields:setCardFields,
        onClose:function(){setShowCardSettings(false);}}),

      cmdOpen&&el(CommandPalette,{tasks:tasks,channels:channels,projects:projects,
        onSelect:handleCmdSelect,onClose:function(){setCmdOpen(false);}}),

      quickDD&&el(QuickDropdown,{target:quickDD.target,options:quickOptions,
        currentValue:(tasks.find(function(t){return t.id===quickDD.taskId;})||{})[quickDD.field],
        onSelect:applyQuick,onClose:function(){setQuickDD(null);}}),

      el('div',{className:'toasts'},
        toasts.map(function(t){
          return el('div',{key:t.id,className:'toast'+(t.type==='warn'?' warn':'')},
            el('span',{className:'tdot'}),t.msg,
            t.action&&el('button',{className:'tact',onClick:function(){t.action.fn();killToast(t.id);}},t.action.label));
        })
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(el(App));
console.log('✓ 09-app.js загружен. Приложение запущено.');
