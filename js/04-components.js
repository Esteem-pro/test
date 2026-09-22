// js/04-components.js
// Компоненты

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;
var useRef = React.useRef;
var useLayoutEffect = React.useLayoutEffect;

// Аватар
var Avatar = function(props) {
  var ctx = useCtx();
  var members = ctx.members;
  var id = props.id, size = props.size || 24, onClick = props.onClick;
  var m = members[id] || {ini:'?',c:'#98A29B',name:'—'};
  return React.createElement('span', {
    className:'ava', title:m.name,
    onClick: onClick ? function(e){ e.stopPropagation(); onClick(id, e); } : undefined,
    style:{width:size,height:size,background:m.c,fontSize:Math.max(7,Math.round(size*.36))}
  }, m.ini);
};

// Анимированный счётчик
function useCountUp(to){
  var ref = useState(0), n = ref[0], setN = ref[1];
  var cur = useRef(0);
  useEffect(function(){
    var from = cur.current, raf, t0 = performance.now();
    var step = function(t){
      var p = Math.min(1,(t-t0)/600), e = 1-Math.pow(1-p,3);
      var v = Math.round(from+(to-from)*e);
      cur.current = v; setN(v);
      if(p<1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return function(){ cancelAnimationFrame(raf); };
  },[to]);
  return n;
}

var Stat = function(props){
  var lbl=props.lbl, n=props.n, sub=props.sub, c=props.c, alert=props.alert;
  var v = useCountUp(n);
  return React.createElement('div',{className:'stat'},
    React.createElement('div',{className:'lbl'},lbl),
    React.createElement('div',{className:'num',style:{color:c}},v),
    React.createElement('div',{className:'sub'},(alert?'⚠ ':'')+sub)
  );
};

// Кольцо прогресса
var Ring = function(props){
  var pct=props.pct, size=props.size||58;
  var r=(size-9)/2, c=2*Math.PI*r;
  return React.createElement('svg',{width:size,height:size},
    React.createElement('circle',{cx:size/2,cy:size/2,r:r,stroke:'var(--track)',strokeWidth:7,fill:'none'}),
    React.createElement('circle',{cx:size/2,cy:size/2,r:r,stroke:'#0FA36B',strokeWidth:7,fill:'none',
      strokeLinecap:'round',strokeDasharray:c,strokeDashoffset:c*(1-pct),
      transform:'rotate(-90 '+size/2+' '+size/2+')',
      style:{transition:'stroke-dashoffset .8s ease'}}),
    React.createElement('text',{x:'50%',y:'53%',dominantBaseline:'middle',textAnchor:'middle',
      style:{font:"700 12px 'Unbounded'",fill:'var(--ink)'}},Math.round(pct*100)+'%')
  );
};

// Бар
function Bar(props){
  var pct=props.pct, c=props.c, h=props.h||8;
  var ref=useState(0), w=ref[0], setW=ref[1];
  useEffect(function(){
    var t=setTimeout(function(){setW(pct);},80);
    return function(){clearTimeout(t);};
  },[pct]);
  return React.createElement('div',{className:'track',style:{height:h}},
    React.createElement('i',{style:{width:w+'%',background:c,transition:'width .7s cubic-bezier(.2,.7,.3,1)'}})
  );
}

// Донат
function Donut(props){
  var data=props.data, size=props.size||140, thick=props.thick||18;
  var total = data.reduce(function(s,d){return s+d.v;},0)||1;
  var r=(size-thick)/2, c=2*Math.PI*r, acc=0;
  var circles = data.map(function(d,i){
    var frac=d.v/total, len=Math.max(frac*c-2,1.5), off=-acc*c; acc+=frac;
    return React.createElement('circle',{key:i,cx:size/2,cy:size/2,r:r,fill:'none',stroke:d.c,
      strokeWidth:thick,strokeDasharray:len+' '+c,strokeDashoffset:off,
      transform:'rotate(-90 '+size/2+' '+size/2+')',
      style:{transition:'stroke-dasharray .6s'}});
  });
  return React.createElement('svg',{width:size,height:size},
    circles,
    React.createElement('text',{x:'50%',y:'48%',dominantBaseline:'middle',textAnchor:'middle',
      style:{font:"700 20px 'Unbounded'",fill:'var(--ink)'}},total),
    React.createElement('text',{x:'50%',y:'63%',dominantBaseline:'middle',textAnchor:'middle',
      style:{font:"500 9px 'Golos Text'",fill:'var(--mut)'}},'открыто')
  );
}

// Таймер чип
function TimerChip(props){
  var ctx=useCtx();
  var now=ctx.now, toggleTimer=ctx.toggleTimer;
  var t=props.t;
  var running = t.time && t.time.run;
  var s = elapsed(t,now);
  return React.createElement('button',{
    className:'tchip'+(running?' run':''),
    title:running?'Остановить таймер':'Запустить таймер',
    onClick:function(e){e.stopPropagation();toggleTimer(t.id);}
  },
    running ? React.createElement('span',{className:'rdot'}) : React.createElement(Icon,{d:IC.play,size:9}),
    React.createElement('span',null,fmtDur(s))
  );
}
/* ================= INLINE-РЕДАКТОРЫ ================= */
function Popover(props){
  var target=props.target, onClose=props.onClose, width=props.width||260;
  var ref=useRef(null);
  var st=useState(null), pos=st[0], setPos=st[1];
  useEffect(function(){
    var h=function(e){
      if(ref.current&&!ref.current.contains(e.target)&&target&&!target.contains(e.target)) onClose();
    };
    setTimeout(function(){document.addEventListener('mousedown',h);},50);
    return function(){document.removeEventListener('mousedown',h);};
  },[]);
  useLayoutEffect(function(){
    if(!target||!ref.current) return;
    var r=target.getBoundingClientRect();
    var ph=ref.current.offsetHeight;
    var top=r.bottom+6;
    if(top+ph>window.innerHeight-8) top=Math.max(8, r.top-ph-6);
    var left=Math.max(8, Math.min(r.left, window.innerWidth-width-12));
    setPos({top:top,left:left});
  },[target]);
  if(!target) return null;
  return ReactDOM.createPortal(
    React.createElement('div',{ref:ref,className:'qdd',
      onClick:function(e){e.stopPropagation();},
      onMouseDown:function(e){e.stopPropagation();},
      style:{position:'fixed',zIndex:70,
        visibility:pos?'visible':'hidden',
        left:(pos?pos.left:0)+'px',top:(pos?pos.top:0)+'px',
        minWidth:width+'px',maxWidth:width+'px',
        maxHeight:'70vh',overflowY:'auto'}},props.children),
    document.body);
}

function InlineText(props){
  var value=props.value||'', multiline=props.multiline, onSave=props.onSave,
      placeholder=props.placeholder, tag=props.tag||'span', extraStyle=props.style;
  var st=useState(false), editing=st[0], setEditing=st[1];
  var sv=useState(value), v=sv[0], setV=sv[1];
  useEffect(function(){ if(!editing) setV(value); },[value,editing]);
  var commit=function(){
    setEditing(false);
    var nv=v.trim();
    if(nv&&nv!==value) onSave(nv); else setV(value);
  };
  if(!editing){
    return React.createElement(tag,{
      style:Object.assign({cursor:'text'},extraStyle),
      title:'Кликните, чтобы изменить',
      onClick:function(e){e.stopPropagation();setEditing(true);}},
      value||placeholder||'—');
  }
  if(multiline){
    return React.createElement('textarea',{autoFocus:true,rows:2,className:'inline-edit',value:v,
      onClick:function(e){e.stopPropagation();},
      onChange:function(e){setV(e.target.value);},
      onBlur:commit,
      onKeyDown:function(e){
        if(e.key==='Escape'){setV(value);setEditing(false);}
        if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){commit();}
      }});
  }
  return React.createElement('input',{type:'text',autoFocus:true,className:'inline-edit',value:v,
    onClick:function(e){e.stopPropagation();},
    onChange:function(e){setV(e.target.value);},
    onBlur:commit,
    onKeyDown:function(e){
      if(e.key==='Enter'){commit();}
      if(e.key==='Escape'){setV(value);setEditing(false);}
    }});
}

function InlineDate(props){
  var t=props.t, onPatch=props.onPatch, onClose=props.onClose, target=props.target;
  return React.createElement(Popover,{target:target,onClose:onClose,width:220},
    React.createElement('input',{type:'date',value:t.due,autoFocus:true,
      onChange:function(e){ if(e.target.value){onPatch(t.id,{due:e.target.value}); onClose(); } }})
  );
}

function InlineTypes(props){
  var ctx=useCtx(); var taskTypes=ctx.taskTypes;
  var t=props.t, onPatch=props.onPatch, onClose=props.onClose, target=props.target;
  var toggle=function(tid){
    var types=(t.types||[]).slice();
    var i=types.indexOf(tid);
    if(i>=0) types.splice(i,1); else types.push(tid);
    onPatch(t.id,{types:types});
  };
  return React.createElement(Popover,{target:target,onClose:onClose,width:240},
    Object.entries(taskTypes).map(function(e){
      var k=e[0],tp=e[1]; var on=(t.types||[]).includes(k);
      return React.createElement('button',{key:k,type:'button',className:'ttsel-item'+(on?' on':''),
        onClick:function(){toggle(k);}},
        React.createElement('span',{className:'dot',style:{background:tp.c}}),
        React.createElement('span',{style:{flex:1,textAlign:'left'}},tp.label),
        on&&React.createElement(Icon,{d:IC.check,size:14}));
    })
  );
}

function InlineSubs(props){
  var t=props.t, onPatch=props.onPatch, onClose=props.onClose, target=props.target;
  var s=useState(''), val=s[0], setVal=s[1];
  var toggle=function(i){
    onPatch(t.id,{sub:t.sub.map(function(x,j){return j===i?Object.assign({},x,{done:!x.done}):x;})});
  };
  var add=function(){
    if(!val.trim())return;
    onPatch(t.id,{sub:t.sub.concat([{t:val.trim(),done:false}])});
    setVal('');
  };
  return React.createElement(Popover,{target:target,onClose:onClose,width:260},
    t.sub.length===0&&React.createElement('div',{style:{padding:'6px 8px',color:'var(--mut)',fontSize:12}},'Пока нет пунктов'),
    t.sub.map(function(s2,i){
      return React.createElement('label',{key:i,className:'ck',style:{padding:'4px 6px'}},
        React.createElement('input',{type:'checkbox',checked:s2.done,onChange:function(){toggle(i);}}),
        React.createElement('span',null,s2.t));
    }),
    React.createElement('div',{className:'ckadd',style:{marginTop:6}},
      React.createElement('input',{placeholder:'Новый пункт + Enter',value:val,
        onChange:function(e){setVal(e.target.value);},
        onKeyDown:function(e){if(e.key==='Enter'){e.preventDefault();add();}}}))
  );
}

function InlineComs(props){
  var ctx=useCtx(); var members=ctx.members, me=ctx.me;
  var t=props.t, onPatch=props.onPatch, onClose=props.onClose, target=props.target;
  var s=useState(''), val=s[0], setVal=s[1];
  var add=function(){
    if(!val.trim())return;
    onPatch(t.id,{coms:t.coms.concat([{who:me,ts:Date.now(),text:val.trim()}])});
    setVal('');
  };
  return React.createElement(Popover,{target:target,onClose:onClose,width:280},
    React.createElement('div',{style:{maxHeight:160,overflow:'auto'}},
      t.coms.length===0&&React.createElement('div',{style:{padding:'6px 8px',color:'var(--mut)',fontSize:12}},'Пока тихо — напишите первым'),
      t.coms.slice(-5).map(function(c,i){
        return React.createElement('div',{key:i,className:'cmt',style:{marginBottom:6}},
          React.createElement(Avatar,{id:c.who,size:20}),
          React.createElement('div',{className:'b'},
            React.createElement('small',null,(members[c.who]||{short:'—'}).short+' · '+fmtT(c.ts)),
            React.createElement('p',null,c.text)));
      })
    ),
    React.createElement('div',{className:'cinput',style:{marginTop:6}},
      React.createElement('input',{placeholder:'Комментарий + Enter',value:val,autoFocus:true,
        onChange:function(e){setVal(e.target.value);},
        onKeyDown:function(e){if(e.key==='Enter'){e.preventDefault();add();}}}),
      React.createElement('button',{className:'csend',onClick:add},React.createElement(Icon,{d:IC.up,size:14,sw:2})))
  );
}
// Строка задачи (для списка)
function TaskRow(props){
  var ctx=useCtx();
  var channels=ctx.channels, members=ctx.members, projects=ctx.projects, cardFields=ctx.cardFields;
  var t=props.t, onEdit=props.onEdit, onMove=props.onMove;
  var ch = channels[t.ch] || {label:'—',c:'#98A29B'};
  var m = members[t.who] || {short:'—'};
  var bd = BOARDS[t.board||'main'];
  var due = dueInfo(t);
  var sd = t.sub.filter(function(s){return s.done;}).length;
  var cm = colMeta(t);
  var pr = projects[t.project];

  return React.createElement('div',{
    className:'lrow'+(isDone(t)?' done':''),
    onClick:function(){onEdit(t);}
  },
    React.createElement('div',{className:'lmain'},
      React.createElement('span',{className:'pr',style:{color:PR[t.pr].c},title:'Приоритет: '+PR[t.pr].label},PR[t.pr].arrow),
      React.createElement('div',{style:{minWidth:0,flex:1}},
        React.createElement('span',{className:'lt'},
          isDone(t)&&React.createElement('span',{className:'donecheck'},'✓ '),
          cardFields.project&&pr&&React.createElement('span',{className:'bchip',style:{background:cmix(pr.c,18),color:pr.c,marginRight:7}},pr.name),
          React.createElement('span',{className:'bchip',style:{background:bd.soft,color:bd.text,marginRight:7}},bd.short),
          t.title
        ),
        cardFields.desc&&t.desc&&React.createElement('span',{className:'ld'},t.desc)
      )
    ),
    React.createElement('div',null,
      cardFields.channel&&React.createElement('span',{className:'chip',style:{background:cmix(ch.c,15),color:ch.c}},
        React.createElement('span',{className:'dot',style:{background:ch.c}}),
        ch.label
      )
    ),
    React.createElement('div',{className:'lwho'},
      cardFields.assignee&&React.createElement(React.Fragment,null,
        React.createElement(Avatar,{id:t.who,size:22}),
        m.short
      )
    ),
    React.createElement('div',null,
      cardFields.due&&React.createElement('span',{className:'due '+due.cls},due.txt)
    ),
    React.createElement('div',{className:'lprog'},
      cardFields.subtasks&&t.sub.length>0&&React.createElement(React.Fragment,null,
        React.createElement('div',{className:'track',style:{maxWidth:52}},
          React.createElement('i',{style:{width:(sd/t.sub.length*100)+'%',background:ch.c}})
        ),
        React.createElement('span',{className:'subn'},sd+'/'+t.sub.length)
      ),
      t.repeat!=='none'&&React.createElement('span',{className:'rchip',title:REPEAT[t.repeat].l},
        React.createElement(Icon,{d:IC.repeat,size:10,sw:2.2}),
        REPEAT[t.repeat].short
      ),
      cardFields.timer&&React.createElement(TimerChip,{t:t})
    ),
    React.createElement('div',{className:'lcol-sel',onClick:function(e){e.stopPropagation();}},
      React.createElement('span',{className:'dot',style:{background:cm.c}}),
      React.createElement('select',{
        value:t.col,
        onChange:function(e){onMove(t.id,e.target.value);},
        title:'Сменить статус'
      },
        colsOf(t.board||'main').map(function(c){
          return React.createElement('option',{key:c.id,value:c.id},c.t);
        })
      )
    )
  );
}

// Карточка задачи
function TaskCard(props){
  var ctx=useCtx();
  var channels=ctx.channels, members=ctx.members, projects=ctx.projects, taskTypes=ctx.taskTypes,
      now=ctx.now, toggleTimer=ctx.toggleTimer;
  var t=props.t, onEdit=props.onEdit, onPin=props.onPin, onFav=props.onFav,
      onFieldClick=props.onFieldClick, cardFields=props.cardFields,
      selected=props.selected, onToggleSelect=props.onToggleSelect, onShiftClick=props.onShiftClick,
      onPatch=props.onPatch;

  var ch = channels[t.ch] || {label:'—',c:'#98A29B'};
  var pr = PR[t.pr];
  var due = dueInfo(t);
  var sd = t.sub.filter(function(s){return s.done;}).length;
  var project = projects[t.project];
  var popSt=useState(null), pop=popSt[0], setPop=popSt[1];
  var openPop=function(kind,e){ e.stopPropagation(); setPop({kind:kind,target:e.currentTarget}); };

  var className='card'+(t.pinned?' pinned':'')+(t.fav?' fav':'')+(selected?' selected':'');

  return React.createElement('article',{
    className:className,
    draggable:!selected,
    onClick:function(e){
      if(e.shiftKey){e.preventDefault();onShiftClick&&onShiftClick(t.id);return;}
      onEdit(t);
    },
    onDragStart:function(e){
      e.dataTransfer.setData('text/plain',String(t.id));
      e.dataTransfer.effectAllowed='move';
    }
  },
    React.createElement('div',{className:'card-top'},
      cardFields.project&&project&&React.createElement('button',{
        className:'chip',
        style:{background:cmix(project.c,18),color:project.c},
        onClick:function(e){e.stopPropagation();onFieldClick('project',t.id,e);},
        title:'Сменить проект'
      },
        React.createElement('span',{className:'dot',style:{background:project.c}}),
        React.createElement('span',{className:'lbl'},project.name)
      ),
      cardFields.channel&&React.createElement('button',{
        className:'chip',
        style:{background:cmix(ch.c,15),color:ch.c},
        onClick:function(e){e.stopPropagation();onFieldClick('channel',t.id,e);},
        title:'Сменить команду'
      },
        React.createElement('span',{className:'dot',style:{background:ch.c}}),
        React.createElement('span',{className:'lbl'},ch.label)
      ),
      cardFields.priority&&React.createElement('button',{
        className:'pr',
        style:{color:pr.c},
        onClick:function(e){e.stopPropagation();onFieldClick('priority',t.id,e);},
        title:'Сменить приоритет'
      },
        pr.arrow,
        React.createElement('small',null,pr.label)
      ),
      React.createElement('div',{className:'card-actions'},
        React.createElement('button',{
          className:selected?'on':'',
          onClick:function(e){e.stopPropagation();onToggleSelect&&onToggleSelect(t.id);},
          title:'Выделить'
        },React.createElement(Icon,{d:IC.check,size:12})),
        React.createElement('button',{
          className:t.pinned?'pinned-on':'',
          onClick:function(e){e.stopPropagation();onPin(t.id);},
          title:t.pinned?'Открепить':'Закрепить'
        },React.createElement(Icon,{d:t.pinned?IC.pin:IC.pinOutline,size:12})),
        React.createElement('button',{
          className:t.fav?'fav-on':'',
          onClick:function(e){e.stopPropagation();onFav(t.id);},
          title:t.fav?'Убрать из избранного':'В избранное'
        },React.createElement(Icon,{d:t.fav?IC.starFill:IC.star,size:12}))
      )
    ),
    React.createElement('h4',{style:{display:'flex',gap:6,alignItems:'baseline',margin:0}},
      isDone(t)&&React.createElement('span',{className:'donecheck'},'✓ '),
      React.createElement(InlineText,{tag:'span',value:t.title,style:{flex:1,minWidth:0},
        onSave:function(v){onPatch(t.id,{title:v});}})
    ),
    cardFields.desc&&React.createElement(InlineText,{tag:'p',className:'desc',multiline:true,
      value:t.desc||'',placeholder:'Добавить описание…',
      onSave:function(v){onPatch(t.id,{desc:v});}}),
    cardFields.types&&t.types&&t.types.length>0&&React.createElement('div',{className:'ctypes'},
      t.types.slice(0,3).map(function(tid){
        var tp=taskTypes[tid]; if(!tp) return null;
        return React.createElement('button',{
          key:tid,
          className:'ttype',
          style:{background:tp.c},
          onClick:function(e){openPop('types',e);},
          title:'Изменить типы'
        },tp.label);
      }),
      t.types.length>3&&React.createElement('button',{
        className:'ttype',
        style:{background:'#98A29B'},
        onClick:function(e){openPop('types',e);}
      },'+'+(t.types.length-3))
    ),
    cardFields.photos!==false&&el(PhotoStrip,{t:t}),
    cardFields.subtasks&&t.sub.length>0&&React.createElement('div',{className:'subbar',
      style:{cursor:'pointer'},title:'Изменить чек-лист',
      onClick:function(e){openPop('subs',e);}},
      React.createElement('div',{className:'track'},
        React.createElement('i',{style:{width:(sd/t.sub.length*100)+'%',background:ch.c,transition:'width .5s'}})
      ),
      React.createElement('span',{className:'subn'},sd+'/'+t.sub.length)
    ),
    React.createElement('div',{className:'foot'},
      cardFields.assignee&&React.createElement(React.Fragment,null,
        React.createElement(Avatar,{id:t.who,onClick:function(id2,e){onFieldClick('assignee',t.id,e);}}),
        React.createElement('span',{className:'who'},(members[t.who]||{short:'—'}).short)
      ),
      t.repeat!=='none'&&React.createElement('span',{className:'rchip',title:REPEAT[t.repeat].l},
        React.createElement(Icon,{d:IC.repeat,size:10,sw:2.2}),
        REPEAT[t.repeat].short
      ),
      cardFields.comments&&t.coms.length>0&&React.createElement('button',{
        className:'com',
        onClick:function(e){openPop('coms',e);}
      },
        React.createElement(Icon,{d:IC.chat,size:12}),
        t.coms.length
      ),
      cardFields.timer&&React.createElement(TimerChip,{t:t}),
      cardFields.due&&React.createElement('button',{
        className:'due '+due.cls,
        style:{marginLeft:'auto'},
        onClick:function(e){openPop('due',e);}
      },due.txt)
    ),
    pop&&pop.kind==='due'&&React.createElement(InlineDate,{t:t,target:pop.target,onPatch:onPatch,onClose:function(){setPop(null);}}),
    pop&&pop.kind==='types'&&React.createElement(InlineTypes,{t:t,target:pop.target,onPatch:onPatch,onClose:function(){setPop(null);}}),
    pop&&pop.kind==='subs'&&React.createElement(InlineSubs,{t:t,target:pop.target,onPatch:onPatch,onClose:function(){setPop(null);}}),
    pop&&pop.kind==='coms'&&React.createElement(InlineComs,{t:t,target:pop.target,onPatch:onPatch,onClose:function(){setPop(null);}})
  );
}
