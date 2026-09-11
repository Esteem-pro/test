// js/03-icons.js
// Иконки

var Icon = function(props) {
  var d = props.d, size = props.size || 17, sw = props.sw || 1.8;
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round',
    strokeLinejoin: 'round', style: {flex:'0 0 auto'}
  }, d);
};

var IC = {
  board: React.createElement(React.Fragment, null,
    React.createElement('rect', {x:3, y:4, width:7.5, height:16, rx:2}),
    React.createElement('rect', {x:13.5, y:4, width:7.5, height:10, rx:2})
  ),
  kanban: React.createElement(React.Fragment, null,
    React.createElement('rect', {x:4, y:4, width:6.5, height:16, rx:1.8}),
    React.createElement('rect', {x:13.5, y:4, width:6.5, height:9, rx:1.8})
  ),
  list: React.createElement('path', {d:'M4 6h16M4 12h16M4 18h16'}),
  camera: React.createElement(React.Fragment, null,
    React.createElement('path', {d:'M3 8.5a2 2 0 0 1 2-2h2.2l1.6-2h6.4l1.6 2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5z'}),
    React.createElement('circle', {cx:12, cy:13, r:3.4})
  ),
  video: React.createElement(React.Fragment, null,
    React.createElement('rect', {x:2.5, y:6, width:13, height:12, rx:2.5}),
    React.createElement('path', {d:'m15.5 10.8 6-3.3v9l-6-3.3'})
  ),
  cal: React.createElement(React.Fragment, null,
    React.createElement('rect', {x:3, y:5, width:18, height:16, rx:2}),
    React.createElement('path', {d:'M8 3v4M16 3v4M3 10h18'})
  ),
  chart: React.createElement('path', {d:'M5 20v-6M11 20V7M17 20v-9M3 20h18'}),
  folder: React.createElement('path', {d:'M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z'}),
  clock: React.createElement(React.Fragment, null,
    React.createElement('circle', {cx:12, cy:12, r:8.5}),
    React.createElement('path', {d:'M12 7.5V12l3 2'})
  ),
  user: React.createElement(React.Fragment, null,
    React.createElement('circle', {cx:12, cy:8, r:3.6}),
    React.createElement('path', {d:'M4.5 20c1.6-3.6 4.2-5.2 7.5-5.2s5.9 1.6 7.5 5.2'})
  ),
  shield: React.createElement('path', {d:'M12 3l7 2.8v5.4c0 4.6-3 8.2-7 9.8-4-1.6-7-5.2-7-9.8V5.8L12 3z'}),
  bell: React.createElement(React.Fragment, null,
    React.createElement('path', {d:'M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6'}),
    React.createElement('path', {d:'M10.3 19a2 2 0 0 0 3.4 0'})
  ),
  sun: React.createElement(React.Fragment, null,
    React.createElement('circle', {cx:12, cy:12, r:4.2}),
    React.createElement('path', {d:'M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4'})
  ),
  moon: React.createElement('path', {d:'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'}),
  search: React.createElement(React.Fragment, null,
    React.createElement('circle', {cx:11, cy:11, r:7}),
    React.createElement('path', {d:'m20 20-3.5-3.5'})
  ),
  plus: React.createElement('path', {d:'M12 5v14M5 12h14'}),
  play: React.createElement('path', {d:'M8 5.5v13l11-6.5z', fill:'currentColor', stroke:'none'}),
  pause: React.createElement('path', {d:'M8.5 5.5v13M15.5 5.5v13', strokeWidth:2.6}),
  repeat: React.createElement(React.Fragment, null,
    React.createElement('path', {d:'m17 2 4 4-4 4'}),
    React.createElement('path', {d:'M3 11v-1a4 4 0 0 1 4-4h14'}),
    React.createElement('path', {d:'m7 22-4-4 4-4'}),
    React.createElement('path', {d:'M21 13v1a4 4 0 0 1-4 4H3'})
  ),
  chat: React.createElement('path', {d:'M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z'}),
  trash: React.createElement('path', {d:'M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13'}),
  pen: React.createElement('path', {d:'M4 20l1-4L17 4l3 3L8 19l-4 1z'}),
  arrow: React.createElement('path', {d:'M4 12h15m-6-6 6 6-6 6'}),
  check: React.createElement('path', {d:'m5 13 4 4L19 7'}),
  x: React.createElement('path', {d:'M6 6l12 12M18 6 6 18'}),
  left: React.createElement('path', {d:'M14 6l-6 6 6 6'}),
  right: React.createElement('path', {d:'M10 6l6 6-6 6'}),
  up: React.createElement('path', {d:'M12 19V6m-6 7 6-6 6 6'}),
  redo: React.createElement('path', {d:'M3 12a9 9 0 1 0 3-6.7M3 4v5h5'}),
  pin: React.createElement('path', {d:'M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6z', fill:'currentColor'}),
  pinOutline: React.createElement('path', {d:'M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6z'}),
  star: React.createElement('path', {d:'M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'}),
  starFill: React.createElement('path', {d:'M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z', fill:'currentColor'}),
  cog: React.createElement(React.Fragment, null,
    React.createElement('circle', {cx:12, cy:12, r:3}),
    React.createElement('path', {d:'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'})
  ),
  copy: React.createElement(React.Fragment, null,
    React.createElement('rect', {x:9, y:9, width:13, height:13, rx:2}),
    React.createElement('path', {d:'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'})
  ),
  flag: React.createElement('path', {d:'M4 22V4a2 2 0 0 1 2-2h10l-2 4 2 4H6', fill:'currentColor'}),
  flagOutline: React.createElement('path', {d:'M4 22V4a2 2 0 0 1 2-2h10l-2 4 2 4H6'}),
  target: React.createElement(React.Fragment, null,
    React.createElement('circle', {cx:12, cy:12, r:10}),
    React.createElement('circle', {cx:12, cy:12, r:6}),
    React.createElement('circle', {cx:12, cy:12, r:2, fill:'currentColor'})
  ),
  template: React.createElement(React.Fragment, null,
    React.createElement('rect', {x:3, y:3, width:18, height:18, rx:2}),
    React.createElement('path', {d:'M3 9h18M9 21V9'})
  ),
  bolt: React.createElement('path', {d:'M13 2 3 14h9l-1 8 10-12h-9z', fill:'currentColor'}),
  note: React.createElement(React.Fragment, null,
    React.createElement('path', {d:'M9 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z'}),
    React.createElement('path', {d:'M15 2v6h6'})
  ),
};

var LOG_META = {
  create:[IC.plus,'#0FA36B'], move:[IC.arrow,'#2E6BFF'], done:[IC.check,'#0FA36B'],
  del:[IC.trash,'#E5484D'], comment:[IC.chat,'#8B5CF6'], edit:[IC.pen,'#E8930C'],
  admin:[IC.shield,'#6C7A70'], repeat:[IC.repeat,'#0EA5C6'], timer:[IC.clock,'#E8930C'],
  pin:[IC.pin,'#E8930C'], fav:[IC.star,'#FF5A2D'],
};

console.log('✓ 03-icons.js загружен');
