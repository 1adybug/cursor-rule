# Next Rules

适用于 Next.js 应用内部的服务端能力，通用执行原则见 Base Rules。先确认实际 Next.js、React 和 Zod 版本；需要框架资料时优先查已安装版本的 `node_modules/next/dist/docs/`，不存在或不完整再查对应版本官方文档。

## 业务边界

- 已采用本项目分层的应用，业务逻辑放在 `@/shared`，`Server Action` 和 Route 作为薄适配层；`shared` 表示业务复用，不代表可以把服务端逻辑打包到浏览器。
- 来自客户端或外部请求的参数在服务端边界经过 schema 校验；在执行受保护操作前验证身份、权限和资源归属，不能依赖客户端隐藏按钮或先前页面检查。
- `"use server"` 用于声明 Server Action，不用于标记普通服务端模块。普通业务逻辑放在明确的服务端边界内，沿用项目的 `server-only` 等导入保护。
- `@/utils` 仅放浏览器可用或两端通用工具；鉴权、数据库、密钥和服务端专用工具放在 `@/server` 等服务端目录。客户端不能导入服务端实现，允许调用框架提供的 Action 代理或导入纯类型。
- 检查客户端所需字段后返回最小数据，不向客户端暴露密钥、内部错误或无关敏感字段。

## 文件职责

以下为已有 `createSharedFn` 体系中的职责映射，不是每次都要新建五个文件的步骤表。复用已有文件，只有实际调用链需要时才新增对应层。

| 位置                            | 职责                                                                       |
| :------------------------------ | :------------------------------------------------------------------------- |
| `@/schemas/addUser.ts`          | 参数 schema、`AddUserParams` 与 `addUserParser`                            |
| `@/shared/addUser.ts`           | 使用 `createSharedFn` 实现服务端业务与权限约束                             |
| `@/actions/addUser.ts`          | 以 `"use server"` 和 `createResponseFn` 导出 `addUserAction`               |
| `@/presets/createUseAddUser.ts` | 需要客户端 mutation 默认行为时定义提示、缓存刷新与副作用                   |
| `@/hooks/useAddUser.ts`         | 通过 `createRequestFn` 生成 `addUserClient`，套用 preset 导出 `useAddUser` |

- 未采用这套封装的项目沿用现有架构，不为应用规则复制整套基础设施。
- 使用 `createSharedFn` 时传入 `schema`，权限约束沿用 `filter` 或现有服务端鉴权机制；确认 Action 与 Route 均经过这些约束。
- 数据唯一性、并发写入等不变量由数据库约束或事务保证；“先查再写”只能改善提示，不能作为并发正确性的唯一保证。
- 对客户端可见的预期业务错误使用项目的 `ClientError` 或等价机制；不要把所有异常转成成功结果或暴露原始数据库错误。

已有封装下的 Action 保持薄封装：

```typescript
"use server"

import { createResponseFn } from "@/server/createResponseFn"
import { addUser } from "@/shared/addUser"

export const addUserAction = createResponseFn(addUser)
```

## Schema 与客户端状态

- schema 放在 `@/schemas`，命名为 `xxxSchema`，推导 `XxxParams` 并按现有约定导出 `xxxParser`；不要再手写一份可能漂移的参数类型。
- Zod 4 自定义错误优先使用 `error` 参数；其他版本遵循已安装版本签名，不为了示例升级依赖。
- 复用已有字段 schema；重复使用或有独立业务语义的组合对象、数组可独立成文件，一次性简单字段无需逐个拆分。
- 客户端走项目已有的 `shared -> actions -> presets -> hooks` 链路时，沿用 mutation 状态、错误与缓存机制，不为同一次操作另建一套 React Action 状态。
- preset 的提示和缓存刷新遵循 API Rules 中“Hook 与副作用”的约定。Next.js 服务端缓存与客户端查询缓存分别按数据流处理，不假定刷新一方会刷新另一方。

## HTTP 入口

- 第三方调用、Webhook、下载或其他必须通过 HTTP 暴露的能力才新增 Route；内部调用不额外绕行 HTTP。
- 标准 JSON 接口优先使用 `createSharedFn` 的 `route` 配置，`bodyType` 与真实请求体一致，复用业务逻辑和校验。
- 当封装无法保留所需 HTTP 语义，例如原始请求体验签、自定义响应头、特殊状态码、流或二进制响应时，可以使用独立 `route.ts`，不单凭返回 JSON 就禁止使用。
- 独立 Route 仍需完整的输入校验、鉴权与错误处理；协议适配留在入口，业务逻辑复用服务端实现。
- 验证本次涉及的入口、权限、参数与缓存行为；Action 成功不等于同业务的 HTTP 入口已验证。
