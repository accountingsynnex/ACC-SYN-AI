// Client-side permission helpers, workflow rules and the local task repository

function canView(t){const u=currentUser();if(!t.restricted)return true;if(ui.role==='manager')return true;if(ui.role==='teamlead'&&t.team===u.team)return true;return t.assignee===u.name||t.reviewer===u.name}
function canEdit(t){
 const u=currentUser();
 if(ui.role==='manager')return true;
 if(ui.role==='teamlead'&&t.team===u.team)return true;
 return t.assignee===u.name&&['assigned','in-progress','revision'].includes(t.status);
}
function canReview(t){const u=currentUser();return ui.role==='manager'||(ui.role==='teamlead'&&t.team===u.team)||t.reviewer===u.name}
function canRecallReadyReview(t){
 const u=currentUser();
 return t.status==='ready-review'&&(ui.role==='manager'||(ui.role==='teamlead'&&t.team===u.team)||t.assignee===u.name);
}
function canDownloadFile(t){const u=currentUser();return ui.role==='manager'||t.team===u.team}
function canManageAnnualTasks(){return ['reviewer','teamlead','manager'].includes(ui.role)}
function creatableTeamCodes(){const codes=activeTeamCodes();if(ui.role==='manager')return codes;return codes.includes(currentUser().team)?[currentUser().team]:codes.slice(0,1)}
function canCreateTaskPayload(payload){
 const u=currentUser();
 if(ui.role==='manager')return true;
 if(!payload||payload.team!==u.team)return false;
 if(ui.role==='staff'&&payload.assignee!==u.name)return false;
 return true;
}
function visibleTasks(){return state.tasks.filter(canView)}
function requiredComplete(t){return t.checklist.filter(x=>x.required).every(x=>x.checked)}
function allowedTargets(t){
 const own=canEdit(t),review=canReview(t),recall=canRecallReadyReview(t);const a=[];
 if(t.status==='assigned'&&own)a.push('in-progress');
 if(t.status==='in-progress'&&own&&requiredComplete(t))a.push('ready-review');
 if(t.status==='revision'&&own){a.push('in-progress');if(requiredComplete(t))a.push('ready-review')}
 if(t.status==='ready-review'&&recall)a.push('in-progress');
 if(t.status==='ready-review'&&review)a.push('under-review');
 if(t.status==='under-review'&&review)a.push('approved','revision');
 return [...new Set(a)];
}
const TASK_EDIT_FIELDS=['title','team','category','assignee','reviewer','period','dueDate','priority','restricted'];
const LocalTaskService={
 list(filters={}){return visibleTasks().filter(t=>matchTask(t,filters))},
 get(id){return state.tasks.find(t=>t.id===id)},
 update(id,patch,actor=currentUser().name){
  const t=this.get(id);if(!t)throw new Error('ไม่พบงาน');if(!canEdit(t))throw new Error('ไม่มีสิทธิ์แก้ไขงานนี้');
  const next={...t};
  TASK_EDIT_FIELDS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(patch,k))next[k]=patch[k]});
  if(!next.title?.trim())throw new Error('กรุณาระบุชื่องาน');
  if(!masterTeamByCode(next.team))throw new Error('ทีมที่เลือกไม่ถูกต้อง');
  if(!categoriesForTeam(next.team,true).includes(next.category))throw new Error('ประเภทงานไม่สัมพันธ์กับทีม');
  if(ui.role==='staff'&&(next.team!==currentUser().team||next.assignee!==currentUser().name))throw new Error('Staff แก้ไขได้เฉพาะงานของตนเองในทีมเดียวกัน');
  Object.assign(t,next,{title:next.title.trim(),updatedAt:new Date().toISOString()});
  t.activity.push({at:t.updatedAt,action:'แก้ไขข้อมูลงาน',by:actor});Store.save();return t;
 },
 create(payload){
  const clean={...payload,title:String(payload?.title||'').trim()};
  if(!clean.title)throw new Error('กรุณาระบุชื่องาน');
  if(!canCreateTaskPayload(clean))throw new Error('ไม่มีสิทธิ์สร้างงานให้ทีมหรือผู้รับผิดชอบที่เลือก');
  if(!masterTeamByCode(clean.team))throw new Error('ทีมที่เลือกไม่ถูกต้อง');
  if(!categoriesForTeam(clean.team,true).includes(clean.category))throw new Error('ประเภทงานไม่สัมพันธ์กับทีม');
  const t={id:uid(),status:'assigned',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),submittedAt:null,restricted:false,checklist:[],files:[],activity:[{at:new Date().toISOString(),action:'สร้างและมอบหมายงาน',by:currentUser().name}],...clean};
  t.checklist=Array.isArray(clean.checklist)?clean.checklist:[];state.tasks.unshift(t);Store.save();return t;
 },
 downloadFile(id,fileId){const t=this.get(id);if(!t)throw new Error('ไม่พบงาน');if(!canDownloadFile(t))throw new Error('ดาวน์โหลดได้เฉพาะไฟล์ของงานในทีมเดียวกัน');const file=t.files.find(x=>x.id===fileId);if(!file)throw new Error('ไม่พบไฟล์');return {task:t,file}},
 addFile(id,file){const t=this.get(id);if(!t)throw new Error('ไม่พบงาน');if(!canEdit(t))throw new Error('ไม่มีสิทธิ์อัปโหลดไฟล์');t.files.push(file);t.updatedAt=new Date().toISOString();t.activity.push({at:t.updatedAt,action:`อัปโหลดไฟล์ ${file.name}`,by:currentUser().name});Store.save();return file},
 removeFile(id,fileId){const t=this.get(id);if(!t)throw new Error('ไม่พบงาน');if(!canEdit(t))throw new Error('ไม่มีสิทธิ์ลบไฟล์');const file=t.files.find(x=>x.id===fileId);if(!file)throw new Error('ไม่พบไฟล์');t.files=t.files.filter(x=>x.id!==fileId);t.updatedAt=new Date().toISOString();t.activity.push({at:t.updatedAt,action:`ลบไฟล์ ${file.name}`,by:currentUser().name});Store.save();return file},
 transition(id,target,note=''){const t=this.get(id);if(!t||!allowedTargets(t).includes(target))throw new Error('ไม่มีสิทธิ์หรือไม่เป็นไปตาม Workflow');if(target==='ready-review'&&!requiredComplete(t))throw new Error('Checklist บังคับยังไม่ครบ');const previous=t.status;t.status=target;t.updatedAt=new Date().toISOString();if(target==='ready-review')t.submittedAt=t.updatedAt;if(previous==='ready-review'&&target==='in-progress')t.submittedAt=null;const action=previous==='ready-review'&&target==='in-progress'?'ถอนงานจาก Ready for Review กลับไปทำต่อ (In Progress)':`เปลี่ยนสถานะเป็น ${STATUS[target].label}`;t.activity.push({at:t.updatedAt,action:`${action}${note?` — ${note}`:''}`,by:currentUser().name});Store.save();return t}
};

