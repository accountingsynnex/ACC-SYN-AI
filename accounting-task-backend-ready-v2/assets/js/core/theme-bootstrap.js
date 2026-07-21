(function(){
  try{
    var mode=localStorage.getItem('acct-theme-mode')||'system';
    if(!['light','dark','system'].includes(mode))mode='system';
    var dark=mode==='dark'||(mode==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'dark':'light';
    document.documentElement.dataset.themeMode=mode;
  }catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.themeMode='system'}
})();
