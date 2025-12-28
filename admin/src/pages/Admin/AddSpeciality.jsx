
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
    const [isActive, setIsActive] = useState('true') // Dùng string để hứng value từ select, sau đó convert
    const [description, setDescription] = useState('')

    const { backendUrl, aToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if (!specImg) {
                return toast.error('Image not selected!')
            }

            const formData = new FormData()
            formData.append('image', specImg)
            formData.append('name', name)
            formData.append('code', code)
            formData.append('floor', Number(floor))
            formData.append('defaultFee', Number(defaultFee))
            formData.append('description', description)
            formData.append('isActive', isActive === 'true') // Convert string to boolean

            // Log ra console để kiểm tra trước khi gửi
            formData.forEach((value, key) => {
                console.log(`${key}:${value}`)
            })

            // Gọi API (Đường dẫn giả định là /api/admin/add-specialist)
            const { data } = await axios.post(backendUrl + '/api/admin/add-specialist', formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                // Reset form
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
            toast.error(error.message)
            console.log(error)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <p className='mb-3 text-lg font-medium'>Add Specialist</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>

                {/* Image Upload Section */}
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor='spec-img'>
                        <img className='w-16 bg-gray-100 rounded-full cursor-pointer h-16 object-cover' src={specImg ? URL.createObjectURL(specImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setSpecImg(e.target.files[0])} type="file" id='spec-img' hidden />
                    <p>Upload specialist <br /> icon/image</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    {/* Left Column */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Specialist Name</p>
                            <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='E.g. Cardiology' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Code (Uppercase)</p>
                            <input
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                value={code}
                                className='border rounded px-3 py-2 uppercase'
                                type="text"
                                placeholder='E.g. CAR'
                                required
                            />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Floor Number</p>
                            <input onChange={(e) => setFloor(e.target.value)} value={floor} className='border rounded px-3 py-2' type="number" placeholder='Floor number' required />
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Default Fee</p>
                            <input onChange={(e) => setDefaultFee(e.target.value)} value={defaultFee} className='border rounded px-3 py-2' type="number" placeholder='Consultation fee' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Status (Is Active)</p>
                            <select onChange={(e) => setIsActive(e.target.value)} value={isActive} className='border rounded px-3 py-2'>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Description Section (Full Width) */}
                <div>
                    <p className='mt-4 mb-2'>Description</p>
                    <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full px-4 pt-2 border rounded' placeholder='Write description about this specialization' rows={5}></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-3 text-white rounded-full'>Add Specialist</button>
            </div>
        </form>
    )
}

export default AddSpecialist