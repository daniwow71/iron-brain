# ADR-0001: Arquitectura en tres niveles

- **Fecha**: 2026-04-17
- **Estado**: aceptado
- **Decisor**: Daniel Sanagustín López
- **Revisor técnico**: CTO de TodoCESPED

## Contexto

Iron Brain se concibe como un ecosistema central de decisiones que ha de convivir con un sistema ERP existente (Odoo 15), gestionado por una empresa externa (Sygel), y que a medio plazo debe incorporar capacidades analíticas basadas en modelos de inteligencia artificial. La arquitectura del sistema debe por tanto responder a varios requisitos simultáneos:

- Acceder a la información del ERP sin depender de que Sygel provea integraciones específicas para cada necesidad y sin introducir dependencias operativas adicionales sobre ese sistema.
- Ofrecer una base común de datos consolidados sobre la que construir módulos departamentales con lógica de negocio propia, sin que cada módulo tenga que reimplementar el acceso al ERP.
- Admitir la incorporación futura de servicios de inteligencia artificial con requisitos de infraestructura distintos (memoria elevada, GPU, modelos de lenguaje de gran tamaño) sin acoplar esos servicios al alojamiento del resto del sistema.
- Mantener la regla innegociable de que la integración con el ERP opere exclusivamente en modo de solo lectura, garantizada tanto por permisos a nivel de usuario técnico como por restricciones implementadas en el propio cliente.

La arquitectura ha sido propuesta por el cliente y asumida por el autor tras evaluar su encaje con estos requisitos.

## Alternativas consideradas

### Alternativa A — Arquitectura en tres niveles (seleccionada)

Separación explícita en tres capas:

- **Nivel 1: conexión con Odoo.** Cliente en TypeScript alojado en `src/lib/odoo/` que implementa el protocolo JSON-RPC contra la instancia de Odoo. Incorpora la allowlist de métodos permitidos como parte de su contrato público.
- **Nivel 2: núcleo Iron Brain.** Aplicación Next.js desplegada sobre Vercel que gestiona el proceso de sincronización periódica desde Odoo, mantiene un almacén propio sobre Supabase (PostgreSQL), expone autenticación y seguridad a nivel de fila, e implementa los módulos departamentales.
- **Nivel 3: aplicaciones de inteligencia artificial.** Servicios en Python alojados en un VPS dedicado, con acceso de lectura al almacén del Nivel 2. Fuera del alcance del presente Trabajo Fin de Grado.

Ventajas:

- Aislamiento claro de responsabilidades: el Nivel 1 no conoce la lógica de los módulos, el Nivel 2 no conoce el protocolo JSON-RPC de Odoo, el Nivel 3 no conoce la estructura de datos original del ERP.
- Permite evolucionar cada nivel de forma independiente: cambios en Odoo afectan solo al Nivel 1; cambios en la interfaz o los módulos afectan solo al Nivel 2; la incorporación de capacidades de IA no requiere modificar los niveles inferiores.
- El almacén propio del Nivel 2 actúa como "capa de estabilización": los módulos consumen datos consolidados con un esquema controlado, no datos crudos del ERP cuya estructura está fuera del control del proyecto.
- La separación física del Nivel 3 en infraestructura dedicada permite dimensionar la máquina según las necesidades de los modelos de IA sin impactar en el coste o la disponibilidad del resto del sistema.

Inconvenientes asumidos:

- El almacén propio introduce latencia entre los datos del ERP y los datos consumidos por los módulos. Se acota con una frecuencia de sincronización definida en ADR-0003 (sincronización por polling).
- Requiere mantener el esquema del almacén sincronizado con la evolución del modelo de datos de Odoo. Se mitiga con las pruebas de contrato sobre los datos sincronizados.

### Alternativa B — Conector directo al ERP sin almacén intermedio

Cada módulo departamental consulta Odoo directamente, sin capa intermedia.

Ventajas:

