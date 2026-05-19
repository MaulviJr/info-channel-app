I am building the Student Dashboard page for "Info Channel Institute",
a React + Vite frontend using Tailwind CSS only (no Shadcn/ui).
Icons: Lucide React. Data fetching: TanStack Query (React Query).
Desktop only — no mobile responsiveness needed.



---

## Layout: Fixed Sidebar + Main Content

### StudentLayout.jsx
File: src/components/layout/StudentLayout.jsx

- Outer wrapper: flex h-screen overflow-hidden bg-surface
- Left: <StudentSidebar /> fixed width w-60 h-full flex-shrink-0
- Right: flex flex-col flex-1 overflow-hidden
    Top: <StudentTopbar /> h-14 border-b border-border-default bg-white
    Below: <Outlet /> overflow-y-auto p-6 bg-surface

---

### StudentSidebar.jsx
File: src/components/layout/StudentSidebar.jsx

- w-60 h-full bg-primary-dark flex flex-col
- Top section (p-5):
    Logo text: "Info Channel" text-accent font-semibold text-base
    Subtitle: "Student Portal" text-white/50 text-xs mt-0.5
- Middle section (flex-1 px-3 py-4 flex flex-col gap-1):
    Nav links, each as <NavLink> from react-router-dom:
      LayoutDashboard  "Dashboard"   /dashboard
      BookOpen         "My Courses"  /courses
      User             "My Profile"  /profile
      BarChart2        "Progress"    /progress
    Active link (use NavLink isActive):
      bg-accent/15 text-accent font-medium rounded-lg
    Inactive link:
      text-white/60 hover:text-white hover:bg-white/5 rounded-lg
    Each link: flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
    Icon: w-4 h-4
- Bottom section (p-3 border-t border-white/10):
    Logout button: flex items-center gap-3 px-3 py-2.5 text-sm
    text-white/60 hover:text-white w-full rounded-lg hover:bg-white/5
    LogOut icon w-4 h-4
    onClick: calls logout() from useAuth()

---

### StudentTopbar.jsx
File: src/components/layout/StudentTopbar.jsx

- h-14 px-6 flex items-center justify-between bg-white
  border-b border-border-default
- Left: page title "Dashboard" text-base font-medium text-gray-900
- Right: flex items-center gap-3
    Avatar circle: w-8 h-8 rounded-full bg-primary
    text-white text-xs font-medium flex items-center justify-center
    Shows initials from user.name using:
    const getInitials = (name) =>
      name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'ST'
    Student name: text-sm text-gray-600 (user.name from useAuth)

---

## Section 1 — Profile Completion Banner
File: src/components/profile/ProfileCompletionBanner.jsx

Props: { isComplete: boolean, missingFields: string[] }
If isComplete is true → return null

Design:
- bg-accent-tint border border-accent/40 rounded-xl p-4
  flex items-start gap-3
- Left: AlertCircle icon w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0
- Middle (flex-1):
    Title: "Complete your profile to enroll in courses"
           text-sm font-medium text-yellow-800
    Subtext: "Missing: {formatted missingFields}"
           text-xs text-yellow-700 mt-0.5
           Format each field: replace _ with space, capitalize each word
           e.g. "father_name" → "Father Name"
           join with ", "
- Right:
    "Complete Profile" button
    bg-primary text-white text-xs px-4 py-2 rounded-lg
    hover:bg-primary-light transition-colors flex-shrink-0
    onClick: navigate('/profile')

---

## Section 2 — Stat Cards
File: src/components/dashboard/StatCard.jsx

Props: {
  icon: LucideIcon,
  label: string,
  value: string | number,
  accentBg: string,    (Tailwind class e.g. "bg-primary-tint")
  accentText: string,  (Tailwind class e.g. "text-primary")
}

Design (each card):
- bg-white rounded-xl border border-border-default p-5
- Top row: flex items-center justify-between
    Label: text-sm text-gray-500
    Icon wrapper: p-2 rounded-lg {accentBg}
      Icon: w-4 h-4 {accentText}
- Value: text-3xl font-semibold text-gray-900 mt-3

