import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLabParams from './pages/admin/LabParams'
import AdminPatients from './pages/admin/Patients'
import AdminDoctors from './pages/admin/Doctors'
import AdminExaminations from './pages/admin/Examinations'
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorPatients from './pages/doctor/Patients'
import DoctorPatientDetail from './pages/doctor/PatientDetail'
import DoctorMedicalNotes from './pages/doctor/MedicalNotes'
import DoctorChat from './pages/doctor/Chat'
import PatientDashboard from './pages/patient/Dashboard'
import PatientLabResults from './pages/patient/LabResults'
import PatientMedicalNotes from './pages/patient/MedicalNotes'
import PatientChat from './pages/patient/Chat'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="lab-params" element={<AdminLabParams />} />
                        <Route path="patients" element={<AdminPatients />} />
                        <Route path="doctors" element={<AdminDoctors />} />
                        <Route path="examinations" element={<AdminExaminations />} />
                    </Route>

                    {/* Doctor Routes */}
                    <Route path="/doctor" element={<ProtectedRoute role="DOCTOR" />}>
                        <Route index element={<DoctorDashboard />} />
                        <Route path="patients" element={<DoctorPatients />} />
                        <Route path="patients/:id" element={<DoctorPatientDetail />} />
                        <Route path="medical-notes" element={<DoctorMedicalNotes />} />
                        <Route path="chat" element={<DoctorChat />} />
                    </Route>

                    {/* Patient Routes */}
                    <Route path="/patient" element={<ProtectedRoute role="PATIENT" />}>
                        <Route index element={<PatientDashboard />} />
                        <Route path="lab-results" element={<PatientLabResults />} />
                        <Route path="medical-notes" element={<PatientMedicalNotes />} />
                        <Route path="chat" element={<PatientChat />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
