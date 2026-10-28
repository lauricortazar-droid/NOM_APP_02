import test from 'node:test';
import assert from 'node:assert/strict';
import { belongsToCenter, chargeAccounting, validatePayment, validateAdjustment, validatePaymentReminder } from '../src/services/financialRules.ts';

const episodes = [{id:'e1',centerId:'c1'}, {id:'e2',centerId:'c2'}];
const charges = [{id:'c-a',episodeId:'e1',amount:1000,dueDate:'2026-01-01',status:'vencido'}, {id:'c-b',episodeId:'e2',amount:200,dueDate:'2026-12-31',status:'pendiente'}];
const payments = [{id:'p1',chargeId:'c-a',amount:350}];
const adjustments = [{id:'a1',paymentId:'p1',amountDelta:-50}];
const state = {episodes,charges,payments,adjustments};
const user = {active:true,centerId:'c1',role:'Administracion'};

test('saldo usa pagos parciales y ajustes',()=>assert.deepEqual(chargeAccounting(charges[0],payments,adjustments,'2026-10-28'),{paid:300,balance:700,status:'parcial'}));
test('no permite cargos de otra sede',()=>{assert.equal(belongsToCenter(state,'c-b','c1'),false);assert.equal(validatePayment(state,user,'c1','c-b',100).ok,false)});
test('no permite abonos superiores al saldo ni montos inválidos',()=>{assert.equal(validatePayment(state,user,'c1','c-a',701).ok,false);assert.equal(validatePayment(state,user,'c1','c-a',700).ok,true);assert.equal(validatePayment(state,user,'c1','c-a',-2).ok,false)});
test('ajuste exige pago real, justificación y límites',()=>{assert.equal(validateAdjustment(state,user,'c1','p-no',-20,'error anterior').ok,false);assert.equal(validateAdjustment(state,user,'c1','p1',-301,'error anterior').ok,false);assert.equal(validateAdjustment(state,user,'c1','p1',-20,'error anterior').ok,true)});
test('recordatorio requiere contacto pagador, canal, permiso y sede',()=>{
 const person={id:'person1',centerId:'c1'};
 const contact={personId:'person1',phone:'33 1234 5678',roles:['pago'],allowsReminders:true,authorizedChannels:['whatsapp'],contactRestricted:false};
 assert.equal(validatePaymentReminder(contact,person,user,'c1').ok,true);
 assert.equal(validatePaymentReminder({...contact,authorizedChannels:[]},person,user,'c1').ok,false);
 assert.equal(validatePaymentReminder({...contact,contactRestricted:true},person,user,'c1').ok,false);
 assert.equal(validatePaymentReminder(contact,{...person,centerId:'c2'},user,'c1').ok,false);
});
