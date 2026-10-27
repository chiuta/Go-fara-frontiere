# Jurnal de modificări

## 2.2.0 — 2026-10-27 (anterior: v2.1.0)

Recenzie 2 (2026-10-27).

### Implementat
- 6 probleme tsumego noi (de la 12 la 18), fiecare verificată cu solverul din aplicație (forță brută): soluția stocată = mutările câștigătoare la adâncimea minimă, aceeași mulțime la adâncimea+2, toate mutările greșite refutate, variația principală legală. Nume în RO/EN; traduceri automate în fr/it/es/pt/de/hu (marcate ca atare). Generate/verificate cu `tests/tsume-build.mjs`.
- Test nou `tests/tsume-verify.test.mjs` (92 verificări, 0 eșecuri) care re-rezolvă toate cele 18 probleme.
- Test nou `tests/niveluri-sim.test.mjs`: simulare AI-vs-AI, N=50 pe pereche, 9×9, komi 7,5. Nivel 2 vs 1: 50–0 (z=7,07); nivel 3 vs 1: 50–0 (z=7,07); nivel 3 vs 2: 45–5 (z=5,66). Nivelurile 4–5 nesimulate (prea lente); doar 9×9.
- Problemele noi apar automat și în «Provocarea zilei» (se alege din toate cele 18).

### Neimplementat și de ce
- Estimarea de scor în timpul partidei: există deja (butonul «Estimează teritoriul», estimare prin playout-uri, etichetată ca propunere); nu am adăugat un al doilea număr simplu, deoarece ar fi mai puțin fiabil decât cel existent.
- Statistici comune între jocuri / multiplayer unificat: rămân neimplementate (aplicații separate, izolate).
- Nivelurile AI existau deja (5 niveluri = 0/100/500/2500/10000 iterații); aici s-au adăugat doar verificări prin simulare.

## 2.1.0 — 2026-10-27 (anterior: v2.0.0)

Recenzie 2026-10-27.

### Implementat
- Buton «Începător»: tablă 9×9, AI ușor, reguli chinezești, fără handicap (preset `beginner`), cu notă explicativă, în 8 limbi.
- Remediere: versiunea afișată în subsol era fixată în cod (v 2.0.0); acum 2.1.0.
- Test nou `tests/incepator.test.mjs` (7 verificări).

### Neimplementat și de ce
- Probleme (tsumego) noi: nu au fost adăugate, deoarece fiecare ar trebui verificată de solver (există deja un set verificat).
- Estimare de scor în timpul partidei: neimplementat în această rundă (analizatorul de teritoriu existent rămâne neschimbat).
- AI cu niveluri de dificultate: neimplementat în această rundă (necesită calibrare și teste dedicate pe motorul jocului).
- Statistici comune între jocuri: neimplementat (ar cere un spațiu de stocare partajat între aplicații separate, contrar izolării actuale).
- Mod multiplayer local unificat între jocuri: **planificat**, NU acum; jocurile rămân separate.
