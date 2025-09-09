import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 사용자 목록 조회
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const user_type = req.query['user_type'] as string;
    const user_status = req.query['user_status'] as string;

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        whereConditions.push('(username LIKE ? OR email LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (user_type) {
        whereConditions.push('user_type = ?');
        queryParams.push(user_type);
      }

      if (user_status) {
        whereConditions.push('user_status = ?');
        queryParams.push(user_status);
      }

      const whereClause = whereConditions.join(' AND ');

      // 전체 개수 조회
      const [countResult] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // 사용자 목록 조회 (비밀번호 제외)
      const [users] = await connection.execute<RowDataPacket[]>(
        `SELECT id, username, email, user_type, user_status, created_at, updated_at 
         FROM users WHERE ${whereClause} 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      res.json({
        success: true,
        data: {
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: '사용자 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 생성
router.post('/', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password_hash, 
      user_type = 'member',
      user_status = 'active'
    } = req.body;

    if (!username || !email || !password_hash) {
      return res.status(400).json({
        success: false,
        error: '사용자명, 이메일, 비밀번호는 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 이메일 중복 확인
      const [existingUsers] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: '이미 존재하는 이메일입니다.'
        });
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO users (username, email, password_hash, user_type, user_status) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, email, password_hash, user_type, user_status]
      );

      res.status(201).json({
        success: true,
        data: { id: result.insertId },
        message: '사용자가 생성되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: '사용자 생성 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 수정
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, email, user_type, user_status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 사용자 존재 확인
      const [existingUsers] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        });
      }

      // 이메일 중복 확인 (다른 사용자)
      if (email) {
        const [duplicateUsers] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, id]
        );

        if (duplicateUsers.length > 0) {
          return res.status(400).json({
            success: false,
            error: '이미 존재하는 이메일입니다.'
          });
        }
      }

      const updateFields: string[] = [];
      const updateParams: any[] = [];

      const fieldsToUpdate = ['username', 'email', 'user_type', 'user_status'];

      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateParams.push(req.body[field]);
        }
      });

      if (updateFields.length > 0) {
        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          [...updateParams, id]
        );
      }

      res.json({
        success: true,
        message: '사용자 정보가 수정되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: '사용자 수정 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 삭제
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
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '사용자가 삭제되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: '사용자 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router;