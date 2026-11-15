
/* 移除平台注入的水印浮窗：該元素使用 Shadow DOM 且 :host 設有 all:initial!important，外部 CSS 無法覆蓋，必須用 JS 直接移除 */
(function(){
  function removeWm(){
    try{
      var el=document.querySelector('div[data-custom-element="doubao-watermark"]');
      if(el)el.remove();
      document.querySelectorAll('[data-custom-element*="watermark"]').forEach(function(e){e.remove();});
      var vw=window.innerWidth,vh=window.innerHeight;
      document.querySelectorAll('*').forEach(function(e){
        if(e.children.length>0)return;
        var s=getComputedStyle(e);
        if(s.position!=='fixed')return;
        var r=e.getBoundingClientRect();
        if(r.right>vw-160&&r.bottom>vh-80&&r.width>20&&r.height>15){
          var t=(e.textContent||'');
          if(t.indexOf('豆包')>-1||t.indexOf('doubao')>-1||t.indexOf('生成')>-1)e.remove();
        }
      });
    }catch(e){}
  }
  removeWm();
  try{var obs=new MutationObserver(function(){removeWm();});obs.observe(document.documentElement,{childList:true,subtree:true});}catch(e){}
  var cnt=0;var timer=setInterval(function(){removeWm();cnt++;if(cnt>60)clearInterval(timer);},500);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)removeWm();});
})();
