import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'



export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {


    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)

    const getAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/appointments', { headers: { dToken: dToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }


        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const completeAppointment = async (appointmentId) => {
        if (!window.confirm("Xác nhận đã khám xong cho bệnh nhân này?")) return;
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/complete-appointment', { appointmentId }, { headers: { dToken: dToken } })
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            } else {
                toast.error(data.message)
            }
        }
        catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const cancelAppointment = async (appointmentId) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy cuộc hẹn này không? Hành động này không thể hoàn tác.")) return;
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/cancel-appointment', { appointmentId }, { headers: { dToken: dToken } })
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            } else {
                toast.error(data.message)
            }
        }
        catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/dashboard ', { headers: { dToken: dToken } })
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const getProfileData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/profile', { headers: { dToken: dToken } })
            if (data.success) {
                setProfileData(data.profileData)
                console.log(data.profileData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const loadPatientHistory = async (userId) => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/patient-history', {
                params: { userId },
                headers: { dToken } // Dùng dToken của bác sĩ
            })
            if (data.success) {
                return data.history
            } else {
                toast.error(data.message)
                return []
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            return []
        }
    }
    const value = {
        backendUrl,
        dToken, setDToken,
        appointments, setAppointments,
        getAppointments,
        completeAppointment, cancelAppointment,
        dashData, setDashData, getDashData,
        profileData, setProfileData, getProfileData,
        loadPatientHistory,
    }
    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )
}

export default DoctorContextProvider;