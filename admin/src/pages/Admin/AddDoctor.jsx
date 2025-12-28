import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddDoctor = () => {
    // --- CÁC TRẠNG THÁI FORM ---
    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState('1 Năm')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [speciality, setSpeciality] = useState('') // Lưu ID của chuyên khoa
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')

    // --- CONTEXT VÀ DỮ LIỆU CHUYÊN KHOA ---
    const [specialityData, setSpecialityData] = useState([])
    const { backendUrl, aToken } = useContext(AdminContext)

    // Lấy danh sách chuyên khoa từ Backend khi trang tải
    useEffect(() => {
        const getSpecialities = async () => {
            try {
                const { data } = await axios.get(backendUrl + '/api/admin/speciality-list')

                if (data.success) {
                    setSpecialityData(data.specialities)
                    // Mặc định chọn chuyên khoa đầu tiên trong danh sách
                    if (data.specialities.length > 0) {
                        setSpeciality(data.specialities[0]._id)
                    }
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error("Không thể tải danh sách chuyên khoa")
                console.error(error)
            }
        }
        getSpecialities()
    }, [backendUrl])

    // --- XỬ LÝ GỬI DỮ LIỆU ---
    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if (!docImg) {
                return toast.error('Vui lòng chọn ảnh đại diện!')
            }

            // Tìm tên chuyên khoa dựa trên ID đang được chọn trong state
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
            formData.append('specializationId', speciality) // ID dùng cho truy vấn
            formData.append('speciality', specialityName)    // Tên dùng cho hiển thị
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

            const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })

            if (data.success) {
                toast.success("Thêm bác sĩ thành công!")
                // Làm mới Form
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
            toast.error("Lỗi hệ thống: " + error.message)
            console.error(error)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <p className='mb-3 text-lg font-medium'>Thêm Bác Sĩ Mới</p>
            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>

                {/* Phần tải ảnh đại diện */}
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor='doc-img'>
                        <img className='w-16 h-16 bg-gray-100 rounded-full cursor-pointer object-cover' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id='doc-img' hidden />
                    <p>Tải lên ảnh <br />đại diện bác sĩ</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
                    {/* Cột trái: Thông tin cơ bản */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Họ và tên</p>
                            <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2 outline-none focus:border-primary' type="text" placeholder='Nhập họ tên bác sĩ' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Email tài khoản</p>
                            <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2 outline-none focus:border-primary' type="email" placeholder='Email liên hệ' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Mật khẩu đăng nhập</p>
                            <input onChange={(e) => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2 outline-none focus:border-primary' type="password" placeholder='Nhập mật khẩu' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Kinh nghiệm làm việc</p>
                            <select onChange={(e) => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2 outline-none'>
                                {[...Array(10)].map((_, i) => (
                                    <option key={i} value={`${i + 1} Năm`}>{i + 1} Năm</option>
                                ))}
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Phí khám bệnh (VNĐ)</p>
                            <input onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2 outline-none focus:border-primary' type="number" placeholder='Mức phí' required />
                        </div>
                    </div>

                    {/* Cột phải: Chuyên môn và Địa chỉ */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Chuyên khoa</p>
                            <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className='border rounded px-3 py-2 outline-none' required>
                                {specialityData.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Trình độ học vấn / Bằng cấp</p>
                            <input onChange={(e) => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2 outline-none focus:border-primary' type="text" placeholder='VD: Thạc sĩ, Tiến sĩ...' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Địa chỉ công tác</p>
                            <input className='border rounded px-3 py-2 outline-none focus:border-primary' onChange={(e) => setAddress1(e.target.value)} value={address1} type="text" placeholder='Địa chỉ dòng 1' required />
                            <input className='border rounded px-3 py-2 mt-2 outline-none focus:border-primary' onChange={(e) => setAddress2(e.target.value)} value={address2} type="text" placeholder='Địa chỉ dòng 2' required />
                        </div>
                    </div>
                </div>

                {/* Phần giới thiệu */}
                <div>
                    <p className='mt-4 mb-2'>Giới thiệu chi tiết</p>
                    <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded outline-none focus:border-primary' placeholder='Viết mô tả ngắn về quá trình công tác của bác sĩ...' rows={5} required></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full hover:bg-opacity-90 transition-all'>
                    Thêm Bác Sĩ Ngay
                </button>
            </div>
        </form>
    )
}

export default AddDoctor