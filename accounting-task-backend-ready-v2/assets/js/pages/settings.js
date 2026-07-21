// Appearance, annual tasks, team/category management and settings dialogs

function appearancePreview(mode){
 const resolved=mode==='system'?'split':mode;
 return `<div class="appearance-preview preview-${resolved}" aria-hidden="true"><div class="appearance-preview-sidebar"></div><div class="appearance-preview-main"><div class="appearance-preview-top"></div><div class="appearance-preview-cards"><i></i><i></i><i></i></div><div class="appearance-preview-table"><b></b><span></span><span></span><span></span></div></div></div>`;
}
function renderAppearance(root){
 const resolved=resolvedTheme();
 root.innerHTML=`<div class="settings-section-head appearance-section-head"><div><div class="eyebrow">APPEARANCE</div><h2>Appearance</h2><p>เลือกโหมดการแสดงผลของ Accounting Task ค่าที่เลือกจะถูกจำไว้ในอุปกรณ์นี้</p></div></div><div class="appearance-grid" role="radiogroup" aria-label="เลือกธีม"><button class="appearance-option ${ui.themeMode==='light'?'selected':''}" data-theme-choice="light" role="radio" aria-checked="${ui.themeMode==='light'}">${appearancePreview('light')}<span class="appearance-option-copy"><strong>Light</strong><small>${THEME_MODES.light.description}</small></span><i class="appearance-check">✓</i></button><button class="appearance-option ${ui.themeMode==='dark'?'selected':''}" data-theme-choice="dark" role="radio" aria-checked="${ui.themeMode==='dark'}">${appearancePreview('dark')}<span class="appearance-option-copy"><strong>Dark</strong><small>${THEME_MODES.dark.description}</small></span><i class="appearance-check">✓</i></button><button class="appearance-option ${ui.themeMode==='system'?'selected':''}" data-theme-choice="system" role="radio" aria-checked="${ui.themeMode==='system'}">${appearancePreview('system')}<span class="appearance-option-copy"><strong>System</strong><small>${THEME_MODES.system.description}</small></span><i class="appearance-check">✓</i></button></div><div class="appearance-status"><span class="appearance-status-icon">${resolved==='dark'?'☾':'☀'}</span><div><strong>กำลังแสดงผลแบบ ${resolved==='dark'?'Dark':'Light'}</strong><p>${ui.themeMode==='system'?'ระบบจะปรับอัตโนมัติเมื่อธีมของอุปกรณ์เปลี่ยน':'สามารถเปลี่ยนโหมดได้ทันทีโดยไม่กระทบข้อมูลงาน'}</p></div></div>`;
 root.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>{
  applyTheme(button.dataset.themeChoice);
  toast(`เปลี่ยนเป็น ${THEME_MODES[ui.themeMode].label} mode แล้ว`);
  renderSettingsModal();
 });
}
function renderSettingsModal(){
 if(!['appearance','task-team','annual-task'].includes(ui.settingsTab))ui.settingsTab='appearance';
 const modal=document.getElementById('settingsModal');
 const managementCount=state.masterData.teams.length+state.masterData.categories.length;
 const annualCount=state.templates.length;
 modal.innerHTML=`<div class="settings-modal-head"><div class="settings-modal-title"><h2>Setting</h2><p>ปรับการแสดงผล จัดการข้อมูลระบบ และงานประจำปี</p></div><button class="close-btn" data-close-settings aria-label="ปิด Setting">×</button></div><div class="settings-modal-body"><aside class="settings-modal-sidebar"><div class="settings-modal-sidebar-label">Preferences</div><button class="settings-modal-nav ${ui.settingsTab==='appearance'?'active':''}" data-settings-modal-tab="appearance"><span class="settings-modal-nav-icon">${iconSvg('appearance')}</span><span class="settings-modal-nav-copy"><strong>Appearance</strong><small>${THEME_MODES[ui.themeMode].label} · ${resolvedTheme()==='dark'?'Dark':'Light'}</small></span></button><div class="settings-modal-sidebar-label settings-data-label">Configuration</div><button class="settings-modal-nav ${ui.settingsTab==='task-team'?'active':''}" data-settings-modal-tab="task-team"><span class="settings-modal-nav-icon">${iconSvg('settings')}</span><span class="settings-modal-nav-copy"><strong>Management</strong><small>ทีมและประเภทงาน · ${managementCount}</small></span></button><button class="settings-modal-nav ${ui.settingsTab==='annual-task'?'active':''}" data-settings-modal-tab="annual-task"><span class="settings-modal-nav-icon">${iconSvg('template')}</span><span class="settings-modal-nav-copy"><strong>Annual Task</strong><small>งานประจำปี · ${annualCount}</small></span></button></aside><section class="settings-modal-content" id="settingsModalContent"></section></div>`;
 modal.querySelector('[data-close-settings]').onclick=closeSettingsModal;
 modal.querySelectorAll('[data-settings-modal-tab]').forEach(button=>button.onclick=()=>{
  ui.settingsTab=button.dataset.settingsModalTab;
  localStorage.setItem('acct-settings-tab',ui.settingsTab);
  renderSettingsModal();
 });
 const content=modal.querySelector('#settingsModalContent');
 if(ui.settingsTab==='appearance')renderAppearance(content);
 else if(ui.settingsTab==='task-team')renderMasterData(content,true);
 else renderTemplates(content,true);
 ui.settingsModalOpen=true;
 openModal('settingsModal');
 lastNavSignature='';renderShell();
 queueCustomSelectRefresh();
}
function closeSettingsModal(){
 const modal=document.getElementById('settingsModal');
 modal.classList.remove('show');
 ui.settingsModalOpen=false;
 document.documentElement.classList.remove('nested-modal-open');
 if(/#(?:settings|templates|master-data)/.test(location.hash))history.replaceState(null,'','#dashboard');
 if(!document.querySelector('.modal.show'))document.getElementById('modalBackdrop').classList.remove('show');
 lastNavSignature='';renderShell();
}

// ---------------- Templates ----------------
function renderTemplates(root,embedded=false){
 const f=ui.filters.templates;ui.templateView='table';
 const templates=state.templates.filter(t=>(!f.search||[t.id,t.name,t.team,t.category].join(' ').toLowerCase().includes(f.search.toLowerCase()))&&(f.team==='all'||t.team===f.team)&&(f.category==='all'||t.category===f.category)&&(f.frequency==='all'||t.frequency===f.frequency)&&(f.active==='all'||String(t.active)===f.active));
 const actions=canManageAnnualTasks()?`<div class="head-actions"><button class="btn primary" id="newTemplate">+ เพิ่ม Annual Task</button></div>`:'';
 const header=embedded?`<div class="settings-section-head"><div><div class="eyebrow">ANNUAL TASK</div><h2>Annual Task</h2><p>กำหนดงานประจำตลอดปี พร้อม Checklist ผู้รับผิดชอบ ผู้ตรวจ และกติกากำหนดส่ง</p></div>${actions}</div>`:`<div class="page-head"><div><div class="eyebrow">ANNUAL TASK</div><h1>Annual Task</h1><p>กำหนดงานประจำตลอดปี พร้อม Checklist ผู้รับผิดชอบ ผู้ตรวจ และกติกากำหนดส่ง</p></div>${actions}</div>`;
 root.innerHTML=`${header}${!canManageAnnualTasks()?noticeBox('neutral','สิทธิ์แบบอ่านอย่างเดียว','Staff ไม่สามารถสร้าง แก้ไข ลบ หรือสร้างงานจาก Annual Task ได้'):''}<div class="filter-panel wide">${searchControl('tplSearch',f.search,'ชื่อ Annual Task หรือรหัส')}${filterControl('ทีม','tplTeam',f.team,['all',...activeTeamCodes()])}${filterControl('ประเภทงาน','tplCategory',f.category,['all',...activeCategoryNames()])}${filterControl('รอบ','tplFrequency',f.frequency,['all','monthly','quarterly','yearly','manual'])}${filterControl('สถานะ','tplActive',f.active,['all','true','false'])}</div><div class="template-table-only">${templateTable(templates)}</div>`;
 ['Search','Team','Category','Frequency','Active'].forEach(k=>bindFilter(`tpl${k}`,'templates',k.toLowerCase(),k==='Search'?'input':'change'));
 root.querySelectorAll('[data-generate-template]').forEach(b=>b.onclick=()=>openGenerateTemplate(b.dataset.generateTemplate));
 root.querySelectorAll('[data-edit-template]').forEach(b=>b.onclick=()=>openTemplateEditor(b.dataset.editTemplate));
 root.querySelectorAll('[data-toggle-template]').forEach(b=>b.onclick=()=>toggleTemplate(b.dataset.toggleTemplate));
 root.querySelectorAll('[data-delete-template]').forEach(b=>b.onclick=()=>deleteTemplate(b.dataset.deleteTemplate));
 document.getElementById('newTemplate')?.addEventListener('click',()=>openTemplateEditor());
}
function templateTable(arr){return `<article class="panel"><div class="panel-body"><div class="table-wrap"><table class="standard-table"><thead><tr><th>Annual Task</th><th>ทีม</th><th>รอบ</th><th>ผู้รับผิดชอบ</th><th>ผู้ตรวจ</th><th>Checklist</th><th>กติกากำหนดส่ง</th><th>สถานะ</th><th>การดำเนินการ</th></tr></thead><tbody>${arr.map(t=>`<tr><td><div class="task-identity"><strong>${esc(t.name)}</strong><div class="task-meta-row"><span class="task-id">${esc(t.id)}</span>${categoryChip(t.category)}</div></div></td><td>${teamChip(t.team)}</td><td><span class="ui-chip period-chip">${esc(t.frequency)}</span></td><td>${personValue(t.defaultAssignee)}</td><td>${personValue(t.defaultReviewer)}</td><td><span class="checklist-count">${t.checklist.length} รายการ</span></td><td>${esc(t.dueRule)}</td><td>${activityBadge(t.active)}</td><td><div class="template-action-cell">${canManageAnnualTasks()?`<button class="btn small primary" data-generate-template="${t.id}" ${!t.active?'disabled':''}>สร้างงาน</button><button class="btn small" data-edit-template="${t.id}">แก้ไข</button><button class="btn small" data-toggle-template="${t.id}">${t.active?'ปิดใช้งาน':'เปิดใช้งาน'}</button><button class="btn small danger" data-delete-template="${t.id}">ลบ</button>`:'<span class="standard-state-text">ดูอย่างเดียว</span>'}</div></td></tr>`).join('')||'<tr><td colspan="9"><div class="empty"><strong>ไม่พบ Annual Task</strong>ลองเปลี่ยนตัวกรอง</div></td></tr>'}</tbody></table></div></div></article>`}
function templateLines(value){return String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
function openTemplateEditor(id=null){
 if(!canManageAnnualTasks()){toast('ไม่มีสิทธิ์จัดการ Annual Task');return}const row=id?state.templates.find(x=>x.id===id):null,modal=document.getElementById('templateModal'),teams=creatableTeamCodes(),team=row?.team||teams[0],members=membersForTeam(team);
 modal.innerHTML=`<div class="modal-head"><div><h2>${row?'แก้ไข':'เพิ่ม'} Annual Task</h2><span class="subtext">กำหนด Template สำหรับสร้างงานซ้ำอย่างเป็นมาตรฐาน</span></div><button class="close-btn" data-close-modal>×</button></div><form id="templateEditorForm"><div class="modal-body"><div class="form-grid">
 <div class="field full"><label>ชื่อ Annual Task</label><input class="control" name="name" required maxlength="150" value="${esc(row?.name||'')}"></div>
 <div class="field"><label>ทีม</label><select class="control" name="team" id="templateTeam">${optionList([...new Set([...teams,...(row?.team?[row.team]:[])])],team,code=>`${code} · ${teamMeta(code).name}`)}</select></div>
 <div class="field"><label>ประเภทงาน</label><select class="control" name="category" id="templateCategory">${categoryOptionsHtml(team,row?.category||'')}</select></div>
 <div class="field"><label>รอบ</label><select class="control" name="frequency">${optionList(['monthly','quarterly','yearly','manual'],row?.frequency||'monthly')}</select></div>
 <div class="field"><label>ความสำคัญ</label><select class="control" name="priority">${optionList(['low','normal','high','critical'],row?.priority||'normal')}</select></div>
 <div class="field"><label>ผู้รับผิดชอบ</label><select class="control" name="defaultAssignee" id="templateAssignee">${optionList(members,row?.defaultAssignee||members[0])}</select></div>
 <div class="field"><label>ผู้ตรวจ</label><input class="control" name="defaultReviewer" value="${esc(row?.defaultReviewer||teamMeta(team).lead)}" required></div>
 <div class="field"><label>กติกาเปิดงาน</label><input class="control" name="openRule" value="${esc(row?.openRule||'วันที่ 25 ของเดือนก่อน')}"></div>
 <div class="field"><label>กติกากำหนดส่ง</label><input class="control" name="dueRule" value="${esc(row?.dueRule||'วันที่ 5 ของเดือนถัดไป')}"></div>
 <div class="field full"><label>Checklist · หนึ่งรายการต่อหนึ่งบรรทัด</label><textarea class="control" name="checklist" rows="5" required>${esc((row?.checklist||['ตรวจสอบเอกสารต้นทาง','จัดทำ Working file','Self-review']).join('\n'))}</textarea></div>
 <div class="field full"><label>ไฟล์ที่ต้องแนบ · หนึ่งรายการต่อหนึ่งบรรทัด</label><textarea class="control" name="requiredFiles" rows="3">${esc((row?.requiredFiles||['Working file']).join('\n'))}</textarea></div>
 </div></div><div class="modal-foot"><button type="button" class="btn" data-close-modal>ยกเลิก</button><button class="btn primary">บันทึก</button></div></form>`;
 modal.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModals);modal.querySelector('#templateTeam').onchange=e=>{const tm=e.target.value;modal.querySelector('#templateCategory').innerHTML=categoryOptionsHtml(tm);modal.querySelector('#templateAssignee').innerHTML=optionList(membersForTeam(tm),membersForTeam(tm)[0]);modal.querySelector('[name=defaultReviewer]').value=teamMeta(tm).lead;queueCustomSelectRefresh()};
 modal.querySelector('form').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.name=d.name.trim();d.active=row?row.active!==false:true;d.checklist=templateLines(d.checklist);d.requiredFiles=templateLines(d.requiredFiles);if(!d.checklist.length){toast('กรุณาระบุ Checklist อย่างน้อย 1 รายการ');return}if(state.templates.some(x=>x.name.toLowerCase()===d.name.toLowerCase()&&x.id!==row?.id)){toast('ชื่อ Annual Task นี้มีอยู่แล้ว');return}if(row)Object.assign(row,d,{updatedAt:dateISO(TODAY)});else state.templates.unshift({id:uid('TPL'),...d,updatedAt:dateISO(TODAY)});Store.save();closeModals();renderSettingsModal();toast('บันทึก Annual Task แล้ว')};openModal('templateModal');queueCustomSelectRefresh();
}
function toggleTemplate(id){if(!canManageAnnualTasks())return;const t=state.templates.find(x=>x.id===id);if(!t)return;t.active=!t.active;t.updatedAt=dateISO(TODAY);Store.save();renderSettingsModal();toast(`${t.active?'เปิด':'ปิด'}ใช้งาน Annual Task แล้ว`)}
function deleteTemplate(id){if(!canManageAnnualTasks())return;const t=state.templates.find(x=>x.id===id);if(!t||!confirm(`ลบ Annual Task “${t.name}” หรือไม่?`))return;state.templates=state.templates.filter(x=>x.id!==id);Store.save();renderSettingsModal();toast('ลบ Annual Task แล้ว')}
function templateRuleDate(period,rule,fallbackDay=5){const [y,m]=period.split('-').map(Number),day=Number(String(rule||'').match(/\d{1,2}/)?.[0])||fallbackDay,next=/ถัดไป/.test(rule||''),prev=/ก่อน/.test(rule||'');return dateISO(new Date(y,m-1+(next?1:prev?-1:0),day))}
function openGenerateTemplate(id){
 if(!canManageAnnualTasks()){toast('Staff ไม่มีสิทธิ์สร้างงานจาก Annual Task');return}const t=state.templates.find(x=>x.id===id);if(!t||!t.active){toast('Annual Task นี้ปิดใช้งานอยู่');return}const modal=document.getElementById('templateModal'),period=currentPeriod(),due=templateRuleDate(period,t.dueRule,5),start=templateRuleDate(period,t.openRule,25);
 modal.innerHTML=`<div class="modal-head"><div><h2>สร้างงานจาก Annual Task</h2><span class="subtext">${t.id} · ${esc(t.name)}</span></div><button class="close-btn" data-close-modal>×</button></div><form id="generateForm"><div class="modal-body"><div class="field"><label>งวดบัญชี</label><input class="control" type="month" name="period" value="${period}" required></div><div id="generatePreview" style="margin-top:16px"></div><details class="advanced"><summary>ปรับวันที่เอง</summary><div class="form-grid" style="margin-top:12px"><div class="field"><label>วันที่เปิดงาน</label><input class="control" type="date" name="startDate" value="${start}"></div><div class="field"><label>กำหนดส่ง</label><input class="control" type="date" name="dueDate" value="${due}"></div></div></details></div><div class="modal-foot"><button type="button" class="btn" data-close-modal>ยกเลิก</button><button class="btn primary">ยืนยันสร้างงาน</button></div></form>`;
 const update=()=>{const p=modal.querySelector('[name=period]').value||period;modal.querySelector('[name=startDate]').value=templateRuleDate(p,t.openRule,25);modal.querySelector('[name=dueDate]').value=templateRuleDate(p,t.dueRule,5);modal.querySelector('#generatePreview').innerHTML=`<div class="panel"><div class="panel-body"><div class="eyebrow">ตัวอย่างงานที่จะสร้าง</div><strong>${esc(t.name.replace(/^Monthly /,''))} — ${p}</strong><p style="color:var(--muted);line-height:1.6">ทีม ${t.team} · ผู้รับผิดชอบ: ${esc(t.defaultAssignee)}<br>ผู้ตรวจ: ${esc(t.defaultReviewer)} · กำหนดส่ง: ${esc(t.dueRule)}<br>Checklist ${t.checklist.length} รายการ · ไฟล์ที่ต้องแนบ ${t.requiredFiles.length} รายการ</p></div></div>`};update();modal.querySelector('[name=period]').onchange=update;modal.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModals);
 modal.querySelector('form').onsubmit=async e=>{
  e.preventDefault();const submitBtn=modal.querySelector('button[type=submit]:not([type=button])')||modal.querySelector('.modal-foot .btn.primary');
  const d=Object.fromEntries(new FormData(e.target));if(state.tasks.some(x=>x.templateId===t.id&&x.period===d.period)){toast('มีงานจาก Annual Task นี้ในงวดดังกล่าวแล้ว');return}
  try{
   await runAsyncAction(submitBtn,()=>AsyncTaskRepository.create({title:`${t.name.replace(/^Monthly /,'')} — ${d.period}`,team:t.team,category:t.category,assignee:t.defaultAssignee,reviewer:t.defaultReviewer,priority:t.priority,period:d.period,dueDate:d.dueDate||templateRuleDate(d.period,t.dueRule,5),templateId:t.id,checklist:t.checklist.map((x,i)=>({id:`C${i+1}`,label:x,required:true,checked:false}))}));
  }catch(err){return}
  closeModals();renderSettingsModal();toast('สร้างงานจาก Annual Task แล้ว')
 };openModal('templateModal');queueCustomSelectRefresh();
}
// ---------------- System Settings / Master Data ----------------
const MASTER_CONFIG={
 teams:{label:'ทีม',singular:'ทีม',description:'ทีมปฏิบัติงาน หัวหน้าทีม และสีที่ใช้ทั่วทั้งระบบ',icon:'team'},
 categories:{label:'ประเภทงาน',singular:'ประเภทงาน',description:'ประเภทงานที่ใช้สร้าง Task, Annual Task และตัวกรอง',icon:'tag'}
};
function masterMiniIcon(type){
 const paths={team:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 21v-1a6 6 0 0 1 12 0v1M15 15a5 5 0 0 1 6 5v1"/>',tag:'<path d="M20 13 11 22l-9-9V4h9l9 9Z"/><circle cx="7" cy="9" r="1.5"/>'};
 return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[type]||paths.tag}</svg>`;
}
function masterRows(type){return state.masterData[type]||[]}
function masterLookup(type,id){return masterRows(type).find(x=>x.id===id)}
function masterCanEdit(){return ui.role==='manager'}
function masterRelatedText(type,row){
 if(type==='teams')return row.lead||'ยังไม่กำหนดหัวหน้าทีม';
 if(type==='categories')return masterLookup('teams',row.team)?.name||'ไม่พบทีม';
 return '-';
}
function masterUsage(type,row){
 if(type==='teams')return state.tasks.filter(x=>x.team===row.code).length+' งาน';
 if(type==='categories')return state.tasks.filter(x=>x.category===row.name).length+' งาน';
 return '-';
}
function resetDeletedMasterFilters(type,row){
 const groups=['dashboard','team','review','calendar','templates'];
 if(type==='teams')groups.forEach(g=>{if(ui.filters[g]?.team===row.code)ui.filters[g].team='all'});
 if(type==='categories')groups.forEach(g=>{if(ui.filters[g]?.category===row.name)ui.filters[g].category='all'});
}
function deleteMasterRow(type,id){
 const row=masterLookup(type,id);if(!row)return;
 const linked=type==='teams'?masterRows('categories').filter(x=>x.team===row.id):[];
 const message=type==='teams'&&linked.length?`ลบทีม “${row.name}” และประเภทงานในทีม ${linked.length} รายการหรือไม่?\nงานเดิมจะยังคงอยู่เพื่อเก็บประวัติ`:`ลบ${MASTER_CONFIG[type].singular} “${row.name}” หรือไม่?\nงานเดิมจะยังคงอยู่เพื่อเก็บประวัติ`;
 if(!confirm(message))return;
 if(type==='teams'){
  state.masterData.teams=masterRows('teams').filter(x=>x.id!==id);
  state.masterData.categories=masterRows('categories').filter(x=>x.team!==id);
  state.templates.filter(x=>x.team===row.code).forEach(x=>x.active=false);
 }else{
  state.masterData.categories=masterRows('categories').filter(x=>x.id!==id);
  state.templates.filter(x=>x.category===row.name).forEach(x=>x.active=false);
 }
 resetDeletedMasterFilters(type,row);syncRuntimeFromMaster();Store.save();render();toast(`ลบ${MASTER_CONFIG[type].singular}แล้ว`);
}
function renderMasterData(root,embedded=false){
 if(!MASTER_CONFIG[ui.masterTab])ui.masterTab='teams';
 const cfg=MASTER_CONFIG[ui.masterTab],filters=ui.filters.master,q=filters.search.trim().toLowerCase();
 if(!('team' in filters))filters.team='all';
 const all=masterRows(ui.masterTab),rows=all
  .filter(x=>filters.status==='all'||String(x.active)===filters.status)
  .filter(x=>ui.masterTab!=='categories'||filters.team==='all'||x.team===filters.team)
  .filter(x=>!q||`${x.code} ${x.name} ${x.description||''} ${masterRelatedText(ui.masterTab,x)}`.toLowerCase().includes(q));
 const editable=masterCanEdit();
 const header=embedded
  ?`<div class="settings-section-head"><div><div class="eyebrow">SYSTEM MANAGEMENT</div><h2>Management</h2><p>จัดการทีมและประเภทงาน โดยข้อมูลจะ Sync ไปยัง Task, Annual Task, Filter, Dashboard และ Calendar</p></div></div>`
  :`<div class="page-head"><div><div class="eyebrow">SYSTEM MANAGEMENT</div><h1>Management</h1><p>จัดการทีมและประเภทงาน โดยข้อมูลจะ Sync ไปยัง Task, Annual Task, Filter, Dashboard และ Calendar</p></div></div>`;
 const typeTabs=`<div class="management-type-tabs" role="tablist" aria-label="เลือกข้อมูลที่ต้องการจัดการ">${Object.entries(MASTER_CONFIG).map(([k,c])=>`<button class="management-type-tab ${ui.masterTab===k?'active':''}" data-master-tab="${k}" role="tab" aria-selected="${ui.masterTab===k}">${c.label}<span class="management-type-count">${masterRows(k).length}</span></button>`).join('')}</div>`;
 const teamFilter=ui.masterTab==='categories'?`<div class="field"><label for="masterTeam">ทีม</label><select class="control" id="masterTeam"><option value="all" ${filters.team==='all'?'selected':''}>ทุกทีม</option>${masterRows('teams').map(team=>`<option value="${esc(team.id)}" ${filters.team===team.id?'selected':''}>${esc(team.code)} · ${esc(team.name)}</option>`).join('')}</select></div>`:'';
 root.innerHTML=`<div class="master-page">${header}
 ${noticeBox(editable?'info':'neutral',editable?'Accounting Manager · จัดการข้อมูลได้':'View only · ไม่มีสิทธิ์แก้ไข',editable?'รายการที่ลบหรือปิดใช้งานจะไม่ปรากฏในตัวเลือกสำหรับงานใหม่ แต่งานเดิมยังคงข้อมูลไว้เพื่อประวัติ':'คุณสามารถดูข้อมูลได้ แต่การเพิ่ม แก้ไข ปิดใช้งาน และลบ จำกัดเฉพาะ Accounting Manager / Admin')}
 ${typeTabs}
 <section class="panel management-table-panel"><div class="panel-body"><div class="master-toolbar">${searchControl('masterSearch',filters.search,`ค้นหา${cfg.label} รหัส หรือรายละเอียด`)}${teamFilter}${filterControl('สถานะ','masterStatus',filters.status,['all','true','false'])}${editable?`<button class="btn primary master-add" id="addMaster">+ เพิ่ม${cfg.singular}</button>`:''}</div>
 <div class="master-table-wrap"><table class="master-table"><thead><tr><th>รหัส</th><th>ชื่อและรายละเอียด</th><th>${ui.masterTab==='teams'?'หัวหน้าทีม':'ทีมหลัก'}</th><th>การใช้งาน</th><th>สถานะ</th><th>อัปเดตล่าสุด</th>${editable?'<th style="text-align:right">จัดการ</th>':''}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr><td><span class="master-code">${esc(row.code)}</span></td><td><div class="master-name"><strong>${esc(row.name)}</strong><small>${esc(row.description||'ไม่มีรายละเอียด')}</small></div></td><td>${esc(masterRelatedText(ui.masterTab,row))}</td><td>${esc(masterUsage(ui.masterTab,row))}</td><td>${activityBadge(row.active)}</td><td>${formatDate(row.updatedAt)}</td>${editable?`<td><div class="master-actions"><button class="master-action" data-master-edit="${row.id}">แก้ไข</button><button class="master-action warning" data-master-toggle="${row.id}">${row.active?'ปิดใช้งาน':'เปิดใช้งาน'}</button><button class="master-action danger" data-master-delete="${row.id}">ลบ</button></div></td>`:''}</tr>`).join(''):`<tr><td colspan="${editable?7:6}"><div class="master-empty"><strong>ไม่พบ${cfg.label}</strong>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</div></td></tr>`}</tbody></table></div></div></section></div>`;
 root.querySelectorAll('[data-master-tab]').forEach(b=>b.onclick=()=>{ui.masterTab=b.dataset.masterTab;ui.filters.master.search='';ui.filters.master.status='all';ui.filters.master.team='all';render({resetScroll:false})});
 bindFilter('masterSearch','master','search','input');bindFilter('masterTeam','master','team');bindFilter('masterStatus','master','status');
 document.getElementById('addMaster')?.addEventListener('click',()=>openMasterModal(ui.masterTab));
 root.querySelectorAll('[data-master-edit]').forEach(b=>b.onclick=()=>openMasterModal(ui.masterTab,b.dataset.masterEdit));
 root.querySelectorAll('[data-master-toggle]').forEach(b=>b.onclick=()=>{const row=masterLookup(ui.masterTab,b.dataset.masterToggle);if(!row)return;row.active=!row.active;row.updatedAt=dateISO(new Date());syncRuntimeFromMaster();Store.save();render({resetScroll:false});toast(`${row.active?'เปิด':'ปิด'}ใช้งาน ${row.name} แล้ว`)});
 root.querySelectorAll('[data-master-delete]').forEach(b=>b.onclick=()=>deleteMasterRow(ui.masterTab,b.dataset.masterDelete));
}
function masterExtraFields(type,row={}){
 if(type==='teams')return `<div class="field"><label>หัวหน้าทีม</label><input class="control" name="lead" value="${esc(row.lead||'')}" placeholder="ชื่อหัวหน้าทีม"></div><div class="field"><label>สีประจำทีม</label><div class="master-color-row"><input type="color" name="color" value="${esc(row.color||'#007AFF')}"><span class="subtext">ใช้ใน Dashboard และ Calendar</span></div></div>`;
 if(type==='categories')return `<div class="field full"><label>ทีมหลัก</label><select class="control" name="team" required>${optionList(masterRows('teams').filter(x=>x.active||x.id===row.team).map(x=>x.id),row.team||masterRows('teams').find(x=>x.active)?.id||'',id=>{const t=masterLookup('teams',id);return t?`${t.code} · ${t.name}`:id})}</select></div>`;
 return '';
}
function migrateMasterReferences(type,row,old){
 if(type==='teams'&&old.code!==row.code){
  state.tasks.forEach(x=>{if(x.team===old.code)x.team=row.code});
  state.templates.forEach(x=>{if(x.team===old.code)x.team=row.code});
  if(TEAM_MEMBERS[old.code]&&!TEAM_MEMBERS[row.code])TEAM_MEMBERS[row.code]=TEAM_MEMBERS[old.code];Object.values(ROLE_USER).forEach(u=>{if(u.team===old.code)u.team=row.code});
  ['dashboard','team','review','calendar','templates'].forEach(g=>{if(ui.filters[g]?.team===old.code)ui.filters[g].team=row.code});
 }
 if(type==='categories'&&old.name!==row.name){
  state.tasks.forEach(x=>{if(x.category===old.name)x.category=row.name});
  state.templates.forEach(x=>{if(x.category===old.name)x.category=row.name});
  ['dashboard','team','calendar','templates'].forEach(g=>{if(ui.filters[g]?.category===old.name)ui.filters[g].category=row.name});
 }
 if(type==='categories'&&old.team!==row.team){
  const nextTeam=masterLookup('teams',row.team)?.code;
  if(nextTeam)state.templates.forEach(x=>{if(x.category===row.name)x.team=nextTeam});
 }
}
function openMasterModal(type,id=null){
 if(!masterCanEdit()){toast('ไม่มีสิทธิ์แก้ไขข้อมูลพื้นฐาน');return}
 const cfg=MASTER_CONFIG[type],row=id?masterLookup(type,id):null,modal=document.getElementById('masterModal');
 modal.innerHTML=`<div class="modal-head"><div><h2>${row?'แก้ไข':'เพิ่ม'}${cfg.singular}</h2><span class="subtext">${cfg.description}</span></div><button class="close-btn" data-close-modal>×</button></div><form id="masterForm"><div class="modal-body">${noticeBox('info','ข้อมูลเชื่อมโยงกับทุกหน้า','ข้อมูลนี้ Sync ไปยังตัวเลือกของหน้าอื่นทันที การลบจะไม่แก้ไขงานเก่า เพื่อรักษาประวัติข้อมูล')}<div class="form-grid"><div class="field"><label>รหัส</label><input class="control" name="code" value="${esc(row?.code||'')}" required maxlength="30" placeholder="เช่น GL, VAT"></div><div class="field"><label>ชื่อ</label><input class="control" name="name" value="${esc(row?.name||'')}" required maxlength="100"></div><div class="field full"><label>รายละเอียด</label><textarea class="control" name="description" placeholder="อธิบายการใช้งานข้อมูลนี้">${esc(row?.description||'')}</textarea></div>${masterExtraFields(type,row||{})}<div class="field full"><label>สถานะ</label><select class="control" name="active"><option value="true" ${row?.active!==false?'selected':''}>เปิดใช้งาน</option><option value="false" ${row?.active===false?'selected':''}>ปิดใช้งาน</option></select></div></div></div><div class="modal-foot"><button type="button" class="btn" data-close-modal>ยกเลิก</button><button class="btn primary">${row?'บันทึกการแก้ไข':'เพิ่มข้อมูล'}</button></div></form>`;
 modal.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModals);
 modal.querySelector('form').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.code=d.code.trim().toUpperCase();d.name=d.name.trim();d.active=d.active==='true';if(masterRows(type).some(x=>x.code.toUpperCase()===d.code&&x.id!==row?.id)){toast('รหัสนี้มีอยู่แล้ว');return}if(type==='categories'&&masterRows(type).some(x=>x.name.trim().toLowerCase()===d.name.toLowerCase()&&x.id!==row?.id)){toast('ชื่อประเภทงานนี้มีอยู่แล้ว');return}const old=row?{...row}:null;if(row){Object.assign(row,d,{updatedAt:dateISO(new Date())});migrateMasterReferences(type,row,old)}else{const newRow={id:type==='teams'?`TEAM-${d.code}`:uid('CAT'),...d,updatedAt:dateISO(new Date())};masterRows(type).push(newRow)}syncRuntimeFromMaster();Store.save();closeModals();render();toast(`${row?'บันทึก':'เพิ่ม'}${cfg.singular}แล้ว`)};
 openModal('masterModal');queueCustomSelectRefresh();
}
