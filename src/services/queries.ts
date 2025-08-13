import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { listHistory } from "./history.api";
import { createTradeEvent } from "./trade.api";
import { getInvestmentTimeline, getPortfolioSummary } from "./portfolio.api";
import { getBrokerAccounts } from "./broker.api";

export const historyQueries = {
  all: ["history"],
  list: (search?: string) =>
    queryOptions({
      queryKey: [...historyQueries.all, "list", search],
      queryFn: () => listHistory({ search }),
    }),
};

export const portfolioQueries = {
  all: ["portfolio"],
  timeline: () =>
    queryOptions({
      queryKey: [...portfolioQueries.all, "timeline"],
      queryFn: () => getInvestmentTimeline(),
    }),
  summary: () =>
    queryOptions({
      queryKey: [...portfolioQueries.all, "summary"],
      queryFn: () => getPortfolioSummary(),
    }),
};

export const brokerQueries = {
  all: ["brokers"],
  list: () =>
    queryOptions({
      queryKey: [...brokerQueries.all, "list"],
      queryFn: () => getBrokerAccounts(),
    })
};

export const useRecordTradeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTradeEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyQueries.all });
      queryClient.invalidateQueries({ queryKey: portfolioQueries.all });
      queryClient.invalidateQueries({ queryKey: brokerQueries.all });
    },
  });
};