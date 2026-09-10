import test from 'node:test';import assert from 'node:assert/strict';import {number,payment,presentValue,amortization,money} from './math.mjs';
test('Arabic numeric input is parsed and blanks stay unknown',()=>{assert.equal(number('١٬٢٣٤٫٥'),1234.5);assert.equal(number(''),null);assert.equal(number('-5'),null);});
test('Reducing balance formula matches independent example',()=>{assert.ok(Math.abs(payment(1e6,6,120)-11102.050194)<1e-6);assert.equal(payment(1200,0,12),100);});
test('Invalid terms cannot produce a payment',()=>{assert.equal(payment(1000,4,0),null);assert.equal(payment(1000,4,12.5),null);});
test('Loan value and payment reconcile',()=>assert.ok(Math.abs(presentValue(payment(700000,3,200),3,200)-700000)<1e-7));
test('Unknown follow-on rate stops amortization at the known term',()=>{const r=amortization(100000,5,120,{fixedMonths:24});assert.equal(r.rows.length,24);assert.equal(r.complete,false);});
test('Amounts are displayed in Arabic words',()=>assert.equal(money(1000),'ألف درهم'));
