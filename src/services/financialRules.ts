/** Reglas del prototipo. NO sustituyen autorización y validación en backend/RLS. */
import type { AppState } from './dataService';
import type { Charge, Contact, Payment, PaymentAdjustment, Person, User } from '../types';

type FinanceState = Pick<AppState, 'episodes' | 'charges' | 'payments' | 'adjustments'>;
export type Check = { ok: true } | { ok: false; error: string };
const reject = (error: string): Check => ({ ok: false, error });
export const toCents = (value: number): number => Math.round(value * 100);
export const toMoney = (cents: number): number => cents / 100;

export function belongsToCenter(state: FinanceState, chargeId: string, centerId: string): boolean {
  const charge = state.charges.find(c => c.id === chargeId);
  return Boolean(charge && state.episodes.some(e => e.id === charge.episodeId && e.centerId === centerId));
}

export function chargeAccounting(
  charge: Charge,
  payments: Payment[],
  adjustments: PaymentAdjustment[],
  today = new Date().toISOString().slice(0, 10),
): { paid: number; balance: number; status: Charge['status'] } {
  const related = payments.filter(p => p.chargeId === charge.id);
  const ids = new Set(related.map(p => p.id));
  const paidCents = related.reduce((sum, p) => sum + toCents(p.amount), 0)
    + adjustments.filter(a => ids.has(a.paymentId)).reduce((sum, a) => sum + toCents(a.amountDelta), 0);
  const balanceCents = toCents(charge.amount) - paidCents;
  return {
    paid: toMoney(paidCents),
    balance: toMoney(balanceCents),
    status: balanceCents <= 0 ? 'pagado' : paidCents > 0 ? 'parcial' : charge.dueDate < today ? 'vencido' : 'pendiente',
  };
}

export function validatePayment(state: FinanceState, user: User, centerId: string, chargeId: string, amount: number): Check {
  if (!user.active || user.centerId !== centerId || !['Direccion', 'Administracion'].includes(user.role)) return reject('No tienes permiso para registrar pagos en esta sede.');
  if (!belongsToCenter(state, chargeId, centerId)) return reject('El cargo no pertenece a la sede activa.');
  if (!Number.isFinite(amount) || amount <= 0 || toMoney(toCents(amount)) !== amount) return reject('Introduce un importe válido con máximo dos decimales.');
  const charge = state.charges.find(c => c.id === chargeId)!;
  const { balance } = chargeAccounting(charge, state.payments, state.adjustments);
  if (toCents(amount) > toCents(balance)) return reject('El abono supera el saldo pendiente de $' + Math.max(balance, 0).toFixed(2) + ' MXN.');
  return { ok: true };
}

export function validateAdjustment(state: FinanceState, user: User, centerId: string, paymentId: string, delta: number, reason: string): Check {
  if (!user.active || user.centerId !== centerId || !['Direccion', 'Administracion'].includes(user.role)) return reject('No tienes permiso para ajustar pagos en esta sede.');
  const payment = state.payments.find(p => p.id === paymentId);
  if (!payment || !belongsToCenter(state, payment.chargeId, centerId)) return reject('Selecciona un pago de esta sede.');
  if (!Number.isFinite(delta) || delta === 0 || toMoney(toCents(delta)) !== delta) return reject('El ajuste debe ser distinto de cero y tener máximo dos decimales.');
  if (reason.trim().length < 8) return reject('Escribe una justificación de al menos ocho caracteres.');
  const charge = state.charges.find(c => c.id === payment.chargeId)!;
  const { paid } = chargeAccounting(charge, state.payments, state.adjustments);
  const adjusted = toCents(paid) + toCents(delta);
  if (adjusted < 0 || adjusted > toCents(charge.amount)) return reject('El ajuste dejaría el cargo con un pago negativo o superior a su importe.');
  return { ok: true };
}

export function validatePaymentReminder(contact: Contact, person: Person | undefined, user: User, centerId: string): Check {
  if (!user.active || user.centerId !== centerId || !['Direccion', 'Administracion', 'TrabajoSocial'].includes(user.role)) return reject('Tu rol no puede preparar recordatorios de pago.');
  if (!person || person.centerId !== centerId || contact.personId !== person.id) return reject('El contacto no corresponde a una persona de esta sede.');
  if (contact.contactRestricted) return reject('Existe una restricción vigente de contacto.');
  if (!contact.roles.includes('pago')) return reject('El contacto no está designado como responsable de pago.');
  if (!contact.allowsReminders || !contact.authorizedChannels.includes('whatsapp')) return reject('Falta autorización expresa para recordatorios por WhatsApp.');
  const phone = contact.phone.replace(/\D/g, '').replace(/^52(?=\d{10}$)/, '');
  if (!/^\d{10}$/.test(phone)) return reject('El teléfono debe contener diez dígitos nacionales válidos.');
  return { ok: true };
}
