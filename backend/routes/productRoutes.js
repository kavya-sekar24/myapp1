const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { adminAuth } = require('../middleware/auth');

router.get('/', productController.getProducts);
router.post('/', adminAuth, productController.createProduct);
router.put('/:id', adminAuth, productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);
router.patch('/:id/stock', adminAuth, productController.updateStock);

module.exports = router;
