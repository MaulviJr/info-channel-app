import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useProfile from '../../hooks/useProfile';
import Button from '../../components/common/Button';
import LoadingButton from '../../components/common/LoadingButton';
import FormInput from '../../components/common/FormInput';
import ErrorAlert from '../../components/common/ErrorAlert';

const splitName = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const TeacherProfilePage = () => {
  const { profile, isLoading, isSaving, error, setError, updateProfile } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  useEffect(() => {
    const nameParts = splitName(profile?.name || '');
    reset({
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      email: profile?.email || '',
    });
  }, [profile, reset]);

  const onSubmit = async (values) => {
    try {
      const name = [values.firstName, values.lastName].filter(Boolean).join(' ').trim();
      await updateProfile({ name, email: values.email });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update teacher profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="bg-muted rounded-xl border border-border h-80 animate-pulse" />
        <div className="bg-muted rounded-xl border border-border h-80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Update your name and email.</p>
        </div>

        <ErrorAlert message={error} />

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="firstName"
              label="First name"
              autoComplete="given-name"
              registerProps={register('firstName', { required: 'First name is required' })}
              error={errors.firstName?.message}
            />
            <FormInput
              id="lastName"
              label="Last name"
              autoComplete="family-name"
              registerProps={register('lastName')}
              error={errors.lastName?.message}
            />
          </div>

          <FormInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            registerProps={register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Enter a valid email address',
              },
            })}
            error={errors.email?.message}
          />

          <div className="flex items-center gap-3 pt-2">
            <LoadingButton
              isLoading={isSaving}
              loadingText="Saving..."
              idleText="Save Changes"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const nameParts = splitName(profile?.name || '');
                reset({
                  firstName: nameParts.firstName,
                  lastName: nameParts.lastName,
                  email: profile?.email || '',
                });
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4 h-fit">
        <div className="text-base font-semibold text-foreground">Account Summary</div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium text-foreground">{profile?.role || 'Teacher'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-medium text-foreground">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Teacher ID</span>
            <span className="font-medium text-foreground break-all">{profile?.id || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
