/** @format */

// ---------- DOM ----------
const num1 = document.getElementById("num1");
const num2 = document.getElementById("num2");
const resultEl = document.getElementById("result");
const historyList = document.getElementById("historyList");

// ---------- STATE ----------
let history = [];
const MAX_HISTORY = 5;

// ---------- OPERATIONS ----------
const OPERATIONS = {
  add: { symbol: "+", fn: (a, b) => a + b },
  subtract: { symbol: "-", fn: (a, b) => a - b },
  multiply: { symbol: "×", fn: (a, b) => a * b },
  divide: {
    symbol: "÷",
    fn: (a, b) => {
      if (b === 0) throw new Error("Cannot divide by zero");
      return a / b;
    },
  },
};

// ---------- HELPERS ----------
function getInputs() {
  const v1 = num1.value.trim();
  const v2 = num2.value.trim();

  if (!v1 || !v2) throw new Error("Please enter both numbers");

  const a = Number(v1);
  const b = Number(v2);

  if (isNaN(a) || isNaN(b)) {
    throw new Error("Please enter valid numbers");
  }

  return { a, b };
}

function formatResult(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(4));
}

function showResult(message, type = "") {
  resultEl.textContent = message;
  resultEl.className = `result ${type}`;
}

// ---------- CORE ----------
function calculate(type) {
  try {
    const { a, b } = getInputs();

    const op = OPERATIONS[type];
    if (!op) throw new Error("Invalid operation");

    const raw = op.fn(a, b);
    const result = formatResult(raw);

    showResult(`Result: ${result}`, "success");

    addToHistory(`${a} ${op.symbol} ${b} = ${result}`);
  } catch (err) {
    showResult(err.message, "error");
  }
}

// ---------- HISTORY ----------
function addToHistory(entry) {
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = history.map((item) => `<li>${item}</li>`).join("");
}

// ---------- ACTIONS ----------
function clearCalculator() {
  num1.value = "";
  num2.value = "";
  showResult("Result will appear here");
  num1.focus();
}

// ---------- OPTIONAL: BUTTON EVENTS (if using buttons) ----------
document.querySelectorAll("[data-op]").forEach((btn) => {
  btn.addEventListener("click", () => {
    calculate(btn.dataset.op);
  });
});

// ---------- INIT ----------
console.log("Calculator ready!");
