// Notifications, custom selects, scroll behavior, diagnostics and application bootstrap

function renderNotifications(forceOpen=null){
 const p=document.getElementById('notificationPanel'),shouldOpen=forceOpen===null?!p.classList.contains('show'):Boolean(forceOpen),items=currentNotifications();
 if(!shouldOpen){p.classList.remove('show');document.documentElement.classList.remove('notif-open');return}
 p.innerHTML=`<div class="notification-head"><strong>การแจ้งเตือน</strong><button class="task-link" id="markAllRead">อ่านทั้งหมด</button></div>${items.length?items.map(n=>`<button class="notification-item ${n.unread?'unread':''}" data-notify-id="${n.id}" data-notify-task="${n.taskId}" style="width:100%;border-width:0 0 1px;text-align:left"><strong>${esc(n.title)}</strong><span>${esc(n.text)}</span></button>`).join(''):'<div class="empty">ไม่มีการแจ้งเตือน</div>'}`;p.classList.add('show');document.documentElement.classList.add('notif-open');
 p.querySelectorAll('[data-notify-task]').forEach(x=>x.onclick=()=>{const n=state.notifications.find(n=>n.id===x.dataset.notifyId);if(n)n.unread=false;Store.save();p.classList.remove('show');document.documentElement.classList.remove('notif-open');openTask(x.dataset.notifyTask);renderShell()});
 document.getElementById('markAllRead').onclick=()=>{const owner=notificationOwnerKey();state.notifications.forEach(n=>{if(n.owner===owner)n.unread=false});Store.save();renderNotifications(true);renderShell()};
}



// ---------------- Floating Board horizontal scrollbar (lightweight) ----------------
let boardScrollbarFrame=0;
function syncBoardScrollPair(scroller,floating){
 if(scroller.dataset.boardScrollEnhanced==='1')return;
 scroller.dataset.boardScrollEnhanced='1';let source='';
 scroller.addEventListener('scroll',()=>{if(source==='floating')return;source='board';floating.scrollLeft=scroller.scrollLeft;source='';},{passive:true});
 floating.addEventListener('scroll',()=>{if(source==='board')return;source='floating';scroller.scrollLeft=floating.scrollLeft;source='';},{passive:true});
}
function updateBoardFloatingScrollbars(){
 const desktop=window.innerWidth>=851;
 document.querySelectorAll('[data-board-scroll]').forEach(scroller=>{
  const floating=scroller.closest('.board-scroll-shell')?.querySelector('[data-board-floating-scroll]');
  const spacer=floating?.querySelector('.board-floating-scroll-spacer');if(!floating||!spacer)return;
  syncBoardScrollPair(scroller,floating);
  const hasOverflow=scroller.scrollWidth>scroller.clientWidth+2;
  spacer.style.width=Math.max(scroller.scrollWidth,scroller.clientWidth+1)+'px';
  floating.classList.toggle('is-visible',desktop&&hasOverflow);
  if(Math.abs(floating.scrollLeft-scroller.scrollLeft)>1)floating.scrollLeft=scroller.scrollLeft;
 });
}
function queueBoardScrollbarRefresh(){if(boardScrollbarFrame)return;boardScrollbarFrame=requestAnimationFrame(()=>{boardScrollbarFrame=0;updateBoardFloatingScrollbars()})}
function syncBoardScrollbarDuringShellMotion(){queueBoardScrollbarRefresh()}
window.addEventListener('resize',queueBoardScrollbarRefresh,{passive:true});

// ---------------- Lightweight rounded custom selects ----------------
// Enhances only selects currently in the DOM. No MutationObserver is used.
let activeCustomSelect=null;
let customSelectRefreshFrame=0;
let customSelectUid=0;

