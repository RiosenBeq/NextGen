export function getErrorMessage(error: unknown, fallback = 'Bilinmeyen bir hata oluştu.'): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string' && error.length > 0) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}
