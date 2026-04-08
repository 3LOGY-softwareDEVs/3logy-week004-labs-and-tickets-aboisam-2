/** @format */

const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");
const filterButtons = document.querySelectorAll(".filters button");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Add Task
addTaskButton.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: crypto.randomUUID(),
    text,
    completed: false,
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskInput.value = "";
});

// Render Tasks
function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    const leftDiv = document.createElement("div");
    leftDiv.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const span = document.createElement("span");
    span.textContent = task.text;

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(span);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";

    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    li.appendChild(leftDiv);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

// Filters
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".filters .active").classList.remove("active");
    btn.classList.add("active");

    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Clear Completed
clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

// Save to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Initial Load
renderTasks();
