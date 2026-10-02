// Pure logic — no DOM. Every rule here is carried over from the iOS app
// (streak, year stats, momentum, quotes, book parsing) so the numbers match
// what the old dashboard showed for the same data.

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const MOODS = [["😄","Happy"],["😊","Calm"],["😐","Neutral"],["😟","Low"],["😣","Stressed"]];
export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 365, 500, 1000];
const DAY_MS = 86400000;

export function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
export function fromIso(s){ const [y,m,dd] = s.split("-").map(Number); return new Date(y, m-1, dd); }
export function addDays(k, n){ const d = fromIso(k); d.setDate(d.getDate()+n); return iso(d); }

export function blankState(){
  return { theme:"white", name:"", email:"", photo:"", otherNotes:"", customQuotes:[], quoteOverride:null,
    books:[], recallSelected:null, recallAuto:null, recallBookFilter:null, activeView:"quote",
    days:{}, quoteBg:null, quoteBgFit:"cover", recallBg:null, recallBgFit:"cover", recallHeight:null,
    calendarMode:"status", lastBackupAt:null, createdAt:null };
}

// Accepts anything the old app (or an older version of this one) saved and
// returns a state with every field present. Unknown fields (e.g. essayText)
// are kept untouched so nothing from the phone is lost.
export function normalize(d){
  const base = blankState();
  if(!d || typeof d !== "object" || !d.days || typeof d.days !== "object") return base;
  const s = Object.assign({}, base, d);
  for(const k in s.days){
    const o = s.days[k] || {};
    if(o.status === undefined) o.status = o.checked ? "full" : null;
    if(o.rating === undefined) o.rating = null;
    if(o.mood === undefined) o.mood = null;
    if(o.note === undefined) o.note = "";
    s.days[k] = o;
  }
  if(!Array.isArray(s.customQuotes)) s.customQuotes = [];
  if(!Array.isArray(s.books)) s.books = [];
  s.books = s.books.map(b => {
    const chapters = (b.chapters||[]).map(c => {
      if(typeof c.text === "string") return {name: c.name || "Notes", text: c.text, highlights: Array.isArray(c.highlights) ? c.highlights : []};
      if(Array.isArray(c.cards)) return {name: c.name || "Notes", text: c.cards.join("\n\n"), highlights: []};
      if(typeof c.html === "string") return {name: c.name || "Notes", text: stripTags(c.html).trim(), highlights: []};
      return {name: c.name || "Notes", text: "", highlights: []};
    });
    return Object.assign({}, b, {title: b.title || "Untitled", chapters});
  });
  if(s.recallSelected && s.recallSelected.cardIdx !== undefined) s.recallSelected = {bookIdx:s.recallSelected.bookIdx, chapterIdx:s.recallSelected.chapterIdx};
  if(s.recallAuto && s.recallAuto.cardIdx !== undefined) s.recallAuto = {date:s.recallAuto.date, bookIdx:s.recallAuto.bookIdx, chapterIdx:s.recallAuto.chapterIdx};
  // old app themes: "dark" → night paper, "light" (warm cream) → cream
  if(s.theme === "dark") s.theme = "night";
  else if(s.theme === "light") s.theme = "cream";
  if(!["white","cream","night"].includes(s.theme)) s.theme = "white";
  if(!["status","rating","mood"].includes(s.calendarMode)) s.calendarMode = "status";
  return s;
}
function stripTags(html){ return String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">"); }

export function statusOf(S, k){ const o = S.days[k]; return o ? (o.status || null) : null; }
export const isWin = st => st === "full" || st === "partial";

// ================= streak (same rule as the iOS app) =================
// Today only counts once it's logged; an unlogged today doesn't break the streak.
export function streak(S, today){
  let n = 0, k = today;
  if(!isWin(statusOf(S, today))) k = addDays(k, -1);
  while(isWin(statusOf(S, k))){ n++; k = addDays(k, -1); }
  return n;
}
export function longestStreak(S){
  const keys = Object.keys(S.days).filter(k => isWin(S.days[k].status)).sort();
  let longest = 0, cur = 0, prev = null;
  for(const k of keys){
    cur = (prev && addDays(prev, 1) === k) ? cur + 1 : 1;
    if(cur > longest) longest = cur;
    prev = k;
  }
  return longest;
}
export function streakAtRisk(S, today){
  return !statusOf(S, today) && isWin(statusOf(S, addDays(today, -1)));
}
export function nextMilestone(n){ return MILESTONES.find(m => m > n) || (Math.floor(n/100)+1)*100; }
export function prevMilestone(n){ let p = 0; for(const m of MILESTONES) if(m <= n) p = m; return p; }

// ================= year stats — unlogged past days count as defeated, like before =================
export function yearStats(S, today){
  const year = fromIso(today).getFullYear();
  let full = 0, part = 0, miss = 0, k = year + "-01-01";
  while(k <= today && fromIso(k).getFullYear() === year){
    const st = statusOf(S, k);
    if(st === "full") full++; else if(st === "partial") part++; else miss++;
    k = addDays(k, 1);
  }
  const tot = Math.max(full+part+miss, 1);
  return {full, part, miss, total: full+part+miss, pf:Math.round(full/tot*100), pp:Math.round(part/tot*100), pm:Math.round(miss/tot*100)};
}

