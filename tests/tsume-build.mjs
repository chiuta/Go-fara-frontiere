// GO FĂRĂ FRONTIERE: generator de probleme tsume noi, VERIFICATE de solverul din aplicație (forță brută, tabelă de transpoziții).
// Fiecare problemă: o zonă de ochi (poliomino) înconjurată de piese albe (O) și de un zid negru nemuritor (x); marginile grilei sunt margini reale.
// O problemă intră în set numai dacă (1) scopul e forțabil, (2) mutările câștigătoare la adâncimea minimă coincid cu cele de la adâncimea+2 (stabil),
// (3) variația principală generată duce efectiv la scop. Rezultatul se tipărește ca JSON, gata de lipit în constanta TSUME din index.html.
// Rulare: node tests/tsume-build.mjs            (tipărește doar problemele noi)
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "..", "index.html"), "utf8");
const a = html.indexOf("function GoCoreFactory()"), b = html.indexOf("/* ===== SGF: export");
const c = html.indexOf("function GoTsumeFactory"), d = html.indexOf("/* ===== I18N: interfața");
const ctx = vm.createContext({console, Math, Date, performance, Uint8Array, Uint16Array, Int16Array, Int32Array, Uint32Array, Float64Array, Array, Object, JSON, Number, String, Map, Set, crypto: globalThis.crypto});
vm.runInContext(html.slice(a, b) + "\n" + html.slice(c, d) + "\nthis.__T = GoTsumeFactory(GoCoreFactory());", ctx);
export const T = ctx.__T;

function frame(cells) {
  const w = Math.max(...cells.map(p => p[0])) + 1, h = Math.max(...cells.map(p => p[1])) + 1, W = w + 4, H = h + 4, g = [];
  for (let y = 0; y < H; y++) { let r = ""; for (let x = 0; x < W; x++) r += (x === 0 || y === 0 || x === W - 1 || y === H - 1) ? "x" : (cells.some(p => p[0] === x - 2 && p[1] === y - 2) ? "." : "O"); g.push(r); }
  return g;
}
const SPECS = [
  { id: "domino2-mid-kill", goal: "kill", toPlay: "X", cells: [[0,0],[1,0]], ro: "Doi în linie (omoară)", en: "Two in a row (kill)" },
  { id: "bent3-int-kill", goal: "kill", toPlay: "X", cells: [[0,0],[1,0],[0,1]], ro: "Trei în colț, în interior (omoară)", en: "Bent three, inside (kill)" },
  { id: "square4-mid-kill", goal: "kill", toPlay: "X", cells: [[0,0],[1,0],[0,1],[1,1]], ro: "Pătrat de patru, în interior (omoară)", en: "Square four, inside (kill)" },
  { id: "straight4-mid-live", goal: "live", toPlay: "O", cells: [[0,0],[1,0],[2,0],[3,0]], ro: "Patru în linie (viață)", en: "Straight four (live)" },
  { id: "bent4-mid-live", goal: "live", toPlay: "O", cells: [[0,0],[0,1],[0,2],[1,2]], ro: "Patru în L (viață)", en: "Bent four (live)" },
  { id: "zigzag4-mid-live", goal: "live", toPlay: "O", cells: [[0,0],[1,0],[1,1],[2,1]], ro: "Patru în zigzag (viață)", en: "Zigzag four (live)" },
  { id: "bulky5-mid-live", goal: "live", toPlay: "O", cells: [[0,0],[1,0],[0,1],[1,1],[0,2]], ro: "Cinci îndesați (viață)", en: "Bulky five (live)" },
  { id: "straight5-mid-live", goal: "live", toPlay: "O", cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], ro: "Cinci în linie (viață)", en: "Straight five (live)" }
];
export function build(spec) {
  const rows = frame(spec.cells), prob = {rows, toPlay: spec.toPlay, goal: spec.goal, target: [1, 1]};
  const P = T.parse(prob), g = T.newGameState(P), S = T.Solver(P);
  const maxD = spec.goal === "kill" ? (spec.cells.length >= 5 ? 21 : 13) : 3;
  const depth = T.minDepth(P, g, maxD, S);
  if (depth < 1) return {error: "scop neforțabil"};
  const w1 = T.winningMoves(P, g, depth, S), w2 = T.winningMoves(P, g, depth + 2, S);
  const same = JSON.stringify(w1.win) === JSON.stringify(w2.win);
  const ml = T.mainLine(P, depth);
  return {rec: {id: spec.id, goal: spec.goal, toPlay: spec.toPlay, target: [1, 1], rows, depth, sol: w1.win, wrong: w1.lose.length, line: ml.line, ro: spec.ro, en: spec.en}, stable: same, lineOk: ml.ok};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = [];
  for (const s of SPECS) { const r = build(s); if (r.error || !r.stable || !r.lineOk) { console.error("RESPINSĂ", s.id, r); continue; } out.push(r.rec); }
  console.log(out.map(x => JSON.stringify(x)).join(",\n"));
}
