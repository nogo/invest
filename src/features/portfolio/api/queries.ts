import {
  queryOptions
} from "@tanstack/react-query";
import { getInvestmentTimeline, getPortfolioSummary, getEnrichedPositions } from "./server";

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
  enrichedPositions: () =>
    queryOptions({
      queryKey: [...portfolioQueries.all, "enrichedPositions"],
      queryFn: () => getEnrichedPositions(),
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),
};