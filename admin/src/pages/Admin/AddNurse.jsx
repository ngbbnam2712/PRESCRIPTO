import React, { useContext, useState } from 'react'
// 1. Import danh sách cứng từ assets
import { assets, nurseSpecialityData } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'


const AddNurse = () => {

    // 2. Đổi tên state docImg -> nurseImg cho đúng ngữ cảnh
    const [nurseImg, setNurseImg] = useState(false)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState('1 Year')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')

    // State lưu các mục ĐÃ CHỌN
    const [speciality, setSpeciality] = useState([])

    const { backendUrl, aToken } = useContext(AdminContext)

    // --- ĐÃ BỎ HÀM useEffect FETCH API TẠI ĐÂY ---

    // Hàm xử lý chọn/bỏ chọn (Toggle)
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
            // Kiểm tra nurseImg
            if (!nurseImg) {
                return toast.error('Image not selected!')
            }
            if (speciality.length === 0) {
                return toast.error('Please select at least one speciality!')
            }

            const formData = new FormData()

            // Backend middleware thường là upload.single('image'), nên key vẫn để là 'image'
            formData.append('image', nurseImg)

            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

            // Gửi mảng chuyên ngành
            formData.append('speciality', JSON.stringify(speciality))

            const { data } = await axios.post(backendUrl + '/api/admin/add-nurse', formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                setNurseImg(false) // Reset ảnh
                setName('')
                setPassword('')
                setEmail('')
                setAddress1('')
                setAddress2('')
                setDegree('')
                setAbout('')
                setFees('')
                setSpeciality([]) // Reset mảng chọn
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full' >
            <p className='mb-3 text-lg font-medium '>Add Nurse</p>
            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>

                {/* --- SỬA UI: Dùng nurseImg --- */}
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor='nurse-img'>
                        <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={nurseImg ? URL.createObjectURL(nurseImg) : assets.upload_area} alt="" />
                    </label>
                    {/* Cập nhật onChange setNurseImg */}
                    <input onChange={(e) => setNurseImg(e.target.files[0])} type="file" id='nurse-img' hidden />
                    <p>Upload nurse <br />picture </p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
                    <div className='w-full lg:flex-1 flex flex-col gap-4 '>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Nurse name</p>
                            <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Nurse email</p>
                            <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Nurse password</p>
                            <input onChange={(e) => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2' type="password" placeholder='Password' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Experience</p>
                            <select onChange={(e) => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2' name="" id="">
                                <option value="1 Year">1 Year</option>
                                <option value="2 Years">2 Years</option>
                                <option value="3 Years">3 Years</option>
                                <option value="4 Years">4 Years</option>
                                <option value="5 Years">5 Years</option>
                                <option value="6 Years">6 Years</option>
                                <option value="7 Years">7 Years</option>
                                <option value="8 Years">8 Years</option>
                                <option value="9 Years">9 Years</option>
                                <option value="10 Years">10 Years</option>
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Fees</p>
                            <input onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type="number" placeholder='Fees' required />
                        </div>
                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        {/* --- SỬA LOGIC: Dùng trực tiếp nurseSpecialityData --- */}
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Services / Specialities</p>
                            <div className='flex flex-wrap gap-2 border rounded px-3 py-3 min-h-[46px] bg-white'>

                                {nurseSpecialityData.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => toggleSpeciality(item)}
                                        className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-all border select-none
                                            ${speciality.includes(item)
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                                            }
                                        `}
                                    >
                                        {item}
                                    </div>
                                ))}

                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Selected: {speciality.length > 0 ? speciality.join(', ') : 'None'}
                            </p>
                        </div>
                        {/* -------------------------------------------------------- */}

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Education</p>
                            <input onChange={(e) => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type="text" placeholder='Education' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Address</p>
                            <input className='border rounded px-3 py-2' onChange={(e) => setAddress1(e.target.value)} value={address1} type="text" placeholder='Address 1' required />
                            <input className='border rounded px-3 py-2' onChange={(e) => setAddress2(e.target.value)} value={address2} type="text" placeholder='Address 2' required />
                        </div>

                    </div>
                </div>

                <div>
                    <p className='mt-4 mb-2 '>About</p>
                    <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' type='text' placeholder='Write about nurse' rows={5}></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-3 text-white rounded-full'>Add Nurse</button>
            </div>
        </form>
    )
}

export default AddNurse