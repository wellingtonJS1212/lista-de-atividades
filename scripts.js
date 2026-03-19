const input = document.querySelector("#task-input");
const reminderInput = document.querySelector("#reminder-minutes");
const addButton = document.querySelector("#add-task-button");
const taskList = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const STORAGE_KEY = "lista-de-atividades:tarefas";
const DEFAULT_REMINDER_MINUTES = 1;
const COUNTDOWN_INTERVAL_IN_MS = 1000;

let tasks = loadTasks();
const reminderTimeouts = new Map();
let countdownIntervalId = null;

renderTasks();
schedulePendingReminders();
startCountdownUpdater();

addButton.addEventListener("click", addTask);
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

function addTask() {
    const taskText = input.value.trim();

    if (!taskText) {
        input.focus();
        return;
    }

    const reminderMinutes = getReminderMinutes();

    const newTask = {
        id: crypto.randomUUID(),
        text: taskText,
        reminderMinutes,
        reminderAt: Date.now() + convertMinutesToMs(reminderMinutes),
        alerted: false,
        needsAttention: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    scheduleReminder(newTask);
    input.value = "";
    input.focus();
}

function deleteTask(index) {
    const [removedTask] = tasks.splice(index, 1);

    clearReminder(removedTask.id);
    saveTasks();
    renderTasks();
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const listItem = document.createElement("li");
        listItem.className = "task-item";

        if (task.needsAttention) {
            listItem.classList.add("attention");
        }

        const taskContent = document.createElement("div");
        taskContent.className = "task-content";

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.text;

        const taskReminder = document.createElement("span");
        taskReminder.className = "task-reminder";
        taskReminder.textContent = `Lembrete definido para ${task.reminderMinutes} minuto(s)`;

        const taskCountdown = document.createElement("span");
        taskCountdown.className = "task-countdown";
        taskCountdown.dataset.taskId = task.id;
        taskCountdown.textContent = formatTimeLeft(task);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Excluir";
        deleteButton.setAttribute("aria-label", `Excluir tarefa: ${task.text}`);
        deleteButton.addEventListener("click", () => deleteTask(index));

        taskContent.append(taskText, taskReminder, taskCountdown);
        listItem.append(taskContent, deleteButton);
        taskList.appendChild(listItem);

        applyCountdownState(task, listItem, taskCountdown);
    });

    emptyMessage.hidden = tasks.length > 0;
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (!savedTasks) {
        return [];
    }

    try {
        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.map((task) => normalizeTask(task)).filter(Boolean);
    } catch {
        return [];
    }
}

function normalizeTask(task) {
    if (typeof task === "string") {
        return {
            id: crypto.randomUUID(),
            text: task,
            reminderMinutes: DEFAULT_REMINDER_MINUTES,
            reminderAt: Date.now(),
            alerted: true,
            needsAttention: false
        };
    }

    if (!task || typeof task.text !== "string") {
        return null;
    }

    return {
        id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
        text: task.text,
        reminderMinutes: getValidReminderMinutes(task.reminderMinutes),
        reminderAt: typeof task.reminderAt === "number"
            ? task.reminderAt
            : Date.now() + convertMinutesToMs(getValidReminderMinutes(task.reminderMinutes)),
        alerted: Boolean(task.alerted),
        needsAttention: Boolean(task.needsAttention)
    };
}

function schedulePendingReminders() {
    tasks.forEach((task) => scheduleReminder(task));
}

function scheduleReminder(task) {
    if (task.alerted || reminderTimeouts.has(task.id)) {
        return;
    }

    const delay = Math.max(task.reminderAt - Date.now(), 0);
    const timeoutId = window.setTimeout(() => {
        const taskToAlert = tasks.find((currentTask) => currentTask.id === task.id);

        reminderTimeouts.delete(task.id);

        if (!taskToAlert || taskToAlert.alerted) {
            return;
        }

        taskToAlert.alerted = true;
        taskToAlert.needsAttention = true;
        saveTasks();
        renderTasks();
    }, delay);

    reminderTimeouts.set(task.id, timeoutId);
}

function clearReminder(taskId) {
    const timeoutId = reminderTimeouts.get(taskId);

    if (timeoutId) {
        window.clearTimeout(timeoutId);
        reminderTimeouts.delete(taskId);
    }
}

function startCountdownUpdater() {
    if (countdownIntervalId) {
        return;
    }

    countdownIntervalId = window.setInterval(updateCountdowns, COUNTDOWN_INTERVAL_IN_MS);
}

function updateCountdowns() {
    const countdownElements = document.querySelectorAll(".task-countdown");

    countdownElements.forEach((element) => {
        const task = tasks.find((currentTask) => currentTask.id === element.dataset.taskId);

        if (!task) {
            return;
        }

        const taskItem = element.closest(".task-item");
        element.textContent = formatTimeLeft(task);
        applyCountdownState(task, taskItem, element);
    });
}

function formatTimeLeft(task) {
    if (task.needsAttention || task.alerted) {
        return "Tempo esgotado";
    }

    const remainingMs = Math.max(task.reminderAt - Date.now(), 0);
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} para a tarefa criada expirar`;
}

function applyCountdownState(task, taskItem, countdownElement) {
    if (!taskItem || !countdownElement) {
        return;
    }

    const remainingSeconds = getRemainingSeconds(task);

    taskItem.classList.remove("countdown-warning", "countdown-critical");
    countdownElement.classList.remove("warning", "critical");

    if (task.needsAttention || task.alerted) {
        return;
    }

    if (remainingSeconds <= 5) {
        taskItem.classList.add("countdown-critical");
        countdownElement.classList.add("critical");
        return;
    }

    if (remainingSeconds <= 30) {
        taskItem.classList.add("countdown-warning");
        countdownElement.classList.add("warning");
    }
}

function getRemainingSeconds(task) {
    if (task.needsAttention || task.alerted) {
        return 0;
    }

    return Math.max(Math.ceil((task.reminderAt - Date.now()) / 1000), 0);
}

function getReminderMinutes() {
    const reminderMinutes = getValidReminderMinutes(reminderInput.value);
    reminderInput.value = reminderMinutes;
    return reminderMinutes;
}

function getValidReminderMinutes(value) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_REMINDER_MINUTES;
}

function convertMinutesToMs(minutes) {
    return minutes * 60 * 1000;
}
