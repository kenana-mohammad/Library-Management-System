const Reservation = require('../models/Reservation');
const Material = require('../models/Material');

class ReservationController {

    createReservation = async(req, res) => {
        const { materialId, memberId } = req.body;

        const material = await Material.findById(materialId);
        if (!material) return res.status(404).json({ message: "المادة غير موجودة." });

        if (material.availableCopies > 0) {
            return res.status(400).json({ message: "المادة متوفرة، يمكنك استعارتها مباشرة!" });
        }

        // 🌟 تحديد الأولوية: معرفة كم شخص حاجز قبله
        const count = await Reservation.countDocuments({ materialId: materialId, status: 'pending' });

        const reservation = await Reservation.create({
            materialId: materialId,
            memberId: memberId,
            queuePriority: count + 1, // الأولوية تعتمد على ترتيب الحجز
            autoCancelAfter: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        //  تنسيق التاريخ للرد (Format)
        const responseData = {
            ...reservation._doc,
            reservedAt: reservation.reservedAt.toISOString().split('T')[0],
            autoCancelAfter: reservation.autoCancelAfter.toISOString().split('T')[0]
        };

        res.status(201).json({ message: "تم تسجيل الحجز بنجاح.", reservation: responseData });
    };
    // جلب كافة الحجوزات (GET)
    getAllReservations = async(req, res) => {
        const reservations = await Reservation.find().populate('materialId memberId');
        res.status(200).json({ count: reservations.length, reservations });
    };
}

module.exports = new ReservationController();