import React, { useContext } from 'react'
import Login from './pages/Login.jsx'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/ReactToastify.css'
import { AdminContext } from './context/AdminContext.jsx'
import NavBar from './components/NavBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import { Route, Routes } from 'react-router-dom'
import AddDoctor from './pages/Admin/AddDoctor.jsx'
import Dashboard from './pages/Admin/Dashboard.jsx'
import AllAppointments from './pages/Admin/AllAppointment.jsx'
import DoctorList from './pages/Admin/DoctorList.jsx'
import { DoctorContext } from './context/DoctorContext.jsx'
import DoctorDashboard from './pages/Doctor/DoctorDashboard.jsx'
import DoctorAppointments from './pages/Doctor/DoctorAppointments.jsx'
import DoctorProfile from './pages/Doctor/DoctorProfile.jsx'



export const App = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)

  return aToken || dToken ? (
    <div className='bg-[#F8F9FD]'>

      <ToastContainer />
      <NavBar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>

          /// Admin route
          <Route path='/' element={<></>}></Route>
          <Route path='/admin-dashboard' element={<Dashboard />} ></Route>
          <Route path='/all-appointments' element={<AllAppointments />}></Route>
          <Route path='/add-doctor' element={<AddDoctor />}></Route>
          <Route path='/doctor-list' element={<DoctorList />}></Route>


          //doctor route
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
        </Routes>
      </div>
    </div>
  )
    : (
      <div>
        <Login />
        <ToastContainer />
      </div>
    )
}
export default App