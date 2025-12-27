import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

// Import thư viện PDF
import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import blobStream from 'blob-stream';

const AllAppointment = () => {

  // Lấy data và hàm từ Context
  const {
    aToken, appointments, getAllAppointments, cancelAppointment,
    medicines, getMedicines, savePrescriptionToDb, loadPatientHistory
  } = useContext(AdminContext)

  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

  // State bộ lọc
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filteredAppointments, setFilteredAppointments] = useState([])

  // --- STATE: MODAL KÊ ĐƠN ---
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentAppt, setCurrentAppt] = useState(null);


  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');


  const [prescriptionList, setPrescriptionList] = useState([
    { medicineId: '', name: '', quantity: 1, dosage: '', price: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE: MODAL LỊCH SỬ BỆNH ÁN ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (aToken) {
      getAllAppointments();
      getMedicines(); // Lấy danh sách thuốc cho dropdown
    }
  }, [aToken])

  // Logic Lọc danh sách
  useEffect(() => {
    if (appointments) {
      let temp = appointments.slice()
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


  // ==========================================
  // 1. CÁC HÀM XỬ LÝ KÊ ĐƠN THUỐC
  // ==========================================

  const openPrescribeModal = (item) => {
    setCurrentAppt(item);
    setDiagnosis(item.diagnosis || '');
    setSymptoms(item.symptoms || ''); // <--- LOAD TRIỆU CHỨNG CŨ

    setPrescriptionList(item.prescription && item.prescription.length > 0
      ? item.prescription
      : [{ medicineId: '', name: '', quantity: 1, dosage: '', price: 0 }]
    );
    setShowPrescriptionModal(true);
  }

  const addRow = () => {
    setPrescriptionList([...prescriptionList, { medicineId: '', name: '', quantity: 1, dosage: '', price: 0 }]);
  }

  const removeRow = (index) => {
    const list = [...prescriptionList];
    list.splice(index, 1);
    setPrescriptionList(list);
  }

  const handleDrugChange = (index, field, value) => {
    const list = [...prescriptionList];
    if (field === 'name') {
      const selectedDrug = medicines.find(m => m.name === value);
      list[index].name = value;
      list[index].medicineId = selectedDrug ? selectedDrug._id : '';
      list[index].price = selectedDrug ? selectedDrug.price : 0;
    } else {
      list[index][field] = value;
    }
    setPrescriptionList(list);
  }

  // ==========================================
  // 2. CÁC HÀM XỬ LÝ LỊCH SỬ BỆNH ÁN
  // ==========================================

  const openHistory = async (userId) => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    // Gọi API lấy lịch sử (Hàm này phải có trong AdminContext)
    const data = await loadPatientHistory(userId);
    if (data && data.length > 0) {

      data.sort((a, b) => {
        // 1. Chuyển đổi slotDate (dạng "DD_MM_YYYY") và slotTime (dạng "HH:mm") thành đối tượng Date chuẩn
        // Giả sử slotDate lưu dạng: 20_12_2025
        const datePartsA = a.slotDate.split('_');
        const timePartsA = a.slotTime.split(':');
        const dateTimeA = new Date(
          datePartsA[2],      // Year
          datePartsA[1] - 1,  // Month (0-11)
          datePartsA[0],      // Day
          timePartsA[0],      // Hour
          timePartsA[1]       // Minute
        );

        const datePartsB = b.slotDate.split('_');
        const timePartsB = b.slotTime.split(':');
        const dateTimeB = new Date(
          datePartsB[2],
          datePartsB[1] - 1,
          datePartsB[0],
          timePartsB[0],
          timePartsB[1]
        );

        // 2. So sánh: Mới nhất (B) nằm trên Cũ nhất (A)
        return dateTimeB - dateTimeA;
      });
    }
    setPatientHistory(data || []);
    setHistoryLoading(false);
  };

  // ==========================================
  // 3. LOGIC IN PDF & LƯU
  // ==========================================

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

      const titleWidth = doc.widthOfString('PHÒNG KHÁM PRESCRIPTO');
      const titleX = (doc.page.width - titleWidth) / 2;
      doc.moveTo(titleX, doc.y).lineTo(titleX + titleWidth, doc.y).stroke();

      doc.moveDown(0.5);
      doc.fontSize(12).text('ĐƠN THUỐC', { align: 'center' });
      doc.fontSize(9).text(`Mã: #${currentAppt._id.slice(-6).toUpperCase()}`, { align: 'right' });
      doc.moveDown(1);

      // --- 3. Thông tin bệnh nhân (Đã sửa khung và font) ---
      const startX = 30;
      const pageWidth = doc.page.width;
      const rightMargin = 30;
      const contentWidth = pageWidth - startX - rightMargin;

      // Lưu vị trí Y bắt đầu để vẽ khung sau khi biết chiều cao nội dung
      const startY = doc.y;

      doc.fontSize(10);

      // Dòng 1: Họ tên (In đậm) + Tuổi (Thường)
      doc.text(`Họ tên: `, startX + 10, doc.y, { continued: true });
      doc.font('Roboto').text(`${currentAppt.userData?.name}`, { continued: true, stroke: true }); // In đậm tên
      // Bỏ stroke ở phần tuổi

      doc.font('Roboto').text(`                             Tuổi: ${calculateAge(currentAppt.userData?.dob) || 'N/A'}`, { stroke: false });
      doc.moveDown(0.5);

      // Dòng 2: Địa chỉ
      doc.text(`Địa chỉ: ${currentAppt.userData?.address?.line1 || '...'}`, startX + 10, doc.y);
      doc.moveDown(0.5);

      // Dòng 3: Triệu chứng
      doc.text(`Triệu chứng: `, startX + 10, doc.y, { continued: true });
      doc.font('Roboto').text(`${symptoms || 'Chưa ghi nhận'}`, { oblique: true });
      doc.moveDown(0.5);

      // Dòng 4: Chẩn đoán
      doc.text(`Chẩn đoán: `, startX + 10, doc.y, { continued: true });
      doc.font('Roboto').text(`${diagnosis || 'Chưa ghi nhận'}`, { underline: true });
      doc.moveDown(1);

      // Tính chiều cao thực tế và vẽ khung
      const boxHeight = doc.y - startY + 5; // Thêm chút padding dưới
      doc.rect(startX, startY - 5, contentWidth, boxHeight).stroke('#333'); // Vẽ khung bao quanh

      doc.moveDown(2); // Thoát khỏi khung

      // 4. Danh sách thuốc
      doc.fontSize(11).text('CHỈ ĐỊNH THUỐC:', { underline: true });
      doc.moveDown(0.8);

      let y = doc.y;

      prescriptionList.forEach((drug, i) => {
        if (!drug.name) return;

        doc.fontSize(11).text(`${i + 1}.`, startX, y, { width: 20 });
        doc.font('Roboto').text(drug.name, startX + 25, y);

        doc.fontSize(10).text(`SL: ${drug.quantity}`, 300, y, { width: 90, align: 'right' });

        y += 16;
        doc.fillColor('#555');
        // Hiển thị cách dùng, nếu không có thì để trống
        doc.fontSize(9).text(`Cách dùng: ${drug.dosage || ''}`, startX + 25, y, { oblique: true });
        doc.fillColor('black');

        y += 22;
        doc.moveTo(startX, y - 8).lineTo(pageWidth - rightMargin, y - 8).strokeColor('#eee').stroke().strokeColor('black');
      });

      // 5. Tính tiền
      doc.moveDown(2);
      const fmtNum = (num) => new Intl.NumberFormat('vi-VN').format(num);

      // Tính toán lại tổng tiền
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
        doc.text(`${currency}${fmtNum(value)}`, billStartX, billY, { width: billWidth, align: 'right' });
        doc.fillColor('black');
        billY += 20; // Tăng khoảng cách dòng
      };

      drawRow('Phí khám bệnh:', baseFee);
      drawRow('Tiền thuốc:', medicineTotal);

      doc.moveTo(billStartX, billY).lineTo(pageWidth - rightMargin, billY).stroke();
      billY += 8;
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

  // Hàm Lưu & In
  const handleSaveAndPrint = async () => {
    if (!diagnosis) {
      alert("Vui lòng nhập chẩn đoán bệnh!");
      return;
    }

    setIsSaving(true);

    // Lọc bỏ dòng trống
    const validMedicines = prescriptionList.filter(item => item.name && item.name.trim() !== '');

    const success = await savePrescriptionToDb({
      appointmentId: currentAppt._id,
      diagnosis: diagnosis,
      medicines: validMedicines,
      symptoms: symptoms
    });

    setIsSaving(false);

    if (success) {
      generatePDF();
      setShowPrescriptionModal(false);
      getAllAppointments(); // Cập nhật lại list bên ngoài
    }
  };


  // ==========================================
  // 4. RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className='w-full max-w-6xl m-5'>

      <div className="flex justify-between items-center mb-3">
        <p className='text-lg font-medium'>All Appointments</p>
      </div>

      {/* THANH CÔNG CỤ LỌC */}
      <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500'>Trạng thái:</label>
          <select onChange={(e) => setFilterStatus(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-primary'>
            <option value="All">Tất cả</option>
            <option value="Pending">Đang chờ</option>
            <option value="Completed">Đã xong</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500'>Ngày khám:</label>
          <input type="date" onChange={(e) => setFilterDate(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-primary' />
        </div>
      </div>

      {/* DANH SÁCH CUỘC HẸN */}
      <div className='bg-white border rounded text-sm min-h-[60vh] max-h-[80vh] overflow-y-scroll'>

        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b font-medium bg-gray-50'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor & Mode</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>

            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full' src={item.userData?.image || assets.upload_area} alt="" />
              <div className='flex flex-col'>
                <p className='font-medium text-gray-800'>{item.userData?.name || "Deleted User"}</p>

                {/* --- NÚT XEM BỆNH ÁN --- */}
                <button
                  onClick={() => openHistory(item.userData?._id)}
                  className='text-xs text-blue-500 hover:underline hover:text-blue-700 text-left flex items-center gap-1 mt-0.5'
                >
                  📂 Xem bệnh án
                </button>
              </div>
            </div>

            <p className='max-sm:hidden'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>

            <div className='flex items-center gap-2'>
              <img className='w-8 h-8 rounded-full bg-gray-200' src={item.docData.image} alt="" />
              <p>{item.docData.name}</p>
              <span className={`text-xs w-fit px-2 py-0.5 rounded-full border ${item.appointmentType === 'Remote' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                {item.appointmentType === 'Remote' ? 'Remote' : 'Clinic'}
              </span>
            </div>


            <p>{currency}{item.amount}</p>

            <div className='flex items-center gap-2'>
              {item.cancelled
                ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted
                  ? <div className='flex items-center gap-2'>
                    <p className='text-green-500 text-xs font-medium'>Completed</p>

                    {/* --- NÚT KÊ ĐƠN & IN --- */}
                    <button
                      onClick={() => openPrescribeModal(item)}
                      className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors border border-blue-200"
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


      {/* --- MODAL 1: KÊ ĐƠN THUỐC --- */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">📋 Kê Đơn Thuốc (#{currentAppt?._id.slice(-4)})</h2>
              <button onClick={() => setShowPrescriptionModal(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Info Bệnh nhân */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Bệnh nhân</p>
                  <p className="font-semibold text-gray-800">{currentAppt?.userData?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Bác sĩ</p>
                  <p className="font-semibold text-gray-800">{currentAppt?.docData?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Hình thức</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${currentAppt?.appointmentType === 'Remote'
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                    {currentAppt?.appointmentType === 'Remote' ? 'Remote (Từ xa)' : 'Clinic (Tại chỗ)'}
                  </span>
                </div>
              </div>
              {/* Triệu chứng */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Lý do khám / Triệu chứng <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-blue-500 bg-yellow-50"
                  rows="2"
                  placeholder="VD: Ho nhiều về đêm, sốt nhẹ, đau họng..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                ></textarea>
              </div>
              {/* Chẩn đoán */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Chẩn đoán bệnh <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-blue-500"
                  rows="2"
                  placeholder="Ví dụ: Viêm họng cấp..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                ></textarea>
              </div>

              {/* Danh sách thuốc */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Chỉ định thuốc</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {prescriptionList.map((drug, index) => (
                    <div key={index} className="flex gap-3 mb-3 items-start">
                      <span className="pt-2.5 text-gray-500 font-bold w-5">{index + 1}.</span>

                      <div className="flex-1">
                        {/* Dropdown chọn thuốc */}
                        <select
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 mb-1 bg-white"
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
                        <input
                          type="text" placeholder="Cách dùng (VD: Sáng 1...)"
                          className="w-full border border-gray-300 rounded p-2 text-xs"
                          value={drug.dosage}
                          onChange={(e) => handleDrugChange(index, 'dosage', e.target.value)}
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="number" min="1"
                          className="w-full border border-gray-300 rounded p-2 text-sm text-center"
                          value={drug.quantity}
                          onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <button onClick={() => removeRow(index)} className="mt-2 text-red-400 hover:text-red-600">🗑️</button>
                    </div>
                  ))}
                  <button onClick={addRow} className="text-blue-600 text-sm font-medium hover:underline">+ Thêm dòng thuốc</button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button onClick={() => setShowPrescriptionModal(false)} className="px-5 py-2 rounded border hover:bg-gray-100">Hủy</button>
              <button
                onClick={handleSaveAndPrint}
                disabled={isSaving}
                className={`px-6 py-2 rounded text-white font-medium flex items-center gap-2 ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isSaving ? 'Đang lưu...' : '💾 Lưu & In PDF'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* --- MODAL 2: LỊCH SỬ BỆNH ÁN (HỒ SƠ) --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">

            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 border-b bg-blue-50 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                📂 Hồ Sơ Bệnh Án
                <span className="text-sm font-normal text-gray-500">(Lịch sử khám bệnh)</span>
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-3xl text-gray-400 hover:text-red-500 transition-colors">&times;</button>
            </div>

            {/* Nội dung chính (Scrollable) */}
            <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
              {historyLoading ? (
                <div className="flex flex-col justify-center items-center h-full text-gray-500 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p>Đang tải dữ liệu hồ sơ...</p>
                </div>
              ) : patientHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                  <p className="text-4xl mb-2">📭</p>
                  <p>Bệnh nhân này chưa có lịch sử khám bệnh nào.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timeline Loop */}
                  {patientHistory.map((historyItem, index) => (
                    <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative hover:shadow-md transition-shadow">

                      {/* 1. Header Card: Ngày giờ & Bác sĩ */}
                      <div className="flex justify-between items-start mb-4 border-b pb-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bác sĩ phụ trách</p>
                          <p className="text-blue-700 font-bold text-lg flex items-center gap-2">
                            {historyItem.docData?.name || 'N/A'}
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-normal">
                              {historyItem.docData?.speciality}
                            </span>
                          </p>
                        </div>




                        <div className="text-right flex flex-col items-end gap-1">
                          {/* --- HIỂN THỊ MODE TẠI ĐÂY --- */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${historyItem.appointmentType === 'Remote'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                            {historyItem.appointmentType === 'Remote' ? 'REMOTE' : 'CLINIC'}
                          </span>
                          {/* ----------------------------- */}
                        </div>





                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded inline-block mb-1">
                            {slotDateFormat(historyItem.slotDate)}
                          </div>
                          <p className="text-xs text-gray-500">{historyItem.slotTime}</p>
                        </div>
                      </div>

                      {/* 2. Nội dung Lâm sàng (Triệu chứng & Chẩn đoán) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                        {/* CỘT TRÁI: Triệu chứng (Dữ liệu mới thêm) */}
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                          <p className="text-xs text-yellow-700 uppercase font-bold mb-1">
                            🤒 Lý do khám / Triệu chứng
                          </p>
                          <p className="text-gray-800 text-sm italic min-h-[1.5rem]">
                            "{historyItem.symptoms || 'Không có ghi nhận'}"
                          </p>
                        </div>

                        {/* CỘT PHẢI: Chẩn đoán */}
                        <div className="bg-green-50 p-3 rounded border border-green-100">
                          <p className="text-xs text-green-700 uppercase font-bold mb-1">
                            👨‍⚕️ Kết luận / Chẩn đoán
                          </p>
                          <p className="text-gray-900 text-sm font-semibold min-h-[1.5rem]">
                            {historyItem.diagnosis || 'Chưa có chẩn đoán'}
                          </p>
                        </div>
                      </div>

                      {/* 3. Đơn thuốc đã kê */}
                      {historyItem.prescription && historyItem.prescription.length > 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="font-bold text-xs text-gray-500 mb-3 uppercase flex items-center gap-2">
                            💊 Đơn thuốc đã dùng
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                            {historyItem.prescription.map((med, i) => (
                              <div key={i} className="flex items-center text-sm border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                <span className="w-5 text-gray-400 text-xs">{i + 1}.</span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-700">{med.name}</span>
                                  {med.dosage && <span className="text-gray-500 text-xs italic block ml-0">HD: {med.dosage}</span>}
                                </div>
                                <span className="font-bold text-gray-600 ml-2">x{med.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic pl-2">Không kê đơn thuốc nào trong lần khám này.</p>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer đóng Modal */}
            <div className="p-3 bg-gray-50 border-t flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium">
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default AllAppointment