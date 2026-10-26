// GO — teste pentru analizorul de partidă SGF și handicapul recomandat (v2). Rulare: node tests/fff-v2.test.mjs
import {launch, check, summary, hOverflow, axeRun} from "./_lib.mjs";
import fs from "node:fs";

const SGF9 = "(;FF[4]GM[1]SZ[9]KM[7.5]RU[chinese]PB[A]PW[B];B[ee];W[ce];B[ec];W[eg];B[cc];W[gc])";

console.log("1. pornire și logică pură");
{
  const {browser, page, st} = await launch();
  await page.waitForTimeout(2500);
  check("0 erori la pornire", st.errs.length === 0, st.errs);
  check("0 cereri de rețea", st.net.length === 0, st.net);
  const r = await page.evaluate(() => {
    const rec = {n: 9, moves: [[10, 1], [11, 2], [12, 1], [13, 2], [14, 1]], firstColor: 1};
    const wrB = [0.5, 0.8, 0.8, 0.3, 0.3, 0.05];
    const it = ganClassify(rec, wrB, [1, 2, 3, 4, 5]);
    return {items: it.map(x => [x.k, x.sev]), l: GAN_LIM};
  });
  // m1 N: 0.5→0.8 câștig; m2 A: before 0.2 after 0.2; m3 N: 0.8→0.3 (−0.5 ⇒ ??); m4 A: 0.7→0.7; m5 N: 0.3→0.05 (−0.25 ⇒ ?)
  check("clasificare: mutarea 3 = greșeală gravă, mutarea 5 = greșeală", JSON.stringify(r.items) === JSON.stringify([[3, 3], [5, 2]]), r);
  const h = await page.evaluate(() => [haRecommend(haRankVal("kyu", 10), haRankVal("kyu", 5)), haRecommend(haRankVal("kyu", 3), haRankVal("kyu", 3)), haRecommend(haRankVal("kyu", 1), haRankVal("dan", 1)), haRecommend(haRankVal("kyu", 30), haRankVal("dan", 9)), haRecommend(haRankVal("dan", 3), haRankVal("kyu", 2))]);
  check("handicap: 10 kyu vs 5 kyu = 5 pietre, eu sunt mai slab", h[0].h === 5 && h[0].weakerIsMe === true, h[0]);
  check("handicap: același rang = joc egal", h[1].h === 0 && h[1].weakerIsMe === null, h[1]);
  check("handicap: 1 kyu vs 1 dan = o treaptă, komi 0,5", h[2].h === 0 && h[2].komi === 0.5, h[2]);
  check("handicap: diferență > 9 se plafonează la 9", h[3].h === 9 && h[3].cap === true, h[3]);
  check("handicap: 3 dan vs 2 kyu = 4 trepte, eu sunt mai puternic", h[4].h === 4 && h[4].weakerIsMe === false, h[4]);
  const keys = await page.evaluate(() => { const miss = []; const ks = Object.keys(UI.ro).filter(k => /^(ga|ha)\./.test(k)); for (const l of ["ro","en","fr","it","es","pt","de","hu"]) for (const k of ks) if (!UI[l] || UI[l][k] === undefined) miss.push(l + ":" + k); return {n: ks.length, miss}; });
  check("toate cheile ga.* / ha.* există în cele 8 limbi", keys.n > 40 && keys.miss.length === 0, keys.miss.slice(0, 5));
  await browser.close();
}

