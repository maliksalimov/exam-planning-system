import { CrudView } from '../components/CrudView.js';

export default class FacultyView extends CrudView {
    constructor() {
        super({
            title: 'Faculties',
            endpoint: 'admin/faculties',
            idKey: 'facultyId',
            columns: [
                { key: 'facultyId', label: 'ID' },
                { key: 'facultyName', label: 'Faculty Name' }
            ],
            formFields: [
                { key: 'facultyName', label: 'Faculty Name', type: 'text', required: true }
            ]
        });
    }
}
