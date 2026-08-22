# Hooks 系统

## Hook 类型

- **PreToolUse**：工具执行前（验证、参数修改）
- **PostToolUse**：工具执行后（自动格式化、检查）
- **Stop**：会话结束时（最终验证）

## 自动接受权限

谨慎使用：
- 对可信的、明确定义的计划启用
- 对探索性工作禁用
- 绝不使用 dangerously-skip-permissions 标志
- 改为在 `~/.claude.json` 中配置 `allowedTools`

## TodoWrite 最佳实践

使用 TodoWrite 工具来：
- 跟踪多步骤任务的进度
- 验证对指令的理解
- 实现实时调整方向
- 展示细粒度的实现步骤

Todo 列表可揭示：
- 步骤顺序错误
- 遗漏的项目
- 多余的不必要项目
- 粒度不当
- 对需求的误解
