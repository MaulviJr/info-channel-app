import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCourseAPI,
  getCourseByIdAPI,
  updateCourseAPI,
} from '../../api/course.api.js';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';

const defaultFormState = {
  title: '',
  description: '',
  category: '',
  admission_fee: '',
  monthly_fee: '',
  board_registration: 'None',
};

const AdminCourseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [formState, setFormState] = useState(defaultFormState);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(
    () => (isEditMode ? 'Edit Course' : 'Create New Course'),
    [isEditMode]
  );

  useEffect(() => {
    let isMounted = true;

    const loadCourse = async () => {
      if (!isEditMode) {
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await getCourseByIdAPI(id);
        const course = response?.data?.data?.course || response?.data?.data || {};

        if (!isMounted) {
          return;
        }

        setFormState((prev) => ({
          ...prev,
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          admission_fee:
            course.admission_fee !== null && course.admission_fee !== undefined
              ? String(course.admission_fee)
              : '',
          monthly_fee:
            course.monthly_fee !== null && course.monthly_fee !== undefined
              ? String(course.monthly_fee)
              : '',
          board_registration: course.board_registration || 'None',
        }));
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load course details. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        category: formState.category.trim(),
        admission_fee: Number(formState.admission_fee) || 0,
        monthly_fee: Number(formState.monthly_fee) || 0,
        board_registration: formState.board_registration,
      };

      if (isEditMode) {
        await updateCourseAPI(id, payload);
      } else {
        await createCourseAPI(payload);
      }

      navigate('/admin/courses');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to save course. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-muted rounded-xl border border-border h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? 'Update course details and publish settings.'
              : 'Set up a new course for students.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          Back to Courses
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />

          <div>
            <label className="text-sm font-medium" htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              value={formState.title}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              placeholder="Course title"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows={4}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              placeholder="Course overview"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="category">Category</label>
            <input
              id="category"
              name="category"
              value={formState.category}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              placeholder="e.g., Science, Commerce"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="admission_fee">
                Admission Fee
              </label>
              <input
                id="admission_fee"
                name="admission_fee"
                type="number"
                min="0"
                value={formState.admission_fee}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="monthly_fee">
                Monthly Fee
              </label>
              <input
                id="monthly_fee"
                name="monthly_fee"
                type="number"
                min="0"
                value={formState.monthly_fee}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="board_registration">
              Board Registration
            </label>
            <select
              id="board_registration"
              name="board_registration"
              value={formState.board_registration}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            >
              <option value="None">None</option>
              <option value="SDC">SDC</option>
              <option value="SBTE">SBTE</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/admin/courses')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCourseFormPage;
