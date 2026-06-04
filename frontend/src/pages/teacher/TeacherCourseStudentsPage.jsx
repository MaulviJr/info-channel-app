import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { listCourseStudentsAPI } from '../../api/user.api';
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

const getCourseStudents = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload)) {
    return { course: null, students: payload };
  }

  return {
    course: payload.course || null,
    students: Array.isArray(payload.students) ? payload.students : [],
  };
};

const TeacherCourseStudentsPage = () => {
  const { id } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['teacherCourseStudents', id],
    queryFn: () => listCourseStudentsAPI(id, { limit: 100, offset: 0 }),
    enabled: Boolean(id),
  });

  const { course, students } = getCourseStudents(data);
  const completedCount = students.filter((student) => student.status === 'completed').length;
  const activeCount = students.filter((student) => student.status === 'active').length;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {course?.title || 'Course Students'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Students enrolled in this course and their completion progress.
        </p>
      </div>

      {isError ? (
        <ErrorAlert message={error?.response?.data?.message || 'Failed to load course students.'} />
      ) : null}

      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="bg-muted rounded-xl border border-border h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">Total Students</div>
              <div className="text-2xl font-semibold text-foreground">{students.length}</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">Active</div>
              <div className="text-2xl font-semibold text-foreground">{activeCount}</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="text-2xl font-semibold text-foreground">{completedCount}</div>
            </div>
          </div>

          {students.length ? (
            <div className="grid gap-4">
              {students.map((student) => {
                const progress = student.progress || {};
                const percent = Math.round(progress.percent || 0);

                return (
                  <div key={student.enrollmentId || student.id} className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-medium text-foreground">{student.name || 'Unnamed student'}</h2>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {student.status || 'unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{student.email || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Enrolled: {formatDate(student.enrolledAt)}</div>
                    </div>

                    <div className="w-full md:w-72 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-primary">{percent}%</span>
                      </div>
                      <div className="bg-muted rounded-full h-1.5 w-full">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {progress.completedLectures || 0} / {progress.totalLectures || 0} lectures
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
              No students are enrolled in this course yet.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherCourseStudentsPage;
