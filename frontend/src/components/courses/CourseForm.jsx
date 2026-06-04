import { useState } from 'react';
import Button from '../common/Button';
import ErrorAlert from '../common/ErrorAlert';
import FormInput from '../common/FormInput';
import { courseToFormValues, defaultCourseFormValues } from './courseFormUtils';

const CourseForm = ({
  initialValues = defaultCourseFormValues,
  isLoading = false,
  isSubmitting = false,
  error = '',
  submitLabel = 'Save Course',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}) => {
  const [formState, setFormState] = useState(() => courseToFormValues(initialValues));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!onSubmit) {
      return;
    }

    await onSubmit({
      title: formState.title.trim(),
      description: formState.description.trim(),
      category: formState.category.trim(),
      admission_fee: Number(formState.admission_fee) || 0,
      monthly_fee: Number(formState.monthly_fee) || 0,
      board_registration: formState.board_registration,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>
        <div className="h-16 bg-muted rounded-lg" />
        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 bg-muted rounded-lg" />
          <div className="h-10 w-28 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <ErrorAlert message={error} />

        <FormInput
          id="title"
          name="title"
          label="Title"
          registerProps={{
            name: 'title',
            value: formState.title,
            onChange: handleChange,
            required: true,
            placeholder: 'Course title',
          }}
        />

        <div>
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
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

        <FormInput
          id="category"
          name="category"
          label="Category"
          registerProps={{
            name: 'category',
            value: formState.category,
            onChange: handleChange,
            placeholder: 'e.g., Science, Commerce',
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="admission_fee"
            name="admission_fee"
            label="Admission Fee"
            type="number"
            registerProps={{
              name: 'admission_fee',
              type: 'number',
              min: '0',
              value: formState.admission_fee,
              onChange: handleChange,
              placeholder: '0',
            }}
          />
          <FormInput
            id="monthly_fee"
            name="monthly_fee"
            label="Monthly Fee"
            type="number"
            registerProps={{
              name: 'monthly_fee',
              type: 'number',
              min: '0',
              value: formState.monthly_fee,
              onChange: handleChange,
              placeholder: '0',
            }}
          />
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
          <Button variant="outline" type="button" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;