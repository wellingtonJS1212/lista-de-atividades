const authScreen = document.querySelector("#auth-screen");
const appScreen = document.querySelector("#app-screen");
const authNameInput = document.querySelector("#auth-name");
const authPasswordInput = document.querySelector("#auth-password");
const authFeedback = document.querySelector("#auth-feedback");
const startAppButton = document.querySelector("#start-app-button");
const forgotPasswordButton = document.querySelector("#forgot-password-button");
const logoutButton = document.querySelector("#logout-button");
const exitAppButton = document.querySelector("#exit-app-button");
const passwordModal = document.querySelector("#password-modal");
const currentPasswordInput = document.querySelector("#current-password-input");
const newPasswordInput = document.querySelector("#new-password-input");
const confirmPasswordInput = document.querySelector("#confirm-password-input");
const passwordModalFeedback = document.querySelector("#password-modal-feedback");
const savePasswordButton = document.querySelector("#save-password-button");
const cancelPasswordButton = document.querySelector("#cancel-password-button");
const userDisplayName = document.querySelector("#user-display-name");
const welcomeMessage = document.querySelector("#welcome-message");
const input = document.querySelector("#task-input");
const reminderHoursInput = document.querySelector("#reminder-hours");
const reminderInput = document.querySelector("#reminder-minutes");
const soundInput = document.querySelector("#sound-input");
const soundPickerButton = document.querySelector("#sound-picker-button");
const selectedSoundName = document.querySelector("#selected-sound-name");
const addButton = document.querySelector("#add-task-button");
const clearTasksButton = document.querySelector("#clear-tasks-button");
const clearHistoryButton = document.querySelector("#clear-history-button");
const generateReportButton = document.querySelector("#generate-report-button");
const reportMessage = document.querySelector("#report-message");
const taskList = document.querySelector("#task-list");
const historyList = document.querySelector("#history-list");
const emptyMessage = document.querySelector("#empty-message");
const historyEmptyMessage = document.querySelector("#history-empty-message");
const taskCountBadge = document.querySelector("#task-count-badge");
const taskSummaryLabel = document.querySelector("#task-summary-label");
const completedTotal = document.querySelector("#completed-total");
const unfinishedTotal = document.querySelector("#unfinished-total");
const extendedTotal = document.querySelector("#extended-total");
const availableTimeTotal = document.querySelector("#available-time-total");
const plannedTimeTotal = document.querySelector("#planned-time-total");
const freeTimeTotal = document.querySelector("#free-time-total");
const formFeedback = document.querySelector("#form-feedback");
const dayStartHourSelect = document.querySelector("#day-start-hour");
const dayStartMinuteSelect = document.querySelector("#day-start-minute");
const dayEndHourSelect = document.querySelector("#day-end-hour");
const dayEndMinuteSelect = document.querySelector("#day-end-minute");
const updateModal = document.querySelector("#update-modal");
const updateMessage = document.querySelector("#update-message");
const updateLink = document.querySelector("#update-link");
const dismissUpdateButton = document.querySelector("#dismiss-update-button");
const clearHistoryModal = document.querySelector("#clear-history-modal");
const confirmClearHistoryWithReportButton = document.querySelector("#confirm-clear-history-with-report");
const confirmClearHistoryWithoutReportButton = document.querySelector("#confirm-clear-history-without-report");
const tabButtons = document.querySelectorAll(".tab-button");
const chartRangeButtons = document.querySelectorAll(".chart-range-button");
const mainTab = document.querySelector("#main-tab");
const historyTab = document.querySelector("#history-tab");
const chartCanvas = document.querySelector("#performance-chart");
const chartTooltip = document.querySelector("#chart-tooltip");

const STORAGE_KEYS = {
    tasks: "lista-de-atividades:tarefas",
    history: "lista-de-atividades:historico",
    performance: "lista-de-atividades:desempenho",
    user: "lista-de-atividades:usuario",
    settings: "lista-de-atividades:configuracoes",
    session: "lista-de-atividades:sessao"
};

const REMOTE_SESSION_KEY = "lista-de-atividades:remote-session";
const DISMISSED_UPDATE_KEY = "lista-de-atividades:update-dispensada";
const DEFAULT_REMINDER_MINUTES = 1;
const COUNTDOWN_INTERVAL_IN_MS = 1000;
const APP_VERSION = "1.0.5";
const UPDATE_INFO_URL = "https://wellingtonjs1212.github.io/lista-de-atividades/update.json";
const DOWNLOAD_PAGE_URL = "https://wellingtonJS1212.github.io/lista-de-atividades/download.html";
const JSPDF_SOURCE_PATHS = [
    "vendor/jspdf.umd.min.js",
    "node_modules/jspdf/dist/jspdf.umd.min.js"
];
const NOTIFICATION_CHANNEL_ID = "task-reminders-v3";

let tasks = loadTasks();
let historyEntries = loadHistory();
let performanceEntries = loadPerformanceHistory();
let userProfile = loadUserProfile();
let appSettings = loadSettings();
let activeSession = loadSession();
let remoteSession = loadRemoteSession();
let selectedTab = "main";
let countdownIntervalId = null;
let pendingPasswordResetLogin = "";
let selectedChartRangeDays = 7;
let chartInteractionData = null;
let jsPdfLoaderPromise = null;
let notificationsReady = false;
let activeReminderAudio = null;
let activeReminderAudioContext = null;
const reminderTimeouts = new Map();
const remoteAuthEnabled = Boolean(window.RemoteApi?.isConfigured());
const localNotificationsPlugin = window.Capacitor?.registerPlugin
    ? window.Capacitor.registerPlugin("LocalNotifications")
    : null;

syncPerformanceHistory();
syncSession();
populateDayTimeSelects();
renderApp();
initLocalNotifications();
schedulePendingReminders();
startCountdownUpdater();
checkForUpdates();

startAppButton.addEventListener("click", handleAuth);
forgotPasswordButton.addEventListener("click", handleForgotPassword);
logoutButton.addEventListener("click", logout);
exitAppButton.addEventListener("click", closeApp);
savePasswordButton.addEventListener("click", saveNewPassword);
cancelPasswordButton.addEventListener("click", closePasswordModal);
addButton.addEventListener("click", addTask);
clearTasksButton.addEventListener("click", clearTasks);
clearHistoryButton.addEventListener("click", promptClearHistory);
generateReportButton.addEventListener("click", generateHistoryReport);
soundInput.addEventListener("change", handleSoundSelection);
dismissUpdateButton.addEventListener("click", dismissCurrentUpdate);
soundPickerButton.addEventListener("click", () => soundInput.click());
soundPickerButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        soundInput.click();
    }
});

passwordModal.addEventListener("click", (event) => {
    if (event.target === passwordModal) {
        closePasswordModal();
        pendingPasswordResetLogin = "";
    }
});

clearHistoryModal.addEventListener("click", (event) => {
    if (event.target === clearHistoryModal) {
        closeClearHistoryModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !passwordModal.hidden) {
        closePasswordModal();
        pendingPasswordResetLogin = "";
    }

    if (event.key === "Escape" && updateModal && !updateModal.hidden) {
        dismissCurrentUpdate();
    }

    if (event.key === "Escape" && clearHistoryModal && !clearHistoryModal.hidden) {
        closeClearHistoryModal();
    }
});

updateModal.addEventListener("click", (event) => {
    if (event.target === updateModal) {
        dismissCurrentUpdate();
    }
});

confirmClearHistoryWithReportButton.addEventListener("click", async () => {
    const pdfGenerated = await generateHistoryReport();

    if (pdfGenerated) {
        performClearHistory();
    }

    closeClearHistoryModal();
});

