// Review Queue rendering and reviewer actions

function renderReviewQueue(root){
 renderAsyncPage(root,'reviewQueue','HUMAN REVIEW CONTROL','Review Queue',()=>renderReviewQueueView(root));
}
function renderReviewQueueView(root){
 const f=ui.filters.review;
 let scope=visibleTasks();
 if(ui.role==='staff')scope=scope.filter(t=>t.assignee===currentUser().name);
 if(ui.role==='reviewer')scope=scope.filter(t=>t.reviewer===currentUser().name||(t.status==='ready-review'&&t.team===currentUser().team));
 if(ui.role==='teamlead')scope=scope.filter(t=>t.team===currentUser().team);
 const generic={search:f.search,team:f.team,reviewer:f.reviewer,priority:f.priority,status:'all'};
 let queueBase=scope.filter(t=>['ready-review','under-review'].includes(t.status)).filter(t=>matchTask(t,generic));
 if(f.age!=='all')queueBase=queueBase.filter(t=>{const h=(TODAY-new Date(t.submittedAt||t.updatedAt))/3600000;return f.age==='over48'?h>48:f.age==='24-48'?h>=24&&h<=48:h<24});
 const approvedToday=scope.filter(t=>t.status==='approved'&&t.updatedAt.slice(0,10)===dateISO(TODAY)).filter(t=>matchTask(t,generic));
 const counts={ready:queueBase.filter(t=>t.status==='ready-review').length,under:queueBase.filter(t=>t.status==='under-review').length,sla:queueBase.filter(t=>(TODAY-new Date(t.submittedAt||t.updatedAt))/3600000>48).length,due:queueBase.filter(t=>t.dueDate===dateISO(TODAY)).length,approved:approvedToday.length};
 let tasks=f.kpi==='approved-today'?[...approvedToday]:queueBase.filter(t=>matchTask(t,{status:f.status}));
 if(f.kpi==='ready-review')tasks=tasks.filter(t=>t.status==='ready-review');
 if(f.kpi==='under-review')tasks=tasks.filter(t=>t.status==='under-review');
 if(f.kpi==='sla')tasks=tasks.filter(t=>(TODAY-new Date(t.submittedAt||t.updatedAt))/3600000>48);
 if(f.kpi==='due-today')tasks=tasks.filter(t=>t.dueDate===dateISO(TODAY));
 tasks=sortRows(tasks,'reviewTable');
 const pageSize=25,totalPages=Math.max(1,Math.ceil(tasks.length/pageSize));ui.pageNo.review=Math.min(ui.pageNo.review,totalPages);const pageTasks=tasks.slice((ui.pageNo.review-1)*pageSize,ui.pageNo.review*pageSize);
 root.innerHTML=`<div class="page-head"><div><div class="eyebrow">HUMAN REVIEW CONTROL</div><h1>Review Queue</h1><p>กด Widget เพื่อเลือกดูเฉพาะสถานะหรือเงื่อนไขที่สนใจ แล้วตรวจ Checklist และอนุมัติจากจุดเดียว</p></div></div>
 <div class="kpi-grid"><div class="kpi blue ${f.kpi==='ready-review'?'kpi-selected':''}" data-review-kpi="ready-review"><span>Ready for Review</span><strong>${counts.ready}</strong><small>รอผู้ตรวจรับงาน</small></div><div class="kpi purple ${f.kpi==='under-review'?'kpi-selected':''}" data-review-kpi="under-review"><span>Under Review</span><strong>${counts.under}</strong><small>อยู่ระหว่างตรวจ</small></div><div class="kpi red ${f.kpi==='sla'?'kpi-selected':''}" data-review-kpi="sla"><span>SLA Breached</span><strong>${counts.sla}</strong><small>รอเกิน 48 ชั่วโมง</small></div><div class="kpi orange ${f.kpi==='due-today'?'kpi-selected':''}" data-review-kpi="due-today"><span>Due today</span><strong>${counts.due}</strong><small>ต้องสรุปผลวันนี้</small></div><div class="kpi green ${f.kpi==='approved-today'?'kpi-selected':''}" data-review-kpi="approved-today"><span>Approved today</span><strong>${counts.approved}</strong><small>ผ่านการตรวจวันนี้</small></div></div>
 <div class="filter-panel wide">${searchControl('reviewSearch',f.search,'ค้นหางานหรือพนักงาน')}${filterControl('ทีม','reviewTeam',f.team,['all',...activeTeamCodes()])}${filterControl('ผู้ตรวจ','reviewReviewer',f.reviewer,['all',...new Set(visibleTasks().map(t=>t.reviewer))])}${filterControl('สถานะ','reviewStatus',f.status,['all','ready-review','under-review'])}${filterControl('ความสำคัญ','reviewPriority',f.priority,['all','critical','high','normal','low'])}${filterControl('อายุคิว','reviewAge',f.age,['all','under24','24-48','over48'])}<div class="filter-meta">พบ ${tasks.length} รายการ</div></div>
 <article class="panel"><div class="panel-body"><div class="table-wrap"><table class="standard-table"><thead><tr>${sortableTh('งาน','reviewTable','title')}${sortableTh('ทีม','reviewTable','team')}${sortableTh('ผู้รับผิดชอบ','reviewTable','assignee')}${sortableTh('ส่งตรวจเมื่อ','reviewTable','submittedAt')}${sortableTh('อายุคิว','reviewTable','age',x=>(TODAY-new Date(x.submittedAt||x.updatedAt))/3600000)}${sortableTh('กำหนดส่ง','reviewTable','dueDate')}${sortableTh('Checklist','reviewTable','check',x=>x.checklist.filter(c=>c.checked).length/x.checklist.length)}${sortableTh('สถานะ','reviewTable','status')}<th>การดำเนินการ</th></tr></thead><tbody>${pageTasks.map(t=>{const h=t.status==='approved'?0:Math.max(0,Math.round((TODAY-new Date(t.submittedAt||t.updatedAt))/3600000));return`<tr><td>${taskIdentity(t)}</td><td>${teamChip(t.team)}</td><td>${personValue(t.assignee)}</td><td>${t.submittedAt?formatDateTime(t.submittedAt):'-'}</td><td>${queueAgeBadge(h,t.status==='approved')}</td><td>${dueDateValue(t)}</td><td>${checklistValue(t,'data-review-check')}</td><td>${statusBadge(t.status)}</td><td><div class="table-action-cell">${t.status==='approved'?'<span class="standard-state-text">อนุมัติแล้ว</span>':canReview(t)?(t.status==='ready-review'?`<button class="btn small primary" data-review-action="take" data-id="${t.id}">รับตรวจ</button>`:`<button class="btn small success" data-review-action="approve" data-id="${t.id}">Approve</button><button class="btn small danger" data-review-action="reject" data-id="${t.id}">Reject</button>`):'<span class="standard-state-text">ดูอย่างเดียว</span>'}</div></td></tr>`}).join('')||'<tr><td colspan="9"><div class="empty"><strong>ไม่พบงาน</strong>กด Widget เดิมอีกครั้งเพื่อยกเลิกตัวกรอง</div></td></tr>'}</tbody></table></div>${pagination('review',ui.pageNo.review,totalPages,tasks.length,pageSize)}</div></article>`;
 ['Search','Team','Reviewer','Priority','Age'].forEach(k=>bindFilter(`review${k}`,'review',k.toLowerCase(),k==='Search'?'input':'change'));
 const status=document.getElementById('reviewStatus');if(status)status.onchange=()=>{f.status=status.value;f.kpi=null;ui.pageNo.review=1;render({resetScroll:false})};
 document.querySelectorAll('[data-review-kpi]').forEach(card=>card.onclick=()=>{const key=card.dataset.reviewKpi;f.kpi=f.kpi===key?null:key;f.status='all';ui.pageNo.review=1;render({resetScroll:false})});
 document.querySelectorAll('[data-page-key="review"]').forEach(button=>button.onclick=()=>{ui.pageNo.review=Number(button.dataset.pageNo)||1;render({resetScroll:false})});
 document.querySelectorAll('[data-task-open]').forEach(x=>x.onclick=()=>openTask(x.dataset.taskOpen));
 document.querySelectorAll('[data-review-action]').forEach(b=>b.onclick=async()=>{
  const t=TaskService.get(b.dataset.id);if(b.dataset.reviewAction==='reject')return openRejectModal(t.id);
  const target=b.dataset.reviewAction==='take'?'under-review':'approved';
  try{await runAsyncAction(b,()=>AsyncTaskRepository.transition(t.id,target),{onConflict:()=>render({resetScroll:false})})}catch(err){return}
  render({resetScroll:false});toast(`ดำเนินการ ${STATUS[target].label} แล้ว`)
 })
}
