import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

// Import thư viện PDF
import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import blobStream from 'blob-stream';

const DoctorAppointments = () => {

    // --- 1. CONTEXT & TRẠNG THÁI ---
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

    // Trạng thái bộ lọc
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    // Trạng thái Modal Lịch sử
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Trạng thái Modal Kê đơn
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [currentAppt, setCurrentAppt] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [note, setNote] = useState('');
    const [prescriptionList, setPrescriptionList] = useState([
        { name: '', quantity: 1, unit: 'Viên', dosage: 'Sáng 1, Chiều 1' }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    // --- 2. TẢI DỮ LIỆU ---
    useEffect(() => {
        if (dToken) {
            getAppointments();
            getMedicines(); // Tải danh mục thuốc từ kho
        }
    }, [dToken]);

    // --- 3. LOGIC LỌC DANH SÁCH ---
    useEffect(() => {
        if (appointments) {
            let temp = appointments.slice().reverse(); // Mới nhất lên đầu
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

    // --- 4. HÀM HỖ TRỢ ---
    const parseDateTime = (dateStr, timeStr) => {
        try {
            const [day, month, year] = dateStr.split('_').map(Number);
            const [h, m] = timeStr.split(':').map(Number);
            return new Date(year, month - 1, day, h, m).getTime();
        } catch (error) { return 0; }
    };

    // --- 5. XỬ LÝ LỊCH SỬ BỆNH ÁN ---
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

    // --- 6. XỬ LÝ IN PDF ---
    const printPrescription = async (appt) => {
        try {
            if (!appt || !appt.userData) {
                toast.error("Thiếu thông tin cuộc hẹn!");
                return;
            }

            const doc = new PDFDocument({ size: 'A5', margin: 30 });
            const stream = doc.pipe(blobStream());

            // Tải Font hỗ trợ tiếng Việt
            const fontRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
            const fontBuffer = await fontRes.arrayBuffer();
            doc.registerFont('Roboto', fontBuffer);
            doc.font('Roboto');

            // --- Tiêu đề ---
            doc.fontSize(16).text('PHÒNG KHÁM PRESCRIPTO', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text('ĐƠN THUỐC', { align: 'center' });
            doc.fontSize(9).text(`Mã đơn: #${appt._id.slice(-6).toUpperCase()}`, { align: 'right' });
            doc.moveDown(1);

            // --- Thông tin bệnh nhân ---
            const startX = 30;
            const pageWidth = doc.page.width;
            const rightMargin = 30;
            const contentWidth = pageWidth - startX - rightMargin;
            const startY = doc.y;

            doc.fontSize(10);
            doc.text(`Họ tên: ${appt.userData.name}`, startX + 10, doc.y);
            doc.text(`Tuổi: ${calculateAge(appt.userData.dob) || 'N/A'}`, 300, doc.y - 12);
            doc.moveDown(0.3);
            doc.text(`Địa chỉ: ${appt.userData.address?.line1 || '...'}`, startX + 10, doc.y);
            doc.moveDown(0.5);

            const symptomsText = appt.symptoms || 'Chưa ghi nhận';
            const diagnosisText = appt.diagnosis || 'Chưa ghi nhận';

            doc.text(`Triệu chứng: ${symptomsText}`, startX + 10, doc.y);
            doc.moveDown(0.3);
            doc.text(`Chẩn đoán: ${diagnosisText}`, startX + 10, doc.y);
            doc.moveDown(1);

            // Vẽ khung thông tin
            const boxHeight = doc.y - startY + 5;
            doc.rect(startX, startY - 5, contentWidth, boxHeight).stroke('#333');
            doc.moveDown(2);

            // --- Danh sách thuốc ---
            doc.fontSize(11).text('CHỈ ĐỊNH THUỐC:', { underline: true });
            doc.moveDown(0.8);
            let y = doc.y;

            const meds = appt.prescription || appt.medicines || [];

            if (meds.length > 0) {
                meds.forEach((drug, i) => {
                    doc.fontSize(11).text(`${i + 1}. ${drug.name}`, startX, y);
                    doc.fontSize(10).text(`SL: ${drug.quantity} ${drug.unit || 'Viên'}`, 300, y, { width: 90, align: 'right' });
                    y += 16;
                    doc.fillColor('#555').fontSize(9).text(`Cách dùng: ${drug.dosage || ''}`, startX + 15, y, { oblique: true });
                    doc.fillColor('black');
                    y += 22;
                });
            } else {
                doc.fontSize(10).text("(Không có thuốc được chỉ định)", startX, y);
                y += 20;
            }

            // --- Chữ ký ---
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
            toast.error("Lỗi tạo file PDF");
        }
    };

    // --- 7. QUẢN LÝ KÊ ĐƠN ---
    const openPrescriptionModal = (appt) => {
        setCurrentAppt(appt);
        setSymptoms(appt.symptoms || '');
        setDiagnosis(appt.diagnosis || '');
        setNote('');
        if (appt.prescription && appt.prescription.length > 0) {
            setPrescriptionList(appt.prescription);
        } else {
            setPrescriptionList([{ name: '', quantity: 1, unit: 'Viên', dosage: '' }]);
        }
        setShowPrescriptionModal(true);
    };

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

    const handleSaveAndPrint = async () => {
        const success = await saveToDatabase();
        if (success) {
            const tempAppt = {
                ...currentAppt,
                diagnosis,
                symptoms,
                prescription: prescriptionList.filter(item => item.name && item.name.trim() !== '')
            };
            printPrescription(tempAppt);
            setShowPrescriptionModal(false);
            setCurrentAppt(null);
            getAppointments();
        }
    };

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium text-gray-800'>Quản Lý Cuộc Hẹn</p>

            {/* BỘ LỌC */}
            <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end shadow-sm'>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs text-gray-500 font-bold uppercase'>Trạng thái:</label>
                    <select onChange={(e) => setFilterStatus(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50'>
                        <option value="All">Tất cả</option>
                        <option value="Pending">Đang chờ khám</option>
                        <option value="Completed">Đã hoàn thành</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs text-gray-500 font-bold uppercase'>Ngày khám:</label>
                    <input type="date" onChange={(e) => setFilterDate(e.target.value)} className='border rounded px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50' />
                </div>
            </div>

            {/* DANH SÁCH CUỘC HẸN */}
            <div className='bg-white border rounded text-sm min-h-[50vh] max-h-[80vh] overflow-y-scroll scrollbar-hide'>
                <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_1fr_3fr_1fr_1fr] py-3 px-6 border-b font-bold bg-gray-100 text-gray-600 uppercase text-[12px]'>
                    <p>#</p>
                    <p>Bệnh nhân</p>
                    <p>Thanh toán</p>
                    <p>Tuổi</p>
                    <p>Thời gian</p>
                    <p>Phí khám</p>
                    <p>Thao tác</p>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">Không tìm thấy cuộc hẹn nào.</div>
                ) : (
                    filteredAppointments.map((item, index) => (
                        <div key={index} className='flex flex-wrap justify-between max-sm:gap-5 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_1fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50 transition-colors'>
                            <p className='max-sm:hidden'>{index + 1}</p>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 h-8 rounded-full object-cover border' src={item.userData?.image || assets.upload_area} alt="" />
                                <div className='flex flex-col'>
                                    <p className='font-bold text-gray-800'>{item.userData?.name}</p>
                                    <button onClick={() => openHistory(item.userData?._id, item.docId)} className='text-[10px] text-blue-600 hover:underline text-left'>📂 Xem hồ sơ bệnh án</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.payment ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{item.payment ? 'Đã TT' : 'Chưa TT'}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.appointmentType === 'Remote' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>{item.appointmentType === 'Remote' ? 'Từ xa' : 'Tại PK'}</span>
                            </div>
                            <p className='max-sm:hidden font-medium'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>
                            <p className='font-medium text-gray-700'>{slotDateFormat(item.slotDate)} | <span className='text-blue-600 font-bold'>{item.slotTime}</span></p>
                            <p className='font-bold text-gray-800'>{currency}{item.amount.toLocaleString()}</p>

                            <div className='flex flex-col gap-1 items-center sm:items-start'>
                                {item.cancelled ? (
                                    <span className='text-red-400 text-xs font-bold bg-red-50 px-2 py-1 rounded'>Đã hủy</span>
                                ) : item.isCompleted ? (
                                    <div className='flex flex-col items-center gap-1'>
                                        <span className='text-green-500 text-xs font-bold'>Đã khám</span>
                                        <button onClick={() => printPrescription(item)} className='flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] rounded border transition-all shadow-sm'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                                            In đơn thuốc
                                        </button>
                                    </div>
                                ) : (
                                    <div className='flex gap-2'>
                                        <img onClick={() => cancelAppointment(item._id)} className='w-9 cursor-pointer hover:scale-110 transition-all p-1 hover:bg-red-50 rounded-full' src={assets.cancel_icon} title="Hủy lịch" alt="" />
                                        <img onClick={() => openPrescriptionModal(item)} className='w-9 cursor-pointer hover:scale-110 transition-all p-1 hover:bg-green-50 rounded-full' src={assets.tick_icon} title="Khám & Kê đơn" alt="" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL 1: HỒ SƠ BỆNH ÁN */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99] p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white rounded-t-xl">
                            <h2 className="text-lg font-bold">📂 Hồ Sơ Bệnh Án Của Bệnh Nhân</h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-3xl font-light hover:text-red-200 transition-colors">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            {historyLoading ? <div className="text-center py-20 font-medium">Đang tải hồ sơ...</div> : patientHistory.length === 0 ? <div className="text-center py-20 text-gray-500">Bệnh nhân chưa có lịch sử khám tại đây.</div> : (
                                <div className="space-y-4">
                                    {patientHistory.map((h, i) => (
                                        <div key={i} className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                                            <div className="font-bold text-blue-700 border-b pb-2 mb-3 flex justify-between">
                                                <span>📅 {slotDateFormat(h.slotDate)}</span>
                                                <span className='text-gray-400 font-normal'>{h.slotTime}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Chẩn đoán:</p><p className='font-medium text-gray-800'>{h.diagnosis}</p></div>
                                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Triệu chứng:</p><p className="italic text-gray-700">"{h.symptoms}"</p></div>
                                            </div>
                                            {h.prescriptionData && (
                                                <div className="mt-4 pt-3 border-t border-dashed bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                                                    <p className="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-widest">ĐƠN THUỐC ĐÃ KÊ:</p>
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                                        {h.prescriptionData.medicines.map((med, idx) => (
                                                            <li key={idx} className='flex gap-2'><span className='text-blue-500 font-bold'>•</span> {med.name} - {med.quantity} {med.unit} <span className="text-[10px] text-gray-400 italic">({med.dosage})</span></li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: KÊ ĐƠN & HOÀN THÀNH */}
            {showPrescriptionModal && currentAppt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b bg-primary text-white rounded-t-xl">
                            <div><h2 className="text-lg font-bold uppercase tracking-wide">Kê Đơn & Hoàn Thành Buổi Khám</h2><p className="text-xs opacity-80">Bệnh nhân: <span className='font-bold'>{currentAppt.userData?.name}</span></p></div>
                            <button onClick={() => setShowPrescriptionModal(false)} className="text-3xl font-light hover:text-red-200 transition-colors">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className='flex flex-col gap-1'><label className="text-xs font-bold text-gray-500 uppercase">Triệu chứng</label><textarea className="w-full border rounded-lg p-2.5 outline-none focus:border-primary text-sm" rows="2" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="VD: Ho, sốt cao, đau họng..."></textarea></div>
                                <div className='flex flex-col gap-1'><label className="text-xs font-bold text-gray-500 uppercase">Chẩn đoán <span className='text-red-500'>*</span></label><textarea className="w-full border rounded-lg p-2.5 outline-none focus:border-primary text-sm font-bold" rows="2" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="VD: Viêm amidan cấp tính..."></textarea></div>
                            </div>
                            <div className="border rounded-xl p-5 bg-gray-50 border-indigo-100 shadow-inner">
                                <div className="flex justify-between items-center mb-4"><label className="font-bold text-gray-700 uppercase text-xs tracking-widest">Đơn thuốc chỉ định</label><button onClick={addMedicineRow} className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 shadow-sm transition-all">+ Thêm thuốc mới</button></div>
                                <div className="space-y-3">
                                    {prescriptionList.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="w-5/12"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Tên thuốc</p><select className="w-full border-b outline-none text-xs py-1" value={item.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}><option value="">-- Chọn thuốc --</option>{medicines.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
                                            <div className="w-1/12"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">SL</p><input type="number" className="w-full border-b outline-none text-xs py-1" value={item.quantity} onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)} /></div>
                                            <div className="w-2/12"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Đơn vị</p><input type="text" className="w-full border-b outline-none text-xs py-1 text-gray-400" value={item.unit} readOnly /></div>
                                            <div className="w-3/12"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Liều dùng</p><input type="text" className="w-full border-b outline-none text-xs py-1" placeholder="Sáng 1, tối 1..." value={item.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} /></div>
                                            <button onClick={() => removeMedicineRow(index)} className="text-red-400 hover:text-red-600 transition-colors px-1">🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className='flex flex-col gap-1'><label className="text-xs font-bold text-gray-500 uppercase">Lời dặn bác sĩ</label><textarea className="w-full border rounded-lg p-2.5 outline-none focus:border-primary text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Nghỉ ngơi nhiều, tái khám sau 7 ngày..."></textarea></div>
                        </div>
                        <div className='p-4 border-t bg-gray-100 flex justify-end gap-3 rounded-b-xl'>
                            <button onClick={() => setShowPrescriptionModal(false)} className='px-6 py-2 border rounded-full hover:bg-gray-200 transition-all font-medium text-gray-600'>Hủy bỏ</button>
                            <button onClick={handleSaveAndPrint} disabled={isSaving} className={`px-8 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-md flex items-center gap-2 font-bold transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isSaving ? 'Đang lưu...' : '💾 Lưu & In đơn thuốc'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;