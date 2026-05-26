const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    materialType: {
        type: String,
        required: true,
        enum: ['book', 'magazine', 'cd', 'map'],
        default: 'book'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    totalCopies: {
        type: Number,
        required: true,
        min: [1, 'Total copies must be at least 1']
    },
    availableCopies: {
        type: Number,
        required: true,
        min: 0
    },
    coverImageUrl: {
        type: String,
        trim: true,
        default: ''
    },

    // Book-specific fields
    author: {
        type: String,
        trim: true,
        default: null
    },
    publisher: {
        type: String,
        trim: true,
        default: null
    },
    publicationYear: {
        type: Number,
        min: 1000,
        max: 9999,
        default: null
    },
    ISBN: { // 🌟 ضبط الحروف لتطابق الجدول تماماً كابيتال
        type: String,
        unique: true,
        sparse: true, // حماية تكرار الـ null للمجلات والـ CD
        trim: true,
        default: null
    },

    // Magazine-specific fields
    issueNumber: {
        type: Number,
        min: 0,
        default: null
    },
    month: {
        type: String,
        trim: true,
        default: null
    },
    year: {
        type: Number,
        min: 1000,
        max: 9999,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Material', materialSchema);