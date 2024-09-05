import express from 'express';
import authRoutes from './auth';
import householdRoutes from './households';
import choreRoutes from './chores';
import notificationRoutes from './notifications';
import userRoutes from './users';
import choreTemplateRoutes from './choreTemplates';
import calendarIntegrationRoutes from './calendarIntegration';
import badgeRoutes from './badges';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/households', householdRoutes);
router.use('/chores', choreRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/chore-templates', choreTemplateRoutes);
router.use('/calendar-integration', calendarIntegrationRoutes);
router.use('/badges', badgeRoutes);

export default router;