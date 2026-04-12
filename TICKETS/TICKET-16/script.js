/**
 * ================================================================
 *    APP.JS — TICKET-16 Study Helper
 *    ================================================================
 *    TABLE OF CONTENTS
 *    1.  State
 *    2.  localStorage  — saveCards / loadCards
 *    3.  Helpers       — generateId / esc / shuffle
 *    4.  Stats & progress bar
 *    5.  Tab switching
 *    6.  Card management — addCard / deleteCard / toggleMastered
 *    7.  Render card list (all DOM via createElement)
 *    8.  Quiz — startQuiz / showNextQuizCard
 *    9.  Quiz — revealAnswer / gotIt / needReview
 *    10. Keyboard shortcut
 *    11. Init
 *    ================================================================
 *
 * @format
 */

/* ================================================================
   1. STATE
   ================================================================ */
var cards = []; // Array<{ id, term, definition, mastered, reviewCount }>
var quizQueue = []; // Array of card IDs remaining in this quiz round
var currentCard = null; // The card object currently shown in quiz

/* ================================================================
   2. LOCALSTORAGE
   ================================================================ */
function saveCards() {
  localStorage.setItem("studyCards", JSON.stringify(cards));
}

function loadCards() {
  var saved = localStorage.getItem("studyCards");

  if (saved) {
    cards = JSON.parse(saved);
  } else {
    cards = [];
  }
}

/* ================================================================
   3. HELPERS
   ================================================================ */

/* Unique ID from timestamp + random string */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* Escape HTML special characters to prevent XSS */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Fisher-Yates shuffle — mutates array in place, returns it */
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/* ================================================================
   4. STATS & PROGRESS BAR
   ================================================================ */
function updateStats() {
  var total = cards.length;
  var mastered = cards.filter(function (c) {
    return c.mastered;
  }).length;
  var percent = total === 0 ? 0 : Math.round((mastered / total) * 100);

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-mastered").textContent = mastered;
  document.getElementById("stat-pct").textContent = percent + "%";
  document.getElementById("progress-fill").style.width = percent + "%";
}

/* ================================================================
   5. TAB SWITCHING
   ================================================================ */
function switchTab(name) {
  document
    .getElementById("tab-cards")
    .classList.toggle("active", name === "cards");
  document
    .getElementById("tab-quiz")
    .classList.toggle("active", name === "quiz");

  document
    .getElementById("panel-cards")
    .classList.toggle("active", name === "cards");
  document
    .getElementById("panel-quiz")
    .classList.toggle("active", name === "quiz");

  if (name === "quiz") {
    startQuiz();
  }
}

/* ================================================================
   6. CARD MANAGEMENT
   ================================================================ */
function addCard() {
  var term = document.getElementById("input-term").value.trim();
  var definition = document.getElementById("input-def").value.trim();

  if (!term || !definition) {
    alert("Please fill in both the term and the definition.");
    return;
  }

  /* Card object shape required by ticket */
  var newCard = {
    id: generateId(),
    term: term,
    definition: definition,
    mastered: false,
    reviewCount: 0,
  };

  cards.push(newCard);
  saveCards();

  document.getElementById("input-term").value = "";
  document.getElementById("input-def").value = "";
  document.getElementById("input-term").focus();

  updateStats();
  renderCardList();
}

function deleteCard(id) {
  cards = cards.filter(function (c) {
    return c.id !== id;
  });
  saveCards();
  updateStats();
  renderCardList();
}

function toggleMastered(id) {
  var card = cards.find(function (c) {
    return c.id === id;
  });
  if (!card) return;
  card.mastered = !card.mastered;
  saveCards();
  updateStats();
  renderCardList();
}

/* ================================================================
   7. RENDER CARD LIST  — all DOM via createElement
   ================================================================ */
