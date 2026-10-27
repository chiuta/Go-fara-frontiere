// GO FĂRĂ FRONTIERE 2.1.0 — buton „Începător: 9×9, AI ușor” + verificarea funcțiilor deja existente recomandate (9×9, tsume, estimare de scor, SGF, sugestie).
// Rulare: node tests/incepator.test.mjs
import {launch, check, summary} from "./_lib.mjs";

const {browser, page, st} = await launch({reducedMotion: "reduce"});
await page.waitForTimeout(1200);
console.log("1. buton începător");
check("butonul «Începător» și nota există în configurare", (await page.locator("#beginbtn").count()) === 1 && /9×9/.test(await page.textContent("#beginnote")));
await page.click("#beginbtn");
await page.waitForTimeout(800);
const g = await page.evaluate(() => { const G = window.__go.G(); return {n: G.n, mode: G.mode, level: G.level, rules: G.rules && G.rules.id, komi: G.rules && G.rules.komi, phase: G.phase, variant: G.variant, hc: G.setup && G.setup.handicap}; });
check("pornește direct: 9×9, contra AI, nivel 1, reguli chineze, komi 7,5, fără handicap", g.n === 9 && g.mode === "ai" && g.level === 1 && g.rules === "chinese" && g.komi === 7.5 && g.phase === "play" && g.variant === "go" && !g.hc, g);
const labels = await page.locator("button").allInnerTexts();
check("în partidă există «Estimează teritoriul» și «Sugestie» (estimare de scor + indiciu)", labels.some(x => /Estimează teritoriul/.test(x)) && labels.some(x => /Sugestie/.test(x)));
check("există export SGF", labels.some(x => /Exportă SGF/.test(x)));
await page.locator("button", {hasText: "Estimează teritoriul"}).click();
await page.waitForTimeout(2500);
check("estimarea teritoriului rulează fără erori", st.errs.length === 0, st.errs);
console.log("2. probleme tsume existente");
await page.click("#tab-problems");
const probs = await page.evaluate(() => TSUME.length);
check("12 probleme de tsume (cu soluție confirmată de solver)", probs === 12, probs);
check("0 erori de pagină/CSP și 0 cereri de rețea", st.errs.length === 0 && st.net.length === 0, [st.errs, st.net]);
await browser.close();
summary();
