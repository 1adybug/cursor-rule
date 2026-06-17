# React Rules

## 基本原则

- 项目的 `React` 版本为 `19`，生成代码时优先使用 `React 19` 的稳定能力与推荐写法。
- 组件优先使用函数式组件，不使用类组件。
- 如果组件内部没有逻辑，只有一个返回节点，优先使用箭头函数隐式返回，不要额外写 `return`。
- 禁止使用 `<></>`，必须从 `react` 中导入并使用 `Fragment`。
- 如果组件没有 `children`，使用自闭合标签，例如 `<div />`，不要写成 `<div></div>`。
- `React` 类型与全局类型或项目内命名冲突时，使用别名导入：

    ```tsx
    import { MouseEvent as ReactMouseEvent } from "react"
    ```

- 变量别名使用小驼峰命名，类型别名使用大驼峰命名。

## React 19

- 使用 `Actions` 处理异步数据变更、提交状态、错误处理、乐观更新与表单提交；异步提交函数优先命名为 `xxxAction`。
- 表单提交优先使用 `<form action={xxxAction}>`、元素级 `formAction`、`useActionState`、`useFormStatus` 与 `requestFormReset`。
- 需要乐观 UI 时优先使用 `useOptimistic`。
- 需要在渲染阶段读取 `Promise` 或条件读取 `Context` 时优先使用 `use`，但不要在渲染期间创建未缓存的 `Promise`。
- 函数组件需要接收 `ref` 时，优先将 `ref` 作为普通 `props` 接收，新组件不要优先使用 `forwardRef`。
- 新增 `Context` Provider 时优先使用 `<SomeContext value={value}>`，不要优先使用 `<SomeContext.Provider>`。
- 回调 `ref` 需要清理逻辑时可以返回清理函数；没有清理逻辑时不要使用隐式返回。
- 需要初始占位值的延迟渲染时优先使用 `useDeferredValue(value, initialValue)`。
- 页面级元数据优先直接在组件中渲染 `<title>`、`<meta>` 与 `<link>`，让 `React` 自动提升到 `<head>`。
- 组件依赖样式表时可以渲染 `<link rel="stylesheet" precedence="...">` 或 `<style precedence="...">`，让 `React` 管理顺序、加载与去重。
- 组件依赖异步脚本时可以直接渲染 `<script async src="...">`，让 `React` 管理提升与去重。
- 需要优化资源加载时，优先使用 `react-dom` 中的 `prefetchDNS`、`preconnect`、`preload` 与 `preinit`。
- 静态站点生成优先使用 `react-dom/static` 中的 `prerender` 与 `prerenderToNodeStream`。
- 框架支持时优先考虑 `React Server Components` 与 `Server Actions`，其中 `"use server"` 仅用于 `Server Actions`。
- 需要保留隐藏页面状态、预渲染下一步界面或降低隐藏内容优先级时，可以使用 `Activity`。
- `Effect` 中由外部系统触发、但需要读取最新 `props` 或 `state` 的事件逻辑，优先使用 `useEffectEvent`。
- `React Server Components` 中需要在缓存生命周期结束时中止或清理异步工作，可以使用 `cacheSignal`。
- 需要 Web Components 时可以直接使用 `Custom Elements`，`React 19` 已支持属性与 SSR 行为。

## Props 设计

- 组件的根元素或根组件类型，是当前组件 `props` 的基础类型。
- 当前组件所需的原始业务数据统一使用 `data` 属性传入。
- `data` 指整个项目中的原始数据类型，例如从 `queryBook` 接口获取到的 `Book`。
- 没有特殊原因时，不要把业务数据拆成大量平铺属性传入组件。
- 尽量直接在函数式组件参数中解构 `props`，并将剩余属性收集为 `rest`。
- 根元素是 HTML 元素时，继承对应元素类型，例如 `StrictOmit<ComponentProps<"div">, "children">`。
- 根组件是其他组件时，继承 `StrictOmit<ComponentProps<typeof Component>, "children">`；如果已有明确的 `ComponentProps` 类型，则优先继承该类型。

```tsx
import { ComponentProps, FC } from "react"

import { clsx, StrictOmit } from "deepsea-tools"

export interface Book {
    id: string
    name: string
    isbn: string
}

export interface BookProps extends StrictOmit<ComponentProps<"div">, "children"> {
    data?: Book
}

export const Book: FC<BookProps> = ({ className, data, ...rest }) => (
    <div className={clsx("container", className)} {...rest}>
        <div>{data?.name}</div>
        <div>{data?.isbn}</div>
    </div>
)
```

## JSX 属性顺序

组件的 `props` 书写顺序如下：

