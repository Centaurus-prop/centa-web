# Centa Web — Inmobiliaria

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS 4** + **shadcn/ui** + **class-variance-authority**
- **Drizzle ORM** + **Neon PostgreSQL** (serverless)
- **Lucide React** for icons

## Atomic Design — Estructura de Carpetas

```
src/
├── app/                          # Pages (Next.js App Router)
│   ├── page.tsx                  # Home
│   ├── catalogo/page.tsx         # Catálogo
│   ├── propiedad/[id]/page.tsx   # Detalle propiedad
│   ├── quiennes-somos/page.tsx   # About
│   └── login/page.tsx            # Auth
│
├── components/
│   ├── atoms/                    # Bloques más pequeños, un solo propósito
│   │   ├── button/               # Button + variants
│   │   ├── badge/                # Status badges
│   │   ├── input/                # Form inputs
│   │   ├── icon/                 # Icon wrappers
│   │   └── ...
│   │
│   ├── molecules/                # Composición de 2+ atoms, funcionalidad específica
│   │   ├── property-card/        # Card de propiedad
│   │   ├── search-bar/           # Barra de búsqueda con filtros
│   │   ├── contact-form/         # Formulario de contacto
│   │   ├── nav-link/             # Link de navegación
│   │   └── ...
│   │
│   ├── organisms/                # Secciones completas de UI
│   │   ├── navbar/               # Navegación completa
│   │   ├── hero/                 # Hero section
│   │   ├── property-grid/        # Grid de propiedades con filtros
│   │   ├── footer/               # Footer completo
│   │   ├── services-section/     # Sección de servicios
│   │   ├── cta-section/          # Call to action
│   │   └── ...
│   │
│   ├── templates/                # Layouts de página completos
│   │   ├── home-template.tsx     # Layout de la home
│   │   ├── catalog-template.tsx  # Layout del catálogo
│   │   └── ...
│   │
│   └── ui/                       # shadcn/ui components (no tocar, generados)
│
├── hooks/                        # Custom React hooks
│   ├── use-properties.ts         # Fetch + filter properties
│   ├── use-debounce.ts           # Debounce for search
│   └── ...
│
├── lib/                          # Utilities
│   ├── utils.ts                  # cn(), formatters
│   ├── constants.ts              # App constants
│   └── api.ts                    # API client functions
│
├── types/                        # TypeScript types
│   ├── property.ts               # Property, PropertyCategory, etc.
│   └── index.ts                  # Re-exports
│
└── db/                           # Database
    └── schema.ts                 # Drizzle schema
```

## Reglas de Atomic Design

### Atoms
- **Un solo responsable** — botones, inputs, badges, labels, icons
- Sin lógica de negocio, solo presentación + variantes visuales
- Siempre con TypeScript interface para props
- Usar CVA (`class-variance-authority`) para variantes

### Molecules
- Componen 2+ atoms en una unidad funcional
- Pueden tener estado local mínimo (toggle, input value)
- Sin llamadas a API ni efectos side
- Ejemplo: `PropertyCard` = Card + Badge + Button + Image

### Organisms
- Secciones completas de UI que se pueden usar en cualquier página
- Manejan fetch de datos, estado complejo, lógica de negocio
- Reciben datos via props o los fetchean internamente
- Ejemplo: `PropertyGrid` = SearchBar + array de PropertyCards + pagination

### Templates
- Layouts de página que componen organisms
- No tienen lógica, solo composición
- Las pages importan templates y les pasan los datos

### Pages
- Solo importan templates y hacen data fetching
- Mínima lógica — delegan todo al template

## Naming Conventions

- **Carpetas de componentes**: `kebab-case` (ej: `property-card/`)
- **Archivos**: `index.tsx` dentro de la carpeta + `property-card.tsx` si es el main
- **Exports**: named exports siempre, default export solo en pages si Next.js lo requiere
- **Types**: interface para props, type para unions y utilidades
- **Hooks**: `use-*.ts` con export named

## Design Tokens

Los colores de marca Centa están en `globals.css`:
- `centa-green-1`: #003A2A (primario oscuro)
- `centa-green-2`: #094A35 (primario medio)
- `centa-lime`: #E7FF2D (acento lima)
- `centa-green-3`: #AAEA4E (verde claro)
- `centa-black`: #111111
- `centa-off-white`: #F9F9F9

Usar siempre estos tokens, nunca colores hardcodeados.

## Mejores Prácticas TypeScript + Next.js

1. **Strict mode** — `no any`, `no @ts-ignore`, `no type assertions` innecesarias
2. **Server Components por defecto** — solo agregar `"use client"` cuando se necesita interactividad
3. **Server Actions** para mutaciones, no API routes manuales
4. **`next/image`** para todas las imágenes con `width` y `height` explícitos
5. **Loading/Error boundaries** en cada route segment (`loading.tsx`, `error.tsx`)
6. **Suspense boundaries** para componentes que fetchean datos
7. **Metadata API** para SEO — `generateMetadata` en layouts y pages
8. **Parallel routes** y **intercepting routes** cuando aplique

## Patrones de Código

### Component Pattern
```tsx
// components/molecules/property-card/property-card.tsx
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function PropertyCard({ property, variant = "default", className }: PropertyCardProps) {
  return (
    <article className={cn("...", className)}>
      {/* ... */}
    </article>
  );
}
```

### Hook Pattern
```tsx
// hooks/use-properties.ts
"use client";

import { use } from "react"; // React 19 use()
import type { Property } from "@/types/property";

export function useProperties(filters?: PropertyFilters) {
  // ...
}
```

## Reglas Importantes

1. **No instalar dependencias nuevas** sin consultar — usar lo que ya está en `package.json`
2. **No modificar `components/ui/`** — son componentes de shadcn generados
3. **Mantener funciones < 30 líneas** — si son más largas, extraer helpers
4. **`build` debe pasar** sin errores antes de reportar
5. **Cada componente en su propia carpeta** con su index.tsx
6. **Mobile-first** en todo responsive design
7. **Accesibilidad** — semantic HTML, aria labels, keyboard navigation
