// js/05-views.js
// Вьюхи (Kanban, Mine, Calendar, Stats, Files, Templates, Favorites, Feed, Admin, Lock, CardSettings, CommandPalette)

// Канбан
function Kanban(props){
  var ctx=useCtx();
  var cardFields=ctx.cardFields;
  var all=props.all, visible=props.visible, cols=props.cols, group=props.group, hasF=props.hasF,
      onEdit=props.onEdit, onNew=props.onNew, onDropCard=props.onDropCard,
      onPin=props.onPin, onFav=props.onFav, onFieldClick=props.onFieldClick,
      selectedIds=props.selectedIds, onToggleSelect=props.onToggleSelect, onShiftClick=props.onShiftClick;

  var ref=useState(null), overCol=ref[0], setOverCol=ref[1];

  return React.createElement('div',{className:'board'},
    cols.map(function(c,ci){
      var list = group==='day' ? visible.filter(function(t){return bucketOf(t)===c.id;}) : visible.filter(function(t){return t.col===c.id;});
      var allN = group==='day' ? all.filter(function(t){return bucketOf(t)===c.id;}).length : all.filter(function(t){return t.col===c.id;}).length;
      return React.createElement('section',{
        key:c.id,
        className:'col'+(overCol===c.id?' over':''),
        style:{animationDelay:(ci*70)+'ms',borderTopColor:c.c},
        onDragOver:function(e){e.preventDefault();e.dataTransfer.dropEffect='move';setOverCol(c.id);},
        onDragLeave:function(){setOverCol(null);},
        onDrop:function(e){
          e.preventDefault();
          var id=Number(e.dataTransfer.getData('text/plain'));
          if(id) onDropCard(id,c.id);
          setOverCol(null);
        }
      },
        React.createElement('div',{className:'col-head'},
          React.createElement('span',{className:'col-dot',style:{background:c.c}}),
          React.createElement('h3',null,c.t),
          React.createElement('span',{className:'n'},hasF&&group==='status'?list.length+'/'+allN:list.length),
          group==='status'&&React.createElement('button',{
            className:'col-add',
            title:'Добавить в «'+c.t+'»',
            onClick:function(){onNew(c.id);}
          },React.createElement(Icon,{d:IC.plus,size:14,sw:2.2}))
        ),
        React.createElement('div',{className:'col-body'},
          list.length===0&&React.createElement('div',{className:'empty'},
            hasF?'Нет задач по фильтру':'Пока пусто'
          ),
          list.map(function(t,i){
            return React.createElement(TaskCard,{
              key:t.id, t:t, onEdit:onEdit,
              onPin:onPin, onFav:onFav, onFieldClick:onFieldClick,
              cardFields:cardFields,
              selected:selectedIds.includes(t.id),
              onToggleSelect:onToggleSelect,
              onShiftClick:onShiftClick
            });
          })
        )
      );
    })
  );
}

// Мои задачи
function MineView(props){
  var ctx=useCtx();
  var members=ctx.members, me=ctx.me;
  var tasks=props.tasks, onEdit=props.onEdit, onMove=props.onMove;
  var m = members[me] || {name:'—'};
  var my = tasks.filter(function(t){return t.who===me;});
  var byDue = function(a,b){return a.due.localeCompare(b.due);};
  var active = my.filter(function(t){return !isDone(t);});
  var overdue = active.filter(function(t){return daysLeft(t.due)<0;}).length;
  var hot = active.filter(function(t){var dl=daysLeft(t.due);return dl>=0&&dl<=2;}).length;
  var done = my.filter(function(t){return isDone(t);}).length;

  return React.createElement(React.Fragment,null,
    React.createElement('div',{className:'mhead'},
      React.createElement(Avatar,{id:me,size:48}),
      React.createElement('div',null,
        React.createElement('h3',null,'Задачи — '+m.name),
        React.createElement('small',null,'Все доски: основная, фото и видео. Сменить пользователя можно в админ-панели.')
      ),
      React.createElement('div',{className:'mstats'},
        React.createElement('div',{className:'mstat'},
          React.createElement('b',{style:{color:'var(--blue)'}},active.length),
          React.createElement('span',null,'активных')
        ),
        React.createElement('div',{className:'mstat'},
          React.createElement('b',{style:{color:'var(--amber)'}},hot),
          React.createElement('span',null,'горят')
        ),
        React.createElement('div',{className:'mstat'},
          React.createElement('b',{style:{color:'var(--red)'}},overdue),
          React.createElement('span',null,'просрочено')
        ),
        React.createElement('div',{className:'mstat'},
          React.createElement('b',{style:{color:'var(--green)'}},done),
          React.createElement('span',null,'готово')
        )
      )
    ),
    my.length===0&&React.createElement('div',{className:'nothing'},
      React.createElement('b',null,'Пока нет задач'),
      'Создайте новую и назначьте её себе'
    ),
    DAY_BUCKETS.map(function(b,gi){
      var list=my.filter(function(t){return bucketOf(t)===b.id;}).sort(byDue);
      if(!list.length) return null;
      return React.createElement('div',{key:b.id,className:'mgroup',style:{animationDelay:(gi*60)+'ms'}},
        React.createElement('div',{className:'mgt'},
          React.createElement('span',{className:'col-dot',style:{background:b.c}}),
          React.createElement('h4',null,b.t),
          React.createElement('span',{className:'n'},list.length)
        ),
        React.createElement('div',{className:'ltab'},
          list.map(function(t){return React.createElement(TaskRow,{key:t.id,t:t,onEdit:onEdit,onMove:onMove});})
        )
      );
    })
  );
}

