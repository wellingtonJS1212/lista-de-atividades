const adminAuthScreen = document.querySelector("#admin-auth-screen");
const adminPanel = document.querySelector("#admin-panel");
const adminEmailInput = document.querySelector("#admin-email");
const adminPasswordInput = document.querySelector("#admin-password");
const adminFeedback = document.querySelector("#admin-feedback");
const adminLoginButton = document.querySelector("#admin-login-button");
const adminResetButton = document.querySelector("#admin-reset-button");
const adminRefreshButton = document.querySelector("#admin-refresh-button");
const adminLogoutButton = document.querySelector("#admin-logout-button");
const usersList = document.querySelector("#users-list");
const feedbackList = document.querySelector("#feedback-list");
const pendingCount = document.querySelector("#pending-count");
const approvedCount = document.querySelector("#approved-count");
const feedbackCount = document.querySelector("#feedback-count");

const ADMIN_SESSION_KEY = "lista-de-atividades:admin-session";
let adminSession = loadAdminSession();
let adminProfile = null;

bootstrapAdmin();

adminLoginButton.addEventListener("click", loginAdmin);
adminResetButton.addEventListener("click", resetAdminPassword);
adminRefreshButton.addEventListener("click", loadAdminData);
adminLogoutButton.addEventListener("click", logoutAdmin);

async function bootstrapAdmin() {
    if (!window.RemoteApi?.isConfigured()) {
        showAdminFeedback("Configure o backend em backend-config.js antes de usar o painel.", true);
        return;
    }

    if (!adminSession?.access_token || !adminSession?.user?.id) {
        renderAdminAuth();
        return;
    }

    try {
        adminProfile = await window.RemoteApi.fetchOwnProfile(adminSession.access_token, adminSession.user.id);

        if (!isAdminProfile(adminProfile)) {
            throw new Error("Seu usuário não possui permissão de administrador.");
        }

        renderAdminPanel();
        await loadAdminData();
    } catch (error) {
        logoutAdmin();
        showAdminFeedback(error.message || "Sua sessão administrativa expirou.", true);
    }
}

async function loginAdmin() {
    const email = adminEmailInput.value.trim().toLowerCase();
    const password = adminPasswordInput.value.trim();

    if (!email || !password) {
        showAdminFeedback("Digite e-mail e senha para entrar.", true);
        return;
    }

    try {
        const { session, profile } = await window.RemoteApi.signIn(email, password);

        if (!isAdminProfile(profile)) {
            throw new Error("Este usuário não está aprovado como administrador.");
        }

        adminSession = session;
        adminProfile = profile;
        saveAdminSession();
        hideAdminFeedback();
        renderAdminPanel();
        await loadAdminData();
    } catch (error) {
        showAdminFeedback(parseSupabaseError(error, "Não foi possível entrar no painel."), true);
    }
}

async function resetAdminPassword() {
    const email = adminEmailInput.value.trim().toLowerCase();

    if (!email) {
        showAdminFeedback("Informe o e-mail do administrador para recuperar a senha.", true);
        return;
    }

    try {
        await window.RemoteApi.requestPasswordReset(email);
        showAdminFeedback("Solicitação enviada. Verifique seu e-mail.");
    } catch (error) {
        showAdminFeedback(parseSupabaseError(error, "Não foi possível enviar a recuperação de senha."), true);
    }
}

async function loadAdminData() {
    if (!adminSession?.access_token) {
        return;
    }

    try {
        const [users, feedbacks] = await Promise.all([
            window.RemoteApi.fetchUsers(adminSession.access_token),
            window.RemoteApi.fetchFeedback(adminSession.access_token)
        ]);

        renderUsers(users || []);
        renderFeedback(feedbacks || []);
    } catch (error) {
        showAdminFeedback(parseSupabaseError(error, "Não foi possível carregar os dados do painel."), true);
    }
}