confirmClearHistoryWithoutReportButton.addEventListener("click", () => {
    performClearHistory();
    closeClearHistoryModal();
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

reminderHoursInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

reminderInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

dayStartHourSelect.addEventListener("change", handleDayPlanChange);
dayStartMinuteSelect.addEventListener("change", handleDayPlanChange);
dayEndHourSelect.addEventListener("change", handleDayPlanChange);
dayEndMinuteSelect.addEventListener("change", handleDayPlanChange);

tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
});

chartRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedChartRangeDays = Number.parseInt(button.dataset.range, 10) || 7;
        updateChartRangeButtons();
        drawPerformanceChart();
    });
});

chartCanvas.addEventListener("mousemove", handleChartPointerMove);
chartCanvas.addEventListener("mouseleave", hideChartTooltip);
chartCanvas.addEventListener("click", handleChartPointerMove);
chartCanvas.addEventListener("touchstart", handleChartTouch, { passive: true });
window.addEventListener("scroll", hideChartTooltip, { passive: true });

function renderApp() {
    const isAuthenticated = remoteAuthEnabled
        ? Boolean(remoteSession?.access_token && userProfile && userProfile.approved && !userProfile.blocked)
        : Boolean(activeSession && userProfile && activeSession.login === userProfile.login);

    authScreen.hidden = isAuthenticated;
    appScreen.hidden = !isAuthenticated;

    if (!isAuthenticated) {
        hydrateAuthForm();
        return;
    }

    updateUserHeader();
    updateSoundLabel();
    updateDayPlanInputs();
    updateChartRangeButtons();
    switchTab(selectedTab, false);
    renderTasks();
    renderHistory();
    drawPerformanceChart();
}

function hydrateAuthForm() {
    if (!userProfile) {
        return;
    }

    authNameInput.value = userProfile.name;
    authPasswordInput.value = "";
}

async function handleAuth() {
    const name = authNameInput.value.trim();
    const login = name.toLowerCase();
    const password = authPasswordInput.value.trim();

    if (!name || !password) {
        showFeedback(authFeedback, "Preencha nome e senha para continuar.");
        return;
    }

    if (remoteAuthEnabled) {
        try {
            const { session, profile } = await window.RemoteApi.signIn(login, password);

            if (!profile) {
                showFeedback(authFeedback, "Seu cadastro remoto ainda não foi sincronizado. Tente novamente em instantes.");
                return;
            }

            if (profile.blocked) {
                showFeedback(authFeedback, "Seu acesso foi bloqueado. Entre em contato com o administrador.");
                return;
            }

            if (!profile.approved) {
                showFeedback(authFeedback, "Seu cadastro foi recebido e está aguardando aprovação.");
                return;
            }

            userProfile = {
                name: profile.full_name,
                login: profile.email,
                password: "",
                approved: Boolean(profile.approved),
                blocked: Boolean(profile.blocked),
                role: profile.role || "user",
                remoteId: profile.id
            };
            remoteSession = session;
            saveUserProfile();
            saveRemoteSession();
            authPasswordInput.value = "";
            hideFeedback(authFeedback);
            renderApp();
            return;
        } catch (error) {
            const rawMessage = String(error?.message || "");

            if (!rawMessage.includes("Invalid login credentials")) {
                showFeedback(authFeedback, parseRemoteError(error, "Não foi possível validar seu acesso agora."));
                return;
            }

            try {
                await window.RemoteApi.signUp(name, login, password);
                showFeedback(authFeedback, "Cadastro criado com sucesso. Aguarde sua aprovação para entrar.");
                return;
            } catch (signupError) {
                showFeedback(authFeedback, parseRemoteError(signupError, "Não foi possível criar seu cadastro remoto."));
                return;
            }
        }
    }

    if (!userProfile) {
        userProfile = { name, login, password };
        saveUserProfile();
    } else if (userProfile.password !== password) {
        showFeedback(authFeedback, "Senha incorreta.");
        return;
    } else {
        userProfile.name = name;
        userProfile.login = login;
        saveUserProfile();
    }

    activeSession = {
        login: userProfile.login,
        startedAt: Date.now()
    };

    saveSession();
    authPasswordInput.value = "";
    hideFeedback(authFeedback);
    renderApp();
}

async function handleForgotPassword() {
    if (!userProfile) {
        showFeedback(authFeedback, "Nenhum usuário foi cadastrado ainda neste aparelho.");
        return;
    }

    pendingPasswordResetLogin = userProfile.login;
    openPasswordModal();
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(REMOTE_SESSION_KEY);
    activeSession = null;
    remoteSession = null;
    authPasswordInput.value = "";
    renderApp();
}

function closeApp() {
    const capacitorApp = window.Capacitor?.Plugins?.App || window.Capacitor?.App;

    if (capacitorApp && typeof capacitorApp.exitApp === "function") {
        capacitorApp.exitApp();
        return;
    }

    if (window.navigator?.app && typeof window.navigator.app.exitApp === "function") {
        window.navigator.app.exitApp();
        return;
    }

    window.close();
}

function openPasswordModal() {
    passwordModal.hidden = false;
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
    hideFeedback(passwordModalFeedback);
    currentPasswordInput.focus();
}

function closePasswordModal() {
    passwordModal.hidden = true;
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
    hideFeedback(passwordModalFeedback);
}

function saveNewPassword() {
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const expectedLogin = pendingPasswordResetLogin || (authNameInput.value.trim().toLowerCase());

    if (!currentPassword) {
        showFeedback(passwordModalFeedback, "Digite a senha atual para continuar.");
        currentPasswordInput.focus();
        return;
    }

    if (!newPassword) {
        showFeedback(passwordModalFeedback, "Digite a nova senha para continuar.");
        newPasswordInput.focus();
        return;
    }

    if (!userProfile || expectedLogin !== userProfile.login) {
        showFeedback(passwordModalFeedback, "Não foi possível validar o usuário para trocar a senha.");
        return;
    }

    if (currentPassword !== userProfile.password) {
        showFeedback(passwordModalFeedback, "A senha atual informada não confere.");
        currentPasswordInput.focus();
        return;
    }

    if (newPassword.length < 4) {
        showFeedback(passwordModalFeedback, "A nova senha precisa ter pelo menos 4 caracteres.");
        newPasswordInput.focus();
        return;
    }

    if (newPassword !== confirmPassword) {
        showFeedback(passwordModalFeedback, "A confirmação da nova senha está diferente.");
        confirmPasswordInput.focus();
        return;
    }

    userProfile.password = newPassword;
    saveUserProfile();
    closePasswordModal();
    pendingPasswordResetLogin = "";
    showFeedback(authFeedback, "Senha redefinida com sucesso. Agora faça o login novamente.");
    authPasswordInput.value = "";
    authPasswordInput.focus();
}

function updateUserHeader() {
    const name = userProfile?.name || "Usuário";
    userDisplayName.textContent = name;
    welcomeMessage.textContent = `Bem-vindo, ${name}. Crie tarefas, acompanhe o desempenho e cuide do seu tempo.`;
}

