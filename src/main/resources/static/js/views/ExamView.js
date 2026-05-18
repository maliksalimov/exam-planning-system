import { CrudView } from '../components/CrudView.js';
import { Api, Toast } from '../api.js';

export default class ExamView extends CrudView {
    constructor() {
        super({
            title: 'Exams',
            endpoint: 'admin/exams',
            idKey: 'examId',
            columns: [
                { key: 'examName', label: 'Exam Name' },
                { key: 'examType', label: 'Type', render: (v) => v ? `<span class="badge badge--info">${v}</span>` : '-' },
                { key: 'examDate', label: 'Date' },
                { key: 'examTime', label: 'Time' },
                { key: 'duration', label: 'Duration (min)' },
                { key: 'courseName', label: 'Course' },
                { key: 'classroomName', label: 'Classroom', render: (v) => v ?? '<span style="color:var(--color-muted)">Not planned</span>' },
                { key: 'studentCount', label: 'Students', render: (v, row) => {
                    const count = v ?? 0;
                    const badge = count > 0
                        ? `<span class="badge badge--success" style="cursor:pointer" data-exam-id="${row.examId}" data-exam-name="${row.examName}">${count} assigned</span>`
                        : `<span style="color:var(--color-muted)">0</span>`;
                    return badge;
                }},
                { key: 'isCommonExam', label: 'Common', render: (val) => val ? '<span class="badge badge--info">Yes</span>' : '<span class="badge badge--success">No</span>' }
            ],
            formFields: [
                { key: 'examName', label: 'Exam Name', type: 'text', required: true },
                {
                    key: 'examType', label: 'Exam Type', type: 'select', required: true,
                    options: [
                        { value: 'MIDTERM', label: 'Midterm' },
                        { value: 'FINAL',   label: 'Final' },
                        { value: 'QUIZ',    label: 'Quiz' },
                        { value: 'MAKEUP',  label: 'Makeup' }
                    ]
                },
                { key: 'examDate', label: 'Exam Date', type: 'date', required: true },
                { key: 'examTime', label: 'Exam Time', type: 'time', required: true },
                { key: 'duration', label: 'Duration (minutes)', type: 'number', required: true, defaultValue: 90 },
                { key: 'courseId',    label: 'Course',    type: 'select', required: true, optionsEndpoint: 'admin/courses',    optionValue: 'courseId',    optionLabel: 'courseName' },
                { key: 'classroomId', label: 'Classroom (optional)', type: 'select', optionsEndpoint: 'admin/classrooms', optionValue: 'classroomId', optionLabel: 'roomName' },
                { key: 'isCommonExam', label: 'Is Common Exam?', type: 'checkbox' }
            ]
        });
    }

    mount() {
        super.mount();
        document.addEventListener('click', this._onStudentBadgeClick = (e) => {
            const badge = e.target.closest('[data-exam-id]');
            if (badge) this._showStudentModal(badge.dataset.examId, badge.dataset.examName);
        });
    }

    unmount() {
        super.unmount();
        document.removeEventListener('click', this._onStudentBadgeClick);
    }

