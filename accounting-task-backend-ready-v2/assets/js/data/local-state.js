// Demo data generation, local persistence, master-data synchronization and notifications

function generateTasks(){
 const tasks=[];let idx=1;const teams=Object.keys(TEAM_INFO);
 for(let i=0;i<126;i++){
  const team=teams[i%teams.length], members=TEAM_MEMBERS[team], cat=CATEGORY[team][i%CATEGORY[team].length];
  const status=STATUS_ORDER[Math.floor(seeded(i*7+3)*STATUS_ORDER.length)];
  const due=addDays(new Date('2026-07-01'),Math.floor(seeded(i*13+5)*37));
  const assignee=members[i%members.length], reviewer=TEAM_INFO[team].lead;
  const checks=['ตรวจสอบยอดกับเอกสารต้นทาง','แนบ Working file','ตรวจสอบ Control total','Self-review ความครบถ้วน'].map((x,j)=>({id:`C${j+1}`,label:x,required:j<3,checked:status==='assigned'?false:seeded(i*17+j)>.28}));
  tasks.push({id:`TASK-${String(idx++).padStart(5,'0')}`,title:`${cat} — ${['Main','Monthly','Control','Review'][i%4]} ${String((i%12)+1).padStart(2,'0')}`,team,category:cat,assignee,reviewer,status,priority:PRIORITIES[i%PRIORITIES.length],period:'2026-07',dueDate:dateISO(due),createdAt:'2026-07-01T09:00:00',updatedAt:addDays(new Date('2026-07-01T09:00:00'),i%13).toISOString(),submittedAt:['ready-review','under-review','revision','approved'].includes(status)?addDays(new Date('2026-07-08T10:00:00'),-(i%5)).toISOString():null,restricted:i%19===0,checklist:checks,files:i%3===0?[{id:'F1',name:`${cat.replaceAll(' ','_')}.xlsx`,type:'Submission',version:1}]:[],activity:[{at:'2026-07-01T09:00:00',action:'สร้างและมอบหมายงาน',by:'System'},{at:addDays(new Date('2026-07-01T09:00:00'),i%7).toISOString(),action:`เปลี่ยนสถานะเป็น ${STATUS[status].label}`,by:assignee}]});
 }
 // Ensure current staff has a healthy mix of tasks
 tasks.slice(0,10).forEach((t,i)=>{t.team='GL';t.assignee='กัญญา นาคดี';t.reviewer='วีระ อภิชัย';t.status=STATUS_ORDER[i%STATUS_ORDER.length];t.priority=i<2?'critical':i<5?'high':'normal';t.category=CATEGORY.GL[i%CATEGORY.GL.length]});
 return tasks;
}

function generateMasterData(){
 return {
  teams:Object.entries(TEAM_INFO).map(([code,x])=>({id:`TEAM-${code}`,code,name:x.name,description:`ทีม ${x.name}`,lead:x.lead,color:x.color,active:true,updatedAt:'2026-07-12'})),
  categories:Object.entries(CATEGORY).flatMap(([team,items])=>items.map((name,i)=>({id:`CAT-${team}-${i+1}`,code:`${team.toUpperCase()}-${String(i+1).padStart(2,'0')}`,name,description:`ประเภทงาน ${name}`,team:`TEAM-${team}`,active:true,updatedAt:'2026-07-09'})))
 };
}

