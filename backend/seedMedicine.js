import mongoose from "mongoose";
import medicineModel from "./models/medicineModel.js";
import specializationModel from "./models/SpecializationModel.js"
import dotenv from 'dotenv';

dotenv.config();

// Dữ liệu thuốc mẫu (Chưa có ID, chỉ có từ khóa tên chuyên khoa để map)
const rawMedicines = [
    // --- 1. THUỐC ĐA KHOA / DÙNG CHUNG (isGeneral: true) ---
    {
        name: "Panadol Extra",
        description: "Giảm đau, hạ sốt (Paracetamol + Caffeine)",
        stock: 500,
        unit: "Vỉ",
        price: 20000,
        isGeneral: true
    },
    {
        name: "Vitamin C 500mg",
        description: "Tăng sức đề kháng",
        stock: 200,
        unit: "Lọ",
        price: 50000,
        isGeneral: true
    },
    {
        name: "Dung dịch NaCl 0.9%",
        description: "Nước muối sinh lý rửa vết thương, súc miệng",
        stock: 1000,
        unit: "Chai",
        price: 10000,
        isGeneral: true
    },

    // --- 2. NỘI TỔNG QUÁT (Map với: "Nội tổng quát") ---
    {
        name: "Omeprazol 20mg",
        description: "Điều trị trào ngược dạ dày thực quản",
        stock: 300,
        unit: "Hộp",
        price: 80000,
        targetSpec: "Nội tổng quát"
    },
    {
        name: "Amlodipin 5mg",
        description: "Điều trị tăng huyết áp",
        stock: 300,
        unit: "Vỉ",
        price: 35000,
        targetSpec: "Nội tổng quát"
    },
    {
        name: "Metformin 500mg",
        description: "Kiểm soát đường huyết cho bệnh tiểu đường",
        stock: 400,
        unit: "Hộp",
        price: 90000,
        targetSpec: "Nội tổng quát"
    },

    // --- 3. DA LIỄU – DỊ ỨNG (Map với: "Da liễu") ---
    {
        name: "Dibetalic",
        description: "Kem bôi trị các bệnh da liễu, nấm, dị ứng",
        stock: 150,
        unit: "Tuýp",
        price: 45000,
        targetSpec: "Da liễu"
    },
    {
        name: "Loratadin 10mg",
        description: "Thuốc chống dị ứng, mề đay, viêm mũi dị ứng",
        stock: 200,
        unit: "Vỉ",
        price: 15000,
        targetSpec: "Da liễu"
    },
    {
        name: "Isotretinoin 10mg",
        description: "Điều trị mụn trứng cá nặng (Kê đơn)",
        stock: 100,
        unit: "Hộp",
        price: 250000,
        targetSpec: "Da liễu"
    },

    // --- 4. CƠ – XƯƠNG – KHỚP (Map với: "Cơ – Xương – Khớp") ---
    {
        name: "Glucosamine 1500mg",
        description: "Hỗ trợ giảm thoái hóa khớp, tái tạo sụn",
        stock: 100,
        unit: "Lọ",
        price: 350000,
        targetSpec: "Cơ" // Tìm từ khóa "Cơ" hoặc "Xương"
    },
    {
        name: "Voltaren Emulgel",
        description: "Gel bôi giảm đau xương khớp, chấn thương",
        stock: 200,
        unit: "Tuýp",
        price: 65000,
        targetSpec: "Cơ"
    },
    {
        name: "Ibuprofen 400mg",
        description: "Kháng viêm không steroid, giảm đau khớp",
        stock: 300,
        unit: "Vỉ",
        price: 25000,
        targetSpec: "Cơ"
    },

    // --- 5. SẢN – NHI (Map với: "Sản – Nhi") ---
    {
        name: "Prospan",
        description: "Siro ho chiết xuất lá thường xuân cho trẻ em",
        stock: 200,
        unit: "Chai",
        price: 85000,
        targetSpec: "Sản"
    },
    {
        name: "Elevit",
        description: "Vitamin tổng hợp cho bà bầu",
        stock: 100,
        unit: "Hộp",
        price: 1100000,
        targetSpec: "Sản"
    },
    {
        name: "Hapacol 150 (Gói)",
        description: "Thuốc hạ sốt hương cam cho bé",
        stock: 500,
        unit: "Hộp",
        price: 40000,
        targetSpec: "Sản"
    },

    // --- 6. TAI – MŨI – HỌNG (Map với: "Tai") ---
    {
        name: "Otrivin 0.1%",
        description: "Xịt mũi giảm nghẹt mũi, sổ mũi",
        stock: 300,
        unit: "Chai",
        price: 55000,
        targetSpec: "Tai"
    },
    {
        name: "Betadine Gargle",
        description: "Nước súc họng sát khuẩn",
        stock: 200,
        unit: "Chai",
        price: 70000,
        targetSpec: "Tai"
    },
    {
        name: "Strepsils Cool",
        description: "Viên ngậm đau họng",
        stock: 500,
        unit: "Hộp",
        price: 35000,
        targetSpec: "Tai"
    },

    // --- 7. RĂNG – HÀM – MẶT (Map với: "Răng") ---
    {
        name: "Spiramycin",
        description: "Kháng sinh điều trị nhiễm trùng răng miệng",
        stock: 200,
        unit: "Vỉ",
        price: 30000,
        targetSpec: "Răng"
    },
    {
        name: "Kin Gingival",
        description: "Nước súc miệng trị viêm nướu",
        stock: 150,
        unit: "Chai",
        price: 120000,
        targetSpec: "Răng"
    },
    {
        name: "Efferalgan Codein",
        description: "Giảm đau răng cấp tính (Sủi)",
        stock: 200,
        unit: "Tuýp",
        price: 60000,
        targetSpec: "Răng"
    },

    // --- 8. KHOA TRUYỀN NHIỄM (Map với: "truyền nhiễm") ---
    {
        name: "Tamiflu 75mg",
        description: "Thuốc kháng virus điều trị cúm A/B",
        stock: 50,
        unit: "Hộp",
        price: 550000,
        targetSpec: "truyền nhiễm"
    },

    // --- 9. UNG BƯỚU (Map với: "Ung bướu") ---
    {
        name: "Tamoxifen",
        description: "Liệu pháp nội tiết (Minh họa)",
        stock: 20,
        unit: "Hộp",
        price: 200000,
        targetSpec: "Ung bướu"
    }
];