    async _showStudentModal(examId, examName) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'display:flex; z-index:10000;';
        overlay.innerHTML = `
            <div class="modal-content glass-panel" style="max-width:700px; width:90%; max-height:80vh; display:flex; flex-direction:column;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Students — ${examName}</h2>
                    <button data-act="close" class="btn-secondary" style="padding:4px 12px;">✕</button>
                </div>
                <div style="padding: var(--space-sm) var(--space-md) 0; display:flex; gap:var(--space-sm); align-items:center; flex-wrap:wrap;">
                    <span id="ev-sel-count" style="font-size:var(--font-size-sm); color:var(--color-muted);">0 seçili</span>
                    <button id="ev-save-remove" class="btn-primary" disabled
                        style="padding:6px 16px; font-size:var(--font-size-sm); background:var(--color-danger); border-color:var(--color-danger);">
                        Seçilenleri Çıkar
                    </button>
                </div>
                <div id="ev-student-body" style="overflow-y:auto; padding: var(--space-md);">
                    <div class="loading-overlay" style="position:static; height:80px;"><div class="loading-spinner"></div></div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target.dataset?.act === 'close' || e.target === overlay) overlay.remove();
        });

        const updateSaveBtn = () => {
            const checked = overlay.querySelectorAll('.ev-cb:checked').length;
            const label = overlay.querySelector('#ev-sel-count');
            const btn   = overlay.querySelector('#ev-save-remove');
            if (label) label.textContent = `${checked} seçili`;
            if (btn)   btn.disabled = checked === 0;
        };

        const renderStudents = async () => {
            const body = overlay.querySelector('#ev-student-body');
            if (!body) return;
            body.innerHTML = '<div class="loading-overlay" style="position:static; height:80px;"><div class="loading-spinner"></div></div>';
            try {
                const assignments = await Api.request(`admin/exams/${examId}/students`);
                if (!assignments.length) {
                    body.innerHTML = '<p style="color:var(--color-muted); text-align:center;">No students assigned yet.</p>';
                    updateSaveBtn();
                    return;
                }
                const grouped = assignments.reduce((acc, a) => {
                    const key = a.classroomName || 'Unassigned';
                    (acc[key] = acc[key] || []).push(a);
                    return acc;
                }, {});
                body.innerHTML = Object.entries(grouped).map(([room, list]) => `
                    <div style="margin-bottom: var(--space-md);">
                        <div style="font-weight:bold; color:var(--color-accent); margin-bottom: var(--space-xs);">
                            ${room} <span class="badge badge--info">${list.length} students</span>
                        </div>
                        <table style="width:100%; border-collapse:collapse; font-size: var(--font-size-sm);">
                            <thead>
                                <tr style="text-align:left; color:var(--color-muted); border-bottom:1px solid var(--glass-border);">
                                    <th style="padding:4px 8px; width:32px;">
                                        <input type="checkbox" class="ev-cb-all" title="Tümünü seç">
                                    </th>
                                    <th style="padding:4px 8px;">Seat</th>
                                    <th style="padding:4px 8px;">Student No</th>
                                    <th style="padding:4px 8px;">Full Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${list.sort((a,b) => (a.seatNumber||0)-(b.seatNumber||0)).map(a => `
                                    <tr style="border-bottom:1px solid var(--glass-border);">
                                        <td style="padding:4px 8px;">
                                            <input type="checkbox" class="ev-cb" data-assignment-id="${a.assignmentId}">
                                        </td>
                                        <td style="padding:4px 8px; font-weight:bold;">${a.seatNumber ?? '—'}</td>
                                        <td style="padding:4px 8px;">${a.studentNo}</td>
                                        <td style="padding:4px 8px;">${a.studentName}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`).join('');

                // "select all" per group
                body.querySelectorAll('.ev-cb-all').forEach(master => {
                    master.addEventListener('change', () => {
                        const tbody = master.closest('table').querySelector('tbody');
                        tbody.querySelectorAll('.ev-cb').forEach(cb => { cb.checked = master.checked; });
                        updateSaveBtn();
                    });
                });
                body.querySelectorAll('.ev-cb').forEach(cb => cb.addEventListener('change', updateSaveBtn));
                updateSaveBtn();
            } catch (err) {
                Toast.error('Failed to load students: ' + err.message);
            }
        };

        // Save (batch remove) button
        overlay.querySelector('#ev-save-remove').addEventListener('click', async () => {
            const checked = [...overlay.querySelectorAll('.ev-cb:checked')];
            if (!checked.length) return;
            const btn = overlay.querySelector('#ev-save-remove');
            btn.disabled = true;
            btn.textContent = 'Çıkarılıyor…';
            try {
                await Promise.all(
                    checked.map(cb => Api.request(`admin/exam-assignments/${cb.dataset.assignmentId}`, { method: 'DELETE' }))
                );
                Toast.success(`${checked.length} öğrenci sınavdan çıkarıldı.`);
                await renderStudents();
                await this._loadData();
            } catch (err) {
                Toast.error('Remove failed: ' + err.message);
                btn.disabled = false;
                btn.textContent = 'Seçilenleri Çıkar';
            }
        });

        await renderStudents();
    }
}
