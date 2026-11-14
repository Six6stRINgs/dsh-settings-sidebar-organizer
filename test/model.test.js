import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDrop,
  dissolveGroup,
  dropZone,
  emptyLayout,
  projectLayout,
  renameGroup,
  sanitizeLayout,
  toggleGroup,
} from '../src/model.js';

const item = id => ({ type: 'item', id });
const group = (id, children, extra = {}) => ({
  type: 'group', id, name: id, open: true, children, ...extra,
});
const ids = layout => layout.roots.map(node => node.type === 'item' ? node.id : `group:${node.id}`);
const childIds = (layout, groupId) => layout.roots.find(node => node.id === groupId)?.children.map(child => child.id);

test('emptyLayout provides a fresh version-one layout', () => {
  const first = emptyLayout();
  first.roots.push(item('changed'));
  assert.deepEqual(emptyLayout(), { version: 1, roots: [] });
});

test('sanitizeLayout clones valid layout and enforces unique stable IDs', () => {
  const input = { version: 1, roots: [item('a'), group('g', [item('b')])] };
  const result = sanitizeLayout(input);
  assert.deepEqual(result, input);
  assert.notEqual(result, input);
  assert.notEqual(result.roots[1].children, input.roots[1].children);
  assert.throws(() => sanitizeLayout({ version: 1, roots: [item('x'), group('x', [])] }), /Duplicate/);
  assert.throws(() => sanitizeLayout({ version: 1, roots: [group('g', [item('x'), item('x')])] }), /Duplicate/);
});

test('sanitizeLayout rejects malformed, unknown, nested, and oversized schema', () => {
  for (const invalid of [
    null,
    { version: 1, roots: {} },
    { version: 1, roots: [{ type: 'other', id: 'x' }] },
    { version: 1, extra: true, roots: [] },
    { version: 1, roots: [item('')] },
    { version: 1, roots: [group('g', [group('nested', [])])] },
    { version: 1, roots: [group('g', [], { open: 1 })] },
    { version: 1, roots: [group('g', [], { name: '  ' })] },
    { version: 1, roots: [item('x'.repeat(257))] },
  ]) assert.throws(() => sanitizeLayout(invalid));
  assert.throws(() => sanitizeLayout({ version: 2, roots: [] }), /future layout version/);
  assert.throws(() => sanitizeLayout({ version: 1, roots: Array.from({ length: 1001 }, (_, i) => item(`i${i}`)) }), /exceeds/);
});

test('sanitize failures do not mutate persisted input', () => {
  const original = { version: 2, roots: [item('offline')], metadata: 'keep' };
  const before = structuredClone(original);
  assert.throws(() => sanitizeLayout(original));
  assert.deepEqual(original, before);
});

test('projectLayout filters offline IDs without deleting them from persisted layout', () => {
  const persisted = { version: 1, roots: [item('offline-root'), group('g', [item('offline-child'), item('live-a')]), item('live-b')] };
  const projected = projectLayout(persisted, ['live-a', 'new-c', 'live-b']);
  assert.deepEqual(ids(projected), ['group:g', 'live-b', 'new-c']);
  assert.deepEqual(childIds(projected, 'g'), ['live-a']);
  assert.deepEqual(ids(persisted), ['offline-root', 'group:g', 'live-b']);
  assert.deepEqual(childIds(persisted, 'g'), ['offline-child', 'live-a']);
});

test('projectLayout hides groups with no live children and appends new IDs in native order', () => {
  const persisted = { version: 1, roots: [group('empty-live', [item('gone')]), item('known')] };
  const projected = projectLayout(persisted, ['fresh-z', 'known', 'fresh-a']);
  assert.deepEqual(ids(projected), ['known', 'fresh-z', 'fresh-a']);
  assert.deepEqual(ids(persisted), ['group:empty-live', 'known']);
});

test('live labels are ignored; stable IDs determine projected identity', () => {
  const layout = { version: 1, roots: [item('section-id')] };
  assert.deepEqual(projectLayout(layout, [{ id: 'section-id', label: 'Renamed UI label' }]), layout);
  assert.deepEqual(projectLayout(layout, [{ id: 'other-id', label: 'section-id' }]).roots, [item('other-id')]);
});

test('applyDrop reorders leaves within the root and within a group', () => {
  const layout = { version: 1, roots: [item('a'), item('b'), group('g', [item('c'), item('d')])] };
  const rootReordered = applyDrop(layout, ['a', 'b', 'c', 'd'], 'item:a', 'item:b', 'after');
  assert.deepEqual(ids(rootReordered), ['b', 'a', 'group:g']);
  const childReordered = applyDrop(layout, ['a', 'b', 'c', 'd'], 'item:c', 'item:d', 'after');
  assert.deepEqual(childIds(childReordered, 'g'), ['d', 'c']);
  assert.deepEqual(childIds(layout, 'g'), ['c', 'd']);
});

test('applyDrop extracts a grouped child to the root before or after a root item', () => {
  const layout = { version: 1, roots: [group('g', [item('a'), item('b')]), item('c')] };
  const before = applyDrop(layout, ['a', 'b', 'c'], 'item:a', 'item:c', 'before');
  assert.deepEqual(ids(before), ['group:g', 'a', 'c']);
  assert.deepEqual(childIds(before, 'g'), ['b']);
  const after = applyDrop(layout, ['a', 'b', 'c'], 'item:b', 'item:c', 'after');
  assert.deepEqual(ids(after), ['group:g', 'c', 'b']);
  assert.deepEqual(childIds(after, 'g'), ['a']);
});

