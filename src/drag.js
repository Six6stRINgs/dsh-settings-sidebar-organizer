/** Infer the layout of OUR rendered navigation list, including horizontal theme tabs. */
export function navigationAxis(list, readStyle) {
  if (!list) return 'y';
  let style;
  try { style = readStyle?.(list); } catch { /* Style lookup must never abort native dragstart. */ }
  if (style?.display?.includes('flex')) return style.flexDirection?.startsWith('row') ? 'x' : 'y';
  const rows = [...(list.children || [])].filter(node => node.dataset?.dsoRoot === 'true');
  if (rows.length > 1) {
    const a = rows[0].getBoundingClientRect();
    const b = rows[1].getBoundingClientRect();
    if (Math.abs(b.left - a.left) > Math.abs(b.top - a.top)) return 'x';
  }
  return 'y';
}

/** Recompute at DROP time. Hover state is only a preview, never authorization. */
export function pointerDropZone(event, axis, preview) {
  const rect = event.currentTarget?.getBoundingClientRect?.();
  const position = axis === 'x' ? event.clientX : event.clientY;
  const start = axis === 'x' ? rect?.left : rect?.top;
  const size = axis === 'x' ? rect?.width : rect?.height;
  if (Number.isFinite(position) && Number.isFinite(start) && Number.isFinite(size) && size > 0) {
    const ratio = (position - start) / size;
    return ratio < 0.28 ? 'before' : ratio > 0.72 ? 'after' : 'center';
  }
  return preview || null;
}

export function allowedDrop(source, targetKey, parent, zone) {
  if (!source || !zone || source.key === targetKey) return false;
  return source.type !== 'group' || (!parent && zone !== 'center');
}
