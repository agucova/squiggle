//FIXME accessor methods or not opaque?
@genType.opaque
type genericDist =
  | PointSet(PointSetTypes.pointSetDist)
  | SampleSet(SampleSetDist.t)
  | Symbolic(SymbolicDistTypes.symbolicDist)

type asAlgebraicCombinationStrategy = AsDefault | AsSymbolic | AsMonteCarlo | AsConvolution

@genType.opaque
type error =
  | NotYetImplemented
  | Unreachable
  | DistributionVerticalShiftIsInvalid
  | SampleSetError(SampleSetDist.Error.sampleSetError)
  | ArgumentError(string)
  | OperationError(Operation.Error.t)
  | PointSetConversionError(SampleSetDist.Error.pointsetConversionError)
  | SparklineError(string)
  | RequestedStrategyInvalidError(string)
  | LogarithmOfDistributionError(string)
  | OtherError(string)
  | XYShapeError(XYShape.error)

@genType
module Error = {
  type t = error

  let fromString = (s: string): t => OtherError(s)

  let toString = (err: error): string =>
    switch err {
    | NotYetImplemented => "Function not yet implemented"
    | Unreachable => "Unreachable"
    | DistributionVerticalShiftIsInvalid => "Distribution vertical shift is invalid"
    | ArgumentError(s) => `Argument Error ${s}`
    | LogarithmOfDistributionError(s) => `Logarithm of input error: ${s}`
    | SampleSetError(err) => SampleSetDist.Error.toString(err)
    | OperationError(err) => Operation.Error.toString(err)
    | PointSetConversionError(err) => SampleSetDist.Error.pointsetConversionErrorToString(err)
    | SparklineError(err) => err
    | RequestedStrategyInvalidError(err) => `Requested strategy invalid: ${err}`
    | XYShapeError(err) => `XY Shape Error: ${XYShape.Error.toString(err)}`
    | OtherError(s) => s
    }

  let resultStringToResultError: result<'a, string> => result<'a, error> = n =>
    n->E.R.errMap(r => r->fromString)

  let sampleErrorToDistErr = (err: SampleSetDist.Error.sampleSetError): error => SampleSetError(err)
}

@genType
module DistributionOperation = {
  @genType
  type pointsetXSelection = [#Linear | #ByWeight]

  type direction =
    | Algebraic(asAlgebraicCombinationStrategy)
    | Pointwise

  type toFloat = [
    | #Cdf(float)
    | #Inv(float)
    | #Pdf(float)
    | #Mean
    | #Sample
    | #IntegralSum
    | #Mode
    | #Stdev
    | #Min
    | #Max
    | #Variance
  ]
}
