import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatGetImageResponse } from "./get-image-response-formatter";

// Responseオブジェクトのモック用ヘルパー関数
function createMockResponse(
	status: number,
	statusText: string,
	body: any,
): Response {
	return {
		status,
		statusText,
		json: vi.fn().mockResolvedValue(body),
	} as unknown as Response;
}

describe("format-get-image-response", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("formatGetImageResponse", () => {
		it("正常なimageレスポンスを'{status: number, statusText: string, body: {images: ImageData[]}}'形式にフォーマットできる", async () => {
			const mockBody = {
				images: [
					{
						id: "image-1",
						name: "Ubuntu 20.04",
						os_type: "linux",
						architecture: "x86_64",
						tags: ["ubuntu", "lts"],
						min_disk: 10,
						min_ram: 512,
						extra_field: "should_be_filtered",
					},
					{
						id: "image-2",
						name: "CentOS 8",
						os_type: "linux",
						architecture: "x86_64",
						tags: ["centos"],
						min_disk: 8,
						min_ram: 1024,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					images: [
						{
							id: "image-1",
							name: "Ubuntu 20.04",
							osType: "linux",
							arch: "x86_64",
							tags: ["ubuntu", "lts"],
							minDisk: 10,
							minRam: 512,
						},
						{
							id: "image-2",
							name: "CentOS 8",
							osType: "linux",
							arch: "x86_64",
							tags: ["centos"],
							minDisk: 8,
							minRam: 1024,
						},
					],
				},
			});
		});

		it("空のimageリストを正しくフォーマットできる", async () => {
			const mockBody = {
				images: [],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					images: [],
				},
			});
		});

		it("一部のフィールドが欠けているimageデータを正しく処理できる", async () => {
			const mockBody = {
				images: [
					{
						id: "image-1",
						name: "Ubuntu 20.04",
						// os_type, architecture, tags, min_disk, min_ram が欠けている
					},
					{
						// id と name が欠けている
						os_type: "windows",
						architecture: "x86_64",
						tags: ["windows", "server"],
						min_disk: 20,
						min_ram: 2048,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					images: [
						{
							id: "image-1",
							name: "Ubuntu 20.04",
							osType: undefined,
							arch: undefined,
							tags: undefined,
							minDisk: undefined,
							minRam: undefined,
						},
						{
							id: undefined,
							name: undefined,
							osType: "windows",
							arch: "x86_64",
							tags: ["windows", "server"],
							minDisk: 20,
							minRam: 2048,
						},
					],
				},
			});
		});

		it("imagesプロパティが存在しない場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockBody = {
				error: "No images found",
			};
			const mockResponse = createMockResponse(404, "Not Found", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 404,
				statusText: "Not Found",
				body: mockBody,
			});
		});

		it("imagesが配列でない場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockBody = {
				images: "invalid_data",
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: mockBody,
			});
		});

		it("JSONパースエラーが発生した場合、エラーボディを返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = {
				status: 500,
				statusText: "Internal Server Error",
				json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
			} as unknown as Response;

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 500,
				statusText: "Internal Server Error",
				body: "<error>",
			});
		});

		it("さまざまなHTTPステータスコードで正しくフォーマットできる", async () => {
			const testCases = [
				{ status: 201, statusText: "Created" },
				{ status: 400, statusText: "Bad Request" },
				{ status: 401, statusText: "Unauthorized" },
				{ status: 403, statusText: "Forbidden" },
				{ status: 500, statusText: "Internal Server Error" },
			];

			for (const testCase of testCases) {
				const mockBody = {
					images: [
						{
							id: "test",
							name: "test-image",
							os_type: "linux",
							architecture: "x86_64",
							tags: ["test"],
							min_disk: 5,
							min_ram: 256,
						},
					],
				};
				const mockResponse = createMockResponse(
					testCase.status,
					testCase.statusText,
					mockBody,
				);

				const result = await formatGetImageResponse(mockResponse);
				const parsed = JSON.parse(result);

				expect(parsed.status).toBe(testCase.status);
				expect(parsed.statusText).toBe(testCase.statusText);
				expect(parsed.body.images[0]).toEqual({
					id: "test",
					name: "test-image",
					osType: "linux",
					arch: "x86_64",
					tags: ["test"],
					minDisk: 5,
					minRam: 256,
				});
			}
		});

		it("nullやundefined値を含むimageデータを正しく処理できる", async () => {
			const mockBody = {
				images: [
					{
						id: null,
						name: undefined,
						os_type: null,
						architecture: undefined,
						tags: null,
						min_disk: 0,
						min_ram: null,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					images: [
						{
							id: null,
							name: undefined,
							osType: null,
							arch: undefined,
							tags: null,
							minDisk: 0,
							minRam: null,
						},
					],
				},
			});
		});

		it("空のタグ配列を正しく処理できる", async () => {
			const mockBody = {
				images: [
					{
						id: "image-1",
						name: "No Tags Image",
						os_type: "linux",
						architecture: "x86_64",
						tags: [],
						min_disk: 10,
						min_ram: 512,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					images: [
						{
							id: "image-1",
							name: "No Tags Image",
							osType: "linux",
							arch: "x86_64",
							tags: [],
							minDisk: 10,
							minRam: 512,
						},
					],
				},
			});
		});

		it("大量のimageデータを正しく処理できる", async () => {
			const largeImages = Array.from({ length: 50 }, (_, i) => ({
				id: `image-${i}`,
				name: `Test Image ${i}`,
				os_type: i % 2 === 0 ? "linux" : "windows",
				architecture: "x86_64",
				tags: [`tag-${i}`, `category-${i % 5}`],
				min_disk: 10 + i,
				min_ram: 512 + i * 256,
				extra_data: `extra-${i}`,
			}));

			const mockBody = {
				images: largeImages,
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed.status).toBe(200);
			expect(parsed.statusText).toBe("OK");
			expect(parsed.body.images).toHaveLength(50);
			expect(parsed.body.images[0]).toEqual({
				id: "image-0",
				name: "Test Image 0",
				osType: "linux",
				arch: "x86_64",
				tags: ["tag-0", "category-0"],
				minDisk: 10,
				minRam: 512,
			});
			// extra_dataが除外されていることを確認
			expect(parsed.body.images[0]).not.toHaveProperty("extra_data");
		});

		it("bodyがnullの場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = createMockResponse(204, "No Content", null);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 204,
				statusText: "No Content",
				body: null,
			});
		});

		it("複雑なタグ配列を含むimageデータを正しく処理できる", async () => {
			const mockBody = {
				images: [
					{
						id: "image-1",
						name: "Complex Tags Image",
						os_type: "linux",
						architecture: "arm64",
						tags: ["ubuntu", "22.04", "lts", "server", "cloud-init"],
						min_disk: 20,
						min_ram: 1024,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetImageResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					images: [
						{
							id: "image-1",
							name: "Complex Tags Image",
							osType: "linux",
							arch: "arm64",
							tags: ["ubuntu", "22.04", "lts", "server", "cloud-init"],
							minDisk: 20,
							minRam: 1024,
						},
					],
				},
			});
		});
	});
});
