import {
  Role,
  User,
  Center,
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
  DocumentTemplate,
  DocumentRecord,
  MessageRecord,
  Visit,
  AuditEvent,
} from '../types';

// ==========================================
// 1. DATOS SEMILLA FICTICIOS INICIALES
// ==========================================

export const INITIAL_CENTERS: Center[] = [
  {
    id: 'c1',
    organizationId: 'org1',
    name: 'Sede Principal (Matriz)',
    code: 'GDL-01',
    address: 'Calz. Independencia #450, Col. Centro, Guadalajara, Jal.',
    capacity: 45,
    phone: '33-3614-2200',
    status: 'activo',
  },
  {
    id: 'c2',
    organizationId: 'org1',
    name: 'Sede Enlace (Sur)',
    code: 'GDL-02',
    address: 'Av. Las Torres #120, Col. San Sebastian, Tlaquepaque, Jal.',
    capacity: 25,
    phone: '33-3689-5500',
    status: 'activo',
  },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', organizationId: 'org1', centerId: 'c1', name: 'Lic. Martha Rosales', email: 'direccion@guerreros.org', role: 'Direccion', active: true, mfaEnabled: true },
  { id: 'u2', organizationId: 'org1', centerId: 'c1', name: 'C.P. Jorge Beltrán', email: 'finanzas@guerreros.org', role: 'Administracion', active: true, mfaEnabled: true },
  { id: 'u3', organizationId: 'org1', centerId: 'c1', name: 'Dra. Elena Vargas', email: 'enfermeria@guerreros.org', role: 'Enfermeria', active: true, mfaEnabled: false },
  { id: 'u4', organizationId: 'org1', centerId: 'c1', name: 'Mtro. Andrés Vega', email: 'psicologia@guerreros.org', role: 'Psicologia', active: true, mfaEnabled: true },
  { id: 'u5', organizationId: 'org1', centerId: 'c1', name: 'Padrino Roberto S.', email: 'consejeria@guerreros.org', role: 'Consejeria', active: true, mfaEnabled: false },
  { id: 'u6', organizationId: 'org1', centerId: 'c1', name: 'Lic. Karla Montes', email: 'trabajosocial@guerreros.org', role: 'TrabajoSocial', active: true, mfaEnabled: false },
  { id: 'u7', organizationId: 'org1', centerId: 'c1', name: 'Guardia Javier Luna', email: 'operativo@guerreros.org', role: 'Operativo', active: true, mfaEnabled: false },
  // Usuario en Sede 2 para comprobar aislamiento
  { id: 'u8', organizationId: 'org1', centerId: 'c2', name: 'Lic. Laura Méndez', email: 'sede2@guerreros.org', role: 'Direccion', active: true, mfaEnabled: true },
  { id: 'u9', organizationId: 'org1', centerId: 'c2', name: 'Lic. Daniel Torres', email: 'finanzas2@guerreros.org', role: 'Administracion', active: true, mfaEnabled: true },
];

export const INITIAL_PERSONS: Person[] = [
  {
    id: 'p1',
    organizationId: 'org1',
    centerId: 'c1',
    folio: 'EXP-2026-001',
    fullName: 'Carlos Mendoza Ramos',
    birthDate: '1992-05-14',
    phone: '33-1245-8965',
    street: 'Av. Juárez',
    extNum: '854',
    intNum: 'A',
    neighborhood: 'Centro',
    postalCode: '44100',
    city: 'Guadalajara',
    state: 'Jalisco',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'p2',
    organizationId: 'org1',
    centerId: 'c1',
    folio: 'EXP-2026-002',
    fullName: 'Mariana Solís Ruiz',
    birthDate: '1988-11-20',
    phone: '33-9874-5123',
    street: 'Privada Los Fresnos',
    extNum: '12',
    neighborhood: 'Miravalle',
    postalCode: '44990',
    city: 'Guadalajara',
    state: 'Jalisco',
    createdAt: '2026-02-01T11:30:00Z',
  },
  {
    id: 'p3',
    organizationId: 'org1',
    centerId: 'c2', // En Sede Enlace
    folio: 'ENL-2026-001',
    fullName: 'Héctor Fernando Castro',
    birthDate: '1995-03-30',
    phone: '33-5566-7788',
    street: 'Camino Real',
    extNum: '104',
    neighborhood: 'Las Pintas',
    postalCode: '45690',
    city: 'El Salto',
    state: 'Jalisco',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'p4',
    organizationId: 'org1',
    centerId: 'c1',
    folio: 'EXP-2026-003',
    fullName: 'Gabriel Ortiz Villalobos',
    birthDate: '1982-08-15',
    phone: '33-4122-7711',
    street: 'Calle Francisco I. Madero',
    extNum: '332',
    neighborhood: 'Santa Tere',
    postalCode: '44600',
    city: 'Guadalajara',
    state: 'Jalisco',
    createdAt: '2026-02-15T14:00:00Z',
  },
  {
    id: 'p5',
    organizationId: 'org1',
    centerId: 'c1',
    folio: 'EXP-2026-004',
    fullName: 'Sofía Navarro Elizondo',
    birthDate: '1997-01-22',
    phone: '33-8899-0011',
    street: 'C. López Cotilla',
    extNum: '1540',
    neighborhood: 'Americana',
    postalCode: '44160',
    city: 'Guadalajara',
    state: 'Jalisco',
    createdAt: '2026-02-28T09:40:00Z',
  }
];

