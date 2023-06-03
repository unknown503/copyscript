import {
	FunctionDeclaration,
	FunctionExpr,
	Program,
	VarDeclaration,
} from "../../logic/ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { FunctionValue, MK_NULL, NativeStmtValue, RuntimeVal } from "../values.ts"

export function eval_program(program: Program, env: Environment): RuntimeVal {
	let lastEvaluated: RuntimeVal = MK_NULL()
	for (const statement of program.body) {
		lastEvaluated = evaluate(statement, env)
	}
	return lastEvaluated
}

export function eval_var_declaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
	const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL()
	return env.declareVar(declaration.identifier, value, declaration.constant)
}

export function eval_function_declaration(declaration: FunctionDeclaration, env: Environment): RuntimeVal {
	const fn = {
		type: "function",
		name: declaration.name,
		parameters: declaration.parameters,
		declarationEnv: env,
		body: declaration.body,
	} as FunctionValue

	return env.declareVar(declaration.name, fn, true)
}

export function eval_function_exp_declaration(declaration: FunctionExpr, env: Environment): RuntimeVal {
	const fn = {
		type: "native-stmt",
		name: declaration.name,
		parameter: declaration.parameterExpr,
		declarationEnv: env,
		body: declaration.body,
		elseBody: declaration.elseBody,
	} as NativeStmtValue

	return env.declareVar(declaration.name, fn, false)
}
