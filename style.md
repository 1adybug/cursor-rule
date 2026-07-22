# Style Rules

## 基本原则

- 样式修改应优先使用项目现有设计系统、组件库能力和 `tailwindcss` 工具类。
- 不要为了局部样式引入新的样式体系、组件库主题方案或全局覆盖规则。
- 修改样式前，先判断目标是组件库主题、单个组件实例，还是普通 DOM 布局；不同目标使用不同方式处理。
- 优先保持现有 UI 风格与交互一致，避免为了实现局部样式引入额外视觉变化。

## 实现优先级

样式实现按以下顺序选择：

1. 组件库提供的主题、设计令牌、CSS 变量、属性、插槽或类似配置。
2. `className`、`classNames` 或其他类名入口配合 `tailwindcss`。
3. 组件附近已有的 CSS 文件、CSS Module 或项目约定的样式文件。
4. 用于运行时动态值的 `style` 属性，或确有必要时新增的局部 CSS 规则。
5. `!important`。

只有前一种方式无法清晰实现时，才使用后一种方式。

## 组件库样式

- 对于 `Ant Design`、`@heroui/react` 等组件库组件，优先使用组件库提供的属性或主题能力修改样式。
- 如果需要修改组件库的全局样式，在 `@/components/Registry.tsx` 中通过 `ConfigProvider` 或类似全局配置组件处理。
- 如果只需要修改某个局部区域的组件样式，使用局部 `ConfigProvider` 包裹目标组件。
- 对于 `React` 组件，也就是非 `div` 等 HTML 元素，谨慎使用 `!important` 覆盖样式；优先使用组件暴露的属性，例如 `radius`、`shape`、`variant`、`color` 等。
- 对于 `Ant Design` 的按钮，优先使用 `color` + `variant` 组合实现不同样式；当 `color` 不是 `default` 时，`variant` 尽量不要使用 `outlined`。

## Tailwind 与动态样式

- 普通布局与视觉样式优先使用 `tailwindcss` 工具类。
- 条件类名使用 `deepsea-tools` 中的 `clsx`。
- 不要使用模板字符串拼接动态 Tailwind 类名，例如 ``className={`w-${width}px`}``。
- 有限状态的动态样式，应枚举为稳定类名后再用 `clsx` 选择。
- 真正运行时才知道的尺寸、坐标、颜色等值，可以使用 `style` 属性或 CSS 变量承载。

```tsx
const sizeClassName = isLarge ? "h-12 px-4" : "h-8 px-3"

return <div className={clsx("text-base", sizeClassName, className)} />
```

## 布局稳定性

- 使用 `flex` 布局时，宽度或高度必须保持固定的子元素应设置 `flex-none`。
- 列表、工具栏、按钮组、表格操作列等区域应避免因为内容变化发生明显横向抖动。
- 如果内容可能溢出，优先通过 `min-w-0`、`truncate`、`overflow-hidden`、`shrink-0`、`flex-none` 等工具类明确伸缩行为，并根据目标选择是否允许元素伸缩。

## 滚动条抖动

如果容器在不同状态下有时出现纵向滚动条、有时不出现，导致内容边界横向抖动，优先在实际滚动容器上使用 `scrollbar-gutter: stable` 预留滚动条空间。

```css
.content {
    overflow-y: auto;
    scrollbar-gutter: stable;
}
```

如果布局需要在滚动容器两侧保持对称留白，可以使用 `scrollbar-gutter: stable both-edges`。只有目标浏览器不支持该属性时，才考虑始终显示滚动条或通过局部测量实现兼容方案；不要依赖视口宽度、侧边栏宽度或硬编码滚动条宽度计算补偿值。
