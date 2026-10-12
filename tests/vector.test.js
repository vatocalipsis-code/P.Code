import test from 'node:test';import assert from 'node:assert/strict';
import {validateVector,renderVector}from'../runtime/vector.js';
import {validatePLang}from'../runtime/validator.js';import{parseSPL,serializeSPL}from'../editor/spl.js';
const vector={ViewBox:'0 0 48 48',Fill:'none',Stroke:'var(--symbol-color)',StrokeWidth:3.8,LineCap:'round',LineJoin:'round',Elements:{arrow:{Shape:'Path',D:'M24 8v30M12 27l12 12 12-12'},dot:{Shape:'Circle',CX:5,CY:5,R:2}}};
test('skin vectors round trip, negotiate and reject executable or external content',()=>{
 const project={SetLang:{Name:'symbols',Version:1,Data:[{Login:'Root',Layout:[{Login:'Icon',Properties:{Vector:vector}}],SimplePanels:[]}]},SetData:{Name:'data',Version:1,Data:{}},SetRender:{Name:'scene',Version:1,Data:{}}};
 assert.deepEqual(parseSPL(serializeSPL(project)).SetLang,project.SetLang);
 assert.throws(()=>validatePLang(project.SetLang.Data),/pcode.vector.v1/);
 assert.equal(validatePLang(project.SetLang.Data,{},['pcode.vector.v1']),true);
 for(const bad of [{...vector,onclick:'run()'},{...vector,Stroke:'url(https://invalid/x)'},{...vector,Elements:{x:{Shape:'script',D:'x'}}},{...vector,Elements:{x:{Shape:'Path',D:'<script/>'}}},{...vector,ViewBox:'0 0 0 5'}])assert.throws(()=>validateVector(bad),/Invalid Vector/);
});
test('vector renderer builds the original paths and inherited strokes without parsing HTML',()=>{
 const calls=[],doc={createElementNS(ns,tag){calls.push([ns,tag]);return {attributes:{},children:[],setAttribute(k,v){this.attributes[k]=v},append(n){this.children.push(n)}}}};
 validateVector(vector);const svg=renderVector(vector,doc);
 assert.equal(svg.attributes.viewBox,'0 0 48 48');assert.equal(svg.attributes['aria-hidden'],'true');
 assert.equal(svg.children[0].attributes.stroke,'var(--symbol-color)');assert.equal(svg.children[0].children[0].attributes.d,vector.Elements.arrow.D);
 assert.deepEqual(calls.map(x=>x[1]),['svg','g','path','circle']);assert.ok(calls.every(x=>x[0]==='http://www.w3.org/2000/svg'));
});
