/**
 * Guerreros de la Luz A.C. / CentroVida
 * Contratos de datos y tipos TypeScript para gestión integral
 */

export type Role = 
  | 'Direccion' 
  | 'Administracion' 
  | 'Enfermeria' 
  | 'Psicologia' 
  | 'Consejeria' 
  | 'TrabajoSocial' 
  | 'Operativo';

export interface Organization {
  id: string;
  name: string;
  rfc?: string;
  status: 'activa' | 'inactiva';
  createdAt: string;
}

export interface Center {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string;
  capacity: number;
  phone: string;
  status: 'activo' | 'inactivo';
}

export interface Department {
  id: string;
  centerId: string;
  name: string;
}

export interface User {
  id: string;
  organizationId: string;
  centerId: string;
  departmentId?: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  mfaEnabled: boolean;
}

export type EpisodeStatus = 
  | 'Preingreso' 
  | 'En evaluacion' 
  | 'Admitido' 
  | 'En atencion' 
  | 'Egresado' 
  | 'En seguimiento'
  | 'Referido';

export interface Person {
  id: string;
  organizationId: string;
  centerId: string;
  folio: string;
  fullName: string;
  birthDate: string;
  phone: string;
  street: string;
  extNum: string;
  intNum?: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  possibleDuplicateOf?: string;
  createdAt: string;
}

export interface Episode {
  id: string;
  personId: string;
  organizationId: string;
  centerId: string;
  status: EpisodeStatus;
  admittedAt: string;
  dischargedAt?: string;
  dischargeReason?: string;
  continuityPlan?: string;
  responsibleStaff: string;
  consentPersonSigned: boolean;       // R8: Consentimiento propio
  legalRepresentationSigned: boolean;  // R8: Distinto del personal
  privacyNoticeSigned: boolean;
  economicAgreementSigned: boolean;
  createdAt: string;
}

export interface EpisodeStatusHistory {
  id: string;
  episodeId: string;
  fromStatus: EpisodeStatus;
  toStatus: EpisodeStatus;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export type ContactRoleType = 'contacto' | 'emergencia' | 'pago' | 'info_autorizado' | 'rep_legal';

export interface Contact {
  id: string;
  personId: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  roles: ContactRoleType[]; // R7: Roles disociados
  authorizedChannels: ('whatsapp' | 'llamada' | 'presencial' | 'email')[];
  allowsReminders: boolean; // R9: Autorización explícita para cobranza
  contactRestricted: boolean; // Restricción de acercamiento
  restrictionReason?: string;
}

export interface PaymentAgreement {
  id: string;
  episodeId: string;
  enrollmentFee: number;
  monthlyFee: number;
  installments: number;
  dueDay: number;
  scholarshipPercentage: number;
  notes: string;
}

export interface Charge {
  id: string;
  episodeId: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'pendiente' | 'pagado' | 'parcial' | 'vencido';
}

export interface Payment {
  id: string;
  chargeId: string;
  amount: number;
  paidAt: string;
  method: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  receiptFolio: string;
  registeredBy: string;
  notes?: string;
}

export interface PaymentAdjustment {
  id: string;
  paymentId: string;
  amountDelta: number; // Negativo para cancelaciones/descuentos
  reason: string;      // R6: Justificación auditada obligatoria
  registeredBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  centerId: string;
  category: 'alimentacion' | 'medicamentos' | 'transporte' | 'mantenimiento' | 'servicios' | 'nomina' | 'insumos' | 'otro';
  concept: string;
  amount: number;
  spentAt: string;
  vendor: string;
  registeredBy: string;
  receiptNumber?: string;
}

export interface Task {
  id: string;
  centerId: string;
  title: string;
  description?: string;
  department: string;
  assigneeRole: Role;
  assigneeName?: string;
  dueDate: string;
  status: 'pendiente' | 'en_proceso' | 'completada' | 'vencida';
  priority: 'alta' | 'media' | 'baja';
  personId?: string;
  evidenceRequired: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface LogEntry {
  id: string;
  centerId: string;
  personId?: string;
  department: 'Medica' | 'Psicologia' | 'Consejeria' | 'Operativa' | 'TrabajoSocial';
  author: string;
  authorRole: Role;
  summary: string;
  body: string;
  isConfidentialClinical: boolean; // R4: existencia != contenido
  createdAt: string;
  version: number;
  supersedesId?: string;
  correctionReason?: string;
}

export interface Incident {
  id: string;
  centerId: string;
  category: 'salud' | 'conflicto' | 'accidente' | 'falla_instalaciones' | 'seguridad' | 'medicamentos';
  severity: 'baja' | 'media' | 'alta' | 'critica';
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'abierto' | 'en_seguimiento' | 'cerrado';
  resolutionNotes?: string;
  closedBy?: string;
  closedAt?: string;
}

export interface Complaint {
  id: string;
  centerId: string;
  folio: string;
  description: string;
  category: 'trato_digno' | 'alimentacion' | 'comunicacion' | 'instalaciones' | 'derechos_humanos';
  accusedUserName?: string;
  status: 'recibida' | 'en_investigacion' | 'resuelta';
  submittedAt: string;
  reviewerName?: string;
  resolution?: string;
}

export interface DocumentTemplate {
  id: string;
  kind: 'consentimiento' | 'contrato' | 'privacidad' | 'egreso' | 'recibo';
  name: string;
  body: string;
  version: number;
}

export interface DocumentRecord {
  id: string;
  episodeId: string;
  templateId: string;
  title: string;
  content: string;
  version: number;
  status: 'borrador' | 'firmado';
  signatureData?: string;
  signedBy?: string;
  signedRole?: string;
  signedAt?: string;
  supersedesId?: string;
  changeReason?: string;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  centerId: string;
  personId: string;
  contactId: string;
  contactName: string;
  phone: string;
  channel: 'whatsapp' | 'sms' | 'llamada';
  purpose: 'recordatorio_pago' | 'aviso_visita' | 'seguimiento_general';
  body: string;
  status: 'preparado' | 'enviado_confirmado' | 'fallido'; // R11: nunca enviado sin confirmación
  preparedAt: string;
  confirmedSentBy?: string;
  confirmedSentAt?: string;
}

export interface Visit {
  id: string;
  centerId: string;
  episodeId: string;
  personName: string;
  contactName: string;
  scheduledAt: string;
  status: 'programada' | 'realizada' | 'cancelada';
  authorized: boolean;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  centerId: string;
  actor: string;
  role: Role;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}
