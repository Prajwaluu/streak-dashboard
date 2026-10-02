import { QUOTES } from "./quotes.js";
import {
  MONTHS, MOODS, MILESTONES, iso, fromIso, addDays, blankState, normalize, statusOf, isWin,
  streak, longestStreak, streakAtRisk, nextMilestone, prevMilestone, yearStats, momentum, momentumWord,
  weekRow, insights, allQuotes, dailyQuote, parseBook, cleanTitle, allChapters, currentChapterRef,
  escapeHtml as esc, renderHighlighted, searchNotes
} from "./logic.js";
import {
  keyFor, currentEmail, setCurrentEmail, loadProfile, hasProfile, saveProfile as persist,
  buildBackup, parseBackup, summarize, applyBackup, requestPersistence, listSnapshots, snapshotState, dailySnapshot
} from "./store.js";

// ================= icons =================
const P = {
  check:'<path d="M20 6 9 17l-5-5"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>',
  chevL:'<path d="m15 18-6-6 6-6"/>', chevR:'<path d="m9 18 6-6-6-6"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  paper:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chart:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  shuffle:'<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8M18 14l4 4-4 4"/>',
  quote:'<path d="M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/>',
  sparkle:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  alert:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 5L2 7"/>',
  phone:'<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M12 18h.01"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  bookmark:'<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  note:'<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  key:'<rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
};
const ic = (n, c = "") => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ================= state =================
let KEY = keyFor(currentEmail());
let S = loadProfile(KEY);
const firstRun = !S;
if(!S){ S = blankState(); S.createdAt = new Date().toISOString(); }
let today = iso(new Date());
let selected = today;
let view = (() => { try{ return sessionStorage.getItem("streak-view") || "today"; }catch(e){ return "today"; } })();
let viewYear = fromIso(today).getFullYear();
let noteTab = "daily";
let journalTab = "entries";
let query = "";

function save(){
  if(!persist(KEY, S)) toast("Storage is full — export a backup and remove a large book or image.");
}
const STATUS = { full:["Conquered","var(--win)"], partial:["Partial","var(--part)"], missed:["Defeated","var(--miss)"] };
const MOOD_COL = ["#f5c84c","#7cc4f2","#b9c0cc","#b9a6f5","#f29b9b"];
function day(k){ return S.days[k] || (S.days[k] = {status:null, rating:null, mood:null, note:""}); }
function dayObj(k){ return S.days[k] || {status:null, rating:null, mood:null, note:""}; }
const firstName = () => (S.name || "").trim().split(/\s+/)[0] || "";
const niceDate = (k, o = {weekday:"long", day:"numeric", month:"long"}) => fromIso(k).toLocaleDateString(undefined, o);

// ================= chrome =================
const THEMES = { white:["White","sun","#f4f4f6"], cream:["Cream","paper","#efe5cc"], night:["Night","moon","#121314"] };
function applyTheme(){
  document.documentElement.dataset.theme = S.theme;
  const m = $('meta[name="theme-color"]'); if(m) m.setAttribute("content", THEMES[S.theme][2]);
  $("#themeBtn").innerHTML = ic("contrast");
  $("#themeBtn").setAttribute("aria-label", "Appearance: " + THEMES[S.theme][0] + " — tap to change");
}
function renderChrome(){
  applyTheme();
  const fn = firstName();
  $("#brandTitle").innerHTML = fn ? esc(fn) + "’s <em>Streak</em>" : "My <em>Streak</em>";
  $("#searchBtn").innerHTML = ic("search");
  const av = $("#avatarBtn");
  av.innerHTML = S.photo ? `<img src="${esc(S.photo)}" alt="">` : (fn ? esc(fn[0].toUpperCase()) : ic("user","sm"));
  const tabs = [["today","flame","Today"],["calendar","calendar","Calendar"],["insights","chart","Insights"],["journal","book","Journal"]];
  const pending = !statusOf(S, today);
  $("#dock").innerHTML = tabs.map(([v, i, l]) =>
    `<button class="press ${view === v ? "on" : ""}" data-view="${v}" aria-current="${view === v ? "page" : "false"}">${ic(i)}<span>${l}</span>${v === "today" && pending ? '<i class="badge" aria-label="Today not logged yet"></i>' : ""}</button>`).join("");
}
$("#dock").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if(b) go(b.dataset.view); });
$("#themeBtn").onclick = () => { const order = ["white","cream","night"]; S.theme = order[(order.indexOf(S.theme)+1) % 3]; save(); renderChrome(); render(); toast(THEMES[S.theme][0] + " appearance"); };
$("#avatarBtn").onclick = openSettings;
$("#searchBtn").onclick = () => { journalTab = "entries"; go("journal"); setTimeout(() => { const i = $("#jSearch"); if(i) i.focus(); }, 60); };

function go(v){
  view = v;
  try{ sessionStorage.setItem("streak-view", v); }catch(e){}
  renderChrome(); render();
  window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});
}
function render(){
  hideHl();
  const el = document.createElement("div");
  $("#view").replaceChildren(el);
  if(view === "calendar") el.innerHTML = calendarView();
  else if(view === "insights") el.innerHTML = insightsView();
  else if(view === "journal") el.innerHTML = journalView();
  else { view = "today"; el.innerHTML = todayView(); }
  bindView(el);
}
function refresh(){ renderChrome(); render(); }

