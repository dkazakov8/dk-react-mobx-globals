export type TypeActionData = {
  state: {
    mock?: any;
    error?: string;
    timeStart: number;
    isExecuting: boolean;
    isCancelled?: boolean;
    executionTime: number;
  };
};
