/**
 * @fileoverview Users API Routes
 * @description Handles user management and echo endpoint
 */

const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     description: 返回测试用户列表
 *     tags: [用户]
 *     responses:
 *       200:
 *         description: 用户列表
 */
router.get('/users', (req, res) => {
    const users = [
        { id: 1, name: '测试用户1', email: 'user1@test.com', role: 'admin' },
        { id: 2, name: '测试用户2', email: 'user2@test.com', role: 'user' },
        { id: 3, name: '测试用户3', email: 'user3@test.com', role: 'user' }
    ];
    res.json({
        success: true,
        count: users.length,
        users: users,
        timestamp: Date.now()
    });
});

/**
 * @swagger
 * /api/echo:
 *   post:
 *     summary: Echo endpoint
 *     description: 回显接收到的数据
 *     tags: [工具]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 回显数据
 */
router.post('/echo', (req, res) => {
    res.json({
        success: true,
        message: '数据已接收',
        receivedData: req.body,
        timestamp: Date.now()
    });
});

module.exports = router;
