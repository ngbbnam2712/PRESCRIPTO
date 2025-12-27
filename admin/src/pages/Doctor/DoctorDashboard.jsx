import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext.jsx'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext.jsx'

const DoctorDashboard = () => {

    const { dToken, dashData, setDashData, getDashData, completeAppointment, cancelAppointment } = useContext(DoctorContext)
    const { currency, slotDateFormat } = useContext(AppContext)

    useEffect(() => {
        if (dToken) {
            getDashData()
        }
    }, [dToken])

    return dashData && (
        <div className='m-5 w-full max-w-6xl'>

            {/* --- STATS CARDS --- */}
            <div className='flex flex-wrap gap-3'>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                    <img className='w-14' src={assets.earning_icon} alt="" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{currency} {dashData.earnings}</p>
                        <p className='text-gray-400'>Earnings</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                    <img className='w-14' src={assets.appointments_icon} alt="" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
                        <p className='text-gray-400'>Appointments</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                    <img className='w-14' src={assets.patients_icon} alt="" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
                        <p className='text-gray-400'>Patients</p>
                    </div>
                </div>
            </div>

            {/* --- LATEST BOOKINGS --- */}
            <div className='bg-white'>
                <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
                    <img src={assets.list_icon} alt="" />
                    <p className='font-semibold'>Latest Bookings</p>
                </div>

                <div className='pt-4 border border-t-0'>
                    {dashData.latestAppointments.map((item, index) => (
                        <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100 transition-all' key={index}>
                            <img className='rounded-full w-10 h-10 object-cover' src={item.userData.image || assets.upload_area} alt="" />

                            <div className='flex-1 text-sm'>
                                <p className='text-gray-800 font-medium'>{item.userData.name}</p>

                                <div className="flex items-center gap-2 mt-1">
                                    {/* Mới thêm: Hiển thị Ngày + Giờ */}
                                    <p className='text-gray-600'>
                                        {slotDateFormat(item.slotDate)}, <span className='text-gray-800 font-medium'>{item.slotTime}</span>
                                    </p>

                                    {/* Mới thêm: Badge Mode */}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.appointmentType === 'Remote'
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                            : 'bg-green-50 text-green-600 border-green-200'
                                        }`}>
                                        {item.appointmentType === 'Remote' ? 'Remote' : 'Clinic'}
                                    </span>
                                </div>
                            </div>

                            {item.cancelled ? (
                                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                            ) : item.isCompleted ? (
                                <p className='text-green-500 text-xs font-medium'>Completed</p>
                            ) : (
                                <div className='flex gap-2'>
                                    <img
                                        onClick={() => cancelAppointment(item._id)}
                                        className='w-10 cursor-pointer opacity-80 hover:opacity-100 transition-transform'
                                        src={assets.cancel_icon}
                                        alt="Cancel"
                                    />
                                    <img
                                        onClick={() => completeAppointment(item._id)}
                                        className='w-10 cursor-pointer opacity-80 hover:opacity-100 transition-transform'
                                        src={assets.tick_icon}
                                        alt="Complete"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}

export default DoctorDashboard