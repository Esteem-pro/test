// js/06-views2.js
// Календарь, Аналитика, Файлы, Шаблоны, Админ-панель

var el = React.createElement;

/* ================= КАЛЕНДАРЬ ================= */
function CalendarView(props){
  var tasks=props.tasks, onEdit=props.onEdit, onNew=props.onNew;
  var ctx=useCtx(), channels=ctx.channels;
  var st=useState(function(){var d=today();return {y:d.getFullYear(),m:d.getMonth()};});
  var cur=st[0], setCur=st[1];
  var shift=function(n){setCur(function(c){var d=new Date(c.y,c.m+n,1);return {y:d.getFullYear(),m:d.getMonth()};});};
  var first=new Date(cur.y,cur.m,1);
  var off=(first.getDay()+6)%7;
  var dim=new Date(cur.y,cur.m+1,0).getDate();
  var start=new Date(cur.y,cur.m,1-off);
  var rows=Math.ceil((off+dim)/7);
  var cells=[];
  for(var i=0;i<rows*7;i++){var dd=new Date(start);dd.setDate(start.getDate()+i);cells.push(dd);}
  var byDay=function(d){return tasks.filter(function(t){return t.due===iso(d);});};
  var monthN=tasks.filter(function(t){var d=pdate(t.due);return d.getMonth()===cur.m&&d.getFullYear()===cur.y;}).length;

  return el('div',{className:'cal'},
    el('div',{className:'cal-head'},
      el('button',{className:'cal-nav',title:'Предыдущий месяц',onClick:function(){shift(-1);}},el(Icon,{d:IC.left,size:15})),
      el('button',{className:'cal-nav',title:'Следующий месяц',onClick:function(){shift(1);}},el(Icon,{d:IC.right,size:15})),
      el('h3',null,MONTHS[cur.m]+' '+cur.y),
      el('span',{className:'cal-cnt'},monthN+' дедлайн'+(monthN===1?'':(monthN<5?'а':'ов'))+' в месяце'),
      el('div',{className:'legend'},
        Object.values(channels).map(function(c){
          return el('span',{key:c.label},el('span',{className:'dot',style:{background:c.c}}),c.label);
        })
      )
    ),
    el('div',{className:'cal-grid'},
      DOW.map(function(d,i){return el('div',{key:d,className:'cal-dow'+(i>=5?' we':'')},d);}),
      cells.map(function(d,i){
        var evs=byDay(d), out=d.getMonth()!==cur.m, isT=iso(d)===iso(today()), wk=i%7>=5;
        return el('div',{
          key:i,
          className:'cal-cell'+(out?' out':'')+(isT?' today':'')+(wk?' wk':''),
          title:'Клик — новая задача на эту дату',
          onClick:function(){onNew(iso(d));}
        },
          el('span',{className:'dn'},d.getDate()),
          evs.slice(0,3).map(function(t){
            var ch=channels[t.ch]||{c:'#98A29B'};
            return el('button',{
              key:t.id,
              className:'ev'+(isDone(t)?' done':''),
              style:{background:cmix(ch.c,16),borderLeftColor:ch.c,color:ch.c},
              title:t.title,
              onClick:function(e){e.stopPropagation();onEdit(t);}
            },el('b',null,t.title));
          }),
          evs.length>3&&el('div',{className:'more'},'+'+(evs.length-3)+' ещё')
        );
      })
    )
  );
}

