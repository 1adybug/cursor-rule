# API Rules

当用户发送外部或独立后端的 HTTP API 文档并要求生成代码时，按照以下规则创建 `@/apis` 与 `@/hooks` 相关代码。Next.js 应用内部的服务端能力优先遵循 `next.md`；如果两类规则同时适用，以实际 HTTP API 契约为准。

## 基本原则

- 只根据 API 文档中明确提供的信息生成代码，不要臆造字段、枚举值、接口路径或响应结构。
- 如果文档缺少请求路径、请求方法、参数位置、响应结构等关键信息，应先指出缺失点；能够根据上下文安全推断时，可以说明推断依据后继续生成。
- 常规 CRUD 分类和命名只能作为文档信息完整时的命名参考，不能据此推断请求方法、参数位置、字段或返回值。
- API 函数的文件名、函数名与接口语义保持一致，例如 `queryUser.ts` 导出 `queryUser`。
- 生成新文件前，优先检查已有 `@/apis`、`@/hooks` 中是否存在可复用类型、枚举或函数，避免重复定义。

## 参数命名

- 对象参数统一命名为 `params`，类型命名为函数名的大驼峰形式加 `Params` 后缀，例如 `QueryUserParams`。
- 如果参数对象的所有属性都是可选的，给 `params` 添加默认值 `= {}`。
- 获取详情接口如果只接收一个唯一标识符，可以直接使用标识符参数，例如 `id: User["id"]`，不强制包装为对象。
- 请求参数较复杂时，优先保持文档字段名，不要为了前端语义擅自改名。

```typescript
export async function queryUser(params: QueryUserParams = {}) {
    const response = await request<Page<User>>("/user/query", { search: params })
    return response
}

export async function getUser(id: User["id"]) {
    const response = await request<User>(`/user/${id}`)
    return response
}
```

## 类型建模

- 如果响应是分页数据，使用 `deepsea-tools` 中的 `Page` 泛型，例如 `Page<User>`。
- 如果响应是对象，只有文档明确说明字段可能缺失时才使用 `?` 标记可选；文档明确返回 `null` 时使用 `T | null`，不要用可选属性代替可空类型。
- 新增参数与更新参数通常应复用原始模型类型，灵活使用 `Omit`、`Pick`、`Partial` 等工具类型。
- 新增、更新和删除参数必须与文档声明完全一致，不要默认包含响应模型中的只读字段、审计字段或服务端生成字段。
- 如果字段说明中体现了枚举含义，按照 `base.md` 的枚举规则建模，并用该枚举类型替代原先的 `string` 或 `number` 类型。
- 枚举对象的 `key` 使用中文说明，`value` 使用文档取值，`key` 的长度尽量保持一致。
- 类型、枚举和接口函数应尽可能复用已有定义；如果两个接口文件之间关系明确，直接导入已有类型，不要重复声明。

```typescript
export interface User {
    id: string
    name: string
    status: UserStatus
    nickname?: string
    deletedAt: string | null
    createdAt: string
    updatedAt: string
}

export type AddUserParams = Pick<User, "name" | "status">

export type UpdateUserParams = Pick<User, "id" | "name" | "status">
```

## 请求实现

- API 请求始终使用 `@/utils/request` 中的 `request` 函数。
- 将返回值类型传给 `request` 的泛型参数。
- 不要直接返回 `request(...)`，应先赋值给 `response`，再返回 `response`。
- Query 参数传给 `search` 属性，不需要额外拼接 URL。
- Body 参数传给 `body` 属性，不需要 `JSON.stringify`，不需要手动设置 `Content-Type: application/json`。
- Body 请求如果文档没有特殊要求，不需要显式设置 `method: "POST"`，由 `request` 内部处理。
- 如果文档明确要求 `DELETE`、`PUT`、`PATCH` 等方法，必须显式传递 `method`。

```typescript
import { request } from "@/utils/request"

export async function addUser(params: AddUserParams) {
    const response = await request<User>("/user/add", { body: params })
    return response
}

export async function deleteUser(params: DeleteUserParams) {
    const response = await request<User>("/user/delete", {
        method: "DELETE",
        body: params,
    })

    return response
}
```

## 常规接口

常规资源接口通常可以分为以下 5 类。表中的参数名称与返回值用于统一命名和类型建模，仅作为参考；不代表接口一定存在，实际契约仍以 API 文档为准：

| 类型     | 函数名       | 参考参数类型       | 参考返回值   | 说明                     |
| :------- | :----------- | :----------------- | :----------- | :----------------------- |
| 查询列表 | `queryUser`  | `QueryUserParams`  | `Page<User>` | 参数通常放在 `search` 中 |
| 获取详情 | `getUser`    | `string`           | `User`       | 使用资源唯一标识符       |
| 新增     | `addUser`    | `AddUserParams`    | `User`       | 参数通常放在 `body` 中   |
| 更新     | `updateUser` | `UpdateUserParams` | `User`       | 参数通常放在 `body` 中   |
| 删除     | `deleteUser` | `DeleteUserParams` | `User`       | 请求方法通常为 `DELETE`  |

## Hook 生成

- 只为实际需要在客户端组件中查询或触发的 API 函数生成对应 Hook，文件放在 `@/hooks` 目录下；服务端专用、下载、流式传输或没有客户端调用场景的接口不自动生成 Hook。
- Hook 文件名为 `use` + 函数名大驼峰形式，例如 `queryUser` 对应 `useQueryUser.ts`。
- `queryKey` 使用 API 函数名的短横线命名，例如 `query-user`、`get-user`。
- 查询类接口使用 `createUseQuery`。
- 新增、更新、删除等操作类接口使用 `createUseMutation`。
- 操作成功后，应刷新受影响的查询缓存，例如列表查询与当前详情查询。
- 消息提示优先使用项目已有实现；如果项目没有统一提示组件，不要为了 Hook 主动引入新的 UI 库。

### 查询列表

```typescript
import { createUseQuery } from "soda-tanstack-query"
import { queryUser } from "@/apis/queryUser"

export const useQueryUser = createUseQuery({
    queryFn: queryUser,
    queryKey: "query-user",
})
```

### 获取详情

详情接口的 Hook 应允许标识符为空；为空时返回 `null`，避免发送无效请求。

```typescript
import { isNonNullable } from "deepsea-tools"
import { createUseQuery } from "soda-tanstack-query"
import { getUser } from "@/apis/getUser"
import type { User } from "@/apis/queryUser"

export function getUserOptional(id?: User["id"]) {
    return isNonNullable(id) ? getUser(id) : null
}

export const useGetUser = createUseQuery({
    queryFn: getUserOptional,
    queryKey: "get-user",
})
```

### 操作接口

以下示例以项目已使用 `Ant Design` 的 `message` 为前提；如果项目使用其他提示组件，应替换为项目已有实现。

```typescript
import { useId } from "react"

import { message } from "antd"
import { createUseMutation } from "soda-tanstack-query"
import { addUser } from "@/apis/addUser"

export const useAddUser = createUseMutation(() => {
    const key = useId()

    return {
        mutationFn: addUser,
        onMutate() {
            message.open({
                key,
                type: "loading",
                content: "新增用户中...",
                duration: 0,
            })
        },
        onSuccess(data, variables, onMutateResult, context) {
            context.client.invalidateQueries({ queryKey: ["query-user"] })
            context.client.invalidateQueries({ queryKey: ["get-user", data.id] })

            message.open({
                key,
                type: "success",
                content: "新增用户成功",
            })
        },
        onError() {
            message.destroy(key)
        },
    }
})
```
