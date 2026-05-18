import { CrudView } from '../components/CrudView.js';

export default class DepartmentView extends CrudView {
    constructor() {
        super({
            title: 'Departments',
            endpoint: 'admin/departments',
            idKey: 'departmentId',
            columns: [
                { key: 'departmentId', label: 'ID' },
                { key: 'departmentName', label: 'Department Name' },
                { key: 'facultyName', label: 'Faculty' }
            ],
            formFields: [
                { key: 'departmentName', label: 'Department Name', type: 'text', required: true },
                { key: 'facultyId', label: 'Faculty', type: 'select', required: true, optionsEndpoint: 'admin/faculties', optionValue: 'facultyId', optionLabel: 'facultyName' }
            ]
        });
    }
}
