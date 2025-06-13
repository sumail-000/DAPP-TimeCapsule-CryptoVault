export const getContractError = (error: any): string => {
  if (error instanceof Error) {
    // Attempt to extract a more user-friendly message from the error object
    if ((error as any).cause && (error as any).cause.shortMessage) {
      return (error as any).cause.shortMessage;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred.';
}; 