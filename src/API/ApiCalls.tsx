import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

// Helper function to get token
const getToken = () => localStorage.getItem("token");

// Helper function to create headers with auth
const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ============ AUTH API ============
export const authAPI = {
  login: (email: string, password: string) =>
    axios.post(`${API_BASE_URL}/auth/login`, { email, password }),

  changePassword: (password: string) =>
    axios.put(
      `${API_BASE_URL}/auth/change-password`,
      { password },
      { headers: getAuthHeaders() }
    ),

  checkToken: () =>
    axios.get(`${API_BASE_URL}/auth/check-token`, {
      headers: getAuthHeaders(),
    }),
};

// ============ USER API ============
export const userAPI = {
  getCurrentUser: () =>
    axios.get(`${API_BASE_URL}/users/getCurrentUser`, {
      headers: getAuthHeaders(),
    }),

  getCurrentUserRole: () =>
    axios.get(`${API_BASE_URL}/users/getCurrentUserRole`, {
      headers: getAuthHeaders(),
    }),

  getAllTeachersEmail: () =>
    axios.get(`${API_BASE_URL}/users/getAllTeachersEmail`, {
      headers: getAuthHeaders(),
    }),
};

// ============ MESSAGES API ============
export const messageAPI = {
  getMessagesByCurrentUser: () =>
    axios.get(`${API_BASE_URL}/messages/getMessagesByCurrentUser`, {
      headers: getAuthHeaders(),
    }),

  sendMessage: (receiverEmail: string, message: string) =>
    axios.post(
      `${API_BASE_URL}/messages/sendMessage`,
      {
        receiver: { email: receiverEmail },
        message,
      },
      { headers: getAuthHeaders() }
    ),
};

// ============ GRADES API ============
export const gradeAPI = {
  getAllByCurrentUser: () =>
    axios.get(`${API_BASE_URL}/grade/getAllByCurrentUser`, {
      headers: getAuthHeaders(),
    }),
};

// ============ COURSE/SCHEDULE API ============
export const courseAPI = {
  getCourseByCurrentUser: () => {
    return axios.get(`${API_BASE_URL}/course/getCourseByCurrentUser`, {
      headers: getAuthHeaders(),
    });
  },

   getCourseByDepartmentName: (departmentName: string) => {
    return axios.get(`${API_BASE_URL}/course/getCourseByDepartmentName`, {
      params: {
        name: departmentName,
      },
      headers: getAuthHeaders(),
    });
  },

  createCourse: (courseData: {
    name: string;
    day: string;
    duration: string;
    teacherName: string;
    departmentName: string;
  }) =>
    axios.post(`${API_BASE_URL}/course/create`, {
      name: courseData.name,
      day: courseData.day,
      duration: courseData.duration,
      teacher: {
        email: courseData.teacherName, 
      },
      department: {
        name: courseData.departmentName,
      },
    }, {
      headers: getAuthHeaders(),
    }),

  deleteCourse: (courseId: number) =>
    axios.delete(`${API_BASE_URL}/course/deleteById/${courseId}`, {
      headers: getAuthHeaders(),
    }),
};

// ============ DEPARTMENT API ============
export const departmentAPI = {
  getAll: () =>
    axios.get(`${API_BASE_URL}/departments/getAll`, {
      headers: getAuthHeaders(),
    }),
};