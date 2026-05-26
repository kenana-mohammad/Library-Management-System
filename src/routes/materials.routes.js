const express = require('express');
const router = express.Router();
const id = require('../middlewares/id');
const asyncHandler = require('../utils/asyncHandler');
const materialController = require('../controllers/materials.controllers');

router.get('/', asyncHandler(materialController.getAllMaterials));
router.get('/:id', [id], asyncHandler(materialController.getMaterialById));
router.post('/', asyncHandler(materialController.createMaterial));

module.exports = router;