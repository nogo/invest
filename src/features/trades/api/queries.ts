import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTradeEvent, getBrokerAccounts } from "./server";

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
      queryClient.invalidateQueries();
    },
  });
};