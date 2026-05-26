const Material = require('../models/Material');
const User = require('../models/User');

class MaterialController {
    getAllMaterials = async(req, res) => {
        // جلب كل المواد من قاعدة البيانات وترتيبها من الأحدث للأقدم
        const materials = await Material.find().sort({ createdAt: -1 });

        return res.status(200).json({
            msg: "تم جلب جميع المواد المكتبية بنجاح",
            count: materials.length,
            data: materials
        });
    }

    getMaterialById = async(req, res) => {
        const { id } = req.params; // لقط الـ ID المرسل في الـ URL

        const material = await Material.findById(id);

        if (!material) {
            return res.status(404).json({ msg: "المادة المكتبية المطلوبة غير موجودة!" });
        }

        return res.status(200).json({
            msg: "تم جلب بيانات المادة بنجاح ",
            data: material
        });
    }
    createMaterial = async(req, res) => {
        const {
            materialType = 'book', title, category, totalCopies, coverImageUrl,
                author, publisher, publicationYear, ISBN,
                issueNumber, month, year,
                requestingUserId
        } = req.body;

        if (!requestingUserId) {
            return res.status(400).json({ msg: "يجب إرسال requestingUserId لفحص الصلاحية" });
        }

        const requester = await User.findById(requestingUserId);
        if (!requester || (requester.role !== 'manager' && requester.role !== 'librarian')) {
            return res.status(403).json({ msg: "غير مسموح! فقط أمين المكتبة أو المدير يمكنه إضافة مواد جديدة." });
        }

        const materialData = {
            materialType,
            title,
            category,
            totalCopies,
            availableCopies: totalCopies,
            coverImageUrl
        };

        // 3 تطبيق الشروط الصارمة وفصل الحقول بناءً على الـ materialType
        if (materialType === 'book') {
            // فحص الحقول الإجبارية للكتاب
            if (!author || !publisher || !publicationYear || !ISBN) {
                return res.status(400).json({ msg: "الحقول الخاصة بالكتاب (المؤلف، الناشر، سنة النشر، رقم ISBN) مطلوبة إجبارياً!" });
            }

            // فحص عدم تكرار الـ ISBN للكتب في قاعدة البيانات
            const isIsbnExist = await Material.findOne({ ISBN });
            if (isIsbnExist) {
                return res.status(400).json({ msg: "رقم ISBN هذا مسجل لكتاب آخر مسبقاً!" });
            }

            materialData.author = author;
            materialData.publisher = publisher;
            materialData.publicationYear = publicationYear;
            materialData.ISBN = ISBN;
        } else if (materialType === 'magazine') {
            if (!issueNumber || !month || !year) {
                return res.status(400).json({ msg: "الحقول الخاصة بالمجلة (رقم الإصدار، الشهر، السنة) مطلوبة إجبارياً!" });
            }

            materialData.issueNumber = issueNumber;
            materialData.month = month;
            materialData.year = year;
        }

        const newMaterial = await Material.create(materialData);

        return res.status(201).json({
            msg: `تم إضافة (${materialType}) بنجاح إلى المكتبة وتعيين الكمية المتاحة 📚`,
            data: newMaterial
        });
    }

}

module.exports = new MaterialController();
module.exports = new MaterialController();