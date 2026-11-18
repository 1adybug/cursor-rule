# API Rules

适用于根据外部或独立后端的 HTTP API 契约生成、修改 `@/apis` 与 `@/hooks`。通用执行原则见 Base Rules；Next.js 内部服务端能力见 Next Rules。两者相交时，实际 HTTP 契约决定请求与响应，框架规则决定内部组织方式。

## 契约与复用

- 从文档、服务端定义或已验证的现有实现确认路径、方法、参数位置和响应结构，不凭 CRUD 名称推断契约，也不臆造字段、枚举或接口。
- 关键信息缺失时，先查已有定义；仍无法确认则只询问影响实现的缺失项，同时完成契约已明确的部分，不用占位请求伪装成可用实现。
- 优先复用已有请求封装、类型、枚举和 Hook。以下 `@luzixu/tools`、`@luzixu/tanstack-query` 用法只适用于已使用这些库且版本支持的项目。
- 文件名、函数名与接口语义一致，如 `queryUser.ts` 导出 `queryUser`。列表、详情、新增、更新、删除分别参考 `queryXxx`、`getXxx`、`addXxx`、`updateXxx`、`deleteXxx`，不自动补齐未要求的接口。

## 参数与类型

- 对象参数使用 `params: XxxParams`；全部字段可选且无参数调用有意义时，默认值为 `= {}`。
- 保持文档字段名。字段可能缺失才用 `?`，明确可空用 `T | null`；两种语义不要混用。
- 新增、更新参数可以用 `Pick`、`Omit`、`Partial` 复用模型，但必须符合请求契约，不带入只读、审计或服务端生成字段，不默认把更新字段全部变为可选。
- 仅在分页响应确实匹配时使用 `@luzixu/tools` 的 `Page<T>`；不同分页结构按真实响应定义，不能靠泛型抹平差异。
- 文档明确有限取值时按 Base Rules 的枚举约定建模，键使用准确的中文说明，值保留文档取值；开放集合不要擅自收窄为枚举。

## 请求实现

- 使用 `@/utils/request` 的 `request`；路径不同则沿用项目现有封装。先确认它的方法默认值、序列化、返回值解包和错误处理，不另造平行请求层。
- 将封装实际返回的数据类型传入泛型。保持先赋值给 `response` 再返回的项目约定。
- 封装支持时，Query 参数用 `search`，Body 参数用 `body`，避免重复序列化或设置已由封装管理的请求头；文件、表单和流遵循各自契约。
- 请求方法必须符合文档。只有确认封装的默认方法匹配时才省略；`DELETE`、`PUT`、`PATCH` 等显式传递，不根据是否有 Body 推断后端要求。

以下示例假设标识符为字符串，接口为 GET，且项目封装已将响应解包为 `User`：

```typescript
import type { User } from "@/apis/queryUser"
import { request } from "@/utils/request"

export async function getUser(id: string) {
    const response = await request<User>(`/user/${encodeURIComponent(id)}`, { method: "GET" })
    return response
}
```

## Hook 与副作用

- 只为客户端实际需要的查询或操作生成 `@/hooks/useXxx.ts`。服务端专用、下载和流式接口不自动生成 Hook。
- 已使用 `@luzixu/tanstack-query` 时，查询采用 `createUseQuery`，变更采用 `createUseMutation`；其他项目沿用已有方案。
- `queryKey` 的基础名称采用 API 函数名的短横线形式，如 `query-user`、`get-user`；确认封装把影响响应的参数纳入最终缓存键，避免不同筛选或详情共用缓存。
- 详情标识符尚未就绪时不发送请求，按现有封装选择禁用查询或返回 `null` 的适配函数。空值判断遵循标识符契约，不把合法的 `0` 当作缺失。
- 操作成功后刷新或更新实际受影响的列表、详情缓存；按已安装版本确认回调参数，不套用其他版本的签名。
- 提示使用项目已有实现，不为 Hook 引入 UI 库。加载提示在成功和失败时均应结束；错误提示由统一层或当前操作负责一次，不能静默吞掉或重复弹出。
- 验证集中在请求方法、参数位置、返回结构、空标识符和缓存隔离等本次受影响的契约，不为未改动的接口扩展测试。