function generateTemplates(){return Object.keys(TEAM_INFO).flatMap((team,ti)=>CATEGORY[team].slice(0,2).map((cat,ci)=>({id:`TPL-${team}-${ci+1}`,name:`Monthly ${cat}`,team,category:cat,frequency:'monthly',active:true,defaultAssignee:TEAM_MEMBERS[team][ci],defaultReviewer:TEAM_INFO[team].lead,priority:ci?'normal':'high',openRule:'วันที่ 25 ของเดือน',dueRule:'วันที่ 5 ของเดือนถัดไป',checklist:['ตรวจสอบเอกสารต้นทาง','จัดทำ Working file','ตรวจสอบยอดรวม','Self-review'],requiredFiles:['Working file','Supporting document']})))}
const Store={
 load(){try{return JSON.parse(localStorage.getItem('acct-unified-data'))}catch(e){console.warn('Unable to load saved data',e);return null}},
 save(){
  try{
   localStorage.setItem('acct-unified-data',JSON.stringify({tasks:state.tasks,templates:state.templates,notifications:state.notifications,masterData:state.masterData}));
   return true;
  }catch(e){
   console.error('Unable to persist data',e);
   return false;
  }
 }
};
const saved=Store.load();
const defaultMasterData=generateMasterData();
const savedMasterData=saved?.masterData||{};
const state={
 tasks:saved?.tasks||generateTasks(),
 templates:saved?.templates||generateTemplates(),
 notifications:saved?.notifications||[],
 masterData:{
  teams:Array.isArray(savedMasterData.teams)?savedMasterData.teams:defaultMasterData.teams,
  categories:Array.isArray(savedMasterData.categories)?savedMasterData.categories:defaultMasterData.categories
 }
};
const hadLegacyComplete=state.tasks.some(t=>t.status==='complete');
state.tasks=state.tasks.map((t,index)=>({
 ...t,
 id:t.id||`TASK-LEGACY-${String(index+1).padStart(4,'0')}`,
 status:t.status==='complete'?'approved':STATUS[t.status]?t.status:'assigned',
 checklist:Array.isArray(t.checklist)?t.checklist.map((c,i)=>({id:c.id||`C${i+1}`,label:c.label||`Checklist ${i+1}`,required:c.required!==false,checked:Boolean(c.checked)})):[],
 files:Array.isArray(t.files)?t.files:[],
 activity:Array.isArray(t.activity)?t.activity.map(a=>({...a,action:typeof a.action==='string'?a.action.replace(/Complete/g,'Approved'):a.action})):[],
 updatedAt:t.updatedAt||new Date().toISOString()
}));
state.templates=state.templates.map((t,index)=>({
 ...t,
 id:t.id||`TPL-LEGACY-${index+1}`,
 name:t.name||`Annual Task ${index+1}`,
 frequency:['monthly','quarterly','yearly','manual'].includes(t.frequency)?t.frequency:'monthly',
 active:t.active!==false,
 checklist:Array.isArray(t.checklist)?t.checklist.filter(Boolean):[],
 requiredFiles:Array.isArray(t.requiredFiles)?t.requiredFiles.filter(Boolean):[],
 updatedAt:t.updatedAt||dateISO(TODAY)
}));
state.notifications=Array.isArray(state.notifications)?state.notifications:[];
state.tasks.forEach(t=>{t.files=t.files.map((f,i)=>({...f,id:f.id||`F${i+1}`,version:Number(f.version)||i+1,size:Number(f.size)||0,uploadedAt:f.uploadedAt||t.updatedAt}))});
if(hadLegacyComplete)Store.save();
function masterTeamByCode(code){return state.masterData.teams.find(x=>x.code===code)}
function activeTeamCodes(){return state.masterData.teams.filter(x=>x.active).map(x=>x.code)}
function teamMeta(code){const row=masterTeamByCode(code);return row?{name:row.name,lead:row.lead||'',color:row.color||'#0A84FF'}:(TEAM_INFO[code]||{name:code||'ไม่ระบุทีม',lead:'',color:'#8E8E93'})}
function categoriesForTeam(code,includeInactive=false){const team=masterTeamByCode(code);if(!team)return [];return state.masterData.categories.filter(x=>x.team===team.id&&(includeInactive||x.active)).map(x=>x.name)}
function activeCategoryNames(){const activeIds=new Set(state.masterData.teams.filter(x=>x.active).map(x=>x.id));return [...new Set(state.masterData.categories.filter(x=>x.active&&activeIds.has(x.team)).map(x=>x.name))]}
function membersForTeam(code){const meta=teamMeta(code);const base=TEAM_MEMBERS[code]||[];return [...new Set([...base,meta.lead].filter(Boolean))].length?[...new Set([...base,meta.lead].filter(Boolean))]:[currentUser().name]}
function categoryOptionsHtml(code,current=''){const values=categoriesForTeam(code);if(current&&!values.includes(current))values.unshift(current);return values.length?optionList(values,current||values[0]):'<option value="">กรุณาเพิ่มประเภทงานก่อน</option>'}
function syncRuntimeFromMaster(){
 state.masterData.teams.forEach(row=>{TEAM_INFO[row.code]={name:row.name,lead:row.lead||'',color:row.color||'#0A84FF'};if(!TEAM_MEMBERS[row.code]||!TEAM_MEMBERS[row.code].length)TEAM_MEMBERS[row.code]=[row.lead||currentUser().name]});
 state.masterData.teams.forEach(row=>{CATEGORY[row.code]=categoriesForTeam(row.code)});
}
syncRuntimeFromMaster();
function notificationOwnerKey(){return `${ui.role}:${currentUser().name}`}
function syncNotifications(){
 const owner=notificationOwnerKey();
 const existing=new Map(state.notifications.filter(n=>n.owner===owner).map(n=>[n.key,n]));
 const scope=visibleTasks().filter(t=>t.assignee===currentUser().name||canReview(t));
 const candidates=[
  ...scope.filter(isOverdue).map(t=>({key:`overdue:${t.id}`,title:'งานเลยกำหนด',text:t.title,taskId:t.id})),
  ...scope.filter(t=>t.status==='revision'&&t.assignee===currentUser().name).map(t=>({key:`revision:${t.id}`,title:'งานถูกตีกลับ',text:t.title,taskId:t.id})),
  ...scope.filter(t=>t.status==='ready-review'&&canReview(t)).map(t=>({key:`review:${t.id}`,title:'มีงานรอตรวจ',text:t.title,taskId:t.id}))
 ];
 const generated=candidates.slice(0,20).map(c=>({id:existing.get(c.key)?.id||uid('N'),owner,key:c.key,title:c.title,text:c.text,taskId:c.taskId,unread:existing.get(c.key)?.unread!==false}));
 state.notifications=[...state.notifications.filter(n=>n.owner&&n.owner!==owner),...generated];
 return generated;
}
function currentNotifications(){return syncNotifications()}
