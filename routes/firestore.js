import express from 'express';
import { getFirestore } from '../config/firebase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/firestore/collection/:collection
 * @desc    Add document to Firestore collection
 * @access  Protected
 */
router.post('/collection/:collection', asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Document data is required'
    });
  }

  try {
    const db = await getFirestore();
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Document created successfully',
      id: docRef.id,
      collection
    });

  } catch (error) {
    console.error('Firestore add error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to add document',
      details: error.message
    });
  }
}));

/**
 * @route   GET /api/firestore/collection/:collection/:id
 * @desc    Get document from Firestore
 * @access  Protected
 */
router.get('/collection/:collection/:id', asyncHandler(async (req, res) => {
  const { collection, id } = req.params;

  try {
    const db = await getFirestore();
    const doc = await db.collection(collection).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      id: doc.id,
      data: doc.data()
    });

  } catch (error) {
    console.error('Firestore get error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to fetch document',
      details: error.message
    });
  }
}));

/**
 * @route   PUT /api/firestore/collection/:collection/:id
 * @desc    Update document in Firestore
 * @access  Protected
 */
router.put('/collection/:collection/:id', asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Update data is required'
    });
  }

  try {
    const db = await getFirestore();
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      id,
      collection
    });

  } catch (error) {
    console.error('Firestore update error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to update document',
      details: error.message
    });
  }
}));

/**
 * @route   DELETE /api/firestore/collection/:collection/:id
 * @desc    Delete document from Firestore
 * @access  Protected
 */
router.delete('/collection/:collection/:id', asyncHandler(async (req, res) => {
  const { collection, id } = req.params;

  try {
    const db = await getFirestore();
    await db.collection(collection).doc(id).delete();

    res.json({
      success: true,
      message: 'Document deleted successfully',
      id,
      collection
    });

  } catch (error) {
    console.error('Firestore delete error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to delete document',
      details: error.message
    });
  }
}));

/**
 * @route   GET /api/firestore/collection/:collection
 * @desc    Query documents from Firestore collection
 * @access  Protected
 */
router.get('/collection/:collection', asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const { limit = 100, orderBy, orderDirection = 'asc', where } = req.query;

  try {
    const db = await getFirestore();
    let query = db.collection(collection);

    // Apply where clause if provided (format: field:operator:value)
    if (where) {
      const conditions = Array.isArray(where) ? where : [where];
      conditions.forEach(condition => {
        const [field, operator, value] = condition.split(':');
        query = query.where(field, operator, value);
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy, orderDirection);
    }

    // Apply limit
    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      collection,
      count: documents.length,
      documents
    });

  } catch (error) {
    console.error('Firestore query error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to query collection',
      details: error.message
    });
  }
}));

/**
 * @route   POST /api/firestore/batch
 * @desc    Batch write operations
 * @access  Protected
 */
router.post('/batch', asyncHandler(async (req, res) => {
  const { operations } = req.body;

  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'operations array is required'
    });
  }

  try {
    const db = await getFirestore();
    const batch = db.batch();

    operations.forEach(op => {
      const docRef = db.collection(op.collection).doc(op.id);
      
      switch (op.type) {
        case 'set':
          batch.set(docRef, op.data);
          break;
        case 'update':
          batch.update(docRef, op.data);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        default:
          throw new Error(`Invalid operation type: ${op.type}`);
      }
    });

    await batch.commit();

    res.json({
      success: true,
      message: `Batch operation completed: ${operations.length} operations executed`
    });

  } catch (error) {
    console.error('Firestore batch error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to execute batch operations',
      details: error.message
    });
  }
}));

export default router;
