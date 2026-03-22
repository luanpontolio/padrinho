"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@ethersproject+base64@5.8.0";
exports.ids = ["vendor-chunks/@ethersproject+base64@5.8.0"];
exports.modules = {

/***/ "(ssr)/../node_modules/.pnpm/@ethersproject+base64@5.8.0/node_modules/@ethersproject/base64/lib.esm/base64.js":
/*!**************************************************************************************************************!*\
  !*** ../node_modules/.pnpm/@ethersproject+base64@5.8.0/node_modules/@ethersproject/base64/lib.esm/base64.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   decode: () => (/* binding */ decode),\n/* harmony export */   encode: () => (/* binding */ encode)\n/* harmony export */ });\n/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/bytes */ \"(ssr)/../node_modules/.pnpm/@ethersproject+bytes@5.8.0/node_modules/@ethersproject/bytes/lib.esm/index.js\");\n\n\nfunction decode(textData) {\n    textData = atob(textData);\n    const data = [];\n    for (let i = 0; i < textData.length; i++) {\n        data.push(textData.charCodeAt(i));\n    }\n    return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_0__.arrayify)(data);\n}\nfunction encode(data) {\n    data = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_0__.arrayify)(data);\n    let textData = \"\";\n    for (let i = 0; i < data.length; i++) {\n        textData += String.fromCharCode(data[i]);\n    }\n    return btoa(textData);\n}\n//# sourceMappingURL=base64.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BldGhlcnNwcm9qZWN0K2Jhc2U2NEA1LjguMC9ub2RlX21vZHVsZXMvQGV0aGVyc3Byb2plY3QvYmFzZTY0L2xpYi5lc20vYmFzZTY0LmpzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFhO0FBQ21DO0FBQ3pDO0FBQ1A7QUFDQTtBQUNBLG9CQUFvQixxQkFBcUI7QUFDekM7QUFDQTtBQUNBLFdBQVcsOERBQVE7QUFDbkI7QUFDTztBQUNQLFdBQVcsOERBQVE7QUFDbkI7QUFDQSxvQkFBb0IsaUJBQWlCO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly93ZWIvLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BldGhlcnNwcm9qZWN0K2Jhc2U2NEA1LjguMC9ub2RlX21vZHVsZXMvQGV0aGVyc3Byb2plY3QvYmFzZTY0L2xpYi5lc20vYmFzZTY0LmpzPzg3ZDEiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5pbXBvcnQgeyBhcnJheWlmeSB9IGZyb20gXCJAZXRoZXJzcHJvamVjdC9ieXRlc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZSh0ZXh0RGF0YSkge1xuICAgIHRleHREYXRhID0gYXRvYih0ZXh0RGF0YSk7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGF0YS5wdXNoKHRleHREYXRhLmNoYXJDb2RlQXQoaSkpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlpZnkoZGF0YSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKGRhdGEpIHtcbiAgICBkYXRhID0gYXJyYXlpZnkoZGF0YSk7XG4gICAgbGV0IHRleHREYXRhID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGV4dERhdGEgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShkYXRhW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ0b2EodGV4dERhdGEpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmFzZTY0LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/.pnpm/@ethersproject+base64@5.8.0/node_modules/@ethersproject/base64/lib.esm/base64.js\n");

/***/ })

};
;