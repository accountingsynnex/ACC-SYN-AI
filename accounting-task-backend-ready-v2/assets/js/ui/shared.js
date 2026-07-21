// Navigation shell, shared render helpers, table components and dialog utilities

function toast(msg){const e=document.createElement('div');e.className='toast';e.textContent=msg;document.getElementById('toastWrap').appendChild(e);setTimeout(()=>e.remove(),2700)}

// Async action boundary for backend calls: disables the trigger while pending, keeps the
// prior local state untouched on failure, and routes HTTP 409 (stale version) to a conflict
// dialog instead of a generic error toast. Views wired through ApiTaskService should call
// user-triggered mutations (transition, checklist update, ...) through this helper rather
// than mutating local state directly, so a rejected call never overwrites what is on screen.
async function runAsyncAction(trigger,action,{onConflict,retryLabel='ลองใหม่'}={}){
 if(trigger){trigger.disabled=true;trigger.dataset.prevLabel=trigger.dataset.prevLabel??trigger.textContent;trigger.textContent='กำลังบันทึก...'}
 try{
  const result=await action();
  return result;
 }catch(err){
  if(err?.status===409){showConflictModal(onConflict)}
  else{showRetryToast(err?.message||'บันทึกไม่สำเร็จ กรุณาลองใหม่',()=>runAsyncAction(trigger,action,{onConflict,retryLabel}),retryLabel)}
  throw err;
 }finally{
  if(trigger){trigger.disabled=false;trigger.textContent=trigger.dataset.prevLabel;delete trigger.dataset.prevLabel}
 }
}
function showRetryToast(message,onRetry,retryLabel){
 const e=document.createElement('div');e.className='toast toast-retry';
 e.innerHTML=`<span>${esc(message)}</span>`;
 const btn=document.createElement('button');btn.className='toast-retry-btn';btn.textContent=retryLabel;
 btn.onclick=()=>{e.remove();onRetry()};
 e.appendChild(btn);
 document.getElementById('toastWrap').appendChild(e);setTimeout(()=>e.remove(),6000);
}
function showConflictModal(onReload){
 const modal=document.getElementById('conflictModal');
 if(!modal){toast('ข้อมูลถูกแก้ไขจากผู้ใช้อื่น กรุณาโหลดข้อมูลล่าสุด');onReload?.();return}
 modal.innerHTML=`<div class="modal-head"><div><h2>ข้อมูลมีการเปลี่ยนแปลง</h2><span class="subtext">มีผู้ใช้อื่นบันทึกงานนี้ไปแล้วหลังจากที่คุณเปิดดู</span></div></div><div class="modal-body"><p style="color:var(--muted);line-height:1.6">การแก้ไขของคุณยังไม่ถูกบันทึก เพื่อป้องกันข้อมูลทับกัน กรุณาโหลดข้อมูลล่าสุดก่อนแก้ไขต่อ</p></div><div class="modal-foot"><button class="btn primary" id="conflictReload">โหลดข้อมูลล่าสุด</button></div>`;
 modal.querySelector('#conflictReload').onclick=()=>{closeModals();onReload?.()};
 openModal('conflictModal');
}
function pageTitle(page){return ({dashboard:'Dashboard','my-tasks':'My Tasks','team-board':'Team Board','review-queue':'Review Queue','closing-calendar':'Closing Calendar'})[page]||'Accounting Task'}
function navigate(page){location.hash=page}
function parseRoute(){
 const raw=location.hash.replace('#','');
 let [p,query='']=raw.split('?');
 const params=new URLSearchParams(query);
 if(p==='templates'){ui.settingsTab='annual-task';ui.settingsModalOpen=true;p='dashboard'}
 if(p==='master-data'){ui.settingsTab='task-team';ui.settingsModalOpen=true;p='dashboard'}
 if(p==='settings'){
  if(['appearance','task-team','annual-task'].includes(params.get('tab')))ui.settingsTab=params.get('tab');
  ui.settingsModalOpen=true;p='dashboard';
 }
 ui.page=NAV.some(n=>n.id===p&&n.id!=='settings')?p:'dashboard';
}
let lastNavSignature='';
function renderShell(){
 const app=document.getElementById('app');app.classList.toggle('collapsed',ui.sidebarCollapsed);
 const tasks=visibleTasks();
 const counts={
  'team-board':tasks.filter(t=>t.status!=='approved').length,
  'review-queue':tasks.filter(t=>['ready-review','under-review'].includes(t.status)&&(canReview(t)||t.assignee===currentUser().name)).length
 };
 const signature=[ui.page,ui.role,counts['team-board'],counts['review-queue'],ui.settingsModalOpen,ui.sidebarCollapsed].join('|');
 if(signature!==lastNavSignature){
  lastNavSignature=signature;
  const groups=[...new Set(NAV.map(n=>n.group))];
  const nav=document.getElementById('sideNav');
  const navMarkup=n=>{
   if(n.id==='settings')return `<button class="nav-item settings-parent ${ui.settingsModalOpen?'active':''}" data-settings-open aria-haspopup="dialog" aria-expanded="${ui.settingsModalOpen}"><span class="nav-icon">${iconSvg(n.icon)}</span><span class="nav-text">${n.label}</span></button>`;
   return `<button class="nav-item ${ui.page===n.id?'active':''}" data-nav="${n.id}"><span class="nav-icon">${iconSvg(n.icon)}</span><span class="nav-text">${n.label}</span>${counts[n.id]!=null?`<span class="nav-count">${counts[n.id]>99?'99+':counts[n.id]}</span>`:''}</button>`;
  };
  nav.innerHTML=groups.map(g=>`<div class="nav-section"><div class="nav-label">${g}</div>${NAV.filter(n=>n.group===g).map(navMarkup).join('')}</div>`).join('');
  nav.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
  nav.querySelector('[data-settings-open]')?.addEventListener('click',()=>{
   ui.settingsModalOpen=true;
   renderSettingsModal();
   lastNavSignature='';renderShell();
  });
 }
 const topTitle=document.getElementById('topTitle'),topSubtitle=document.getElementById('topSubtitle'),roleSelect=document.getElementById('roleSelect'),avatar=document.getElementById('avatar');
 const title=pageTitle(ui.page),subtitle='Accounting task management';
 if(topTitle.textContent!==title)topTitle.textContent=title;if(topSubtitle.textContent!==subtitle)topSubtitle.textContent=subtitle;
 if(roleSelect.value!==ui.role)roleSelect.value=ui.role;if(avatar.textContent!==currentUser().initials)avatar.textContent=currentUser().initials;
 const unreadCount=currentNotifications().filter(n=>n.unread).length;const notificationBadge=document.getElementById('notificationDot');const badgeText=unreadCount>99?'99+':String(unreadCount);if(notificationBadge.textContent!==badgeText)notificationBadge.textContent=badgeText;notificationBadge.style.display=unreadCount?'flex':'none';notificationBadge.setAttribute('aria-label',unreadCount?`${unreadCount} การแจ้งเตือนที่ยังไม่อ่าน`:'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน');
}
let pendingBoardReveal=null;
function revealMovedBoardCard(){
 const pending=pendingBoardReveal;if(!pending)return;
 pendingBoardReveal=null;
 requestAnimationFrame(()=>{
  const card=document.querySelector(`.task-card[data-task-id="${pending.id}"]`);
  if(!card)return;
  const scroller=card.closest('[data-board-scroll]');
  if(scroller){
   const sr=scroller.getBoundingClientRect(),cr=card.getBoundingClientRect();
   const next=scroller.scrollLeft+(cr.left-sr.left)-Math.max(12,(sr.width-cr.width)/2);
   scroller.scrollLeft=Math.max(0,next);
   scroller.dispatchEvent(new Event('scroll'));
  }
  card.classList.add('task-card-arrived');
  setTimeout(()=>card.classList.remove('task-card-arrived'),650);
 });
}
function render(options={}){
 const resetScroll=options?.resetScroll!==false;
 const content=document.querySelector('.content');
 const previousScroll=content?.scrollTop||0;
 const previousBoardScroll=[...document.querySelectorAll('[data-board-scroll]')].map(x=>x.scrollLeft);
 parseRoute();renderShell();
 const root=document.getElementById('pageRoot');
 ({dashboard:renderDashboard,'my-tasks':renderMyTasks,'team-board':renderTeamBoard,'review-queue':renderReviewQueue,'closing-calendar':renderCalendar})[ui.page](root);
 if(content){content.scrollTop=resetScroll?0:previousScroll}
 document.querySelectorAll('[data-board-scroll]').forEach((x,i)=>{if(previousBoardScroll[i]!=null)x.scrollLeft=previousBoardScroll[i]});
 if(ui.settingsModalOpen)renderSettingsModal();
 queueCustomSelectRefresh();queueBoardScrollbarRefresh();revealMovedBoardCard();
}
function optionList(values,current,labelFn=x=>x){return values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(labelFn(v))}</option>`).join('')}
// Shared loading/error scaffolding for async-migrated pages (see pages/*.js).
function pageSkeleton(eyebrow,title){return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>กำลังโหลดข้อมูล…</p></div></div><div class="kpi-grid">${Array.from({length:5},()=>'<div class="kpi skeleton-kpi" aria-hidden="true"><span>&nbsp;</span><strong>—</strong><small>&nbsp;</small></div>').join('')}</div><div class="panel"><div class="panel-body"><div class="empty" role="status" aria-live="polite">กำลังโหลด…</div></div></div>`}
function pageErrorState(eyebrow,title,retryId,err){return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div></div>${noticeBox('danger','โหลดข้อมูลไม่สำเร็จ',err&&err.message?err.message:'เกิดข้อผิดพลาดในการเชื่อมต่อ')}<div style="margin-top:12px"><button class="btn primary" id="${retryId}">ลองอีกครั้ง</button></div>`}
function filterControl(label,id,value,options,extra=''){return `<div class="field ${extra}"><label for="${id}">${label}</label><select class="control" id="${id}">${optionList(options,value,v=>v==='all'?'ทั้งหมด':v)}</select></div>`}
function searchControl(id,value,placeholder='ค้นหา'){return `<div class="field search"><label for="${id}">ค้นหา</label><input class="control" id="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}"></div>`}
const PRIORITY_LABEL={critical:'Critical',high:'High',normal:'Normal',low:'Low'};
function statusBadge(s){const meta=STATUS[s]||{label:s};return `<span class="ui-chip status-chip state-${esc(s)}"><i class="chip-dot"></i>${esc(meta.label)}</span>`}
function priorityBadge(p){return `<span class="ui-chip priority-chip priority-${esc(p)}"><i class="chip-dot"></i>${esc(PRIORITY_LABEL[p]||p)}</span>`}
function teamChip(team,full=false){const meta=teamMeta(team);return `<span class="ui-chip team-chip" style="--team-color:${esc(meta.color)}"><i class="chip-dot"></i>${esc(team)}${full?` · ${esc(meta.name)}`:''}</span>`}
function categoryChip(category){return `<span class="ui-chip category-chip" title="${esc(category)}">${esc(category)}</span>`}
function periodChip(period){return `<span class="ui-chip period-chip">${esc(period)}</span>`}
function activityBadge(active){return `<span class="ui-chip activity-chip ${active?'active':'inactive'}"><i class="chip-dot"></i>${active?'Active':'Inactive'}</span>`}
function personValue(name){const initials=String(name||'-').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();return `<span class="person-value"><i class="person-avatar">${esc(initials||'-')}</i><span class="person-name">${esc(name||'-')}</span></span>`}
function dueDateValue(t){const iso=t.dueDate,today=dateISO(TODAY),days=daysBetween(today,iso);const tone=isOverdue(t)?'overdue':iso===today?'today':days>0&&days<=7?'soon':'';return `<span class="due-value ${tone}">${formatDate(iso)}${tone==='overdue'?' · เลยกำหนด':tone==='today'?' · วันนี้':''}</span>`}
function checklistValue(t,attr=''){const done=t.checklist.filter(x=>x.checked).length,total=t.checklist.length,pct=total?Math.round(done/total*100):0,complete=total>0&&done===total;return `<div class="checklist-value ${complete?'complete':''}"><span class="checklist-count" ${attr?`${attr}="${t.id}"`:''}>${done}/${total}</span><span class="checklist-track"><i data-checklist-bar="${t.id}" style="width:${pct}%"></i></span></div>`}
function taskIdentity(t){return `<div class="task-identity"><button class="task-link" data-task-open="${t.id}">${esc(t.title)}</button><div class="task-meta-row"><span class="task-id">${esc(t.id)}</span>${categoryChip(t.category)}</div></div>`}
function queueAgeBadge(hours,closed=false){if(closed)return `<span class="standard-state-text">ปิดคิวแล้ว</span>`;const tone=hours>48?'queue-bad':hours>24?'queue-warn':'queue-good';return `<span class="ui-chip queue-chip ${tone}">${hours}h</span>`}
function dashboardMetricTone(value,{good=90,warn=80,inverse=false}={}){
 const n=Number(value)||0;
 if(inverse)return n<=good?'success':n<=warn?'warning':'danger';
 return n>=good?'success':n>=warn?'warning':'danger';
}
function dashboardMetricValue(value,tone='neutral',suffix=''){
 return `<span class="dash-metric ${tone}">${value}${suffix}</span>`;
}
function dashboardTeamValue(team){return teamChip(team)}
function setFilter(page,key,value){ui.filters[page][key]=value;render()}
let filterRenderTimer=0;
function normalizeDependentFilter(page,key){
 const f=ui.filters[page];if(!f)return;
 if(['my','team','review'].includes(page))ui.pageNo[page==='my'?'my':page==='team'?'team':'review']=1;
 if(key==='team'&&f.team&&f.team!=='all'){
  const cats=categoriesForTeam(f.team);
  if(f.category&&f.category!=='all'&&!cats.includes(f.category))f.category='all';
  const people=new Set(visibleTasks().filter(t=>t.team===f.team).flatMap(t=>[t.assignee,t.reviewer]));
  if(f.assignee&&f.assignee!=='all'&&!people.has(f.assignee))f.assignee='all';
  if(f.reviewer&&f.reviewer!=='all'&&!people.has(f.reviewer))f.reviewer='all';
 }
}
function bindFilter(id,page,key,event='change'){
 const e=document.getElementById(id);if(!e)return;
 e.addEventListener(event,()=>{
  ui.filters[page][key]=e.value;normalizeDependentFilter(page,key);
  if(event!=='input'){render({resetScroll:false});return}
  clearTimeout(filterRenderTimer);
  const caret=typeof e.selectionStart==='number'?e.selectionStart:e.value.length;
  filterRenderTimer=setTimeout(()=>{
   render({resetScroll:false});
   requestAnimationFrame(()=>{const next=document.getElementById(id);if(!next)return;next.focus({preventScroll:true});if(next.setSelectionRange)next.setSelectionRange(caret,caret)});
  },240);
 });
}
function sortRows(rows,tableId){const s=ui.sort[tableId];if(!s)return rows;return [...rows].sort((a,b)=>{let av=typeof s.get==='function'?s.get(a):a[s.key],bv=typeof s.get==='function'?s.get(b):b[s.key];if(Number.isNaN(av))av=-Infinity;if(Number.isNaN(bv))bv=-Infinity;if(av==null)av='';if(bv==null)bv='';if(typeof av==='string')av=av.toLowerCase();if(typeof bv==='string')bv=bv.toLowerCase();return(av>bv?1:av<bv?-1:0)*(s.dir==='asc'?1:-1)})}
const sortGetterRegistry=new Map();
function sortableTh(label,tableId,key,get){
 const s=ui.sort[tableId];const arrow=s?.key===key?`<span class="sort-arrow">${s.dir==='asc'?'↑':'↓'}</span>`:'';
 if(typeof get==='function')sortGetterRegistry.set(`${tableId}:${key}`,get);
 return `<th class="sortable" tabindex="0" data-sort-table="${tableId}" data-sort-key="${key}">${label}${arrow}</th>`
}
document.addEventListener('click',e=>{
 const th=e.target.closest?.('[data-sort-table][data-sort-key]');if(!th)return;
 const tableId=th.dataset.sortTable,key=th.dataset.sortKey,current=ui.sort[tableId];
 ui.sort[tableId]={key,dir:current?.key===key&&current.dir==='asc'?'desc':'asc',get:sortGetterRegistry.get(`${tableId}:${key}`)};
 render({resetScroll:false});
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[data-sort-table][data-sort-key]')){e.preventDefault();e.target.click()}});
function canOperateTask(t){return canEdit(t)||canReview(t)}
function taskCard(t,showTeam=true){
 const targets=allowedTargets(t),movable=targets.length>0,access=!canEdit(t)&&canReview(t)?'<span class="review-access">ผู้ตรวจ</span>':!canOperateTask(t)?'<span class="read-only">ดูอย่างเดียว</span>':'';
 const done=t.checklist.filter(x=>x.checked).length,total=t.checklist.length,pct=total?done/total*100:0;
 return `<article class="task-card status-${t.status} ${movable?'movable-card':''}" data-task-id="${t.id}" data-movable="${movable?'1':'0'}" draggable="${movable}">
 <div class="teamline"><div class="entity-row">${showTeam?teamChip(t.team):''}${categoryChip(t.category)}</div>${access}</div>
 <h4>${esc(t.title)}</h4><div class="card-badges">${priorityBadge(t.priority)}${isOverdue(t)?'<span class="ui-chip queue-chip queue-bad">เลยกำหนด</span>':''}</div>
 <div class="check-mini"><span><i>Checklist</i><b data-check-count="${t.id}">${done}/${total}</b></span><div class="progress-track"><div class="progress-fill" data-progress-fill="${t.id}" style="width:${pct}%"></div></div></div>
 <div class="card-footer"><div class="meta">${personValue(t.assignee)}${dueDateValue(t)}</div></div></article>`;
}
function syncTaskProgress(t){
 const done=t.checklist.filter(x=>x.checked).length,total=t.checklist.length,pct=total?done/total*100:0;
 document.querySelectorAll(`[data-check-count="${t.id}"]`).forEach(x=>x.textContent=`${done}/${total}`);
 document.querySelectorAll(`[data-progress-fill="${t.id}"],[data-checklist-bar="${t.id}"]`).forEach(x=>x.style.width=`${pct}%`);
 document.querySelectorAll(`[data-list-check="${t.id}"],[data-table-check="${t.id}"],[data-review-check="${t.id}"]`).forEach(x=>x.textContent=`${done}/${total}`);
 document.querySelectorAll(`.task-card[data-task-id="${t.id}"]`).forEach(card=>{
  const movable=allowedTargets(t).length>0;
  card.draggable=movable;card.dataset.movable=movable?'1':'0';card.classList.toggle('movable-card',movable);
 });
}
function keepMovedTaskVisible(t,target){
 if(ui.page==='my-tasks'){
  const f=ui.filters.my;
  if(f.status!=='all'&&f.status!==target)f.status='all';
 }
 if(ui.page==='team-board'){
  const f=ui.filters.team;
  if(f.status==='open'&&target==='approved')f.status='approved';else if(f.status==='overdue'&&!isOverdue(t))f.status='all';
  else if(f.status==='review'&&!['ready-review','under-review'].includes(target))f.status='all';
  else if(!['all','open','review'].includes(f.status)&&f.status!==target)f.status='all';
 }
 pendingBoardReveal={id:t.id,status:target};
}
function moveTaskToStatus(id,target,source='board'){
 const t=TaskService.get(id);if(!t)return;
 const valid=allowedTargets(t);
 if(!valid.includes(target)){
  const message=t.status==='in-progress'&&!requiredComplete(t)?'ต้องทำ Checklist บังคับให้ครบก่อนส่ง Ready for Review':'ไม่สามารถย้ายไปสถานะนี้ตาม Workflow หรือสิทธิ์ปัจจุบัน';
  toast(message);return;
 }
 if(target==='revision'){openRejectModal(id);return}
 try{
  TaskService.transition(id,target);
  keepMovedTaskVisible(t,target);
  render({resetScroll:false});
  toast(`ย้ายเป็น ${STATUS[target].label} แล้ว`);
 }catch(err){toast(err.message)}
}
