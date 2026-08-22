---
name: java-coding-standards
description: "Java 编码标准，适用于 Spring Boot 和 Quarkus 服务：命名、不可变性、Optional 用法、流、异常、泛型、CDI、响应式模式和项目布局。自动应用框架特定的规范。"
metadata:
  origin: ECC
---

# Java 编码标准

面向 Spring Boot 和 Quarkus 服务中可读、可维护的 Java（17+）代码的标准。

## 何时使用

- 在 Spring Boot 或 Quarkus 项目中编写或审查 Java 代码时
- 强制执行命名、不可变性或异常处理规范时
- 使用 record、密封类或模式匹配（Java 17+）时
- 审查 Optional、流或泛型的使用时
- 组织包结构和项目布局时
- **[QUARKUS]**：使用 CDI 作用域、Panache 实体或响应式管道时

## 工作原理

### 框架检测

在应用标准之前，从构建文件确定框架：

- 构建文件包含 `quarkus` → 应用 **[QUARKUS]** 规范
- 构建文件包含 `spring-boot` → 应用 **[SPRING]** 规范
- 两者均未检测到 → 仅应用共享规范

## 核心原则

- 清晰优于巧妙
- 默认不可变；最小化共享可变状态
- 使用有意义的异常快速失败
- 一致的命名和包结构
- **[QUARKUS]**：优先构建时处理而非运行时处理；尽可能避免运行时反射

## 示例

以下各节展示了命名、不可变性、依赖注入、响应式代码、异常、项目布局、日志、配置和测试的具体 Spring Boot、Quarkus 和共享 Java 示例。

## 命名

```java
// PASS: Classes/Records: PascalCase
public class MarketService {}
public record Money(BigDecimal amount, Currency currency) {}

// PASS: Methods/fields: camelCase
private final MarketRepository marketRepository;
public Market findBySlug(String slug) {}

// PASS: Constants: UPPER_SNAKE_CASE
private static final int MAX_PAGE_SIZE = 100;

// PASS: [QUARKUS] JAX-RS resources named as *Resource, not *Controller
public class MarketResource {}

// PASS: [SPRING] REST controllers named as *Controller
public class MarketController {}
```

## 不可变性

```java
// PASS: Favor records and final fields
public record MarketDto(Long id, String name, MarketStatus status) {}

public class Market {
  private final Long id;
  private final String name;
  // getters only, no setters
}

// PASS: [QUARKUS] Panache active-record entities use public fields (Quarkus convention)
@Entity
public class Market extends PanacheEntity {
  public String name;
  public MarketStatus status;
  // Panache generates accessors at build time; public fields are idiomatic here
}

// PASS: [QUARKUS] Panache MongoDB entities
@MongoEntity(collection = "markets")
public class Market extends PanacheMongoEntity {
  public String name;
  public MarketStatus status;
}
```

## Optional 用法

```java
// PASS: Return Optional from find* methods
// [SPRING]
Optional<Market> market = marketRepository.findBySlug(slug);

// [QUARKUS] Panache
Optional<Market> market = Market.find("slug", slug).firstResultOptional();

// PASS: Map/flatMap instead of get()
return market
    .map(MarketResponse::from)
    .orElseThrow(() -> new EntityNotFoundException("Market not found"));
```

## 流最佳实践

```java
// PASS: Use streams for transformations, keep pipelines short
List<String> names = markets.stream()
    .map(Market::name)
    .filter(Objects::nonNull)
    .toList();

// FAIL: Avoid complex nested streams; prefer loops for clarity
```

## 依赖注入

