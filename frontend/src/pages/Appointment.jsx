import React, { useContext, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { useState } from 'react'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {

  const { docId } = useParams()
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState("")
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [bookingMode, setBookingMode] = useState('Clinic');
  // Component hiển thị sao (Reusable)
  const StarRating = ({ rating }) => {
    return (
      <div className="flex text-yellow-500">
        {[...Array(5)].map((_, index) => (
          <span key={index} className={index < Math.round(rating) ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const fetchDocInfo = async () => {
    if (doctors.length === 0) {
      await getDoctorsData();
    }
    const docInfoFound = doctors.find(doc => doc._id === docId);

    if (docInfoFound) {
      setDocInfo(docInfoFound)
      // Mặc định lấy từ docInfo, nhưng sẽ được update chính xác hơn khi fetch reviews
      setAvgRating(docInfoFound.averageRating || 0)
    }
  }

  // --- 1. CẬP NHẬT LOGIC TÍNH ĐIỂM TRUNG BÌNH ---
  const fetchDocReviews = async () => {
    try {
      const { data } = await axios.get(backendUrl + `/api/doctor/reviews/${docId}`)
      if (data.success) {
        setReviews(data.reviews)

        // Tính toán trung bình cộng
        if (data.reviews.length > 0) {
          const total = data.reviews.reduce((acc, curr) => acc + curr.rating, 0)
          setAvgRating(total / data.reviews.length)
        } else {
          setAvgRating(0)
        }
      }
    } catch (error) {
      console.log("Lỗi lấy review")
    }
  }

  const getAvailableSlots = async () => {
    if (!docInfo || !docInfo.slots_booked) {
      return;
    }
    setDocSlots([])
    let today = new Date()
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      if (i === 0) {
        if (i === 0) {
          let currentHour = currentDate.getHours();
          let currentMinute = currentDate.getMinutes();

          if (currentHour >= 10) {
            // Nếu đã qua 10h, tính toán như bình thường
            currentDate.setHours(currentHour + 1)
            currentDate.setMinutes(currentMinute > 30 ? 30 : 0)
          } else {
            // Nếu chưa đến 10h sáng (ví dụ 8h, 9h), set cứng là 10:00
            currentDate.setHours(10)
            currentDate.setMinutes(0)
          }
        } else {
          currentDate.setHours(10)
          currentDate.setMinutes(0)
        }
      } else {

        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }


      currentDate.setSeconds(0);
      currentDate.setMilliseconds(0);
      let timeSlots = []
      while (currentDate < endTime) {
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';

        // Chuyển đổi sang định dạng 12h
        let displayHour = hours % 12;
        displayHour = displayHour ? displayHour : 12;
        let displayMinute = minutes < 10 ? '0' + minutes : minutes;

        let formatedTime = `${displayHour}:${displayMinute} ${ampm}`;

        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()

        const slotDate = day + '_' + month + '_' + year
        const slotTime = formatedTime

        const bookedSlots = docInfo.slots_booked || {};

        // Kiểm tra slot
        const isSlotAvailable = bookedSlots[slotDate] && bookedSlots[slotDate].includes(slotTime) ? false : true;

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formatedTime
          })
        }
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      setDocSlots((prev) => [...prev, timeSlots])
    }
  }

  const bookAppointments = async () => {
    if (!token) {
      toast.error("You need to be logged in to book an appointment")
      return navigate('/login')
    }
    try {
      const date = docSlots[slotIndex][0].datetime
      let day = date.getDate()
      let month = date.getMonth() + 1
      let year = date.getFullYear()
      const slotDate = day + '_' + month + '_' + year

      // Log để debug xem gửi đi cái gì
      console.log("Booking info:", { docId, slotDate, slotTime, appointmentType: bookingMode });

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment',
        { docId, slotDate, slotTime, appointmentType: bookingMode },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)

        // Cập nhật lại dữ liệu bác sĩ ngay lập tức để UI render lại slot đã mất
        await getDoctorsData()
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])

  useEffect(() => {
    fetchDocInfo()
    fetchDocReviews()
  }, [doctors, docId])

  return docInfo && (
    <div>
      {/* ---Doctor details--- */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>

          {/* Tên bác sĩ */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
          </p>

          {/* Degree, Specialty, Experience */}
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree}-{docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full '>{docInfo.experience}</button>
          </div>

          {/* --- 2. HIỂN THỊ RATING VÀ SỐ LƯỢNG ĐÁNH GIÁ TẠI ĐÂY --- */}
          <div className='flex items-center gap-2 mt-2'>
            <StarRating rating={avgRating} />
            <p className='text-sm text-gray-800 font-medium'>
              {avgRating > 0 ? avgRating.toFixed(1) : "0"}
            </p>
            <p className='text-xs text-gray-500'>
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </p>
          </div>
          {/* -------------------------------------------------------- */}

          {/* Doctor about */}
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
              About <img src={assets.info_icon} alt='' />
            </p>
            <p className='text-sm text-gray-500 max-w-[1000px] mt-1'>
              {docInfo.about}
            </p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
        </div>
      </div>
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking Slots</p>

        {/* --- 2. GIAO DIỆN CHỌN MODE (THÊM MỚI VÀO ĐÂY) --- */}
        <div className="flex gap-4 mt-4 mb-4">
          {/* Nút Tại phòng khám */}
          <button
            onClick={() => setBookingMode('Clinic')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 ${bookingMode === 'Clinic'
              ? 'bg-primary text-white border-primary shadow-md transform scale-105'
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
              }`}
          >
            {/* Bạn có thể thay bằng SVG icon bệnh viện */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            At Clinic
          </button>

          {/* Nút Tư vấn từ xa */}
          <button
            onClick={() => setBookingMode('Remote')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 ${bookingMode === 'Remote'
              ? 'bg-primary text-white border-primary shadow-md transform scale-105'
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
              }`}
          >
            {/* Bạn có thể thay bằng SVG icon video */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263-12.63a1.5 1.5 0 00-1.794-1.794l-12.63 1.263a3.75 3.75 0 105.486 5.486L19.5 3.51z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l-1.41 1.41a2.25 2.25 0 01-3.18 0l-1.41-1.41m-1.5-1.5l-1.41 1.41a2.25 2.25 0 01-3.18 0l-1.41-1.41m9 9l-1.41 1.41a2.25 2.25 0 01-3.18 0l-1.41-1.41" />
            </svg>
            Remote Consultation
          </button>
        </div>
        {/* --------------------------------------------- */}

        {/* Danh sách ngày (Giữ nguyên) */}
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots.map((item, index) => (
            <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`} key={index}>
              <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
              <p>{item[0] && item[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Danh sách giờ (Giữ nguyên) */}
        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots[slotIndex].map((item, index) => (
            <p onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
              {item.time.toLowerCase()}
            </p>
          ))}
        </div>

        {/* Nút Đặt lịch */}
        <button onClick={bookAppointments} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'>
          Book an appointment {bookingMode === 'Remote' ? '(Remote)' : ''}
        </button>
      </div>

      {/* Related Doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment