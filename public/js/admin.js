const enquiries = [
  {name:'Rahul',email:'rahul@gmail.com',destination:'Goa',date:'2026-11-10',travellers:2,status:'Pending'},
  {name:'Priya',email:'priya@gmail.com',destination:'Manali',date:'2026-11-09',travellers:4,status:'Confirmed'},
  {name:'Aman',email:'aman@gmail.com',destination:'Kerala',date:'2026-11-08',travellers:3,status:'Contacted'},
  {name:'Sneha',email:'sneha@gmail.com',destination:'Jaipur',date:'2026-11-07',travellers:2,status:'Pending'}
];
const destinations = ['Goa','Manali','Kerala','Jaipur','Varanasi','Udaipur'];
const packages = [{name:'Manali Mountain Escape',duration:'5 Days / 4 Nights'},{name:'Kerala Backwater Tour',duration:'6 Days / 5 Nights'},{name:'Goa Beach Holiday',duration:'4 Days / 3 Nights'}];

document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});

function statusTag(status) {
  return `<span class="status ${status}">${status}</span>`;
}
function renderRecent() {
  document.getElementById('recentTable').innerHTML = enquiries.slice(0,4).map(e =>
    `<tr><td>${e.name}</td><td>${e.destination}</td><td>${e.date}</td><td>${e.travellers}</td><td>${statusTag(e.status)}</td></tr>`
  ).join('');
}
function renderEnquiries(list=enquiries) {
  document.getElementById('enquiryTable').innerHTML = list.map((e,i) =>
    `<tr><td>${e.name}</td><td>${e.email}</td><td>${e.destination}</td><td>${e.date}</td><td>${e.travellers}</td><td>${statusTag(e.status)}</td><td><select data-status="${enquiries.indexOf(e)}"><option ${e.status==='Pending'?'selected':''}>Pending</option><option ${e.status==='Contacted'?'selected':''}>Contacted</option><option ${e.status==='Confirmed'?'selected':''}>Confirmed</option></select></td></tr>`
  ).join('');
}
function renderCards() {
  document.getElementById('destinationGrid').innerHTML = destinations.map(d => `<article class="simple-card"><h3>${d}</h3><p>Listed travel destination</p></article>`).join('');
  document.getElementById('packageGrid').innerHTML = packages.map(p => `<article class="simple-card"><h3>${p.name}</h3><p>Duration: ${p.duration}</p></article>`).join('');
}
function updateStats() {
  document.getElementById('totalCount').textContent = enquiries.length;
  document.getElementById('pendingCount').textContent = enquiries.filter(e=>e.status==='Pending').length;
  document.getElementById('confirmedCount').textContent = enquiries.filter(e=>e.status==='Confirmed').length;
}
function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s=>s.classList.toggle('active-section',s.id===id));
  document.querySelectorAll('.nav-link[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  document.getElementById('pageTitle').textContent = id.charAt(0).toUpperCase()+id.slice(1);
  document.getElementById('sidebar').classList.remove('open');
}
document.querySelectorAll('.nav-link[data-section]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.open)));
document.getElementById('enquiryTable').addEventListener('change',e=>{
  if(e.target.matches('select[data-status]')) {
    enquiries[Number(e.target.dataset.status)].status=e.target.value;
    renderEnquiries(); renderRecent(); updateStats();
  }
});
document.getElementById('searchEnquiries').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();
  renderEnquiries(enquiries.filter(x=>[x.name,x.email,x.destination,x.status].some(v=>v.toLowerCase().includes(q))));
});
document.getElementById('addDestination').addEventListener('click',()=>{
  const name=prompt('Enter destination name:');
  if(name && name.trim()){destinations.push(name.trim());renderCards();}
});
document.getElementById('addPackage').addEventListener('click',()=>{
  const name=prompt('Enter package name:');
  if(name && name.trim()){const duration=prompt('Enter duration (example: 5 Days / 4 Nights):')||'Not set';packages.push({name:name.trim(),duration});renderCards();}
});
document.getElementById('saveSettings').addEventListener('click',()=>document.getElementById('settingsMessage').textContent='Demo settings saved in this page.');
document.getElementById('logoutBtn').addEventListener('click',()=>{
  sessionStorage.removeItem('exploreIndiaAdminDemo');
  window.location.href='admin-login.html';
});
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));

renderRecent(); renderEnquiries(); renderCards(); updateStats();
