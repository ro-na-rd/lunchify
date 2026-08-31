import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
  Card, Button, Badge, Input, Select, Modal, Avatar, Skeleton, EmptyState, PageHeader,
} from '../../components/ui';

const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const deptColors = ['brand', 'success', 'warning', 'danger', 'info', 'neutral'];

function getDeptBadge(dept) {
  if (!dept) return <Badge variant="neutral">No Dept</Badge>;
  const idx = dept.charCodeAt(0) % deptColors.length;
  return <Badge variant={deptColors[idx]}>{dept}</Badge>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="text" width={140} height={18} className="mt-2" />
        </div>
        <Skeleton variant="rectangular" width={130} height={40} className="rounded-xl" />
      </div>
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Skeleton variant="rectangular" width="100%" height={40} className="rounded-xl" />
          <Skeleton variant="rectangular" width={180} height={40} className="rounded-xl" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="text" width="15%" />
              <div className="flex-1" />
              <Skeleton variant="rectangular" width={80} height={32} className="rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmployeeCard({ emp, onEdit, onDelete }) {
  return (
    <Card className="animate-fade-in-up">
      <div className="flex items-start gap-3">
        <Avatar name={emp.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900 truncate">{emp.name}</p>
          <p className="text-xs text-surface-500 truncate">{emp.email}</p>
          {emp.employee_number && (
            <p className="text-xs text-surface-400 mt-1">#{emp.employee_number}</p>
          )}
        </div>
        {getDeptBadge(emp.department)}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="ghost" size="sm" icon={<EditIcon />} onClick={() => onEdit(emp)}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => onDelete(emp.id)} className="text-danger-600 hover:text-danger-700 hover:bg-danger-50">
          Delete
        </Button>
      </div>
    </Card>
  );
}

export default function AdminEmployees() {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', employee_number: '', department: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchEmployees = useCallback((page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10 });
    if (search) params.set('search', search);
    if (filterDept) params.set('department', filterDept);
    apiFetch(`/api/admin/employees?${params}`)
      .then(data => {
        setEmployees(data.employees);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, filterDept, apiFetch]);

  useEffect(() => {
    apiFetch('/api/admin/departments').then(setDepartments).catch(() => {});
    fetchEmployees();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => fetchEmployees(), 300);
    return () => clearTimeout(debounce);
  }, [search, filterDept]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingEmployee) {
        await apiFetch(`/api/admin/employees/${editingEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showToast({ type: 'success', title: 'Employee updated', message: `${formData.name} has been updated.` });
      } else {
        await apiFetch('/api/admin/employees', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showToast({ type: 'success', title: 'Employee added', message: `${formData.name} has been added.` });
      }
      setShowForm(false);
      setEditingEmployee(null);
      setFormData({ name: '', email: '', employee_number: '', department: '' });
      fetchEmployees(pagination.page);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({ name: emp.name, email: emp.email, employee_number: emp.employee_number || '', department: emp.department || '' });
    setShowForm(true);
    setFormError('');
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      showToast({ type: 'success', title: 'Employee deleted', message: 'The employee has been removed.' });
      setShowDeleteConfirm(null);
      fetchEmployees(pagination.page);
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  const openAddForm = () => {
    setEditingEmployee(null);
    setFormData({ name: '', email: '', employee_number: '', department: '' });
    setFormError('');
    setShowForm(true);
  };

  const pageNumbers = [];
  for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.totalPages, pagination.page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Employees"
        subtitle={`${pagination.total} total employees`}
        action={
          <Button variant="primary" icon={<PlusIcon />} onClick={openAddForm}>
            Add Employee
          </Button>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingEmployee(null); }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              {formError}
            </div>
          )}
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@company.com"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Employee Number"
            placeholder="e.g. EMP001"
            value={formData.employee_number}
            onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700">Department</label>
            <input
              type="text"
              placeholder="e.g. Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm bg-white transition-colors placeholder:text-surface-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              list="departments-list"
            />
            <datalist id="departments-list">
              {departments.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving}>
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingEmployee(null); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Employee"
        size="sm"
      >
        <p className="text-sm text-surface-600 mb-6">
          Are you sure you want to delete this employee? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Table / List */}
      <Card padding="none">
        {/* Search & Filters */}
        <div className="px-6 py-4 border-b border-surface-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name, email, or number..."
              icon={<SearchIcon />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="w-full sm:w-48">
              <Select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d, label: d }))]}
              />
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-surface-100">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1 space-y-2"><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></div>
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No employees found"
              description="Try adjusting your search or filters"
            />
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={emp.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{emp.name}</p>
                    <p className="text-xs text-surface-500 truncate">{emp.email}</p>
                    {emp.employee_number && (
                      <p className="text-xs text-surface-400 mt-0.5">#{emp.employee_number}</p>
                    )}
                  </div>
                  {getDeptBadge(emp.department)}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="ghost" size="sm" icon={<EditIcon />} onClick={() => handleEdit(emp)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => setShowDeleteConfirm(emp.id)} className="text-danger-600 hover:text-danger-700 hover:bg-danger-50">
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Employee #</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" width="25%" />
                        <Skeleton variant="text" width="15%" />
                        <Skeleton variant="text" width="15%" />
                        <div className="flex-1" />
                        <Skeleton variant="rectangular" width={80} height={32} className="rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<SearchIcon />}
                      title="No employees found"
                      description="Try adjusting your search or add a new employee"
                      action={{ label: 'Add Employee', onClick: openAddForm }}
                    />
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} size="sm" />
                        <span className="text-sm font-medium text-surface-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">
                      {emp.employee_number || <span className="text-surface-300">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getDeptBadge(emp.department)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">{emp.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<EditIcon />} onClick={() => handleEdit(emp)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => setShowDeleteConfirm(emp.id)} className="text-danger-600 hover:text-danger-700 hover:bg-danger-50">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-surface-500">
              Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchEmployees(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              {pageNumbers.map((num) => (
                <Button
                  key={num}
                  variant={num === pagination.page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => fetchEmployees(num)}
                  className="min-w-[36px]"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchEmployees(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
