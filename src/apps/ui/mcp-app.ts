/**
 * MCP App クライアントスクリプト（オブジェクトストレージ）
 *
 * @remarks
 * ConoHa VPS のオブジェクトストレージを操作する MCP App UI クライアント。
 *   ① コンテナ一覧表示・新規作成・削除
 *   ② コンテナ内オブジェクト一覧表示・アップロード・削除
 *
 * @packageDocumentation
 */

import { App } from "@modelcontextprotocol/ext-apps";
import "./mcp-app.css";
import { formatBytes } from "./format-bytes.js";

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

interface ContainerData {
	name: string;
	count: number;
	bytes: number;
	last_modified?: string;
}

interface ObjectData {
	name: string;
	bytes: number;
	content_type: string;
	last_modified?: string;
	hash?: string;
}

type ViewMode = "storage" | "create-container" | "objects";

// ──────────────────────────────────────────────
// 状態
// ──────────────────────────────────────────────

let currentView: ViewMode = "storage";
let allContainers: ContainerData[] = [];
let currentContainerName: string | null = null;
let currentObjects: ObjectData[] = [];

// ──────────────────────────────────────────────
// MCP App 接続
// ──────────────────────────────────────────────

function extractText(result: {
	content?: Array<{ type: string; [k: string]: unknown }>;
}): string | null {
	const item = result.content?.find((c) => c.type === "text");
	return item && "text" in item ? (item.text as string) : null;
}

const app = new App({ name: "ConoHa VPS Storage", version: "0.1.0" });
app.connect();

// ──────────────────────────────────────────────
// データ取得
// ──────────────────────────────────────────────

async function fetchContainers(): Promise<ContainerData[]> {
	try {
		const result = await app.callServerTool({
			name: "list_containers",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).containers ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

async function callCreateContainer(
	name: string,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const result = await app.callServerTool({
			name: "create_container",
			arguments: { name },
		});
		const text = extractText(result);
		if (!text) return { ok: false, error: "応答が空でした" };
		const data = JSON.parse(text);
		if (data.error) return { ok: false, error: String(data.error) };
		return { ok: true };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "不明なエラー",
		};
	}
}

async function callDeleteContainer(
	name: string,
): Promise<{ ok: boolean; error?: string; hint?: string }> {
	try {
		const result = await app.callServerTool({
			name: "delete_container",
			arguments: { name },
		});
		const text = extractText(result);
		if (!text) return { ok: false, error: "応答が空でした" };
		const data = JSON.parse(text);
		if (data.error)
			return {
				ok: false,
				error: String(data.error),
				...(data.hint && { hint: String(data.hint) }),
			};
		return { ok: true };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "不明なエラー",
		};
	}
}

async function fetchObjects(container: string): Promise<ObjectData[]> {
	try {
		const result = await app.callServerTool({
			name: "list_objects",
			arguments: { container },
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).objects ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

async function callUploadObject(
	container: string,
	objectName: string,
	contentBase64: string,
	contentType?: string,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const result = await app.callServerTool({
			name: "upload_object",
			arguments: {
				container,
				object_name: objectName,
				content_base64: contentBase64,
				...(contentType && { content_type: contentType }),
			},
		});
		const text = extractText(result);
		if (!text) return { ok: false, error: "応答が空でした" };
		const data = JSON.parse(text);
		if (data.error) return { ok: false, error: String(data.error) };
		return { ok: true };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "不明なエラー",
		};
	}
}

async function callDeleteObject(
	container: string,
	objectName: string,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const result = await app.callServerTool({
			name: "delete_object",
			arguments: { container, object_name: objectName },
		});
		const text = extractText(result);
		if (!text) return { ok: false, error: "応答が空でした" };
		const data = JSON.parse(text);
		if (data.error) return { ok: false, error: String(data.error) };
		return { ok: true };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "不明なエラー",
		};
	}
}

/**
 * File オブジェクトを Base64 文字列に変換する
 *
 * @remarks
 * FileReader.readAsDataURL の結果から data: URI のヘッダ部を除いた純粋な
 * Base64 文字列のみを返す。大きなファイルでもスタックオーバーフローしない。
 */
function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("ファイル読み込みに失敗しました"));
				return;
			}
			const comma = result.indexOf(",");
			resolve(comma >= 0 ? result.slice(comma + 1) : result);
		};
		reader.onerror = () => reject(reader.error ?? new Error("読み込みエラー"));
		reader.readAsDataURL(file);
	});
}

// ──────────────────────────────────────────────
// ビュー切り替え
// ──────────────────────────────────────────────

