import {
  queryOptions
} from "@tanstack/react-query";
import { getInvestmentTimeline, getPortfolioSummary } from "./server";

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