
const express=require("express");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const crypto=require("crypto");
const path=require("path");
const app=express();
const PORT=Number(process.env.PORT)||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"";
const SESSION_SECRET=process.env.SESSION_SECRET||"";
if(process.env.NODE_ENV==="production"){
 if(SESSION_SECRET.length<32){console.error("Set SESSION_SECRET to a random value of at least 32 characters.");process.exit(1);}
 if(ADMIN_PASSWORD.length<16){console.error("Set ADMIN_PASSWORD to a unique password of at least 16 characters.");process.exit(1);}
}
app.disable("x-powered-by");
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'","data:"],connectSrc:["'self'"],objectSrc:["'none'"],frameAncestors:["'none'"]}}}));
app.use(express.json({limit:"32kb"}));
app.use(rateLimit({windowMs:60000,limit:120,standardHeaders:true,legacyHeaders:false}));
const sessions=new Map(), attempts=new Map(), TTL=8*60*60*1000;
function tokenFrom(req){const h=req.headers.authorization||"";return h.startsWith("Bearer ")?h.slice(7):"";}
function auth(req,res,next){const t=tokenFrom(req),s=sessions.get(t);if(!t||!s||s.expires<Date.now()){if(t)sessions.delete(t);return res.status(401).json({error:"Please sign in again."});}next();}
function safeEqual(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
setInterval(()=>{for(const [t,s] of sessions)if(s.expires<Date.now())sessions.delete(t);},600000).unref();
app.post("/api/login",rateLimit({windowMs:900000,limit:10,standardHeaders:true,legacyHeaders:false}),(req,res)=>{
 if(!ADMIN_PASSWORD)return res.status(503).json({error:"Set ADMIN_PASSWORD in Railway Variables before signing in."});
 const ip=req.ip||"unknown";let a=attempts.get(ip)||{count:0,reset:Date.now()+900000};if(a.reset<Date.now())a={count:0,reset:Date.now()+900000};if(a.count>=10)return res.status(429).json({error:"Too many attempts. Try later."});a.count++;attempts.set(ip,a);
 if(!safeEqual(req.body?.password||"",ADMIN_PASSWORD))return res.status(401).json({error:"Incorrect password."});
 const token=crypto.randomBytes(32).toString("hex");sessions.set(token,{expires:Date.now()+TTL});attempts.delete(ip);res.json({token,expiresIn:TTL});
});
app.post("/api/logout",auth,(req,res)=>{sessions.delete(tokenFrom(req));res.json({ok:true});});
app.get("/api/me",auth,(_req,res)=>res.json({name:"Nexus Admin",role:"Owner"}));
app.get("/api/overview",auth,(_req,res)=>res.json({bots:[{id:"demo-1",name:"Example Bot",runtime:"Node.js",status:"Not configured"}],stats:{total:1,running:0,stopped:1}}));
app.get("/health",(_req,res)=>res.json({ok:true,service:"nexus-host-panel"}));
app.use(express.static(path.join(__dirname,"public")));
app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`Nexus Host panel listening on ${PORT}`));
