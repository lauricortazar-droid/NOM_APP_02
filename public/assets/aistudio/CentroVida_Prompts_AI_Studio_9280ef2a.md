# CentroVida: Prompts para Google AI Studio (modo Build)

## Cómo usarlo

1. Pega el **Prompt maestro** en *System instructions* (o como primer mensaje).
2. Envía el **Prompt 1** y revisa el resultado.
3. Continúa con los prompts 2 a 6, uno por uno. No avances sin que el anterior funcione.
4. Si algo falla, corrígelo citando la regla: *"El rol Administración ve la pestaña clínica; aplica R4."*
5. Usa el historial de versiones de Build para volver atrás si una etapa rompe algo.

---

## PROMPT MAESTRO (System instructions)

```
Eres un ingeniero front-end senior y diseñador de producto. Vas a construir, por etapas, el PROTOTIPO de "CentroVida" (nombre provisional): una plataforma web de gestión integral para centros de rehabilitación y atención de adicciones en México.

# ALCANCE Y LÍMITES
- Es un PROTOTIPO funcional con DATOS 100% FICTICIOS. Nunca uses datos reales ni sensibles.
- Idioma de la interfaz: español de México. Moneda: MXN ($ con separador de miles). Fechas: dd/mm/aaaa o "27 oct 2026".
- Stack: React + TypeScript + Tailwind CSS. Persistencia del prototipo: estado global (Zustand o Context) con respaldo en localStorage. Diseña la capa de datos detrás de un "repositorio" (funciones getX/saveX) para poder cambiarla después por un backend real (por ejemplo Firebase con reglas de seguridad).
- No uses la API de Gemini para funciones de IA en esta fase.
- No afirmes en ninguna pantalla que el sistema "cumple NOM", "tiene validez jurídica" o "sustituye el expediente físico". Incluye un aviso discreto: "Prototipo con datos ficticios. No es un sistema clínico validado."

# PRINCIPIOS DE PRODUCTO
1. Sencillez: un trabajador sin experiencia técnica debe completar una tarea en pocos pasos.
2. Mobile-first: todo debe usarse bien en un teléfono (360 px) y escalar a tableta y escritorio. Botones táctiles de al menos 44 px.
3. Una sola captura: nunca pedir dos veces un dato que ya existe.
4. Información por niveles: cada rol ve solo lo que necesita. La interfaz debe OCULTAR lo no autorizado y la capa de datos debe RECHAZAR el acceso (simula autorización "en servidor" en una función central `can(user, action, resource)`).
5. Trazabilidad: toda acción relevante guarda autor, fecha, hora y valor anterior/nuevo.
6. Personalización controlada: catálogos y plantillas configurables, no código a la medida.

# REGLAS DE NEGOCIO OBLIGATORIAS (no las rompas nunca)
R1. Estructura: Organización → Centro → Departamento → Usuario. TODA entidad lleva `organizationId` y `centerId`, y TODA consulta se filtra por el centro activo del usuario.
R2. Modelo Persona → Episodio de atención. Una persona puede tener varios episodios (reingreso) sin mezclar fechas, pagos ni documentos.
R3. Un adeudo económico NUNCA bloquea ni condiciona registrar un egreso. Muestra el adeudo como información, jamás como impedimento.
R4. Separar "saber que una actividad ocurrió" de "leer su contenido". Dirección ve que existe una sesión psicológica realizada o pendiente, pero no su contenido.
R5. Notas y documentos firmados no se eliminan ni se sobrescriben: toda corrección crea una nueva versión y conserva la anterior con autor y motivo.
R6. Los pagos se corrigen con movimientos de ajuste auditables, no editando el pago original.
R7. Contacto familiar ≠ derecho a información clínica. Roles de relación independientes: contacto, contacto de emergencia, responsable de pago, autorizado para recibir información, representante legal.
R8. La firma de un familiar no sustituye el consentimiento de la persona atendida. El flujo de admisión pide el consentimiento de la persona y, aparte, la representación legal cuando aplique.
R9. Un mensaje a familiares solo puede prepararse si el destinatario está autorizado para ese canal y finalidad. Nunca incluir información clínica en mensajes.
R10. La app no diagnostica, no prescribe y no determina admisiones ni egresos por sí sola.
R11. No registrar una acción como realizada si no se ejecutó (por ejemplo, un mensaje solo se marca "enviado" si el usuario lo confirma).

# ROLES DEL PROTOTIPO
Dirección, Administración, Enfermería, Psicología, Consejería, Trabajo social, Personal operativo.
Incluye un selector "Ver como…" en el encabezado para cambiar de rol en la demo. Cada rol tiene su propio panel de inicio y menú.

# NAVEGACIÓN
Barra inferior en móvil / lateral en escritorio: Inicio | Personas | Actividades | Documentos | Administración | Más. Muestra solo lo permitido por el rol.

# ESTILO VISUAL
Sobrio, claro y cálido (no "hospitalario frío"). Una sola paleta (color primario teal o azul profundo, neutros grises, rojo/ámbar/verde solo para estados). Tipografía legible (Inter o similar). Tarjetas con bordes suaves, mucho espacio en blanco, iconos de lucide-react. Cumple contraste AA y etiquetas accesibles en formularios. Estados de carga, vacío y error en cada pantalla.

# CÓMO TRABAJAR
- Construye SOLO lo que pida cada mensaje; no adelantes módulos futuros.
- Tras cada etapa, resume brevemente: qué se construyó, qué decisiones asumiste y qué falta.
- Si algo es ambiguo, elige la opción más simple y menciónalo; no te detengas a preguntar.
- Mantén el código modular por dominio (carpetas: auth, personas, finanzas, tareas, documentos, comunicacion, auditoria, ui). Tipos TypeScript centralizados.
- No elimines funciones ya construidas al agregar nuevas.
```

