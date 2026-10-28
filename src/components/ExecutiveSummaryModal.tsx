import React from 'react';
import { Person, Episode, Contact, Center, Charge, Payment, PaymentAdjustment } from '../types';

interface ExecutiveSummaryModalProps {
  person: Person;
  episodes: Episode[];
  contacts: Contact[];
  center: Center;
  charges: Charge[];
  payments: Payment[];
  adjustments: PaymentAdjustment[];
  onClose: () => void;
}

export default function ExecutiveSummaryModal({
  person,
  episodes,
  contacts,
  center,
  charges,
  payments,
  adjustments,
  onClose,
}: ExecutiveSummaryModalProps) {
  // Balance calculation
  const personEpisodeIds = episodes.map(e => e.id);
  const personCharges = charges.filter(c => personEpisodeIds.includes(c.episodeId));
  const totalCharges = personCharges.reduce((acc, c) => acc + c.amount, 0);

  const chargeIds = personCharges.map(c => c.id);
  const personPayments = payments.filter(p => chargeIds.includes(p.chargeId));
  const totalPaid = personPayments.reduce((acc, p) => acc + p.amount, 0);

  const paymentIds = personPayments.map(p => p.id);
  const totalAdjustments = adjustments
    .filter(a => paymentIds.includes(a.paymentId))
    .reduce((acc, a) => acc + a.amountDelta, 0);

  const finalBalance = totalCharges - (totalPaid + totalAdjustments);

  // Age calculation
  const calculateAge = (birthDateStr: string) => {
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? `${age} años` : 'N/D';
    } catch {
      return 'N/D';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Contenedor del documento imprimible */}
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Barra Superior con Botones (Oculta en Impresión) */}
        <div className="bg-[#0E2A47] text-white px-6 py-3.5 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span>Resumen Ejecutivo de Expediente para Exportación / PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#D49E24] hover:bg-[#b8871b] text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / Guardar como PDF
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Hoja Formal Imprimible */}
        <div className="p-8 sm:p-10 overflow-y-auto print:p-0 space-y-6 text-slate-800 print:text-black">
          
          {/* Membrete Institucional */}
          <div className="border-b-2 border-[#0E2A47] pb-4 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#0E2A47] text-white flex items-center justify-center font-black text-sm">
                  GL
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-wide text-[#0E2A47] uppercase leading-none">
                    Guerreros de la Luz A.C.
                  </h1>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Centro de Acompañamiento y Recuperación Integral en Adicciones
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Sede: <strong>{center.name} ({center.code})</strong> &middot; {center.address}
              </p>
              <p className="text-xs text-slate-500">
                Teléfono: {center.phone} &middot; Jalisco, México
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block bg-[#0E2A47] text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                FOLIO: {person.folio}
              </span>
              <div className="text-[11px] text-slate-500 font-mono">
                Emisión: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div className="text-[10px] text-slate-400">
                Documento Oficial Generado
              </div>
            </div>
          </div>

          <div className="text-center py-1">
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
              Resumen Ejecutivo de Expediente Clínico-Administrativo
            </h2>
            <p className="text-xs text-slate-500">
              Expediente consolidado conforme al modelo Persona &rarr; Episodios (R2) y Consentimiento Informado (R8)
            </p>
          </div>

          {/* Sección 1: Datos Generales */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0E2A47] border-b pb-1">
              1. Ficha de Identificación de la Persona Atendida
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">Nombre Completo:</span>
                <strong className="text-slate-900">{person.fullName}</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">Fecha Nacimiento (Edad):</span>
                <strong className="text-slate-900">{person.birthDate} ({calculateAge(person.birthDate)})</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">Teléfono de Contacto:</span>
                <strong className="text-slate-900">{person.phone}</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">Fecha de Registro Inicial:</span>
                <strong className="text-slate-900">{person.createdAt.split('T')[0]}</strong>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
              <span className="text-slate-500 text-[10px] block font-semibold uppercase">Domicilio Particular:</span>
              <span className="text-slate-800 font-medium">
                {person.street} #{person.extNum} {person.intNum ? `Int. ${person.intNum}` : ''}, Col. {person.neighborhood}, C.P. {person.postalCode}, {person.city}, {person.state}
              </span>
            </div>
          </div>

          {/* Sección 2: Red de Apoyo Familiar y Representación Legal */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0E2A47] border-b pb-1">
              2. Red de Apoyo Familiar y Representación Legal (Reglas R7 & R8)
            </h3>
            <div className="space-y-2 text-xs">
              {contacts.map(c => (
                <div key={c.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="text-slate-500 ml-2">({c.relationship})</span>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Tel: <strong>{c.phone}</strong> &middot; Roles: {c.roles.join(', ') || 'Contacto básico'} &middot; Canales: {c.authorizedChannels.join(', ')}
                    </div>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      c.allowsReminders ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Recordatorios: {c.allowsReminders ? 'Autorizados' : 'No'}
                    </span>
                    {c.contactRestricted && (
                      <span className="ml-1 px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                        Restringido
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección 3: Historial de Episodios de Atención */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0E2A47] border-b pb-1">
              3. Historial Cronológico de Episodios de Atención (Trazabilidad R2)
            </h3>
            <table className="w-full text-xs text-left border border-slate-200 rounded overflow-hidden">
              <thead className="bg-[#0E2A47] text-white">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">ID Episodio</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Fecha Ingreso</th>
                  <th className="p-2">Fecha Egreso</th>
                  <th className="p-2">Motivo Egreso & Plan de Continuidad</th>
                  <th className="p-2">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {episodes.map((ep, idx) => (
                  <tr key={ep.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold">{idx + 1}</td>
                    <td className="p-2 font-mono text-[11px]">{ep.id}</td>
                    <td className="p-2">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        ep.status === 'Egresado' ? 'bg-slate-200 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ep.status}
                      </span>
                    </td>
                    <td className="p-2 font-medium">{ep.admittedAt}</td>
                    <td className="p-2 text-slate-500">{ep.dischargedAt || 'En curso'}</td>
                    <td className="p-2 text-slate-700">
                      <div>{ep.dischargeReason || 'N/A'}</div>
                      {ep.continuityPlan && <div className="italic text-[11px] text-slate-500">{ep.continuityPlan}</div>}
                    </td>
                    <td className="p-2 text-slate-600">{ep.responsibleStaff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sección 4: Resumen Financiero y Declaración R3 */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0E2A47] border-b pb-1">
              4. Resumen de Cuotas de Recuperación y Estado de Cuenta (Regla R3 & R6)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border rounded text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Cuotas Generadas</span>
                <span className="text-base font-black text-slate-900">${totalCharges.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center">
                <span className="text-emerald-700 text-[10px] uppercase font-bold block">Total Aportaciones Cubiertas</span>
                <span className="text-base font-black text-emerald-700">${(totalPaid + totalAdjustments).toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-center">
                <span className="text-amber-800 text-[10px] uppercase font-bold block">Saldo Pendiente Actual</span>
                <span className={`text-base font-black ${finalBalance > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                  ${finalBalance.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>

            {/* Cláusula Legal R3 Obligatoria */}
            <div className="p-3 bg-slate-100 rounded border border-slate-300 text-[11px] text-slate-700 leading-tight">
              <strong>Cláusula Institucional de Derechos Humanos (Regla R3):</strong> Se hace constar de manera formal que la existencia de saldos pendientes de liquidación <strong>bajo ninguna circunstancia condiciona, restringe o retrasa el egreso voluntario o médico</strong> de la persona atendida, ni la entrega de sus pertenencias o constancias conducentes.
            </div>
          </div>

          {/* Firmas de Conformidad */}
          <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold text-slate-900">{person.fullName}</div>
              <div className="text-[10px] text-slate-500 uppercase">Persona Atendida (Propio)</div>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold text-slate-900">{episodes[0]?.responsibleStaff || 'Coordinación Clínica'}</div>
              <div className="text-[10px] text-slate-500 uppercase">Responsable del Caso</div>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold text-slate-900">Lic. Martha Rosales</div>
              <div className="text-[10px] text-slate-500 uppercase">Dirección General &middot; Sede {center.code}</div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-4 border-t">
            Guerreros de la Luz A.C. &middot; Sistema de Gestión Integral Multi-Sede &middot; Documento reservado con disociación de contenido clínico (R4).
          </div>

        </div>

      </div>
    </div>
  );
}
