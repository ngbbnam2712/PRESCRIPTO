import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Người nhận thông báo
    content: { type: String, required: true }, // Nội dung: "Lịch hẹn ngày 12/12 đã bị hủy"
    isRead: { type: Boolean, default: false }, // Đã đọc chưa
    type: { type: String, default: 'System' }, // Loại: 'System', 'Appointment', 'Promotion'
    createdAt: { type: Date, default: Date.now }
});

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);
export default notificationModel;