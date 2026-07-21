// Core constants, UI configuration, theme helpers, dates and escaping

const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate());
const STATUS = {
  'assigned':{label:'Assigned',color:'#8E8E93'},
  'in-progress':{label:'In Progress',color:'#32ADE6'},
  'ready-review':{label:'Ready for Review',color:'#30B0C7'},
  'under-review':{label:'Under Review',color:'#AF52DE'},
  'revision':{label:'Revision Required',color:'#FF6B61'},
  'approved':{label:'Approved',color:'#248A3D'}
};
const STATUS_ORDER = Object.keys(STATUS);
const TEAM_INFO = {
  GL:{name:'General Ledger',lead:'วีระ อภิชัย',color:'#007AFF'},AP:{name:'Accounts Payable',lead:'ศุภชัย AP Lead',color:'#FF9F0A'},
  AR:{name:'Accounts Receivable',lead:'ลลิตา AR Lead',color:'#34C759'},Tax:{name:'Tax',lead:'นภัส Tax Lead',color:'#AF52DE'},
  FA:{name:'Fixed Assets',lead:'วรางค์ FA Lead',color:'#FF453A'},Reporting:{name:'Reporting',lead:'พิชญ์ Reporting Lead',color:'#30B0C7'}
};
const TEAM_MEMBERS = {
 GL:['กัญญา นาคดี','อรทัย ศรีสุข','บอย ธนกฤต','มินท์ ภัทรา'],AP:['เจน จิราพร','ดาว พรทิพย์','ปุ้ย นภสร','หนึ่ง รชต'],
 AR:['แอน อรอุมา','โม ธัญชนก','นัท ณัฐพล','ฟ้า วรัญญา'],Tax:['กิ่ง พิมพ์ชนก','อุ้ม ชลธิชา','ปอนด์ ภาคภูมิ','เมย์ ศศิธร'],
 FA:['น้ำ สุพัตรา','อาร์ม อดิศร','ป่าน ชุติมา','เบส ภูวดล'],Reporting:['แพร ณิชา','มุก ปวีณา','ตูน ธีรภัทร','ไอซ์ อัญชลี']
};
const CATEGORY = {
 GL:['Bank Reconciliation','Journal Entry Review','Intercompany','Trial Balance'],AP:['AP Closing','Supplier Reconciliation','Input VAT','Payment Run'],
 AR:['AR Closing','Customer Reconciliation','Revenue Reconciliation','Bad Debt'],Tax:['VAT Report','WHT Report','CIT Provision','Tax Filing'],
 FA:['Depreciation','Asset Addition','Asset Disposal','FA Reconciliation'],Reporting:['Management Report','BU Analysis','Forecast','Executive Pack']
};
const PRIORITIES=['normal','normal','normal','high','high','critical','low'];
const ROLE_USER={staff:{name:'กัญญา นาคดี',team:'GL',initials:'KN'},reviewer:{name:'วีระ อภิชัย',team:'GL',initials:'VA'},teamlead:{name:'วีระ อภิชัย',team:'GL',initials:'VA'},manager:{name:'ศิริพร ผู้จัดการ',team:'ALL',initials:'SP'}};
const ICON_PATHS={
 dashboard:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/><circle cx="7" cy="15" r="1"/><circle cx="11" cy="11" r="1"/><circle cx="14" cy="13" r="1"/><circle cx="19" cy="7" r="1"/>',
 tasks:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>',
 board:'<circle cx="12" cy="7" r="2.8"/><circle cx="5.5" cy="9" r="2.3"/><circle cx="18.5" cy="9" r="2.3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/><path d="M1.5 20v-.5A4.5 4.5 0 0 1 6 15"/><path d="M22.5 20v-.5A4.5 4.5 0 0 0 18 15"/>',
 review:'<path d="M9 11l2 2 4-5"/><circle cx="12" cy="11" r="7"/><path d="m17 16 4 4"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
 template:'<rect x="6" y="3" width="14" height="16" rx="3"/><path d="M9 7h8M9 11h8M9 15h5"/><path d="M4 7H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.32.75.6 1 .3.25.68.39 1.1.4H21v4h-.09c-.42.01-.8.15-1.1.4-.28.25-.5.6-.6 1Z"/>',
 appearance:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/><path d="M17.5 4.5h.01M20 7h.01"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
 ai:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>'
};
function iconSvg(name,size=18){return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name]||ICON_PATHS.dashboard}</svg>`}
function noticeBox(tone,title,text){
 const safeTone=['neutral','info','success','warning','danger'].includes(tone)?tone:'neutral';
 const paths={
  neutral:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
  success:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3 4.7-5"/>',
  warning:'<path d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/>'
 };
 const role=['warning','danger'].includes(safeTone)?'alert':'note';
 return `<div class="notice-box notice-${safeTone}" role="${role}"><div class="notice-icon" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 24 24">${paths[safeTone]}</svg></div><div class="notice-content"><strong>${esc(title)}</strong><p>${esc(text)}</p></div></div>`;
}
const NAV=[
 {id:'dashboard',label:'Dashboard',icon:'dashboard',group:'Workspace'},
 {id:'my-tasks',label:'My Tasks',icon:'tasks',group:'Workspace'},
 {id:'team-board',label:'Team Board',icon:'board',group:'Workspace'},
 {id:'review-queue',label:'Review Queue',icon:'review',group:'Workspace'},
 {id:'closing-calendar',label:'Closing Calendar',icon:'calendar',group:'Planning'},
 {id:'settings',label:'Setting',icon:'settings',group:'Settings'}
];
const ui={
 page:'dashboard',dashboardTab:'overview',drawerTab:'detail',teamView:'board',myView:'table',calendarView:'month',templateView:'table',masterTab:'teams',settingsTab:localStorage.getItem('acct-settings-tab')||'task-team',settingsModalOpen:false,
 themeMode:localStorage.getItem('acct-theme-mode')||'system',
 role:localStorage.getItem('acct-role')||'staff', sidebarCollapsed:localStorage.getItem('acct-side')==='1',
 selected:new Set(),sort:{},pageNo:{team:1,my:1,review:1},boardLimit:{},filters:{
  dashboard:{search:'',team:'all',period:'2026-07',range:'6',category:'all'},
  my:{search:'',status:'all',priority:'all',kpi:null},
  team:{search:'',team:'GL',period:'2026-07',assignee:'all',reviewer:'all',status:'all',category:'all',priority:'all'},
  review:{search:'',team:'all',reviewer:'all',status:'all',priority:'all',age:'all',kpi:null},
  calendar:{search:'',team:'all',category:'all',assignee:'all',kpi:null},
  templates:{search:'',team:'all',category:'all',frequency:'all',active:'all'},
  master:{search:'',status:'all',team:'all'}
 },calendarDate:new Date('2026-07-01T00:00:00'),calendarSelected:'2026-07-14'
};

