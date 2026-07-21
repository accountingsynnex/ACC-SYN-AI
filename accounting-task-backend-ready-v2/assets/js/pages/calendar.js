// Closing Calendar month and timeline views

const CALENDAR_STATUS_THEME={
 'assigned':{a:'#F0F1F3',b:'#E1E3E7',c:'#5C6067'},
 'in-progress':{a:'#E7F3FF',b:'#C9E4FF',c:'#0863A4'},
 'ready-review':{a:'#E2F5F3',b:'#C4E8E4',c:'#0A6D70'},
 'under-review':{a:'#F0E9FF',b:'#DDCFFF',c:'#65409D'},
 'revision':{a:'#FFEAE7',b:'#FFD0CA',c:'#A23228'},
 'approved':{a:'#E4F3E8',b:'#C8E6D0',c:'#216B38'}
};
function calendarLocalISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function calendarTheme(status){return CALENDAR_STATUS_THEME[status]||CALENDAR_STATUS_THEME.assigned}
function calendarDayLabel(s,withWeekday=false){return new Date(s+'T00:00:00').toLocaleDateString('th-TH',withWeekday?{weekday:'long',day:'numeric',month:'short',year:'numeric'}:{day:'numeric',month:'short'})}
let calendarRequestId=0;
function renderCalendar(root){
 const requestId=++calendarRequestId;
 root.innerHTML=pageSkeleton('MONTH-END PLANNING','Closing Calendar');
 AsyncTaskRepository.list({}).then(()=>{
  if(requestId!==calendarRequestId)return;
  renderCalendarView(root);
 }).catch(err=>{
  if(requestId!==calendarRequestId)return;
  root.innerHTML=pageErrorState('MONTH-END PLANNING','Closing Calendar','calendarRetry',err);
  const retry=document.getElementById('calendarRetry');if(retry)retry.onclick=()=>renderCalendar(root);
 });
}
function renderCalendarView(root){
 const f=ui.filters.calendar,y=ui.calendarDate.getFullYear(),m=ui.calendarDate.getMonth(),todayIso=calendarLocalISO(TODAY);
 const scopeTasks=visibleTasks().filter(t=>matchTask(t,f));
 const monthTasks=scopeTasks.filter(t=>{const d=new Date(t.dueDate+'T00:00:00');return d.getFullYear()===y&&d.getMonth()===m});
 let displayTasks=[...scopeTasks];
 if(f.kpi==='milestone')displayTasks=displayTasks.filter(t=>t.priority==='critical');
 if(f.kpi==='week')displayTasks=displayTasks.filter(t=>{const d=new Date(t.dueDate+'T00:00:00');return d>=TODAY&&d<=addDays(TODAY,7)});
 if(f.kpi==='overdue')displayTasks=displayTasks.filter(isOverdue);
 if(f.kpi==='progress')displayTasks=displayTasks.filter(t=>t.status==='approved');
 const monthDone=monthTasks.filter(t=>t.status==='approved').length,pct=monthTasks.length?Math.round(monthDone/monthTasks.length*100):0;
 const selected=ui.calendarSelected||todayIso,selectedItems=displayTasks.filter(t=>t.dueDate===selected).sort((a,b)=>(a.priority==='critical'?-1:1)-(b.priority==='critical'?-1:1));
 const upcoming=scopeTasks.filter(t=>t.priority==='critical'&&t.dueDate>=todayIso).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,6);
 const first=new Date(y,m,1),monthLabel=first.toLocaleDateString('th-TH',{month:'long',year:'numeric'});
 root.innerHTML=`<div class="page-head"><div><div class="eyebrow">MONTH-END PLANNING</div><h1>Closing Calendar</h1><p>ดู Milestone งาน Critical และภาระงานตามวันใน Closing cycle</p></div><div class="head-actions">${ui.role!=='staff'?'<button class="btn primary" id="newCalendarTask">+ เพิ่ม Closing Task</button>':''}</div></div>
 <div class="filter-panel">${searchControl('calSearch',f.search,'ชื่องาน รหัส หรือผู้รับผิดชอบ')}${filterControl('ทีม','calTeam',f.team,['all',...activeTeamCodes()])}${filterControl('ประเภทงาน','calCategory',f.category,['all',...activeCategoryNames()])}${filterControl('ผู้รับผิดชอบ','calAssignee',f.assignee,['all',...new Set(visibleTasks().map(t=>t.assignee))])}</div>
 <div class="kpi-grid calendar-kpi-grid"><div class="kpi blue ${f.kpi==='milestone'?'selected':''}" data-cal-kpi="milestone"><span>Milestone ในเดือน</span><strong>${monthTasks.filter(t=>t.priority==='critical').length}</strong><small>วันที่สำคัญของ Closing cycle</small></div><div class="kpi orange ${f.kpi==='week'?'selected':''}" data-cal-kpi="week"><span>ครบกำหนดใน 7 วัน</span><strong>${scopeTasks.filter(t=>{const d=new Date(t.dueDate+'T00:00:00');return d>=TODAY&&d<=addDays(TODAY,7)}).length}</strong><small>${formatDate(todayIso)} – ${formatDate(calendarLocalISO(addDays(TODAY,7)))}</small></div><div class="kpi red ${f.kpi==='overdue'?'selected':''}" data-cal-kpi="overdue"><span>เลยกำหนด</span><strong>${scopeTasks.filter(isOverdue).length}</strong><small>งานที่ยังไม่ Approved</small></div><div class="kpi green ${f.kpi==='progress'?'selected':''}" data-cal-kpi="progress"><span>Closing progress</span><strong>${pct}%</strong><small>Approved ในเดือน</small></div></div>
 <div class="classic-calendar-layout">
  <article class="panel classic-calendar-main"><div class="panel-head classic-calendar-head"><div><h3>ปฏิทินงานปิดบัญชี</h3><p>คลิกวันที่เพื่อดูรายการทั้งหมด หรือคลิกงานเพื่อเปิดรายละเอียด</p></div><div class="legend">${statusBadge('in-progress')}${statusBadge('ready-review')}${statusBadge('under-review')}${statusBadge('revision')}${statusBadge('approved')}</div></div><div class="panel-body"><div class="classic-calendar-toolbar"><div class="classic-month-nav"><button class="classic-icon-btn" data-cal-nav="prev" aria-label="เดือนก่อน">‹</button><div class="classic-month-label">${monthLabel}</div><button class="classic-icon-btn" data-cal-nav="next" aria-label="เดือนถัดไป">›</button></div><div class="classic-segmented"><button class="${ui.calendarView==='month'?'active':''}" data-calendar-view="month">Month</button><button class="${ui.calendarView==='timeline'?'active':''}" data-calendar-view="timeline">Timeline</button></div></div>${ui.calendarView==='month'?classicCalendarMonth(displayTasks,y,m,todayIso):classicCalendarTimeline(displayTasks)}</div></article>
  <aside class="classic-calendar-side"><section class="panel classic-day-summary"><div class="panel-head"><div><h3>${selected===todayIso?'วันนี้ · ':''}${calendarDayLabel(selected,true)}</h3><p>${selectedItems.length} รายการในวันที่เลือก</p></div><button class="task-link" id="openSelectedDayBoard">ดูใน Team Board</button></div><div class="panel-body"><div class="classic-day-list">${selectedItems.map(classicDayCard).join('')||'<div class="empty">ไม่มีงานในวันที่เลือก</div>'}</div></div></section><section class="panel"><div class="panel-head"><div><h3>Upcoming milestones</h3><p>วันสำคัญลำดับถัดไปใน Closing cycle</p></div></div><div class="panel-body"><div class="classic-milestone-list">${upcoming.map(t=>{const days=Math.max(0,daysBetween(todayIso,t.dueDate));return`<div class="classic-milestone-row" data-task-open="${t.id}"><div class="classic-milestone-date">${new Date(t.dueDate+'T00:00:00').getDate()}</div><div><h4>${esc(t.title)}</h4><p>${calendarDayLabel(t.dueDate)}</p><div class="task-meta-row">${teamChip(t.team)}${categoryChip(t.category)}</div></div><span class="classic-milestone-count">${days===0?'วันนี้':days+' วัน'}</span></div>`}).join('')||'<div class="empty">ไม่มี Milestone ที่กำลังจะมาถึง</div>'}</div></div></section></aside>
 </div>`;
 ['Search','Team','Category','Assignee'].forEach(k=>bindFilter(`cal${k}`,'calendar',k.toLowerCase(),k==='Search'?'input':'change'));
 document.querySelectorAll('[data-calendar-view]').forEach(b=>b.onclick=()=>{ui.calendarView=b.dataset.calendarView;render()});
 document.querySelectorAll('[data-cal-kpi]').forEach(k=>k.onclick=()=>{f.kpi=f.kpi===k.dataset.calKpi?null:k.dataset.calKpi;render()});
 document.getElementById('newCalendarTask')?.addEventListener('click',()=>openTaskModal());
 document.querySelectorAll('[data-cal-nav]').forEach(b=>b.onclick=()=>{ui.calendarDate.setMonth(ui.calendarDate.getMonth()+(b.dataset.calNav==='next'?1:-1));ui.calendarDate.setDate(1);ui.calendarSelected=calendarLocalISO(ui.calendarDate);render()});
 document.querySelectorAll('[data-calendar-date]').forEach(cell=>cell.onclick=e=>{if(e.target.closest('[data-task-open]'))return;ui.calendarSelected=cell.dataset.calendarDate;const d=new Date(ui.calendarSelected+'T00:00:00');if(d.getFullYear()!==ui.calendarDate.getFullYear()||d.getMonth()!==ui.calendarDate.getMonth())ui.calendarDate=new Date(d.getFullYear(),d.getMonth(),1);render()});
 document.querySelectorAll('[data-task-open]').forEach(x=>x.onclick=e=>{e.stopPropagation();openTask(x.dataset.taskOpen)});
 document.getElementById('openSelectedDayBoard')?.addEventListener('click',()=>{ui.filters.team.search=ui.calendarSelected;ui.filters.team.status='all';ui.teamView='table';ui.pageNo.team=1;navigate('team-board');toast('เปิด Team Board ตามวันที่เลือก')});
}
function classicDayCard(t){return `<div class="classic-day-card" data-task-open="${t.id}"><div class="classic-day-card-top"><h4>${t.priority==='critical'?'◆ ':''}${esc(t.title)}</h4>${priorityBadge(t.priority)}</div><p>${t.id} · ${esc(t.assignee)}</p><div class="classic-day-card-meta">${teamChip(t.team)}${statusBadge(t.status)}${categoryChip(t.category)}</div></div>`}
function classicCalendarMonth(tasks,y,m,todayIso){const first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate(),cells=[];for(let i=0;i<42;i++){let day=i-start+1,other=false,cy=y,cm=m;if(day<1){day=prevDays+day;cm=m-1;other=true;if(cm<0){cm=11;cy--}}else if(day>days){day-=days;cm=m+1;other=true;if(cm>11){cm=0;cy++}}const d=new Date(cy,cm,day),iso=calendarLocalISO(d),items=tasks.filter(t=>t.dueDate===iso),weekend=i%7>=5;cells.push(`<div class="classic-day-cell ${other?'other-month':''} ${weekend?'weekend':''} ${iso===todayIso?'today':''} ${iso===ui.calendarSelected?'selected':''}" data-calendar-date="${iso}"><div class="classic-day-number">${day}</div><div class="classic-day-events">${items.slice(0,3).map(t=>{const theme=calendarTheme(t.status);return`<button class="classic-event-chip ${t.priority==='critical'?'milestone':''} ${isOverdue(t)?'overdue':''}" data-task-open="${t.id}" style="--event-a:${theme.a};--event-b:${theme.b};--event-c:${theme.c}">${t.priority==='critical'?'◆ ':''}${esc(t.title)}</button>`}).join('')}${items.length>3?`<button class="classic-more-events" data-calendar-date="${iso}">+${items.length-3} งาน</button>`:''}</div></div>`)}return `<div class="classic-calendar-scroll"><div class="classic-calendar-grid">${['จ','อ','พ','พฤ','ศ','ส','อา'].map(x=>`<div class="classic-weekday">${x}</div>`).join('')}${cells.join('')}</div></div>`}
function classicCalendarTimeline(tasks){const groups={};[...tasks].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).forEach(t=>(groups[t.dueDate]??=[]).push(t));return `<div class="classic-timeline">${Object.entries(groups).map(([d,arr])=>`<div class="classic-timeline-day"><div class="classic-timeline-date"><strong>${calendarDayLabel(d,true)}</strong><span>${arr.length} รายการ</span></div><div class="classic-timeline-items">${arr.map(t=>{const theme=calendarTheme(t.status);return`<div class="classic-timeline-item" data-task-open="${t.id}"><i class="classic-timeline-dot" style="--dot-a:${theme.a};--dot-b:${theme.b}"></i><div><h4>${esc(t.title)}</h4><p>${t.id} · ${esc(t.assignee)}</p></div>${teamChip(t.team)}${statusBadge(t.status)}</div>`}).join('')}</div></div>`).join('')||'<div class="empty"><strong>ไม่พบงาน</strong><br>ลองเปลี่ยนตัวกรอง</div>'}</div>`}

