const express = require('express');
const sbcActionsController = require('../controllers/sbcActionsController');

const router = express.Router();

router.route('/test').get(sbcActionsController.test);

module.exports = router;
