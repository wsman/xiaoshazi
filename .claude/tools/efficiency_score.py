#!/usr/bin/env python3
"""
会话效率评分系统 (Session Efficiency Scoring System)

功能:
- 多维度评分（消息、任务、Token、宪法）
- 加权评分算法
- 效率趋势分析
- 低效模式识别
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse


class EfficiencyScorer:
    """会话效率评分器"""
    
    # 权重配置 (可调整)
    WEIGHTS = {
        "message_efficiency": 0.25,    # 消息效率权重
        "task_completion": 0.30,        # 任务完成度权重
        "token_efficiency": 0.25,      # Token效率权重
        "constitutional_compliance": 0.20  # 宪法合规权重
    }
    
    # 评分等级阈值
    GRADE_THRESHOLDS = {
        "A+": 95, "A": 90, "A-": 85,
        "B+": 80, "B": 75, "B-": 70,
        "C+": 65, "C": 60, "C-": 55,
        "D": 50, "F": 0
    }
    
    # 低效模式
    INEFFICIENT_PATTERNS = {
        "excessive_messages": {"threshold": 20, "weight": -10},
        "low_task_ratio": {"threshold": 0.3, "weight": -15},  # 任务消息/总消息
        "high_token_waste": {"threshold": 2.0, "weight": -10},  # output/input比率
        "repeated_tool_calls": {"threshold": 5, "weight": -5},
        "missing_todos": {"threshold": 0, "weight": -5},
    }
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.sessions_index = self._find_sessions_index()
        
    def _find_sessions_index(self) -> Optional[Path]:
        """查找会话索引文件"""
        # 首先检查项目本地 .claude/projects/
        local_path = self.project_path / ".claude" / "projects"
        if local_path.exists():
            for proj_dir in local_path.iterdir():
                sessions_file = proj_dir / "sessions-index.json"
                if sessions_file.exists():
                    return sessions_file
        
        # 检查 ~/.claude/projects/
        home_projects = Path.home() / ".claude" / "projects"
        if home_projects.exists():
            for proj_dir in home_projects.iterdir():
                if proj_dir.is_dir():
                    sessions_file = proj_dir / "sessions-index.json"
                    if sessions_file.exists():
                        # 检查是否属于当前项目
                        with open(sessions_file, 'r') as f:
                            data = json.load(f)
                            orig_path = data.get('originalPath', '')
                            if str(self.project_path) in orig_path or orig_path in str(self.project_path):
                                return sessions_file
        return None
    
    def load_sessions(self) -> List[Dict]:
        """加载所有会话数据"""
        if not self.sessions_index:
            return []
            
        with open(self.sessions_index, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('entries', [])
    
    def analyze_session(self, session_file: Path) -> Dict:
        """分析单个会话的效率"""
        stats = {
            "message_count": 0,
            "user_messages": 0,
            "assistant_messages": 0,
            "tool_calls": 0,
            "task_messages": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "has_todos": False,
            "tool_use_patterns": {},
            "constitutional_flags": {
                "safety_checked": 0,
                "human_approval_sought": 0,
                "transparent_about_limitations": 0
            }
        }
        
        try:
            with open(session_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        msg_type = entry.get('type')
                        
                        if msg_type == 'user':
                            stats["user_messages"] += 1
                            # 检查是否是任务型消息
                            content = entry.get('message', {}).get('content', '')
                            if isinstance(content, str) and any(kw in content for kw in ['任务', '创建', '修改', '实现', '完成']):
                                stats["task_messages"] += 1
                                
                        elif msg_type == 'assistant':
                            stats["assistant_messages"] += 1
                            usage = entry.get('message', {}).get('usage', {})
                            stats["total_input_tokens"] += usage.get('input_tokens', 0)
                            stats["total_output_tokens"] += usage.get('output_tokens', 0)
                            
                            # 检查工具调用
                            content = entry.get('message', {}).get('content', [])
                            if isinstance(content, list):
                                for item in content:
                                    if item.get('type') == 'tool_use':
                                        stats["tool_calls"] += 1
                                        tool_name = item.get('name', 'unknown')
                                        stats["tool_use_patterns"][tool_name] = stats["tool_use_patterns"].get(tool_name, 0) + 1
                            
                            # 检查是否使用了TodoWrite
                            if isinstance(content, list):
                                for item in content:
                                    if item.get('type') == 'tool_use' and item.get('name') == 'TodoWrite':
                                        stats["has_todos"] = True
                            
                            # 简单的宪法合规检查
                            # 检查是否提到了安全检查、人力批准等
                            text_content = str(content)
                            if any(word in text_content for word in ['安全', 'safety', '确认', '确认', 'approval']):
                                stats["constitutional_flags"]["human_approval_sought"] += 1
                            if any(word in text_content for word in ['限制', 'limitation', '不确定', 'not sure']):
                                stats["constitutional_flags"]["transparent_about_limitations"] += 1
                                
                    except json.JSONDecodeError:
                        continue
                        
        except Exception as e:
            return {"error": str(e)}
        
        stats["message_count"] = stats["user_messages"] + stats["assistant_messages"]
        return stats
    
    def calculate_message_efficiency(self, stats: Dict) -> Tuple[float, str]:
        """计算消息效率分数"""
        msg_count = stats.get("message_count", 0)
        tool_calls = stats.get("tool_calls", 0)
        
        if msg_count == 0:
            return 0, "无消息"
        
        # 工具调用效率: 每条消息的工具调用数
        tool_efficiency = tool_calls / msg_count if msg_count > 0 else 0
        
        # 消息数量效率: 理想范围 3-15 条
        if msg_count <= 3:
            score = 100
            reason = "简洁有效"
        elif msg_count <= 10:
            score = 90
            reason = "正常范围"
        elif msg_count <= 20:
            score = 75
            reason = "消息偏多"
        else:
            score = max(50, 100 - (msg_count - 20) * 3)
            reason = "消息过多"
        
        # 工具调用加分
        if tool_calls > 0:
            score = min(100, score + 10)
        
        return round(score, 1), reason
    
    def calculate_task_completion_score(self, stats: Dict) -> Tuple[float, str]:
        """计算任务完成度分数"""
        task_messages = stats.get("task_messages", 0)
        user_messages = stats.get("user_messages", 0)
        
        if user_messages == 0:
            return 0, "无用户消息"
        
        # 任务比率
        task_ratio = task_messages / user_messages
        
        if task_ratio >= 0.8:
            score = 100
            reason = "高效任务导向"
        elif task_ratio >= 0.5:
            score = 85
            reason = "任务明确"
        elif task_ratio >= 0.3:
            score = 70
            reason = "部分任务导向"
        else:
            score = max(40, task_ratio * 200)
            reason = "任务导向不足"
        
        # Todo使用加分
        if stats.get("has_todos", False):
            score = min(100, score + 5)
        
        return round(score, 1), reason
    
    def calculate_token_efficiency(self, stats: Dict) -> Tuple[float, str]:
        """计算Token效率分数"""
        input_tokens = stats.get("total_input_tokens", 0)
        output_tokens = stats.get("total_output_tokens", 0)
        
        if input_tokens == 0:
            return 0, "无Token使用"
        
        # Output/Input 比率
        ratio = output_tokens / input_tokens if input_tokens > 0 else 0
        
        # 理想范围: 0.3 - 1.5
        if 0.3 <= ratio <= 1.5:
            score = 100
            reason = "Token使用合理"
        elif ratio < 0.3:
            score = max(50, ratio * 300)
            reason = "输出不足"
        else:
            score = max(40, 150 - (ratio - 1.5) * 50)
            reason = "输出过多"
        
        # 消息效率调整
        msg_count = stats.get("message_count", 0)
        if msg_count > 0:
            tokens_per_msg = (input_tokens + output_tokens) / msg_count
            # 理想: 每条消息 500-3000 tokens
            if 500 <= tokens_per_msg <= 3000:
                score = min(100, score + 5)
            elif tokens_per_msg < 500:
                score = min(100, score + 10)  # 简洁
            else:
                score = max(30, score - 10)  # 冗长
        
        return round(score, 1), reason
    
    def calculate_constitutional_compliance(self, stats: Dict) -> Tuple[float, str]:
        """计算宪法合规分数 (§101, §102)"""
        flags = stats.get("constitutional_flags", {})
        
        # 基于flags计算合规分数
        approval_score = min(100, flags.get("human_approval_sought", 0) * 25)
        transparency_score = min(100, flags.get("transparent_about_limitations", 0) * 25)
        
        # 默认基础分
        base_score = 70
        
        score = (approval_score + transparency_score + base_score) / 2
        
        if score >= 80:
            reason = "良好合规"
        elif score >= 60:
            reason = "基本合规"
        else:
            reason = "需改进合规"
        
        return round(score, 1), reason
    
    def detect_inefficient_patterns(self, stats: Dict) -> List[Dict]:
        """识别低效模式"""
        patterns = []
        
        # 过多消息
        if stats.get("message_count", 0) > self.INEFFICIENT_PATTERNS["excessive_messages"]["threshold"]:
            patterns.append({
                "type": "excessive_messages",
                "severity": "warning",
                "description": f"消息数量过多 ({stats['message_count']} > {self.INEFFICIENT_PATTERNS['excessive_messages']['threshold']})",
                "suggestion": "考虑合并任务或使用模板"
            })
        
        # 低任务比率
        user_messages = stats.get("user_messages", 0)
        task_messages = stats.get("task_messages", 0)
        if user_messages > 0:
            task_ratio = task_messages / user_messages
            if task_ratio < self.INEFFICIENT_PATTERNS["low_task_ratio"]["threshold"]:
                patterns.append({
                    "type": "low_task_ratio",
                    "severity": "warning",
                    "description": f"任务消息比率过低 ({task_ratio:.2f})",
                    "suggestion": "使用更明确的任务描述"
                })
        
        # Token浪费
        input_tokens = stats.get("total_input_tokens", 0)
        output_tokens = stats.get("total_output_tokens", 0)
        if input_tokens > 0:
            ratio = output_tokens / input_tokens
            if ratio > self.INEFFICIENT_PATTERNS["high_token_waste"]["threshold"]:
                patterns.append({
                    "type": "high_token_waste",
                    "severity": "warning",
                    "description": f"Output/Input比率过高 ({ratio:.2f})",
                    "suggestion": "优化提示词，减少冗余输出"
                })
        
        # 重复工具调用
        tool_patterns = stats.get("tool_use_patterns", {})
        for tool, count in tool_patterns.items():
            if count > self.INEFFICIENT_PATTERNS["repeated_tool_calls"]["threshold"]:
                patterns.append({
                    "type": "repeated_tool_calls",
                    "severity": "info",
                    "description": f"工具 {tool} 被调用 {count} 次",
                    "suggestion": "考虑批量操作"
                })
        
        # 缺少Todo
        if not stats.get("has_todos", False) and stats.get("message_count", 0) > 3:
            patterns.append({
                "type": "missing_todos",
                "severity": "info",
                "description": "未使用TodoWrite跟踪任务进度",
                "suggestion": "对于复杂任务，建议使用TodoWrite"
            })
        
        return patterns
    
    def calculate_overall_score(self, stats: Dict) -> Dict:
        """计算综合效率分数"""
        # 各维度评分
        msg_score, msg_reason = self.calculate_message_efficiency(stats)
        task_score, task_reason = self.calculate_task_completion_score(stats)
        token_score, token_reason = self.calculate_token_efficiency(stats)
        const_score, const_reason = self.calculate_constitutional_compliance(stats)
        
        # 加权总分
        total_score = (
            msg_score * self.WEIGHTS["message_efficiency"] +
            task_score * self.WEIGHTS["task_completion"] +
            token_score * self.WEIGHTS["token_efficiency"] +
            const_score * self.WEIGHTS["constitutional_compliance"]
        )
        
        # 转换为等级
        grade = "F"
        for g, threshold in self.GRADE_THRESHOLDS.items():
            if total_score >= threshold:
                grade = g
                break
        
        # 识别低效模式
        inefficient_patterns = self.detect_inefficient_patterns(stats)
        
        return {
            "overall_score": round(total_score, 1),
            "grade": grade,
            "dimensions": {
                "message_efficiency": {"score": msg_score, "reason": msg_reason},
                "task_completion": {"score": task_score, "reason": task_reason},
                "token_efficiency": {"score": token_score, "reason": token_reason},
                "constitutional_compliance": {"score": const_score, "reason": const_reason}
            },
            "inefficient_patterns": inefficient_patterns
        }
    
    def analyze_all_sessions(self) -> Dict:
        """分析所有会话"""
        sessions = self.load_sessions()
        results = {
            "total_sessions": len(sessions),
            "sessions": [],
            "trends": {}
        }
        
        scores = []
        
        for session in sessions:
            session_file = Path(session['fullPath'])
            stats = self.analyze_session(session_file)
            
            if "error" not in stats:
                efficiency = self.calculate_overall_score(stats)
                results["sessions"].append({
                    "session_id": session['sessionId'],
                    "first_prompt": session.get('firstPrompt', '')[:80],
                    "created": session.get('created', ''),
                    "stats": stats,
                    "efficiency": efficiency
                })
                scores.append(efficiency["overall_score"])
        
        # 趋势分析
        if scores:
            results["trends"] = {
                "average_score": round(sum(scores) / len(scores), 1),
                "highest_score": max(scores),
                "lowest_score": min(scores),
                "total_analyzed": len(scores)
            }
        
        return results
    
    def generate_report(self, output_path: Optional[str] = None) -> str:
        """生成效率评分报告"""
        analysis = self.analyze_all_sessions()
        
        report = f"""# 会话效率评分报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**项目路径**: {self.project_path}

