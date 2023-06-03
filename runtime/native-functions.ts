import Environment from "./environment.ts"
import { MK_BOOL, MK_NATIVE_FN, MK_NULL, MK_NUMBER, NumberVal, RuntimeVal } from "./values.ts"

const printFun = (env: Environment) => {
    const fun = (args) => {
        const values = args.map(arg => (arg as any).value)
        console.log(...values)
        return MK_NULL()
    }

    env.declareVar("print", MK_NATIVE_FN(fun), true)
}

const time = (env: Environment) => {
    function timeFunction(_args: RuntimeVal[]) {
        return MK_NUMBER(Date.now())
    }
    env.declareVar("time", MK_NATIVE_FN(timeFunction), true)
}

const MAX = (env: Environment) => {
    const max = (a: RuntimeVal[]) => MK_NUMBER(Math.max(...(a as NumberVal[]).map(n => n.value)))
    env.declareVar("MAX", MK_NATIVE_FN(max), true)
}

const MIN = (env: Environment) => {
    const min = (a: RuntimeVal[]) => MK_NUMBER(Math.min(...(a as NumberVal[]).map(n => n.value)))
    env.declareVar("MIN", MK_NATIVE_FN(min), true)
}

const ABS = (env: Environment) => {
    const abs = (a) => MK_NUMBER(Math.abs((a[0] as NumberVal).value))
    env.declareVar("ABS", MK_NATIVE_FN(abs), true)
}

const POW = (env: Environment) => {
    const pow = (a) => MK_NUMBER(Math.pow((a[0] as NumberVal).value, (a[1] as NumberVal).value))
    env.declareVar("POW", MK_NATIVE_FN(pow), true)
}

const PI = (env: Environment) => {
    const pi = () => MK_NUMBER(Math.PI)
    env.declareVar("PI", MK_NATIVE_FN(pi), true)
}

const E = (env: Environment) => {
    const e = () => MK_NUMBER(Math.E)
    env.declareVar("E", MK_NATIVE_FN(e), true)
}

const RANDOM = (env: Environment) => {
    const rng = () => MK_NUMBER(Math.random())
    env.declareVar("RANDOM", MK_NATIVE_FN(rng), true)
}

const FLOOR = (env: Environment) => {
    const floor = (a) => MK_NUMBER(Math.floor((a[0] as NumberVal).value))
    env.declareVar("FLOOR", MK_NATIVE_FN(floor), true)
}

const CEIL = (env: Environment) => {
    const ceil = (a) => MK_NUMBER(Math.ceil((a[0] as NumberVal).value))
    env.declareVar("CEIL", MK_NATIVE_FN(ceil), true)
}

export function defaultConstants(e: Environment) {
    e.declareVar("true", MK_BOOL(true), true)
    e.declareVar("false", MK_BOOL(false), true)
    e.declareVar("null", MK_NULL(), true)
    printFun(e)
    time(e)
    MAX(e)
    MIN(e)
    ABS(e)
    POW(e)
    PI(e)
    E(e)
    RANDOM(e)
    FLOOR(e)
    CEIL(e)
}