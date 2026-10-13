import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSetEnvelope} from '../runtime/validator.js';
import {updateDocumentTitle} from '../runtime/web-renderer.js';
import {parseSPL,serializeSPL} from '../editor/spl.js';

test('SPL owns the document title source and requires negotiation',()=>{
 const project={SetLang:{Name:'title',Version:1,DocumentTitleSource:'$.application.title',Requires:['pcode.document-title.v1'],Data:[]},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'render',Version:1,Data:{}}};
 assert.deepEqual(validateSetEnvelope(project.SetLang,'SetLang'),[]);
 assert.throws(()=>validateSetEnvelope({...project.SetLang,Requires:[]},'SetLang'),/document-title/);
 assert.equal(parseSPL(serializeSPL(project)).SetLang.DocumentTitleSource,'$.application.title');
 const root={ownerDocument:{title:'Original'}};
 updateDocumentTitle(root,project.SetLang.DocumentTitleSource,{application:{title:'Cash Journal'}});
 assert.equal(root.ownerDocument.title,'Cash Journal');
 updateDocumentTitle(root,project.SetLang.DocumentTitleSource,{application:{title:''}});
 assert.equal(root.ownerDocument.title,'Cash Journal');
});
