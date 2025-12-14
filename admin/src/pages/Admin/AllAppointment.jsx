import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import blobStream from 'blob-stream';
const AllAppointment = () => {

  const { aToken, appointments, getAllAppointments, cancelAppointment, medicines, getMedicines, savePrescriptionToDb } = useContext(AdminContext)
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [printingId, setPrintingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [currentAppt, setCurrentAppt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionList, setPrescriptionList] = useState([
    { medicineId: '', name: '', quantity: 1, dosage: '', price: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);


  const openModal = (item) => {
    setCurrentAppt(item);
    // Nếu cuộc hẹn đã có đơn thuốc cũ, nạp lại để sửa. Nếu chưa, để trống.
    setDiagnosis(item.diagnosis || '');
    setPrescriptionList(item.prescription && item.prescription.length > 0
      ? item.prescription
      : [{ medicineId: '', name: '', quantity: 1, dosage: '', price: 0 }]
    );
    setShowModal(true);
  }

  // 2. Thêm dòng thuốc
  const addRow = () => {
    setPrescriptionList([...prescriptionList, { medicineId: '', name: '', quantity: 1, dosage: '', price: 0 }]);
  }

  // 3. Xóa dòng thuốc
  const removeRow = (index) => {
    const list = [...prescriptionList];
    list.splice(index, 1);
    setPrescriptionList(list);
  }

  // 4. Thay đổi thông tin thuốc (Dropdown chọn tên, nhập liều lượng...)
  const handleDrugChange = (index, field, value) => {
    const list = [...prescriptionList];

    if (field === 'name') {
      // Khi chọn tên thuốc từ dropdown -> Tự động điền ID và Giá
      const selectedDrug = medicines.find(m => m.name === value);
      list[index].name = value;
      list[index].medicineId = selectedDrug ? selectedDrug._id : '';
      list[index].price = selectedDrug ? selectedDrug.price : 0;
    } else {
      list[index][field] = value;
    }

    setPrescriptionList(list);
  }
  const handleSaveAndPrint = async () => {
    // 1. Kiểm tra chẩn đoán
    if (!diagnosis) {
      alert("Vui lòng nhập chẩn đoán bệnh!");
      return;
    }

    setIsSaving(true); // Bật trạng thái loading

    // 2. Gọi API lưu vào Database (Lọc bỏ các dòng thuốc chưa nhập tên)
    const validMedicines = prescriptionList.filter(item => item.name && item.name.trim() !== '');

    const success = await savePrescriptionToDb(
      currentAppt._id,
      diagnosis,
      validMedicines
    );

    setIsSaving(false); // Tắt loading

    // 3. Nếu lưu thành công -> In PDF và Đóng Modal
    if (success) {
      generatePDF();
      setShowModal(false);
      // Có thể gọi lại getAllAppointments() nếu muốn cập nhật lại danh sách ngay lập tức
      getAllAppointments();
    }
  };














  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  useEffect(() => {
    if (aToken) {
      getMedicines()
      getAllAppointments()
    }
  }, [aToken])

  // LOGIC LỌC
  useEffect(() => {
    if (appointments) {
      let temp = appointments.slice().reverse();

      if (filterStatus !== 'All') {
        temp = temp.filter(item => {
          if (filterStatus === 'Completed') return item.isCompleted && !item.cancelled;
          if (filterStatus === 'Cancelled') return item.cancelled;
          if (filterStatus === 'Pending') return !item.isCompleted && !item.cancelled;
          return true;
        })
      }

      if (filterDate) {
        const dateParts = filterDate.split('-');
        const formattedDate = `${Number(dateParts[2])}_${Number(dateParts[1])}_${dateParts[0]}`;
        temp = temp.filter(item => item.slotDate === formattedDate);
      }

      setFilteredAppointments(temp);
    }
  }, [appointments, filterStatus, filterDate])

















  // Helper format tiền tệ (10000 -> 10.000)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // --- HÀM TẠO FILE PDF (Đã sửa lỗi giao diện & dùng currency có sẵn) ---
  const generatePDF = async () => {
    try {
      // 1. Setup khổ giấy A5 & Font
      const doc = new PDFDocument({ size: 'A5', margin: 30 });
      const stream = doc.pipe(blobStream());

      const fontRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
      const fontBuffer = await fontRes.arrayBuffer();
      doc.registerFont('Roboto', fontBuffer);
      doc.font('Roboto');

      // 2. Header
      doc.fontSize(16).text('PHÒNG KHÁM PRESCRIPTO', { align: 'center' });

      // Gạch chân tiêu đề
      const titleWidth = doc.widthOfString('PHÒNG KHÁM PRESCRIPTO');
      const titleX = (doc.page.width - titleWidth) / 2;
      doc.moveTo(titleX, doc.y).lineTo(titleX + titleWidth, doc.y).stroke();

      doc.moveDown(0.5);
      doc.fontSize(12).text('ĐƠN THUỐC', { align: 'center' });
      doc.fontSize(9).text(`Mã: #${currentAppt._id.slice(-6).toUpperCase()}`, { align: 'right' });
      doc.moveDown(1);

      // 3. Thông tin bệnh nhân (Box xám)
      const startX = 30;
      const pageWidth = doc.page.width;
      const rightMargin = 30;
      const contentWidth = pageWidth - startX - rightMargin;

      doc.rect(startX, doc.y, contentWidth, 55).fill('#f5f5f5').stroke('#ddd');
      doc.fillColor('black');

      let infoY = doc.y + 10;
      doc.fontSize(10);

      doc.text(`Họ tên: `, startX + 10, infoY, { continued: true });
      doc.font('Roboto').text(`${currentAppt.userData?.name}`, { continued: true, stroke: true });
      doc.font('Roboto').text(`      Tuổi: ${calculateAge(currentAppt.userData?.dob)}`);

      infoY += 15;
      doc.text(`Địa chỉ: ${currentAppt.userData?.address?.line1 || '...'}`, startX + 10, infoY);

      infoY += 15;
      doc.text(`Chẩn đoán: `, startX + 10, infoY, { continued: true });
      doc.font('Roboto').text(`${diagnosis || 'Chưa ghi nhận'}`, { underline: true });

      doc.moveDown(3);

      // 4. Danh sách thuốc
      doc.fontSize(11).text('CHỈ ĐỊNH THUỐC:', { underline: true });
      doc.moveDown(0.5);

      let y = doc.y;

      prescriptionList.forEach((drug, i) => {
        if (!drug.name) return;

        // Tên thuốc
        doc.fontSize(11).text(`${i + 1}.`, startX, y, { width: 20 });
        doc.font('Roboto').text(drug.name, startX + 25, y);

        // Số lượng (Căn phải chuẩn khổ A5)
        doc.fontSize(10).text(`SL: ${drug.quantity}`, 300, y, { width: 90, align: 'right' });

        y += 15;
        doc.fillColor('#555');
        doc.fontSize(9).text(`Cách dùng: ${drug.dosage}`, startX + 25, y, { oblique: true });
        doc.fillColor('black');

        y += 20;
        doc.moveTo(startX, y - 8).lineTo(pageWidth - rightMargin, y - 8).strokeColor('#eee').stroke().strokeColor('black');
      });

      // 5. TÍNH TIỀN (Sử dụng biến currency)
      doc.moveDown(1);

      // Helper format số (1000 -> 1.000)
      const fmtNum = (num) => new Intl.NumberFormat('vi-VN').format(num);

      // Tính toán: Luôn lấy (Giá gốc bác sĩ) + (Tiền thuốc hiện tại)
      // Để tránh việc cộng dồn sai lệch khi in nhiều lần
      const medicineTotal = prescriptionList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const baseFee = currentAppt.docData.fees || 0;
      const total = baseFee + medicineTotal;

      const billStartX = 180;
      const billWidth = pageWidth - rightMargin - billStartX;
      let billY = y + 10;

      const drawRow = (label, value, isBold = false, color = 'black') => {
        doc.fontSize(10).fillColor('black').text(label, billStartX, billY);
        if (isBold) doc.font('Roboto').stroke();

        doc.fillColor(color);
        // SỬ DỤNG BIẾN CURRENCY CỦA BẠN TẠI ĐÂY
        doc.text(`${currency}${fmtNum(value)}`, billStartX, billY, { width: billWidth, align: 'right' });
        doc.fillColor('black');
        billY += 18;
      };

      drawRow('Phí khám bệnh:', baseFee);
      drawRow('Tiền thuốc:', medicineTotal);

      doc.moveTo(billStartX, billY).lineTo(pageWidth - rightMargin, billY).stroke();
      billY += 5;

      doc.fontSize(12);
      drawRow('TỔNG CỘNG:', total, true, '#d32f2f');

      // 6. Footer
      const pageHeight = doc.page.height;
      let footerY = pageHeight - 120;
      if (billY > footerY) { doc.addPage(); footerY = 50; }

      const date = new Date();
      doc.fontSize(10).text(`Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`, 250, footerY, { width: 140, align: 'center' });

      footerY += 15;
      doc.text('Bác sĩ điều trị', 250, footerY, { width: 140, align: 'center' });

      footerY += 50;
      doc.fontSize(11).text(currentAppt.docData?.name, 250, footerY, { width: 140, align: 'center', bold: true });

      doc.end();
      stream.on('finish', () => {
        const blob = stream.toBlob('application/pdf');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      });

    } catch (error) {
      console.error(error);
      alert("Lỗi tạo PDF");
    }
  }


























  return (
    <div className='w-full max-w-6xl m-5'>

      <div className="flex justify-between items-center mb-3">
        <p className='text-lg font-medium'>All Appointments</p>
      </div>

      {/* THANH CÔNG CỤ LỌC (GIỮ NGUYÊN) */}
      <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end'>
        {/* ... (Giữ nguyên code bộ lọc cũ của bạn ở đây để đỡ dài dòng) ... */}
        {/* Nếu bạn lười copy lại bộ lọc, hãy bảo tôi, tôi sẽ paste lại full bộ lọc */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500'>Trạng thái:</label>
          <select onChange={(e) => setFilterStatus(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-primary'>
            <option value="All">Tất cả</option>
            <option value="Pending">Đang chờ</option>
            <option value="Completed">Đã xong</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH CUỘC HẸN */}
      <div className='bg-white border rounded text-sm min-h-[60vh] max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b font-medium bg-gray-50'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full' src={item.userData?.image || assets.upload_area} alt="" />
              <p>{item.userData?.name || "Deleted User"}</p>
            </div>
            <p className='max-sm:hidden'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full bg-gray-200' src={item.docData?.image || assets.upload_area} alt="" />
              <p>{item.docData?.name || "Deleted Doc"}</p>
            </div>
            <p>{currency}{item.amount}</p>

            <div className='flex items-center gap-2'>
              {item.cancelled
                ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted
                  ? <div className='flex items-center gap-2'>
                    <p className='text-green-500 text-xs font-medium'>Completed</p>

                    {/* --- NÚT KÊ ĐƠN (MỞ MODAL) --- */}
                    <button
                      onClick={() => openModal(item)}
                      className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                      title="Kê đơn & In"
                    >
                      💊
                    </button>
                  </div>
                  : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer opacity-80 hover:opacity-100' src={assets.cancel_icon} alt="Cancel" />
              }
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL KÊ ĐƠN THUỐC (POPUP) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">

            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                📋 Kê Đơn Thuốc <span className="text-sm font-normal text-gray-500">(#{currentAppt?._id.slice(-4)})</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">

              {/* Thông tin nhanh */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Bệnh nhân</p>
                  <p className="font-semibold text-gray-800">{currentAppt?.userData?.name}</p>
                  <p className="text-sm text-gray-600">{calculateAge(currentAppt?.userData?.dob)} tuổi</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Bác sĩ phụ trách</p>
                  <p className="font-semibold text-gray-800">{currentAppt?.docData?.name}</p>
                  <p className="text-sm text-gray-600">{currentAppt?.docData?.speciality}</p>
                </div>
              </div>

              {/* Nhập chẩn đoán */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Chẩn đoán bệnh <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows="2"
                  placeholder="Ví dụ: Viêm họng cấp, Sốt siêu vi, Cảm cúm..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                ></textarea>
              </div>

              {/* Danh sách thuốc */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Chỉ định thuốc</label>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {prescriptionList.map((drug, index) => (
                    <div key={index} className="flex gap-3 mb-3 items-start animate-fade-in">
                      <span className="pt-2.5 text-gray-500 font-bold w-5">{index + 1}.</span>

                      {/* Chọn tên thuốc (Dropdown) */}
                      <div className="flex-1">
                        <select
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 outline-none mb-1 bg-white"
                          value={drug.name}
                          onChange={(e) => handleDrugChange(index, 'name', e.target.value)}
                        >
                          <option value="">-- Chọn thuốc --</option>
                          {medicines.map((m) => (
                            <option key={m._id} value={m.name}>
                              {m.name} (Kho: {m.stock} {m.unit})
                            </option>
                          ))}
                        </select>

                        {/* Nhập liều dùng */}
                        <input
                          type="text"
                          placeholder="Cách dùng (VD: Sáng 1, Chiều 1 sau ăn)"
                          className="w-full border border-gray-300 rounded p-2 text-xs text-gray-600 italic focus:border-blue-500 outline-none"
                          value={drug.dosage}
                          onChange={(e) => handleDrugChange(index, 'dosage', e.target.value)}
                        />
                      </div>

                      {/* Nhập số lượng */}
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          className="w-full border border-gray-300 rounded p-2 text-sm text-center focus:border-blue-500 outline-none mb-1"
                          value={drug.quantity}
                          onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                        />
                        <p className="text-xs text-center text-gray-500">Số lượng</p>
                      </div>

                      {/* Nút xóa dòng */}
                      <button
                        onClick={() => removeRow(index)}
                        disabled={prescriptionList.length === 1}
                        className={`mt-2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 ${prescriptionList.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  <button onClick={addRow} className="mt-2 text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                    + Thêm dòng thuốc
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAndPrint}
                disabled={isSaving}
                className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 shadow-sm transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
              >
                {isSaving ? 'Đang lưu...' : (
                  <>
                    <span>💾</span> Lưu & In PDF
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default AllAppointment