Three cards rendered in StudentDashboard in a grid-cols-3 gap-4:

Card 1 — Enrolled Courses
  icon: BookOpen
  label: "Enrolled courses"
  value: count of enrollments where status is 'active' or 'pending_details'
  accentBg: "bg-primary-tint"
  accentText: "text-primary"

Card 2 — Overall Progress
  icon: TrendingUp
  label: "Overall progress"
  value: average progress.percent across active enrollments + "%" suffix
         return "0%" if no active enrollments
         Math.round() the average
  accentBg: "bg-accent-tint"
  accentText: "text-yellow-700"

Card 3 — Completed Courses
  icon: CheckCircle
  label: "Completed"
  value: count of enrollments where status is 'completed'
  accentBg: "bg-success-tint"
  accentText: "text-success"

All three values computed in StudentDashboard.jsx from enrollments data,
passed as props. No fetching inside StatCard.

---

## Section 3 — Recent Activity (Placeholder)
File: src/components/dashboard/RecentActivity.jsx

No backend endpoint yet. Static placeholder only. No props.

Design:
- Section heading: "Recent Activity"
  text-base font-medium text-gray-900 mb-3
- Container: bg-white rounded-xl border border-border-default p-5
- Three placeholder rows (flex items-center gap-3 py-2.5
  border-b border-border-default last:border-0):
    Gray circle: w-9 h-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0
    Two bars (flex flex-col gap-1.5):
      w-48 h-3 bg-gray-100 rounded animate-pulse
      w-32 h-2 bg-gray-100 rounded animate-pulse
- Below rows: text-xs text-center text-gray-400 mt-3
  "Detailed activity tracking coming soon"

---

## Section 4 — Enrolled Courses
File: src/components/dashboard/CourseProgressCard.jsx

Section heading: "My Courses" text-base font-medium text-gray-900 mb-3

Grid: grid grid-cols-2 gap-4

API: GET /api/v1/enrollments/my (this api is yet to be implemented, you may use mock data for now, and also mention that in comments)
Response (array):
[{
  id: uuid,
  course_id: uuid,
  status: 'active' | 'completed' | 'pending_details' | 'cancelled',
  enrolled_at: string,
  course: {
    title: string,
    description: string,
    thumbnail_url: string | null,
    instructor: { name: string }
  },
  progress: {
    completedLectures: number,
    totalLectures: number,
    percent: number
  }
}]

CourseProgressCard design:
- bg-white rounded-xl border border-border-default overflow-hidden
- Thumbnail area (relative h-36):
    If thumbnail_url exists:
      <img> w-full h-full object-cover
    Else fallback:
      bg-primary-dark flex items-center justify-center
      Course title initials: text-accent text-2xl font-bold
      (first letters of each word in title, max 2 chars)
    Status badge (absolute top-2 right-2):
      text-xs font-medium px-2 py-0.5 rounded-full
      active          → bg-primary-tint text-primary         "Active"
      completed       → bg-success-tint text-success         "Completed"
      pending_details → bg-accent-tint text-yellow-700       "Pending setup"
      cancelled       → bg-danger-tint text-danger           "Cancelled"
- Body (p-4 flex flex-col gap-2):
    Title: text-sm font-semibold text-gray-900 line-clamp-2
    Instructor: text-xs text-gray-400 "by {course.instructor.name}"
    Progress row (flex items-center justify-between text-xs):
      Left: text-gray-400 "Progress"
      Right: text-primary font-medium "{Math.round(progress.percent)}%"
    Progress bar:
      bg-gray-100 rounded-full h-1.5 w-full
      Inner div: bg-primary h-1.5 rounded-full
      style={{ width: Math.round(progress.percent) + '%' }}
      (inline style is intentional for dynamic width)
    Lecture count: text-xs text-gray-400 
      "{progress.completedLectures} / {progress.totalLectures} lectures"
    CTA (mt-auto pt-2):
      active or completed:
        <button> w-full bg-primary text-white text-sm py-2 rounded-lg
        hover:bg-primary-light transition-colors
        onClick: navigate('/courses/' + enrollment.course_id + '/learn')
        "Continue Learning"
      pending_details:
        <p> text-xs text-center text-gray-400 py-2
        "Awaiting admin setup"
      cancelled: nothing

