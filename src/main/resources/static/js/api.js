import { Auth } from './auth.js';

export const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        
        container.appendChild(toast);
        
        // Trigger CSS reflow for animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000); // Wait 4 seconds then decay
    },
    error(message) { this.show(message, 'error'); },
    success(message) { this.show(message, 'success'); }
};

// ==========================================
// API CONFIGURATION
// ==========================================
const MOCK_MODE = false; 

const MOCKS = {
    'auth/login': { token: 'mock-jwt-token-12345' },
    'admin/students': [
        { studentId: 1, stringNo: '2023001', tcNo: '12345678901', fullName: 'Alice Johnson', facultyName: 'Engineering', departmentName: 'CENG' },
        { studentId: 2, stringNo: '2023002', tcNo: '12345678902', fullName: 'Bob Smith', facultyName: 'Science', departmentName: 'PHYS' },
        { studentId: 3, stringNo: '2023003', tcNo: '12345678903', fullName: 'Charlie Brown', facultyName: 'Arts', departmentName: 'HIST' }
    ],
    'admin/exams': [
        { examId: 1, examName: 'Advanced Algorithms Final', examType: 'FINAL', examDate: '2026-05-20', examTime: '10:00', courseName: 'CENG301' },
        { examId: 2, examName: 'Quantum Physics Midterm', examType: 'MIDTERM', examDate: '2026-05-21', examTime: '14:00', courseName: 'PHYS201' }
    ],
    'admin/users': [
        { id: 1, username: 'admin', roles: ['ADMIN'] }
    ],
    'admin/faculties': [
        { facultyId: 1, facultyName: 'Engineering' },
        { facultyId: 2, facultyName: 'Science' }
    ],
    'admin/departments': [
        { departmentId: 1, departmentName: 'Computer Engineering', facultyName: 'Engineering' },
        { departmentId: 2, departmentName: 'Physics', facultyName: 'Science' }
    ],
    'admin/courses': [
        { courseId: 1, courseCode: 'CENG301', courseName: 'Advanced Algorithms', departmentName: 'Computer Engineering', instructorName: 'Dr. Turing', semester: 'Fall' },
        { courseId: 2, courseCode: 'PHYS201', courseName: 'Quantum Physics', departmentName: 'Physics', instructorName: 'Dr. Einstein', semester: 'Spring' }
    ],
    'admin/classrooms': [
        { classroomId: 1, campus: 'Main', building: 'Block A', roomName: 'A-101', capacity: 50, isAvailableForExam: true },
        { classroomId: 2, campus: 'Main', building: 'Block B', roomName: 'B-202', capacity: 100, isAvailableForExam: true }
    ],
    'admin/instructors': [
        { instructorId: 1, staffNo: 'I001', fullName: 'Dr. Alan Turing', email: 'alan@uni.edu', departmentName: 'Computer Engineering', dutyCount: 0, isAvailableForInvigilation: true },
        { instructorId: 2, staffNo: 'I002', fullName: 'Dr. Albert Einstein', email: 'albert@uni.edu', departmentName: 'Physics', dutyCount: 2, isAvailableForInvigilation: true }
    ]
};

