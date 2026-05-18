import { Api, Toast } from '../api.js';

export default class StudentQueryView {
    constructor() {
        this._data = null;
    }

    getHtml() {
        return `
        <div class="page-container" style="max-width: 660px; margin: auto; padding-top: 120px;">
            <div class="card" style="text-align: center;">
                <h2 style="margin-bottom: var(--space-sm); color: var(--color-accent)">Exam Location Inquiry</h2>
                <p style="color: var(--color-muted); margin-bottom: var(--space-md);">Search by student number or full name to find exam seat assignments.</p>

                <div style="display:flex; justify-content:center; gap: var(--space-md); margin-bottom: var(--space-md);">
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                        <input type="radio" name="sq-mode" value="number" checked /> Student Number
                    </label>
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                        <input type="radio" name="sq-mode" value="name" /> Full Name
                    </label>
                </div>

                <form id="sq-form" style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg);">
                    <input type="text" id="sq-input" class="form-input" placeholder="e.g. 2023001" required style="flex: 1;" />
                    <button type="submit" class="btn-primary">Search</button>
                </form>

                <div id="sq-result" style="text-align: left;"></div>
            </div>
        </div>
        `;
    }

    async mount() {
        this._form   = document.getElementById('sq-form');
        this._input  = document.getElementById('sq-input');
        this._result = document.getElementById('sq-result');

        // Update placeholder when mode changes
        this._onModeChange = (e) => {
            if (e.target.name === 'sq-mode') {
                this._input.placeholder = e.target.value === 'name' ? 'e.g. Malik Salimov' : 'e.g. 2023001';
                this._result.innerHTML = '';
            }
        };
        document.addEventListener('change', this._onModeChange);

        this._onSubmit = async (e) => {
            e.preventDefault();
            const query = this._input.value.trim();
            if (!query) return;

            const mode = document.querySelector('input[name="sq-mode"]:checked')?.value || 'number';
            this._result.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

            try {
                if (mode === 'number') {
                    const student = await Api.request(`student/query/${encodeURIComponent(query)}`);
                    this._renderStudents([student]);
                } else {
                    const students = await Api.request(`student/query/name/${encodeURIComponent(query)}`);
                    this._renderStudents(students);
                }
            } catch (err) {
                console.error(err);
                this._result.innerHTML = `<div class="badge badge--danger" style="width:100%; justify-content:center; padding:var(--space-md);">No results found or an error occurred.</div>`;
            }
        };

        this._form.addEventListener('submit', this._onSubmit);
    }

    _renderStudents(students) {
        if (!students || students.length === 0) {
            this._result.innerHTML = `<div class="badge badge--info" style="width:100%; justify-content:center; padding:var(--space-md);">No upcoming exams found.</div>`;
            return;
        }

        let html = '';
        students.forEach((student, idx) => {
            if (students.length > 1) {
                html += `<div style="font-weight:bold; font-size:var(--font-size-sm); color:var(--color-muted); margin: var(--space-sm) 0 4px;">Result ${idx + 1}</div>`;
            }
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm);">
                    <div>
                        <h3 style="margin-bottom:2px;">${student.fullName}</h3>
                        <div style="font-size:var(--font-size-sm); color:var(--color-muted);">
                            ${student.studentNo} &bull; ${student.departmentName}
                        </div>
                    </div>
                    <button class="btn-secondary sq-pdf-btn" data-idx="${idx}" style="padding:4px 12px; font-size:12px;">Export PDF</button>
                </div>`;

            if (!student.exams || student.exams.length === 0) {
                html += `<div class="badge badge--info" style="margin-bottom:var(--space-md);">No exams assigned.</div>`;
            } else {
                student.exams.forEach(ex => {
                    html += `
                    <div class="glass-panel" style="padding:var(--space-md); margin-bottom:var(--space-sm); border-left:4px solid var(--color-primary);">
                        <div style="font-weight:bold; margin-bottom:4px;">${ex.courseName}</div>
                        <div style="font-size:var(--font-size-sm); display:flex; flex-wrap:wrap; gap:var(--space-sm);">
                            <span class="badge badge--info">${ex.examDate} ${ex.examTime}</span>
                            <span class="badge badge--success">${ex.campus} / ${ex.building} — ${ex.classroom}</span>
                            <span class="badge badge--warning">Seat: ${ex.seatNumber ?? '—'}</span>
                        </div>
                    </div>`;
                });
            }

            if (students.length > 1) html += `<hr style="margin: var(--space-md) 0; border-color: var(--color-border);" />`;
        });

        this._result.innerHTML = html;
        this._students = students;

        this._result.querySelectorAll('.sq-pdf-btn').forEach(btn => {
            btn.onclick = () => {
                const student = this._students[parseInt(btn.dataset.idx)];
                if (!student) return;
                import('../utils/PdfGenerator.js').then(m => {
                    m.PdfGenerator.generateStudentExamCard(student);
                });
            };
        });
    }

    unmount() {
        if (this._form) this._form.removeEventListener('submit', this._onSubmit);
        if (this._onModeChange) document.removeEventListener('change', this._onModeChange);
        this._form = null;
        this._input = null;
        this._result = null;
        this._students = null;
    }
}