function addTask() {
    const rawText = input.value.trim();
    const reminderMinutes = getReminderMinutes();

    if (!rawText) {
        showFeedback(formFeedback, "Digite o nome da tarefa para registrar.");
        input.focus();
        return;
    }

    if (reminderMinutes === null) {
        showFeedback(formFeedback, "Defina o tempo do lembrete antes de adicionar a tarefa.");
        reminderInput.focus();
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        text: rawText.toUpperCase(),
        reminderMinutes,
        baseReminderMinutes: reminderMinutes,
        reminderAt: Date.now() + convertMinutesToMs(reminderMinutes),
        alerted: false,
        needsAttention: false,
        status: "active",
        extensionUsed: false,
        extensionCount: 0,
        extensionAvailable: true,
        createdAt: Date.now()
    };

    tasks.push(newTask);
    saveTasks();
    scheduleReminder(newTask);
    hideFeedback(formFeedback);
    input.value = "";
    reminderHoursInput.value = "";
    reminderInput.value = "";
    input.blur();
    renderTasks();
    drawPerformanceChart();
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.className = `task-item ${task.status}`;

        if (task.needsAttention) {
            listItem.classList.add("attention");
        }

        const header = document.createElement("div");
        header.className = "task-header";

        const content = document.createElement("div");
        content.className = "task-content";

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.text;

        const meta = document.createElement("div");
        meta.className = "task-meta";
        meta.innerHTML = `
            <span>Criada ${formatDateTime(task.createdAt)}</span>
            <span>Lembrete em ${formatReminderDuration(task.baseReminderMinutes)}</span>
            <span>${task.extensionUsed ? "Tempo extra já usado" : "Tempo extra disponível"}</span>
        `;

        const countdown = document.createElement("span");
        countdown.className = "task-countdown";
        countdown.dataset.taskId = task.id;
        countdown.textContent = formatTimeLeft(task);

        const status = document.createElement("span");
        status.className = `task-status ${getTaskStatusClass(task)}`;
        status.textContent = getTaskStatusText(task);

        content.append(taskText, meta, countdown);
        header.append(content, status);

        const message = document.createElement("p");
        message.className = "task-message";

        if (task.status === "missed") {
            message.classList.add("missed");
            message.textContent = "Atividade não finalizada. Use o histórico para retomar quando quiser.";
        } else if (task.needsAttention) {
            message.textContent = "Tempo encerrado. Finalize a atividade ou adicione mais tempo.";
        } else {
            message.textContent = "Tarefa em andamento.";
        }

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.className = "task-button-secondary";
        completeButton.textContent = "Finalizar";
        completeButton.disabled = task.status !== "active";
        completeButton.addEventListener("click", () => completeTask(task.id));

        const extendButton = document.createElement("button");
        extendButton.type = "button";
        extendButton.className = "task-button-secondary";
        extendButton.textContent = "Adicionar mais tempo";
        extendButton.disabled = !canExtendTask(task);
        extendButton.addEventListener("click", () => extendTask(task.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "task-button-danger";
        deleteButton.textContent = "Excluir";
        deleteButton.disabled = task.status === "missed";
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        actions.append(completeButton, extendButton, deleteButton);
        listItem.append(header, message, actions);
        taskList.appendChild(listItem);

        applyCountdownState(task, listItem, countdown);
    });

    const activeCount = tasks.filter((task) => task.status === "active").length;

    emptyMessage.hidden = tasks.length > 0;
    taskCountBadge.textContent = activeCount;
    taskSummaryLabel.textContent = formatTaskSummary(activeCount);
    clearTasksButton.hidden = tasks.length === 0;
}

function renderHistory() {
    historyList.innerHTML = "";
    reportMessage.textContent = "O relatório usa os dados salvos neste aparelho.";
    generateReportButton.disabled = historyEntries.length === 0;

    historyEntries
        .slice()
        .sort((entryA, entryB) => (entryB.updatedAt || entryB.createdAt) - (entryA.updatedAt || entryA.createdAt))
        .forEach((entry) => {
            const item = document.createElement("li");
            item.className = `history-item ${entry.status}`;

            const header = document.createElement("div");
            header.className = "history-header";

            const content = document.createElement("div");
            content.className = "history-content";

            const text = document.createElement("span");
            text.className = "history-text";
            text.textContent = entry.text;

            const meta = document.createElement("div");
            meta.className = "history-meta";
            meta.innerHTML = `
                <span>Criada ${formatDateTime(entry.createdAt)}</span>
                <span>Último registro ${formatDateTime(entry.updatedAt || entry.createdAt)}</span>
                <span>Lembrete ${formatReminderDuration(entry.baseReminderMinutes)}</span>
                <span>${entry.extensionUsed ? "Precisou de mais tempo" : "Sem tempo extra"}</span>
            `;

            const status = document.createElement("span");
            status.className = `history-status ${entry.status}`;
            status.textContent = getHistoryStatusText(entry.status);

            content.append(text, meta);
            header.append(content, status);

            const actions = document.createElement("div");
            actions.className = "history-actions";

            if (entry.status === "missed") {
                const resumeButton = document.createElement("button");
                resumeButton.type = "button";
                resumeButton.className = "history-button";
                resumeButton.textContent = entry.resumed ? "Tarefa retomada" : "Retomar tarefa";
                resumeButton.disabled = Boolean(entry.resumed);
                resumeButton.addEventListener("click", () => resumeTask(entry.id));
                actions.append(resumeButton);
            }

            item.append(header, actions);
            historyList.appendChild(item);
        });

    historyEmptyMessage.hidden = historyEntries.length > 0;
    clearHistoryButton.hidden = historyEntries.length === 0;

    if (historyEntries.length === 0) {
        reportMessage.textContent = "Adicione histórico para liberar o PDF.";
    }
}

function completeTask(taskId) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || task.status !== "active") {
        return;
    }

    stopReminderSound();
    clearReminder(task.id);
    addHistoryEntry(task, "completed");
    tasks = tasks.filter((currentTask) => currentTask.id !== taskId);
    saveTasks();
    renderTasks();
    renderHistory();
    drawPerformanceChart();
}

function extendTask(taskId) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || !canExtendTask(task)) {
        return;
    }

    stopReminderSound();
    task.extensionUsed = true;
    task.extensionAvailable = false;
    task.alerted = false;
    task.needsAttention = false;
    task.reminderAt = Date.now() + convertMinutesToMs(task.baseReminderMinutes);
    task.extensionCount = (task.extensionCount || 0) + 1;
    saveTasks();
    scheduleReminder(task);
    renderTasks();
}

function deleteTask(taskId) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
        return;
    }

    stopReminderSound();
    clearReminder(task.id);
    addHistoryEntry(task, "deleted");
    tasks = tasks.filter((currentTask) => currentTask.id !== taskId);
    saveTasks();
    renderHistory();
    drawPerformanceChart();
    renderTasks();
}

function clearTasks() {
    tasks.forEach((task) => {
        clearReminder(task.id);

        if (task.status === "active") {
            addHistoryEntry(task, "deleted");
        }
    });
    tasks = [];
    saveTasks();
    renderTasks();
    renderHistory();
    drawPerformanceChart();
}

function promptClearHistory() {
    if (!historyEntries.length) {
        return;
    }

    clearHistoryModal.hidden = false;
}

function closeClearHistoryModal() {
    clearHistoryModal.hidden = true;
}

function performClearHistory() {
    historyEntries = [];
    saveHistory();
    renderHistory();
}

function resumeTask(historyId) {
    const entry = historyEntries.find((currentEntry) => currentEntry.id === historyId);

    if (!entry || entry.status !== "missed" || entry.resumed) {
        return;
    }

    const resumedTask = {
        id: crypto.randomUUID(),
        text: entry.text,
        reminderMinutes: entry.baseReminderMinutes,
        baseReminderMinutes: entry.baseReminderMinutes,
        reminderAt: Date.now() + convertMinutesToMs(entry.baseReminderMinutes),
        alerted: false,
        needsAttention: false,
        status: "active",
        extensionUsed: Boolean(entry.extensionUsed),
        extensionCount: Number(entry.extensionCount || 0),
        extensionAvailable: true,
        createdAt: Date.now(),
        sourceHistoryId: historyId
    };

    entry.resumed = true;
    entry.updatedAt = Date.now();

    tasks.push(resumedTask);
    saveTasks();
    saveHistory();
    scheduleReminder(resumedTask);
    switchTab("main");
    renderTasks();
    renderHistory();
}

