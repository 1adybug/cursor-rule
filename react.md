# React Rules

## 基本原则

- 项目的 `React` 版本为 `19`，生成代码时优先使用 `React 19` 的稳定能力与推荐写法。
- 组件优先使用函数式组件，不使用类组件。
- `React` 类型与全局类型或项目内命名冲突时，使用别名导入：

    ```tsx
    import { MouseEvent as ReactMouseEvent } from "react"
    ```

## React 19

- 使用 `Actions` 处理异步数据变更、提交状态、错误处理、乐观更新与表单提交；异步提交函数优先命名为 `xxxAction`。
- 表单提交优先使用 `<form action={xxxAction}>`、元素级 `formAction`、`useActionState`、`useFormStatus` 与 `requestFormReset`。
- 需要乐观 UI 时优先使用 `useOptimistic`。
- 需要在渲染阶段读取 `Promise` 或条件读取 `Context` 时优先使用 `use`，但不要在渲染期间创建未缓存的 `Promise`。
- 函数组件需要接收 `ref` 时，优先将 `ref` 作为普通 `props` 接收，新组件不要优先使用 `forwardRef`。
- 新增 `Context` Provider 时优先使用 `<SomeContext value={value}>`，不要优先使用 `<SomeContext.Provider>`。
- 回调 `ref` 需要清理逻辑时可以返回清理函数；没有清理逻辑时不要使用隐式返回。
- 需要初始占位值的延迟渲染时优先使用 `useDeferredValue(value, initialValue)`。
- 页面级元数据优先遵循框架约定，例如 `Next.js` 的 Metadata API；框架没有提供对应能力时，可以直接在组件中渲染 `<title>`、`<meta>` 与 `<link>`，让 `React` 自动提升到 `<head>`。
- 组件依赖样式表时，优先遵循框架的样式加载机制；框架没有提供对应能力时，可以渲染 `<link rel="stylesheet" precedence="...">` 或 `<style precedence="...">`，让 `React` 管理顺序、加载与去重。
- 组件依赖异步脚本时，优先遵循框架的脚本加载机制；框架没有提供对应能力时，可以直接渲染 `<script async src="...">`，让 `React` 管理提升与去重。
- 需要优化资源加载时，优先使用框架提供的资源管理能力；没有对应能力时，可以使用 `react-dom` 中的 `prefetchDNS`、`preconnect`、`preload` 与 `preinit`。
- 无框架的静态站点生成场景可以使用 `react-dom/static` 中的 `prerender` 与 `prerenderToNodeStream`；使用框架时遵循框架的渲染与构建机制。
- 框架支持时优先考虑 `React Server Components` 与 `Server Actions`，其中 `"use server"` 仅用于 `Server Actions`。
- 需要保留隐藏页面状态、预渲染下一步界面或降低隐藏内容优先级时，可以使用 `Activity`。
- `Effect` 中由外部系统触发、但需要读取最新 `props` 或 `state` 的事件逻辑，优先使用 `useEffectEvent`。
- `React Server Components` 中需要在缓存生命周期结束时中止或清理异步工作，可以使用 `cacheSignal`。
- 需要 Web Components 时可以直接使用 `Custom Elements`，`React 19` 已支持属性与 SSR 行为。

## Props 设计

- 只有组件确实会把属性完整透传给根元素或根组件时，才使用根元素或根组件类型作为当前组件 `props` 的基础类型。
- 当前组件所需的原始业务数据统一使用 `data` 属性传入。
- `data` 指整个项目中的原始数据类型，例如从 `queryBook` 接口获取到的 `Book`。
- `data` 是否可选取决于组件能否在没有数据时合法渲染；没有数据就无法表达有效状态时，必须将 `data` 声明为必填属性。
- 没有特殊原因时，不要把业务数据拆成大量平铺属性传入组件。
- 尽量直接在函数式组件参数中解构 `props`；只有组件会安全透传剩余属性时，才将其收集为 `rest`。
- 根元素是 HTML 元素时，继承对应元素类型，例如 `StrictOmit<ComponentProps<"div">, "children">`。
- 根组件是其他组件时，继承 `StrictOmit<ComponentProps<typeof Component>, "children">`；如果已有明确的 `ComponentProps` 类型，则优先继承该类型。

