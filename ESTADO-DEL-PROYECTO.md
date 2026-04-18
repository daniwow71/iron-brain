# Estado del proyecto Iron Brain

Última actualización: 17 de abril de 2026.

## Objetivo de banda

Banda 3 (curso 2025/2026) — Depósito objetivo: mediados de junio de 2026. Defensa entre el 24 de junio y el 2 de julio de 2026.

## Hitos cerrados

- Propuesta de TFG registrada y aprobada por la EUPT.
- Acuerdo de confidencialidad en vigor.
- Título del TFG fijado en la propuesta aprobada.
- Accesos iniciales a Odoo facilitados por Sygel (pendiente reconfiguración a solo lectura — ver bloqueadores).
- Catálogo de campos de la instancia Odoo 15 de TodoCESPED recibido y analizado (fuente: Sygel, 15/04/2026).
- Repositorio `iron-brain` creado en GitHub (privado, cuenta personal, pendiente de transferir a Pedro).
- Bootstrap técnico completado: Next.js 16 + React 19 + TypeScript + Tailwind v4, con pnpm 10.33.0 y Node 22 LTS.

## Bloqueadores abiertos

| ID | Descripción | Dueño | Estado |
|----|-------------|-------|--------|
| B1 | Usuario Odoo `api@todocesped.es` tiene rol de administrador; rompe la regla de solo lectura de la arquitectura. Solicitada reconfiguración a Sygel vía Javier. | Javier / Sygel | Esperando |

## Deuda técnica conocida

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| D1 | Warning de Turbopack sobre `pnpm-workspace.yaml` como "additional lockfile". Requiere añadir `turbopack.root` al `next.config.ts`. | Baja |
| D2 | Página `src/app/page.tsx` es la demo de Next.js y hay que sustituirla por una página inicial propia. | Media |
| D3 | Ajustar `next.config.ts` con headers de seguridad (CSP, HSTS, X-Frame-Options, etc.). | Media, antes de primer deploy |
| D4 | Prettier no está instalado como dependencia del proyecto. Añadirlo cuando se endurezca el tooling. | Baja |

## Estado de los frentes

### Técnico

- Repo: creado y con bootstrap completado (privado, cuenta personal, pendiente de transferir a Pedro).
- Bootstrap Next.js: ✅
- Proyecto Supabase: existente (gestionado por TodoCESPED, pendiente recibir acceso).
- Cliente Odoo con allowlist: pendiente (esperando usuario de solo lectura).
- Esquema `odoo_*`: pendiente.
- Auth Google con restricción de dominios: pendiente.
- Protección de rama `main` en GitHub: pendiente.

### Documental

- Excel de campos Odoo: analizado.
- Índice de memoria: esbozado, pendiente de afinar.
- ADRs: ninguno escrito aún. El siguiente es el ADR-0001 (arquitectura en 3 niveles).

### Académico

- Propuesta: cerrada.
- Seguimiento con director: pendiente de agendar primer contacto formal del proyecto.
- Test de Privacidad UZ: pendiente de confirmar si aplica.

#### Preguntas pendientes para el director / Secretaría EUPT

| ID | Pregunta | Dirigida a |
|----|----------|------------|
| E1 | ¿Existe plantilla específica de la EUPT para la memoria, o se usa el modelo genérico UZ disponible en biblioteca? | Director |
| E2 | ¿Estilo de citas preferido? Propuesta: IEEE numérico (es el estándar en ingeniería y la normativa EUPT exige referencias numeradas). | Director |
| E3 | ¿Declaración responsable sobre uso de IA: hay modelo propio de la EUPT o se usa el genérico de la UZ? | Secretaría EUPT |
| E4 | ¿Dado que el proyecto trata datos personales de clientes (res.partner con nombre, email, teléfono, NIF, NIF cónyuge, dirección), se requiere realizar el Test de Privacidad de la UZ? | Secretaría EUPT / Director |
| E5 | ¿Existe rúbrica de evaluación publicada (como en Facultad de Veterinaria UZ), o la evaluación sigue únicamente los criterios generales de la normativa EUPT? | Director |
| E6 | ¿Preferencia sobre la tipografía y formato del documento? La normativa EUPT no lo especifica. Propuesta por defecto: A4, Times New Roman 12pt, interlineado 1,5, márgenes 2,5cm (3cm izquierdo), numeración de figuras por capítulo. | Director |
| E7 | ¿Hay preferencia de herramienta para la memoria (Word con plantilla, LaTeX, Markdown convertido a PDF)? La UZ ofrece modelos en Word y LaTeX. Nuestra propuesta es Markdown con conversión a PDF vía Pandoc. | Director |

## Alcance del TFG

**Dentro**: Fase 1 (infraestructura, sync con Odoo, auth, RLS, observabilidad mínima) + Módulo 1 (Motor de Inteligencia Comercial).

**Fuera, como trabajo futuro**: Fase 2 (IA en VPS con Python/FastAPI/Ollama) y resto de módulos departamentales.

## Próximos pasos inmediatos

Sin fechas fijas. Orden recomendado:

1. Protección de rama `main` en GitHub.
2. ADR-0001: Arquitectura en 3 niveles.
3. Primer esqueleto del cliente Odoo con allowlist (no conecta aún, solo la estructura y el test de violación).
4. ADR-0002: Cliente Odoo de solo lectura (al terminar el esqueleto).