function addHistoryEntry(task, status) {
    const entry = {
        id: crypto.randomUUID(),
        text: task.text,
        status,
        createdAt: task.createdAt,
        updatedAt: Date.now(),
        baseReminderMinutes: task.baseReminderMinutes,
        extensionUsed: Boolean(task.extensionUsed),
        extensionCount: Number(task.extensionCount || 0),
        resumed: false
    };

    historyEntries.unshift(entry);
    performanceEntries.unshift({ ...entry });

    saveHistory();
    savePerformanceHistory();
}

function schedulePendingReminders() {
    tasks.forEach((task) => scheduleReminder(task));
}

function scheduleReminder(task) {
    clearReminder(task.id);

    if (task.status !== "active" || task.alerted) {
        return;
    }

    const delay = Math.max(task.reminderAt - Date.now(), 0);
    const timeoutId = window.setTimeout(() => handleReminder(task.id), delay);
    reminderTimeouts.set(task.id, timeoutId);
    scheduleLocalNotification(task);
}

function handleReminder(taskId) {
    reminderTimeouts.delete(taskId);

    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || task.status !== "active") {
        return;
    }

    if (!task.extensionUsed) {
        showTriggeredNotification(task);
        task.alerted = true;
        task.needsAttention = true;
        saveTasks();
        playReminderSound();
        renderTasks();
        return;
    }

    showTriggeredNotification(task);
    task.alerted = true;
    task.needsAttention = false;
    task.status = "missed";
    addHistoryEntry(task, "missed");
    saveTasks();
    playReminderSound();
    renderTasks();
    renderHistory();
    drawPerformanceChart();
}

