interface ImageData {
	id?: string;
	name?: string;
	os_type?: string;
	architecture?: string;
	tags?: string[];
	min_disk?: number;
	min_ram?: number;
}

interface ApiResponse {
	images?: ImageData[];
}

export async function formatGetImageResponse(response: Response) {
	try {
		const body = (await response.json()) as ApiResponse;

		if (!body?.images || !Array.isArray(body.images)) {
			return JSON.stringify({
				status: response.status,
				statusText: response.statusText,
				body: body,
			});
		}

		const slimmed = {
			images: body.images.map((img: ImageData) => {
				const slim = {
					id: img?.id,
					name: img?.name,
					osType: img?.os_type,
					arch: img?.architecture,
					tags: img?.tags,
					minDisk: img?.min_disk,
					minRam: img?.min_ram,
				};
				return slim;
			}),
		};
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: slimmed,
		});
	} catch (error) {
		console.error("Error formatting response:", error);
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: "<error>",
		});
	}
}
