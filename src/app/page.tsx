import Image from "next/image";

/**
 * Página de inicio de Iron Brain.
 *
 * Landing pública del producto Iron Brain, ecosistema central de decisiones
 * de TodoCESPED. La página presenta el producto, sus pilares funcionales y
 * los créditos del trabajo. No incluye accesos autenticados: la
 * autenticación se incorporará en una iteración posterior.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <Pillars />
      <Footer />
    </main>
  );
}

/**
 * Sección principal de bienvenida. Presenta el nombre del producto, su
 * propuesta de valor y un indicador de estado del proyecto.
 */
function Hero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-start justify-center px-6 py-24 sm:px-12 lg:px-24">
      <div className="mx-auto w-full max-w-5xl">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--color-text-secondary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-green)]" />
          Plataforma en desarrollo
        </span>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-6xl lg:text-7xl">
          Iron Brain
        </h1>

        <p className="mt-6 text-xl text-[var(--color-text-secondary)] sm:text-2xl">
          Ecosistema central de decisiones
        </p>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Iron Brain centraliza la información operativa de TodoCESPED y
          proporciona a cada departamento las herramientas necesarias para
          tomar decisiones basadas en datos. Cruza información procedente
          del sistema ERP corporativo con fuentes adicionales y traduce los
          patrones detectados en acciones concretas.
        </p>
      </div>
    </section>
  );
}

/**
 * Sección de tres pilares que describe los componentes funcionales del
 * sistema. Cada pilar incluye un título y una descripción breve.
 */
function Pillars() {
  const pilares = [
    {
      titulo: "Datos consolidados",
      descripcion:
        "Centralizamos información de toda la empresa en un único almacén con calidad y trazabilidad garantizadas.",
    },
    {
      titulo: "Módulos por departamento",
      descripcion:
        "Cada departamento accede a su módulo, con acciones priorizadas por impacto y datos específicos para su trabajo.",
    },
    {
      titulo: "Inteligencia operativa",
      descripcion:
        "Cruzamos fuentes de datos para detectar patrones que orientan decisiones operativas y comerciales.",
    },
  ];

  return (
    <section className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-6 py-24 sm:px-12 lg:px-24">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="mb-12 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          Qué ofrece Iron Brain
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {pilares.map((pilar) => (
            <article
              key={pilar.titulo}
              className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-8 transition-colors hover:border-[var(--color-brand-green)]"
            >
              <h3 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">
                {pilar.titulo}
              </h3>
              <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
                {pilar.descripcion}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Pie de página con la atribución de marca, los créditos del Trabajo Fin
 * de Grado y la mención al marco académico.
 */
function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-6 py-12 sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/logo-todocesped-verde.png"
            alt="Logotipo de TodoCESPED"
            width={140}
            height={32}
            priority={false}
            className="h-8 w-auto"
          />
        </div>

        <div className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>© 2026 TodoCESPED. Iron Brain.</p>
          <p className="mt-1">
            Trabajo Fin de Grado · Universidad de Zaragoza · Escuela
            Universitaria Politécnica de Teruel.
          </p>
        </div>
      </div>
    </footer>
  );
}