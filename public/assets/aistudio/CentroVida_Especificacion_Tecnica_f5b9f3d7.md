# CentroVida: Especificación técnica para producción (MVP)

**Estado:** borrador para validar con usuarios reales, asesoría legal y personal clínico. No constituye certificación de cumplimiento normativo.

**Alcance del MVP:** que un centro administre correctamente ~50 personas atendidas, sus documentos, contactos, pagos y tareas, con seguridad y facilidad. Sin módulos clínicos completos, sin prescripción electrónica, sin WhatsApp automatizado, sin CFDI, sin IA con datos sensibles.

---

## 1. Arquitectura recomendada

| Capa | Decisión |
|---|---|
| Aplicación | PWA, monolito modular |
| Frontend | React + TypeScript + Next.js |
| Backend | API con autorización en servidor (nunca solo en la interfaz) |
| Base de datos | PostgreSQL con Row-Level Security (RLS) por `center_id` |
| Archivos | Almacenamiento privado de objetos, cifrado, URLs temporales firmadas |
| Autenticación | Proveedor de identidad con MFA y gestión de sesiones |
| Jobs | Cola asíncrona con reintentos e historial |
| Auditoría | Tabla append-only, separada y protegida |
| Infraestructura | Servicios administrados, respaldos con pruebas de restauración, gestión de secretos |

Dominios del código: `instituciones`, `identidad_permisos`, `personas`, `admisiones`, `actividades`, `documentos`, `finanzas`, `operaciones`, `comunicaciones`, `reportes`, `auditoria`.

---

## 2. Esquema de base de datos (PostgreSQL)

Convenciones: `id uuid PK`, `created_at`, `created_by`, `updated_at`. Toda tabla de negocio lleva `organization_id` y `center_id` y tiene RLS activa. Sin borrado físico en registros firmados o auditables (`deleted_at` solo donde se indique).

```sql
-- INSTITUCIONES
organizations(id, name, status, created_at)
centers(id, organization_id, name, care_model, address_json, capacity_beds, status)
departments(id, center_id, name)                      -- medicina, enfermería, psicología...

-- IDENTIDAD Y PERMISOS
users(id, email, full_name, status, mfa_enabled, deactivated_at)
memberships(id, user_id, organization_id, center_id, department_id, role, status, valid_from, valid_to)
role_permissions(role, resource, action, scope)       -- scope: 'center' | 'assigned' | 'own' | 'existence_only'

-- PERSONAS Y EPISODIOS
persons(id, organization_id, folio, full_name, birth_date, phone, address_json,
        photo_doc_id, possible_duplicate_of, created_*)
episodes(id, person_id, center_id, status, program_id, admitted_at, discharged_at,
         discharge_reason, continuity_plan, responsible_user_id, created_*)
episode_status_history(id, episode_id, from_status, to_status, changed_by, changed_at, reason)

-- RED DE APOYO Y AUTORIZACIONES
contacts(id, person_id, full_name, phone, email, notes)
contact_roles(id, contact_id, episode_id, role)       -- contacto | emergencia | pago | info_autorizado | rep_legal
contact_restrictions(id, contact_id, person_id, reason, active)
authorizations(id, episode_id, subject_type, subject_id, kind, channel, purpose,
               granted, granted_at, revoked_at, evidence_doc_id)
               -- kind: tratamiento | privacidad | comunicacion | divulgacion | imagen | economico

-- ADMISIÓN
admission_checklists(id, episode_id, item_key, status, completed_by, completed_at, evidence_doc_id)
               -- items independientes: consent_person, legal_representation, privacy_notice, economic_agreement

-- ACTIVIDADES
tasks(id, center_id, department_id, title, description, assignee_id, priority,
      due_at, status, person_id, episode_id, evidence_required, completed_at)
log_entries(id, center_id, department_id, type, author_id, person_id, episode_id,
            body, confidentiality, version, supersedes_id, correction_reason)
incidents(id, center_id, category, severity, description, status, reported_by, closed_by, closed_at)
complaints(id, center_id, description, accused_user_id, status, reviewer_id)
               -- CHECK: reviewer_id <> accused_user_id; accused_user_id nunca puede cerrar/modificar
notifications(id, user_id, kind, ref_type, ref_id, read_at)

-- DOCUMENTOS
document_templates(id, center_id, kind, name, body, version, active)
documents(id, episode_id, template_id, kind, status, current_version_id)
document_versions(id, document_id, version, storage_key, sha256, created_by,
                  created_at, change_reason, supersedes_id)       -- INMUTABLE
signatures(id, document_version_id, signer_name, signer_role, signed_at, evidence_json, method)

-- FINANZAS
payment_agreements(id, episode_id, enrollment_fee, program_cost, frequency,
                   due_day, installments, discount, scholarship, start_date)
charges(id, episode_id, agreement_id, concept, amount, due_date, status)
payments(id, charge_id, amount, method, paid_at, receipt_doc_id, registered_by)  -- INMUTABLE
payment_adjustments(id, payment_id, amount_delta, reason, registered_by, created_at)
expenses(id, center_id, category, amount, spent_at, vendor, receipt_doc_id, registered_by)

-- COMUNICACIÓN
message_templates(id, center_id, purpose, body)
messages(id, center_id, contact_id, person_id, template_id, channel, purpose, body,
         status, confirmed_sent_by, confirmed_sent_at, failure_reason)
         -- status: preparado | enviado_confirmado | fallido ; nunca 'enviado' sin confirmación

visits(id, episode_id, contact_id, scheduled_at, status, confirmed_at)

-- AUDITORÍA (append-only; sin UPDATE ni DELETE concedidos)
audit_events(id, organization_id, center_id, actor_id, action, entity_type, entity_id,
             before_json, after_json, ip, user_agent, created_at)
```

