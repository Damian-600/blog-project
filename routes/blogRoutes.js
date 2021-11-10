const express = require('express');
const sbcActionsController = require('../controllers/sbcActionsController');

const router = express.Router();

router.route('/test').get(sbcActionsController.test);
router.route('/newTenant').put(sbcActionsController.newTenant);

module.exports = router;