Empty state (when enrollments array is empty):
- bg-white rounded-xl border border-border-default
  p-12 flex flex-col items-center justify-center text-center
- BookOpen icon: w-10 h-10 text-gray-300 mb-3
- "You are not enrolled in any courses yet."
  text-sm text-gray-500 mb-4
- "Browse Courses" button:
  bg-primary text-white px-5 py-2 rounded-lg text-sm
  hover:bg-primary-light transition-colors
  onClick: navigate('/courses')

Props: { enrollment: object }

---

## StudentDashboard.jsx
File: src/pages/student/StudentDashboard.jsx

Imports:
- useQuery from '@tanstack/react-query'
- getProfileStatus from '@/api/user.api'
- getMyEnrollments from '@/api/enrollment.api' // yet to be implemented
- All section components above
- useAuth from '@/context/AuthContext'
- useNavigate from 'react-router-dom'

Queries:
const profileQuery = useQuery({
  queryKey: ['profileStatus'],
  queryFn: getProfileStatus
})

const enrollmentsQuery = useQuery({
  queryKey: ['myEnrollments'],
  queryFn: getMyEnrollments
})

Derived values (compute from enrollmentsQuery.data):
const enrollments = enrollmentsQuery.data || []

const enrolledCount = enrollments.filter(
  e => e.status === 'active' || e.status === 'pending_details'
).length

const completedCount = enrollments.filter(
  e => e.status === 'completed'
).length

const activeEnrollments = enrollments.filter(e => e.status === 'active')
const avgProgress = activeEnrollments.length
  ? Math.round(
      activeEnrollments.reduce((sum, e) => sum + e.progress.percent, 0)
      / activeEnrollments.length
    )
  : 0

Loading state (while either query isLoading):
- Stat cards skeleton: grid grid-cols-3 gap-4
  3x: bg-white rounded-xl border border-border-default h-24 animate-pulse bg-gray-100
- Course cards skeleton: grid grid-cols-2 gap-4 mt-6
  2x: bg-gray-100 rounded-xl h-64 animate-pulse

Error state (if either query isError):
- flex flex-col items-center justify-center h-64 gap-3
- RefreshCw icon w-8 h-8 text-gray-300
- "Something went wrong. Please refresh the page."
  text-sm text-gray-500

Layout order when data loaded:
1. <ProfileCompletionBanner> (conditional)
2. Stat cards grid
3. Two-column layout (grid grid-cols-3 gap-6):
   Left col (col-span-2): Enrolled Courses section
   Right col (col-span-1): Recent Activity section

---

## API functions to create if they don't exist:

src/api/user.api.js:
export const getProfileStatus = () =>
  axiosInstance.get('/api/v1/users/profile/status').then(r => r.data)

src/api/enrollment.api.js:
export const getMyEnrollments = () =>
  axiosInstance.get('/api/v1/enrollments/my').then(r => r.data)

(import axiosInstance from '@/api/axios')

---

## Files to create/update:
src/pages/student/StudentDashboard.jsx
src/components/layout/StudentLayout.jsx
src/components/layout/StudentSidebar.jsx
src/components/layout/StudentTopbar.jsx
src/components/profile/ProfileCompletionBanner.jsx
src/components/dashboard/StatCard.jsx
src/components/dashboard/CourseProgressCard.jsx
src/components/dashboard/RecentActivity.jsx
src/api/user.api.js           (add getProfileStatus)
src/api/enrollment.api.js     (add getMyEnrollments)


---

## Code conventions:
- ES Modules (import/export), no CommonJS
- Functional components + hooks only, no class components
- Plain JSX, no TypeScript
- Tailwind for all styling
- Only one allowed inline style: progress bar width (dynamic value)
- No hardcoded hex colors anywhere — Tailwind classes only
- All child components receive data via props only
- All data fetching and derived state lives in StudentDashboard.jsx only
- useNavigate from react-router-dom for all navigation
- No console.log in final output