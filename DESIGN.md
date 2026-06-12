---
name: Gestión Docente
description: El cuaderno del profesor reimaginado, sereno, eficiente y discretamente cálido.
colors:
  indigo-tinta: "#4f46e5"
  indigo-tinta-profundo: "#4338ca"
  papel: "#f6f7f9"
  superficie: "#ffffff"
  borde: "#e5e7eb"
  tinta: "#111827"
  gris-anotacion: "#6b7280"
  papel-noche: "#0b1120"
  superficie-noche: "#1e293b"
  borde-noche: "#334155"
  tinta-noche: "#f1f5f9"
  rojo-incidencia: "#dc2626"
  verde-positiva: "#059669"
  ambar-aviso: "#ca8a04"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  chip:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-tinta}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-tinta-profundo}"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "#374151"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-danger:
    backgroundColor: "{colors.rojo-incidencia}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
  chip:
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Gestión Docente

## 1. Overview

**Creative North Star: "El cuaderno sereno"**

Gestión Docente es el cuaderno del profesor reimaginado: papel claro, tinta índigo, orden y calma. Cada pantalla existe para que registrar algo (una sesión, una nota, una anotación) cueste menos que hacerlo en papel. La estética es serena y eficiente, con una calidez discreta que aportan los colores por asignatura y los nombres de los alumnos, nunca la decoración. El sistema piensa en tiempo (hoy, esta sesión, esta semana): el calendario semanal es el hogar y todo lo demás se ordena alrededor.

Este sistema rechaza explícitamente dos mundos. Por un lado, las plataformas educativas corporativas (Moodle, Séneca/Aules, SM Educamos): densas, grises, burocráticas, de navegación laberíntica. Por otro, la hoja de cálculo glorificada: todo tablas con bordes, sin jerarquía ni respiro. El cuaderno del profesor necesita densidad real (la rejilla de notas es densa por naturaleza), pero la densidad se sostiene con jerarquía tipográfica y espaciado rítmico, no con más bordes.

Tema dual: claro por defecto (el aula de día, papel `#f6f7f9`) y oscuro completo (corrección nocturna en casa, `#0b1120`), conmutado por la clase `.dark` que redefine las variables del tema sin tocar componentes.

**Key Characteristics:**
- Fondo papel con superficies blancas y bordes finos; profundidad mínima.
- Índigo tinta como única voz de marca; el resto del color identifica asignaturas y tipos de anotación.
- Tipografía de sistema, jerarquía por peso y tamaño, sin fuentes decorativas.
- Movimiento contenido: entradas de 180-200ms con ease-out, respeto a `prefers-reduced-motion`.
- Impresión limpia: fondo blanco y sin sombras (los informes salen como documentos).

## 2. Colors

Neutros tintados de papel y tinta, con un solo acento de marca y una paleta funcional de diez colores que identifica asignaturas.

