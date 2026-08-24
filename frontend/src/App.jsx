import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import StudentLayout from './components/layout/StudentLayout'
import AdminLayout from './components/layout/AdminLayout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import StudentDashboard from './pages/student/StudentDashboard'
import Groups from './pages/student/Groups'
import CreateGroup from './pages/student/CreateGroup'
import GroupDetails from './pages/student/GroupDetails'
import Assignments from './pages/student/Assignments'
import AssignmentDetails from './pages/student/AssignmentDetails'

import AdminDashboard from './pages/admin/AdminDashboard'
import CreateAssignment from './pages/admin/CreateAssignment'
import AssignmentProgress from './pages/admin/AssignmentProgress'
import Submissions from './pages/admin/Submissions'
import AdminRegistration from './pages/admin/AdminRegistration'
import AdminAssignments from './pages/admin/AdminAssignments'
import AdminGroups from './pages/admin/AdminGroups'
import AdminGroupDetails from './pages/admin/AdminGroupDetails'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="STUDENT" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/groups" element={<Groups />} />
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
              <Route path="/admin/groups/:id" element={<AdminGroupDetails />} />
              <Route path="/admin/assignments/create" element={<CreateAssignment />} />
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