/* ================= АНАЛИТИКА ================= */
function StatsView(props){
  var tasks=props.tasks;
  var ctx=useCtx(), channels=ctx.channels, members=ctx.members, projects=ctx.projects;
  var st=useState('all'), bf=st[0], setBf=st[1];
  var ts=bf==='all'?tasks:tasks.filter(function(t){return (t.board||'main')===bf;});
  var total=ts.length;
  var done=ts.filter(function(t){return isDone(t);}).length;
  var open=ts.filter(function(t){return !isDone(t);});
  var overdue=open.filter(function(t){return daysLeft(t.due)<0;}).length;

  var byChannel=Object.entries(channels).map(function(e){
    return {k:e[0],c:e[1],v:ts.filter(function(t){return t.ch===e[0]&&!isDone(t);}).length};
  }).sort(function(a,b){return b.v-a.v;});
  var maxCh=Math.max.apply(null,byChannel.map(function(x){return x.v;}).concat([1]));

  var byMember=Object.entries(members).map(function(e){
    return {k:e[0],m:e[1],open:ts.filter(function(t){return t.who===e[0]&&!isDone(t);}).length};
  }).sort(function(a,b){return b.open-a.open;});
  var maxM=Math.max.apply(null,byMember.map(function(x){return x.open;}).concat([1]));

  var byProject=Object.entries(projects).filter(function(e){return !e[1].archived;}).map(function(e){
    return {k:e[0],p:e[1],
      open:ts.filter(function(t){return t.project===e[0]&&!isDone(t);}).length,
      done:ts.filter(function(t){return t.project===e[0]&&isDone(t);}).length};
  }).sort(function(a,b){return (b.open+b.done)-(a.open+a.done);});
  var maxP=Math.max.apply(null,byProject.map(function(x){return x.open+x.done;}).concat([1]));

  var pr=[['high','#E5484D','Высокий'],['mid','#E8930C','Средний'],['low','#5BA26B','Низкий']].map(function(e){
    return {l:e[2],c:e[1],v:open.filter(function(t){return t.pr===e[0];}).length};
  });

  var days=[];
  for(var i=0;i<14;i++){
    var d=addDays(i-13);
    days.push({d:d,v:ts.filter(function(t){return isDone(t)&&t.due===iso(d);}).length});
  }
  var maxD=Math.max.apply(null,days.map(function(x){return x.v;}).concat([1]));

  var onSt=useState(false), on=onSt[0], setOn=onSt[1];
  useEffect(function(){var t=setTimeout(function(){setOn(true);},80);return function(){clearTimeout(t);};},[]);

  return el(React.Fragment,null,
    el('div',{className:'vtool'},
      el('span',null,'Сводка по задачам команды'),
      el('div',{className:'fchips'},
        [['all','Все доски'],['main','Основная'],['photo','Фото'],['video','Видео']].map(function(e){
          return el('button',{key:e[0],className:'fchip'+(bf===e[0]?' on':''),onClick:function(){setBf(e[0]);}},e[1]);
        })
      )
    ),
    el('section',{className:'stats'},
      el(Stat,{lbl:'Всего задач',n:total,sub:'в выбранном срезе',c:'var(--ink)'}),
      el(Stat,{lbl:'Готово',n:done,sub:total?Math.round(done/total*100)+'% от плана':'—',c:'var(--green)'}),
      el(Stat,{lbl:'Открыто',n:open.length,sub:'требуют работы',c:'var(--blue)'}),
      el(Stat,{lbl:'Просрочено',n:overdue,sub:overdue?'разберитесь сегодня':'чисто',c:'var(--red)',alert:overdue>0})
    ),
    el('div',{className:'agrid'},
      el('div',{className:'panel',style:{animationDelay:'60ms'}},
        el('h4',null,'Открытые задачи по каналам'),
        byChannel.map(function(x){
          return el('div',{className:'arow',key:x.k},
            el('span',{className:'al',style:{color:x.c.c}},x.c.label),
            el(Bar,{pct:x.v/maxCh*100,c:x.c.c}),
            el('span',{className:'av'},x.v)
          );
        })
      ),
      el('div',{className:'panel',style:{animationDelay:'120ms'}},
        el('h4',null,'Нагрузка команды'),
        byMember.map(function(x){
          return el('div',{className:'arow',key:x.k},
            el(Avatar,{id:x.k,size:22}),
            el('span',{className:'al'},x.m.short),
            el(Bar,{pct:x.open/maxM*100,c:x.m.c}),
            el('span',{className:'av'},x.open)
          );
        }),
        el('div',{className:'pnote'},'Открытые задачи на человека · всего готово: '+done)
      ),
      el('div',{className:'panel',style:{animationDelay:'180ms'}},
        el('h4',null,'Приоритеты открытых задач'),
        el('div',{className:'drow'},
          el(Donut,{data:pr}),
          el('div',{className:'dleg'},
            pr.map(function(p){
              return el('div',{key:p.l,className:'dleg-r'},
                el('span',{className:'dot',style:{background:p.c}}),p.l,el('b',null,p.v));
            })
          )
        )
      ),
      el('div',{className:'panel',style:{animationDelay:'240ms'}},
        el('h4',null,'Закрыто по дням · 2 недели'),
        el('div',{className:'bars'},
          days.map(function(d,i){
            return el('i',{key:i,className:d.v?'':'z',title:fmt(d.d)+' — '+d.v,
              style:{height:on?Math.max(6,d.v/maxD*100)+'%':'6%',transitionDelay:(i*35)+'ms'}});
          })
        ),
        el('div',{className:'blabels'},
          el('span',null,fmt(days[0].d)),
          el('span',null,'сегодня')
        )
      ),
      el('div',{className:'panel',style:{animationDelay:'300ms',gridColumn:'1/-1'}},
        el('h4',null,'По проектам'),
        byProject.map(function(x){
          var tot=x.open+x.done, pct=tot?x.done/tot*100:0;
          return el('div',{className:'arow',key:x.k},
            el('span',{className:'dot',style:{background:x.p.c,width:10,height:10}}),
            el('span',{className:'al',style:{color:x.p.c}},x.p.name),
            el('div',{className:'track',style:{height:8}},
              el('i',{style:{width:(tot/maxP*100)+'%',background:cmix(x.p.c,30),position:'relative'}},
                el('i',{style:{position:'absolute',left:0,top:0,height:'100%',width:pct+'%',background:x.p.c}})
              )
            ),
            el('span',{className:'av',style:{minWidth:50,textAlign:'right'}},x.open+' / '+x.done)
          );
        })
      )
    )
  );
}

