import Errors from "../errors/messages.ts"
import {
	AssignmentExpr,
	BinaryExpr,
	CallExpr,
	Expr,
	Identifier,
	MemberExpr,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Property,
	Stmt,
	VarDeclaration,
	FunctionDeclaration,
	StringLiteral,
	BooleanExpr,
	FunctionExpr,
} from "./ast.ts"

import { Token, tokenize } from "./lexer.ts"
import { TokenType } from "./tokens.ts"
import fs from "fs"

export default class Parser {
	private tokens: Token[] = []
	private creatingVar: boolean = false

	private not_eof(): boolean {
		return this.tokens[0].type != TokenType.EOF
	}

	private at() {
		return this.tokens[0] as Token
	}

	private eat() {
		const prev = this.tokens.shift() as Token
		return prev
	}

	private expect(type: TokenType, err: any) {
		const prev = this.tokens.shift() as Token
		if (!prev || prev.type !== type) {
			console.error(Errors.ParserError, err, `'${prev.value}'`, "\nExpected:", TokenType[type])
			process.exit(1)
		}

		return prev
	}

	public produceAST(sourceCode: string, writeTokens = false): Program {
		this.tokens = tokenize(sourceCode)
		const program: Program = {
			kind: "Program",
			body: [],
		}

		if (writeTokens) {
			const convertedTokens = this.tokens.map(t => ({ ...t, type: TokenType[t.type] }))
			this.write_content(convertedTokens, './examples/tokens.json')
		}

		while (this.not_eof()) {
			program.body.push(this.parse_stmt())
		}

		if (writeTokens) this.write_content(program, './examples/ast.json')

		return program
	}

	private write_content(data: object, path: string): void {
		const content = JSON.stringify(data, null, 2)
		fs.writeFile(path, content, err => {
			if (err) console.error(err)
		})
	}

	private parse_stmt(): Stmt {
		switch (this.at().type) {
			case TokenType.Let:
			case TokenType.Const:
				return this.parse_var_declaration()
			case TokenType.Fun:
				return this.parse_fn_declaration()
			case TokenType.If:
			case TokenType.While:
			case TokenType.For:
			case TokenType.Switch:
				return this.parse_nat_fun_stmt()
			default:
				return this.parse_expr()
		}
	}

	private parse_nat_fun_stmt(): Stmt {
		const name = this.eat()
		const args = this.parse_args()

		if (args.length > 1) throw Errors.ExpOneParam
		const param = args[0]

		this.expect(TokenType.OpenBrace, Errors.ExpFunBody)
		const body: Stmt[] = []

		while (this.at().type !== TokenType.EOF && this.at().type !== TokenType.CloseBrace) {
			body.push(this.parse_stmt())
		}

		this.expect(TokenType.CloseBrace, Errors.ExpClosingBrace)

		const elseBody: Stmt[] = []
		if (name.type === TokenType.If && this.at().type === TokenType.Else) {
			this.eat()
			this.expect(TokenType.OpenBrace, Errors.ExpFunBody)

			while (this.at().type !== TokenType.EOF && this.at().type !== TokenType.CloseBrace) {
				elseBody.push(this.parse_stmt())
			}
			this.expect(TokenType.CloseBrace, Errors.ExpClosingBrace)
		}

		const fn = {
			kind: "FunctionExpr",
			name: name.value,
			body,
			parameterExpr: param,
			elseBody
		} as FunctionExpr

		return fn
	}

	private parse_fn_declaration(): Stmt {
		this.eat()
		const name = this.expect(TokenType.Identifier, Errors.ExpFunName).value

		const args = this.parse_args()
		const params: string[] = []
		for (const arg of args) {
			if (arg.kind !== "Identifier") throw Errors.ExpFunParamsString
			params.push((arg as Identifier).symbol)
		}

		this.expect(TokenType.OpenBrace, Errors.ExpFunBody)
		const body: Stmt[] = []

		while (this.at().type !== TokenType.EOF && this.at().type !== TokenType.CloseBrace) {
			body.push(this.parse_stmt())
		}

		this.expect(TokenType.CloseBrace, Errors.ExpClosingBrace)

		const fn = {
			body,
			name,
			parameters: params,
			kind: "FunctionDeclaration",
		} as FunctionDeclaration

		return fn
	}

	private parse_var_declaration(): Stmt {
		const isConstant = this.eat().type == TokenType.Const
		const identifier = this.expect(TokenType.Identifier, Errors.ExpectedIdent).value
		this.creatingVar = true

		if (this.at().type == TokenType.Semicolon) {
			this.eat()
			if (isConstant) throw Errors.NoValueConst

			return {
				kind: "VarDeclaration",
				identifier,
				constant: false,
			} as VarDeclaration
		}

		this.expect(TokenType.Equals, Errors.ExpEquals)

		const declaration = {
			kind: "VarDeclaration",
			value: this.parse_expr(),
			identifier,
			constant: isConstant,
		} as VarDeclaration

		this.expect(TokenType.Semicolon, Errors.MissingSemic)
		this.creatingVar = false

		return declaration
	}

	private parse_expr(): Expr {
		return this.parse_assignment_expr()
	}

	private parse_string_literal(): Expr {
		this.eat()
		const string = this.eat().value
		this.expect(TokenType.CloseQuotation, Errors.ExpQuotation)
		return { kind: "StringLiteral", value: string } as StringLiteral
	}

