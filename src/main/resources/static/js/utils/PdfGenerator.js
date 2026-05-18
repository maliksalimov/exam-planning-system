import { Toast } from '../api.js';

export const PdfGenerator = {
    async _generateFromHtml(htmlContent, filename) {
        if (!window.html2pdf) {
            Toast.error('PDF library not loaded.');
            return;
        }

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.width = '210mm'; // A4 width
        container.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; color: #111; padding: 20px; font-size: 11px;">
                ${htmlContent}
            </div>
        `;
        document.body.appendChild(container);

        try {
            await window.html2pdf().set({
                margin:       10,
                filename:     filename.endsWith('.pdf') ? filename : filename + '.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(container).save();
        } finally {
            document.body.removeChild(container);
        }
    },

    _getHeader(title, subtitle = '') {
        return `
            <div style="margin-bottom: 20px; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                <h1 style="margin: 0; color: #1e3a8a; font-size: 16px; text-transform: uppercase;">ÜNİVERSİTE SINAV YÖNETİM SİSTEMİ</h1>
                <div style="color: #4b5563; font-size: 10px; margin-bottom: 15px;">Sınav Planlama ve Gözetmen Atama Modülü</div>
                <h2 style="margin: 0; font-size: 18px; color: #111;">${title}</h2>
                ${subtitle ? `<div style="color: #6b7280; font-size: 12px; margin-top: 5px;">${subtitle}</div>` : ''}
                <div style="font-size: 9px; color: #9ca3af; margin-top: 10px; text-align: right;">
                    Oluşturulma: ${new Date().toLocaleString('tr-TR')}
                </div>
            </div>
        `;
    },

    async generateExamRoomStudentList(room, examData) {
        const header = this._getHeader(`${room.classroom} — Öğrenci Listesi`, `${examData.examName} | ${examData.examDate} ${examData.examTime}`);
        
        let html = `
            ${header}
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; font-size: 12px;">
                <div>Gözetmen(ler): <span style="font-weight:normal;">${room.invigilatorNames.join(' | ')}</span></div>
                <div>Kural: <span style="font-weight:normal;">${room.invigilatorRule || ''}</span></div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 8px; text-align: left;">Sıra</th>
                        <th style="padding: 8px; text-align: left;">Öğrenci No</th>
                        <th style="padding: 8px; text-align: left;">Sınıf / Salon</th>
                        <th style="padding: 8px; text-align: left;">Koltuk No</th>
                    </tr>
                </thead>
                <tbody>
                    ${room.studentNumbers.map((no, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 8px;">${idx + 1}</td>
                            <td style="padding: 8px;">${no}</td>
                            <td style="padding: 8px;">${room.classroom}</td>
                            <td style="padding: 8px;">${idx + 1}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="font-weight: bold;">Toplam Öğrenci: ${room.studentNumbers.length} / ${room.capacity}</div>
        `;

        await this._generateFromHtml(html, `${room.classroom.replace(/\\s+/g, '_')}_Ogrenci_Listesi`);
    },

    async generateInvigilatorSignSheet(room, examData) {
        const header = this._getHeader(`Gözetmen İmza Listesi — ${room.classroom}`, `${examData.examName} | ${examData.examDate} ${examData.examTime}`);
        
        let html = `
            ${header}
            <div style="margin-bottom: 15px; font-weight: bold; font-size: 12px;">
                Sınıf Kapasitesi: <span style="font-weight:normal;">${room.capacity}</span> &nbsp;&nbsp;|&nbsp;&nbsp; 
                Öğrenci Sayısı: <span style="font-weight:normal;">${room.studentsAssigned || room.studentNumbers?.length || '-'}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 10px; text-align: left;">Sıra</th>
                        <th style="padding: 10px; text-align: left;">Gözetmen Adı Soyadı</th>
                        <th style="padding: 10px; text-align: center;">Görev Başlangıç İmzası</th>
                        <th style="padding: 10px; text-align: center;">Görev Bitiş İmzası</th>
                    </tr>
                </thead>
                <tbody>
                    ${room.invigilatorNames.map((name, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px;">${idx + 1}</td>
                            <td style="padding: 10px;">${name.replace(/\\s*\\(görev:\\s*\\d+\\)/, '')}</td>
                            <td style="padding: 10px; text-align: center;">__________________</td>
                            <td style="padding: 10px; text-align: center;">__________________</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="padding: 15px; border: 1px dashed #d1d5db; background: #f9fafb; font-size: 10px; color: #4b5563;">
                <b>Beyan:</b> Gözetmenler, ilgili dersin sınavını dürüstlük ve kurallar çerçevesinde denetlediklerini beyan ederler.
            </div>
        `;

        await this._generateFromHtml(html, `${room.classroom.replace(/\\s+/g, '_')}_Imza_Listesi`);
    },

    async generateStudentExamCard(student) {
        const header = this._getHeader('Öğrenci Sınav Yeri Sorgulama Belgesi');
        
        let html = `
            ${header}
            <div style="margin-bottom: 20px; font-size: 12px; line-height: 1.6;">
                <strong>Ad Soyad:</strong> ${student.fullName}<br>
                <strong>Öğrenci No:</strong> ${student.stringNo}<br>
                <strong>Bölüm:</strong> ${student.departmentName || '-'}<br>
                <strong>Fakülte:</strong> ${student.facultyName || '-'}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 8px; text-align: left;">Ders / Sınav Adı</th>
                        <th style="padding: 8px; text-align: left;">Tarih</th>
                        <th style="padding: 8px; text-align: left;">Saat</th>
                        <th style="padding: 8px; text-align: left;">Kampüs / Bina</th>
                        <th style="padding: 8px; text-align: left;">Derslik</th>
                        <th style="padding: 8px; text-align: left;">Sıra</th>
                    </tr>
                </thead>
                <tbody>
                    ${(student.exams || []).map((ex, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 8px;">${ex.courseName}</td>
                            <td style="padding: 8px;">${ex.examDate}</td>
                            <td style="padding: 8px;">${ex.examTime}</td>
                            <td style="padding: 8px;">${ex.campus} / ${ex.building}</td>
                            <td style="padding: 8px; font-weight: bold;">${ex.classroom}</td>
                            <td style="padding: 8px;">${ex.seatNumber || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 15px; font-size: 9px; color: #6b7280;">Bu belge bilgilendirme amaçlıdır.</div>
        `;

        await this._generateFromHtml(html, `${student.studentNo ?? student.stringNo}_Sinav_Yeri`);
    },

    async generateGeneralExamPlan(examData) {
        const header = this._getHeader('Genel Sınav Planı', `${examData.examName} | ${examData.examDate} ${examData.examTime}`);
        
        let html = `
            ${header}
            <div style="display: flex; gap: 20px; font-weight: bold; margin-bottom: 20px; font-size: 12px; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                <div>Toplam Öğrenci: <span style="color:#2563eb">${examData.totalStudents}</span></div>
                <div>Kullanılan Salon: <span style="color:#2563eb">${examData.classroomsUsed}</span></div>
                <div>Toplam Gözetmen: <span style="color:#2563eb">${examData.invigilatorsAssigned}</span></div>
            </div>
            
            ${(examData.classrooms || []).map((room, idx) => `
                <div style="border: 1px solid #d1d5db; margin-bottom: 20px; border-radius: 6px; overflow: hidden; page-break-inside: avoid;">
                    <div style="background: #e0e7ff; padding: 10px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #d1d5db;">
                        Salon ${idx + 1}: ${room.classroom}
                    </div>
                    <div style="padding: 10px;">
                        <div style="margin-bottom: 5px;"><strong>Kapasite:</strong> ${room.capacity} &nbsp;|&nbsp; <strong>Öğrenci:</strong> ${room.studentsAssigned} &nbsp;|&nbsp; <em>${room.invigilatorRule || ''}</em></div>
                        <div style="margin-bottom: 10px;"><strong>Gözetmenler:</strong> ${room.invigilatorNames.join(', ')}</div>
                        <div>
                            <strong>Öğrenci Numaraları:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px;">
                                ${room.studentNumbers.map(no => `<span style="background:#f3f4f6; padding: 2px 6px; border:1px solid #e5e7eb; border-radius:3px; font-size:10px;">${no}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;

        await this._generateFromHtml(html, `${examData.examName.replace(/\\s+/g, '_')}_Genel_Plan`);
    },

    async generateClassroomExamList(date, assignments) {
        const header = this._getHeader('Sınıf Bazlı Sınav Listesi', `Tarih: ${date}`);
        
        let html = `
            ${header}
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 10px; text-align: left;">Derslik</th>
                        <th style="padding: 10px; text-align: left;">Saat</th>
                        <th style="padding: 10px; text-align: left;">Sınav / Ders Adı</th>
                        <th style="padding: 10px; text-align: center;">Öğrenci Sayısı</th>
                        <th style="padding: 10px; text-align: left;">Gözetmen(ler)</th>
                    </tr>
                </thead>
                <tbody>
                    ${(assignments || []).map((a, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 10px; font-weight: bold;">${a.classroom || '-'}</td>
                            <td style="padding: 10px;">${a.examTime || '-'}</td>
                            <td style="padding: 10px;">${a.examName || '-'}</td>
                            <td style="padding: 10px; text-align: center;">${a.studentCount || '-'}</td>
                            <td style="padding: 10px;">${(a.invigilators || []).join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        await this._generateFromHtml(html, `${date}_Sinif_Sinav_Listesi`);
    },

    async generateInvigilatorDutyList(date, duties) {
        const header = this._getHeader('Gözetmen Görev Dağılım Listesi', `Tarih/Dönem: ${date}`);
        
        let html = `
            ${header}
            <div style="font-weight: bold; margin-bottom: 10px;">Toplam Görev: ${(duties || []).length}</div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eff6ff; border-bottom: 2px solid #93c5fd;">
                        <th style="padding: 10px; text-align: left;">Sıra</th>
                        <th style="padding: 10px; text-align: left;">Öğretim Elemanı</th>
                        <th style="padding: 10px; text-align: left;">Sınav Adı</th>
                        <th style="padding: 10px; text-align: left;">Saat</th>
                        <th style="padding: 10px; text-align: left;">Derslik / Salon</th>
                        <th style="padding: 10px; text-align: center;">Toplam Görev</th>
                    </tr>
                </thead>
                <tbody>
                    ${(duties || []).map((d, idx) => `
                        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                            <td style="padding: 10px;">${idx + 1}</td>
                            <td style="padding: 10px; font-weight:bold;">${d.instructorName || '-'}</td>
                            <td style="padding: 10px;">${d.examName || '-'}</td>
                            <td style="padding: 10px;">${d.examTime || '-'}</td>
                            <td style="padding: 10px;">${d.classroom || '-'}</td>
                            <td style="padding: 10px; text-align: center;">
                                <span style="background: #dbeafe; padding: 2px 8px; border-radius: 12px; color: #1e3a8a; font-weight:bold;">
                                    ${d.dutyCount ?? '-'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        await this._generateFromHtml(html, `${date}_Gozetmen_Gorevlendirme`);
    }
};
