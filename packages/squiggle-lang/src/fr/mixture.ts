import { BaseDist } from "../dist/BaseDist.js";
import { DistError, argumentError } from "../dist/DistError.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import * as distOperations from "../dist/distOperations/index.js";
import { Env } from "../dist/env.js";
import { unpackDistResult } from "../library/registry/helpers.js";
import { REDistributionError } from "../errors/messages.js";
import { BuiltinLambda } from "../reducer/lambda.js";
import * as E_A from "../utility/E_A.js";
import * as Result from "../utility/result.js";
import { Value, vDist } from "../value/index.js";

function raiseArgumentError(message: string): never {
  throw new REDistributionError(argumentError(message));
}

function parseNumber(arg: Value): number {
  if (arg.type === "Number") {
    return arg.value;
  } else {
    raiseArgumentError("Not a number");
  }
}

const parseNumberArray = (args: Value[]): number[] => args.map(parseNumber);

function parseDist(args: Value): BaseDist {
  if (args.type === "Dist") {
    return args.value;
  } else if (args.type === "Number") {
    return new SymbolicDist.PointMass(args.value);
  } else {
    raiseArgumentError("Not a distribution");
  }
}

const parseDistributionArray = (ags: Value[]): BaseDist[] => ags.map(parseDist);

function mixtureWithGivenWeights(
  distributions: BaseDist[],
  weights: number[],
  env: Env
): Result.result<BaseDist, DistError> {
  if (distributions.length === weights.length) {
    return distOperations.mixture(E_A.zip(distributions, weights), { env });
  } else {
    raiseArgumentError(
      "Error, mixture call has different number of distributions and weights"
    );
  }
}

function mixtureWithDefaultWeights(distributions: BaseDist[], env: Env) {
  const length = distributions.length;
  const weights = new Array(length).fill(1 / length);
  return mixtureWithGivenWeights(distributions, weights, env);
}

function mixture(args: Value[], env: Env) {
  if (args.length === 1 && args[0].type === "Array") {
    return mixtureWithDefaultWeights(
      parseDistributionArray(args[0].value),
      env
    );
  } else if (
    args.length === 2 &&
    args[0].type === "Array" &&
    args[1].type === "Array"
  ) {
    const distributions = args[0].value;
    const weights = args[1].value;
    const distrs = parseDistributionArray(distributions);
    const wghts = parseNumberArray(weights);
    return mixtureWithGivenWeights(distrs, wghts, env);
  } else if (args.length > 0) {
    const last = args[args.length - 1];
    if (last.type === "Array") {
      const weights = parseNumberArray(last.value);
      const distributions = parseDistributionArray(
        args.slice(0, args.length - 1)
      );
      return mixtureWithGivenWeights(distributions, weights, env);
    } else if (last.type === "Number" || last.type === "Dist") {
      return mixtureWithDefaultWeights(parseDistributionArray(args), env);
    }
  }
  raiseArgumentError("Last argument of mx must be array or distribution");
}

// impossible to implement with FR due to arbitrary parameters length
export const mxLambda = new BuiltinLambda("mx", (inputs, context) => {
  return vDist(unpackDistResult(mixture(inputs, context.environment)));
});
