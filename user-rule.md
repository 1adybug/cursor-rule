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
- 尽量使用 `function` 而不是 `() => {}`，除非是直接传递的回调函数
- 尽量使用 `"` 而不是 `'`，除非是 `"` 中包含 `'`
- 尽量不要使用 `;` 进行结尾
- 尽量使用模板字符串而不是 `+` 进行字符串拼接