---

## PROMPT 1: Base: estructura, roles, modelo de datos y panel de inicio

```
ETAPA 1: Fundamentos.

Construye:
1. Tipos TypeScript para: Organization, Center, Department, User (con rol y centerId), Person, Episode, Contact (con tipo de relación y permisos de comunicación), Task, LogEntry, AuditEvent. Cada entidad con id, organizationId, centerId, createdAt, createdBy.
2. Datos semilla ficticios: 1 organización, 2 centros ("Centro Renacer" y "Centro Nuevo Camino", para demostrar el aislamiento), 7 usuarios (uno por rol, en el primer centro), 12 personas con episodios en distintos estados (Preingreso, En evaluación, Admitido, En atención, Egresado, En seguimiento), contactos familiares y 10 tareas.
3. La función central `can(user, action, resource)` y un repositorio de datos que SIEMPRE filtre por centro del usuario.
4. Encabezado con nombre del centro, selector "Ver como…" (rol) y selector de centro (para demostrar que no se mezclan datos).
5. Navegación adaptada al rol (según el prompt maestro).
6. Panel de Inicio personalizado por rol que responda: ¿qué tengo que hacer hoy?, ¿qué está vencido?, ¿qué requiere atención?
   - Dirección: residentes activos, ocupación, pagos pendientes (número), documentos por revisar, tareas vencidas.
   - Administración: cobros próximos y vencidos.
   - Enfermería, Consejería, Psicología, Trabajo social: sus actividades de hoy y pendientes (sin contenido reservado).
7. Registro de auditoría básico: cada cambio de rol/centro y cada alta/edición guarda un AuditEvent. Pantalla "Más → Auditoría" visible solo para Dirección.

Criterio de aceptación: al cambiar al segundo centro no aparece ningún dato del primero; al cambiar de rol cambian menú y panel.
```

---

## PROMPT 2: Personas, episodios y contactos

