import { emptyLayout, sanitizeLayout } from './model.js';

/** Shared host-backed view state. Never writes while loading or reconciling the roster. */
export function createLayoutController(form) {
  let snapshot = { layout: emptyLayout(), ready: false, writable: false, busy: false, saved: false, error: null };
  let disposed = false;
  const listeners = new Set();
  const publish = patch => {
    if (disposed) return;
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  };
  const sync = () => {
    if (snapshot.busy) return;
    const next = form.getSnapshot();
    if (next.status !== 'ready') return publish({ ready: false, writable: false });
    try {
      publish({ layout: sanitizeLayout(next.value.layout), ready: true, writable: next.writable, error: null });
    } catch (error) {
      publish({ ready: false, writable: false, error: String(error.message) });
    }
  };
  const off = form.subscribe(sync);
  sync();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    // Presentation only: do not leave an old 'saved' badge on an uncommitted drag.
    beginGesture() { if (!disposed) publish({ saved: false, notice: 'dragging', error: null }); },
    cancelGesture() { if (!disposed) publish({ saved: false, notice: 'dropCancelled' }); },
    async commit(update) {
      if (disposed || !snapshot.ready || !snapshot.writable || snapshot.busy) return false;
      const previous = snapshot.layout;
      let next;
      try { next = sanitizeLayout(update(previous)); }
      catch (error) { publish({ notice: null, error: String(error.message) }); return false; }
      if (JSON.stringify(previous) === JSON.stringify(next)) { publish({ notice: 'noChange' }); return true; }
      // Pin the revision read BEFORE the gesture; never overwrite another window silently.
      const revision = form.getSnapshot().revision;
      publish({ layout: next, busy: true, notice: null, saved: false, error: null });
      try {
        const accepted = await form.mutate([{ op: 'set', path: ['layout'], value: next }], revision);
        if (!accepted) throw new Error('Save rejected or conflicted');
        publish({ busy: false, saved: true });
        sync();
        return true;
      } catch (error) {
        publish({ layout: previous, busy: false });
        sync();
        publish({ error: String(error.message) });
        return false;
      }
    },
    dispose() { disposed = true; off(); listeners.clear(); },
  };
}
