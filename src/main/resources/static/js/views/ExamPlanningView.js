import { Api, Toast } from '../api.js';

export default class ExamPlanningView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Exam Planner</h1>
            </header>

            <div style="display: grid; grid-template-columns: 350px 1fr; gap: var(--space-xl); align-items: start;">
                
                <!-- LEFT COLUMN: Configuration Panel -->
                <div class="glass-panel" style="padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); top: 100px; position: sticky;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="ep-exam-select">Select Exam</label>
                        <select id="ep-exam-select" class="form-input">
                            <option value="">-- Choose Exam --</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="ep-student-search">Search Students</label>
                        <input type="text" id="ep-student-search" class="form-input" placeholder="Type name or number..." />
                    </div>

                    <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold; margin-top: var(--space-sm);">
                        Select Participants
                    </div>
                    
                    <div id="ep-student-list" style="max-height: 300px; overflow-y: auto; background: var(--color-bg-deep); border-radius: var(--radius-md); padding: var(--space-xs); border: 1px solid var(--glass-border);">
                        <!-- Checkboxes inserted here -->
                    </div>

                    <button class="btn-primary" id="ep-plan-btn" style="margin-top: var(--space-md);">Execute Planning</button>
                    <p id="ep-error" class="login-error" style="margin: 0"></p>
                </div>

                <!-- RIGHT COLUMN: Result Panel -->
                <div id="ep-result-panel" class="result-tree">
                    <div class="card" style="text-align: center; color: var(--color-muted); padding: var(--space-xl);">
                        <div style="font-size: var(--font-size-xl); margin-bottom: var(--space-sm);">📋</div>
                        Select an exam and students, then click Execute to see the generated planning tree.
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async mount() {
        this._examSelect = document.getElementById('ep-exam-select');
        this._studentList = document.getElementById('ep-student-list');
        this._searchInput = document.getElementById('ep-student-search');
        this._planBtn = document.getElementById('ep-plan-btn');
        this._resultPanel = document.getElementById('ep-result-panel');
        this._errorEl = document.getElementById('ep-error');

        try {
            // Fetch configuration data
            const [exams, students] = await Promise.all([
                Api.request('admin/exams'),
                Api.request('admin/students')
            ]);

            // Populate exams
            if (!this._examSelect) return; // View unmounted during fetch

            exams.forEach(exam => {
                const opt = document.createElement('option');
                opt.value = exam.examId;
                opt.textContent = `${exam.examName} (${exam.examDate})`;
                this._examSelect.appendChild(opt);
            });

            // Populate students
            this._studentList.innerHTML = '';
            students.forEach(student => {
                const label = document.createElement('label');
                label.className = 'checkbox-item ep-student-item';
                label.innerHTML = `
                    <input type="checkbox" data-id="${student.studentId}" />
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: var(--font-size-sm); font-weight: bold;">${student.fullName}</span>
                        <span style="font-size: 11px; color: var(--color-muted);">${student.stringNo} - ${student.departmentName}</span>
                    </div>
                `;
                this._studentList.appendChild(label);
            });

        } catch (err) {
            console.error(err);
            Toast.error('Failed to load configuration data.');
        }

        // Search Filter Logic
        this._onSearch = (e) => {
            const term = e.target.value.toLowerCase();
            const items = this._studentList.querySelectorAll('.ep-student-item');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(term) ? 'flex' : 'none';
            });
        };
        this._searchInput.addEventListener('input', this._onSearch);

        // Planning Execution Logic
        this._onPlan = async () => {
            this._errorEl.textContent = '';
            const examId = this._examSelect.value;
            
            // Gather selected student IDs
            const checkboxes = this._studentList.querySelectorAll('input[type="checkbox"]:checked');
            const studentIds = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));

            if (!examId) {
                this._errorEl.textContent = 'Please select an exam.';
                return;
            }
            if (studentIds.length === 0) {
                this._errorEl.textContent = 'Please select at least one student.';
                return;
            }

            this._planBtn.disabled = true;
            this._planBtn.textContent = 'Planning...';
            this._resultPanel.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

            try {
                const result = await Api.request(`admin/exam-planning/plan/${examId}`, {
                    method: 'POST',
                    body: JSON.stringify(studentIds)
                });
                this._renderResult(result);
                Toast.success('Exam planned successfully!');
            } catch (err) {
                this._resultPanel.innerHTML = `
                    <div class="card" style="border-left: 4px solid var(--color-danger)">
                        <h3 style="color: var(--color-danger)">Planning Failed</h3>
                        <p style="color: var(--color-muted)">${err.message}</p>
                    </div>
                `;
            } finally {
                this._planBtn.disabled = false;
                this._planBtn.textContent = 'Execute Planning';
            }
        };
        this._planBtn.addEventListener('click', this._onPlan);
    }

    _renderResult(data) {
        let html = `
            <div class="glass-panel" style="padding: var(--space-md); display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center; justify-content: space-between;">
                <div>
                    <h2 style="margin-bottom: var(--space-xs);">${data.examName}</h2>
                    <div style="display: flex; gap: var(--space-xs);">
                        <span class="badge badge--info">${data.examDate}</span>
                        <span class="badge badge--info">${data.examTime}</span>
                    </div>
                </div>
                <div style="display: flex; gap: var(--space-md); text-align: center;">
                    <div>
                        <div style="font-size: var(--font-size-xl); font-weight: bold; color: var(--color-accent);">${data.totalStudents}</div>
                        <div style="font-size: 11px; color: var(--color-muted); text-transform: uppercase;">Students</div>
                    </div>
                    <div>
                        <div style="font-size: var(--font-size-xl); font-weight: bold; color: var(--color-primary);">${data.classroomsUsed}</div>
                        <div style="font-size: 11px; color: var(--color-muted); text-transform: uppercase;">Rooms</div>
                    </div>
                    <div>
                        <div style="font-size: var(--font-size-xl); font-weight: bold; color: var(--color-success);">${data.invigilatorsAssigned}</div>
                        <div style="font-size: 11px; color: var(--color-muted); text-transform: uppercase;">Invigilators</div>
                    </div>
                </div>
            </div>
        `;

        if (data.classrooms && data.classrooms.length > 0) {
            data.classrooms.forEach(room => {
                html += `
                <div class="result-room-card">
                    <div class="result-room-card__header">
                        <div style="font-weight: bold; font-size: var(--font-size-lg);">${room.classroom}</div>
                        <div class="badge badge--success">${room.studentsAssigned} / ${room.capacity} seats</div>
                    </div>
                    
                    <div class="result-room-card__section">
                        <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold;">Invigilators (${room.invigilatorsAssigned})</div>
                        <div style="font-size: var(--font-size-md);">${room.invigilatorNames.join(', ')}</div>
                    </div>

                    <div class="result-room-card__section">
                        <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold;">Assigned Students</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${room.studentNumbers.map(no => `<span class="student-tag">${no}</span>`).join('')}
                        </div>
                    </div>
                </div>
                `;
            });
        }

        this._resultPanel.innerHTML = html;
    }

    unmount() {
        if (this._searchInput) this._searchInput.removeEventListener('input', this._onSearch);
        if (this._planBtn) this._planBtn.removeEventListener('click', this._onPlan);
        
        this._examSelect = null;
        this._studentList = null;
        this._searchInput = null;
        this._planBtn = null;
        this._resultPanel = null;
        this._errorEl = null;
    }
}
