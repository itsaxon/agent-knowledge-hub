# 测试要求

## 最低测试覆盖率：80%

测试类型（全部必需）：
1. **单元测试** - 单个函数、工具函数、组件
2. **集成测试** - API 端点、数据库操作
3. **E2E 测试** - 关键用户流程（框架按语言选择）

## 测试驱动开发

强制工作流：
1. 先编写测试（红灯）
2. 运行测试 - 应当失败
3. 编写最小实现（绿灯）
4. 运行测试 - 应当通过
5. 重构（改进）
6. 验证覆盖率（80%+）

## 测试失败排查

1. 使用 **tdd-guide** 智能体
2. 检查测试隔离性
3. 验证 mock 是否正确
4. 修复实现而非测试（除非测试本身有误）

## 智能体支持

- **tdd-guide** - 对新功能主动使用，强制先写测试

## 测试结构（AAA 模式）

测试优先采用 Arrange-Act-Assert 结构：

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

### 测试命名

使用描述性名称来说明被测行为：

```typescript
test('returns empty array when no markets match query', () => {})
test('throws error when API key is missing', () => {})
test('falls back to substring search when Redis is unavailable', () => {})
```
