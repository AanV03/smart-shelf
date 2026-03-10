# Agent Guidelines — Frontend & Color Rules

Este documento define las reglas obligatorias para el frontend y el uso de colores en el proyecto Smart-Shelf. Todas las modificaciones de UI deben seguir estas directrices.

## Principios generales

- **Accesibilidad primero:** Todas las decisiones visuales y de interacción deben cumplir WCAG y WAI-ARIA. Antes de mergear, cada cambio que afecte contraste o semántica debe pasar una verificación (Lighthouse/axe/contrast checker).
- **Variables de color:** Nunca se deben usar colores hardcodeados en componentes. Siempre usar variables definidas en `src/styles/globals.css`. Si falta una variable necesaria, crearla en `src/styles/globals.css` siguiendo la convención de nombres (ver seccion "Convenciones de variables").
- **Iconografía:** Todos los iconos deben provenir de `lucide-react`. No usar iconos externos ni SVGs inline sin revisión.
- **Componentes:** Dar prioridad al uso de componentes de `shadcn` antes que HTML puro. Si no existe el componente, crearlo como componente accesible reutilizable (con tests visuales si aplica).
- **Responsividad:** Todos los componentes deben ser responsivos usando las claves de Tailwind: `sm`, `md`, `lg`, `xl` (mobile-first). Probar en ancho móvil, tablet y desktop.
- **Glassmorphism + Contraste:** Aunque la estética primaria es Glassmorphism, los fondos translúcidos deben garantizar contraste suficiente para texto e interacciones. Siempre validar contraste entre texto y la superficie compuesta (fondo + overlay) y ajustar colores o opacidades.

## Convenciones de variables y colores

- **Prefijo y semántica:** Usar variables semánticas en `globals.css` como `--color-background`, `--color-card`, `--color-input`, `--color-foreground`, `--color-muted`, `--color-border`, `--color-primary`, `--color-warning`, `--color-destructive`, `--color-chart-*`.
- **Formato:** Preferir valores en Oklch cuando se definan nuevos tokens (por consistencia con la paleta existente). Ej: `oklch(0.98 0.015 260)`.
- **No hardcodear:** Dentro de JSX/TSX y CSS, referenciar variables (`var(--color-card)`) en lugar de hex/rgba directos.
- **Extensiones de tokens:** Si un componente necesita una variante (por ejemplo `card-strong`), añadir variable nueva con nombre semántico `--color-card-strong` dentro de `globals.css` y documentarla en este archivo.

## Reglas de accesibilidad (WCAG / WAI-ARIA)

- **Contraste:** Texto normal debe cumplir mínimo WCAG AA (4.5:1) y texto grande 3:1. Para elementos interactivos en glass surfaces, exigir al menos AA; para textos críticos (labels, warnings) preferir AAA.
- **Etiquetado:** Todos los inputs deben tener `<label htmlFor="...">` vinculados al `id`. Añadir `aria-required`, `aria-invalid` y `aria-describedby` cuando corresponda.
- **Roles & Semántica:** Preferir elementos semánticos (`<nav>`, `<main>`, `<section>`, `<button>`) y agregar atributos ARIA necesarios cuando la semántica nativa no sea suficiente.
- **Focus visible:** Implementar `:focus-visible` usando utilidades de Tailwind (ej.: `focus-visible:ring-2 focus-visible:ring-emerald-400`). Asegurar que el indicador de foco sea claramente visible sobre fondos translúcidos.

## Iconos

- **Fuente única:** Usar exclusivamente `lucide-react` para iconografía. Importar por nombre: `import { IconName } from 'lucide-react'`.
- **Accesibilidad:** Proveer `aria-hidden="true"` para iconos decorativos; para iconos funcionales, usar `role="img"` y `aria-label` o envolver en elementos con texto visible.

## Componentes y shadcn

- **Prioridad:** Intentar siempre usar el componente equivalente de `shadcn` antes de escribir markup personalizado.
- **Fallback accesible:** Si no existe componente, crear componente con props estándares (`id`, `className`, `aria-*`) y asegurar keyboard support y tests de accesibilidad.

## Responsividad y utilidades Tailwind

- **Mobile-first:** Implementación mobile-first. Empezar estilos base para móvil y añadir `sm:`, `md:`, `lg:`, `xl:` para adaptaciones.
- **Breakpoints mínimos:** Probar en `320px`, `768px`, `1024px`, `1280px`.

## Glassmorphism — reglas prácticas

- **Capas:** Separar `surface color` y `overlay` (ej.: `background` + `glass-overlay: rgba(255,255,255,0.06)`). Calcular contraste considerando la mezcla final. Si el contraste cae por debajo de AA, aumentar opacidad o modificar color del foreground.
- **Textos sobre vidrio:** Evitar colocar texto directamente sobre imágenes con vidrio sin una capa de contraste adicional (overlay). Preferir `backdrop-blur` con overlay semitransparente.

## Validación y checklist en Pull Requests

Antes de mergear, el autor debe confirmar (PR checklist):

- [ ] Todos los colores usados provienen de `src/styles/globals.css` o se creó la variable nueva allí.
- [ ] Las paletas nuevas fueron definidas en Oklch y documentadas en `globals.css`.
- [ ] Todas las interacciones y textos pasan la verificación de contraste (adjuntar captura o reporte de Lighthouse/axe).
- [ ] Todos los iconos usados son de `lucide-react`.
- [ ] Se usaron componentes de `shadcn` cuando existían; si no, se documentó la razón.
- [ ] Componentes son responsivos usando `sm`, `md`, `lg`, `xl` y se probaron en las resoluciones mínimas.
- [ ] Inputs y controles tienen labels y atributos ARIA apropiados.

## Notas operativas

- Para cambios mayores de paleta (por ejemplo, introducir tema `white`), primero proponer el patch en un PR separado que modifique únicamente `src/styles/globals.css` y la documentación, luego aplicar cambios en componentes.
- Mantener este archivo actualizado cada vez que se añadan variables nuevas.

## Reglas técnicas adicionales (obligatorio)

1. Directivas de Renderizado (Client vs. Server Components)
   - El problema: En App Router, los componentes son de servidor por defecto, pero el frontend interactivo (y casi todo Shadcn UI) necesita correr en el cliente.
   - Regla: Todo componente de UI interactivo (que use hooks como `useState`, `useEffect`, `onClick`, o componentes de `shadcn` que requieran interactividad) debe incluir explícitamente la directiva `"use client"` en la primera línea del archivo. Mantener los Server Components limpios para fetch de datos.

2. Sincronización con `tailwind.config`
   - El problema: Si el agente crea variables en `globals.css`, Tailwind no las reconocerá automáticamente como clases utilitarias.
   - Regla: Toda variable nueva creada en `src/styles/globals.css` debe ser mapeada inmediatamente en `tailwind.config.ts` (o `tailwind.config.js`) dentro del objeto `extend.colors`. Esto asegura que se puedan usar clases de utilidad limpias de Tailwind (ej. `bg-card`, `text-card-foreground`) en lugar de `bg-[var(--...)]`.

3. Manejo de Dark/Light Mode
   - El problema: El soporte de temas debe estar estructurado para que librerías como `next-themes` puedan alternar sin recargar la página.
   - Regla: El soporte para temas debe implementarse dividiendo las variables en `@layer base` dentro de `globals.css`. Usar `:root` para el Light Mode y la clase `.dark` para el Dark Mode, asegurando que `next-themes` (o equivalente) pueda alternar entre ellos en tiempo de ejecución.