### Restricciones críticas

1. **RLS:** `USING (center_id = ANY(current_user_centers()))` en todas las tablas de negocio.
2. `documents` firmados, `document_versions`, `payments`, `audit_events`: sin `UPDATE`/`DELETE` para el rol de aplicación (triggers que lo impidan).
3. `episodes.discharged_at` se puede registrar con cualquier saldo (sin `CHECK` ni trigger que lo ligue a `charges`).
4. `messages.status = 'enviado_confirmado'` solo si existen `confirmed_sent_by` y `confirmed_sent_at`.
5. `complaints`: restricción de que `reviewer_id <> accused_user_id`.
6. El saldo de un cargo se **calcula** (cargo − pagos ± ajustes); no se almacena como campo editable.
7. Contenido clínico y operativo en tablas/columnas separadas con permisos distintos.

---

## 3. Matriz de permisos

Leyenda: **L** = leer contenido, **E** = escribir, **X** = solo saber que existe/se realizó (sin contenido), **A** = solo asignados, **–** = sin acceso.

| Recurso | Dirección | Administración | Enfermería | Psicología | Consejería | Trabajo social | Operativo |
|---|---|---|---|---|---|---|---|
| Datos generales de persona | L | L/E | L | L | L | L/E | L (limitado) |
| Red de apoyo y autorizaciones | L | L | L | L | L | L/E | – |
| Episodios y admisión | L/E | L/E (administrativo) | L | L | L | L/E | – |
| Notas psicológicas | X | – | – | L/E (A) | – | – | – |
| Bitácora de enfermería / medicamentos | X | – | L/E | – | – | – | – |
| Sesiones y bitácora de consejería | X | – | – | – | L/E (A) | – | – |
| Bitácora operativa | L | L | L/E | L/E | L/E | L/E | L/E |
| Tareas | L/E | L/E (propias y adm.) | propias | propias | propias | propias | propias |
| Incidencias | L/E | L | L/E | L/E | L/E | L/E | L/E |
| Quejas y derechos | L (canal protegido) | – | – | – | – | – | alta de queja |
| Pagos, cargos y estados de cuenta | L | L/E | – | – | – | – | – |
| Gastos | L | L/E | – | – | – | – | – |
| Documentos administrativos | L | L/E | – | – | – | L | – |
| Documentos clínicos | X | – | L/E (A) | L/E (A) | – | – | – |
| Mensajes a familiares | L | L/E | – | – | – | L/E | – |
| Auditoría | L | – | – | – | – | – | – |
| Configuración del centro | L/E | – | – | – | – | – | – |
| Soporte de plataforma | sin acceso clínico por defecto; acceso excepcional temporal, aprobado y auditado | | | | | | |

