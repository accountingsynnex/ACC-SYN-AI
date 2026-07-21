// Team board rendering, drag-and-drop workflow and card interactions

let teamBoardRequestId=0;
function renderTeamBoard(root){
 const requestId=++teamBoardRequestId;
 root.innerHTML=pageSkeleton('CROSS-TEAM WORKSPACE','Team Board');
 AsyncTaskRepository.list({}).then(()=>{
  if(requestId!==teamBoardRequestId)return;
  renderTeamBoardView(root);
 }).catch(err=>{
  if(requestId!==teamBoardRequestId)return;
  root.innerHTML=pageErrorState('CROSS-TEAM WORKSPACE','Team Board','teamBoardRetry',err);
  const retry=document.getElementById('teamBoardRetry');if(retry)retry.onclick=()=>renderTeamBoard(root);
 });
}
function renderTeamBoardView(root){
 const f=ui.filters.team;let tasks=TaskService.list(f);if(f.status==='open')tasks=tasks.filter(t=>t.status!=='approved');
 const categories=[...new Set(f.team==='all'?activeCategoryNames():categoriesForTeam(f.team))],assignees=[...new Set(visibleTasks().filter(t=>f.team==='all'||t.team===f.team).map(t=>t.assignee))],reviewers=[...new Set(visibleTasks().filter(t=>f.team==='all'||t.team===f.team).map(t=>t.reviewer))];
 root.innerHTML=`<div class="page-head"><div><div class="eyebrow">CROSS-TEAM WORKSPACE</div><h1>Team Board</h1><p>Board และ Table ใช้ Filter ชุดเดียวกัน Staff ดูทุกทีมและแก้ไขเฉพาะงานตัวเอง</p></div><div class="head-actions"><div class="tabs"><button class="tab ${ui.teamView==='board'?'active':''}" data-team-view="board">Board</button><button class="tab ${ui.teamView==='table'?'active':''}" data-team-view="table">Table</button></div>${ui.role!=='staff'?'<button class="btn primary" id="newTeamTask">+ สร้างงาน</button>':''}</div></div>
 <div class="filter-panel wide">${searchControl('teamSearch',f.search,'ค้นหางาน รหัส พนักงาน หรือผู้ตรวจ')}${filterControl('ทีม','teamTeam',f.team,['all',...activeTeamCodes()])}${filterControl('งวด','teamPeriod',f.period,['all','2026-06','2026-07','2026-08'])}${filterControl('ผู้รับผิดชอบ','teamAssignee',f.assignee,['all',...assignees])}${filterControl('ผู้ตรวจ','teamReviewer',f.reviewer,['all',...reviewers])}${filterControl('สถานะ','teamStatus',f.status,['all','open','overdue','review',...STATUS_ORDER])}${filterControl('ประเภทงาน','teamCategory',f.category,['all',...categories])}${filterControl('ความสำคัญ','teamPriority',f.priority,['all','critical','high','normal','low'])}<div class="filter-meta">พบ ${tasks.length} รายการ</div></div>
 <div class="bulkbar ${ui.selected.size?'show':''}" id="bulkbar"><span>เลือก ${ui.selected.size} รายการ</span><button class="btn small" data-bulk="priority">เปลี่ยนความสำคัญ</button><button class="btn small" data-bulk="assignee">เปลี่ยนผู้รับผิดชอบ</button><button class="btn small" data-bulk="due">เปลี่ยนกำหนดส่ง</button><button class="btn small" data-bulk="clear">ยกเลิก</button></div>
 ${ui.teamView==='board'?teamBoardView(tasks):teamTableView(tasks)}`;
 ['Search','Team','Period','Assignee','Reviewer','Status','Category','Priority'].forEach(k=>bindFilter(`team${k}`,'team',k.toLowerCase(),k==='Search'?'input':'change'));document.querySelectorAll('[data-team-view]').forEach(b=>b.onclick=()=>{ui.teamView=b.dataset.teamView;ui.selected.clear();render()});document.getElementById('newTeamTask')?.addEventListener('click',()=>openTaskModal());document.querySelectorAll('[data-bulk]').forEach(b=>b.onclick=()=>bulkAction(b.dataset.bulk));document.querySelectorAll('[data-board-more]').forEach(b=>b.onclick=()=>{ui.boardLimit[b.dataset.boardMore]=(ui.boardLimit[b.dataset.boardMore]||10)+10;render({resetScroll:false})});bindTaskOpenAndDrag();bindRowChecks();
}
function teamBoardView(tasks){const grouped=Object.fromEntries(STATUS_ORDER.map(s=>[s,tasks.filter(t=>t.status===s)]));return `<div class="board-scroll-shell"><div class="board-scroll" data-board-scroll tabindex="0" aria-label="เลื่อน Team Board ในแนวนอน"><div class="board">${STATUS_ORDER.map(s=>{const rows=grouped[s],limit=ui.boardLimit[s]||10;return`<section class="column status-column status-${s}" data-drop-status="${s}"><div class="column-head"><div class="column-title">${statusBadge(s)}</div><span class="column-count">${rows.length}</span></div>${rows.slice(0,limit).map(t=>taskCard(t,true)).join('')||'<div class="empty" style="padding:25px 8px">ไม่มีงาน</div>'}${rows.length>limit?`<button class="chip" data-board-more="${s}">แสดงเพิ่ม ${Math.min(10,rows.length-limit)} รายการ</button>`:''}</section>`}).join('')}</div></div><div class="board-floating-scroll" data-board-floating-scroll aria-label="แถบเลื่อน Team Board ซ้ายขวา"><div class="board-floating-scroll-spacer"></div></div></div>`}
function teamTableView(tasks){const sorted=sortRows(tasks,'teamTable'),pageSize=25,totalPages=Math.max(1,Math.ceil(sorted.length/pageSize));ui.pageNo.team=Math.min(ui.pageNo.team,totalPages);const rows=sorted.slice((ui.pageNo.team-1)*pageSize,ui.pageNo.team*pageSize);return `<div class="panel"><div class="panel-body"><div class="table-wrap"><table class="standard-table"><thead><tr><th><input type="checkbox" id="selectAll"></th>${sortableTh('งาน','teamTable','title')}${sortableTh('ทีม','teamTable','team')}${sortableTh('ผู้รับผิดชอบ','teamTable','assignee')}${sortableTh('ผู้ตรวจ','teamTable','reviewer')}${sortableTh('สถานะ','teamTable','status',x=>STATUS_ORDER.indexOf(x.status))}${sortableTh('ความสำคัญ','teamTable','priority')}${sortableTh('งวดบัญชี','teamTable','period')}${sortableTh('กำหนดส่ง','teamTable','dueDate')}${sortableTh('Checklist','teamTable','checklist',x=>x.checklist.filter(c=>c.checked).length/x.checklist.length)}${sortableTh('อัปเดตล่าสุด','teamTable','updatedAt')}</tr></thead><tbody>${rows.map(t=>`<tr><td><input type="checkbox" data-row-check="${t.id}" ${ui.selected.has(t.id)?'checked':''} ${canEdit(t)?'':'disabled'}></td><td>${taskIdentity(t)}</td><td>${teamChip(t.team)}</td><td>${personValue(t.assignee)}</td><td>${personValue(t.reviewer)}</td><td>${statusBadge(t.status)}</td><td>${priorityBadge(t.priority)}</td><td>${periodChip(t.period)}</td><td>${dueDateValue(t)}</td><td>${checklistValue(t,'data-table-check')}</td><td>${formatDateTime(t.updatedAt)}</td></tr>`).join('')||'<tr><td colspan="11"><div class="empty"><strong>ไม่พบงาน</strong>ลองเปลี่ยนตัวกรอง</div></td></tr>'}</tbody></table></div>${pagination('team',ui.pageNo.team,totalPages,sorted.length,pageSize)}</div></div>`}
function paginationPages(total,current){if(total<=7)return Array.from({length:total},(_,i)=>i+1);const set=new Set([1,total,current-1,current,current+1]);return [...set].filter(x=>x>=1&&x<=total).sort((a,b)=>a-b)}
function pagination(key,current,total,count,size){const pages=paginationPages(total,current);let last=0;const buttons=[];pages.forEach(p=>{if(last&&p-last>1)buttons.push('<span class="page-ellipsis">…</span>');buttons.push(`<button class="page-btn ${p===current?'active':''}" data-page-key="${key}" data-page-no="${p}">${p}</button>`);last=p});return `<div class="pagination"><span>แสดง ${count?((current-1)*size+1):0}–${Math.min(current*size,count)} จาก ${count}</span><div class="page-buttons"><button class="page-btn" data-page-key="${key}" data-page-no="${Math.max(1,current-1)}" ${current<=1?'disabled':''}>‹</button>${buttons.join('')}<button class="page-btn" data-page-key="${key}" data-page-no="${Math.min(total,current+1)}" ${current>=total?'disabled':''}>›</button></div></div>`}
function bindRowChecks(){document.querySelectorAll('[data-row-check]').forEach(c=>c.onchange=()=>{c.checked?ui.selected.add(c.dataset.rowCheck):ui.selected.delete(c.dataset.rowCheck);render()});const all=document.getElementById('selectAll');if(all)all.onchange=()=>{document.querySelectorAll('[data-row-check]:not(:disabled)').forEach(c=>{all.checked?ui.selected.add(c.dataset.rowCheck):ui.selected.delete(c.dataset.rowCheck)});render()};document.querySelectorAll('[data-page-key]').forEach(b=>b.onclick=()=>{ui.pageNo[b.dataset.pageKey]=+b.dataset.pageNo;render()})}
function bulkAction(action){
 if(action==='clear'){ui.selected.clear();render();return}
 const chosen=state.tasks.filter(t=>ui.selected.has(t.id)&&canEdit(t));
 if(!chosen.length){toast('ไม่มีรายการที่แก้ไขได้');return}
 openBulkModal(action,chosen);
}
function applyBulkUpdate(action,chosen,value){
 if(action==='priority'){if(!['low','normal','high','critical'].includes(value))return false;chosen.forEach(t=>t.priority=value)}
 else if(action==='assignee'){if(!value||!String(value).trim())return false;chosen.forEach(t=>t.assignee=String(value).trim())}
 else if(action==='due'){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;chosen.forEach(t=>t.dueDate=value)}
 else return false;
 const now=new Date().toISOString();
 chosen.forEach(t=>{t.updatedAt=now;t.activity.push({at:now,action:`Bulk update: ${action}`,by:currentUser().name})});
 Store.save();ui.selected.clear();render();toast(`อัปเดต ${chosen.length} รายการแล้ว`);
 return true;
}
function openBulkModal(action,chosen){
 const modal=document.getElementById('taskModal');
 const titles={priority:'เปลี่ยนความสำคัญ',assignee:'เปลี่ยนผู้รับผิดชอบ',due:'เปลี่ยนกำหนดส่ง'};
 let field='';
 if(action==='priority')field=`<div class="field"><label>ความสำคัญใหม่</label><select class="control" name="value">${optionList(['low','normal','high','critical'],'high',v=>PRIORITY_LABEL[v]||v)}</select></div>`;
 else if(action==='assignee'){const people=[...new Set(chosen.flatMap(t=>membersForTeam(t.team)))];field=`<div class="field"><label>ผู้รับผิดชอบใหม่</label><select class="control" name="value">${optionList(people,people[0])}</select></div>`}
 else if(action==='due')field=`<div class="field"><label>กำหนดส่งใหม่</label><input class="control" type="date" name="value" value="${defaultDueDate()}" required></div>`;
 modal.innerHTML=`<div class="modal-head"><div><h2>${titles[action]||'อัปเดตหลายรายการ'}</h2><span class="subtext">มีผลกับ ${chosen.length} รายการที่เลือก</span></div><button class="close-btn" data-close-modal>×</button></div><form id="bulkForm"><div class="modal-body"><div class="form-grid">${field}</div></div><div class="modal-foot"><button type="button" class="btn" data-close-modal>ยกเลิก</button><button class="btn primary" type="submit">ยืนยัน</button></div></form>`;
 modal.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModals);
 modal.querySelector('#bulkForm').onsubmit=e=>{e.preventDefault();const value=new FormData(e.target).get('value');if(applyBulkUpdate(action,chosen,value))closeModals();else toast('ค่าที่กรอกไม่ถูกต้อง')};
 openModal('taskModal');queueCustomSelectRefresh();
}
let activeDragTaskId=null,dragClickLock=false;
function clearBoardDragState(){
 document.querySelectorAll('.task-card.dragging').forEach(x=>x.classList.remove('dragging'));
 document.querySelectorAll('[data-drop-status]').forEach(x=>x.classList.remove('dragover','dragover-valid','dragover-invalid','drop-allowed','drop-blocked'));
 activeDragTaskId=null;
}
function bindTaskOpenAndDrag(){
 document.querySelectorAll('[data-task-open]').forEach(x=>x.onclick=()=>openTask(x.dataset.taskOpen));
 document.querySelectorAll('.task-card[data-task-id]').forEach(card=>{
  card.onclick=e=>{if(dragClickLock||e.target.closest('select,button,input,a,label'))return;openTask(card.dataset.taskId)};
  card.ondragstart=e=>{
   const t=TaskService.get(card.dataset.taskId),targets=t?allowedTargets(t):[];
   if(!t||!targets.length){e.preventDefault();toast(t?taskMoveNote(t):'ไม่พบงาน');return}
   activeDragTaskId=t.id;dragClickLock=true;card.classList.add('dragging');
   e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id);
   document.querySelectorAll('[data-drop-status]').forEach(col=>col.classList.add(targets.includes(col.dataset.dropStatus)?'drop-allowed':'drop-blocked'));
  };
  card.ondragend=()=>{clearBoardDragState();setTimeout(()=>{dragClickLock=false},80)};
 });
 document.querySelectorAll('[data-drop-status]').forEach(col=>{
  col.ondragover=e=>{
   const id=activeDragTaskId||e.dataTransfer.getData('text/plain'),t=TaskService.get(id),valid=t&&allowedTargets(t).includes(col.dataset.dropStatus);
   col.classList.toggle('dragover-invalid',Boolean(t&&!valid));
   if(!valid)return;
   e.preventDefault();e.dataTransfer.dropEffect='move';col.classList.add('dragover-valid');
  };
  col.ondragleave=e=>{if(!col.contains(e.relatedTarget))col.classList.remove('dragover-valid','dragover-invalid')};
  col.ondrop=e=>{
   e.preventDefault();const id=activeDragTaskId||e.dataTransfer.getData('text/plain'),target=col.dataset.dropStatus,t=TaskService.get(id);
   const valid=t&&allowedTargets(t).includes(target);clearBoardDragState();setTimeout(()=>{dragClickLock=false},80);
   if(!t)return;
   if(!valid){toast(t.status==='in-progress'&&!requiredComplete(t)?'Checklist บังคับยังไม่ครบ จึงยังส่งตรวจไม่ได้':'สถานะนี้ไม่ใช่ขั้นตอนถัดไปตาม Workflow');return}
   moveTaskToStatus(id,target,'drag');
  };
 });
}
