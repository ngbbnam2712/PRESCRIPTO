import mongoose from 'mongoose';
import medicineModel from './models/medicineModel.js';
import 'dotenv/config'; // Để đọc biến môi trường MONGODB_URI

// Dữ liệu mẫu
const medicines = [
    { name: "Panadol Extra", description: "Giảm đau, hạ sốt nhanh", price: 1500, stock: 500, unit: "Viên" },
    { name: "Augmentin 625mg", description: "Kháng sinh phổ rộng", price: 18000, stock: 200, unit: "Viên" },
    { name: "Berberin", description: "Trị tiêu chảy, đau bụng", price: 500, stock: 1000, unit: "Viên" },
    { name: "Phosphalugel", description: "Thuốc dạ dày chữ P", price: 4500, stock: 300, unit: "Gói" },
    { name: "Siro Prospan", description: "Thuốc ho thảo dược", price: 85000, stock: 50, unit: "Chai" },
    { name: "Vitamin C 500mg", description: "Tăng đề kháng", price: 2000, stock: 800, unit: "Viên" },
    { name: "Fefasdin 180", description: "Chống dị ứng", price: 3500, stock: 400, unit: "Viên" },
    { name: "Oresol", description: "Bù nước điện giải", price: 3000, stock: 600, unit: "Gói" },
    { name: "Betadine", description: "Sát khuẩn vết thương", price: 45000, stock: 30, unit: "Chai" },
    { name: "Omeprazol 20mg", description: "Trị trào ngược dạ dày", price: 1200, stock: 450, unit: "Viên" }
];

const seedDB = async () => {
    try {
        // Kết nối DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("🔥 Đã kết nối MongoDB...");

        // Xóa dữ liệu thuốc cũ (để tránh trùng lặp)
        await medicineModel.deleteMany({});
        console.log("🗑️ Đã xóa thuốc cũ...");

        // Thêm dữ liệu mới
        await medicineModel.insertMany(medicines);
        console.log("✅ Đã thêm 10 loại thuốc mẫu thành công!");

        // Ngắt kết nối
        mongoose.connection.close();
        console.log("👋 Đã đóng kết nối.");
    } catch (error) {
        console.error("❌ Lỗi:", error);
    }
};

seedDB();