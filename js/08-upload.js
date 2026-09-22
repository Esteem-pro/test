// js/08-upload.js
// Сжатие изображений, загрузка в Google Drive / Яндекс Диск, фото-компоненты

function loadScript(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');
    s.src=src; s.onload=resolve; s.onerror=reject;
    document.head.appendChild(s);
  });
}

function compressImage(file, maxSide, quality){
  maxSide=maxSide||1280; quality=quality||0.82;
  return new Promise(function(resolve,reject){
    var reader=new FileReader();
    reader.onload=function(){
      var img=new Image();
      img.onload=function(){
        var scale=Math.min(1, maxSide/Math.max(img.width,img.height));
        var w=Math.round(img.width*scale), h=Math.round(img.height*scale);
        var cv=document.createElement('canvas');
        cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        resolve(cv.toDataURL('image/jpeg',quality));
      };
      img.onerror=reject;
      img.src=reader.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl){
  var parts=dataUrl.split(',');
  var mime=parts[0].match(/:(.*?);/)[1];
  var bin=atob(parts[1]);
  var arr=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type:mime});
}

/* ---------- Google Drive ---------- */
function googleUpload(dataUrl,name){
  return loadScript('https://accounts.google.com/gsi/client').then(function(){
    return new Promise(function(resolve,reject){
      google.accounts.oauth2.initTokenClient({
        client_id:window.CLOUD_CONFIG.googleClientId,
        scope:'https://www.googleapis.com/auth/drive.file',
        callback:function(resp){
          if(!resp.access_token){reject(new Error(resp.error||'google auth'));return;}
          var blob=dataUrlToBlob(dataUrl);
          var fd=new FormData();
          fd.append('metadata',new Blob([JSON.stringify({name:name,mimeType:blob.type})],{type:'application/json'}));
          fd.append('file',blob);
          fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
            {method:'POST',headers:{Authorization:'Bearer '+resp.access_token},body:fd})
            .then(function(r){return r.json();})
            .then(function(j){
              if(!j.id){reject(new Error('drive upload failed'));return;}
              fetch('https://www.googleapis.com/drive/v3/files/'+j.id+'/permissions',
                {method:'POST',headers:{Authorization:'Bearer '+resp.access_token,'Content-Type':'application/json'},
                 body:JSON.stringify({role:'reader',type:'anyone'})}).catch(function(){});
              resolve({provider:'google',full:'https://drive.google.com/thumbnail?id='+j.id+'&sz=w1600',link:j.webViewLink});
            })
            .catch(reject);
        }
      }).requestAccessToken();
    });
  });
}

/* ---------- Яндекс Диск ---------- */
function yandexToken(){
  var stored=localStorage.getItem('potok-yandex-token');
  if(stored) return stored;
  var m=location.hash.match(/access_token=([^&]+)/);
  if(m){
    localStorage.setItem('potok-yandex-token',m[1]);
    history.replaceState(null,'',location.pathname+location.search);
    return m[1];
  }
  return null;
}
function yandexLogin(){
  location.href='https://oauth.yandex.ru/authorize?response_type=token&client_id='+encodeURIComponent(window.CLOUD_CONFIG.yandexClientId);
}
function yandexUpload(dataUrl,name){
  var token=yandexToken();
  if(!token){yandexLogin();return Promise.reject(new Error('yandex auth'));}
  var blob=dataUrlToBlob(dataUrl);
  var path='app:/potok/'+Date.now()+'_'+name;
  var H={Authorization:'OAuth '+token};
  return fetch('https://cloud-api.yandex.net/v1/disk/resources/upload?path='+encodeURIComponent(path)+'&overwrite=true',{headers:H})
    .then(function(r){return r.json();})
    .then(function(j){
      if(!j.href) throw new Error('no href');
      return fetch(j.href,{method:'PUT',body:blob});
    })
    .then(function(){
      return fetch('https://cloud-api.yandex.net/v1/disk/resources/publish?path='+encodeURIComponent(path),{method:'PATCH',headers:H});
    })
    .then(function(){
      return fetch('https://cloud-api.yandex.net/v1/disk/resources?path='+encodeURIComponent(path),{headers:H}).then(function(r){return r.json();});
    })
    .then(function(info){
      return {provider:'yandex',full:null,link:info.public_url||null};
    });
}

