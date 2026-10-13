import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSPL,serializeSPL} from '../editor/spl.js';
import {validateSetEnvelope} from '../runtime/validator.js';

test('SPL palette round-trips and rejects missing or malformed colors',()=>{
 const project=parseSPL(`SetLang { Name = "palette" Version = 1 Requires [ "pcode.appearance-palette.v1" ]
 AppearancePalette { Light { Background = "#123456" Panel = "#ffffff" Tint = "#abcdef" } Dark { Background = "#101010" Panel = "#222222" Tint = "#333333" } } Data {} }
 SetData { Name = "data" Version = 1 Data {} } SetRender { Name = "render" Version = 1 Data {} }`);
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang.AppearancePalette,project.SetLang.AppearancePalette);
 validateSetEnvelope(project.SetLang,'SetLang');
 for(const change of [p=>delete p.AppearancePalette.Dark.Panel,p=>p.AppearancePalette.Light.Background='red',p=>p.Requires=[]]){
  const invalid=structuredClone(project.SetLang);change(invalid);assert.throws(()=>validateSetEnvelope(invalid,'SetLang'));
 }
});