export const INITIAL_EPISODES: Episode[] = [
  {
    id: 'ep1',
    personId: 'p1',
    organizationId: 'org1',
    centerId: 'c1',
    status: 'En atencion',
    admittedAt: '2026-01-10',
    responsibleStaff: 'Mtro. Andrés Vega',
    consentPersonSigned: true,
    legalRepresentationSigned: false,
    privacyNoticeSigned: true,
    economicAgreementSigned: true,
    createdAt: '2026-01-10T09:30:00Z',
  },
  {
    id: 'ep2',
    personId: 'p2',
    organizationId: 'org1',
    centerId: 'c1',
    status: 'Admitido',
    admittedAt: '2026-02-01',
    responsibleStaff: 'Lic. Karla Montes',
    consentPersonSigned: true,
    legalRepresentationSigned: true,
    privacyNoticeSigned: true,
    economicAgreementSigned: true,
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'ep3',
    personId: 'p3',
    organizationId: 'org1',
    centerId: 'c2',
    status: 'En atencion',
    admittedAt: '2026-03-01',
    responsibleStaff: 'Lic. Laura Méndez',
    consentPersonSigned: true,
    legalRepresentationSigned: false,
    privacyNoticeSigned: true,
    economicAgreementSigned: true,
    createdAt: '2026-03-01T10:30:00Z',
  },
  {
    id: 'ep4',
    personId: 'p4',
    organizationId: 'org1',
    centerId: 'c1',
    status: 'Egresado',
    admittedAt: '2025-11-01',
    dischargedAt: '2026-02-10',
    dischargeReason: 'Termino satisfactorio de programa',
    continuityPlan: 'Asistencia quincenal a grupo de apoyo ambulatorio y psicoterapia semanal.',
    responsibleStaff: 'Mtro. Andrés Vega',
    consentPersonSigned: true,
    legalRepresentationSigned: false,
    privacyNoticeSigned: true,
    economicAgreementSigned: true,
    createdAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'ep5',
    personId: 'p5',
    organizationId: 'org1',
    centerId: 'c1',
    status: 'En evaluacion',
    admittedAt: '2026-03-05',
    responsibleStaff: 'Dra. Elena Vargas',
    consentPersonSigned: true,
    legalRepresentationSigned: false,
    privacyNoticeSigned: true,
    economicAgreementSigned: false,
    createdAt: '2026-03-05T16:00:00Z',
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt1',
    personId: 'p1',
    name: 'Beatriz Ramos Lozano',
    phone: '3322114455',
    email: 'b.ramos@gmail.com',
    relationship: 'Madre',
    roles: ['contacto', 'emergencia', 'pago'],
    authorizedChannels: ['whatsapp', 'llamada'],
    allowsReminders: true,
    contactRestricted: false,
  },
  {
    id: 'cnt2',
    personId: 'p1',
    name: 'Roberto Mendoza (Hermano)',
    phone: '3344556677',
    relationship: 'Hermano',
    roles: ['contacto'],
    authorizedChannels: ['llamada'],
    allowsReminders: false, // R9: NO autorizado a mensajes de recordatorio de pago
    contactRestricted: false,
  },
  {
    id: 'cnt3',
    personId: 'p2',
    name: 'Carlos Solís (Padre y Rep. Legal)',
    phone: '3399887766',
    email: 'carlos.solis@yahoo.com',
    relationship: 'Padre',
    roles: ['contacto', 'emergencia', 'pago', 'rep_legal', 'info_autorizado'],
    authorizedChannels: ['whatsapp', 'llamada', 'presencial'],
    allowsReminders: true,
    contactRestricted: false,
  },
  {
    id: 'cnt4',
    personId: 'p2',
    name: 'Esteban G. (Ex-pareja)',
    phone: '3311223344',
    relationship: 'Ex-pareja',
    roles: [],
    authorizedChannels: [],
    allowsReminders: false,
    contactRestricted: true, // Restricción de contacto activa
    restrictionReason: 'Orden de protección y restricción expresa de la persona atendida.',
  }
];