### Primary
- **Índigo tinta** (#4f46e5): la tinta del cuaderno. Acciones primarias, enlaces activos, foco, selección en el calendario. Su variante **Índigo tinta profundo** (#4338ca) es el estado hover/active.

### Neutral
- **Papel** (#f6f7f9): fondo de la aplicación en tema claro.
- **Superficie** (#ffffff): tarjetas, formularios, celdas del cuaderno.
- **Borde** (#e5e7eb): divisores y contornos de 1px; nunca más gruesos como acento.
- **Tinta** (#111827): texto principal.
- **Gris anotación** (#6b7280): texto secundario, subtítulos, metadatos.
- **Noche** (papel #0b1120, superficie #1e293b, borde #334155, tinta #f1f5f9): el cuaderno bajo el flexo; misma estructura, paleta slate.

### Funcionales (semánticos)
- **Verde positiva** (#059669): anotaciones positivas, confirmaciones, guardado.
- **Rojo incidencia** (#dc2626): incidencias, errores, acciones destructivas.
- **Ámbar aviso** (#ca8a04): avisos y anotaciones negativas leves.

### Asignaturas
Paleta cerrada de 10 colores (`SUBJECT_COLORS` en `src/lib/colors.ts`): índigo, cian, esmeralda, ámbar, rojo, rosa, violeta, naranja, teal y slate. El color de asignatura tiñe los bloques del calendario y los identificadores de clase; el texto sobre él se resuelve automáticamente con `readableText()`.

### Named Rules
**La regla del color con significado.** El color identifica (una asignatura, un tipo de anotación, un estado); nunca decora. Si un color no informa, sobra.

**La regla de la tinta única.** El índigo tinta es la única voz de marca y aparece en menos del 10% de cualquier pantalla. Los colores de asignatura no compiten con él: viven en el calendario y en los identificadores, no en los controles.

## 3. Typography

**Display Font:** ui-sans-serif / system-ui (Segoe UI, Roboto según plataforma)
**Body Font:** la misma pila de sistema

**Character:** Tipografía de sistema sin pretensiones: rápida, legible y nativa en cada plataforma. La personalidad sale de la jerarquía (peso y tamaño), no de la fuente.

### Hierarchy
- **Headline** (700, 1.5rem/24px, 1.3): título de página en `PageHeader`. Uno por pantalla.
- **Title** (600, 1rem/16px, 1.4): títulos de tarjeta, pestañas activas, encabezados de sección.
- **Body** (400, 0.875rem/14px, 1.5): el tamaño de trabajo de toda la app; formularios, tablas, contenido. Máximo 70ch en texto corrido.
- **Label** (500, 0.875rem/14px): etiquetas de formulario (`.label`), botones.
- **Chip** (500, 0.75rem/12px): chips, badges, metadatos de calendario.

### Named Rules
**La regla del único titular.** Cada pantalla tiene exactamente un Headline; todo lo demás baja un escalón. Si dos textos compiten en tamaño, uno de los dos está mal.

## 4. Elevation

Sistema plano por defecto con relieve mínimo: la profundidad la dan los bordes de 1px y el contraste papel/superficie, no las sombras. Las tarjetas (`.card`) llevan una única sombra ambiental (`shadow-sm`, `0 1px 2px 0 rgb(0 0 0 / 0.05)`) que las despega apenas del papel. En impresión las sombras desaparecen por completo. En tema oscuro la elevación es puramente tonal: superficie `#1e293b` sobre papel `#0b1120`.

### Shadow Vocabulary
- **Ambiental** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): tarjetas en reposo. Es la única sombra del sistema junto con la de los modales/toasts.
- **Flotante** (`shadow-lg`): reservada a capas que realmente flotan (modal, toast). Nada más la usa.

### Named Rules
**La regla plano-por-defecto.** Las superficies son planas en reposo. Si una sombra crece, es porque el elemento flota de verdad (modal, toast); el hover no eleva.

## 5. Components

Interacción refinada y contenida: estados sutiles, transiciones de colores de 150-200ms, nada salta ni rebota.

### Buttons
- **Shape:** esquinas suavemente curvadas (8px, `rounded-lg`).
- **Primary:** índigo tinta (#4f46e5) con texto blanco, padding 8px 14px, peso 500; hover a índigo profundo (#4338ca).
- **Secondary:** superficie blanca con borde gris (#d1d5db) y texto gris oscuro; hover gris muy claro.
- **Ghost:** solo texto gris; hover con fondo gris claro. Para acciones terciarias.
- **Danger:** rojo incidencia (#dc2626) con texto blanco. Solo para destrucción real, siempre con confirmación (`ConfirmDeleteButton`).
- **Disabled:** opacidad 50% y cursor not-allowed; sin cambio de color.

### Chips
- **Style:** píldora completa (`rounded-full`), padding 2px 10px, 12px peso 500.
- **State:** el fondo tintado comunica el tipo (positiva verde, incidencia roja, asignatura su color); siempre acompañado de texto, nunca solo color.

### Cards / Containers
- **Corner Style:** 12px (`rounded-xl`).
- **Background:** superficie blanca sobre papel; `#1e293b` en oscuro.
- **Shadow Strategy:** ambiental única (ver Elevation).
- **Border:** 1px borde (#e5e7eb).
- **Internal Padding:** 16-24px según densidad; las rejillas densas (cuaderno) pueden bajar a 8px por celda.

### Inputs / Fields
- **Style:** borde 1px gris (#d1d5db), fondo blanco, 8px de radio, texto 14px.
- **Focus:** borde índigo (#6366f1) + anillo suave índigo claro (`ring-indigo-100`); sin glow.
- **Error:** borde y fondo rojos suaves vía `out-of-range`; el anillo de foco pasa a rojo.
- **Label:** siempre encima del campo, 14px peso 500.

### Navigation
- Barra lateral persistente con selector de curso académico y navegación principal; el elemento activo se marca con fondo tintado índigo, no solo con color de texto. Ficha de clase organizada en cuatro pestañas (Sesión, Alumnos, Calificaciones, Historial): los grupos de trabajo viven dentro de Alumnos, el cuaderno y los evaluables dentro de Calificaciones, y la vista de mes es un conmutador dentro de Historial.

### Calendario semanal (componente firma)
La pantalla de inicio: rejilla de semana tipo timesheet donde cada bloque lleva el color de su asignatura con texto legible automático, muestra asignatura, clase y horas, y al hacer clic abre la sesión de ese día. Es la materialización de «el calendario es el hogar»: debe ser siempre lo más vivo y colorido de la app.

## 6. Do's and Don'ts

### Do:
- **Do** usar el color de asignatura como identificador en calendario, chips y cabeceras de clase; resolver el texto sobre él con `readableText()`.
- **Do** mantener la acción principal de cada pantalla a un clic, con botón primario índigo único y visible.
- **Do** acompañar siempre el color con texto o icono (tipos de anotación, estados): el color nunca es el único canal.
- **Do** respetar `prefers-reduced-motion` en toda animación nueva, como ya hacen `.page-enter` y `.toast-enter`.
- **Do** mostrar el estado de guardado (autoguardado, toasts): «nada se pierde» es una promesa visual.

### Don't:
- **Don't** parecer una plataforma educativa corporativa (Moodle, Séneca/Aules, SM Educamos): nada de formularios interminables, grises burocráticos ni navegación laberíntica.
- **Don't** caer en la hoja de cálculo glorificada: prohibido resolver densidad añadiendo bordes; la jerarquía sale de tipografía y espaciado.
- **Don't** usar `border-left` o `border-right` de más de 1px como franja de color en tarjetas, listas o avisos.
- **Don't** usar texto con degradado (`background-clip: text`), glassmorphism decorativo ni la plantilla de métrica gigante con label pequeño.
- **Don't** usar `#000` ni blanco puro como fondo de la app (el papel es #f6f7f9; el blanco puro se reserva a superficies e impresión).
- **Don't** abrir un modal cuando una edición inline o un panel progresivo resuelve lo mismo; el modal es último recurso.
- **Don't** elevar con sombra en hover: el sistema es plano por defecto y las sombras grandes son solo de modales y toasts.
