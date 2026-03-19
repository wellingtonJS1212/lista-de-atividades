const authScreen = document.querySelector("#auth-screen");
const appScreen = document.querySelector("#app-screen");
const authNameInput = document.querySelector("#auth-name");
const authLoginInput = document.querySelector("#auth-login");
const authPasswordInput = document.querySelector("#auth-password");
const authFeedback = document.querySelector("#auth-feedback");
const startAppButton = document.querySelector("#start-app-button");
const forgotPasswordButton = document.querySelector("#forgot-password-button");
const logoutButton = document.querySelector("#logout-button");
const exitAppButton = document.querySelector("#exit-app-button");
const userDisplayName = document.querySelector("#user-display-name");
const welcomeMessage = document.querySelector("#welcome-message");
const input = document.querySelector("#task-input");
const reminderInput = document.querySelector("#reminder-minutes");
const soundInput = document.querySelector("#sound-input");
const soundPickerButton = document.querySelector("#sound-picker-button");
const selectedSoundName = document.querySelector("#selected-sound-name");
const addButton = document.querySelector("#add-task-button");
const clearTasksButton = document.querySelector("#clear-tasks-button");
const clearHistoryButton = document.querySelector("#clear-history-button");
const taskList = document.querySelector("#task-list");
const historyList = document.querySelector("#history-list");
const emptyMessage = document.querySelector("#empty-message");
const historyEmptyMessage = document.querySelector("#history-empty-message");
const taskCountBadge = document.querySelector("#task-count-badge");
const taskSummaryLabel = document.querySelector("#task-summary-label");
const formFeedback = document.querySelector("#form-feedback");
const feedbackRatingInput = document.querySelector("#feedback-rating");
const feedbackCategoryInput = document.querySelector("#feedback-category");
const feedbackMessageInput = document.querySelector("#feedback-message");
const feedbackFormMessage = document.querySelector("#feedback-form-message");
const sendFeedbackButton = document.querySelector("#send-feedback-button");
const updateBanner = document.querySelector("#update-banner");
const updateMessage = document.querySelector("#update-message");
const updateLink = document.querySelector("#update-link");
const tabButtons = document.querySelectorAll(".tab-button");
const mainTab = document.querySelector("#main-tab");
const historyTab = document.querySelector("#history-tab");
const chartCanvas = document.querySelector("#performance-chart");

const STORAGE_KEYS = {
    tasks: "lista-de-atividades:tarefas",
    history: "lista-de-atividades:historico",
    user: "lista-de-atividades:usuario",
    settings: "lista-de-atividades:configuracoes"
};

const SESSION_KEY = "lista-de-atividades:sessao";
const REMOTE_SESSION_KEY = "lista-de-atividades:remote-session";
const DEFAULT_REMINDER_MINUTES = 1;
const COUNTDOWN_INTERVAL_IN_MS = 1000;
const APP_VERSION = "1.0.2";
const UPDATE_INFO_URL = "https://wellingtonjs1212.github.io/lista-de-atividades/update.json";

let tasks = loadTasks();
let historyEntries = loadHistory();
let userProfile = loadUserProfile();
let appSettings = loadSettings();
let activeSession = loadSession();
let remoteSession = loadRemoteSession();
let selectedTab = "main";
let countdownIntervalId = null;
const reminderTimeouts = new Map();
const remoteAuthEnabled = Boolean(window.RemoteApi?.isConfigured());

syncSession();
renderApp();
schedulePendingReminders();
startCountdownUpdater();
checkForUpdates();

startAppButton.addEventListener("click", handleAuth);
forgotPasswordButton.addEventListener("click", handleForgotPassword);
logoutButton.addEventListener("click", logout);
exitAppButton.addEventListener("click", closeApp);
addButton.addEventListener("click", addTask);
clearTasksButton.addEventListener("click", clearTasks);
clearHistoryButton.addEventListener("click", clearHistory);
soundInput.addEventListener("change", handleSoundSelection);
sendFeedbackButton.addEventListener("click", submitFeedbackForm);
soundPickerButton.addEventListener("click", () => soundInput.click());
soundPickerButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        soundInput.click();
    }
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

reminderInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
});

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
    sendFeedbackButton.disabled = !remoteAuthEnabled;
    feedbackMessageInput.disabled = !remoteAuthEnabled;
    feedbackRatingInput.disabled = !remoteAuthEnabled;
    feedbackCategoryInput.disabled = !remoteAuthEnabled;
    switchTab(selectedTab);
    renderTasks();
    renderHistory();
    drawPerformanceChart();
}

function hydrateAuthForm() {
    if (!userProfile) {
        return;
    }

    authNameInput.value = userProfile.name;
    authLoginInput.value = userProfile.login;
    authPasswordInput.value = "";
}

async function handleAuth() {
    const name = authNameInput.value.trim();
    const login = authLoginInput.value.trim().toLowerCase();
    const password = authPasswordInput.value.trim();

    if (!name || !login || !password) {
        showFeedback(authFeedback, "Preencha nome, login e senha para continuar.");
        return;
    }

    if (!isValidEmail(login)) {
        showFeedback(authFeedback, "Informe um e-mail válido para acessar o aplicativo.");
        authLoginInput.focus();
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
    } else if (userProfile.login !== login || userProfile.password !== password) {
        showFeedback(authFeedback, "Login ou senha incorretos.");
        return;
    } else if (userProfile.name !== name) {
        userProfile.name = name;
        saveUserProfile();
    }

    activeSession = {
        login: userProfile.login,
        startedAt: Date.now()
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
    authPasswordInput.value = "";
    hideFeedback(authFeedback);
    renderApp();
}

async function handleForgotPassword() {
    const login = authLoginInput.value.trim().toLowerCase();

    if (remoteAuthEnabled) {
        if (!isValidEmail(login)) {
            showFeedback(authFeedback, "Digite um e-mail válido para recuperar a senha.");
            authLoginInput.focus();
            return;
        }

        try {
            await window.RemoteApi.requestPasswordReset(login);
            showFeedback(authFeedback, "Enviamos as instruções de recuperação para o seu e-mail.");
        } catch (error) {
            showFeedback(authFeedback, parseRemoteError(error, "Não foi possível enviar a recuperação de senha."));
        }
        return;
    }

    if (!userProfile) {
        showFeedback(authFeedback, "Nenhum usuário foi cadastrado ainda neste aparelho.");
        return;
    }

    if (!isValidEmail(login)) {
        showFeedback(authFeedback, "Digite o e-mail cadastrado para redefinir a senha.");
        authLoginInput.focus();
        return;
    }

    if (login !== userProfile.login) {
        showFeedback(authFeedback, "O e-mail informado não corresponde ao usuário cadastrado.");
        return;
    }

    const newPassword = window.prompt("Digite a nova senha para este usuário:");

    if (!newPassword) {
        return;
    }

    userProfile.password = newPassword.trim();
    saveUserProfile();
    showFeedback(authFeedback, "Senha redefinida com sucesso. Agora faça o login novamente.");
    authPasswordInput.value = "";
    authPasswordInput.focus();
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMOTE_SESSION_KEY);
    activeSession = null;
    remoteSession = null;
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
        extensionAvailable: true,
        createdAt: Date.now()
    };

    tasks.push(newTask);
    saveTasks();
    scheduleReminder(newTask);
    hideFeedback(formFeedback);
    input.value = "";
    reminderInput.value = "";
    renderTasks();
    drawPerformanceChart();
    input.focus();
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
            <span>Lembrete em ${task.baseReminderMinutes} minuto(s)</span>
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
                <span>Lembrete ${entry.baseReminderMinutes} minuto(s)</span>
            `;

            const status = document.createElement("span");
            status.className = `history-status ${entry.status}`;
            status.textContent = entry.status === "completed" ? "Finalizada" : "Não finalizada";

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
}

function completeTask(taskId) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || task.status !== "active") {
        return;
    }

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

    task.extensionUsed = true;
    task.extensionAvailable = false;
    task.alerted = false;
    task.needsAttention = false;
    task.reminderAt = Date.now() + convertMinutesToMs(task.baseReminderMinutes);
    saveTasks();
    scheduleReminder(task);
    renderTasks();
}

function deleteTask(taskId) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
        return;
    }

    clearReminder(task.id);
    tasks = tasks.filter((currentTask) => currentTask.id !== taskId);
    saveTasks();
    renderTasks();
}

function clearTasks() {
    tasks.forEach((task) => clearReminder(task.id));
    tasks = [];
    saveTasks();
    renderTasks();
}

function clearHistory() {
    historyEntries = [];
    saveHistory();
    renderHistory();
    drawPerformanceChart();
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
        extensionUsed: false,
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
    historyEntries.unshift({
        id: crypto.randomUUID(),
        text: task.text,
        status,
        createdAt: task.createdAt,
        updatedAt: Date.now(),
        baseReminderMinutes: task.baseReminderMinutes,
        resumed: false
    });

    saveHistory();
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
}

function handleReminder(taskId) {
    reminderTimeouts.delete(taskId);

    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || task.status !== "active") {
        return;
    }

    if (!task.extensionUsed) {
        task.alerted = true;
        task.needsAttention = true;
        saveTasks();
        playReminderSound();
        renderTasks();
        return;
    }

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
        return "Tempo encerrado para a tarefa criada";
    }

    const totalSeconds = Math.max(Math.ceil((task.reminderAt - Date.now()) / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} para a tarefa criada expirar`;
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

