import { NumberVal, RuntimeVal, StringVal } from "./values.ts"
import {
	AssignmentExpr,
	BinaryExpr,
	BooleanExpr,
	CallExpr,
	FunctionDeclaration,
	FunctionExpr,
	Identifier,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Stmt,
	StringLiteral,
	VarDeclaration,
} from "../logic/ast.ts"
import Environment from "./environment.ts"
import {
	eval_function_declaration,
	eval_function_exp_declaration,
	eval_program,
	eval_var_declaration,
} from "./eval/statements.ts"
import {
	eval_assignment,
	eval_binary_expr,
	eval_call_expr,
	eval_fun_expr,
	eval_identifier,
	eval_logical_expr,
	eval_object_expr,
} from "./eval/expressions.ts"
import Errors from "../errors/messages.ts"

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
	switch (astNode.kind) {
		case "NumericLiteral":
			return {
				value: (astNode as NumericLiteral).value,
				type: "number",
			} as NumberVal
		case "StringLiteral":
			return {
				value: (astNode as StringLiteral).value,
				type: "string"
			} as StringVal
		case "Identifier":
			return eval_identifier(astNode as Identifier, env)
		case "ObjectLiteral":
			return eval_object_expr(astNode as ObjectLiteral, env)
		case "CallExpr":
			return eval_call_expr(astNode as CallExpr, env)
		case "AssignmentExpr":
			return eval_assignment(astNode as AssignmentExpr, env)
		case "BooleanExpr":
			return eval_logical_expr(astNode as BooleanExpr, env)
		case "BinaryExpr":
			return eval_binary_expr(astNode as BinaryExpr, env)
		case "Program":
			return eval_program(astNode as Program, env)
		case "VarDeclaration":
			return eval_var_declaration(astNode as VarDeclaration, env)
		case "FunctionDeclaration":
			return eval_function_declaration(astNode as FunctionDeclaration, env)
		case "FunctionExpr":
			eval_function_exp_declaration(astNode as FunctionExpr, env)
			return eval_fun_expr(astNode as FunctionExpr, env)
		default:
			console.error(Errors.NoAST, astNode)
			process.exit(0)
	}
}
