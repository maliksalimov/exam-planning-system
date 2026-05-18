import { Api, Toast } from '../api.js';
import { PdfGenerator } from '../utils/PdfGenerator.js';


export default class ExamPlanningView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Exam Planner</h1>
            </header>

            <div style="display: grid; grid-template-columns: 380px 1fr; gap: var(--space-xl); align-items: start;">

                <!-- LEFT COLUMN: Configuration Panel -->
                <div class="glass-panel" style="padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); top: 100px; position: sticky;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="ep-exam-select">Select Exam</label>
                        <select id="ep-exam-select" class="form-input">
                            <option value="">-- Choose Exam --</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="ep-dept-filter">Filter by Department</label>
                        <select id="ep-dept-filter" class="form-input">
                            <option value="">-- All Departments --</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="ep-student-search">Search Students</label>
                        <input type="text" id="ep-student-search" class="form-input" placeholder="Type name or number..." />
                    </div>

                    <div style="display:flex; gap:var(--space-xs);">
                        <button class="btn-secondary" id="ep-select-all" style="flex:1; font-size:12px;">Select All Visible</button>
                        <button class="btn-secondary" id="ep-clear-all" style="flex:1; font-size:12px;">Clear All</button>
                    </div>

                    <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold; margin-top: var(--space-sm); display:flex; justify-content:space-between;">
                        <span>Select Participants</span>
                        <span id="ep-selected-count" style="color: var(--color-accent);">0 selected</span>
                    </div>

                    <div id="ep-student-list" style="max-height: 280px; overflow-y: auto; background: var(--color-bg-deep); border-radius: var(--radius-md); padding: var(--space-xs); border: 1px solid var(--glass-border);">
                        <!-- Checkboxes inserted here -->
                    </div>

                    <div style="display:flex; flex-direction:column; gap: var(--space-xs); margin-top: var(--space-sm);">
                        <button class="btn-secondary" id="ep-preview-btn">🔍 Preview Plan (dry-run)</button>
                        <button class="btn-primary" id="ep-plan-btn">✅ Execute & Save Plan</button>
                        <button class="btn-secondary" id="ep-reset-btn" style="background:#d33; color:white;">🗑️ Reset Existing Plan</button>
                    </div>
                    <p id="ep-error" class="login-error" style="margin: 0"></p>
                </div>

                <!-- RIGHT COLUMN: Result Panel -->
                <div id="ep-result-panel" class="result-tree">
                    <div class="card" style="text-align: center; color: var(--color-muted); padding: var(--space-xl);">
                        <div style="font-size: var(--font-size-xl); margin-bottom: var(--space-sm);">📋</div>
                        Select an exam and students, then click Preview to see the plan without saving, or Execute to save it.
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async mount() {
        this._examSelect    = document.getElementById('ep-exam-select');
        this._deptFilter    = document.getElementById('ep-dept-filter');
        this._studentList   = document.getElementById('ep-student-list');
        this._searchInput   = document.getElementById('ep-student-search');
        this._selectAllBtn  = document.getElementById('ep-select-all');
        this._clearAllBtn   = document.getElementById('ep-clear-all');
        this._previewBtn    = document.getElementById('ep-preview-btn');
        this._planBtn       = document.getElementById('ep-plan-btn');
        this._resetBtn      = document.getElementById('ep-reset-btn');
        this._selectedCount = document.getElementById('ep-selected-count');
        this._resultPanel   = document.getElementById('ep-result-panel');
        this._errorEl       = document.getElementById('ep-error');

        this._allStudents = [];

        try {
            const [exams, students, departments] = await Promise.all([
                Api.request('admin/exams'),
                Api.request('admin/students'),
                Api.request('admin/departments')
            ]);

            if (!this._examSelect) return;

            exams.forEach(exam => {
                const opt = document.createElement('option');
                opt.value = exam.examId;
                opt.textContent = `${exam.examName} (${exam.examDate} ${exam.examTime || ''})`;
                this._examSelect.appendChild(opt);
            });

            departments.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.departmentId;
                opt.textContent = d.departmentName;
                this._deptFilter.appendChild(opt);
            });

            this._allStudents = students;
            this._renderStudentList();

        } catch (err) {
            console.error(err);
            Toast.error('Failed to load configuration data.');
        }

        this._onSearch = () => this._applyFilters();
        this._onDept   = () => this._applyFilters();
        this._searchInput.addEventListener('input', this._onSearch);
        this._deptFilter.addEventListener('change', this._onDept);

        this._onSelectAll = () => this._setVisibleChecked(true);
        this._onClearAll  = () => this._setVisibleChecked(false);
        this._selectAllBtn.addEventListener('click', this._onSelectAll);
        this._clearAllBtn.addEventListener('click', this._onClearAll);

        this._onListChange = () => this._updateSelectedCount();
        this._studentList.addEventListener('change', this._onListChange);

        this._onPreview = () => this._runPlanning(true);
        this._onPlan    = () => this._runPlanning(false);
        this._onReset   = () => this._handleReset();
        this._previewBtn.addEventListener('click', this._onPreview);
        this._planBtn.addEventListener('click', this._onPlan);
        this._resetBtn.addEventListener('click', this._onReset);
    }

    _renderStudentList() {
        this._studentList.innerHTML = '';
        this._allStudents.forEach(student => {
            const label = document.createElement('label');
            label.className = 'checkbox-item ep-student-item';
            label.dataset.deptId = student.departmentId ?? '';
            label.innerHTML = `
                <input type="checkbox" data-id="${student.studentId}" />
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: var(--font-size-sm); font-weight: bold;">${student.fullName}</span>
                    <span style="font-size: 11px; color: var(--color-muted);">${student.studentNo ?? student.stringNo ?? ''} - ${student.departmentName ?? ''}</span>
                </div>
            `;
            this._studentList.appendChild(label);
        });
        this._updateSelectedCount();
    }

    _applyFilters() {
        const term = (this._searchInput.value || '').toLowerCase();
        const dept = this._deptFilter.value;
        const items = this._studentList.querySelectorAll('.ep-student-item');
        items.forEach(item => {
            const matchesText = item.innerText.toLowerCase().includes(term);
            const matchesDept = !dept || item.dataset.deptId === dept;
            item.style.display = (matchesText && matchesDept) ? 'flex' : 'none';
        });
    }

    _setVisibleChecked(checked) {
        const items = this._studentList.querySelectorAll('.ep-student-item');
        items.forEach(item => {
            if (item.style.display !== 'none') {
                const cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = checked;
            }
        });
        this._updateSelectedCount();
    }

    _updateSelectedCount() {
        const n = this._studentList.querySelectorAll('input[type="checkbox"]:checked').length;
        this._selectedCount.textContent = `${n} selected`;
    }

    async _runPlanning(dryRun) {
        this._errorEl.textContent = '';
        const examId = this._examSelect.value;
        const checkboxes = this._studentList.querySelectorAll('input[type="checkbox"]:checked');
        const studentIds = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));

        if (!examId) { this._errorEl.textContent = 'Please select an exam.'; return; }
        if (studentIds.length === 0) { this._errorEl.textContent = 'Please select at least one student.'; return; }

        const btn = dryRun ? this._previewBtn : this._planBtn;
        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = dryRun ? 'Previewing...' : 'Saving...';
        this._resultPanel.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

        try {
            const result = await Api.request(`admin/exam-planning/plan/${examId}?dryRun=${dryRun}`, {
                method: 'POST',
                body: JSON.stringify(studentIds)
            });
            this._renderResult(result);
            Toast.success(dryRun ? 'Preview generated (nothing saved)' : 'Plan saved to database!');
        } catch (err) {
            this._resultPanel.innerHTML = `
                <div class="card" style="border-left: 4px solid var(--color-danger)">
                    <h3 style="color: var(--color-danger)">Planning Failed</h3>
                    <p style="color: var(--color-muted)">${err.message}</p>
                </div>`;
        } finally {
            btn.disabled = false;
            btn.textContent = origText;
        }
    }

    async _handleReset() {
        this._errorEl.textContent = '';
        const examId = this._examSelect.value;
        if (!examId) { this._errorEl.textContent = 'Please select an exam to reset.'; return; }

        const ok = await this._confirm('Reset Plan',
            'This will DELETE all student assignments and invigilator duties for the selected exam. Are you sure?');
        if (!ok) return;

        this._resetBtn.disabled = true;
        this._resetBtn.textContent = 'Resetting...';
        try {
            const result = await Api.request(`admin/exam-planning/plan/${examId}`, { method: 'DELETE' });
            this._resultPanel.innerHTML = `
                <div class="card" style="border-left: 4px solid var(--color-success)">
                    <h3>Plan Reset Complete</h3>
                    <p><strong>Exam:</strong> ${result.examName}</p>
                    <p>Cleared <strong>${result.studentAssignmentsCleared}</strong> student assignments and
                       <strong>${result.invigilatorAssignmentsCleared}</strong> invigilator duties.</p>
                </div>`;
            Toast.success('Plan reset successfully');
        } catch (err) {
            Toast.error('Reset failed: ' + err.message);
        } finally {
            this._resetBtn.disabled = false;
            this._resetBtn.textContent = '🗑️ Reset Existing Plan';
        }
    }

    _confirm(title, message) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';
            overlay.style.zIndex = '10000';
            overlay.innerHTML = `
                <div class="modal-content glass-panel" style="max-width:420px;">
                    <div class="modal-header"><h2>${title}</h2></div>
                    <div style="padding: var(--space-md);">
                        <p style="margin-bottom: var(--space-md);">${message}</p>
                        <div style="display:flex; gap: var(--space-sm); justify-content:flex-end;">
                            <button type="button" class="btn-secondary" data-act="cancel">Cancel</button>
                            <button type="button" class="btn-primary" data-act="confirm" style="background:#d33;">Confirm</button>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (e) => {
                const act = e.target.dataset?.act;
                if (act === 'confirm') { overlay.remove(); resolve(true); }
                else if (act === 'cancel' || e.target === overlay) { overlay.remove(); resolve(false); }
            });
        });
    }

    _renderResult(data) {
        const isDryRun = !!data.dryRun;
        let html = `
            ${isDryRun ? `<div class="card" style="background: rgba(255,200,0,0.1); border-left: 4px solid orange; margin-bottom: var(--space-md);">
                <strong>⚠️ PREVIEW MODE</strong> — Nothing has been saved to the database. Click "Execute & Save Plan" to commit.
            </div>` : ''}
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
                ${!isDryRun ? `<div style="margin-top: var(--space-sm); width: 100%; display:flex; gap: var(--space-sm); flex-wrap:wrap;">
                    <button class="btn-primary" id="ep-pdf-general" style="flex:1">📄 Genel Sınav Planı PDF</button>
                    <button class="btn-secondary" id="ep-pdf-duties" style="flex:1">📋 Gözetmen Görev Dağılımı PDF</button>
                </div>` : ''}
            </div>
        `;

        this._currentData = data;

        if (data.classrooms && data.classrooms.length > 0) {
            data.classrooms.forEach((room, index) => {
                html += `
                <div class="result-room-card">
                    <div class="result-room-card__header">
                        <div style="font-weight: bold; font-size: var(--font-size-lg);">${room.classroom}</div>
                        <div class="badge badge--success">${room.studentsAssigned} / ${room.capacity} seats</div>
                    </div>
                    <div class="result-room-card__section">
                        <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold;">Invigilators (${room.invigilatorsAssigned})</div>
                        <div style="font-size: var(--font-size-md);">${(room.invigilatorNames || []).join(', ')}</div>
                    </div>
                    <div class="result-room-card__section">
                        <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold;">Assigned Students</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${(room.studentNumbers || []).map(no => `<span class="student-tag">${no}</span>`).join('')}
                        </div>
                    </div>
                    ${!isDryRun ? `<div style="display: flex; gap: var(--space-sm); margin-top: var(--space-xs);">
                        <button class="btn-secondary ep-pdf-room"  data-index="${index}" style="font-size: 11px; padding: 4px 8px;">PDF: Room List</button>
                        <button class="btn-secondary ep-pdf-invig" data-index="${index}" style="font-size: 11px; padding: 4px 8px;">PDF: Sign Sheet</button>
                    </div>` : ''}
                </div>`;
            });
        }

        this._resultPanel.innerHTML = html;

        if (!isDryRun) {
            const pdfGenBtn = document.getElementById('ep-pdf-general');
            if (pdfGenBtn) pdfGenBtn.onclick = () => PdfGenerator.generateGeneralExamPlan(this._currentData);

            const pdfDutiesBtn = document.getElementById('ep-pdf-duties');
            if (pdfDutiesBtn) pdfDutiesBtn.onclick = () => {
                const duties = [];
                (this._currentData.classrooms || []).forEach(room => {
                    (room.invigilatorNames || []).forEach(n => {
                        duties.push({
                            instructorName: n.replace(/\s*\(görev:\s*\d+\)/, ''),
                            examName: this._currentData.examName,
                            examTime: this._currentData.examTime,
                            classroom: room.classroom,
                            dutyCount: (n.match(/görev: (\d+)/) || [])[1] || ''
                        });
                    });
                });
                PdfGenerator.generateInvigilatorDutyList(this._currentData.examDate, duties);
            };

            this._resultPanel.querySelectorAll('.ep-pdf-room').forEach(btn => btn.onclick = (e) => {
                const idx = e.target.getAttribute('data-index');
                const room = this._currentData.classrooms[idx];
                PdfGenerator.generateExamRoomStudentList(room, this._currentData);
            });
            this._resultPanel.querySelectorAll('.ep-pdf-invig').forEach(btn => btn.onclick = (e) => {
                const idx = e.target.getAttribute('data-index');
                const room = this._currentData.classrooms[idx];
                PdfGenerator.generateInvigilatorSignSheet(room, this._currentData);
            });
        }
    }

    unmount() {
        if (this._searchInput)   this._searchInput.removeEventListener('input', this._onSearch);
        if (this._deptFilter)    this._deptFilter.removeEventListener('change', this._onDept);
        if (this._selectAllBtn)  this._selectAllBtn.removeEventListener('click', this._onSelectAll);
        if (this._clearAllBtn)   this._clearAllBtn.removeEventListener('click', this._onClearAll);
        if (this._studentList)   this._studentList.removeEventListener('change', this._onListChange);
        if (this._previewBtn)    this._previewBtn.removeEventListener('click', this._onPreview);
        if (this._planBtn)       this._planBtn.removeEventListener('click', this._onPlan);
        if (this._resetBtn)      this._resetBtn.removeEventListener('click', this._onReset);

        this._examSelect = this._deptFilter = this._studentList = this._searchInput = null;
        this._previewBtn = this._planBtn = this._resetBtn = this._resultPanel = this._errorEl = null;
    }
}
