import { Api } from '../api.js';

export default class DashboardView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Admin Dashboard</h1>
                <div class="badge badge--info">System Active (Mock Mode)</div>
            </header>

            <div class="stats-grid" id="dashboard-stats">
                <div class="card">
                    <span class="form-label">Total Students</span>
                    <h2 id="stat-students">--</h2>
                </div>
                <div class="card">
                    <span class="form-label">Active Exams</span>
                    <h2 id="stat-exams">--</h2>
                </div>
                <div class="card">
                    <span class="form-label">System Users</span>
                    <h2 id="stat-users">--</h2>
                </div>
            </div>

            <div style="margin-top: var(--space-xl)">
                <h3>Recent Exams</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Exam Name</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Course</th>
                            </tr>
                        </thead>
                        <tbody id="dashboard-exam-table">
                            <tr><td colspan="5" style="text-align:center">Loading data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }

    async mount() {
        try {
            const [students, exams, users] = await Promise.all([
                Api.request('admin/students'),
                Api.request('admin/exams'),
                Api.request('admin/users')
            ]);

            const statStudents = document.getElementById('stat-students');
            if (!statStudents) return; // View has been unmounted

            statStudents.innerText = students.length;
            document.getElementById('stat-exams').innerText = exams.length;
            document.getElementById('stat-users').innerText = users.length;

            const tableBody = document.getElementById('dashboard-exam-table');
            tableBody.innerHTML = exams.map(exam => `
                <tr>
                    <td>${exam.examName}</td>
                    <td><span class="badge badge--info">${exam.examType}</span></td>
                    <td>${exam.examDate}</td>
                    <td>${exam.examTime}</td>
                    <td>${exam.courseName}</td>
                </tr>
            `).join('');

        } catch (err) {
            console.error('Dashboard mount error:', err);
        }
    }

    unmount() {}
}
