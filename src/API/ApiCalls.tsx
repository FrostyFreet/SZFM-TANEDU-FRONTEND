import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  createUser:(user:any)=>
    axios.post(`${API_BASE_URL}/auth/register`,user, {
      headers: getAuthHeaders(),
  }),

  
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

   getAllStudentsEmail: () =>
    axios.get(`${API_BASE_URL}/users/getAllStudentsEmail`, {
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

  getAllByStudentId: (studentId:number) =>
    axios.get(`${API_BASE_URL}/grade/getAllByStudentId/${studentId}`, {
      headers: getAuthHeaders(),
  }),

  getAllGradesByStudentEmail: (email:string) =>
    axios.get(`${API_BASE_URL}/grade/getAllGradesByStudentEmail/${email}`, {
      headers: getAuthHeaders(),
  }),
  getAllGradesForCurrentUserBySubject: (name:string) =>
    axios.get(`${API_BASE_URL}/grade/getAllGradesBySubject/${name}`, {
      headers: getAuthHeaders(),
  }),
  deleteGradeById: (id:number) =>
    axios.delete(`${API_BASE_URL}/grade/deleteGradeById/${id}`, {
      headers: getAuthHeaders(),
  }),

  createGrade: (gradeData: {
    studentEmail: string;
    value: number;
    subject: string;
  }) =>
    axios.post(
      `${API_BASE_URL}/grade/create`,
      {
        student: { email: gradeData.studentEmail },
        value: gradeData.value,
        subject: gradeData.subject,
      },
      { headers: getAuthHeaders() }
    ),
};

// ============ COURSE/SCHEDULE API ============
export const courseAPI = {
  getCourseByCurrentUser: () => {
    return axios.get(`${API_BASE_URL}/course/getCourseByDepartmentNameForCurrentUser`, {
      headers: getAuthHeaders(),
    });
  },

  getAttendanceCourses: (role: string) => {
    const endpoint = role === "SYSADMIN" 
      ? `${API_BASE_URL}/course/getAll`
      : `${API_BASE_URL}/course/getByCurrentTeacher`;
    
    return axios.get(endpoint, {
      headers: getAuthHeaders(),
    });
  },

  getStudentsForCourses: (courseId: number) => {
    return axios.get(`${API_BASE_URL}/course/${courseId}/students`, {
      headers: getAuthHeaders(),
    });
  },
  getCoursesByTeacher:()=>{
    return axios.get(`${API_BASE_URL}/course/getByCurrentTeacher`, {
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

  getAllAvailableSubjects:()=>{
    return axios.get(`${API_BASE_URL}/users/getAllAvailableSubjects`, {
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
  getClassLeader:(departmentName:string)=>
    axios.get(`${API_BASE_URL}/departments/getDepartmentClassLeader/${departmentName}`, {
        headers: getAuthHeaders(),
    }),
};

export const attendanceAPI = {
  saveAttendance:(payload:any)=>
     axios.post(`${API_BASE_URL}/attendance`,payload, {
        headers: getAuthHeaders(),
    }),
  getMyAttendances: ()=>
     axios.get(`${API_BASE_URL}/attendance/my-attendances`, {
        headers: getAuthHeaders(),
    }),
 getAttendance: (courseId: number, date: string, timeSlot?: string) =>
    axios.get(`${API_BASE_URL}/attendance/${courseId}`, {
      params: { date, ...(timeSlot ? { timeSlot } : {}) },
      headers: getAuthHeaders(),
    }),
  
  deleteAttendance: (attendanceId: number) =>
    axios.delete(`${API_BASE_URL}/attendance/${attendanceId}`, {
      headers: getAuthHeaders(),
    }),
}

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};