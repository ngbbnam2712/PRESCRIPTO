import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'

const Sidebar = () => {

    const { aToken } = useContext(AdminContext)
    const { dToken } = useContext(DoctorContext)







    return (
        <div className='min-h-screen bg-white border-r'>
            {
                aToken && <ul className='text-[#515151] mt-5'>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/admin-dashboard'}>
                        <img src={assets.home_icon} alt="" />
                        <p className='hidden md:block'>Dashboard</p>
                    </NavLink>



                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/all-appointments'}>
                        <img src={assets.appointment_icon} alt="" />
                        <p className='hidden md:block'>All Appointments</p>
                    </NavLink>


                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/add-doctor'}>
                        <img src={assets.add_icon} alt="" />
                        <p className='hidden md:block'>Add Doctor</p>
                    </NavLink>


                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/doctor-list'}>
                        <img src={assets.people_icon} alt="" />
                        <p className='hidden md:block'>Doctor List</p>
                    </NavLink>
                    <NavLink to={'/add-nurse'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : 'border-transparent'}`}>
                        <img src={assets.add_icon} alt="" />
                        <p className='hidden md:block'>Add Nurse</p>
                    </NavLink>
                    <NavLink to={'/add-speciality'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : 'border-transparent'}`}>
                        <img src={assets.add_icon} alt="" />
                        <p className='hidden md:block'>Add Speciality</p>
                    </NavLink>
                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/guest-requests'}>
                        <img src={assets.appointment_icon} alt="" className="scale-x-[-1]" />
                        <p className='hidden md:block'>Guest List</p>
                    </NavLink>


                </ul>

            }
            {
                dToken && <ul className='text-[#515151] mt-5'>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/doctor-dashboard'}>
                        <img src={assets.home_icon} alt="" />
                        <p className='hidden md:block'>Dashboard</p>
                    </NavLink>



                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/doctor-appointments'}>
                        <img src={assets.appointment_icon} alt="" />
                        <p className='hidden md:block'>All Appointments</p>
                    </NavLink>


                    <NavLink className={({ isActive }) => `flex items-center gap-3 px-3 py-3.5 md:px-9 md:min-w-72 cursor-pointer border-r-4  ${isActive ? 'bg-[#F2F3FF] border-primary' : 'border-transparent'}`} to={'/doctor-profile'}>
                        <img src={assets.people_icon} alt="" />
                        <p className='hidden md:block'>Profile</p>
                    </NavLink>



                </ul>

            }
        </div>
    )
}







export default Sidebar