// Избранное
function FavoritesView(props){
  var tasks=props.tasks, onEdit=props.onEdit, onMove=props.onMove;
  var fav = tasks.filter(function(t){return t.fav;});
  return React.createElement(React.Fragment,null,
    React.createElement('div',{className:'vtool'},
      React.createElement('span',null,'Все задачи, отмеченные звёздочкой — быстрый доступ к важным')
    ),
    fav.length===0
      ? React.createElement('div',{className:'nothing'},
          React.createElement('b',null,'Нет избранных задач'),
          'Кликните ⭐ на любой карточке, чтобы добавить сюда'
        )
      : React.createElement('div',{className:'ltab'},
          React.createElement('div',{className:'lrow lhead'},
            React.createElement('div',null,'Задача'),
            React.createElement('div',null,'Канал'),
            React.createElement('div',null,'Исполнитель'),
            React.createElement('div',null,'Дедлайн'),
            React.createElement('div',null,'Прогресс'),
            React.createElement('div',null,'Статус')
          ),
          fav.map(function(t){return React.createElement(TaskRow,{key:t.id,t:t,onEdit:onEdit,onMove:onMove});})
        )
  );
}

// История
function FeedView(props){
  var log=props.log, onClear=props.onClear;
  var dayLabel=function(k){
    if(k===iso(today())) return 'Сегодня';
    if(k===iso(addDays(-1))) return 'Вчера';
    return fmtL(pdate(k));
  };
  var items=[], lastK='';
  log.forEach(function(e){
    var k=iso(new Date(e.ts));
    if(k!==lastK){items.push({day:true,k:k,label:dayLabel(k)});lastK=k;}
    items.push(e);
  });
  return React.createElement(React.Fragment,null,
    React.createElement('div',{className:'vtool'},
      React.createElement('span',null,'Все события команды: создание, переносы, повторы, комментарии, админ-действия'),
      log.length>0&&React.createElement('button',{className:'btn ghost',onClick:onClear},'Очистить историю')
    ),
    log.length===0
      ? React.createElement('div',{className:'nothing'},
          React.createElement('b',null,'История пуста'),
          'Действия с задачами будут появляться здесь'
        )
      : React.createElement('div',{className:'feed'},
          items.map(function(e,i){
            if(e.day){
              return React.createElement('div',{key:'d'+e.k,className:'fday'},e.label);
            }
            var meta=LOG_META[e.type]||LOG_META.edit;
            return React.createElement('div',{key:e.id,className:'fitem',style:{animationDelay:(Math.min(i,10)*30)+'ms'}},
              React.createElement('span',{className:'fic',style:{background:meta[1]}},
                React.createElement(Icon,{d:meta[0],size:14,sw:2})
              ),
              React.createElement('p',null,e.text),
              React.createElement('time',null,fmtT(e.ts))
            );
          })
        )
  );
}

// Локскрин
function LockScreen(props){
  var ctx=useCtx();
  var members=ctx.members, me=ctx.me;
  var login=props.login;
  var admins = Object.entries(members).filter(function(entry){return entry[1].role==='admin';});
  return React.createElement('div',{className:'lock'},
    React.createElement('div',{className:'lic'},React.createElement(Icon,{d:IC.shield,size:26})),
    React.createElement('h3',null,'Недостаточно прав'),
    React.createElement('p',null,
      'Админ-панель доступна только администраторам.',
      React.createElement('br'),
      'Вы вошли как ',
      React.createElement('b',null,(members[me]||{name:'—'}).name),
      ' · роль «участник».',
      React.createElement('br'),
      'Переключитесь на администратора, чтобы продолжить:'
    ),
    React.createElement('div',{className:'lockadmins'},
      admins.length===0&&React.createElement('span',{className:'asub'},'Администраторов нет'),
      admins.map(function(entry){
        var k=entry[0], m=entry[1];
        return React.createElement('button',{key:k,className:'btn ghost',onClick:function(){login(k);}},
          React.createElement(Avatar,{id:k,size:22}),
          m.short
        );
      })
    )
  );
}

console.log('✓ 05-views.js загружен');
