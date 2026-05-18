import { Api, Toast } from '../api.js';

export default class StudentQueryView {
    constructor() {
        this._data = null;
    }

    getHtml() {
        return `
        <div class="page-container" style="max-width: 600px; margin: auto; padding-top: 120px;">
            <div class="card" style="text-align: center;">
                <h2 style="margin-bottom: var(--space-sm); color: var(--color-accent)">Exam Location Inquiry</h2>
                <p style="color: var(--color-muted); margin-bottom: var(--space-lg);">Enter your student number to find out where your exams will be held.</p>
                
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
        this._form = document.getElementById('sq-form');
        this._input = document.getElementById('sq-input');
        this._result = document.getElementById('sq-result');

        this._onSubmit = async (e) => {
            e.preventDefault();
            const studentNo = this._input.value.trim();
            if (!studentNo) return;

            this._result.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

            try {
                // Fetch student details by number
                const student = await Api.request(`student/query/${studentNo}`);
                
                if (!student || !student.exams || student.exams.length === 0) {
                    this._result.innerHTML = `<div class="badge badge--info" style="width: 100%; justify-content: center; padding: var(--space-md);">No upcoming exams found.</div>`;
                    return;
                }

                let html = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
                        <div>
                            <h3 style="margin-bottom: 2px;">${student.fullName}</h3>
                            <div style="font-size: var(--font-size-sm); color: var(--color-muted);">
                                ${student.departmentName}
                            </div>
                        </div>
                        <button class="btn-secondary" id="sq-pdf-btn" style="padding: 4px 12px; font-size: 12px;">Export PDF</button>
                    </div>
                `;

                student.exams.forEach(ex => {
                    html += `
                    <div class="glass-panel" style="padding: var(--space-md); margin-bottom: var(--space-sm); border-left: 4px solid var(--color-primary);">
                        <div style="font-weight: bold; margin-bottom: 4px;">${ex.courseName}</div>
                        <div style="font-size: var(--font-size-sm); display: flex; flex-wrap: wrap; gap: var(--space-sm);">
                            <span class="badge badge--info">${ex.examDate} ${ex.examTime}</span>
                            <span class="badge badge--success">${ex.campus} / ${ex.building} - ${ex.classroom}</span>
                        </div>
                    </div>
                    `;
                });

                this._result.innerHTML = html;

                const pdfBtn = document.getElementById('sq-pdf-btn');
                if (pdfBtn) {
                    pdfBtn.onclick = () => {
                        import('../utils/PdfGenerator.js').then(m => {
                            m.PdfGenerator.generateStudentExamCard(student);
                        });
                    };
                }

            } catch (err) {
                console.error(err);
                this._result.innerHTML = `<div class="badge badge--danger" style="width: 100%; justify-content: center; padding: var(--space-md);">Student not found or error occurred.</div>`;
            }
        };

        this._form.addEventListener('submit', this._onSubmit);
    }

    unmount() {
        if (this._form) this._form.removeEventListener('submit', this._onSubmit);
        this._form = null;
        this._input = null;
        this._result = null;
    }
}
