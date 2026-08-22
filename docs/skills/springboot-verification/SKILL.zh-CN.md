---
name: springboot-verification
description: "Spring Boot 项目的验证循环：构建、静态分析、带覆盖率的测试、安全扫描，以及发布或 PR 前的差异审查。"
metadata:
  origin: ECC
---

# Spring Boot 验证循环

在 PR 前、重大变更后和部署前运行。

## 何时激活

- 为 Spring Boot 服务提交 Pull Request 之前
- 重大重构或依赖升级之后
- 预发布或生产环境的部署前验证
- 运行完整的 构建 → 检查 → 测试 → 安全扫描 流水线
- 验证测试覆盖率是否达到阈值

## 阶段 1：构建

```bash
mvn -T 4 clean verify -DskipTests
# or
./gradlew clean assemble -x test
```

如果构建失败，停止并修复。

## 阶段 2：静态分析

Maven（常用插件）：
```bash
mvn -T 4 spotbugs:check pmd:check checkstyle:check
```

Gradle（如已配置）：
```bash
./gradlew checkstyleMain pmdMain spotbugsMain
```

## 阶段 3：测试 + 覆盖率

```bash
mvn -T 4 test
mvn jacoco:report   # verify 80%+ coverage
# or
./gradlew test jacocoTestReport
```

报告：
- 测试总数、通过/失败数
- 覆盖率百分比（行/分支）

### 单元测试

使用模拟依赖隔离测试服务逻辑：

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserRepository userRepository;
  @InjectMocks private UserService userService;

  @Test
  void createUser_validInput_returnsUser() {
    var dto = new CreateUserDto("Alice", "alice@example.com");
    var expected = new User(1L, "Alice", "alice@example.com");
    when(userRepository.save(any(User.class))).thenReturn(expected);

    var result = userService.create(dto);

    assertThat(result.name()).isEqualTo("Alice");
    verify(userRepository).save(any(User.class));
  }

  @Test
  void createUser_duplicateEmail_throwsException() {
    var dto = new CreateUserDto("Alice", "existing@example.com");
    when(userRepository.existsByEmail(dto.email())).thenReturn(true);

    assertThatThrownBy(() -> userService.create(dto))
        .isInstanceOf(DuplicateEmailException.class);
  }
}
```

### 使用 Testcontainers 的集成测试

针对真实数据库而非 H2 进行测试：

```java
@SpringBootTest
@Testcontainers
class UserRepositoryIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
      .withDatabaseName("testdb");

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired private UserRepository userRepository;

  @Test
  void findByEmail_existingUser_returnsUser() {
    userRepository.save(new User("Alice", "alice@example.com"));

    var found = userRepository.findByEmail("alice@example.com");

    assertThat(found).isPresent();
    assertThat(found.get().getName()).isEqualTo("Alice");
  }
}
```

### 使用 MockMvc 的 API 测试

在完整 Spring 上下文中测试控制器层：

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

  @Autowired private MockMvc mockMvc;
  @MockBean private UserService userService;

  @Test
  void createUser_validInput_returns201() throws Exception {
    var user = new UserDto(1L, "Alice", "alice@example.com");
    when(userService.create(any())).thenReturn(user);

    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name": "Alice", "email": "alice@example.com"}
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Alice"));
  }

  @Test
  void createUser_invalidEmail_returns400() throws Exception {
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name": "Alice", "email": "not-an-email"}
                """))
        .andExpect(status().isBadRequest());
  }
}
```

## 阶段 4：安全扫描

```bash
# Dependency CVEs
mvn org.owasp:dependency-check-maven:check
# or
./gradlew dependencyCheckAnalyze

# Secrets in source
grep -rn "password\s*=\s*\"" src/ --include="*.java" --include="*.yml" --include="*.properties"
grep -rn "sk-\|api_key\|secret" src/ --include="*.java" --include="*.yml"

# Secrets (git history)
git secrets --scan  # if configured
```

### 常见安全发现

```
# Check for System.out.println (use logger instead)
grep -rn "System\.out\.print" src/main/ --include="*.java"

# Check for raw exception messages in responses
grep -rn "e\.getMessage()" src/main/ --include="*.java"

# Check for wildcard CORS
grep -rn "allowedOrigins.*\*" src/main/ --include="*.java"
```

## 阶段 5：代码检查/格式化（可选门禁）

```bash
mvn spotless:apply   # if using Spotless plugin
./gradlew spotlessApply
```

## 阶段 6：差异审查

```bash
git diff --stat
git diff
```

检查清单：
- 无遗留的调试日志（`System.out`、无守卫的 `log.debug`）
- 有意义的错误信息和 HTTP 状态码
- 需要的位置存在事务和验证
- 配置变更已记录文档

## 输出模板

```
VERIFICATION REPORT
===================
Build:     [PASS/FAIL]
Static:    [PASS/FAIL] (spotbugs/pmd/checkstyle)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (CVE findings: N)
Diff:      [X files changed]

Overall:   [READY / NOT READY]

Issues to Fix:
1. ...
2. ...
```

## 持续模式

- 在重大变更时或长时间会话中每 30–60 分钟重新运行各阶段
- 保持短循环：`mvn -T 4 test` + spotbugs 以获取快速反馈

**请记住**：快速反馈胜于迟来的意外。保持门禁严格——在生产系统中将警告视为缺陷。