---

## 概览

- **总会话数**: {analysis['total_sessions']}
- **已分析**: {analysis['trends'].get('total_analyzed', 0)}
- **平均效率分**: {analysis['trends'].get('average_score', 0)}
- **最高分**: {analysis['trends'].get('highest_score', 0)}
- **最低分**: {analysis['trends'].get('lowest_score', 0)}

---

## 权重配置

| 维度 | 权重 |
|------|------|
| 消息效率 | {self.WEIGHTS['message_efficiency']*100:.0f}% |
| 任务完成度 | {self.WEIGHTS['task_completion']*100:.0f}% |
| Token效率 | {self.WEIGHTS['token_efficiency']*100:.0f}% |
| 宪法合规 | {self.WEIGHTS['constitutional_compliance']*100:.0f}% |

---

## 会话详情

"""
        
        for i, session in enumerate(analysis["sessions"], 1):
            eff = session["efficiency"]
            stats = session["stats"]
            
            report += f"""### {i}. {session['session_id'][:8]}... ({eff['grade']}级)

**创建时间**: {session['created'][:10]}
**综合分数**: {eff['overall_score']}/100

#### 维度评分

| 维度 | 分数 | 评价 |
|------|------|------|
| 消息效率 | {eff['dimensions']['message_efficiency']['score']} | {eff['dimensions']['message_efficiency']['reason']} |
| 任务完成度 | {eff['dimensions']['task_completion']['score']} | {eff['dimensions']['task_completion']['reason']} |
| Token效率 | {eff['dimensions']['token_efficiency']['score']} | {eff['dimensions']['token_efficiency']['reason']} |
| 宪法合规 | {eff['dimensions']['constitutional_compliance']['score']} | {eff['dimensions']['constitutional_compliance']['reason']} |

