const Loan = require('../models/Loan');
const Material = require('../models/Material');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
class LoanController {
    createLoan = async(req, res) => {
        const { memberId, materialId, librarianId } = req.body;

        // 1️⃣ التحقق من وجود المادة وصلاحية مخزونها
        const material = await Material.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: "المادة المطلوبة غير موجودة في النظام." });
        }
        if (material.availableCopies <= 0) {
            return res.status(400).json({
                message: "عذراً، لا توجد نسخ متاحة حالياً. يمكنك إجراء حجز (Reservation) بدلاً من ذلك."
            });
        }

        // 2️⃣ منع تكرار الإعارة (Business Rule)
        // البحث عن أي إعارة مفتوحة لنفس العضو ونفس الكتاب
        const existingLoan = await Loan.findOne({
            memberId: memberId,
            materialId: materialId,
            status: { $in: ['active', 'overdue'] }
        });

        if (existingLoan) {
            return res.status(400).json({
                message: "عذراً، هذا العضو مستعير بالفعل نسخة من هذا الكتاب حالياً ولم يقم بإرجاعها بعد!"
            });
        }

        const member = await User.findById(memberId);
        if (!member || member.role !== 'member') {
            return res.status(400).json({ message: "معرّف العضو غير صحيح أو المستخدم ليس من فئة الأعضاء." });
        }

        const librarian = await User.findById(librarianId);
        if (!librarian || librarian.role !== 'librarian') {
            return res.status(400).json({ message: "معرّف أمين المكتبة غير صحيح أو لا يملك الصلاحية لتسجيل الإعارة." });
        }

        const loanDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(loanDate.getDate() + 14);

        const loan = await Loan.create({
            memberId: memberId,
            materialId: materialId,
            librarianId: librarianId,
            loanDate,
            dueDate,
            finePerDay: 0.5,
            status: 'active'
        });

        material.availableCopies -= 1;
        await material.save();

        // نحتفظ ببيانات السجل الأصلي، ونقوم بتنسيق التواريخ فقط قبل إرسالها للـ Postman
        const formattedLoan = {
            ...loan._doc,
            loanDate: loan.loanDate.toISOString().split('T')[0], // النتيجة المرجعة: YYYY-MM-DD
            dueDate: loan.dueDate.toISOString().split('T')[0] // النتيجة المرجعة: YYYY-MM-DD
        };

        return res.status(201).json({
            message: "تم تسجيل عملية الإعارة بنجاح.",
            loan: formattedLoan // 
        });
    };
    //=======
    // ══════════════════════════════════════════════
    //  /api/v1/loans/:id/return
    // ══════════════════════════════════════════════
    returnLoan = async(req, res) => {
        const { id } = req.params;

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({ message: "سجل الإعارة هذا غير موجود في النظام." });
        }

        if (loan.status === 'returned') {
            return res.status(400).json({ message: "هذه المادة تم إرجاعها وتقفيل السجل مسبقاً!" });
        }

        const today = new Date();
        let totalFineAmount = 0;

        if (today > loan.dueDate) {
            const diffMs = today - loan.dueDate;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            totalFineAmount = diffDays * loan.finePerDay;
            loan.status = 'overdue';
            loan.paymentStatus = 'unpaid';
        } else {
            loan.status = 'returned';
            loan.paymentStatus = 'paid';
        }

        loan.actualReturnDate = today;
        loan.totalFineAmount = totalFineAmount;

        await loan.save();

        // تحديث المخزن
        await Material.findByIdAndUpdate(loan.materialId, {
            $inc: { availableCopies: 1 }
        });

        // نبحث عن أقدم حجز معلق لهذا الكتاب (صاحب الأولوية 1)
        const pendingReservation = await Reservation.findOne({
            material: loan.materialId,
            status: 'pending'
        }).sort({ queuePriority: 1 });

        if (pendingReservation) {
            // تحديث الحجز لإبلاغ العضو أن الكتاب متوفر
            pendingReservation.notifiedWhenAvailable = true;
            await pendingReservation.save();
        }

        // تنسيق التاريخ للـ Response
        const formattedLoan = {
            ...loan._doc,
            loanDate: loan.loanDate.toISOString().split('T')[0],
            dueDate: loan.dueDate.toISOString().split('T')[0],
            actualReturnDate: loan.actualReturnDate.toISOString().split('T')[0]
        };

        return res.status(200).json({
            message: totalFineAmount > 0 ?
                `تم إرجاع المادة متأخرة، وتم احتساب غرامة بقيمة ${totalFineAmount}.` : "تم إرجاع المادة في الوقت المحدد بنجاح وتم تحديث المخزن.",
            loan: formattedLoan,
            notificationTriggered: !!pendingReservation // حقل إضافي يخبرك هل تم تنبيه أحد أم لا
        });
    };
}

module.exports = new LoanController();