	private parse_assignment_expr(): Expr {
		const left = this.parse_object_expr()

		if (this.at().type == TokenType.Equals) {
			this.eat()
			const value = this.parse_assignment_expr()
			if (this.at().type !== TokenType.Identifier) this.expect(TokenType.Semicolon, Errors.MissingSemic)
			return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr
		}

		return left
	}

	private parse_object_expr(): Expr {
		if (this.at().type !== TokenType.OpenBrace) return this.parse_additive_expr()

		this.eat()
		const properties = new Array<Property>()

		while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
			const key = this.expect(TokenType.Identifier, Errors.ExpObjKey).value

			if (this.at().type == TokenType.Comma) {
				this.eat()
				properties.push({ key, kind: "Property" } as Property)
				continue
			} else if (this.at().type == TokenType.CloseBrace) {
				properties.push({ key, kind: "Property" })
				continue
			}

			this.expect(TokenType.Colon, Errors.MissingColon)
			const value = this.parse_expr()

			properties.push({ kind: "Property", value, key })
			if (this.at().type != TokenType.CloseBrace) this.expect(TokenType.Comma, Errors.ExpCommaCBracket)
		}

		this.expect(TokenType.CloseBrace, Errors.ExpClosingBrace)
		return { kind: "ObjectLiteral", properties } as ObjectLiteral
	}

	private parse_additive_expr(): Expr {
		let left: Expr
		if (this.at().type === TokenType.OpenQuotation) {
			left = this.parse_string_literal()
		} else {
			left = this.parse_multiplicitave_expr()
		}

		while (this.at().value == "+" || this.at().value == "-") {
			const operator = this.eat().value
			const right = this.parse_multiplicitave_expr()
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr
		}
		while (
			this.at().type === TokenType.MoreThan ||
			this.at().type === TokenType.MoreThanOrEqualTo ||
			this.at().type === TokenType.DifferentThan ||
			this.at().type === TokenType.MoreThan ||
			this.at().type === TokenType.MoreThanOrEqualTo ||
			this.at().type === TokenType.LessThan ||
			this.at().type === TokenType.LessThanOrEqualTo ||
			this.at().type === TokenType.EqualTo
		) {
			const logicalOperator = this.eat().value
			const right = this.parse_additive_expr()
			left = {
				kind: "BooleanExpr",
				left,
				right,
				logicalOperator,
			} as BooleanExpr
		}

		return left
	}

	private parse_multiplicitave_expr(): Expr {
		let left: Expr
		if (this.at().value === "\"") {
			left = this.parse_string_literal()
		} else {
			left = this.parse_call_member_expr()
		}

		while (
			this.at().value == "/" ||
			this.at().value == "*" ||
			this.at().value == "%"
		) {
			const operator = this.eat().value
			const right = this.parse_call_member_expr()
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr
		}

		return left
	}

	private parse_call_member_expr(): Expr {
		const member = this.parse_member_expr()

		if (this.at().type == TokenType.OpenParen) {
			return this.parse_call_expr(member)
		}

		return member
	}

	private parse_call_expr(caller: Expr): Expr {
		let call_expr: Expr = {
			kind: "CallExpr",
			caller,
			args: this.parse_args(),
		} as CallExpr

		if (this.at().type == TokenType.OpenParen) {
			call_expr = this.parse_call_expr(call_expr)
		}

		return call_expr
	}

	private parse_args(): Expr[] {
		this.expect(TokenType.OpenParen, Errors.ExpOpenParen)
		const args = this.at().type === TokenType.CloseParen ? [] : this.parse_arguments_list()
		const mathOp = ["*", "+", "-", "/", "%"]

		this.expect(TokenType.CloseParen, Errors.MissingCloseParen)
		if (this.at().type !== TokenType.OpenBrace &&
			this.at().type !== TokenType.CloseParen &&
			!mathOp.includes(this.at().value) &&
			!this.creatingVar
		) {
			this.expect(TokenType.Semicolon, Errors.ExpSemic)
		}
		return args
	}

	private parse_arguments_list(): Expr[] {
		const args = [this.parse_assignment_expr()]

		while (this.at().type == TokenType.Comma && this.eat()) {
			args.push(this.parse_assignment_expr())
		}

		return args
	}

	private parse_member_expr(): Expr {
		let object = this.parse_primary_expr()

		while (this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
			const operator = this.eat()
			let property: Expr
			let computed: boolean

			if (operator.type == TokenType.Dot) {
				computed = false
				property = this.parse_primary_expr()
				if (property.kind != "Identifier") throw Errors.CantUseDot
			} else {
				computed = true
				property = this.parse_expr()
				this.expect(TokenType.CloseBracket, Errors.MissingCloBracket)
			}

			object = {
				kind: "MemberExpr",
				object,
				property,
				computed,
			} as MemberExpr
		}

		return object
	}

	private parse_primary_expr(): Expr {
		const tk = this.at().type

		switch (tk) {
			case TokenType.Identifier:
				return { kind: "Identifier", symbol: this.eat().value } as Identifier
			case TokenType.Number:
				return {
					kind: "NumericLiteral",
					value: parseFloat(this.eat().value),
				} as NumericLiteral
			case TokenType.OpenQuotation:
				return this.parse_string_literal()
			case TokenType.OpenParen: {
				this.eat()
				const value = this.parse_expr()
				this.expect(TokenType.CloseParen, `${Errors.UnexpToken} ${Errors.MissingCloseParen}`)
				return value
			}
			default:
				console.error(`${Errors.UnexpToken} '${this.at().value}'`)
				process.exit(1)
		}
	}
}
