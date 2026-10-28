import React, { useState } from 'react';
import { Payment, Charge, Person, Center, Contact } from '../types';

interface PaymentReceiptModalProps {
  payment: Payment;
  charge: Charge;
  person: Person;
  center: Center;
  contacts: Contact[];
  onClose: () => void;
  onSendWhatsApp: (contact: Contact, messageText: string) => void;
}

// Convert numbers to Mexican Pesos in words
function numberToWordsMXN(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const pesos = Math.floor(rounded);
  const centavos = Math.round((rounded - pesos) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  // Simple number mapping for typical recovery fees
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];

  function convertSmall(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    if (n >= 20 && n < 30) return n === 20 ? 'VEINTE' : `VEINTI${units[n - 20]}`;
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? tens[t] : `${tens[t]} Y ${units[u]}`;
  }

  function convertHundreds(n: number): string {
    if (n === 100) return 'CIEN';
    if (n > 100 && n < 200) return `CIENTO ${convertSmall(n - 100)}`;
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    const hStr = hundreds[h] || '';
    const remStr = convertSmall(remainder);
    return [hStr, remStr].filter(Boolean).join(' ');
  }

  let text = '';
  if (pesos === 0) {
    text = 'CERO PESOS';
  } else if (pesos < 1000) {
    text = `${convertHundreds(pesos)} PESOS`;
  } else if (pesos >= 1000 && pesos < 1000000) {
    const thousands = Math.floor(pesos / 1000);
    const remainder = pesos % 1000;
    const thStr = thousands === 1 ? 'UN MIL' : `${convertHundreds(thousands)} MIL`;
    const remStr = convertHundreds(remainder);
    text = `${[thStr, remStr].filter(Boolean).join(' ')} PESOS`;
  } else {
    text = `${pesos.toLocaleString('es-MX')} PESOS`;
  }

  return `(${text} ${centavosStr}/100 M.N.)`;
}