function clearReminder(taskId) {
    const timeoutId = reminderTimeouts.get(taskId);

    if (timeoutId) {
        window.clearTimeout(timeoutId);
        reminderTimeouts.delete(taskId);
    }

    cancelLocalNotification(taskId);
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
    if (task.status === "missed") {
        return "Tempo encerrado. Atividade não finalizada.";
    }

    if (task.needsAttention || task.alerted) {
        return "Tempo encerrado.";
    }

    const totalSeconds = Math.max(Math.ceil((task.reminderAt - Date.now()) / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} restante`;
}

function applyCountdownState(task, taskItem, countdownElement) {
    if (!taskItem || !countdownElement) {
        return;
    }

    taskItem.classList.remove("countdown-warning", "countdown-critical");
    countdownElement.classList.remove("warning", "critical");

    if (task.status === "missed" || task.needsAttention) {
        return;
    }

    const remainingSeconds = Math.max(Math.ceil((task.reminderAt - Date.now()) / 1000), 0);

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

function canExtendTask(task) {
    return task.status === "active" && task.needsAttention && !task.extensionUsed && task.extensionAvailable;
}

function getTaskStatusClass(task) {
    if (task.status === "missed") {
        return "missed";
    }

    return "pending";
}

function getTaskStatusText(task) {
    if (task.status === "missed") {
        return "Não finalizada";
    }

    if (task.needsAttention) {
        return "Tempo encerrado";
    }

    return "Em andamento";
}

function getHistoryStatusText(status) {
    if (status === "completed") {
        return "Finalizada";
    }

    if (status === "deleted") {
        return "Excluída";
    }

    return "Não finalizada";
}

function getReminderMinutes() {
    const hoursValue = reminderHoursInput.value.trim();
    const minutesValue = reminderInput.value.trim();

    if (!hoursValue && !minutesValue) {
        return null;
    }

    const reminderHours = hoursValue ? Number.parseInt(hoursValue, 10) : 0;
    const reminderMinutes = minutesValue ? Number.parseInt(minutesValue, 10) : 0;

    if (!Number.isFinite(reminderHours) || reminderHours < 0) {
        return null;
    }

    if (!Number.isFinite(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 59) {
        return null;
    }

    const totalMinutes = reminderHours * 60 + reminderMinutes;

    if (totalMinutes <= 0) {
        return null;
    }

    return totalMinutes;
}

function handleSoundSelection(event) {
    const [selectedFile] = event.target.files || [];

    if (!selectedFile) {
        return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        appSettings.soundName = selectedFile.name;
        appSettings.soundDataUrl = typeof reader.result === "string" ? reader.result : "";
        saveSettings();
        updateSoundLabel();
    });

    reader.readAsDataURL(selectedFile);
}

function updateSoundLabel() {
    if (appSettings.soundName) {
        selectedSoundName.textContent = appSettings.soundName;
        soundPickerButton.textContent = "Trocar ficheiro de áudio";
    } else {
        selectedSoundName.textContent = "Nenhum ficheiro selecionado";
        soundPickerButton.textContent = "Escolher ficheiro de áudio";
    }
}


function updateDayPlanInputs() {
    const [startHour = "08", startMinute = "00"] = (appSettings.dayStartTime || "08:00").split(":");
    const [endHour = "22", endMinute = "00"] = (appSettings.dayEndTime || "22:00").split(":");

    dayStartHourSelect.value = startHour;
    dayStartMinuteSelect.value = startMinute;
    dayEndHourSelect.value = endHour;
    dayEndMinuteSelect.value = endMinute;
}

function handleDayPlanChange() {
    appSettings.dayStartTime = `${dayStartHourSelect.value || "08"}:${dayStartMinuteSelect.value || "00"}`;
    appSettings.dayEndTime = `${dayEndHourSelect.value || "22"}:${dayEndMinuteSelect.value || "00"}`;
    saveSettings();
    drawPerformanceChart();
}

function populateDayTimeSelects() {
    populateTimeSelect(dayStartHourSelect, 23);
    populateTimeSelect(dayEndHourSelect, 23);
    populateTimeSelect(dayStartMinuteSelect, 59);
    populateTimeSelect(dayEndMinuteSelect, 59);
}

function populateTimeSelect(selectElement, maxValue) {
    if (!selectElement || selectElement.options.length > 0) {
        return;
    }

    for (let value = 0; value <= maxValue; value += 1) {
        const option = document.createElement("option");
        const label = String(value).padStart(2, "0");
        option.value = label;
        option.textContent = label;
        selectElement.appendChild(option);
    }
}

function stopReminderSound() {
    if (activeReminderAudio) {
        activeReminderAudio.pause();
        activeReminderAudio.currentTime = 0;
        activeReminderAudio = null;
    }

    if (activeReminderAudioContext) {
        try {
            activeReminderAudioContext.close();
        } catch {
            // Ignora erros ao fechar contexto de áudio.
        }
        activeReminderAudioContext = null;
    }
}

async function playReminderSound() {
    stopReminderSound();

    if (appSettings.soundDataUrl) {
        try {
            const audio = new Audio(appSettings.soundDataUrl);
            activeReminderAudio = audio;
            audio.addEventListener("ended", () => {
                if (activeReminderAudio === audio) {
                    activeReminderAudio = null;
                }
            });
            await audio.play();
            return;
        } catch {
            activeReminderAudio = null;
            // Falha no áudio personalizado: segue para o som padrão.
        }
    }

    playFallbackBeep();
}

function playFallbackBeep() {
    try {
        const AudioContextClass = window.AudioContext;

        if (!AudioContextClass) {
            return;
        }

        const audioContext = new AudioContextClass();
        activeReminderAudioContext = audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.08;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();

        window.setTimeout(() => {
            oscillator.stop();
            audioContext.close();
            if (activeReminderAudioContext === audioContext) {
                activeReminderAudioContext = null;
            }
        }, 350);
    } catch {
        // Sem suporte a áudio.
    }
}

async function initLocalNotifications() {
    if (!localNotificationsPlugin) {
        return false;
    }

    try {
        await localNotificationsPlugin.createChannel({
            id: NOTIFICATION_CHANNEL_ID,
            name: "Lembretes de tarefas",
            description: "Notificações das tarefas da Lista de Atividades",
            importance: 5,
            visibility: 1,
            vibration: true
        });
    } catch {
        // O canal pode já existir.
    }

    try {
        const permissionStatus = await localNotificationsPlugin.checkPermissions();
        let displayPermission = permissionStatus.display;

        if (displayPermission !== "granted") {
            const requestedPermission = await localNotificationsPlugin.requestPermissions();
            displayPermission = requestedPermission.display;
        }

        notificationsReady = displayPermission === "granted";

        if (notificationsReady) {
            try {
                const exactSetting = await localNotificationsPlugin.checkExactNotificationSetting();

                if (exactSetting?.exactAlarm !== "granted") {
                    await localNotificationsPlugin.requestExactNotificationSetting();
                }
            } catch {
                // Não disponível nesta versão do Android.
            }
        }

        return notificationsReady;
    } catch {
        notificationsReady = false;
        return false;
    }
}

async function scheduleLocalNotification(task) {
    if (!localNotificationsPlugin) {
        return;
    }

    const isReady = notificationsReady || await initLocalNotifications();

    if (!isReady) {
        return;
    }

    try {
        await localNotificationsPlugin.schedule({
            notifications: [
                {
                    id: getNotificationIdForTask(task.id),
                    title: "Tempo encerrado",
                    body: task.text,
                    schedule: {
                        at: new Date(task.reminderAt),
                        allowWhileIdle: true
                    },
                    channelId: NOTIFICATION_CHANNEL_ID
                }
            ]
        });
    } catch {
        // Se não conseguir agendar, o lembrete visual do app continua funcionando.
    }
}

async function cancelLocalNotification(taskId) {
    if (!localNotificationsPlugin) {
        return;
    }

    try {
        await localNotificationsPlugin.cancel({
            notifications: [{ id: getNotificationIdForTask(taskId) }]
        });
    } catch {
        // Segue sem falhar o fluxo principal.
    }
}

async function showTriggeredNotification(task) {
    if (!localNotificationsPlugin) {
        return;
    }

    const isReady = notificationsReady || await initLocalNotifications();

    if (!isReady) {
        return;
    }

    try {
        const notificationId = getNotificationIdForTask(task.id);

        await localNotificationsPlugin.cancel({
            notifications: [{ id: notificationId }]
        });

        await localNotificationsPlugin.schedule({
            notifications: [
                {
                    id: notificationId,
                    title: "Tempo encerrado",
                    body: task.text,
                    schedule: { at: new Date(Date.now() + 250), allowWhileIdle: true },
                    channelId: NOTIFICATION_CHANNEL_ID
                }
            ]
        });
    } catch {
        // O alerta visual e o som do app continuam funcionando.
    }
}

function getNotificationIdForTask(taskId) {
    let hash = 0;

    for (let index = 0; index < taskId.length; index += 1) {
        hash = ((hash << 5) - hash) + taskId.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash) || Date.now() % 2147483647;
}

function drawPerformanceChart() {
    if (!chartCanvas) {
        return;
    }

    const context = chartCanvas.getContext("2d");

    if (!context) {
        return;
    }

    const { labels, completedValues, unfinishedValues, plannedValues, completedPoints, unfinishedPoints, plannedPoints } = buildChartData();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = chartCanvas.clientWidth || 360;
    const cssHeight = 220;

    chartCanvas.width = Math.round(cssWidth * dpr);
    chartCanvas.height = Math.round(cssHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = cssWidth;
    const height = cssHeight;
    const padding = 28;
    const bottom = height - 30;
    const usableHeight = bottom - padding;
    const stepX = labels.length > 1 ? (width - padding * 2) / (labels.length - 1) : 0;
    const maxValue = Math.max(1, ...completedValues, ...unfinishedValues, ...plannedValues);

    const summary = buildHistorySummary();
    completedTotal.textContent = summary.completed;
    unfinishedTotal.textContent = summary.unfinished;
    extendedTotal.textContent = summary.extended;
    const todayPlan = buildDayPlanSummary();
    availableTimeTotal.textContent = formatCompactDuration(todayPlan.availableMinutes);
    plannedTimeTotal.textContent = formatCompactDuration(todayPlan.plannedMinutes);
    freeTimeTotal.textContent = formatCompactDuration(todayPlan.freeMinutes);

    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(255, 255, 255, 0.03)";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(255, 255, 255, 0.12)";
    context.lineWidth = 1;

    for (let index = 0; index < 4; index += 1) {
        const y = padding + (usableHeight / 3) * index;
        context.beginPath();
        context.moveTo(padding, y);
        context.lineTo(width - padding, y);
        context.stroke();

        const labelValue = Math.round(maxValue - (maxValue / 3) * index);
        context.fillStyle = "rgba(156, 176, 201, 0.8)";
        context.font = "11px Segoe UI";
        context.textAlign = "left";
        context.fillText(String(labelValue), 2, y + 4);
    }

    drawSeries(context, completedValues, stepX, padding, bottom, usableHeight, maxValue, "#49e6d0", "rgba(73, 230, 208, 0.16)");
    drawSeries(context, unfinishedValues, stepX, padding, bottom, usableHeight, maxValue, "#ff6b81", "rgba(255, 107, 129, 0.14)");
    drawSeries(context, plannedValues, stepX, padding, bottom, usableHeight, maxValue, "#19b8ff", "rgba(25, 184, 255, 0.12)");

    context.fillStyle = "#9cb0c9";
    context.font = "12px Segoe UI";
    context.textAlign = "center";

    labels.forEach((label, index) => {
        const x = padding + stepX * index;
        context.fillText(label, x, height - 6);
    });

    context.textAlign = "left";
    context.fillStyle = "rgba(156, 176, 201, 0.9)";
    context.fillText(`Finalizadas: ${summary.completed}`, padding, 18);
    context.fillText(`Não finalizadas: ${summary.unfinished}`, width - 160, 18);

    chartInteractionData = labels.map((label, index) => ({
        label,
        completed: completedValues[index],
        unfinished: unfinishedValues[index],
        planned: plannedValues[index],
        plannedMinutes: plannedPoints[index].minutes,
        completedPoint: completedPoints[index],
        unfinishedPoint: unfinishedPoints[index],
        plannedPoint: plannedPoints[index]
    }));
}

function drawSeries(context, values, stepX, padding, bottom, usableHeight, maxValue, color, fillColor) {
    const points = values.map((value, index) => ({
        x: padding + stepX * index,
        y: bottom - (value / maxValue) * usableHeight,
        value
    }));

    context.beginPath();
    context.moveTo(points[0].x, bottom);

    points.forEach((point, index) => {
        if (index === 0) {
            context.lineTo(point.x, point.y);
            return;
        }

        const previousPoint = points[index - 1];
        const controlX = (previousPoint.x + point.x) / 2;
        context.quadraticCurveTo(controlX, previousPoint.y, point.x, point.y);
    });

    context.lineTo(points[points.length - 1].x, bottom);
    context.closePath();
    context.fillStyle = fillColor;
    context.fill();

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 3;

    points.forEach((point, index) => {
        if (index === 0) {
            context.moveTo(point.x, point.y);
        } else {
            const previousPoint = points[index - 1];
            const controlX = (previousPoint.x + point.x) / 2;
            context.quadraticCurveTo(controlX, previousPoint.y, point.x, point.y);
        }
    });

    context.stroke();

    points.forEach((point) => {
        context.beginPath();
        context.fillStyle = "#07111f";
        context.arc(point.x, point.y, 5, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.fillStyle = color;
        context.arc(point.x, point.y, 3, 0, Math.PI * 2);
        context.fill();
    });
}

function buildChartData() {
    const today = new Date();
    const labels = [];
    const completedValues = [];
    const unfinishedValues = [];
    const plannedValues = [];
    const completedPoints = [];
    const unfinishedPoints = [];
    const plannedPoints = [];

    for (let offset = selectedChartRangeDays - 1; offset >= 0; offset -= 1) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - offset);
        const dayKey = getLocalDateKey(currentDate);

        labels.push(currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
        const completed = countHistoryByDate(dayKey, ["completed"]);
        const unfinished = countHistoryByDate(dayKey, ["missed", "deleted"]);
        const planned = getPlannedMinutesByDate(dayKey);
        completedValues.push(completed);
        unfinishedValues.push(unfinished);
        plannedValues.push(Math.round(planned / 60));
        completedPoints.push({ index: labels.length - 1, value: completed });
        unfinishedPoints.push({ index: labels.length - 1, value: unfinished });
        plannedPoints.push({ index: labels.length - 1, value: Math.round(planned / 60), minutes: planned });
    }

    return { labels, completedValues, unfinishedValues, plannedValues, completedPoints, unfinishedPoints, plannedPoints };
}

function countHistoryByDate(dayKey, statuses) {
    return performanceEntries.filter((entry) => {
        if (!statuses.includes(entry.status)) {
            return false;
        }

        const referenceDate = getLocalDateKey(new Date(entry.updatedAt || entry.createdAt));
        return referenceDate === dayKey;
    }).length;
}

function buildHistorySummary() {
    return {
        completed: performanceEntries.filter((entry) => entry.status === "completed").length,
        unfinished: performanceEntries.filter((entry) => entry.status === "missed" || entry.status === "deleted").length,
        extended: performanceEntries.filter((entry) => entry.extensionUsed).length
    };
}

function buildDayPlanSummary(date = new Date()) {
    const dayKey = getLocalDateKey(date);
    const availableMinutes = getAvailableMinutesForDay();
    const plannedMinutes = getPlannedMinutesByDate(dayKey);
    const freeMinutes = Math.max(availableMinutes - plannedMinutes, 0);

    return {
        dayKey,
        availableMinutes,
        plannedMinutes,
        freeMinutes
    };
}

function getPlannedMinutesByDate(dayKey) {
    const plannedFromHistory = performanceEntries
        .filter((entry) => getLocalDateKey(new Date(entry.createdAt)) === dayKey)
        .reduce((total, entry) => total + getValidReminderMinutes(entry.baseReminderMinutes), 0);

    const plannedFromActiveTasks = tasks
        .filter((task) => getLocalDateKey(new Date(task.createdAt)) === dayKey)
        .reduce((total, task) => total + getValidReminderMinutes(task.baseReminderMinutes), 0);

    return plannedFromHistory + plannedFromActiveTasks;
}

function getAvailableMinutesForDay() {
    const startMinutes = parseTimeToMinutes(appSettings.dayStartTime || "08:00");
    const endMinutes = parseTimeToMinutes(appSettings.dayEndTime || "22:00");

    if (startMinutes === null || endMinutes === null) {
        return 14 * 60;
    }

    if (endMinutes <= startMinutes) {
        return 24 * 60 - startMinutes + endMinutes;
    }

    return endMinutes - startMinutes;
}

function parseTimeToMinutes(value) {
    if (typeof value !== "string" || !value.includes(":")) {
        return null;
    }

    const [hoursPart, minutesPart] = value.split(":");
    const hours = Number.parseInt(hoursPart, 10);
    const minutes = Number.parseInt(minutesPart, 10);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return null;
    }

    return hours * 60 + minutes;
}

function updateChartRangeButtons() {
    chartRangeButtons.forEach((button) => {
        button.classList.toggle("active", Number.parseInt(button.dataset.range, 10) === selectedChartRangeDays);
    });
}

function handleChartPointerMove(event) {
    if (!chartInteractionData || chartInteractionData.length === 0) {
        return;
    }

    const rect = chartCanvas.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;

    if (typeof clientX !== "number" || typeof clientY !== "number") {
        return;
    }

    const localX = clientX - rect.left;
    const nearestPoint = chartInteractionData.reduce((closest, current) => {
        const currentDistance = Math.abs((current.completedPoint.index / Math.max(chartInteractionData.length - 1, 1)) * rect.width - localX);

        if (!closest || currentDistance < closest.distance) {
            return { data: current, distance: currentDistance };
        }

        return closest;
    }, null);

    if (!nearestPoint) {
        hideChartTooltip();
        return;
    }

    chartTooltip.innerHTML = `
        <strong>${nearestPoint.data.label}</strong><br>
        Finalizadas: ${nearestPoint.data.completed}<br>
        Não finalizadas: ${nearestPoint.data.unfinished}<br>
        Planejado: ${formatCompactDuration(nearestPoint.data.plannedMinutes)}
    `;
    chartTooltip.hidden = false;
    chartTooltip.style.left = `${Math.min(localX + 16, rect.width - 170)}px`;
    chartTooltip.style.top = `${Math.max(clientY - rect.top - 72, 8)}px`;
}

function handleChartTouch(event) {
    handleChartPointerMove(event);
}

function hideChartTooltip() {
    chartTooltip.hidden = true;
}

async function generateHistoryReport() {
    if (!historyEntries.length) {
        reportMessage.textContent = "Ainda não há histórico para gerar o PDF.";
        return false;
    }

    const jsPdfNamespace = await ensureJsPdfLoaded();

    if (!jsPdfNamespace?.jsPDF) {
        reportMessage.textContent = "Não foi possível gerar o PDF agora.";
        return false;
    }

    const { jsPDF } = jsPdfNamespace;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const summary = buildHistorySummary();
    const userName = userProfile?.name || "Usuário";
    const createdAt = formatDateTime(Date.now());
    let y = 18;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Relatório de atividades", 14, y);
    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Usuário: ${userName}`, 14, y);
    y += 6;
    pdf.text(`Emitido em: ${createdAt}`, 14, y);
    y += 8;

    pdf.setFont("helvetica", "bold");
    pdf.text("Resumo", 14, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Finalizadas: ${summary.completed}`, 14, y);
    y += 5;
    pdf.text(`Não finalizadas: ${historyEntries.filter((entry) => entry.status === "missed").length}`, 14, y);
    y += 5;
    pdf.text(`Excluídas: ${historyEntries.filter((entry) => entry.status === "deleted").length}`, 14, y);
    y += 5;
    pdf.text(`Precisaram de mais tempo: ${summary.extended}`, 14, y);
    y += 10;

    const todayPlan = buildDayPlanSummary();
    pdf.setFont("helvetica", "bold");
    pdf.text("Planejamento do dia", 14, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Começo do dia: ${appSettings.dayStartTime || "08:00"}`, 14, y);
    y += 5;
    pdf.text(`Hora de dormir: ${appSettings.dayEndTime || "22:00"}`, 14, y);
    y += 5;
    pdf.text(`Tempo disponível hoje: ${formatCompactDuration(todayPlan.availableMinutes)}`, 14, y);
    y += 5;
    pdf.text(`Tempo planejado hoje: ${formatCompactDuration(todayPlan.plannedMinutes)}`, 14, y);
    y += 5;
    pdf.text(`Tempo livre hoje: ${formatCompactDuration(todayPlan.freeMinutes)}`, 14, y);
    y += 10;

    pdf.setFont("helvetica", "bold");
    pdf.text("Histórico completo", 14, y);
    y += 6;
    pdf.setFont("helvetica", "normal");

    historyEntries
        .slice()
        .sort((entryA, entryB) => (entryA.updatedAt || entryA.createdAt) - (entryB.updatedAt || entryB.createdAt))
        .forEach((entry, index) => {
            const lines = [
                `${index + 1}. ${entry.text}`,
                `Status: ${getHistoryStatusText(entry.status)}`,
                `Criada: ${formatDateTime(entry.createdAt)}`,
                `Último registro: ${formatDateTime(entry.updatedAt || entry.createdAt)}`,
                `Lembrete: ${formatReminderDuration(entry.baseReminderMinutes)}`,
                `Mais tempo: ${entry.extensionUsed ? "Sim" : "Não"}`
            ];

            lines.forEach((line) => {
                if (y > 275) {
                    pdf.addPage();
                    y = 18;
                }

                const wrappedLines = pdf.splitTextToSize(line, 180);
                pdf.text(wrappedLines, 14, y);
                y += wrappedLines.length * 5;
            });

            y += 4;
        });

    const fileSafeName = userName.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "usuario";
    const fileName = `relatorio-atividades-${fileSafeName}.pdf`;

    try {
        const pdfBlob = pdf.output("blob");
        await triggerPdfDownload(pdfBlob, fileName);
        reportMessage.textContent = window.Capacitor?.isNativePlatform?.()
            ? `PDF salvo em Downloads › ${fileName}`
            : "PDF gerado com sucesso.";
        showPdfToast(fileName);
        if (window.Capacitor?.isNativePlatform?.()) {
            notifyPdfSaved(fileName);
        }
        return true;
    } catch (pdfError) {
        if (pdfError?.name === "AbortError") {
            reportMessage.textContent = "Compartilhamento cancelado.";
            return false;
        }

        reportMessage.textContent = "Não foi possível salvar o PDF.";
        return false;
    }
}