function switchView(view: ViewMode): void {
	currentView = view;
	const storagePanel = document.getElementById("panel-storage");
	const createContainerPanel = document.getElementById(
		"panel-create-container",
	);
	const objectsPanel = document.getElementById("panel-objects");

	if (storagePanel)
		storagePanel.style.display = view === "storage" ? "flex" : "none";
	if (createContainerPanel)
		createContainerPanel.classList.toggle("open", view === "create-container");
	if (objectsPanel)
		objectsPanel.style.display = view === "objects" ? "flex" : "none";

	const pageLabels: Record<ViewMode, string> = {
		storage: "storage",
		"create-container": "create container",
		objects: `storage / ${currentContainerName ?? ""}`,
	};
	setTxt("page-label", pageLabels[view]);

	if (view === "storage") {
		void loadContainers();
	}
	if (view === "create-container") {
		resetContainerForm();
	}
	if (view === "objects" && currentContainerName) {
		void loadObjects(currentContainerName);
	}
}

function resetContainerForm(): void {
	const input = document.getElementById(
		"f-container-name",
	) as HTMLInputElement | null;
	if (input) input.value = "";
	clearContainerError();
	const submit = document.getElementById(
		"btn-create-container-submit",
	) as HTMLButtonElement | null;
	if (submit) submit.disabled = true;
}

// ──────────────────────────────────────────────
// ストレージコンテナ
// ──────────────────────────────────────────────

async function loadContainers(): Promise<void> {
	const list = document.getElementById("container-list");
	if (list) {
		list.innerHTML =
			'<div class="storage-empty"><div class="empty-icon">⏳</div><div class="empty-title">読み込み中…</div></div>';
	}
	const containers = await fetchContainers();
	allContainers = containers;
	renderContainerList();
	updateTimestamp();
}

function renderContainerList(): void {
	const list = document.getElementById("container-list");
	if (!list) return;
	setTxt("storage-count", `${allContainers.length} 件`);

	if (allContainers.length === 0) {
		list.innerHTML = `
			<div class="storage-empty">
				<div class="empty-icon">📦</div>
				<div class="empty-title">コンテナがまだありません</div>
				<div class="empty-desc">「+ コンテナ作成」から最初のコンテナを作りましょう。</div>
			</div>`;
		return;
	}

	list.innerHTML = allContainers
		.map((c) => {
			const sizeText = formatBytes(c.bytes);
			const lm = c.last_modified ? `更新: ${c.last_modified.slice(0, 10)}` : "";
			return `
				<div class="container-card" data-name="${esc(c.name)}">
					<div class="container-card-head">
						<div class="container-icon">📦</div>
						<div class="container-name" title="${esc(c.name)}">${esc(c.name)}</div>
						<div class="container-actions">
							<button type="button" class="container-action" data-action="delete" data-name="${esc(c.name)}">削除</button>
						</div>
					</div>
					<div class="container-stats">
						<div>
							<div class="container-stat-key">Objects</div>
							<div class="container-stat-val">${c.count.toLocaleString()}</div>
						</div>
						<div>
							<div class="container-stat-key">Size</div>
							<div class="container-stat-val">${sizeText}</div>
						</div>
					</div>
					${lm ? `<div class="container-meta">${esc(lm)}</div>` : ""}
				</div>`;
		})
		.join("");

	for (const btn of Array.from(
		list.querySelectorAll<HTMLButtonElement>(".container-action"),
	)) {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const name = btn.dataset.name ?? "";
			if (btn.dataset.action === "delete") void confirmDeleteContainer(name);
		});
	}

	// カード本体クリックでオブジェクト一覧へ遷移
	for (const card of Array.from(
		list.querySelectorAll<HTMLElement>(".container-card"),
	)) {
		card.addEventListener("click", () => {
			const name = card.dataset.name ?? "";
			if (!name) return;
			currentContainerName = name;
			switchView("objects");
		});
	}
}

async function confirmDeleteContainer(name: string): Promise<void> {
	setTxt("confirm-title", "コンテナを削除しますか？");
	setTxt("confirm-ok", "削除する");
	const body = document.getElementById("confirm-body");
	if (body) {
		body.innerHTML = `
			コンテナ <code>${esc(name)}</code> を削除します。<br>
			<span style="color:var(--red);font-size:11px">空でないコンテナは削除できません。先にオブジェクトを削除してください。</span>
		`;
	}
	const overlay = document.getElementById("confirm-overlay");
	const okBtn = document.getElementById("confirm-ok");
	const cancelBtn = document.getElementById("confirm-cancel");
	if (!overlay || !okBtn || !cancelBtn) return;

	overlay.classList.add("open");

	// AbortController でキャンセル/OK どちらでもリスナーを確実に解除する
	const controller = new AbortController();
	okBtn.addEventListener(
		"click",
		async () => {
			controller.abort();
			overlay.classList.remove("open");
			const r = await callDeleteContainer(name);
			if (!r.ok) {
				showToast(r.hint ?? r.error ?? "削除に失敗しました", "error");
				return;
			}
			showToast(`コンテナ ${name} を削除しました`, "success");
			await loadContainers();
		},
		{ signal: controller.signal },
	);
	cancelBtn.addEventListener(
		"click",
		() => {
			controller.abort();
		},
		{ signal: controller.signal },
	);
}

