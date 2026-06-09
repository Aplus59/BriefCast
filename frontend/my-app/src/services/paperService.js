import axios from 'axios';

// Default port for backend is 8080 in docker-compose
const API_URL = 'http://localhost:8080/api';

export const getPapers = async () => {
    try {
        const response = await axios.get(`${API_URL}/articles`);
        return response.data;
    } catch (error) {
        console.error("Error fetching papers:", error);
        return [];
    }
};

export const getPaperById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/articles/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching paper ${id}:`, error);
        return null;
    }
};
