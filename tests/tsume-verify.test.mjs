// GO FĂRĂ FRONTIERE: re-rezolvă TOATE problemele tsume din index.html cu solverul din aplicație (forță brută).
// Verifică: soluția stocată = mutările câștigătoare la adâncimea minimă; aceeași mulțime la adâncimea+2 (stabilitate); numărul de mutări greșite;
// variația principală stocată e legală și duce la scop; ids unice; nume RO/EN și traduceri (XL) pentru celelalte limbi.
// Rulare: node tests/tsume-verify.test.mjs
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
const T = ctx.__T;
const TSUME = JSON.parse(html.match(/const TSUME = (\[.*?\]);\n/)[1]);
const XL = JSON.parse(html.match(/const XL = (\{.*?\});\n/)[1]);
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   " + n); } else { fail++; console.log("FAIL " + n + (x !== undefined ? "  -> " + JSON.stringify(x) : "")); } };
ok("cel puțin 10 probleme", TSUME.length >= 10, TSUME.length);
ok("ids unice", new Set(TSUME.map(p => p.id)).size === TSUME.length);
for (const p of TSUME) {
  const P = T.parse({rows: p.rows, toPlay: p.toPlay, goal: p.goal, target: p.target}), g = T.newGameState(P), S = T.Solver(P);
  const d0 = T.minDepth(P, g, p.depth + 4, S);
  const w = T.winningMoves(P, g, p.depth, S), w2 = T.winningMoves(P, g, p.depth + 2, S);
  ok(`${p.id}: adâncimea minimă = ${p.depth}`, d0 === p.depth, d0);
  ok(`${p.id}: soluția stocată = mutările câștigătoare`, JSON.stringify(w.win) === JSON.stringify(p.sol), [w.win, p.sol]);
  ok(`${p.id}: stabilă la adâncimea+2; ${p.wrong} mutări greșite refutate`, JSON.stringify(w2.win) === JSON.stringify(p.sol) && w.lose.length === p.wrong, [w2.win, w.lose.length]);
  // variația principală stocată: legală, duce la scop
  const gg = T.newGameState(P); let legal = true;
  for (const [pt, col] of p.line) { if (gg.turn !== col) { legal = false; break; } if (T.playG(P, gg, pt)) { legal = false; break; } }
  const term = T.terminal(P, gg);
  ok(`${p.id}: variația principală e legală și atinge scopul`, legal && term === (p.goal === "live" ? 2 : 1), {legal, term});
  const en = p.en, tr = XL[en];
  ok(`${p.id}: nume RO/EN și traduceri pentru celelalte 6 limbi`, !!p.ro && !!en && Array.isArray(tr) && tr.length === 6 && tr.every(x => x && x !== en), tr);
}
console.log(`\n${pass} reușite, ${fail} eșuate`); process.exit(fail ? 1 : 0);