const THEME_MODES={
 light:{label:'Light',description:'พื้นหลังสว่างสำหรับพื้นที่ที่มีแสงมาก'},
 dark:{label:'Dark',description:'Night Mode โทน Soft Graphite เทาสบายตาและอ่านง่าย'},
 system:{label:'System',description:'เปลี่ยนตามการตั้งค่าของ Windows หรือ macOS โดยอัตโนมัติ'}
};
function normalizeThemeMode(mode){return Object.prototype.hasOwnProperty.call(THEME_MODES,mode)?mode:'system'}
function prefersDarkTheme(){return Boolean(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)}
function resolvedTheme(mode=ui.themeMode){mode=normalizeThemeMode(mode);return mode==='system'?(prefersDarkTheme()?'dark':'light'):mode}
function applyTheme(mode,{persist=true}={}){
 ui.themeMode=normalizeThemeMode(mode);
 const resolved=resolvedTheme(ui.themeMode);
 document.documentElement.dataset.theme=resolved;
 document.documentElement.dataset.themeMode=ui.themeMode;
 document.documentElement.style.colorScheme=resolved;
 const themeMeta=document.querySelector('meta[name="theme-color"]');
 if(themeMeta)themeMeta.setAttribute('content',resolved==='dark'?'#24252A':'#F5F5F7');
 if(persist)localStorage.setItem('acct-theme-mode',ui.themeMode);
 return resolved;
}
const systemThemeMedia=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
if(systemThemeMedia){
 const syncSystemTheme=()=>{if(ui.themeMode==='system')applyTheme('system',{persist:false})};
 if(systemThemeMedia.addEventListener)systemThemeMedia.addEventListener('change',syncSystemTheme);
 else if(systemThemeMedia.addListener)systemThemeMedia.addListener(syncSystemTheme);
}

function seeded(seed){let x=Math.sin(seed)*10000;return x-Math.floor(x)}
function dateISO(d){const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
function dateTimeLocalISO(value){const x=new Date(value);return Number.isNaN(x.getTime())?'':dateISO(x)}
function currentPeriod(){return `${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}`}
function defaultDueDate(days=7){return dateISO(addDays(TODAY,days))}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
const dateFormatCache=new Map(),dateTimeFormatCache=new Map();
const shortDateFormatter=new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'2-digit'});
const shortDateTimeFormatter=new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function formatDate(s){if(!s)return'-';if(!dateFormatCache.has(s))dateFormatCache.set(s,shortDateFormatter.format(new Date(s+'T00:00:00')));return dateFormatCache.get(s)}
function formatDateTime(s){if(!s)return'-';if(!dateTimeFormatCache.has(s))dateTimeFormatCache.set(s,shortDateTimeFormatter.format(new Date(s)));return dateTimeFormatCache.get(s)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function isOverdue(t){return t.status!=='approved'&&new Date(t.dueDate+'T00:00:00')<TODAY}
function toLocalMidnight(v){if(v instanceof Date)return new Date(v.getFullYear(),v.getMonth(),v.getDate());const s=String(v);const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));const d=new Date(s);return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function daysBetween(a,b){return Math.round((toLocalMidnight(b)-toLocalMidnight(a))/86400000)}
function currentUser(){return ROLE_USER[ui.role]}
let uidCounter=0;
function uid(prefix='TASK'){return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(uidCounter++).toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`}