function renderUsers(users) {
    usersList.innerHTML = "";

    pendingCount.textContent = users.filter((user) => !user.approved && !user.blocked).length;
    approvedCount.textContent = users.filter((user) => user.approved && !user.blocked).length;

    if (users.length === 0) {
        usersList.innerHTML = '<li class="data-item empty-text">Nenhum usuário cadastrado ainda.</li>';
        return;
    }

    users.forEach((user) => {
        const item = document.createElement("li");
        item.className = "data-item";

        const statusClass = user.blocked ? "blocked" : user.approved ? "approved" : "pending";
        const statusLabel = user.blocked ? "Bloqueado" : user.approved ? "Aprovado" : "Pendente";

        item.innerHTML = `
            <div class="item-header">
                <div class="item-main">
                    <span class="item-title">${escapeHtml(user.full_name || "Sem nome")}</span>
                    <span class="meta-line">${escapeHtml(user.email || "Sem e-mail")}</span>
                </div>
                <div class="badge-row">
                    <span class="badge ${statusClass}">${statusLabel}</span>
                    <span class="badge">${escapeHtml(user.role || "user")}</span>
                </div>
            </div>
            <div class="action-row">
                <button type="button" data-action="approve">Aprovar</button>
                <button type="button" class="secondary-button" data-action="unblock">Desbloquear</button>
                <button type="button" class="secondary-button" data-action="block">Bloquear</button>
            </div>
        `;

        item.querySelector('[data-action="approve"]').addEventListener("click", () => updateUserStatus(user.id, { approved: true, blocked: false }));
        item.querySelector('[data-action="unblock"]').addEventListener("click", () => updateUserStatus(user.id, { blocked: false }));
        item.querySelector('[data-action="block"]').addEventListener("click", () => updateUserStatus(user.id, { blocked: true }));

        usersList.appendChild(item);
    });
}

function renderFeedback(feedbacks) {
    feedbackList.innerHTML = "";
    feedbackCount.textContent = feedbacks.length;

    if (feedbacks.length === 0) {
        feedbackList.innerHTML = '<li class="data-item empty-text">Nenhum feedback recebido até agora.</li>';
        return;
    }

    feedbacks.forEach((feedback) => {
        const item = document.createElement("li");
        item.className = "data-item";
        item.innerHTML = `
            <div class="item-header">
                <div class="item-main">
                    <span class="item-title">${escapeHtml(feedback.name || "Sem nome")}</span>
                    <span class="meta-line">${escapeHtml(feedback.email || "Sem e-mail")}</span>
                </div>
                <div class="badge-row">
                    <span class="badge rating">Nota ${feedback.rating}/5</span>
                    <span class="badge">${escapeHtml(feedback.category || "suggestion")}</span>
                </div>
            </div>
            <p class="meta-line">${escapeHtml(feedback.message || "")}</p>
            <span class="meta-line">${formatDate(feedback.created_at)}</span>
        `;
        feedbackList.appendChild(item);
    });
}

async function updateUserStatus(userId, updates) {
    try {
        await window.RemoteApi.updateUser(adminSession.access_token, userId, updates);
        await loadAdminData();
    } catch (error) {
        showAdminFeedback(parseSupabaseError(error, "Não foi possível atualizar esse usuário."), true);
    }
}

function renderAdminAuth() {
    adminAuthScreen.hidden = false;
    adminPanel.hidden = true;
}

function renderAdminPanel() {
    adminAuthScreen.hidden = true;
    adminPanel.hidden = false;
}

function logoutAdmin() {
    adminSession = null;
    adminProfile = null;
    localStorage.removeItem(ADMIN_SESSION_KEY);
    renderAdminAuth();
}

function saveAdminSession() {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
}

function loadAdminSession() {
    try {
        const saved = localStorage.getItem(ADMIN_SESSION_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function isAdminProfile(profile) {
    return Boolean(profile && profile.role === "admin" && profile.approved && !profile.blocked);
}

function showAdminFeedback(message, isError = false) {
    adminFeedback.textContent = message;
    adminFeedback.hidden = false;
    adminFeedback.classList.toggle("error", isError);
}

function hideAdminFeedback() {
    adminFeedback.hidden = true;
    adminFeedback.classList.remove("error");
}

function parseSupabaseError(error, fallback) {
    const message = String(error?.message || "");

    if (message.includes("Invalid login credentials")) {
        return "E-mail ou senha inválidos.";
    }

    if (message.includes("Email not confirmed")) {
        return "Confirme o e-mail antes de entrar.";
    }

    return fallback;
}

function formatDate(value) {
    return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
