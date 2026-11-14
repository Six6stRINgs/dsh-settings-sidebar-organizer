const MAX_NODES = 1000;
const MAX_ID_LENGTH = 256;
const MAX_GROUP_NAME_LENGTH = 120;
const DEFAULT_GROUP_NAME = 'New group';

export function emptyLayout() {
  return { version: 1, roots: [] };
}

/** Validate and defensively copy a persisted layout. Unknown/future schemas are never repaired silently. */
export function sanitizeLayout(input) {
  if (!isRecord(input)) throw new TypeError('Layout must be an object');
  if (input.version !== 1) {
    if (Number.isInteger(input.version) && input.version > 1) {
      throw new RangeError(`Unsupported future layout version: ${input.version}`);
    }
    throw new TypeError('Layout version must be 1');
  }
  assertOnlyKeys(input, ['version', 'roots'], 'layout');
  if (!Array.isArray(input.roots)) throw new TypeError('Layout roots must be an array');

  const seen = new Set();
  let count = 0;
  const roots = input.roots.map((node, index) => {
    count += 1;
    if (count > MAX_NODES) throw new RangeError(`Layout exceeds ${MAX_NODES} nodes`);
    if (!isRecord(node)) throw new TypeError(`Root ${index} must be an object`);
    if (node.type === 'item') {
      assertOnlyKeys(node, ['type', 'id'], `item at root ${index}`);
      const id = validateId(node.id, `item at root ${index}`);
      assertUnique(seen, id);
      return { type: 'item', id };
    }
    if (node.type === 'group') {
      assertOnlyKeys(node, ['type', 'id', 'name', 'open', 'children'], `group at root ${index}`);
      const id = validateId(node.id, `group at root ${index}`);
      assertUnique(seen, id);
      if (typeof node.name !== 'string' || !node.name.trim() || node.name.length > MAX_GROUP_NAME_LENGTH) {
        throw new TypeError(`Group ${id} must have a non-empty name of at most ${MAX_GROUP_NAME_LENGTH} characters`);
      }
      if (typeof node.open !== 'boolean') throw new TypeError(`Group ${id} open must be a boolean`);
      if (!Array.isArray(node.children)) throw new TypeError(`Group ${id} children must be an array`);
      const children = node.children.map((child, childIndex) => {
        count += 1;
        if (count > MAX_NODES) throw new RangeError(`Layout exceeds ${MAX_NODES} nodes`);
        if (!isRecord(child) || child.type !== 'item') {
          throw new TypeError(`Group ${id} child ${childIndex} must be a leaf item`);
        }
        assertOnlyKeys(child, ['type', 'id'], `child ${childIndex} of group ${id}`);
        const childId = validateId(child.id, `child ${childIndex} of group ${id}`);
        assertUnique(seen, childId);
        return { type: 'item', id: childId };
      });
      return { type: 'group', id, name: node.name.trim(), open: node.open, children };
    }
    throw new TypeError(`Unknown node type at root ${index}`);
  });
  return { version: 1, roots };
}

/** Return a live-only view while leaving the persisted layout (including offline IDs) untouched. */
export function projectLayout(layout, liveIds) {
  const clean = sanitizeLayout(layout);
  const live = normalizeLiveIds(liveIds);
  appendNewLiveIds(clean, live);
  const roots = [];
  for (const node of clean.roots) {
    if (node.type === 'item') {
      if (live.has(node.id)) roots.push(node);
    } else {
      const children = node.children.filter(child => live.has(child.id));
      if (children.length) roots.push({ ...node, children });
    }
  }
  return { version: 1, roots };
}