export const INITIAL_CHARGES: Charge[] = [
  { id: 'ch1', episodeId: 'ep1', concept: 'Inscripción y Valoración Médica Inicial', amount: 3500, dueDate: '2026-01-15', status: 'pagado' },
  { id: 'ch2', episodeId: 'ep1', concept: 'Mensualidad Enero 2026 (Atención Integral)', amount: 8000, dueDate: '2026-01-30', status: 'parcial' },
  { id: 'ch3', episodeId: 'ep1', concept: 'Mensualidad Febrero 2026 (Atención Integral)', amount: 8000, dueDate: '2026-02-28', status: 'vencido' },
  { id: 'ch4', episodeId: 'ep1', concept: 'Mensualidad Marzo 2026 (Atención Integral)', amount: 8000, dueDate: '2026-03-30', status: 'pendiente' },
  { id: 'ch5', episodeId: 'ep2', concept: 'Inscripción y Cuota Febrero 2026', amount: 9500, dueDate: '2026-02-05', status: 'pagado' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'pay1', chargeId: 'ch1', amount: 3500, paidAt: '2026-01-12', method: 'Transferencia', receiptFolio: 'REC-091', registeredBy: 'C.P. Jorge Beltrán', notes: 'SPEI BBVA 4920' },
  { id: 'pay2', chargeId: 'ch2', amount: 5000, paidAt: '2026-01-28', method: 'Efectivo', receiptFolio: 'REC-115', registeredBy: 'C.P. Jorge Beltrán', notes: 'Abono parcial en caja' },
  { id: 'pay3', chargeId: 'ch5', amount: 9500, paidAt: '2026-02-04', method: 'Transferencia', receiptFolio: 'REC-120', registeredBy: 'C.P. Jorge Beltrán', notes: 'Comprobante Santander verificado' },
];

