const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controllers');
const asyncHandler = require('./../utils/asyncHandler')
router.post('/', asyncHandler(userController.createUser));
router.get('/', asyncHandler(userController.getAllUsers));
router.get('/:id', asyncHandler(userController.getUserById));
router.put('/:id', asyncHandler(userController.updateUser));
router.delete('/:id', asyncHandler(userController.deleteUser));
module.exports = router;