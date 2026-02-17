#!/usr/bin/env python3
"""
Token预算计算工具 (Token Budget Calculator)
用于计算和管理Claude Code会话的Token预算

功能:
- 项目级和任务级预算计算
- 基于历史数据的智能预算建议
- 实时使用监控和预警
- 生成Token使用报告
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse


class TokenBudgetCalculator:
    """Token预算计算器"""
    
    # Token价格 (假设定价，实际应根据API调整)
    TOKEN_PRICING = {
        "input": 0.001,    # $ per 1K input tokens
        "output": 0.005,   # $ per 1K output tokens
        "cache_create": 0.0001,  # $ per 1K cache creation
        "cache_read": 0.0,       # Free
    }
    
    # 推荐的预算阈值
    BUDGET_WARNING_THRESHOLD = 0.8  # 80% 时警告
    BUDGET_CRITICAL_THRESHOLD = 0.95  # 95% 时危险
    
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
    
    def analyze_session_tokens(self, session_file: Path) -> Dict:
        """分析单个会话的Token使用"""
        total_input = 0
        total_output = 0
        total_cache_create = 0
        total_cache_read = 0
        message_count = 0
        
        try:
            with open(session_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        if entry.get('type') == 'assistant':
                            usage = entry.get('message', {}).get('usage', {})
                            total_input += usage.get('input_tokens', 0)
                            total_output += usage.get('output_tokens', 0)
                            total_cache_create += usage.get('cache_creation_input_tokens', 0)
                            total_cache_read += usage.get('cache_read_input_tokens', 0)
                            message_count += 1
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            return {"error": str(e)}
        
        return {
            "total_input": total_input,
            "total_output": total_output,
            "total_cache_create": total_cache_create,
            "total_cache_read": total_cache_read,
            "total_tokens": total_input + total_output,
            "message_count": message_count,
            "cost_estimate": self._calculate_cost(total_input, total_output, total_cache_create)
        }
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int, cache_create: int) -> float:
        """计算预估成本"""
        input_cost = (input_tokens / 1000) * self.TOKEN_PRICING["input"]
        output_cost = (output_tokens / 1000) * self.TOKEN_PRICING["output"]
        cache_cost = (cache_create / 1000) * self.TOKEN_PRICING["cache_create"]
        return input_cost + output_cost + cache_cost
    
    def calculate_project_budget(self) -> Dict:
        """计算项目级Token预算"""
        sessions = self.load_sessions()
        project_stats = {
            "total_sessions": len(sessions),
            "sessions": [],
            "summary": {
                "total_input": 0,
                "total_output": 0,
                "total_cache_create": 0,
                "total_cache_read": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "total_messages": 0
            }
        }
        
        for session in sessions:
            session_file = Path(session['fullPath'])
            token_data = self.analyze_session_tokens(session_file)
            if "error" not in token_data:
                project_stats["sessions"].append({
                    "session_id": session['sessionId'],
                    "first_prompt": session.get('firstPrompt', '')[:100],
                    "message_count": session.get('messageCount', 0),
                    "created": session.get('created', ''),
                    "tokens": token_data
                })
                project_stats["summary"]["total_input"] += token_data["total_input"]
                project_stats["summary"]["total_output"] += token_data["total_output"]
                project_stats["summary"]["total_cache_create"] += token_data["total_cache_create"]
                project_stats["summary"]["total_cache_read"] += token_data["total_cache_read"]
                project_stats["summary"]["total_tokens"] += token_data["total_tokens"]
                project_stats["summary"]["total_cost"] += token_data["cost_estimate"]
                project_stats["summary"]["total_messages"] += token_data["message_count"]
        
        # 计算平均值
        if project_stats["total_sessions"] > 0:
            project_stats["summary"]["avg_tokens_per_session"] = \
                project_stats["summary"]["total_tokens"] / project_stats["total_sessions"]
            project_stats["summary"]["avg_messages_per_session"] = \
                project_stats["summary"]["total_messages"] / project_stats["total_sessions"]
        
        return project_stats
    
    def suggest_task_budget(self, task_type: str = "general") -> Dict:
        """基于历史数据智能建议任务级预算"""
        project_stats = self.calculate_project_budget()
        summary = project_stats.get("summary", {})
        
        # 根据任务类型调整预算
        multipliers = {
            "small": 0.5,      # 小任务: 50% 平均值
            "medium": 1.0,     # 中等任务: 平均值
            "large": 2.0,      # 大任务: 200% 平均值
            "complex": 3.0,    # 复杂任务: 300% 平均值
            "general": 1.2     # 默认: 120% 平均值
        }
        
        base_tokens = summary.get("avg_tokens_per_session", 15000)
        multiplier = multipliers.get(task_type, 1.0)
        
        suggested = {
            "task_type": task_type,
            "base_tokens": base_tokens,
            "multiplier": multiplier,
            "suggested_input": int(base_tokens * multiplier * 0.7),
            "suggested_output": int(base_tokens * multiplier * 0.3),
            "suggested_total": int(base_tokens * multiplier),
            "estimated_cost": round(base_tokens * multiplier * 0.002, 4),
            "warning_threshold": int(base_tokens * multiplier * self.BUDGET_WARNING_THRESHOLD),
            "critical_threshold": int(base_tokens * multiplier * self.BUDGET_CRITICAL_THRESHOLD)
        }
        
        return suggested
    
    def generate_usage_report(self, output_path: Optional[str] = None) -> str:
        """生成Token使用报告"""
        project_stats = self.calculate_project_budget()
        
        report = f"""# Token使用报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**项目路径**: {self.project_path}

