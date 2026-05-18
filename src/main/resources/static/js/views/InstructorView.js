import { CrudView } from '../components/CrudView.js';

export default class InstructorView extends CrudView {
    constructor() {
        super({
            title: 'Instructors',
            endpoint: 'admin/instructors',
            actions: [
                {
                    label: 'Sync Duty Counts',
                    class: 'btn-secondary',
                    onClick: async () => {
                        const { Api, Toast } = await import('../api.js');
                        try {
                            await Api.request('admin/instructors/recalculate-duties', { method: 'POST' });
                            Toast.success('Duty counts recalculated successfully.');
                            window.location.reload();
                        } catch (err) {
                            Toast.error('Failed to recalculate duties.');
                        }
                    }
                }
            ],
            idKey: 'instructorId',
            columns: [
                { key: 'staffNo', label: 'Staff No' },
                { key: 'fullName', label: 'Full Name' },
                { key: 'email', label: 'Email' },
                { key: 'departmentName', label: 'Department' },
                { key: 'dutyCount', label: 'Duties' },
                { key: 'isAvailableForInvigilation', label: 'Available', render: (val) => val ? '<span class="badge badge--success">Yes</span>' : '<span class="badge badge--danger">No</span>' }
            ],
            formFields: [
                { key: 'staffNo', label: 'Staff Number', type: 'text', required: true },
                { key: 'fullName', label: 'Full Name', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'text', required: true },
                { key: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'admin/departments', optionValue: 'departmentId', optionLabel: 'departmentName' },
                { key: 'isAvailableForInvigilation', label: 'Is Available for Invigilation?', type: 'checkbox' },
                { key: 'dutyCount', label: 'Initial Duty Count', type: 'number' }
            ]
        });
    }
}
