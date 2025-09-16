import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 카테고리 목록 조회 (계층 구조)
router.get('/', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(`
        SELECT id, category_name, category_description, category_icon, 
               parent_id, category_order, category_status, created_at, updated_at
        FROM categories 
        WHERE category_status != 'deleted'
        ORDER BY parent_id ASC, category_order ASC
      `);

      const categories = rows.map((row: any) => ({
        id: row.id,
        category_name: row.category_name,
        category_description: row.category_description,
        category_icon: row.category_icon,
        parent_id: row.parent_id,
        category_order: row.category_order,
        priority: 0,
        category_status: row.category_status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      // 계층 구조로 정리
      const mainCategories = categories.filter((cat: any) => !cat.parent_id);
      const organized = mainCategories.map((mainCat: any) => ({
        ...mainCat,
        children: categories.filter((cat: any) => cat.parent_id === mainCat.id)
      }));

      res.json({
        success: true,
        data: organized
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 조회 중 오류가 발생했습니다.'
    });
  }
});

// 카테고리 생성
router.post('/', async (req, res) => {
  try {
    const { category_name, category_description, category_icon, parent_id, category_order } = req.body;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        error: '카테고리명은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(`
        INSERT INTO categories (category_name, category_description, category_icon, parent_id, category_order, category_status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `, [category_name, category_description || null, category_icon || null, parent_id || null, category_order || 1]);

      res.status(201).json({
        success: true,
        data: { id: result.insertId },
        message: '카테고리가 생성되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 생성 중 오류가 발생했습니다.'
    });
  }
});

// 카테고리 수정
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { category_name, category_description, category_icon, category_status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(`
        UPDATE categories 
        SET category_name = ?, category_description = ?, category_icon = ?, category_status = ?, updated_at = NOW()
        WHERE id = ?
      `, [category_name, category_description || null, category_icon || null, category_status, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '카테고리를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '카테고리가 수정되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 수정 중 오류가 발생했습니다.'
    });
  }
});

// 카테고리 삭제
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 하위 카테고리도 함께 삭제
      await connection.execute(`
        UPDATE categories 
        SET category_status = 'deleted', updated_at = NOW()
        WHERE id = ? OR parent_id = ?
      `, [id, id]);

      res.json({
        success: true,
        message: '카테고리가 삭제되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 카테고리 순서 변경
router.put('/:id/reorder', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { new_order, parent_id } = req.body;

    if (isNaN(id) || isNaN(new_order)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID 또는 순서입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 현재 카테고리 정보 조회
      const [currentRows] = await connection.execute<RowDataPacket[]>(`
        SELECT category_order, parent_id FROM categories WHERE id = ?
      `, [id]);

      if (currentRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: '카테고리를 찾을 수 없습니다.'
        });
      }

      const currentCategory = currentRows[0];
      const oldOrder = currentCategory.category_order;
      const oldParentId = currentCategory.parent_id;
      const newParentId = parent_id || null;

      // 같은 부모 내에서의 순서 변경인지 확인
      const isSameParent = oldParentId === newParentId;

      if (isSameParent) {
        // 같은 부모 내에서 순서 변경
        if (oldOrder < new_order) {
          // 아래로 이동: 기존 위치와 새 위치 사이의 항목들을 위로 이동
          await connection.execute(`
            UPDATE categories 
            SET category_order = category_order - 1, updated_at = NOW()
            WHERE parent_id ${oldParentId ? '= ?' : 'IS NULL'} 
            AND category_order > ? AND category_order <= ?
            AND id != ?
          `, oldParentId ? [oldParentId, oldOrder, new_order, id] : [oldOrder, new_order, id]);
        } else if (oldOrder > new_order) {
          // 위로 이동: 새 위치와 기존 위치 사이의 항목들을 아래로 이동
          await connection.execute(`
            UPDATE categories 
            SET category_order = category_order + 1, updated_at = NOW()
            WHERE parent_id ${oldParentId ? '= ?' : 'IS NULL'} 
            AND category_order >= ? AND category_order < ?
            AND id != ?
          `, oldParentId ? [oldParentId, new_order, oldOrder, id] : [new_order, oldOrder, id]);
        }
      } else {
        // 다른 부모로 이동
        // 1. 기존 부모에서 제거 후 뒤의 항목들 앞으로 이동
        await connection.execute(`
          UPDATE categories 
          SET category_order = category_order - 1, updated_at = NOW()
          WHERE parent_id ${oldParentId ? '= ?' : 'IS NULL'} 
          AND category_order > ?
        `, oldParentId ? [oldParentId, oldOrder] : [oldOrder]);

        // 2. 새 부모에서 새 위치 이후의 항목들 뒤로 이동
        await connection.execute(`
          UPDATE categories 
          SET category_order = category_order + 1, updated_at = NOW()
          WHERE parent_id ${newParentId ? '= ?' : 'IS NULL'} 
          AND category_order >= ?
        `, newParentId ? [newParentId, new_order] : [new_order]);
      }

      // 해당 카테고리의 순서와 부모 업데이트
      await connection.execute(`
        UPDATE categories 
        SET category_order = ?, parent_id = ?, updated_at = NOW()
        WHERE id = ?
      `, [new_order, newParentId, id]);

      await connection.commit();

      res.json({
        success: true,
        message: '카테고리 순서가 변경되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error reordering category:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 순서 변경 중 오류가 발생했습니다.'
    });
  }
});

export default router;