test('centering a root leaf on another root leaf creates deterministic group at target position', () => {
  const layout = { version: 1, roots: [item('a'), item('b'), item('c')] };
  const result = applyDrop(layout, ['a', 'b', 'c'], 'item:c', 'item:b', 'center', { groupId: 'custom', groupName: 'Pinned' });
  assert.deepEqual(ids(result), ['a', 'group:custom']);
  assert.deepEqual(childIds(result, 'custom'), ['b', 'c']);
  assert.equal(result.roots[1].name, 'Pinned');
  const auto = applyDrop(layout, ['a', 'b', 'c'], 'item:c', 'item:b', 'center');
  assert.equal(auto.roots[1].id, 'group:b');
  assert.deepEqual(childIds(auto, 'group:b'), ['b', 'c']);
});

test('centering a leaf on an existing group appends it; centering on a child joins its parent', () => {
  const layout = { version: 1, roots: [item('x'), group('g', [item('a')]), item('y')] };
  const append = applyDrop(layout, ['x', 'a', 'y'], 'item:x', 'group:g', 'center');
  assert.deepEqual(childIds(append, 'g'), ['a', 'x']);
  const childTarget = applyDrop(layout, ['x', 'a', 'y'], 'item:y', 'item:a', 'center');
  assert.deepEqual(childIds(childTarget, 'g'), ['a', 'y']);
  assert.deepEqual(ids(childTarget), ['x', 'group:g']);
});

test('groups reorder only at root and cannot nest or be dropped into own children', () => {
  const layout = { version: 1, roots: [group('a', [item('a1')]), item('x'), group('b', [item('b1')])] };
  const moved = applyDrop(layout, ['a1', 'x', 'b1'], 'group:b', 'item:x', 'before');
  assert.deepEqual(ids(moved), ['group:a', 'group:b', 'x']);
  assert.deepEqual(ids(applyDrop(layout, ['a1', 'x', 'b1'], 'group:a', 'item:a1', 'center')), ids(layout));
  assert.deepEqual(ids(applyDrop(layout, ['a1', 'x', 'b1'], 'group:a', 'group:b', 'center')), ids(layout));
  assert.deepEqual(ids(applyDrop(layout, ['a1', 'x', 'b1'], 'group:a', 'item:a1', 'after')), ids(layout));
  assert.deepEqual(ids(applyDrop(layout, ['a1', 'x', 'b1'], 'group:a', 'item:b1', 'after')), ['x', 'group:b', 'group:a']);
});

test('applyDrop preserves offline IDs and appends newly live IDs in native order', () => {
  const layout = { version: 1, roots: [item('offline'), item('a')] };
  const result = applyDrop(layout, ['a', 'new1', 'new2'], 'item:a', 'item:new1', 'after');
  assert.deepEqual(ids(result), ['offline', 'new1', 'a', 'new2']);
  assert.deepEqual(ids(projectLayout(result, ['a', 'new1', 'new2'])), ['new1', 'a', 'new2']);
});

test('invalid, missing, offline, and self drops are no-ops (apart from new live projection)', () => {
  const layout = { version: 1, roots: [item('offline'), item('a')] };
  assert.deepEqual(applyDrop(layout, ['a'], 'item:missing', 'item:a', 'before'), layout);
  assert.deepEqual(applyDrop(layout, ['a'], 'item:offline', 'item:a', 'before'), layout);
  assert.deepEqual(applyDrop(layout, ['a'], 'item:a', 'item:a', 'before'), layout);
  assert.deepEqual(applyDrop(layout, ['a'], 'bad-key', 'item:a', 'center'), layout);
  assert.throws(() => applyDrop(layout, ['a'], 'item:a', 'item:a', 'sideways'), /zone/);
});

test('group toggle, rename, and dissolve work without changing unrelated roots', () => {
  const layout = { version: 1, roots: [item('before'), group('g', [item('a'), item('b')]), item('after')] };
  const toggled = toggleGroup(layout, 'g');
  assert.equal(toggled.roots[1].open, false);
  assert.equal(layout.roots[1].open, true);
  const renamed = renameGroup(toggled, 'g', '  Favorites  ');
  assert.equal(renamed.roots[1].name, 'Favorites');
  assert.throws(() => renameGroup(layout, 'g', '  '));
  const dissolved = dissolveGroup(renamed, 'g');
  assert.deepEqual(ids(dissolved), ['before', 'a', 'b', 'after']);
  assert.deepEqual(ids(layout), ['before', 'group:g', 'after']);
  assert.deepEqual(dissolveGroup(layout, 'missing'), layout);
});

test('dropZone uses 28% and 72% boundaries', () => {
  assert.equal(dropZone(27.9, 100), 'before');
  assert.equal(dropZone(28, 100), 'center');
  assert.equal(dropZone(72, 100), 'center');
  assert.equal(dropZone(72.1, 100), 'after');
  assert.throws(() => dropZone(1, 0));
});

test('all model operations preserve the two-level-only layout invariant', () => {
  const layout = { version: 1, roots: [group('g', [item('a')]), item('b')] };
  const operations = [
    applyDrop(layout, ['a', 'b'], 'item:b', 'item:a', 'center'),
    applyDrop(layout, ['a', 'b'], 'item:b', 'group:g', 'center'),
    applyDrop(layout, ['a', 'b'], 'group:g', 'item:b', 'before'),
    dissolveGroup(layout, 'g'),
  ];
  for (const result of operations) {
    assert.doesNotThrow(() => sanitizeLayout(result));
    assert.ok(result.roots.every(node => node.type === 'item' || node.children.every(child => child.type === 'item')));
  }
});