/* ================= ФАЙЛЫ ================= */
function FilesView(props){
  var tasks=props.tasks, onOpenTask=props.onOpenTask, toast=props.toast;
  var ctx=useCtx(), members=ctx.members, taskTypes=ctx.taskTypes;
  var s1=useState(SEED_FILES), files=s1[0], setFiles=s1[1];
  var s2=useState(''), q=s2[0], setQ=s2[1];
  var s3=useState('all'), g=s3[0], setG=s3[1];
  var s4=useState(null), up=s4[0], setUp=s4[1];
  var GROUP={mp4:'video',fig:'design',img:'design',xls:'table',doc:'docs',pdf:'docs',zip:'docs'};
  var CHIPS=[['all','Все'],['video','Видео'],['design','Макеты'],['table','Таблицы'],['docs','Документы']];
  var list=files.filter(function(f){
    return (g==='all'||GROUP[f.type]===g) &&
      (!q.trim()||(f.name+' '+(f.types||[]).join(' ')).toLowerCase().includes(q.trim().toLowerCase()));
  });
  var startUpload=function(){
    if(up!==null) return;
    var p=0; setUp(0);
    var iv=setInterval(function(){
      p+=10+Math.random()*16;
      if(p>=100){
        clearInterval(iv); setUp(null);
        setFiles(function(f){
          return [{id:'f'+Date.now(),name:'Баннер_летняя_акция.png',type:'img',size:'2,4 МБ',
            who:'ak',ts:Date.now(),types:['creative']}].concat(f);
        });
        toast('Файл загружен');
      } else setUp(Math.round(p));
    },140);
  };

  return el(React.Fragment,null,
    el('div',{className:'vtool'},
      el('label',{className:'search',style:{width:230}},
        el(Icon,{d:IC.search,size:15}),
        el('input',{placeholder:'Поиск по файлам и типам…',value:q,onChange:function(e){setQ(e.target.value);}}),
        q&&el('button',{className:'x',onClick:function(){setQ('');}},el(Icon,{d:IC.x,size:13}))
      ),
      el('div',{className:'seg',style:{height:'auto'}},
        CHIPS.map(function(e){
          return el('button',{key:e[0],className:g===e[0]?'on':'',onClick:function(){setG(e[0]);}},e[1]);
        })
      ),
      el('span',{style:{flex:1}}),
      up===null
        ? el('button',{className:'btn pri',onClick:startUpload},el(Icon,{d:IC.up,size:15,sw:2.2}),'Загрузить файл')
        : el('div',{className:'uprog'},
            el('div',{className:'track'},el('i',{style:{width:up+'%'}})),
            el('b',null,up+'%')
          )
    ),
    list.length===0
      ? el('div',{className:'nothing'},
          el('b',null,'Файлы не найдены'),'Измените запрос или фильтр типа')
      : el('div',{className:'fgrid'},
          list.map(function(f,i){
            var ft=FT[f.type]||{c:'#98A29B',l:'?'};
            var task=f.task&&tasks.find(function(t){return t.id===f.task;});
            return el('div',{key:f.id,className:'fcard',style:{animationDelay:(i*40)+'ms'},
              onClick:function(){toast('Демо-режим: скачивание недоступно');}},
              el('div',{className:'ftop'},
                el('span',{className:'ftile',style:{background:ft.c}},ft.l),
                el('div',{style:{minWidth:0,flex:1}},
                  el('div',{className:'fname'},f.name),
                  el('div',{className:'fmeta'},f.size+' · '+fmt(new Date(f.ts))+' · '+((members[f.who]||{short:'—'}).short))
                )
              ),
              f.types&&f.types.length>0&&el('div',{className:'ftags'},
                f.types.map(function(tid){
                  var tp=taskTypes[tid]; if(!tp) return null;
                  return el('span',{key:tid,className:'ftag',style:{background:cmix(tp.c,18),color:tp.c}},tp.label);
                })
              ),
              task&&el('button',{className:'flink',onClick:function(e){e.stopPropagation();onOpenTask(task);}},
                el(Icon,{d:IC.board,size:12}),
                'Задача: «'+(task.title.length>26?task.title.slice(0,26)+'…':task.title)+'»'
              )
            );
          })
        )
  );
}

