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
// PROTOTYPE MOCK MODE 
// Enabled because backend requires Java 17
// ==========================================
const MOCK_MODE = true; 

const MOCKS = {
    'auth/login': { token: 'mock-jwt-token-12345' },
    'admin/students': [
        { studentId: 1, stringNo: '2023001', fullName: 'Alice Johnson', facultyName: 'Engineering', departmentName: 'CENG' },
        { studentId: 2, stringNo: '2023002', fullName: 'Bob Smith', facultyName: 'Science', departmentName: 'PHYS' },
        { studentId: 3, stringNo: '2023003', fullName: 'Charlie Brown', facultyName: 'Arts', departmentName: 'HIST' }
    ],
    'admin/exams': [
        { examId: 1, examName: 'Advanced Algorithms Final', examType: 'FINAL', examDate: '2026-05-20', examTime: '10:00', courseName: 'CENG301' },
        { examId: 2, examName: 'Quantum Physics Midterm', examType: 'MIDTERM', examDate: '2026-05-21', examTime: '14:00', courseName: 'PHYS201' }
    ],
    'admin/users': [
        { id: 1, username: 'admin', roles: ['ADMIN'] }
    ]
};

export const Api = {
    async request(endpoint, options = {}) {
        if (MOCK_MODE) {
            console.warn(`[Mock Mode] Intercepted endpoint: ${endpoint}`);
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const mockData = MOCKS[endpoint] || (endpoint.startsWith('admin/exam-planning/plan') ? {
                        examName: 'Mock Exam', 
                        totalStudents: 10, 
                        classroomsUsed: 1, 
                        classrooms: [{
                            classroom: 'Building A - Room 101',
                            studentsAssigned: 10,
                            invigilatorNames: ['Dr. Mock'],
                            studentNumbers: ['2023001', '2023002']
                        }]
                    } : null);
                    
                    if (mockData) resolve(mockData);
                    else reject({ message: 'Endpoint not mocked' });
                }, 500); // Simulate network lag
            });
        }

        const url = `/api/${endpoint}`;
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
