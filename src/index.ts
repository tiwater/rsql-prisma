import { parse } from "@rsql/parser";
import {
  EQ,
  NEQ,
  GT,
  GE,
  LT,
  LE,
  IN,
  AND,
  AND_VERBOSE,
  OR,
  OR_VERBOSE,
  ComparisonNode,
  ExpressionNode,
  isComparisonNode,
  isLogicNode,
  LogicNode,
  getSelector,
  getValue
} from "@rsql/ast";

export type RsqlPrismConfig = {
  fields?: Record<string, (s: string) => unknown>,
  defaultQuery?: Record<string, unknown>,
}

export type PrismaQuery = Record<string, unknown> | undefined;

const mapRsql = (node: ExpressionNode, config: RsqlPrismConfig): PrismaQuery => {
  if (isComparisonNode(node)) {
    return mapComparison(node, config);
  } else if (isLogicNode(node)) {
    return mapLogic(node, config);
  }

  throw new TypeError(`The "expression" has to be a valid "ExpressionNode", ${String(node)} passed.`);
}

const identity = <T>(x: T) => x;

const mapComparison = (node: ComparisonNode, { fields, defaultQuery }: RsqlPrismConfig) => {
  const selector = getSelector(node);

  if (fields && !fields[selector]) {
    // field is NOT allowed to filter
    return defaultQuery;
  }

  const v = getValue(node);
  const f = fields ? fields[selector] : identity;
  const value = Array.isArray(v) ? v.map(f) : f(v);

  switch (node.operator) {
    case EQ:
      return { [selector]: { equals: value } };
    case NEQ:
      return { [selector]: { not: value } }
    case GT:
      return { [selector]: { gt: value } };
    case GE:
      return { [selector]: { gte: value } };
    case LT:
      return { [selector]: { lt: value } };
    case LE:
      return { [selector]: { lte: value } };
    case IN:
      return { [selector]: { in: value } };
  }

  throw new SyntaxError(`The comparison operator is not supported, got "${node.operator}"`);
}

const mapLogic = (node: LogicNode, config: RsqlPrismConfig) => {
  const children = [mapRsql(node.left, config), mapRsql(node.right, config)];
  switch (node.operator) {
    case AND:
    case AND_VERBOSE:
      return { AND: children };
    case OR:
    case OR_VERBOSE:
      return { OR: children };
  }
}

export default (query: string, config: RsqlPrismConfig = {}) => {
  const expression = parse(query);
  return mapRsql(expression, config);
};