async function ensureJsPdfLoaded() {
    if (window.jspdf?.jsPDF) {
        return window.jspdf;
    }

    if (!jsPdfLoaderPromise) {
        jsPdfLoaderPromise = (async () => {
            for (const sourcePath of JSPDF_SOURCE_PATHS) {
                try {
                    await loadScriptResource(sourcePath);

                    if (window.jspdf?.jsPDF) {
                        return window.jspdf;
                    }
                } catch {
                    // Tenta a próxima origem.
                }
            }

            return null;
        })();
    }

    return jsPdfLoaderPromise;
}

function loadScriptResource(sourcePath) {
    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[data-dynamic-src="${sourcePath}"]`);

        if (existingScript) {
            if (existingScript.dataset.loaded === "true") {
                resolve();
                return;
            }

            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Falha ao carregar script.")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = sourcePath;
        script.async = true;
        script.dataset.dynamicSrc = sourcePath;
        script.addEventListener("load", () => {
            script.dataset.loaded = "true";
            resolve();
        }, { once: true });
        script.addEventListener("error", () => reject(new Error("Falha ao carregar script.")), { once: true });
        document.head.appendChild(script);
    });
}

async function triggerPdfDownload(pdfBlob, fileName) {
    if (window.Capacitor?.isNativePlatform?.()) {
        const base64Data = await blobToBase64(pdfBlob);
        const base64Content = base64Data.split(",")[1];
        const { SystemSoundPicker } = window.Capacitor.Plugins;
        await SystemSoundPicker.savePdfToDownloads({ data: base64Content, fileName });
        return;
    }

    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Falha ao converter arquivo."));
        reader.readAsDataURL(blob);
    });
}

let pdfToastTimer = null;

function showPdfToast(fileName) {
    const toast = document.getElementById("pdf-toast");
    const toastFilename = document.getElementById("pdf-toast-filename");
    const openBtn = document.getElementById("pdf-toast-open");
    const closeBtn = document.getElementById("pdf-toast-close");

    if (!toast) return;

    toastFilename.textContent = fileName;
    toast.classList.remove("toast-hiding");
    toast.hidden = false;

    clearTimeout(pdfToastTimer);
    pdfToastTimer = setTimeout(() => hidePdfToast(), 6000);

    openBtn.style.display = window.Capacitor?.isNativePlatform?.() ? "" : "none";

    openBtn.onclick = () => {
        const { SystemSoundPicker } = window.Capacitor.Plugins;
        SystemSoundPicker.openDownloadsFolder().catch(() => {});
        hidePdfToast();
    };

    closeBtn.onclick = () => hidePdfToast();
}

function hidePdfToast() {
    const toast = document.getElementById("pdf-toast");
    if (!toast || toast.hidden) return;
    toast.classList.add("toast-hiding");
    clearTimeout(pdfToastTimer);
    setTimeout(() => {
        toast.hidden = true;
        toast.classList.remove("toast-hiding");
    }, 250);
}

async function notifyPdfSaved(fileName) {
    if (!localNotificationsPlugin) return;

    const isReady = notificationsReady || await initLocalNotifications();
    if (!isReady) return;

    try {
        await localNotificationsPlugin.schedule({
            notifications: [
                {
                    id: 999991,
                    title: "PDF salvo com sucesso",
                    body: `${fileName} salvo em Downloads`,
                    schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
                    channelId: NOTIFICATION_CHANNEL_ID
                }
            ]
        });
    } catch {
        // Silencia erros de notificação.
    }
}

function switchTab(tabName, animate = true) {
    const next = tabName === "history" ? "history" : "main";
    if (next === selectedTab) return;

    const leaving = selectedTab === "main" ? mainTab : historyTab;
    const entering = next === "main" ? mainTab : historyTab;

    selectedTab = next;

    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === selectedTab);
    });

    if (!animate) {
        leaving.hidden = true;
        leaving.classList.remove("active");
        entering.hidden = false;
        entering.classList.add("active");
        return;
    }

    leaving.classList.add("tab-leaving");

    leaving.addEventListener("animationend", () => {
        leaving.hidden = true;
        leaving.classList.remove("active", "tab-leaving");

        entering.hidden = false;
        entering.classList.add("active", "tab-entering");

        entering.addEventListener("animationend", () => {
            entering.classList.remove("tab-entering");
        }, { once: true });
    }, { once: true });
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.tasks);

    if (!savedTasks) {
        return [];
    }

    try {
        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.map(normalizeTask).filter(Boolean);
    } catch {
        return [];
    }
}

function normalizeTask(task) {
    if (!task || typeof task.text !== "string") {
        return null;
    }

    return {
        id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
        text: task.text.toUpperCase(),
        reminderMinutes: getValidReminderMinutes(task.reminderMinutes),
        baseReminderMinutes: getValidReminderMinutes(task.baseReminderMinutes || task.reminderMinutes),
        reminderAt: typeof task.reminderAt === "number" ? task.reminderAt : Date.now() + convertMinutesToMs(DEFAULT_REMINDER_MINUTES),
        alerted: Boolean(task.alerted),
        needsAttention: Boolean(task.needsAttention),
        status: task.status === "missed" ? "missed" : "active",
        extensionUsed: Boolean(task.extensionUsed),
        extensionCount: Number(task.extensionCount || 0),
        extensionAvailable: task.extensionAvailable !== false,
        createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now(),
        sourceHistoryId: typeof task.sourceHistoryId === "string" ? task.sourceHistoryId : null
    };
}

function saveHistory() {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(historyEntries));
}

function loadHistory() {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.history);

    if (!savedHistory) {
        return [];
    }

    try {
        const parsedHistory = JSON.parse(savedHistory);

        if (!Array.isArray(parsedHistory)) {
            return [];
        }

        return parsedHistory.map(normalizeHistoryEntry).filter(Boolean);
    } catch {
        return [];
    }
}

function savePerformanceHistory() {
    localStorage.setItem(STORAGE_KEYS.performance, JSON.stringify(performanceEntries));
}

function loadPerformanceHistory() {
    const savedPerformance = localStorage.getItem(STORAGE_KEYS.performance);

    if (!savedPerformance) {
        return [];
    }

    try {
        const parsedPerformance = JSON.parse(savedPerformance);

        if (!Array.isArray(parsedPerformance)) {
            return [];
        }

        return parsedPerformance.map(normalizeHistoryEntry).filter(Boolean);
    } catch {
        return [];
    }
}

function syncPerformanceHistory() {
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const recentPerformanceEntries = performanceEntries.filter((entry) => {
        const referenceTime = entry.updatedAt || entry.createdAt;
        return now - referenceTime <= thirtyDaysInMs;
    });

    let hasChanges = recentPerformanceEntries.length !== performanceEntries.length;
    performanceEntries = recentPerformanceEntries;

    if (!performanceEntries.length && historyEntries.length) {
        performanceEntries = historyEntries
            .map((entry) => normalizeHistoryEntry(entry))
            .filter(Boolean)
            .filter((entry) => now - (entry.updatedAt || entry.createdAt) <= thirtyDaysInMs);
        hasChanges = true;
    }

    if (hasChanges) {
        savePerformanceHistory();
    }
}

function normalizeHistoryEntry(entry) {
    if (!entry || typeof entry.text !== "string") {
        return null;
    }

    return {
        id: typeof entry.id === "string" ? entry.id : crypto.randomUUID(),
        text: entry.text.toUpperCase(),
        status: entry.status === "completed" || entry.status === "deleted" ? entry.status : "missed",
        createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
        updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : Date.now(),
        baseReminderMinutes: getValidReminderMinutes(entry.baseReminderMinutes),
        extensionUsed: Boolean(entry.extensionUsed),
        extensionCount: Number(entry.extensionCount || 0),
        resumed: Boolean(entry.resumed)
    };
}

function loadUserProfile() {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.user);

    if (!savedProfile) {
        return null;
    }

    try {
        const parsedProfile = JSON.parse(savedProfile);

        if (!parsedProfile || typeof parsedProfile.name !== "string" || typeof parsedProfile.login !== "string" || typeof parsedProfile.password !== "string") {
            return null;
        }

        return {
            ...parsedProfile,
            approved: Boolean(parsedProfile.approved),
            blocked: Boolean(parsedProfile.blocked),
            role: typeof parsedProfile.role === "string" ? parsedProfile.role : "user",
            remoteId: typeof parsedProfile.remoteId === "string" ? parsedProfile.remoteId : ""
        };
    } catch {
        return null;
    }
}

function saveUserProfile() {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userProfile));
}

function loadSettings() {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);

    if (!savedSettings) {
        return {
            soundName: "",
            soundDataUrl: "",
            dayStartTime: "08:00",
            dayEndTime: "22:00"
        };
    }

    try {
        const parsedSettings = JSON.parse(savedSettings);

        return {
            soundName: typeof parsedSettings.soundName === "string" ? parsedSettings.soundName : "",
            soundDataUrl: typeof parsedSettings.soundDataUrl === "string" ? parsedSettings.soundDataUrl : "",
            dayStartTime: typeof parsedSettings.dayStartTime === "string" ? parsedSettings.dayStartTime : "08:00",
            dayEndTime: typeof parsedSettings.dayEndTime === "string" ? parsedSettings.dayEndTime : "22:00"
        };
    } catch {
        return {
            soundName: "",
            soundDataUrl: "",
            dayStartTime: "08:00",
            dayEndTime: "22:00"
        };
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(appSettings));
}

function saveRemoteSession() {
    localStorage.setItem(REMOTE_SESSION_KEY, JSON.stringify(remoteSession));
}

function loadRemoteSession() {
    try {
        const savedSession = localStorage.getItem(REMOTE_SESSION_KEY);
        return savedSession ? JSON.parse(savedSession) : null;
    } catch {
        return null;
    }
}

function loadSession() {
    try {
        const savedSession = localStorage.getItem(STORAGE_KEYS.session);

        if (!savedSession) {
            return null;
        }

        const parsedSession = JSON.parse(savedSession);

        if (!parsedSession || typeof parsedSession.login !== "string") {
            return null;
        }

        return parsedSession;
    } catch {
        return null;
    }
}

function saveSession() {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(activeSession));
}

function syncSession() {
    if (remoteAuthEnabled) {
        if (!remoteSession?.access_token) {
            remoteSession = null;
        }
        return;
    }

    if (!activeSession || !userProfile || activeSession.login !== userProfile.login) {
        localStorage.removeItem(STORAGE_KEYS.session);
        activeSession = null;
    }
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTaskSummary(taskCount) {
    if (taskCount === 1) {
        return "tarefa ativa";
    }

    return "tarefas ativas";
}

function showFeedback(element, message) {
    element.textContent = message;
    element.hidden = false;
    element.classList.add("error");
}

function hideFeedback(element) {
    element.hidden = true;
    element.classList.remove("error");
}


function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatReminderDuration(totalMinutes) {
    const validMinutes = getValidReminderMinutes(totalMinutes);
    const hours = Math.floor(validMinutes / 60);
    const minutes = validMinutes % 60;
    const parts = [];

    if (hours > 0) {
        parts.push(`${hours} hora${hours === 1 ? "" : "s"}`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} minuto${minutes === 1 ? "" : "s"}`);
    }

    return parts.join(" e ");
}

