/** Place an owned floating surface in the existing settings dialog's coordinates. */
export function placePopover(anchor, bounds, panelHeight, { scaleX = 1, scaleY = 1, direction = 'ltr', preferredWidth = 280, margin = 12, gap = 10 } = {}) {
  const values = [anchor?.left, anchor?.right, anchor?.top, anchor?.bottom, bounds?.left, bounds?.top, bounds?.width, bounds?.height, panelHeight, scaleX, scaleY, preferredWidth, margin, gap];
  if (!values.every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0 || scaleX <= 0 || scaleY <= 0 || margin < 0 || gap < 0 || preferredWidth <= 0) return null;
  const hostWidth = bounds.width / scaleX; const hostHeight = bounds.height / scaleY;
  const width = Math.min(preferredWidth, Math.max(0, hostWidth - margin * 2));
  const maxHeight = Math.max(0, hostHeight - margin * 2);
  if (!width || !maxHeight) return null;
  const anchorLeft = (anchor.left - bounds.left) / scaleX;
  const anchorRight = (anchor.right - bounds.left) / scaleX;
  const anchorTop = (anchor.top - bounds.top) / scaleY;
  const right = anchorRight + gap; const left = anchorLeft - width - gap;
  const fitsRight = right + width <= hostWidth - margin;
  const fitsLeft = left >= margin;
  const preferLeft = direction === 'rtl';
  let placement; let x;
  if (preferLeft ? fitsLeft : fitsRight) { placement = preferLeft ? 'left' : 'right'; x = preferLeft ? left : right; }
  else if (preferLeft ? fitsRight : fitsLeft) { placement = preferLeft ? 'right' : 'left'; x = preferLeft ? right : left; }
  else { placement = 'clamped'; x = preferLeft ? left : right; }
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  return {
    left: clamp(x, margin, hostWidth - margin - width),
    top: clamp(anchorTop, margin, hostHeight - margin - Math.min(Math.max(0, panelHeight), maxHeight)),
    width, maxHeight, placement,
  };
}
