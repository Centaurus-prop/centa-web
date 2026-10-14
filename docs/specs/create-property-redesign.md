# Create Property Dialog — Redesign Spec

## Problem
The current form is crammed, uses inconsistent grid columns (3→4→5→3), has a plain textarea for image URLs, and feels flat with no visual sections.

## Files to Modify
- `src/app/dashboard/propiedades/create-local-property-form.tsx` — full rewrite
- `src/app/dashboard/propiedades/create-property-button.tsx` — widen dialog, add scroll
- `src/app/dashboard/propiedades/actions.ts` — adapt `imageUrls` parsing (already receives `string[]`, no change needed)

## New Packages to Install

```bash
npm install react-dropzone @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

| Package | Purpose |
|---------|---------|
| `react-dropzone` | Click-to-browse + drag-and-drop file/URL zone |
| `@dnd-kit/core` | Drag-and-drop engine |
| `@dnd-kit/sortable` | Sortable list for image reordering |
| `@dnd-kit/utilities` | CSS utilities for @dnd-kit |

## Form Layout — Sections

Wrap the form in `<div className="space-y-6">` (was `space-y-4`). Group into 5 sections separated by `<Separator />`:

### Section 1 — Información básica
| Field | Width | Notes |
|-------|-------|-------|
| Título | full (span 2) | `<Input>` |
| Slug | ½ col | optional |
| Descripción | full | `<textarea>` rows={4} |

Grid: `grid gap-4 sm:grid-cols-2`. Título spans 2 cols. Descripción spans 2 cols.

### Section 2 — Precio y specs
| Field | Width | Notes |
|-------|-------|-------|
| Precio | ½ col | type="number" |
| Moneda | ½ col | Select (USD/ARS) |
| m² | ½ col | type="number" |
| Ambientes | ½ col | type="number" |
| Baños | ½ col | type="number" |
| Disponibilidad | ½ col | Select |

Grid: `grid gap-4 sm:grid-cols-2`. Six fields, 3 rows of 2.

### Section 3 — Clasificación
| Field | Width | Notes |
|-------|-------|-------|
| Tipo interno | ½ col | Select (Propiedad/Desarrollo) |
| Categoría | ½ col | Select |
| Estado editorial | ½ col | Select |
| Etapa desarrollo | ½ col | Select |

Grid: `grid gap-4 sm:grid-cols-2`.

### Section 4 — Ubicación
| Field | Width | Notes |
|-------|-------|-------|
| Ubicación | ½ col | |
| Barrio | ½ col | |
| Ciudad | ½ col | default "Buenos Aires" |

Grid: `grid gap-4 sm:grid-cols-2`.

### Section 5 — Imágenes
See **Image Upload Section** below. Full-width.

### Section 6 — Opciones (inline)
- Checkbox "Marcar como destacada" — inline, no extra row
- Error/success message
- Submit button — right-aligned, full visibility (not cut off)

---

## Section Header Pattern
Each section gets a small header:

```tsx
<h3 className="text-xs font-semibold uppercase tracking-wider text-centa-muted-1">
  Información básica