/** Apply one menu-editor drop. Invalid/self/incompatible targets return an unchanged defensive copy. */
export function applyDrop(layout, liveIds, sourceKey, targetKey, zone, options = {}) {
  const clean = sanitizeLayout(layout);
  const live = normalizeLiveIds(liveIds);
  const prepared = appendNewLiveIds(clean, live);
  // Projection can show newly installed entries at the capacity boundary, but
  // an explicit gesture must never produce an invalid persisted document.
  sanitizeLayout(prepared);
  if (!['before', 'after', 'center'].includes(zone)) throw new TypeError('zone must be before, after, or center');
  if (typeof sourceKey !== 'string' || typeof targetKey !== 'string' || sourceKey === targetKey) return prepared;

  const source = findByKey(prepared, sourceKey);
  const target = findByKey(prepared, targetKey);
  if (!source || !target || !isLiveNode(source.node, live) || !isLiveNode(target.node, live)) return prepared;
  if (sourceKey === targetKey) return prepared;

  if (source.node.type === 'group') {
    if (zone === 'center') return prepared;
    // A group can only be reordered among roots. A child target anchors to its containing root group.
    const targetRoot = target.parent ? prepared.roots[target.parent.rootIndex] : target.node;
    if (targetRoot === source.node) return prepared; // includes dropping a group onto its own child
    const sourceIndex = prepared.roots.indexOf(source.node);
    if (sourceIndex < 0) return prepared;
    prepared.roots.splice(sourceIndex, 1);
    const anchor = prepared.roots.indexOf(targetRoot);
    if (anchor < 0) return prepared;
    prepared.roots.splice(anchor + (zone === 'after' ? 1 : 0), 0, source.node);
    return prepared;
  }

  if (target.node.type === 'group') {
    if (zone === 'center') {
      if (target.node === source.parent?.group) return prepared;
      detachItem(prepared, source);
      target.node.children.push(source.node);
      return prepared;
    }
    // A leaf dropped beside a group is placed at the root, next to that group.
    detachItem(prepared, source);
    const anchor = prepared.roots.indexOf(target.node);
    if (anchor < 0) return prepared;
    prepared.roots.splice(anchor + (zone === 'after' ? 1 : 0), 0, source.node);
    return prepared;
  }

  if (zone === 'center') {
    if (target.parent) {
      // Child leaves cannot create nested groups; append to their current parent group.
      if (source.parent?.group === target.parent.group) return prepared;
      detachItem(prepared, source);
      const group = target.parent.group;
      group.children.push(source.node);
      return prepared;
    }

    // Centering on a root leaf creates a group at the target's root position.
    const targetIndex = prepared.roots.indexOf(target.node);
    if (targetIndex < 0) return prepared;
    if (prepared.roots.reduce((count, node) => count + 1 + (node.type === 'group' ? node.children.length : 0), 0) >= MAX_NODES) {
      throw new RangeError(`Cannot create group: layout exceeds ${MAX_NODES} nodes`);
    }
    const { groupId, groupName } = getCreationOptions(options, prepared, target.node.id);
    if (allIds(prepared).has(groupId)) throw new TypeError(`Group id already exists: ${groupId}`);
    detachItem(prepared, source);
    const currentTargetIndex = prepared.roots.indexOf(target.node);
    if (currentTargetIndex < 0) return prepared;
    prepared.roots.splice(currentTargetIndex, 1, {
      type: 'group', id: groupId, name: groupName, open: true,
      children: [target.node, source.node],
    });
    return prepared;
  }

  // before/after a leaf inserts beside it in its current list (root or group children).
  detachItem(prepared, source);
  const freshTarget = findByKey(prepared, targetKey);
  if (!freshTarget || freshTarget.node.type !== 'item') return prepared;
  const list = freshTarget.parent ? freshTarget.parent.group.children : prepared.roots;
  const anchor = list.indexOf(freshTarget.node);
  if (anchor < 0) return prepared;
  list.splice(anchor + (zone === 'after' ? 1 : 0), 0, source.node);
  return prepared;
}

export function toggleGroup(layout, id, liveIds, desiredOpen) {
  const clean = prepareGroupEdit(layout, liveIds);
  const group = clean.roots.find(node => node.type === 'group' && node.id === id);
  if (group) group.open = typeof desiredOpen === 'boolean' ? desiredOpen : !group.open;
  return clean;
}

export function renameGroup(layout, id, name, liveIds) {
  const clean = prepareGroupEdit(layout, liveIds);
  const group = clean.roots.find(node => node.type === 'group' && node.id === id);
  if (group) {
    if (typeof name !== 'string' || !name.trim() || name.length > MAX_GROUP_NAME_LENGTH) {
      throw new TypeError(`Group name must be non-empty and at most ${MAX_GROUP_NAME_LENGTH} characters`);
    }
    group.name = name.trim();
  }
  return clean;
}

export function dissolveGroup(layout, id, liveIds) {
  const clean = prepareGroupEdit(layout, liveIds);
  const index = clean.roots.findIndex(node => node.type === 'group' && node.id === id);
  if (index >= 0) {
    const [group] = clean.roots.splice(index, 1);
    clean.roots.splice(index, 0, ...group.children);
  }
  return clean;
}

export function dropZone(y, height) {
  if (!Number.isFinite(y) || !Number.isFinite(height) || height <= 0) {
    throw new TypeError('dropZone expects finite y and positive height');
  }
  const ratio = y / height;
  if (ratio < 0.28) return 'before';
  if (ratio > 0.72) return 'after';
  return 'center';
}