function renderCardList() {
  var list = document.getElementById("card-list");

  /* Clear existing nodes */
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  /* Empty state */
  if (cards.length === 0) {
    var empty = document.createElement("div");
    empty.className = "empty";

    var icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "📝";

    var msg = document.createElement("p");
    msg.textContent = "No cards yet. Add your first card above!";

    empty.appendChild(icon);
    empty.appendChild(msg);
    list.appendChild(empty);
    return;
  }

  /* One card item per entry */
  cards.forEach(function (card) {
    /* Outer wrapper */
    var item = document.createElement("div");
    item.className = "card-item" + (card.mastered ? " mastered" : "");

    /* ── Body ── */
    var body = document.createElement("div");
    body.className = "card-body";

    /* Term + optional badge */
    var termEl = document.createElement("div");
    termEl.className = "card-term";
    termEl.textContent = card.term;

    if (card.mastered) {
      var badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "Mastered";
      termEl.appendChild(badge);
    }

    /* Definition */
    var defEl = document.createElement("div");
    defEl.className = "card-def";
    defEl.textContent = card.definition;

    /* Review count */
    var meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent =
      "Reviewed " +
      card.reviewCount +
      " time" +
      (card.reviewCount === 1 ? "" : "s");

    body.appendChild(termEl);
    body.appendChild(defEl);
    body.appendChild(meta);

    /* ── Actions ── */
    var actions = document.createElement("div");
    actions.className = "card-actions";

    /* Master / Unmaster — IIFE captures card.id */
    var masterBtn = document.createElement("button");
    masterBtn.className = card.mastered ? "btn" : "btn btn-success";
    masterBtn.style.fontSize = "12px";
    masterBtn.textContent = card.mastered ? "Unmaster" : "Master";
    (function (id) {
      masterBtn.addEventListener("click", function () {
        toggleMastered(id);
      });
    })(card.id);

    /* Delete */
    var delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.style.fontSize = "12px";
    delBtn.textContent = "Delete";
    (function (id) {
      delBtn.addEventListener("click", function () {
        deleteCard(id);
      });
    })(card.id);

    actions.appendChild(masterBtn);
    actions.appendChild(delBtn);

    item.appendChild(body);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

/* ================================================================
   8. QUIZ — START / NEXT CARD
   ================================================================ */
function startQuiz() {
  /* Only include non-mastered cards */
  var unmastered = cards.filter(function (c) {
    return !c.mastered;
  });
  quizQueue = shuffle(
    unmastered.map(function (c) {
      return c.id;
    }),
  );
  currentCard = null;
  showNextQuizCard();
}

function showNextQuizCard() {
  var container = document.getElementById("quiz-content");

  /* Clear container */
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  /* Case: no cards added yet */
  if (cards.length === 0) {
    var noCards = document.createElement("div");
    noCards.className = "quiz-no-cards";

    var noP = document.createElement("p");
    noP.textContent =
      "You have no cards yet. Add some on the My Cards tab first.";

    var goBtn = document.createElement("button");
    goBtn.className = "btn btn-primary";
    goBtn.textContent = "Add cards";
    goBtn.addEventListener("click", function () {
      switchTab("cards");
    });

    noCards.appendChild(noP);
    noCards.appendChild(goBtn);
    container.appendChild(noCards);
    return;
  }

  /* Case: every card is mastered */
  var unmastered = cards.filter(function (c) {
    return !c.mastered;
  });
  if (unmastered.length === 0) {
    var allDone = document.createElement("div");
    allDone.className = "quiz-complete";

    var allDoneIcon = document.createElement("div");
    allDoneIcon.className = "quiz-complete-icon";
    allDoneIcon.textContent = "🎉";

    var allDoneH = document.createElement("h2");
    allDoneH.textContent = "All cards mastered!";

    var allDoneP = document.createElement("p");
    allDoneP.textContent =
      "You have mastered every card. Add more to keep going.";

    var backBtn = document.createElement("button");
    backBtn.className = "btn btn-primary";
    backBtn.textContent = "Back to cards";
    backBtn.addEventListener("click", function () {
      switchTab("cards");
    });

    allDone.appendChild(allDoneIcon);
    allDone.appendChild(allDoneH);
    allDone.appendChild(allDoneP);
    allDone.appendChild(backBtn);
    container.appendChild(allDone);
    return;
  }

  /* Case: queue exhausted for this round */
  if (quizQueue.length === 0) {
    var complete = document.createElement("div");
    complete.className = "quiz-complete";

    var completeIcon = document.createElement("div");
    completeIcon.className = "quiz-complete-icon";
    completeIcon.textContent = "✅";

    var completeH = document.createElement("h2");
    completeH.textContent = "Round complete!";

    var completeP = document.createElement("p");
    completeP.textContent =
      "You've gone through all remaining cards. Start another round!";

    var restartBtn = document.createElement("button");
    restartBtn.className = "btn btn-primary";
    restartBtn.textContent = "Start another round";
    restartBtn.addEventListener("click", function () {
      startQuiz();
    });

    complete.appendChild(completeIcon);
    complete.appendChild(completeH);
    complete.appendChild(completeP);
    complete.appendChild(restartBtn);
    container.appendChild(complete);
    return;
  }

  /* Normal case: show next card */
  var id = quizQueue[0];
  var card = cards.find(function (c) {
    return c.id === id;
  });
  if (!card) {
    quizQueue.shift();
    showNextQuizCard();
    return;
  }
  currentCard = card;

  /* Quiz card wrapper */
  var quizCard = document.createElement("div");
  quizCard.className = "quiz-card";

  var counter = document.createElement("div");
  counter.className = "quiz-counter";
  counter.textContent =
    quizQueue.length +
    " card" +
    (quizQueue.length === 1 ? "" : "s") +
    " remaining in this round";

  var termEl = document.createElement("div");
  termEl.className = "quiz-term";
  termEl.textContent = card.term;

  var reviewEl = document.createElement("div");
  reviewEl.className = "quiz-review";
  reviewEl.textContent =
    "Reviewed " +
    card.reviewCount +
    " time" +
    (card.reviewCount === 1 ? "" : "s");

  /* Answer — hidden until revealed */
  var answerEl = document.createElement("div");
  answerEl.className = "quiz-answer";
  answerEl.id = "quiz-answer";
  answerEl.textContent = card.definition;
  answerEl.style.display = "none";

  quizCard.appendChild(counter);
  quizCard.appendChild(termEl);
  quizCard.appendChild(reviewEl);
  quizCard.appendChild(answerEl);
  container.appendChild(quizCard);

  /* Action buttons row */
  var actionsEl = document.createElement("div");
  actionsEl.className = "quiz-actions";
  actionsEl.id = "quiz-actions";

  var showBtn = document.createElement("button");
  showBtn.className = "btn btn-primary";
  showBtn.textContent = "Show Answer";
  showBtn.addEventListener("click", revealAnswer);

  actionsEl.appendChild(showBtn);
  container.appendChild(actionsEl);
}

/* ================================================================
   9. QUIZ — REVEAL / GOT IT / NEED REVIEW
   ================================================================ */
function revealAnswer() {
  if (!currentCard) return;

  /* Show the definition */
  var answerEl = document.getElementById("quiz-answer");
  if (answerEl) answerEl.style.display = "block";

  /* Increment review count and persist */
  currentCard.reviewCount++;
  saveCards();
  renderCardList();

  /* Swap "Show Answer" for the two result buttons */
  var actions = document.getElementById("quiz-actions");
  if (!actions) return;

  while (actions.firstChild) {
    actions.removeChild(actions.firstChild);
  }

  var gotItBtn = document.createElement("button");
  gotItBtn.className = "btn btn-success";
  gotItBtn.textContent = "✓ Got it";
  gotItBtn.addEventListener("click", gotIt);

  var reviewBtn = document.createElement("button");
  reviewBtn.className = "btn btn-warn";
  reviewBtn.textContent = "↻ Need review";
  reviewBtn.addEventListener("click", needReview);

  actions.appendChild(gotItBtn);
  actions.appendChild(reviewBtn);
}

function gotIt() {
  if (!currentCard) return;
  /* Mark mastered and remove from queue */
  currentCard.mastered = true;
  quizQueue.shift();
  saveCards();
  updateStats();
  renderCardList();
  currentCard = null;
  showNextQuizCard();
}

function needReview() {
  /* Move card to end of queue — keep it in rotation */
  var id = quizQueue.shift();
  quizQueue.push(id);
  currentCard = null;
  showNextQuizCard();
}

/* ================================================================
   10. KEYBOARD SHORTCUT
   — Enter in term field jumps focus to definition textarea
   ================================================================ */
document.getElementById("input-term").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("input-def").focus();
  }
});

/* ================================================================
   11. INIT
   ================================================================ */
loadCards();
updateStats();
renderCardList();
