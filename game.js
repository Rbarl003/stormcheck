// ============================================================
// StormCheck — game.js  ("Spot the Fake")
// A 5-round quiz that teaches people to recognize scam alerts on their own.
// Uses the same engine to highlight the red flags after each answer.
// Works offline and in all three languages.
// ============================================================

const Game = (() => {
  const ROUNDS = 5;
  const BEST_KEY = "stormcheck-game-best";
  let deck = [];
  let state = null;     // { questions, index, score, answered, choice }
  let backdrop = null;

  fetch("data/game-deck.json")
    .then((r) => r.json())
    .then((d) => { deck = d; })
    .catch(() => console.warn("Could not load game deck"));

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 2 real + 3 fake, in random order
  function pickQuestions() {
    const real = shuffle(deck.filter((q) => q.answer === "real")).slice(0, 2);
    const fake = shuffle(deck.filter((q) => q.answer === "fake")).slice(0, ROUNDS - real.length);
    return shuffle(real.concat(fake));
  }

  function best() { try { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10); } catch (e) { return 0; } }
  function saveBest(n) { try { if (n > best()) localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* ignore */ } }

  // ---------- Open / close ----------
  function open() {
    if (!deck.length) return;
    state = null;
    backdrop = el("div", "sheet-backdrop");
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    document.addEventListener("keydown", onKey);
    document.body.append(backdrop);
    render();
  }

  function close() {
    if (backdrop) backdrop.remove();
    backdrop = null;
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function start() {
    state = { questions: pickQuestions(), index: 0, score: 0, answered: false, choice: null };
    render();
  }

  function answer(choice) {
    const q = state.questions[state.index];
    state.answered = true;
    state.choice = choice;
    if (choice === q.answer) state.score++;
    render();
  }

  function next() {
    state.index++;
    state.answered = false;
    state.choice = null;
    if (state.index >= state.questions.length) saveBest(state.score);
    render();
  }

  // ---------- Screens ----------
  function render() {
    if (!backdrop) return;
    backdrop.innerHTML = "";
    const sheet = el("div", "sheet game");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", t("gameTitle"));

    const closeX = el("button", "game-close", "✕");
    closeX.setAttribute("aria-label", t("close"));
    closeX.addEventListener("click", close);
    sheet.append(closeX);

    if (!state) renderIntro(sheet);
    else if (state.index >= state.questions.length) renderEnd(sheet);
    else renderRound(sheet);

    backdrop.append(sheet);
    const focusMe = sheet.querySelector(".btn-primary, .game-choices button");
    if (focusMe) focusMe.focus();
  }

  function renderIntro(sheet) {
    sheet.append(el("div", "game-emoji", "🎯"), el("h2", "", t("gameTitle")), el("p", "", t("gameIntro")));
    if (best() > 0) sheet.append(el("p", "note", t("gameBest")(best(), ROUNDS)));
    const go = el("button", "btn-primary", t("gameStart"));
    go.addEventListener("click", start);
    sheet.append(go);
  }

  function renderRound(sheet) {
    const q = state.questions[state.index];
    const text = q.text[lang] || q.text.en;

    // Progress dots
    const progress = el("div", "game-progress");
    progress.append(el("span", "", t("gameRound")(state.index + 1, state.questions.length)));
    const dots = el("div", "game-dots");
    state.questions.forEach((_, i) => dots.append(el("i", i < state.index ? "done" : i === state.index ? "now" : "")));
    progress.append(dots);
    sheet.append(progress);

    if (!state.answered) {
      sheet.append(el("h2", "", t("gameQuestion")));
      sheet.append(el("div", "game-message", text));
      const choices = el("div", "game-choices");
      const realBtn = el("button", "choice-real", t("gameReal"));
      const fakeBtn = el("button", "choice-fake", t("gameFake"));
      realBtn.addEventListener("click", () => answer("real"));
      fakeBtn.addEventListener("click", () => answer("fake"));
      choices.append(realBtn, fakeBtn);
      sheet.append(choices);
      return;
    }

    // After answering: feedback, highlighted message, clues
    const right = state.choice === q.answer;
    const feedback = el("div", "game-feedback " + (right ? "right" : "wrong"));
    feedback.append(el("strong", "", right ? t("gameCorrect") : t("gameWrong")),
      el("span", "", q.answer === "real" ? t("gameIsReal") : t("gameIsFake")));
    sheet.append(feedback);

    const r = StormCheckEngine.analyze(text);
    const box = buildHighlightedText(text, r.highlights);
    box.classList.add("game-message");
    sheet.append(box);

    sheet.append(el("h3", "section-title", t("gameClues")));
    const list = el("ul", "reasons");
    (q.clues[lang] || q.clues.en).forEach((c) => list.append(el("li", "", c)));
    sheet.append(list);

    const last = state.index === state.questions.length - 1;
    const nextBtn = el("button", "btn-primary", last ? t("gameSeeScore") : t("gameNext"));
    nextBtn.addEventListener("click", next);
    sheet.append(nextBtn);
  }

  function renderEnd(sheet) {
    const { score, questions } = state;
    const n = questions.length;
    const rank = score === n ? 2 : score >= 3 ? 1 : 0;
    sheet.append(el("div", "game-emoji", ["🌀", "👍", "🏆"][rank]));
    sheet.append(el("h2", "", t("gameScore")(score, n)));
    const bar = el("div", "meter-track game-bar");
    const fill = el("div", "meter-fill");
    fill.style.width = Math.round((score / n) * 100) + "%";
    bar.append(fill);
    sheet.append(bar, el("p", "", t("gameRank")[rank]), el("p", "game-tip", t("gameTip")));

    const actions = el("div", "sheet-actions");
    const again = el("button", "btn-primary", t("gameAgain"));
    again.addEventListener("click", start);
    const done = el("button", "btn-share", t("close"));
    done.addEventListener("click", close);
    actions.append(again, done);
    sheet.append(actions);
  }

  return { open, rerender: render };
})();

document.getElementById("game-btn").addEventListener("click", Game.open);
