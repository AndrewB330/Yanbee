const NodeType = Object.freeze({Number: 1, Variable: 2, Operator: 3, Identity: 4, Function: 5, Constant: 6});
const TokenType = Object.freeze({Number: 1, Name: 2, Operator: 3, Parenthesis: 4})

function is_leaf_type(node_type) {
    return node_type === NodeType.Number || node_type === NodeType.Variable || node_type === NodeType.Constant;
}

class Operator {
    constructor(token, func, left_prior, right_prior, can_be_unary = false) {
        this.token = token;
        this.func = func;
        this.left_prior = left_prior;
        this.right_prior = right_prior;
        this.can_be_unary = can_be_unary;
    }
}

class Function {
    constructor(name, func) {
        this.name = name;
        this.func = func;
    }
}

class Constant {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

const OPERATORS = [
    new Operator('+', (x, y) => (x || 0) + y, 0, 0, true),
    new Operator('-', (x, y) => (x || 0) - y, 0, 0, true),
    new Operator('*', (x, y) => x * y, 1, 1),
    new Operator('/', (x, y) => x / y, 1, 1),
    new Operator('^', (x, y) => Math.pow(x, y), 3, 2),
];

const FUNCTIONS = [
    new Function('abs', x => Math.abs(x)),
    new Function('sin', x => Math.sin(x)),
    new Function('cos', x => Math.cos(x)),
    new Function('atan', x => Math.atan(x)),
    new Function('exp', x => Math.exp(x)),
    new Function('sqrt', x => Math.sqrt(x)),
    new Function('tg', x => Math.tan(x)),
    new Function('sign', x => Math.sign(x)),
];

const CONSTANTS = [
    new Constant('PI', Math.PI),
    new Constant('E', Math.E),
    new Constant('G', 9.78033),
];

function get_operator(token) {
    for (const op of OPERATORS) {
        if (op.token === token) return op;
    }
    return null;
}

function get_function(name) {
    for (const f of FUNCTIONS) {
        if (f.name === name) return f;
    }
    return null;
}

function get_constant(name) {
    for(const c of CONSTANTS) {
        if (c.name === name) return c;
    }
    return null;
}

function tokenize(str) {
    const matcher = /^\s*(([a-zA-Z_][a-zA-Z0-9_]*)|(\d+(\.\d+)?)|([()])|([+*\/^\-]))/
    const group_type = ['', '', TokenType.Name, TokenType.Number, '', TokenType.Parenthesis, TokenType.Operator];

    const tokens = [];
    while (str.length > 0) {
        const match = str.match(matcher);
        if (!match) {
            throw new Error(`Tokenization failed, invalid sequence: ${str}`);
        }
        let group = 2;
        for (; group < group_type.length && !match[group]; group++) {
        }
        if (group < group_type.length) {
            tokens.push({type: group_type[group], value: match[group]});
        }
        str = str.slice(match[0].length); // cut off the matched fragment
    }
    return tokens;
}

class ExpressionNode {
    constructor(type, value, parent) {
        this.type = type;
        this.value = value;
        this.left = null;
        this.right = null;
        this.unary = (type === NodeType.Function || type === NodeType.Identity);
        this.parent = parent;
        this.priority = (type === NodeType.Operator ? get_operator(value).right_prior : -1);
        this.opened = false;
    }

    eval(values) {
        switch (this.type) {
            case NodeType.Number:
                return parseFloat(this.value);
            case NodeType.Constant:
                const c = get_constant(this.value);
                if (c) {
                    return c.value;
                } else {
                    throw new Error(`Undefined Constant: ${this.value}`);
                }
            case NodeType.Variable:
                if (values[this.value] === null || values[this.value] === undefined) {
                    throw new Error(`Undefined variable: ${this.value}`);
                }
                return values[this.value];
            case NodeType.Identity:
                return this.right.eval(values);
            case NodeType.Operator:
                const op = get_operator(this.value);
                if (op) {
                    return op.func(this.left?.eval(values), this.right?.eval(values));
                } else {
                    throw new Error(`Undefined Operator: ${this.value}`);
                }
            case NodeType.Function:
                const f = get_function(this.value);
                if (f) {
                    return f.func(this.right.eval(values));
                } else {
                    throw new Error(`Undefined Function: ${this.value}`);
                }
        }
        throw new Error(`Undefined Node: ${this.type}, ${this.value}`);
    }
}

class Expression {
    constructor(str_exp) {
        this.tokens = tokenize(str_exp);
        this.root = new ExpressionNode(NodeType.Identity);
        this.process();
    }

