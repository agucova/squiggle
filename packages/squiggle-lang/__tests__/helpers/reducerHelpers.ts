import {
  nodeResultToString,
  parse,
  toStringError,
} from "../../src/ast/parse.js";
import { expressionFromAst } from "../../src/expression/fromAst.js";
import { expressionToString } from "../../src/expression/index.js";
import {
  evaluateExpressionToResult,
  evaluateStringToResult,
} from "../../src/reducer/index.js";
import * as Result from "../../src/utility/result.js";
import { IError } from "../../src/reducer/IError.js";
import { Value } from "../../src/value/index.js";

const expectParseToBe = (expr: string, answer: string) => {
  expect(nodeResultToString(parse(expr, "test"))).toBe(answer);
};

const resultToString = (r: Result.result<Value, IError>) =>
  r.ok ? r.value.toString() : `Error(${r.value.toString()})`;

export const testParse = (expr: string, answer: string) =>
  test(expr, () => expectParseToBe(expr, answer));

async function expectExpressionToBe(expr: string, answer: string, v?: string) {
  const rExpr = Result.fmap(parse(expr, "test"), expressionFromAst);
  const a1 = rExpr.ok
    ? expressionToString(rExpr.value)
    : `Error(${toStringError(rExpr.value)})`;

  expect(a1).toBe(answer);

  if (v === undefined) {
    return;
  }

  const a2r: Result.result<Value, IError> = rExpr.ok
    ? await evaluateExpressionToResult(rExpr.value)
    : Result.Err(IError.fromParseError(rExpr.value));

  const a2 = resultToString(a2r);
  expect(a2).toBe(v);
}

export function testToExpression(expr: string, answer: string, v?: string) {
  test(expr, async () => await expectExpressionToBe(expr, answer, v));
}

async function expectEvalError(code: string) {
  expect(resultToString(await evaluateStringToResult(code))).toMatch(/Error\(/);
}

export function testEvalError(expr: string) {
  test(expr, async () => await expectEvalError(expr));
}

export async function expectEvalToBe(code: string, answer: string) {
  expect(resultToString(await evaluateStringToResult(code))).toBe(answer);
}

export function testEvalToBe(expr: string, answer: string) {
  test(expr, async () => await expectEvalToBe(expr, answer));
}

export const MySkip = {
  testEvalToBe: (expr: string, answer: string) =>
    test.skip(expr, async () => await expectEvalToBe(expr, answer)),
  testParse: (expr: string, answer: string) =>
    test.skip(expr, () => expectParseToBe(expr, answer)),
};

export function testDescriptionEvalToBe(
  desc: string,
  expr: string,
  answer: string
) {
  test(desc, async () => await expectEvalToBe(expr, answer));
}
