import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import StudentLayout from './components/layout/StudentLayout'
import AdminLayout from './components/layout/AdminLayout'
import { useAuth } from './hooks/useAuth'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import StudentDashboard from './pages/student/StudentDashboard'
import Groups from './pages/student/Groups'
import Courses from './pages/student/Courses'
import CreateGroup from './pages/student/CreateGroup'
import GroupDetails from './pages/student/GroupDetails'
import Assignments from './pages/student/Assignments'
import AssignmentDetails from './pages/student/AssignmentDetails'

import AdminDashboard from './pages/admin/AdminDashboard'
import CreateAssignment from './pages/admin/CreateAssignment'
import EditAssignment from './pages/admin/EditAssignment'
import AssignmentProgress from './pages/admin/AssignmentProgress'
import Submissions from './pages/admin/Submissions'
import AdminRegistration from './pages/admin/AdminRegistration'
import AdminAssignments from './pages/admin/AdminAssignments'
import AdminGroups from './pages/admin/AdminGroups'
import AdminGroupDetails from './pages/admin/AdminGroupDetails'
import AdminCourses from './pages/admin/AdminCourses'

function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="p-6">Loading...</p>
  }

  return (
    <Navigate
      to={user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard') : '/login'}
      replace
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="STUDENT" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/groups" element={<Groups />} />
              <Route path="/student/courses" element={<Courses />} />
              <Route path="/student/groups/create" element={<CreateGroup />} />
              <Route path="/student/groups/:id" element={<GroupDetails />} />
              <Route path="/student/assignments" element={<Assignments />} />
              <Route path="/student/assignments/:id" element={<AssignmentDetails />} />
            </Route>
          </Route>

          <Route element={<RoleRoute role="ADMIN" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/assignments" element={<AdminAssignments />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/groups/:id" element={<AdminGroupDetails />} />
              <Route path="/admin/assignments/create" element={<CreateAssignment />} />
              <Route path="/admin/assignments/:id/edit" element={<EditAssignment />} />
              <Route path="/admin/assignments/:id/progress" element={<AssignmentProgress />} />
              <Route path="/admin/assignments/:id/submissions" element={<Submissions />} />
              <Route path="/admin/admins/create" element={<AdminRegistration />} />
            </Route>
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App