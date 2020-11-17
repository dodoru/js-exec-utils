module.exports = {
    "root": true,
    "env": {
        "node": true,
        "es6": true,
        "es2020": true,
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 11,
    },
    "rules": {
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1,
                "VariableDeclarator": {"var": 2, "let": 2, "const": 3},
            }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "off",
            "single",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true,
            },
        ],
        "semi": [
            "error",
            "always"
        ],
        "generator-star-spacing": [
            "error",
            {
                "before": true,
                "after": true,
            }
        ],

        "space-before-function-paren": [
            "error",
            {
                "anonymous": "always",
                "named": "never",
                "asyncArrow": "always",
            }
        ],
        "no-unused-vars": [
            "warn",
            {
                "args": "none",
                "vars": "local",
                "varsIgnorePattern": "[iI]gnored",
                "argsIgnorePattern": "^_",
                "ignoreRestSiblings": true,
            }
        ],
        "eol-last": [
            "error",
            "always"
        ]
    }
};
