import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext.jsx'
import { AppContext } from '../../context/AppContext.jsx'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorProfile = () => {
    const { dToken, profileData, setProfileData, getProfileData, backendUrl } = useContext(DoctorContext)
    const { currency } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    const updateProfile = async () => {
        try {
            const updateData = {
                fees: profileData.fees,
                address: profileData.address,
                available: profileData.available
            }

            const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } })

            if (data.success) {
                toast.success("Cập nhật hồ sơ thành công!")
                setIsEdit(false)
                getProfileData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error("Lỗi khi cập nhật hồ sơ")
            console.log(error)
        }
    }

    return profileData && (
        <div>
            <div className='flex flex-col gap-4 m-5'>
                <div>
                    <img className='bg-primary/80 w-full sm:max-w-64 rounded-lg shadow-md' src={profileData.image} alt="" />
                </div>

                <div className='flex-1 border border-stone-100 rounded-lg p-8 py-7 bg-white shadow-sm'>
                    {/* --- Thông tin cơ bản: Tên, Bằng cấp, Kinh nghiệm --- */}
                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{profileData.name}</p>

                    <div className='flex items-center gap-2 mt-1 text-gray-600 '>
                        <p>{profileData.degree} - {profileData.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full bg-gray-50'>{profileData.experience} kinh nghiệm</button>
                    </div>

                    {/* --- Giới thiệu --- */}
                    <div>
                        <p className='flex items-center gap-1 text-sm font-bold text-neutral-800 mt-3'>Giới thiệu:</p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1 italic'>
                            {profileData.about}
                        </p>
                    </div>

                    {/* --- Phí khám --- */}
                    <p className='text-gray-600 font-medium mt-4'>
                        Phí khám bệnh: <span className='text-gray-800 font-bold'>
                            {currency}
                            {isEdit
                                ? <input className='border px-2 py-1 rounded ml-2 outline-none focus:border-primary' type='number' onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))} value={profileData.fees} />
                                : profileData.fees.toLocaleString()
                            }
                        </span>
                    </p>

                    {/* --- Địa chỉ --- */}
                    <div className='flex gap-2 py-2'>
                        <p className='font-medium text-gray-600'>Địa chỉ:</p>
                        <div className='text-sm text-gray-700'>
                            {isEdit
                                ? (
                                    <div className='flex flex-col gap-2'>
                                        <input className='border px-2 py-1 rounded outline-none focus:border-primary' type='text' onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={profileData.address.line1} />
                                        <input className='border px-2 py-1 rounded outline-none focus:border-primary' type='text' onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={profileData.address.line2} />
                                    </div>
                                )
                                : (
                                    <p>
                                        {profileData.address.line1} <br />
                                        {profileData.address.line2}
                                    </p>
                                )
                            }
                        </div>
                    </div>

                    {/* --- Trạng thái sẵn sàng --- */}
                    <div className='flex items-center gap-2 pt-2'>
                        <input
                            className='w-4 h-4 cursor-pointer accent-primary'
                            onChange={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))}
                            checked={profileData.available}
                            type="checkbox"
                            id='available-check'
                        />
                        <label className='text-gray-600 font-medium cursor-pointer' htmlFor="available-check">Sẵn sàng tiếp nhận bệnh nhân</label>
                    </div>

                    {/* --- Nút điều khiển --- */}
                    {
                        isEdit
                            ? <button onClick={updateProfile} className='px-10 py-2 border border-primary text-sm rounded-full mt-6 bg-primary text-white hover:bg-opacity-90 transition-all shadow-sm'>Lưu thông tin</button>
                            : <button onClick={() => setIsEdit(true)} className='px-10 py-2 border border-primary text-sm rounded-full mt-6 text-primary hover:bg-primary hover:text-white transition-all shadow-sm'>Chỉnh sửa hồ sơ</button>
                    }

                </div>
            </div>
        </div>
    )
}

export default DoctorProfile