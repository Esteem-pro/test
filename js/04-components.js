// js/04-components.js
// Компоненты

var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;
var useRef = React.useRef;

// Аватар
var Avatar = function(props) {
  var ctx = useCtx();
  var members = ctx.members;
  var id = props.id, size = props.size || 24, onClick = props.onClick;
  var m = members[id] || {ini:'?',c:'#98A29B',name:'—'};
  return React.createElement('span', {
    className:'ava', title:m.name,
    onClick: onClick ? function(e){ e.stopPropagation(); onClick(id); } : undefined,
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
      selected=props.selected, onToggleSelect=props.onToggleSelect, onShiftClick=props.onShiftClick;

  var ch = channels[t.ch] || {label:'—',c:'#98A29B'};
  var pr = PR[t.pr];
  var due = dueInfo(t);
  var sd = t.sub.filter(function(s){return s.done;}).length;
  var project = projects[t.project];

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
    // Верхняя часть
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
        title:'Сменить канал'
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
    // Заголовок
    React.createElement('h4',null,
      isDone(t)&&React.createElement('span',{className:'donecheck'},'✓ '),
      t.title
    ),
    // Описание
    cardFields.desc&&t.desc&&React.createElement('p',{className:'desc'},t.desc),
    // Типы
    cardFields.types&&t.types&&t.types.length>0&&React.createElement('div',{className:'ctypes'},
      t.types.slice(0,3).map(function(tid){
        var tp=taskTypes[tid]; if(!tp) return null;
        return React.createElement('button',{
          key:tid,
          className:'ttype',
          style:{background:tp.c},
          onClick:function(e){e.stopPropagation();onFieldClick('types',t.id,e);},
          title:'Изменить типы'
        },tp.label);
      }),
      t.types.length>3&&React.createElement('button',{
        className:'ttype',
        style:{background:'#98A29B'},
        onClick:function(e){e.stopPropagation();onFieldClick('types',t.id,e);}
      },'+'+(t.types.length-3))
    ),
    // Фото
    cardFields.photos!==false&&el(PhotoStrip,{t:t}),
    // Чек-лист
    cardFields.subtasks&&t.sub.length>0&&React.createElement('div',{className:'subbar'},
      React.createElement('div',{className:'track'},
        React.createElement('i',{style:{width:(sd/t.sub.length*100)+'%',background:ch.c,transition:'width .5s'}})
      ),
      React.createElement('span',{className:'subn'},sd+'/'+t.sub.length)
    ),
    // Нижняя часть
    React.createElement('div',{className:'foot'},
      cardFields.assignee&&React.createElement(React.Fragment,null,
        React.createElement(Avatar,{id:t.who,onClick:function(){onFieldClick('assignee',t.id,null);}}),
        React.createElement('span',{className:'who'},(members[t.who]||{short:'—'}).short)
      ),
      t.repeat!=='none'&&React.createElement('span',{className:'rchip',title:REPEAT[t.repeat].l},
        React.createElement(Icon,{d:IC.repeat,size:10,sw:2.2}),
        REPEAT[t.repeat].short
      ),
      cardFields.comments&&t.coms.length>0&&React.createElement('button',{
        className:'com',
        onClick:function(e){e.stopPropagation();onEdit(t);}
      },
        React.createElement(Icon,{d:IC.chat,size:12}),
        t.coms.length
      ),
      cardFields.timer&&React.createElement(TimerChip,{t:t}),
      cardFields.due&&React.createElement('button',{
        className:'due '+due.cls,
        style:{marginLeft:'auto'},
        onClick:function(e){e.stopPropagation();onFieldClick('due',t.id,e);}
      },due.txt)
    )
  );
}

console.log('✓ 04-components.js загружен');