Reglas adicionales:
- Toda comprobación se hace en el servidor; la interfaz solo oculta.
- Un usuario con membresías en varios centros tiene permisos independientes por centro.
- Dar de baja a un usuario (`memberships.status`, `users.deactivated_at`) invalida sesiones y tokens de inmediato.
- Familiares: solo acceso por portal futuro y únicamente a lo expresamente habilitado en `authorizations`.

---

## 4. Reglas de negocio (traducidas a validaciones de servidor)

| Cód. | Regla | Implementación |
|---|---|---|
| R1 | Aislamiento por centro | RLS + `center_id` en toda consulta |
| R2 | Persona → Episodio | FK `episodes.person_id`; reingreso crea episodio nuevo |
| R3 | Adeudo no bloquea egreso | El endpoint de egreso no consulta `charges` para validar |
| R4 | Existencia ≠ contenido | Scope `existence_only` devuelve metadatos sin `body` |
| R5 | Versionado | `document_versions`/`log_entries` con `supersedes_id`; sin UPDATE |
| R6 | Ajustes de pago | `payments` inmutable; `payment_adjustments` |
| R7 | Familiar ≠ acceso clínico | `contact_roles` separados; info clínica nunca expuesta a contactos |
| R8 | Consentimiento propio | Checklist con ítems independientes; firma de familiar no marca `consent_person` |
| R9 | Mensajes autorizados | Validación contra `authorizations` (canal + finalidad) y lista de bajas |
| R10 | Sin decisiones automáticas | No hay endpoint que admita/egrese sin acción humana |
| R11 | No registrar lo no ejecutado | `messages.status` requiere confirmación humana |

---

## 5. Historias de usuario del MVP (priorizadas)

**Épica A: Centros y accesos**
- A1. Como administrador de plataforma, creo una organización y un centro con su configuración.
- A2. Como directora, invito usuarios, les asigno rol y departamento, y los doy de baja.
- A3. Como usuario, inicio sesión con MFA y mi sesión expira por inactividad.

**Épica B: Personas y episodios**
- B1. Como recepción, registro una solicitud con datos mínimos sin crear expediente clínico.
- B2. Como personal autorizado, doy de alta a una persona con aviso de posible duplicado.
- B3. Como coordinación, avanzo un episodio de estado con confirmación y registro.
- B4. Como administración, completo la lista de admisión con ítems independientes de consentimiento.
- B5. Como personal autorizado, registro un egreso aunque exista adeudo.
- B6. Como personal autorizado, reingreso a una persona conservando su historial.
- B7. Como trabajo social, defino roles de relación y autorizaciones de comunicación de cada contacto.

**Épica C: Finanzas**
- C1. Como administración, configuro un acuerdo económico y se genera el calendario de cargos.
- C2. Como administración, registro pagos parciales y veo el saldo correcto.
- C3. Como administración, corrijo un error mediante un ajuste con motivo.
- C4. Como dirección, veo cobranza vencida y próxima, y ingresos vs. egresos.
- C5. Como administración, registro gastos con comprobante.

**Épica D: Actividades**
- D1. Como responsable, veo mis tareas del día y las vencidas.
- D2. Como personal, registro bitácora; las correcciones crean versión nueva.
- D3. Como dirección, veo cumplimiento sin leer contenido reservado.
- D4. Como persona atendida o personal, presento una queja por un canal protegido.
- D5. Como turno saliente, genero un resumen de cambio de turno.

