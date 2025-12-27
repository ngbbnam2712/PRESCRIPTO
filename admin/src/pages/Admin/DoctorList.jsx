import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import DoctorScheduleModal from './DoctorScheduleModal.jsx'
const DoctorList = () => {
    const { doctors, aToken, getAllDoctors, changeAvailability } = useContext(AdminContext)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        if (aToken) {
            getAllDoctors()
        }
    }, [aToken])
    const handleOpenSchedule = (doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    }
    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <h1 className='text-lg font-medium'>All Doctors</h1>
            <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
                {
                    doctors.map((item, index) => (
                        <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
                            <img className='bg-indigo-50 group-hover:bg-primary transition-all duration-500 ' src={item.image} alt="" />
                            <div className='p-4'>
                                <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                                <p className='text-zinc-600 text-sm'>{item.speciality}</p>
                                <div className='mt-2 flex items-center gap-1 text-sm'>
                                    <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                                    <p>Available</p>
                                </div>
                                <button
                                    onClick={() => handleOpenSchedule(item)}
                                    className="mt-3 w-full bg-blue-50 text-blue-600 text-xs font-bold py-2 rounded hover:bg-blue-600 hover:text-white transition flex items-center justify-center gap-2">
                                    {/* Icon Calendar */}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    Schedule & Book
                                </button>
                            </div>

                        </div>
                    ))
                }
            </div>
            <DoctorScheduleModal
                doctor={selectedDoctor}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}

export default DoctorList