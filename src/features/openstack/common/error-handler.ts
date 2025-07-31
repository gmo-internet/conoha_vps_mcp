export function formatErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return `API Error: ${error.message}`;
	}
	return "Unexpected error occurred.";
}
