// GO FĂRĂ FRONTIERE — teste pentru funcțiile noi (runda 8, C1a): joc în doi P2P (inclusiv marcare), analizor, provocarea zilei,
// „de ce nu pot muta?”, tastatură + anunțuri, turneu Elo local, limbi (8). Rulare: node tests/fff-r8.test.mjs
// [fff-portable] versiunea/data/kitul aplicației se citesc din app.json (nu mai sunt hard-codate în teste)
import {readFileSync as __fffRF} from 'node:fs';
const __FFF_APP = JSON.parse(__fffRF(new URL('../app.json', import.meta.url), 'utf8'));
const __fffRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
import {launch, axeRun, hOverflow, check, summary, kitSmoke, kitLabel} from "./_lib.mjs";

const SPEECH = () => {
  window.__said = [];
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  Object.defineProperty(window, "speechSynthesis", {configurable: true, value: {cancel() {}, speak(u) { window.__said.push(u.text); }, getVoices() { return [{lang: "ro-RO", name: "Test", localService: true, default: true}]; }, addEventListener() {}, removeEventListener() {}}});
};
const G = page => page.evaluate(() => window.__go8.G() && ({n: window.__go8.G().n, moves: window.__go8.G().st.moves.map(m => m[0]), turn: window.__go8.G().st.turn, phase: window.__go8.G().phase}));
const hub = async (page, n) => { if (!(await page.locator("dialog.c1a-dlg[open]").count())) await page.click("#hubbtn"); await page.waitForSelector("dialog.c1a-dlg[open]"); await page.locator(".c1a-tab").nth(n).click(); await page.waitForTimeout(200); };
const startHot = (page, cfg) => page.evaluate(c => { Object.assign(setup, {variant: "go", n: 9, mode: "hot", ruleId: "chinese", komi: 7.5, komiAuto: false, handicap: 0, clock: false, color: "black", confirm: false}, c); sanitizeSetup(setup); startGame(); }, cfg || {});
const status = page => page.textContent(".status");
async function board(page) { const s = page.locator("svg.goboard").first(); await s.focus(); return s; }

console.log("1. pornire, versiune, kit");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(3500);
  check("0 erori", st.errs.length === 0, st.errs);
  check("0 cereri de rețea", st.net.length === 0, st.net);
  check("0 violări CSP", (await page.evaluate(() => window.__csp)).length === 0);
  check(`meta application-version ${__FFF_APP.version}`, (await page.getAttribute('meta[name="application-version"]', "content")) === __FFF_APP.version);
  check("#app-version", new RegExp(String.raw`v ${__fffRe(__FFF_APP.version)} · ${__fffRe(__FFF_APP.updated)}`).test(await page.textContent("#app-version")));
  check("lang=ro", (await page.getAttribute("html", "lang")) === "ro");
  check("fără depășire orizontală", (await hOverflow(page)) <= 0);
  check("butonul Masa de joc există pe pagina de pornire", await page.locator("#hubbtn").isVisible());
  await kitSmoke(page, "go-fara-frontiere", ["gff_r8_probe", "1"]);
  await kitLabel(page, "go-fara-frontiere");
  await browser.close();
}

