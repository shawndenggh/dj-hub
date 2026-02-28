// ESLint 配置 - Next.js 14 + TypeScript + React + Tailwind CSS
// 所有插件 (@typescript-eslint, react, react-hooks, jsx-a11y) 已内置于 eslint-config-next

/** @type {import('eslint').Linter.Config} */
module.exports = {
  // ─── 继承基础配置 ──────────────────────────────────────────────────────────
  extends: [
    "next/core-web-vitals", // Next.js 推荐规则（含 React、React Hooks、jsx-a11y）
    "next/typescript", // Next.js 官方 TypeScript 规则集
  ],

  // ─── 解析器选项 ────────────────────────────────────────────────────────────
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true, // 启用 JSX 语法解析
    },
  },

  // ─── 环境声明 ──────────────────────────────────────────────────────────────
  env: {
    browser: true, // 允许 window、document 等浏览器全局变量
    es2022: true, // 允许 ES2022 全局变量与语法
    node: true, // 允许 Node.js 全局变量（用于 next.config.js 等配置文件）
  },

  // ─── 自定义规则 ────────────────────────────────────────────────────────────
  rules: {
    // ── TypeScript ────────────────────────────────────────────────────────────

    // 禁止使用 `any` 类型，强制显式类型注解
    "@typescript-eslint/no-explicit-any": "warn",

    // 禁止未使用的变量（以 _ 开头的变量除外，常用于忽略解构参数）
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],

    // 要求函数返回类型显式声明（组件除外，Next.js 中 JSX 返回类型可推断）
    "@typescript-eslint/explicit-function-return-type": "off",

    // 要求模块导出成员显式声明类型
    "@typescript-eslint/explicit-module-boundary-types": "off",

    // 禁止使用非空断言操作符 `!`，鼓励安全的可选链写法
    "@typescript-eslint/no-non-null-assertion": "warn",

    // 禁止空接口（`interface Foo {}`），使用 `type Foo = Record<...>` 替代
    "@typescript-eslint/no-empty-interface": "warn",

    // 强制使用 `import type` 进行类型导入，减少运行时依赖
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],

    // 禁止使用 `require()` 导入，强制使用 ES Module `import`
    "@typescript-eslint/no-require-imports": "error",

    // ── React ─────────────────────────────────────────────────────────────────

    // React 17+ 不再需要在 JSX 文件中手动引入 React
    "react/react-in-jsx-scope": "off",

    // 在 Next.js App Router 中允许不写 prop-types（TypeScript 已覆盖此功能）
    "react/prop-types": "off",

    // 禁止在 JSX 中使用危险的 dangerouslySetInnerHTML，防止 XSS 攻击
    "react/no-danger": "warn",

    // 禁止直接修改 state（只能通过 setState 或 hook）
    "react/no-direct-mutation-state": "error",

    // 数组渲染时必须提供 key 属性
    "react/jsx-key": ["error", { checkFragmentShorthand: true }],

    // 禁止无效的 HTML 属性（如 className 写成 class）
    "react/no-unknown-property": "error",

    // 自闭合标签规范（无 children 的组件使用自闭合）
    "react/self-closing-comp": ["warn", { component: true, html: true }],

    // ── React Hooks ───────────────────────────────────────────────────────────

    // 强制 Hooks 只能在函数组件或自定义 Hook 顶层调用
    "react-hooks/rules-of-hooks": "error",

    // 强制 useEffect / useCallback / useMemo 依赖数组完整性
    "react-hooks/exhaustive-deps": "warn",

    // ── 无障碍访问 (jsx-a11y) ─────────────────────────────────────────────────

    // 图片必须有 alt 属性（Next.js Image 组件同样适用）
    "jsx-a11y/alt-text": "error",

    // 禁止将点击事件绑定到非交互元素（如 div），应使用 button/a
    "jsx-a11y/click-events-have-key-events": "warn",

    // 非交互元素不应有交互式角色的事件处理
    "jsx-a11y/no-noninteractive-element-interactions": "warn",

    // ── 通用代码质量 ──────────────────────────────────────────────────────────

    // 禁止 console.log（允许 console.warn 和 console.error 用于错误上报）
    "no-console": ["warn", { allow: ["warn", "error"] }],

    // 禁止使用 debugger 语句
    "no-debugger": "error",

    // 禁止声明未使用的变量（TypeScript 版本已覆盖，此处关闭原生规则避免冲突）
    "no-unused-vars": "off",

    // 禁止重复 import 同一个模块
    "no-duplicate-imports": "error",

    // 优先使用 const，不可重赋值的变量禁止使用 let
    "prefer-const": "error",

    // 禁止使用 var，使用 let/const 替代
    "no-var": "error",

    // 强制使用严格相等 ===，避免隐式类型转换
    eqeqeq: ["error", "always", { null: "ignore" }],

    // 禁止不必要的分号（与 Prettier 配合时可关闭）
    "no-extra-semi": "warn",

    // 对象简写语法：`{ foo: foo }` → `{ foo }`
    "object-shorthand": ["warn", "always"],

    // 箭头函数体简写：单表达式省略 `return` 和 `{}`
    "arrow-body-style": ["warn", "as-needed"],

    // ── Next.js 特定 ──────────────────────────────────────────────────────────

    // 强制使用 Next.js 的 <Image> 组件替代原生 <img> 标签以优化图片
    "@next/next/no-img-element": "error",

    // 禁止在页面组件外同步访问路由（应使用 useRouter Hook）
    "@next/next/no-html-link-for-pages": "error",
  },

  // ─── 针对特定文件的覆盖规则 ──────────────────────────────────────────────
  overrides: [
    {
      // 测试文件：放宽部分规则以便编写测试
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/*.{spec,test}.[jt]s?(x)"],
      env: { jest: true },
      rules: {
        "@typescript-eslint/no-explicit-any": "off", // 测试 mock 中常需 any
        "no-console": "off", // 测试中允许 console 调试输出
        "@typescript-eslint/no-non-null-assertion": "off", // 断言在测试中常用
        "@typescript-eslint/no-require-imports": "off", // jest.mock() factory 中需要 require()
      },
    },
    {
      // Next.js 配置文件：允许 CommonJS require 和宽松类型
      files: ["next.config.js", "tailwind.config.ts", "postcss.config.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      // Prisma seed 和 migration 脚本：允许 console 输出
      files: ["prisma/**/*.ts"],
      rules: {
        "no-console": "off",
      },
    },
    {
      // E2E 测试文件（Playwright）
      files: ["e2e/**/*.ts"],
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
