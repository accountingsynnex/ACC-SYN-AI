// Task drawer, checklist, file handling and task editor dialogs

function openTask(id,tab='detail'){ui.drawerTab=tab;const t=TaskService.get(id);if(!t||!canView(t))return;const drawer=document.getElementById('taskDrawer');drawer.innerHTML=drawerHtml(t);document.getElementById('drawerBackdrop').classList.add('show');drawer.classList.add('show');bindDrawer(t)}
function closeDrawer(){document.getElementById('drawerBackdrop').classList.remove('show');document.getElementById('taskDrawer').classList.remove('show')}
function drawerHtml(t){
 const tabs=[['detail','รายละเอียด'],['checklist','Checklist'],['files','ไฟล์'],['activity','ประวัติ']];
 let body='';
 if(ui.drawerTab==='detail'){const team=teamMeta(t.team);body=`<div class="task-detail-card"><div class="task-detail-grid"><div class="task-detail-field"><span class="task-detail-label">ทีม</span><div class="task-detail-value"><span class="task-detail-team" style="--team-color:${esc(team.color)}"><i class="task-detail-team-dot"></i><span class="task-detail-team-copy"><strong>${esc(t.team)}</strong><small>${esc(team.name)}</small></span></span></div></div><div class="task-detail-field"><span class="task-detail-label">ประเภทงาน</span><div class="task-detail-value"><span class="task-detail-text" title="${esc(t.category)}">${esc(t.category)}</span></div></div><div class="task-detail-field"><span class="task-detail-label">สถานะ</span><div class="task-detail-value">${statusBadge(t.status)}</div></div><div class="task-detail-field"><span class="task-detail-label">ความสำคัญ</span><div class="task-detail-value">${priorityBadge(t.priority)}</div></div><div class="task-detail-field"><span class="task-detail-label">ผู้รับผิดชอบ</span><div class="task-detail-value">${personValue(t.assignee)}</div></div><div class="task-detail-field"><span class="task-detail-label">ผู้ตรวจ</span><div class="task-detail-value">${personValue(t.reviewer)}</div></div><div class="task-detail-field"><span class="task-detail-label">งวดบัญชี</span><div class="task-detail-value">${periodChip(t.period)}</div></div><div class="task-detail-field"><span class="task-detail-label">กำหนดส่ง</span><div class="task-detail-value">${dueDateValue(t)}</div></div></div></div>`;}
 if(ui.drawerTab==='checklist')body=`<div>${t.checklist.map(c=>`<div class="check-item"><input type="checkbox" data-check-id="${esc(c.id)}" ${c.checked?'checked':''} ${canEdit(t)?'':'disabled'}><label>${esc(c.label)} ${c.required?'<span class="required">*</span>':''}</label></div>`).join('')}</div>`;
 if(ui.drawerTab==='files'){const downloadAllowed=canDownloadFile(t);body=`${!downloadAllowed?noticeBox('warning','ดาวน์โหลดไฟล์ไม่ได้','ดาวน์โหลดได้เฉพาะไฟล์ของงานในทีมเดียวกันตามสิทธิ์ผู้ใช้'):''}${aiReviewNotice(t)}<div>${t.files.length?t.files.map(f=>`<div class="file-item"><div><strong>${esc(f.name)}</strong><span class="subtext">${esc(f.type||'Submission')} · Version ${f.version}${f.size?` · ${formatFileSize(f.size)}`:''}</span></div><div class="file-actions">${downloadAllowed?`<button class="btn small" data-file-download="${f.id}">ดาวน์โหลด</button>`:'<button class="btn small" disabled>ไม่มีสิทธิ์</button>'}${canEdit(t)?`<button class="btn small danger" data-file-delete="${f.id}">ลบ</button>`:''}</div></div>`).join(''):'<div class="empty"><strong>ยังไม่มีไฟล์</strong>อัปโหลดไฟล์เพื่อทดสอบการจัดเก็บใน Browser</div>'}</div>${canEdit(t)?'<label class="btn small" style="display:inline-block;margin-top:8px">+ อัปโหลดไฟล์<input id="drawerFile" type="file" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.zip,.png,.jpg,.jpeg" hidden></label>':''}`;}
 if(ui.drawerTab==='activity')body=t.activity.slice().reverse().map(a=>`<div class="activity-item"><strong>${esc(a.action)}</strong><span>${esc(a.by)} · ${formatDateTime(a.at)}</span></div>`).join('');
 const actions=allowedTargets(t).map(s=>`<button class="btn ${s==='revision'?'danger':s==='approved'?'success':'primary'}" data-transition="${s}">${s==='revision'?'ตีกลับ':STATUS[s].label}</button>`).join('');
 return `<div class="drawer-head"><div><div class="eyebrow">${t.id}</div><h2>${esc(t.title)}</h2><div class="entity-row">${teamChip(t.team)}${categoryChip(t.category)}${statusBadge(t.status)}</div></div><button class="close-btn" id="drawerClose">×</button></div><div class="drawer-body"><div class="drawer-tabs">${tabs.map(([id,l])=>`<button class="drawer-tab ${ui.drawerTab===id?'active':''}" data-drawer-tab="${id}">${l}</button>`).join('')}</div>${body}</div><div class="drawer-foot">${canEdit(t)?'<button class="btn" id="editTaskBtn">แก้ไขงาน</button>':''}${actions}</div>`
}
function formatFileSize(bytes){const n=Number(bytes)||0;if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
// AI review gates the in-progress → ready-review submission (see submitForReviewWithAiGate
// below): it compares the latest uploaded file against reference examples via the
// task-board-worker (services/ai-review-service.js). Pass → proceeds to ready-review as normal.
// Fail (including the AI call itself failing) → sent straight to revision with the reason,
// bypassing the normal transition permission check (LocalTaskService.aiReject). The human
// reviewer still makes the real approve/revision call once it reaches Review Queue.
function aiReviewNotice(t){
 if(!AiReview.enabled||!t.aiReview)return '';
 const r=t.aiReview;
 return noticeBox(r.status==='pass'?'success':'warning',r.status==='pass'?'AI ตรวจผ่านก่อนส่งเข้า Ready for Review':'AI ส่งกลับ Revision อัตโนมัติ',`${esc(r.reason)} (ไฟล์: ${esc(r.fileName)} · ${formatDateTime(r.checkedAt)})`);
}
// Runs on the "ready-review" button specifically (see bindDrawer below), not on every upload.
async function submitForReviewWithAiGate(t,button){
 if(!t.files.length){toast('กรุณาอัปโหลดไฟล์ก่อนส่งตรวจ');return}
 if(!AiReview.enabled){
  try{await runAsyncAction(button,()=>AsyncTaskRepository.transition(t.id,'ready-review'),{onConflict:()=>openTask(t.id)})}catch(err){return}
  toast('ส่งตรวจแล้ว');closeDrawer();render({resetScroll:false});
  return;
 }
 const latest=t.files[t.files.length-1];
 button.disabled=true;const prevLabel=button.textContent;button.textContent='AI กำลังตรวจ...';
 try{
  const blob=await BrowserFileStore.get(t.id,latest.id);
  if(!blob)throw new Error('ไม่พบไฟล์ที่อัปโหลดในเบราว์เซอร์นี้ ลองอัปโหลดไฟล์ใหม่อีกครั้ง');
  let verdict;
  try{
   verdict=await AiReview.service.reviewFile(t.category,new File([blob],latest.name));
  }catch(err){
   // Fail closed on an AI-call error (network/worker down), same as task-board-worker does —
   // don't let an infra hiccup silently let an unchecked submission through as "pass".
   verdict={status:'fail',reason:`เรียก AI ตรวจไม่สำเร็จ กรุณาลองส่งตรวจใหม่อีกครั้ง (${err.message})`};
  }
  const checkedAt=new Date().toISOString();
  t.aiReview={status:verdict.status==='pass'?'pass':'fail',reason:verdict.reason||'',fileName:latest.name,checkedAt};
  if(verdict.status==='pass'){
   await AsyncTaskRepository.transition(t.id,'ready-review');
   t.activity.push({at:checkedAt,action:`🤖 AI ตรวจผ่านก่อนส่งตรวจ (${latest.name}): ${verdict.reason}`,by:'AI Review'});
   Store.save();
   toast('AI ตรวจผ่าน — ส่งเข้า Ready for Review แล้ว');
  }else{
   await AsyncTaskRepository.aiReject(t.id,verdict.reason);
   toast('AI พบข้อสังเกต — ส่งกลับไป Revision แล้ว');
  }
  closeDrawer();render({resetScroll:false});
 }catch(err){
  toast(err.message||'ตรวจสอบไม่สำเร็จ กรุณาลองใหม่');
 }finally{
  button.disabled=false;button.textContent=prevLabel;
 }
}
const BrowserFileStore={
 memory:new Map(),
 key(taskId,fileId){return `${taskId}:${fileId}`},
 open(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return resolve(null);const req=indexedDB.open('accounting-task-files',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})},
 async put(taskId,fileId,blob){this.memory.set(this.key(taskId,fileId),blob);try{const db=await this.open();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(blob,this.key(taskId,fileId));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch(e){console.warn('IndexedDB upload fallback to memory',e)}},
 async get(taskId,fileId){const key=this.key(taskId,fileId);if(this.memory.has(key))return this.memory.get(key);try{const db=await this.open();if(!db)return null;return await new Promise((resolve,reject)=>{const req=db.transaction('files','readonly').objectStore('files').get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}catch(e){console.warn('IndexedDB download fallback',e);return null}},
 async remove(taskId,fileId){this.memory.delete(this.key(taskId,fileId));try{const db=await this.open();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(this.key(taskId,fileId));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch(e){console.warn('IndexedDB delete fallback',e)}}
};
function triggerBlobDownload(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function downloadTaskFile(taskId,fileId){
 const {task,file}=TaskService.downloadFile(taskId,fileId);let blob=await BrowserFileStore.get(taskId,fileId),name=file.name;
 if(!blob){const rows=[['Task ID',task.id],['Task',task.title],['Team',task.team],['Category',task.category],['Assignee',task.assignee],['Reviewer',task.reviewer],['Period',task.period],['Due date',task.dueDate],['Status',STATUS[task.status]?.label||task.status]];blob=new Blob([rows.map(r=>r.map(v=>`\"${String(v).replaceAll('\"','\"\"')}\"`).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});name=file.name.replace(/\.[^.]+$/,'')+'-sample.csv'}
 triggerBlobDownload(blob,name);toast(`ดาวน์โหลด ${name} แล้ว`);
}
function bindDrawer(t){
 document.getElementById('drawerClose').onclick=closeDrawer;document.querySelectorAll('[data-drawer-tab]').forEach(b=>b.onclick=()=>openTask(t.id,b.dataset.drawerTab));
 document.querySelectorAll('[data-check-id]').forEach(c=>c.onchange=async()=>{
  const itemId=c.dataset.checkId,item=t.checklist.find(x=>x.id===itemId);
  if(!item||!canEdit(t)){c.checked=item?.checked||false;toast('ไม่มีสิทธิ์แก้ไข Checklist ในสถานะนี้');return}
  const checked=c.checked,drawerBody=document.querySelector('#taskDrawer .drawer-body'),drawerScroll=drawerBody?.scrollTop||0;
  try{
   await runAsyncAction(c,()=>AsyncTaskRepository.updateChecklistItem(t.id,itemId,checked),{onConflict:()=>openTask(t.id,'checklist')});
  }catch(err){c.checked=item.checked;return}
  syncTaskProgress(t);
  openTask(t.id,'checklist');requestAnimationFrame(()=>{const next=document.querySelector('#taskDrawer .drawer-body');if(next)next.scrollTop=drawerScroll});
  toast('บันทึก Checklist และอัปเดตการ์ดแล้ว');
 });
 document.querySelectorAll('[data-transition]').forEach(b=>b.onclick=async()=>{
  const target=b.dataset.transition;
  if(target==='revision'){openRejectModal(t.id);return}
  if(target==='ready-review'){await submitForReviewWithAiGate(t,b);return}
  try{
   await runAsyncAction(b,()=>AsyncTaskRepository.transition(t.id,target),{onConflict:()=>openTask(t.id)});
  }catch(err){return}
  toast(`ย้ายเป็น ${STATUS[target].label}`);closeDrawer();render({resetScroll:false});
 });
 document.getElementById('editTaskBtn')?.addEventListener('click',()=>openTaskModal(t.id));
 document.querySelectorAll('[data-file-download]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{await downloadTaskFile(t.id,button.dataset.fileDownload)}catch(err){toast(err.message)}finally{button.disabled=false}});
 document.querySelectorAll('[data-file-delete]').forEach(button=>button.onclick=async()=>{if(!confirm('ลบไฟล์นี้หรือไม่?'))return;try{const file=TaskService.removeFile(t.id,button.dataset.fileDelete);await BrowserFileStore.remove(t.id,file.id);openTask(t.id,'files');toast('ลบไฟล์แล้ว')}catch(err){toast(err.message)}});
 document.getElementById('drawerFile')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(f.size>10*1024*1024){toast('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');return}const meta={id:uid('F'),name:f.name,type:'Submission',version:t.files.length+1,size:f.size,uploadedAt:new Date().toISOString()};try{await BrowserFileStore.put(t.id,meta.id,f);TaskService.addFile(t.id,meta);openTask(t.id,'files');toast('อัปโหลดไฟล์แล้ว')}catch(err){toast(err.message)}})
}
function openModal(id){
 document.getElementById('modalBackdrop').classList.add('show');
 document.getElementById(id).classList.add('show');
 if(id==='settingsModal')ui.settingsModalOpen=true;
 // When a child modal opens on top of the settings modal, blur the settings modal beneath it.
 else if(document.getElementById('settingsModal').classList.contains('show'))document.documentElement.classList.add('nested-modal-open');
}
function closeModals(){
 const nested=[...document.querySelectorAll('.modal.show:not(#settingsModal)')];
 if(nested.length){
  nested.forEach(m=>m.classList.remove('show'));
  document.documentElement.classList.remove('nested-modal-open');
  if(!document.getElementById('settingsModal').classList.contains('show'))document.getElementById('modalBackdrop').classList.remove('show');
  return;
 }
 document.documentElement.classList.remove('nested-modal-open');
 if(document.getElementById('settingsModal').classList.contains('show')){closeSettingsModal();return}
 document.getElementById('modalBackdrop').classList.remove('show');
 document.querySelectorAll('.modal').forEach(m=>m.classList.remove('show'));
}
function openTaskModal(id=null){
 const t=id?TaskService.get(id):null;if(t&&!canEdit(t)){toast('ไม่มีสิทธิ์แก้ไขงานนี้');return}
 const modal=document.getElementById('taskModal'),availableTeams=t?[...new Set([...creatableTeamCodes(),t.team])]:creatableTeamCodes();
 const requestedTeam=t?.team||(ui.filters.team?.team!=='all'?ui.filters.team?.team:'')||availableTeams[0]||currentUser().team;const team=availableTeams.includes(requestedTeam)?requestedTeam:availableTeams[0];
 const staffLocked=ui.role==='staff',defaultAssignee=staffLocked?currentUser().name:(t?.assignee||membersForTeam(team)[0]);
 modal.innerHTML=`<div class="modal-head"><h2>${t?'แก้ไขงาน':'สร้างงานใหม่'}</h2><button class="close-btn" data-close-modal>×</button></div><form id="taskForm"><div class="modal-body"><div class="form-grid">
 <div class="field full"><label>ชื่องาน</label><input class="control" name="title" required maxlength="180" value="${esc(t?.title||'')}"></div>
 <div class="field"><label>ทีม</label><select class="control" name="team" id="taskTeam" ${staffLocked?'disabled':''}>${optionList(availableTeams,team,code=>`${code} · ${teamMeta(code).name}`)}</select></div>
 <div class="field"><label>ประเภทงาน</label><select class="control" name="category" id="taskCategory">${categoryOptionsHtml(team,t?.category||'')}</select></div>
 <div class="field"><label>ผู้รับผิดชอบ</label><select class="control" name="assignee" id="taskAssignee" ${staffLocked?'disabled':''}>${optionList(staffLocked?[currentUser().name]:membersForTeam(team),defaultAssignee)}</select></div>
 <div class="field"><label>ผู้ตรวจ</label><input class="control" name="reviewer" value="${esc(t?.reviewer||teamMeta(team).lead)}" ${staffLocked?'readonly':''}></div>
 <div class="field"><label>งวดบัญชี</label><input class="control" type="month" name="period" value="${t?.period||currentPeriod()}" required></div>
 <div class="field"><label>กำหนดส่ง</label><input class="control" type="date" name="dueDate" required value="${t?.dueDate||defaultDueDate()}"></div>
 <div class="field"><label>ความสำคัญ</label><select class="control" name="priority">${optionList(['low','normal','high','critical'],t?.priority||'normal')}</select></div>
 <div class="field"><label>การมองเห็น</label><select class="control" name="restricted" ${staffLocked?'disabled':''}><option value="false" ${!t?.restricted?'selected':''}>ภายในทีม/ทุกทีมตามสิทธิ์</option><option value="true" ${t?.restricted?'selected':''}>Restricted</option></select></div>
 </div></div><div class="modal-foot"><button type="button" class="btn" data-close-modal>ยกเลิก</button><button class="btn primary" type="submit">${t?'บันทึก':'สร้างงาน'}</button></div></form>`;
 modal.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModals);
 const teamSelect=modal.querySelector('#taskTeam');if(teamSelect)teamSelect.onchange=e=>{const tm=e.target.value;modal.querySelector('#taskCategory').innerHTML=categoryOptionsHtml(tm);modal.querySelector('#taskAssignee').innerHTML=optionList(membersForTeam(tm),membersForTeam(tm)[0]);modal.querySelector('[name=reviewer]').value=teamMeta(tm).lead;queueCustomSelectRefresh()};
 modal.querySelector('#taskForm').onsubmit=async e=>{
  e.preventDefault();const submitBtn=modal.querySelector('button[type=submit]');
  const d=Object.fromEntries(new FormData(e.target));d.team=staffLocked?(t?.team||currentUser().team):(d.team||team);d.assignee=staffLocked?(t?.assignee||currentUser().name):(d.assignee||defaultAssignee);d.reviewer=d.reviewer||t?.reviewer||teamMeta(d.team).lead;d.restricted=staffLocked?Boolean(t?.restricted):d.restricted==='true';
  try{
   if(t)await runAsyncAction(submitBtn,()=>AsyncTaskRepository.update(t.id,d),{onConflict:()=>openTaskModal(t.id)});
   else await runAsyncAction(submitBtn,()=>AsyncTaskRepository.create({...d,checklist:['ตรวจสอบเอกสารต้นทาง','แนบ Working file','Self-review'].map((x,i)=>({id:`C${i+1}`,label:x,required:true,checked:false}))}));
  }catch(err){return}
  closeModals();closeDrawer();render();toast(t?'บันทึกงานแล้ว':'สร้างงานแล้ว')
 };
 openModal('taskModal');queueCustomSelectRefresh();
}
function openRejectModal(id){const modal=document.getElementById('rejectModal');modal.innerHTML=`<div class="modal-head"><h2>ตีกลับงาน</h2><button class="close-btn" data-close-modal>×</button></div><form id="rejectForm"><div class="modal-body"><div class="field"><label>เหตุผลที่ต้องแก้ไข</label><textarea class="control" name="reason" required placeholder="ระบุสิ่งที่พนักงานต้องแก้ไข"></textarea></div></div><div class="modal-foot"><button type="button" class="btn" data-close-modal>ยกเลิก</button><button class="btn danger">ยืนยันตีกลับ</button></div></form>`;modal.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModals);modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const submitBtn=modal.querySelector('button.danger');const reason=new FormData(e.target).get('reason');try{await runAsyncAction(submitBtn,()=>AsyncTaskRepository.transition(id,'revision',{reason}))}catch(err){return}closeModals();closeDrawer();render({resetScroll:false});toast('ตีกลับงานแล้ว')};openModal('rejectModal')}
// ---------------- Dashboard ----------------