function formatCompactDuration(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function getValidReminderMinutes(value) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_REMINDER_MINUTES;
}

function convertMinutesToMs(minutes) {
    return minutes * 60 * 1000;
}

async function checkForUpdates() {
    try {
        updateModal.hidden = true;
        const response = await fetch(`${UPDATE_INFO_URL}?t=${Date.now()}`, { cache: "no-store" });

        if (!response.ok) {
            return;
        }

        const updateInfo = await response.json();

        if (!updateInfo || typeof updateInfo.version !== "string") {
            return;
        }

        if (compareVersions(updateInfo.version, APP_VERSION) <= 0) {
            return;
        }

        const dismissedVersion = localStorage.getItem(DISMISSED_UPDATE_KEY);

        if (dismissedVersion === updateInfo.version) {
            return;
        }

        const updateNotes = typeof updateInfo.notes === "string" && updateInfo.notes.trim()
            ? ` ${updateInfo.notes.trim()}`
            : "";

        updateMessage.textContent = `Você está na versão ${APP_VERSION}. A versão ${updateInfo.version} já está disponível para instalação.${updateNotes}`;
        updateLink.href = DOWNLOAD_PAGE_URL;
        dismissUpdateButton.dataset.version = updateInfo.version;
        updateModal.hidden = false;
    } catch {
        // Segue silenciosamente se o arquivo remoto não estiver acessível.
    }
}

