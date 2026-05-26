const Review = require('../models/Review');
const Loan = require('../models/Loan');

class ReviewController {

    // إنشاء تقييم جديد (POST)
    createReview = async(req, res) => {
        const { memberId, materialId, rating, reviewText } = req.body;

        const eligibleLoan = await Loan.findOne({
            memberId: memberId,
            materialId: materialId,
            status: { $in: ['returned', 'overdue'] }
        });

        if (!eligibleLoan) {
            return res.status(403).json({
                message: "لا يمكنك التقييم! يجب أن تكون قد استعرت الكتاب وأرجعته للمكتبة أولاً."
            });
        }

        // 2. التحقق من عدم وجود تقييم سابق لنفس العضو لنفس المادة
        const existingReview = await Review.findOne({ memberId: memberId, materialId: materialId });
        if (existingReview) {
            return res.status(400).json({ message: "لقد قمت بتقييم هذه المادة مسبقاً!" });
        }

        // 3. إنشاء التقييم
        const review = await Review.create({
            memberId: memberId,
            materialId: materialId,
            rating,
            reviewText
        });

        // 4. تنسيق التاريخ في الرد (Format)
        const responseData = {
            ...review._doc,
            createdAt: review.createdAt.toISOString().split('T')[0]
        };

        res.status(201).json({ message: "تم إضافة تقييمك بنجاح!", review: responseData });
    };

    // جلب تقييمات مادة معينة (GET)

}

module.exports = new ReviewController();