</h3>
```

Followed by a `<Separator className="mb-4" />`.

---

## Image Upload Section — Detailed Spec

### State
```ts
interface ImageItem {
  id: string;          // crypto.randomUUID()
  url: string;         // resolved URL
  preview?: string;    // objectURL for local files (for <img> preview)
  source: "url" | "file";
}
```
Component-local state: `images: ImageItem[]` (ordered array; index 0 = principal).

### Layout
1. **URL input row**: Small `<Input>` + "Agregar URL" `<Button variant="outline">`. User pastes a URL, clicks add → appended to `images`.
2. **Drop zone**: A `react-dropzone` area with:
   - Dashed border (`border-dashed border-2 border-centa-border-soft`)
   - Rounded (`rounded-lg`)
   - Icon: `<Upload>` from lucide-react, muted color
   - Text: "Arrastrá imágenes aquí o hacé clic para seleccionar"
   - `accept: { "image/*": [] }`
   - `multiple`
   - On drop: for each file, create `preview: URL.createObjectURL(file)`, push to `images`
   - ⚠️ Files are NOT uploaded to a server. We show previews and store the `File` objects. On submit, the action receives URLs only (for now). If a file was added, we show a warning or skip it. **Practical compromise**: the drop zone accepts files for preview/reorder UX, but on submit we only send URLs. A future iteration adds actual upload to storage. For files without a URL, we can either skip them or show a toast "Las imágenes locales no se guardan todavía — usá URLs para guardar."
3. **Thumbnail grid**: Below the drop zone, a grid of thumbnails:
   - `grid grid-cols-3 sm:grid-cols-4 gap-3`
   - Each thumbnail: 80×80px square, rounded, `object-cover`, with:
     - **Drag handle**: a grip icon (left side or overlay top-left) — uses `@dnd-kit/sortable`
     - **Delete button**: X icon top-right corner
     - **"Principal" badge**: `<Badge variant="secondary">` on index 0, showing "Principal"
   - Drag reorder updates `images` array order

### Hidden Form Field
A hidden `<input type="hidden" name="imageUrls">` whose value is `images.map(i => i.url).filter(Boolean).join("\n")`. Updated via ref/callback before submit.

### Drag-and-Drop Implementation
```tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
```

- Wrap thumbnail grid in `<DndContext>` + `<SortableContext>`
- Each thumbnail wrapped in a sortable item using `useSortable`
- On `onDragEnd`: `arrayMove(images, oldIndex, newIndex)`

---

## Dialog Wrapper Changes
```tsx
<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
```
- Widen from `sm:max-w-2xl` → `sm:max-w-3xl`
- Increase max height from 85vh → 90vh
- This gives the form more room and prevents the save button from being cut off

---

## Visual Style Tokens
- Section headers: `text-centa-muted-1` (font-semibold uppercase tracking-wider text-xs)
- Labels: `text-sm font-medium text-centa-black` (unchanged)
- Drop zone hover: `bg-centa-accent-soft/30 border-centa-green-2`
- Principal badge: `bg-centa-lime text-centa-green-1`
- Error text: `text-red-600`
- Success text: `text-centa-green-1`
- Separator between sections

---

## Component Structure

```
CreateLocalPropertyForm
├── Section: Información básica
│   ├── Input: título (full)
│   ├── Input: slug (½)
│   └── Textarea: descripción (full)
├── <Separator />
├── Section: Precio y specs
│   ├── Input: precio + Select: moneda (same row)
│   ├── Input: m² + Input: ambientes
│   ├── Input: baños + Select: disponibilidad
├── <Separator />
├── Section: Clasificación
│   ├── Select: tipo + Select: categoría
│   ├── Select: estado editorial + Select: etapa
├── <Separator />
├── Section: Ubicación
│   ├── Input: ubicación + Input: barrio
│   └── Input: ciudad
├── <Separator />
├── Section: Imágenes
│   ├── URL input + Add button
│   ├── Drop zone (react-dropzone)
│   └── Sortable thumbnail grid (@dnd-kit)
│       └── ImageThumbnail × N (sortable items)
│           ├── Preview <img>
│           ├── Drag handle (GripVertical icon)
│           ├── Delete button (X icon)
│           └── Principal badge (index === 0)
├── <Separator />
├── Section: Opciones
│   ├── Checkbox: destacada
│   ├── Status message
│   └── Submit button (right-aligned)
```

---

## Form Submission
On submit:
1. Serialize `images` → `imageUrls` hidden field (URLs joined by newline, files skipped with toast warning)
2. Standard `useActionState` flow (unchanged)
3. On success: reset form + clear `images` state

---

## Accessibility
- Drop zone: keyboard-accessible via react-dropzone defaults
- Sortable items: `@dnd-kit` provides keyboard sensors
- All inputs have associated labels (already the case)
- Delete buttons: `aria-label="Eliminar imagen"`

---

## Notes for Coder
- Keep `SelectField` helper component (refactor to accept `className` for grid spanning if needed)
- The form still uses server actions + `useActionState` — don't change the submission pattern
- `actions.ts` doesn't need changes — it already parses `imageUrls` from newline-separated string
- For the hidden `imageUrls` field, use a `useRef` + set `.value` in an `onSubmit` handler or sync via `useEffect`
- The "local files not saved" warning can be a simple `<p>` under the drop zone, always visible: "Solo se guardan URLs. Las imágenes locales son solo de vista previa."