function dismissCurrentUpdate() {
    const version = dismissUpdateButton.dataset.version;

    if (version) {
        localStorage.setItem(DISMISSED_UPDATE_KEY, version);
    }

    updateModal.hidden = true;
}

function compareVersions(versionA, versionB) {
    const partsA = versionA.split(".").map((part) => Number.parseInt(part, 10) || 0);
    const partsB = versionB.split(".").map((part) => Number.parseInt(part, 10) || 0);
    const maxLength = Math.max(partsA.length, partsB.length);

    for (let index = 0; index < maxLength; index += 1) {
        const currentA = partsA[index] ?? 0;
        const currentB = partsB[index] ?? 0;

        if (currentA > currentB) {
            return 1;
        }

        if (currentA < currentB) {
            return -1;
        }
    }

    return 0;
}

function parseRemoteError(error, fallbackMessage) {
    const message = String(error?.message || "");

    if (message.includes("Invalid login credentials")) {
        return "E-mail ou senha inválidos.";
    }

    if (message.includes("User already registered")) {
        return "Esse e-mail já foi cadastrado. Tente entrar ou redefinir a senha.";
    }

    if (message.includes("Email rate limit exceeded")) {
        return "Aguarde alguns minutos antes de tentar novamente.";
    }

    if (message.includes("Email not confirmed")) {
        return "Confirme seu e-mail antes de continuar.";
    }

    return fallbackMessage;
}
