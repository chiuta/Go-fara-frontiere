// GO FĂRĂ FRONTIERE: verificare prin simulare că nivelurile AI (numărul de iterații MCTS: 0, 100, 500, 2500, 10000) chiar diferă.
// Motorul (Core + AI) se extrage din fișier și rulează în Node, fără browser. Tablă 9×9, reguli Tromp–Taylor (scor pe arie, fără marcarea pietrelor moarte),
// komi 7,5, 2 mutări aleatoare de deschidere (seed fix) pentru varietate, culorile se alternează. N >= 50 partide per pereche.
// Rulare: node tests/niveluri-sim.test.mjs [N] [perechi nivel_mare-nivel_mic, ex. 3-1,2-1,3-2]
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "..", "index.html"), "utf8");
const a = html.indexOf("function GoCoreFactory()"), b = html.indexOf("/* ===== SGF: export");
if (a < 0 || b < a) throw new Error("motorul Go nu a fost găsit");
const ctx = vm.createContext({console, Math, Date, performance, Uint8Array, Uint16Array, Int16Array, Int32Array, Uint32Array, Float64Array, Float32Array, Array, Object, JSON, Number, String, Map, Set, crypto: globalThis.crypto});
vm.runInContext(html.slice(a, b) + "\nthis.__Core = GoCoreFactory(); this.__AI = GoAIFactory(this.__Core);", ctx);
const Core = ctx.__Core, AI = ctx.__AI;
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   " + n); } else { fail++; console.log("FAIL " + n + (x !== undefined ? "  -> " + JSON.stringify(x) : "")); } };
const N = parseInt(process.argv[2], 10) || 50;
const PAIRS = (process.argv[3] || "3-1,2-1,3-2").split(",").map(s => s.split("-").map(Number));
const n = 9, rules = Core.mkRules("tt", {komi: 7.5});

function game(itBlack, itWhite, seed) {
  const st = Core.newState({n, rules, setup: [], toMove: 1}), moves = [], rng = Core.mulberry32(seed);
  while (!Core.isOver(st) && moves.length < 260) {
    let mv;
    if (moves.length < 2) { const L = Core.legalMoves(st).filter(p => { const x = p % n, y = (p / n) | 0; return x > 1 && x < n - 2 && y > 1 && y < n - 2; }); mv = L[(rng() * L.length) | 0]; }
    else {
      const out = AI.thinkSync({n, rules, setup: [], firstColor: 1, moves: moves.slice(), komi: rules.komi, noGo: false, captureTarget: 0, seed: (seed * 7919 + moves.length) | 0, iters: st.turn === 1 ? itBlack : itWhite, maxMs: 120000, allowResign: false});
      mv = out.move;
    }
    if (mv >= 0 && !Core.play(st, mv)) { moves.push(mv); continue; }
    Core.pass(st); moves.push(-1);
  }
  const sc = Core.score(st, null, {});
  return sc.winner; // 1 negru, 2 alb, 0 egal
}
function duel(lvHi, lvLo, n_) {
  const itHi = AI.LEVELS[lvHi - 1].iters, itLo = AI.LEVELS[lvLo - 1].iters;
  let w = 0, l = 0, d = 0;
  for (let i = 0; i < n_; i++) {
    const hiBlack = i % 2 === 0;
    const r = game(hiBlack ? itHi : itLo, hiBlack ? itLo : itHi, 17 + i * 101 + lvHi * 10007 + lvLo * 1009);
    if (r === 0) d++; else if ((r === 1) === hiBlack) w++; else l++;
  }
  const dec = w + l, z = dec ? (w - dec / 2) / Math.sqrt(dec / 4) : 0;
  return {hi: lvHi, lo: lvLo, iters: [itHi, itLo], n: n_, w, l, d, score: +((w + d / 2) / n_).toFixed(3), z: +z.toFixed(2)};
}
const t0 = Date.now(), res = [];
for (const [h, l] of PAIRS) { const r = duel(h, l, N); res.push(r); console.log(`  nivel ${r.hi} (${r.iters[0]} it.) vs nivel ${r.lo} (${r.iters[1]} it.): ${r.n} partide 9×9, ${r.w}-${r.l} (egal ${r.d}), scor ${r.score}, z=${r.z}  [${((Date.now() - t0) / 1000).toFixed(0)} s]`); }
ok("N >= 50 partide pe pereche", res.every(r => r.n >= 50), res.map(r => r.n));
for (const r of res) ok(`nivel ${r.hi} bate semnificativ nivelul ${r.lo} (z >= 2.58, scor > 0.5)`, r.z >= 2.58 && r.score > 0.5, r);
console.log(`\n${pass} reușite, ${fail} eșuate`); process.exit(fail ? 1 : 0);
