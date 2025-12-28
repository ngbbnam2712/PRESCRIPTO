import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddDoctor = () => {
    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState('1 Year')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [speciality, setSpeciality] = useState('') // Lưu ID của chuyên khoa
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')

    // State chứa danh sách chuyên khoa lấy từ DB
    const [specialityData, setSpecialityData] = useState([])
    const { backendUrl, aToken } = useContext(AdminContext)

    // Hàm lấy danh sách chuyên khoa từ Backend
    useEffect(() => {
        const getSpecialities = async () => {
            try {
                const { data } = await axios.get(backendUrl + '/api/admin/speciality-list')

                if (data.success) {
                    setSpecialityData(data.specialities)
                    // Set mặc định là ID của phần tử đầu tiên
                    if (data.specialities.length > 0) {
                        setSpeciality(data.specialities[0]._id)
                    }
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
                console.error(error)
            }
        }
        getSpecialities()
    }, [backendUrl])

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if (!docImg) {
                return toast.error('Image not selected!')
            }

            // TÌM TÊN CHUYÊN KHOA TỪ ID ĐANG CHỌN
            const selectedSpec = specialityData.find(item => item._id === speciality)
            const specialityName = selectedSpec ? selectedSpec.name : ''

            const formData = new FormData()
            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)

            // GỬI CẢ ĐÔI: ID VÀ TÊN
            formData.append('specializationId', speciality) // ID
            formData.append('speciality', specialityName)    // Tên (hiển thị)

            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

            const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                // Reset form
                setDocImg(false)
                setName('')
                setPassword('')
                setEmail('')
                setAddress1('')
                setAddress2('')
                setDegree('')
                setAbout('')
                setFees('')
                if (specialityData.length > 0) setSpeciality(specialityData[0]._id)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.error(error)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <p className='mb-3 text-lg font-medium'>Add Doctor</p>
            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor='doc-img'>
                        <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id='doc-img' hidden />
                    <p>Upload doctor <br />picture </p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor name</p>
                            <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor email</p>
                            <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor password</p>
                            <input onChange={(e) => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2' type="password" placeholder='Password' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Experience</p>
                            <select onChange={(e) => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2'>
                                {[...Array(10)].map((_, i) => (
                                    <option key={i} value={`${i + 1} Year${i > 0 ? 's' : ''}`}>{i + 1} Year{i > 0 ? 's' : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Fees</p>
                            <input onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type="number" placeholder='Fees' required />
                        </div>
                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Speciality</p>
                            <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className='border rounded px-3 py-2' required>
                                {specialityData.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Education</p>
                            <input onChange={(e) => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type="text" placeholder='Education' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Address</p>
                            <input className='border rounded px-3 py-2' onChange={(e) => setAddress1(e.target.value)} value={address1} type="text" placeholder='Address 1' required />
                            <input className='border rounded px-3 py-2 mt-2' onChange={(e) => setAddress2(e.target.value)} value={address2} type="text" placeholder='Address 2' required />
                        </div>
                    </div>
                </div>
                <div>
                    <p className='mt-4 mb-2'>About</p>
                    <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' placeholder='write about doctor' rows={5} required></textarea>
                </div>
                <button type='submit' className='bg-primary px-10 py-3 mt-3 text-white rounded-full'>Add Doctor</button>
            </div>
        </form>
    )
}

export default AddDoctor