async function executeCreateContainer(): Promise<void> {
	const input = document.getElementById(
		"f-container-name",
	) as HTMLInputElement | null;
	const name = (input?.value ?? "").trim();
	if (!name) return;
	const submit = document.getElementById(
		"btn-create-container-submit",
	) as HTMLButtonElement | null;
	if (submit) submit.disabled = true;

	const r = await callCreateContainer(name);
	if (!r.ok) {
		showContainerError(r.error ?? "作成に失敗しました");
		if (submit) submit.disabled = false;
		return;
	}
	showToast(`コンテナ ${name} を作成しました`, "success");
	if (input) input.value = "";
	switchView("storage");
}

function showContainerError(msg: string): void {
	const err = document.getElementById("f-container-error");
	if (err) {
		err.textContent = msg;
		err.style.display = "block";
	}
}

function clearContainerError(): void {
	const err = document.getElementById("f-container-error");
	if (err) err.style.display = "none";
}

// ──────────────────────────────────────────────
// ストレージオブジェクト
// ──────────────────────────────────────────────

async function loadObjects(container: string): Promise<void> {
	setTxt("objects-container-name", container);
	setTxt("objects-count", "—");
	const list = document.getElementById("object-list");
	if (list) {
		list.innerHTML =
			'<div class="storage-empty"><div class="empty-icon">⏳</div><div class="empty-title">読み込み中…</div></div>';
	}
	const objects = await fetchObjects(container);
	currentObjects = objects;
	renderObjectList();
}

function renderObjectList(): void {
	const list = document.getElementById("object-list");
	if (!list) return;
	setTxt("objects-count", `${currentObjects.length} 件`);

	if (currentObjects.length === 0) {
		list.innerHTML = `
			<div class="storage-empty">
				<div class="empty-icon">📄</div>
				<div class="empty-title">オブジェクトがまだありません</div>
				<div class="empty-desc">「📤 ファイルをアップロード」から最初のオブジェクトを追加しましょう。</div>
			</div>`;
		return;
	}

	list.innerHTML = currentObjects
		.map((o) => {
			const lm = o.last_modified ? o.last_modified.slice(0, 10) : "";
			return `
				<div class="object-row">
					<div class="object-icon">${esc(iconForContentType(o.content_type))}</div>
					<div class="object-name-block">
						<div class="object-name" title="${esc(o.name)}">${esc(o.name)}</div>
						<div class="object-mime" title="${esc(o.content_type)}">${esc(o.content_type)}</div>
					</div>
					<div class="object-meta">${lm ? esc(lm) : ""}</div>
					<div class="object-size">${esc(formatBytes(o.bytes))}</div>
					<button type="button" class="object-action" data-name="${esc(o.name)}">削除</button>
				</div>`;
		})
		.join("");

	for (const btn of Array.from(
		list.querySelectorAll<HTMLButtonElement>(".object-action"),
	)) {
		btn.addEventListener("click", () => {
			const name = btn.dataset.name ?? "";
			void confirmDeleteObject(name);
		});
	}
}

function iconForContentType(ct: string): string {
	if (ct.startsWith("image/")) return "🖼️";
	if (ct.startsWith("video/")) return "🎞️";
	if (ct.startsWith("audio/")) return "🎵";
	if (ct.startsWith("text/")) return "📝";
	if (ct === "application/json" || ct === "application/xml") return "📝";
	if (ct === "application/pdf") return "📕";
	if (ct.includes("zip") || ct.includes("gzip") || ct.includes("tar"))
		return "🗜️";
	return "📄";
}

