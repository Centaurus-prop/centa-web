# Diseño — Panel admin de usuarios + cambio obligatorio de contraseña

**Issue:** TEN-272 · **Plan padre:** TEN-270 (rev 2) · **Autor:** Sage (Product Designer)
**Estado:** spec lista para implementación

> Diseño anclado al design-system existente: tokens de marca en `globals.css`,
> primitivos shadcn/`@base-ui/react` en `src/components/ui/`, átomos en
> `src/components/atoms/`, patrón de dashboard en `src/app/dashboard/`.
> Todo lo que se especifica abajo se expresa en términos de **lo que ya existe**;
> los componentes nuevos se marcan explícitamente como **[propuesta de sistema]**.

---

## 0. Resumen de la arquitectura aprobada (rev 2)

Contexto de diseño que define los flujos:

- **Sin servicio de email en v1.** La contraseña temporal se comunica fuera de
  banda (verbal, chat, SMS). El admin la ve **una sola vez** al crear el usuario
  o al resetearla.
- **Flag `mustChangePassword`** en el usuario. Cuando es `true`, al ingresar
  aparece un **modal bloqueante** que obliga a cambiar la contraseña antes de
  usar el dashboard. El mismo mecanismo cubre los resets iniciados por el admin.
- **Roles** (de `session-token.ts`): `admin`, `asesor`, `revisor`.
- `/dashboard/admin` ya está restringida a `admin` en `dashboard-routes.ts`.

---

## 1. Tokens y primitivos a usar (no inventar valores)

