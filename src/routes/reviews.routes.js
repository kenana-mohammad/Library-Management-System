const express = require('express');
const router = express.Router();
const id = require('../middlewares/id');
const asyncHandler = require('../utils/asyncHandler');
const reviewController = require('../controllers/reviews.controllers');


router.post('/', asyncHandler(reviewController.createReview));

module.exports = router;