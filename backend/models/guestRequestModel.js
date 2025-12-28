import mongoose from "mongoose";

const guestRequestSchema = new mongoose.Schema({
    // Lưu thông tin khách nhập vào
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: Object, default: { line1: '', line2: '' } },
    gender: { type: String, default: "Not Selected" },
    dob: { type: String, default: '' },
    speciality: { type: String, default: "General" }, // Muốn khám khoa nào
    docName: { type: String, default: "" },           // <-- Thêm để dễ hiển thị
    reason: { type: String, default: "" },            // Triệu chứng/Lý do
    preferredMode: { type: String, default: "Clinic" }, // Muốn khám tại nhà hay phòng khám
    preferredDate: { type: String, default: "" },     // Ngày mong muốn (nếu có)
    isHandled: { type: Boolean, default: false },     // Admin đã gọi điện xử lý chưa?
    amount: { type: Number, default: 0 },             // <-- Thêm
    paymentStatus: { type: Boolean, default: false }, // <-- Thêm
    transactionId: { type: String, default: "" },     // <-- Thêm
    slotDate: { type: String, default: "Not Selected" },
    slotTime: { type: String, default: "Not Selected" },
    date: { type: Number, required: true }      // Thời gian gửi form
});

const guestRequestModel = mongoose.model("guestRequest", guestRequestSchema);

export default guestRequestModel;