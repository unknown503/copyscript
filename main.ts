import { readFileSync } from "fs"
import Parser from "./logic/parser.ts"
import Environment, { createGlobalEnv } from "./runtime/environment.ts"
import { evaluate } from "./runtime/interpreter.ts"
import chalk from "chalk"
import figlet from "figlet"
import inquirer from 'inquirer'

const cliPrompt = async () => {
	const questions = [
		{
			name: 'code',
			type: 'input',
			message: chalk.green('CopyScript ') + chalk.blue('>'),
			prefix: '',
		}
	]

	const prompt = await inquirer.prompt(questions)
	return prompt.code
}

const repl = async (env: Environment, parser: Parser) => {
	const code = await cliPrompt()

	if (code === "exit") {
		console.log(chalk.red('Bye.'))
		process.exit(1)
	}

	const program = parser.produceAST(code)
	evaluate(program, env)

	repl(env, parser)
}

function runFile(filename: string) {
	const parser = new Parser()
	const env = createGlobalEnv()

	const input = readFileSync(filename, 'utf8')
	const program = parser.produceAST(input, true)
	evaluate(program, env)
}

try {
	const args = process.argv.slice(2)

	console.log(figlet.textSync("Copy Script") + "\n")
	console.log(chalk.blue('CopyScript v0.1'))

	if (args[0] === "compile") {
		if (!args[1]) {
			console.log(chalk.red("Nothing to compile."))
			throw new Error("No file specified.")
		}
		if (!args[1].endsWith(".cscript")) {
			console.log(chalk.red("Not a .cscript file."))
			throw new Error("Invalid file type.")
		}
		console.log("Compiling " + chalk.red(args[1] + "...\n"))
		const path = process.env.PWD + "/" + args[1]

		runFile(path)
	} else {
		const parser = new Parser()
		const env = createGlobalEnv()
		console.log("Console interpreter.\n" + chalk.red('exit') + " to exit.\n")
		repl(env, parser)
	}
} catch (error) {
	console.error(error)
}