/** Menu edits use the same IDs as projection/drop, while preserving offline members. */
function prepareGroupEdit(layout, liveIds) {
  const clean = sanitizeLayout(layout);
  return liveIds === undefined ? clean : sanitizeLayout(appendNewLiveIds(clean, normalizeLiveIds(liveIds)));
}

function appendNewLiveIds(layout, live) {
  // A newly installed section can collide with a formerly private group id.
  // Re-key the group deterministically on the defensive copy, never the Host
  // snapshot. Projection and the next explicit save then use the same ids.
  const used = new Set([...allIds(layout), ...live]);
  for (const node of layout.roots) {
    if (node.type !== 'group' || !live.has(node.id)) continue;
    const base = ('group:' + node.id).slice(0, MAX_ID_LENGTH);
    let id = base;
    let suffix = 2;
    while (used.has(id)) {
      const tail = ':' + suffix++;
      id = base.slice(0, MAX_ID_LENGTH - tail.length) + tail;
    }
    node.id = id;
    used.add(id);
  }
  const known = new Set(allItemIds(layout));
  for (const id of live) if (!known.has(id)) layout.roots.push({ type: 'item', id });
  return layout;
}

function normalizeLiveIds(input) {
  if (!Array.isArray(input)) throw new TypeError('liveIds must be an array');
  const live = new Set();
  for (const entry of input) {
    // Slot metadata (including a localized label) is deliberately ignored; stable `id` is identity.
    const id = typeof entry === 'string' ? entry : (isRecord(entry) ? entry.id : undefined);
    validateId(id, 'live id');
    if (live.has(id)) throw new TypeError(`Duplicate live id: ${id}`);
    live.add(id);
  }
  return live;
}

function isLiveNode(node, live) {
  return node.type === 'item' ? live.has(node.id) : node.children.some(child => live.has(child.id));
}

function findByKey(layout, key) {
  const match = /^(item|group):(.+)$/.exec(key);
  if (!match) return null;
  const [, type, id] = match;
  for (let rootIndex = 0; rootIndex < layout.roots.length; rootIndex += 1) {
    const node = layout.roots[rootIndex];
    if (node.type === type && node.id === id) return { node, parent: null, rootIndex };
    if (node.type === 'group' && type === 'item') {
      const child = node.children.find(item => item.id === id);
      if (child) return { node: child, parent: { group: node, rootIndex }, rootIndex };
    }
  }
  return null;
}

function detachItem(layout, location) {
  const list = location.parent ? location.parent.group.children : layout.roots;
  const index = list.indexOf(location.node);
  if (index >= 0) list.splice(index, 1);
}

function getCreationOptions(options, layout, targetId) {
  if (!isRecord(options)) throw new TypeError('options must be an object');
  assertOnlyKeys(options, ['groupId', 'groupName'], 'drop options');
  const name = options.groupName === undefined ? DEFAULT_GROUP_NAME : options.groupName;
  if (typeof name !== 'string' || !name.trim() || name.length > MAX_GROUP_NAME_LENGTH) {
    throw new TypeError(`Group name must be non-empty and at most ${MAX_GROUP_NAME_LENGTH} characters`);
  }
  let id;
  if (options.groupId !== undefined) {
    id = validateId(options.groupId, 'new group id');
  } else {
    const used = allIds(layout);
    const base = `group:${targetId}`.slice(0, MAX_ID_LENGTH);
    id = base;
    let suffix = 2;
    while (used.has(id)) {
      const tail = `:${suffix++}`;
      id = `${base.slice(0, MAX_ID_LENGTH - tail.length)}${tail}`;
    }
  }
  return { groupId: id, groupName: name.trim() };
}

function allItemIds(layout) {
  const ids = [];
  for (const root of layout.roots) {
    if (root.type === 'item') ids.push(root.id);
    else for (const child of root.children) ids.push(child.id);
  }
  return ids;
}

function allIds(layout) {
  const ids = new Set();
  for (const root of layout.roots) {
    ids.add(root.id);
    if (root.type === 'group') for (const child of root.children) ids.add(child.id);
  }
  return ids;
}

function validateId(id, where) {
  if (typeof id !== 'string' || !id.trim() || id.length > MAX_ID_LENGTH) {
    throw new TypeError(`${where} must be a non-empty string of at most ${MAX_ID_LENGTH} characters`);
  }
  return id;
}

function assertUnique(seen, id) {
  if (seen.has(id)) throw new TypeError(`Duplicate layout id: ${id}`);
  seen.add(id);
}

function assertOnlyKeys(value, allowed, where) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown field ${key} in ${where}`);
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