function getReminderMinutes() {
    const value = reminderInput.value.trim();

    if (!value) {
        return null;
    }

    const reminderMinutes = Number.parseInt(value, 10);

    if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) {
        return null;
    }

    return reminderMinutes;
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

async function submitFeedbackForm() {
    const message = feedbackMessageInput.value.trim();
    const rating = Number.parseInt(feedbackRatingInput.value, 10);
    const category = feedbackCategoryInput.value;

    if (!remoteAuthEnabled) {
        showFeedback(feedbackFormMessage, "Ative o backend remoto para receber feedbacks dos usuários.");
        return;
    }

    if (!remoteSession?.access_token || !userProfile?.login) {
        showFeedback(feedbackFormMessage, "Entre na sua conta para enviar feedback.");
        return;
    }

    if (!message) {
        showFeedback(feedbackFormMessage, "Escreva sua mensagem antes de enviar.");
        feedbackMessageInput.focus();
        return;
    }

    try {
        await window.RemoteApi.submitFeedback(remoteSession.access_token, {
            user_id: remoteSession.user.id,
            name: userProfile.name,
            email: userProfile.login,
            rating,
            category,
            message
        });

        hideFeedback(feedbackFormMessage);
        feedbackMessageInput.value = "";
        feedbackRatingInput.value = "5";
        feedbackCategoryInput.value = "suggestion";
        feedbackFormMessage.textContent = "Feedback enviado com sucesso. Obrigado pela sua contribuição.";
        feedbackFormMessage.hidden = false;
        feedbackFormMessage.classList.remove("error");
    } catch (error) {
        showFeedback(feedbackFormMessage, parseRemoteError(error, "Não foi possível enviar seu feedback agora."));
    }
}

function updateSoundLabel() {
    selectedSoundName.textContent = appSettings.soundName || "Som padrão do aparelho";
}

async function playReminderSound() {
    if (appSettings.soundDataUrl) {
        try {
            const audio = new Audio(appSettings.soundDataUrl);
            await audio.play();
            return;
        } catch {
            // Falha no áudio personalizado: segue para o som padrão.
        }
    }

    playFallbackBeep();
}

function playFallbackBeep() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        const audioContext = new AudioContextClass();
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
        }, 350);
    } catch {
        // Sem suporte a áudio.
    }
}