/* ================= ШАБЛОНЫ ================= */
function TemplatesView(props){
  var templates=props.templates, onUse=props.onUse, onDelete=props.onDelete, onCreate=props.onCreate;
  var ctx=useCtx(), taskTypes=ctx.taskTypes;
  return el(React.Fragment,null,
    el('div',{className:'vtool'},
      el('span',null,'Сохранённые шаблоны задач — кликните, чтобы создать задачу на основе шаблона'),
      el('button',{className:'btn pri',onClick:onCreate},el(Icon,{d:IC.plus,size:15,sw:2.2}),'Новый шаблон')
    ),
    templates.length===0
      ? el('div',{className:'nothing'},
          el('b',null,'Нет шаблонов'),
          'Сохраните любую задачу как шаблон через модалку редактирования')
      : el('div',{className:'tplgrid'},
          templates.map(function(tpl){
            return el('div',{key:tpl.id,className:'tplcard'},
              el('h5',null,tpl.name),
              el('p',null,tpl.desc||'Без описания'),
              el('div',{className:'tplmeta'},
                (tpl.data.types||[]).slice(0,3).map(function(tid){
                  var tp=taskTypes[tid]; if(!tp) return null;
                  return el('span',{key:tid,className:'ftag',style:{background:cmix(tp.c,18),color:tp.c}},tp.label);
                }),
                (tpl.data.sub||[]).length>0&&el('span',{className:'ftag'},'Чек-лист: '+tpl.data.sub.length),
                tpl.data.repeat&&tpl.data.repeat!=='none'&&el('span',{className:'ftag'},'Повтор: '+REPEAT[tpl.data.repeat].short)
              ),
              el('div',{className:'tplactions'},
                el('button',{className:'btn pri sm',onClick:function(){onUse(tpl);}},
                  el(Icon,{d:IC.plus,size:12}),'Использовать'),
                el('button',{className:'btn danger',onClick:function(){onDelete(tpl.id);}},
                  el(Icon,{d:IC.trash,size:12}),'Удалить')
              )
            );
          })
        )
  );
}