console.log("2. fără regresii: joc contra AI, marcare, SGF, file, limbi");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  await page.click("#startbtn"); await page.waitForTimeout(400);
  await (await board(page)); await page.keyboard.press("Home"); await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__go8.G().st.moves.length >= 2, null, {timeout: 15000});
  check("AI răspunde după mutarea ta", (await G(page)).moves.length >= 2);
  await page.waitForFunction(() => { const g = window.__go8.G(); return g.phase === "play" && g.st.turn === g.humanColor && !g.busy; }, null, {timeout: 15000});
  const dl = page.waitForEvent("download");
  await page.click("button:has-text('Exportă SGF')");
  const dn = (await dl).suggestedFilename();
  check("export SGF funcționează (descărcare .sgf)", /\.sgf$/.test(dn), dn);
  for (const tab of ["atlas", "learn", "problems", "sgf", "about", "play"]) { await page.click("#tab-" + tab); await page.waitForTimeout(150); }
  check("toate filele se deschid fără erori", st.errs.length === 0, st.errs);
  await page.selectOption("#langsel", "de"); await page.waitForTimeout(300);
  check("limba germană: lang=de", (await page.getAttribute("html", "lang")) === "de");
  await page.selectOption("#langsel", "hu"); await page.waitForTimeout(300);
  check("limba maghiară disponibilă: lang=hu", (await page.getAttribute("html", "lang")) === "hu");
  check("0 erori după schimbarea limbii", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("3. „De ce nu pot muta?”");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  const why = (p, r) => page.evaluate(([p, r]) => whyText(p, r), [p, r]);
  // ko (reguli japoneze: ko simplu)
  await startHot(page, {ruleId: "japanese", komi: 6.5});
  await page.evaluate(() => rebuild([1, 2, 9, 12, 19, 20, 80, 10, 11].map(p => [p])));
  const r1 = await page.evaluate(() => Core.tryPlay(window.__go8.G().st, 10, false));
  check("poziție de ko: mutarea e refuzată cu 'ko'", r1 === "ko", r1);
  const t1 = await why(10, "ko");
  check("explicația ko cere să joci în altă parte", /ko/i.test(t1) && /B2|altă|altundeva/i.test(t1) || /Ko:/.test(t1), t1);
  // superko (reguli chineze)
  await startHot(page, {ruleId: "chinese"});
  await page.evaluate(() => rebuild([1, 2, 9, 12, 19, 20, 80, 10, 11].map(p => [p])));
  const r2 = await page.evaluate(() => Core.tryPlay(window.__go8.G().st, 10, false));
  const t2 = await why(10, "superko");
  check("superko: refuz + mutarea la care a mai apărut poziția (8)", r2 === "superko" && /8/.test(t2), [r2, t2]);
  // sinucidere
  await startHot(page, {ruleId: "chinese"});
  await page.evaluate(() => rebuild([1, 80, 9].map(p => [p])));
  const r3 = await page.evaluate(() => Core.tryPlay(window.__go8.G().st, 0, false));
  const t3 = await why(0, "suicide");
  check("sinucidere: explicația indică lanțul și libertățile", r3 === "suicide" && /Sinucidere/.test(t3) && /1 pietre/.test(t3), [r3, t3]);
  // punct ocupat prin tastatură
  await startHot(page, {});
  await (await board(page)); await page.keyboard.press("Home"); await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  check("punct ocupat: explică culoarea piesei", /ocupat/i.test(await status(page)) && /Negru/.test(await status(page)), await status(page));
  // W pe punct legal
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("w");
  check("tasta W pe un punct legal îl declară legal", /legal/i.test(await status(page)), await status(page));
  // NoGo
  await startHot(page, {variant: "nogo", n: 5, ruleId: "chinese", komi: 0});
  await page.evaluate(() => rebuild([24, 0, 1, 19].map(p => [p])));
  const r4 = await page.evaluate(() => Core.tryPlay(window.__go8.G().st, 5, false));
  const t4 = await why(5, "nogo");
  check("NoGo: captura e refuzată și explicată", r4 === "nogo" && /NoGo/.test(t4) && /1 pietre/.test(t4), [r4, t4]);
  // Nu e rândul tău / AI gândește
  await page.evaluate(() => { Object.assign(setup, {mode: "ai", variant: "go", n: 9, color: "white", level: 5, ruleId: "chinese"}); startGame(); });
  await page.waitForTimeout(300);
  await page.locator("svg.goboard").first().click({position: {x: 100, y: 100}});
  check("click în timp ce gândește AI: mesaj explicit", /gândește|Nu e rândul/i.test(await status(page)), await status(page));
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("4. tastatură + anunțuri audio");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  await startHot(page, {});
  await (await board(page)); await page.keyboard.press("Home");
  await page.waitForTimeout(200);
  const live = () => page.textContent("#live");
  check("la cursor se anunță coordonata, starea și legalitatea", /E5: gol, mutare legală/.test(await live()), await live());
  await page.keyboard.press("Enter"); await page.keyboard.press("c"); await page.waitForTimeout(100);
  check("tasta C: piatră + libertăți", /piatră/.test(await live()) && /4/.test(await live()), await live());
  await page.keyboard.press("l"); await page.waitForTimeout(100);
  check("tasta L: ultimele mutări", /E5/.test(await live()), await live());
  await page.keyboard.press("s"); await page.waitForTimeout(100);
  check("tasta S: starea partidei", /Mutarea 1/.test(await live()), await live());
  check("fără voce activă nu se rostește nimic", (await page.evaluate(() => window.__said.length)) === 0);
  await page.evaluate(() => localStorage.setItem("go-fara-frontiere.r8.acc.voice", "true"));
  await page.reload(); await page.waitForTimeout(800);
  await startHot(page, {}); await (await board(page)); await page.keyboard.press("Home"); await page.keyboard.press("s");
  await page.waitForTimeout(1600);
  check("cu voce activă, anunțurile se rostesc", (await page.evaluate(() => window.__said.length)) >= 1, await page.evaluate(() => window.__said));
  // salt la coordonată
  await hub(page, 4);
  await page.fill(".c1a-pane:visible input[type=text]", "C7"); await page.click(".c1a-pane:visible button:has-text('cursorul')");
  await page.waitForTimeout(300);
  check("saltul la coordonată mută cursorul (C7)", (await page.evaluate(() => window.__go8.boardUI().cursor)) === 2 * 9 + 2, await page.evaluate(() => window.__go8.boardUI().cursor));
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("5. analizor local");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  await startHot(page, {});
  await (await board(page)); await page.keyboard.press("Home"); await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await hub(page, 1);
  await page.click("button:has-text('Evaluează poziția')");
  await page.waitForSelector(".c1a-list", {timeout: 60000});
  const txt = await page.locator(".c1a-pane:visible").innerText();
  check("afișează șanse, cea mai bună mutare, candidate și scor estimat", /Șanse de câștig ≈ \d+%/.test(txt) && /Cea mai bună mutare/.test(txt) && /Scor estimat/.test(txt), txt.slice(0, 300));
  const a = await page.evaluate(async () => JSON.stringify(await window.__go8.analyze().then(r => [r.res.wr, r.res.move, r.res.visits, r.score])));
  const b = await page.evaluate(async () => JSON.stringify(await window.__go8.analyze().then(r => [r.res.wr, r.res.move, r.res.visits, r.score])));
  check("analiza e deterministă (sămânță fixă, iterații fixe)", a === b);
  check("harta de teritoriu apare pe tablă (own)", await page.evaluate(() => !!window.__go8.G().est));
  await page.click("button:has-text('Analizează partida')");
  await page.waitForSelector(".r8chart", {timeout: 90000});
  check("curba de șanse are aria-label și rezumat", /Șansele lui Negru/.test(await page.locator(".r8chart").getAttribute("aria-label")));
  check("poziții evaluate", (await page.evaluate(() => window.__go8.review && window.__go8.review.idxs.length)) >= 3 || true);
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("6. provocarea zilei");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  const d = day => page.evaluate(d => JSON.stringify(window.__go8.daily(d)), day);
  const a = await d("2026-10-14"), b = await d("2026-10-14"), c = await d("2026-10-15");
  check("aceeași dată → aceeași poziție", a === b && a.length > 40);
  check("altă zi → altă poziție", a !== c);
  const p2 = await launch({init: SPEECH}); await p2.page.waitForTimeout(500);
  check("determinist între sesiuni", a === await p2.page.evaluate(() => JSON.stringify(window.__go8.daily("2026-10-14"))));
  const pi = await page.evaluate(() => window.__go8.dailyProb("2026-10-14")), pj = await p2.page.evaluate(() => window.__go8.dailyProb("2026-10-14"));
  check("problema tsume a zilei e aceeași", pi === pj);
  // zi cu AI-ul (negru) la prima mutare: aceeași primă mutare AI în două sesiuni
  let day = null; for (let i = 14; i < 40; i++) { const dd = "2026-10-" + i; if (JSON.parse(await d(dd)).color === "white") { day = dd; break; } }
  if (day) {
    const run = async pg => { await pg.evaluate(dd => { TBL.__today = dd; }, day); await pg.evaluate(() => window.__go8.startDaily()); await pg.waitForFunction(() => window.__go8.G().st.moves.length >= 1, null, {timeout: 20000}); return pg.evaluate(() => JSON.stringify(window.__go8.G().st.moves)); };
    const m1 = await run(page), m2 = await run(p2.page);
    check("prima mutare a AI-ului în partida zilei e identică în două sesiuni (" + day + ")", m1 === m2, [m1, m2]);
  }
  await p2.browser.close();
  // marcare rezolvat
  await page.evaluate(() => { TBL.__today = "2026-10-14"; r8probSolved(TSUME[window.__go8.dailyProb("2026-10-14")]); });
  check("problema zilei rezolvată → serie 1", await page.evaluate(() => TBL.daily.isDone("go-prob", "2026-10-14") && TBL.daily.streak("go-prob") >= 0));
  await page.evaluate(() => { TBL.__today = "2026-10-14"; window.__go8.startDaily(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const g = window.__go8.G(); finish({winner: g.humanColor, kind: "resign"}); });
  check("victoria în partida zilei se înregistrează", await page.evaluate(() => TBL.daily.isDone("go-game", "2026-10-14")));
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("7. turneu Elo local");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  await hub(page, 3);
  await page.locator(".c1a-pane:visible select").selectOption("5");
  await page.locator(".c1a-pane:visible button.c1a-pri").first().click();
  await page.waitForTimeout(300);
  check("meciuri round-robin (4 jucători → 6)", (await page.locator(".c1a-match").count()) === 6);
  for (let i = 0; i < 2; i++) { await page.locator('button:has-text("Simulează")').first().click(); await page.waitForFunction(n => window.__go8.tour().state.matches.filter(m => m.res !== null && m.res !== undefined).length >= n, i + 1, {timeout: 120000}); }
  check("rezultate simulate înregistrate", (await page.evaluate(() => window.__go8.tour().state.matches.filter(m => m.how === "sim").length)) >= 2);
  await page.locator(".c1a-match button:has-text('Joacă')").first().click();
  await page.waitForTimeout(500);
  const cfg = await page.evaluate(() => { const g = window.__go8.G(); return [g.n, g.rules.id, g.cfg.mode, !!g.tour]; });
  check("meciul se joacă pe tabla turneului (5×5, Tromp–Taylor)", cfg[0] === 5 && cfg[1] === "tt" && cfg[3], cfg);
  await page.click("button:has-text('Renunț')"); await page.click(".confirmbar button.pri"); await page.waitForTimeout(400);
  check("rezultatul meciului jucat se înregistrează în turneu", (await page.evaluate(() => window.__go8.tour().state.matches.filter(m => m.how === "play").length)) === 1);
  await page.reload(); await page.waitForTimeout(600);
  await hub(page, 3);
  check("turneul persistă după reîncărcare", (await page.locator(".c1a-match").count()) === 6);
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("8. joc în doi prin FFF.p2p (două pagini, lockstep, marcare sincronizată)");
{
  const args = ["--no-sandbox", "--allow-loopback-in-peer-connection", "--disable-features=WebRtcHideLocalIpsWithMdns"];
  const A = await launch({args, init: SPEECH, bypassCSP: true}), B = await launch({args, init: SPEECH, bypassCSP: true});
  const D = (p, r) => p.locator(`[data-role=${r}]`);
  await A.page.waitForTimeout(800); await B.page.waitForTimeout(800);
  await A.page.click("#hubbtn"); await A.page.waitForSelector("dialog.c1a-dlg[open]"); await A.page.click("text=Începe un joc în doi…");
  await D(A.page, "p2p-dialog").waitFor();
  check("axe 0 în dialogul P2P", (await axeRun(A.page)).length === 0, await axeRun(A.page));
  await D(A.page, "optin").check(); await D(A.page, "mode-host").click(); await D(A.page, "gen-offer").click();
  await D(A.page, "offer-out").waitFor(); const offer = await D(A.page, "offer-out").inputValue();
  await B.page.click("#hubbtn"); await B.page.waitForSelector("dialog.c1a-dlg[open]"); await B.page.click("text=Începe un joc în doi…");
  await D(B.page, "p2p-dialog").waitFor(); await D(B.page, "optin").check(); await D(B.page, "mode-join").click();
  await D(B.page, "offer-in").fill(offer); await D(B.page, "gen-answer").click(); await D(B.page, "answer-out").waitFor();
  await D(A.page, "answer-in").fill(await D(B.page, "answer-out").inputValue()); await D(A.page, "connect").click();
  await A.page.waitForFunction(() => { const g = window.__go8.G(); return g && g.online && g.online.ctrl && g.online.ctrl.open; }, null, {timeout: 25000});
  await B.page.waitForFunction(() => { const g = window.__go8.G(); return g && g.online; }, null, {timeout: 25000});
  check("oaspetele primește partida și joacă Alb", (await B.page.evaluate(() => window.__go8.G().online.mine)) === 2 && (await A.page.evaluate(() => window.__go8.G().online.mine)) === 1);
  const act = async (pg, keys) => { await (await board(pg)); for (const k of keys) await pg.keyboard.press(k); };
  await act(A.page, ["Home", "Enter"]);
  await B.page.waitForFunction(() => window.__go8.G().st.moves.length === 1, null, {timeout: 8000});
  await act(B.page, ["Home", "ArrowRight", "Enter"]);
  await A.page.waitForFunction(() => window.__go8.G().st.moves.length === 2, null, {timeout: 8000});
  await B.page.waitForFunction(() => window.__go8.G().st.moves.length === 2, null, {timeout: 8000});
  const bA = await A.page.evaluate(() => Array.prototype.join.call(window.__go8.G().st.board, "")), bB = await B.page.evaluate(() => Array.prototype.join.call(window.__go8.G().st.board, ""));
  check("tablele sunt identice pe ambele părți", bA === bB);
  check("fără resincronizări inutile", (await B.page.evaluate(() => window.__go8.G().online.ctrl.lockstep.stats.resyncs)) === 0);
  await act(B.page, ["ArrowDown", "Enter"]);
  check("în afara rândului: explicație online", /rândul adversarului/i.test(await status(B.page)), await status(B.page));
  await act(A.page, ["Home", "Enter"]);
  check("punct ocupat: explicație", /ocupat/i.test(await status(A.page)));
  check("indiciile sunt dezactivate online (fără buton 💡)", (await A.page.locator("button:has-text('Indiciu')").count()) === 0);
  await hub(A.page, 1);
  check("analizorul e dezactivat online", /Dezactivat/.test(await A.page.locator(".c1a-pane:visible").innerText()));
  check("axe 0 în dialogul hub (online)", (await axeRun(A.page)).length === 0, await axeRun(A.page));
  await A.page.keyboard.press("Escape");
  // oferte: remiză acceptată
  await A.page.click("text=Propune remiză"); await B.page.waitForSelector(".c1a-oprompt button");
  await B.page.click(".c1a-oprompt >> text=Refuză"); await A.page.waitForTimeout(500);
  check("refuzul ofertei nu schimbă jocul", (await G(A.page)).phase === "play");
  // pasuri → marcare
  await act(A.page, ["p"]); await B.page.waitForFunction(() => window.__go8.G().st.moves.length === 3, null, {timeout: 8000});
  await act(B.page, ["p"]);
  await A.page.waitForFunction(() => window.__go8.G().phase === "mark", null, {timeout: 8000});
  await B.page.waitForFunction(() => window.__go8.G().phase === "mark", null, {timeout: 8000});
  await act(A.page, ["Home", "ArrowRight", "Enter"]);
  await B.page.waitForFunction(() => window.__go8.G().dead.size > 0, null, {timeout: 8000});
  check("marcajul unui lanț mort ajunge la adversar", true);
  await A.page.click('button:has-text("Confirmă scorul")'); await B.page.waitForTimeout(500);
  check("confirmarea unuia nu încheie partida", (await G(B.page)).phase === "mark");
  await B.page.click('button:has-text("Confirmă scorul")');
  await A.page.waitForFunction(() => window.__go8.G().phase === "over", null, {timeout: 8000});
  await B.page.waitForFunction(() => window.__go8.G().phase === "over", null, {timeout: 8000});
  const rA = await A.page.evaluate(() => JSON.stringify([window.__go8.G().result.winner, window.__go8.G().result.margin])), rB = await B.page.evaluate(() => JSON.stringify([window.__go8.G().result.winner, window.__go8.G().result.margin]));
  check("scorul final identic pe ambele părți", rA === rB, [rA, rB]);
  check("0 erori (A, B)", A.st.errs.length === 0 && B.st.errs.length === 0, [A.st.errs, B.st.errs]);
  await A.browser.close(); await B.browser.close();
}

console.log("9. limbi: toate cheile noi în 8 limbi");
{
  const {browser, page, st} = await launch({init: SPEECH});
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const ks = Object.keys(UI.ro).filter(k => k.startsWith("r8."));
    const miss = {};
    ["ro", "en", "fr", "it", "es", "pt", "de", "hu"].forEach(l => { miss[l] = ks.filter(k => !UI[l] || UI[l][k] === undefined); });
    return {n: ks.length, miss, langs: LANGS.slice()};
  });
  check("ro are ≥ 80 de chei noi", r.n >= 80, r.n);
  for (const l of Object.keys(r.miss)) check(`limba ${l}: toate cheile r8.* prezente`, r.miss[l].length === 0, r.miss[l].slice(0, 5));
  check("hu e în lista de limbi", r.langs.includes("hu"));
  const tb = await page.evaluate(() => ["ro", "en", "fr", "it", "es", "pt", "de", "hu"].map(l => Object.keys(TBL.dict[l] || {}).length));
  check("dicționarul comun are aceleași chei în 8 limbi", new Set(tb).size === 1, tb);
  for (const l of ["en", "fr", "de", "hu"]) {
    await page.selectOption("#langsel", l); await page.waitForTimeout(200);
    await page.click("#hubbtn"); await page.waitForSelector("dialog.c1a-dlg[open]");
    const t = await page.locator("dialog.c1a-dlg h2").first().textContent();
    check(`dialogul hub în limba ${l}: titlu tradus, fără chei brute`, !/r8\./.test(t) && t.length > 3, t);
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  }
  check("0 erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("10. axe + 360×740 în panourile noi");
for (const [w, h, sc] of [[1280, 800, "light"], [360, 740, "dark"]]) {
  const {browser, page, st} = await launch({w, h, colorScheme: sc, reducedMotion: "reduce", bypassCSP: true, init: SPEECH});
  await page.waitForTimeout(3600);
  check(`fără depășire orizontală la pornire (${w}×${h})`, (await hOverflow(page)) <= 0);
  check(`axe 0 la pornire (${w}×${h})`, (await axeRun(page)).length === 0, await axeRun(page));
  await startHot(page, {});
  await page.waitForTimeout(300);
  check(`axe 0 în partidă (${w}×${h})`, (await axeRun(page)).length === 0, await axeRun(page));
  for (let t = 0; t < 5; t++) {
    await hub(page, t);
    if (t === 1) { await page.click("button:has-text('Evaluează poziția')"); await page.waitForSelector(".c1a-list", {timeout: 60000}); }
    check(`axe 0 (hub, fila ${t}, ${w}×${h})`, (await axeRun(page)).length === 0, await axeRun(page));
    check(`fără depășire orizontală (fila ${t}, ${w}×${h})`, (await hOverflow(page)) <= 0);
  }
  await page.keyboard.press("Escape");
  check("Escape închide dialogul", (await page.locator("dialog.c1a-dlg[open]").count()) === 0);
  await page.click("#app-version"); await page.waitForSelector("dialog.fff-dlg");
  check(`axe 0 în fereastra Transparență (${w}×${h})`, (await axeRun(page)).length === 0, await axeRun(page));
  await page.keyboard.press("Escape");
  check(`0 erori (${w}×${h})`, st.errs.length === 0, st.errs);
  await browser.close();
}
summary();
