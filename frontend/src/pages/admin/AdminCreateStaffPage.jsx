import { useState } from 'react';
import { createAdminAPI, createTeacherAPI } from '../../api/user.api.js';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'teacher',
};

const AdminCreateStaffPage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      if (formData.role === 'admin') {
        await createAdminAPI(payload);
        setSuccess('Admin account created successfully.');
      } else {
        await createTeacherAPI(payload);
        setSuccess('Teacher account created successfully.');
      }

      setFormData(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to create user. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-lg font-semibold text-foreground">Create Staff Account</h1>
        <p className="text-sm text-muted-foreground">
          Create new admin or teacher accounts with secure access.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              placeholder="Create a strong password"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateStaffPage;
