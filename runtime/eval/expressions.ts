import Errors from "../../errors/messages.ts"
import {
	AssignmentExpr,
	BinaryExpr,
	BooleanExpr,
	CallExpr,
	FunctionExpr,
	Identifier,
	ObjectLiteral,
} from "../../logic/ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import {
	BooleanDef,
	BooleanVal,
	FunctionValue,
	MK_BOOL,
	MK_NULL,
	NativeFnValue,
	NativeStmtValue,
	NumberVal,
	ObjectVal,
	RuntimeVal,
} from "../values.ts"

function eval_numeric_binary_expr(
	lhs: NumberVal,
	rhs: NumberVal,
	operator: string
): NumberVal {
	let result: number
	if (operator == "+") {
		result = lhs.value + rhs.value
	} else if (operator == "-") {
		result = lhs.value - rhs.value
	} else if (operator == "*") {
		result = lhs.value * rhs.value
	} else if (operator == "/") {
		result = lhs.value / rhs.value
	} else {
		result = lhs.value % rhs.value
	}

	return { value: result, type: "number" }
}

function eval_boolean_result_expr(lhs: BooleanDef, rhs: BooleanDef, operator: string): BooleanVal {
	let result: boolean
	if (operator == "==") {
		result = lhs.value == rhs.value
	} else if (operator == "!=") {
		result = lhs.value != rhs.value
	} else if (operator == ">") {
		result = lhs.value > rhs.value
	} else if (operator == ">=") {
		result = lhs.value >= rhs.value
	} else if (operator == "<=") {
		result = lhs.value <= rhs.value
	} else {
		result = lhs.value < rhs.value
	}

	return { value: result, type: "boolean" }
}

export function eval_binary_expr(
	binop: BinaryExpr,
	env: Environment
): RuntimeVal {
	const lhs = evaluate(binop.left, env)
	const rhs = evaluate(binop.right, env)

	if (lhs.type == "number" && rhs.type == "number") {
		return eval_numeric_binary_expr(
			lhs as NumberVal,
			rhs as NumberVal,
			binop.operator
		)
	}
	throw Errors.InvOperation + lhs.type + binop.operator + rhs.type
}

export function eval_logical_expr(logOp: BooleanExpr, env: Environment): RuntimeVal {
	const lhs = evaluate(logOp.left, env)
	const rhs = evaluate(logOp.right, env)
	return eval_boolean_result_expr(
		lhs as NumberVal,
		rhs as NumberVal,
		logOp.logicalOperator
	)
}

export function eval_identifier(
	ident: Identifier,
	env: Environment
): RuntimeVal {
	const val = env.lookupVar(ident.symbol)
	return val
}

export function eval_assignment(
	node: AssignmentExpr,
	env: Environment
): RuntimeVal {
	if (node.assigne.kind !== "Identifier") throw `${Errors.InvLHS} ${JSON.stringify(node.assigne)}`

	const varname = (node.assigne as Identifier).symbol
	const variable = env.lookupVar(varname)
	const evaluatedNode = evaluate(node.value, env) as NumberVal

	const newVarType = typeof (evaluatedNode.value)
	if (variable && variable.type !== newVarType) throw Errors.InvVarType + variable.type

	return env.assignVar(varname, evaluatedNode)
}

export function eval_object_expr(
	obj: ObjectLiteral,
	env: Environment
): RuntimeVal {
	const object = { type: "object", properties: new Map() } as ObjectVal
	for (const { key, value } of obj.properties) {
		const runtimeVal = value == undefined ? env.lookupVar(key) : evaluate(value, env)
		object.properties.set(key, runtimeVal)
	}

	return object
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
	const args = expr.args.map((arg) => evaluate(arg, env))
	const fn = evaluate(expr.caller, env)

	if (fn.type == "native-fn") {
		const result = (fn as NativeFnValue).call(args, env)
		return result
	}
	if (fn.type == "function") {
		const func = fn as FunctionValue
		const scope = new Environment(func.declarationEnv)

		for (let i = 0; i < func.parameters.length; i++) {
			const varname = func.parameters[i]
			scope.declareVar(varname, args[i], false)
		}

		let result: RuntimeVal = MK_NULL()
		for (const stmt of func.body) result = evaluate(stmt, scope)
		return result
	}

	throw Errors.CantCallValueFn + JSON.stringify(fn)
}

export function eval_fun_expr(expr: FunctionExpr, env: Environment): RuntimeVal {
	const arg = expr.parameterExpr ? evaluate(expr.parameterExpr, env) as BooleanVal : MK_BOOL(false)

	const stmt = { kind: "Identifier", symbol: expr.name } as Identifier
	const fn = evaluate(stmt, env)

	const func = fn as NativeStmtValue
	const scope = new Environment(func.declarationEnv)

	let result: RuntimeVal = MK_NULL()

	if (func.name === "if") {
		if (arg.value) {
			for (const stmt of func.body) {
				result = evaluate(stmt, scope)
			}
		} else {
			for (const stmt2 of func.elseBody) {
				result = evaluate(stmt2, scope)
			}
		}
	}

	return result
}
