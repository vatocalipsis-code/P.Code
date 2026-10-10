import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('the shared browser renderer does not name application skins or screens',()=>{
  const css=readFileSync(new URL('../runtime/renderer.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/U\.Cash|ucash|OldStyle|Functional|data-uc-style|data-skin/i);
});
