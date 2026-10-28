import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Center, Person, Episode, Charge, Payment, PaymentAdjustment, Expense, Incident, Task } from '../types';

interface CenterConsolidatedReportModalProps {
  center: Center;
  persons: Person[];
  episodes: Episode[];
  charges: Charge[];
  payments: Payment[];
  adjustments: PaymentAdjustment[];
  expenses: Expense[];
  incidents: Incident[];
  tasks: Task[];
  onClose: () => void;
}

export default function CenterConsolidatedReportModal({
  center,
  persons,
  episodes,
  charges,
  payments,
  adjustments,
  expenses,
  incidents,
  tasks,
  onClose,
}: CenterConsolidatedReportModalProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // 1. Estadísticas de Ocupación de la Sede
  const activeResidents = persons.filter(p => {
    const ep = episodes.find(e => e.personId === p.id && e.status !== 'Egresado');
    return Boolean(ep);
  });
  const occupancyCount = activeResidents.length;
  const capacity = center.capacity;
  const occupancyRate = capacity > 0 ? ((occupancyCount / capacity) * 100).toFixed(1) : '0';

  // Desglose por estados de episodios en la sede
  const statusCounts = episodes.reduce((acc, ep) => {
    acc[ep.status] = (acc[ep.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. Resumen Financiero de la Sede
  const episodeIds = episodes.map(e => e.id);
  const centerCharges = charges.filter(c => episodeIds.includes(c.episodeId));
  const totalCharges = centerCharges.reduce((acc, c) => acc + c.amount, 0);

  const chargeIds = centerCharges.map(c => c.id);
  const centerPayments = payments.filter(p => chargeIds.includes(p.chargeId));
  const totalPayments = centerPayments.reduce((acc, p) => acc + p.amount, 0);

  const paymentIds = centerPayments.map(p => p.id);
  const totalAdjustments = adjustments
    .filter(a => paymentIds.includes(a.paymentId))
    .reduce((acc, a) => acc + a.amountDelta, 0);

  const totalCollected = totalPayments + totalAdjustments;
  const totalReceivables = totalCharges - totalCollected;

  const centerExpenses = expenses.filter(e => e.centerId === center.id);
  const totalExpenses = centerExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netOperatingMargin = totalCollected - totalExpenses;

  // Gastos por categoría
  const expensesByCategory = centerExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // 3. Incidentes Abiertos o en Seguimiento
  const openIncidents = incidents.filter(
    i => i.centerId === center.id && (i.status === 'abierto' || i.status === 'en_seguimiento')
  );

  // 4. Tareas pendientes y vencidas
  const pendingTasks = tasks.filter(t => t.centerId === center.id && t.status !== 'completada');
  const overdueTasks = pendingTasks.filter(t => t.status === 'vencida');

  // GENERACIÓN DE ARCHIVO PDF CON JSPDF Y AUTOTABLE
  const handleDownloadPdf = () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const todayStr = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // ENCABEZADO INSTITUCIONAL
      doc.setFillColor(14, 42, 71); // #0E2A47
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('GUERREROS DE LA LUZ A.C.', 14, 11);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`REPORTE CONSOLIDADO DE SEDE: ${center.name.toUpperCase()} (${center.code})`, 14, 17);
      doc.text(`Emisión: ${todayStr} ${timeStr}`, 14, 22);

      doc.setFontSize(8);
      doc.text('MODELO INTEGRAL DE RECUPERACIÓN', 140, 11);
      doc.text(`Tel: ${center.phone}`, 140, 16);
      doc.text(center.address.substring(0, 35) + '...', 140, 21);

      let currentY = 33;

      // 1. ESTADÍSTICAS DE OCUPACIÓN
      doc.setTextColor(14, 42, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. ESTADÍSTICAS DE OCUPACIÓN Y RESIDENTES', 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [14, 42, 71], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        head: [['Capacidad Total', 'Camas Ocupadas', 'Camas Libres', 'Tasa de Ocupación', 'Total Histórico Personas']],
        body: [[
          `${capacity} camas`,
          `${occupancyCount} residentes`,
          `${Math.max(0, capacity - occupancyCount)} disponibles`,
          `${occupancyRate}%`,
          `${persons.length} expedientes`,
        ]],
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 6;

      // Desglose de Episodios
      const statusRows = Object.entries(statusCounts).map(([st, cnt]) => [st, String(cnt)]);
      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5 },
        head: [['Estado del Episodio', 'Cantidad de Personas']],
        body: statusRows.length > 0 ? statusRows : [['Sin registros activos', '0']],
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 8;

      // 2. RESUMEN DE FINANZAS Y COBRANZA
      doc.setTextColor(14, 42, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. RESUMEN FINANCIERO Y RESULTADO OPERATIVO (REGLAS R3 Y R6)', 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [14, 42, 71], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        head: [['Cuotas Generadas', 'Aportaciones Cobradas', 'Cartera Pendiente', 'Gastos de Sede', 'Margen Operativo']],
        body: [[
          `$${totalCharges.toLocaleString('es-MX')} MXN`,
          `$${totalCollected.toLocaleString('es-MX')} MXN`,
          `$${totalReceivables.toLocaleString('es-MX')} MXN`,
          `$${totalExpenses.toLocaleString('es-MX')} MXN`,
          `$${netOperatingMargin.toLocaleString('es-MX')} MXN`,
        ]],
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 6;

      // Desglose de Gastos
      const expenseRows = Object.entries(expensesByCategory).map(([cat, amt]) => [
        cat.toUpperCase(),
        `$${amt.toLocaleString('es-MX')} MXN`,
      ]);
      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5 },
        head: [['Rubro de Gasto Operativo', 'Monto Ejercido']],
        body: expenseRows.length > 0 ? expenseRows : [['Sin gastos registrados', '$0 MXN']],
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 8;

      // 3. LISTADO DE INCIDENTES ABIERTOS
      doc.setTextColor(14, 42, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. LISTADO DE INCIDENTES ABIERTOS O EN SEGUIMIENTO', 14, currentY);
      currentY += 4;

      const incidentRows = openIncidents.map(inc => [
        inc.category.toUpperCase(),
        inc.severity.toUpperCase(),
        inc.reportedAt,
        inc.reportedBy,
        inc.description,
      ]);

      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5 },
        head: [['Categoría', 'Severidad', 'Fecha/Hora', 'Reportó', 'Descripción de los Hechos']],
        body: incidentRows.length > 0 ? incidentRows : [['SIN INCIDENTES ABIERTOS', '-', '-', '-', 'No existen incidentes pendientes de resolución en la sede.']],
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 8;

      // 4. CUMPLIMIENTO OPERATIVO Y TAREAS
      doc.setTextColor(14, 42, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('4. CUMPLIMIENTO DE TAREAS Y SUPERVISIÓN OPERATIVA (R10)', 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [14, 42, 71], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        head: [['Total Tareas en Sede', 'Tareas Pendientes', 'Tareas Vencidas (+48h)', 'Estado General']],
        body: [[
          `${tasks.filter(t => t.centerId === center.id).length}`,
          `${pendingTasks.length}`,
          `${overdueTasks.length}`,
          overdueTasks.length > 0 ? 'ATENCIÓN URGENTE EN TAREAS VENCIDAS' : 'CUMPLIMIENTO AL CORRIENTE',
        ]],
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 14;

      // PIE DE FIRMAS
      if (currentY > 250) {
        doc.addPage();
        currentY = 30;
      }

      doc.setDrawColor(100, 116, 139);
      doc.line(20, currentY + 12, 85, currentY + 12);
      doc.line(125, currentY + 12, 190, currentY + 12);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('LIC. MARTHA ROSALES', 52.5, currentY + 16, { align: 'center' });
      doc.text('C.P. JORGE BELTRÁN', 157.5, currentY + 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Dirección General Institucional', 52.5, currentY + 20, { align: 'center' });
      doc.text('Coordinación Administrativa & Finanzas', 157.5, currentY + 20, { align: 'center' });

      // Pie de página normativo
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Documento confidencial generado por el Sistema de Gestión Integral de Guerreros de la Luz A.C. | Disociación Clínica R4 & Egreso Libre R3',
        105,
        287,
        { align: 'center' }
      );

      // Descargar archivo
      const fileName = `Reporte_Consolidado_${center.code}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar el archivo PDF. Se abrirá la vista de impresión del navegador.');
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Barra Superior con Acciones */}
        <div className="bg-[#0E2A47] text-white px-6 py-3.5 flex flex-wrap justify-between items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D49E24]"></span>
            <span className="font-bold text-sm">Reporte PDF Consolidado de Sede &middot; {center.name} ({center.code})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="bg-[#D49E24] hover:bg-[#b8871b] disabled:bg-slate-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {generatingPdf ? 'Generando PDF...' : 'Descargar Archivo PDF (jsPDF)'}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold"
            >
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Vista Previa del Reporte */}
        <div className="p-8 sm:p-10 overflow-y-auto print:p-0 space-y-6 text-slate-800">
          
          {/* Encabezado */}
          <div className="border-b-2 border-[#0E2A47] pb-4 flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-black text-[#0E2A47] uppercase">Guerreros de la Luz A.C.</h1>
              <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Reporte Consolidado Operativo, Financiero y de Seguridad
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Sede: <strong>{center.name} ({center.code})</strong> &middot; {center.address} &middot; Tel: {center.phone}
              </p>
            </div>

            <div className="text-right">
              <span className="bg-[#0E2A47] text-white font-mono text-xs font-bold px-3 py-1 rounded inline-block">
                SEDE: {center.code}
              </span>
              <div className="text-xs text-slate-500 mt-1">
                Fecha: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* 1. SECCIÓN: ESTADÍSTICAS DE OCUPACIÓN */}
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase text-[#0E2A47] border-b pb-1">
              1. Estadísticas de Ocupación y Residentes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">Capacidad Total:</span>
                <span className="text-lg font-black text-[#0E2A47]">{capacity} Camas</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 text-[10px] block font-bold uppercase">Residentes Activos:</span>
                <span className="text-lg font-black text-emerald-800">{occupancyCount} Residentes</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="text-blue-800 text-[10px] block font-bold uppercase">Tasa de Ocupación:</span>
                <span className="text-lg font-black text-blue-900">{occupancyRate}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">Disponibilidad:</span>
                <span className="text-lg font-black text-slate-700">{Math.max(0, capacity - occupancyCount)} Camas</span>
              </div>
            </div>

            {/* Desglose por Estado */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2">Distribución por Estado del Episodio de Atención:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(statusCounts).map(([st, cnt]) => (
                  <div key={st} className="flex justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                    <span className="font-medium text-slate-600">{st}:</span>
                    <strong className="text-slate-900">{cnt}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN: RESUMEN DE FINANZAS */}
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase text-[#0E2A47] border-b pb-1">
              2. Resumen Financiero y Resultado Operativo
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">Total Cuotas Devengadas:</span>
                <span className="text-base font-black text-slate-900">${totalCharges.toLocaleString('es-MX')}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 text-[10px] block font-bold uppercase">Aportaciones Cobradas:</span>
                <span className="text-base font-black text-emerald-800">${totalCollected.toLocaleString('es-MX')}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-amber-800 text-[10px] block font-bold uppercase">Cartera por Cobrar:</span>
                <span className="text-base font-black text-amber-700">${totalReceivables.toLocaleString('es-MX')}</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                <span className="text-rose-800 text-[10px] block font-bold uppercase">Gastos de la Sede:</span>
                <span className="text-base font-black text-rose-700">${totalExpenses.toLocaleString('es-MX')}</span>
              </div>
            </div>

            {/* Margen Operativo */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Resultado Operativo Neto de la Sede:</span>
                <span className="text-slate-500 text-[11px]">Aportaciones recaudadas menos gastos operativos ejercidos</span>
              </div>
              <span className={`text-lg font-black ${netOperatingMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                ${netOperatingMargin.toLocaleString('es-MX')} MXN
              </span>
            </div>
          </div>

          {/* 3. SECCIÓN: LISTADO DE INCIDENTES ABIERTOS */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-1">
              <h2 className="text-sm font-black uppercase text-[#0E2A47]">
                3. Listado de Incidentes Abiertos o en Seguimiento
              </h2>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                {openIncidents.length} pendientes
              </span>
            </div>

            {openIncidents.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs text-center font-semibold">
                ✓ No existen incidentes abiertos en este momento. La sede opera sin contingencias activas.
              </div>
            ) : (
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-[#0E2A47] text-white">
                  <tr>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5">Severidad</th>
                    <th className="p-2.5">Fecha/Hora</th>
                    <th className="p-2.5">Reportó</th>
                    <th className="p-2.5">Descripción de los Hechos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {openIncidents.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold uppercase text-[10px] text-slate-800">{inc.category}</td>
                      <td className="p-2.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          inc.severity === 'critica' || inc.severity === 'alta' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">{inc.reportedAt}</td>
                      <td className="p-2.5 font-medium text-slate-700">{inc.reportedBy}</td>
                      <td className="p-2.5 text-slate-800">{inc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 4. SECCIÓN: SUPERVISIÓN Y TAREAS */}
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase text-[#0E2A47] border-b pb-1">
              4. Estado de Tareas y Alertas Operativas (Regla R10)
            </h2>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Tareas Pendientes</span>
                <span className="text-base font-black text-slate-800">{pendingTasks.length}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-rose-700 text-[10px] uppercase font-bold block">Tareas Vencidas (+48h)</span>
                <span className="text-base font-black text-rose-700">{overdueTasks.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-emerald-700 text-[10px] uppercase font-bold block">Tareas Cumplidas</span>
                <span className="text-base font-black text-emerald-800">
                  {tasks.filter(t => t.centerId === center.id && t.status === 'completada').length}
                </span>
              </div>
            </div>
          </div>

          {/* Firmas Institucionales */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <strong className="text-slate-900 block">Lic. Martha Rosales</strong>
              <span className="text-slate-500 text-[10px] uppercase">Dirección General &middot; Sede {center.code}</span>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <strong className="text-slate-900 block">C.P. Jorge Beltrán</strong>
              <span className="text-slate-500 text-[10px] uppercase">Administración & Finanzas &middot; Sede {center.code}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
