import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmed,captureEvent} from '../src/scripts/capture.mjs';
test('only a committed receipt confirms capture',()=>{
  const data={status:'saved',receipt:'3f82b960-a95c-41cc-af5f-3d88f6bf3f32'};
  assert.equal(confirmed({ok:true,status:201},data),true);
  for(const status of [202,400,500]) assert.equal(confirmed({ok:status<400,status},data),false);
  assert.equal(confirmed({ok:true,status:200},{id:3}),false);
  assert.equal(confirmed({ok:true,status:200},{...data,receipt:'a@b.com'}),false);
});
test('a repeated receipt emits once and never includes personal data',()=>{
  const events=[],seen=new Set();
  captureEvent('receipt_1234567890',seen,event=>events.push(event));
  captureEvent('receipt_1234567890',seen,event=>events.push(event));
  assert.equal(events.length,1);
  assert.equal(events[0].event,'lead_captured');
  assert.deepEqual(Object.keys(events[0]).sort(),['event','landing','receipt','service']);
});
