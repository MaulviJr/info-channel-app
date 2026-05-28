import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByIdAPI,getStudentProfileByIdAPI} from '../../api/user.api.js';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';

const formatDate = (value) => {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const InfoItem = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-foreground">
      {value || 'Not provided'}
    </div>
  </div>
);

const AdminStudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
// 
  useEffect(() => {
    let isMounted = true;

    const loadStudent = async () => {
      if (!id) {
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await getStudentProfileByIdAPI(id);
        const payload = response?.data?.data ?? response?.data ?? null;

        if (isMounted) {
          setStudent(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load student details. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStudent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const profile = student?.profile || student?.studentProfile || {};
  const completion = student?.completion || student?.profileStatus || {};
  const isComplete = completion?.isComplete;
  const missingFields = completion?.missingFields || [];
  const statusLabel =
    isComplete === true ? 'Complete' : isComplete === false ? 'Incomplete' : 'Unknown';
  const statusClass =
    isComplete === true
      ? 'bg-emerald-500/10 text-emerald-600'
      : 'bg-amber-500/10 text-amber-600';

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Student Details</h1>
          <p className="text-sm text-muted-foreground">
            Review profile and contact information.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/students')}>
          Back to Students
        </Button>
      </div>

      <ErrorAlert message={error} />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="bg-muted rounded-xl border border-border h-48 animate-pulse"
            />
          ))}
        </div>
      ) : student ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Name</div>
              <div className="text-lg font-semibold text-foreground">
                {student.name || 'Unnamed student'}
              </div>
              <div className="text-sm text-muted-foreground">
                {student.email || 'No email'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
              {missingFields.length ? (
                <span className="text-xs text-muted-foreground">
                  {missingFields.length} fields missing
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              <InfoItem label="Role" value={student.role || 'Student'} />
              <InfoItem label="Joined" value={formatDate(student.created_at)} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="text-base font-semibold text-foreground">Contact Details</div>
            <div className="grid grid-cols-1 gap-4">
              <InfoItem label="Phone" value={profile.cellNumber} />
              <InfoItem label="WhatsApp" value={profile.whatsappNumber} />
              <InfoItem label="Address" value={profile.address} />
              <InfoItem label="CNIC" value={profile.cnic} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="text-base font-semibold text-foreground">Profile Details</div>
            <div className="grid grid-cols-1 gap-4">
              <InfoItem label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
              <InfoItem label="Education" value={profile.education} />
              <InfoItem label="Lead Source" value={profile.leadSource} />
              <InfoItem label="Father Name" value={profile.fatherName} />
              <InfoItem label="Father Cell" value={profile.fatherCellNumber} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="text-sm text-muted-foreground">
            Student details are not available.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentDetailPage;
