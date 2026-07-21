// My Tasks list, filters, pagination and bulk actions.
// This page is the reference implementation for backend integration: it fetches through
// AsyncTaskRepository (await + loading/error states) instead of reading state synchronously.
// The other pages still read state directly and should be migrated to this same pattern.

function renderMyTasks(root){
 renderAsyncPage(root,'myTasks','PERSONAL WORKSPACE','My Tasks',all=>{
  const mine=all.filter(t=>t.assignee===currentUser().name);
  renderMyTasksView(root,mine);
 });
}
function renderMyTasksView(root,mine){
 const f=ui.filters.my;
 let base=mine.filter(t=>canView(t)&&matchTask(t,{search:f.search,priority:f.priority,status:'all'}));
 const counts={all:base.length,overdue:base.filter(isOverdue).length,revision:base.filter(t=>t.status==='revision').length,review:base.filter(t=>['ready-review','under-review'].includes(t.status)).length,ready:base.filter(requiredComplete).length};
 let tasks=base.filter(t=>matchTask(t,{status:f.status}));
 if(f.kpi==='overdue')tasks=tasks.filter(isOverdue);
 if(f.kpi==='revision')tasks=tasks.filter(t=>t.status==='revision');
 if(f.kpi==='review')tasks=tasks.filter(t=>['ready-review','under-review'].includes(t.status));
 if(f.kpi==='ready')tasks=tasks.filter(requiredComplete);
 tasks.sort((a,b)=>(isOverdue(b)-isOverdue(a))||({critical:0,high:1,normal:2,low:3}[a.priority]-{critical:0,high:1,normal:2,low:3}[b.priority])||a.dueDate.localeCompare(b.dueDate));
 root.innerHTML=`<div class="page-head"><div><div class="eyebrow">PERSONAL WORKSPACE</div><h1>My Tasks</h1><p>โฟกัสงานที่ต้องดำเนินการต่อ งานถูกตีกลับ และกำหนดส่งใกล้ถึง</p></div><div class="head-actions"><div class="tabs"><button class="tab ${ui.myView==='table'?'active':''}" data-my-view="table">Table</button><button class="tab ${ui.myView==='board'?'active':''}" data-my-view="board">Board</button></div><button class="btn primary" id="newMyTask">+ สร้างงาน</button></div></div>
 <div class="kpi-grid"><div class="kpi blue ${!f.kpi?'kpi-selected':''}" data-my-kpi="all"><span>งานของฉัน</span><strong>${counts.all}</strong><small>งานทั้งหมดตามตัวกรอง</small></div><div class="kpi red ${f.kpi==='overdue'?'kpi-selected':''}" data-my-kpi="overdue"><span>เลยกำหนด</span><strong>${counts.overdue}</strong><small>ต้องดำเนินการทันที</small></div><div class="kpi orange ${f.kpi==='revision'?'kpi-selected':''}" data-my-kpi="revision"><span>Revision</span><strong>${counts.revision}</strong><small>ได้รับข้อสังเกตจากผู้ตรวจ</small></div><div class="kpi purple ${f.kpi==='review'?'kpi-selected':''}" data-my-kpi="review"><span>รอตรวจ</span><strong>${counts.review}</strong><small>Ready + Under Review</small></div><div class="kpi green ${f.kpi==='ready'?'kpi-selected':''}" data-my-kpi="ready"><span>Checklist ready</span><strong>${counts.ready}</strong><small>รายการบังคับครบ</small></div></div>
 <div class="filter-panel">${searchControl('mySearch',f.search,'ค้นหางานของฉัน')}${filterControl('สถานะ','myStatus',f.status,['all',...STATUS_ORDER])}${filterControl('ความสำคัญ','myPriority',f.priority,['all','critical','high','normal','low'])}<div class="filter-meta">พบ ${tasks.length} รายการ</div></div>
 ${ui.myView==='table'?myTaskTable(tasks):myTaskBoard(tasks)}`;
 document.querySelectorAll('[data-my-view]').forEach(b=>b.onclick=()=>{ui.myView=b.dataset.myView;render({resetScroll:false})});
 bindFilter('mySearch','my','search','input');bindFilter('myPriority','my','priority');
 const status=document.getElementById('myStatus');if(status)status.onchange=()=>{f.status=status.value;f.kpi=null;ui.pageNo.my=1;render({resetScroll:false})};
 document.querySelectorAll('[data-my-kpi]').forEach(card=>card.onclick=()=>{const key=card.dataset.myKpi;f.kpi=key==='all'||f.kpi===key?null:key;f.status='all';ui.pageNo.my=1;render({resetScroll:false})});
 document.getElementById('newMyTask').onclick=()=>openTaskModal();bindTaskOpenAndDrag();bindRowChecks();
}
function myTaskTable(tasks){const sorted=sortRows(tasks,'myTable'),pageSize=25,totalPages=Math.max(1,Math.ceil(sorted.length/pageSize));ui.pageNo.my=Math.min(ui.pageNo.my,totalPages);const rows=sorted.slice((ui.pageNo.my-1)*pageSize,ui.pageNo.my*pageSize);return `<div class="panel"><div class="panel-body"><div class="table-wrap"><table class="standard-table"><thead><tr>${sortableTh('งาน','myTable','title')}${sortableTh('ทีม','myTable','team')}${sortableTh('ผู้ตรวจ','myTable','reviewer')}${sortableTh('สถานะ','myTable','status',x=>STATUS_ORDER.indexOf(x.status))}${sortableTh('ความสำคัญ','myTable','priority')}${sortableTh('งวดบัญชี','myTable','period')}${sortableTh('กำหนดส่ง','myTable','dueDate')}${sortableTh('Checklist','myTable','checklist',x=>x.checklist.filter(c=>c.checked).length/x.checklist.length)}${sortableTh('อัปเดตล่าสุด','myTable','updatedAt')}<th>เปิด</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${taskIdentity(t)}</td><td>${teamChip(t.team)}</td><td>${personValue(t.reviewer)}</td><td>${statusBadge(t.status)}</td><td>${priorityBadge(t.priority)}</td><td>${periodChip(t.period)}</td><td>${dueDateValue(t)}</td><td>${checklistValue(t,'data-table-check')}</td><td>${formatDateTime(t.updatedAt)}</td><td><button class="icon-btn open-task-btn" data-task-open="${t.id}" aria-label="เปิดงาน">›</button></td></tr>`).join('')||'<tr><td colspan="10"><div class="empty"><strong>ไม่พบงาน</strong>ลองเปลี่ยนตัวกรอง</div></td></tr>'}</tbody></table></div>${pagination('my',ui.pageNo.my,totalPages,sorted.length,pageSize)}</div></div>`}
function myTaskBoard(tasks){return renderBoardColumns(tasks,{showTeamOnCard:false,scrollLabel:'เลื่อนบอร์ดงานของฉันในแนวนอน'})}
