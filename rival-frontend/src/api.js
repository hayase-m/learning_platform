import { API_BASE_URL } from './config';

const getAuthHeader = async (auth) => {
    try {
        if (!auth.currentUser) return {};
        const token = await auth.currentUser.getIdToken();
        return { 'Authorization': `Bearer ${token}` };
    } catch (error) {
        console.log('Auth not available, proceeding without token');
        return {};
    }
}

export const api = {
    async generateAiSummary(auth, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/ai/summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to generate AI summary');
        return response.json();
    },

    async saveDailyReport(auth, userId, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to save daily report');
        return response.json();
    },

    async fetchCurriculums(auth, userId) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/curriculums`, {
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to fetch curriculums');
        return response.json();
    },

    async createCurriculum(auth, userId, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/curriculums`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create curriculum');
        return response.json();
    },

    async fetchCurriculumProgress(auth, curriculumId) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}/progress`, {
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to fetch curriculum progress');
        return response.json();
    },

    async updateCurriculumProgress(auth, curriculumId, day, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}/progress/${day}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update curriculum progress');
        return response.json();
    },

    async fetchCurriculumStats(auth, curriculumId) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}/stats`, {
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to fetch curriculum stats');
        return response.json();
    },

    async fetchUserReports(auth, userId, dateString) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reports/${dateString}`, {
            headers: headers
        });
        if (response.status === 404) {
            return null; // レポートが存在しない場合はnullを返す
        }
        if (!response.ok) throw new Error('Failed to fetch user reports');
        return response.json();
    },

    async updateDailyReport(auth, userId, dateString, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/reports/${dateString}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update daily report');
        return response.json();
    },

    async fetchUserSettings(auth, userId) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to fetch user settings');
        return response.json();
    },

    async updateUserSettings(auth, userId, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update user settings');
        return response.json();
    },

    async createUser(auth, userId, email) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify({ user_id: userId, email: email }),
        });
        if (!response.ok) throw new Error('Failed to create user');
        return response.json();
    },

    async deleteCurriculum(auth, curriculumId) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}`, {
            method: 'DELETE',
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to delete curriculum');
        return response.status === 204 ? {} : response.json();
    },
};