import { Api } from '../api.js';

export default class DashboardView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Admin Panel</h1>
                <div class="badge badge--info">System Active</div>
            </header>

            <div class="stats-grid" id="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-card__label">Total Students</div>
                    <div class="stat-card__value" id="stat-students">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Active Exams</div>
                    <div class="stat-card__value" id="stat-exams">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Instructors</div>
                    <div class="stat-card__value" id="stat-instructors">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Classrooms</div>
                    <div class="stat-card__value" id="stat-classrooms">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Faculties</div>
                    <div class="stat-card__value" id="stat-faculties">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">System Users</div>
                    <div class="stat-card__value" id="stat-users">--</div>
                </div>
            </div>

            <div style="margin-top: var(--space-xl)">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: var(--space-md);">
                    <h3 style="margin: 0;">Recent Exams</h3>
                    <a href="#/exams" class="btn-secondary" style="text-decoration:none; font-size: var(--font-size-sm); padding: 6px 12px;">View All</a>
                </div>
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
                            <tr><td colspan="5" style="text-align:center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }

    async mount() {
        try {
            const toCount = async (endpoint) => {
                const r = await Api.request(`${endpoint}?size=1`);
                return r && r.totalElements != null ? r.totalElements : (Array.isArray(r) ? r.length : 0);
            };

            const [students, examCount, users, instructors, classrooms, faculties, recentExamsPage] = await Promise.all([
                toCount('admin/students'),
                toCount('admin/exams'),
                toCount('admin/users'),
                toCount('admin/instructors'),
                toCount('admin/classrooms'),
                toCount('admin/faculties'),
                Api.request('admin/exams?page=0&size=10')
            ]);

            const statStudents = document.getElementById('stat-students');
            if (!statStudents) return;

            statStudents.innerText = students;
            document.getElementById('stat-exams').innerText = examCount;
            document.getElementById('stat-users').innerText = users;
            document.getElementById('stat-instructors').innerText = instructors;
            document.getElementById('stat-classrooms').innerText = classrooms;
            document.getElementById('stat-faculties').innerText = faculties;

            const tableBody = document.getElementById('dashboard-exam-table');
            if (!tableBody) return;
            const recentExams = (recentExamsPage && Array.isArray(recentExamsPage.content))
                ? recentExamsPage.content : [];
            if (recentExams.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--color-muted);">No exams yet</td></tr>`;
            } else {
                tableBody.innerHTML = recentExams.map(exam => `
                    <tr>
                        <td style="font-weight: 500">${exam.examName}</td>
                        <td><span class="badge badge--info">${exam.examType || '-'}</span></td>
                        <td>${exam.examDate}</td>
                        <td>${exam.examTime}</td>
                        <td>${exam.courseName}</td>
                    </tr>
                `).join('');
            }

        } catch (err) {
            console.error('Dashboard mount error:', err);
        }
    }

    unmount() {}
}
