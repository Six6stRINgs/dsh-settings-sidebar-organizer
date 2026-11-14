import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots';
const h = React.createElement;
const tick = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
const spec = kind => ({ kind, scope: 'root' });
const empty = () => ({ version: 1, roots: [] });
const artifact = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');

// Run the DELIVERED artifact, not a copied Navigation function. The real rc.1
// ledger enforces ownership/election; the small portal face models SettingsPanel.
async function fixture({ layout = empty(), writable = true, nativeFirst = true, unsupportedPanel = false, axis = 'y', initialLocale = null, withAction = false,
  rows = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] } = {}) {
  const slots = new SlotCore(); const disposers = []; const writes = []; const selections = []; const portals = [];
  const dialogHost = { offsetWidth: 800, offsetHeight: 700, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 700, right: 800, bottom: 700 }) };
  let popoverFocusCount = 0;
  const popoverNode = { querySelector: () => ({ focus() { popoverFocusCount++; } }), getBoundingClientRect: () => ({ left: 0, top: 0, width: 280, height: 230 }), contains: target => target === 'inside-popover' };
  const resizeObservers = new Set(); const windowListeners = new Map();
  class ResizeObserverMock {
    constructor(callback) { this.callback = callback; resizeObservers.add(this); }
    observe() {}
    disconnect() { resizeObservers.delete(this); }
  }
  const listeners = new Set(); const documentListeners = new Map();
  const document = {
    addEventListener(type, fn) { const set = documentListeners.get(type) ?? new Set(); set.add(fn); documentListeners.set(type, set); },
    removeEventListener(type, fn) { documentListeners.get(type)?.delete(fn); },
  };
  let snapshot = { status: 'ready', value: { layout }, writable, revision: 1 };
  const form = {
    getSnapshot: () => snapshot,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async mutate(ops, revision) {
      writes.push({ ops, revision }); snapshot = { ...snapshot, value: { layout: ops[0].value }, revision: revision + 1 };
      for (const fn of listeners) fn(); return true;
    },
  };
  slots.register({ name: 'root', children: { 'sidebar.settings': spec('single') } }, () => null);
  let entry; let original;
  function addNative() {
    function Panel(props) {
      React.useId(); // native hooks must run in a stable component boundary
      const children = h('div', { role: 'dialog' },
        h('nav', null, h('div', { className: 'native-list' }, props.rows.map(row => h('button', {
          key: row.id, type: 'button', className: row.id === props.activeId ? 'native-active' : 'native-button',
          'aria-current': row.id === props.activeId ? 'true' : undefined,
          onClick: () => props.onSelect(row.id),
        }, h('span', null, 'icon'), h('span', null, row.label))))),
        h('button', { 'data-native-close': true, onClick: props.onClose }, 'Close'),
        props.renderSlot('settings.section', {}, { only: props.activeId }));
      const element = h(React.Fragment, null, children);
      return unsupportedPanel ? element : { ...element, containerInfo: document, children };
    }
    original = function NativeRoot(props) {
      const open = props.useStore(value => value.open);
      React.useState(0);
      return h(React.Fragment, null, h('button', { 'data-native-trigger': true }, 'Settings'), open && h(Panel, {
        rows: props.rows, activeId: 'a', onSelect: props.onSelect, onClose: props.onClose, renderSlot: props.renderSlot,
      }));
    };
    slots.register({ name: 'sidebar.settings', store: { create() {} }, inject: () => ({}), locale: 'settings',
      children: { 'settings.launcher': spec('single'), 'settings.section': spec('list'), 'settings.action': spec('list') } }, original);
    entry = slots.entries('sidebar.settings').find(value => value.component === original);
  }
  if (nativeFirst) addNative();
  const facade = {
    entries: key => slots.entries(key), subscribe: (key, fn) => slots.subscribe(key, fn),
    register(options, component) { const off = slots.register(options, component); disposers.push(off); return off; },
    inject(key, callback) {
      let release;
      const reconcile = () => { if (slots.spec(key) && !release) release = callback(); else if (!slots.spec(key) && release) { release(); release = undefined; } };
      const off = slots.subscribeDeclaration(key, reconcile); reconcile();
      const dispose = () => { off(); release?.(); release = undefined; }; disposers.push(dispose); return dispose;
    },
  };
  const localeListeners = new Set(); const localeDictionaries = new Map();
  let localeSnapshot = { active: initialLocale || 'en', revision: 1 };
  const locale = {
    register(ns, dictionaries) {
      assert.ok(dictionaries.zh && dictionaries.en, 'both baseline dictionaries are required'); localeDictionaries.set(ns, dictionaries);
      return () => localeDictionaries.delete(ns);
    },
    bind: ns => key => initialLocale ? (localeDictionaries.get(ns)?.[localeSnapshot.active]?.[key] ?? localeDictionaries.get(ns)?.en?.[key] ?? key) : key,
    subscribe(fn) { localeListeners.add(fn); return () => localeListeners.delete(fn); },
    getSnapshot: () => localeSnapshot,
  };
  const ctx = { slots: facade, locale, configForms: { get(ns) { assert.equal(ns, 'settings-sidebar-organizer'); return form; } },
    effect(callback) { const off = callback(); if (off) disposers.push(off); return off; } };
  let plugin;
  vm.runInNewContext(artifact, { window: { __ModuleLoader__: { load(module) { plugin = module.factory(name => {
    if (name === 'react') return React;
    if (name === 'react-dom') return { createPortal: (children, container, key) => { portals.push({ container, key }); return h(React.Fragment, { key }, children); } };
    throw new Error('Unexpected client import: ' + name);
  }); } }, addEventListener(type, fn) { const set = windowListeners.get(type) || new Set(); set.add(fn); windowListeners.set(type, set); }, removeEventListener(type, fn) { windowListeners.get(type)?.delete(fn); } }, ResizeObserver: ResizeObserverMock, document, getComputedStyle: () => ({ display: 'flex', flexDirection: axis === 'x' ? 'row' : 'column' }), queueMicrotask, console });
  plugin.apply(ctx); if (!nativeFirst) addNative(); await tick();
  const props = { rows, useStore: selector => selector({ open: true }),
    onSelect: id => selections.push(id), onClose: () => selections.push('close'), renderSlot: key => h('section', { 'data-native-section': key }, 'Native content') };
  const RegisteredAction = slots.entries('settings.action').find(node => node.options.id === 'settings-sidebar-organizer')?.component;
  const renderTree = () => h(React.Fragment, null, h(entry.component, { ...props }), withAction && h(RegisteredAction));
  let renderer;
  await act(async () => { renderer = TestRenderer.create(renderTree(), { createNodeMock: node => node.props.className?.includes('dso-floating') ? popoverNode : node.props.className?.includes('dso-list') ? { children: [], scrollTop: 0, scrollLeft: 0, closest: selector => selector === '[role="dialog"]' ? dialogHost : null, getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 500, right: 200, width: 200, height: 500 }) } : null }); await tick(); });
  return { slots, entry, original, renderer, writes, selections, form, localeDictionaries, portals, dialogHost, resizeObservers, popoverFocusCount: () => popoverFocusCount,
    async dispatchWindow(type) { await act(async () => { for (const listener of windowListeners.get(type) || []) listener(); await tick(); }); },
    async setLocale(active) { await act(async () => { localeSnapshot = { active, revision: localeSnapshot.revision + 1 }; for (const listener of localeListeners) listener(); await tick(); }); },
    async updateRows(nextRows) { props.rows = nextRows; await act(async () => { renderer.update(renderTree()); await tick(); }); },
    async dispatchDocument(type, value) { await act(async () => { for (const listener of documentListeners.get(type) || []) listener(value); await tick(); }); },
    async dispose() { await act(async () => renderer.unmount()); for (const off of disposers.reverse()) off(); await tick();
      assert.equal(listeners.size, 0); assert.equal(localeListeners.size, 0); assert.equal(resizeObservers.size, 0); assert.equal([...windowListeners.values()].reduce((sum, set) => sum + set.size, 0), 0); assert.equal([...documentListeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
    } };
}
const navButton = (f, id) => f.renderer.root.findAllByType('button').find(button => button.props['data-organizer-id'] === id);
const event = extra => ({ preventDefault() {}, stopPropagation() {}, ...extra });

test('built artifact actually attaches for both startup orders and preserves native chrome/click actions', async () => {
  for (const nativeFirst of [false, true]) {
    const f = await fixture({ nativeFirst });
    assert.notEqual(f.entry.component, f.original, 'apply must activate the adapter, not only the action menu');
    assert.equal(f.slots.entriesOfSlot('sidebar.settings')[0], f.entry);
    assert.equal(navButton(f, 'a').props.draggable, true);
    assert.equal(f.renderer.root.findAll(node => node.props['data-native-trigger']).length, 1);
    assert.equal(f.renderer.root.findAll(node => node.props['data-native-section']).length, 1);
    await act(async () => navButton(f, 'b').props.onClick(event()));
    assert.deepEqual(f.selections, ['b']);
    assert.equal(f.writes.length, 0, 'loading/rendering/click navigation must not write');
    await f.dispose(); assert.equal(f.entry.component, f.original);
  }
});
const targetEvent = (x, y) => event({ clientX: x, clientY: y, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }, dataTransfer: { dropEffect: '' } });
const startDrag = async (f, id) => act(async () => {
  const button = navButton(f, id);
  button.props.onDragStart(event({ dataTransfer: { setData() {}, effectAllowed: '' } }));
  button.props.onDrag?.(); // no layout publication is allowed from source drag events
});

