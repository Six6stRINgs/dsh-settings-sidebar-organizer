import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placePopover } from '../src/popover.js';
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
const bounds = rect(0, 0, 800, 700);
test('popover normally sits to the right of its trigger without consuming nav layout', () => {
  assert.deepEqual(placePopover(rect(172, 100, 28, 28), bounds, 230), { left: 210, top: 100, width: 280, maxHeight: 676, placement: 'right' });
});
test('popover flips horizontally and shifts upwards near dialog edges', () => {
  const position = placePopover(rect(740, 580, 28, 28), bounds, 230);
  assert.equal(position.placement, 'left'); assert.equal(position.left, 450); assert.equal(position.top, 458);
  assert.ok(position.left >= 12 && position.left + position.width <= 788);
  assert.ok(position.top + 230 <= 688);
});
test('small dialogs constrain popup width and scrolling height instead of clipping it', () => {
  const position = placePopover(rect(180, 100, 28, 28), rect(0, 0, 240, 180), 300);
  assert.deepEqual(position, { left: 12, top: 12, width: 216, maxHeight: 156, placement: 'clamped' });
});
test('popover placement accounts for translated and scaled dialog coordinates', () => {
  const position = placePopover(rect(444, 250, 56, 56), rect(100, 50, 1600, 1400), 230, { scaleX: 2, scaleY: 2 });
  assert.deepEqual(position, { left: 210, top: 100, width: 280, maxHeight: 676, placement: 'right' });
});
test('RTL prefers the left but can fall back to the right', () => {
  assert.equal(placePopover(rect(500, 80, 28, 28), bounds, 200, { direction: 'rtl' }).placement, 'left');
  const position = placePopover(rect(20, 80, 28, 28), bounds, 200, { direction: 'rtl' });
  assert.equal(position.placement, 'right'); assert.equal(position.left, 58);
});
test('invalid, detached-size or too-small hosts produce no unsafe placement', () => {
  const anchor = rect(0, 0, 28, 28);
  assert.equal(placePopover(anchor, rect(0, 0, 0, 700), 200), null);
  assert.equal(placePopover(anchor, rect(0, 0, 20, 20), 200), null);
  assert.equal(placePopover({ ...anchor, left: NaN }, bounds, 200), null);
  assert.equal(placePopover(anchor, bounds, 200, { scaleX: 0 }), null);
});
