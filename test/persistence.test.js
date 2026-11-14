import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLayoutController } from '../src/persistence.js';
const empty = () => ({ version: 1, roots: [] });
function fixture() {
  let snapshot = { status: 'ready', value: { layout: empty() }, writable: true, revision: 1 };
  const listeners = new Set();
  const calls = [];
  const form = {
    getSnapshot: () => snapshot,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    mutate: async (ops, revision) => { calls.push({ ops, revision }); form.setSnapshot({ ...snapshot, value: { layout: ops[0].value }, revision: revision + 1 }); return true; },
    setSnapshot(value) { snapshot = value; for (const fn of listeners) fn(); },
  };
  return { form, calls };
}
const arranged = () => ({ version: 1, roots: [{ type: 'item', id: 'models' }] });
test('initialization and roster reads never persist', () => {
  const { form, calls } = fixture(); const store = createLayoutController(form);
  assert.equal(store.getSnapshot().ready, true); assert.equal(store.getSnapshot().saved, false); assert.deepEqual(calls, []); store.dispose();
});
test('explicit gesture persists with captured revision', async () => {
  const { form, calls } = fixture(); const store = createLayoutController(form);
  assert.equal(await store.commit(arranged), true);
  assert.equal(calls.length, 1); assert.equal(calls[0].revision, 1);
  assert.deepEqual(store.getSnapshot().layout, arranged()); assert.equal(store.getSnapshot().saved, true); store.dispose();
});
test('save rejection rolls back and exposes failure', async () => {
  const { form } = fixture(); form.mutate = async () => false;
  const store = createLayoutController(form); assert.equal(await store.commit(arranged), false);
  assert.deepEqual(store.getSnapshot().layout, empty()); assert.ok(store.getSnapshot().error); store.dispose();
});
test('revision conflict accepts recovered host layout without overwriting it', async () => {
  const { form } = fixture(); const other = { version: 1, roots: [{ type: 'item', id: 'plugins' }] };
  form.mutate = async () => { form.setSnapshot({ ...form.getSnapshot(), value: { layout: other }, revision: 5 }); return false; };
  const store = createLayoutController(form); await store.commit(arranged);
  assert.deepEqual(store.getSnapshot().layout, other); assert.ok(store.getSnapshot().error); store.dispose();
});
test('read-only and future data cannot be overwritten', async () => {
  const { form, calls } = fixture(); form.setSnapshot({ ...form.getSnapshot(), writable: false });
  const store = createLayoutController(form); assert.equal(await store.commit(arranged), false); assert.equal(calls.length, 0);
  form.setSnapshot({ ...form.getSnapshot(), writable: true, value: { layout: { version: 99, roots: [] } } });
  assert.equal(store.getSnapshot().ready, false); assert.equal(await store.commit(arranged), false); store.dispose();
});
test('duplicate writes blocked while gesture is in flight, disposal unsubscribes', async () => {
  const { form } = fixture(); let finish;
  form.mutate = () => new Promise(resolve => { finish = resolve; });
  const store = createLayoutController(form); const pending = store.commit(arranged);
  assert.equal(await store.commit(arranged), false); assert.equal(store.getSnapshot().busy, true);
  finish(false); await pending; store.dispose(); assert.equal(await store.commit(arranged), false);
});
