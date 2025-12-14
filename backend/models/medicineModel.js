import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String }, // Hoạt chất, công dụng
    price: { type: Number, required: true }, // Giá bán
    stock: { type: Number, default: 100 }, // Tồn kho (Mặc định 100 để test)
    unit: { type: String, default: 'Viên' } // Đơn vị: Viên, Vỉ, Chai
})

const medicineModel = mongoose.models.medicine || mongoose.model("medicine", medicineSchema);
export default medicineModel;