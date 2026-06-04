import { useQuery } from '@tanstack/react-query';
import { listTeacherStudentsAPI } from '../../api/user.api';
import ErrorAlert from '../../components/common/ErrorAlert';

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const getStudents = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.students) ? payload.students : [];
};

const TeacherStudents = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['teacherStudents'],
    queryFn: () => listTeacherStudentsAPI({ limit: 100, offset: 0 }),
  });

  const students = getStudents(data);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">My Students</h1>
        <p className="text-sm text-muted-foreground">All students enrolled in your courses.</p>
      </div>

      {isError ? (
        <ErrorAlert message={error?.response?.data?.message || 'Failed to load students.'} />
      ) : null}

      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="bg-muted rounded-xl border border-border h-20 animate-pulse" />
          ))}
        </div>
      ) : students.length ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Student</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Courses</th>
                  <th className="text-left font-medium px-4 py-3">Active</th>
                  <th className="text-left font-medium px-4 py-3">Completed</th>
                  <th className="text-left font-medium px-4 py-3">Last Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{student.name || 'Unnamed student'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{student.email || 'N/A'}</td>
                    <td className="px-4 py-3">{student.coursesCount || 0}</td>
                    <td className="px-4 py-3">{student.activeEnrollments || 0}</td>
                    <td className="px-4 py-3">{student.completedEnrollments || 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(student.lastEnrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
          No students found for your courses yet.
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;
