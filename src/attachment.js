const SETTINGS_SLOT = 'sidebar.settings';

/**
 * The rc.1 shell owns its child declarations even while shadowed. Registering a
 * second root with `children: owner.children` is invalid (settings.launcher is
 * already declared). There is no navigation slot in rc.1.
 *
 * Keep this narrow, version-specific decoration on the ORIGINAL entry: its
 * renderer still supplies its own authorized renderSlot, locale, store and
 * inject face. A lower-priority, childless seat only invalidates the outlet;
 * it never renders or claims the native children. No DOM or service patching.
 */
export function decorateSettingsEntry(slots, owner, makeRoot, mark) {
  const original = owner.component;
  let active = true;
  const component = makeRoot({ ...owner, component: original }, () => active);
  if (typeof component !== 'function') throw new TypeError('Invalid settings decorator');
  mark(component);
  const usedPriorities = new Set(slots.entries(SETTINGS_SLOT).map(entry => entry.options.priority ?? 0));
  let priority = (owner.options.priority ?? 0) + 1;
  while (usedPriorities.has(priority)) priority++;
  owner.component = component;
  let release;
  try {
    release = slots.register({
      name: SETTINGS_SLOT,
      priority,
    }, function SettingsInvalidationSeat() { return null; });
  } catch (error) {
    active = false;
    if (owner.component === component) owner.component = original;
    throw error;
  }
  let disposed = false;
  return { component, dispose() {
    if (disposed) return;
    disposed = true;
    active = false;
    // Never overwrite a newer decorator installed by another plugin.
    if (owner.component === component) owner.component = original;
    release();
  } };
}

/** Observe the RAW ledger, not entriesOfSlot (which only returns winners).
 * Attach outside the registering transaction; restore on owner/plugin unload.
 */
export function observeSettingsOwner(slots, attach, report) {
  let disposed = false;
  let scheduled = false;
  let owner;
  let attached;
  let rejectedOwner;
  let rejectedReason = '';
  const ownComponents = new Set();
  const message = error => String(error?.message ?? error);
  const publish = (phase, reason = '') => { if (!disposed) report({ phase, reason }); };
  function detach() {
    const previous = attached;
    attached = undefined;
    owner = undefined;
    previous?.dispose();
    if (previous) ownComponents.delete(previous.component);
  }
  function reconcile() {
    scheduled = false;
    if (disposed) return;
    const entries = slots.entries(SETTINGS_SLOT);
    // The original owner stays in the ledger, with our decorated component.
    if (attached && entries.includes(owner)) {
      if (owner.component === attached.component) return;
      // A later decorator may capture our component in its closure. Do not wrap
      // that chain again; deactivate our layer and leave the newer one intact.
      rejectedOwner = owner;
      rejectedReason = 'Settings component changed by another plugin; organizer adapter disabled for this owner';
    }
    detach();
    const native = entries.find(entry => !ownComponents.has(entry.component)
      && entry.children?.['settings.section'] && entry.store
      && typeof entry.inject === 'function' && typeof entry.component === 'function');
    if (!native) {
      publish(entries.length ? 'unsupported' : 'waiting',
        entries.length ? 'No settings owner with section declarations, component, store and inject face' : '');
      return;
    }
    if (native === rejectedOwner) {
      publish('error', rejectedReason);
      return;
    }
    owner = native;
    try {
      const next = attach(native, component => ownComponents.add(component));
      if (!next || typeof next.dispose !== 'function' || typeof next.component !== 'function') {
        throw new TypeError('Invalid settings attachment handle');
      }
      attached = next;
      publish('registered');
    } catch (error) {
      rejectedOwner = native;
      rejectedReason = message(error);
      owner = undefined;
      publish('error', rejectedReason);
    }
  }
  function schedule() {
    if (disposed || scheduled) return;
    scheduled = true;
    queueMicrotask(reconcile);
  }
  const off = slots.subscribe(SETTINGS_SLOT, schedule);
  schedule();
  return () => {
    if (disposed) return;
    disposed = true;
    off();
    detach();
    ownComponents.clear();
  };
}

/** Stable immutable snapshot for UI status; never writes layout or profile data. */
export function createAttachmentStatus() {
  let snapshot = { phase: 'waiting', reason: '' };
  const listeners = new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    report(next) {
      if (next.phase === snapshot.phase && (next.reason || '') === snapshot.reason) return;
      snapshot = { phase: next.phase, reason: next.reason || '' };
      for (const listener of listeners) listener();
    },
  };
}

/** Match by the original React key, never by position or a permissive button count. */
export function matchNavigationButtons(React, children, rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const buttons = Array.isArray(children) ? children : [children];
  if (buttons.length !== rows.length) return null;
  const byId = new Map();
  for (const button of buttons) {
    if (!React.isValidElement(button) || button.type !== 'button'
      || typeof button.props.onClick !== 'function' || button.key == null) return null;
    const id = String(button.key);
    if (byId.has(id)) return null;
    byId.set(id, button);
  }
  return rows.every(row => byId.has(row.id)) ? rows.map(row => byId.get(row.id)) : null;
}

/** A group's view state is independent of permission to persist its preference. */
export function isGroupOpen(group, localOpen) {
  return Object.hasOwn(localOpen, group.id) ? localOpen[group.id] : group.open;
}
// Components are included by build.mjs; keep this module dependency-free.
