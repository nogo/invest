import { queryOptions } from "@tanstack/react-query";
import { listHistory } from "./server";

export const historyQueries = {
  all: ["history"],
  list: (search?: string) =>
    queryOptions({
      queryKey: [...historyQueries.all, "list", search],
      queryFn: () => listHistory({ search }),
    }),
};