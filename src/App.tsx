import React, { useState, useMemo, useEffect } from 'react';
import {
  Role,
  User,
  Person,
  Episode,
  Contact,
  Charge,
  Payment,
  PaymentAdjustment,
  Expense,
  Task,
  LogEntry,
  Incident,
  Complaint,
  DocumentRecord,
  MessageRecord,
  Visit,
  AuditEvent,
} from './types';
import {
  getInitialState,
  saveStateToStorage,
  resetStateToDefaults,
  can,
  AppState,
} from './services/dataService';
import SignaturePad from './components/SignaturePad';
import AcceptanceTests from './components/AcceptanceTests';
import AlertsPanel, { calculateOverdueInfo } from './components/AlertsPanel';
import ExecutiveSummaryModal from './components/ExecutiveSummaryModal';
import PaymentReceiptModal from './components/PaymentReceiptModal';
import CenterConsolidatedReportModal from './components/CenterConsolidatedReportModal';

// ==========================================
// ICONOS SVG ACCESIBLES SIN DEPENDENCIAS
// ==========================================

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const MessageSquareIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function App() {
  // Estado Global con Persistencia
  const [appState, setAppState] = useState<AppState>(() => getInitialState());

  // Contexto Activo de Usuario y Sede
  const [currentCenterId, setCurrentCenterId] = useState<string>('c1');
  const [currentRole, setCurrentRole] = useState<Role>('Direccion');

  // Navegación Activa
  const [currentTab, setCurrentTab] = useState<'inicio' | 'personas' | 'finanzas' | 'actividades' | 'documentos' | 'comunicacion' | 'auditoria' | 'pruebas'>('inicio');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>('p1');
  const [personTab, setPersonTab] = useState<'datos' | 'red_apoyo' | 'episodios' | 'cuenta' | 'documentos' | 'historial'>('datos');

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Toasts
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // Modales
  const [showNewPersonWizard, setShowNewPersonWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newPersonData, setNewPersonData] = useState({
    fullName: '',
    birthDate: '',
    phone: '',
    street: '',
    extNum: '',
    intNum: '',
    neighborhood: '',
    postalCode: '',
    city: 'Guadalajara',
    state: 'Jalisco',
    contactName: '',
    contactPhone: '',
    contactRelationship: 'Madre',
    contactAllowsReminders: true,
  });

  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureTargetDoc, setSignatureTargetDoc] = useState<DocumentRecord | null>(null);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState<MessageRecord | null>(null);
  const [showExecutiveSummaryModal, setShowExecutiveSummaryModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<{ payment: Payment; charge: Charge } | null>(null);
  const [showCenterReportModal, setShowCenterReportModal] = useState(false);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    saveStateToStorage(appState);
  }, [appState]);

  // Usuario activo contextual
  const currentUser: User = useMemo(() => {
    const found = appState.users.find(u => u.role === currentRole && u.centerId === currentCenterId);
    return found || {
      id: `u-${currentRole}-${currentCenterId}`,
      organizationId: 'org1',
      centerId: currentCenterId,
      name: `${currentRole} - Operador Activo`,
      email: `${currentRole.toLowerCase()}@guerreros.org`,
      role: currentRole,
      active: true,
      mfaEnabled: true,
    };
  }, [currentRole, currentCenterId, appState.users]);

  const activeCenter = appState.centers.find(c => c.id === currentCenterId) || appState.centers[0];

  // Helper de Notificaciones
  const showToast = (message: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper de Auditoría Append-Only
  const logAudit = (action: string, entity: string, details: string) => {
    const event: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      centerId: currentCenterId,
      actor: currentUser.name,
      role: currentUser.role,
      action,
      entity,
      details,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setAppState(prev => ({
      ...prev,
      auditEvents: [event, ...prev.auditEvents],
    }));
  };

  // ==========================================
  // R1: AISLAMIENTO ESTRICTO POR SEDE
  // ==========================================
  const filteredPersons = useMemo(() => {
    return appState.persons
      .filter(p => p.centerId === currentCenterId)
      .filter(p => {
        const matchesQuery = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || p.folio.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
        if (statusFilter === 'todos') return true;
        const currentEp = appState.episodes.find(e => e.personId === p.id && e.status !== 'Egresado') || appState.episodes.find(e => e.personId === p.id);
        return currentEp?.status === statusFilter;
      });
  }, [appState.persons, appState.episodes, currentCenterId, searchQuery, statusFilter]);

  const activePerson = appState.persons.find(p => p.id === selectedPersonId && p.centerId === currentCenterId) || filteredPersons[0] || null;
  const personEpisode = activePerson 
    ? (appState.episodes.find(e => e.personId === activePerson.id && e.status !== 'Egresado') || appState.episodes.find(e => e.personId === activePerson.id))
    : null;

  // Cálculo de Saldo en tiempo real: (Cargos - Pagos + Ajustes)
  const calculatePersonBalance = (personId: string) => {
    const eps = appState.episodes.filter(e => e.personId === personId);
    const epIds = eps.map(e => e.id);
    const personCharges = appState.charges.filter(c => epIds.includes(c.episodeId));
    const totalCharges = personCharges.reduce((acc, c) => acc + c.amount, 0);

    const chargeIds = personCharges.map(c => c.id);
    const personPayments = appState.payments.filter(p => chargeIds.includes(p.chargeId));
    const totalPaid = personPayments.reduce((acc, p) => acc + p.amount, 0);

    const paymentIds = personPayments.map(p => p.id);
    const totalAdjustments = appState.adjustments
      .filter(a => paymentIds.includes(a.paymentId))
      .reduce((acc, a) => acc + a.amountDelta, 0);

    return {
      totalCharges,
      totalPaid: totalPaid + totalAdjustments,
      balance: totalCharges - (totalPaid + totalAdjustments),
      charges: personCharges,
      payments: personPayments,
    };
  };

  // ==========================================
  // OPERACIONES DE NEGOCIO (R1 A R11)
  // ==========================================

  // B5 & R3: Egreso no condicionado por adeudo
  const handleConfirmDischarge = (reason: string, continuityPlan: string) => {
    if (!personEpisode || !activePerson) return;
    const balanceInfo = calculatePersonBalance(activePerson.id);

    setAppState(prev => ({
      ...prev,
      episodes: prev.episodes.map(ep => {
        if (ep.id === personEpisode.id) {
          return {
            ...ep,
            status: 'Egresado',
            dischargedAt: new Date().toISOString().split('T')[0],
            dischargeReason: reason,
            continuityPlan,
          };
        }
        return ep;
      }),
    }));

    logAudit('EGRESO_REGISTRADO', 'episodes', `Egreso completado para ${activePerson.fullName}. Saldo informativo al egreso: $${balanceInfo.balance.toLocaleString('es-MX')} MXN.`);
    showToast(`Egreso registrado correctamente. ${balanceInfo.balance > 0 ? `(Saldo remanente por cobrar: $${balanceInfo.balance.toLocaleString('es-MX')} MXN - R3)` : ''}`);
    setShowDischargeModal(false);
  };

  // B6 & R2: Reingreso creando nuevo episodio y conservando historial
  const handleReadmission = () => {
    if (!activePerson) return;
    const newEp: Episode = {
      id: `ep-${Date.now()}`,
      personId: activePerson.id,
      organizationId: 'org1',
      centerId: currentCenterId,
      status: 'Admitido',
      admittedAt: new Date().toISOString().split('T')[0],
      responsibleStaff: currentUser.name,
      consentPersonSigned: false,
      legalRepresentationSigned: false,
      privacyNoticeSigned: false,
      economicAgreementSigned: false,
      createdAt: new Date().toISOString(),
    };

    setAppState(prev => ({
      ...prev,
      episodes: [...prev.episodes, newEp],
    }));

    logAudit('REINGRESO_CREADO', 'episodes', `Nuevo episodio de readmisión creado para ${activePerson.fullName} conservando antecedentes.`);
    showToast(`Nuevo episodio de atención creado para ${activePerson.fullName}. Historial conservado íntegramente.`);
  };

  // R6: Registro de Pago Inmutable
  const handleRegisterPayment = (chargeId: string, amount: number, method: 'Efectivo' | 'Transferencia' | 'Tarjeta', notes: string) => {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      chargeId,
      amount,
      paidAt: new Date().toISOString().split('T')[0],
      method,
      receiptFolio: `REC-${Math.floor(100 + Math.random() * 900)}`,
      registeredBy: currentUser.name,
      notes,
    };

    setAppState(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment],
      charges: prev.charges.map(c => {
        if (c.id === chargeId) {
          const prevPaid = prev.payments.filter(p => p.chargeId === chargeId).reduce((a, b) => a + b.amount, 0);
          const isFullyPaid = (prevPaid + amount) >= c.amount;
          return {
            ...c,
            status: isFullyPaid ? 'pagado' : 'parcial',
          };
        }
        return c;
      })
    }));

    logAudit('PAGO_REGISTRADO', 'payments', `Pago registrado por $${amount.toLocaleString('es-MX')} MXN (${method}) bajo folio ${newPayment.receiptFolio}`);
    showToast(`Pago registrado con éxito. Folio de recibo: ${newPayment.receiptFolio}`);
    setShowPaymentModal(false);
  };

  // R6: Corrección mediante Ajuste Contable Inmutable
  const handleRegisterAdjustment = (paymentId: string, delta: number, reason: string) => {
    const adj: PaymentAdjustment = {
      id: `adj-${Date.now()}`,
      paymentId,
      amountDelta: delta,
      reason,
      registeredBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setAppState(prev => ({
      ...prev,
      adjustments: [...prev.adjustments, adj],
    }));

    logAudit('AJUSTE_FINANCIERO', 'payment_adjustments', `Ajuste contable de $${delta} MXN aplicado al pago ${paymentId}. Motivo: ${reason}`);
    showToast('Ajuste contable aplicado con trazabilidad auditora.');
    setShowAdjustmentModal(false);
  };

  // R9 & R11: Mensajería Asistida de WhatsApp
  const handlePrepareMessage = (contact: Contact) => {
    if (!contact.allowsReminders) {
      showToast(`Acción denegada (R9): El contacto "${contact.name}" no ha autorizado recordatorios de pago.`, 'error');
      return;
    }
    if (contact.contactRestricted) {
      showToast(`Acción denegada: El contacto cuenta con una restricción activa de contacto.`, 'error');
      return;
    }

    const newMsg: MessageRecord = {
      id: `msg-${Date.now()}`,
      centerId: currentCenterId,
      personId: contact.personId,
      contactId: contact.id,
      contactName: contact.name,
      phone: contact.phone,
      channel: 'whatsapp',
      purpose: 'recordatorio_pago',
      body: `Estimado/a ${contact.name}, le enviamos un cordial saludo de Guerreros de la Luz A.C. Sede ${activeCenter.name}. Ponemos a su disposición el seguimiento de estado de cuenta.`,
      status: 'preparado', // R11: Requiere confirmación humana
      preparedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };

    setAppState(prev => ({
      ...prev,
      messages: [newMsg, ...prev.messages],
    }));

    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(newMsg.body);
    window.open(`https://wa.me/52${cleanPhone}?text=${encoded}`, '_blank');
    setShowConfirmSendModal(newMsg);
  };

  // R11: Confirmación humana de mensaje enviado
  const handleConfirmSent = (msg: MessageRecord) => {
    setAppState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id === msg.id) {
          return {
            ...m,
            status: 'enviado_confirmado',
            confirmedSentBy: currentUser.name,
            confirmedSentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return m;
      })
    }));

    logAudit('MENSAJE_ENVIADO_CONFIRMADO', 'messages', `Mensaje a ${msg.contactName} confirmado como enviado por operador ${currentUser.name}`);
    showToast('Envío confirmado y registrado en bitácora.');
    setShowConfirmSendModal(null);
  };

  // Reiniciar estado
  const handleResetData = () => {
    if (confirm('¿Restablecer todos los datos a la configuración inicial de demostración?')) {
      const fresh = resetStateToDefaults();
      setAppState(fresh);
      showToast('Datos de demostración restablecidos a valores de fábrica.');
    }
  };

  // Ubicar tarea con desplazamiento suave
  const handleScrollToTask = (taskId: string) => {
    const el = document.getElementById(`task-row-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-rose-400');
      setTimeout(() => el.classList.remove('ring-4', 'ring-rose-400'), 2000);
    }
  };

  // Simular tarea con retraso > 48h para pruebas interactivas
  const handleGenerateTestDelayedTask = () => {
    const testTask: Task = {
      id: `t-urg-${Date.now()}`,
      centerId: currentCenterId,
      title: 'Supervisión urgente de signos vitales y retiro de medicación (Retraso > 48h)',
      department: 'Enfermería',
      assigneeRole: 'Enfermeria',
      assigneeName: 'Dra. Elena Vargas',
      dueDate: '2026-03-01', // Vencida hace más de 48h
      status: 'vencida',
      priority: 'alta',
      evidenceRequired: true,
    };
    setAppState(prev => ({
      ...prev,
      tasks: [testTask, ...prev.tasks],
    }));
    logAudit('TAREA_SIMULADA_48H', 'tasks', 'Tarea con retraso superior a 48h simulada para comprobar el Panel de Alertas.');
    showToast('Alerta activada: Se agregó una tarea con retraso > 48h con borde rojo animado.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      {/* AVISO DISCRETO OBLIGATORIO DE PROTOTIPO */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 flex flex-wrap justify-between items-center border-b border-slate-700">
        <span className="flex items-center gap-1.5">
          <strong className="text-white">GUERREROS DE LA LUZ A.C. &middot; CENTROVIDA</strong>
          <span className="text-slate-400 hidden sm:inline">&mdash; Prototipo Operativo MVP con Datos Ficticios (Reglas R1 a R11)</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden md:inline">Disociación Clínica &middot; Egreso Libre &middot; Trazabilidad Append-Only</span>
          <button 
            onClick={handleResetData}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600 transition"
          >
            Reiniciar Demo
          </button>
        </div>
      </div>

      {/* ENCABEZADO INSTITUCIONAL CON BRANDING Y SELECTORES */}
      <header className="bg-[#0E2A47] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-4 justify-between items-center">
          
          {/* Identidad Institucional */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D49E24] border-2 border-white flex items-center justify-center text-slate-950 font-black shadow-inner">
              <ShieldIcon />
            </div>
            <div>
              <div className="font-black text-base tracking-wide flex items-center gap-2">
                GUERREROS DE LA LUZ A.C.
                <span className="text-[10px] bg-[#D49E24] text-slate-950 px-2 py-0.5 rounded font-black tracking-wider">
                  {activeCenter.code}
                </span>
              </div>
              <p className="text-xs text-slate-300">Modelo Integral de Acompañamiento y Recuperación</p>
            </div>
          </div>

          {/* Selectores "Ver como..." y Sede Activa (R1) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Selector de Centro (Aislamiento R1) */}
            <div className="bg-slate-800/90 p-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Sede:</span>
              <select 
                aria-label="Sede activa"
                value={currentCenterId} 
                onChange={(e) => {
                  setCurrentCenterId(e.target.value);
                  logAudit('CAMBIO_SEDE', 'centers', `Operador cambió contexto a sede ${e.target.value}`);
                  showToast(`Contexto cambiado a: ${appState.centers.find(c => c.id === e.target.value)?.name}`);
                }}
                className="bg-[#0E2A47] text-white font-semibold rounded px-2 py-1 outline-none border border-slate-600 focus:border-[#D49E24]"
              >
                {appState.centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Selector de Rol ("Ver como...") */}
            <div className="bg-slate-800/90 p-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">Ver como:</span>
              <select 
                aria-label="Rol de usuario simulado"
                value={currentRole} 
                onChange={(e) => {
                  const newRole = e.target.value as Role;
                  setCurrentRole(newRole);
                  logAudit('CAMBIO_ROL_DEMO', 'users', `Simulación de vista cambiada al rol: ${newRole}`);
                  showToast(`Vista de demostración: ${newRole}`);
                }}
                className="bg-[#0E2A47] text-amber-300 font-bold rounded px-2 py-1 outline-none border border-slate-600 focus:border-[#D49E24]"
              >
                <option value="Direccion">Dirección General</option>
                <option value="Administracion">Administración & Finanzas</option>
                <option value="Psicologia">Psicología Clínica</option>
                <option value="Consejeria">Consejería en Adicciones</option>
                <option value="Enfermeria">Enfermería / Médica</option>
                <option value="TrabajoSocial">Trabajo Social</option>
                <option value="Operativo">Personal Operativo</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* BARRA DE NAVEGACIÓN ADAPTADA POR ROL */}
      <nav className="bg-white border-b border-slate-200 sticky top-[61px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto text-sm font-semibold">
          <button 
            onClick={() => setCurrentTab('inicio')} 
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'inicio' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            Inicio ({currentRole})
          </button>
          
          <button 
            onClick={() => setCurrentTab('personas')} 
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'personas' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            Personas & Expedientes
          </button>

          {/* Finanzas solo visible para Dirección y Administración (R4) */}
          {can(currentUser, 'manage_finances', 'finanzas') && (
            <button 
              onClick={() => setCurrentTab('finanzas')} 
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'finanzas' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              Cobranza & Finanzas
            </button>
          )}

          <button 
            onClick={() => setCurrentTab('actividades')} 
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'actividades' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            Tareas & Bitácoras
          </button>

          <button 
            onClick={() => setCurrentTab('documentos')} 
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'documentos' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            Documentos & Firmas
          </button>

          <button 
            onClick={() => setCurrentTab('comunicacion')} 
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'comunicacion' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            Comunicación & Visitas
          </button>

          {/* Auditoría solo para Dirección */}
          {can(currentUser, 'administer', 'auditoria') && (
            <button 
              onClick={() => setCurrentTab('auditoria')} 
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'auditoria' ? 'border-[#D49E24] text-[#0E2A47] font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              Auditoría Inmutable
            </button>
          )}

          <button 
            onClick={() => setCurrentTab('pruebas')} 
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${currentTab === 'pruebas' ? 'border-[#D49E24] text-emerald-800 font-bold bg-emerald-50/50' : 'border-transparent text-emerald-700 hover:text-emerald-900'}`}
          >
            Pruebas de Aceptación (R1-R11)
          </button>
        </div>
      </nav>

      {/* TOAST FLOTANTE */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl text-white text-xs font-medium flex items-start gap-3 transition-all ${
          notification.type === 'error' ? 'bg-rose-700' : notification.type === 'warn' ? 'bg-amber-600' : 'bg-[#0E2A47] border border-[#D49E24]'
        }`}>
          <div className="mt-0.5"><CheckCircleIcon /></div>
          <div className="flex-1 leading-relaxed">{notification.message}</div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">

        {/* ==================================================== */}
        {/* TAB 1: INICIO PERSONALIZADO POR ROL                   */}
        {/* ==================================================== */}
        {currentTab === 'inicio' && (
          <div className="space-y-6">
            {/* PANEL DE ALERTAS CRÍTICAS (> 48 HORAS DE RETRASO) */}
            <AlertsPanel 
              tasks={appState.tasks.filter(t => t.centerId === currentCenterId)}
              onCompleteTask={(task) => {
                setAppState(prev => ({
                  ...prev,
                  tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status: 'completada', completedAt: new Date().toISOString(), completedBy: currentUser.name } : t)
                }));
                logAudit('TAREA_COMPLETADA_ALERTA', 'tasks', `Tarea crítica "${task.title}" completada desde Panel de Alertas por ${currentUser.name}`);
                showToast(`Tarea urgente "${task.title}" atendida y completada.`);
              }}
              onScrollToTask={handleScrollToTask}
              onGenerateTestDelayedTask={handleGenerateTestDelayedTask}
            />

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Panel de Control &middot; {currentUser.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Rol activo: <span className="font-bold text-[#0E2A47]">{currentRole}</span> en <span className="font-semibold">{activeCenter.name} ({activeCenter.code})</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowCenterReportModal(true)}
                  className="bg-[#D49E24] hover:bg-[#b8871b] text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition shadow flex items-center gap-1.5 cursor-pointer"
                  title="Genera y descarga el reporte consolidado en PDF con ocupación, finanzas e incidentes de la sede"
                >
                  <FileTextIcon />
                  Reporte PDF Sede
                </button>

                <button 
                  onClick={() => {
                    setWizardStep(1);
                    setShowNewPersonWizard(true);
                  }}
                  className="bg-[#0E2A47] hover:bg-[#153a61] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <UserGroupIcon />
                  Registrar Ingreso (Admisión)
                </button>
              </div>
            </div>

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] uppercase font-bold text-slate-500">Residentes en Sede</div>
                <div className="text-2xl font-black text-[#0E2A47] mt-1">
                  {filteredPersons.length} <span className="text-xs font-normal text-slate-500">/ {activeCenter.capacity} camas</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Aislamiento por centerId (R1)</div>
              </div>

              {can(currentUser, 'manage_finances', 'finanzas') ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-[11px] uppercase font-bold text-slate-500">Cartera Pendiente en Sede</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    $11,000 <span className="text-xs font-normal text-slate-500">MXN</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Cargos vencidos y del periodo</div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-[11px] uppercase font-bold text-slate-500">Agenda Clínica Hoy</div>
                  <div className="text-2xl font-black text-indigo-700 mt-1">3 Programadas</div>
                  <div className="text-[11px] text-slate-500 mt-1">Disociada de datos financieros (R4)</div>
                </div>
              )}

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] uppercase font-bold text-slate-500">Tareas Pendientes</div>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {appState.tasks.filter(t => t.centerId === currentCenterId && t.status !== 'completada').length}
                </div>
                <div className="text-[11px] text-rose-600 font-semibold mt-1">
                  {appState.tasks.filter(t => t.centerId === currentCenterId && calculateOverdueInfo(t.dueDate, t.status).isCriticalOverdue).length} con retraso crítico &gt; 48h
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[11px] uppercase font-bold text-slate-500">Trazabilidad en Sede</div>
                <div className="text-2xl font-black text-slate-700 mt-1">
                  {appState.auditEvents.filter(a => a.centerId === currentCenterId).length} eventos
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Append-only audit log</div>
              </div>
            </div>

            {/* Lista de Tareas Prioritarias del Rol */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Tareas prioritarias para {currentRole}</h2>
                  <p className="text-[11px] text-slate-500">Regla R10: Las tareas no se autocompletan ni reasignan sin acción humana</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleGenerateTestDelayedTask}
                    className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg font-bold transition"
                    title="Simular nueva tarea con retraso superior a 48h"
                  >
                    + Simular Tarea (+48h)
                  </button>
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="text-xs bg-[#0E2A47] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#153a61]"
                  >
                    + Asignar Tarea
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {appState.tasks
                  .filter(t => t.centerId === currentCenterId)
                  .map(task => {
                    const overdue = calculateOverdueInfo(task.dueDate, task.status);
                    const isCritical = overdue.isCriticalOverdue;

                    return (
                      <div 
                        key={task.id} 
                        id={`task-row-${task.id}`}
                        className={`p-4 flex flex-wrap items-center justify-between gap-3 transition-all rounded-xl ${
                          isCritical
                            ? 'border-animated-red bg-rose-50/70 shadow-sm my-2'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isCritical ? (
                              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1.5 shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                Retraso Crítico (+{overdue.overdueHours}h)
                              </span>
                            ) : (
                              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                                task.status === 'vencida' ? 'bg-rose-100 text-rose-800' : task.status === 'completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {task.status}
                              </span>
                            )}
                            <span className={`text-sm ${isCritical ? 'font-black text-rose-950' : 'font-bold text-slate-900'}`}>
                              {task.title}
                            </span>
                          </div>
                          <p className="text-slate-500">
                            Depto: <strong className="text-slate-700">{task.department}</strong> &middot; Responsable: <strong className="text-slate-700">{task.assigneeName || task.assigneeRole}</strong> &middot; Vence: <span className={isCritical ? 'font-mono font-black text-rose-700' : ''}>{task.dueDate}</span>
                            {isCritical && (
                              <span className="ml-2 font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">
                                ⚠️ Retraso de {overdue.overdueDays} días (+{overdue.overdueHours} hrs sin atender)
                              </span>
                            )}
                            &middot; Evidencia requerida: {task.evidenceRequired ? 'Sí' : 'No'}
                          </p>
                        </div>

                        <div>
                          {task.status !== 'completada' ? (
                            <button 
                              onClick={() => {
                                setAppState(prev => ({
                                  ...prev,
                                  tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status: 'completada', completedAt: new Date().toISOString(), completedBy: currentUser.name } : t)
                                }));
                                logAudit('TAREA_COMPLETADA', 'tasks', `Tarea "${task.title}" completada por ${currentUser.name}`);
                                showToast(`Tarea "${task.title}" marcada como completada.`);
                              }}
                              className={`font-bold px-3 py-1.5 rounded-lg transition shadow-sm ${
                                isCritical 
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' 
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                              }`}
                            >
                              {isCritical ? 'Resolver Urgente' : 'Marcar Realizada'}
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircleIcon /> Completada por {task.completedBy || 'Personal'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PERSONAS, EXPEDIENTES Y RED DE APOYO           */}
        {/* ==================================================== */}
        {currentTab === 'personas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Lista lateral de Personas */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-900 text-sm">Personas Atendidas ({filteredPersons.length})</h2>
                <button 
                  onClick={() => {
                    setWizardStep(1);
                    setShowNewPersonWizard(true);
                  }}
                  className="bg-[#0E2A47] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#153a61]"
                >
                  + Nueva Persona
                </button>
              </div>

              {/* Filtros rápidos */}
              <div className="space-y-2">
                <input 
                  type="text"
                  placeholder="Buscar por nombre o folio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#0E2A47] outline-none"
                />

                <div className="flex gap-1 overflow-x-auto text-[11px]">
                  {['todos', 'En atencion', 'Admitido', 'En evaluacion', 'Egresado'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${
                        statusFilter === st ? 'bg-[#0E2A47] text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {st === 'todos' ? 'Todos' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarjetas de Persona */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredPersons.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                    No se encontraron residentes en {activeCenter.name} con los filtros aplicados.
                  </div>
                ) : (
                  filteredPersons.map(person => {
                    const ep = appState.episodes.find(e => e.personId === person.id && e.status !== 'Egresado') || appState.episodes.find(e => e.personId === person.id);
                    const isSelected = activePerson?.id === person.id;

                    return (
                      <div 
                        key={person.id} 
                        onClick={() => setSelectedPersonId(person.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                          isSelected 
                            ? 'border-[#0E2A47] bg-white ring-2 ring-[#0E2A47]/10 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-[#D49E24]">{person.folio}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            ep?.status === 'Egresado' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ep?.status || 'Sin episodio'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{person.fullName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Nac: {person.birthDate} &middot; Tel: {person.phone}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expediente Detallado */}
            <div className="lg:col-span-8">
              {activePerson ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  {/* Encabezado del Expediente */}
                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-[#0E2A47] text-white rounded">
                          {activePerson.folio}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900">{activePerson.fullName}</h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Sede: <strong>{activeCenter.name}</strong> &middot; Estado del episodio: <strong className="text-slate-800">{personEpisode?.status}</strong> &middot; Responsable: {personEpisode?.responsibleStaff}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setShowExecutiveSummaryModal(true)}
                        className="bg-[#D49E24] hover:bg-[#b8871b] text-slate-950 text-xs font-black px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
                        title="Genera un resumen ejecutivo imprimible y exportable a PDF con todos los datos del paciente y sus episodios"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Exportar a PDF (Resumen)
                      </button>

                      {personEpisode?.status !== 'Egresado' ? (
                        <button 
                          onClick={() => setShowDischargeModal(true)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                        >
                          Registrar Egreso (R3)
                        </button>
                      ) : (
                        <button 
                          onClick={handleReadmission}
                          className="bg-[#0E2A47] hover:bg-[#163f6a] text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                        >
                          Iniciar Reingreso (Nuevo Episodio R2)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-Pestañas de la Ficha */}
                  <div className="flex border-b border-slate-200 px-6 gap-4 text-xs font-bold overflow-x-auto">
                    {[
                      { id: 'datos', label: 'Datos Generales' },
                      { id: 'red_apoyo', label: 'Red de Apoyo Familiar (R7 & R9)' },
                      { id: 'episodios', label: 'Admisión & Episodios (R8 & R2)' },
                      { id: 'cuenta', label: 'Estado de Cuenta (R6)' },
                      { id: 'documentos', label: 'Documentos' },
                      { id: 'historial', label: 'Trazabilidad' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setPersonTab(tab.id as any)}
                        className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
                          personTab === tab.id ? 'border-[#0E2A47] text-[#0E2A47]' : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Contenido de la Ficha */}
                  <div className="p-6">
                    {/* TAB 1: DATOS GENERALES */}
                    {personTab === 'datos' && (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-medium">Nombre Completo:</span>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">{activePerson.fullName}</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-medium">Fecha de Nacimiento:</span>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">{activePerson.birthDate}</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-medium">Teléfono de Contacto:</span>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">{activePerson.phone}</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-medium">Fecha de Primer Registro:</span>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">{activePerson.createdAt.split('T')[0]}</div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-medium">Domicilio Particular (Campos Disociados):</span>
                          <div className="text-slate-800 font-semibold">
                            {activePerson.street} #{activePerson.extNum} {activePerson.intNum ? `Int. ${activePerson.intNum}` : ''}, Col. {activePerson.neighborhood}, C.P. {activePerson.postalCode}, {activePerson.city}, {activePerson.state}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: RED DE APOYO FAMILIAR (R7 & R9) */}
                    {personTab === 'red_apoyo' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-slate-500">
                            Principio R7: Familiar ≠ Acceso clínico. Los permisos de comunicación y cobranza son independientes.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {appState.contacts.filter(c => c.personId === activePerson.id).map(contact => (
                            <div key={contact.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{contact.name}</span>
                                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                                    {contact.relationship}
                                  </span>
                                  {contact.contactRestricted && (
                                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                                      Restricción de Contacto Activa
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500">
                                  Teléfono: <strong>{contact.phone}</strong> &middot; Roles asignados: {contact.roles.join(', ') || 'Sin roles específicos'}
                                </p>
                                <p className="text-slate-600 text-[11px]">
                                  Canales autorizados: {contact.authorizedChannels.join(', ')} &middot; Recordatorios de pago: {contact.allowsReminders ? <strong className="text-emerald-700">Autorizados</strong> : <strong className="text-rose-700">No Autorizados (R9)</strong>}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handlePrepareMessage(contact)}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
                                >
                                  <MessageSquareIcon />
                                  Preparar WhatsApp Asistido
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: ADMISIÓN & EPISODIOS (R8 & R2) */}
                    {personTab === 'episodios' && (
                      <div className="space-y-6">
                        {/* Checklist de Admisión Independiente (R8) */}
                        <div className="p-5 border border-amber-200 bg-amber-50/50 rounded-2xl space-y-3">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                              Requisitos de Admisión &middot; Principio de Consentimiento Personal (R8)
                            </h3>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              La firma de un familiar NO sustituye el consentimiento de la persona atendida. Cada elemento es validado por separado.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                              <input 
                                type="checkbox" 
                                id="chkConsent"
                                checked={personEpisode?.consentPersonSigned || false}
                                onChange={(e) => {
                                  if (!personEpisode) return;
                                  setAppState(prev => ({
                                    ...prev,
                                    episodes: prev.episodes.map(ep => ep.id === personEpisode.id ? { ...ep, consentPersonSigned: e.target.checked } : ep)
                                  }));
                                  logAudit('CONSENTIMIENTO_PROPIO', 'episodes', `Consentimiento de la persona atendida actualizado a: ${e.target.checked}`);
                                }}
                                className="w-4 h-4 text-[#0E2A47] rounded cursor-pointer"
                              />
                              <label htmlFor="chkConsent" className="text-slate-800 font-bold cursor-pointer">
                                1. Consentimiento de la Persona (Propio)
                              </label>
                            </div>

                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                              <input 
                                type="checkbox" 
                                id="chkLegal"
                                checked={personEpisode?.legalRepresentationSigned || false}
                                onChange={(e) => {
                                  if (!personEpisode) return;
                                  setAppState(prev => ({
                                    ...prev,
                                    episodes: prev.episodes.map(ep => ep.id === personEpisode.id ? { ...ep, legalRepresentationSigned: e.target.checked } : ep)
                                  }));
                                  logAudit('REP_LEGAL_DOC', 'episodes', `Representación legal actualizada a: ${e.target.checked}`);
                                }}
                                className="w-4 h-4 text-[#0E2A47] rounded cursor-pointer"
                              />
                              <label htmlFor="chkLegal" className="text-slate-800 font-bold cursor-pointer">
                                2. Representación Legal (Si aplica)
                              </label>
                            </div>

                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                              <input 
                                type="checkbox" 
                                id="chkPriv"
                                checked={personEpisode?.privacyNoticeSigned || false}
                                onChange={(e) => {
                                  if (!personEpisode) return;
                                  setAppState(prev => ({
                                    ...prev,
                                    episodes: prev.episodes.map(ep => ep.id === personEpisode.id ? { ...ep, privacyNoticeSigned: e.target.checked } : ep)
                                  }));
                                }}
                                className="w-4 h-4 text-[#0E2A47] rounded cursor-pointer"
                              />
                              <label htmlFor="chkPriv" className="text-slate-800 font-bold cursor-pointer">
                                3. Aviso de Privacidad Integral Firmado
                              </label>
                            </div>

                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                              <input 
                                type="checkbox" 
                                id="chkEcon"
                                checked={personEpisode?.economicAgreementSigned || false}
                                onChange={(e) => {
                                  if (!personEpisode) return;
                                  setAppState(prev => ({
                                    ...prev,
                                    episodes: prev.episodes.map(ep => ep.id === personEpisode.id ? { ...ep, economicAgreementSigned: e.target.checked } : ep)
                                  }));
                                }}
                                className="w-4 h-4 text-[#0E2A47] rounded cursor-pointer"
                              />
                              <label htmlFor="chkEcon" className="text-slate-800 font-bold cursor-pointer">
                                4. Convenio Económico y Plan de Cuotas
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Historial de Episodios (R2) */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-slate-900">Historial de Episodios Clínico-Administrativos (R2)</h4>
                          <div className="space-y-2">
                            {appState.episodes.filter(e => e.personId === activePerson.id).map((ep, idx) => (
                              <div key={ep.id} className="text-xs p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap justify-between items-center gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800">Episodio #{idx + 1} &middot; {ep.status}</span>
                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">{ep.id}</span>
                                  </div>
                                  <div className="text-slate-500">
                                    Ingreso: <strong>{ep.admittedAt}</strong> {ep.dischargedAt && `| Egreso: ${ep.dischargedAt} (Motivo: ${ep.dischargeReason})`}
                                  </div>
                                  {ep.continuityPlan && (
                                    <div className="text-slate-600 italic">Plan de continuidad: {ep.continuityPlan}</div>
                                  )}
                                </div>

                                <div className="text-right">
                                  <span className="text-[11px] font-semibold text-slate-500">Responsable: {ep.responsibleStaff}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: ESTADO DE CUENTA (R6) */}
                    {personTab === 'cuenta' && (
                      <div className="space-y-6">
                        {can(currentUser, 'manage_finances', 'finanzas') ? (
                          (() => {
                            const bal = calculatePersonBalance(activePerson.id);
                            return (
                              <div className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-4">
                                  <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">Resumen Financiero del Expediente</span>
                                    <div className="text-xs text-slate-500 mt-0.5">Saldo = Cargos &minus; Pagos &plusmn; Ajustes auditados</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-slate-500 uppercase">Saldo Pendiente</div>
                                    <div className={`text-2xl font-black ${bal.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                      ${bal.balance.toLocaleString('es-MX')} MXN
                                    </div>
                                  </div>
                                </div>

                                {/* Cargos */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold uppercase text-slate-700">Cargos Programados</h4>
                                    <button 
                                      onClick={() => setShowPaymentModal(true)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow"
                                    >
                                      + Registrar Abono / Pago
                                    </button>
                                  </div>
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-600">
                                      <tr>
                                        <th className="p-2.5">Concepto</th>
                                        <th className="p-2.5">Vencimiento</th>
                                        <th className="p-2.5">Estado</th>
                                        <th className="p-2.5 text-right">Monto</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {bal.charges.map(ch => (
                                        <tr key={ch.id}>
                                          <td className="p-2.5 font-bold text-slate-800">{ch.concept}</td>
                                          <td className="p-2.5 text-slate-500">{ch.dueDate}</td>
                                          <td className="p-2.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                              ch.status === 'pagado' ? 'bg-emerald-100 text-emerald-800' : ch.status === 'vencido' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                              {ch.status}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-right font-black text-slate-900">${ch.amount.toLocaleString('es-MX')}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Historial de Pagos Inmutables (R6) */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold uppercase text-slate-700">Pagos Registrados Inmutables (R6)</h4>
                                    <button 
                                      onClick={() => setShowAdjustmentModal(true)}
                                      className="text-xs bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg"
                                    >
                                      Aplicar Ajuste Contable (R6)
                                    </button>
                                  </div>
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-600">
                                      <tr>
                                        <th className="p-2.5">Folio Recibo</th>
                                        <th className="p-2.5">Fecha</th>
                                        <th className="p-2.5">Método</th>
                                        <th className="p-2.5">Registrado Por</th>
                                        <th className="p-2.5 text-right">Monto</th>
                                        <th className="p-2.5 text-right">Comprobante</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {bal.payments.map(p => {
                                        const ch = appState.charges.find(c => c.id === p.chargeId) || {
                                          id: p.chargeId,
                                          episodeId: personEpisode?.id || '',
                                          concept: 'Cuota de Acompañamiento y Recuperación Integral',
                                          amount: p.amount,
                                          dueDate: p.paidAt,
                                          status: 'pagado' as const,
                                        };
                                        return (
                                          <tr key={p.id}>
                                            <td className="p-2.5 font-bold text-[#0E2A47]">{p.receiptFolio}</td>
                                            <td className="p-2.5 text-slate-500">{p.paidAt}</td>
                                            <td className="p-2.5">{p.method}</td>
                                            <td className="p-2.5 text-slate-500">{p.registeredBy}</td>
                                            <td className="p-2.5 text-right font-black text-emerald-700">${p.amount.toLocaleString('es-MX')}</td>
                                            <td className="p-2.5 text-right">
                                              <button
                                                onClick={() => setSelectedPaymentForReceipt({ payment: p, charge: ch })}
                                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-300 text-[11px] shadow-sm inline-flex items-center gap-1 cursor-pointer transition"
                                                title="Descargar comprobante digital o enviar plantilla por WhatsApp"
                                              >
                                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Recibo & WhatsApp
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                            Acceso reservado a Dirección y Administración conforme a la matriz de permisos institucionales (R4).
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 5: DOCUMENTOS Y FIRMAS */}
                    {personTab === 'documentos' && (
                      <div className="space-y-4 text-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-900">Documentos del Expediente</h4>
                          <button 
                            onClick={() => setCurrentTab('documentos')}
                            className="text-[#0E2A47] underline font-bold"
                          >
                            Ir a Biblioteca de Plantillas y Generador
                          </button>
                        </div>

                        <div className="space-y-2">
                          {appState.documents.filter(d => personEpisode && d.episodeId === personEpisode.id).map(doc => (
                            <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">{doc.title}</div>
                                <div className="text-slate-500">
                                  Versión #{doc.version} &middot; Estado: <strong className="text-emerald-700">{doc.status}</strong> &middot; Firmado por: {doc.signedBy} ({doc.signedRole})
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  alert(`Vista Previa de Documento:\n\n${doc.content}\n\nFirma registrada: ${doc.signedBy} [${doc.signedAt}]`);
                                }}
                                className="bg-[#0E2A47] text-white px-3 py-1.5 rounded font-bold hover:bg-[#153a61]"
                              >
                                Ver Texto Completo
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 6: HISTORIAL DE CAMBIOS Y TRAZABILIDAD */}
                    {personTab === 'historial' && (
                      <div className="space-y-3 text-xs">
                        <h4 className="font-bold text-slate-900">Eventos Registrados en Este Expediente</h4>
                        <div className="divide-y divide-slate-100 font-mono text-[11px]">
                          {appState.auditEvents.slice(0, 8).map(evt => (
                            <div key={evt.id} className="py-2.5 flex justify-between gap-4">
                              <div>
                                <span className="font-bold text-slate-900">{evt.actor} ({evt.role})</span> &mdash; <span className="text-[#D49E24] font-bold">{evt.action}</span>
                                <div className="text-slate-500">{evt.details}</div>
                              </div>
                              <span className="text-slate-400 whitespace-nowrap">{evt.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
                  Selecciona una persona de la lista lateral para consultar su expediente.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: COBRANZA Y FINANZAS (R3 & R6)                  */}
        {/* ==================================================== */}
        {currentTab === 'finanzas' && can(currentUser, 'manage_finances', 'finanzas') && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Gestión de Cobranza & Finanzas</h2>
                <p className="text-xs text-slate-500">
                  Control estricto con pagos inmutables (R6) e historial de egresos no condicionados (R3).
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow"
                >
                  + Registrar Gasto
                </button>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow"
                >
                  + Registrar Pago en Caja
                </button>
              </div>
            </div>

            {/* Cuentas por Cobrar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Cuentas por Cobrar en Sede ({activeCenter.code})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr>
                      <th className="p-3">Folio</th>
                      <th className="p-3">Persona Atendida</th>
                      <th className="p-3">Total Cargos</th>
                      <th className="p-3">Abonado</th>
                      <th className="p-3">Saldo Deudor</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPersons.map(p => {
                      const bal = calculatePersonBalance(p.id);
                      const contact = appState.contacts.find(c => c.personId === p.id && c.roles.includes('pago')) || appState.contacts.find(c => c.personId === p.id);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-[#D49E24]">{p.folio}</td>
                          <td className="p-3 font-bold text-slate-900">{p.fullName}</td>
                          <td className="p-3">${bal.totalCharges.toLocaleString('es-MX')}</td>
                          <td className="p-3 text-emerald-700 font-semibold">${bal.totalPaid.toLocaleString('es-MX')}</td>
                          <td className={`p-3 font-black ${bal.balance > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                            ${bal.balance.toLocaleString('es-MX')}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              bal.balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {bal.balance > 0 ? 'Con Adeudo' : 'Al Corriente'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {bal.balance > 0 && contact && (
                              <button 
                                onClick={() => handlePrepareMessage(contact)}
                                className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded border border-emerald-300"
                              >
                                Recordatorio WhatsApp (R9)
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comprobantes de Pago Digitales Registrados */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Comprobantes de Pago Digitales en Sede ({activeCenter.code})</h3>
                  <p className="text-[11px] text-slate-500">Historial inmutable de recibos oficiales listos para descarga e impresión o envío por WhatsApp</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr>
                      <th className="p-3">Recibo</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Residente</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Método</th>
                      <th className="p-3">Registrado Por</th>
                      <th className="p-3 text-right">Monto</th>
                      <th className="p-3 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appState.payments
                      .filter(pay => {
                        const charge = appState.charges.find(c => c.id === pay.chargeId);
                        const ep = appState.episodes.find(e => e.id === charge?.episodeId);
                        return ep ? ep.centerId === currentCenterId : true;
                      })
                      .map(pay => {
                        const charge = appState.charges.find(c => c.id === pay.chargeId) || {
                          id: pay.chargeId,
                          episodeId: 'ep1',
                          concept: 'Cuota de Acompañamiento y Recuperación',
                          amount: pay.amount,
                          dueDate: pay.paidAt,
                          status: 'pagado' as const,
                        };
                        const ep = appState.episodes.find(e => e.id === charge.episodeId);
                        const person = appState.persons.find(p => p.id === ep?.personId) || appState.persons[0];

                        return (
                          <tr key={pay.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-[#0E2A47] font-mono">{pay.receiptFolio}</td>
                            <td className="p-3 text-slate-500">{pay.paidAt}</td>
                            <td className="p-3 font-semibold text-slate-900">
                              {person ? `${person.fullName} (${person.folio})` : 'Residente'}
                            </td>
                            <td className="p-3 text-slate-700">{charge.concept}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                {pay.method}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{pay.registeredBy}</td>
                            <td className="p-3 text-right font-black text-emerald-700">${pay.amount.toLocaleString('es-MX')}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedPaymentForReceipt({ payment: pay, charge })}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-300 text-[11px] shadow-sm inline-flex items-center gap-1 cursor-pointer transition"
                              >
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar / WhatsApp
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gastos de la Sede */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Gastos Operativos Registrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Proveedor / Comprobante</th>
                      <th className="p-3">Registrado Por</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appState.expenses.filter(e => e.centerId === currentCenterId).map(exp => (
                      <tr key={exp.id}>
                        <td className="p-3 text-slate-500">{exp.spentAt}</td>
                        <td className="p-3 font-bold uppercase text-[10px] text-slate-600">{exp.category}</td>
                        <td className="p-3 font-medium text-slate-900">{exp.concept}</td>
                        <td className="p-3 text-slate-500">{exp.vendor} ({exp.receiptNumber || 'S/C'})</td>
                        <td className="p-3 text-slate-500">{exp.registeredBy}</td>
                        <td className="p-3 text-right font-black text-rose-700">${exp.amount.toLocaleString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: ACTIVIDADES, TURNOS Y BITÁCORA DISOCIADA (R4)  */}
        {/* ==================================================== */}
        {currentTab === 'actividades' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bitácora de Turno, Actividades & Derechos</h2>
                <p className="text-xs text-slate-500">
                  Regla R4: La existencia de una nota clínica no expone su contenido reservado al personal administrativo o no asignado.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowIncidentModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow"
                >
                  + Reportar Incidencia
                </button>
                <button 
                  onClick={() => setShowComplaintModal(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow"
                >
                  Canal Protegido de Quejas
                </button>
              </div>
            </div>

            {/* Lista de Entradas de Bitácora */}
            <div className="space-y-3">
              {appState.logs.filter(l => l.centerId === currentCenterId).map(log => {
                const canSeeClinical = !log.isConfidentialClinical || can(currentUser, 'read_clinical_content', 'clinical_body');

                return (
                  <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          log.department === 'Psicologia' ? 'bg-purple-100 text-purple-800' : log.department === 'Medica' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {log.department}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{log.summary}</h4>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{log.createdAt}</span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Autor: <strong className="text-slate-700">{log.author}</strong> ({log.authorRole}) &middot; Versión: #{log.version}
                    </div>

                    {/* Texto protegido por R4 */}
                    <div className="pt-2 text-xs leading-relaxed">
                      {canSeeClinical ? (
                        <p className="bg-slate-50 p-3.5 rounded-xl text-slate-800 border border-slate-100">
                          {log.body}
                        </p>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 flex items-start gap-2.5">
                          <AlertTriangleIcon />
                          <div>
                            <strong>[CONTENIDO CLÍNICO RESERVADO &middot; REGLA R4]:</strong> La nota existe en el sistema y se certifica su realización, pero el cuerpo de la sesión psicológica/médica está reservado exclusivamente al personal de salud autorizado.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canal Protegido de Quejas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Canal Protegido de Derechos y Quejas</h3>
                <p className="text-xs text-slate-500">
                  Protección garantizada: Una persona señalada en la queja tiene estrictamente prohibido cerrarla o modificarla.
                </p>
              </div>

              <div className="space-y-3">
                {appState.complaints.filter(c => c.centerId === currentCenterId).map(cmp => {
                  const isAccused = currentUser.name.toLowerCase() === cmp.accusedUserName?.toLowerCase();
                  const canReview = can(currentUser, 'review_complaint', 'complaints', { accusedUserName: cmp.accusedUserName });

                  return (
                    <div key={cmp.id} className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 flex flex-wrap justify-between items-center gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-900">{cmp.folio}</span>
                          <span className="font-bold text-slate-800 uppercase text-[10px]">({cmp.category})</span>
                          <span className="text-slate-400">&middot; {cmp.submittedAt}</span>
                        </div>
                        <p className="text-slate-700">{cmp.description}</p>
                        {cmp.accusedUserName && (
                          <p className="text-slate-500">Persona señalada: <strong>{cmp.accusedUserName}</strong></p>
                        )}
                      </div>

                      <div>
                        {isAccused ? (
                          <span className="text-[11px] text-rose-700 font-bold bg-rose-100 px-2.5 py-1 rounded">
                            Bloqueado: Persona Señalada en la Queja
                          </span>
                        ) : canReview ? (
                          <button 
                            onClick={() => {
                              showToast(`Expediente de queja ${cmp.folio} atendido por ${currentUser.name}`);
                            }}
                            className="bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-purple-800"
                          >
                            Dar Seguimiento
                          </button>
                        ) : (
                          <span className="text-slate-400 font-semibold">Solo Dirección/T. Social</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: DOCUMENTOS Y FIRMAS (R5 & CANVAS)             */}
        {/* ==================================================== */}
        {currentTab === 'documentos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Biblioteca de Plantillas & Firmas Inmutables</h2>
                <p className="text-xs text-slate-500">
                  Regla R5: Un documento firmado nunca se sobreescribe. Toda corrección crea una nueva versión con trazabilidad.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {appState.templates.map(tmpl => (
                <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#D49E24] tracking-wider">
                      Plantilla Aprobada &middot; {tmpl.kind}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{tmpl.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {tmpl.body}
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      if (!activePerson) {
                        showToast('Selecciona primero una persona en atención.', 'warn');
                        return;
                      }
                      const filled = tmpl.body
                        .replace(/{{nombre_persona}}/g, activePerson.fullName)
                        .replace(/{{fecha_nacimiento}}/g, activePerson.birthDate)
                        .replace(/{{folio}}/g, activePerson.folio)
                        .replace(/{{centro}}/g, activeCenter.name)
                        .replace(/{{direccion_centro}}/g, activeCenter.address)
                        .replace(/{{fecha_hoy}}/g, new Date().toLocaleDateString('es-MX'))
                        .replace(/{{motivo_egreso}}/g, 'Término de tratamiento programado');

                      const newDoc: DocumentRecord = {
                        id: `doc-${Date.now()}`,
                        episodeId: personEpisode ? personEpisode.id : 'ep1',
                        templateId: tmpl.id,
                        title: `${tmpl.name} - ${activePerson.fullName}`,
                        content: filled,
                        version: 1,
                        status: 'borrador',
                        createdAt: new Date().toISOString(),
                      };

                      setSignatureTargetDoc(newDoc);
                      setShowSignaturePad(true);
                    }}
                    className="w-full bg-[#0E2A47] hover:bg-[#153a61] text-white text-xs font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5"
                  >
                    <FileTextIcon />
                    Generar y Capturar Firma
                  </button>
                </div>
              ))}
            </div>

            {/* Documentos Firmados en el Centro */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Documentos Firmados y Custodiados</h3>
              <div className="space-y-2 text-xs">
                {appState.documents.map(doc => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{doc.title}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        Versión #{doc.version} &middot; Firmante: <strong>{doc.signedBy}</strong> ({doc.signedRole}) &middot; Fecha: {doc.signedAt}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          alert(`DOCUMENTO INSTITUCIONAL:\n\n${doc.content}\n\nFirmado electrónicamente por: ${doc.signedBy} en fecha ${doc.signedAt}.`);
                        }}
                        className="bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-bold text-slate-700"
                      >
                        Ver Documento
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: COMUNICACIÓN ASISTIDA & VISITAS (R9 & R11)     */}
        {/* ==================================================== */}
        {currentTab === 'comunicacion' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Comunicación Asistida & Calendario de Visitas</h2>
              <p className="text-xs text-slate-500">
                Reglas R9 y R11: Solo contactos con autorización previa y verificación humana antes de registrar envíos.
              </p>
            </div>

            {/* Historial de Mensajes Preparados y Enviados */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Historial de Mensajería Asistida</h3>
              <div className="space-y-2 text-xs">
                {appState.messages.filter(m => m.centerId === currentCenterId).map(msg => (
                  <div key={msg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{msg.contactName}</span>
                        <span className="text-slate-500">({msg.phone})</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          msg.status === 'enviado_confirmado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-slate-600 italic">"{msg.body}"</p>
                      {msg.confirmedSentBy && (
                        <p className="text-[11px] text-slate-500">
                          Confirmado por: <strong>{msg.confirmedSentBy}</strong> a las {msg.confirmedSentAt} (R11)
                        </p>
                      )}
                    </div>

                    <div>
                      {msg.status === 'preparado' && (
                        <button 
                          onClick={() => handleConfirmSent(msg)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          Confirmar que se Envió
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda de Visitas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Calendario de Visitas Familiares Programadas</h3>
              <div className="space-y-2 text-xs">
                {appState.visits.filter(v => v.centerId === currentCenterId).map(vis => (
                  <div key={vis.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{vis.personName} &larr; Familiar: {vis.contactName}</div>
                      <div className="text-slate-500 mt-0.5">Programada: {vis.scheduledAt} &middot; {vis.notes}</div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                      Autorizada
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: AUDITORÍA INMUTABLE (SOLO DIRECCIÓN)          */}
        {/* ==================================================== */}
        {currentTab === 'auditoria' && can(currentUser, 'administer', 'auditoria') && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pista de Auditoría Inmutable (Append-Only)</h2>
              <p className="text-xs text-slate-500">
                Registro criptográfico y cronológico de todas las mutaciones críticas en la sede.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0E2A47] text-white">
                    <tr>
                      <th className="p-3">Hora</th>
                      <th className="p-3">Actor / Rol</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Entidad</th>
                      <th className="p-3">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {appState.auditEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-500 whitespace-nowrap">{evt.timestamp}</td>
                        <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{evt.actor} ({evt.role})</td>
                        <td className="p-3 text-[#D49E24] font-black whitespace-nowrap">{evt.action}</td>
                        <td className="p-3 text-slate-600">{evt.entity}</td>
                        <td className="p-3 text-slate-700">{evt.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 8: PRUEBAS DE ACEPTACIÓN (R1 A R11)               */}
        {/* ==================================================== */}
        {currentTab === 'pruebas' && (
          <AcceptanceTests appState={appState} onRefresh={() => setAppState(getInitialState())} />
        )}

      </main>

      {/* ==================================================== */}
      {/* MODAL: EGRESO CON REGLA R3 (ADEUDO INFORMATIVO)      */}
      {/* ==================================================== */}
      {showDischargeModal && activePerson && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Registro de Egreso de Persona Atendida</h3>
            
            {/* Aviso Informativo de Saldo Deudor Sin Bloqueo (R3) */}
            {(() => {
              const bal = calculatePersonBalance(activePerson.id);
              return bal.balance > 0 ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangleIcon />
                  <div className="leading-relaxed">
                    <strong>Aviso Informativo Institucional (Regla R3):</strong> La persona cuenta con un saldo pendiente de <strong>${bal.balance.toLocaleString('es-MX')} MXN</strong>. Conforme a los derechos humanos y la normativa aplicable, este saldo <strong>NO impide, condiciona ni retrasa su egreso</strong>.
                  </div>
                </div>
              ) : null;
            })()}

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const reason = (form.elements.namedItem('reason') as HTMLSelectElement).value;
              const plan = (form.elements.namedItem('plan') as HTMLTextAreaElement).value;
              handleConfirmDischarge(reason, plan);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Motivo Institucional de Egreso</label>
                <select name="reason" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-[#0E2A47]">
                  <option value="Termino satisfactorio de programa">Término satisfactorio del programa</option>
                  <option value="Salida voluntaria anticipada">Salida voluntaria anticipada (Derecho de la persona)</option>
                  <option value="Referencia a segundo nivel medico">Referencia a segundo nivel médico / hospitalario</option>
                  <option value="Baja administrativa por mutuo acuerdo">Baja administrativa por mutuo acuerdo</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Plan de Continuidad / Red de Apoyo Externa</label>
                <textarea 
                  name="plan" 
                  rows={3} 
                  required
                  placeholder="Detalle el seguimiento ambulatorio, citas médicas y entrega formal a familiares..."
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-[#0E2A47]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow"
                >
                  Confirmar y Firmar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* WIZARD: ALTA DE PERSONA (<= 5 CAMPOS POR PASO)        */}
      {/* ==================================================== */}
      {showNewPersonWizard && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Admisión de Persona &middot; Paso {wizardStep} de 3</h3>
                <p className="text-[11px] text-slate-500">Sede receptora: {activeCenter.name}</p>
              </div>
              <span className="text-xs bg-[#0E2A47] text-white px-2 py-0.5 rounded font-bold">
                {wizardStep === 1 ? 'Identificación' : wizardStep === 2 ? 'Domicilio' : 'Red de Apoyo'}
              </span>
            </div>

            {/* PASO 1: IDENTIFICACIÓN */}
            {wizardStep === 1 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Nombre Completo de la Persona Atendida</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Juan Manuel Pérez García" 
                    value={newPersonData.fullName}
                    onChange={(e) => setNewPersonData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full border p-2.5 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      required 
                      value={newPersonData.birthDate}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full border p-2.5 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Teléfono Personal</label>
                    <input 
                      type="tel" 
                      placeholder="33-XXXX-XXXX" 
                      value={newPersonData.phone}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border p-2.5 rounded-lg"
                    />
                  </div>
                </div>

                {/* Verificación de Duplicados en Tiempo Real */}
                {(() => {
                  const dup = appState.persons.find(
                    p => p.fullName.toLowerCase() === newPersonData.fullName.trim().toLowerCase() && p.birthDate === newPersonData.birthDate
                  );
                  return dup ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                      <strong>Coincidencia detectada (Duplicado):</strong> Ya existe un registro con folio <strong>{dup.folio}</strong> ({dup.fullName}). Si es la misma persona, conviene registrar como <em>Reingreso (Nuevo Episodio)</em>.
                    </div>
                  ) : null;
                })()}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowNewPersonWizard(false)} className="px-3 py-2 border rounded-lg">Cancelar</button>
                  <button 
                    type="button" 
                    disabled={!newPersonData.fullName || !newPersonData.birthDate}
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-[#0E2A47] text-white font-bold rounded-lg disabled:opacity-50"
                  >
                    Siguiente: Domicilio &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: DOMICILIO DISOCIADO */}
            {wizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="font-bold block text-slate-700 mb-1">Calle</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Av. Chapultepec" 
                      value={newPersonData.street}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full border p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Núm. Exterior</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      value={newPersonData.extNum}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, extNum: e.target.value }))}
                      className="w-full border p-2 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Colonia</label>
                    <input 
                      type="text" 
                      placeholder="Americana" 
                      value={newPersonData.neighborhood}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, neighborhood: e.target.value }))}
                      className="w-full border p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Código Postal</label>
                    <input 
                      type="text" 
                      placeholder="44160" 
                      value={newPersonData.postalCode}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full border p-2 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={() => setWizardStep(1)} className="px-3 py-2 border rounded-lg">&larr; Anterior</button>
                  <button type="button" onClick={() => setWizardStep(3)} className="px-4 py-2 bg-[#0E2A47] text-white font-bold rounded-lg">Siguiente: Red de Apoyo &rarr;</button>
                </div>
              </div>
            )}

            {/* PASO 3: RED DE APOYO Y GUARDADO */}
            {wizardStep === 3 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Nombre del Familiar / Contacto Principal</label>
                  <input 
                    type="text" 
                    placeholder="Ej. María Elena Pérez" 
                    value={newPersonData.contactName}
                    onChange={(e) => setNewPersonData(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Teléfono Móvil (WhatsApp)</label>
                    <input 
                      type="tel" 
                      placeholder="33-XXXX-XXXX" 
                      value={newPersonData.contactPhone}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full border p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-slate-700 mb-1">Parentesco</label>
                    <select 
                      value={newPersonData.contactRelationship}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, contactRelationship: e.target.value }))}
                      className="w-full border p-2 rounded-lg"
                    >
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Cónyuge">Cónyuge</option>
                      <option value="Hermano">Hermano/a</option>
                      <option value="Tutor">Tutor / Representante Legal</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="wizardReminderCheck"
                    checked={newPersonData.contactAllowsReminders}
                    onChange={(e) => setNewPersonData(prev => ({ ...prev, contactAllowsReminders: e.target.checked }))}
                    className="w-4 h-4 text-[#0E2A47]"
                  />
                  <label htmlFor="wizardReminderCheck" className="text-slate-700 font-semibold">
                    Autoriza expresamente mensajes y recordatorios de pago (R9)
                  </label>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <button type="button" onClick={() => setWizardStep(2)} className="px-3 py-2 border rounded-lg">&larr; Anterior</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newPersonId = `p-${Date.now()}`;
                      const folio = `EXP-2026-${String(appState.persons.length + 1).padStart(3, '0')}`;

                      const pRecord: Person = {
                        id: newPersonId,
                        organizationId: 'org1',
                        centerId: currentCenterId,
                        folio,
                        fullName: newPersonData.fullName,
                        birthDate: newPersonData.birthDate,
                        phone: newPersonData.phone || '33-0000-0000',
                        street: newPersonData.street || 'Domicilio Conocido',
                        extNum: newPersonData.extNum || 'S/N',
                        neighborhood: newPersonData.neighborhood || 'Centro',
                        postalCode: newPersonData.postalCode || '44100',
                        city: newPersonData.city,
                        state: newPersonData.state,
                        createdAt: new Date().toISOString(),
                      };

                      const epRecord: Episode = {
                        id: `ep-${Date.now()}`,
                        personId: newPersonId,
                        organizationId: 'org1',
                        centerId: currentCenterId,
                        status: 'Admitido',
                        admittedAt: new Date().toISOString().split('T')[0],
                        responsibleStaff: currentUser.name,
                        consentPersonSigned: true,
                        legalRepresentationSigned: false,
                        privacyNoticeSigned: true,
                        economicAgreementSigned: true,
                        createdAt: new Date().toISOString(),
                      };

                      const contactRecord: Contact = {
                        id: `cnt-${Date.now()}`,
                        personId: newPersonId,
                        name: newPersonData.contactName || 'Familiar Registrado',
                        phone: newPersonData.contactPhone || '3300000000',
                        relationship: newPersonData.contactRelationship,
                        roles: ['contacto', 'emergencia', 'pago'],
                        authorizedChannels: ['whatsapp', 'llamada'],
                        allowsReminders: newPersonData.contactAllowsReminders,
                        contactRestricted: false,
                      };

                      setAppState(prev => ({
                        ...prev,
                        persons: [pRecord, ...prev.persons],
                        episodes: [epRecord, ...prev.episodes],
                        contacts: [contactRecord, ...prev.contacts],
                      }));

                      setSelectedPersonId(newPersonId);
                      logAudit('ALTA_PERSONA_WIZARD', 'persons', `Ingreso completado para ${newPersonData.fullName} con folio ${folio}.`);
                      showToast(`Expediente creado exitosamente: ${folio}`);
                      setShowNewPersonWizard(false);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow"
                  >
                    Guardar y Crear Expediente
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: REGISTRAR PAGO INMUTABLE (R6)                  */}
      {/* ==================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Registrar Pago en Caja (Inmutable R6)</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const chargeId = (form.elements.namedItem('chargeId') as HTMLSelectElement).value;
              const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
              const method = (form.elements.namedItem('method') as HTMLSelectElement).value as any;
              const notes = (form.elements.namedItem('notes') as HTMLInputElement).value;
              handleRegisterPayment(chargeId, amount, method, notes);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Cargo a Liquidar o Abonar</label>
                <select name="chargeId" className="w-full border p-2 rounded-lg">
                  {appState.charges.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.concept} - ${ch.amount.toLocaleString('es-MX')} MXN</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Monto del Pago ($ MXN)</label>
                <input name="amount" type="number" required min="1" step="0.5" defaultValue="3000" className="w-full border p-2 rounded-lg text-base font-bold" />
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Método de Cobro</label>
                <select name="method" className="w-full border p-2 rounded-lg">
                  <option value="Efectivo">Efectivo en Caja</option>
                  <option value="Transferencia">Transferencia SPEI</option>
                  <option value="Tarjeta">Tarjeta Débito / Crédito</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Referencia o Folio Externo</label>
                <input name="notes" placeholder="Ej. SPEI BBVA #3381" className="w-full border p-2 rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: AJUSTE CONTABLE AUDITADO (R6)                  */}
      {/* ==================================================== */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Ajuste Contable Auditado (R6)</h3>
            <p className="text-[11px] text-slate-500">
              Los pagos registrados nunca se eliminan. Aplica un ajuste delta negativo para cancelaciones o descuentos autorizados.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const delta = Number((form.elements.namedItem('delta') as HTMLInputElement).value);
              const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;
              handleRegisterAdjustment('pay2', delta, reason);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Monto Delta ($ MXN, ej. -500)</label>
                <input name="delta" type="number" required defaultValue="-500" className="w-full border p-2 rounded-lg font-mono font-bold" />
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Motivo Justificado del Ajuste</label>
                <input name="reason" required placeholder="Ej. Descuento autorizado por Dirección General" className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-[#0E2A47] text-white rounded-lg font-bold">Aplicar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: REGISTRAR GASTO DE SEDE                       */}
      {/* ==================================================== */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Registrar Gasto de Sede</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const category = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
              const concept = (form.elements.namedItem('concept') as HTMLInputElement).value;
              const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
              const vendor = (form.elements.namedItem('vendor') as HTMLInputElement).value;

              const newExp: Expense = {
                id: `exp-${Date.now()}`,
                centerId: currentCenterId,
                category,
                concept,
                amount,
                spentAt: new Date().toISOString().split('T')[0],
                vendor,
                registeredBy: currentUser.name,
              };

              setAppState(prev => ({
                ...prev,
                expenses: [newExp, ...prev.expenses]
              }));

              logAudit('GASTO_REGISTRADO', 'expenses', `Gasto de $${amount} MXN registrado en ${category}`);
              showToast('Gasto operativo registrado.');
              setShowExpenseModal(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Categoría de Gasto</label>
                <select name="category" className="w-full border p-2 rounded-lg">
                  <option value="alimentacion">Alimentación y Abarrotes</option>
                  <option value="medicamentos">Medicamentos y Material de Curación</option>
                  <option value="servicios">Servicios (Luz, Agua, Gas, Internet)</option>
                  <option value="mantenimiento">Mantenimiento de Instalaciones</option>
                  <option value="nomina">Nómina y Honorarios</option>
                  <option value="transporte">Transporte y Gasolina</option>
                  <option value="insumos">Insumos y Aseo</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Concepto Detallado</label>
                <input name="concept" required placeholder="Ej. Compra de frutas y verduras frescas" className="w-full border p-2 rounded-lg" />
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Monto ($ MXN)</label>
                <input name="amount" type="number" required min="1" step="0.5" placeholder="1500" className="w-full border p-2 rounded-lg font-bold" />
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Proveedor / Establecimiento</label>
                <input name="vendor" required placeholder="Ej. Central de Abastos" className="w-full border p-2 rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-[#0E2A47] text-white rounded-lg font-bold">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ASIGNAR TAREA                                 */}
      {/* ==================================================== */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Asignar Tarea Operativa</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const title = (form.elements.namedItem('title') as HTMLInputElement).value;
              const dept = (form.elements.namedItem('dept') as HTMLInputElement).value;
              const assigneeRole = (form.elements.namedItem('role') as HTMLSelectElement).value as Role;
              const due = (form.elements.namedItem('due') as HTMLInputElement).value;

              const newTask: Task = {
                id: `t-${Date.now()}`,
                centerId: currentCenterId,
                title,
                department: dept,
                assigneeRole,
                assigneeName: `${assigneeRole} Sede`,
                dueDate: due,
                status: 'pendiente',
                priority: 'media',
                evidenceRequired: true,
              };

              setAppState(prev => ({
                ...prev,
                tasks: [newTask, ...prev.tasks]
              }));

              logAudit('TAREA_CREADA', 'tasks', `Tarea "${title}" asignada a ${assigneeRole}`);
              showToast('Tarea asignada exitosamente.');
              setShowTaskModal(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Título de la Tarea</label>
                <input name="title" required placeholder="Ej. Pase de lista nocturno" className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Departamento</label>
                <input name="dept" required defaultValue="Operaciones" className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Rol Asignado</label>
                <select name="role" className="w-full border p-2 rounded-lg">
                  <option value="Operativo">Personal Operativo</option>
                  <option value="Enfermeria">Enfermería</option>
                  <option value="Psicologia">Psicología</option>
                  <option value="Consejeria">Consejería</option>
                  <option value="TrabajoSocial">Trabajo Social</option>
                  <option value="Administracion">Administración</option>
                </select>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Fecha Límite</label>
                <input name="due" type="date" required defaultValue="2026-03-20" className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-[#0E2A47] text-white rounded-lg font-bold">Asignar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: REPORTAR INCIDENCIA                           */}
      {/* ==================================================== */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Reportar Incidencia en Sede</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const cat = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
              const sev = (form.elements.namedItem('severity') as HTMLSelectElement).value as any;
              const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;

              const inc: Incident = {
                id: `inc-${Date.now()}`,
                centerId: currentCenterId,
                category: cat,
                severity: sev,
                description: desc,
                reportedBy: currentUser.name,
                reportedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                status: 'abierto',
              };

              setAppState(prev => ({
                ...prev,
                incidents: [inc, ...prev.incidents]
              }));

              logAudit('INCIDENCIA_REPORTADA', 'incidents', `Incidencia de ${cat} reportada con severidad ${sev}`);
              showToast('Incidencia registrada.');
              setShowIncidentModal(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Categoría</label>
                <select name="category" className="w-full border p-2 rounded-lg">
                  <option value="falla_instalaciones">Falla de Instalaciones</option>
                  <option value="salud">Salud / Médica</option>
                  <option value="conflicto">Conflicto de Convivencia</option>
                  <option value="seguridad">Seguridad Perimetral</option>
                  <option value="medicamentos">Medicamentos</option>
                </select>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Severidad</label>
                <select name="severity" className="w-full border p-2 rounded-lg">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Descripción de los Hechos</label>
                <textarea name="desc" rows={3} required placeholder="Describa objetivamente lo ocurrido..." className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowIncidentModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-bold">Reportar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CANAL PROTEGIDO DE QUEJAS                     */}
      {/* ==================================================== */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Registrar Queja / Sugerencia de Derechos</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const cat = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
              const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;
              const accused = (form.elements.namedItem('accused') as HTMLInputElement).value;

              const cmp: Complaint = {
                id: `cmp-${Date.now()}`,
                centerId: currentCenterId,
                folio: `Q-2026-${String(appState.complaints.length + 1).padStart(3, '0')}`,
                category: cat,
                description: desc,
                accusedUserName: accused ? accused : undefined,
                status: 'recibida',
                submittedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
              };

              setAppState(prev => ({
                ...prev,
                complaints: [cmp, ...prev.complaints]
              }));

              logAudit('QUEJA_REGISTRADA', 'complaints', `Queja ${cmp.folio} registrada en canal protegido.`);
              showToast(`Queja ${cmp.folio} recibida de forma confidencial.`);
              setShowComplaintModal(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Categoría</label>
                <select name="category" className="w-full border p-2 rounded-lg">
                  <option value="trato_digno">Trato Digno y Respetuoso</option>
                  <option value="alimentacion">Alimentación y Nutrición</option>
                  <option value="comunicacion">Acceso a Comunicación Familiar</option>
                  <option value="instalaciones">Higiene e Instalaciones</option>
                  <option value="derechos_humanos">Derechos Humanos</option>
                </select>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Personal Señalado (Opcional)</label>
                <input name="accused" placeholder="Ej. Guardia Javier Luna (si aplica)" className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Descripción</label>
                <textarea name="desc" rows={3} required placeholder="Describa su inquietud o queja..." className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowComplaintModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-700 text-white rounded-lg font-bold">Presentar Queja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CONFIRMACIÓN HUMANA DE ENVÍO DE WHATSAPP (R11)*/}
      {/* ==================================================== */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Confirmación Humana de Envío (R11)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El enlace de WhatsApp fue generado en una nueva ventana. Por principio de integridad (Regla R11), el mensaje <strong>no se registrará como enviado</strong> hasta que confirmes que realmente se despachó al familiar.
            </p>
            <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
              <div>Destinatario: <strong>{showConfirmSendModal.contactName}</strong></div>
              <div>Teléfono: {showConfirmSendModal.phone}</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowConfirmSendModal(null)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                No se envió
              </button>
              <button 
                type="button" 
                onClick={() => handleConfirmSent(showConfirmSendModal)}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow"
              >
                Sí, Mensaje Enviado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CANVAS DIGITAL SIGNATURE PAD (R5)             */}
      {/* ==================================================== */}
      {showSignaturePad && signatureTargetDoc && activePerson && (
        <SignaturePad 
          signerName={activePerson.fullName}
          signerRole="Persona Atendida (Propio)"
          onCancel={() => {
            setShowSignaturePad(false);
            setSignatureTargetDoc(null);
          }}
          onSave={(dataUrl) => {
            const finalizedDoc: DocumentRecord = {
              ...signatureTargetDoc,
              status: 'firmado',
              signatureData: dataUrl,
              signedBy: activePerson.fullName,
              signedRole: 'Persona Atendida (Propio)',
              signedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            };

            setAppState(prev => ({
              ...prev,
              documents: [finalizedDoc, ...prev.documents]
            }));

            logAudit('DOCUMENTO_FIRMADO', 'documents', `Documento "${finalizedDoc.title}" firmado y custodiado (v${finalizedDoc.version})`);
            showToast('Documento firmado y sellado inmutablemente.');
            setShowSignaturePad(false);
            setSignatureTargetDoc(null);
          }}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL: RESUMEN EJECUTIVO PARA EXPORTAR A PDF (R2)     */}
      {/* ==================================================== */}
      {showExecutiveSummaryModal && activePerson && (
        <ExecutiveSummaryModal
          person={activePerson}
          episodes={appState.episodes.filter(e => e.personId === activePerson.id)}
          contacts={appState.contacts.filter(c => c.personId === activePerson.id)}
          center={activeCenter}
          charges={appState.charges}
          payments={appState.payments}
          adjustments={appState.adjustments}
          onClose={() => setShowExecutiveSummaryModal(false)}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL: COMPROBANTE DE PAGO DIGITAL & WHATSAPP (R6)   */}
      {/* ==================================================== */}
      {selectedPaymentForReceipt && (() => {
        const pay = selectedPaymentForReceipt.payment;
        const ch = selectedPaymentForReceipt.charge;
        const ep = appState.episodes.find(e => e.id === ch.episodeId);
        const person = appState.persons.find(p => p.id === ep?.personId) || activePerson || appState.persons[0];
        const contacts = appState.contacts.filter(c => c.personId === person.id);

        return (
          <PaymentReceiptModal
            payment={pay}
            charge={ch}
            person={person}
            center={activeCenter}
            contacts={contacts}
            onClose={() => setSelectedPaymentForReceipt(null)}
            onSendWhatsApp={(contact, msgText) => {
              const newMsg: MessageRecord = {
                id: `msg-${Date.now()}`,
                centerId: currentCenterId,
                personId: person.id,
                contactId: contact.id,
                contactName: contact.name,
                phone: contact.phone,
                channel: 'whatsapp',
                purpose: 'recordatorio_pago',
                body: msgText,
                status: 'preparado',
                preparedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
              };

              setAppState(prev => ({
                ...prev,
                messages: [newMsg, ...prev.messages],
              }));

              const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
              const encoded = encodeURIComponent(msgText);
              window.open(`https://wa.me/52${cleanPhone}?text=${encoded}`, '_blank');
              setSelectedPaymentForReceipt(null);
              setShowConfirmSendModal(newMsg);
            }}
          />
        );
      })()}

      {/* ==================================================== */}
      {/* MODAL: REPORTE PDF CONSOLIDADO DE SEDE (JSPDF)       */}
      {/* ==================================================== */}
      {showCenterReportModal && (
        <CenterConsolidatedReportModal
          center={activeCenter}
          persons={appState.persons.filter(p => p.centerId === currentCenterId)}
          episodes={appState.episodes.filter(e => e.centerId === currentCenterId)}
          charges={appState.charges}
          payments={appState.payments}
          adjustments={appState.adjustments}
          expenses={appState.expenses}
          incidents={appState.incidents}
          tasks={appState.tasks}
          onClose={() => setShowCenterReportModal(false)}
        />
      )}

      {/* PIE DE PÁGINA */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        &copy; 2026 Guerreros de la Luz A.C. &middot; Sistema de Operación Multi-Sede &middot; Jalisco, México
      </footer>

    </div>
  );
}
