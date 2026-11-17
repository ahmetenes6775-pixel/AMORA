import { ENDING_CATALOG, EndingKind } from '../data/gameData';

const STORAGE_KEY = 'amora_unlocked_endings_v1';
const VALID_ENDING_IDS = new Set<EndingKind>(ENDING_CATALOG.map((e) => e.id));

export function normalizeEndings(raw: unknown): EndingKind[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<EndingKind>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_ENDING_IDS.has(item as EndingKind)) {
      seen.add(item as EndingKind);
    }
  }
  return ENDING_CATALOG.map((e) => e.id).filter((id) => seen.has(id));
}

export function loadLocalEndings(): EndingKind[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeEndings(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveLocalEndings(endings: EndingKind[]): EndingKind[] {
  const normalized = normalizeEndings(endings);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage quota errors
    }
  }
  return normalized;
}

export function mergeEndings(a: EndingKind[], b: EndingKind[]): EndingKind[] {
  return normalizeEndings([...a, ...b]);
}
