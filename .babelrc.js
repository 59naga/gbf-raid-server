module.exports = {
  "plugins": [
    "@babel/transform-flow-strip-types"
  ],
  "env": {
    "development": {
      "presets": [
        ["@babel/env", {"targets": {"node": "current"}}],
        "power-assert"
      ]
    },
    "mjs": {
      "presets": [
        ["@babel/env", {"targets": {"node": "current"}, "modules": false}]
      ]
    }
  }
}
