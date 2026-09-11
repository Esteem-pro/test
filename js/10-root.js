// js/10-root.js
// Вход через Google и запуск приложения

function LoginScreen(props){
  var onGoogle=props.onGoogle, error=props.error;
  return el('div',{className:'lock',style:{marginTop:'10vh'}},
    el('div',{className:'lic',style:{background:'color-mix(in srgb, var(--accent) 13%, transparent)',color:'var(--accent)'}},
      el(Icon,{d:IC.shield,size:26})),
    el('h3',null,'Вход в ПОТОК'),
    el('p',null,'Таск-трекер доступен команде маркетинга.',el('br'),'Войдите через рабочий Google-аккаунт.'),
    error&&el('p',{style:{color:'var(--red)',marginTop:10}},error),
    el('div',{className:'lockadmins'},
      el('button',{className:'btn pri',onClick:onGoogle},
        el('svg',{width:18,height:18,viewBox:'0 0 48 48',style:{flex:'0 0 auto'}},
          el('path',{fill:'#FFC107',d:'M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z'}),
          el('path',{fill:'#FF3D00',d:'M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z'}),
          el('path',{fill:'#4CAF50',d:'M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z'}),
          el('path',{fill:'#1976D2',d:'M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.3 5.3C37.1 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z'})
        ),
        'Войти через Google')
    )
  );
}

function Root(){
  var s1=useState(undefined), authUser=s1[0], setAuthUser=s1[1]; // undefined = загрузка
  var s2=useState(''), err=s2[0], setErr=s2[1];
  var fbOk=!!(window.firebase&&window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.apiKey);

  useEffect(function(){
    if(!fbOk){ setAuthUser(null); return; }  // без Firebase — локальный режим без входа
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      firebase.auth().onAuthStateChanged(function(u){
        setAuthUser(u?{uid:u.uid,email:u.email||'',displayName:u.displayName||'',photoURL:u.photoURL||''}:null);
      });
    }catch(e){ setErr('Ошибка Firebase: '+e.message); setAuthUser(null); }
  },[]);

  var googleSignIn=function(){
    var prov=new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(prov).catch(function(e){setErr('Ошибка входа: '+e.message);});
  };
  var signOut=function(){ firebase.auth().signOut(); };

  if(!fbOk) return el(App,{authUser:null,onSignOut:function(){}});
  if(authUser===undefined) return el('div',{className:'lock'},el('h3',null,'Загрузка…'));
  if(authUser===null) return el(LoginScreen,{onGoogle:googleSignIn,error:err});
  return el(App,{authUser:authUser,onSignOut:signOut});
}

ReactDOM.createRoot(document.getElementById('root')).render(el(Root));
console.log('✓ 10-root.js загружен');