```
ETAPA 2: Personas y episodios. Mantén todo lo anterior.

Construye en "Personas":
1. Lista con búsqueda rápida (nombre, folio), filtros por estado de episodio y tarjetas legibles en móvil.
2. Alta de persona con formulario dividido en pasos (máximo 5 campos por paso), guardado de borrador y validaciones: nombre completo, fecha de nacimiento, teléfono, dirección en campos separados (calle, núm. ext., núm. int., colonia, C.P., municipio/alcaldía, estado). Detección de posible duplicado por nombre + fecha de nacimiento, con aviso antes de guardar.
3. Ficha de la persona con pestañas: Datos, Red de apoyo, Episodios, Pagos, Archivos, Historial (cambios). Los datos permanentes viven en la persona; fechas, programa, responsable y pagos viven en el episodio.
4. Flujo de episodio: estados Preingreso → En evaluación → Admitido → En atención → Egresado → En seguimiento (y "Referido a otra institución"). Cambiar de estado exige confirmación y queda auditado.
5. Admisión: lista de verificación configurable que incluya, como pasos distintos e independientes, "consentimiento de la persona atendida", "representación legal (si aplica)", "aviso de privacidad" y "acuerdo económico". No permitir marcar como válido el consentimiento con solo la firma de un familiar (R8).
6. Egreso: formulario de egreso con motivo y plan de continuidad. Muestra el saldo pendiente solo como información, sin bloquear el egreso (R3).
7. Reingreso: botón "Nuevo episodio" que conserva el historial y crea un episodio nuevo.
8. Red de apoyo: contactos con tipo de relación (contacto, emergencia, responsable de pago, autorizado para información, representante legal), y permisos de comunicación por canal y finalidad. Opción de "restricción de contacto".
9. Visibilidad por rol: Administración ve datos generales, pagos y documentos administrativos, pero no la pestaña clínica ni notas reservadas.

Criterio de aceptación: puedo egresar a alguien con adeudo; puedo reingresar a alguien sin perder su historial; el rol Administración no ve contenido clínico.
```

---

## PROMPT 3: Finanzas y cobranza

```
ETAPA 3: Finanzas. Mantén todo lo anterior.

Construye en "Administración → Finanzas":
1. Acuerdo económico por episodio: cuota de inscripción, costo del programa, frecuencia (semanal, quincenal, mensual o calendario personalizado), día de vencimiento, número de pagos, descuento o beca, conceptos extraordinarios. Genera automáticamente el calendario de cargos (un ejemplo configurable: de oct 2026 a may 2027; no lo fijes como regla).
2. Registro de pagos: abonos, pagos parciales, anticipos, método de pago y comprobante adjunto (simulado). Un pago parcial actualiza el saldo del cargo correcto sin alterar otros cargos.
3. Correcciones solo mediante movimientos de ajuste con motivo y autor (R6). No hay botón de "editar pago" ni "borrar pago".
4. Estado de cuenta por persona con: pagado, pendiente, vencido, próximo cobro, y una vista imprimible.
5. Panel "Cobranza": lista de quién debe, cuánto y desde cuándo; filtros por vencido, próximo a vencer y centro; acciones rápidas "Registrar pago" y "Preparar mensaje de recordatorio" (aún sin enviar).
6. Gastos del centro: alta de gasto con categoría (alimentación, medicamentos, transporte, gasolina, mantenimiento, servicios, nómina, insumos, otro), monto, fecha, proveedor y comprobante.
7. Reportes simples con gráficas: ingresos vs. egresos por mes, cuentas por cobrar, gastos por categoría y resultado del periodo.
8. Exportar a CSV.
9. Permisos: solo Dirección y Administración acceden; Dirección ve reportes y totales.

No incluyas facturación fiscal (CFDI) ni contabilidad completa.

Criterio de aceptación: un pago parcial deja el saldo correcto; una corrección queda como ajuste auditado; los números del panel de Inicio coinciden con los de Cobranza.
```

---

## PROMPT 4: Tareas, bitácoras y turnos

```
ETAPA 4: Actividades. Mantén todo lo anterior.

Construye en "Actividades":
1. Tareas: título, descripción, responsable, departamento, prioridad, fecha límite, estado (pendiente, en proceso, completada, vencida), persona relacionada opcional y evidencia requerida. Una tarea vencida sigue visible y conserva a su responsable.
2. Vistas: "Mis tareas hoy", "Vencidas", "Por departamento" y calendario semanal simple.
3. Bitácora operativa: entradas con tipo, fecha y hora automáticas, autor, departamento, persona relacionada opcional, descripción y seguimiento. Las entradas no se borran; las correcciones crean una nueva versión.
4. Bitácora de enfermería y de consejería como categorías separadas, visibles solo para su departamento y Dirección (Dirección ve que existe el registro, no su contenido reservado, R4).
5. Cambio de turno: pantalla "Resumen de turno" que muestre pendientes y novedades, limitado a lo que el siguiente turno puede ver.
6. Incidencias: formulario estructurado (salud, conflicto, accidente, falla de instalaciones, seguridad, medicamentos, referencia externa) con seguimiento y cierre documentado.
7. Canal protegido de quejas y derechos: separado de la bitácora, y una queja no puede ser cerrada ni modificada por la persona señalada en ella.
8. Automatización simple y visible: al vencer una tarea se notifica al supervisor (notificación dentro de la app) sin asumir negligencia; al registrar un egreso se crean tareas de cierre documental.
9. Registrar una sesión de consejería marca la tarea correspondiente como completada y actualiza el indicador de cumplimiento, sin exponer notas.

Criterio de aceptación: el panel de Inicio de cada rol refleja sus tareas reales; Dirección ve cumplimiento sin leer contenido reservado.
```

