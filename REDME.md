# Yanbee.js project

[![Badge](https://img.shields.io/badge/Bicycle-blue.svg)](https://github.com/AndrewB330/)
[![Badge](https://europe-west6-xlocc-badge.cloudfunctions.net/XLOCC/AndrewB330/Yanbee)](https://github.com/AndrewB330/)

**Yanbee** - **Y**et **An**other **B**icycle for **E**xpression **E**valuation.

### Features
- Standard operations: `+`, `-`, `*`, `/`, `^`
- Unary operations: `+`, `-`
- Constants: `PI`, `E`, `G`
- Functions: `sin`, `cos`, `tan`, `atan`, `abs`, `sqrt`, `sign`
- Any number of variables
- Any custom operator, unary function of constant can be added

### Example

```js
const expr = new Expression('x-(y+z^2)*3+exp(-x)');
const value = expr.eval({x: 5, y: 6, z: 0});
```

Alternative:

```js
eval('x-(y+z^2)*3+exp(-x)') // js eval kek
```


![demo](/images/demo.png?raw=true)

### License (DUP)

DUP License: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
Do not Use it Please.
