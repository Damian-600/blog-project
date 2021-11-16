const express = require('express');
const sbcActionsController = require('../controllers/sbcActionsController');

const router = express.Router();

router.route('/test').get(sbcActionsController.test);
router.route('/sbcStatus/:ip').get(sbcActionsController.sbcStatus);

module.exports = router;
