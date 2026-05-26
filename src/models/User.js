const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // الحقول المشتركة لجميع الأدوار (Required للكل)
    name: {
        type: String,
        required: [true, 'الاسم مطلوب إجباري'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب إجباري'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة للتصميم البنيوي']
    },
    role: {
        type: String,
        required: true,
        enum: ['member', 'librarian', 'manager'],
        default: 'member'
    },

    // 🙋‍♂️ حقول خاصة بالعضو (تعتبر Nullable للأدوار الأخرى)
    address: {
        type: String,
        trim: true,
        default: null // تكون null إذا لم تُرسل
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    membershipNumber: {
        type: String,
        unique: true,
        sparse: true, // 🔒 قفل أمان: يمنع المونغوز من ضرب خطأ تكرار الـ null للموظفين والمدراء
        default: null
    },

    // 👨‍💼 حقول خاصة بأمين المكتبة (تعتبر Nullable للأدوار الأخرى)
    responsibleDepartment: {
        type: String,
        trim: true,
        default: null
    }

}, {
    timestamps: true // لإنشاء createdAt و updatedAt تلقائياً
});

module.exports = mongoose.model('User', userSchema);