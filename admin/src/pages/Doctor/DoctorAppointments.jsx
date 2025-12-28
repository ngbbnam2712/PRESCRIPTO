import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

// Import thư viện PDF
import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import blobStream from 'blob-stream';

const DoctorAppointments = () => {

    // --- 1. CONTEXT & STATE ---
    const {
        dToken,
        appointments,
        getAppointments,
        cancelAppointment,
        loadPatientHistory,
        medicines,
        getMedicines,
        savePrescriptionToDb
    } = useContext(DoctorContext);

    const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

    // State bộ lọc
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    // State Modal Lịch sử
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // State Modal Kê đơn
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [currentAppt, setCurrentAppt] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [note, setNote] = useState('');
    const [prescriptionList, setPrescriptionList] = useState([
        { name: '', quantity: 1, unit: 'Viên', dosage: 'Sáng 1, Chiều 1' }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    // --- 2. EFFECT: LOAD DATA ---
    useEffect(() => {
        if (dToken) {
            getAppointments();
            getMedicines(); // Load kho thuốc
        }
    }, [dToken]);

    // --- 3. LOGIC LỌC DANH SÁCH ---
    useEffect(() => {
        if (appointments) {
            let temp = appointments.slice().reverse();
            if (filterStatus !== 'All') {
                temp = temp.filter(item => {
                    if (filterStatus === 'Completed') return item.isCompleted && !item.cancelled;
                    if (filterStatus === 'Cancelled') return item.cancelled;
                    if (filterStatus === 'Pending') return !item.isCompleted && !item.cancelled;
                    return true;
                });
            }
            if (filterDate) {
                const dateParts = filterDate.split('-');
                const formattedDate = `${Number(dateParts[2])}_${Number(dateParts[1])}_${dateParts[0]}`;
                temp = temp.filter(item => item.slotDate === formattedDate);
            }
            setFilteredAppointments(temp);
        }
    }, [appointments, filterStatus, filterDate]);

    // --- 4. HÀM HELPER ---
    const parseDateTime = (dateStr, timeStr) => {
        try {
            const [day, month, year] = dateStr.split('_').map(Number);
            const [h, m] = timeStr.split(':').map(Number);
            return new Date(year, month - 1, day, h, m).getTime();
        } catch (error) { return 0; }
    };

    // --- 5. CHỨC NĂNG LỊCH SỬ BỆNH ÁN ---
    const openHistory = async (userId, docId) => {
        setShowHistoryModal(true);
        setHistoryLoading(true);
        const data = await loadPatientHistory(userId, docId);
        if (data && data.length > 0) {
            data.sort((a, b) => parseDateTime(b.slotDate, b.slotTime) - parseDateTime(a.slotDate, a.slotTime));
        }
        setPatientHistory(data || []);
        setHistoryLoading(false);
    };

    // --- 6. CHỨC NĂNG IN PDF (Lấy data từ item truyền vào) ---
    const printPrescription = async (appt) => {
        try {
            // Kiểm tra dữ liệu an toàn
            if (!appt || !appt.userData) {
                toast.error("Thiếu thông tin cuộc hẹn!");
                return;
            }

            const doc = new PDFDocument({ size: 'A5', margin: 30 });
            const stream = doc.pipe(blobStream());

            // Load Font
            const fontRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
            const fontBuffer = await fontRes.arrayBuffer();
            doc.registerFont('Roboto', fontBuffer);
            doc.font('Roboto');

            // --- Header ---
            doc.fontSize(16).text('PHÒNG KHÁM PRESCRIPTO', { align: 'center' });
            const titleWidth = doc.widthOfString('PHÒNG KHÁM PRESCRIPTO');
            const titleX = (doc.page.width - titleWidth) / 2;
            doc.moveTo(titleX, doc.y).lineTo(titleX + titleWidth, doc.y).stroke();

            doc.moveDown(0.5);
            doc.fontSize(12).text('ĐƠN THUỐC', { align: 'center' });
            doc.fontSize(9).text(`Mã: #${appt._id.slice(-6).toUpperCase()}`, { align: 'right' });
            doc.moveDown(1);

            // --- Thông tin bệnh nhân ---
            const startX = 30;
            const pageWidth = doc.page.width;
            const rightMargin = 30;
            const contentWidth = pageWidth - startX - rightMargin;
            const startY = doc.y;

            doc.fontSize(10);
            doc.text(`Họ tên: `, startX + 10, doc.y, { continued: true });
            doc.font('Roboto').text(`${appt.userData.name}`, { continued: true, stroke: true });
            doc.font('Roboto').text(`                            Tuổi: ${calculateAge(appt.userData.dob) || 'N/A'}`, { stroke: false });
            doc.moveDown(0.5);
            doc.text(`Địa chỉ: ${appt.userData.address?.line1 || '...'}`, startX + 10, doc.y);
            doc.moveDown(0.5);

            // Lấy dữ liệu từ DB (appt đã hoàn thành)
            const symptomsText = appt.symptoms || 'Chưa ghi nhận';
            const diagnosisText = appt.diagnosis || 'Chưa ghi nhận';

            doc.text(`Triệu chứng: `, startX + 10, doc.y, { continued: true });
            doc.font('Roboto').text(symptomsText, { oblique: true });
            doc.moveDown(0.5);
            doc.text(`Chẩn đoán: `, startX + 10, doc.y, { continued: true });
            doc.font('Roboto').text(diagnosisText, { underline: true });
            doc.moveDown(1);

            // Vẽ khung
            const boxHeight = doc.y - startY + 5;
            doc.rect(startX, startY - 5, contentWidth, boxHeight).stroke('#333');
            doc.moveDown(2);

            // --- Danh sách thuốc ---
            doc.fontSize(11).text('CHỈ ĐỊNH THUỐC:', { underline: true });
            doc.moveDown(0.8);
            let y = doc.y;

            // Lấy danh sách thuốc từ object appt
            // Ưu tiên lấy từ prescription (mới), fallback sang medicines (cũ) nếu có
            const medicines = appt.prescription || appt.medicines || [];

            if (medicines.length > 0) {
                medicines.forEach((drug, i) => {
                    doc.fontSize(11).text(`${i + 1}.`, startX, y, { width: 20 });
                    doc.font('Roboto').text(drug.name, startX + 25, y);
                    doc.fontSize(10).text(`SL: ${drug.quantity} ${drug.unit || 'Viên'}`, 300, y, { width: 90, align: 'right' });
                    y += 16;
                    doc.fillColor('#555');
                    doc.fontSize(9).text(`Cách dùng: ${drug.dosage || ''}`, startX + 25, y, { oblique: true });
                    doc.fillColor('black');
                    y += 22;
                    doc.moveTo(startX, y - 8).lineTo(pageWidth - rightMargin, y - 8).strokeColor('#eee').stroke().strokeColor('black');
                });
            } else {
                doc.fontSize(10).text("(Không có thuốc)", startX, y);
                y += 20;
            }

            // --- Footer ---
            const date = new Date(appt.updatedAt || Date.now());
            let footerY = doc.page.height - 100;
            if (y > footerY) { doc.addPage(); footerY = 50; }

            doc.fontSize(10).text(`Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`, 250, footerY, { width: 140, align: 'center' });
            doc.text('Bác sĩ điều trị', 250, footerY + 15, { width: 140, align: 'center' });
            doc.fontSize(11).text(appt.docData?.name, 250, footerY + 65, { width: 140, align: 'center', bold: true });

            doc.end();
            stream.on('finish', () => {
                const url = URL.createObjectURL(stream.toBlob('application/pdf'));
                window.open(url, '_blank');
            });
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Lỗi tạo file PDF");
        }
    };

    // --- 7. CHỨC NĂNG KÊ ĐƠN & LƯU ---

    // Mở modal
    const openPrescriptionModal = (appt) => {
        setCurrentAppt(appt);
        setSymptoms(appt.symptoms || '');
        setDiagnosis(appt.diagnosis || ''); // Load chẩn đoán cũ nếu có
        setNote('');

        // Load thuốc cũ nếu có
        if (appt.prescription && appt.prescription.length > 0) {
            setPrescriptionList(appt.prescription);
        } else {
            setPrescriptionList([{ name: '', quantity: 1, unit: 'Viên', dosage: '' }]);
        }

        setShowPrescriptionModal(true);
    };

    // Thao tác danh sách thuốc
    const addMedicineRow = () => setPrescriptionList([...prescriptionList, { name: '', quantity: 1, unit: 'Viên', dosage: '' }]);
    const removeMedicineRow = (index) => {
        const newList = [...prescriptionList];
        newList.splice(index, 1);
        setPrescriptionList(newList);
    };
    const handleMedicineChange = (index, field, value) => {
        const newList = [...prescriptionList];
        newList[index][field] = value;
        if (field === 'name') {
            const selectedDrug = medicines.find(m => m.name === value);
            if (selectedDrug) newList[index].unit = selectedDrug.unit;
        }
        setPrescriptionList(newList);
    };

    // Core function: Lưu vào Database
    const saveToDatabase = async () => {
        if (!diagnosis) {
            toast.error("Vui lòng nhập chẩn đoán bệnh!");
            return false;
        }

        setIsSaving(true);
        const validMedicines = prescriptionList.filter(item => item.name && item.name.trim() !== '');

        const success = await savePrescriptionToDb({
            appointmentId: currentAppt._id,
            diagnosis,
            symptoms,
            medicines: validMedicines,
            note
        });

        setIsSaving(false);
        return success;
    };

    // Handler: Lưu và In
    const handleSaveAndPrint = async () => {
        const success = await saveToDatabase();
        if (success) {
            // Tạo PDF từ dữ liệu form hiện tại (vì chưa reload lại list)
            // Hoặc gọi lại hàm printPrescription với dữ liệu mới
            const tempAppt = {
                ...currentAppt,
                diagnosis,
                symptoms,
                prescription: prescriptionList.filter(item => item.name && item.name.trim() !== '')
            };
            printPrescription(tempAppt);

            setShowPrescriptionModal(false);
            setCurrentAppt(null);
            if (getAppointments) getAppointments();
        }
    };

    // --- 8. RENDER GIAO DIỆN ---
    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>Quản Lý Cuộc Hẹn</p>

            {/* THANH LỌC */}
            <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end shadow-sm'>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs text-gray-500 font-medium'>Trạng thái:</label>
                    <select onChange={(e) => setFilterStatus(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-gray-50'>
                        <option value="All">Tất cả</option>
                        <option value="Pending">Đang chờ khám</option>
                        <option value="Completed">Đã xong</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs text-gray-500 font-medium'>Ngày khám:</label>
                    <input type="date" onChange={(e) => setFilterDate(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-gray-50' />
                </div>
            </div>

            {/* DANH SÁCH CUỘC HẸN */}
            <div className='bg-white border rounded text-sm min-h-[50vh] max-h-[80vh] overflow-y-scroll scrollbar-hide'>
                <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_1fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b font-medium bg-gray-50 text-gray-500'>
                    <p>#</p>
                    <p>Bệnh nhân</p>
                    <p>Trạng thái</p>
                    <p>Tuổi</p>
                    <p>Thời gian</p>
                    <p>Phí</p>
                    <p>Hành động</p>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Không tìm thấy cuộc hẹn nào.</div>
                ) : (
                    filteredAppointments.map((item, index) => (
                        <div key={index} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid sm:grid-cols-[0.5fr_3fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
                            <p className='max-sm:hidden'>{index + 1}</p>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 h-8 rounded-full object-cover shadow-sm' src={item.userData?.image || assets.upload_area} alt="" />
                                <div className='flex flex-col'>
                                    <p className='font-medium text-gray-800'>{item.userData?.name}</p>
                                    <button onClick={() => openHistory(item.userData?._id, item.docId)} className='text-xs text-blue-500 hover:underline text-left mt-0.5'>📂 Xem hồ sơ</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${item.payment ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{item.payment ? 'Đã TT' : 'Chưa TT'}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.appointmentType === 'Remote' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{item.appointmentType === 'Remote' ? 'Từ xa' : 'Tại PK'}</span>
                            </div>
                            <p className='max-sm:hidden'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>
                            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            <p className='font-medium text-gray-700'>{currency}{item.amount}</p>

                            {/* --- CỘT HÀNH ĐỘNG (SỬA ĐỔI) --- */}
                            <div className='flex flex-col gap-1 items-end sm:items-start'>
                                {item.cancelled ? (
                                    <p className='text-red-400 text-xs font-medium'>Đã hủy</p>
                                ) : item.isCompleted ? (
                                    // TRƯỜNG HỢP 1: ĐÃ HOÀN THÀNH -> HIỆN NÚT IN
                                    <div className='flex flex-col gap-2 items-center'>
                                        <p className='text-green-500 text-xs font-medium'>Đã xong</p>
                                        <button
                                            onClick={() => printPrescription(item)}
                                            className='flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded border transition-colors shadow-sm'
                                            title="In lại đơn thuốc từ hồ sơ"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                                            </svg>
                                            In đơn
                                        </button>
                                    </div>
                                ) : (
                                    // TRƯỜNG HỢP 2: CHƯA KHÁM (PENDING) -> HIỆN NÚT HỦY & KHÁM
                                    <div className='flex gap-2'>
                                        <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer hover:scale-105 transition-transform' src={assets.cancel_icon} title="Hủy lịch" alt="" />
                                        <img onClick={() => openPrescriptionModal(item)} className='w-10 cursor-pointer hover:scale-105 transition-transform' src={assets.tick_icon} title="Khám & Kê đơn" alt="" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- MODAL 1: LỊCH SỬ BỆNH ÁN --- */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99]">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-4 border-b bg-blue-50 rounded-t-lg">
                            <h2 className="text-lg font-bold text-gray-800">📂 Hồ Sơ Bệnh Án</h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-3xl text-gray-400 hover:text-red-500">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
                            {historyLoading ? <div className="text-center mt-10">Đang tải...</div> : patientHistory.length === 0 ? <div className="text-center mt-10">Chưa có lịch sử.</div> : (
                                <div className="space-y-4">
                                    {patientHistory.map((h, i) => (
                                        <div key={i} className="bg-white p-4 rounded shadow border">
                                            <div className="font-bold text-blue-600 border-b pb-2 mb-2">{slotDateFormat(h.slotDate)} - {h.slotTime}</div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><p className="text-xs font-bold text-gray-500 uppercase">Chẩn đoán</p><p>{h.diagnosis}</p></div>
                                                <div><p className="text-xs font-bold text-gray-500 uppercase">Triệu chứng</p><p className="italic">"{h.symptoms}"</p></div>
                                            </div>
                                            {h.prescriptionData && (
                                                <div className="mt-3 pt-2 border-t border-dashed bg-yellow-50 p-2 rounded">
                                                    <p className="text-xs font-bold text-gray-500 mb-1">ĐƠN THUỐC:</p>
                                                    <ul className="list-disc pl-4 text-sm">
                                                        {h.prescriptionData.medicines.map((med, idx) => (
                                                            <li key={idx}><span className="font-semibold">{med.name}</span> - {med.quantity} {med.unit} <span className="text-xs text-gray-500">({med.dosage})</span></li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t flex justify-end"><button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-white border rounded hover:bg-gray-100">Đóng</button></div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: KÊ ĐƠN & HOÀN THÀNH --- */}
            {showPrescriptionModal && currentAppt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b bg-primary text-white rounded-t-lg">
                            <div><h2 className="text-lg font-bold">Kê Đơn & Hoàn Thành</h2><p className="text-xs opacity-90">BN: {currentAppt.userData?.name}</p></div>
                            <button onClick={() => setShowPrescriptionModal(false)} className="text-2xl hover:text-red-200">&times;</button>
                        </div>
                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Triệu chứng</label><textarea className="w-full border rounded p-2" rows="2" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Ho, sốt..."></textarea></div>
                                <div><label className="block text-sm font-medium mb-1">Chẩn đoán <span className='text-red-500'>*</span></label><textarea className="w-full border rounded p-2" rows="2" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Viêm họng..."></textarea></div>
                            </div>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between mb-2"><label className="font-bold">Đơn thuốc</label><button onClick={addMedicineRow} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Thêm thuốc</button></div>
                                {prescriptionList.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-end mb-3 border-b pb-2 last:border-0">
                                        <div className="w-4/12"><p className="text-xs text-gray-500">Tên thuốc</p><select className="w-full border rounded p-2" value={item.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}><option value="">-- Chọn --</option>{medicines.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
                                        <div className="w-2/12"><p className="text-xs text-gray-500">SL</p><input type="number" className="w-full border rounded p-2" value={item.quantity} onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)} /></div>
                                        <div className="w-2/12"><p className="text-xs text-gray-500">Đơn vị</p><input type="text" className="w-full border rounded p-2 bg-gray-100" value={item.unit} readOnly /></div>
                                        <div className="w-3/12"><p className="text-xs text-gray-500">Liều dùng</p><input type="text" className="w-full border rounded p-2" value={item.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} /></div>
                                        <button onClick={() => removeMedicineRow(index)} className="text-red-500 p-2">🗑️</button>
                                    </div>
                                ))}
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Lời dặn</label><textarea className="w-full border rounded p-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tái khám..."></textarea></div>
                        </div>
                        {/* Footer - Buttons */}
                        <div className='p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg'>
                            <button onClick={() => setShowPrescriptionModal(false)} className='px-4 py-2 border rounded hover:bg-gray-200'>Hủy</button>
                            <button
                                onClick={handleSaveAndPrint}
                                disabled={isSaving}
                                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 ${isSaving ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? 'Đang lưu...' : '💾 Lưu & In PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;