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
  const [bookingMode, setBookingMode] = useState('Clinic');

  // Map cho khớp với dữ liệu trong DB (availableTime.day)
  const dbDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    if (doctors.length === 0) {
      await getDoctorsData();
    }
    const docInfoFound = doctors.find(doc => doc._id === docId);
    if (docInfoFound) {
      setDocInfo(docInfoFound);
    }
  }

  const fetchDocReviews = async () => {
    if (!docId) return;
    try {
      const { data } = await axios.get(backendUrl + `/api/doctor/reviews/${docId}`)
      if (data.success) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error("Lỗi lấy review:", error)
    }
  }

  const getAvailableSlots = async () => {
    if (!docInfo || !docInfo.availableTime) return;

    let allSlots = []
    let today = new Date()

    for (let i = 0; i < 14; i++) {
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      let dayName = dbDays[currentDate.getDay()];
      let daySchedule = docInfo.availableTime.find(item => item.day === dayName);
      let daySlots = [];

      if (daySchedule && daySchedule.sessions) {
        daySchedule.sessions.forEach(session => {
          let [startHour, startMin] = session.start.split(':').map(Number);
          let [endHour, endMin] = session.end.split(':').map(Number);
          let duration = session.duration || 30;

          let currentSlotDate = new Date(currentDate);
          currentSlotDate.setHours(startHour, startMin, 0, 0);

          let endSessionDate = new Date(currentDate);
          endSessionDate.setHours(endHour, endMin, 0, 0);

          if (i === 0) {
            let now = new Date();
            if (currentSlotDate < now) {
              currentSlotDate = new Date(now);
              let minutes = currentSlotDate.getMinutes();
              if (minutes > 30) {
                currentSlotDate.setHours(currentSlotDate.getHours() + 1);
                currentSlotDate.setMinutes(0);
              } else {
                currentSlotDate.setMinutes(30);
              }
              currentSlotDate.setSeconds(0);
            }
          }

          while (currentSlotDate < endSessionDate) {
            let timeStart = new Date(currentSlotDate);
            let timeEnd = new Date(currentSlotDate);
            timeEnd.setMinutes(timeEnd.getMinutes() + duration);

            let formattedStart = `${timeStart.getHours().toString().padStart(2, '0')}:${timeStart.getMinutes().toString().padStart(2, '0')}`;
            let formattedEnd = `${timeEnd.getHours().toString().padStart(2, '0')}:${timeEnd.getMinutes().toString().padStart(2, '0')}`;
            let slotRange = `${formattedStart} - ${formattedEnd}`;

            const slotDateStr = `${currentDate.getDate()}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}`;
            const bookedSlots = docInfo.slots_booked || {};
            const isSlotAvailable = bookedSlots[slotDateStr] && bookedSlots[slotDateStr].includes(formattedStart) ? false : true; // Lưu ý: Check booked theo giờ bắt đầu

            if (isSlotAvailable) {
              daySlots.push({
                datetime: timeStart,
                time: slotRange,
                startTime: formattedStart // [Thêm] Lưu giờ bắt đầu để tiện sử dụng nếu cần
              });
            }

            currentSlotDate.setMinutes(currentSlotDate.getMinutes() + duration);
          }
        });
        daySlots.sort((a, b) => a.datetime - b.datetime);
      }
      allSlots.push(daySlots);
    }
    setDocSlots(allSlots)
  }

  // --- HÀM BOOK APPOINTMENT ĐÃ SỬA ---
  const bookAppointments = async () => {
    if (!token) {
      toast.error("You need to be logged in to book an appointment")
      return navigate('/login')
    }
    if (!slotTime) return toast.warning("Please select a time slot");

    try {
      // 1. [SỬA] Tính ngày dựa trên index thay vì lấy từ mảng slot (tránh lỗi nếu ngày đó không có slot)
      const date = new Date()
      date.setDate(date.getDate() + slotIndex)

      const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`

      // 2. [SỬA] Tách giờ bắt đầu từ chuỗi range "HH:mm - HH:mm"
      // slotTime hiện tại là: "08:00 - 08:30" => Lấy "08:00"
      const finalTime = slotTime.split(' - ')[0];

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment',
        {
          docId,
          slotDate,
          slotTime: finalTime, // Gửi giờ sạch (08:00)
          appointmentType: bookingMode
        },
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
      console.error(error)
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
    <div className='pb-10'>
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
            <StarRating rating={docInfo.averageRating} />
            <p className='text-sm text-gray-800 font-medium'>
              {docInfo.averageRating > 0 ? docInfo.averageRating.toFixed(1) : "0.0"}
            </p>
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

        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4 pb-2'>
          {docSlots.length > 0 && docSlots.map((item, index) => {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + index);

            // Dù ngày đó không có slot (item rỗng), ta vẫn cho phép click để xem (hoặc disable tùy ý)
            // Logic ở đây là disable ngày quá khứ hoặc ngày không có lịch nếu cần
            const hasSlots = item && item.length > 0;

            return (
              <div
                onClick={() => setSlotIndex(index)} // Luôn cho phép click để đổi ngày xem
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer transition-all ${slotIndex === index ? 'bg-primary text-white scale-105' : 'border border-gray-200 hover:border-primary'}`}
                key={index}
              >
                <p className='text-xs'>{daysOfWeek[currentDate.getDay()]}</p>
                <p>{currentDate.getDate()}</p>
              </div>
            )
          })}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length > 0 && docSlots[slotIndex]?.length > 0 ? (
            docSlots[slotIndex].map((item, index) => (
              <p key={index} onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer transition-all ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-500 border border-gray-300 hover:border-primary'}`}>
                {item.time}
              </p>
            ))
          ) : (
            <p className='text-gray-400 italic text-sm py-2'>Không có lịch khám nào vào ngày này.</p>
          )}
        </div>

        <button onClick={bookAppointments} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 hover:brightness-90 transition-all shadow-lg active:scale-95'>
          Book an appointment {bookingMode === 'Remote' ? '(Remote)' : ''}
        </button>
      </div>

      {/* review section */}
      <div className='mt-10 mx-5 sm:mx-0'>
        <p className='text-xl font-medium text-gray-800 mb-5'>
          Phản hồi bệnh nhân
          <span className='text-base font-normal text-gray-500 ml-2'>
            ({reviews.length} reviews)
          </span>
        </p>

        <div className='flex flex-col gap-6'>
          {reviews.length > 0 ? (
            reviews.map((item, index) => (
              <div key={index} className='pb-4 bg-gray-50 p-4 rounded-lg border border-gray-100'>
                <div className='flex items-center gap-3 mb-2'>
                  <img
                    className='w-10 h-10 rounded-full object-cover border border-white shadow-sm'
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
                <p className='text-gray-600 text-sm mt-1 italic'>"{item.comment}"</p>
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