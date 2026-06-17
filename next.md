# Next Rules

针对 `Next.js` 16 项目。需要确认框架行为时，优先查看项目内文档：`node_modules/next/dist/docs/`。

## 基本原则

- 业务逻辑优先放在 `@/shared`，`Server Action` 只作为薄封装。
- 所有来自客户端或外部请求的参数都必须先经过 `schema` 校验。
- `"use server"` 只放在 `@/actions` 等真正声明 `Server Action` 的文件中，不要放在普通业务函数里。
- 客户端调用服务端能力时，优先走 `shared -> actions -> presets -> hooks` 链路。
- 如果需要同时暴露 `Server Action` 与 `API Route`，优先通过 `createSharedFn` 的 `route` 配置复用同一份 `shared` 逻辑。

## Server Action 工作流

创建一个 `Server Action` 时，以 `addUser` 为例，按以下顺序生成文件：

| 步骤 | 文件                            | 职责                            |
| :--- | :------------------------------ | :------------------------------ |
| 1    | `@/schemas/addUser.ts`          | 声明参数校验、参数类型与 parser |
| 2    | `@/shared/addUser.ts`           | 实现服务端业务逻辑              |
| 3    | `@/actions/addUser.ts`          | 声明 `"use server"` 并包装响应  |
| 4    | `@/presets/createUseAddUser.ts` | 声明 mutation 默认行为          |
| 5    | `@/hooks/useAddUser.ts`         | 生成客户端 Hook                 |

### Schema

```typescript
import { getParser } from "."
import { z } from "zod"

import { phoneSchema } from "./phone"

import { roleSchema } from "./role"

import { usernameSchema } from "./username"

export const addUserSchema = z.object(
    {
        username: usernameSchema,
        phone: phoneSchema,
        role: roleSchema,
    },
    { message: "无效的用户参数" },
)

export type AddUserParams = z.infer<typeof addUserSchema>

export const addUserParser = getParser(addUserSchema)
```

### Shared

- `shared` 文件不写 `"use server"`。
- `schema` 必须传给 `createSharedFn`。
- 如果需要权限控制，使用 `filter`。
- 如果需要暴露为 `API Route`，使用 `route`；`bodyType` 必须和实际请求体类型一致。
- 函数内部需要向客户端暴露错误时，使用 `ClientError`。

```typescript
import { prisma } from "@/prisma"
import { type AddUserParams, addUserSchema } from "@/schemas/addUser"
import { createSharedFn } from "@/server/createSharedFn"
import { isAdmin } from "@/server/isAdmin"
import { ClientError } from "@/utils/clientError"

export const addUser = createSharedFn({
    name: "addUser",
    schema: addUserSchema,
    filter: isAdmin,
    route: {
        pathname: "/users",
        bodyType: "json",
    },
})(async function addUser(params: AddUserParams) {
    const count = await prisma.user.count({ where: { username: params.username } })

    if (count > 0) throw new ClientError("用户名已存在")

    const user = await prisma.user.create({ data: params })
    return user
})
```

### Action

- `@/actions/*.ts` 文件顶部必须放 `"use server"`。
- `Action` 文件只负责把 `shared` 函数包装为响应函数，不写业务逻辑。
- 命名使用 `xxxAction`。

```typescript
"use server"

import { createResponseFn } from "@/server/createResponseFn"
import { addUser } from "@/shared/addUser"

export const addUserAction = createResponseFn(addUser)
```

### Preset

- `preset` 文件负责声明 mutation 的默认提示、缓存刷新与副作用。
- 消息提示优先使用项目已有实现；下面示例以项目已使用 `Ant Design` 的 `message` 为前提。
- 成功后刷新所有受影响的 query，例如列表与详情。

```typescript
import { useId } from "react"

import { message } from "antd"
import { withUseMutationDefaults } from "soda-tanstack-query"
import type { addUser } from "@/shared/addUser"

export const createUseAddUser = withUseMutationDefaults<typeof addUser>(() => {
    const key = useId()

    return {
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

### Hook

- `hook` 文件负责把 `Action` 转为客户端请求函数，并套用对应 `preset`。
- 客户端请求函数命名为 `xxxClient`。
- Hook 命名为 `useXxx`。

```typescript
import { createRequestFn } from "deepsea-tools"
import { addUserAction } from "@/actions/addUser"
import { createUseAddUser } from "@/presets/createUseAddUser"

export const addUserClient = createRequestFn(addUserAction)

export const useAddUser = createUseAddUser(addUserClient)
```

## Schema 设计

- `schema` 文件放在 `@/schemas` 目录下。
- 组合型对象或数组字段应尽量独立成文件，便于复用，不要直接堆在业务 schema 中。
- 字段级 schema 的命名使用字段名加 `Schema` 后缀，例如 `usernameSchema`。
- 参数类型使用 schema 名称对应的大驼峰形式加 `Params` 后缀，例如 `AddUserParams`。
- 每个 schema 文件都应导出对应的 `parser`，命名为 `xxxParser`。

不要把可复用字段直接写在业务 schema 里：

```typescript
export const addUserSchema = z.object(
    {
        username: z.string({ message: "无效的用户名" }),
    },
    { message: "无效的用户参数" },
)
```

应抽取为字段级 schema：

```typescript
import { getParser } from "."
import { z } from "zod"

export const usernameSchema = z
    .string({ message: "无效的用户名" })
    .min(4, { message: "用户名长度不能低于 4 位" })
    .max(16, { message: "用户名长度不能超过 16 位" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "用户名只能包含字母、数字和下划线" })
    .regex(/^[a-zA-Z]/, { message: "用户名必须以字母开头" })

export type UsernameParams = z.infer<typeof usernameSchema>

export const usernameParser = getParser(usernameSchema)
```

## Utils 与 Server

- `@/utils` 目录只能放客户端可访问，或客户端与服务端都可访问的工具函数。
- 只能在服务端访问的工具函数、鉴权逻辑、数据库逻辑、密钥相关逻辑，必须放在 `@/server` 或其他明确的服务端目录下。
- 不要从客户端组件、客户端 Hook 或浏览器可执行代码中导入 `@/server` 文件。

## API Route

- 只有功能必须通过 HTTP 接口暴露时才创建 `API Route`，例如第三方调用、Webhook、文件下载或 `Server Action` 无法覆盖的场景。
- 成功响应是 JSON 数据时，优先使用 `shared -> action/route -> preset -> hooks/apis` 链路，不要直接写独立 `route.ts`。
- 需要创建 JSON `API Route` 时，优先给 `createSharedFn` 配置 `route`。
- 只有成功响应不是 JSON 时，才允许直接定义独立 `route.ts`。
- 文件下载、二进制流、图片流、上游流式透传等场景，可以保留独立 `route.ts`。
- 即使保留独立 `route.ts`，核心业务逻辑也应尽量复用 `@/shared`。
