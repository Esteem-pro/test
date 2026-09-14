// js/07-modals.js
// Command Palette, Quick Dropdown, полная TaskModal

var el = React.createElement;

/* ================= COMMAND PALETTE ================= */
function CommandPalette(props){
  var tasks=props.tasks, channels=props.channels, projects=props.projects,
      onSelect=props.onSelect, onClose=props.onClose;
  var s1=useState(''), q=s1[0], setQ=s1[1];
  var inputRef=useRef(null);
  
  useEffect(function(){
    if(inputRef.current) inputRef.current.focus();
  },[]);
  
  useEffect(function(){
    var h=function(e){ if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown',h);
    return function(){ window.removeEventListener('keydown',h); };
  },[onClose]);
  
  var items=[];
  tasks.forEach(function(t){
    if(q.trim()==='' || t.title.toLowerCase().includes(q.toLowerCase())){
      items.push({kind:'task',id:t.id,label:t.title,sub:(channels[t.ch]||{}).label||'—',color:(channels[t.ch]||{}).c||'#98A29B'});
    }
  });
  Object.entries(projects).forEach(function(e){
    if(!e[1].archived && (q.trim()==='' || e[1].name.toLowerCase().includes(q.toLowerCase()))){
      items.push({kind:'project',id:e[0],label:e[1].name,sub:'Проект',color:e[1].c});
    }
  });
  Object.entries(channels).forEach(function(e){
    if(q.trim()==='' || e[1].label.toLowerCase().includes(q.toLowerCase())){
      items.push({kind:'channel',id:e[0],label:e[1].label,sub:'Канал',color:e[1].c});
    }
  });
  
  return el('div',{className:'overlay',style:{alignItems:'flex-start',paddingTop:'10vh'},
    onMouseDown:function(e){if(e.target===e.currentTarget)onClose();}},
    el('div',{className:'cmd',onClick:function(e){e.stopPropagation();}},
      el('div',{className:'cmd-in'},
        el(Icon,{d:IC.search,size:16}),
        el('input',{ref:inputRef,placeholder:'Поиск задач, проектов, каналов...',
          value:q,onChange:function(e){setQ(e.target.value);}}),
        el('span',{style:{fontSize:10,padding:'2px 6px',background:'var(--soft)',borderRadius:4}},'ESC')
      ),
      el('div',{className:'cmd-list'},
        items.length===0 && el('div',{style:{padding:20,textAlign:'center',color:'var(--mut)'}},'Ничего не найдено'),
        items.slice(0,20).map(function(item){
          return el('div',{key:item.kind+item.id,className:'cmd-item',
            onClick:function(){onSelect(item);}},
            el('div',{className:'ci-ic',style:{background:item.color}},
              item.kind==='task' ? el(Icon,{d:IC.board,size:14}) :
              item.kind==='project' ? el(Icon,{d:IC.target,size:14}) :
              el(Icon,{d:IC.board,size:14})
            ),
            el('span',{className:'ci-t'},item.label),
            el('span',{className:'ci-s'},item.sub)
          );
        })
      )
    )
  );
}

/* ================= QUICK DROPDOWN ================= */
function QuickDropdown(props){
  var target=props.target, options=props.options, currentValue=props.currentValue,
      onSelect=props.onSelect, onClose=props.onClose;
  var ref=useRef(null);
  
  useEffect(function(){
    var h=function(e){
      if(ref.current && !ref.current.contains(e.target) && e.target!==target){
        onClose();
      }
    };
    setTimeout(function(){ document.addEventListener('mousedown',h); },100);
    return function(){ document.removeEventListener('mousedown',h); };
  },[onClose,target]);
  
  if(!target) return null;
  var rect=target.getBoundingClientRect();
  
  return el('div',{ref:ref,className:'qdd',style:{
    position:'fixed',
    left:Math.min(rect.left,window.innerWidth-260)+'px',
    top:(rect.bottom+4)+'px'}},
    options.map(function(o){
      return el('button',{key:String(o.value),className:o.value===currentValue?'on':'',
        onClick:function(){onSelect(o.value);onClose();}},
        o.color&&el('span',{className:'dot',style:{background:o.color}}),
        el('span',{style:{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},o.label)
      );
    })
  );
}

/* ================= TASK MODAL ================= */
function TaskModal(props){
  var init=props.init, live=props.live, defaultBoard=props.defaultBoard, defaultCol=props.defaultCol,
      defaultDue=props.defaultDue, onClose=props.onClose, onSave=props.onSave, onDelete=props.onDelete,
      onSaveAsTemplate=props.onSaveAsTemplate, createType=props.createType;
  var ctx=useCtx();
  var channels=ctx.channels, members=ctx.members, me=ctx.me, now=ctx.now,
      toggleTimer=ctx.toggleTimer, resetTimer=ctx.resetTimer,
      projects=ctx.projects, taskTypes=ctx.taskTypes;
  
  var firstCh=Object.keys(channels)[0];
  var firstWho=Object.keys(members)[0];
  var firstProject=Object.keys(projects).find(function(k){return !projects[k].archived;})||null;
  
  var sF=useState(function(){
    if(init){
      return Object.assign({},init,{
        sub:init.sub.map(function(s){return Object.assign({},s);}),
        coms:init.coms.slice(),
        tags:(init.tags||[]).slice(),
        types:(init.types||[]).slice(),
        attachments:(init.attachments||[]).slice()
      });
    }
    return {id:null,board:defaultBoard||'main',
      col:defaultCol||colsOf(defaultBoard||'main')[0].id,
      title:'',desc:'',ch:firstCh,who:firstWho,pr:'mid',
      due:defaultDue||iso(addDays(3)),sub:[],coms:[],tags:[],types:[],attachments:[],
      repeat:'none',time:null,project:firstProject};
  }), f=sF[0], setF=sF[1];
  
  var sCom=useState(''), comText=sCom[0], setComText=sCom[1];
  var sTag=useState(''), tagInput=sTag[0], setTagInput=sTag[1];
  var sTT=useState(''), ttInput=sTT[0], setTtInput=sTT[1];
  var sTTC=useState('#2E6BFF'), ttColor=sTTC[0], setTtColor=sTTC[1];
  
  var set=function(k,v){setF(function(s){var o=Object.assign({},s);o[k]=v;return o;});};
  
  useEffect(function(){
    var h=function(e){if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',h);
    return function(){window.removeEventListener('keydown',h);};
  },[onClose]);
  
  var subDone=f.sub.filter(function(s){return s.done;}).length;
  var setSub=function(i,patch){
    setF(function(s){return Object.assign({},s,{sub:s.sub.map(function(x,j){return j===i?Object.assign({},x,patch):x;})});});
  };
  var addSub=function(t){setF(function(s){return Object.assign({},s,{sub:s.sub.concat([{t:t,done:false}])});});};
  var addTag=function(v){
    var tg=v.trim().toLowerCase().replace(/^#/,'');
    if(!tg||f.tags.includes(tg))return;
    setF(function(s){return Object.assign({},s,{tags:s.tags.concat([tg])});});
  };
  var toggleType=function(tid){
    setF(function(s){
      var types=s.types||[];
      return Object.assign({},s,{types:types.includes(tid)?types.filter(function(x){return x!==tid;}):types.concat([tid])});
    });
  };
  var submitType=function(){
    var label=ttInput.trim(); if(!label)return;
    var match=Object.entries(taskTypes).find(function(e){return e[1].label.toLowerCase()===label.toLowerCase();});
    if(match) toggleType(match[0]);
    else if(createType) toggleType(createType(label));
    setTtInput('');
  };
  var addCom=function(){
    if(!comText.trim())return;
    setF(function(s){return Object.assign({},s,{coms:s.coms.concat([{who:me,ts:Date.now(),text:comText.trim()}])});});
    setComText('');
  };
  var ok=f.title.trim().length>0;
  var liveRunning=live&&live.time&&live.time.run;
  
  return el('div',{className:'overlay',onMouseDown:function(e){if(e.target===e.currentTarget)onClose();}},
    el('div',{className:'modal'},
      el('button',{className:'mclose',onClick:onClose},el(Icon,{d:IC.x,size:16})),
      el('h3',null,init?'Редактировать задачу':'Новая задача'),
      el('div',{className:'f'},
        el('label',null,'Название'),
        el('input',{type:'text',autoFocus:true,placeholder:'Что нужно сделать?',value:f.title,
          onChange:function(e){set('title',e.target.value);}}),
        el('label',null,'Описание'),
        el('textarea',{rows:2,placeholder:'Детали, ссылки, критерии готовности…',value:f.desc,
          onChange:function(e){set('desc',e.target.value);}}),
        
        el('div',{className:'frow'},
          el('div',null,
            el('label',null,'Доска'),
            el('div',{className:'seg',style:{height:'auto'}},
              Object.entries(BOARDS).map(function(e){
                var k=e[0],b=e[1];
                return el('button',{key:k,type:'button',className:f.board===k?'on':'',
                  onClick:function(){setF(function(s){return Object.assign({},s,{board:k,col:colsOf(k)[0].id});});}},b.title);
              })
            )
          ),
          el('div',null,
            el('label',null,'Проект'),
            el('select',{value:f.project||'',style:{width:'100%',border:'1px solid var(--line)',borderRadius:10,
              padding:'10px 12px',fontSize:14,color:'var(--ink)',background:'var(--field)',outline:'none'},
              onChange:function(e){set('project',e.target.value||null);}},
              el('option',{value:''},'— Без проекта —'),
              Object.entries(projects).filter(function(e){return !e[1].archived;}).map(function(e){
                return el('option',{key:e[0],value:e[0]},e[1].name);
              })
            )
          )
        ),
        
        el('div',{className:'frow'},
          el('div',null,
            el('label',null,'Канал'),
            el('div',{className:'chipsel'},
              Object.entries(channels).map(function(e){
                var k=e[0],c=e[1];
                return el('button',{key:k,type:'button',
                  style:f.ch===k?{background:cmix(c.c,15),borderColor:c.c,color:c.c}:{},
                  onClick:function(){set('ch',k);}},c.label);
              })
            )
          ),
          el('div',null,
            el('label',null,'Исполнитель'),
            el('div',{className:'avasel'},
              Object.entries(members).map(function(e){
                var k=e[0],m=e[1];
                return el('button',{key:k,type:'button',className:f.who===k?'on':'',style:{background:m.c},
                  title:m.name,onClick:function(){set('who',k);}},m.ini);
              })
            )
          )
        ),
        
        el('div',{className:'frow'},
          el('div',null,
            el('label',null,'Типы задач'),
            el('div',{className:'ttbox'},
              (f.types||[]).map(function(tid){
                var tp=taskTypes[tid]; if(!tp) return null;
                return el('span',{key:tid,className:'ttype',style:{background:tp.c}},
                  tp.label,
                  el('button',{onClick:function(){toggleType(tid);},title:'Убрать тип'},el(Icon,{d:IC.x,size:9}))
                );
              }),
              el('div',{className:'ttadd'},
                el('input',{placeholder:'Выбрать или создать…',list:'tt-list',value:ttInput,
                  onChange:function(e){setTtInput(e.target.value);},
                  onKeyDown:function(e){if(e.key==='Enter'){e.preventDefault();submitType();}}}),
                el('datalist',{id:'tt-list'},
                  Object.entries(taskTypes).map(function(e){
                    return el('option',{key:e[0],value:e[1].label});
                  })
                )
              )
            ),
            el('div',{style:{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}},
              Object.entries(taskTypes).filter(function(e){return !(f.types||[]).includes(e[0]);}).map(function(e){
                var k=e[0],tp=e[1];
                return el('button',{key:k,type:'button',className:'ttype',style:{background:tp.c,opacity:.65},
                  onClick:function(){toggleType(k);},title:'Добавить тип'},tp.label);
              })
            ),
            el('div',{className:'swatches'},
              ['#E5484D','#FF8A00','#E8930C','#0FA36B','#0EA5C6','#2E6BFF','#8B5CF6','#F0447E'].map(function(c){
                return el('button',{key:c,type:'button',className:'sw'+(ttColor===c?' on':''),
                  style:{background:c},title:c,onClick:function(){setTtColor(c);}});
              })
            )
          ),
          el('div',null,
            el('label',null,'Теги (дополнительно)'),
            el('div',{className:'tagbox'},
              f.tags.map(function(tg,i){
                return el('span',{key:tg,className:'tagchip'},'#'+tg,
                  el('button',{onClick:function(){setF(function(s){return Object.assign({},s,{tags:s.tags.filter(function(_,j){return j!==i;})});});}},
                    el(Icon,{d:IC.x,size:10,sw:2.4}))
                );
              }),
              el('input',{placeholder:'Тег + Enter…',value:tagInput,
                onChange:function(e){setTagInput(e.target.value);},
                onKeyDown:function(e){if(e.key==='Enter'){e.preventDefault();addTag(tagInput);setTagInput('');}}})
            )
          )
        ),
        
        el('div',{className:'frow3'},
          el('div',null,el('label',null,'Дедлайн'),
            el('input',{type:'date',value:f.due,onChange:function(e){set('due',e.target.value);}})),
          el('div',null,el('label',null,'Повтор'),
            el('select',{value:f.repeat,onChange:function(e){set('repeat',e.target.value);}},
              Object.entries(REPEAT).map(function(e){
                return el('option',{key:e[0],value:e[0]},e[1].l);
              })
            )),
          el('div',null,el('label',null,'Статус'),
            el('select',{value:f.col,onChange:function(e){set('col',e.target.value);}},
              colsOf(f.board).map(function(c){
                return el('option',{key:c.id,value:c.id},c.t);
              })
            ))
        ),
        
        el('div',{className:'frow'},
          el('div',null,
            el('label',null,'Приоритет'),
            el('div',{className:'seg',style:{height:'auto'}},
              [['high','▲ Выс.'],['mid','● Сред.'],['low','▽ Низ.']].map(function(e){
                return el('button',{key:e[0],type:'button',className:f.pr===e[0]?'on':'',
                  onClick:function(){set('pr',e[0]);}},e[1]);
              })
            )
          ),
          init&&live&&el('div',null,
            el('label',null,'Таймер задачи'),
            el('div',{className:'trow',style:{marginTop:0}},
              el('b',{className:'ttime',style:{fontSize:17,minWidth:80}},fmtDur(elapsed(live,now))),
              el('button',{className:'btn sm '+(liveRunning?'ghost':'pri'),
                onClick:function(){toggleTimer(init.id);}},
                el(Icon,{d:liveRunning?IC.pause:IC.play,size:11,sw:2.4}),liveRunning?'Пауза':'Старт'),
              el('button',{className:'btn sm ghost',onClick:function(){resetTimer(init.id);}},'Сброс')
            )
          )
        ),
        
        el('div',{className:'mcols'},
          el('div',null,
            el('label',null,'Чек-лист'+(f.sub.length>0?' · '+subDone+'/'+f.sub.length:'')),
            f.sub.map(function(s,i){
              return el('div',{key:i,className:'ck'+(s.done?' done':'')},
                el('input',{type:'checkbox',checked:s.done,onChange:function(){setSub(i,{done:!s.done});}}),
                el('span',null,s.t),
                el('button',{className:'rm',title:'Убрать пункт',
                  onClick:function(){setF(function(s2){return Object.assign({},s2,{sub:s2.sub.filter(function(_,j){return j!==i;})});});}},
                  el(Icon,{d:IC.x,size:11}))
              );
            }),
            el('div',{className:'ckadd'},
              el('input',{placeholder:'Новый пункт и Enter…',
                onKeyDown:function(e){
                  if(e.key==='Enter'&&e.target.value.trim()){addSub(e.target.value.trim());e.target.value='';}
                }})
            )
          ),
          el('div',null,
            el('label',null,'Комментарии'+(f.coms.length>0?' · '+f.coms.length:'')),
            el('div',{className:'cmts'},
              f.coms.length===0&&el('div',{className:'cempty'},'Пока тихо — напишите первым.'),
              f.coms.map(function(c,i){
                return el('div',{key:i,className:'cmt'},
                  el(Avatar,{id:c.who,size:24}),
                  el('div',{className:'b'},
                    el('small',null,(members[c.who]||{short:'—'}).short+(c.who===me?' · вы':'')+' · '+fmtT(c.ts)),
                    el('p',null,c.text)
                  )
                );
              })
            ),
            el('div',{className:'cinput'},
              el('input',{placeholder:'Комментарий…',value:comText,
                onChange:function(e){setComText(e.target.value);},
                onKeyDown:function(e){if(e.key==='Enter')addCom();}}),
              el('button',{className:'csend',title:'Отправить',onClick:addCom},el(Icon,{d:IC.up,size:15,sw:2}))
            )
          )
        ),
        
        // БЛОК ФОТО
        el('div',{style:{marginTop:6}},
          el(PhotoBlock,{
            attachments:f.attachments||[],
            onChange:function(next){set('attachments',next);}
          })
        )
      ),
      el('div',{className:'mfoot'},
        init&&el('button',{className:'btn danger',onClick:function(){onDelete(init.id);}},
          el(Icon,{d:IC.trash,size:14}),'Удалить'),
        init&&el('button',{className:'btn ghost',title:'Сохранить как шаблон',
          onClick:function(){onSaveAsTemplate(init);}},
          el(Icon,{d:IC.template,size:14}),'Шаблон'),
        el('span',{style:{flex:1}}),
        el('button',{className:'btn ghost',onClick:onClose},'Отмена'),
        el('button',{className:'btn pri',disabled:!ok,onClick:function(){onSave(f);}},
          init?'Сохранить':'Создать задачу')
      )
    )
  );
}

console.log('✓ 07-modals.js загружен');
