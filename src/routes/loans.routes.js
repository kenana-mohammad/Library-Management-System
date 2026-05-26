const express = require('express');
const router = express.Router();
const id = require('../middlewares/id');
const asyncHandler = require('../utils/asyncHandler');
const loanController = require('../controllers/loans.controllers');
router.post('/createLoan', asyncHandler(loanController.createLoan));

// router.get('/', asyncHandler(loanController.getAllLoans));

router.put('/:id/return', asyncHandler(loanController.returnLoan));
module.exports = router;