export const INITIAL_ADJUSTMENTS: PaymentAdjustment[] = [
  {
    id: 'adj1',
    paymentId: 'pay2',
    amountDelta: -500,
    reason: 'Descuento de apoyo solidario autorizado por Dirección por puntualidad familiar',
    registeredBy: 'Lic. Martha Rosales',
    createdAt: '2026-01-29T11:00:00Z',
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp1', centerId: 'c1', category: 'alimentacion', concept: 'Suministro semanal de abarrotes y verduras frescas', amount: 6420, spentAt: '2026-02-20', vendor: 'Central de Abastos GDL', registeredBy: 'C.P. Jorge Beltrán', receiptNumber: 'FAC-8819' },
  { id: 'exp2', centerId: 'c1', category: 'medicamentos', concept: 'Medicamentos básicos para botiquín y primeros auxilios', amount: 2150, spentAt: '2026-02-22', vendor: 'Farmacias Guadalajara', registeredBy: 'Dra. Elena Vargas', receiptNumber: 'TKT-9912' },
  { id: 'exp3', centerId: 'c1', category: 'servicios', concept: 'Pago mensual de energía eléctrica CFE Sede Principal', amount: 4890, spentAt: '2026-02-25', vendor: 'CFE', registeredBy: 'C.P. Jorge Beltrán', receiptNumber: 'CFE-0021' },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log1',
    centerId: 'c1',
    personId: 'p1',
    department: 'Psicologia',
    author: 'Mtro. Andrés Vega',
    authorRole: 'Psicologia',
    summary: 'Sesión Psicoterapéutica Individual: Identificación de detonantes',
    body: 'El residente refiere antecedentes de consumo asociados a cuadros de aislamiento en fines de semana. Se identifican distorsiones cognitivas de tipo catastrofista. Se acuerda registro de autorregulación emocional y técnicas de respiración diafragmática.',
    isConfidentialClinical: true, // R4: Contenido reservado
    createdAt: '2026-02-15 10:30',
    version: 1,
  },
  {
    id: 'log2',
    centerId: 'c1',
    personId: 'p1',
    department: 'Operativa',
    author: 'Guardia Javier Luna',
    authorRole: 'Operativo',
    summary: 'Pase de lista matutino y acondicionamiento',
    body: 'El residente Carlos Mendoza participó activamente en la rutina matutina de activación física y cumplió con las tareas asignadas de aseo en área común sin eventualidades.',
    isConfidentialClinical: false, // Visible para todos
    createdAt: '2026-02-16 08:00',
    version: 1,
  },
  {
    id: 'log3',
    centerId: 'c1',
    personId: 'p1',
    department: 'Medica',
    author: 'Dra. Elena Vargas',
    authorRole: 'Enfermeria',
    summary: 'Revisión Médica: Signos vitales y deshabituación',
    body: 'T/A 120/80 mmHg, FC 74 lpm, Temp 36.6 °C, SatO2 98%. Sin signos de abstinencia aguda. Continúa con suplementación con complejo B e hidratación oral adecuada.',
    isConfidentialClinical: true, // R4: Contenido reservado
    createdAt: '2026-02-18 09:15',
    version: 1,
  },
  {
    id: 'log4',
    centerId: 'c1',
    personId: 'p2',
    department: 'Consejeria',
    author: 'Padrino Roberto S.',
    authorRole: 'Consejeria',
    summary: 'Sesión de Consejería de 12 Pasos: Primer Paso',
    body: 'Trabajo reflexivo sobre la aceptación de la enfermedad y la pérdida de gobernabilidad. La usuaria muestra apertura receptiva y disposición a la dinámica grupal.',
    isConfidentialClinical: true,
    createdAt: '2026-02-22 17:00',
    version: 1,
  }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', centerId: 'c1', title: 'Aplicación de inventario Beck de Depresión y Ansiedad', department: 'Psicología', assigneeRole: 'Psicologia', assigneeName: 'Mtro. Andrés Vega', dueDate: '2026-03-12', status: 'pendiente', priority: 'alta', personId: 'p1', evidenceRequired: true },
  { id: 't2', centerId: 'c1', title: 'Confirmación y seguimiento de adeudo de mensualidad de febrero', department: 'Administración', assigneeRole: 'Administracion', assigneeName: 'C.P. Jorge Beltrán', dueDate: '2026-02-20', status: 'vencida', priority: 'media', personId: 'p1', evidenceRequired: false },
  { id: 't3', centerId: 'c1', title: 'Toma y registro de signos vitales matutinos', department: 'Enfermería', assigneeRole: 'Enfermeria', assigneeName: 'Dra. Elena Vargas', dueDate: '2026-03-15', status: 'en_proceso', priority: 'alta', personId: 'p2', evidenceRequired: true },
  { id: 't4', centerId: 'c1', title: 'Entrevista socioeconómica domiciliaria a red de apoyo', department: 'Trabajo Social', assigneeRole: 'TrabajoSocial', assigneeName: 'Lic. Karla Montes', dueDate: '2026-03-14', status: 'pendiente', priority: 'media', personId: 'p2', evidenceRequired: true },
  { id: 't5', centerId: 'c1', title: 'Revisión quincenal de extintores y salidas de emergencia', department: 'Operaciones', assigneeRole: 'Operativo', assigneeName: 'Guardia Javier Luna', dueDate: '2026-03-16', status: 'pendiente', priority: 'alta', evidenceRequired: true },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc1',
    centerId: 'c1',
    category: 'falla_instalaciones',
    severity: 'media',
    description: 'Fuga ligera de agua en la llave de paso del lavabo de baño número 2 de dormitorios.',
    reportedBy: 'Guardia Javier Luna',
    reportedAt: '2026-02-26 14:00',
    status: 'cerrado',
    resolutionNotes: 'Se reemplazó el empaque y llave de compresión por personal de mantenimiento.',
    closedBy: 'Lic. Martha Rosales',
    closedAt: '2026-02-27 10:00',
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp1',
    centerId: 'c1',
    folio: 'Q-2026-001',
    category: 'alimentacion',
    description: 'Se solicita mayor variedad en el menú de cena y porciones de fruta fresca de temporada.',
    status: 'en_investigacion',
    submittedAt: '2026-02-24 19:30',
    reviewerName: 'Lic. Martha Rosales', // Dirección revisa
    accusedUserName: undefined, // Queja general de servicio
  }
];

