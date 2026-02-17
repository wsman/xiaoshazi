/**
 * @fileoverview Entropy API Routes
 * @description Handles entropy calculation and historical data endpoints
 */

const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 获取OpenDoge工作区路径
let OPENDOGE_ROOT = path.resolve(__dirname, '../../..');

if (!fs.existsSync(path.join(OPENDOGE_ROOT, 'AGENTS.md'))) {
    const alternatePath = '/home/wsman/OpenDoge';
    if (fs.existsSync(path.join(alternatePath, 'AGENTS.md'))) {
        OPENDOGE_ROOT = alternatePath;
    }
}

/**
 * @swagger
 * /api/entropy:
 *   get:
 *     summary: 获取当前熵值
 *     description: 计算并返回系统当前的熵值
 *     tags: [熵值]
 *     responses:
 *       200:
 *         description: 熵值数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 timestamp:
 *                   type: number
 */
router.get('/entropy', (req, res) => {
    const scriptPath = path.join(OPENDOGE_ROOT, 'scripts/monitoring/entropy_calculator_unified.py');
    const cmd = `cd ${OPENDOGE_ROOT} && python3 ${scriptPath} --json`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Entropy calculation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to calculate entropy',
                message: error.message
            });
        }
        
        try {
            const result = JSON.parse(stdout);
            res.json({
                success: true,
                data: result,
                timestamp: Date.now()
            });
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            res.status(500).json({
                success: false,
                error: 'Failed to parse entropy data'
            });
        }
    });
});

/**
 * @swagger
 * /api/entropy/history:
 *   get:
 *     summary: 获取熵值历史
 *     description: 获取最近100条熵值历史记录
 *     tags: [熵值]
 *     responses:
 *       200:
 *         description: 熵值历史数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 timestamp:
 *                   type: number
 */
router.get('/entropy/history', (req, res) => {
    const historyPath = path.join(OPENDOGE_ROOT, 'memory/entropy_history.json');
    
    if (fs.existsSync(historyPath)) {
        try {
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            res.json({
                success: true,
                data: history.slice(-100),
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to read entropy history:', error);
            res.json({
                success: true,
                data: [],
                timestamp: Date.now()
            });
        }
    } else {
        res.json({
            success: true,
            data: [],
            timestamp: Date.now()
        });
    }
});

module.exports = router;
