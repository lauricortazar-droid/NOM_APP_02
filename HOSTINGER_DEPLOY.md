# Publicar CentroVida DEMO en Hostinger

**Estado:** prototipo con datos 100 % ficticios. No se permite su uso para expedientes clínicos, datos personales reales o cobros reales. Los filtros y cambios de rol en el navegador NO sustituyen una autorización de backend.

## Opción recomendada: Hostinger Web App + GitHub

1. Entrar a hPanel de Hostinger > **Websites / Sitios web** > **Create Website / Crear sitio web** > **Web App**.
2. Seleccionar **Import Git Repository / Importar repositorio Git** y conectar GitHub. Si aparece la opción de URL pública, utilizar \`https://github.com/lauricortazar-droid/NOM_APP_02\`.
3. Elegir el repositorio **lauricortazar-droid/NOM_APP_02**.
4. **Muy importante:** seleccionar la rama \`mejora-integridad-finanzas-permisos-20261028\` para la demo revisada; \`main\` todavía no incluye esos cambios.
5. Configurar:
   - Framework: **Vite / React**
   - Node.js: **22**
   - Project root: **./**
   - Build command: **npm run build**
   - Output directory: **dist**
   - Install: **npm install** (si el asistente solicita comando)
   - Entry file: **no aplica** para una web estática.
6. Elegir preferiblemente un **dominio temporal o subdominio de pruebas** y no el sitio público definitivo.
7. No cargar variables \`GEMINI_API_KEY\`, ni \`SUPABASE_SERVICE_ROLE_KEY\`, ni ningún secreto de servidor en el frontend. Este prototipo no necesita credenciales Supabase para la demo ficticia.
8. Confirmar Deploy y verificar en hPanel el estado **Completed / Completado** y el enlace de la web.
9. Probar en móvil (360 px): navegación, cambio de sede, roles, registro de pago ficticio, ajuste ficticio, acceso a documentos y mensajes, reinicio de datos semilla.
10. El sitio tiene que mostrar el aviso de demo y NO debe indexarse en buscadores.

La integración GitHub de Hostinger puede desplegar los cambios de la rama elegida automáticamente. Antes de activar autodeploy, validar los checks del workflow \`Comprobar demo para Hostinger\`.

## Diagnóstico

- Si falla el deploy, revisar **Deployment > Build logs** y confirmar versión de Node, raíz del proyecto y salida \`dist\`.
- Si se ve una página en blanco, comprobar consola del navegador, carga de JS/CSS y configuración del proyecto.
- Si se desea servir bajo un subdirectorio (no bajo la raíz de un dominio/subdominio), habrá que configurar \`base\` en Vite.
- Esta demo utiliza estado del navegador: distintas computadoras NO compartirán una base de datos real.
- Las normas y medidas de seguridad aún pendientes se describen en \`public/assets/aistudio/CentroVida_Especificacion_Tecnica_f5b9f3d7.md\`.

## Antes de una puesta en producción

Completar autenticación real y MFA, permisos verificados por servidor, RLS por centro en PostgreSQL, respaldos, almacenamiento privado cifrado, auditoría de solo anexado y revisión legal/clínica. No usar datos sensibles ni operaciones reales mientras no se completen.
