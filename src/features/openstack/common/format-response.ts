export async function formatResponse(response: Response) {
	const raw = await response.text();
	try {
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: JSON.parse(raw),
		});
	} catch (error) {
		console.error("Failed to parse response body as JSON:", error);
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: raw,
		});
	}
}
