import { BaseDist } from "../../dist/BaseDist.js";
import { Lambda } from "../../reducer/lambda.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import {
  Scale,
  Value,
  vArray,
  vBool,
  vDate,
  vDist,
  vLambda,
  vNumber,
  vDict,
  vScale,
  vString,
  vTimeDuration,
} from "../../value/index.js";

/*
FRType is a function that unpacks a Value.
Each function identifies the specific type and can be used in a function definition signature.
*/
export type FRType<T> = {
  unpack: (v: Value) => T | undefined;
  pack: (v: T) => Value; // used in makeSquiggleDefinition
  getName: () => string;
};

export const frNumber: FRType<number> = {
  unpack: (v: Value) => (v.type === "Number" ? v.value : undefined),
  pack: vNumber,
  getName: () => "number",
};
export const frString: FRType<string> = {
  unpack: (v: Value) => (v.type === "String" ? v.value : undefined),
  pack: vString,
  getName: () => "string",
};
export const frBool: FRType<boolean> = {
  unpack: (v: Value) => (v.type === "Bool" ? v.value : undefined),
  pack: vBool,
  getName: () => "bool",
};
export const frDate: FRType<Date> = {
  unpack: (v) => (v.type === "Date" ? v.value : undefined),
  pack: vDate,
  getName: () => "date",
};
export const frTimeDuration: FRType<number> = {
  unpack: (v) => (v.type === "TimeDuration" ? v.value : undefined),
  pack: vTimeDuration,
  getName: () => "duration",
};
export const frDistOrNumber: FRType<BaseDist | number> = {
  unpack: (v) =>
    v.type === "Dist" ? v.value : v.type === "Number" ? v.value : undefined,
  pack: (v) => (typeof v === "number" ? vNumber(v) : vDist(v)),
  getName: () => "distribution|number",
};
export const frDist: FRType<BaseDist> = {
  unpack: (v) => (v.type === "Dist" ? v.value : undefined),
  pack: vDist,
  getName: () => "distribution",
};
export const frLambda: FRType<Lambda> = {
  unpack: (v) => (v.type === "Lambda" ? v.value : undefined),
  pack: vLambda,
  getName: () => "lambda",
};
export const frScale: FRType<Scale> = {
  unpack: (v) => (v.type === "Scale" ? v.value : undefined),
  pack: vScale,
  getName: () => "scale",
};

export const frArray = <T>(itemType: FRType<T>): FRType<T[]> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Array") {
        return undefined;
      }
      if (itemType.getName() === "any") {
        // special case, performance optimization
        return v.value as T[];
      }

      const unpackedArray: T[] = [];
      for (const item of v.value) {
        const unpackedItem = itemType.unpack(item);
        if (unpackedItem === undefined) {
          return undefined;
        }
        unpackedArray.push(unpackedItem);
      }
      return unpackedArray;
    },
    pack: (v) => vArray(v.map(itemType.pack)),
    getName: () => `list(${itemType.getName()})`,
  };
};

export const frTuple2 = <T1, T2>(
  type1: FRType<T1>,
  type2: FRType<T2>
): FRType<[T1, T2]> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Array") {
        return undefined;
      }
      if (v.value.length !== 2) {
        return undefined;
      }
      const item1 = type1.unpack(v.value[0]);
      const item2 = type2.unpack(v.value[1]);
      if (item1 === undefined || item2 === undefined) {
        return undefined;
      }
      return [item1, item2];
    },
    pack: ([v1, v2]) => vArray([type1.pack(v1), type2.pack(v2)]),
    getName: () => `tuple(${type1.getName()}, ${type2.getName()})`,
  };
};

export const frDictWithArbitraryKeys = <T>(
  itemType: FRType<T>
): FRType<ImmutableMap<string, T>> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Dict") {
        return undefined;
      }
      // TODO - skip loop and copying if itemType is `any`
      let unpackedMap: ImmutableMap<string, T> = ImmutableMap();
      for (const [key, value] of v.value.entries()) {
        const unpackedItem = itemType.unpack(value);
        if (unpackedItem === undefined) {
          return undefined;
        }
        unpackedMap = unpackedMap.set(key, unpackedItem);
      }
      return unpackedMap;
    },
    pack: (v) =>
      vDict(
        ImmutableMap([...v.entries()].map(([k, v]) => [k, itemType.pack(v)]))
      ),
    getName: () => `dict(${itemType.getName()})`,
  };
};

export const frAny: FRType<Value> = {
  unpack: (v) => v,
  pack: (v) => v,
  getName: () => "any",
};

// We currently support dicts with up to 5 pairs.
// The limit could be increased with the same pattern, but there might be a better solution for this.
export function frDict<K1 extends string, T1>(
  kv1: [K1, FRType<T1>]
): FRType<{ [k in K1]: T1 }>;
export function frDict<K1 extends string, T1, K2 extends string, T2>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>]
): FRType<{ [k in K1]: T1 } & { [k in K2]: T2 }>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>]
): FRType<{ [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 }>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3,
  K4 extends string,
  T4
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>],
  kv4: [K4, FRType<T4>]
): FRType<
  { [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 } & { [k in K4]: T4 }
>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3,
  K4 extends string,
  T4,
  K5 extends string,
  T5
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>],
  kv4: [K4, FRType<T4>],
  kv5: [K5, FRType<T5>]
): FRType<
  { [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 } & {
    [k in K4]: T4;
  } & { [k in K5]: T5 }
>;

export function frDict<T extends object>(
  ...allKvs: [string, FRType<unknown>][]
): FRType<T> {
  return {
    unpack: (v: Value) => {
      // extra keys are allowed

      if (v.type !== "Dict") {
        return undefined;
      }
      const r = v.value;

      const result: { [k: string]: any } = {};

      for (const [key, valueShape] of allKvs) {
        const subvalue = r.get(key);
        if (subvalue === undefined) {
          if ("isOptional" in valueShape) {
            // that's ok!
            continue;
          }
          return undefined;
        }
        const unpackedSubvalue = valueShape.unpack(subvalue);
        if (unpackedSubvalue === undefined) {
          return undefined;
        }
        result[key] = unpackedSubvalue;
      }
      return result as any; // that's ok, overload signatures guarantee type safety
    },
    pack: (v) =>
      vDict(
        ImmutableMap(
          allKvs
            .filter(
              ([key, valueShape]) =>
                !("isOptional" in valueShape) || (v as any)[key] !== null
            )
            .map(([key, valueShape]) => [key, valueShape.pack((v as any)[key])])
        )
      ),
    getName: () =>
      "{" +
      allKvs
        .map(([name, frType]) => `${name}: ${frType.getName()}`)
        .join(", ") +
      "}",
  };
}

// Optionals are implemented for the sake of frDict, which check for them explicitly.
// Don't try to use them in other contexts.
export const frOptional = <T>(
  itemType: FRType<T>
): FRType<T | null> & { isOptional: boolean } => {
  return {
    unpack: (v: Value) => {
      return itemType.unpack(v);
    },
    pack: (v) => {
      if (v === null) {
        // shouldn't happen if frDict implementation is correct and frOptional is used correctly.
        throw new Error("Unable to pack null value");
      }
      return itemType.pack(v);
    },
    getName: () => `optional(${itemType.getName()})`,
    isOptional: true,
  };
};