```java
// PASS: [SPRING] Constructor injection (preferred over @Autowired on fields)
@Service
public class MarketService {
  private final MarketRepository marketRepository;

  public MarketService(MarketRepository marketRepository) {
    this.marketRepository = marketRepository;
  }
}

// PASS: [QUARKUS] Constructor injection
@ApplicationScoped
public class MarketService {
  private final MarketRepository marketRepository;

  @Inject
  public MarketService(MarketRepository marketRepository) {
    this.marketRepository = marketRepository;
  }
}

// PASS: [QUARKUS] Package-private field injection (acceptable in Quarkus — avoids proxy issues)
@ApplicationScoped
public class MarketService {
  @Inject
  MarketRepository marketRepository;
}

// FAIL: [SPRING] Field injection with @Autowired
@Autowired
private MarketRepository marketRepository; // use constructor injection

// FAIL: [QUARKUS] @Singleton when interception or lazy init is needed
@Singleton // non-proxyable — use @ApplicationScoped instead
public class MarketService {}
```

## 响应式模式 [QUARKUS]

```java
// PASS: Return Uni/Multi from reactive endpoints
@GET
@Path("/{slug}")
public Uni<Market> findBySlug(@PathParam("slug") String slug) {
  return Market.find("slug", slug)
      .<Market>firstResult()
      .onItem().ifNull().failWith(() -> new MarketNotFoundException(slug));
}

// PASS: Non-blocking pipeline composition
public Uni<OrderConfirmation> placeOrder(OrderRequest req) {
  return validateOrder(req)
      .chain(valid -> persistOrder(valid))
      .chain(order -> notifyFulfillment(order));
}

// FAIL: Blocking call inside a Uni/Multi pipeline
public Uni<Market> find(String slug) {
  Market m = Market.find("slug", slug).firstResult(); // BLOCKING — breaks event loop
  return Uni.createFrom().item(m);
}

// FAIL: Subscribing more than once to a shared Uni
Uni<Market> shared = fetchMarket(slug);
shared.subscribe().with(m -> log(m));
shared.subscribe().with(m -> cache(m)); // double subscribe — use Uni.memoize()
```

## 异常

- 领域错误使用非受检异常；用上下文包装技术异常
- 创建领域特定异常（如 `MarketNotFoundException`）
- 避免宽泛的 `catch (Exception ex)`，除非集中重新抛出/记录日志

```java
throw new MarketNotFoundException(slug);
```

### 集中式异常处理

```java
// [SPRING]
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MarketNotFoundException.class)
  public ResponseEntity<ErrorResponse> handle(MarketNotFoundException ex) {
    return ResponseEntity.status(404).body(ErrorResponse.from(ex));
  }
}

// [QUARKUS] Option A: ExceptionMapper
@Provider
public class MarketNotFoundMapper implements ExceptionMapper<MarketNotFoundException> {
  @Override
  public Response toResponse(MarketNotFoundException ex) {
    return Response.status(404).entity(ErrorResponse.from(ex)).build();
  }
}

// [QUARKUS] Option B: @ServerExceptionMapper (RESTEasy Reactive)
@ServerExceptionMapper
public RestResponse<ErrorResponse> handle(MarketNotFoundException ex) {
  return RestResponse.status(Status.NOT_FOUND, ErrorResponse.from(ex));
}
```

## 泛型与类型安全

- 避免原始类型；声明泛型参数
- 可复用工具类优先使用有界泛型

```java
public <T extends Identifiable> Map<Long, T> indexById(Collection<T> items) { ... }
```

## 项目结构

### [SPRING] Maven/Gradle

```
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  util/
src/main/resources/
  application.yml
src/test/java/... (mirrors main)
```

### [QUARKUS] Maven/Gradle

```
src/main/java/com/example/app/
  config/              # @ConfigMapping, @ConfigProperty beans, Producers
  resource/            # JAX-RS resources (not "controller")
  service/
  repository/          # PanacheRepository implementations (if not using active record)
  domain/              # JPA/Panache entities, MongoDB entities
  dto/
  util/
  mapper/              # MapStruct mappers (if used)
src/main/resources/
  application.properties   # Quarkus convention (YAML supported with quarkus-config-yaml)
  import.sql               # Hibernate auto-import for dev/test
src/test/java/... (mirrors main)
```

## 格式与风格

