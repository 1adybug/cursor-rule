# React Rules

适用于 React 组件、Hook 和客户端状态。通用原则见 Base Rules，样式见 Style Rules，Next.js 服务端边界见 Next Rules。遵循实际安装版本与现有架构，不因规则列出新 API 就重写已正常工作的实现。

## 版本与状态

- 新组件使用函数式组件；修改已有组件时不顺带迁移无关代码。React 类型与业务或全局类型冲突时使用别名，例如 `MouseEvent as ReactMouseEvent`。
- 表单和异步变更优先复用现有状态方案。采用 React Actions 时，按需要使用 `useActionState`、`useFormStatus` 或 `useOptimistic`，不与现有 mutation 重复维护同一操作的状态。
- React 19 的新组件可将 `ref` 作为普通 prop，Context 可使用 `<SomeContext value={value}>`；旧版兼容或库契约要求时保留对应写法。
- 渲染时使用 `use` 读取 Promise，须使用框架或已有缓存提供的 Promise，不在渲染过程中临时创建请求。
- `Activity`、`useEffectEvent`、`cacheSignal` 属于 React 19.2 的能力，只有版本、运行环境和具体需求适用时才使用；不把整个 React 19 系列视为能力完全相同。
- 页面元数据、资源加载、服务端渲染优先遵循框架机制，不额外复制一套资源管理流程。
- 保持状态的唯一来源；可从现有 props 或 state 推导的数据直接推导，Effect 用于外部系统同步，不用 Effect 修补错误状态模型。

## Props 与透传

- 原始业务模型通过 `data` 传入，复用对应类型，不拆成大量平铺字段；没有数据就不能合法渲染时，`data` 必填。
- 只有确实透传属性时才继承根元素或根组件的 Props。优先复用已导出的 Props，否则使用 `ComponentProps<...>`，排除组件自行接管或不支持的属性。
- 已使用 `@luzixu/tools` 时可用 `StrictOmit`；不要为一个类型工具新增依赖。
- 在函数参数中解构使用的属性，只有可以安全透传时才收集 `...rest`。不要把业务字段泄漏给 DOM，也不要让透传属性覆盖组件必须维护的行为。
- JSX 属性按身份、样式、数据、事件、透传组织；该顺序不得改变覆盖语义，存在同名冲突时先显式解构并组合。

以下示例沿用项目已有的 `@luzixu/tools` 和 `Book` 业务类型：

```tsx
import type { ComponentProps, FC } from "react"

import { type StrictOmit, clsx } from "@luzixu/tools"
import type { Book } from "@/apis/queryBook"

export interface BookCardProps extends StrictOmit<ComponentProps<"div">, "children" | "dangerouslySetInnerHTML"> {
    data: Book
}

export const BookCard: FC<BookCardProps> = ({ className, data, ...rest }) => (
    <div className={clsx("container", className)} {...rest}>
        <div>{data.name}</div>
        <div>{data.isbn}</div>
    </div>
)
```

## 事件与可控组件

- 对外回调使用 `onXxx`，内部处理函数使用 `handleXxx` 或准确的业务名称。
- 组合外部回调与内部逻辑时明确执行顺序；允许外部阻止默认行为时先调用外部回调，检查 `event.defaultPrevented` 后再执行内部逻辑。
- `value`、`onChange`、`onValueChange` 等沿用底层组件和项目约定，不为统一名称改写已有公共 API。
- 完全受控组件直接渲染外部 `value`，只通过回调请求更新，不复制成内部 state。支持非受控模式时，`defaultValue` 仅负责初始化，内部状态只服务于非受控模式。
- 同一实例不主动切换受控与非受控模式；不能仅靠监听 `value` 并同步内部 state 来实现两种模式。使用 `soda-hooks` 等已有工具前确认它符合该组件的状态契约。

## ref 与组件边界

- 只暴露根节点时直接透传 `ref`；内外都需要节点时复用项目的合并 ref 工具或符合当前版本的回调 ref。
- 只有自定义命令式接口才使用 `useImperativeHandle`，依赖数组与实际捕获值一致，句柄处理未挂载或卸载状态，不依赖非空断言。
- 回调 ref 需要清理时按版本支持返回清理函数；不需要返回值时使用块语句，避免隐式返回赋值结果。
- 先查已有组件与工具；公共组件放在 `@/components`，公共工具放在 `@/utils` 或项目对应目录。业务私有实现可留在业务目录，不为推测性复用拆文件。
- 组件拆分以职责清晰和维护成本为准，保持任务外 UI 与交互不变；交互控件保留语义、键盘操作和可见焦点。

## 组件库源码

- 新增 `shadcn/ui` 原始组件使用官方 CLI 与项目配置，不手工仿造整套组件；已有组件不重复生成，CLI 不覆盖未审查的本地定制。
- 优先通过组件属性、插槽和主题满足需求。若根因位于 `@/components/ui`、`@/components/ai-elements` 等仓库内源码，已授权修复可直接在共享实现做必要修改，检查调用方并说明影响。
- 涉及任务外公共 API 变更或覆盖已有定制时按 Base Rules 的授权边界处理；不要仅因目录来源于组件库就要求用户重复确认。
