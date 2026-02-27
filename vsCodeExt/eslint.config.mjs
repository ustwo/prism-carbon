import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
<<<<<<< HEAD
 
=======

>>>>>>> ConnectDashBoardFiles
export default [
    {
        ignores: ["dist/", "out/", "node_modules/", "**/*.js", "**/*.map"]
    },
<<<<<<< HEAD
   
   
=======
    
    
>>>>>>> ConnectDashBoardFiles
    {
    files: ["**/*.ts"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
 
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },
 
    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],
 
        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
    },
<<<<<<< HEAD
   
=======
    
>>>>>>> ConnectDashBoardFiles
}];