// ================= TODAY =================
function greeting(){
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function heroCard(){
  const n = streak(S, today), nx = nextMilestone(n), pv = prevMilestone(n);
  const pct = Math.round((n - pv) / Math.max(nx - pv, 1) * 100);
  const risk = streakAtRisk(S, today);
  const fn = firstName();
  return `<section class="card hero">
    <svg class="flame ${n ? "" : "cold"}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset=".6" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ffd36b"/></linearGradient></defs>
      <path class="core" fill="url(#fl)" d="M24 4c2 7 10 11 10 22a10 10 0 1 1-20 0c0-5 3-8 4-11 1 4 3 6 5 6-1-6-1-11 1-17z"/></svg>
    <div class="greet">${greeting()}${fn ? ", " + esc(fn) : ""}</div>
    <div class="streak-wrap">
      <div class="streak-n num" aria-label="${n} day streak">${n}</div>
      <div class="streak-l"><div class="a">day streak</div><div class="b">${n ? "Longest ever: " + longestStreak(S) + " days" : "Every streak starts with one day."}</div></div>
    </div>
    <div class="milestone">
      <div class="ms-top"><span>Next milestone · <b>${nx} days</b></span><span>${nx - n} to go</span></div>
      <div class="track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    </div>
    ${risk ? `<div class="risk">${ic("alert","sm")}<span>Log today to keep your <b>${n}-day</b> streak alive.</span></div>` : ""}
  </section>`;
}
function dayEditor(k, nav){
  const o = dayObj(k), isToday = k === today, future = k > today;
  const r = o.rating;
  return `<section class="card" data-editor="${k}">
    <div class="daynav">
      ${nav ? `<button class="iconbtn press" data-act="prev" aria-label="Previous day">${ic("chevL","sm")}</button>` : ""}
      <div class="d">
        <div class="eyebrow">${isToday ? "Today" : future ? "Upcoming" : fromIso(k).getFullYear() !== fromIso(today).getFullYear() ? fromIso(k).getFullYear() : "Looking back"}</div>
        <div class="h2">${esc(niceDate(k))}</div>
      </div>
      ${nav ? `${!isToday ? `<button class="chip press" data-act="today">Today</button>` : ""}<button class="iconbtn press" data-act="next" aria-label="Next day" ${k >= today ? "disabled" : ""}>${ic("chevR","sm")}</button>` : ""}
    </div>
    <div class="status" role="group" aria-label="How did the day go">
      ${["full","partial","missed"].map(st => `<button class="st ${st} press ${o.status === st ? "on" : ""}" data-st="${st}" aria-pressed="${o.status === st}">
        <span class="dot">${ic(st === "missed" ? "x" : "check","sm")}</span>${STATUS[st][0]}</button>`).join("")}
    </div>
    <div class="sub">
      <div class="sub-head"><span class="h3">Rate the day</span><span class="v ${r == null ? "none" : ""}">${r == null ? "Not rated" : r + "<small class='muted'>/10</small>"}</span></div>
      <div class="scale" role="group" aria-label="Rating out of ten">${Array.from({length:11}, (_, i) =>
        `<button class="press ${r === i ? "on" : r != null && i < r ? "in" : ""}" data-rate="${i}" aria-pressed="${r === i}">${i}</button>`).join("")}</div>
    </div>
    <div class="sub">
      <div class="sub-head"><span class="h3">Mood</span></div>
      <div class="moods">${MOODS.map(([e, t], i) => `<button class="mood press ${o.mood === i ? "on" : ""}" data-mood="${i}" aria-pressed="${o.mood === i}"><span class="e">${e}</span>${t}</button>`).join("")}</div>
    </div>
    <div class="sub">
      <div class="note-tools">
        <div class="seg"><button class="${noteTab === "daily" ? "on" : ""}" data-notetab="daily">Daily notes</button><button class="${noteTab === "other" ? "on" : ""}" data-notetab="other">Other things</button></div>
      </div>
      <div class="note-wrap">
        <button class="chip on press selq hidden" data-act="selq">${ic("sparkle","xs")} Add to quotes</button>
        <textarea class="input" data-note rows="4" placeholder="${noteTab === "daily" ? "What happened, what you learned, how it felt…" : "Goals, ideas, anything you want to keep in view…"}">${esc(noteTab === "daily" ? (o.note || "") : (S.otherNotes || ""))}</textarea>
      </div>
      <div class="note-meta"><span>${noteTab === "daily" ? "Notes for " + esc(niceDate(k, {month:"long", day:"numeric"})) : "Kept across every day"}</span><span data-wc></span></div>
    </div>
  </section>`;
}
function bannerScene(night){
  if(night) return `<svg class="scene" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0806"/><stop offset=".45" stop-color="#27110a"/><stop offset=".8" stop-color="#5c250d"/><stop offset="1" stop-color="#8a3a10"/></linearGradient>
    <radialGradient id="nhal" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9c45" stop-opacity=".95"/><stop offset=".4" stop-color="#ff7b2d" stop-opacity=".55"/><stop offset="1" stop-color="#ff7b2d" stop-opacity="0"/></radialGradient>
    <g id="pn"><polygon points="0,-44 12,-19 6,-19 16,2 8,2 19,24 -19,24 -8,2 -16,2 -6,-19 -12,-19" fill="#0f0703"/><rect x="-2.5" y="24" width="5" height="9" fill="#0a0502"/></g></defs>
    <rect width="600" height="240" fill="url(#nsky)"/><circle cx="440" cy="178" r="90" fill="url(#nhal)"/><circle cx="440" cy="178" r="28" fill="#ff8c3a"/><circle cx="440" cy="178" r="21" fill="#ffb066"/>
    <path d="M0,184 L60,160 120,180 200,146 280,184 350,166 410,190 600,172 600,240 0,240Z" fill="#2e1408" opacity=".85"/>
    <path d="M0,202 L80,180 170,202 290,174 400,206 600,192 600,240 0,240Z" fill="#1c0c05"/><path d="M0,222 L120,208 260,224 420,210 600,222 600,240 0,240Z" fill="#120703"/>
    <use href="#pn" transform="translate(524,180) scale(1.2)"/><use href="#pn" transform="translate(566,166) scale(1.6)"/><use href="#pn" transform="translate(486,196) scale(.82)"/><use href="#pn" transform="translate(546,204) scale(.62)"/>
    <g fill="#ffd9ad"><circle cx="80" cy="40" r="1.1" opacity=".7"/><circle cx="150" cy="22" r=".8" opacity=".5"/><circle cx="240" cy="52" r="1" opacity=".6"/><circle cx="330" cy="18" r=".7" opacity=".45"/><circle cx="40" cy="96" r=".8" opacity=".5"/><circle cx="380" cy="70" r=".9" opacity=".5"/></g></svg>`;
  return `<svg class="scene" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3e6"/><stop offset=".55" stop-color="#fbdcb8"/><stop offset="1" stop-color="#f5bd8c"/></linearGradient>
    <radialGradient id="dhal" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7e6" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe2b3" stop-opacity=".6"/><stop offset="1" stop-color="#ffe2b3" stop-opacity="0"/></radialGradient>
    <g id="pd"><polygon points="0,-44 12,-19 6,-19 16,2 8,2 19,24 -19,24 -8,2 -16,2 -6,-19 -12,-19" fill="#a86b45"/><rect x="-2.5" y="24" width="5" height="9" fill="#92583a"/></g></defs>
    <rect width="600" height="240" fill="url(#dsky)"/><circle cx="440" cy="180" r="80" fill="url(#dhal)"/><circle cx="440" cy="180" r="24" fill="#ffedc9"/>
    <path d="M0,186 L70,164 140,182 220,152 300,186 370,172 430,192 600,176 600,240 0,240Z" fill="#e8b78c" opacity=".75"/>
    <path d="M0,204 L90,184 180,204 300,180 410,206 600,194 600,240 0,240Z" fill="#d9a173" opacity=".85"/><ellipse cx="180" cy="232" rx="240" ry="16" fill="#fff" opacity=".3"/>
    <use href="#pd" transform="translate(524,180) scale(1.2)"/><use href="#pd" transform="translate(566,166) scale(1.6)"/><use href="#pd" transform="translate(486,196) scale(.82)"/></svg>`;
}
function bannerCard(){
  const v = S.activeView === "book" ? "book" : "quote";
  const bg = v === "quote" ? S.quoteBg : S.recallBg;
  const fit = (v === "quote" ? S.quoteBgFit : S.recallBgFit) || "cover";
  const night = S.theme === "night";
  const cls = bg ? "custom" : night ? "" : "day";
  const bgEl = bg ? `<div class="bg" style="background-image:url('${esc(bg)}');background-size:${{cover:"cover", contain:"contain", fill:"100% 100%"}[fit] || "cover"}"></div>` : bannerScene(night);
  let body;
  if(v === "quote"){
    const [qt, qa] = dailyQuote(S, QUOTES, today);
    body = `<div class="quote"><div class="q">“${esc(qt)}”</div>${qa ? `<div class="a">${esc(qa)}</div>` : ""}</div>`;
  } else {
    const cur = currentChapterRef(S);
    if(!allChapters(S).length || !cur){
      body = `<div class="rc-empty">${allChapters(S).length ? "Choose a chapter to recall." : "Paste a whole book — the first line becomes its title and lines like “Chapter 1” start new chapters. Each chapter becomes a recall card, and one is suggested every time you open the app."}</div>`;
    } else {
      const h = S.recallHeight ? ` style="max-height:${Math.max(80, +S.recallHeight)}px"` : "";
      body = `<div class="recall"><div class="bk">${ic("bookmark","xs")}${esc(cleanTitle(cur.b.title))} — ${esc(cur.c.name)}</div>
        <div class="rc-text" id="rcText"${h}>${renderHighlighted(cur.c.text, cur.c.highlights)}</div>
        <div class="rc-drag" id="rcDrag" aria-hidden="true"><i></i></div></div>`;
    }
  }
  const btns = v === "quote"
    ? `<button class="gbtn press" data-act="shuffle" aria-label="Random quote">${ic("shuffle","sm")}</button><button class="gbtn press" data-act="addquote" aria-label="Add your own quote">${ic("plus","sm")}</button>`
    : `<button class="gbtn press" data-act="addbook" aria-label="Add a book">${ic("plus","sm")}</button><button class="gbtn press" data-act="pickbook" aria-label="Choose book and chapter">${ic("list","sm")}</button>`;
  return `<section class="banner ${cls}">${bgEl}
    <div class="banner-top"><div class="glass-seg"><button class="${v === "quote" ? "on" : ""}" data-bview="quote">${ic("quote","xs")} Quote</button><button class="${v === "book" ? "on" : ""}" data-bview="book">${ic("book","xs")} Book recall</button></div><span class="spacer"></span>${btns}</div>
    ${body}</section>`;
}
function weekCard(){
  const L = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const row = weekRow(S, today);
  const won = row.filter(x => x.cls === "full" || x.cls === "partial").length;
  return `<section class="card"><div class="card-head"><span class="h3">${ic("flame","sm")} This week</span><span class="tiny muted">${won} of ${row.filter(x => x.k <= today).length} days won</span></div>
    <div class="week">${row.map((x, i) => `<button class="press ${x.k === selected ? "sel" : ""}" data-pick="${x.k}" ${x.k > today ? "disabled" : ""} aria-label="${esc(niceDate(x.k))}">
      <div class="l">${L[i]}</div><div class="n">${x.date}</div><div class="c ${x.cls}">${x.cls === "full" || x.cls === "partial" ? ic("check","xs") : x.cls === "missed" ? ic("x","xs") : ""}</div></button>`).join("")}</div></section>`;
}
function yearCard(){
  const y = yearStats(S, today);
  return `<section class="card"><div class="card-head"><span class="h3">${ic("trophy","sm")} ${fromIso(today).getFullYear()} so far</span><span class="tiny muted">${y.total} days</span></div>
    <div class="ystats">
      <div class="ys"><div class="n">${y.full}</div><div class="k"><i style="background:var(--win)"></i>Conquered</div><div class="p">${y.pf}%</div></div>
      <div class="ys"><div class="n">${y.part}</div><div class="k"><i style="background:var(--part)"></i>Partial</div><div class="p">${y.pp}%</div></div>
      <div class="ys"><div class="n">${y.miss}</div><div class="k"><i style="background:var(--miss)"></i>Defeated</div><div class="p">${y.pm}%</div></div>
    </div>
    <div class="ybar"><i style="width:${y.pf}%;background:var(--win)"></i><i style="width:${y.pp}%;background:var(--part)"></i><i style="width:${y.pm}%;background:var(--miss)"></i></div>
    <p class="tiny muted" style="margin-top:10px">Days you didn’t log count as defeated, same as before.</p></section>`;
}
function backupFoot(){
  const n = Object.values(S.days).filter(o => o.status).length;
  if(!n) return "";
  const last = S.lastBackupAt ? new Date(S.lastBackupAt) : null;
  const daysAgo = last ? Math.floor((Date.now() - last) / 86400000) : null;
  const txt = !last ? "Not backed up to a file yet" : daysAgo === 0 ? "Backed up today" : "Last backup " + daysAgo + " day" + (daysAgo === 1 ? "" : "s") + " ago";
  return `<div class="foot">${ic("shield","xs")} Saved on this device · ${txt} · <button data-act="backup">Back up now</button></div>`;
}
function todayView(){
  return `<div class="view"><div class="today-grid">
    <div class="stack">${heroCard()}${dayEditor(selected, true)}</div>
    <div class="stack">${bannerCard()}${weekCard()}${yearCard()}</div>
  </div>${backupFoot()}</div>`;
}

// ---- day editor behaviour (shared by Today and the calendar sheet) ----
function bindEditor(root, getK, onChange){
  const k = () => getK();
  const ta = $("[data-note]", root);
  const wc = $("[data-wc]", root);
  const selBtn = $("[data-act=selq]", root);
  const fit = () => { ta.style.height = "auto"; ta.style.height = Math.max(110, ta.scrollHeight + 2) + "px"; const w = (ta.value.trim().match(/\S+/g) || []).length; wc.textContent = w ? w + " word" + (w === 1 ? "" : "s") : ""; };
  fit();
  ta.addEventListener("input", () => {
    if(noteTab === "daily"){
      if(k() > today && ta.value){ /* notes for upcoming days are fine — plans */ }
      day(k()).note = ta.value;
    } else S.otherNotes = ta.value;
    save(); fit();
  });
  let sel = "";
  const checkSel = () => { sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim(); selBtn.classList.toggle("hidden", sel.length < 2); };
  ["select","keyup","mouseup","touchend"].forEach(ev => ta.addEventListener(ev, () => setTimeout(checkSel, 0)));
  ta._checkSel = checkSel;
  ta.addEventListener("blur", () => setTimeout(() => selBtn.classList.add("hidden"), 250));
  selBtn.addEventListener("pointerdown", e => e.preventDefault());
  selBtn.addEventListener("click", () => {
    if(!sel) return;
    S.customQuotes.push([sel, S.name || "Me"]); save();
    selBtn.classList.add("hidden");
    toast("Added to your daily quotes", {action:"Undo", fn: () => { S.customQuotes.pop(); save(); }});
  });
  root.addEventListener("click", e => {
    const t = e.target.closest("button"); if(!t || !root.contains(t)) return;
    if(t.dataset.st) return setStatus(k(), t.dataset.st, onChange);
    if(t.dataset.rate != null){
      if(k() > today) return toast("Can’t rate a day that hasn’t happened yet");
      const o = day(k()), v = +t.dataset.rate; o.rating = o.rating === v ? null : v; save(); return onChange();
    }
    if(t.dataset.mood != null){ const o = day(k()), v = +t.dataset.mood; o.mood = o.mood === v ? null : v; save(); return onChange(); }
    if(t.dataset.notetab){ noteTab = t.dataset.notetab; return onChange(true); }
  });
}
function setStatus(k, st, onChange){
  if(k > today) return toast("Can’t log a future day yet");
  const before = streak(S, today);
  const o = day(k), prev = o.status;
  o.status = o.status === st ? null : st;
  save(); onChange(); renderChrome();
  const after = streak(S, today);
  const undo = {action:"Undo", fn: () => { day(k).status = prev; save(); onChange(); renderChrome(); }};
  if(after > before && MILESTONES.includes(after)){ celebrate(); toast(`${after}-day milestone. Remarkable.`, undo); }
  else if(o.status === "full") toast(`Conquered — streak: ${after} day${after === 1 ? "" : "s"}`, undo);
  else if(o.status === "partial") toast("Partial win — it still counts", undo);
  else if(o.status === "missed") toast("Defeated today. The comeback starts tomorrow.", undo);
  else toast("Cleared", undo);
}

function bindView(el){
  const editor = $("[data-editor]", el);
  if(editor && view === "today"){
    bindEditor(editor, () => selected, (soft) => { render(); });
    editor.addEventListener("click", e => {
      const a = e.target.closest("[data-act]"); if(!a) return;
      if(a.dataset.act === "prev"){ selected = addDays(selected, -1); render(); }
      if(a.dataset.act === "next" && selected < today){ selected = addDays(selected, 1); render(); }
      if(a.dataset.act === "today"){ selected = today; render(); }
    });
  }
  el.addEventListener("click", e => {
    const t = e.target.closest("button"); if(!t) return;
    if(t.dataset.pick){ selected = t.dataset.pick; render(); const ed = $("[data-editor]"); if(ed && window.innerWidth < 860) ed.scrollIntoView({behavior:"smooth", block:"start"}); return; }
    if(t.dataset.bview){ S.activeView = t.dataset.bview; save(); return render(); }
    const act = t.dataset.act;
    if(act === "shuffle"){
      const q = allQuotes(S, QUOTES), cur = dailyQuote(S, QUOTES, today)[0];
      let pick = q[Math.floor(Math.random()*q.length)], g = 0;
      while(pick[0] === cur && g++ < 20) pick = q[Math.floor(Math.random()*q.length)];
      S.quoteOverride = {date:today, text:pick[0], author:pick[1]}; save(); render();
    }
    else if(act === "addquote") openAddQuote();
    else if(act === "addbook") openAddBook();
    else if(act === "pickbook") openBookPicker();
    else if(act === "backup") exportBackup();
    else if(act === "openday") openDay(t.dataset.k);
    else if(act === "delquote") deleteQuote(+t.dataset.i);
    else if(act === "openbook") openChapters(+t.dataset.i);
    else if(act === "go") go(t.dataset.v);
  });
  if(view === "today") bindRecall();
  if(view === "calendar") bindCalendar(el);
  if(view === "journal") bindJournal(el);
}

// ---- book recall: resize handle + highlighter ----
function bindRecall(){
  const box = $("#rcText"), handle = $("#rcDrag");
  if(!box || !handle) return;
  let y0 = 0, h0 = 0, drag = false;
  handle.addEventListener("pointerdown", e => { drag = true; y0 = e.clientY; h0 = box.offsetHeight; handle.setPointerCapture(e.pointerId); e.preventDefault(); });
  handle.addEventListener("pointermove", e => { if(drag) box.style.maxHeight = Math.max(80, h0 + e.clientY - y0) + "px"; });
  const end = () => { if(!drag) return; drag = false; S.recallHeight = box.offsetHeight; save(); };
  handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
  box.addEventListener("click", e => {
    const m = e.target.closest("mark"); if(!m) return;
    if(!window.getSelection().isCollapsed) return;
    const cur = currentChapterRef(S); if(!cur) return;
    const idx = +m.dataset.h, removed = cur.c.highlights[idx];
    toast("Remove this highlight?", {action:"Remove", fn: () => { const c = currentChapterRef(S); if(!c) return; const i = c.c.highlights.indexOf(removed); if(i >= 0){ c.c.highlights.splice(i, 1); save(); render(); } }});
  });
}
let hlRange = null;
const hlMenu = $("#hlMenu");
function hideHl(){ hlMenu.classList.add("hidden"); hlRange = null; }
document.addEventListener("selectionchange", () => {
  const ae = document.activeElement;
  if(ae && ae._checkSel) ae._checkSel();
  const box = $("#rcText");
  const sel = window.getSelection();
  if(!box || !sel || sel.isCollapsed || !sel.rangeCount){ if(!hlMenu.contains(document.activeElement)) setTimeout(() => { const s = window.getSelection(); if(!s || s.isCollapsed) hideHl(); }, 150); return; }
  const range = sel.getRangeAt(0);
  if(!box.contains(range.commonAncestorContainer)) return hideHl();
  // plain-text offsets inside the chapter
  const pre = document.createRange(); pre.selectNodeContents(box); pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length, end = start + range.toString().length;
  if(end <= start) return hideHl();
  hlRange = {start, end};
  const r = range.getBoundingClientRect();
  hlMenu.classList.remove("hidden");
  const w = hlMenu.offsetWidth, h = hlMenu.offsetHeight;
  hlMenu.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width/2 - w/2)) + "px";
  hlMenu.style.top = (r.top > h + 70 ? r.top - h - 10 : r.bottom + 10) + "px";
});
$$("button", hlMenu).forEach(b => {
  const apply = e => {
    e.preventDefault();
    const cur = currentChapterRef(S);
    if(!hlRange || !cur) return hideHl();
    cur.c.highlights.push({start:hlRange.start, end:hlRange.end, color:b.dataset.color});
    save();
    try{ window.getSelection().removeAllRanges(); }catch(err){}
    hideHl(); render();
  };
  b.addEventListener("pointerdown", apply);
});