// ================= momentum (whoop-style, identical weights) =================
export function week7(S, today, offset){
  let succ = 0, rsum = 0, rcnt = 0;
  for(let i = offset; i < offset + 7; i++){
    const o = S.days[addDays(today, -i)];
    const st = o && o.status;
    if(st === "full") succ += 1; else if(st === "partial") succ += 0.6;
    if(o && o.rating != null){ rsum += o.rating; rcnt++; }
  }
  return { sr: succ/7, avg: rcnt ? rsum/rcnt : null };
}
export function momentum(S, today, offset = 0){
  const w = week7(S, today, offset);
  const rate = w.avg != null ? w.avg/10 : w.sr;
  const stk = offset === 0 ? Math.min(streak(S, today)/14, 1) : 0.5;
  return Math.round(100 * (0.55*w.sr + 0.30*rate + 0.15*stk));
}
export function momentumWord(m){ return m >= 80 ? "Peak" : m >= 67 ? "Strong" : m >= 50 ? "Steady" : m >= 34 ? "Building" : "Recovering"; }

export function weekRow(S, today){
  const t = fromIso(today);
  const mon = addDays(today, -((t.getDay()+6)%7));
  const out = [];
  for(let i = 0; i < 7; i++){
    const k = addDays(mon, i), st = statusOf(S, k);
    let cls;
    if(k > today) cls = "future";
    else if(st === "full") cls = "full";
    else if(st === "partial") cls = "partial";
    else if(st === "missed") cls = "missed";
    else if(k === today) cls = "today";
    else cls = "missed";
    out.push({k, cls, date: fromIso(k).getDate()});
  }
  return out;
}

// ================= insights =================
export function insights(S, today){
  const year = fromIso(today).getFullYear();
  const ratings = [], moods = [0,0,0,0,0];
  const wkS = [0,0,0,0,0,0,0], wkT = [0,0,0,0,0,0,0];
  const moS = new Array(12).fill(0);
  let winR = 0, winN = 0, lossR = 0, lossN = 0;
  for(const k in S.days){
    if(k > today) continue;
    const o = S.days[k], d = fromIso(k), w = (d.getDay()+6)%7;
    if(o.rating != null) ratings.push(o.rating);
    if(o.mood != null && moods[o.mood] !== undefined) moods[o.mood]++;
    if(o.status){ wkT[w]++; if(isWin(o.status)) wkS[w]++; }
    if(o.status === "full" && d.getFullYear() === year) moS[d.getMonth()]++;
    if(o.rating != null && o.status){ if(isWin(o.status)){ winR += o.rating; winN++; } else { lossR += o.rating; lossN++; } }
  }
  const avg = ratings.length ? ratings.reduce((a,b)=>a+b,0)/ratings.length : null;
  const wNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  let bestW = null, bestP = -1;
  for(let i = 0; i < 7; i++) if(wkT[i] > 0){ const p = wkS[i]/wkT[i]; if(p > bestP){ bestP = p; bestW = wNames[i]; } }
  // last 30 days
  const spark = [];
  let won30 = 0, logged30 = 0;
  for(let i = 29; i >= 0; i--){
    const k = addDays(today, -i), o = S.days[k];
    spark.push({k, v: o && o.rating != null ? o.rating : null});
    if(o && o.status){ logged30++; if(isWin(o.status)) won30++; }
  }
  let bestMonth = null, bestMonthN = 0;
  moS.forEach((n, i) => { if(n > bestMonthN){ bestMonthN = n; bestMonth = MONTHS[i]; } });
  const topMood = moods.some(Boolean) ? moods.indexOf(Math.max(...moods)) : null;
  return {
    avg, ratingsCount: ratings.length, moods, topMood, wkS, wkT, moS, bestW, bestP,
    weekdayRates: wkT.map((t, i) => t ? Math.round(wkS[i]/t*100) : null),
    spark, won30, logged30, rate30: Math.round(won30/30*100),
    bestMonth, bestMonthN,
    winAvg: winN ? winR/winN : null, lossAvg: lossN ? lossR/lossN : null,
    totalLogged: Object.values(S.days).filter(o => o.status).length,
    notesCount: Object.values(S.days).filter(o => o.note && o.note.trim()).length,
    firstDay: Object.keys(S.days).filter(k => S.days[k].status).sort()[0] || null
  };
}

// ================= quotes =================
export function allQuotes(S, QUOTES){
  const custom = (S.customQuotes||[]).map(q => typeof q === "string" ? [q, S.name || "Me"] : q);
  return QUOTES.concat(custom);
}
export function dailyQuote(S, QUOTES, today){
  if(S.quoteOverride && S.quoteOverride.date === today) return [S.quoteOverride.text, S.quoteOverride.author || ""];
  const t = fromIso(today);
  const doy = Math.floor((t - new Date(t.getFullYear(), 0, 1)) / DAY_MS);
  const q = allQuotes(S, QUOTES);
  return q[doy % q.length];
}

