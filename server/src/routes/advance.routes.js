const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const controller = require('../controllers/advanceController');

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/approve', authorizeRoles('CEO', 'CHAIRMAN'), controller.approve);
router.patch('/:id/disburse', authorizeRoles('ACCOUNTANT'), controller.disburse);
router.post('/:id/settlement', authorizeRoles('SITE_MANAGER', 'PROCUREMENT', 'CEO', 'CHAIRMAN', 'ACCOUNTANT'), upload.array('attachments', 5), controller.submitSettlement);
router.patch('/:id/confirm-surplus', authorizeRoles('ACCOUNTANT'), controller.confirmSurplus);

module.exports = router;