**Épica E: Documentos y mensajes**
- E1. Como administración, genero un documento autollenado desde una plantilla aprobada.
- E2. Como personal, capturo firma y se conserva evidencia y versión.
- E3. Como personal, adjunto un documento escaneado al episodio.
- E4. Como administración, preparo un mensaje solo si el destinatario está autorizado y lo marco enviado tras confirmarlo.

**Épica F: Plataforma**
- F1. Exportación estructurada y respaldo por centro.
- F2. Importación básica de registros previos (CSV).
- F3. Auditoría consultable por dirección.

---

## 6. Flujos de pantalla (resumen)

1. **Inicio** (por rol) → tareas de hoy, vencidos, atención inmediata.
2. **Personas** → lista → ficha (Datos | Red de apoyo | Episodios | Pagos | Archivos | Historial).
3. **Alta de persona** → pasos de ≤5 campos → verificación de duplicado → guardar.
4. **Episodio** → cambio de estado → admisión (checklist) → plan de pagos → egreso.
5. **Administración** → Cobranza | Pagos | Gastos | Reportes.
6. **Actividades** → Tareas | Bitácora | Incidencias | Turno | Quejas.
7. **Documentos** → Plantillas | Generar | Revisar | Firmar | Archivo.
8. **Más** → Comunicación | Configuración | Auditoría | Exportación.

---

## 7. Pruebas de aceptación (obligatorias antes de piloto)

1. Persona readmitida conserva historial anterior.
2. Administración cobra sin acceder a notas psicológicas.
3. Un centro no puede consultar registros de otro (probado a nivel de base de datos, no solo de API).
4. Documento generado conserva datos y versión.
5. Corrección documental deja evidencia.
6. Pago parcial actualiza el saldo sin alterar otros cargos.
7. No se prepara recordatorio a contacto sin autorización o con baja.
8. Falla de mensajería no registra envío exitoso.
9. Tarea vencida permanece visible con su responsable.
10. Baja de usuario revoca permisos y sesiones activas.
11. Egreso se documenta independientemente de adeudos.
12. Respaldo se restaura en prueba real.
13. Registros críticos conservan fecha, hora y autor.
14. Exportación contiene solo datos autorizados para el rol.
15. Procesos esenciales se completan desde un teléfono.
16. Una queja no puede ser cerrada por la persona señalada.
17. Ningún endpoint depende solo de ocultar botones (pruebas de autorización con tokens de cada rol).

---

## 8. Seguridad mínima del MVP

- Cifrado en tránsito (TLS) y en reposo (BD y archivos).
- MFA obligatorio para dirección, administración y cualquier rol con acceso a datos sensibles.
- Sesiones con expiración y revocación.
- Archivos solo mediante URLs temporales firmadas.
- Auditoría append-only; los logs técnicos no almacenan contenido clínico.
- Respaldos automáticos y prueba de restauración periódica.
- Pruebas de vulnerabilidades antes del piloto.
- Plan de respuesta a incidentes y contratos de tratamiento de datos con proveedores.

---

## 9. Pendientes que requieren especialistas (no resolver con código)

- **Legal:** aviso de privacidad (LFPDPPP), bases legales, validez de firmas por tipo de documento, consentimiento informado y representación (Ley General de Salud, art. 75 Bis), plazos de conservación.
- **Normativo:** aplicabilidad de NOM-004, NOM-024 y NOM-028-SSA2 según los servicios de cada centro; verificar vigencia actual.
- **Clínico:** diseño y validación de módulos de medicina, enfermería y medicamentos antes de incluirlos.
- **Usuarios reales:** validar flujos con directores, administrativos, consejeros y enfermería de al menos 3 centros distintos.

---

## 10. Ruta sugerida

1. Prototipo en AI Studio con datos ficticios (archivo de prompts).
2. Validación del prototipo con 3 a 5 centros.
3. Construcción del MVP con esta especificación (backend real, RLS, MFA).
4. Revisión legal y de seguridad.
5. Piloto controlado con 1 o 2 centros.
6. Módulos clínicos validados por separado.
