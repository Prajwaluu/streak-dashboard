import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize, outcomeOf, periodInsights, streak, longestStreak, addDays} from '../js/logic.js';

test('three outcomes preserve legacy records, and unlogged days stay separate', () => {
  const S = normalize({days:{
    '2026-09-27':{status:'full',rating:8},
    '2026-09-28':{status:'partial',rating:6,note:'kept'},
    '2026-09-29':{status:'missed',rating:0},
    '2026-09-30':{status:null,rating:5},
    '2026-10-04':{status:'full',rating:10}
  }});
  const snapshot = structuredClone(S);
  const I = periodInsights(S,'2026-10-03',7);
  assert.equal(outcomeOf(S,'2026-09-28'),'partial');
  assert.equal(I.conquered,1); assert.equal(I.tempered,1); assert.equal(I.defeated,1);
  assert.equal(I.logged,3); assert.equal(I.unlogged,4); assert.equal(I.rate,33);
  assert.equal(I.avg,4.75); assert.equal(I.rated,4);
  assert.equal(I.allTimeLogged,3); assert.equal(I.months[8],1);
  assert.deepEqual(S,snapshot);
});

test('Defeated breaks a streak; an unlogged today preserves yesterday', () => {
  const S = normalize({days:{'2026-10-01':{status:'partial'},'2026-10-02':{status:'full'}}});
  assert.equal(streak(S,'2026-10-03'),2);
  S.days['2026-10-03']={status:'missed'};
  assert.equal(streak(S,'2026-10-03'),0);
  S.days['2026-10-03'].status='full';
  assert.equal(streak(S,'2026-10-03'),3);
  S.days['2026-10-03'].status='partial';
  assert.equal(streak(S,'2026-10-03'),3);
  assert.equal(longestStreak(S,'2026-10-03'),3);
});

test('periods include today, exclude future entries and use adjacent equal periods', () => {
  for(const span of [7,30,90]){
    const today='2026-10-03', start=addDays(today,1-span);
    const S=normalize({days:{
      [start]:{status:'full'},[today]:{status:'missed'},
      [addDays(start,-1)]:{status:'full'},[addDays(start,-span)]:{status:'missed'},
      [addDays(start,-span-1)]:{status:'full'},[addDays(today,1)]:{status:'full'}
    }});
    const I=periodInsights(S,today,span);
    assert.equal(I.rows.length,span); assert.equal(I.rows[0].k,start);
    assert.equal(I.rows.at(-1).k,today);
    assert.equal(I.rate,50); assert.equal(I.previousRate,50); assert.equal(I.delta,0);
  }
});

test('only a conquered next calendar day is a comeback', () => {
  const S=normalize({days:{
    '2026-09-25':{status:'missed'},'2026-09-26':{status:'full'},
    '2026-09-28':{status:'missed'},'2026-09-30':{status:'full'},
    '2026-10-01':{status:'missed'},'2026-10-02':{status:'missed'},'2026-10-03':{status:'partial'}
  }});
  const I=periodInsights(S,'2026-10-03',30);
  assert.equal(I.comebackWins,1); assert.equal(I.comebackOpportunities,3);
});

test('patterns require three observations and preserve tied weekdays', () => {
  const S=normalize({days:{'2026-09-07':{status:'full'}}});
  assert.deepEqual(periodInsights(S,'2026-10-03',30).bestDays,[]);
  for(const k of ['2026-09-14','2026-09-21','2026-09-08','2026-09-15','2026-09-22']) S.days[k]={status:'full'};
  assert.deepEqual(periodInsights(S,'2026-10-03',30).bestDays,[0,1]);
});

test('empty history has no invented comparison, rating or pattern', () => {
  const I=periodInsights(normalize({days:{}}),'2026-10-03',7);
  assert.equal(I.rate,null); assert.equal(I.previousRate,null); assert.equal(I.delta,null);
  assert.equal(I.avg,null); assert.equal(I.topMood,null); assert.deepEqual(I.bestDays,[]);
  assert.equal(I.unlogged,7); assert.equal(I.currentStreak,0);
  assert.equal(I.tempered,0);
});

test('Tempered keeps the flame alive without inflating conquest rates or weekday wins', () => {
  const S=normalize({days:{
    '2026-09-14':{status:'full'},'2026-09-21':{status:'partial'},'2026-09-28':{status:'partial'},
    '2026-09-25':{status:'full'},'2026-09-26':{status:'partial'},
    '2026-10-02':{status:'partial'},'2026-10-03':{status:'partial'}
  }});
  const I=periodInsights(S,'2026-10-03',7);
  assert.equal(I.conquered,0); assert.equal(I.tempered,3); assert.equal(I.defeated,0);
  assert.equal(I.rate,0); assert.equal(I.previousRate,33); assert.equal(I.delta,-33);
  assert.equal(I.currentStreak,2);
  const longer=periodInsights(S,'2026-10-03',30);
  assert.deepEqual(longer.weekdays[0],{won:1,logged:3});
});

test('future runs cannot earn milestones and malformed ratings are ignored', () => {
  const S=normalize({days:{
    '2026-10-01':{status:'full',rating:99},'2026-10-02':{status:'full',rating:'8'},
    '2026-10-03':{status:'full',rating:0},'2026-10-04':{status:'full',rating:9}
  }});
  assert.equal(longestStreak(S,'2026-10-03'),3);
  const I=periodInsights(S,'2026-10-03',7);
  assert.equal(I.longest,3); assert.equal(I.avg,0); assert.equal(I.rated,1);
});
