# Next Rules

针对 `Next.js` 16 项目的规则，最新的有关 `Next.js` 的文档，你可以在 `node_modules/next/dist/docs/` 中找到

## server action

如果你需要创建一个 `server action`，例如 `addUser`，你应该按照以下规则创建：

1. 在 `@/schemas` 目录下创建一个名为 `addUser.ts` 的文件，它的内容应该如下：

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

2. 在 `@/shared` 目录下创建一个名为 `addUser.ts` 的文件，它的内容应该如下：

    ```typescript
    import { prisma } from "@/prisma"
    import { User } from "@/prisma/generated/client"
    import { AddUserParams } from "@/schemas/addUser"
    import { createSharedFn } from "@/server/createSharedFn"
    import { isAdmin } from "@/server/isAdmin"
    import { ClientError } from "@/utils/clientError"

    export const addUser = createSharedFn({
        name: "addUser",
        schema: addUserSchema,
        // 如果需要对函数调用的用户进行过滤，你可以使用 filter 属性进行过滤
        filter: isAdmin,
        // 如果需要将 server action 暴露为 api route，你可以传递 route 属性
        route: {
            // pathname 就是 api route 的路径
            pathname: "/geclaw-resource",
            // bodyType 就是函数接收的参数类型，可以传递 "json" 和 "formData"，默认为 "json"，应该与实际的函数参数保持一致
            bodyType: "json",
        },
    })(async function addUser({ name, nickname, phoneNumber, role, image }) {
        const count = await prisma.user.count({ where: { name } })

        // 如果函数内部需要抛出错误，请使用 `ClientError` 类，它的使用方法与 `Error` 类一致，同时支持更多用法，详细请参考 `@/utils/clientError` 文件
        if (count > 0) throw new ClientError("用户名已存在")

        return user
    })
    ```

3. 在 `@/actions` 目录下创建一个名为 `addUser.ts` 的文件，它的内容应该如下：

    ```typescript
    "use server"

    import { createResponseFn } from "@/server/createResponseFn"
    import { addUser } from "@/shared/addUser"

    export const addUserAction = createResponseFn(addUser)
    ```

4. 在 `@/presets` 目录下创建一个名为 `createUseAddUser.ts` 的文件，它的内容应该如下：

    ```typescript
    import { useId } from "react"

    import { withUseMutationDefaults } from "soda-tanstack-query"
    import type { addUser } from "@/shared/addUser"

    export const createUseAddUser = withUseMutationDefaults<typeof addUser>(() => {
        const key = useId()
        return {
            onMutate(variables, context) {
                message.open({
                    key,
                    type: "loading",
                    content: "新增用户中...",
                    duration: 0,
                })
            },
            onSuccess(data, variables, onMutateResult, context) {
                // 请在此刷新其他需要刷新的关联的 query
                context.client.invalidateQueries({ queryKey: ["query-user"] })

                context.client.invalidateQueries({ queryKey: ["get-user", data.id] })

                message.open({
                    key,
                    type: "success",
                    content: "新增用户成功",
                })
            },
            onError(error, variables, onMutateResult, context) {
                message.destroy(key)
            },
            onSettled(data, error, variables, onMutateResult, context) {},
        }
    })
    ```

5. 在 `@/hooks` 目录下创建一个名为 `useAddUser.ts` 的文件，它的内容应该如下：

    ```typescript
    import { createRequestFn } from "deepsea-tools"
    import { addUserAction } from "@/actions/addUser"
    import { createUseAddUser } from "@/presets/createUseAddUser"

    export const addUserClient = createRequestFn(addUserAction)

    export const useAddUser = createUseAddUser(addUserClient)
    ```

## Schema

当你需要创建一个 `schema` 时，如果是一个对象或者数组，你应该将它们独立出来作为一个文件，而不是直接在 `schema` 中定义，例如：

```typescript
import { getParser } from "."
import { z } from "zod"

export const addUserSchema = z.object(
    {
        username: z
            .string({ message: "无效的用户名" })
            .min(4, { message: "用户名长度不能低于 4 位" })
            .max(16, { message: "用户名长度不能超过 16 位" })
            .regex(/^[a-zA-Z0-9_]+$/, { message: "用户名只能包含字母、数字和下划线" })
            .regex(/^[a-zA-Z]/, { message: "用户名必须以字母开头" }),
        phone: z.string({ message: "无效的手机号" }).regex(phoneRegex, { message: "无效的手机号" }),
    },
    { message: "无效的用户参数" },
)

export type AddUserParams = z.infer<typeof addUserSchema>

export const addUserParser = getParser(addUserSchema)
```

你应该将 `usernameSchema` 和 `phoneSchema` 独立出来成为两个独立的文件，便于复用，而不是直接在 `schema` 中定义，例如：

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

## Utils

`@/utils` 目录下的文件必须只能是客户端可以访问的工具函数，或者客户端和服务器都可以访问的工具函数，如果一个工具函数只能在服务器访问，或者不能暴露给客户端，请将它放在 `@/server` 目录下

## Api Route

- 只有当你的某个功能必须通过 `HTTP` 接口的方式才能实现时，比如需要允许第三方调用的接口或者 `server action` 无法满足需求时，你才需要创建一个 `api route`
- 当你需要创建一个 `api route` 时，你只需要创建一个 `server action`，然后传递 `route` 属性即可
- 只有成功响应不是 JSON 时，才允许直接定义独立 `route.ts`
- 如果成功响应本质是 JSON 数据，必须优先走 `shared -> action/route -> preset -> hooks/apis` 这套规范
- 文件下载、二进制流、图片流、上游流式透传等场景，可以保留独立 `route.ts`
- 即使保留独立 `route.ts`，核心业务逻辑也仍然应该尽量复用 `shared`
