import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatMissingFields = (fields) => {
  if (!Array.isArray(fields)) {
    return '';
  }

  return fields
    .map((field) =>
      field
        .split('_')
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
        .join(' ')
    )
    .join(', ');
};

function ProfileCompletionBanner({ isComplete, missingFields }) {
  const navigate = useNavigate();

  if (isComplete) {
    return null;
  }

  return (
    <div className="bg-accent/20 border border-accent/40 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-medium text-accent-foreground">
          Complete your profile to enroll in courses
        </div>
        <div className="text-xs text-accent-foreground/80 mt-0.5">
          Missing: {formatMissingFields(missingFields)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/student/profile')}
        className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
      >
        Complete Profile
      </button>
    </div>
  );
}

export default ProfileCompletionBanner;
