/** @format */

// ============================================================
//  TICKET-15 — Task Dashboard
//  Features: add, complete, delete, filter, sort, stats,
//            localStorage persistence, event delegation
// ============================================================

// ── STATE ─────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem("ticket15-tasks")) || [];
let currentFilter = "all";
let currentSort = "date-desc";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ── DOM REFS ──────────────────────────────────────────────
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const sortSelect = document.getElementById("sortSelect");
const taskCount = document.getElementById("taskCount");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statCompleted = document.getElementById("statCompleted");
const statPercent = document.getElementById("statPercent");
const statBar = document.getElementById("statBar");

// ── PERSIST ───────────────────────────────────────────────
function saveTasks() {
  localStorage.setItem("ticket15-tasks", JSON.stringify(tasks));
}

// ── FILTER & SORT ─────────────────────────────────────────
function getFilteredTasks() {
  let filtered = tasks;

  // Filter
  if (currentFilter === "active") {
    filtered = filtered.filter((t) => !t.completed);
  } else if (currentFilter === "completed") {
    filtered = filtered.filter((t) => t.completed);
  }

  // Sort
  if (currentSort === "priority") {
    filtered = [...filtered].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );
  } else if (currentSort === "date-asc") {
    filtered = [...filtered].sort((a, b) => a.date - b.date);
  } else {
    // date-desc (default)
    filtered = [...filtered].sort((a, b) => b.date - a.date);
  }

  return filtered;
}

// ── UPDATE STATS ──────────────────────────────────────────
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  statTotal.textContent = total;
  statActive.textContent = active;
  statCompleted.textContent = completed;
  statPercent.textContent = pct + "%";
  statBar.style.width = pct + "%";
}

// ── CREATE TASK ELEMENT (createElement — no innerHTML) ────
function createTaskElement(task) {
  // Card wrapper
  const card = document.createElement("div");
  card.classList.add("task-card");
  if (task.completed) card.classList.add("completed");
  card.dataset.id = task.id;
  card.dataset.priority = task.priority;

  // Checkbox
  const check = document.createElement("div");
  check.classList.add("task-card__check");
  if (task.completed) check.classList.add("checked");
  check.dataset.action = "complete";

  // Task text
  const text = document.createElement("span");
  text.classList.add("task-card__text");
  text.textContent = task.text;

  // Priority badge
  const badge = document.createElement("span");
  badge.classList.add("task-card__badge", `task-card__badge--${task.priority}`);

  if (task.priority === "high") {
    const warn = document.createElement("span");
    warn.textContent = "⚠️";
    badge.appendChild(warn);
  }

  const badgeLabel = document.createTextNode(
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
  );
  badge.appendChild(badgeLabel);

  // Date
  const date = document.createElement("span");
  date.classList.add("task-card__date");
  date.textContent = new Date(task.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Delete button
  const del = document.createElement("button");
  del.classList.add("task-card__delete");
  del.dataset.action = "delete";
  del.setAttribute("aria-label", "Delete task");
  del.textContent = "✕";

  // Assemble card
  card.appendChild(check);
  card.appendChild(text);
  card.appendChild(badge);
  card.appendChild(date);
  card.appendChild(del);

  return card;
}

// ── RENDER ────────────────────────────────────────────────
function render() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = "";

  if (filtered.length === 0) {
    // Empty state
    const empty = document.createElement("div");
    empty.classList.add("empty-state");

    const icon = document.createElement("div");
    icon.classList.add("empty-state__icon");
    icon.textContent = currentFilter === "completed" ? "🎉" : "📋";

    const msg = document.createElement("p");
    msg.textContent =
      currentFilter === "completed"
        ? "No completed tasks yet."
        : currentFilter === "active"
          ? "No active tasks — all done!"
          : "No tasks yet. Add one above.";

    empty.appendChild(icon);
    empty.appendChild(msg);
    taskList.appendChild(empty);
  } else {
    filtered.forEach((task) => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  // Update count label
  taskCount.textContent = `Showing ${filtered.length} of ${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;

  // Update stats
  updateStats();
}

// ── ADD TASK ──────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();

  if (!text) {
    taskInput.focus();
    taskInput.style.borderColor = "#DC2626";
    setTimeout(() => {
      taskInput.style.borderColor = "";
    }, 1500);
    return;
  }

  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    priority: prioritySelect.value,
    date: Date.now(),
  };

  tasks.unshift(task);
  saveTasks();
  render();

  // Reset form
  taskInput.value = "";
  prioritySelect.value = "medium";
  taskInput.focus();
}

// ── DELETE TASK ───────────────────────────────────────────
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

// ── TOGGLE COMPLETE ───────────────────────────────────────
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

// ── EVENT DELEGATION — task list ──────────────────────────
taskList.addEventListener("click", (e) => {
  const card = e.target.closest(".task-card");
  if (!card) return;

  const id = parseInt(card.dataset.id);
  const action = e.target.closest("[data-action]");
  if (!action) return;

  if (action.dataset.action === "delete") deleteTask(id);
  if (action.dataset.action === "complete") toggleTask(id);
});

// ── EVENT DELEGATION — filter buttons ─────────────────────
document.querySelector(".filter-group").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;

  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));

  btn.classList.add("active");
  currentFilter = btn.dataset.filter;
  render();
});

// ── SORT ──────────────────────────────────────────────────
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  render();
});

// ── ADD TASK LISTENERS ────────────────────────────────────
addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// ── INIT ──────────────────────────────────────────────────
render();
