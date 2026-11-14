import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationAxis, pointerDropZone, allowedDrop } from '../src/drag.js';
import { createLayoutController } from '../src/persistence.js';

test('navigation axis follows own flex/grid geometry, including horizontal theme tabs', () => {
  assert.equal(navigationAxis(null), 'y');
  assert.equal(navigationAxis({}, () => ({ display: 'flex', flexDirection: 'row-reverse' })), 'x');
  assert.equal(navigationAxis({}, () => ({ display: 'flex', flexDirection: 'column' })), 'y');
  const node = (left, top) => ({ dataset: { dsoRoot: 'true' }, getBoundingClientRect: () => ({ left, top }) });
  assert.equal(navigationAxis({ children: [node(0, 0), node(100, 0)] }), 'x');
  assert.equal(navigationAxis({ children: [node(0, 0), node(0, 40)] }), 'y');
});
test('drop pointer geometry overrides stale center previews on either axis', () => {
  const currentTarget = { getBoundingClientRect: () => ({ top: 10, left: 20, width: 100, height: 100 }) };
  assert.equal(pointerDropZone({ currentTarget, clientX: 25, clientY: 60 }, 'x', 'center'), 'before');
  assert.equal(pointerDropZone({ currentTarget, clientX: 115, clientY: 60 }, 'x', 'center'), 'after');
  assert.equal(pointerDropZone({ currentTarget, clientX: 70, clientY: 15 }, 'y', 'center'), 'before');
  assert.equal(pointerDropZone({ currentTarget, clientX: 70, clientY: 105 }, 'y', 'center'), 'after');
  assert.equal(pointerDropZone({ currentTarget, clientY: 60 }, 'y', 'before'), 'center');
  assert.equal(pointerDropZone({}, 'y', 'before'), 'before');
  assert.equal(pointerDropZone({}, 'y', null), null);
});
test('groups never nest; external and self drags cannot authorize drops', () => {
  assert.equal(allowedDrop(null, 'item:a', null, 'before'), false);
  assert.equal(allowedDrop({ key: 'item:a', type: 'item' }, 'item:a', null, 'before'), false);
  assert.equal(allowedDrop({ key: 'group:g', type: 'group' }, 'item:a', 'other', 'before'), false);
  assert.equal(allowedDrop({ key: 'group:g', type: 'group' }, 'item:a', null, 'center'), false);
  assert.equal(allowedDrop({ key: 'group:g', type: 'group' }, 'item:a', null, 'before'), true);
});
test('new or cancelled gestures clear stale saved feedback without changing Host data', async () => {
  let value = { status: 'ready', writable: true, revision: 1, value: { layout: { version: 1, roots: [] } } };
  const listeners = new Set(); let writes = 0;
  const form = { getSnapshot: () => value, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async mutate(ops) { writes++; value = { ...value, revision: value.revision + 1, value: { layout: ops[0].value } }; for (const fn of listeners) fn(); return true; } };
  const controller = createLayoutController(form);
  await controller.commit(() => ({ version: 1, roots: [{ type: 'item', id: 'a' }] }));
  assert.equal(controller.getSnapshot().saved, true); const saved = structuredClone(value.value.layout);
  controller.beginGesture(); assert.equal(controller.getSnapshot().saved, false); assert.equal(controller.getSnapshot().notice, 'dragging');
  controller.cancelGesture(); assert.equal(controller.getSnapshot().notice, 'dropCancelled');
  assert.deepEqual(value.value.layout, saved); assert.equal(writes, 1);
  controller.beginGesture(); await controller.commit(layout => layout);
  assert.equal(controller.getSnapshot().notice, 'noChange'); assert.equal(writes, 1);
  controller.dispose(); controller.beginGesture(); assert.equal(listeners.size, 0);
});
