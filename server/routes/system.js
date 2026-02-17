/**
 * @fileoverview System API Routes
 * @description Handles system information, health check, and time endpoints
 */

const express = require('express');
const os = require('os');

const router = express.Router();

/**
 * @swagger
 * /api/time:
 *   get:
 *     summary: 获取服务器时间
 *     description: 返回当前服务器时间和时区信息
 *     tags: [系统]
 *     responses:
 *       200:
 *         description: 服务器时间信息
 */
router.get('/time', (req, res) => {
    res.json({
        success: true,
        timestamp: Date.now(),
        serverTime: new Date().toISOString(),
        timezone: 'Asia/Shanghai (UTC+8)',
        message: '当前服务器时间'
    });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 健康检查
 *     description: 返回服务器健康状态和系统指标
 *     tags: [系统]
 *     responses:
 *       200:
 *         description: 服务器健康状态
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        load: os.loadavg(),
        timestamp: Date.now()
    });
});

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: 获取服务器信息
 *     description: 返回服务器基本信息和功能列表
 *     tags: [系统]
 *     responses:
 *       200:
 *         description: 服务器信息
 */
router.get('/info', (req, res) => {
    res.json({
        server: 'HTTP测试服务器',
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        port: 14514,
        protocol: 'HTTP',
        features: ['动态API', '静态文件服务', 'JSON支持']
    });
});

module.exports = router;
