import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Nurses = () => {

    // 1. Lấy tham số speciality từ URL (vd: basic-checkup)
    const { speciality } = useParams();
    const { nurses } = useContext(AppContext);
    const [filterNurse, setFilterNurse] = useState([]);
    const navigate = useNavigate();

    // 2. Hàm xử lý logic lọc
    const applyFilter = () => {
        if (speciality) {
            // Chuyển đổi URL 'basic-checkup' thành dạng gần giống Database để so sánh (tùy chọn)
            // Cách đơn giản nhất: So sánh không phân biệt hoa thường và bỏ dấu gạch nối

            const searchKey = speciality.replace(/-/g, ' ').toLowerCase(); // "basic-checkup" -> "basic checkup"

            const filtered = nurses.filter(nurse =>
                // nurse.speciality là MẢNG. Cần kiểm tra xem mảng có chứa mục nào khớp không
                nurse.speciality.some(item => item.toLowerCase() === searchKey)
            );

            setFilterNurse(filtered);
        } else {
            setFilterNurse(nurses); // Nếu không có param thì hiện hết
        }
    };

    useEffect(() => {
        applyFilter();
    }, [nurses, speciality]);

    return (
        <div>
            <p className='text-gray-600 mb-4'>Specialists for: <span className='font-bold capitalize'>{speciality?.replace(/-/g, ' ')}</span></p>

            <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
                {filterNurse.length > 0 ? filterNurse.map((item, index) => (
                    <div
                        onClick={() => navigate(`/appointment-nurse/${item._id}`)} // Giả sử bạn sẽ làm trang đặt lịch nurse sau
                        className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
                        key={index}
                    >
                        <img className='bg-blue-50 w-full h-48 object-cover' src={item.image} alt="" />
                        <div className='p-4'>
                            <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : 'text-gray-500'} `}>
                                <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></p>
                                <p>{item.available ? 'Available' : 'Not Available'}</p>
                            </div>
                            <p className='text-gray-900 text-lg font-medium'>{item.name}</p>

                            {/* Hiển thị các chuyên môn dạng tags */}
                            <div className='flex flex-wrap gap-1 mt-1'>
                                {item.speciality.slice(0, 3).map((spec, idx) => (
                                    <span key={idx} className='text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600'>
                                        {spec}
                                    </span>
                                ))}
                                {item.speciality.length > 3 && <span className='text-[10px] text-gray-500'>+{item.speciality.length - 3} more</span>}
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className='text-gray-500 col-span-full text-center py-10'>No nurses found for this speciality.</p>
                )}
            </div>
        </div>
    )
}

export default Nurses;