export const Api = {
    async request(endpoint, options = {}) {
        if (MOCK_MODE) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const method = options.method || 'GET';
                    const baseEndpoint = endpoint.replace(/\/\d+$/, '');
                    const isById = endpoint !== baseEndpoint;
                    const id = isById ? endpoint.split('/').pop() : null;

                    if (method === 'POST' && MOCKS[endpoint] && Array.isArray(MOCKS[endpoint])) {
                        const newItem = JSON.parse(options.body);
                        const idKey = endpoint.includes('faculty') ? 'facultyId' : 
                                     endpoint.includes('department') ? 'departmentId' :
                                     endpoint.includes('course') ? 'courseId' :
                                     endpoint.includes('student') ? 'studentId' :
                                     endpoint.includes('instructor') ? 'instructorId' :
                                     endpoint.includes('classroom') ? 'classroomId' : 'id';
                        newItem[idKey] = Math.floor(Math.random() * 10000) + 100;
                        MOCKS[endpoint].push(newItem);
                        return resolve(newItem);
                    }

                    if (method === 'PUT' && isById && MOCKS[baseEndpoint]) {
                        const updatedData = JSON.parse(options.body);
                        const idKey = baseEndpoint.includes('faculty') ? 'facultyId' : 
                                     baseEndpoint.includes('department') ? 'departmentId' :
                                     baseEndpoint.includes('course') ? 'courseId' :
                                     baseEndpoint.includes('student') ? 'studentId' :
                                     baseEndpoint.includes('instructor') ? 'instructorId' :
                                     baseEndpoint.includes('classroom') ? 'classroomId' : 'id';
                        
                        const idx = MOCKS[baseEndpoint].findIndex(item => String(item[idKey]) === id);
                        if (idx !== -1) {
                            MOCKS[baseEndpoint][idx] = { ...MOCKS[baseEndpoint][idx], ...updatedData };
                            return resolve(MOCKS[baseEndpoint][idx]);
                        }
                    }

                    if (method === 'DELETE' && isById && MOCKS[baseEndpoint]) {
                        const idKey = baseEndpoint.includes('faculty') ? 'facultyId' : 
                                     baseEndpoint.includes('department') ? 'departmentId' :
                                     baseEndpoint.includes('course') ? 'courseId' :
                                     baseEndpoint.includes('student') ? 'studentId' :
                                     baseEndpoint.includes('instructor') ? 'instructorId' :
                                     baseEndpoint.includes('classroom') ? 'classroomId' : 'id';
                        
                        const idx = MOCKS[baseEndpoint].findIndex(item => String(item[idKey]) === id);
                        if (idx !== -1) {
                            MOCKS[baseEndpoint].splice(idx, 1);
                            return resolve({});
                        }
                    }

                    if (method !== 'GET' && !endpoint.includes('plan')) {
                        return resolve({});
                    }

                    if (endpoint.startsWith('student/query/')) {
                        const no = endpoint.split('/').pop();
                        return resolve({
                            stringNo: no,
                            fullName: 'Sizin Tələbə',
                            departmentName: 'Kompüter Mühəndisliyi',
                            exams: [
                                { courseName: 'Advanced Algorithms', examDate: '2026-05-20', examTime: '10:00', campus: 'Main', building: 'Block A', classroom: 'A-101' }
                            ]
                        });
                    }

                    if (endpoint === 'instructor/duties') {
                        return resolve([
                            { examName: 'Quantum Physics Midterm', examDate: '2026-05-21', examTime: '14:00', campus: 'Main', building: 'Block B', classroom: 'B-202' }
                        ]);
                    }

                    const mockData = MOCKS[baseEndpoint] || MOCKS[endpoint] || (endpoint.startsWith('admin/exam-planning/plan') ? {
                        examName: 'Advanced Algorithms Final', 
                        examDate: '2026-05-20',
                        examTime: '10:00',
                        totalStudents: 3, 
                        classroomsUsed: 1, 
                        invigilatorsAssigned: 1,
                        classrooms: [{
                            classroom: 'Building A - Room 101',
                            studentsAssigned: 3,
                            capacity: 50,
                            invigilatorsAssigned: 1,
                            invigilatorNames: ['Dr. Alan Turing'],
                            studentNumbers: ['2023001', '2023002', '2023003']
                        }]
                    } : null);
                    
                    if (mockData) resolve(mockData);
                    else reject({ message: 'Endpoint not mocked: ' + endpoint });
                }, 400); 
            });
        }

        const url = `http://localhost:8081/api/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (Auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401 || response.status === 403) {
                Auth.logout();
                Toast.error("Authentication expired. Please log in again.");
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                let errorMsg = "Application Error";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch(e) {}
                Toast.error(`[Error] ${errorMsg}`);
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            }
            return null;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }
};