function customSelectLabel(select){
 const option=select.options[select.selectedIndex];
 return option?option.textContent.trim():'เลือกข้อมูล';
}
function cleanupCustomSelectMenus(){
 document.querySelectorAll('.custom-select-menu[data-custom-owner]').forEach(menu=>{
  const owner=document.getElementById(menu.dataset.customOwner);
  if(!owner||!owner.isConnected)menu.remove();
 });
}
function positionCustomSelect(wrapper){
 const menu=wrapper._customMenu,trigger=wrapper._customTrigger;
 if(!menu||!trigger)return;
 const rect=trigger.getBoundingClientRect();
 const gap=7;
 menu.style.width=Math.max(180,Math.round(rect.width))+'px';
 menu.style.left=Math.max(8,Math.min(window.innerWidth-Math.max(180,rect.width)-8,rect.left))+'px';
 menu.classList.remove('above');
 menu.style.top=Math.round(rect.bottom+gap)+'px';
 const menuHeight=Math.min(menu.scrollHeight,340);
 if(rect.bottom+gap+menuHeight>window.innerHeight-8&&rect.top-menuHeight-gap>8){
  menu.classList.add('above');
  menu.style.top=Math.round(rect.top-menuHeight-gap)+'px';
 }
}
function rebuildCustomSelect(wrapper){
 const select=wrapper._customNative,menu=wrapper._customMenu,trigger=wrapper._customTrigger;
 if(!select||!menu||!trigger)return;
 wrapper.classList.toggle('custom-role-select',select.classList.contains('role-select'));
 trigger.disabled=select.disabled;
 trigger.querySelector('.custom-select-value').textContent=customSelectLabel(select);
 menu.innerHTML=Array.from(select.options).map((option,index)=>`<button type="button" class="custom-select-option ${option.selected?'selected':''}" data-custom-option="${index}" ${option.disabled?'disabled':''} role="option" aria-selected="${option.selected}"><span>${esc(option.textContent)}</span><span class="custom-select-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span></button>`).join('');
 menu.querySelectorAll('[data-custom-option]').forEach(button=>button.onclick=event=>{
  event.stopPropagation();
  const option=select.options[Number(button.dataset.customOption)];
  if(!option||option.disabled)return;
  select.value=option.value;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  rebuildCustomSelect(wrapper);
  closeCustomSelect();
 });
}
function openCustomSelect(wrapper){
 if(wrapper._customNative.disabled)return;
 if(activeCustomSelect===wrapper){closeCustomSelect();return}
 closeCustomSelect();
 activeCustomSelect=wrapper;
 rebuildCustomSelect(wrapper);
 wrapper.classList.add('open');
 wrapper._customMenu.classList.add('show');
 wrapper._customTrigger.setAttribute('aria-expanded','true');
 positionCustomSelect(wrapper);
 const selected=wrapper._customMenu.querySelector('.custom-select-option.selected');
 if(selected)selected.scrollIntoView({block:'nearest'});
}
function closeCustomSelect(){
 if(!activeCustomSelect)return;
 activeCustomSelect.classList.remove('open');
 activeCustomSelect._customMenu?.classList.remove('show','above');
 activeCustomSelect._customTrigger?.setAttribute('aria-expanded','false');
 activeCustomSelect=null;
}
function enhanceCustomSelect(select){
 if(!(select instanceof HTMLSelectElement)||select.dataset.customSelectReady==='1'){
  const existing=select.closest?.('.custom-select');
  if(existing)rebuildCustomSelect(existing);
  return;
 }
 select.dataset.customSelectReady='1';
 const wrapper=document.createElement('div');
 wrapper.id=`customSelect${++customSelectUid}`;
 wrapper.className=`custom-select${select.classList.contains('role-select')?' custom-role-select':''}`;
 select.parentNode.insertBefore(wrapper,select);
 wrapper.appendChild(select);
 select.classList.add('custom-native-select');
 const trigger=document.createElement('button');
 trigger.type='button';
 trigger.className='custom-select-trigger';
 trigger.setAttribute('aria-haspopup','listbox');
 trigger.setAttribute('aria-expanded','false');
 trigger.innerHTML=`<span class="custom-select-value"></span><span class="custom-select-chevron"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5"/></svg></span>`;
 wrapper.appendChild(trigger);
 const menu=document.createElement('div');
 menu.className='custom-select-menu';
 menu.dataset.customOwner=wrapper.id;
 menu.setAttribute('role','listbox');
 document.body.appendChild(menu);
 wrapper._customNative=select;wrapper._customTrigger=trigger;wrapper._customMenu=menu;
 trigger.onclick=event=>{event.stopPropagation();openCustomSelect(wrapper)};
 trigger.onkeydown=event=>{
  if(event.key==='Escape'){closeCustomSelect();return}
  if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();openCustomSelect(wrapper)}
 };
 select.addEventListener('change',()=>rebuildCustomSelect(wrapper));
 rebuildCustomSelect(wrapper);
}
function queueCustomSelectRefresh(){
 if(customSelectRefreshFrame)return;
 customSelectRefreshFrame=requestAnimationFrame(()=>{
  customSelectRefreshFrame=0;
  cleanupCustomSelectMenus();
  document.querySelectorAll('select.control,select.role-select').forEach(enhanceCustomSelect);
 });
}
document.addEventListener('pointerdown',event=>{
 if(activeCustomSelect&&!event.target.closest('.custom-select-menu')&&!event.target.closest('.custom-select'))closeCustomSelect();
});
window.addEventListener('resize',closeCustomSelect,{passive:true});
document.addEventListener('scroll',event=>{if(activeCustomSelect&&event.target===activeCustomSelect._customMenu)return;closeCustomSelect()},{capture:true,passive:true});



