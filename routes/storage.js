import express from 'express';
import multer from 'multer';
import { supabase, uploadToSupabase, deleteFromSupabase, getPublicUrl } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * @route   POST /api/storage/upload
 * @desc    Upload file to Supabase storage
 * @access  Protected
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No file provided'
    });
  }

  const { bucket = 'profile-images', folder = '', fileName } = req.body;
  
  // Generate file name if not provided
  const finalFileName = fileName || `${Date.now()}_${req.file.originalname}`;
  const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

  try {
    const result = await uploadToSupabase(
      bucket,
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload Failed',
      message: 'Failed to upload file to storage',
      details: error.message
    });
  }
}));

/**
 * @route   POST /api/storage/upload-multiple
 * @desc    Upload multiple files to Supabase storage
 * @access  Protected
 */
router.post('/upload-multiple', upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No files provided'
    });
  }

  const { bucket = 'profile-images', folder = '' } = req.body;
  
  try {
    const uploadPromises = req.files.map(file => {
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      
      return uploadToSupabase(bucket, filePath, file.buffer, file.mimetype);
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: results
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      error: 'Upload Failed',
      message: 'Failed to upload files to storage',
      details: error.message
    });
  }
}));

/**
 * @route   DELETE /api/storage/delete
 * @desc    Delete file from Supabase storage
 * @access  Protected
 */
router.delete('/delete', asyncHandler(async (req, res) => {
  const { bucket, path } = req.body;

  if (!bucket || !path) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'bucket and path are required'
    });
  }

  try {
    await deleteFromSupabase(bucket, path);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Delete Failed',
      message: 'Failed to delete file from storage',
      details: error.message
    });
  }
}));

/**
 * @route   GET /api/storage/url
 * @desc    Get public URL for a file
 * @access  Protected
 */
router.get('/url', asyncHandler(async (req, res) => {
  const { bucket, path } = req.query;

  if (!bucket || !path) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'bucket and path are required'
    });
  }

  try {
    const url = getPublicUrl(bucket, path);

    res.json({
      success: true,
      url
    });

  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({
      error: 'Failed',
      message: 'Failed to get file URL',
      details: error.message
    });
  }
}));

/**
 * @route   GET /api/storage/list
 * @desc    List files in a bucket/folder
 * @access  Protected
 */
router.get('/list', asyncHandler(async (req, res) => {
  const { bucket, folder = '', limit = 100, offset = 0 } = req.query;

  if (!bucket) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'bucket is required'
    });
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      files: data
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Failed',
      message: 'Failed to list files',
      details: error.message
    });
  }
}));

export default router;