/* ---------- добавление фото к задаче ---------- */
function addPhotos(fileList, existing, onProgress){
  var files=Array.prototype.slice.call(fileList);
  return files.reduce(function(p,file){
    return p.then(function(acc){
      onProgress&&onProgress(file.name);
      return compressImage(file,1280,0.82).then(function(fullData){
        return compressImage(file,320,0.7).then(function(thumbData){
          var prov=window.PHOTO_PROVIDER||'base64';
          var chain=Promise.resolve({provider:'base64',full:fullData,link:null});
          if(prov==='google'&&window.CLOUD_CONFIG&&window.CLOUD_CONFIG.googleClientId){
            chain=googleUpload(fullData,file.name).catch(function(){return {provider:'base64',full:fullData,link:null};});
          } else if(prov==='yandex'&&window.CLOUD_CONFIG&&window.CLOUD_CONFIG.yandexClientId){
            chain=yandexUpload(fullData,file.name).catch(function(){return {provider:'base64',full:fullData,link:null};});
          }
          return chain.then(function(r){
            acc.push({id:'ph'+Date.now()+Math.random().toString(16).slice(2),name:file.name,ts:Date.now(),
              provider:r.provider,thumb:thumbData,full:r.full,link:r.link||null});
            return acc;
          });
        });
      });
    });
  },Promise.resolve((existing||[]).slice()));
}

/* ---------- миниатюры на карточке ---------- */
function PhotoStrip(props){
  var att=(props.t&&props.t.attachments)||[];
  if(!att.length) return null;
  return el('div',{className:'pstrip'},
    att.slice(0,3).map(function(a){
      return el('img',{key:a.id,src:a.thumb,alt:a.name,className:'pthumb',title:a.name});
    }),
    att.length>3&&el('span',{className:'pmore'},'+'+(att.length-3))
  );
}

/* ---------- блок фото в модалке ---------- */
function PhotoBlock(props){
  var attachments=props.attachments||[], onChange=props.onChange;
  var st=useState(''), busy=st[0], setBusy=st[1];
  var inputRef=useRef(null);
  var pick=function(e){
    var files=e.target.files;
    if(!files||!files.length) return;
    setBusy('Загрузка…');
    addPhotos(files,attachments,function(n){setBusy('Загрузка: '+n);})
      .then(function(next){onChange(next);setBusy('');})
      .catch(function(){setBusy('');});
    e.target.value='';
  };
  var provName={base64:'в базе данных',google:'Google Drive',yandex:'Яндекс Диск'}[window.PHOTO_PROVIDER||'base64'];
  return el('div',null,
    el('label',null,'Фото ('+attachments.length+')'),
    el('div',{className:'pgrid'},
      attachments.map(function(a){
        return el('div',{key:a.id,className:'pitem'},
          el('img',{src:a.thumb,alt:a.name}),
          el('button',{type:'button',className:'prm',title:'Удалить',
            onClick:function(){onChange(attachments.filter(function(x){return x.id!==a.id;}));}},
            el(Icon,{d:IC.x,size:10})),
          a.link&&el('a',{className:'plink',href:a.link,target:'_blank',rel:'noopener',title:'Открыть в облаке'},
            el(Icon,{d:IC.right,size:10}))
        );
      }),
      el('button',{type:'button',className:'padd',onClick:function(){inputRef.current&&inputRef.current.click();}},
        el(Icon,{d:IC.plus,size:16}), busy||'Добавить')
    ),
    el('input',{ref:inputRef,type:'file',accept:'image/*',multiple:true,style:{display:'none'},onChange:pick}),
    el('div',{className:'asub',style:{marginTop:6}},'Хранилище: '+provName)
  );
}

console.log('✓ 08-upload.js загружен');
