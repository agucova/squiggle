let fnList = E.A.concatMany([
  FR_Dict.library,
  FR_Dist.library,
  FR_Danger.library,
  FR_Fn.library,
  FR_Sampleset.library,
  FR_Number.library,
  FR_Pointset.library,
  FR_Scoring.library,
  FR_GenericDist.library,
  FR_Units.library,
  FR_Date.library,
])

let registry = FunctionRegistry_Core.Registry.make(fnList)
let call = FunctionRegistry_Core.Registry.call(registry)

let nonRegistryLambdas: array<(string, Reducer_T.lambdaValue)> = [
  ("mx", FR_Mixture.mxLambda),
  ("mixture", FR_Mixture.mxLambda),
]