test('dragstart does not mutate the rendered source or expand gaps before native capture', async () => {
  const f = await fixture(); const before = JSON.stringify(f.renderer.toJSON()); const button = navButton(f, 'b');
  await act(async () => button.props.onDragStart(event({ dataTransfer: { setData() {}, effectAllowed: '' } })));
  assert.equal(JSON.stringify(f.renderer.toJSON()), before, 'dragstart must not trigger source opacity or gap reflow');
  assert.equal(navButton(f, 'b'), button, 'native drag source must retain its component identity');
  await act(async () => button.props.onDragOver(targetEvent(50, 50)));
  assert.equal(JSON.stringify(f.renderer.toJSON()), before, 'self hover must not activate any layout changes either');
  assert.equal(button.props.onDrag, undefined, 'source drag events must not publish visual state');
  await act(async () => button.props.onDragEnd()); await f.dispose();
});
test('drop commits even when a null-relatedTarget dragleave cleared the preview', async () => {
  const f = await fixture(); await startDrag(f, 'b');
  await act(async () => navButton(f, 'a').props.onDragOver(targetEvent(50, 50)));
  const list = f.renderer.root.findAllByType('div').find(node => node.props.className?.includes('dso-list'));
  await act(async () => list.props.onDragLeave(event({ relatedTarget: null, currentTarget: { contains: () => false } })));
  await act(async () => { navButton(f, 'a').props.onDrop(targetEvent(50, 50)); await tick(); });
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].ops[0].value.roots[0].type, 'group');
  await f.dispose();
});
test('drop reads its final pointer zone rather than a previous center/group preview', async () => {
  const f = await fixture(); await startDrag(f, 'b');
  await act(async () => navButton(f, 'a').props.onDragOver(targetEvent(50, 50)));
  await act(async () => { navButton(f, 'a').props.onDrop(targetEvent(50, 5)); await tick(); });
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots, node => node.id), ['b', 'a']);
  assert.equal(f.writes[0].ops[0].value.roots.every(node => node.type === 'item'), true); await f.dispose();
});
test('start, hover and drop in a single React batch still commit one gesture', async () => {
  const f = await fixture(); const source = navButton(f, 'b'); const target = navButton(f, 'a');
  await act(async () => {
    source.props.onDragStart(event({ dataTransfer: { setData() {}, effectAllowed: '' } }));
    target.props.onDragOver(targetEvent(50, 50)); target.props.onDrop(targetEvent(50, 50)); await tick();
  });
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].ops[0].value.roots[0].type, 'group'); await f.dispose();
});
test('horizontal theme tabs sort by pointer X instead of treating every drop as center/group', async () => {
  const f = await fixture({ axis: 'x' }); await startDrag(f, 'b');
  await act(async () => navButton(f, 'a').props.onDragOver(targetEvent(5, 50)));
  await act(async () => { navButton(f, 'a').props.onDrop(targetEvent(5, 50)); await tick(); });
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots, node => node.id), ['b', 'a']);
  assert.equal(f.writes[0].ops[0].value.roots.every(node => node.type === 'item'), true); await f.dispose();
});
test('explicit insertion gaps reorder and expose an expandable insertion preview, not a group', async () => {
  const f = await fixture({ rows: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }] });
  await startDrag(f, 'c');
  const gap = f.renderer.root.findAllByType('div').find(node => node.props.className === 'dso-gap' && node.props['data-drop-target'] === 'item:a' && node.props['data-drop-zone'] === 'before');
  assert.ok(gap);
  await act(async () => gap.props.onDragOver(targetEvent(50, 50)));
  assert.equal(gap.props['data-hover'], true);
  const list = f.renderer.root.findAllByType('div').find(node => node.props.className?.includes('dso-list'));
  assert.equal(list.props['data-dragging'], true);
  await act(async () => { gap.props.onDrop(event()); await tick(); });
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots, node => node.id), ['c', 'a', 'b']);
  assert.equal(list.props['data-dragging'], false); await f.dispose();
});
test('a grouped child reorders vertically even when root navigation is horizontal', async () => {
  const f = await fixture({ axis: 'x', layout: { version: 1, roots: [{ type: 'group', id: 'g', name: 'Group', open: true, children: [{ type: 'item', id: 'a' }, { type: 'item', id: 'b' }] }] } });
  await startDrag(f, 'b');
  await act(async () => navButton(f, 'a').props.onDragOver(targetEvent(50, 5)));
  await act(async () => { navButton(f, 'a').props.onDrop(targetEvent(50, 5)); await tick(); });
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots[0].children, node => node.id), ['b', 'a']); await f.dispose();
});
test('root groups reorder through gaps without nesting or losing children', async () => {
  const f = await fixture({ rows: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }], layout: { version: 1, roots: [{ type: 'item', id: 'c' }, { type: 'group', id: 'g', name: 'Group', open: true, children: [{ type: 'item', id: 'a' }, { type: 'item', id: 'b' }] }] } });
  const group = f.renderer.root.findAllByType('button').find(node => node.props['data-organizer-group'] === 'g');
  await act(async () => group.props.onDragStart(event({ dataTransfer: { setData() {}, effectAllowed: '' } })));
  const gap = f.renderer.root.findAllByType('div').find(node => node.props.className === 'dso-gap' && node.props['data-drop-target'] === 'item:c' && node.props['data-drop-zone'] === 'before');
  await act(async () => gap.props.onDragOver(targetEvent(50, 50)));
  await act(async () => { gap.props.onDrop(event()); await tick(); });
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots, node => node.id), ['g', 'c']);
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots[0].children, node => node.id), ['a', 'b']); await f.dispose();
});
test('center drop joins an existing group and its saved layout survives a component remount', async () => {
  const rows = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }];
  const f = await fixture({ rows, layout: { version: 1, roots: [{ type: 'group', id: 'g', name: 'Group', open: true, children: [{ type: 'item', id: 'a' }, { type: 'item', id: 'b' }] }, { type: 'item', id: 'c' }] } });
  await startDrag(f, 'c'); const group = f.renderer.root.findAllByType('button').find(node => node.props['data-organizer-group'] === 'g');
  await act(async () => group.props.onDragOver(targetEvent(50, 50)));
  await act(async () => { group.props.onDrop(targetEvent(50, 50)); await tick(); });
  const saved = JSON.parse(JSON.stringify(f.form.getSnapshot().value.layout));
  assert.deepEqual(saved.roots[0].children.map(node => node.id), ['a', 'b', 'c']); await f.dispose();
  const reopened = await fixture({ rows, layout: saved });
  assert.equal(reopened.renderer.root.findAllByType('button').filter(node => node.props['data-organizer-group']).length, 1);
  assert.ok(navButton(reopened, 'c')); assert.equal(reopened.writes.length, 0); await reopened.dispose();
});
test('delivered CSS uses native-like hairline controls and theme surface tokens with reduced-motion gap animations', async () => {
  const f = await fixture();
  const entry = f.slots.entries('settings.action').find(node => node.options.id === 'settings-sidebar-organizer-styles');
  const css = entry.component().props.children;
  assert.match(css, /var\(--dsh-hairline-width,\.5px\) var\(--dsh-button-outline-color,var\(--dsw-alias-border-l3/);
  assert.match(css, /border-radius:var\(--dsw-radius-sm,8px\)/);
  assert.match(css, /\.dso-group \.dso-group-head>\.dso-small\[aria-expanded=true\]\{background:color-mix/);
  assert.match(css, /\.dso-group \.dso-group-head>\.dso-small:hover:not\(:disabled\)\{background:/);
  assert.match(css, /\.dso-group-panel\{[^}]*gap:12px;[^}]*padding:12px/);
  assert.match(css, /\.dso-group-danger\{border-block-start:/);
  assert.match(css, /\.dso-group-actions\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css, /\.dso-action\{height:28px/);
  assert.match(css, /border:\.5px solid transparent/);
  assert.match(css, /background:var\(--dsw-alias-bg-layer-2\);color:var\(--dsw-alias-label-primary\)/);
  assert.doesNotMatch(css, /background:var\(--dsw-alias-bg-overlay\)/);
  assert.match(css, /\.dso-gap\[data-hover=true\].*flex:0 0 24px/);
  assert.doesNotMatch(css, /\[data-dragging=true\]>\.dso-gap\{/);
  assert.match(css, /prefers-reduced-motion:reduce.*\.dso-gap/);
  await f.dispose();
});
test('package runtime exports use lib and preserve the plugin identity', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
  assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  assert.equal(manifest.main, 'lib/index.js');
  assert.equal(manifest.exports['.'], './lib/index.js'); assert.equal(manifest.exports['./client'], './lib/client.js');
  assert.ok(artifact.includes(`id: '${manifest.name}',`));
  assert.equal(patch.match(/^\s+name:\s*['"]([^'"]+)['"]\s*$/m)?.[1], manifest.name);
});
test('center/group preview does not open any insertion gaps or shift its target', async () => {
  const f = await fixture(); await startDrag(f, 'b');
  await act(async () => navButton(f, 'a').props.onDragOver(targetEvent(50, 50)));
  const gaps = f.renderer.root.findAllByType('div').filter(node => node.props.className === 'dso-gap');
  assert.equal(gaps.some(node => node.props['data-hover']), false);
  await act(async () => navButton(f, 'b').props.onDragEnd()); await f.dispose();
});
test('HTML drag events create a group and persist through the real artifact wiring', async () => {
  const f = await fixture();
  const dataTransfer = { setData() {}, effectAllowed: '', dropEffect: '' };
  await act(async () => navButton(f, 'b').props.onDragStart(event({ dataTransfer })));
  await act(async () => navButton(f, 'a').props.onDragOver(event({ dataTransfer, clientY: 50,
    currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) } })));
  await act(async () => { navButton(f, 'a').props.onDrop(event()); await tick(); });
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].revision, 1);
  assert.equal(f.writes[0].ops[0].value.roots[0].type, 'group');
  assert.deepEqual(Array.from(f.writes[0].ops[0].value.roots[0].children, node => node.id), ['a', 'b']);
  assert.equal(f.renderer.root.findAllByType('button').some(button => button.props['data-organizer-group']), true);
  await f.dispose();
});
const namedGroupLayout = () => ({ version: 1, roots: [{ type: 'group', id: 'g', name: 'My group', open: true, children: [{ type: 'item', id: 'a' }, { type: 'item', id: 'b' }] }] });
const groupSettings = f => f.renderer.root.findAllByType('button').find(button => button.props['data-group-settings'] === 'g');
const groupAction = (f, action) => f.renderer.root.findAllByType('button').find(button => button.props['data-group-action'] === action);
test('visible group settings opens an anchored floating named editor and explicitly saves a persisted group name', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  assert.ok(groupSettings(f), 'group naming must have a discoverable settings button');
  await act(async () => groupSettings(f).props.onClick(event()));
  const panel = f.renderer.root.findByProps({ className: 'dso-group-panel dso-floating' });
  assert.equal(panel.props.role, 'group');
  const input = panel.findByType('input'); assert.equal(input.props.value, 'My group');
  assert.equal(input.props.onBlur, undefined, 'blurring must not silently save or race Cancel');
  await act(async () => input.props.onChange({ target: { value: '  Preferences  ' } }));
  await act(async () => { await groupAction(f, 'save').props.onClick(); await tick(); });
  assert.equal(f.form.getSnapshot().value.layout.roots[0].name, 'Preferences');
  assert.deepEqual(Array.from(f.form.getSnapshot().value.layout.roots[0].children, node => node.id), ['a', 'b']);
  const saved = JSON.parse(JSON.stringify(f.form.getSnapshot().value.layout)); await f.dispose();
  const reopened = await fixture({ layout: saved });
  assert.equal(groupSettings(reopened).props['aria-label'], 'menu: Preferences'); await reopened.dispose();
});
test('cancelling group name editing does not write and restores draggable navigation', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  await act(async () => groupSettings(f).props.onClick(event()));
  await act(async () => f.renderer.root.findByType('input').props.onChange({ target: { value: 'Discard' } }));
  await act(async () => groupAction(f, 'cancel').props.onClick());
  assert.equal(f.writes.length, 0); assert.equal(f.renderer.root.findAllByType('input').length, 0);
  assert.equal(navButton(f, 'a').props.draggable, true); await f.dispose();
});
test('read-only group editor never grants rename or dissolve writes', async () => {
  const f = await fixture({ layout: namedGroupLayout(), writable: false });
  await act(async () => groupSettings(f).props.onClick(event()));
  assert.equal(f.renderer.root.findByType('input').props.readOnly, true);
  assert.equal(groupAction(f, 'save').props.disabled, true); assert.equal(groupAction(f, 'dissolve').props.disabled, true);
  await act(async () => groupAction(f, 'cancel').props.onClick()); assert.equal(f.writes.length, 0); await f.dispose();
});
test('plugin entry removal, label updates and restoration retain offline group membership and renamed data', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  await f.updateRows([{ id: 'a', label: 'Updated label' }, { id: 'c', label: 'New plugin' }]);
  assert.equal(navButton(f, 'b'), undefined); assert.ok(navButton(f, 'c'));
  assert.equal(navButton(f, 'a').findByProps({ className: 'dso-original' }).children.join(''), 'Updated label');
  assert.equal(f.writes.length, 0, 'roster reconciliation must never persist by itself');
  await act(async () => groupSettings(f).props.onClick(event()));
  await act(async () => f.renderer.root.findByType('input').props.onChange({ target: { value: 'Retained name' } }));
  await act(async () => { await groupAction(f, 'save').props.onClick(); await tick(); });
  const saved = JSON.parse(JSON.stringify(f.form.getSnapshot().value.layout));
  assert.deepEqual(saved.roots[0].children.map(node => node.id), ['a', 'b']);
  assert.deepEqual(saved.roots.map(node => node.id), ['g', 'c']);
  await f.updateRows([]); assert.equal(groupSettings(f), undefined);
  await f.updateRows([{ id: 'b', label: 'Restored B' }, { id: 'a', label: 'Updated label' }, { id: 'c', label: 'New plugin' }]);
  assert.ok(navButton(f, 'b')); assert.equal(groupSettings(f).props['aria-label'], 'menu: Retained name');
  assert.equal(f.writes.length, 1); await f.dispose();
  const reopened = await fixture({ layout: saved, rows: [{ id: 'a', label: 'Updated label' }, { id: 'b', label: 'Restored B' }, { id: 'c', label: 'New plugin' }] });
  assert.equal(groupSettings(reopened).props['aria-label'], 'menu: Retained name'); assert.ok(navButton(reopened, 'b')); await reopened.dispose();
});
test('a rejected rename keeps its draft and allows retry without corrupting saved data', async () => {
  const f = await fixture({ layout: namedGroupLayout() }); const originalMutate = f.form.mutate;
  f.form.mutate = async () => false;
  await act(async () => groupSettings(f).props.onClick(event()));
  await act(async () => f.renderer.root.findByType('input').props.onChange({ target: { value: 'Retry name' } }));
  await act(async () => { await groupAction(f, 'save').props.onClick(); await tick(); });
  assert.equal(f.form.getSnapshot().value.layout.roots[0].name, 'My group');
  assert.equal(f.renderer.root.findByType('input').props.value, 'Retry name');
  assert.ok(f.renderer.root.findAllByProps({ role: 'alert' }).length); assert.equal(groupAction(f, 'save').props.disabled, false);
  f.form.mutate = originalMutate;
  await act(async () => { await groupAction(f, 'save').props.onClick(); await tick(); });
  assert.equal(f.form.getSnapshot().value.layout.roots[0].name, 'Retry name'); await f.dispose();
});
test('Escape, outside click and disappearing groups cancel editing without writing or leaving a drag lock', async () => {
  for (const mode of ['escape', 'outside', 'removed']) {
    const f = await fixture({ layout: namedGroupLayout() });
    await act(async () => groupSettings(f).props.onClick(event()));
    if (mode === 'escape') await f.dispatchDocument('keydown', event({ key: 'Escape' }));
    else if (mode === 'outside') await f.dispatchDocument('pointerdown', event({ target: { closest: () => null } }));
    else await f.updateRows([{ id: 'c', label: 'C' }]);
    assert.equal(f.renderer.root.findAllByType('input').length, 0);
    assert.equal(f.writes.length, 0); assert.equal(navButton(f, mode === 'removed' ? 'c' : 'a').props.draggable, true); await f.dispose();
  }
});
test('group name editing rejects empty input and does not submit an IME composition', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  await act(async () => groupSettings(f).props.onClick(event()));
  await act(async () => f.renderer.root.findByType('input').props.onKeyDown(event({ key: 'Enter', isComposing: true })));
  assert.equal(f.writes.length, 0);
  await act(async () => f.renderer.root.findByType('input').props.onChange({ target: { value: ' ' } }));
  await act(async () => f.renderer.root.findByType('input').props.onKeyDown(event({ key: 'Enter' })));
  assert.equal(f.renderer.root.findByType('input').props['aria-invalid'], true);
  assert.equal(f.form.getSnapshot().value.layout.roots[0].name, 'My group'); assert.equal(f.writes.length, 0); await f.dispose();
});
test('child context actions float in the dialog and switching from name editing clears the drag lock', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  await act(async () => groupSettings(f).props.onClick(event()));
  await act(async () => navButton(f, 'a').props.onContextMenu(event()));
  assert.equal(f.renderer.root.findAllByType('input').length, 0);
  assert.ok(f.renderer.root.findByProps({ className: 'dso-group-panel dso-item-panel dso-floating' }));
  assert.equal(navButton(f, 'a').props.draggable, true);
  assert.equal(f.writes.length, 0); await f.dispose();
});
test('open toolbar and group editor follow DSH Chinese/English changes without changing user names or drafts', async () => {
  const f = await fixture({ layout: namedGroupLayout(), initialLocale: 'zh', withAction: true });
  const dictionary = f.localeDictionaries.get('settings-sidebar-organizer');
  assert.deepEqual(Object.keys(dictionary.zh).sort(), Object.keys(dictionary.en).sort());
  assert.equal(f.renderer.root.findAllByType('button').some(button => button.props.children === '整理侧栏'), true);
  await act(async () => groupSettings(f).props.onClick(event()));
  assert.equal(groupSettings(f).props['aria-expanded'], true);
  assert.equal(groupAction(f, 'save').props.children, '保存名称');
  await act(async () => f.renderer.root.findByType('input').props.onChange({ target: { value: 'Unsaved custom name' } }));
  await f.setLocale('en');
  assert.equal(f.renderer.root.findAllByType('button').some(button => button.props.children === 'Organize sidebar'), true);
  assert.equal(f.renderer.root.findByType('input').props['aria-label'], 'Group name');
  assert.equal(groupAction(f, 'save').props.children, 'Save name'); assert.equal(groupAction(f, 'cancel').props.children, 'Cancel');
  assert.equal(groupAction(f, 'dissolve').props.children, 'Dissolve group');
  assert.equal(f.renderer.root.findByType('input').props.value, 'Unsaved custom name');
  assert.equal(f.form.getSnapshot().value.layout.roots[0].name, 'My group');
  await f.setLocale('zh'); assert.equal(groupAction(f, 'save').props.children, '保存名称');
  await act(async () => groupAction(f, 'cancel').props.onClick());
  assert.equal(groupSettings(f).props['aria-expanded'], false); assert.equal(f.writes.length, 0); await f.dispose();
});
test('an already visible validation message switches language with DSH', async () => {
  const f = await fixture({ layout: namedGroupLayout(), initialLocale: 'zh' });
  await act(async () => groupSettings(f).props.onClick(event()));
  await act(async () => f.renderer.root.findByType('input').props.onChange({ target: { value: '' } }));
  await act(async () => f.renderer.root.findByType('input').props.onKeyDown(event({ key: 'Enter' })));
  assert.equal(f.renderer.root.findByProps({ role: 'alert' }).props.children, '请输入分组名称');
  await f.setLocale('en'); assert.equal(f.renderer.root.findByProps({ role: 'alert' }).props.children, 'Enter a group name');
  assert.equal(f.writes.length, 0); await f.dispose();
});
test('new group default naming uses the active DSH language', async () => {
  const f = await fixture({ initialLocale: 'en' }); await startDrag(f, 'b');
  await act(async () => navButton(f, 'a').props.onDragOver(targetEvent(50, 50)));
  await act(async () => { navButton(f, 'a').props.onDrop(targetEvent(50, 50)); await tick(); });
  assert.equal(f.form.getSnapshot().value.layout.roots[0].name, 'New group'); await f.dispose();
});
test('group popup uses the existing dialog portal and keeps its content out of normal nav flow', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  await act(async () => groupSettings(f).props.onClick(event()));
  const panel = f.renderer.root.findByProps({ className: 'dso-group-panel dso-floating' });
  assert.ok(f.portals.some(portal => portal.container === f.dialogHost && portal.key === 'dso-popover:group:g'));
  assert.equal(panel.props.style.width, 280); assert.equal(panel.props.style.visibility, undefined);
  assert.equal(panel.props['data-placement'], 'right'); assert.equal(f.resizeObservers.size, 1);
  await f.dispatchDocument('pointerdown', event({ target: 'inside-popover' }));
  assert.ok(groupAction(f, 'save'), 'clicking inside a portal must not be mistaken for outside');
  await act(async () => groupAction(f, 'cancel').props.onClick());
  assert.equal(f.resizeObservers.size, 0); assert.equal(f.writes.length, 0); await f.dispose();
});
test('floating popup follows a moved dialog and resize without saving the name draft', async () => {
  const f = await fixture({ layout: namedGroupLayout() });
  await act(async () => groupSettings(f).props.onClick(event()));
  f.dialogHost.getBoundingClientRect = () => ({ left: 100, top: 0, width: 800, height: 700, right: 900, bottom: 700 });
  await f.dispatchWindow('resize');
  const panel = f.renderer.root.findByProps({ className: 'dso-group-panel dso-floating' });
  assert.equal(panel.props.style.left, 110);
  await f.dispatchDocument('pointerdown', event({ target: { closest: () => true } }));
  assert.equal(f.renderer.root.findAllByType('input').length, 0, 'other sidebar rows are outside the current floating surface');
  assert.equal(f.writes.length, 0); await f.dispose();
});
test('popover focus is assigned once after positioning, not stolen on resize or language change', async () => {
  const f = await fixture({ layout: namedGroupLayout(), initialLocale: 'zh' });
  await act(async () => groupSettings(f).props.onClick(event()));
  assert.equal(f.popoverFocusCount(), 1);
  await f.dispatchWindow('resize'); await f.setLocale('en'); assert.equal(f.popoverFocusCount(), 1);
  await act(async () => groupAction(f, 'cancel').props.onClick());
  await act(async () => groupSettings(f).props.onClick(event())); assert.equal(f.popoverFocusCount(), 2);
  await f.dispose();
});
test('scrolling a popup anchor out of the nav viewport closes it without saving', async () => {
  const f = await fixture({ layout: namedGroupLayout() }); let top = 100;
  const anchor = { isConnected: true, getBoundingClientRect: () => ({ left: 150, right: 178, top, bottom: top + 28 }), closest: () => ({ getBoundingClientRect: () => ({ left: 0, right: 200, top: 0, bottom: 500 }) }) };
  await act(async () => groupSettings(f).props.onClick(event({ currentTarget: anchor })));
  assert.ok(groupAction(f, 'save')); top = 600;
  await f.dispatchDocument('scroll', event());
  assert.equal(f.renderer.root.findAllByType('input').length, 0); assert.equal(f.resizeObservers.size, 0); assert.equal(f.writes.length, 0); await f.dispose();
});
test('read-only collapsed groups still expand locally and native settings remain reachable without writes', async () => {
  const f = await fixture({ writable: false, layout: { version: 1, roots: [{ type: 'group', id: 'g', name: 'Group', open: false,
    children: [{ type: 'item', id: 'a' }, { type: 'item', id: 'b' }] }] } });
  assert.equal(navButton(f, 'a'), undefined);
  const group = f.renderer.root.findAllByType('button').find(button => button.props['data-organizer-group'] === 'g');
  await act(async () => group.props.onClick());
  assert.equal(navButton(f, 'a').props.draggable, false);
  await act(async () => navButton(f, 'a').props.onClick(event()));
  assert.deepEqual(f.selections, ['a']); assert.equal(f.writes.length, 0);
  await f.dispose();
});