```tsx
import type { ComponentProps, FC } from "react"

import { type StrictOmit, clsx } from "deepsea-tools"

export interface Book {
    id: string
    name: string
    isbn: string
}

export interface BookProps extends StrictOmit<ComponentProps<"div">, "children"> {
    data: Book
}

export const Book: FC<BookProps> = ({ className, data, ...rest }) => (
    <div className={clsx("container", className)} {...rest}>
        <div>{data.name}</div>
        <div>{data.isbn}</div>
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

- 对外暴露的事件回调属性使用 `on` + 事件名命名，例如 `onClick`；组件内部处理函数可以使用 `handleClick` 或能够准确表达业务语义的名称。
- 如果组件需要组合外部回调与内部逻辑，应根据组件契约明确执行顺序。允许外部阻止默认内部行为时，先调用外部回调，并在 `event.defaultPrevented` 为 `true` 时停止内部逻辑；内部逻辑必须先执行时，应在组件契约中明确说明。

```tsx
import type { ComponentProps, FC, MouseEvent as ReactMouseEvent } from "react"

import type { StrictOmit } from "deepsea-tools"

export interface AppProps extends StrictOmit<ComponentProps<"div">, "children"> {}

export const App: FC<AppProps> = ({ onClick: _onClick, ...rest }) => {
    function handleClick(event: ReactMouseEvent<HTMLDivElement, MouseEvent>) {
        _onClick?.(event)

        if (event.defaultPrevented) return

        console.log("onClick")
    }

    return (
        <div onClick={handleClick} {...rest}>
            Hello World!
        </div>
    )
}
```

## 可控组件

- 组件的值属性与变更回调优先遵循底层组件或项目已有约定；使用 `value` 和 `onValueChange` 时，不要强行改写原本使用 `value` 和 `onChange` 的组件 API。
- 完全受控组件的 `value` 应为必填属性，并由外部维护唯一状态；同时支持受控与非受控模式时，`value` 和 `onValueChange` 可以是可选属性，并提供 `defaultValue` 作为非受控初始值。
- 同一个组件实例在生命周期内不应主动切换受控与非受控模式。
- 项目已经使用 `soda-hooks` 时，可使用 `useInputState` 同步内部状态与外部值；内部更新状态后，再调用外部传入的 `onValueChange`。

```tsx
import type { ComponentProps, FC } from "react"

import type { StrictOmit } from "deepsea-tools"
import { useInputState } from "soda-hooks"

export interface MyInputProps extends StrictOmit<ComponentProps<typeof OtherInput>, "value" | "defaultValue" | "onValueChange"> {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
}

export const MyInput: FC<MyInputProps> = ({ value: _value, defaultValue, onValueChange: _onValueChange, ...rest }) => {
    const [value, setValue] = useInputState(() => _value ?? defaultValue ?? "", [_value])

    function onValueChange(value: string) {
        setValue(value)
        _onValueChange?.(value)
    }

    return <OtherInput value={value} onValueChange={onValueChange} {...rest} />
}
```

## ref 处理

- 需要接收外部 `ref` 时，优先直接从 `props` 中解构 `ref`；如果只需要向外暴露根节点，应直接把 `ref` 传给根节点。
- 如果组件内部和外部都需要引用同一个根节点，优先使用项目已有的合并 ref 工具或回调 ref。
- 只有需要向外暴露自定义命令式句柄时才使用 `useImperativeHandle`，并显式提供依赖数组；句柄应安全处理节点尚未挂载或已经卸载的情况，不要依赖非空断言。

```tsx
import { type ComponentProps, type FC, type Ref, useImperativeHandle, useRef } from "react"

import type { StrictOmit } from "deepsea-tools"

export interface AppHandle {
    getContainer: () => HTMLDivElement | null
}

export interface AppProps extends StrictOmit<ComponentProps<"div">, "children" | "ref"> {
    ref?: Ref<AppHandle>
}

export const App: FC<AppProps> = ({ ref, ...rest }) => {
    const container = useRef<HTMLDivElement>(null)

    useImperativeHandle(
        ref,
        () => ({
            getContainer: () => container.current,
        }),
        [],
    )

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

- 如果使用 `shadcn/ui` 组件，禁止自动生成组件代码，必须使用官方的命令行工具添加。
- `shadcn/ui` 添加的原始组件一般位于 `@/components/ui/**/*.tsx`；如果需要修改这些文件，必须先向用户说明原因与影响范围并获得确认。
- `ai-elements` 原始组件一般位于 `@/components/ai-elements/**/*.tsx`；如果需要修改这些文件，必须先向用户说明原因与影响范围并获得确认。