- 一致使用 2 或 4 个空格（项目标准）
- 每个文件一个公共顶层类型
- 保持方法短小且专注；提取辅助方法
- 成员排序：常量、字段、构造器、公共方法、受保护方法、私有方法

## 应避免的代码异味

- 过长的参数列表 → 使用 DTO/构建器
- 深层嵌套 → 提前返回
- 魔法数字 → 命名常量
- 静态可变状态 → 优先使用依赖注入
- 静默的 catch 块 → 记录日志并处理或重新抛出
- **[QUARKUS]**：在需要 `@ApplicationScoped` 的地方使用 `@Singleton`——会破坏代理和拦截
- **[QUARKUS]**：混用 `quarkus-resteasy-reactive` 和 `quarkus-resteasy`（经典版）——选择一种技术栈
- **[QUARKUS]**：在同一限界上下文中混用 Panache active-record 和 repository 模式——选择一种

## 日志

```java
// [SPRING] SLF4J
private static final Logger log = LoggerFactory.getLogger(MarketService.class);
log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);

// [QUARKUS] JBoss Logging (default, zero-cost at build time)
private static final Logger log = Logger.getLogger(MarketService.class);
log.infof("fetch_market slug=%s", slug);
log.errorf(ex, "failed_fetch_market slug=%s", slug);

// [QUARKUS] Alternative: simplified logging with @Inject
@Inject
Logger log; // CDI-injected, scoped to declaring class
```

## 空值处理

- 仅在不可避免时接受 `@Nullable`；否则使用 `@NonNull`
- 输入使用 Bean Validation（`@NotNull`、`@NotBlank`）
- **[QUARKUS]**：在 `@BeanParam`、`@RestForm` 和请求体参数上应用 `@Valid`

## 配置

```java
// [SPRING] @ConfigurationProperties
@ConfigurationProperties(prefix = "market")
public record MarketProperties(int maxPageSize, Duration cacheTtl) {}

// [QUARKUS] @ConfigMapping (type-safe, build-time validated)
@ConfigMapping(prefix = "market")
public interface MarketConfig {
  int maxPageSize();
  Duration cacheTtl();
}

// [QUARKUS] Simple values with @ConfigProperty
@ConfigProperty(name = "market.max-page-size", defaultValue = "100")
int maxPageSize;
```

## 测试预期

### 共享
- JUnit 5 + AssertJ 实现流式断言
- Mockito 用于模拟；尽可能避免部分模拟
- 优先使用确定性测试；不使用隐式休眠

### [SPRING]
- `@WebMvcTest` 用于控制器切片测试，`@DataJpaTest` 用于仓储切片测试
- `@SpringBootTest` 仅用于完整集成测试
- `@MockBean` 用于替换 Spring 上下文中的 Bean

### [QUARKUS]
- 纯 JUnit 5 + Mockito 用于单元测试（不使用 `@QuarkusTest`）
- `@QuarkusTest` 仅用于 CDI 集成测试
- `@InjectMock` 用于在集成测试中替换 CDI Bean
- Dev Services 用于数据库/Kafka/Redis——当 Dev Services 足够时避免手动配置 Testcontainers
- `@QuarkusTestResource` 用于自定义外部服务生命周期

```java
// [SPRING] Controller test
@WebMvcTest(MarketController.class)
class MarketControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean MarketService marketService;
}

// [QUARKUS] Integration test
@QuarkusTest
class MarketResourceTest {
  @InjectMock
  MarketService marketService;

  @Test
  void should_return_404_when_market_not_found() {
    given().when().get("/markets/unknown").then().statusCode(404);
  }
}

// [QUARKUS] Unit test (no CDI, no @QuarkusTest)
@ExtendWith(MockitoExtension.class)
class MarketServiceTest {
  @Mock MarketRepository marketRepository;
  @InjectMocks MarketService marketService;
}
```

**请记住**：保持代码有意图、有类型、可观测。除非证明必要，否则以可维护性为优化目标而非微优化。