test('unsupported native panel structure keeps native navigation and content intact', async () => {
  const f = await fixture({ unsupportedPanel: true });
  assert.equal(navButton(f, 'a'), undefined);
  const native = f.renderer.root.findAllByType('button').find(button => button.children.some(child => child.type === 'span' && child.children.includes('Alpha')));
  assert.ok(native); assert.equal(native.props.draggable, undefined);
  await act(async () => native.props.onClick()); assert.deepEqual(f.selections, ['a']);
  assert.equal(f.renderer.root.findAll(node => node.props['data-native-section']).length, 1);
  await f.dispose();
});

test('adapter render failure is caught locally rather than abdicating the native settings owner', async () => {
  // An invalid live id fails inside projectLayout/Navigation, not in native UI.
  const before = console.error; const errors = []; console.error = (...args) => errors.push(args);
  let f;
  try {
    f = await fixture({ rows: [{ id: '', label: 'Invalid live id' }, { id: 'b', label: 'Beta' }] });
    assert.equal(navButton(f, 'b'), undefined, 'custom navigation must fall back');
    assert.equal(f.renderer.root.findAll(node => node.props.role === 'dialog').length, 1);
    assert.equal(f.renderer.root.findAll(node => node.props['data-native-section']).length, 1);
    assert.equal(f.slots.entriesOfSlot('sidebar.settings')[0], f.entry);
    assert.equal(f.writes.length, 0);
    assert.ok(errors.length, 'React reports the caught adapter failure');
  } finally { console.error = before; if (f) await f.dispose(); }
});
