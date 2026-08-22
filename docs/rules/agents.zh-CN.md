# 智能体编排

## 可用智能体

位于 `~/.claude/agents/`：

| 智能体 | 用途 | 使用时机 |
|-------|---------|-------------|
| planner | 实现规划 | 复杂功能、重构 |
| architect | 系统设计 | 架构决策 |
| tdd-guide | 测试驱动开发 | 新功能、bug 修复 |
| code-reviewer | 代码审查 | 编写代码后 |
| security-reviewer | 安全分析 | 提交前 |
| build-error-resolver | 修复构建错误 | 构建失败时 |
| e2e-runner | E2E 测试 | 关键用户流程 |
| refactor-cleaner | 死代码清理 | 代码维护 |
| doc-updater | 文档 | 更新文档 |
| rust-reviewer | Rust 代码审查 | Rust 项目 |
| harmonyos-app-resolver | HarmonyOS 应用开发 | HarmonyOS/ArkTS 项目 |

## 立即使用智能体

无需用户提示：
1. 复杂功能请求 - 使用 **planner** 智能体
2. 刚编写/修改的代码 - 使用 **code-reviewer** 智能体
3. Bug 修复或新功能 - 使用 **tdd-guide** 智能体
4. 架构决策 - 使用 **architect** 智能体

## 并行任务执行

对独立操作始终使用并行 Task 执行：

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## 委派完成契约

适用于每个层级的每个智能体（父级、子级、孙级）：

1. **你的最终消息即为交付物。** 绝不以"等待后台智能体"结束你的回合——已生成的任务不等于已完成的任务。在子任务仍在运行时结束你的回合会导致其结果被孤立（已完成的子任务无法通知已结束回合的父级）。
2. **如果你委派了任务，你负责收集结果。** 等待结果，整合它们，然后返回。禁止发射后不管的委派。
3. **仅当工作无法在单个上下文中完成时才进行分解。** 不要重新委派已经为单个智能体确定大小的任务——深度是结果，而非计划。

> 理由：观察到的失败模式——研究智能体遵循了上述"并行任务执行"，生成了子任务，并以"等待中"作为最终回答返回。所有子任务都成功完成，但其结果被孤立。没有完成契约的并行规则会产生僵尸任务。

## 多视角分析

对于复杂问题，使用分角色子智能体：
- 事实审查员
- 高级工程师
- 安全专家
- 一致性审查员
- 冗余检查员
