import { CrudView } from '../components/CrudView.js';

export default class StudentView extends CrudView {
    constructor() {
        super({
            title: 'Students',
            endpoint: 'admin/students',
            idKey: 'studentId',
            columns: [
                { key: 'studentNo', label: 'Student No', render: (v, row) => v ?? row.stringNo ?? '-' },
                { key: 'tcNo', label: 'TC No' },
                { key: 'fullName', label: 'Full Name' },
                { key: 'facultyName', label: 'Faculty' },
                { key: 'departmentName', label: 'Department' }
            ],
            formFields: [
                { key: 'studentNo', label: 'Student Number', type: 'text', required: true },
                { key: 'tcNo', label: 'TC Identity Number', type: 'text', required: true },
                { key: 'fullName', label: 'Full Name', type: 'text', required: true },
                { key: 'facultyId',    label: 'Faculty',    type: 'select', required: true, optionsEndpoint: 'admin/faculties',    optionValue: 'facultyId',    optionLabel: 'facultyName' },
                { key: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'admin/departments', optionValue: 'departmentId', optionLabel: 'departmentName' }
            ]
        });
    }
}
