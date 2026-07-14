import { Router } from 'express';
import * as uploadController from './upload.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { upload, uploadDocument, uploadVideo } from '../../middlewares/upload.middleware';

const router = Router();

// All asset management is admin-only.
router.use(authenticate, authorize('ADMIN'));

router.post('/image', upload.single('image'), uploadController.uploadImage);
router.post('/images', upload.array('images', 10), uploadController.uploadImages);
router.post('/pdf', uploadDocument.single('file'), uploadController.uploadPdf);
router.post('/video', uploadVideo.single('video'), uploadController.uploadVideoFile);
router.delete('/', uploadController.removeAsset);

export default router;
