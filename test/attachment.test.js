import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots';
import { observeSettingsOwner, decorateSettingsEntry, createAttachmentStatus, matchNavigationButtons } from '../src/attachment.js';
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const spec = kind => ({ kind, scope: 'root' });
function fixture() {
  const slots = new SlotCore();
  slots.register({ name: 'root', children: { 'sidebar.settings': spec('single') } }, () => null);
  const reports = [];
  const attachments = [];
  const addNative = () => {
    const original = function NativeSettingsRoot() {};
    const dispose = slots.register({ name: 'sidebar.settings', store: { create() {} }, locale: 'settings',
      children: { 'settings.launcher': spec('single'), 'settings.section': spec('list'), 'settings.action': spec('list') },
      inject: () => ({}) }, original);
    const entry = slots.entries('sidebar.settings').find(entry => entry.component === original);
    return { original, entry, dispose };
  };
  const attach = (owner, mark) => {
    const handle = decorateSettingsEntry(slots, owner, () => function DecoratedRoot() {}, mark);
    attachments.push(handle); return handle;
  };
  return { slots, addNative, reports, attachments, attach, report: value => reports.push(value) };
}

test('real rc.1 SlotCore reproduces duplicate child declarations when shadowing', () => {
  const f = fixture(); const { entry } = f.addNative();
  assert.throws(() => f.slots.register({ name: 'sidebar.settings', priority: -100, children: entry.children }, () => null), /settings.launcher.*already declared/);
  assert.equal(f.slots.entries('sidebar.settings').length, 1, 'failed registration must be atomic');
});
test('late owner decorates once and preserves child declarations, store, locale and inject', async () => {
  const f = fixture(); const off = observeSettingsOwner(f.slots, f.attach, f.report);
  await tick(); assert.equal(f.reports.at(-1).phase, 'waiting');
  const { entry, original } = f.addNative();
  const { store, inject, children, locale } = entry;
  assert.equal(f.attachments.length, 0);
  await tick(); assert.equal(f.attachments.length, 1); assert.notEqual(entry.component, original);
  assert.equal(f.slots.entriesOfSlot('sidebar.settings')[0], entry, 'original declaration owner remains winner');
  assert.deepEqual([entry.store, entry.inject, entry.children, entry.locale], [store, inject, children, locale]);
  assert.equal(f.slots.spec('settings.launcher').kind, 'single');
  await tick(); assert.equal(f.attachments.length, 1, 'must not detach and reattach on own notification');
  off(); assert.equal(entry.component, original); assert.equal(f.slots.entries('sidebar.settings').length, 1);
});
test('owner replacement restores old component and decorates new generation', async () => {
  const f = fixture(); const first = f.addNative();
  const off = observeSettingsOwner(f.slots, f.attach, f.report); await tick();
  first.dispose(); const next = f.addNative(); await tick();
  assert.equal(first.entry.component, first.original); assert.notEqual(next.entry.component, next.original);
  assert.equal(f.attachments.length, 2); off(); assert.equal(next.entry.component, next.original);
});
test('owner removal and plugin disposal are idempotent and cancel queued attachment', async () => {
  const f = fixture(); const first = f.addNative(); const off = observeSettingsOwner(f.slots, f.attach, f.report);
  off(); off(); await tick(); assert.equal(f.attachments.length, 0);
  const off2 = observeSettingsOwner(f.slots, f.attach, f.report); await tick(); first.dispose(); await tick();
  assert.equal(first.entry.component, first.original); assert.equal(f.reports.at(-1).phase, 'waiting'); off2();
});
test('registration failure restores the native component and does not self-retry', async () => {
  const f = fixture(); const { entry, original } = f.addNative(); let calls = 0;
  const slots = { entries: key => f.slots.entries(key), subscribe: (key, fn) => f.slots.subscribe(key, fn), register() { calls++; throw new Error('registration rejected'); } };
  const off = observeSettingsOwner(slots, (owner, mark) => decorateSettingsEntry(slots, owner, () => function Wrapped() {}, mark), f.report);
  await tick(); assert.equal(entry.component, original); assert.equal(calls, 1);
  assert.equal(f.reports.at(-1).phase, 'error'); off();
});
test('cleanup does not overwrite a newer third-party decorator', async () => {
  const f = fixture(); const { entry } = f.addNative(); const handle = f.attach(entry, () => {});
  const newer = function Newer() {}; entry.component = newer; handle.dispose(); handle.dispose();
  assert.equal(entry.component, newer);
});
test('navigation matching rejects mismatched, unkeyed or extra buttons instead of guessing by index', () => {
  const rows = [{ id: 'a' }, { id: 'b' }];
  const button = id => React.createElement('button', { key: id, onClick() {} }, id);
  const a = button('a'); const b = button('b');
  assert.deepEqual(matchNavigationButtons(React, [b, a], rows), [a, b]);
  for (const children of [[a], [a, a], [a, button('unknown')], [a, b, button('c')], [a, React.createElement('button', { onClick() {} })]]) {
    assert.equal(matchNavigationButtons(React, children, rows), null);
  }
});
test('later third-party wrappers do not cause rewrapping and captured decorators go inert', async () => {
  const f = fixture(); const { entry } = f.addNative();
  entry.component = () => 'native'; let calls = 0;
  const off = observeSettingsOwner(f.slots, (owner, mark) => {
    calls++;
    return decorateSettingsEntry(f.slots, owner, (original, isActive) => function Wrapped() {
      return isActive() ? 'organizer(' + original.component() + ')' : original.component();
    }, mark);
  }, f.report);
  await tick(); assert.equal(entry.component(), 'organizer(native)');
  const captured = entry.component; const newer = () => 'thirdparty(' + captured() + ')'; entry.component = newer;
  const invalidate = f.slots.register({ name: 'sidebar.settings', priority: 5 }, () => null);
  await tick(); assert.equal(calls, 1); assert.equal(entry.component, newer);
  assert.equal(entry.component(), 'thirdparty(native)');
  assert.equal(f.reports.at(-1).phase, 'error');
  off(); invalidate(); await tick(); assert.equal(entry.component(), 'thirdparty(native)');
});
test('passive invalidation seat avoids priorities already occupied by another extension', () => {
  const f = fixture(); const { entry } = f.addNative();
  const stopOther = f.slots.register({ name: 'sidebar.settings', priority: 1 }, () => null);
  const handle = f.attach(entry, () => {});
  assert.deepEqual(f.slots.entries('sidebar.settings').map(value => value.options.priority ?? 0), [0, 1, 2]);
  handle.dispose(); stopOther();
});
test('attachment status uses stable snapshots and only notifies on changes', () => {
  const status = createAttachmentStatus(); let calls = 0; const off = status.subscribe(() => calls++);
  const initial = status.getSnapshot(); status.report({ phase: 'waiting' }); assert.equal(status.getSnapshot(), initial);
  status.report({ phase: 'ready' }); status.report({ phase: 'ready' }); assert.equal(calls, 1);
  off(); status.report({ phase: 'error', reason: 'detail' }); assert.equal(calls, 1);
});
