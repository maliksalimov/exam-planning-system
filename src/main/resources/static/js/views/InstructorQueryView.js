import { Api, Toast } from '../api.js';

export default class InstructorQueryView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>Gözetmenlik Görevlerim</h1>
                <button class="btn-secondary" id="iq-pdf-btn">📋 Görev Listesi PDF</button>
            </header>
            <div id="iq-result" class="result-tree">
                <div class="loading-overlay"><div class="loading-spinner"></div></div>
            </div>
        </div>
        `;
    }

    async mount() {
        this._result = document.getElementById('iq-result');
        this._pdfBtn = document.getElementById('iq-pdf-btn');
        this._duties = [];

        try {
            const duties = await Api.request('instructor/duties');
            this._duties = duties || [];

            if (!duties || duties.length === 0) {
                this._result.innerHTML = `
                    <div class="card" style="text-align: center; color: var(--color-muted); padding: var(--space-xl);">
                        <div style="font-size: 48px; margin-bottom: var(--space-md);">📭</div>
                        <h3>Atanmış görev bulunamadı.</h3>
                        <p>Şu anda sizi bekleyen aktif bir gözetmenlik görevi yok.</p>
                    </div>`;
                return;
            }

            // Group by date
            const byDate = {};
            duties.forEach(d => {
                const key = d.examDate;
                if (!byDate[key]) byDate[key] = [];
                byDate[key].push(d);
            });

            let html = '';
            Object.keys(byDate).sort().forEach(date => {
                html += `
                <div style="margin-bottom: var(--space-lg);">
                    <div style="font-weight: bold; font-size: var(--font-size-md); color: var(--color-accent); margin-bottom: var(--space-sm);
                                border-bottom: 2px solid var(--color-primary); padding-bottom: 4px;">
                        📅 ${date}
                    </div>`;
                byDate[date].forEach(duty => {
                    html += `
                    <div class="result-room-card" style="margin-bottom: var(--space-sm);">
                        <div class="result-room-card__header">
                            <div style="font-weight: bold; font-size: var(--font-size-lg);">${duty.examName}</div>
                            <span class="badge badge--info">${duty.examTime}</span>
                        </div>
                        <div class="result-room-card__section">
                            <div style="font-size: var(--font-size-sm); color: var(--color-muted); font-weight: bold;">Derslik</div>
                            <div style="font-size: var(--font-size-md);">
                                🏛️ ${duty.campus} / ${duty.building} — <strong>${duty.classroom}</strong>
                            </div>
                        </div>
                        <div style="display:flex; gap: var(--space-sm); margin-top: var(--space-xs);">
                            <button class="btn-secondary iq-pdf-sign" data-id="${duty.invigilationId}"
                                style="font-size: 11px; padding: 4px 10px;">
                                📄 İmza Listesi PDF
                            </button>
                        </div>
                    </div>`;
                });
                html += `</div>`;
            });

            this._result.innerHTML = html;

            // Individual sign-sheet buttons — we need exam room data here
            // For now, they open a single-invigilator sign sheet using the duty info
            this._result.querySelectorAll('.iq-pdf-sign').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.target.getAttribute('data-id');
                    const duty = duties.find(d => String(d.invigilationId) === id);
                    if (!duty) return;
                    import('../utils/PdfGenerator.js').then(m => {
                        const mockRoom = {
                            classroom: `${duty.campus}/${duty.building}-${duty.classroom}`,
                            capacity: '—',
                            studentsAssigned: '—',
                            invigilatorRule: '',
                            invigilatorNames: [duty.instructorName || 'Gözetmen'],
                            studentNumbers: []
                        };
                        const mockExam = {
                            examName: duty.examName,
                            examDate: duty.examDate,
                            examTime: duty.examTime
                        };
                        m.PdfGenerator.generateInvigilatorSignSheet(mockRoom, mockExam);
                    });
                };
            });

        } catch (err) {
            console.error(err);
            this._result.innerHTML = `
                <div class="card" style="border-left: 4px solid var(--color-danger); color: var(--color-danger);">
                    Görev listesi yüklenemedi. Lütfen oturumunuzu kontrol edin.
                </div>`;
        }

        // Main PDF button — full duty list for the day
        if (this._pdfBtn) {
            this._pdfBtn.onclick = () => {
                import('../utils/PdfGenerator.js').then(m => {
                    const today = new Date().toISOString().slice(0, 10);
                    const dutyRows = this._duties.map(d => ({
                        instructorName: d.instructorName || 'Gözetmen',
                        examName: d.examName,
                        examTime: d.examTime,
                        classroom: `${d.campus}/${d.building}-${d.classroom}`,
                        dutyCount: ''
                    }));
                    m.PdfGenerator.generateInvigilatorDutyList(today, dutyRows);
                });
            };
        }
    }

    unmount() {
        this._result = null;
        this._pdfBtn = null;
        this._duties = [];
    }
}