---

## 项目概览

- **总会话数**: {project_stats['total_sessions']}
- **总消息数**: {project_stats['summary']['total_messages']}

## Token使用汇总

| 指标 | 数值 |
|------|------|
| 总Input Tokens | {project_stats['summary']['total_input']:,} |
| 总Output Tokens | {project_stats['summary']['total_output']:,} |
| Cache Creation | {project_stats['summary']['total_cache_create']:,} |
| Cache Read | {project_stats['summary']['total_cache_read']:,} |
| **总Tokens** | **{project_stats['summary']['total_tokens']:,}** |
| **预估成本** | **${project_stats['summary']['total_cost']:.4f}** |

## 平均值

- 平均每会话Token: {project_stats['summary'].get('avg_tokens_per_session', 0):,.0f}
- 平均每会话消息: {project_stats['summary'].get('avg_messages_per_session', 0):.1f}

---

## 会话详情

"""
        
        for i, session in enumerate(project_stats["sessions"], 1):
            tokens = session["tokens"]
            report += f"""### {i}. {session['session_id'][:8]}...

- **创建时间**: {session['created'][:10]}
- **消息数**: {session['message_count']}
- **Input Tokens**: {tokens['total_input']:,}
- **Output Tokens**: {tokens['total_output']:,}
- **总Tokens**: {tokens['total_tokens']:,}
- **预估成本**: ${tokens['cost_estimate']:.4f}

"""
        
        # 添加预算建议
        report += """
## 预算建议

| 任务类型 | 建议Input | 建议Output | 总预算 | 警告阈值 |
|----------|-----------|------------|--------|----------|
"""
        
        for task_type in ["small", "medium", "large", "complex"]:
            suggestion = self.suggest_task_budget(task_type)
            report += f"| {task_type} | {suggestion['suggested_input']:,} | {suggestion['suggested_output']:,} | {suggestion['suggested_total']:,} | {suggestion['warning_threshold']:,} |\n"
        
        report += """
---

*此报告由Token预算计算工具自动生成*
"""
        
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"报告已保存至: {output_path}")
        
        return report


def main():
    parser = argparse.ArgumentParser(description='Token预算计算工具')
    parser.add_argument('project_path', help='项目路径')
    parser.add_argument('--report', '-r', help='输出报告路径')
    parser.add_argument('--task-type', '-t', choices=['small', 'medium', 'large', 'complex', 'general'],
                        default='general', help='任务类型')
    parser.add_argument('--suggest', '-s', action='store_true', help='显示预算建议')
    
    args = parser.parse_args()
    
    calculator = TokenBudgetCalculator(args.project_path)
    
    if args.suggest:
        suggestion = calculator.suggest_task_budget(args.task_type)
        print(json.dumps(suggestion, indent=2, ensure_ascii=False))
    else:
        calculator.generate_usage_report(args.report)


if __name__ == '__main__':
    main()
