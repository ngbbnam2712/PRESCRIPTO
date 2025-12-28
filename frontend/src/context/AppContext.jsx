import { createContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';


export const AppContext = createContext()

const AppContextProvider = (props) => {


    const currencySymbol = "VND"

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [doctors, setDoctors] = useState([])
    const [nurses, setNurses] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)
    const [userData, setUserData] = useState(false)
    const [specializations, setSpecializations] = useState([]);


    const getSpecializationData = async () => {
        try {
            // Giả sử API của bạn là /api/specialization/list
            const { data } = await axios.get(backendUrl + '/api/user/get-speciality');
            if (data.success) {
                setSpecializations(data.specialities); // Lưu vào state
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }



    const loadUserProfileData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            if (data.success) {
                // QUAN TRỌNG: Đổi data.message thành data.userData
                // Vì Backend trả về: res.json({ success: true, userData })
                setUserData(data.userData)
            } else {
                toast.error(data.message)
                setUserData(false)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }



    const getDoctorsData = async (res, req) => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }


        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    const getNursesData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/get-nurses');
            if (data.success) {
                setNurses(data.nurses);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }
    const value = {
        doctors,
        currencySymbol,
        token, setToken,
        backendUrl,
        userData, setUserData,
        getDoctorsData,
        loadUserProfileData,
        nurses, getNursesData,
        specializations, setSpecializations
    }

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        } else {
            setUserData(false)
        }
    }, [token])

    useEffect(() => {
        getDoctorsData();
        getNursesData();
        getSpecializationData();
    }, []);

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>

    )
}
export default AppContextProvider