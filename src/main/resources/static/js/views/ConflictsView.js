import { Api, Toast } from '../api.js';

export default class ConflictsView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Conflict Detection</h1>
                <button class="btn-primary" id="cv-refresh">🔄 Refresh</button>
            </header>
            <div id="cv-body">
                <div class="card" style="text-align:center; padding: var(--space-xl); color: var(--color-muted);">
                    Loading conflicts...
                </div>
            </div>
        </div>`;
    }

    async mount() {
        this._body = document.getElementById('cv-body');
        this._refreshBtn = document.getElementById('cv-refresh');
        this._onRefresh = () => this._load();
        this._refreshBtn.addEventListener('click', this._onRefresh);
        await this._load();
    }

    async _load() {
        this._body.innerHTML = '<div class="card" style="text-align:center; padding: var(--space-lg);"><div class="loading-spinner"></div></div>';
        try {
            const conflicts = await Api.request('admin/exam-planning/conflicts');
            this._render(conflicts);
        } catch (err) {
            this._body.innerHTML = `<div class="card" style="border-left:4px solid var(--color-danger);"><h3 style="color:var(--color-danger);">Failed to load</h3><p>${err.message}</p></div>`;
        }
    }

    _render(conflicts) {
        if (!conflicts || conflicts.length === 0) {
            this._body.innerHTML = `
                <div class="card" style="text-align:center; padding: var(--space-xl); border-left: 4px solid var(--color-success);">
                    <div style="font-size:48px;">✅</div>
                    <h2>No conflicts detected</h2>
                    <p style="color: var(--color-muted);">All exam assignments are conflict-free.</p>
                </div>`;
            return;
        }

        const grouped = {
            STUDENT_DOUBLE_BOOKED: [],
            INSTRUCTOR_DOUBLE_BOOKED: [],
            CLASSROOM_DOUBLE_BOOKED: []
        };
        conflicts.forEach(c => { (grouped[c.type] ||= []).push(c); });

        const titles = {
            STUDENT_DOUBLE_BOOKED:    { icon: '👨‍🎓', label: 'Students in Multiple Exams (same time)', color: 'var(--color-danger)' },
            INSTRUCTOR_DOUBLE_BOOKED: { icon: '👨‍🏫', label: 'Instructors Double-Booked',              color: 'orange' },
            CLASSROOM_DOUBLE_BOOKED:  { icon: '🏫', label: 'Classrooms Hosting Multiple Exams',       color: 'orange' }
        };

        let html = `<div class="card" style="border-left:4px solid var(--color-danger); margin-bottom: var(--space-md);">
            <h2 style="color:var(--color-danger);">⚠️ ${conflicts.length} conflict${conflicts.length>1?'s':''} found</h2>
        </div>`;

        for (const type of Object.keys(grouped)) {
            const list = grouped[type];
            if (!list || list.length === 0) continue;
            const t = titles[type];
            html += `<div class="glass-panel" style="padding: var(--space-md); margin-bottom: var(--space-md); border-left: 4px solid ${t.color};">
                <h3>${t.icon} ${t.label} (${list.length})</h3>
                <table style="width:100%; margin-top: var(--space-sm);">
                    <thead><tr>${this._headersFor(type).map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>${list.map(c => this._rowFor(type, c)).join('')}</tbody>
                </table>
            </div>`;
        }

        this._body.innerHTML = html;
    }

    _headersFor(type) {
        if (type === 'STUDENT_DOUBLE_BOOKED')    return ['Student No', 'Name', 'Date', 'Time', 'Conflicting Exams'];
        if (type === 'INSTRUCTOR_DOUBLE_BOOKED') return ['Staff No', 'Name', 'Date', 'Time', 'Conflicting Exams'];
        if (type === 'CLASSROOM_DOUBLE_BOOKED')  return ['Classroom', 'Date', 'Time', 'Conflicting Exams'];
        return [];
    }

    _rowFor(type, c) {
        const exams = (c.exams || []).map(e => `<span class="badge badge--info">${e}</span>`).join(' ');
        if (type === 'STUDENT_DOUBLE_BOOKED') {
            return `<tr><td>${c.studentNo}</td><td>${c.studentName}</td><td>${c.date}</td><td>${c.time}</td><td>${exams}</td></tr>`;
        }
        if (type === 'INSTRUCTOR_DOUBLE_BOOKED') {
            return `<tr><td>${c.staffNo}</td><td>${c.instructorName}</td><td>${c.date}</td><td>${c.time}</td><td>${exams}</td></tr>`;
        }
        if (type === 'CLASSROOM_DOUBLE_BOOKED') {
            return `<tr><td>${c.classroom}</td><td>${c.date}</td><td>${c.time}</td><td>${exams}</td></tr>`;
        }
        return '';
    }

    unmount() {
        if (this._refreshBtn) this._refreshBtn.removeEventListener('click', this._onRefresh);
        this._body = this._refreshBtn = null;
    }
}
