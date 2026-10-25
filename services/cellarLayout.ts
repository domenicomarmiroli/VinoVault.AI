import { CellarSlot, Location, LocationKind, LocationLayout, Wine } from '../types';

export const LAYOUT_LIMITS = { columns: 12, shelves: 25, bottlesPerShelf: 20 };

export const is3DLocation = (loc?: Location | null): loc is Location & { layout: LocationLayout } =>
  !!loc && (loc.kind === 'rack' || loc.kind === 'fridge') && !!loc.layout && loc.layout.columns.length > 0;

export const defaultLayout = (kind: LocationKind): LocationLayout | undefined => {
  if (kind === 'rack') return { columns: Array.from({ length: 3 }, () => ({ shelves: 6, bottlesPerShelf: 6 })) };
  if (kind === 'fridge') return { columns: [{ shelves: 6, bottlesPerShelf: 6 }] };
  return undefined;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v) || min));

export const sanitizeLayout = (kind: LocationKind, layout?: LocationLayout): LocationLayout | undefined => {
  if (kind === 'generic' || !layout) return undefined;
  const cols = (kind === 'fridge' ? layout.columns.slice(0, 1) : layout.columns.slice(0, LAYOUT_LIMITS.columns))
    .map(c => ({ shelves: clamp(c.shelves, 1, LAYOUT_LIMITS.shelves), bottlesPerShelf: clamp(c.bottlesPerShelf, 1, LAYOUT_LIMITS.bottlesPerShelf) }));
  return cols.length ? { columns: cols } : defaultLayout(kind);
};

export const layoutCapacity = (layout?: LocationLayout) =>
  (layout?.columns || []).reduce((s, c) => s + c.shelves * c.bottlesPerShelf, 0);

export const slotInRange = (layout: LocationLayout, slot: CellarSlot) => {
  const col = layout.columns[slot.column];
  if (!col || slot.shelf < 0 || slot.shelf >= col.shelves) return false;
  return slot.position === undefined || (slot.position >= 0 && slot.position < col.bottlesPerShelf);
};

// I ripiani si numerano dall'alto, come si leggono guardando lo scaffale.
export const shelfLabel = (layout: LocationLayout, column: number, shelf: number) =>
  (layout.columns[column]?.shelves || 0) - shelf;

export const formatSlot = (layout: LocationLayout | undefined, slot: CellarSlot, kind?: LocationKind) => {
  if (!layout) return '';
  const parts: string[] = [];
  if (kind !== 'fridge' && layout.columns.length > 1) parts.push(`Col. ${slot.column + 1}`);
  parts.push(`Ripiano ${shelfLabel(layout, slot.column, slot.shelf)}`);
  if (slot.position !== undefined) parts.push(`Posto ${slot.position + 1}`);
  return parts.join(' · ');
};

export const slotKey = (column: number, shelf: number, position: number) => `${column}-${shelf}-${position}`;

export interface PlacedBottle {
  wine: Wine;
  slotIndex: number;
  column: number;
  shelf: number;
  position: number;
  approximate: boolean;
}

// Calcola dove disegnare ogni bottiglia: prima quelle con posto esatto,
// poi quelle assegnate solo al ripiano nei primi posti liberi.
export const computeOccupancy = (layout: LocationLayout, wines: Wine[]) => {
  const placed: PlacedBottle[] = [];
  const taken = new Map<string, PlacedBottle>();
  const shelfOnly: { wine: Wine; slotIndex: number; slot: CellarSlot }[] = [];

  wines.forEach(wine => {
    (wine.cellarSlots || []).slice(0, Math.max(0, wine.quantity)).forEach((slot, slotIndex) => {
      if (!slotInRange(layout, slot)) return;
      if (slot.position === undefined) { shelfOnly.push({ wine, slotIndex, slot }); return; }
      const key = slotKey(slot.column, slot.shelf, slot.position);
      if (taken.has(key)) return;
      const p = { wine, slotIndex, column: slot.column, shelf: slot.shelf, position: slot.position, approximate: false };
      taken.set(key, p);
      placed.push(p);
    });
  });

  shelfOnly.forEach(({ wine, slotIndex, slot }) => {
    const col = layout.columns[slot.column];
    for (let pos = 0; pos < col.bottlesPerShelf; pos++) {
      const key = slotKey(slot.column, slot.shelf, pos);
      if (!taken.has(key)) {
        const p = { wine, slotIndex, column: slot.column, shelf: slot.shelf, position: pos, approximate: true };
        taken.set(key, p);
        placed.push(p);
        return;
      }
    }
  });

  return { placed, taken };
};

export const pruneSlotsForLayout = (wine: Wine, layout?: LocationLayout): CellarSlot[] => {
  if (!layout) return [];
  return (wine.cellarSlots || []).filter(s => slotInRange(layout, s));
};
