module Parse = Reducer_Peggy_Parse
module ExpressionT = Reducer_Expression_T

type sourceArgumentType = string
type sourceType = string
type rawParseArgumentType = result<Parse.node, SqError.Message.t>
type rawParseType = option<rawParseArgumentType>
type expressionArgumentType = result<ExpressionT.t, SqError.Message.t>
type expressionType = option<expressionArgumentType>
type continuationArgumentType = Reducer_T.namespace
type continuationType = option<continuationArgumentType>
type continuationResultType = option<result<continuationArgumentType, SqError.Message.t>>
type resultArgumentType = result<Reducer_T.value, SqError.t>
type resultType = option<resultArgumentType>
type continuesArgumentType = array<string>
type continuesType = array<string>
type includesArgumentType = string
type includesType = result<array<string>, SqError.Message.t>
type importAsVariablesType = array<(string, string)>

type projectItem = {
  source: sourceType,
  sourceId: string,
  rawParse: rawParseType,
  expression: expressionType,
  continuation: continuationArgumentType,
  result: resultType,
  continues: continuesType,
  includes: includesType, //For loader
  includeAsVariables: importAsVariablesType, //For linker
  directIncludes: array<string>,
}

type t = projectItem