// Repository boundary used by the UI. Replace with an API-backed adapter during integration.
const TaskService = LocalTaskService;

// Async wrapper over the repository boundary. The synchronous UI keeps calling TaskService
// directly; views that have been migrated to loading/error states call through this instead.
// During integration, point `repo` at an ApiTaskService instance (see services/api-task-service.js)
// and the awaiting views keep working unchanged — only the local ones still need migrating.
const AsyncTaskRepository = {
  repo: TaskService,
  async list(filters = {}) { return this.repo.list(filters); },
  async get(id) { return this.repo.get(id); },
  async transition(id, target, note = '') { return this.repo.transition(id, target, note); }
};

function matchTask(t,f){
 if(f.search){const q=String(f.search).trim().toLowerCase();if(q&&![t.id,t.title,t.assignee,t.reviewer,t.category,t.team,t.period,t.dueDate].join(' ').toLowerCase().includes(q))return false}
 if(f.team&&f.team!=='all'&&t.team!==f.team)return false;if(f.period&&f.period!=='all'&&t.period!==f.period)return false;
 if(f.assignee&&f.assignee!=='all'&&t.assignee!==f.assignee)return false;if(f.reviewer&&f.reviewer!=='all'&&t.reviewer!==f.reviewer)return false;
 if(f.category&&f.category!=='all'&&t.category!==f.category)return false;if(f.priority&&f.priority!=='all'&&t.priority!==f.priority)return false;
 if(f.status&&f.status!=='all'){
  if(f.status==='open'&&t.status==='approved')return false;
  else if(f.status==='review'&&!['ready-review','under-review'].includes(t.status))return false;
  else if(f.status==='overdue'&&!isOverdue(t))return false;
  else if(!['open','review','overdue'].includes(f.status)&&t.status!==f.status)return false;
 }
 return true;
}
