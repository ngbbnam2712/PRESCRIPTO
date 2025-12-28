import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
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

  const StarRating = ({ rating }) => {
    const numRating = Number(rating) || 0;
    return (
      <div className="flex text-yellow-500 text-sm">
        {[...Array(5)].map((_, index) => (
          <span key={index} className={index < Math.round(numRating) ? "text-yellow-400" : "text-gray-300"}>★</span>
        ))}
      </div>
    );
  };
  const fetchDocInfo = async () => {
    // Nếu context chưa có data, gọi API lấy lại
    if (doctors.length === 0) {
      await getDoctorsData();
    }

    const docInfoFound = doctors.find(doc => doc._id === docId);
    if (docInfoFound) {
      setDocInfo(docInfoFound);
      // rating và totalRatings đã có sẵn trong docInfoFound từ database
    }
  }
  const fetchDocReviews = async () => {
    if (!docId) return;
    try {
      const { data } = await axios.get(backendUrl + `/api/doctor/reviews/${docId}`)
      if (data.success) {
        setReviews(data.reviews) // Chỉ set data để hiển thị list, không tính toán lại
      }
    } catch (error) {
      console.error("Lỗi lấy review:", error)
    }
  }
  const getAvailableSlots = async () => {
    if (!docInfo) return;

    let allSlots = [] // Mảng chứa toàn bộ 7 ngày
    let today = new Date()

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      // Thiết lập giờ kết thúc là 21:00 của ngày đang xét
      let endTime = new Date(today)
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      if (i === 0) {
        // Nếu là ngày hôm nay, bắt đầu từ giờ hiện tại + 1
        let curHour = currentDate.getHours()
        if (curHour >= 10) {
          currentDate.setHours(curHour + 1)
          currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
        } else {
          currentDate.setHours(10)
          currentDate.setMinutes(0)
        }
      } else {
        // Các ngày sau bắt đầu từ 10:00 sáng
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      currentDate.setSeconds(0)
      currentDate.setMilliseconds(0)

      let timeSlots = []
      while (currentDate < endTime) {
        let hours = currentDate.getHours()
        let minutes = currentDate.getMinutes()
        let ampm = hours >= 12 ? 'PM' : 'AM'
        let displayHour = hours % 12 || 12
        let displayMinute = minutes < 10 ? '0' + minutes : minutes
        let formattedTime = `${displayHour}:${displayMinute} ${ampm}`

        const slotDate = `${currentDate.getDate()}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}`
        const bookedSlots = docInfo.slots_booked || {}
        const isSlotAvailable = bookedSlots[slotDate] && bookedSlots[slotDate].includes(formattedTime) ? false : true

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime
          })
        }
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      allSlots.push(timeSlots)
    }
    setDocSlots(allSlots) // Cập nhật state 1 lần duy nhất
  }

  const bookAppointments = async () => {
    if (!token) {
      toast.error("You need to be logged in to book an appointment")
      return navigate('/login')
    }
    if (!slotTime) return toast.warning("Please select a time slot");

    try {
      const date = docSlots[slotIndex][0].datetime
      const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment',
        { docId, slotDate, slotTime, appointmentType: bookingMode },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchDocInfo()
    fetchDocReviews()
  }, [doctors, docId])

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])

  return docInfo ? (
    <div>
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            {/* Hiển thị số sao */}
            <StarRating rating={docInfo.averageRating} />

            {/* Hiển thị điểm số cụ thể */}
            <p className='text-sm text-gray-800 font-medium'>
              {docInfo.averageRating > 0 ? docInfo.averageRating.toFixed(1) : "0.0"}
            </p>

            {/* Hiển thị tổng số lượt đánh giá */}
            <p className='text-xs text-gray-500'>
              ({docInfo.totalRatings || 0} reviews)
            </p>
          </div>
          <div className='mt-3'>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900'>About <img src={assets.info_icon} alt='' /></p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
        </div>
      </div>

      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking Slots</p>
        <div className="flex gap-4 mt-4 mb-4">
          <button onClick={() => setBookingMode('Clinic')} className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${bookingMode === 'Clinic' ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>At Clinic</button>
          <button onClick={() => setBookingMode('Remote')} className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${bookingMode === 'Remote' ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>Remote</button>
        </div>

        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {docSlots.length > 0 && docSlots.map((item, index) => (
            <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`} key={index}>
              <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
              <p>{item[0] && item[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length > 0 && docSlots[slotIndex]?.map((item, index) => (
            <p key={index} onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`}>
              {item.time.toLowerCase()}
            </p>
          ))}
        </div>

        <button onClick={bookAppointments} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 hover:brightness-90 transition-all'>
          Book an appointment {bookingMode === 'Remote' ? '(Remote)' : ''}
        </button>
      </div>






      {/* review */}
      <div className='mt-10 mx-5 sm:mx-0'>
        <p className='text-xl font-medium text-gray-800 mb-5'>
          Phản hồi bệnh nhân
          <span className='text-base font-normal text-gray-500 ml-2'>
            (Hiển thị {reviews.length} bình luận mới nhất)
          </span>
        </p>

        <div className='flex flex-col gap-6'>
          {reviews.length > 0 ? (
            reviews.map((item, index) => (
              <div key={index} className='border-b border-gray-100 pb-4 bg-gray-50 p-4 rounded-lg'>
                <div className='flex items-center gap-3 mb-2'>
                  {/* Ảnh user */}
                  <img
                    className='w-10 h-10 rounded-full object-cover'
                    src={item.userId?.image || assets.upload_area}
                    alt=""
                  />
                  <div>
                    <p className='text-sm font-semibold text-gray-700'>
                      {item.userId?.name || "Anonymous User"}
                    </p>
                    <div className='scale-90 origin-left'>
                      <StarRating rating={item.rating} />
                    </div>
                  </div>
                  <p className='text-xs text-gray-400 ml-auto'>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <p className='text-gray-600 text-sm mt-1 ml-1'>{item.comment}</p>
              </div>
            ))
          ) : (
            <p className='text-gray-500 italic'>Chưa có bình luận chi tiết nào.</p>
          )}
        </div>
      </div>



      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  ) : null
}

export default Appointment