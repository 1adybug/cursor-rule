# Style Rules

适用于样式、布局与视觉交互修改，通用执行原则见 Base Rules。以用户指定效果和项目现有设计系统为依据，不为局部样式引入新 UI 库、样式体系或无关全局覆盖。

## 选择实现位置

- 先区分全局主题、组件实例和普通 DOM 布局，在拥有该视觉行为的最小合理范围修改；同类组件的共同问题修在共享实现。
- 组件库优先使用已有主题、设计令牌、CSS 变量、属性或插槽，再考虑类名入口或局部 CSS。按适配程度选择，不机械尝试每一种方式。
- 全局主题沿用现有 Provider，例如 `@/components/Registry.tsx` 中的 `ConfigProvider`；仅局部变化时使用库支持的局部配置，不为匹配路径新建重复 Provider。
- `radius`、`shape`、`variant`、`color` 等属性须以已安装版本支持为前提。Ant Design 按钮支持时优先使用 `color` + `variant`，非默认色通常避免 `outlined`，用户指定设计优先。
- 普通布局沿用项目的 Tailwind、CSS Module 或附近样式文件。`!important` 仅在正常配置无法覆盖且影响范围明确时使用，并说明必要原因。

## 类名与动态值

- 合并外部和内置类名时复用项目工具；优先使用 `cn` 导出的 `cn` 或者 `deepsea-tools` 导出的 `clsx`，不手写条件字符串拼接，也不为此新增依赖。
- Tailwind 有限状态使用完整的静态类名，再按条件选择；不要拼接扫描器无法识别的类名，如 `` `w-${width}px` ``。
- 运行时尺寸、坐标或颜色直接用 `style` 或 CSS 变量承载，不必先绕行主题或枚举无限取值。

```tsx
const sizeClassName = isLarge ? "h-12 px-4" : "h-8 px-3"

return <div className={clsx("text-base", sizeClassName, className)} />
```

## 布局与滚动

- 固定尺寸的 flex 子元素使用 `flex-none` 或明确的伸缩约束；可压缩内容使用 `min-w-0` 等规则，按设计选择换行、截断或滚动。
- 列表、工具栏、按钮组和表格操作列应在内容或加载状态变化时保持布局稳定，不以硬编码补偿掩盖尺寸或状态问题。
- `overflow-hidden` 应放在真正需要裁剪的区域，不能误伤阴影、描边和聚焦环；涉及裁剪时检查受影响的默认、悬停与键盘焦点状态。
- 纵向滚动条出现和消失导致横向抖动时，在实际滚动容器设置 `scrollbar-gutter: stable`；需要对称留白时使用 `stable both-edges`。
- 仅在目标浏览器不支持时考虑始终显示滚动条或局部测量，不按视口、侧栏或硬编码滚动条宽度计算补偿。

```css
.content {
    overflow-y: auto;
    scrollbar-gutter: stable;
}
```

## 验证范围

- 根据本次改动检查相关视口、长内容、空态、加载态和必要交互，不为一处样式修改遍历整个产品。
- 保留键盘焦点、可访问名称和基本可读性，不只比较静态截图。无法运行界面时明确未做视觉或交互验证。