    process() {
        // Strange algorithm, but it works! For real

        let ptr = this.root;
        for (const {type, value} of this.tokens) {
            // Function should always start with '('
            if (ptr.type === NodeType.Function && !ptr.opened && value !== '(') {
                throw new Error('Expected "("');
            }

            if (type === TokenType.Operator) {
                if ((ptr.type === NodeType.Identity || ptr.type === NodeType.Function) && ptr.right === null) {
                    ptr.right = new ExpressionNode(NodeType.Operator, value, ptr);
                    ptr = ptr.right;
                    continue;
                }

                const op = get_operator(value);

                if (ptr.type === NodeType.Operator && op.can_be_unary && ptr.right === null) {
                    ptr.right = new ExpressionNode(NodeType.Operator, value, ptr);
                    ptr = ptr.right;
                    continue;
                }

                if (!is_leaf_type(ptr.type) && !ptr.unary) {
                    throw new Error(`Unexpected token: ${value}`);
                }

                const prior = get_operator(value).left_prior;
                while (ptr.parent.priority >= prior) {
                    ptr = ptr.parent;
                }

                const node = new ExpressionNode(NodeType.Operator, value, ptr.parent);
                node.left = ptr;
                ptr.parent.right = node;
                ptr.parent = node;
                ptr = node;
                continue;
            }

            let next_node = null;

            if (type === TokenType.Parenthesis) {
                if (value === '(') {
                    if (is_leaf_type(ptr.type)) {
                        throw new Error(`Unexpected token: ${value}`);
                    }
                    if (ptr.type === NodeType.Function && !ptr.opened) {
                        ptr.opened = true;
                        continue;
                    }
                    next_node = new ExpressionNode(NodeType.Identity, '', ptr);
                } else if (value === ')') {
                    do {
                        ptr = ptr.parent;
                    } while(ptr.type !== NodeType.Identity && ptr.type !== NodeType.Function);
                    continue;
                } else {
                    throw new Error(`Unexpected token: ${value}`);
                }
            }

            if (type === TokenType.Name) {
                const c = get_constant(value);
                const f = get_function(value);
                if (c) {
                    next_node = new ExpressionNode(NodeType.Constant, value, ptr);
                } else if (f) {
                    next_node = new ExpressionNode(NodeType.Function, value, ptr);
                } else {
                    next_node = new ExpressionNode(NodeType.Variable, value, ptr);
                }
            }

            if (type === TokenType.Number) {
                next_node = new ExpressionNode(NodeType.Number, value, ptr);
            }

            if (next_node === null) {
                throw new Error("Unexpected error");
            }

            if (ptr.left === null && ptr.right === null) {
                ptr.right = next_node;
                ptr.unary = true;
                if (ptr.type !== NodeType.Operator) {
                    ptr = next_node;
                } else {
                    if (!get_operator(ptr.value).can_be_unary) {
                        throw new Error(`Operator ${ptr.value} can't be unary`);
                    }
                }
            } else if (ptr.right === null && ptr.left !== null) {
                ptr.right = next_node;
                ptr = next_node;
            } else {
                throw new Error(`Unexpected token: ${value}`);
            }
        }

        do {
            ptr = ptr.parent;
        } while(ptr.type !== NodeType.Identity && ptr.type !== NodeType.Function);

        if (ptr.parent) {
            throw new Error("Invalid parentheses balance");
        }
    }

    eval(values) {
        const res = this.root.eval(values);
        if (isNaN(res)) {
            throw new Error("Error while evaluating");
        }
        return res;
    }
}
