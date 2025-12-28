import React, { useContext, useState } from 'react'
import { assets, nurseSpecialityData } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddNurse = () => {

    // --- CÁC TRẠNG THÁI FORM ---
    const [nurseImg, setNurseImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState('1 Năm')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')

    // State lưu các chuyên môn đã chọn (Mảng)
    const [speciality, setSpeciality] = useState([])

    const { backendUrl, aToken } = useContext(AdminContext)

    // Hàm xử lý chọn/bỏ chọn chuyên môn (Toggle)
    const toggleSpeciality = (item) => {
        if (speciality.includes(item)) {
            setSpeciality(prev => prev.filter(i => i !== item))
        } else {
            setSpeciality(prev => [...prev, item])
        }
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            // Kiểm tra các trường bắt buộc
            if (!nurseImg) {
                return toast.error('Vui lòng chọn ảnh đại diện!')
            }
            if (speciality.length === 0) {
                return toast.error('Vui lòng chọn ít nhất một chuyên môn/dịch vụ!')
            }

            const formData = new FormData()

            // Đóng gói dữ liệu vào FormData
            formData.append('image', nurseImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

            // Gửi mảng chuyên môn dưới dạng chuỗi JSON
            formData.append('speciality', JSON.stringify(speciality))

            const { data } = await axios.post(backendUrl + '/api/admin/add-nurse', formData, { headers: { aToken } })

            if (data.success) {
                toast.success("Thêm điều dưỡng thành công!")
                // Làm mới Form sau khi thêm thành công
                setNurseImg(false)
                setName('')
                setPassword('')
                setEmail('')
                setAddress1('')
                setAddress2('')
                setDegree('')
                setAbout('')
                setFees('')
                setSpeciality([])
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error("Lỗi hệ thống: " + error.message)
            console.log(error)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <p className='mb-3 text-lg font-medium'>Thêm Điều Dưỡng Mới</p>
            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>

                {/* Phần tải ảnh điều dưỡng */}
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor='nurse-img'>
                        <img className='w-16 h-16 bg-gray-100 rounded-full cursor-pointer object-cover' src={nurseImg ? URL.createObjectURL(nurseImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setNurseImg(e.target.files[0])} type="file" id='nurse-img' hidden />
                    <p>Tải lên ảnh <br />điều dưỡng</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
                    {/* Cột trái: Thông tin cá nhân */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Họ và tên</p>
                            <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2 outline-none focus:border-primary' type="text" placeholder='Nhập họ tên điều dưỡng' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Email liên hệ</p>
                            <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2 outline-none focus:border-primary' type="email" placeholder='Nhập email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Mật khẩu tài khoản</p>
                            <input onChange={(e) => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2 outline-none focus:border-primary' type="password" placeholder='Nhập mật khẩu' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Kinh nghiệm làm việc</p>
                            <select onChange={(e) => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2 outline-none'>
                                <option value="1 Năm">1 Năm</option>
                                <option value="2 Năm">2 Năm</option>
                                <option value="3 Năm">3 Năm</option>
                                <option value="4 Năm">4 Năm</option>
                                <option value="5 Năm">5 Năm</option>
                                <option value="6 Năm">6 Năm</option>
                                <option value="7 Năm">7 Năm</option>
                                <option value="8 Năm">8 Năm</option>
                                <option value="9 Năm">9 Năm</option>
                                <option value="10+ Năm">10+ Năm</option>
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Phí dịch vụ (VNĐ)</p>
                            <input onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2 outline-none focus:border-primary' type="number" placeholder='Nhập mức phí' required />
                        </div>
                    </div>

                    {/* Cột phải: Chuyên môn và Địa chỉ */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Dịch vụ hỗ trợ / Chuyên môn (Chọn nhiều)</p>
                            <div className='flex flex-wrap gap-2 border rounded px-3 py-3 min-h-[46px] bg-gray-50'>
                                {nurseSpecialityData.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => toggleSpeciality(item)}
                                        className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-all border select-none
                                            ${speciality.includes(item)
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                            }
                                        `}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <p className='text-[10px] text-gray-500 mt-1 italic'>
                                Đã chọn: {speciality.length > 0 ? speciality.join(', ') : 'Chưa có lựa chọn'}
                            </p>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Trình độ học vấn</p>
                            <input onChange={(e) => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2 outline-none focus:border-primary' type="text" placeholder='VD: Cử nhân điều dưỡng' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Địa chỉ công tác</p>
                            <input className='border rounded px-3 py-2 outline-none focus:border-primary' onChange={(e) => setAddress1(e.target.value)} value={address1} type="text" placeholder='Địa chỉ 1' required />
                            <input className='border rounded px-3 py-2 mt-2 outline-none focus:border-primary' onChange={(e) => setAddress2(e.target.value)} value={address2} type="text" placeholder='Địa chỉ 2' required />
                        </div>
                    </div>
                </div>

                <div>
                    <p className='mt-4 mb-2'>Giới thiệu chi tiết</p>
                    <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded outline-none focus:border-primary' placeholder='Mô tả ngắn về quá trình làm việc và kỹ năng...' rows={5}></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full hover:bg-opacity-90 transition-all shadow-md'>
                    Thêm Điều Dưỡng
                </button>
            </div>
        </form>
    )
}

export default AddNurse