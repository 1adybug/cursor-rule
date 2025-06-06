# User Rule

- Always respond in 中文
- 尽量使用 `interface` 而不是 `type`，函数类型除外
- 所有的类型定义都使用 `export` 导出
- 如果某一个属性的类型是 `[key]: someType | null`，请将它改写为 `[key]?: someType`，尽量不要使用 `null` 类型
- 禁止使用字面量类型，必须使用独立的类型定义，比如:

    ```typescript
    export interface Student {
        father: {
            name: string
            age: number
        }
    }    
    ```

    你应该将 `Father` 类型独立出来，而不是使用字面量类型:

    ```typescript
    export interface Father {
        name: string
        age: number
    }

    export interface Student {
        father: Father
    }
    ```

- 尽量为代码添加注释，尽量使用 `//` 而不是 `/** */`，但是对于变量名和函数名，使用 `/** 变量的作用 */` 进行注释
- 尽量使用 `const` 而不是 `let`，除非需要使用 `let` 的特性
- 尽量使用 `function` 而不是 `() => {}` 声明函数，除非是直接传递的回调函数或者 `React` 函数式组件
- 尽量使用 `"` 而不是 `'`，除非是 `"` 中包含 `'`
- 尽量不要使用 `;` 进行结尾
- 尽量使用模板字符串而不是 `+` 进行字符串拼接
- 中文和英文之间加一个空格
- 生成 `React` 组件时，尽量使用函数式组件，而不是类组件
- 你应该按照以下规范生成 `React` 组件:

    ```tsx
    import { ComponentProps, FC } from "react"
    import { clsx } from "deepsea-tools"
    import { StrictOmit } from "soda-type"

    export interface BookProps extends StrictOmit<ComponentProps<"div">, "children"> {
        isbn: string
    }

    const Book: FC<BookProps> = ({ className, isbn, ...rest }) => {

        return (
            <div className={clsx("container", className)} {...rest}>
                
            </div>
        )
    }

    export default Book
    ```

- 你应该按照以下目录结构生成 `React` 项目:

    ```text
    ├── apis/
    │   ├── addBook.ts
    │   ├── deleteBook.ts
    │   ├── getBook.ts
    │   ├── queryBook.ts
    │   └── updateBook.ts
    ├── assets/
    │   ├── fonts/
    │   │   ├── Inter-Regular.woff2
    │   │   └── Inter-Bold.woff2
    │   ├── images/
    │   │   ├── logo.svg
    │   │   ├── banner.png
    │   │   └── avatar.jpg
    │   └── videos/
    │       ├── intro.mp4
    │       └── demo.webm
    ├── components/
    │   ├── Book.tsx
    │   └── Card.tsx
    ├── constants/
    │   └── index.ts
    ├── hooks/
    │   ├── useBook.ts
    │   └── useCard.ts
    ├── pages/
    │   ├── about.tsx
    │   ├── book.tsx
    │   ├── card.tsx
    │   └── index.tsx
    ├── public/
    │   ├── index.html
    │   └── favicon.ico
    ├── utils/
    │   ├── request.ts
    │   └── round.ts
    ├── App.tsx
    ├── index.css
    ├── index.tsx
    ├── package.json
    └── tsconfig.json
    ```

- 不需要为类型文件单独生成一个 `types/index.ts` 文件，而是直接在需要使用的地方进行类型声明并且导出
- 当你使用 `HeroUI` 组件库中的 `Button` 组件时，点击事件请使用 `onPress` 而不是 `onClick`
- 当你使用`@tanstack/react-query` 的 `useQuery` 时，请使用函数名的烤肉串命名法和参数组成 `key`，例如 `queryKey: ["query-book", queryParams]`
- 函数的参数数量尽量控制在 2 个以内，如果超过 2 个，请使用对象形式的参数，参数类型名称使用函数名的大驼峰 + `Params` 后缀，例如 `QueryBookParams`
