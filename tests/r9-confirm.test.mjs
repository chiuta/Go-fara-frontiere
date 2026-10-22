// Test r9 (Go fără frontiere): înlocuirea unui joc în curs cere confirmare în dialogul inline al kitului (tradus), nu în window.confirm.
// Rulare: node tests/r9-confirm.test.mjs
import {launch, check, summary} from "./_lib.mjs";
for (const L of ["ro-RO", "en-US", "de-DE", "hu-HU"]) {
  const {browser, page, st} = await launch({locale: L});
  let native = 0; page.on("dialog", d => { native++; d.dismiss(); });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { Object.assign(setup, {variant: "go", n: 9, mode: "hot", ruleId: "chinese", komi: 7.5, komiAuto: false, handicap: 0, clock: false, color: "black", confirm: false}); sanitizeSetup(setup); startGame(); commitHuman(40); });
  const n0 = await page.evaluate(() => window.__go8.G().st.moves.length);
  check(`${L}: există o mutare jucată`, n0 === 1, n0);
  await page.evaluate(() => { applyPreset(Object.keys(PRESETS)[0]); });
  await page.waitForSelector("dialog.fff-dlg[open]", {timeout: 3000});
  const btns = await page.locator("dialog.fff-dlg[open] button").allTextContents();
  check(`${L}: dialog inline cu 2 butoane traduse`, btns.length === 2 && btns.every(b => b.trim().length > 0), btns);
  await page.locator("dialog.fff-dlg[open] button").first().click(); await page.waitForTimeout(300);
  check(`${L}: „Nu” păstrează jocul`, (await page.evaluate(() => window.__go8.G().st.moves.length)) === 1);
  await page.evaluate(() => { applyPreset(Object.keys(PRESETS)[0]); });
  await page.waitForSelector("dialog.fff-dlg[open]"); await page.locator("dialog.fff-dlg[open] button").last().click(); await page.waitForTimeout(500);
  check(`${L}: „Da” înlocuiește jocul`, (await page.evaluate(() => { const g = window.__go8.G(); return !g || g.st.moves.length === 0 || g.phase !== "play"; })));
  check(`${L}: fără window.confirm, fără erori`, native === 0 && st.errs.length === 0, {native, errs: st.errs});
  await browser.close();
}
summary();
