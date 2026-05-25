import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentUserAPI, updateStudentProfileAPI } from '../../api/user.api';
import { getMyEnrollmentsAPI } from '../../api/enrollment.api';
import ProfileCompletionBanner from '../../components/profile/ProfileCompletionBanner';
import Button from '../../components/common/Button';
import LoadingButton from '../../components/common/LoadingButton';
import FormInput from '../../components/common/FormInput';
import ErrorAlert from '../../components/common/ErrorAlert';

const leadSourceOptions = ['Sign Board', 'Social Media', 'Friends', 'Teacher', 'Other'];

const splitName = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const formatDateForInput = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
};

const formatDateForDisplay = (value) => {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const formatStatusLabel = (status) => {
  if (!status) {
    return 'Not enrolled';
  }

  return status
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
};

const InfoItem = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-foreground">{value || 'Not provided'}</div>
  </div>
);

const SuccessAlert = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
};

const SnapshotCard = ({ isLoading, snapshot }) => (
  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
    <div className="text-base font-semibold text-foreground mb-4">Academic Snapshot</div>
    {isLoading ? (
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
      </div>
    ) : (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Enrollment status</span>
          <span className="font-medium text-foreground">{snapshot.enrollmentStatus}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pending payments</span>
          <span className="font-medium text-foreground">{snapshot.pendingPayments}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Board registration</span>
          <span className="font-medium text-foreground">{snapshot.boardRegistration}</span>
        </div>
        {snapshot.pendingPayments > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            You have {snapshot.pendingPayments} pending payment{snapshot.pendingPayments > 1 ? 's' : ''}.
          </div>
        ) : null}
      </div>
    )}
  </div>
);

