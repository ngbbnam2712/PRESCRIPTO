import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [searchParams] = useSearchParams()


  /// for review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [targetAppointmentId, setTargetAppointmentId] = useState(null)
  const handleOpenReviewModal = (item) => {
    setTargetAppointmentId(item._id) // Lưu lại ID cuộc hẹn đang đánh giá
    setReviewRating(5) // Mặc định cho 5 sao cho xông xênh
    setReviewComment('') // Reset comment cũ
    setIsReviewModalOpen(true) // Bật Modal lên
  }
  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false)
    setTargetAppointmentId(null)
  }
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.warning("Vui lòng chọn số sao đánh giá!")
      return
    }

    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/add-review',
        {
          appointmentId: targetAppointmentId,
          rating: reviewRating,
          comment: reviewComment
        },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        handleCloseReviewModal() // Đóng modal
        getUserAppointments() // Tải lại danh sách để cập nhật nút thành "Reviewed"
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }


  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }


  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })


      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log(data.appointments);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }

  }

  const cancelAppointment = async (appointmentId, payment) => {

    let confirmMessage = "";

    if (payment) {
      // Trường hợp Refund
      confirmMessage = "Cuộc hẹn này ĐÃ THANH TOÁN.\nNếu hủy, bạn sẽ được hoàn tiền sau 3-5 ngày và nhận được email xác nhận.\nBạn có chắc chắn muốn hủy?";
    } else {
      // Trường hợp Hủy thường
      confirmMessage = "Bạn có chắc chắn muốn hủy cuộc hẹn này không?";
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)


        await getUserAppointments()




      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }


  const appointmentPayment = async (appointmentId) => {
    try {
      // Gọi API tạo PayPal Payment
      const { data } = await axios.post(
        backendUrl + '/api/user/payment-paypal',
        { appointmentId },
        { headers: { token } }
      )

      if (data.success) {
        // Chuyển hướng sang trang PayPal
        window.location.replace(data.paymentUrl)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }


  const checkMeetingTime = (slotDate, slotTime) => {
    try {
      // 1. Lấy ngày tháng năm hiện tại
      const now = new Date();

      // 2. Parse slotDate (dạng "25_12_2025")
      const [day, month, year] = slotDate.split('_').map(Number);

      // 3. Parse slotTime (dạng "10:30 AM")
      let [time, modifier] = slotTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      // Đổi sang 24h
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      // 4. Tạo đối tượng Date cho cuộc hẹn
      const appointmentStart = new Date(year, month - 1, day, hours, minutes);

      // Tạo thời gian cho phép vào (Ví dụ: Trước 10 phút)
      const entryStart = new Date(appointmentStart.getTime() - 10 * 60000); // Trừ 10 phút

      // Tạo thời gian kết thúc (Ví dụ: Sau khi bắt đầu 40 phút thì hết hạn)
      const entryEnd = new Date(appointmentStart.getTime() + 40 * 60000); // Cộng 40 phút

      // 5. So sánh
      return now >= entryStart && now <= entryEnd;

    } catch (error) {
      console.error("Lỗi parse thời gian:", error);
      return false;
    }
  };




















  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Payment Successful!');
      getUserAppointments();
    } else if (searchParams.get('success') === 'false') {
      toast.error('Payment Failed!');
    }
  }, [searchParams])

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token])








  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token])


  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointment</p>
      <div>
        {appointments.map((item, index) => (
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
            <div>
              <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <div className='mt-2 mb-1'>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${item.appointmentType === 'Remote'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-green-50 text-green-600 border-green-200'
                  }`}>
                  {item.appointmentType === 'Remote' ? '💻 Remote Consultation' : '🏥 At Clinic'}
                </span>
              </div>
              <p className='text-zinc-700 font-medium mt-1 '>Address:</p>
              <p className='text-xs'>{item.docData.address.line1}</p>
              <p className='text-xs'>{item.docData.address.line2}</p>
              <p className='text-xs mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time: </span>{slotDateFormat(item.slotDate)} | {item.slotTime}</p>
            </div>
            <div></div>
            <div className='flex flex-col gap-2 justify-end'>

              {/* --- KHU VỰC 1: KHI CUỘC HẸN CHƯA HOÀN THÀNH & CHƯA HỦY --- */}
              {!item.cancelled && !item.isCompleted && (
                <>
                  {/* Nút Thanh toán Online */}
                  {!item.payment ? (
                    <button
                      onClick={() => appointmentPayment(item._id)}
                      className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'
                    >
                      Pay Online
                    </button>
                  ) : (
                    /* Nút Đã thanh toán */
                    <button className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded bg-indigo-50 text-indigo-500 cursor-default'>
                      Paid
                    </button>
                  )}

                  {/* Nút Hủy Lịch */}
                  <button
                    onClick={() => cancelAppointment(item._id, item.payment)}
                    className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-500 hover:text-white transition-all duration-300'
                  >
                    {item.payment ? 'Cancel & Refund' : 'Cancel Appointment'}
                  </button>
                </>
              )}

              {/* --- KHU VỰC 2: TRẠNG THÁI ĐẶC BIỆT --- */}

              {/* Trạng thái Đã hủy */}
              {item.cancelled && (
                <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500 bg-red-50 cursor-default'>
                  Appointment Cancelled
                </button>
              )}

              {/* Trạng thái Đã Hoàn thành -> CHUYỂN THÀNH REVIEW */}
              {item.isCompleted && (
                <>
                  {/* Trường hợp 1: Chưa đánh giá -> Hiện nút hành động */}
                  {!item.isReviewed ? (
                    <button
                      onClick={() => handleOpenReviewModal(item)} // Bạn cần viết hàm này để mở Modal
                      className='sm:min-w-48 py-2 border border-yellow-500 rounded text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all duration-300'
                    >
                      Rate & Review
                    </button>
                  ) : (
                    /* Trường hợp 2: Đã đánh giá -> Hiện trạng thái xong xuôi */
                    <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500 bg-green-50 cursor-default'>
                      Completed & Reviewed
                    </button>
                  )}
                </>
              )}
              {item.appointmentType === 'Remote' && !item.cancelled && !item.isCompleted && (
                <div className='mr-2'> {/* Thêm margin phải để tách khỏi nút khác */}
                  {checkMeetingTime(item.slotDate, item.slotTime) ? (
                    // ĐÚNG GIỜ -> NÚT SÁNG
                    <div
                      onClick={() => handleJoinVideoCall(item._id)}
                      className='w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-all shadow-lg text-white animate-bounce'
                      title="Join Video Call Now"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263-12.63a1.5 1.5 0 00-1.794-1.794l-12.63 1.263a3.75 3.75 0 105.486 5.486L19.5 3.51z" />
                      </svg>
                    </div>
                  ) : (
                    // CHƯA ĐẾN GIỜ -> NÚT MỜ
                    <div
                      className='w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 cursor-not-allowed text-gray-400'
                      title={`Chưa đến giờ hẹn (${item.slotTime})`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              )}

            </div>



          </div>
        ))}
      </div>
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-fade-in-up">

            {/* Tiêu đề */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Đánh giá dịch vụ</h2>
              <button onClick={handleCloseReviewModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            {/* Chọn Sao */}
            <div className="flex flex-col items-center mb-4">
              <p className="text-sm text-gray-600 mb-2">Bạn cảm thấy buổi khám thế nào?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`text-3xl transition-colors duration-200 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Nhập Bình luận */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét của bạn</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-primary focus:border-primary outline-none resize-none h-24"
                placeholder="Chia sẻ trải nghiệm của bạn về bác sĩ..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              ></textarea>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseReviewModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition shadow-md"
              >
                Gửi đánh giá
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default MyAppointments