const seedMedicines = async () => {
    try {
        console.log("🚀 Starting Medicine Seed...");
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Xóa dữ liệu cũ
        await medicineModel.deleteMany({});
        console.log("🗑️ Deleted old medicines.");

        // 2. Lấy danh sách chuyên khoa từ DB
        const specs = await specializationModel.find({});
        console.log(`📋 Found ${specs.length} specializations in DB.`);

        // 3. Xử lý map dữ liệu
        const finalMedicines = rawMedicines.map(item => {
            // Nếu là thuốc chung
            if (item.isGeneral) {
                return item;
            }

            // Nếu là thuốc chuyên khoa, tìm ID dựa trên targetSpec
            // Logic: Tìm chuyên khoa có tên chứa từ khóa targetSpec (ví dụ "Da liễu" nằm trong "Da liễu – Dị ứng")
            const specFound = specs.find(s =>
                s.name.toLowerCase().includes(item.targetSpec.toLowerCase())
            );

            if (specFound) {
                // Xóa trường targetSpec tạm thời, thêm specializationId và name
                const { targetSpec, ...medicineData } = item;
                return {
                    ...medicineData,
                    specializationId: specFound._id,
                    specializationName: specFound.name,
                    isGeneral: false
                };
            } else {
                console.warn(`⚠️ Warning: Không tìm thấy chuyên khoa nào khớp với từ khóa '${item.targetSpec}' cho thuốc '${item.name}'. Chuyển về thuốc General.`);
                const { targetSpec, ...medicineData } = item;
                return { ...medicineData, isGeneral: true };
            }
        });

        // 4. Lưu vào DB
        await medicineModel.insertMany(finalMedicines);
        console.log(`✅ Successfully seeded ${finalMedicines.length} medicines.`);

        process.exit();

    } catch (error) {
        console.error("❌ Error seeding medicines:", error);
        process.exit(1);
    }
};

seedMedicines();