const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    // Relationship Fields
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Data & Problem-solving Fields
    reservedAt: { type: Date, default: Date.now },
    queuePriority: { type: Number, default: 1 },
    notifiedWhenAvailable: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'active', 'cancelled'], default: 'pending' },
    autoCancelAfter: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);