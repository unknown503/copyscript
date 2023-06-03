
export type NodeType =
	// STATEMENTS
	| "Program"
	| "VarDeclaration"
	| "FunctionDeclaration"
	// EXPRESSIONS
	| "FunctionExpr"
	| "AssignmentExpr"
	| "MemberExpr"
	| "CallExpr"
	// Literals
	| "Property"
	| "StringLiteral"
	| "BooleanExpr"
	| "BooleanLiteral"
	| "ObjectLiteral"
	| "NumericLiteral"
	| "Identifier"
	| "BinaryExpr"

export interface Stmt {
	kind: NodeType
}

export interface Program extends Stmt {
	kind: "Program"
	body: Stmt[]
}

export interface VarDeclaration extends Stmt {
	kind: "VarDeclaration"
	constant: boolean
	identifier: string
	value?: Expr
}

export interface FunctionDeclaration extends Stmt {
	kind: "FunctionDeclaration"
	parameters: string[]
	name: string
	body: Stmt[]
}

export interface FunctionExpr extends Stmt {
	kind: "FunctionExpr"
	parameterExpr: BooleanExpr | Identifier
	name: string
	body: Stmt[]
	elseBody: Stmt[]
}

export interface Expr extends Stmt { }

export interface AssignmentExpr extends Expr {
	kind: "AssignmentExpr"
	assigne: Expr
	value: Expr
}

export interface BinaryExpr extends Expr {
	kind: "BinaryExpr"
	left: Expr
	right: Expr
	operator: string
}

export interface CallExpr extends Expr {
	kind: "CallExpr"
	args: Expr[]
	caller: Expr
}

export interface MemberExpr extends Expr {
	kind: "MemberExpr"
	object: Expr
	property: Expr
	computed: boolean
}

export interface Identifier extends Expr {
	kind: "Identifier"
	symbol: string
}

export interface NumericLiteral extends Expr {
	kind: "NumericLiteral"
	value: number
}

export interface Property extends Expr {
	kind: "Property"
	key: string
	value?: Expr
}

export interface ObjectLiteral extends Expr {
	kind: "ObjectLiteral"
	properties: Property[]
}

export interface StringLiteral extends Expr {
	kind: "StringLiteral"
	value: string
}

export interface BooleanExpr extends Expr {
	kind: "BooleanExpr"
	left: Expr
	right: Expr
	logicalOperator: string
}

export interface BooleanLiteral extends Expr {
	kind: "BooleanLiteral"
	value: boolean
}