| Necesidad | Token / clase existente |
|---|---|
| Color primario / acciones | `centa-green-1` (#003A2A), `bg-primary` |
| Acento lima | `centa-green-3` — **solo sobre fondo verde oscuro** (no es legible sobre blanco; ver A11y) |
| Texto secundario | `text-muted-foreground` / `text-centa-muted-1` (#5f6b66) |
| Texto terciario | `text-centa-muted-2` (#7b8782) |
| Éxito | `centa-success` (#25D366) |
| Destructivo | `variant="destructive"` (Button/Badge) / `text-destructive` |
| Bordes suaves | `border-centa-border-soft` (#d9e1db) / `border-border` |
| Superficie panel | clase `surface-panel` (rounded-2xl + border + bg-card + shadow-sm) |
| Tarjeta blanca | `bg-white … ring-1 ring-black/[0.04] shadow-sm` (patrón de `asesores/page.tsx`) |
| Tipografía mono (contraseña) | `--font-geist-mono` → `font-mono` |
| Radios | escala `--radius-*` (no px sueltos) |

Componentes existentes reutilizados: `Button` (variants `default|outline|secondary|ghost|destructive|link`; sizes `default|sm|icon|icon-sm|icon-lg`), `Badge` (`default|secondary|destructive|outline`), `Dialog` (+ `DialogHeader/Title/Description/Trigger/Content/Close`), `Input`, `Select`, `Separator`, átomos `PageHeader` y `EmptyState`, helper `getInitials`.

### Propuestas de sistema (componentes nuevos)

Ninguna requiere dependencias npm nuevas (todo sobre `@base-ui/react` o markup + tokens). Se enumeran para que el dueño del design-system las acepte/difiera:

1. **`ui/table.tsx`** — primitivo shadcn de tabla (`Table/THead/TBody/TR/TH/TD`). Markup semántico estilizado con tokens. Reutilizable en futuras vistas tabulares (leads, métricas).
2. **`ui/dropdown-menu.tsx`** — menú de acciones por fila, sobre `@base-ui/react/menu` (mismo proveedor que `Dialog`/`Button`). Reutilizable en cualquier tabla/card con acciones.
3. **`ui/skeleton.tsx`** — bloque de carga (`animate-pulse bg-muted rounded-md`). Para el estado loading de la tabla.
4. **`molecules/password-field.tsx`** — `Input type="password"` + toggle mostrar/ocultar (Button `ghost` `icon-sm` con `Eye`/`EyeOff`). Reutilizable en login y resets.
5. **`molecules/password-strength-meter.tsx`** — barra de fuerza + lista de requisitos. Usado en el modal obligatorio (y en cualquier set de contraseña).
6. **`molecules/copyable-secret.tsx`** — campo de solo-lectura mono + botón Copiar con feedback. Usado en la vista de contraseña temporal.

> No se incorpora librería de toasts (no está en `package.json`). El feedback de
> éxito se resuelve con paneles de resultado dentro del diálogo y mensajes
> inline (patrón ya usado en los forms). Un sistema de toast queda como mejora futura.

---

## 2. Deliverable 1 — Página `/dashboard/admin`

### 2.1 Layout

Sigue el patrón de página de dashboard: contenedor `space-y-6`, `PageHeader`
arriba, contenido debajo.

```
┌────────────────────────────────────────────────────────────────────┐
│  Usuarios                                       [ + Nuevo usuario ]  │  ← PageHeader (title + actions)
│  4 usuarios con acceso al panel.                                     │     description = conteo
├────────────────────────────────────────────────────────────────────┤
│  [ 🔍 Buscar por nombre o email      ]   [ Rol: Todos ▾ ]            │  ← toolbar (filtros, opcional/progresivo)
├────────────────────────────────────────────────────────────────────┤
│  USUARIO            ROL        ESTADO     ÚLTIMO INGRESO       ·      │  ← <thead> (uppercase, text-xs, muted)
│  ── avatar ──────────────────────────────────────────────────────   │
│  (MG) María García   [Admin]   ● Activo   09 jun 2026, 14:20    ⋯   │  ← fila
│       maria@centa.com                                                │
│  (JP) Juan Pérez      [Asesor]  ○ Inactivo  —                   ⋯   │
│       juan@centa.com                                                 │
│  …                                                                   │
└────────────────────────────────────────────────────────────────────┘
```

`PageHeader`:
- `title="Usuarios"`
- `description={`${n} usuario${n===1?"":"s"} con acceso al panel.`}`
- `actions`: botón primario **Nuevo usuario** (`<Button>` default con icono `Plus`, abre el Dialog de alta — sección 3).

### 2.2 Toolbar (búsqueda + filtro) — progresivo

- Input de búsqueda (`Input` con icono `Search` inline-start) → filtra por nombre/email en cliente.
- `Select` de rol: `Todos | Admin | Asesor | Revisor`.
- En mobile se apilan a una columna (`flex flex-col gap-3 sm:flex-row sm:items-center`).
- **Si el volumen de usuarios es bajo (<8)**, la toolbar puede diferirse a una segunda iteración sin bloquear el deliverable. Marcar como nice-to-have.

### 2.3 Tabla — desktop (`md:` y arriba)

Usa **`ui/table.tsx` [propuesta]**, `<table>` semántico con `<caption className="sr-only">Usuarios con acceso al panel</caption>`.

Columnas:

| Columna | Contenido | Notas |
|---|---|---|
| **Usuario** | Avatar (círculo `size-9`, `bg-centa-green-1 text-centa-green-3`, `getInitials`) + nombre (`font-semibold text-centa-black`) + email (`text-xs text-muted-foreground`) apilados | reutiliza el bloque avatar de `asesores/page.tsx` |
| **Rol** | `Badge variant="secondary"` con `ROLE_LABELS[role]` | Admin/Asesor/Revisor |
| **Estado** | Punto + texto: `● Activo` (`text-centa-success`) / `○ Inactivo` (`text-muted-foreground`) | no depende solo del color (lleva texto) |
| **Último ingreso** | Fecha formateada `Intl.DateTimeFormat("es-AR")` o `—` si nunca ingresó | mismo formatter que asesores |
| **Acciones** | Botón `⋯` (`Button variant="ghost" size="icon-sm"`, `MoreHorizontal`) que abre **DropdownMenu [propuesta]** | alineado a la derecha |

`<thead>`: `text-xs font-semibold uppercase tracking-wider text-centa-muted-1`, fila con `border-b border-border`. Filas: `border-b border-border/60`, `hover:bg-muted/40`, padding `px-4 py-3`.

### 2.4 Menú de acciones por fila (DropdownMenu)

Ítems, en este orden (agrupados por destructividad — Gestalt proximity + separador):

1. **Editar** (icono `Pencil`) → abre Dialog de edición (sección 3).
2. **Resetear contraseña** (icono `KeyRound`) → confirma y genera contraseña temporal (sección 4).
3. — separador —
4. **Activar** / **Desactivar** (icono `UserCheck` / `UserX`) → toggle de estado, ítem con tono `text-destructive` cuando es "Desactivar".

**Reglas de protección (error prevention / forgiveness):**
- Si el usuario es el **único admin activo**, los ítems **Desactivar** y (en edición) cambiar el rol fuera de `admin` quedan **deshabilitados** con tooltip/nota: *"No podés dejar el panel sin administradores."*
- "Desactivar" y "Resetear contraseña" piden **confirmación** (ver 2.5). No se borran usuarios en v1 (solo activar/desactivar) — evita acción irreversible.

> Nota: "cambiar rol" del enunciado se resuelve **dentro del Dialog de edición**
> (campo Rol), no como acción suelta — evita duplicar el control (Occam) y
> mantiene el menú corto (Hick's Law: 3 acciones visibles).

### 2.5 Confirmación de acciones sensibles

Reutiliza `Dialog` como `AlertDialog` ligero (no hay AlertDialog propio; se compone con `Dialog` + dos botones):

- **Desactivar:** título *"¿Desactivar a {nombre}?"*, copy *"No podrá ingresar al panel hasta que lo reactivés."*, botones `Cancelar` (ghost) / `Desactivar` (destructive).
- **Resetear contraseña:** título *"¿Resetear la contraseña de {nombre}?"*, copy *"Se generará una contraseña temporal nueva. La actual dejará de funcionar y {nombre} deberá cambiarla en su próximo ingreso."*, botones `Cancelar` / `Resetear` (default). Al confirmar → vista de contraseña temporal (sección 4).

### 2.6 Tabla — mobile (`< md`)

Patrón responsive accesible: en mobile la tabla colapsa a **tarjetas apiladas**
(no scroll horizontal). Cada usuario = una card (`surface-panel` o el patrón
`bg-white ring-1 ring-black/[0.04]` de asesores):

```
┌──────────────────────────────────────┐
│ (MG) María García              ⋯      │
│      maria@centa.com                  │
│ [Admin]            ● Activo           │
│ Último ingreso: 09 jun 2026           │
└──────────────────────────────────────┘
```

- El `⋯` abre el mismo DropdownMenu.
- Targets táctiles ≥ 40px (ver A11y).
- Implementación: `hidden md:table` para la tabla, `grid gap-3 md:hidden` para las cards. Una sola fuente de datos, dos presentaciones.

### 2.7 Estados de la página

- **Loading** (`loading.tsx` del segmento o Suspense): 4–6 filas **Skeleton [propuesta]** (avatar circular + dos líneas + chip). Mantener altura de fila para evitar layout shift (Doherty <400ms percibido).
- **Empty:** `EmptyState` (icono `Users`, título *"Todavía no hay usuarios"*, descripción *"Creá el primer usuario para darle acceso al panel."*, `action` = botón **Nuevo usuario**). Caso borde: en la práctica siempre existe el admin actual, pero se cubre igual.
- **Error:** se apoya en el `error.tsx` existente del dashboard.
- **Fila en progreso** (toggle activar/desactivar / reset): el ítem muestra `Loader2 animate-spin`; la fila se atenúa (`opacity-60 pointer-events-none`) hasta resolver. Feedback inline en error (mensaje `text-destructive`).

### 2.8 Navegación

Agregar el ítem al `NAV_ITEMS` de `dashboard-nav.tsx`:

```ts
{ href: "/dashboard/admin", label: "Usuarios", icon: ShieldCheck }
```

El filtro `canAccessDashboardRoute` ya lo oculta a no-admins (regla existente en `dashboard-routes.ts`). Icono sugerido: `ShieldCheck` o `UserCog` (distinto de `Users`, que ya usa "Asesores").

---

## 3. Deliverable 2 — Dialog de alta / edición de usuario

Un único componente `UserFormDialog` con prop `mode: "create" | "edit"`. Mismo
patrón que `create-property-button.tsx` (Dialog + `DialogTrigger render` /
control externo + form con `useActionState`).

### 3.1 Estructura

`DialogContent` (`sm:max-w-md`, una sola columna — best practice de forms):

- `DialogHeader` → `DialogTitle`: *"Nuevo usuario"* / *"Editar usuario"*; `DialogDescription`: *"Tendrá acceso al panel según su rol."*
- Form, campos en columna única (`flex flex-col gap-1.5` por campo, label con `text-sm font-medium text-centa-black`, igual a los forms existentes):

| Campo | Control | Reglas |
|---|---|---|
| **Nombre** | `Input` text | requerido |
| **Email** | `Input type="email"` | requerido, formato válido; en `edit` editable (o read-only si el backend lo fija — decisión de ingeniería) |
| **Rol** | `Select` (`Admin/Asesor/Revisor`) | requerido; default `asesor` en create |
| **Teléfono** | `Input type="tel"` | opcional; placeholder `+54 9 11 …` |

- Footer: `Cancelar` (ghost, cierra) + submit **Crear usuario** / **Guardar cambios** (default, con `Loader2` mientras `isPending`).

### 3.2 Validación (inline, forgiveness)

- Validación nativa + `aria-invalid` en error; mensaje bajo el campo (`text-sm text-destructive`).
- Email duplicado → error del server mostrado bajo el campo Email: *"Ya existe un usuario con ese email."*
- No se valida contraseña acá: en **create** la genera el sistema; en **edit** no se toca la contraseña (eso es "Resetear contraseña").

### 3.3 Transición create → contraseña temporal

Al crear con éxito, el contenido del **mismo diálogo** se reemplaza por la vista
de contraseña temporal (sección 4) — el admin no pierde el contexto y ve el
secreto inmediatamente. En **edit**, el éxito cierra el diálogo y refresca la
fila (mensaje inline de confirmación opcional).

### 3.4 Estados

- **Default/empty:** submit habilitado; validación al enviar.
- **Validación:** errores inline por campo.
- **Pending:** submit con spinner, campos `disabled`.
- **Error de server:** banner inline al pie del form (`text-sm text-destructive`).
- **Éxito (create):** → vista de contraseña temporal. **Éxito (edit):** cierre + refresh.

---

## 4. Deliverable 3 — Vista "contraseña temporal generada" (una sola vez)

Se muestra **dentro del diálogo** tras crear un usuario o tras confirmar un
reset. Componente: panel de resultado que usa **`copyable-secret.tsx` [propuesta]**.

```
        ┌─────────────────────────────────────────┐
        │            ✓  (círculo success)          │
        │         Usuario creado                    │
        │  Compartí esta contraseña con María por   │
        │  un canal seguro. Deberá cambiarla en su  │
        │  primer ingreso.                          │
        │                                           │
        │  CONTRASEÑA TEMPORAL                       │
        │  ┌───────────────────────────┬─────────┐  │
        │  │  Xy7$kP2m-q9            (mono) │ Copiar │  │
        │  └───────────────────────────┴─────────┘  │
        │                                           │
        │  ⚠  Guardala ahora. Por seguridad no se   │  ← callout
        │     vuelve a mostrar.                     │
        │                                           │
        │                         [   Listo   ]     │
        └─────────────────────────────────────────┘
```

### 4.1 Composición

- **Ícono de éxito:** círculo `size-12`, `bg-centa-success/10 text-centa-success`, icono `Check` (mismo lenguaje que el círculo de `EmptyState`).
- **Título:** *"Usuario creado"* / *"Contraseña restablecida"* (`text-lg font-semibold text-centa-black`, o `DialogTitle`).
- **Copy contextual:** *"Compartí esta contraseña con {nombre} por un canal seguro. Deberá cambiarla en su primer ingreso."* (`text-sm text-muted-foreground`).
- **CopyableSecret:** label `CONTRASEÑA TEMPORAL` (`text-xs uppercase tracking-wider text-centa-muted-1`); campo read-only mono (`font-mono text-base`, `bg-muted`, `border-border`, `rounded-lg`, seleccionable) + botón **Copiar** (`Button variant="outline" size="sm"`, icono `Copy`). Al copiar → el botón cambia a `Copiado ✓` (icono `Check`, `text-centa-success`) por ~2 s, y se anuncia por `aria-live="polite"`.
- **Callout de advertencia (loss aversion, framing claro):** caja `rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm` con icono `AlertTriangle`, texto *"Guardala ahora. Por seguridad no se vuelve a mostrar."*
  > `amber-*` son utilidades Tailwind; si el dueño del sistema prefiere, se promueve a tokens `--color-centa-warning*`. **[propuesta de token]**
- **Acción:** botón **Listo** (default) que cierra el diálogo y refresca la tabla.

### 4.2 Estados

- **Default:** secreto visible y copiable.
- **Copiado:** confirmación efímera en el botón + `aria-live`.
- **Error de copiado** (clipboard denegado): el campo queda seleccionable manualmente; nota *"Seleccioná y copiá manualmente."*
- No hay estado "volver a ver": es intencional (one-time reveal). Para recuperar acceso, el admin usa **Resetear contraseña**.

### 4.3 Ética / seguridad

- No es dark pattern: el secreto se muestra para que el admin lo entregue; la
  advertencia es honesta (no genera urgencia falsa).
- No registrar la contraseña en logs ni analytics; no autocompletar. (Nota para ingeniería — no es decisión de diseño pero se documenta.)

---

## 5. Deliverable 4 — Modal de bienvenida / cambio obligatorio (primer ingreso)

Se renderiza en `dashboard/layout.tsx` (o en un wrapper cliente) cuando
`session.mustChangePassword === true`. **Bloquea todo el dashboard.**

```
   ╔═══════════════════════════════════════════╗
   ║  ¡Bienvenida, María! 👋                    ║
   ║  Como es tu primer ingreso, creá una        ║
   ║  contraseña nueva para proteger tu cuenta.  ║
   ║                                             ║
   ║  Nueva contraseña                           ║
   ║  ┌─────────────────────────────────┬───┐   ║
   ║  │ ••••••••••                       │ 👁 │   ║  ← PasswordField (toggle ver)
   ║  └─────────────────────────────────┴───┘   ║
   ║  ▓▓▓▓▓▓░░░░  Media                          ║  ← strength meter
   ║  ✓ 8+ caracteres   ✓ número   ○ símbolo     ║  ← requisitos (recognition)
   ║                                             ║
   ║  Repetir contraseña                         ║
   ║  ┌─────────────────────────────────┬───┐   ║
   ║  │ ••••••••••                       │ 👁 │   ║
   ║  └─────────────────────────────────┴───┘   ║
   ║                                             ║
   ║          [    Guardar y continuar    ]      ║
   ║                Cerrar sesión                 ║  ← escape (no roach motel)
   ╚═══════════════════════════════════════════╝
            (overlay oscuro sobre todo el dashboard)
```

### 5.1 Comportamiento de bloqueo

- `Dialog` con **cierre deshabilitado**: sin botón X (`showCloseButton={false}`),
  sin cerrar por click en overlay ni por `ESC` (props de `@base-ui/react/dialog`:
  `dismissible={false}` / equivalentes — ingeniería ajusta el flag exacto).
- El dashboard detrás queda inerte (overlay + focus trap del Dialog).
- **Escape legítimo:** link **Cerrar sesión** (no atrapar al usuario — anti
  roach-motel). Cierra sesión y vuelve a `/login`.

### 5.2 Campos y validación

- **PasswordField "Nueva contraseña"** [propuesta]: `Input type="password"` + toggle ojo (`Eye`/`EyeOff`, `Button ghost icon-sm`, `aria-label="Mostrar contraseña"`).
- **PasswordStrengthMeter** [propuesta]:
  - Barra de 4 segmentos; nivel = longitud + variedad (minús/mayús/número/símbolo).
  - Niveles y color: **Débil** `bg-destructive`, **Media** `bg-amber-500`, **Fuerte** `bg-centa-success`.
  - **No depende solo del color:** etiqueta de texto ("Débil/Media/Fuerte") + lista de requisitos con check/círculo.
  - Requisitos mínimos: **≥ 8 caracteres** (regla dura; alinear con la validación del backend). Recomendado: incluir número y símbolo (suben la fuerza, no son obligatorios salvo que backend lo exija).
  - `aria-live="polite"` para anunciar cambios de fuerza.
- **PasswordField "Repetir contraseña"**: debe coincidir.
- **Submit "Guardar y continuar"**: `disabled` hasta que (a) cumpla el mínimo y (b) ambas coincidan. Con `Loader2` mientras procesa.

### 5.3 Estados

- **Empty/initial:** submit deshabilitado; meter vacío; sin errores (no gritar antes de tiempo — validación on-change suave, error de mismatch on-blur).
- **Contraseña débil:** meter rojo "Débil", requisitos sin cumplir, submit deshabilitado, hint *"Usá al menos 8 caracteres."*
- **No coinciden:** error inline bajo "Repetir contraseña" (`text-destructive`): *"Las contraseñas no coinciden."*
- **Error de server:** banner al pie (`text-destructive`).
- **Éxito:** el modal se cierra, el dashboard se desbloquea; confirmación breve inline/banner *"Contraseña actualizada."* (`mustChangePassword` pasa a `false`).

### 5.4 Copy (es-AR, tono cálido y claro)

- Título: *"¡Bienvenida, {nombre}!"* / *"¡Bienvenido, {nombre}!"* — si el género es desconocido, usar *"¡Hola, {nombre}!"* (inclusivo, sin asumir género).
- Subtítulo: *"Como es tu primer ingreso, creá una contraseña nueva para proteger tu cuenta."*
- Botón: *"Guardar y continuar"*.

---

## 6. Accesibilidad (transversal, WCAG POUR)

- **Semántica:** tabla real con `<caption>` sr-only y `<th scope="col">`; diálogos con `DialogTitle`/`DialogDescription` (base-ui cablea `aria-labelledby/҂describedby`).
- **Labels:** cada input con `<label>` asociado (patrón de wrap ya usado). Toggles de ojo y botón copiar con `aria-label`.
- **No solo color:** estado Activo/Inactivo lleva texto; fuerza de contraseña lleva etiqueta + requisitos; errores llevan texto, no solo borde.
- **Contraste:** `centa-muted-1` (#5f6b66) sobre blanco ≈ 5.6:1 (AA ok). **No usar `centa-green-3` (lima) como texto sobre blanco** — bajo contraste; reservarlo para texto sobre `centa-green-1` (como el avatar y la nav activa).
- **Targets táctiles:** en mobile, el disparador `⋯` y los ítems del menú deben tener ≥ 40px de alto. `Button size="icon-sm"` (28px) es chico para touch — usar `size="icon"` (32px) **con** `p` extra o un área de toque de 44px en la card mobile. Los ítems del DropdownMenu: `min-h-10`.
- **Teclado:** focus trap en todos los diálogos; orden lógico; el modal obligatorio no se cierra con ESC pero **sí** permite tabular hasta "Cerrar sesión". DropdownMenu navegable con flechas (base-ui Menu).
- **Reduced motion:** el `animate-pulse` del skeleton y cualquier transición respetan `prefers-reduced-motion` (ya hay guard global en `globals.css`).
- **aria-live:** confirmación de copiado y cambios de fuerza de contraseña.

---

## 7. Resumen de handoff para ingeniería

**Archivos nuevos (frontend):**

```
src/app/dashboard/admin/page.tsx                 # server component: fetch usuarios + render
src/app/dashboard/admin/loading.tsx              # skeleton de tabla
src/app/dashboard/admin/users-table.tsx          # organismo: tabla desktop + cards mobile
src/app/dashboard/admin/user-form-dialog.tsx     # alta/edición (mode prop)
src/app/dashboard/admin/temp-password-panel.tsx  # vista de contraseña temporal
src/app/dashboard/admin/row-actions.tsx          # DropdownMenu por fila + confirmaciones
src/app/dashboard/admin/actions.ts               # server actions (create/update/toggle/reset)

src/components/ui/table.tsx                       # [propuesta sistema]
src/components/ui/dropdown-menu.tsx               # [propuesta sistema] (base-ui Menu)
src/components/ui/skeleton.tsx                    # [propuesta sistema]
src/components/molecules/password-field.tsx       # [propuesta sistema]
src/components/molecules/password-strength-meter.tsx  # [propuesta sistema]
src/components/molecules/copyable-secret.tsx      # [propuesta sistema]

# Modal obligatorio: se monta en dashboard/layout.tsx vía wrapper cliente
src/components/organisms/force-password-change-dialog.tsx
```

**Editar:** `dashboard-nav.tsx` (agregar ítem `Usuarios`), `dashboard/layout.tsx`
(montar el modal obligatorio según `session.mustChangePassword`),
`session-token.ts` (incluir `mustChangePassword` en `SessionPayload` — coordinar con backend).

**Dependencias de backend (track TEN-270, en paralelo):** columna `mustChangePassword`, endpoints/actions CRUD de usuarios, reset que devuelve la contraseña temporal una sola vez, gate de primer ingreso.

---

## 8. Criterios de aceptación (TEN-272)

- [x] Specs por pantalla, en términos de componentes y tokens existentes → implementable sin ambigüedad.
- [x] Estados cubiertos por flujo: **vacío** (tabla), **error de validación** (forms), **contraseña débil** (meter), **éxito** (panel temporal + cierre del modal).
- [x] Mobile-first: tabla → cards en `< md`; diálogos `w-[calc(100%-2rem)]` + scroll; columna única en forms.
- [x] Accesible: semántica, labels, no-solo-color, teclado, targets táctiles, aria-live (sección 6).
- [x] Propuestas de sistema marcadas explícitamente para aceptación del dueño del design-system (sección 1).

**QA visual (post-implementación):** correr `/design-review` sobre `/dashboard/admin`
a 1440×900 y 390×844, más el modal obligatorio y el panel de contraseña temporal.
```
