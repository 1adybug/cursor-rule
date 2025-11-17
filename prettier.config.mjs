// @ts-check

/**
 * @type {import("prettier").Options}
 */
const config = {
    semi: false,
    tabWidth: 4,
    arrowParens: "avoid",
    endOfLine: "lf",
    printWidth: 160,
    overrides: [
        {
            files: "*.mdc",
            options: {
                parser: "markdown",
            },
        },
    ],
    plugins: ["./prettier-plugin-sort-imports.mjs"],
}

export default config
