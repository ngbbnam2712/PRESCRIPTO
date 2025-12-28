import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Doctors = () => {

  // 'speciality' ở đây thực chất là specializationId lấy từ URL params
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()

  // Lấy thêm specializations từ Context để render danh sách lọc bên trái
  const { doctors, specializations } = useContext(AppContext)

  const applyFilter = () => {
    if (speciality) {
      // SỬA: Lọc theo specializationId thay vì tên text
      // Đảm bảo trong database bác sĩ có trường specializationId khớp với id chuyên khoa
      setFilterDoc(doctors.filter(doc => doc.specializationId === speciality))
    } else {
      setFilterDoc(doctors)
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  return (
    <div>
      <p className='text-gray-600'>Tìm kiếm các bác sĩ qua chuyên ngành.</p>
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>

        {/* Nút bật tắt filter trên mobile */}
        <button className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`} onClick={() => setShowFilter(prev => !prev)}>Filters</button>

        {/* --- DANH SÁCH BỘ LỌC BÊN TRÁI (DYNAMIC) --- */}
        <div className={`flex flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {specializations && specializations.map((item, index) => (
            <p
              key={index}
              onClick={() => {
                // Nếu đang ở đúng ID này thì click lần nữa sẽ về trang tất cả bác sĩ
                speciality === item._id ? navigate('/doctors') : navigate(`/doctors/${item._id}`)
              }}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer 
                ${speciality === item._id ? "bg-indigo-100 text-black font-medium" : "hover:bg-gray-50"}`}
            >
              {item.name}
            </p>
          ))}
        </div>

        {/* --- DANH SÁCH BÁC SĨ --- */}
        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {
            filterDoc.map((item, index) => (
              <div onClick={() => navigate(`/appointment/${item._id}`)} className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[10px] transition-all duration-500 ' key={index}>
                <img className='bg-blue-50 w-full h-48 object-cover object-top' src={item.image} alt="" />
                <div className='p-4'>
                  <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                    <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></p>
                    <p>{item.available ? 'Available' : 'Not Available'}</p>
                  </div>
                  <p className='text-gray-900 text-lg font-medium'>{item.name}</p>

                  {/* Hiển thị tên chuyên khoa (Lấy từ dữ liệu bác sĩ, hoặc phải join từ mảng specialization) */}
                  {/* Tạm thời hiển thị item.speciality nếu bác sĩ vẫn lưu tên text, hoặc bạn cần populate từ backend */}
                  <p className='text-gray-600 text-sm'>{item.speciality}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default Doctors