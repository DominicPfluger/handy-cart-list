import type { CatalogDepartment } from "./catalog-query";

/**
 * Farbzuordnung für die Hauptkategorien der Abteilungsansicht.
 * Schlüssel ist der deutsche Basisname (baseName) der Kategorie —
 * stabil gegenüber Übersetzungen und persönlichen Umbenennungen.
 */
const ROOT_COLORS: Record<string, string> = {
  "Frischmarkt": "var(--cat-frischmarkt)",
  "Milchprodukte & Eier": "var(--cat-milch)",
  "Fleisch & Fisch": "var(--cat-fleisch)",
  "Frisch-Produkte & Delikatessen": "var(--cat-deli)",
  "Backwaren & Frühstück": "var(--cat-backwaren)",
  "Vorräte": "var(--cat-vorraete)",
  "Kochzutaten": "var(--cat-kochzutaten)",
  "Tiefkühlprodukte": "var(--cat-tiefkuehl)",
  "Getränke": "var(--cat-getraenke)",
  "Salzige Snacks": "var(--cat-snacks)",
  "Süsses": "var(--cat-suess)",
  "Körperpflege": "var(--cat-koerperpflege)",
  "Haushalt": "var(--cat-haushalt)",
  "Apotheke & Drogerie": "var(--cat-apotheke)",
  "Tierbedarf": "var(--cat-tierbedarf)",
  "Büroartikel": "var(--cat-buero)",
  "Tabak & Dampfen": "var(--cat-tabak)",
  "Kleidung & Textilien": "var(--cat-kleidung)",
  "Küchenutensilien": "var(--cat-kuechenutensilien)",
  "Autozubehör": "var(--cat-auto)",
};

/** Wurzelkategorie einer Kategorie ermitteln (steigt den parentId-Baum hinauf). */
export function rootOf(
  department: CatalogDepartment,
  byId: Map<string, CatalogDepartment>,
): CatalogDepartment {
  let current = department;
  let guard = 0;
  while (current.parentId && guard++ < 20) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

/**
 * CSS-Farbwert für eine Kategorie. Unterkategorien erben die Farbe ihrer
 * Wurzelkategorie. Unbekannte/eigene Kategorien fallen auf das bisherige
 * Hellgrün zurück (undefined → Caller nutzt Standardklasse).
 */
export function deptColor(
  department: CatalogDepartment,
  byId: Map<string, CatalogDepartment>,
): string | undefined {
  return ROOT_COLORS[rootOf(department, byId).baseName];
}