// ================= CALENDAR =================
function dayStyle(k){
  const o = S.days[k];
  if(!o || k > today) return {cls:"", style:""};
  if(S.calendarMode === "rating"){
    if(o.rating == null) return {cls:"", style:""};
    const p = 18 + Math.round(o.rating / 10 * 82);
    return {cls:"", style:`background:color-mix(in srgb, var(--accent) ${p}%, var(--surface-3));color:${p > 55 ? "#fff" : "var(--text)"};font-weight:700`};
  }
  if(S.calendarMode === "mood"){
    if(o.mood == null) return {cls:"", style:""};
    return {cls:"", style:`background:${MOOD_COL[o.mood]};color:#1d1d1f;font-weight:700`};
  }
  return {cls:o.status || "", style:""};
}
function calendarView(){
  const curY = fromIso(today).getFullYear();
  const mode = S.calendarMode;
  const legend = mode === "status"
    ? `<span><i style="background:var(--win)"></i>Conquered</span><span><i style="background:var(--part)"></i>Partial</span><span><i style="background:var(--miss)"></i>Defeated</span>`
    : mode === "rating"
    ? `<span>0<span class="ramp">${[0,3,5,7,10].map(r => `<i style="background:color-mix(in srgb, var(--accent) ${18 + r*8.2}%, var(--surface-3))"></i>`).join("")}</span>10</span>`
    : MOODS.map(([e, t], i) => `<span><i style="background:${MOOD_COL[i]}"></i>${t}</span>`).join("");
  let months = "";
  for(let m = 0; m < 12; m++){
    const lead = (new Date(viewYear, m, 1).getDay() + 6) % 7, nd = new Date(viewYear, m + 1, 0).getDate();
    let cells = ["M","T","W","T","F","S","S"].map(h => `<div class="dh">${h}</div>`).join("") + '<div class="cd blank"></div>'.repeat(lead);
    let won = 0;
    for(let d = 1; d <= nd; d++){
      const k = viewYear + "-" + String(m+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
      const o = S.days[k];
      if(o && isWin(o.status)) won++;
      const {cls, style} = dayStyle(k);
      const c = ["cd", cls, k === today ? "today" : "", k > today ? "future" : "", o && o.note && o.note.trim() ? "noted" : ""].filter(Boolean).join(" ");
      cells += `<button class="${c}" data-day="${k}" style="${style}" aria-label="${esc(niceDate(k, {weekday:"long", day:"numeric", month:"long", year:"numeric"}))}${o && o.status ? ", " + STATUS[o.status][0] : ""}">${d}</button>`;
    }
    const isCur = viewYear === curY && m === fromIso(today).getMonth();
    months += `<section class="card month ${isCur ? "cur" : ""}"><div class="mh"><b>${MONTHS[m]}</b><span>${won ? won + " won" : ""}</span></div><div class="g7">${cells}</div></section>`;
  }
  return `<div class="view">
    <div class="cal-bar">
      <div class="yearnav"><button class="iconbtn press" data-yr="-1" aria-label="Previous year">${ic("chevL")}</button><span class="y">${viewYear}</span><button class="iconbtn press" data-yr="1" aria-label="Next year">${ic("chevR")}</button>
        ${viewYear !== curY ? `<button class="chip press" data-yr="0">This year</button>` : ""}</div>
      <span class="spacer"></span>
      <div class="seg" role="group" aria-label="Colour days by">${[["status","Status"],["rating","Rating"],["mood","Mood"]].map(([v, l]) => `<button class="${mode === v ? "on" : ""}" data-mode="${v}">${l}</button>`).join("")}</div>
    </div>
    <div class="legend" style="margin:-4px 2px 14px">${legend}<span class="muted">· dot = has a note</span></div>
    <div class="months">${months}</div></div>`;
}
function bindCalendar(el){
  el.addEventListener("click", e => {
    const t = e.target.closest("button"); if(!t) return;
    if(t.dataset.yr != null){ const d = +t.dataset.yr; viewYear = d === 0 ? fromIso(today).getFullYear() : viewYear + d; return render(); }
    if(t.dataset.mode){ S.calendarMode = t.dataset.mode; save(); return render(); }
    if(t.dataset.day) openDay(t.dataset.day);
  });
}
function openDay(k){
  selected = k;
  let key = k;
  const sh = openSheet({ title: "", html: "" });
  const draw = () => {
    sh.body.innerHTML = dayEditor(key, false).replace('class="card"', 'class=""')
      + `<div class="row" style="margin-top:18px"><button class="btn ghost press" data-dn="-1">${ic("chevL","sm")} Previous</button><span class="spacer"></span><button class="btn ghost press" data-dn="1" ${key >= today ? "disabled" : ""}>Next ${ic("chevR","sm")}</button></div>`;
    const ed = $("[data-editor]", sh.body);
    bindEditor(ed, () => key, () => { draw(); render(); renderChrome(); });
  };
  sh.body.addEventListener("click", e => { const b = e.target.closest("[data-dn]"); if(!b) return; key = addDays(key, +b.dataset.dn); selected = key; draw(); });
  draw();
  sh.onClose = () => render();
}

// ================= INSIGHTS =================
function lineChart(points){
  const W = 640, H = 170, L = 26, R = 8, T = 10, B = 24;
  const x = i => L + i / (points.length - 1) * (W - L - R), y = v => T + (1 - v / 10) * (H - T - B);
  let segs = [], cur = [];
  points.forEach((p, i) => { if(p.v == null){ if(cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(p.v), p]); });
  if(cur.length) segs.push(cur);
  const grid = [0,5,10].map(v => `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)" ${v ? 'stroke-dasharray="3 4"' : ""}/><text class="axis" x="${L-8}" y="${y(v)+3.5}" text-anchor="end">${v}</text>`).join("");
  const lab = [0, 14, 29].map(i => `<text class="axis" x="${x(i)}" y="${H-6}" text-anchor="${i === 0 ? "start" : i === 29 ? "end" : "middle"}">${esc(niceDate(points[i].k, {day:"numeric", month:"short"}))}</text>`).join("");
  const paths = segs.map(s => {
    const d = s.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const area = s.length > 1 ? `<path d="${d} L${s[s.length-1][0].toFixed(1)},${y(0)} L${s[0][0].toFixed(1)},${y(0)}Z" fill="url(#ar)"/>` : "";
    return area + `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
      + s.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"><title>${esc(niceDate(p[2].k, {day:"numeric", month:"short"}))}: ${p[2].v}/10</title></circle>`).join("");
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Day ratings over the last 30 days"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>${grid}${lab}${paths}</svg>`;
}
function insightsView(){
  const I = insights(S, today);
  if(!I.totalLogged) return `<div class="view"><div class="card empty"><div class="h2">Insights appear as you log</div>Mark a few days Conquered, Partial or Defeated and rate them — your momentum, patterns and milestones show up here.<div style="margin-top:16px"><button class="btn primary press" data-act="go" data-v="today">Log today</button></div></div></div>`;
  const m = momentum(S, today, 0), mp = momentum(S, today, 7), diff = m - mp;
  const col = m >= 67 ? "var(--win)" : m >= 34 ? "var(--part)" : "var(--miss)";
  const C = 2 * Math.PI * 52;
  const n = streak(S, today), longest = longestStreak(S);
  const kp = (v, l) => `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  const wl = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const bestIdx = I.weekdayRates.reduce((b, v, i) => v != null && (b < 0 || v > I.weekdayRates[b]) ? i : b, -1);
  const moMax = Math.max(1, ...I.moS), curM = fromIso(today).getMonth();
  const moodMax = Math.max(1, ...I.moods);
  const facts = [];
  if(I.winAvg != null && I.lossAvg != null) facts.push(["sparkle", `Days you won averaged <b>${I.winAvg.toFixed(1)}/10</b>; the rest averaged <b>${I.lossAvg.toFixed(1)}/10</b>.`]);
  else if(I.winAvg != null) facts.push(["sparkle", `Your winning days average <b>${I.winAvg.toFixed(1)}/10</b>.`]);
  if(bestIdx >= 0) facts.push(["calendar", `<b>${wl[bestIdx]}</b> is your strongest day — won ${I.weekdayRates[bestIdx]}% of the ${wl[bestIdx]}s you logged.`]);
  if(I.bestMonth) facts.push(["trophy", `Best month this year: <b>${I.bestMonth}</b>, with ${I.bestMonthN} conquered day${I.bestMonthN === 1 ? "" : "s"}.`]);
  if(I.topMood != null) facts.push(["user", `Most logged mood: <b>${MOODS[I.topMood][0]} ${MOODS[I.topMood][1]}</b> (${I.moods[I.topMood]} day${I.moods[I.topMood] === 1 ? "" : "s"}).`]);
  if(I.firstDay) facts.push(["history", `Journal started <b>${esc(niceDate(I.firstDay, {day:"numeric", month:"long", year:"numeric"}))}</b> — ${I.totalLogged} days logged, ${I.notesCount} with notes.`]);
  const nx = nextMilestone(longest); // first milestone not yet earned
  const badges = MILESTONES.filter(x => x <= Math.max(365, nx)).map(x => {
    const got = longest >= x, isNext = x === nx;
    return `<div class="bdg ${got ? "got" : isNext ? "next" : ""}"><div class="m">${x}</div><span>${got ? "Earned" : isNext ? (x - n) + " to go" : "Locked"}</span></div>`;
  }).join("");
  return `<div class="view">
    <div class="row" style="margin:2px 2px 16px"><div><div class="eyebrow">Insights</div><div class="h1">How you’re <em>trending</em></div></div></div>
    <div class="ins-grid">
      <section class="card wide"><div class="mom">
        <div class="gauge"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-3)" stroke-width="11"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(C*m/100).toFixed(1)} ${C.toFixed(1)}" style="transition:stroke-dasharray 1s var(--ease)"/></svg>
          <div class="v"><b style="color:${col}">${m}</b><span>MOMENTUM</span></div></div>
        <div><div class="h2">${momentumWord(m)}</div>
          <p class="small muted" style="margin-top:6px;max-width:460px">Your last 7 days — wins, day ratings and current streak blended into one recovery-style score out of 100.</p>
          <span class="delta ${diff > 0 ? "up" : diff < 0 ? "down" : "flat"}">${diff > 0 ? "▲ +" + diff : diff < 0 ? "▼ " + diff : "— level"} vs last week</span></div>
      </div></section>
      <div class="kpis wide">
        ${kp(n + "<small> d</small>", "Current streak")}${kp(longest + "<small> d</small>", "Longest streak")}
        ${kp(I.avg != null ? I.avg.toFixed(1) : "–", "Average rating")}${kp(I.bestW || "–", "Strongest day")}
        ${kp(I.rate30 + "<small>%</small>", "Won · last 30 days")}${kp(I.totalLogged, "Days logged")}
      </div>
      <section class="card wide chart"><div class="card-head"><span class="h3">${ic("chart","sm")} Rating · last 30 days</span><span class="tiny muted">${I.spark.filter(p => p.v != null).length} rated</span></div>
        ${I.spark.some(p => p.v != null) ? lineChart(I.spark) : `<div class="empty">Rate your days to see your trend.</div>`}</section>
      <section class="card"><div class="card-head"><span class="h3">${ic("calendar","sm")} Success by weekday</span></div>
        <div class="bars">${I.weekdayRates.map((v, i) => `<div class="b"><em>${v == null ? "–" : v + "%"}</em><i class="${v == null ? "dim" : i === bestIdx ? "best" : ""}" style="height:${v == null ? 3 : Math.max(v, 3)}%"></i><span>${wl[i][0]}</span></div>`).join("")}</div></section>
      <section class="card"><div class="card-head"><span class="h3">${ic("user","sm")} Mood pattern</span></div>
        <div class="moodbars">${MOODS.map(([e, t], i) => `<div class="mb"><span class="e">${e}</span><span>${t}</span><span class="t"><i style="width:${I.moods[i] / moodMax * 100}%;background:${MOOD_COL[i]}"></i></span><b>${I.moods[i]}</b></div>`).join("")}</div></section>
      <section class="card wide"><div class="card-head"><span class="h3">${ic("trophy","sm")} Conquered by month · ${fromIso(today).getFullYear()}</span></div>
        <div class="bars">${I.moS.map((v, i) => `<div class="b"><em>${v || ""}</em><i class="${i > curM ? "dim" : ""}" style="height:${i > curM ? 3 : Math.max(v / moMax * 100, 3)}%"></i><span>${MONTHS[i][0]}</span></div>`).join("")}</div></section>
      <section class="card"><div class="card-head"><span class="h3">${ic("sparkle","sm")} What the data says</span></div><div class="facts">${facts.map(([i, t]) => `<div class="fact">${ic(i,"sm")}<span>${t}</span></div>`).join("") || '<div class="muted small">Keep logging — patterns need a little more data.</div>'}</div></section>
      <section class="card"><div class="card-head"><span class="h3">${ic("flame","sm")} Milestones</span><span class="tiny muted">by longest streak</span></div><div class="badges">${badges}</div></section>
    </div></div>`;
}

// ================= JOURNAL =================
function highlightMatch(text, q){
  const t = esc(text); if(!q.trim()) return t;
  const needle = esc(q.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return t.replace(new RegExp(needle, "gi"), m => `<mark>${m}</mark>`);
}
function journalView(){
  const tabs = `<div class="seg" role="tablist">${[["entries","Entries"],["quotes","Quotes"],["books","Books"]].map(([v, l]) => `<button class="${journalTab === v ? "on" : ""}" data-jtab="${v}">${l}</button>`).join("")}</div>`;
  let body = "";
  if(journalTab === "entries"){
    const list = searchNotes(S, query);
    const other = (S.otherNotes || "").trim();
    body = `<div class="j-bar"><div class="search">${ic("search","sm")}<input class="input" id="jSearch" type="search" placeholder="Search your notes" value="${esc(query)}" aria-label="Search notes"></div>${tabs}</div>
      ${other && !query ? `<section class="card" style="margin-bottom:10px"><div class="card-head"><span class="h3">${ic("note","sm")} Other things</span><button class="chip press" data-act="go" data-v="today">Edit</button></div><div class="small" style="white-space:pre-wrap">${esc(other)}</div></section>` : ""}
      <div class="entries" id="jList">${entriesHtml(list)}</div>`;
  } else if(journalTab === "quotes"){
    const qs = S.customQuotes || [];
    body = `<div class="j-bar"><div><div class="h3">Your quotes</div><div class="tiny muted">${qs.length} yours + ${QUOTES.length} built-in, all in the daily rotation</div></div><span class="spacer"></span>${tabs}</div>
      <div class="row" style="margin-bottom:12px"><button class="btn primary press" data-act="addquote">${ic("plus","sm")} Add quote</button><button class="btn ghost press" id="mailQuotes">${ic("mail","sm")} Email them to me</button></div>
      ${qs.length ? `<div class="qitems">${qs.map((q, i) => { const [t, a] = typeof q === "string" ? [q, ""] : q; return `<div class="card qi"><div class="q">“${esc(t)}”</div>${a ? `<div class="a">— ${esc(a)}</div>` : ""}<button class="iconbtn press x" data-act="delquote" data-i="${i}" aria-label="Delete quote">${ic("trash","sm")}</button></div>`; }).join("")}</div>`
        : `<div class="card empty"><div class="h2">No quotes yet</div>Add one from a book you’re reading, or select text in a daily note and tap “Add to quotes”.</div>`}`;
  } else {
    const books = S.books || [];
    const cover = s => { let h = 0; for(const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const a = h % 360; return `linear-gradient(150deg,hsl(${a} 42% 42%),hsl(${(a+40)%360} 48% 28%))`; };
    body = `<div class="j-bar"><div><div class="h3">Book recall library</div><div class="tiny muted">${books.length} book${books.length === 1 ? "" : "s"} · ${allChapters(S).length} chapters</div></div><span class="spacer"></span>${tabs}</div>
      <div class="row" style="margin-bottom:12px"><button class="btn primary press" data-act="addbook">${ic("plus","sm")} Paste a book</button></div>
      ${books.length ? `<div class="books">${books.map((b, i) => `<button class="card book press" data-act="openbook" data-i="${i}"><div class="cover" style="background:${cover(b.title)}"><span>${esc(cleanTitle(b.title))}</span><small>${(b.chapters||[]).length} chapter${(b.chapters||[]).length === 1 ? "" : "s"}</small></div><div class="meta">${(b.chapters||[]).reduce((n, c) => n + (c.highlights||[]).length, 0)} highlights</div></button>`).join("")}</div>`
        : `<div class="card empty"><div class="h2">No books yet</div>Paste a whole book or your notes from one. Each chapter becomes a card you can recall and highlight.</div>`}`;
  }
  return `<div class="view"><div style="margin:2px 2px 16px"><div class="eyebrow">Journal</div><div class="h1">Everything you’ve <em>kept</em></div></div>${body}</div>`;
}
function entriesHtml(list){
  if(!list.length) return `<div class="card empty">${query ? "No notes match “" + esc(query) + "”." : "Your daily notes will collect here."}</div>`;
  return list.slice(0, 300).map(e => {
    const d = fromIso(e.k);
    return `<button class="card entry press" data-act="openday" data-k="${e.k}">
      <div class="dt"><b>${d.getDate()}</b><span>${d.toLocaleDateString(undefined, {month:"short"})}</span><span style="display:block">${d.getFullYear() !== fromIso(today).getFullYear() ? d.getFullYear() : ""}</span></div>
      <div><div class="tx">${highlightMatch(e.note, query)}</div>
      <div class="mt">${esc(d.toLocaleDateString(undefined, {weekday:"long"}))}${e.status ? ` · <span class="pill-st"><i style="background:${STATUS[e.status][1]}"></i>${STATUS[e.status][0]}</span>` : ""}${e.rating != null ? " · " + e.rating + "/10" : ""}${e.mood != null ? " · " + MOODS[e.mood][0] : ""}</div></div></button>`;
  }).join("");
}
function bindJournal(el){
  el.addEventListener("click", e => { const t = e.target.closest("[data-jtab]"); if(t){ journalTab = t.dataset.jtab; render(); } });
  const s = $("#jSearch");
  if(s) s.addEventListener("input", () => { query = s.value; $("#jList").innerHTML = entriesHtml(searchNotes(S, query)); });
  const mq = $("#mailQuotes");
  if(mq) mq.onclick = () => {
    const qs = S.customQuotes || []; if(!qs.length) return toast("No quotes to send yet");
    const body = qs.map(q => typeof q === "string" ? "“" + q + "”" : "“" + q[0] + "” — " + q[1]).join("\n\n");
    location.href = "mailto:" + encodeURIComponent(S.email || "") + "?subject=" + encodeURIComponent("My Streak quotes") + "&body=" + encodeURIComponent(body);
  };
}
function deleteQuote(i){
  const q = S.customQuotes[i]; if(q === undefined) return;
  S.customQuotes.splice(i, 1); save(); render();
  toast("Quote deleted", {action:"Undo", fn: () => { S.customQuotes.splice(i, 0, q); save(); render(); }});
}

// ================= sheets =================
const sheets = [];
function openSheet({title, html, wide}){
  const z = 60 + sheets.length * 3;
  const scrim = document.createElement("div"); scrim.className = "scrim"; scrim.style.zIndex = z;
  const el = document.createElement("div"); el.className = "sheet"; el.style.zIndex = z + 1;
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="grab"></div><div class="sheet-head"><div class="h2">${title || ""}</div><button class="iconbtn press" data-close aria-label="Close">${ic("x")}</button></div><div class="sheet-body">${html || ""}</div>`;
  document.body.append(scrim, el);
  const prevFocus = document.activeElement;
  const api = { el, body: $(".sheet-body", el), onClose: null, setTitle: t => { $(".sheet-head .h2", el).innerHTML = t; },
    close(){
      const i = sheets.indexOf(api); if(i < 0) return; sheets.splice(i, 1);
      el.classList.remove("in"); scrim.classList.remove("in");
      setTimeout(() => { el.remove(); scrim.remove(); }, 450);
      if(api.onClose) api.onClose();
      if(prevFocus && prevFocus.focus) try{ prevFocus.focus({preventScroll:true}); }catch(e){}
    }};
  if(!title) $(".sheet-head", el).style.marginBottom = "0";
  scrim.onclick = () => api.close();
  $("[data-close]", el).onclick = () => api.close();
  // swipe down to dismiss on phones
  let y0 = null, dy = 0;
  el.addEventListener("touchstart", e => { if(el.scrollTop <= 0 && (e.target.closest(".grab,.sheet-head"))) { y0 = e.touches[0].clientY; el.style.transition = "none"; } }, {passive:true});
  el.addEventListener("touchmove", e => { if(y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = `translateY(${dy}px)`; }, {passive:true});
  el.addEventListener("touchend", () => { if(y0 == null) return; el.style.transition = ""; el.style.transform = ""; if(dy > 110) api.close(); y0 = null; dy = 0; });
  sheets.push(api);
  requestAnimationFrame(() => { scrim.classList.add("in"); el.classList.add("in"); });
  setTimeout(() => { const f = $("input,textarea", api.body); if(f && window.innerWidth > 700) f.focus(); else $("[data-close]", el).focus({preventScroll:true}); }, 60);
  return api;
}
document.addEventListener("keydown", e => { if(e.key === "Escape" && sheets.length) sheets[sheets.length - 1].close(); });

function openAddQuote(){
  const sh = openSheet({title:"Add a quote", html:`<div class="stack">
    <div class="field"><label for="qT">Quote</label><textarea class="input" id="qT" rows="4" placeholder="Something you read in a biography…"></textarea></div>
    <div class="field"><label for="qA">Author / book</label><input class="input" id="qA" placeholder="e.g. Enzo Ferrari — by Brock Yates"></div>
    <button class="btn primary block press" id="qSave">Add and show today</button>
    <p class="tiny muted">Your quotes join the ${QUOTES.length} built-in ones in the daily and shuffle rotation.</p></div>`});
  $("#qSave", sh.el).onclick = () => {
    const t = $("#qT", sh.el).value.trim(); if(!t) return toast("Write the quote first");
    const a = $("#qA", sh.el).value.trim() || S.name || "Me";
    S.customQuotes.push([t, a]); S.quoteOverride = {date:today, text:t, author:a}; S.activeView = "quote";
    save(); sh.close(); render(); toast("Quote added — it’s in the rotation");
  };
}
function openAddBook(){
  const sh = openSheet({title:"Paste a book", html:`<div class="stack">
    <div class="field"><label for="bT">Whole book or notes</label><textarea class="input" id="bT" rows="10" style="min-height:220px" placeholder="Title of the book&#10;&#10;Chapter 1. Beginnings&#10;…&#10;&#10;Chapter 2. …"></textarea></div>
    <div class="row tiny muted" id="bInfo">First line becomes the title. “Chapter 1”, “Part II”, “CHAPTER ONE”… start new chapters.</div>
    <button class="btn primary block press" id="bSave">Split into chapters & add</button></div>`});
  const ta = $("#bT", sh.el), info = $("#bInfo", sh.el);
  ta.addEventListener("input", () => { const raw = ta.value.trim(); if(!raw){ return; } const p = parseBook(raw); info.textContent = `“${cleanTitle(p.title)}” · ${p.chapters.length} chapter${p.chapters.length === 1 ? "" : "s"} detected`; });
  $("#bSave", sh.el).onclick = () => {
    const raw = ta.value.trim(); if(!raw) return toast("Paste a book first");
    const p = parseBook(raw); if(!p.chapters.length) return toast("Couldn’t find any text to split into chapters");
    S.books.push(p); S.recallSelected = {bookIdx:S.books.length - 1, chapterIdx:0}; S.recallAuto = null; S.activeView = "book";
    save(); sh.close(); render(); toast(`“${cleanTitle(p.title)}” added — ${p.chapters.length} chapter${p.chapters.length === 1 ? "" : "s"}`);
  };
}
function openBookPicker(){
  if(!S.books.length) return openAddBook();
  if(S.books.length === 1) return openChapters(0);
  const sh = openSheet({title:"Choose a book", html:`<div class="chlist">${S.books.map((b, i) => `<button class="chitem press" data-b="${i}"><b>${esc(cleanTitle(b.title))}</b><span>${b.chapters.length} ch.</span></button>`).join("")}</div>`});
  sh.body.addEventListener("click", e => { const b = e.target.closest("[data-b]"); if(!b) return; sh.close(); openChapters(+b.dataset.b); });
}
function openChapters(bi){
  const b = S.books[bi]; if(!b) return;
  const cur = currentChapterRef(S);
  const sh = openSheet({title: esc(cleanTitle(b.title)), html:`<div class="chlist">${b.chapters.map((c, ci) => `<button class="chitem press ${cur && cur.ref.bookIdx === bi && cur.ref.chapterIdx === ci ? "on" : ""}" data-c="${ci}"><span style="color:var(--text);font-size:14px">${esc(c.name)}</span><span>${(c.highlights||[]).length ? (c.highlights.length + " ✦") : Math.max(1, Math.round(c.text.split(/\s+/).length / 230)) + " min"}</span></button>`).join("")}</div>
    <div class="row" style="margin-top:16px"><button class="btn danger press" id="delBook">${ic("trash","sm")} Delete book</button><span class="spacer"></span><button class="btn ghost press" id="rndCh">${ic("shuffle","sm")} Surprise me</button></div>`});
  const pick = ci => { S.recallSelected = {bookIdx:bi, chapterIdx:ci}; S.recallBookFilter = b.title; S.activeView = "book"; save(); sh.close(); if(view !== "today") go("today"); else render(); };
  sh.body.addEventListener("click", e => { const c = e.target.closest("[data-c]"); if(c) pick(+c.dataset.c); });
  $("#rndCh", sh.el).onclick = () => pick(Math.floor(Math.random() * b.chapters.length));
  $("#delBook", sh.el).onclick = () => {
    const removed = S.books.splice(bi, 1)[0], sel = S.recallSelected, auto = S.recallAuto;
    S.recallSelected = null; S.recallAuto = null; save(); sh.close(); render();
    toast(`Deleted “${cleanTitle(removed.title)}”`, {action:"Undo", fn: () => { S.books.splice(bi, 0, removed); S.recallSelected = sel; S.recallAuto = auto; save(); render(); }});
  };
}

// ================= settings / profile =================
function isStandalone(){ return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
async function openSettings(){
  const sh = openSheet({title:"Settings", html:""});
  const draw = async () => {
    const fn = firstName();
    const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false;
    const sm = summarize(S);
    sh.body.innerHTML = `
      <button class="list li press" id="sProfile" style="border-radius:18px;padding:14px">
        <span class="avatar" style="width:54px;height:54px;font-size:22px">${S.photo ? `<img src="${esc(S.photo)}" alt="">` : fn ? esc(fn[0].toUpperCase()) : ic("user")}</span>
        <span class="tx"><b style="font-size:17px">${esc(S.name || "Add your name")}</b><small>${esc(S.email || "Profile, photo and email")}</small></span>${ic("chevR","sm chev")}</button>
      <div class="sec-label">Appearance</div>
      <div class="themes">${Object.entries(THEMES).map(([k, [l]]) => `<button class="thm press ${S.theme === k ? "on" : ""}" data-theme="${k}"><span class="sw" style="background:${{white:"#fff", cream:"#f4ead2", night:"#1c1d1f"}[k]};color:${{white:"#1d1d1f", cream:"#5a4630", night:"#d9cfbe"}[k]}"></span>${l}</button>`).join("")}</div>
      <div class="sec-label">Banner backgrounds</div>
      <div class="list">${["quote","recall"].map(w => { const v = w === "quote" ? S.quoteBg : S.recallBg, f = (w === "quote" ? S.quoteBgFit : S.recallBgFit) || "cover";
        return `<div class="li"><span class="bgthumb" style="${v ? `background-image:url('${esc(v)}')` : ""}"></span><span class="tx">${w === "quote" ? "Quote" : "Book recall"}<small>${v ? "Custom image" : "Himalayan sunset scene"}</small></span>
          ${v ? `<select class="input" data-fit="${w}" style="width:auto;padding:6px 8px;font-size:13px">${[["cover","Fill"],["contain","Fit"],["fill","Stretch"]].map(([a, b]) => `<option value="${a}" ${f === a ? "selected" : ""}>${b}</option>`).join("")}</select><button class="iconbtn press" data-bgclear="${w}" aria-label="Remove image">${ic("trash","sm")}</button>` : ""}
          <label class="btn ghost sm press">${ic("image","sm")}<span>Choose</span><input type="file" accept="image/*" data-bgin="${w}" hidden></label></div>`; }).join("")}</div>
      <div class="sec-label">Your data</div>
      <div class="list">
        <div class="li"><span class="ic">${ic("shield","sm")}</span><span class="tx">Stored privately on this device<small>${sm.logged} days logged · ${sm.notes} notes · ${sm.quotes} quotes · ${sm.books} books${persisted ? " · protected from clean-up" : ""}</small></span></div>
        <button class="li press" id="sExport"><span class="ic">${ic("download","sm")}</span><span class="tx">Export backup<small>${S.lastBackupAt ? "Last: " + esc(new Date(S.lastBackupAt).toLocaleString(undefined, {day:"numeric", month:"short", hour:"numeric", minute:"2-digit"})) : "Save a .json file to Files or iCloud Drive"}</small></span>${ic("chevR","sm chev")}</button>
        <label class="li press" style="cursor:pointer"><span class="ic">${ic("upload","sm")}</span><span class="tx">Import backup<small>From the old iPhone app or another device</small></span>${ic("chevR","sm chev")}<input type="file" accept="application/json,.json" id="sImport" hidden></label>
        <button class="li press" id="sRestore"><span class="ic">${ic("history","sm")}</span><span class="tx">Restore points<small>Automatic daily snapshots, last 14 kept</small></span>${ic("chevR","sm chev")}</button>
      </div>
      ${!isStandalone() ? `<div class="sec-label">Install</div><div class="list"><div class="li"><span class="ic">${ic("phone","sm")}</span><span class="tx">Add to Home Screen<small>In Safari tap Share → Add to Home Screen. It opens full-screen, works offline, and never needs re-signing.</small></span></div></div>` : ""}
      <div class="sec-label">Keyboard</div>
      <div class="list"><div class="li"><span class="ic">${ic("key","sm")}</span><span class="tx small"><span class="kbd">1</span> <span class="kbd">2</span> <span class="kbd">3</span> status · <span class="kbd">←</span> <span class="kbd">→</span> day · <span class="kbd">T</span> today · <span class="kbd">/</span> search · <span class="kbd">G</span> <span class="kbd">C</span> <span class="kbd">I</span> <span class="kbd">J</span> views</span></div></div>
      <p class="tiny muted" style="text-align:center;margin-top:18px">Streak · nothing leaves this device unless you export it.</p>`;
    $("#sProfile", sh.el).onclick = () => openProfile(draw);
    $$("[data-theme]", sh.el).forEach(b => b.onclick = () => { S.theme = b.dataset.theme; save(); refresh(); draw(); });
    $$("[data-bgin]", sh.el).forEach(inp => inp.onchange = () => { const f = inp.files[0]; inp.value = ""; if(f) readImage(f, img => openCrop(img, inp.dataset.bgin, url => { if(inp.dataset.bgin === "quote") S.quoteBg = url; else S.recallBg = url; save(); render(); draw(); })); });
    $$("[data-bgclear]", sh.el).forEach(b => b.onclick = () => { if(b.dataset.bgclear === "quote") S.quoteBg = null; else S.recallBg = null; save(); render(); draw(); });
    $$("[data-fit]", sh.el).forEach(s => s.onchange = () => { if(s.dataset.fit === "quote") S.quoteBgFit = s.value; else S.recallBgFit = s.value; save(); render(); });
    $("#sExport", sh.el).onclick = async () => { await exportBackup(); draw(); };
    $("#sImport", sh.el).onchange = e => { const f = e.target.files[0]; e.target.value = ""; if(f) importFile(f, () => sh.close()); };
    $("#sRestore", sh.el).onclick = () => openRestore(() => sh.close());
  };
  await draw();
}
function openProfile(after){
  let photo = S.photo;
  const sh = openSheet({title:"Profile", html:`<div class="stack">
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <span class="avatar lg" id="pAv"></span>
      <div class="row"><label class="btn ghost sm press">${ic("image","sm")} Choose photo<input type="file" accept="image/*" id="pIn" hidden></label><button class="btn ghost sm press" id="pRm">Remove</button></div>
    </div>
    <div class="field"><label for="pName">Name</label><input class="input" id="pName" maxlength="30" value="${esc(S.name || "")}" placeholder="Your name"></div>
    <div class="field"><label for="pMail">Email <span class="muted">(optional)</span></label><input class="input" id="pMail" type="email" autocomplete="email" value="${esc(S.email || "")}" placeholder="you@email.com"></div>
    <p class="tiny muted">Each email keeps its own dashboard on this device. Switching to a new email carries your current data over; switching back to an email used before loads that dashboard.</p>
    <button class="btn primary block press" id="pSave">Save</button></div>`});
  const av = $("#pAv", sh.el);
  const drawAv = () => { av.innerHTML = photo ? `<img src="${esc(photo)}" alt="">` : ic("user"); };
  drawAv();
  $("#pIn", sh.el).onchange = e => { const f = e.target.files[0]; e.target.value = ""; if(f) readImage(f, img => openCrop(img, "avatar", url => { photo = url; drawAv(); })); };
  $("#pRm", sh.el).onclick = () => { photo = ""; drawAv(); };
  $("#pSave", sh.el).onclick = () => {
    const name = $("#pName", sh.el).value.trim(), email = $("#pMail", sh.el).value.trim().toLowerCase();
    if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("That email doesn’t look right");
    const nk = keyFor(email);
    if(nk !== KEY){
      persist(KEY, S); KEY = nk;
      const existing = hasProfile(KEY) ? loadProfile(KEY) : null;
      if(existing) S = existing; // returning profile
    }
    if(name) S.name = name;
    S.email = email; S.photo = photo;
    setCurrentEmail(email); save(); sh.close(); refresh(); if(after) after();
    toast(email ? "Signed in as " + email : "Profile saved");
  };
}

// ---- image crop (avatar circle or 16:9 banner) ----
function readImage(f, cb){
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => cb(img); img.onerror = () => toast("Couldn’t read that image"); img.src = r.result; };
  r.readAsDataURL(f);
}
function openCrop(img, target, done){
  const avatar = target === "avatar";
  const sh = openSheet({title: avatar ? "Adjust photo" : "Adjust background", html:`
    <div class="crop ${avatar ? "" : "rect"}" id="cStage"><img id="cImg" alt=""></div>
    <div class="row"><span class="tiny muted">Zoom</span><input type="range" id="cZoom" min="1" max="4" step="0.01" value="1"></div>
    <p class="tiny muted" style="text-align:center;margin:8px 0 14px">Drag to reposition · pinch, scroll or slide to zoom</p>
    <div class="row"><button class="btn ghost press" id="cCancel" style="flex:1">Cancel</button><button class="btn primary press" id="cApply" style="flex:1">Use ${avatar ? "photo" : "image"}</button></div>`});
  const stage = $("#cStage", sh.el), im = $("#cImg", sh.el), zoom = $("#cZoom", sh.el);
  im.src = img.src;
  let st = null;
  const clamp = () => { const w = img.width * st.s, h = img.height * st.s; st.x = Math.min(0, Math.max(st.W - w, st.x)); st.y = Math.min(0, Math.max(st.H - h, st.y)); };
  const apply = () => { im.style.width = img.width + "px"; im.style.height = img.height + "px"; im.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`; };
  const setZoom = z => { z = Math.min(4, Math.max(1, z)); const ns = st.min * z, cx = st.W/2, cy = st.H/2; const ix = (cx - st.x)/st.s, iy = (cy - st.y)/st.s; st.s = ns; st.x = cx - ix*ns; st.y = cy - iy*ns; zoom.value = z; clamp(); apply(); };
  requestAnimationFrame(() => setTimeout(() => {
    const r = stage.getBoundingClientRect(), W = r.width, H = r.height, min = Math.max(W / img.width, H / img.height);
    st = {W, H, min, s:min, x:(W - img.width*min)/2, y:(H - img.height*min)/2}; apply();
  }, 80));
  zoom.oninput = () => st && setZoom(+zoom.value);
  stage.addEventListener("wheel", e => { if(!st) return; e.preventDefault(); setZoom(+zoom.value - e.deltaY * 0.002); }, {passive:false});
  const pts = new Map(); let lastD = 0;
  stage.addEventListener("pointerdown", e => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); });
  stage.addEventListener("pointermove", e => {
    if(!st || !pts.has(e.pointerId)) return;
    const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(pts.size === 2){ const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if(lastD) setZoom(+zoom.value * d / lastD); lastD = d; return; }
    st.x += dx; st.y += dy; clamp(); apply();
  });
  const up = e => { pts.delete(e.pointerId); lastD = 0; };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  $("#cCancel", sh.el).onclick = () => sh.close();
  $("#cApply", sh.el).onclick = () => {
    if(!st) return;
    const oW = avatar ? 320 : 1200, oH = avatar ? 320 : Math.round(1200 * st.H / st.W), k = oW / st.W;
    const c = document.createElement("canvas"); c.width = oW; c.height = oH;
    c.getContext("2d").drawImage(img, st.x*k, st.y*k, img.width*st.s*k, img.height*st.s*k);
    done(c.toDataURL("image/jpeg", avatar ? .88 : .82)); sh.close();
  };
}

// ================= backup, import, restore =================
async function exportBackup(){
  persist(KEY, S);
  const data = buildBackup();
  const name = "streak-backup-" + today + ".json";
  const blob = new Blob([JSON.stringify(data)], {type:"application/json"});
  let shared = false;
  try{
    const file = new File([blob], name, {type:"application/json"});
    if(navigator.canShare && navigator.canShare({files:[file]}) && /iPhone|iPad|Android/i.test(navigator.userAgent)){
      await navigator.share({files:[file], title:"Streak backup"}); shared = true;
    }
  }catch(e){ if(e && e.name === "AbortError") return; }
  if(!shared){
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  S.lastBackupAt = new Date().toISOString(); save(); render();
  toast("Backup saved — keep it in Files or iCloud Drive");
}
function importFile(file, after){
  const r = new FileReader();
  r.onload = () => {
    let parsed;
    try{ parsed = parseBackup(r.result); }catch(e){ return toast(e.message || "Couldn’t read that backup"); }
    const keyIn = keyFor(parsed.current || "");
    const main = parsed.profiles[keyIn] || Object.values(parsed.profiles)[0];
    const sm = summarize(main);
    const mine = summarize(S);
    const sh = openSheet({title:"Import backup", html:`
      <p class="small muted">${sm.name ? esc(sm.name) + "’s dashboard" : "Dashboard"}${sm.from ? `, ${esc(niceDate(sm.from, {day:"numeric", month:"short", year:"numeric"}))} – ${esc(niceDate(sm.to, {day:"numeric", month:"short", year:"numeric"}))}` : ""}</p>
      <div class="import-sum"><div><b>${sm.logged}</b><span>days logged</span></div><div><b>${sm.notes}</b><span>notes</span></div><div><b>${sm.quotes}</b><span>your quotes</span></div><div><b>${sm.books}</b><span>books</span></div></div>
      ${mine.logged ? `<div class="risk" style="margin:0 0 14px">${ic("alert","sm")}<span>This replaces the ${mine.logged} days currently on this device. A restore point of them is saved first.</span></div>` : ""}
      <button class="btn primary block press" id="iGo">${ic("upload","sm")} Import ${Object.keys(parsed.profiles).length > 1 ? Object.keys(parsed.profiles).length + " profiles" : "everything"}</button>`});
    $("#iGo", sh.el).onclick = async () => {
      if(mine.logged) await dailySnapshot(KEY, S, "before-import-" + Date.now());
      applyBackup(parsed);
      KEY = keyFor(currentEmail());
      S = loadProfile(KEY) || blankState();
      save(); selected = today; viewYear = fromIso(today).getFullYear();
      sh.close(); if(after) after(); welcomeSheet && welcomeSheet.close();
      refresh(); celebrate();
      toast(`Welcome back — ${sm.logged} days restored`);
    };
  };
  r.readAsText(file);
}
async function openRestore(after){
  const snaps = await listSnapshots(KEY);
  const sh = openSheet({title:"Restore points", html: snaps.length
    ? `<p class="small muted" style="margin-bottom:12px">A snapshot is taken automatically each day you use Streak.</p><div class="chlist">${snaps.map((s, i) => { const sm = summarize(snapshotState(s));
        return `<button class="chitem press" data-s="${i}"><span style="color:var(--text);font-size:14px"><b>${esc(new Date(s.at).toLocaleString(undefined, {weekday:"short", day:"numeric", month:"short", hour:"numeric", minute:"2-digit"}))}</b>${s.id.includes("before-import") ? " · before import" : ""}</span><span>${sm.logged} days</span></button>`; }).join("")}</div>`
    : `<div class="empty">No restore points yet. One is saved automatically each day you use the app.</div>`});
  sh.body.addEventListener("click", async e => {
    const b = e.target.closest("[data-s]"); if(!b) return;
    const snap = snaps[+b.dataset.s], prev = S;
    await dailySnapshot(KEY, S, "before-restore-" + Date.now());
    S = snapshotState(snap); save(); sh.close(); if(after) after(); refresh();
    toast("Restored", {action:"Undo", fn: () => { S = prev; save(); refresh(); }});
  });
}

// ================= first run =================
let welcomeSheet = null;
function welcome(){
  welcomeSheet = openSheet({title:"", html:`<div style="text-align:center;padding:4px 4px 0">
    <img src="icons/icon-192.png" alt="" style="width:76px;height:76px;border-radius:20px;box-shadow:var(--shadow-md)">
    <div class="h1" style="margin-top:16px">Your streak, <em>everywhere</em></div>
    <p class="muted" style="margin:10px auto 22px;max-width:380px">The dashboard is now a web app: no Xcode, no weekly re-signing. Bring your history across, or start a fresh chain.</p>
    <label class="btn primary block press" style="height:48px;cursor:pointer">${ic("upload","sm")} Import backup from the old app<input type="file" accept="application/json,.json" id="wIn" hidden></label>
    <button class="btn ghost block press" id="wFresh" style="height:48px;margin-top:10px">Start fresh</button>
    <p class="tiny muted" style="margin-top:16px">Look for <b>streak-backup-from-iphone.json</b> in iCloud Drive. Everything stays on this device.</p></div>`});
  $("#wIn", welcomeSheet.el).onchange = e => { const f = e.target.files[0]; e.target.value = ""; if(f) importFile(f); };
  $("#wFresh", welcomeSheet.el).onclick = () => { welcomeSheet.close(); save(); openProfile(); };
  welcomeSheet.onClose = () => { welcomeSheet = null; };
}

// ================= toast & celebration =================
let toastT;
function toast(msg, opt){
  const t = $("#toast"), a = $("#toastAct");
  $("#toastMsg").textContent = msg;
  if(opt && opt.action){ a.textContent = opt.action; a.classList.remove("hidden"); a.onclick = () => { opt.fn(); t.classList.remove("in"); }; }
  else a.classList.add("hidden");
  t.classList.add("in");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("in"), opt && opt.action ? 5000 : 2600);
}
function celebrate(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.append(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr, ctx = c.getContext("2d");
  const cols = ["#ff7a2f","#ffb35c","#0064c8","#6cb6ff","#3fbf86","#f5c84c"];
  const ps = Array.from({length:120}, () => ({x:W/2 + (Math.random()-.5)*W*.3, y:H*.38, vx:(Math.random()-.5)*16*dpr, vy:(-Math.random()*15-5)*dpr, r:(3+Math.random()*4)*dpr, c:cols[Math.random()*cols.length|0], a:Math.random()*6, va:(Math.random()-.5)*.3}));
  const t0 = performance.now();
  (function f(t){
    const p = (t - t0) / 1800; ctx.clearRect(0, 0, W, H);
    ps.forEach(q => { q.vy += .45*dpr; q.vx *= .99; q.x += q.vx; q.y += q.vy; q.a += q.va; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = q.c; ctx.fillRect(-q.r, -q.r/2, q.r*2, q.r); ctx.restore(); });
    if(p < 1) requestAnimationFrame(f); else c.remove();
  })(t0);
}

// ================= keyboard =================
document.addEventListener("keydown", e => {
  if(e.metaKey || e.ctrlKey || e.altKey || sheets.length) return;
  const tag = (document.activeElement && document.activeElement.tagName) || "";
  if(/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  const k = e.key.toLowerCase();
  if(view === "today" && ["1","2","3"].includes(k)){ setStatus(selected, ["full","partial","missed"][+k - 1], () => render()); }
  else if(view === "today" && k === "arrowleft"){ selected = addDays(selected, -1); render(); }
  else if(view === "today" && k === "arrowright" && selected < today){ selected = addDays(selected, 1); render(); }
  else if(k === "t"){ selected = today; go("today"); }
  else if(k === "g") go("today");
  else if(k === "c") go("calendar");
  else if(k === "i") go("insights");
  else if(k === "j") go("journal");
  else if(k === "/"){ e.preventDefault(); $("#searchBtn").click(); }
  else return;
});

// ================= lifecycle =================
function ensureDailyRecall(){
  const chs = allChapters(S);
  if(!chs.length || S.recallSelected) return;
  const p = chs[Math.floor(Math.random() * chs.length)];
  S.recallAuto = {date:today, bookIdx:p.bookIdx, chapterIdx:p.chapterIdx};
}
function rollover(){
  const now = iso(new Date());
  if(now === today) return;
  const wasToday = selected === today;
  today = now; if(wasToday) selected = today;
  viewYear = fromIso(today).getFullYear();
  refresh();
}
setInterval(rollover, 30000);
document.addEventListener("visibilitychange", () => { if(!document.hidden) rollover(); });
window.addEventListener("storage", e => { if(e.key === KEY && e.newValue){ S = normalize(JSON.parse(e.newValue)); refresh(); } });

ensureDailyRecall();
if(!firstRun) save();
refresh();
if(firstRun) setTimeout(welcome, 350);
requestPersistence();
if("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