console.log("2. analiză completă a unei partide SGF, marcaje, estimare, export");
{
  const {browser, page, st} = await launch({w: 1100, h: 900});
  await page.waitForTimeout(2500);
  await page.click("#tab-sgf");
  await page.fill("#sgftext", SGF9);
  await page.click("#panel-sgf .btn.pri:has-text('Încarcă'), #panel-sgf .btn.pri:has-text('Load'), #panel-sgf .btn.pri >> nth=0");
  await page.waitForSelector("#gan-run", {timeout: 5000});
  check("secțiunea de analiză apare după încărcarea SGF", await page.locator("#gan-run").isVisible());
  await page.click("#gan-run");
  await page.waitForSelector("#gan-export:not([hidden])", {timeout: 120000});
  const an = await page.evaluate(() => ({n: SV.an.wrB.length, ok: SV.an.wrB.every(v => v >= 0 && v <= 1), best: SV.an.best.length}));
  check("analiza evaluează toate cele 7 poziții (0..6 mutări)", an.n === 7 && an.ok && an.best === 7, an);
  check("graficul apare", (await page.locator(".ganbox svg.r8chart").count()) === 1);
  // injectăm o greșeală cunoscută ca să verificăm lista, „Arată” și exportul
  await page.evaluate(() => { const a = SV.an; a.wrB = [0.5, 0.8, 0.8, 0.3, 0.3, 0.05, 0.05]; a.best = [40, 41, 42, 43, 44, 45, 46]; a.items = ganClassify(SV.rec, a.wrB, a.best); sgfRender(); });
  const li = await page.locator(".galist li").count();
  check("lista conține greșelile marcate (mutările 3 și 5)", li === 2, li);
  await page.locator(".galist li").first().locator("button").click();
  check("„Arată” duce la poziția dinaintea mutării și afișează sugestia AI", (await page.evaluate(() => SV.i === 2 && SV.showBest === true)));
  const marks = await page.locator("svg.goboard circle[fill='#2e8b57']").count();
  check("mutarea preferată de AI apare pe tablă", marks >= 1, marks);
  const wr = await page.textContent(".ganbox .note[role=status]");
  check("șansa Negrului în poziția curentă este afișată", /\d+\s?%/.test(wr), wr);
  // estimare teritoriu
  await page.click("#gan-est");
  await page.waitForFunction(() => document.querySelector(".ganbox p[role=status]:last-child") && /\d/.test(document.querySelector(".ganbox p[role=status]:last-child").textContent), null, {timeout: 60000});
  check("estimarea teritoriului apare", (await page.evaluate(() => SV.own && SV.own.length)) === 81);
  // export
  const dl = page.waitForEvent("download");
  await page.click("#gan-export");
  const f = await (await dl).path();
  const txt = fs.readFileSync(f, "utf8");
  check("SGF exportat are comentarii cu marcajul ?? și ?", /C\[\?\? 50%/.test(txt) && /C\[\? 25%/.test(txt), txt.slice(0, 400));
  check("SGF exportat își păstrează mutările", /;B\[ee\];W\[ce\];B\[ec\]/.test(txt));
  check("fără depășire orizontală", (await hOverflow(page)) <= 0);
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("3. handicap recomandat în configurare");
{
  const {browser, page, st} = await launch({w: 900, h: 900});
  await page.waitForTimeout(2500);
  await page.evaluate(() => { setup.n = 19; setup.mode = "ai"; setup.variant = "go"; renderPlay(); });
  await page.waitForSelector(".haadv summary");
  await page.click(".haadv summary");
  const sels = page.locator(".haadv select");
  await sels.nth(0).selectOption("k10"); await sels.nth(1).selectOption("k5");
  await page.click("#hago");
  const msg = await page.textContent(".harez");
  check("recomandare afișată (handicap 5)", /5/.test(msg), msg);
  await page.click("#haapply");
  await page.waitForTimeout(300);
  const s2 = await page.evaluate(() => ({h: setup.handicap, c: setup.color, ka: setup.komiAuto}));
  check("se aplică handicap 5 și culoarea Negru (eu sunt mai slab)", s2.h === 5 && s2.c === "black", s2);
  await page.click(".haadv summary").catch(() => {});
  const ax = await (async () => { const b2 = await launch({bypassCSP: true}); await b2.page.waitForTimeout(2500); await b2.page.click("#tab-sgf"); const r = await axeRun(b2.page); await b2.browser.close(); return r; })();
  check("axe: fără încălcări în fila SGF", ax === null || ax.length === 0, ax);
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}
summary();
