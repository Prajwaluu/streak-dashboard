// Storage. Same keys and shape as the iOS app ("streakly-v1[:email]"), so a
// backup taken from the phone imports with no conversion. On top of that:
// daily restore points in IndexedDB and a request for persistent storage, so
// Safari never quietly evicts the journal.
import { normalize, blankState } from "./logic.js";

export const CURKEY = "streakly-current";
export function keyFor(email){ return email ? "streakly-v1:" + email : "streakly-v1"; }

function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }
function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }

export function currentEmail(){ return (lsGet(CURKEY) || "").trim().toLowerCase(); }
export function setCurrentEmail(email){ if(email) lsSet(CURKEY, email); else lsDel(CURKEY); }
export function loadProfile(key){
  const raw = lsGet(key);
  if(!raw) return null;
  try{ return normalize(JSON.parse(raw)); }catch(e){ return null; }
}
export function hasProfile(key){ return lsGet(key) != null; }

let saveTimer = null, pending = null;
// Writes are synchronous for correctness, but snapshotting is debounced.
export function saveProfile(key, S){
  const ok = lsSet(key, JSON.stringify(S));
  pending = {key, S};
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { if(pending) dailySnapshot(pending.key, pending.S); }, 4000);
  return ok;
}

export function listProfileKeys(){
  const out = [];
  try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && k.startsWith("streakly-v1")) out.push(k); } }catch(e){}
  return out;
}

// ================= backup files =================
export function buildBackup(){
  const profiles = {};
  for(const k of listProfileKeys()){ try{ profiles[k] = JSON.parse(lsGet(k)); }catch(e){} }
  return { app:"streak-dashboard", format:1, exportedAt:new Date().toISOString(), current: currentEmail(), profiles };
}
// Accepts: our backup envelope, a raw state object from the old app, or a
// {"streakly-v1": "<json string>"} localStorage dump.
export function parseBackup(text){
  let data;
  try{ data = JSON.parse(text); }catch(e){ throw new Error("That file isn't valid JSON."); }
  let profiles = null, current = "";
  if(data && data.profiles && typeof data.profiles === "object"){ profiles = data.profiles; current = data.current || ""; }
  else if(data && data.days){ profiles = {[keyFor((data.email||"").toLowerCase())]: data}; current = (data.email||"").toLowerCase(); }
  else if(data && typeof data === "object"){
    const ks = Object.keys(data).filter(k => k.startsWith("streakly-v1"));
    if(ks.length){ profiles = {}; ks.forEach(k => { profiles[k] = typeof data[k] === "string" ? JSON.parse(data[k]) : data[k]; }); current = data[CURKEY] || ""; }
  }
  if(!profiles || !Object.keys(profiles).length) throw new Error("No dashboard data found in that file.");
  const out = {};
  for(const k in profiles){ const s = normalize(profiles[k]); out[k] = s; }
  return {profiles: out, current};
}
export function summarize(S){
  const days = Object.values(S.days||{});
  const logged = days.filter(o => o.status).length;
  const keys = Object.keys(S.days||{}).filter(k => S.days[k].status).sort();
  return { logged, notes: days.filter(o => o.note && o.note.trim()).length, quotes: (S.customQuotes||[]).length,
    books: (S.books||[]).length, from: keys[0] || null, to: keys[keys.length-1] || null, name: S.name || "" };
}
export function applyBackup(parsed){
  for(const k in parsed.profiles) lsSet(k, JSON.stringify(parsed.profiles[k]));
  setCurrentEmail(parsed.current || "");
}

// ================= persistent storage =================
export async function requestPersistence(){
  try{
    if(navigator.storage && navigator.storage.persist){
      if(await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  }catch(e){}
  return false;
}
export async function storageEstimate(){
  try{ if(navigator.storage && navigator.storage.estimate) return await navigator.storage.estimate(); }catch(e){}
  return null;
}

// ================= restore points (IndexedDB, one per day, last 14 kept) =================
const DB = "streak-restore", STORE = "snapshots", KEEP = 14;
function openDb(){
  return new Promise((res, rej) => {
    if(!("indexedDB" in window)) return rej(new Error("no idb"));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, {keyPath:"id"});
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function tx(db, mode, fn){
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), st = t.objectStore(STORE);
    let out; Promise.resolve(fn(st)).then(v => out = v);
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
  });
}
function reqP(r){ return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

export async function dailySnapshot(key, S, label){
  try{
    const db = await openDb();
    const d = new Date(), day = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    await tx(db, "readwrite", st => st.put({id: key + "@" + (label || day), key, day, at: Date.now(), data: JSON.stringify(S)}));
    const all = await tx(db, "readonly", st => reqP(st.getAll()));
    const mine = all.filter(x => x.key === key).sort((a,b) => b.at - a.at);
    if(mine.length > KEEP) await tx(db, "readwrite", st => { mine.slice(KEEP).forEach(x => st.delete(x.id)); });
  }catch(e){}
}
export async function listSnapshots(key){
  try{
    const db = await openDb();
    const all = await tx(db, "readonly", st => reqP(st.getAll()));
    return all.filter(x => x.key === key).sort((a,b) => b.at - a.at);
  }catch(e){ return []; }
}
export function snapshotState(snap){ try{ return normalize(JSON.parse(snap.data)); }catch(e){ return blankState(); } }