export const INITIAL_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tmpl_consent',
    kind: 'consentimiento',
    name: 'Consentimiento Informado para Tratamiento Residencial',
    body: 'Por medio del presente documento, yo, {{nombre_persona}}, con fecha de nacimiento {{fecha_nacimiento}} y folio {{folio}}, manifiesto mi voluntad libre y consciente de ingresar y participar en el modelo de atención y recuperación en adicciones de GUERREROS DE LA LUZ A.C., Sede {{centro}}. Reconozco haber sido informado/a de las normas de convivencia, derechos humanos y plan de acompañamiento.',
    version: 1,
  },
  {
    id: 'tmpl_privacy',
    kind: 'privacidad',
    name: 'Aviso de Privacidad Integral de Datos Personales Sensibles',
    body: 'GUERREROS DE LA LUZ A.C., con domicilio en {{direccion_centro}}, en cumplimiento a la legislación en materia de protección de datos personales, informa que los datos recabados de {{nombre_persona}} serán resguardados con estricta confidencialidad bajo disociación clínica.',
    version: 1,
  },
  {
    id: 'tmpl_discharge',
    kind: 'egreso',
    name: 'Constancia Institucional de Egreso y Plan de Continuidad',
    body: 'Hacemos constar que con fecha {{fecha_hoy}}, {{nombre_persona}} (Folio: {{folio}}) ha concluido su estancia en {{centro}}. Motivo de egreso registrado: {{motivo_egreso}}. Se entrega plan de continuidad ambulatoria y red de apoyo recomendada.',
    version: 1,
  }
];

export const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc1',
    episodeId: 'ep1',
    templateId: 'tmpl_consent',
    title: 'Consentimiento Informado - Carlos Mendoza',
    content: 'Por medio del presente documento, yo, Carlos Mendoza Ramos, con fecha de nacimiento 1992-05-14 y folio EXP-2026-001, manifiesto mi voluntad libre y consciente de ingresar y participar en el modelo de atención de GUERREROS DE LA LUZ A.C., Sede Sede Principal (Matriz). Reconozco haber sido informado/a de las normas y derechos.',
    version: 1,
    status: 'firmado',
    signedBy: 'Carlos Mendoza Ramos',
    signedRole: 'Persona Atendida (Propio)',
    signedAt: '2026-01-10 10:15',
    createdAt: '2026-01-10T10:00:00Z',
  }
];

export const INITIAL_MESSAGES: MessageRecord[] = [
  {
    id: 'msg1',
    centerId: 'c1',
    personId: 'p1',
    contactId: 'cnt1',
    contactName: 'Beatriz Ramos Lozano',
    phone: '3322114455',
    channel: 'whatsapp',
    purpose: 'recordatorio_pago',
    body: 'Estimada Beatriz Ramos Lozano, le saludamos con respeto de Guerreros de la Luz A.C. Le recordamos amablemente su estado de cuenta para el acompañamiento de Carlos Mendoza.',
    status: 'enviado_confirmado',
    preparedAt: '2026-01-25 10:00',
    confirmedSentBy: 'C.P. Jorge Beltrán',
    confirmedSentAt: '2026-01-25 10:04',
  }
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'vis1',
    centerId: 'c1',
    episodeId: 'ep1',
    personName: 'Carlos Mendoza Ramos',
    contactName: 'Beatriz Ramos Lozano',
    scheduledAt: '2026-03-15 16:00',
    status: 'programada',
    authorized: true,
    notes: 'Visita familiar supervisada en sala de visitas.',
  }
];

export const INITIAL_AUDIT: AuditEvent[] = [
  {
    id: 'aud-001',
    centerId: 'c1',
    actor: 'Sistema / Semilla',
    role: 'Direccion',
    action: 'INICIALIZACION_SISTEMA',
    entity: 'system',
    details: 'Base de datos inicial cargada con aislamiento R1 y contratos de datos para Guerreros de la Luz A.C.',
    timestamp: '2026-01-10 09:00:00',
  }
];

// ==========================================
// 2. MOTOR DE PERMISOS can(user, action, resource)
// ==========================================

