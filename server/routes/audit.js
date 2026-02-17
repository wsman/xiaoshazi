/**
 * @fileoverview Audit API Routes
 * @description Handles audit log and statistics endpoints
 */

const express = require('express');
const fs = require('fs');

const router = express.Router();

const AUDIT_LOG_FILE = process.env.AUDIT_LOG_FILE || '/tmp/xiaoshazi-audit.log';

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: 获取审计日志
 *     description: 分页获取审计日志记录
 *     tags: [审计]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 审计日志列表
 */
router.get('/logs', (req, res) => {
    const { limit = 50, offset = 0, event } = req.query;
    
    try {
        if (!fs.existsSync(AUDIT_LOG_FILE)) {
            return res.json({
                success: true,
                data: [],
                total: 0
            });
        }
        
        const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').reverse(); // 最新的在前
        
        let filtered = lines;
        if (event) {
            filtered = lines.filter(line => {
                try {
                    const log = JSON.parse(line);
                    return log.event === event;
                } catch {
                    return false;
                }
            });
        }
        
        const total = filtered.length;
        const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        const logs = paginated.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return { raw: line };
            }
        });
        
        res.json({
            success: true,
            data: logs,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Audit log read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read audit logs',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: 获取审计统计
 *     description: 获取审计日志的统计数据
 *     tags: [审计]
 *     responses:
 *       200:
 *         description: 审计统计数据
 */
router.get('/stats', (req, res) => {
    try {
        if (!fs.existsSync(AUDIT_LOG_FILE)) {
            return res.json({
                success: true,
                data: {
                    total: 0,
                    events: {}
                }
            });
        }
        
        const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
        const lines = content.trim().split('\n');
        
        const events = {};
        let total = 0;
        
        lines.forEach(line => {
            try {
                const log = JSON.parse(line);
                total++;
                events[log.event] = (events[log.event] || 0) + 1;
            } catch {
                // ignore
            }
        });
        
        res.json({
            success: true,
            data: {
                total,
                events
            }
        });
    } catch (error) {
        console.error('Audit stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get audit stats',
            message: error.message
        });
    }
});

module.exports = router;