1. 身份属性：`ref`、`key`、`id`。
2. 样式属性：`className`、`classNames`、`style`、`size` 等。
3. 数据属性：`value`、`defaultValue`、`data` 等。
4. 回调事件：`onClick`、`onChange` 等。
5. 透传属性：`...rest`。

示例：

```tsx
<OtherInput ref={ref} className={className} value={value} onValueChange={onValueChange} {...rest} />
```

## className

- 如果需要给根组件设置 `className`，使用 `deepsea-tools` 中的 `clsx` 合并内置类名与外部类名。
- 不要手写字符串拼接类名，条件类名也使用 `clsx`。

```tsx
return (
    <div className={clsx("container", className)} {...rest}>
        ...
    </div>
)
```

## 事件处理

- 事件处理函数使用 `on` + 事件名命名，例如 `onClick`，不要命名为 `handleClick`。
- 如果组件内部事件与 `props` 中的事件同名，将外部事件重命名为下划线前缀，内部逻辑优先执行，然后调用外部事件。

```tsx
import { ComponentProps, FC, MouseEvent as ReactMouseEvent } from "react"

import { StrictOmit } from "deepsea-tools"

export interface AppProps extends StrictOmit<ComponentProps<"div">, "children"> {}

export const App: FC<AppProps> = ({ onClick: _onClick, ...rest }) => {
    function onClick(event: ReactMouseEvent<HTMLDivElement, MouseEvent>) {
        console.log("onClick")

        _onClick?.(event)
    }

    return (
        <div onClick={onClick} {...rest}>
            Hello World!
        </div>
    )
}
```

## 受控组件

- 受控组件使用 `value` 和 `onValueChange` 实现。
- `value` 和 `onValueChange` 都应该是可选属性。
- 组件内部使用 `soda-hooks` 中的 `useInputState` 同步内部状态与外部状态。
- 内部更新状态后，再调用外部传入的 `onValueChange`。

```tsx
import { ComponentProps, FC } from "react"

import { StrictOmit } from "deepsea-tools"
import { useInputState } from "soda-hooks"

export interface MyInputProps extends StrictOmit<ComponentProps<typeof OtherInput>, "value" | "onValueChange"> {
    value?: string
    onValueChange?: (value: string) => void
}

export const MyInput: FC<MyInputProps> = ({ value: _value, onValueChange: _onValueChange, ...rest }) => {
    const [value, setValue] = useInputState(_value)

    function onValueChange(value: string) {
        setValue(value)
        _onValueChange?.(value)
    }

    return <OtherInput value={value} onValueChange={onValueChange} {...rest} />
}
```

## ref 处理

- 需要接收外部 `ref` 时，优先直接从 `props` 中解构 `ref`。
- 如果组件内部也需要根节点引用，使用内部 `useRef` 保存节点，再通过 `useImperativeHandle` 暴露给外部 `ref`。

```tsx
import { ComponentProps, FC, useImperativeHandle, useRef } from "react"

import { StrictOmit } from "deepsea-tools"

export interface AppProps extends StrictOmit<ComponentProps<"div">, "children"> {}

export const App: FC<AppProps> = ({ ref, ...rest }) => {
    const container = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => container.current!)

    return (
        <div ref={container} {...rest}>
            Hello World!
        </div>
    )
}
```

## 组件与页面

生成组件或页面时，遵循以下规则：

1. 先分析页面结构，识别重复的 UI 片段与逻辑，并判断是否值得抽取。
2. 不要为了抽取而抽取，优先考虑维护成本、可读性与测试价值。
3. 新增组件或页面前，检查已有目录，尤其是 `@/components` 与 `@/utils`，优先复用已有实现。
4. 抽取的公共组件放在 `@/components` 目录下，公共工具函数放在 `@/utils` 目录下。
5. 禁止把公共组件或公共工具函数随意放入业务页面目录。
6. 抽取时保持原有 UI 风格与交互一致，避免引入不必要的样式或行为变化。
7. 组件拆分应提升可读性与可测试性；如果拆分后跨文件沟通成本明显增加，则保留在原文件。
8. 抽取出的组件与工具必须提供清晰的 `props`、函数签名与命名，便于维护与扩展。

## 第三方组件

- 如果使用 `shadcn/ui` 组件，禁止自动生成组件代码，必须使用命令行工具添加：

    ```bash
    npx shadcn@latest add <component-name>
    ```

- 禁止修改 `shadcn/ui` 添加的原始组件，一般路径为 `@/components/ui/**/*.tsx`。
- 如果使用 `ai-elements` 组件，禁止修改原始组件，一般路径为 `@/components/ai-elements/**/*.tsx`。