- Datos siempre actualizados, sin latencia.
- Sin necesidad de gestionar un almacén propio.

Inconvenientes:

- Acoplamiento fuerte de cada módulo a la estructura de datos de Odoo. Cualquier cambio en el ERP impacta a todos los módulos a la vez.
- Cada módulo soporta el coste de las llamadas remotas, que son más lentas que consultas locales.
- Imposibilita la integración con capacidades de IA que requieren consultas analíticas sobre grandes volúmenes de datos, poco adecuadas para un ERP transaccional.
- Expone a Odoo a una carga de consultas que no está dimensionado para absorber.

Descartada por el acoplamiento excesivo y por la imposibilidad de construir el Nivel 3 sobre esta base.

### Alternativa C — Solución comercial de sincronización de datos (Fivetran, Airbyte)

Uso de una plataforma de Extract-Transform-Load (ETL) comercial o de código abierto para sincronizar datos de Odoo a un almacén propio, y construcción del resto del sistema sobre ese almacén.

Ventajas:

- Reduce el esfuerzo de implementar la sincronización.
- Herramientas maduras con soporte para numerosas fuentes de datos.

Inconvenientes:

- Coste económico recurrente en el caso de Fivetran, o coste operativo de mantener infraestructura propia de Airbyte.
- Dependencia externa adicional sobre un proveedor ajeno al proyecto.
- Control limitado sobre la lógica de sincronización: la allowlist de métodos permitidos, la transformación de campos sensibles y la minimización por protección de datos resultan difíciles de imponer a través de una herramienta genérica.
- Incompatibilidad con el modelo académico de Trabajo Fin de Grado, en el que se valora que el autor implemente los componentes fundamentales del sistema.

Descartada por el desajuste entre la naturaleza de la herramienta y los requisitos del proyecto.

## Decisión

Se adopta la **arquitectura en tres niveles descrita en la alternativa A**. El desarrollo del Trabajo Fin de Grado se limita a los niveles 1 y 2 en su fase inicial, incluyendo la infraestructura base, la sincronización con Odoo, la autenticación y seguridad a nivel de fila, la observabilidad mínima y el primer módulo funcional (Motor de Inteligencia Comercial). El Nivel 3 queda reservado como trabajo futuro fuera del alcance del presente Trabajo Fin de Grado.

## Consecuencias

### Positivas

- Separación clara de responsabilidades que facilita la evolución independiente de cada nivel.
- El almacén del Nivel 2 actúa como capa de estabilización que aísla a los módulos de cambios en el ERP.
- La estructura permite incorporar componentes de IA en el futuro sin reescribir el resto del sistema.
- Alineación con las reglas del proyecto sobre seguridad del acceso a Odoo y sobre confidencialidad de la información empresarial.

### Negativas o riesgos asumidos

- Los datos del almacén tienen una latencia respecto a Odoo determinada por la frecuencia de sincronización.
- Mantener el esquema del almacén requiere seguimiento explícito de los cambios relevantes en el modelo de datos de Odoo.
- La arquitectura introduce más piezas móviles que una integración directa, lo que supone mayor carga inicial de implementación a cambio de mantenibilidad a largo plazo.

### Acciones derivadas

- [x] Estructurar el repositorio con carpetas diferenciadas por nivel (`src/lib/odoo/` para Nivel 1, resto de la aplicación Next.js para Nivel 2).
- [x] Implementar el Nivel 1 (cliente Odoo con allowlist) como primera pieza técnica del proyecto.
- [ ] Implementar la sincronización periódica desde Odoo al almacén propio (pendiente: ver ADR-0003).
- [ ] Dejar documentada la frontera entre Nivel 2 y Nivel 3 para la eventual incorporación del Nivel 3.

## Referencias

- Briefing inicial del proyecto (ACTIONS.pdf), facilitado por el cliente.
- Nygard, M. (2011). *Documenting Architecture Decisions*. Disponible en: https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions