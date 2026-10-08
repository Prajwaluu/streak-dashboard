import test from 'node:test';
import assert from 'node:assert/strict';
import { renderYearCalendar } from '../js/calendar-export.js';

function capture(state, options){
  const texts = [];
  const context = new Proxy({fillText:(text,x,y)=>texts.push({text,x,y})}, {
    get(target, key){ return key in target ? target[key] : ()=>{}; }
  });
  const canvas = {getContext:()=>context};
  globalThis.document = {createElement:()=>canvas};
  try{ return {canvas:renderYearCalendar(state, options), texts}; }
  finally{ delete globalThis.document; }
}

test('year export includes leap day, excludes future outcomes and never draws private fields',()=>{
  const state = {name:'PRIVATE NAME',email:'private@example.test',photo:'PRIVATE PHOTO',days:{
    '2024-02-29':{status:'full',note:'PRIVATE NOTE'},
    '2024-03-01':{status:'partial'},
    '2024-03-02':{status:'missed'},
    '2024-12-31':{status:'full'},
    '2023-12-31':{status:'full'}
  }};
  const {canvas,texts} = capture(state,{year:2024,today:'2024-03-02'});
  assert.equal(canvas.width,2160); assert.equal(canvas.height,2700);
  const dates = texts.filter(t=>t.y>=351 && t.y<1170 && /^\d+$/.test(t.text));
  assert.equal(dates.length,366);
  assert.equal(texts.filter(t=>t.y===258).map(t=>t.text).join(','),'1,1,1');
  assert.equal(texts.some(t=>String(t.text).includes('PRIVATE') || String(t.text).includes('@')),false);
  assert.ok(texts.some(t=>t.text==='December'));
});

test('common year exports all 365 days in every colour mode and theme',()=>{
  for(const mode of ['status','rating','mood']) for(const theme of ['white','cream','night']){
    const {texts} = capture({days:{}},{year:2025,today:'2026-10-08',mode,theme});
    assert.equal(texts.filter(t=>t.y>=351 && t.y<1170 && /^\d+$/.test(t.text)).length,365);
  }
});
