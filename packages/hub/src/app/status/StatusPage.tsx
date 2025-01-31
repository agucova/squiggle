"use client";

import StatusPageQueryNode, {
  StatusPageQuery,
} from "@/__generated__/StatusPageQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { FC } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

const Query = graphql`
  query StatusPageQuery {
    globalStatistics {
      users
      models
      relativeValuesDefinitions
    }
  }
`;

const StatRow: FC<{ name: string; value: number }> = ({ name, value }) => (
  <tr className="border">
    <td className="p-4 font-bold">{name}</td>
    <td className="p-4">{value}</td>
  </tr>
);

export const StatusPage: FC<{
  query: SerializablePreloadedQuery<
    typeof StatusPageQueryNode,
    StatusPageQuery
  >;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { globalStatistics: stats } = usePreloadedQuery(Query, queryRef);

  return (
    <div>
      <H1>Global statistics</H1>
      <table className="table-auto mt-8">
        <tbody>
          <StatRow name="Users" value={stats.users} />
          <StatRow name="Models" value={stats.models} />
          <StatRow
            name="Relative Values Definitions"
            value={stats.relativeValuesDefinitions}
          />
        </tbody>
      </table>
    </div>
  );
};