async function confirmDeleteObject(name: string): Promise<void> {
	const container = currentContainerName;
	if (!container) return;
	setTxt("confirm-title", "オブジェクトを削除しますか？");
	setTxt("confirm-ok", "削除する");
	const body = document.getElementById("confirm-body");
	if (body) {
		body.innerHTML = `コンテナ <code>${esc(container)}</code> 内の <code>${esc(name)}</code> を削除します。`;
	}
	const overlay = document.getElementById("confirm-overlay");
	const okBtn = document.getElementById("confirm-ok");
	const cancelBtn = document.getElementById("confirm-cancel");
	if (!overlay || !okBtn || !cancelBtn) return;

	overlay.classList.add("open");
	const controller = new AbortController();
	okBtn.addEventListener(
		"click",
		async () => {
			controller.abort();
			overlay.classList.remove("open");
			const r = await callDeleteObject(container, name);
			if (!r.ok) {
				showToast(r.error ?? "削除に失敗しました", "error");
				return;
			}
			showToast(`${name} を削除しました`, "success");
			await loadObjects(container);
		},
		{ signal: controller.signal },
	);
	cancelBtn.addEventListener(
		"click",
		() => {
			controller.abort();
		},
		{ signal: controller.signal },
	);
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

async function handleFileUpload(file: File): Promise<void> {
	const container = currentContainerName;
	if (!container) return;

	if (file.size > MAX_UPLOAD_BYTES) {
		showToast(
			`ファイルサイズが上限 (${formatBytes(MAX_UPLOAD_BYTES)}) を超えています`,
			"error",
		);
		return;
	}

	const progress = document.getElementById("upload-progress");
	const label = document.getElementById("progress-label");
	if (progress) progress.style.display = "flex";
	if (label) label.textContent = `${file.name} をアップロード中…`;

	try {
		const base64 = await fileToBase64(file);
		const r = await callUploadObject(
			container,
			file.name,
			base64,
			file.type || undefined,
		);
		if (!r.ok) {
			showToast(r.error ?? "アップロードに失敗しました", "error");
			return;
		}
		showToast(`${file.name} をアップロードしました`, "success");
		await loadObjects(container);
	} finally {
		if (progress) progress.style.display = "none";
	}
}

// ──────────────────────────────────────────────
// 共通ヘルパー
// ──────────────────────────────────────────────

function showToast(msg: string, type: "success" | "error"): void {
	const t = document.createElement("div");
	t.className = `toast ${type}`;
	t.textContent = msg;
	document.body.appendChild(t);
	setTimeout(() => t.classList.add("show"), 10);
	setTimeout(() => {
		t.classList.remove("show");
		setTimeout(() => t.remove(), 300);
	}, 3000);
}

function esc(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function setTxt(id: string, text: string): void {
	const el = document.getElementById(id);
	if (el) el.textContent = text;
}

function updateTimestamp(): void {
	const el = document.getElementById("last-update");
	if (el) {
		const now = new Date();
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(now.getMinutes()).padStart(2, "0");
		const ss = String(now.getSeconds()).padStart(2, "0");
		el.textContent = `${hh}:${mm}:${ss}`;
	}
}

// ──────────────────────────────────────────────
// イベント登録
// ──────────────────────────────────────────────

// ストレージ: コンテナ作成
document
	.getElementById("btn-create-container")
	?.addEventListener("click", () => {
		switchView("create-container");
	});
document
	.getElementById("btn-create-container-cancel")
	?.addEventListener("click", () => {
		clearContainerError();
		switchView("storage");
	});
document
	.getElementById("btn-create-container-submit")
	?.addEventListener("click", () => {
		void executeCreateContainer();
	});

// オブジェクト一覧: 戻るボタン
document
	.getElementById("btn-back-to-containers")
	?.addEventListener("click", () => {
		currentContainerName = null;
		switchView("storage");
	});

// オブジェクト一覧: アップロードボタン → ファイル選択ダイアログ
document.getElementById("btn-upload-object")?.addEventListener("click", () => {
	const fileInput = document.getElementById(
		"f-upload-file",
	) as HTMLInputElement | null;
	fileInput?.click();
});

// ファイル選択 → アップロード実行
document.getElementById("f-upload-file")?.addEventListener("change", (e) => {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (file) void handleFileUpload(file);
	// 同じファイルを再選択してもイベントが発火するよう値をリセット
	input.value = "";
});

// コンテナ名の入力検証 → 送信ボタン活性化
document.getElementById("f-container-name")?.addEventListener("input", (e) => {
	const value = (e.target as HTMLInputElement).value.trim();
	const valid = value.length > 0 && /^[A-Za-z0-9._-]+$/.test(value);
	const submit = document.getElementById(
		"btn-create-container-submit",
	) as HTMLButtonElement | null;
	if (submit) submit.disabled = !valid;
	if (value.length > 0 && !valid) {
		showContainerError(
			"英数字・ハイフン・アンダースコア・ピリオドのみ使用できます",
		);
	} else {
		clearContainerError();
	}
});

// 確認ダイアログのキャンセル（共通）
document.getElementById("confirm-cancel")?.addEventListener("click", () => {
	document.getElementById("confirm-overlay")?.classList.remove("open");
});

// 初期化: ストレージビュー表示
switchView("storage");