function drawPerformanceChart() {
    if (!chartCanvas) {
        return;
    }

    const context = chartCanvas.getContext("2d");

    if (!context) {
        return;
    }

    const { labels, completedValues, missedValues } = buildChartData();
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
    const maxValue = Math.max(1, ...completedValues, ...missedValues);

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
    }

    drawSeries(context, completedValues, stepX, padding, bottom, usableHeight, maxValue, "#49e6d0", "rgba(73, 230, 208, 0.16)");
    drawSeries(context, missedValues, stepX, padding, bottom, usableHeight, maxValue, "#ff6b81", "rgba(255, 107, 129, 0.14)");

    context.fillStyle = "#9cb0c9";
    context.font = "12px Segoe UI";
    context.textAlign = "center";

    labels.forEach((label, index) => {
        const x = padding + stepX * index;
        context.fillText(label, x, height - 6);
    });

    context.textAlign = "left";
    context.fillStyle = "rgba(156, 176, 201, 0.9)";
    context.fillText(`Finalizadas: ${completedValues.reduce((sum, value) => sum + value, 0)}`, padding, 18);
    context.fillText(`Não finalizadas: ${missedValues.reduce((sum, value) => sum + value, 0)}`, width - 150, 18);
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
    const missedValues = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - offset);
        const dayKey = getLocalDateKey(currentDate);

        labels.push(currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
        completedValues.push(countHistoryByDate(dayKey, "completed"));
        missedValues.push(countHistoryByDate(dayKey, "missed"));
    }

    return { labels, completedValues, missedValues };
}

function countHistoryByDate(dayKey, status) {
    return historyEntries.filter((entry) => {
        if (entry.status !== status) {
            return false;
        }

        const referenceDate = getLocalDateKey(new Date(entry.updatedAt || entry.createdAt));
        return referenceDate === dayKey;
    }).length;
}

function switchTab(tabName) {
    selectedTab = tabName === "history" ? "history" : "main";

    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === selectedTab);
    });

    mainTab.hidden = selectedTab !== "main";
    historyTab.hidden = selectedTab !== "history";
    mainTab.classList.toggle("active", selectedTab === "main");
    historyTab.classList.toggle("active", selectedTab === "history");
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

function normalizeHistoryEntry(entry) {
    if (!entry || typeof entry.text !== "string") {
        return null;
    }

    return {
        id: typeof entry.id === "string" ? entry.id : crypto.randomUUID(),
        text: entry.text.toUpperCase(),
        status: entry.status === "completed" ? "completed" : "missed",
        createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
        updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : Date.now(),
        baseReminderMinutes: getValidReminderMinutes(entry.baseReminderMinutes),
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
            soundDataUrl: ""
        };
    }

    try {
        const parsedSettings = JSON.parse(savedSettings);

        return {
            soundName: typeof parsedSettings.soundName === "string" ? parsedSettings.soundName : "",
            soundDataUrl: typeof parsedSettings.soundDataUrl === "string" ? parsedSettings.soundDataUrl : ""
        };
    } catch {
        return {
            soundName: "",
            soundDataUrl: ""
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
        const savedSession = sessionStorage.getItem(SESSION_KEY);

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

function syncSession() {
    if (remoteAuthEnabled) {
        if (!remoteSession?.access_token) {
            remoteSession = null;
        }
        return;
    }

    if (!activeSession || !userProfile || activeSession.login !== userProfile.login) {
        sessionStorage.removeItem(SESSION_KEY);
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

function getValidReminderMinutes(value) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_REMINDER_MINUTES;
}

function convertMinutesToMs(minutes) {
    return minutes * 60 * 1000;
}

async function checkForUpdates() {
    try {
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

        updateMessage.textContent = `A versão ${updateInfo.version} já está disponível para instalação.`;
        updateLink.href = typeof updateInfo.download_url === "string"
            ? updateInfo.download_url
            : "https://github.com/wellingtonJS1212/lista-de-atividades/releases/latest";
        updateBanner.hidden = false;
    } catch {
        // Segue silenciosamente se o arquivo remoto não estiver acessível.
    }
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
