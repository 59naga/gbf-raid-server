module.exports = {
  "presets": [
    ["@babel/env", {"targets": {"node": "current"}}]
  ],
  "plugins": [
    "@babel/transform-flow-strip-types"
  ],
  "env": {
    "development": {
      "presets": [
        "power-assert"
      ]
    }
  }
}
