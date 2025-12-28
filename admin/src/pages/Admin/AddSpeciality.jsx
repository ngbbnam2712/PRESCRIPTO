import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddSpecialist = () => {

    const [specImg, setSpecImg] = useState(false)
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [floor, setFloor] = useState('')
    const [defaultFee, setDefaultFee] = useState('')
    const [isActive, setIsActive] = useState('true')
    const [description, setDescription] = useState('')

    const { backendUrl, aToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if (!specImg) {
                return toast.error('Vui lòng chọn hình ảnh biểu tượng!')
            }

            const formData = new FormData()
            formData.append('image', specImg)
            formData.append('name', name)
            formData.append('code', code)
            formData.append('floor', Number(floor))
            formData.append('defaultFee', Number(defaultFee))
            formData.append('description', description)
            formData.append('isActive', isActive === 'true')

            // Gọi API thêm chuyên khoa
            const { data } = await axios.post(backendUrl + '/api/admin/add-specialist', formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                // Làm mới Form
                setSpecImg(false)
                setName('')
                setCode('')
                setFloor('')
                setDefaultFee('')
                setDescription('')
                setIsActive('true')
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
            <p className='mb-3 text-lg font-medium'>Thêm Chuyên Khoa Mới</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>

                {/* Phần tải ảnh/biểu tượng */}
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor='spec-img'>
                        <img className='w-16 h-16 bg-gray-100 rounded-full cursor-pointer object-cover' src={specImg ? URL.createObjectURL(specImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setSpecImg(e.target.files[0])} type="file" id='spec-img' hidden />
                    <p>Tải lên biểu tượng <br /> hoặc hình ảnh chuyên khoa</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    {/* Cột bên trái */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Tên chuyên khoa</p>
                            <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2 outline-none focus:border-primary' type="text" placeholder='VD: Tim mạch, Nhi khoa...' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Mã chuyên khoa (Viết hoa)</p>
                            <input
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                value={code}
                                className='border rounded px-3 py-2 uppercase outline-none focus:border-primary'
                                type="text"
                                placeholder='VD: TIM, NHI, SAN...'
                                required
                            />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Vị trí (Số tầng)</p>
                            <input onChange={(e) => setFloor(e.target.value)} value={floor} className='border rounded px-3 py-2 outline-none focus:border-primary' type="number" placeholder='Nhập số tầng' required />
                        </div>

                    </div>

                    {/* Cột bên phải */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Phí khám mặc định (VNĐ)</p>
                            <input onChange={(e) => setDefaultFee(e.target.value)} value={defaultFee} className='border rounded px-3 py-2 outline-none focus:border-primary' type="number" placeholder='Nhập mức phí tham khảo' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Trạng thái (Kích hoạt)</p>
                            <select onChange={(e) => setIsActive(e.target.value)} value={isActive} className='border rounded px-3 py-2 outline-none'>
                                <option value="true">Đang hoạt động</option>
                                <option value="false">Ngưng hoạt động</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Phần mô tả chi tiết */}
                <div>
                    <p className='mt-4 mb-2'>Mô tả chuyên khoa</p>
                    <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full px-4 pt-2 border rounded outline-none focus:border-primary' placeholder='Viết một vài mô tả chi tiết về chuyên khoa này...' rows={5}></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full hover:bg-opacity-90 transition-all'>
                    Thêm Chuyên Khoa Ngay
                </button>
            </div>
        </form>
    )
}

export default AddSpecialist