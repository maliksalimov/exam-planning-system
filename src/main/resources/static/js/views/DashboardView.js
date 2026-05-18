import { Api } from '../api.js';

export default class DashboardView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Yönetici Paneli</h1>
                <div class="badge badge--info">Sistem Aktif</div>
            </header>

            <div class="stats-grid" id="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-card__label">Toplam Öğrenci</div>
                    <div class="stat-card__value" id="stat-students">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Aktif Sınavlar</div>
                    <div class="stat-card__value" id="stat-exams">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Öğretim Elemanı</div>
                    <div class="stat-card__value" id="stat-instructors">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Derslik</div>
                    <div class="stat-card__value" id="stat-classrooms">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Fakülte</div>
                    <div class="stat-card__value" id="stat-faculties">--</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Sistem Kullanıcıları</div>
                    <div class="stat-card__value" id="stat-users">--</div>
                </div>
            </div>

            <div style="margin-top: var(--space-xl)">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: var(--space-md);">
                    <h3 style="margin: 0;">Son Sınavlar</h3>
                    <a href="#/exams" class="btn-secondary" style="text-decoration:none; font-size: var(--font-size-sm); padding: 6px 12px;">Tümünü Gör</a>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Sınav Adı</th>
                                <th>Tür</th>
                                <th>Tarih</th>
                                <th>Saat</th>
                                <th>Ders</th>
                            </tr>
                        </thead>
                        <tbody id="dashboard-exam-table">
                            <tr><td colspan="5" style="text-align:center">Veriler yükleniyor...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }

    async mount() {
        try {
            const [students, exams, users, instructors, classrooms, faculties] = await Promise.all([
                Api.request('admin/students'),
                Api.request('admin/exams'),
                Api.request('admin/users'),
                Api.request('admin/instructors'),
                Api.request('admin/classrooms'),
                Api.request('admin/faculties')
            ]);

            const statStudents = document.getElementById('stat-students');
            if (!statStudents) return;

            statStudents.innerText = students.length;
            document.getElementById('stat-exams').innerText = exams.length;
            document.getElementById('stat-users').innerText = users.length;
            document.getElementById('stat-instructors').innerText = instructors.length;
            document.getElementById('stat-classrooms').innerText = classrooms.length;
            document.getElementById('stat-faculties').innerText = faculties.length;

            const tableBody = document.getElementById('dashboard-exam-table');
            if (!tableBody) return;
            tableBody.innerHTML = exams.slice(0, 10).map(exam => `
                <tr>
                    <td style="font-weight: 500">${exam.examName}</td>
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