---

## PROMPT 5: Documentos y mensajes

```
ETAPA 5: Documentos y comunicación. Mantén todo lo anterior.

Construye en "Documentos":
1. Biblioteca de plantillas por centro (consentimiento informado, contrato de servicios, autorización de contacto, recibo de pago, formato de egreso). Plantillas editables con campos dinámicos tipo {{nombre_persona}}, {{fecha}}, {{centro}}, {{monto}}.
2. Generación de documento con autollenado desde los datos existentes, vista previa y descarga/impresión como PDF.
3. Control de versiones: un documento firmado nunca se sobrescribe; cualquier cambio crea una versión nueva visible en el historial con autor y motivo (R5).
4. Firma: captura de firma dibujada en pantalla con fecha, hora y firmante, más el aviso: "La firma capturada en pantalla no equivale por sí sola a una firma electrónica avanzada. Verifica con asesoría legal su validez para este documento."
5. Carga de archivos escaneados (simulada) y su asociación al episodio.
6. Panel "Documentos por revisar" y "Documentos requeridos faltantes" por episodio.

Construye en "Más → Comunicación":
1. Plantillas de mensajes con variables para recordatorio de pago, aviso de visita y envío de documento.
2. Flujo asistido: elegir persona → elegir contacto autorizado → elegir plantilla → vista previa → botón "Abrir en WhatsApp" (enlace wa.me con el texto) y botón "Marcar como enviado" que el usuario confirma manualmente (R11).
3. Validaciones previas obligatorias: el destinatario debe estar autorizado para ese canal y finalidad, no tener solicitud de baja y el mensaje no debe incluir datos clínicos. Si falla alguna, mostrar el motivo y bloquear el envío.
4. Historial de mensajes por persona y por contacto.
5. Calendario de visitas con solicitudes, capacidad, confirmaciones y personas autorizadas.

No implementes envío automático ni integración real con WhatsApp.

Criterio de aceptación: no puedo preparar un mensaje a un contacto sin autorización; una corrección de documento firmado crea versión nueva.
```

---

## PROMPT 6: Seguridad simulada, pruebas de aceptación y pulido

```
ETAPA 6: Endurecimiento y verificación. Mantén todo lo anterior.

1. Revisa que TODA lectura y escritura pase por `can()` y por el filtro de centro. Corrige cualquier acceso directo que lo evite.
2. Crea una pantalla oculta de desarrollo (/pruebas) que ejecute y muestre en verde/rojo estas pruebas automáticas sobre los datos semilla:
   - Una persona puede ser readmitida sin perder su historial.
   - Administración puede cobrar sin acceder a notas psicológicas.
   - Un usuario del Centro A no puede consultar datos del Centro B.
   - Un documento generado conserva sus datos y su versión.
   - Una corrección documental deja evidencia.
   - Un pago parcial actualiza el saldo sin alterar otros cargos.
   - Un recordatorio no se prepara para un contacto sin autorización.
   - Una tarea vencida sigue visible con su responsable.
   - Un egreso se registra aunque exista adeudo.
   - Dar de baja a un usuario revoca sus permisos.
   - Los registros críticos conservan fecha, hora y autor.
   - Una exportación contiene solo datos autorizados para el rol.
3. Pulido de experiencia: revisa todos los flujos en 360 px de ancho, agrega estados vacíos útiles, confirmaciones en acciones irreversibles, mensajes de error claros y accesibilidad (foco visible, etiquetas, contraste).
4. Agrega un botón "Reiniciar datos de demostración".
5. Entrega un resumen final con: lista de pantallas, decisiones asumidas y una lista de lo que NO es producción-ready (backend real, autenticación con MFA, aislamiento real entre instituciones, cifrado, respaldos, auditoría protegida, firma electrónica avanzada y revisión legal y clínica).
```

---

## Antes de cargar datos reales

Se necesita backend real, revisión legal (LFPDPPP, NOM-004, NOM-024, consentimiento informado) y revisión clínica. Ver el archivo de especificación técnica.