export default function PaymentReceiptModal({
  payment,
  charge,
  person,
  center,
  contacts,
  onClose,
  onSendWhatsApp,
}: PaymentReceiptModalProps) {
  // Find contact with payment role
  const paymentContact = contacts.find(c => c.roles.includes('pago')) || contacts[0];
  const [selectedContactId, setSelectedContactId] = useState<string>(paymentContact?.id || '');
  const [activeTab, setActiveTab] = useState<'receipt' | 'whatsapp'>('receipt');

  const selectedContact = contacts.find(c => c.id === selectedContactId) || paymentContact;

  // Template text for WhatsApp
  const defaultWhatsAppMessage = selectedContact
    ? `*GUERREROS DE LA LUZ A.C.* - Comprobante Digital de Pago\n\nEstimado/a ${selectedContact.name}:\nConfirmamos la recepción de su aportación correspondiente a la cuota de recuperación con los siguientes datos oficiales:\n\n• *Folio Oficial:* ${payment.receiptFolio}\n• *Residente:* ${person.fullName} (Folio: ${person.folio})\n• *Concepto:* ${charge.concept}\n• *Monto Recibido:* $${payment.amount.toLocaleString('es-MX')} MXN\n• *Método de Pago:* ${payment.method}\n• *Fecha:* ${payment.paidAt}\n• *Recibido por:* ${payment.registeredBy}\n\nSede: ${center.name} (${center.phone})\n\n_Agradecemos su valioso apoyo y compromiso en el proceso de rehabilitación y acompañamiento integral._`
    : '';

  const [messageText, setMessageText] = useState(defaultWhatsAppMessage);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    if (!selectedContact) {
      alert('Seleccione un contacto para enviar.');
      return;
    }
    if (!selectedContact.allowsReminders) {
      alert(`Acción denegada por Regla R9: El contacto ${selectedContact.name} no ha autorizado la recepción de mensajes/notificaciones de pago.`);
      return;
    }
    onSendWhatsApp(selectedContact, messageText);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Barra Superior con Selector de Vista */}
        <div className="bg-[#0E2A47] text-white px-6 py-3.5 flex flex-wrap justify-between items-center gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Comprobante de Pago Digital &middot; {payment.receiptFolio}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg flex text-xs">
              <button
                onClick={() => setActiveTab('receipt')}
                className={`px-3 py-1 rounded font-bold transition ${
                  activeTab === 'receipt' ? 'bg-[#D49E24] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Comprobante Imprimible
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 ${
                  activeTab === 'whatsapp' ? 'bg-[#D49E24] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Plantilla WhatsApp
              </button>
            </div>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* VISTA 1: RECIBO FORMAL DE CAJA IMPRIMIBLE */}
        {activeTab === 'receipt' && (
          <div className="p-6 sm:p-8 overflow-y-auto print:p-0 space-y-6">
            <div className="border-4 border-double border-slate-300 p-6 rounded-xl bg-white space-y-4 print:border-2">
              
              {/* Encabezado del Recibo */}
              <div className="flex justify-between items-start border-b-2 border-[#0E2A47] pb-3 gap-2">
                <div>
                  <h2 className="text-base font-black text-[#0E2A47] tracking-wider uppercase">
                    Guerreros de la Luz A.C.
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Recibo Oficial de Cuota de Recuperación
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Sede: {center.name} &middot; Tel: {center.phone}
                  </p>
                </div>

                <div className="text-right">
                  <div className="bg-[#0E2A47] text-white px-2.5 py-1 rounded font-mono font-bold text-xs inline-block">
                    FOLIO: {payment.receiptFolio}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Fecha: {payment.paidAt}
                  </div>
                </div>
              </div>

              {/* Monto Destacado */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Bueno Por:</span>
                  <span className="text-xl font-black text-emerald-800">
                    ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Forma de Pago:</span>
                  <span className="text-xs font-bold text-slate-800 uppercase bg-slate-200 px-2 py-0.5 rounded">
                    {payment.method}
                  </span>
                </div>
              </div>

              {/* Desglose de Datos */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Recibimos de / Red de Apoyo:</span>
                  <strong className="text-slate-900">{selectedContact?.name || 'Familiar / Tutor'}</strong>
                  {selectedContact?.phone && <span className="text-slate-500 ml-1">(Tel: {selectedContact.phone})</span>}
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">La cantidad en letra:</span>
                  <strong className="text-slate-800 italic">{numberToWordsMXN(payment.amount)}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Por concepto de:</span>
                  <span className="text-slate-800 font-medium">{charge.concept}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase">Persona Atendida (Residente):</span>
                  <span className="font-bold text-slate-900">{person.fullName}</span> &middot; <span className="font-mono text-slate-600 font-bold">Folio: {person.folio}</span>
                </div>

                {payment.notes && (
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Referencia / Observaciones:</span>
                    <span className="text-slate-700 font-mono text-[11px]">{payment.notes}</span>
                  </div>
                )}
              </div>

              {/* Sello y Firmas */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <div className="text-[10px] font-mono text-slate-400">SELLO DIGITAL INSTITUCIONAL</div>
                  <div className="text-[9px] font-mono text-slate-400 break-all bg-slate-50 p-1 rounded border border-slate-100">
                    SHA256:{btoa(`${payment.receiptFolio}-${payment.amount}-${payment.paidAt}`).substring(0, 32)}
                  </div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-1 mt-4">
                    <strong className="text-slate-900 text-xs block">{payment.registeredBy}</strong>
                    <span className="text-[10px] text-slate-500 uppercase">Caja y Administración &middot; Sede {center.code}</span>
                  </div>
                </div>
              </div>

              {/* Cláusula Informativa */}
              <div className="text-[9px] text-slate-500 leading-tight border-t pt-2 text-center">
                Aportación voluntaria / Cuota de recuperación para sostenimiento y tratamiento integral. Donativo de asistencia social privada.
              </div>

            </div>

            {/* Acciones del Comprobante */}
            <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
              <span className="text-xs text-slate-500">
                Puedes descargar o imprimir este recibo para entregarlo en mano o guardarlo en archivo.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-[#0E2A47] hover:bg-[#153a61] text-white text-xs font-bold px-4 py-2 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir / Descargar Recibo
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                >
                  Enviar por WhatsApp &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: PLANTILLA FORMATEADA DE WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                Plantilla Oficial de Comprobante para WhatsApp (R9 & R11)
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Se enviará únicamente a familiares con consentimiento expreso de recordatorios y notificaciones de cobranza.
              </p>
            </div>

            {/* Selector de Destinatario */}
            <div>
              <label className="font-bold block text-slate-700 mb-1">Destinatario de la Red de Apoyo:</label>
              <select
                value={selectedContactId}
                onChange={(e) => {
                  setSelectedContactId(e.target.value);
                  const c = contacts.find(item => item.id === e.target.value);
                  if (c) {
                    setMessageText(
                      `*GUERREROS DE LA LUZ A.C.* - Comprobante Digital de Pago\n\nEstimado/a ${c.name}:\nConfirmamos la recepción de su aportación correspondiente a la cuota de recuperación con los siguientes datos oficiales:\n\n• *Folio Oficial:* ${payment.receiptFolio}\n• *Residente:* ${person.fullName} (Folio: ${person.folio})\n• *Concepto:* ${charge.concept}\n• *Monto Recibido:* $${payment.amount.toLocaleString('es-MX')} MXN\n• *Método de Pago:* ${payment.method}\n• *Fecha:* ${payment.paidAt}\n• *Recibido por:* ${payment.registeredBy}\n\nSede: ${center.name} (${center.phone})\n\n_Agradecemos su valioso apoyo y compromiso en el proceso de rehabilitación y acompañamiento integral._`
                    );
                  }
                }}
                className="w-full border p-2.5 rounded-lg bg-white"
              >
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.relationship}) - Tel: {c.phone} {c.allowsReminders ? '✓ Autorizado' : '⚠️ No Autorizado'}
                  </option>
                ))}
              </select>
            </div>

            {/* Advertencia R9 si no tiene permisos */}
            {selectedContact && !selectedContact.allowsReminders && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px]">
                <strong>Bloqueo por Regla R9:</strong> Este contacto tiene marcado <em>allowsReminders = false</em>. No está permitido despachar mensajes de cobranza sin su autorización previa.
              </div>
            )}

            {/* Editor de la Plantilla */}
            <div>
              <label className="font-bold block text-slate-700 mb-1">Cuerpo del Mensaje (Pre-llenado editable):</label>
              <textarea
                rows={9}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full border p-3 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Botón de Envío Asistido */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveTab('receipt')}
                className="text-xs text-slate-600 underline font-semibold"
              >
                &larr; Volver a Ver Recibo
              </button>

              <button
                onClick={handleSend}
                disabled={!selectedContact?.allowsReminders}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                Abrir en WhatsApp y Despachar &rarr;
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
