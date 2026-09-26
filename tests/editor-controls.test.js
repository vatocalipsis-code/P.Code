import test from 'node:test';
import assert from 'node:assert/strict';
import { NUMERIC_CONTROL_SPECS, sliderSpecFor } from '../editor/control-specs.js';

test('transparency sliders use the canonical 0..1 interval', () => {
  for (const key of ['PanelTransparency','Transparency','TextTransparency','PictureTransparency']) {
    assert.deepEqual(NUMERIC_CONTROL_SPECS[key], {min:0,max:1,step:0.01});
  }
});

test('FontWeight slider preserves the canonical 1..1000 interval', () => {
  assert.deepEqual(NUMERIC_CONTROL_SPECS.FontWeight, {min:1,max:1000,step:1});
});

test('editor slider range expands to show an existing value without redefining semantics', () => {
  assert.equal(sliderSpecFor('Width', 1600).max, 1600);
  assert.equal(sliderSpecFor('Parallax', -120).min, -120);
});
