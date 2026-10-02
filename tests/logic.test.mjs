// Run: node --test tests/
// Compares the new pure logic with the iOS app's original algorithms (copied
// verbatim below, driven by a fake clock) on synthetic and — when present —
// the migrated real backup.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalize, streak, yearStats, momentum, longestStreak, dailyQuote, parseBook, weekRow, iso, insights, renderHighlighted } from "../js/logic.js";
import { QUOTES } from "../js/quotes.js";

const RealDate = Date;
function withClock(isoDay, fn){
  const [y,m,d] = isoDay.split("-").map(Number);
  const fixed = new RealDate(y, m-1, d, 14, 30).getTime();
  globalThis.Date = class extends RealDate { constructor(...a){ if(a.length) super(...a); else super(fixed); } static now(){ return fixed; } };
  try{ return fn(); } finally { globalThis.Date = RealDate; }
}

// ---- the old app's code, verbatim apart from taking S as a parameter ----
function oldAlgos(S){
  const todayIso = iso(new Date());
  const YEAR = new Date().getFullYear();
  const has = k => Object.prototype.hasOwnProperty.call(S.days, k);
  const statusOf = k => has(k) ? (S.days[k].status || null) : null;
  function streak(){
    let n = 0; let d = new Date();
    const tSt = statusOf(todayIso);
    if(!(tSt === "full" || tSt === "partial")) d.setDate(d.getDate()-1);
    while(true){ const st = statusOf(iso(d)); if(st === "full" || st === "partial"){ n++; d.setDate(d.getDate()-1); } else break; }
    return n;
  }
  function yearStats(){
    let full=0, part=0, miss=0; const d = new Date(YEAR,0,1);
    while(iso(d) <= todayIso && d.getFullYear() === YEAR){ const st = statusOf(iso(d)); if(st === "full") full++; else if(st === "partial") part++; else miss++; d.setDate(d.getDate()+1); }
    const tot = Math.max(full+part+miss, 1);
    return {full, part, miss, pf:Math.round(full/tot*100), pp:Math.round(part/tot*100), pm:Math.round(miss/tot*100)};
  }
  function week7(offset){
    let succ = 0, rsum = 0, rcnt = 0;
    for(let i = offset; i < offset + 7; i++){ const d = new Date(); d.setDate(d.getDate() - i); const o = S.days[iso(d)]; const st = o && o.status;
      if(st === "full") succ += 1; else if(st === "partial") succ += 0.6; if(o && o.rating != null){ rsum += o.rating; rcnt++; } }
    return { sr: succ/7, avg: rcnt ? rsum/rcnt : null };
  }
  function momentum(offset){ const w = week7(offset); const rate = w.avg != null ? w.avg/10 : w.sr; const stk = offset === 0 ? Math.min(streak()/14, 1) : 0.5; return Math.round(100 * (0.55*w.sr + 0.30*rate + 0.15*stk)); }
  return { todayIso, streak: streak(), yearStats: yearStats(), m0: momentum(0), m7: momentum(7) };
}

function synthetic(){
  const S = normalize({days:{}});
  const sts = ["full","full","partial","missed",null,"full","full","full","partial","full"];
  for(let i = 0; i < 60; i++){
    const d = new RealDate(2026, 8, 1); d.setDate(d.getDate()+i);
    S.days[iso(d)] = {status: sts[i % sts.length], rating: i % 3 ? (i*7)%11 : null, mood: i%5, note: ""};
  }
  return S;
}

const days = ["2026-09-15","2026-09-20","2026-10-03","2026-10-29","2027-01-02"];
for(const day of days){
  test("matches old app algorithms on " + day, () => {
    const S = synthetic();
    const old = withClock(day, () => oldAlgos(S));
    assert.equal(old.todayIso, day);
    assert.equal(streak(S, day), old.streak);
    const ys = yearStats(S, day);
    assert.deepEqual({full:ys.full, part:ys.part, miss:ys.miss, pf:ys.pf, pp:ys.pp, pm:ys.pm}, old.yearStats);
    assert.equal(momentum(S, day, 0), old.m0);
    assert.equal(momentum(S, day, 7), old.m7);
  });
}

const BACKUP = new URL("../migration/streak-backup-from-iphone.json", import.meta.url);
test("real iPhone backup: identical numbers to the old app", { skip: !fs.existsSync(BACKUP) }, () => {
  const env = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
  const raw = env.profiles["streakly-v1"];
  const S = normalize(structuredClone(raw));
  for(const day of ["2026-07-30","2026-07-31","2026-10-03"]){
    const old = withClock(day, () => oldAlgos(raw));
    assert.equal(streak(S, day), old.streak, "streak " + day);
    assert.equal(momentum(S, day), old.m0, "momentum " + day);
    const ys = yearStats(S, day);
    assert.equal(ys.full, old.yearStats.full);
  }
  // nothing dropped
  assert.equal(Object.keys(S.days).length, Object.keys(raw.days).length);
  assert.equal(S.photo, raw.photo);
  assert.deepEqual(S.essayText, raw.essayText);
  assert.equal(S.customQuotes.length, raw.customQuotes.length);
  assert.equal(S.theme, raw.theme === "dark" ? "night" : raw.theme === "light" ? "cream" : S.theme);
  assert.ok(longestStreak(S) >= streak(S, "2026-07-30"));
});

test("old themes map to new appearances", () => {
  assert.equal(normalize({days:{}, theme:"dark"}).theme, "night");
  assert.equal(normalize({days:{}, theme:"light"}).theme, "cream");
  assert.equal(normalize({days:{a:{checked:true}}}).days.a.status, "full");
});

test("daily quote rotation and override", () => {
  const S = normalize({days:{}});
  const q1 = dailyQuote(S, QUOTES, "2026-01-01");
  assert.deepEqual(q1, QUOTES[0]);
  S.quoteOverride = {date:"2026-03-03", text:"x", author:"y"};
  assert.deepEqual(dailyQuote(S, QUOTES, "2026-03-03"), ["x","y"]);
  assert.notDeepEqual(dailyQuote(S, QUOTES, "2026-03-04"), ["x","y"]);
});

test("parseBook splits chapters", () => {
  const b = parseBook("My Book\n\nintro text\nChapter 1. Start\nfoo\nCHAPTER TWO\nbar");
  assert.equal(b.title, "My Book");
  assert.deepEqual(b.chapters.map(c => c.name), ["Intro","Chapter 1. Start","CHAPTER TWO"]);
});

test("week row marks unlogged past days as missed, today pending", () => {
  const S = normalize({days:{"2026-09-28":{status:"full"}}});
  const r = weekRow(S, "2026-09-30");
  assert.deepEqual(r.map(x => x.cls), ["full","missed","today","future","future","future","future"]);
});

test("highlights escape html and skip overlaps", () => {
  const h = renderHighlighted("a <b> c", [{start:0,end:1,color:"yellow"},{start:0,end:3,color:"pink"}]);
  assert.equal(h, "<mark class='hl-yellow' data-h='0'>a</mark> &lt;b&gt; c");
  const md = renderHighlighted("## Title\n* **Main** point", []);
  assert.equal(md.replace(/<[^>]+>/g, ""), "## Title\n* **Main** point"); // every raw char kept
  assert.match(md, /md-h/); assert.match(md, /md-b'>Main/); assert.match(md, /md-li/);
});

test("insights", () => {
  const S = synthetic();
  const i = insights(S, "2026-10-03");
  assert.ok(i.avg > 0 && i.avg <= 10);
  assert.equal(i.spark.length, 30);
});