#### 统计数据

- 消息数: {stats['message_count']} (用户: {stats['user_messages']}, 助手: {stats['assistant_messages']})
- 工具调用: {stats['tool_calls']}
- Input Tokens: {stats['total_input_tokens']:,}
- Output Tokens: {stats['total_output_tokens']:,}

"""
            
            # 低效模式
            patterns = eff.get('inefficient_patterns', [])
            if patterns:
                report += "#### ⚠️ 低效模式\n\n"
                for p in patterns:
                    report += f"- **{p['type']}**: {p['description']} → {p['suggestion']}\n"
                report += "\n"
        
        # 改进建议
        report += """
---

## 改进建议

1. **消息优化**: 保持消息简洁，控制在10条以内
2. **任务明确**: 使用清晰的任务描述和模板
3. **Token节省**: 优化提示词，避免冗余输出
4. **合规意识**: 遵循§101、§102宪法要求，注意安全检查和人力批准

---

*此报告由会话效率评分系统自动生成*
"""
        
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"报告已保存至: {output_path}")
        
        return report


def main():
    parser = argparse.ArgumentParser(description='会话效率评分系统')
    parser.add_argument('project_path', help='项目路径')
    parser.add_argument('--report', '-r', help='输出报告路径')
    parser.add_argument('--json', '-j', action='store_true', help='JSON格式输出')
    
    args = parser.parse_args()
    
    scorer = EfficiencyScorer(args.project_path)
    
    if args.json:
        result = scorer.analyze_all_sessions()
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        scorer.generate_report(args.report)


if __name__ == '__main__':
    main()
