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
        console.log('API call - updateUserSettings');
        console.log('URL:', `${API_BASE_URL}/users/${userId}`);
        console.log('Headers:', headers);
        console.log('Data:', data);
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Failed to update user settings: ${response.status} - ${errorText}`);
        }
        return response.json();
    },

    async createUser(auth, userId, email, name = null) {
        const headers = await getAuthHeader(auth);
        const body = { user_id: userId, email: email };
        if (name && name.trim()) {
            body.name = name.trim();
        } else {
            body.name = 'ユーザー';
        }
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body),
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

    async fetchDailyComments(auth, userId, dateString) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/comments/${dateString}`, {
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to fetch comments');
        return response.json();
    },

    async createComment(auth, userId, data) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/users/${userId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create comment');
        return response.json();
    },

    async deleteComment(auth, commentId) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        return response.status === 204 ? {} : response.json();
    },

    async fetchTotalStudyTimeRanking(auth) {
        const headers = await getAuthHeader(auth);
        console.log('Fetching total study time ranking from:', `${API_BASE_URL}/rankings/study-time/total`);
        const response = await fetch(`${API_BASE_URL}/rankings/study-time/total`, {
            headers: headers
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Failed to fetch total study time ranking: ${response.status}`);
        }
        const data = await response.json();
        console.log('Total study time ranking data:', data);
        return data;
    },

    async fetchTotalFocusTimeRanking(auth) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/rankings/focus-time/total`, {
            headers: headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Failed to fetch total focus time ranking: ${response.status}`);
        }
        return response.json();
    },

    async fetchTodayStudyTimeRanking(auth) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/rankings/study-time/today`, {
            headers: headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Failed to fetch today study time ranking: ${response.status}`);
        }
        return response.json();
    },

    async fetchTodayFocusTimeRanking(auth) {
        const headers = await getAuthHeader(auth);
        const response = await fetch(`${API_BASE_URL}/rankings/focus-time/today`, {
            headers: headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Failed to fetch today focus time ranking: ${response.status}`);
        }
        return response.json();
    },
};