import {
  queryOptions
} from "@tanstack/react-query";
import { getInvestmentTimeline, getPortfolioSummary, getEnrichedPositions, type PortfolioFilter } from "./server";

export const portfolioQueries = {
  all: ["portfolio"],
  timeline: (filters: PortfolioFilter = {}) =>
    queryOptions({
      queryKey: [...portfolioQueries.all, "timeline", filters],
      queryFn: () => getInvestmentTimeline({ data: filters }),
    }),
  summary: (filters: PortfolioFilter = {}) =>
    queryOptions({
      queryKey: [...portfolioQueries.all, "summary", filters],
      queryFn: () => getPortfolioSummary({ data: filters }),
    }),
  enrichedPositions: (filters: PortfolioFilter = {}) =>
    queryOptions({
      queryKey: [...portfolioQueries.all, "enrichedPositions", filters],
      queryFn: () => getEnrichedPositions({ data: filters }),
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),
};