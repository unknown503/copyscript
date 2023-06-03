import Errors from "../errors/messages.ts"
import { TokenType } from "./tokens.ts"

const KEYWORDS: Record<string, TokenType> = {
	let: TokenType.Let,
	const: TokenType.Const,
	fun: TokenType.Fun,
	if: TokenType.If,
	else: TokenType.Else,
	while: TokenType.While,
	for: TokenType.For,
	switch: TokenType.Switch,
}

export interface Token {
	value: string
	type: TokenType
}

function token(value = "", type: TokenType): Token {
	return { value, type }
}

function isalpha(src: string) {
	return src.toUpperCase() !== src.toLowerCase() || /^-?\d+$/.test(src)
}

function isskippable(str: string) {
	return str === " " || str === "\n" || str === "\t" || str === "\r"
}

function isint(str: string) {
	const c = str.charCodeAt(0)
	const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)]
	return c >= bounds[0] && c <= bounds[1]
}

export function tokenize(sourceCode: string): Token[] {
	const tokens = new Array<Token>()
	const src = sourceCode.split("")
	let openString = false
	let equalTo = false
	let exclamation = false
	let mtoe = false
	let ltoe = false

	while (src.length > 0) {
		if (src[0] === "(") {
			tokens.push(token(src.shift(), TokenType.OpenParen))
		} else if (src[0] === ")") {
			tokens.push(token(src.shift(), TokenType.CloseParen))
		} else if (src[0] === "{") {
			tokens.push(token(src.shift(), TokenType.OpenBrace))
		} else if (src[0] === "}") {
			tokens.push(token(src.shift(), TokenType.CloseBrace))
		} else if (src[0] === "[") {
			tokens.push(token(src.shift(), TokenType.OpenBracket))
		} else if (src[0] === "]") {
			tokens.push(token(src.shift(), TokenType.CloseBracket))
		} else if (
			src[0] === "+" ||
			src[0] === "-" ||
			src[0] === "*" ||
			src[0] === "/" ||
			src[0] === "%"
		) {
			tokens.push(token(src.shift(), TokenType.BinaryOperator))
		} else if (src[0] === "=") {
			if (src[1] && src[1] === "=") {
				src.shift()
				tokens.push(token("==", TokenType.EqualTo))
				equalTo = true
			}
			if (equalTo) {
				equalTo = false
				src.shift()
			} else if (exclamation) {
				src.shift()
				tokens.push(token("!=", TokenType.DifferentThan))
				exclamation = false
			} else if (mtoe) {
				src.shift()
				tokens.push(token(">=", TokenType.MoreThanOrEqualTo))
				mtoe = false
			} else if (ltoe) {
				src.shift()
				tokens.push(token("<=", TokenType.LessThanOrEqualTo))
				ltoe = false
			} else {
				tokens.push(token(src.shift(), TokenType.Equals))
			}
		} else if (src[0] === "!") {
			exclamation = true
			src.shift()
		} else if (src[0] === ">") {
			if (src[1] && src[1] === "=") {
				src.shift()
				mtoe = true
			} else {
				tokens.push(token(src.shift(), TokenType.MoreThan))
			}
		} else if (src[0] === "<") {
			if (src[1] && src[1] === "=") {
				src.shift()
				ltoe = true
			} else {
				tokens.push(token(src.shift(), TokenType.LessThan))
			}
		} else if (src[0] === ";") {
			tokens.push(token(src.shift(), TokenType.Semicolon))
		} else if (src[0] === ":") {
			tokens.push(token(src.shift(), TokenType.Colon))
		} else if (src[0] === ",") {
			tokens.push(token(src.shift(), TokenType.Comma))
		} else if (src[0] === ".") {
			tokens.push(token(src.shift(), TokenType.Dot))
		} else if (src[0] === "\"" || src[0] === "\'") {
			if (openString) {
				openString = false
				tokens.push(token(src.shift(), TokenType.CloseQuotation))
			} else {
				openString = true
				tokens.push(token(src.shift(), TokenType.OpenQuotation))
			}
		} else {
			if (isint(src[0]) && !openString) {
				let num = ""
				while (src.length > 0 && isint(src[0])) {
					num += src.shift()
				}
				tokens.push(token(num, TokenType.Number))
			} else if (isalpha(src[0]) || openString) {
				let ident = ""
				if (openString) {
					while (src.length > 0 && isalpha(src[0]) || isskippable(src[0])) {
						ident += src.shift()
					}
				} else {
					while (src.length > 0 && isalpha(src[0])) {
						ident += src.shift()
					}
				}
				if (openString) {
					tokens.push(token(ident, TokenType.String))
				} else {
					const reserved = KEYWORDS[ident]
					if (typeof reserved === "number") {
						tokens.push(token(ident, reserved))
					} else {
						tokens.push(token(ident, TokenType.Identifier))
					}
				}
			} else if (isskippable(src[0])) {
				src.shift()
			} else {
				console.error(Errors.UnreconCharacter, src[0], `(${src[0].charCodeAt(0)})`)
				process.exit(1)
			}
		}
	}

	tokens.push({ type: TokenType.EOF, value: "EndOfFile" })

	return tokens
}
