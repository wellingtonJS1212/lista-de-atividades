(function attachRemoteApi() {
    const config = window.APP_REMOTE_CONFIG || {};

    function isConfigured() {
        return Boolean(config.enabled && config.supabaseUrl && config.supabaseAnonKey);
    }

    async function request(path, options = {}) {
        if (!isConfigured()) {
            throw new Error("Integração remota não configurada.");
        }

        const headers = {
            apikey: config.supabaseAnonKey,
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const response = await fetch(`${config.supabaseUrl}${path}`, {
            method: options.method || "GET",
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Falha na comunicação com o servidor.");
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    async function signIn(email, password) {
        const session = await request("/auth/v1/token?grant_type=password", {
            method: "POST",
            body: { email, password }
        });

        const profile = await fetchOwnProfile(session.access_token, session.user.id);

        return { session, profile };
    }

    async function signUp(name, email, password) {
        const payload = await request("/auth/v1/signup", {
            method: "POST",
            body: {
                email,
                password,
                data: {
                    full_name: name
                }
            }
        });

        if (payload.access_token && payload.user?.id) {
            await upsertOwnProfile(payload.access_token, {
                id: payload.user.id,
                full_name: name,
                email,
                approved: false,
                blocked: false,
                role: "user"
            });
        }

        return payload;
    }

    async function requestPasswordReset(email) {
        return request("/auth/v1/recover", {
            method: "POST",
            body: {
                email,
                redirect_to: config.resetPasswordRedirectUrl || undefined
            }
        });
    }

    async function fetchOwnProfile(accessToken, userId) {
        const result = await request(`/rest/v1/app_users?id=eq.${userId}&select=*`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return Array.isArray(result) ? result[0] || null : null;
    }

    async function upsertOwnProfile(accessToken, profile) {
        return request("/rest/v1/app_users", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Prefer: "resolution=merge-duplicates"
            },
            body: profile
        });
    }

    async function submitFeedback(accessToken, feedback) {
        return request("/rest/v1/app_feedback", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: feedback
        });
    }

    async function fetchUsers(accessToken) {
        return request("/rest/v1/app_users?select=id,full_name,email,approved,blocked,role,created_at&order=created_at.desc", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }

    async function updateUser(accessToken, userId, updates) {
        return request(`/rest/v1/app_users?id=eq.${userId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: updates
        });
    }

    async function fetchFeedback(accessToken) {
        return request("/rest/v1/app_feedback?select=id,name,email,rating,category,message,created_at&order=created_at.desc", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }

    window.RemoteApi = {
        isConfigured,
        signIn,
        signUp,
        requestPasswordReset,
        fetchOwnProfile,
        upsertOwnProfile,
        submitFeedback,
        fetchUsers,
        updateUser,
        fetchFeedback
    };
}());
