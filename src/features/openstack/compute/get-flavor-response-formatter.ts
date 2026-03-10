/**
 * フレーバーレスポンスフォーマッター
 *
 * @remarks
 * フレーバー一覧APIレスポンスをslim化してフォーマットします。
 *
 * @packageDocumentation
 */

interface FlavorData {
	id?: string;
	name?: string;
	ram?: number;
	vcpus?: number;
	disk?: number;
}

interface ApiResponse {
	flavors: FlavorData[];
}

/**
 * フレーバー一覧APIレスポンスをslim化してフォーマットする
 *
 * @param response - APIレスポンス
 * @returns JSON文字列にフォーマットされたレスポンス
 */
export async function formatGetFlavorResponse(response: Response) {
	const status = response.status;
	const statusText = response.statusText;
	try {
		const body = (await response.json()) as ApiResponse;

		if (!body?.flavors || !Array.isArray(body.flavors)) {
			return JSON.stringify({
				status: status,
				statusText: statusText,
				body: body,
			});
		}

		const slimmed = {
			flavors: body.flavors.map((flavor: FlavorData) => {
				const slim = {
					id: flavor?.id,
					name: flavor?.name,
					ram: flavor?.ram,
					vcpus: flavor?.vcpus,
					disk: flavor?.disk,
				};
				return slim;
			}),
		} satisfies ApiResponse;
		return JSON.stringify({
			status: status,
			statusText: statusText,
			body: slimmed,
		});
	} catch (error) {
		console.error("Error formatting response:", error);
		return JSON.stringify({
			status: status,
			statusText: statusText,
			body: "<error>",
		});
	}
}
