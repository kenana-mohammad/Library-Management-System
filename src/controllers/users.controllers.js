const User = require('../models/User');

class UserController {

    // 1. إنشاء مستخدم جديد
    // دالة إنشاء مستخدم جديد (داخل كلاس UserController)
    createUser = async(req, res) => {
            const {
                name,
                email,
                phone,
                password,
                role = 'member',
                address,
                dateOfBirth,
                responsibleDepartment
            } = req.body;

            // 1️⃣ فحص أمان مشترك: هل الإيميل مسجل مسبقاً في النظام؟
            const isEmailExist = await User.findOne({ email });
            if (isEmailExist) {
                return res.status(400).json({ msg: "هذا البريد الإلكتروني مسجل مسبقاً!" });
            }

            // 2️⃣ تجهيز كائن البيانات الأساسي المشترك للكل
            const userData = { name, email, phone, password, role };

            // 3️⃣ تطبيق شروط الحقول والإنشاء بناءً على الـ Role
            if (role === 'member') {
                // فحص الحقول الإجبارية الخاصة بالعضو فقط
                if (!address || !dateOfBirth) {
                    return res.status(400).json({ msg: "الحقول الخاصة بالعضو (العنوان، تاريخ الميلاد) مطلوبة!" });
                }

                const randomId = Math.floor(100000 + Math.random() * 900000); // يولد رقم عشوائي من 6 خانات
                const generatedMemberNumber = `MEM-2026-${randomId}`; // يدمج السنة الحالية 2026 مع الرقم

                userData.address = address;
                userData.dateOfBirth = dateOfBirth;
                userData.membershipNumber = generatedMemberNumber; // إسناد الرقم التلقائي
            } else if (role === 'librarian') {
                // فحص حقول أمين المكتبة
                if (!responsibleDepartment) {
                    return res.status(400).json({ msg: "حقل القسم المسؤول عنه أمين المكتبة مطلوب!" });
                }
                userData.responsibleDepartment = responsibleDepartment;
            }

            // 4️⃣ الحفظ النهائي في قاعدة البيانات
            // الحقول التي لم يتم إسنادها (مثل حقول الموظف عند إنشاء عضو) ستأخذ القيمة null تلقائياً في السكيما
            const newUser = await User.create(userData);

            return res.status(201).json({
                msg: `تم إنشاء حساب بنوع (${role}) بنجاح وطُبقت شروط الحقول الخاصة `,
                data: newUser
            });
        }
        // 2. جلب جميع المستخدمين
    getAllUsers = async(req, res) => {
        const users = await User.find().select('-password');
        return res.status(200).json({ msg: "تم جلب جميع المستخدمين بنجاح", count: users.length, data: users });
    }

    // 3. جلب مستخدم واحد بالـ ID
    getUserById = async(req, res) => {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: "المستخدم غير موجود!" });
        }
        return res.status(200).json({ msg: "تم جلب المستخدم بنجاح", data: user });
    }
    updateUser = async(req, res) => {
            const { id } = req.params; // الـ ID المراد تعديله من الـ URL
            const { requestingUserId, name, phone, password, address, dateOfBirth, responsibleDepartment } = req.body; // ❌ حذفنا membershipNumber تماماً من الـ Body القابل للاستقبال

            // 1. أمان: فحص هل أرسل الفرونت إند معرف الشخص الذي يطلب التعديل؟
            if (!requestingUserId) {
                return res.status(400).json({ msg: "يجب إرسال requestingUserId لفحص الصلاحية" });
            }

            // 2. شرط الأمان: التعديل للحساب الشخصي فقط
            if (id !== requestingUserId) {
                return res.status(403).json({ msg: "غير مسموح! يمكنك تعديل بيانات حسابك الشخصي فقط." });
            }

            // 3. التأكد أن المستخدم موجود في قاعدة البيانات
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ msg: "المستخدم غير موجود!" });
            }

            // 4. تجهيز البيانات المسموح بتعديلها فقط
            const updateData = {};
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;
            if (password) updateData.password = password; //  

            if (user.role === 'member') {
                if (address) updateData.address = address;
                if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
            } else if (user.role === 'librarian') {
                if (responsibleDepartment) updateData.responsibleDepartment = responsibleDepartment;
            }

            // 5. التنفيذ والحفظ في قاعدة البيانات
            const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');

            return res.status(200).json({
                msg: "تم تحديث بياناتك الشخصية بنجاح ",
                data: updatedUser
            });
        }
        // 5. حذف المستخدم بشرط الأمان
    deleteUser = async(req, res) => {
        const { id } = req.params;
        const { requestingUserId } = req.body;

        if (!requestingUserId) {
            return res.status(400).json({ msg: "يجب إرسال requestingUserId لفحص الصلاحية" });
        }

        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ msg: "المستخدم المراد حذفه غير موجود!" });
        }

        const requester = await User.findById(requestingUserId);
        if (!requester) {
            return res.status(404).json({ msg: "الشخص الذي يطلب الحذف غير موجود بالنظام!" });
        }

        const isSelfDelete = id === requestingUserId;
        const isManager = requester.role === 'manager';

        if (!isSelfDelete && !isManager) {
            return res.status(403).json({
                msg: "غير مسموح! يمكنك حذف حسابك الشخصي فقط، أو يجب أن تكون مديراً لحذف مستخدم آخر."
            });
        }

        await User.findByIdAndDelete(id);
        return res.status(200).json({ msg: isSelfDelete ? "تم حذف حسابك الشخصي بنجاح" : "قام المدير بحذف المستخدم بنجاح" });
    }
}

module.exports = new UserController();