/* ================= АДМИН-ПАНЕЛЬ ================= */
function AdminView(props){
  var tasks=props.tasks,setTasks=props.setTasks,channels=props.channels,setChannels=props.setChannels,
      members=props.members,setMembers=props.setMembers,me=props.me,setMe=props.setMe,
      sprint=props.sprint,setSprint=props.setSprint,projects=props.projects,setProjects=props.setProjects,
      taskTypes=props.taskTypes,setTaskTypes=props.setTaskTypes,
      setChF=props.setChF,setWhoF=props.setWhoF,logEv=props.logEv,toast=props.toast,resetDemo=props.resetDemo;

  var sM=useState(''),newM=sM[0],setNewM=sM[1];
  var sC=useState(''),newCh=sC[0],setNewCh=sC[1];
  var sP=useState(''),newPr=sP[0],setNewPr=sP[1];
  var sT=useState(''),newTT=sT[0],setNewTT=sT[1];
  var sCC=useState('#2E6BFF'),chColor=sCC[0],setChColor=sCC[1];
  var sPC=useState('#FF5A2D'),prColor=sPC[0],setPrColor=sPC[1];
  var sTC=useState('#2E6BFF'),ttColor=sTC[0],setTtColor=sTC[1];
  var sS=useState(Object.assign({},sprint)),sp=sS[0],setSp=sS[1];
  var sCf=useState(null),confirm=sCf[0],setConfirm=sCf[1];
  var fileRef=useRef(null);
  var SWATCH=['#E5484D','#FF8A00','#E8930C','#0FA36B','#0EA5C6','#2E6BFF','#8B5CF6','#F0447E','#141B17','#98A29B'];
  var PALETTE=['#FF5A2D','#2E6BFF','#0FA36B','#8B5CF6','#F0447E','#0EA5C6','#E8930C','#5BA26B','#E5484D','#F59E0B'];

  var addMember=function(){
    var name=newM.trim(); if(!name){toast('Введите имя сотрудника');return;}
    var parts=name.split(/\s+/);
    var id='u'+Date.now().toString(36);
    var ini=parts.map(function(w){return w[0];}).slice(0,2).join('').toUpperCase();
    var short=parts.length>1?parts[0]+' '+parts[1][0]+'.':name;
    var c=PALETTE[Object.keys(members).length%PALETTE.length];
    setMembers(function(m){var o=Object.assign({},m);o[id]={name:name,short:short,ini:ini,c:c,role:'member'};return o;});
    setNewM(''); logEv('admin','Админ: добавлен сотрудник '+name); toast('Сотрудник добавлен: '+name);
  };
  var setRole=function(k,role){
    setMembers(function(mm){var o=Object.assign({},mm);o[k]=Object.assign({},mm[k],{role:role});return o;});
    logEv('admin','Админ: '+members[k].name+' теперь '+(role==='admin'?'администратор':'участник'));
    toast(role==='admin'?'Права администратора выданы':'Права понижены до участника');
  };
  var doDelMember=function(k,target){
    var nm=members[k].name;
    setTasks(function(ts){
      return target?ts.map(function(t){return t.who===k?Object.assign({},t,{who:target}):t;})
                   :ts.filter(function(t){return t.who!==k;});
    });
    setMembers(function(mm){var o=Object.assign({},mm);delete o[k];return o;});
    setWhoF(function(a){return a.filter(function(x){return x!==k;});});
    if(me===k){setMe(target||Object.keys(members).find(function(x){return x!==k;}));}
    logEv('admin','Админ: удалён сотрудник '+nm+(target?' — задачи переданы':''));
    toast('Сотрудник удалён');
  };
  var askDelMember=function(k){
    if(Object.keys(members).length<=1){toast('Нельзя удалить последнего сотрудника');return;}
    var n=tasks.filter(function(t){return t.who===k;}).length;
    var others=Object.entries(members).filter(function(e){return e[0]!==k;});
    if(n===0){doDelMember(k,null);return;}
    setConfirm({kind:'member',id:k,title:'Удалить сотрудника?',
      text:'У '+members[k].name+' осталось задач: '+n+'. Выберите, кому их передать.',
      candidates:others,target:others[0][0]});
  };
  var addChannel=function(){
    var label=newCh.trim(); if(!label){toast('Введите название канала');return;}
    var id='c'+Date.now().toString(36);
    setChannels(function(cs){var o=Object.assign({},cs);o[id]={label:label,c:chColor};return o;});
    setNewCh(''); logEv('admin','Админ: добавлен канал «'+label+'»'); toast('Канал добавлен: '+label);
  };
  var doDelChannel=function(k,target){
    var label=channels[k].label;
    setTasks(function(ts){
      return target?ts.map(function(t){return t.ch===k?Object.assign({},t,{ch:target}):t;})
                   :ts.filter(function(t){return t.ch!==k;});
    });
    setChannels(function(cs){var o=Object.assign({},cs);delete o[k];return o;});
    setChF(function(a){return a.filter(function(x){return x!==k;});});
    logEv('admin','Админ: удалён канал «'+label+'»'); toast('Канал удалён');
  };
  var askDelChannel=function(k){
    if(Object.keys(channels).length<=1){toast('Нельзя удалить последний канал');return;}
    var n=tasks.filter(function(t){return t.ch===k;}).length;
    var others=Object.entries(channels).filter(function(e){return e[0]!==k;});
    if(n===0){doDelChannel(k,null);return;}
    setConfirm({kind:'channel',id:k,title:'Удалить канал?',
      text:'В канале «'+channels[k].label+'» задач: '+n+'. Выберите канал для переноса.',
      candidates:others,target:others[0][0]});
  };
  var addProject=function(){
    var name=newPr.trim(); if(!name){toast('Введите название проекта');return;}
    var id='pr'+Date.now().toString(36);
    setProjects(function(ps){var o=Object.assign({},ps);o[id]={name:name,c:prColor,goal:'',archived:false};return o;});
    setNewPr(''); logEv('admin','Админ: создан проект «'+name+'»'); toast('Проект создан: '+name);
  };
  var delProject=function(k){
    var n=tasks.filter(function(t){return t.project===k;}).length;
    var name=projects[k].name;
    setTasks(function(ts){return ts.map(function(t){return t.project===k?Object.assign({},t,{project:null}):t;});});
    setProjects(function(ps){var o=Object.assign({},ps);delete o[k];return o;});
    logEv('admin','Админ: удалён проект «'+name+'»');
    toast('Проект удалён'+(n?', задачи отвязаны':''));
  };
  var toggleArchive=function(k){
    setProjects(function(ps){var o=Object.assign({},ps);o[k]=Object.assign({},ps[k],{archived:!ps[k].archived});return o;});
    toast(projects[k].archived?'Проект возвращён в активные':'Проект архивирован');
  };
  var addTaskType=function(){
    var label=newTT.trim(); if(!label){toast('Введите название типа');return;}
    var id='tt'+Date.now().toString(36);
    setTaskTypes(function(tt){var o=Object.assign({},tt);o[id]={label:label,c:ttColor};return o;});
    setNewTT(''); logEv('admin','Админ: создан тип задачи «'+label+'»'); toast('Тип создан: '+label);
  };
  var delTaskType=function(k){
    var label=taskTypes[k].label;
    setTasks(function(ts){return ts.map(function(t){return Object.assign({},t,{types:(t.types||[]).filter(function(x){return x!==k;})});});});
    setTaskTypes(function(tt){var o=Object.assign({},tt);delete o[k];return o;});
    logEv('admin','Админ: удалён тип задачи «'+label+'»'); toast('Тип «'+label+'» удалён');
  };
  var saveSprint=function(){
    if(!sp.name.trim()){toast('Введите название');return;}
    if(pdate(sp.start)>pdate(sp.end)){toast('Начало позже конца');return;}
    setSprint(Object.assign({},sp,{name:sp.name.trim()}));
    logEv('admin','Админ: обновлена кампания'); toast('Настройки сохранены');
  };
  var doExport=function(){
    var data=JSON.stringify({v:3,tasks:tasks,channels:channels,members:members,me:me,sprint:sprint,
      projects:projects,taskTypes:taskTypes},null,2);
    var blob=new Blob([data],{type:'application/json'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='potok-backup-'+iso(today())+'.json';
    a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    logEv('admin','Админ: экспортирован бэкап данных'); toast('Бэкап экспортирован');
  };
  var doImport=function(e){
    var file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file) return;
    var reader=new FileReader();
    reader.onload=function(){
      try{
        var p=JSON.parse(reader.result);
        if(!p||!Array.isArray(p.tasks)) throw new Error('bad');
        setTasks(p.tasks.map(normTask));
        if(p.channels&&Object.keys(p.channels).length) setChannels(p.channels);
        if(p.projects) setProjects(p.projects);
        if(p.taskTypes) setTaskTypes(p.taskTypes);
        if(p.sprint) setSprint(p.sprint);
        toast('Данные импортированы');
      }catch(err){toast('Не удалось импортировать файл');}
    };
    reader.readAsText(file);
  };
  var doConfirm=function(){
    if(confirm.kind==='member') doDelMember(confirm.id,confirm.candidates?confirm.target:null);
    if(confirm.kind==='channel') doDelChannel(confirm.id,confirm.candidates?confirm.target:null);
    if(confirm.kind==='clear'){setTasks([]);logEv('admin','Админ: очищены все задачи');toast('Все задачи удалены');}
    setConfirm(null);
  };

  var swatches=function(cur,set){
    return el('div',{className:'swatches'},
      SWATCH.map(function(c){
        return el('button',{key:c,className:'sw'+(cur===c?' on':''),style:{background:c},
          title:c,onClick:function(){set(c);}});
      })
    );
  };

  var activeProjects=Object.entries(projects).filter(function(e){return !e[1].archived;});
  var archivedProjects=Object.entries(projects).filter(function(e){return e[1].archived;});

  return el(React.Fragment,null,
    el('div',{className:'agrid'},
      // Команда
      el('div',{className:'panel apanel'},
        el('h4',null,el(Icon,{d:IC.user,size:14}),'Команда и роли'),
        Object.entries(members).map(function(e){
          var k=e[0],m=e[1];
          return el('div',{key:k,className:'arow2'},
            el(Avatar,{id:k,size:30}),
            el('div',{style:{minWidth:0,flex:1}},
              el('div',{className:'aname'},m.name,k===me&&el('span',{className:'you'},'вы')),
              el('div',{className:'asub'},tasks.filter(function(t){return t.who===k&&!isDone(t);}).length+' открытых задач')
            ),
            el('select',{className:'rolesel',value:m.role||'member',title:'Роль',
              onChange:function(ev){setRole(k,ev.target.value);}},
              el('option',{value:'admin'},'админ'),
              el('option',{value:'member'},'участник')
            ),
            el('button',{className:'ibtn',title:'Удалить',onClick:function(){askDelMember(k);}},
              el(Icon,{d:IC.trash,size:14}))
          );
        }),
        el('div',{className:'aadd'},
          el('input',{placeholder:'Имя Фамилия нового сотрудника…',value:newM,
            onChange:function(e){setNewM(e.target.value);},
            onKeyDown:function(e){if(e.key==='Enter')addMember();}}),
          el('button',{className:'btn pri',style:{height:40},onClick:addMember},
            el(Icon,{d:IC.plus,size:14,sw:2.4}),'Добавить')
        )
      ),
      // Каналы
      el('div',{className:'panel apanel',style:{animationDelay:'60ms'}},
        el('h4',null,el(Icon,{d:IC.board,size:14}),'Каналы'),
        Object.entries(channels).map(function(e){
          var k=e[0],c=e[1];
          return el('div',{key:k,className:'arow2'},
            el('span',{className:'dot',style:{background:c.c,width:12,height:12}}),
            el('div',{style:{minWidth:0,flex:1}},
              el('div',{className:'aname'},c.label),
              el('div',{className:'asub'},tasks.filter(function(t){return t.ch===k&&!isDone(t);}).length+' открытых задач')
            ),
            el('button',{className:'ibtn',title:'Удалить',onClick:function(){askDelChannel(k);}},
              el(Icon,{d:IC.trash,size:14}))
          );
        }),
        el('div',{className:'aadd'},
          el('input',{placeholder:'Название нового канала…',value:newCh,
            onChange:function(e){setNewCh(e.target.value);},
            onKeyDown:function(e){if(e.key==='Enter')addChannel();}}),
          el('button',{className:'btn pri',style:{height:40},onClick:addChannel},
            el(Icon,{d:IC.plus,size:14,sw:2.4}),'Добавить')
        ),
        swatches(chColor,setChColor)
      ),
      // Проекты
      el('div',{className:'panel apanel',style:{animationDelay:'120ms',gridColumn:'1/-1'}},
        el('h4',null,el(Icon,{d:IC.target,size:14}),'Проекты'),
        activeProjects.map(function(e){
          var k=e[0],p=e[1];
          return el('div',{key:k,className:'arow2'},
            el('span',{className:'dot',style:{background:p.c,width:12,height:12}}),
            el('div',{style:{minWidth:0,flex:1}},
              el('div',{className:'aname'},p.name),
              el('div',{className:'asub'},tasks.filter(function(t){return t.project===k&&!isDone(t);}).length+' открытых · '+(p.goal||'без цели'))
            ),
            el('button',{className:'ibtn',title:'Архивировать',onClick:function(){toggleArchive(k);}},
              el(Icon,{d:IC.folder,size:14})),
            el('button',{className:'ibtn',title:'Удалить',onClick:function(){delProject(k);}},
              el(Icon,{d:IC.trash,size:14}))
          );
        }),
        archivedProjects.length>0&&el(React.Fragment,null,
          el('div',{className:'asub',style:{padding:'8px 8px 4px'}},'Архив'),
          archivedProjects.map(function(e){
            var k=e[0],p=e[1];
            return el('div',{key:k,className:'arow2',style:{opacity:.6}},
              el('span',{className:'dot',style:{background:p.c,width:12,height:12}}),
              el('div',{style:{minWidth:0,flex:1}},
                el('div',{className:'aname'},p.name),
                el('div',{className:'asub'},'в архиве')
              ),
              el('button',{className:'ibtn',title:'Вернуть',onClick:function(){toggleArchive(k);}},
                el(Icon,{d:IC.redo,size:14}))
            );
          })
        ),
        el('div',{className:'aadd'},
          el('input',{placeholder:'Название нового проекта…',value:newPr,
            onChange:function(e){setNewPr(e.target.value);},
            onKeyDown:function(e){if(e.key==='Enter')addProject();}}),
          el('button',{className:'btn pri',style:{height:40},onClick:addProject},
            el(Icon,{d:IC.plus,size:14,sw:2.4}),'Создать')
        ),
        swatches(prColor,setPrColor)
      ),
      // Типы задач
      el('div',{className:'panel apanel',style:{animationDelay:'180ms',gridColumn:'1/-1'}},
        el('h4',null,el(Icon,{d:IC.template,size:14}),'Типы задач'),
        el('p',{className:'asub',style:{marginBottom:10}},'Цветные метки для классификации задач. Можно создавать свои типы.'),
        el('div',{style:{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}},
          Object.entries(taskTypes).map(function(e){
            var k=e[0],tp=e[1];
            return el('span',{key:k,className:'ttype',style:{background:tp.c}},
              tp.label,
              el('button',{onClick:function(){delTaskType(k);},title:'Удалить тип',
                style:{border:0,background:'rgba(255,255,255,.3)',borderRadius:'50%',width:14,height:14,
                  display:'grid',placeItems:'center',cursor:'pointer',color:'#fff',marginLeft:4}},
                el(Icon,{d:IC.x,size:9}))
            );
          })
        ),
        el('div',{className:'aadd'},
          el('input',{placeholder:'Название нового типа…',value:newTT,
            onChange:function(e){setNewTT(e.target.value);},
            onKeyDown:function(e){if(e.key==='Enter')addTaskType();}}),
          el('button',{className:'btn pri',style:{height:40},onClick:addTaskType},
            el(Icon,{d:IC.plus,size:14,sw:2.4}),'Создать тип')
        ),
        swatches(ttColor,setTtColor)
      ),
      // Кампания
      el('div',{className:'panel apanel',style:{animationDelay:'240ms'}},
        el('h4',null,el(Icon,{d:IC.cal,size:14}),'Кампания / период'),
        el('div',{className:'f',style:{marginTop:0}},
          el('label',null,'Название'),
          el('input',{type:'text',value:sp.name,onChange:function(e){setSp(function(s){return Object.assign({},s,{name:e.target.value});});}}),
          el('label',null,'Цель кампании'),
          el('input',{type:'text',placeholder:'Например: +30% регистраций',value:sp.goal||'',
            onChange:function(e){setSp(function(s){return Object.assign({},s,{goal:e.target.value});});}}),
          el('div',{className:'frow'},
            el('div',null,el('label',null,'Начало'),
              el('input',{type:'date',value:sp.start,onChange:function(e){setSp(function(s){return Object.assign({},s,{start:e.target.value});});}})),
            el('div',null,el('label',null,'Конец'),
              el('input',{type:'date',value:sp.end,onChange:function(e){setSp(function(s){return Object.assign({},s,{end:e.target.value});});}}))
          )
        ),
        el('div',{style:{marginTop:14,display:'flex',alignItems:'center',gap:12}},
          el('button',{className:'btn pri',style:{height:40},onClick:saveSprint},'Сохранить'),
          el('span',{className:'asub'},'До конца: '+Math.max(0,Math.round((pdate(sp.end)-today())/DAY))+' дн.')
        )
      ),
      // Войти как
      el('div',{className:'panel apanel',style:{animationDelay:'300ms'}},
        el('h4',null,el(Icon,{d:IC.shield,size:14}),'Войти как'),
        el('p',{className:'asub',style:{marginBottom:12}},'«Мои задачи» и комментарии — от имени выбранного сотрудника.'),
        el('div',{className:'alogin'},
          Object.entries(members).map(function(e){
            var k=e[0],m=e[1];
            return el('button',{key:k,className:me===k?'on':'',onClick:function(){
              setMe(k); logEv('admin','Админ: вошли как '+m.name); toast('Вы вошли как '+m.name);
            }},
              el(Avatar,{id:k,size:34}),
              m.short+(m.role==='admin'?' · админ':'')
            );
          })
        )
      ),
      // Данные
      el('div',{className:'panel apanel',style:{gridColumn:'1/-1',animationDelay:'360ms'}},
        el('h4',null,el(Icon,{d:IC.folder,size:14}),'Данные'),
        el('div',{className:'adata'},
          el('div',null,el('b',null,tasks.length),'задач'),
          el('div',null,el('b',null,Object.keys(members).length),'сотрудников'),
          el('div',null,el('b',null,Object.keys(channels).length),'каналов'),
          el('div',null,el('b',null,Object.keys(projects).length),'проектов'),
          el('div',null,el('b',null,Object.keys(taskTypes).length),'типов')
        ),
        el('div',{className:'abtns'},
          el('button',{className:'btn ghost',onClick:doExport},el(Icon,{d:IC.up,size:14}),'Экспорт JSON'),
          el('button',{className:'btn ghost',onClick:function(){fileRef.current&&fileRef.current.click();}},
            el(Icon,{d:IC.right,size:14}),'Импорт JSON'),
          el('input',{ref:fileRef,type:'file',accept:'application/json,.json',style:{display:'none'},onChange:doImport}),
          el('button',{className:'btn danger',onClick:function(){
            setConfirm({kind:'clear',title:'Удалить все задачи?',
              text:'Будет удалено задач: '+tasks.length+'. Действие необратимо (без бэкапа).'});
          }},el(Icon,{d:IC.trash,size:14}),'Очистить задачи'),
          el('button',{className:'btn danger',onClick:resetDemo},el(Icon,{d:IC.redo,size:14}),'Сбросить демо')
        )
      )
    ),
    // Подтверждение
    confirm&&el('div',{className:'overlay',onMouseDown:function(e){if(e.target===e.currentTarget)setConfirm(null);}},
      el('div',{className:'modal sm'},
        el('h3',null,confirm.title),
        el('p',{className:'mtext'},confirm.text),
        confirm.candidates&&el('div',{className:'f'},
          el('label',null,'Передать задачи'),
          el('select',{value:confirm.target,onChange:function(e){setConfirm(function(c){return Object.assign({},c,{target:e.target.value});});}},
            confirm.candidates.map(function(e){
              return el('option',{key:e[0],value:e[0]},e[1].name||e[1].label);
            })
          )
        ),
        el('div',{className:'mfoot'},
          el('span',{style:{flex:1}}),
          el('button',{className:'btn ghost',onClick:function(){setConfirm(null);}},'Отмена'),
          el('button',{className:'btn danger',onClick:doConfirm},'Удалить')
        )
      )
    )
  );
}

console.log('✓ 06-views2.js загружен');
