# Jurnal de modificări

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