// ================= book recall =================
export const CHAPTER_RE = /^\s*(chapter|ch\.?|part|section)\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b[\s:.\-—–]*(.*)$/i;
export function parseBook(raw){
  const lines = raw.split("\n");
  let i = 0;
  while(i < lines.length && !lines[i].trim()) i++;
  const title = (lines[i] || "Untitled").trim();
  i++;
  const heads = [];
  for(let j = i; j < lines.length; j++) if(CHAPTER_RE.test(lines[j])) heads.push({line:j, label:lines[j].trim()});
  const chapters = [];
  if(heads.length){
    const intro = lines.slice(i, heads[0].line).join("\n").trim();
    if(intro) chapters.push({name:"Intro", text:intro, highlights:[]});
    heads.forEach((h, n) => {
      const end = n+1 < heads.length ? heads[n+1].line : lines.length;
      const body = lines.slice(h.line+1, end).join("\n").trim();
      if(body) chapters.push({name:h.label, text:body, highlights:[]});
    });
  } else {
    const body = lines.slice(i).join("\n").trim();
    if(body) chapters.push({name:"Notes", text:body, highlights:[]});
  }
  return {title, chapters};
}
export function cleanTitle(t){ return String(t||"").replace(/^#+\s*/, "").replace(/\*+/g, "").trim() || "Untitled"; }
export function allChapters(S){
  const out = [];
  (S.books||[]).forEach((b, bi) => (b.chapters||[]).forEach((c, ci) => out.push({title:b.title, chapter:c.name, bookIdx:bi, chapterIdx:ci})));
  return out;
}
export function currentChapterRef(S){
  const ref = S.recallSelected || S.recallAuto;
  if(!ref) return null;
  const b = S.books[ref.bookIdx], c = b && b.chapters && b.chapters[ref.chapterIdx];
  return c ? {b, c, ref} : null;
}
export function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
// Renders a chapter with highlights AND light markdown styling (#, **bold**, * bullets).
// Markdown syntax characters are kept in the DOM but hidden, so selection
// offsets (and saved highlight positions) always match the raw text.
export function renderHighlighted(text, highlights){
  const n = text.length;
  const hide = new Uint8Array(n), bold = new Uint8Array(n), head = new Uint8Array(n), bul = new Uint8Array(n);
  let i = 0;
  while(i <= n){
    let j = text.indexOf("\n", i); if(j < 0) j = n;
    const line = text.slice(i, j);
    let m;
    if((m = line.match(/^(\s*#{1,6}\s+)/))){ for(let k = i; k < i + m[1].length; k++) hide[k] = 1; for(let k = i + m[1].length; k < j; k++) head[k] = 1; }
    else if((m = line.match(/^(\s*)([*\-+])(\s+)/))){ bul[i + m[1].length] = 1; }
    const re = /\*\*(?=\S)([\s\S]*?\S)\*\*/g; let b;
    while((b = re.exec(line))){ const s0 = i + b.index; hide[s0] = hide[s0+1] = 1; const e0 = s0 + b[0].length; hide[e0-1] = hide[e0-2] = 1; for(let k = s0 + 2; k < e0 - 2; k++) bold[k] = 1; }
    i = j + 1;
  }
  const hl = new Int32Array(n).fill(-1);
  let pos = 0;
  (highlights || []).map((h, idx) => ({h, idx})).filter(({h}) => h.start < h.end && h.start >= 0 && h.end <= n)
    .sort((a, b) => a.h.start - b.h.start)
    .forEach(({h, idx}) => { if(h.start < pos) return; for(let k = h.start; k < h.end; k++) hl[k] = idx; pos = h.end; });
  let out = "", k = 0;
  while(k < n){
    const key = hide[k] + "," + bold[k] + "," + head[k] + "," + bul[k] + "," + hl[k];
    let e = k + 1;
    while(e < n && !bul[e] && !bul[k] && (hide[e] + "," + bold[e] + "," + head[e] + "," + bul[e] + "," + hl[e]) === key) e++;
    let seg = escapeHtml(text.slice(k, e));
    const cls = [hide[k] ? "md-x" : "", bold[k] ? "md-b" : "", head[k] ? "md-h" : "", bul[k] ? "md-li" : ""].filter(Boolean).join(" ");
    if(cls) seg = "<span class='" + cls + "'>" + seg + "</span>";
    if(hl[k] >= 0){ const h = highlights[hl[k]]; seg = "<mark class='hl-" + escapeHtml(h.color) + "' data-h='" + hl[k] + "'>" + seg + "</mark>"; }
    out += seg; k = e;
  }
  return out;
}

// ================= journal search =================
export function searchNotes(S, q){
  const needle = q.trim().toLowerCase();
  return Object.keys(S.days)
    .filter(k => S.days[k].note && S.days[k].note.trim() && (!needle || S.days[k].note.toLowerCase().includes(needle)))
    .sort().reverse()
    .map(k => ({k, note:S.days[k].note, status:S.days[k].status, mood:S.days[k].mood, rating:S.days[k].rating}));
}