// ---------------- Mouse wheel vertical scroll routing ----------------
function normalizedWheelY(event,viewportHeight){
 const unit=event.deltaMode===1?18:event.deltaMode===2?Math.max(1,viewportHeight):1;
 return event.deltaY*unit;
}
function canElementScrollVertically(element,deltaY){
 if(!(element instanceof HTMLElement))return false;
 const style=getComputedStyle(element);
 if(!/(auto|scroll|overlay)/.test(style.overflowY))return false;
 const max=element.scrollHeight-element.clientHeight;
 if(max<=1)return false;
 return deltaY<0?element.scrollTop>1:element.scrollTop<max-1;
}
function findVerticalWheelOwner(target,boundary,deltaY){
 for(let element=target;element&&element!==boundary;element=element.parentElement){
  if(canElementScrollVertically(element,deltaY))return element;
 }
 return null;
}
function installMainWheelRouting(){
 if(document.documentElement.dataset.mainWheelRouting==='1')return;
 document.documentElement.dataset.mainWheelRouting='1';
 document.addEventListener('wheel',event=>{
  if(event.defaultPrevented||event.ctrlKey||event.shiftKey)return;
  const target=event.target instanceof Element?event.target:null;
  if(!target||target.closest('input,textarea,select,[contenteditable="true"]'))return;
  const content=document.querySelector('.content');
  if(!content)return;
  const deltaY=normalizedWheelY(event,content.clientHeight);
  if(!deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;

  const openLayer=target.closest('.modal.show,.drawer.show,.notification-panel.show');
  if(openLayer){
   if(findVerticalWheelOwner(target,openLayer,deltaY))return;
   return;
  }
  if(document.querySelector('.modal.show,.drawer.show'))return;

  const horizontalSurface=target.closest('.board-scroll,.board-floating-scroll,.table-wrap,.master-table-wrap,.classic-calendar-scroll,.saved-views');
  const outsideMain=!target.closest('.content');
  if(!horizontalSurface&&!outsideMain)return;
  if(findVerticalWheelOwner(target,content,deltaY))return;

  const max=content.scrollHeight-content.clientHeight;
  if(max<=1)return;
  const next=Math.max(0,Math.min(max,content.scrollTop+deltaY));
  if(Math.abs(next-content.scrollTop)<.5)return;
  event.preventDefault();
  content.scrollTop=next;
 },{passive:false,capture:true});
}
installMainWheelRouting();


// ---------------- Built-in frontend diagnostics ----------------
window.AccountingTaskQA={
 run(){
  const checks=[];const add=(name,pass,detail='')=>checks.push({name,pass:Boolean(pass),detail});
  add('Unique task IDs',new Set(state.tasks.map(t=>t.id)).size===state.tasks.length);
  add('Valid task statuses',state.tasks.every(t=>STATUS[t.status]),state.tasks.filter(t=>!STATUS[t.status]).map(t=>t.id).join(','));
  add('Task teams resolve',state.tasks.every(t=>Boolean(teamMeta(t.team))));
  add('Task categories resolve',state.tasks.every(t=>categoriesForTeam(t.team,true).includes(t.category)),state.tasks.filter(t=>!categoriesForTeam(t.team,true).includes(t.category)).map(t=>t.id).slice(0,10).join(','));
  add('Checklist structure',state.tasks.every(t=>Array.isArray(t.checklist)&&t.checklist.every(c=>typeof c.checked==='boolean'&&c.label)));
  add('Unique team codes',new Set(state.masterData.teams.map(t=>t.code.toLowerCase())).size===state.masterData.teams.length);
  add('Unique category names',new Set(state.masterData.categories.map(t=>t.name.toLowerCase())).size===state.masterData.categories.length);
  add('Template references valid',state.templates.every(t=>masterTeamByCode(t.team)&&categoriesForTeam(t.team,true).includes(t.category)));
  add('Staff annual-task guard',(()=>{const old=ui.role;ui.role='staff';const ok=!canManageAnnualTasks();ui.role=old;return ok})());
  add('Same-team file guard',(()=>{const old=ui.role;ui.role='staff';const same={team:currentUser().team},other={team:'__OTHER__'};const ok=canDownloadFile(same)&&!canDownloadFile(other);ui.role=old;return ok})());
  return {passed:checks.filter(x=>x.pass).length,total:checks.length,checks};
 }
};

// ---------------- Global events ----------------
let sidebarResizeTimer;
function applySidebarState(collapsed,{persist=true}={}){
 const app=document.getElementById('app');
 ui.sidebarCollapsed=Boolean(collapsed);
 if(persist)localStorage.setItem('acct-side',ui.sidebarCollapsed?'1':'0');
 closeCustomSelect();
 app.classList.add('shell-resizing');
 app.classList.toggle('collapsed',ui.sidebarCollapsed);
 requestAnimationFrame(()=>syncBoardScrollbarDuringShellMotion());
 const toggle=document.getElementById('brandToggle');
 toggle.setAttribute('aria-expanded',String(!ui.sidebarCollapsed));
 toggle.setAttribute('aria-label',ui.sidebarCollapsed?'ขยายเมนู':'ย่อเมนู');
 toggle.title=ui.sidebarCollapsed?'ขยายเมนู':'ย่อเมนู';
 clearTimeout(sidebarResizeTimer);
 sidebarResizeTimer=setTimeout(()=>app.classList.remove('shell-resizing'),360);
}
document.getElementById('brandToggle').onclick=()=>applySidebarState(!ui.sidebarCollapsed);
document.getElementById('roleSelect').onchange=e=>{ui.role=e.target.value;localStorage.setItem('acct-role',ui.role);ui.filters.team.team=ui.role==='manager'?'all':currentUser().team;ui.selected.clear();document.getElementById('notificationPanel').classList.remove('show');document.documentElement.classList.remove('notif-open');render()};
document.getElementById('notificationBtn').onclick=e=>{e.stopPropagation();renderNotifications()};document.addEventListener('pointerdown',e=>{const panel=document.getElementById('notificationPanel');if(panel.classList.contains('show')&&!panel.contains(e.target)&&!e.target.closest('#notificationBtn')){panel.classList.remove('show');document.documentElement.classList.remove('notif-open')}});document.getElementById('drawerBackdrop').onclick=closeDrawer;document.getElementById('modalBackdrop').onclick=closeModals;window.addEventListener('hashchange',render);window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeModals();document.getElementById('notificationPanel').classList.remove('show');document.documentElement.classList.remove('notif-open')}});
applyTheme(ui.themeMode,{persist:false});applySidebarState(ui.sidebarCollapsed,{persist:false});if(!location.hash)location.hash='dashboard';else render();queueCustomSelectRefresh();
