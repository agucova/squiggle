import { Env } from "../../dist/env.js";
import { IRuntimeError } from "../../errors/IError.js";
import { getStdLib } from "../../library/index.js";
import { createContext } from "../../reducer/context.js";
import { Lambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";

import { SqError, SqOtherError, SqRuntimeError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { wrapDomain } from "./SqDomain.js";
import { SqValue, wrapValue } from "./index.js";

export class SqLambda {
  constructor(
    public _value: Lambda, // public because of SqFnPlot.create
    public context?: SqValueContext
  ) {}

  static createFromStdlibName(name: string) {
    const value = getStdLib().get(name);
    if (!value) {
      throw new Error(`Name ${name} not found in stdlib`);
    }
    if (value.type !== "Lambda") {
      throw new Error(`Stdlib value ${name} is not a function`);
    }
    return new SqLambda(value.value);
  }

  parameters() {
    return this._value.getParameters().map((parameter) => {
      return {
        name: parameter.name,
        domain: parameter.domain
          ? wrapDomain(parameter.domain.value)
          : undefined,
      };
    });
  }

  parameterNames() {
    return this.parameters().map((parameter) => parameter.name);
  }

  call(args: SqValue[], env?: Env): result<SqValue, SqError> {
    if (!env) {
      if (!this.context) {
        return Result.Err(
          new SqOtherError(
            "Programmatically constructed lambda call requires env argument"
          )
        );
      }
      // default to project environment that created this lambda
      env = this.context.project.getEnvironment();
    }
    const rawArgs = args.map((arg) => arg._value);
    try {
      // TODO - obtain correct context from project
      const value = this._value.call(rawArgs, createContext(env));
      return Result.Ok(wrapValue(value));
    } catch (e) {
      return Result.Err(new SqRuntimeError(IRuntimeError.fromException(e)));
    }
  }

  toString() {
    return this._value.toString();
  }
}