export function can(
  user: User, 
  action: 'read' | 'write' | 'read_clinical_content' | 'manage_finances' | 'administer' | 'review_complaint', 
  resource: string,
  extraContext?: { accusedUserName?: string }
): boolean {
  if (!user.active) return false;

  // R4: Contenido reservado de notas clínicas solo para Psicología, Enfermería o Consejería
  if (action === 'read_clinical_content' || resource === 'clinical_body') {
    return ['Psicologia', 'Enfermeria', 'Consejeria'].includes(user.role);
  }

  // R4 & Finanzas: Cobranza, pagos, cargos y gastos solo Dirección y Administración
  if (action === 'manage_finances' || resource === 'finanzas') {
    return ['Direccion', 'Administracion'].includes(user.role);
  }

  // Auditoría global y administración de la sede solo para Dirección
  if (action === 'administer' || resource === 'auditoria') {
    return user.role === 'Direccion';
  }

  // Protección del canal de quejas: una persona señalada NUNCA puede resolver su propia queja
  if (action === 'review_complaint' && extraContext?.accusedUserName) {
    if (user.name.toLowerCase() === extraContext.accusedUserName.toLowerCase()) {
      return false;
    }
    return ['Direccion', 'TrabajoSocial'].includes(user.role);
  }

  // Operativo solo tiene acceso limitado a bitácoras operativas y pases de lista
  if (user.role === 'Operativo') {
    if (['finanzas', 'notas_clinicas', 'auditoria', 'expediente_completo'].includes(resource)) {
      return false;
    }
  }

  return true;
}

// ==========================================
// 3. PERSISTENCIA EN LOCALSTORAGE CON REINICIO
// ==========================================

const STORAGE_KEY = 'guerreros_app_state_v1';

export interface AppState {
  centers: Center[];
  users: User[];
  persons: Person[];
  episodes: Episode[];
  contacts: Contact[];
  charges: Charge[];
  payments: Payment[];
  adjustments: PaymentAdjustment[];
  expenses: Expense[];
  tasks: Task[];
  logs: LogEntry[];
  incidents: Incident[];
  complaints: Complaint[];
  templates: DocumentTemplate[];
  documents: DocumentRecord[];
  messages: MessageRecord[];
  visits: Visit[];
  auditEvents: AuditEvent[];
}

export function getInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.centers && parsed.persons && parsed.episodes) {
        return parsed;
      }
    }
  } catch {
    // Si falla el parse, retorna valores iniciales
  }

  return {
    centers: INITIAL_CENTERS,
    users: INITIAL_USERS,
    persons: INITIAL_PERSONS,
    episodes: INITIAL_EPISODES,
    contacts: INITIAL_CONTACTS,
    charges: INITIAL_CHARGES,
    payments: INITIAL_PAYMENTS,
    adjustments: INITIAL_ADJUSTMENTS,
    expenses: INITIAL_EXPENSES,
    tasks: INITIAL_TASKS,
    logs: INITIAL_LOGS,
    incidents: INITIAL_INCIDENTS,
    complaints: INITIAL_COMPLAINTS,
    templates: INITIAL_TEMPLATES,
    documents: INITIAL_DOCUMENTS,
    messages: INITIAL_MESSAGES,
    visits: INITIAL_VISITS,
    auditEvents: INITIAL_AUDIT,
  };
}

export function saveStateToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error guardando estado local', err);
  }
}

export function resetStateToDefaults(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return {
    centers: INITIAL_CENTERS,
    users: INITIAL_USERS,
    persons: INITIAL_PERSONS,
    episodes: INITIAL_EPISODES,
    contacts: INITIAL_CONTACTS,
    charges: INITIAL_CHARGES,
    payments: INITIAL_PAYMENTS,
    adjustments: INITIAL_ADJUSTMENTS,
    expenses: INITIAL_EXPENSES,
    tasks: INITIAL_TASKS,
    logs: INITIAL_LOGS,
    incidents: INITIAL_INCIDENTS,
    complaints: INITIAL_COMPLAINTS,
    templates: INITIAL_TEMPLATES,
    documents: INITIAL_DOCUMENTS,
    messages: INITIAL_MESSAGES,
    visits: INITIAL_VISITS,
    auditEvents: [
      {
        id: `aud-reset-${Date.now()}`,
        centerId: 'c1',
        actor: 'Operador en Demostración',
        role: 'Direccion',
        action: 'REINICIO_DATOS_DEMO',
        entity: 'system',
        details: 'Se han restablecido los datos muestra a su estado inicial de fábrica.',
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
    ],
  };
}
