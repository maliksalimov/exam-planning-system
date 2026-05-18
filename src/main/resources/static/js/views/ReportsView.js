import { Api, Toast } from '../api.js';

/**
 * ReportsView — provides all PDF exports that are not part 
 * of individual planning results:
 *   • Sınıf bazlı sınav listesi (per date)
 *   • Gözetmen görev dağılım listesi (per date)
 */
export default class ReportsView {
    getHtml() {
        return `
        <div class="page-container">
            <header class="page-header">
                <h1>📊 Raporlar ve PDF Çıktıları</h1>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">

                <!-- SINIF BAZLI SINAV LİSTESİ -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="color: var(--color-primary); margin: 0;">🏫 Sınıf Bazlı Sınav Listesi</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Seçilen tarihteki sınıfları, sınavları ve gözetmenleri gösteren liste.
                    </p>
                    <div class="form-group">
                        <label class="form-label" for="rpt-date-cls">Tarih</label>
                        <input type="date" id="rpt-date-cls" class="form-input" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                    <button class="btn-primary" id="rpt-cls-pdf">📄 PDF Oluştur</button>
                    <div id="rpt-cls-preview" style="font-size: var(--font-size-sm); color: var(--color-muted);"></div>
                </div>

                <!-- GÖZETMEN GÖREV DAĞILIM LİSTESİ -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="color: var(--color-accent); margin: 0;">📋 Gözetmen Görev Dağılımı</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Seçilen tarihteki tüm gözetmen görevlerinin dağılım listesi.
                    </p>
                    <div class="form-group">
                        <label class="form-label" for="rpt-date-inv">Tarih</label>
                        <input type="date" id="rpt-date-inv" class="form-input" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                    <button class="btn-accent" id="rpt-inv-pdf" style="background: var(--color-accent);">📄 PDF Oluştur</button>
                    <div id="rpt-inv-preview" style="font-size: var(--font-size-sm); color: var(--color-muted);"></div>
                </div>

                <!-- TÜM GÖZETMEN İŞ YÜKÜ -->
                <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md); grid-column: 1/-1;">
                    <h3 style="color: var(--color-success); margin: 0;">⚖️ Gözetmen İş Yükü Raporu</h3>
                    <p style="color: var(--color-muted); font-size: var(--font-size-sm); margin: 0;">
                        Tüm öğretim elemanlarının toplam gözetmenlik sayılarını gösteren dağılım listesi.
                    </p>
                    <button class="btn-secondary" id="rpt-load-pdf">📄 İş Yükü Listesi PDF</button>
                    <div id="rpt-load-preview"></div>
                </div>

            </div>
        </div>
        `;
    }

    async mount() {
        const { PdfGenerator } = await import('../utils/PdfGenerator.js');

        // ── Sınıf bazlı sınav listesi ─────────────────────────────
        document.getElementById('rpt-cls-pdf').onclick = async () => {
            const date = document.getElementById('rpt-date-cls').value;
            if (!date) { Toast.error('Önce bir tarih seçin.'); return; }
            const preview = document.getElementById('rpt-cls-preview');
            preview.textContent = 'Veri yükleniyor…';
            try {
                // Fetch all invigilator assignments for that date by querying all assignments
                const allAssignments = await Api.request('admin/invigilator-assignments');
                const dayAssignments = allAssignments.filter(a => a.examDate === date);

                // Group by classroom
                const byRoom = {};
                dayAssignments.forEach(a => {
                    const key = a.classroomName;
                    if (!byRoom[key]) byRoom[key] = { classroom: key, examName: a.examName, examTime: a.examTime, invigilators: [], studentCount: 0 };
                    byRoom[key].invigilators.push(a.instructorName);
                });

                const rows = Object.values(byRoom);
                if (rows.length === 0) {
                    preview.textContent = '⚠ Bu tarihte kayıtlı sınav bulunamadı.';
                    return;
                }
                PdfGenerator.generateClassroomExamList(date, rows);
                preview.textContent = `✅ ${rows.length} sınıf için PDF oluşturuldu.`;
            } catch (err) {
                console.error(err);
                preview.textContent = 'Hata: ' + err.message;
            }
        };

        // ── Gözetmen görev dağılım listesi ────────────────────────
        document.getElementById('rpt-inv-pdf').onclick = async () => {
            const date = document.getElementById('rpt-date-inv').value;
            if (!date) { Toast.error('Önce bir tarih seçin.'); return; }
            const preview = document.getElementById('rpt-inv-preview');
            preview.textContent = 'Veri yükleniyor…';
            try {
                const allAssignments = await Api.request('admin/invigilator-assignments');
                const dayAssignments = allAssignments.filter(a => a.examDate === date);
                if (dayAssignments.length === 0) {
                    preview.textContent = '⚠ Bu tarihte kayıtlı atama bulunamadı.';
                    return;
                }
                const duties = dayAssignments.map(a => ({
                    instructorName: a.instructorName,
                    examName: a.examName,
                    examTime: a.examTime,
                    classroom: a.classroomName,
                    dutyCount: ''
                }));
                PdfGenerator.generateInvigilatorDutyList(date, duties);
                preview.textContent = `✅ ${duties.length} görev için PDF oluşturuldu.`;
            } catch (err) {
                console.error(err);
                preview.textContent = 'Hata: ' + err.message;
            }
        };

        // ── İş yükü raporu ────────────────────────────────────────
        document.getElementById('rpt-load-pdf').onclick = async () => {
            const preview = document.getElementById('rpt-load-preview');
            preview.textContent = 'Veri yükleniyor…';
            try {
                const instructors = await Api.request('admin/instructors');
                const sorted = [...instructors].sort((a, b) => b.dutyCount - a.dutyCount);
                const duties = sorted.map(i => ({
                    instructorName: i.fullName,
                    staffNo: i.staffNo,
                    examName: `${i.departmentName || ''}`,
                    examTime: '',
                    classroom: '',
                    dutyCount: i.dutyCount
                }));
                const today = new Date().toISOString().slice(0, 10);
                PdfGenerator.generateInvigilatorDutyList(today + ' (Tüm Dönem)', duties);
                preview.innerHTML = sorted.map(i =>
                    `<span class="badge badge--info" style="margin:2px">${i.fullName}: ${i.dutyCount}</span>`
                ).join('');
            } catch (err) {
                console.error(err);
                preview.textContent = 'Hata: ' + err.message;
            }
        };
    }

    unmount() {}
}
