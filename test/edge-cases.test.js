import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDrop, projectLayout, sanitizeLayout, renameGroup, toggleGroup, dissolveGroup } from '../src/model.js';
import { createLayoutController } from '../src/persistence.js';
const item = id => ({ type: 'item', id });

test('new native section id colliding with a group is projected deterministically without mutating saved state', () => {
  const layout = { version: 1, roots: [{ type: 'group', id: 'fresh', name: 'Saved name', open: false, children: [item('old')] }] };
  const before = structuredClone(layout);
  const visible = projectLayout(layout, ['old', 'fresh']);
  assert.equal(visible.roots[0].id, 'group:fresh'); assert.equal(visible.roots[0].open, false);
  assert.equal(visible.roots[1].id, 'fresh');
  assert.deepEqual(sanitizeLayout(visible), visible); assert.deepEqual(layout, before);
  const saved = applyDrop(layout, ['old', 'fresh'], 'item:fresh', 'group:group:fresh', 'center');
  assert.deepEqual(saved.roots[0].children.map(node => node.id), ['old', 'fresh']);
  assert.deepEqual(sanitizeLayout(saved), saved);
});
test('collision re-keying reserves all live and persisted ids and respects maximum id length', () => {
  const id = 'x'.repeat(256);
  const layout = { version: 1, roots: [{ type: 'group', id, name: 'Group', open: true, children: [item('old')] }] };
  const first = ('group:' + id).slice(0, 256);
  const projected = projectLayout(layout, ['old', id, first]);
  assert.equal(projected.roots[0].id.length, 256); assert.notEqual(projected.roots[0].id, first);
  assert.doesNotThrow(() => sanitizeLayout(projected));
});
test('capacity boundary rejects group creation and roster growth explicitly, while reordering remains valid', () => {
  const roots = Array.from({ length: 1000 }, (_, index) => item('i' + index));
  const layout = { version: 1, roots }; const ids = roots.map(node => node.id);
  assert.throws(() => applyDrop(layout, ids, 'item:i0', 'item:i1', 'center'), /Cannot create group/);
  assert.throws(() => applyDrop(layout, [...ids, 'new'], 'item:i0', 'item:i1', 'after'), /exceeds/);
  assert.doesNotThrow(() => sanitizeLayout(applyDrop(layout, ids, 'item:i0', 'item:i1', 'after')));
  assert.deepEqual(layout.roots, roots);
});
test('group menu operations use the same collision-safe IDs as live projection after plugin updates', () => {
  const layout = { version: 1, roots: [{ type: 'group', id: 'fresh', name: 'Saved name', open: false, children: [item('old'), item('offline')] }] };
  const original = structuredClone(layout); const live = ['old', 'fresh'];
  const visibleId = projectLayout(layout, live).roots[0].id;
  const renamed = renameGroup(layout, visibleId, 'Updated name', live);
  assert.equal(renamed.roots[0].name, 'Updated name'); assert.equal(renamed.roots[0].id, visibleId);
  assert.deepEqual(renamed.roots[0].children.map(node => node.id), ['old', 'offline']);
  assert.equal(toggleGroup(layout, visibleId, live).roots[0].open, true);
  assert.deepEqual(dissolveGroup(layout, visibleId, live).roots.map(node => node.id), ['old', 'offline', 'fresh']);
  assert.deepEqual(layout, original);
});
function pendingFixture() {
  let snapshot = { status: 'ready', value: { layout: { version: 1, roots: [] } }, writable: true, revision: 1 };
  const listeners = new Set(); let finish;
  const form = { getSnapshot: () => snapshot, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    mutate: () => new Promise(resolve => { finish = resolve; }) };
  const controller = createLayoutController(form); let notifications = 0; controller.subscribe(() => notifications++);
  return { controller, listeners, notifications: () => notifications, finish: value => finish(value),
    update(patch) { snapshot = { ...snapshot, ...patch }; for (const fn of listeners) fn(); } };
}
test('disposal during either accepted or rejected in-flight save removes subscriptions and prevents later publications', async () => {
  for (const accepted of [false, true]) {
    const f = pendingFixture(); const pending = f.controller.commit(() => ({ version: 1, roots: [item('a')] }));
    f.controller.dispose(); const before = f.notifications(); f.finish(accepted); await pending;
    assert.equal(f.listeners.size, 0); assert.equal(f.notifications(), before);
    assert.equal(await f.controller.commit(() => ({ version: 1, roots: [] })), false);
  }
});
test('rejected in-flight writes reconcile newer host layout and read-only/future-schema changes', async () => {
  for (const layout of [{ version: 1, roots: [item('remote')] }, { version: 99, roots: [] }]) {
    const f = pendingFixture(); const pending = f.controller.commit(() => ({ version: 1, roots: [item('a')] }));
    f.update({ writable: false, revision: 2, value: { layout } }); f.finish(false); await pending;
    assert.equal(f.controller.getSnapshot().writable, false);
    if (layout.version === 1) assert.deepEqual(f.controller.getSnapshot().layout, layout);
    else assert.equal(f.controller.getSnapshot().ready, false);
    assert.equal(await f.controller.commit(() => ({ version: 1, roots: [] })), false); f.controller.dispose();
  }
});