function StudentProfile() {
  const {
    user: authUser,
    profile: authProfile,
    completion: authCompletion,
    updateProfileState,
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    user: authUser,
    profile: authProfile,
    completion: authCompletion,
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshot, setSnapshot] = useState({
    enrollmentStatus: 'Not enrolled',
    pendingPayments: 0,
    boardRegistration: 'Not available',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const formDefaults = useMemo(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      fatherName: '',
      fatherCellNumber: '',
      cnic: '',
      address: '',
      dateOfBirth: '',
      education: '',
      leadSource: '',
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: formDefaults });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setProfileLoading(true);
      setError('');

      try {
        const response = await getCurrentUserAPI();
        const payload = response?.data?.data || {};
        const userData = payload.user || authUser || {};
        const profile = payload.profile || authProfile || {};
        const completion = payload.completion || authCompletion || {};

        if (!isMounted) {
          return;
        }

        setProfileData({ user: userData, profile, completion });
        setAvatarPreview(profile?.profilePictureUrl || '');

        const nameParts = splitName(userData?.name || '');
        reset({
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email: userData?.email || '',
          phoneNumber: profile?.cellNumber || '',
          fatherName: profile?.fatherName || '',
          fatherCellNumber: profile?.fatherCellNumber || '',
          cnic: profile?.cnic || '',
          address: profile?.address || '',
          dateOfBirth: formatDateForInput(profile?.dateOfBirth),
          education: profile?.education || '',
          leadSource: profile?.leadSource || '',
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message = err?.response?.data?.message || 'Failed to load profile.';
        setError(message);
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authUser, authProfile, authCompletion, reset]);

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      setSnapshotLoading(true);

      try {
        const response = await getMyEnrollmentsAPI();
        const raw = response?.data?.data?.enrollments || response?.data?.data || [];
        const enrollments = Array.isArray(raw) ? raw : [];

        if (!isMounted) {
          return;
        }

        if (!enrollments.length) {
          setSnapshot({
            enrollmentStatus: 'Not enrolled',
            pendingPayments: 0,
            boardRegistration: 'Not available',
          });
          return;
        }

        const pendingPayments = enrollments.filter(
          (enrollment) => enrollment.status === 'pending_payment'
        ).length;
        const currentEnrollment =
          enrollments.find((enrollment) => enrollment.status === 'active') ||
          enrollments.find((enrollment) => enrollment.status === 'pending_payment') ||
          enrollments[0];
        const boardRegistration =
          currentEnrollment?.board_registration ||
          currentEnrollment?.course?.board_registration ||
          'Not available';

        setSnapshot({
          enrollmentStatus: formatStatusLabel(currentEnrollment?.status),
          pendingPayments,
          boardRegistration,
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setSnapshot({
          enrollmentStatus: 'Unavailable',
          pendingPayments: 0,
          boardRegistration: 'Not available',
        });
      } finally {
        if (isMounted) {
          setSnapshotLoading(false);
        }
      }
    };

    loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      return undefined;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [avatarFile]);

  const handleEditToggle = () => {
    setError('');
    setSuccessMessage('');

    if (isEditing) {
      const userData = profileData.user || {};
      const profile = profileData.profile || {};
      const nameParts = splitName(userData?.name || '');

      reset({
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        email: userData?.email || '',
        phoneNumber: profile?.cellNumber || '',
        fatherName: profile?.fatherName || '',
        fatherCellNumber: profile?.fatherCellNumber || '',
        cnic: profile?.cnic || '',
        address: profile?.address || '',
        dateOfBirth: formatDateForInput(profile?.dateOfBirth),
        education: profile?.education || '',
        leadSource: profile?.leadSource || '',
      });
      setAvatarFile(null);
      setAvatarPreview(profile?.profilePictureUrl || '');
    }

    setIsEditing((prev) => !prev);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const onSubmit = async (values) => {
    setError('');
    setSuccessMessage('');

    const profile = profileData.profile || {};
    const payload = new FormData();

    payload.append('profilePictureUrl', profile?.profilePictureUrl || '');
    payload.append('cellNumber', values.phoneNumber.trim());
    payload.append('dateOfBirth', values.dateOfBirth);
    payload.append('education', values.education.trim());
    payload.append('cnic', values.cnic.trim());
    payload.append('fatherName', values.fatherName.trim());
    payload.append('fatherCellNumber', values.fatherCellNumber.trim());
    payload.append('address', values.address.trim());
    payload.append('leadSource', values.leadSource);

    if (profile?.whatsappNumber) {
      payload.append('whatsappNumber', profile.whatsappNumber);
    }
    if (profile?.religion) {
      payload.append('religion', profile.religion);
    }
    if (profile?.fatherWhatsappNumber) {
      payload.append('fatherWhatsappNumber', profile.fatherWhatsappNumber);
    }
    if (profile?.fatherCnic) {
      payload.append('fatherCnic', profile.fatherCnic);
    }
    if (profile?.fatherOccupation) {
      payload.append('fatherOccupation', profile.fatherOccupation);
    }
    if (avatarFile) {
      payload.append('profilePicture', avatarFile);
    }

    try {
      const response = await updateStudentProfileAPI(payload);
      const updatedProfile = response?.data?.data?.profile || profile;
      const updatedCompletion = response?.data?.data?.completion || profileData.completion;
      const updatedName = [values.firstName, values.lastName].filter(Boolean).join(' ');

      setProfileData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          name: updatedName || prev.user?.name,
        },
        profile: updatedProfile,
        completion: updatedCompletion,
      }));
      updateProfileState?.(updatedProfile, updatedCompletion);
      setAvatarFile(null);
      setAvatarPreview(updatedProfile?.profilePictureUrl || '');
      setSuccessMessage(response?.data?.message || 'Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update profile.';
      setError(message);
    }
  };

  const completion = profileData.completion || {};
  const isComplete = completion?.isComplete ?? true;
  const missingFields = completion?.missingFields || [];
  const userData = profileData.user || {};
  const profile = profileData.profile || {};
  const nameParts = splitName(userData?.name || '');
  const avatarSrc = avatarPreview || profile?.profilePictureUrl || '';

  return (
    <div className="flex flex-col gap-6">
      <ProfileCompletionBanner isComplete={isComplete} missingFields={missingFields} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-foreground">Student Profile</div>
          <div className="text-sm text-muted-foreground">
            Review your details and keep your profile up to date.
          </div>
        </div>
        <Button variant={isEditing ? 'outline' : 'primary'} onClick={handleEditToggle}>
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {profileLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-muted rounded-xl h-72 animate-pulse" />
          <div className="bg-muted rounded-xl h-72 animate-pulse" />
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="text-base font-semibold text-foreground mb-4">Personal Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                id="firstName"
                label="First Name"
                autoComplete="given-name"
                registerProps={register('firstName', {
                  required: 'First name is required',
                })}
                error={errors.firstName?.message}
              />
              <FormInput
                id="lastName"
                label="Last Name"
                autoComplete="family-name"
                registerProps={register('lastName', {
                  required: 'Last name is required',
                })}
                error={errors.lastName?.message}
              />
              <FormInput
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                registerProps={{
                  ...register('email'),
                  readOnly: true,
                }}
                error={errors.email?.message}
              />
              <FormInput
                id="phoneNumber"
                label="Phone Number"
                autoComplete="tel"
                registerProps={register('phoneNumber', {
                  required: 'Phone number is required',
                })}
                error={errors.phoneNumber?.message}
              />
              <FormInput
                id="fatherName"
                label="Father's Name"
                registerProps={register('fatherName', {
                  required: "Father's name is required",
                })}
                error={errors.fatherName?.message}
              />
              <FormInput
                id="cnic"
                label="CNIC/B-Form Number"
                registerProps={register('cnic', {
                  required: 'CNIC/B-Form number is required',
                })}
                error={errors.cnic?.message}
              />
              <FormInput
                id="address"
                label="Address"
                registerProps={register('address', {
                  required: 'Address is required',
                })}
                error={errors.address?.message}
              />
              <FormInput
                id="dateOfBirth"
                label="Date of Birth"
                type="date"
                registerProps={register('dateOfBirth', {
                  required: 'Date of birth is required',
                })}
                error={errors.dateOfBirth?.message}
              />
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <div className="text-base font-semibold text-foreground mb-4">Additional Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  id="education"
                  label="Education"
                  registerProps={register('education', {
                    required: 'Education is required',
                  })}
                  error={errors.education?.message}
                />
                <FormInput
                  id="fatherCellNumber"
                  label="Father Phone Number"
                  registerProps={register('fatherCellNumber', {
                    required: "Father's phone number is required",
                  })}
                  error={errors.fatherCellNumber?.message}
                />
                <div>
                  <label className="text-sm font-medium" htmlFor="leadSource">
                    Lead Source
                  </label>
                  <select
                    id="leadSource"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
                    {...register('leadSource', {
                      required: 'Lead source is required',
                    })}
                  >
                    <option value="">Select an option</option>
                    {leadSourceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.leadSource?.message ? (
                    <p className="mt-2 text-xs text-destructive">
                      {errors.leadSource?.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <ErrorAlert message={error} />
              <SuccessAlert message={successMessage} />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" type="button" onClick={handleEditToggle}>
                Cancel
              </Button>
              <div className="flex-1">
                <LoadingButton
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  idleText="Save Changes"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="text-base font-semibold text-foreground mb-4">Profile Photo</div>
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Student avatar"
                    className="h-20 w-20 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground border border-border">
                    No photo
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Upload a clear headshot. JPG or PNG up to 5MB.
                </div>
              </div>
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="text-sm text-muted-foreground"
                />
              </div>
            </div>

            <SnapshotCard isLoading={snapshotLoading} snapshot={snapshot} />
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Student avatar"
                  className="h-24 w-24 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground border border-border">
                  No photo
                </div>
              )}
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {userData?.name || 'Student'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {userData?.email || 'No email'}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <ErrorAlert message={error} />
              <SuccessAlert message={successMessage} />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="First Name" value={nameParts.firstName} />
              <InfoItem label="Last Name" value={nameParts.lastName} />
              <InfoItem label="Email" value={userData?.email} />
              <InfoItem label="Phone Number" value={profile?.cellNumber} />
              <InfoItem label="Father's Name" value={profile?.fatherName} />
              <InfoItem label="Father Phone Number" value={profile?.fatherCellNumber} />
              <InfoItem label="CNIC/B-Form Number" value={profile?.cnic} />
              <InfoItem
                label="Date of Birth"
                value={formatDateForDisplay(profile?.dateOfBirth)}
              />
              <InfoItem label="Address" value={profile?.address} />
              <InfoItem label="Education" value={profile?.education} />
              <InfoItem label="Lead Source" value={profile?.leadSource} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <SnapshotCard isLoading={snapshotLoading} snapshot={snapshot} />
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentProfile;
