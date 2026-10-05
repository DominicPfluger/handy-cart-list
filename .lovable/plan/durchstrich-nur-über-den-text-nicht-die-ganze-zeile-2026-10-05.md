# Durchstrich nur über den Text, nicht die ganze Zeile

## Problem
In der Einkaufsliste wird der Produktname beim Abhaken weich durchgestrichen (`.strike-animate`, animierter Hintergrund-Strich). Der Name ist ein Blockelement (`<p>` in `src/routes/index.tsx`, Zeile 558), das die volle Zeilenbreite einnimmt — der Strich läuft dadurch über die ganze Zeile, auch rechts neben kurzen Namen.

## Lösung
In `src/styles.css` bei `.strike-animate` ergänzen:

```css
.strike-animate {
  width: fit-content;
  max-width: 100%;
  ...
}
```

- `width: fit-content` macht das Element so breit wie der Text (bei langen Namen umbrochen auf max. 100 %, `break-words` bleibt wirksam).
- Der Strich endet damit genau am Textende; mehrzeilige Namen werden weiterhin über die Textbreite durchgestrichen.
- Keine Änderung in `index.tsx` oder an der Animation selbst; Kaufmodus und andere Stellen nutzen die Klasse nicht.

## Verify
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Check: Artikel abhaken, Strich endet am Wortende; langer, umbrochener Name wird sauber durchgestrichen; Abwählen animiert zurück.
