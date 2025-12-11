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
  const daysOfWeeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)

  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState("")
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const fetchDocInfo = async () => {
    if (doctors.length === 0) {
      // Tải lại toàn bộ nếu mảng rỗng
      await getDoctorsData();
    }
    const docInfoFound = doctors.find(doc => doc._id === docId);

    if (docInfoFound) {
      setDocInfo(docInfoFound)
      setAvgRating(docInfoFound.averageRating || 0)
    }

  }


  /// review panel
  const fetchDocReviews = async () => {
    try {
      // Giả sử API là: GET /api/doctor/reviews/:docId
      // Nếu bạn chưa viết API này, danh sách sẽ rỗng
      const { data } = await axios.get(backendUrl + `/api/doctor/reviews/${docId}`)
      if (data.success) {
        setReviews(data.reviews)
        // Nếu muốn tính trung bình cộng tại frontend (tùy chọn)
        // const total = data.reviews.reduce((acc, curr) => acc + curr.rating, 0)
        // setAvgRating(total / data.reviews.length)
      }
    } catch (error) {
      console.log("Chưa có API lấy review hoặc lỗi mạng")
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
        if (today > endTime) {
          continue
        }
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      }
      else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }
      let timeSlots = []
      while (currentDate < endTime) {
        let formatedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()
        const slotDate = day + '_' + month + '_' + year

        const slotTime = formatedTime

        const bookedSlots = docInfo.slots_booked || {};
        const isSlotAvailable = bookedSlots[slotDate] && bookedSlots[slotDate].includes(slotTime) ? false : true;

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formatedTime
          })

        }






        //tang thoi gian 30p
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      if (timeSlots.length > 0) {
        setDocSlots((prev) => [...prev, timeSlots])
      }
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
      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
        console.log(data.message)
      }



    } catch (error) {
      console.log(error)
      toast.error(error.message)

    }
  }
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


  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])


  useEffect(() => {
    console.log(docSlots)
  }, [docSlots])
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
          {/* ---DocInfo : name ,degree, experience --- */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
          </p>

          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree}-{docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full '>{docInfo.experience}</button>
          </div>

          {/* ---Doctor about--- */}
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
      {/* ---Booking slots--- */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking slots</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4 '>
          {
            docSlots.length && docSlots.map((item, index) => (
              <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer flex-shrink-0 ${slotIndex === index ? 'bg-primary text-white ' : 'border border-gray-200'}`} key={index}>
                <p>{item[0] && daysOfWeeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))
          }
        </div>
        <div className='flex flex-nowrap items-center gap-3 w-full overflow-x-scroll mt-4 scrollbar scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-100 '>
          {docSlots.length && docSlots[slotIndex].map((item, index) => (
            <p onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
              {item.time.toLowerCase()}
            </p>
          ))}
        </div>
        <button onClick={bookAppointments} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'>Book an appointment</button>
      </div>
      {/* Doctor review panel */}
      <div className='sm:ml-72 sm:pl-4 mt-8'>
        <p className='text-gray-800 font-medium text-xl mb-4'>Reviews & Ratings</p>

        {/* Nếu chưa có review nào */}
        {reviews.length === 0 ? (
          <p className='text-gray-500 text-sm italic'>No reviews yet. Be the first to book and review!</p>
        ) : (
          <div className='flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin'>
            {reviews.map((item, index) => (
              <div key={index} className='border-b border-gray-100 pb-4'>
                <div className='flex items-center gap-3 mb-2'>
                  {/* Avatar User (dùng ảnh mặc định nếu không có) */}
                  <img
                    className='w-10 h-10 rounded-full object-cover'
                    src={item.userId?.image || assets.profile_pic || "https://via.placeholder.com/150"}
                    alt=""
                  />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>{item.userId?.name || "Anonymous User"}</p>
                    <div className='flex items-center gap-2'>
                      <StarRating rating={item.rating} />
                      <p className='text-xs text-gray-400'>{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <p className='text-gray-600 text-sm ml-14'>{item.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* List doctor related */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />

    </div>

  )
}

export default Appointment