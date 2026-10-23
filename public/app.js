(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let token=sessionStorage.getItem("nexus_session")||"",timer;
const login=$("#loginScreen"),shell=$("#appShell"),msg=$("#loginMessage"),toast=$("#toast");
function notify(t){toast.textContent=t;toast.classList.add("show");clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove("show"),2600)}
function showLogin(t=""){shell.classList.add("hidden");login.classList.remove("hidden");msg.textContent=t}
function showApp(){login.classList.add("hidden");shell.classList.remove("hidden")}
async function api(url,opts={}){const headers={"Content-Type":"application/json",...(opts.headers||{})};if(token)headers.Authorization="Bearer "+token;const r=await fetch(url,{...opts,headers});const d=await r.json().catch(()=>({}));if(r.status===401){token="";sessionStorage.removeItem("nexus_session");showLogin("Your session expired. Sign in again.");throw Error(d.error||"Sign in again.");}if(!r.ok)throw Error(d.error||"Request failed.");return d}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const b=$("#loginButton");b.disabled=true;msg.textContent="Signing in…";try{const d=await api("/api/login",{method:"POST",body:JSON.stringify({password:$("#password").value})});token=d.token;sessionStorage.setItem("nexus_session",token);$("#loginForm").reset();showApp();msg.textContent="";notify("Signed in successfully.");await loadOverview()}catch(err){msg.textContent=err.message}finally{b.disabled=false}});
async function logout(){try{await api("/api/logout",{method:"POST",body:"{}"})}catch{}token="";sessionStorage.removeItem("nexus_session");showLogin("You have signed out.")}
$("#logoutButton").addEventListener("click",logout);
async function loadOverview(){try{const d=await api("/api/overview");if(d.bots?.[0]){$$(".bot-details b").forEach(x=>x.textContent=d.bots[0].name);$$(".bot-list-row b").forEach(x=>x.textContent=d.bots[0].name)}}catch(e){if(token)notify(e.message)}}
const names={dashboard:"Dashboard",bots:"My bots",logs:"Console logs",settings:"Settings",help:"Help & status"};
function go(p){if(!names[p])return;$$(".page").forEach(x=>x.classList.toggle("active",x.id==="page-"+p));$$("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));$("#crumbPage").textContent=names[p];$("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.goto)));
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#refreshButton").addEventListener("click",async()=>{await loadOverview();notify("Panel refreshed.")});
$("#dismissNotice").addEventListener("click",()=>$("#notice").classList.add("hidden"));
$("#showAddBot").addEventListener("click",()=>$("#addBotCard").classList.remove("hidden"));
$("#closeAddBot").addEventListener("click",()=>$("#addBotCard").classList.add("hidden"));
$("#addBotForm").addEventListener("submit",e=>{e.preventDefault();const n=$("#newBotName").value.trim();$("#addBotMessage").textContent=`“${n}” is a preview only. Connect a secure worker before running bots.`;notify("Preview only — no bot process was started.")});
$("#botSearch").addEventListener("input",e=>$(".bot-list-row").classList.toggle("hidden",!$(".bot-list-row").textContent.toLowerCase().includes(e.target.value.toLowerCase())));
$("#clearLogs").addEventListener("click",()=>{$("#console").innerHTML="";notify("Cleared the log view.")});
$$("[data-settings]").forEach(b=>b.addEventListener("click",()=>{ $$(".settings-tab").forEach(x=>x.classList.toggle("active",x===b));const c=$("#settingsContent"),k=b.dataset.settings;const d={general:["GENERAL","Workspace settings","Basic details for this Nexus Host instance."],security:["SECURITY","Authentication & sessions","This starter uses an admin password and in-memory sessions. Add a persistent account database before public use."],deployment:["DEPLOYMENT","Railway deployment","Set SESSION_SECRET (32+ random characters) and ADMIN_PASSWORD (16+ characters) in Railway Variables. Never commit secrets to GitHub."]}[k];c.innerHTML=`<p class="eyebrow">${d[0]}</p><h2>${d[1]}</h2><p class="muted">${d[2]}</p>`;if(k==="general"){c.innerHTML+=`<label>Workspace name<input id="workspaceName" value="Personal workspace" maxlength="48"></label><p class="muted">Dark gray theme enabled.</p><button class="btn btn-primary" id="saveSettings">Save changes</button><p class="form-message" id="settingsMessage"></p>`;$("#saveSettings").addEventListener("click",()=>{$(".workspace b").textContent=$("#workspaceName").value.trim()||"Personal workspace";$("#settingsMessage").textContent="Workspace name updated for this page.";notify("Settings updated.")})}}));
async function init(){if(!token)return showLogin();try{await api("/api/me");showApp();await loadOverview()}catch{showLogin()}}init();
})();
