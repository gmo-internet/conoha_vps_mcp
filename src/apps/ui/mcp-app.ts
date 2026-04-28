/**
 * MCP App クライアントスクリプト（ミニマム構成）
 *
 * @remarks
 * ① サーバー作成（LLM非経由でセキュア）
 * ② サーバーステータス一覧（名前・ステータス・IP）+ 検索
 *
 * @packageDocumentation
 */

import { App } from "@modelcontextprotocol/ext-apps";
import { formatBytes } from "./format-bytes.js";
import {
	bootVolumeSizeGb,
	formatImageDisplay,
	isImageCompatibleWithFlavor,
	isPublicApiFlavor,
} from "./format-image.js";

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

interface ServerData {
	id: string;
	name: string;
	status: "running" | "stopped" | "building";
	vcpu: number;
	memory_gb: number;
	disk_gb: number;
	plan: string;
	os: string;
	ipv4: string | null;
	ipv6: string | null;
	region: string;
	created_at: string;
}

interface FlavorOption {
	id: string;
	name: string;
	vcpus: number;
	ram_mb: number;
	disk_gb: number;
}

interface ImageOption {
	id: string;
	name: string;
	min_ram_mb?: number;
	min_disk_gb?: number;
	os_type?: string;
	size_mb?: number;
	created_at?: string;
	dst_name?: string;
	dst_version?: string;
	app_name?: string;
	app_version?: string;
	service_type?: string;
}

interface KeypairOption {
	name: string;
}

interface SecurityGroupOption {
	id: string;
	name: string;
}

interface VolumeOption {
	id: string;
	name: string;
	status: string;
	size_gb: number;
}

type ViewMode = "list" | "create" | "storage" | "create-container";

interface ContainerData {
	name: string;
	count: number;
	bytes: number;
	last_modified?: string;
}
type CreateMode = "auto" | "manual";

// ──────────────────────────────────────────────
// 状態
// ──────────────────────────────────────────────

let allServers: ServerData[] = [];
let currentView: ViewMode = "list";
let searchQuery = "";
let allFlavors: FlavorOption[] = [];
let allImages: ImageOption[] = [];
let allKeypairs: KeypairOption[] = [];
let allSecGroups: SecurityGroupOption[] = [];
let allBootVolumes: VolumeOption[] = [];
let createMode: CreateMode = "auto";
let allContainers: ContainerData[] = [];

// ──────────────────────────────────────────────
// MCP App 接続
// ──────────────────────────────────────────────

function extractText(result: {
	content?: Array<{ type: string; [k: string]: unknown }>;
}): string | null {
	const item = result.content?.find((c) => c.type === "text");
	return item && "text" in item ? (item.text as string) : null;
}

const app = new App({ name: "ConoHa VPS", version: "0.2.0" });
app.connect();

app.ontoolresult = (result) => {
	const text = extractText(result);
	if (text) {
		try {
			const data = JSON.parse(text);
			if (data.error === "auth_required") {
				showAuthGuide(data);
				return;
			}
			if (data.servers) {
				allServers = data.servers;
				renderServerList();
				updateTimestamp();
			}
		} catch {
			showEmpty("データの解析に失敗しました");
		}
	}
};

// ──────────────────────────────────────────────
// データ取得
// ──────────────────────────────────────────────

async function fetchServers(): Promise<ServerData[] | null> {
	try {
		const result = await app.callServerTool({
			name: "list_servers",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).servers ?? null;
	} catch {
		showEmpty("サーバー一覧の取得に失敗しました");
	}
	return null;
}

async function fetchServerDetail(serverId: string): Promise<ServerData | null> {
	try {
		const result = await app.callServerTool({
			name: "get_server",
			arguments: { server_id: serverId },
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).server ?? null;
	} catch {
		/* ignore */
	}
	return null;
}

async function fetchFlavors(): Promise<FlavorOption[]> {
	try {
		const result = await app.callServerTool({
			name: "list_flavors",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).flavors ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

async function fetchImages(): Promise<ImageOption[]> {
	try {
		const result = await app.callServerTool({
			name: "list_images",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).images ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

async function fetchKeypairs(): Promise<KeypairOption[]> {
	try {
		const result = await app.callServerTool({
			name: "list_keypairs",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).keypairs ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

async function fetchSecurityGroups(): Promise<SecurityGroupOption[]> {
	try {
		const result = await app.callServerTool({
			name: "list_security_groups",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).security_groups ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

async function fetchAvailableVolumes(): Promise<VolumeOption[]> {
	try {
		const result = await app.callServerTool({
			name: "list_volumes",
			arguments: { status: "available" },
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).volumes ?? [];
	} catch {
		/* ignore */
	}
	return [];
}

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

// ──────────────────────────────────────────────
// ビュー切り替え
// ──────────────────────────────────────────────

function switchView(view: ViewMode): void {
	currentView = view;
	const listPanel = document.getElementById("panel-list");
	const createPanel = document.getElementById("panel-create");
	const storagePanel = document.getElementById("panel-storage");
	const createContainerPanel = document.getElementById(
		"panel-create-container",
	);
	const btnList = document.getElementById("btn-list");
	const btnCreate = document.getElementById("btn-create");
	const btnStorage = document.getElementById("btn-storage");
	const btnToggle = document.getElementById("btn-mode-toggle");

	if (listPanel) listPanel.style.display = view === "list" ? "flex" : "none";
	if (createPanel) createPanel.classList.toggle("open", view === "create");
	if (storagePanel)
		storagePanel.style.display = view === "storage" ? "flex" : "none";
	if (createContainerPanel)
		createContainerPanel.classList.toggle("open", view === "create-container");
	if (btnList) btnList.classList.toggle("on", view === "list");
	if (btnCreate) btnCreate.classList.toggle("on", view === "create");
	if (btnStorage)
		btnStorage.classList.toggle(
			"on",
			view === "storage" || view === "create-container",
		);
	if (btnToggle) btnToggle.classList.toggle("show", view === "create");

	const pageLabels: Record<ViewMode, string> = {
		list: "servers",
		create: "create server",
		storage: "storage",
		"create-container": "create container",
	};
	setTxt("page-label", pageLabels[view]);

	if (view === "create") {
		void loadCreateFormOptions();
	}
	if (view === "storage") {
		void loadContainers();
	}
	if (view === "create-container") {
		resetContainerForm();
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

function switchCreateMode(mode: CreateMode): void {
	createMode = mode;
	const groupImage = document.getElementById("group-image");
	const groupVolume = document.getElementById("group-volume");
	const btnToggle = document.getElementById("btn-mode-toggle");

	if (groupImage) groupImage.style.display = mode === "auto" ? "flex" : "none";
	if (groupVolume)
		groupVolume.style.display = mode === "manual" ? "flex" : "none";
	if (btnToggle) {
		btnToggle.textContent =
			mode === "auto" ? "ボリューム手動作成 →" : "ボリューム自動作成 →";
	}

	if (mode === "manual" && allBootVolumes.length === 0) {
		void loadAvailableVolumes();
	}
	updateSubmitState();
}

async function loadAvailableVolumes(): Promise<void> {
	const volumes = await fetchAvailableVolumes();
	allBootVolumes = volumes;
	ddVolume.setItems(
		volumes.map((v) => ({
			value: v.id,
			label: `${v.name} (${v.size_gb}GB)`,
		})),
	);
}

// ──────────────────────────────────────────────
// サーバー一覧レンダリング
// ──────────────────────────────────────────────

function renderServerList(): void {
	const container = document.getElementById("server-list");
	if (!container) return;

	const query = searchQuery.toLowerCase();
	const filtered = query
		? allServers.filter(
				(s) =>
					s.name.toLowerCase().includes(query) ||
					(s.ipv4 ?? "").includes(query) ||
					s.id.toLowerCase().includes(query),
			)
		: allServers;

	// 検索カウント更新
	const countEl = document.getElementById("search-count");
	if (countEl) {
		countEl.textContent = query
			? `${filtered.length} / ${allServers.length}`
			: `${allServers.length} 台`;
	}

	if (filtered.length === 0) {
		container.innerHTML = `<div class="empty">${query ? "検索結果がありません" : "サーバーがありません"}</div>`;
		return;
	}

	container.innerHTML = filtered
		.map(
			(s) => `
		<div class="server-item" data-server-id="${s.id}">
			<div>
				<div class="server-name">${esc(s.name)}</div>
				<div class="server-id">${s.id.slice(0, 8)}-...</div>
			</div>
			<div>${statusBadge(s.status)}</div>
			<div class="server-ip">${s.ipv4 ?? "—"}</div>
		</div>
	`,
		)
		.join("");

	// 行クリック → 詳細
	for (const item of container.querySelectorAll<HTMLElement>(".server-item")) {
		item.addEventListener("click", () => {
			const id = item.dataset.serverId;
			if (id) void openDetail(id);
		});
	}
}

function statusBadge(status: string): string {
	const map: Record<string, [string, string]> = {
		running: ["run", "Running"],
		stopped: ["stp", "Stopped"],
		building: ["bld", "Building"],
	};
	const [cls, label] = map[status] ?? ["run", esc(status)];
	return `<span class="badge ${cls}">${label}</span>`;
}

function showEmpty(msg: string): void {
	const container = document.getElementById("server-list");
	if (container) {
		container.innerHTML = `<div class="empty">${esc(msg)}</div>`;
	}
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
}

async function confirmDeleteContainer(name: string): Promise<void> {
	// 既存の confirm-overlay を再利用。executeCreateServer も同じボタンを聞いているが、
	// あちらは currentView==="create" でガードしているため誤発火しない
	setTxt("confirm-title", "コンテナを削除しますか？");
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

	// AbortController でキャンセル/OKどちらでも全リスナーを確実に解除する
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
// サーバー詳細
// ──────────────────────────────────────────────

async function openDetail(id: string): Promise<void> {
	const s =
		allServers.find((x) => x.id === id) ?? (await fetchServerDetail(id));
	if (!s) return;

	setTxt("dp-name", s.name);
	const badgeEl = document.getElementById("dp-badge");
	if (badgeEl) badgeEl.innerHTML = statusBadge(s.status);
	setTxt("dp-id", s.id);
	setTxt("dp-vcpu", `${s.vcpu} Core`);
	setTxt("dp-mem", `${s.memory_gb} GB`);
	setTxt("dp-disk", `${s.disk_gb} GB SSD`);
	setTxt("dp-plan", s.plan);
	setTxt("dp-ipv4", s.ipv4 ?? "—");
	setTxt("dp-ipv6", s.ipv6 ?? "—");
	setTxt("dp-region", `${s.region} (東京)`);
	setTxt("dp-created", s.created_at);

	const actions = document.getElementById("dp-actions");
	if (actions) {
		if (s.status === "running") {
			actions.innerHTML = `
				<button class="dp-action" data-act="reboot" data-sid="${s.id}" data-sname="${esc(s.name)}">↺ 再起動</button>
				<button class="dp-action danger" data-act="stop" data-sid="${s.id}" data-sname="${esc(s.name)}">⏹ 停止</button>
			`;
		} else if (s.status === "stopped") {
			actions.innerHTML = `
				<button class="dp-action primary" data-act="start" data-sid="${s.id}" data-sname="${esc(s.name)}">▶ 起動</button>
			`;
		} else {
			actions.innerHTML =
				'<span style="font-family:var(--mono);font-size:11px;color:var(--text3)">構築中のため操作できません</span>';
		}
	}

	document.getElementById("detail-overlay")?.classList.add("open");
}

function closeDetail(): void {
	document.getElementById("detail-overlay")?.classList.remove("open");
}

// ──────────────────────────────────────────────
// サーバー作成フォーム
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// 検索可能カスタムドロップダウン
// ──────────────────────────────────────────────

interface DdItem {
	value: string;
	label: string;
	/** 副次表示（例: API名）。あれば label 直下に小さく表示する */
	sublabel?: string;
	/** ホバー時のツールチップ（複数行はそのまま title 属性に入る） */
	title?: string;
}

interface DdHandle {
	setItems(items: DdItem[]): void;
	setValue(value: string): void;
	getValue(): string;
	reset(): void;
}

function initDropdown(
	rootId: string,
	hiddenId: string,
	placeholder: string,
): DdHandle {
	const root = document.getElementById(rootId);
	const hidden = document.getElementById(hiddenId) as HTMLInputElement | null;
	if (!root || !hidden) {
		return {
			setItems: () => {},
			setValue: () => {},
			getValue: () => "",
			reset: () => {},
		};
	}
	const trigger = root.querySelector(".dd-trigger") as HTMLButtonElement;
	const labelEl = root.querySelector(".dd-label") as HTMLElement;
	const searchInput = root.querySelector(".dd-search") as HTMLInputElement;
	const list = root.querySelector(".dd-list") as HTMLElement;

	let items: DdItem[] = [];
	let selected = "";
	let isOpen = false;

	function renderList(query: string): void {
		const q = query.toLowerCase();
		const filtered = items.filter((i) => i.label.toLowerCase().includes(q));
		if (filtered.length === 0) {
			list.innerHTML = '<div class="dd-empty">該当する項目がありません</div>';
			return;
		}
		list.innerHTML = filtered
			.map((i) => {
				const sel = i.value === selected ? " selected" : "";
				const ariaSel = i.value === selected ? "true" : "false";
				const titleAttr = i.title ? ` title="${esc(i.title)}"` : "";
				const sub = i.sublabel
					? `<span class="dd-item-sub">${esc(i.sublabel)}</span>`
					: "";
				return `<div class="dd-item${sel}" role="option" data-value="${esc(i.value)}" aria-selected="${ariaSel}"${titleAttr}><span class="dd-item-label">${esc(i.label)}</span>${sub}</div>`;
			})
			.join("");
		for (const el of Array.from(
			list.querySelectorAll<HTMLElement>(".dd-item"),
		)) {
			el.addEventListener("click", () => {
				setValue(el.dataset.value ?? "");
				close();
			});
		}
	}

	function setValue(value: string): void {
		selected = value;
		const item = items.find((i) => i.value === value);
		if (item) {
			labelEl.textContent = item.label;
			labelEl.classList.remove("placeholder");
		} else {
			labelEl.textContent = placeholder;
			labelEl.classList.add("placeholder");
		}
		hidden.value = value;
		hidden.dispatchEvent(new Event("change", { bubbles: true }));
	}

	function setItems(newItems: DdItem[]): void {
		items = newItems;
		if (selected && !items.some((i) => i.value === selected)) {
			setValue("");
		} else if (selected) {
			// ラベル更新のみ
			const item = items.find((i) => i.value === selected);
			if (item) labelEl.textContent = item.label;
		}
		if (isOpen) renderList(searchInput.value);
	}

	function open(): void {
		// 他のドロップダウンを閉じる
		document.dispatchEvent(new CustomEvent("dd:open", { detail: { rootId } }));
		isOpen = true;
		root?.classList.add("open");
		trigger.setAttribute("aria-expanded", "true");
		searchInput.value = "";
		renderList("");
		setTimeout(() => searchInput.focus(), 0);
	}

	function close(): void {
		isOpen = false;
		root?.classList.remove("open");
		trigger.setAttribute("aria-expanded", "false");
	}

	trigger.addEventListener("click", (e) => {
		e.stopPropagation();
		if (isOpen) close();
		else open();
	});
	searchInput.addEventListener("input", (e) => {
		renderList((e.target as HTMLInputElement).value);
	});
	searchInput.addEventListener("click", (e) => e.stopPropagation());
	searchInput.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			close();
			trigger.focus();
		}
	});
	document.addEventListener("click", (e) => {
		if (isOpen && !root.contains(e.target as Node)) close();
	});
	// 他ドロップダウンが開いたら自分を閉じる
	document.addEventListener("dd:open", (e) => {
		const detail = (e as CustomEvent<{ rootId: string }>).detail;
		if (isOpen && detail?.rootId !== rootId) close();
	});

	return {
		setItems,
		setValue,
		getValue: () => selected,
		reset: () => setValue(""),
	};
}

function flavorLabel(f: FlavorOption): string {
	return `${f.name} (${f.vcpus}vCPU / ${Math.round(f.ram_mb / 1024)}GB)`;
}

const ddFlavor = initDropdown("dd-flavor", "f-flavor", "プランを選択");
const ddImage = initDropdown("dd-image", "f-image", "イメージを選択");
const ddVolume = initDropdown(
	"dd-volume",
	"f-volume",
	"ブートボリュームを選択",
);
const ddSshKey = initDropdown("dd-sshkey", "f-sshkey", "使用しない");
const ddSecGroup = initDropdown("dd-secgroup", "f-secgroup", "デフォルト");

// イメージ情報を DdItem 形式に整形（主表示・副次表示・ツールチップ）
function imageToDdItem(i: ImageOption): DdItem {
	const { primary, secondary, tooltip } = formatImageDisplay(i);
	return { value: i.id, label: primary, sublabel: secondary, title: tooltip };
}

// 選択中プランと互換性のあるイメージのみをドロップダウンに反映
function applyImageFilter(): void {
	const flavorId =
		(document.getElementById("f-flavor") as HTMLInputElement | null)?.value ??
		"";
	const flavor = allFlavors.find((f) => f.id === flavorId);
	const compat = allImages.filter((i) => {
		if (!flavor) return true;
		return isImageCompatibleWithFlavor(i, flavor);
	});
	ddImage.setItems(compat.map(imageToDdItem));
}

// 選択中イメージと互換性のあるプランのみをドロップダウンに反映
// allFlavors は loadCreateFormOptions で公開API互換のみに事前フィルタ済み
function applyFlavorFilter(): void {
	const imageId =
		(document.getElementById("f-image") as HTMLInputElement | null)?.value ??
		"";
	const image = allImages.find((i) => i.id === imageId);
	const compat = allFlavors.filter((f) => {
		if (!image) return true;
		return isImageCompatibleWithFlavor(image, f);
	});
	ddFlavor.setItems(
		compat.map((f) => ({ value: f.id, label: flavorLabel(f) })),
	);
}

async function loadCreateFormOptions(): Promise<void> {
	const [flavors, images, keypairs, secGroups] = await Promise.all([
		fetchFlavors(),
		fetchImages(),
		fetchKeypairs(),
		fetchSecurityGroups(),
	]);
	// 公開API経由で作成可能なプランのみ保持（DBaaS / 長期 / kusanagi を除外）
	allFlavors = flavors.filter((f) => isPublicApiFlavor(f.name));
	allImages = images;
	allKeypairs = keypairs;
	allSecGroups = secGroups;
	ddFlavor.setItems(
		allFlavors.map((f) => ({ value: f.id, label: flavorLabel(f) })),
	);
	applyImageFilter();
	ddSshKey.setItems(keypairs.map((k) => ({ value: k.name, label: k.name })));
	ddSecGroup.setItems(
		secGroups.map((sg) => ({ value: sg.name, label: sg.name })),
	);
}

function validatePassword(pw: string): {
	valid: boolean;
	strength: number;
	message: string;
} {
	if (pw.length === 0) return { valid: false, strength: 0, message: "" };
	const hasUpper = /[A-Z]/.test(pw);
	const hasLower = /[a-z]/.test(pw);
	const hasDigit = /[0-9]/.test(pw);
	const hasSymbol = /[^A-Za-z0-9]/.test(pw);
	const classCount =
		Number(hasUpper) + Number(hasLower) + Number(hasDigit) + Number(hasSymbol);
	const longEnough = pw.length >= 9;

	// 要件を満たさない場合の理由を先に返す（"強い" 誤表示の防止）
	if (!longEnough) {
		return {
			valid: false,
			strength: classCount,
			message: `9文字以上必要（現在 ${pw.length} 文字）`,
		};
	}
	const missing: string[] = [];
	if (!hasUpper) missing.push("大文字");
	if (!hasLower) missing.push("小文字");
	if (!hasDigit) missing.push("数字");
	if (!hasSymbol) missing.push("記号");
	if (missing.length > 0) {
		return {
			valid: false,
			strength: classCount,
			message: `${missing.join("・")} が不足`,
		};
	}
	const strength = 1 + classCount; // 長さ +1 + 4種 = 5
	const labels = ["", "弱い", "弱い", "普通", "強い", "非常に強い"];
	return {
		valid: true,
		strength,
		message: labels[strength] ?? "",
	};
}

function updatePasswordUI(): void {
	const pw =
		(document.getElementById("f-password") as HTMLInputElement)?.value ?? "";
	const { valid, strength, message } = validatePassword(pw);

	for (let i = 1; i <= 4; i++) {
		const bar = document.getElementById(`pw-bar-${i}`);
		if (bar) {
			bar.className = "pw-bar";
			if (i <= strength) {
				// 要件未達は赤（弱い）で表示、満たしたら強度に応じた色
				if (!valid) bar.classList.add("weak");
				else if (strength <= 3) bar.classList.add("medium");
				else bar.classList.add("strong");
			}
		}
	}
	const textEl = document.getElementById("pw-text");
	if (textEl) {
		textEl.textContent = message;
		textEl.style.color = valid
			? "var(--text3)"
			: pw.length === 0
				? "var(--text3)"
				: "var(--red)";
	}
	updateSubmitState();
}

function updateSubmitState(): void {
	const name =
		(document.getElementById("f-name") as HTMLInputElement)?.value ?? "";
	const pw =
		(document.getElementById("f-password") as HTMLInputElement)?.value ?? "";
	const flavor =
		(document.getElementById("f-flavor") as HTMLSelectElement)?.value ?? "";
	const image =
		(document.getElementById("f-image") as HTMLSelectElement)?.value ?? "";
	const volume =
		(document.getElementById("f-volume") as HTMLSelectElement)?.value ?? "";
	const { valid: pwValid } = validatePassword(pw);

	const sourceOk = createMode === "auto" ? !!image : !!volume;
	const btn = document.getElementById(
		"btn-create-submit",
	) as HTMLButtonElement | null;
	if (btn) {
		btn.disabled = !(name.trim() && pwValid && flavor && sourceOk);
	}
}

function showConfirmCreate(): void {
	const name =
		(document.getElementById("f-name") as HTMLInputElement)?.value ?? "";
	const flavorId =
		(document.getElementById("f-flavor") as HTMLSelectElement)?.value ?? "";
	const imageId =
		(document.getElementById("f-image") as HTMLSelectElement)?.value ?? "";
	const volumeId =
		(document.getElementById("f-volume") as HTMLSelectElement)?.value ?? "";
	const sshKey =
		(document.getElementById("f-sshkey") as HTMLSelectElement)?.value ?? "";
	const secGroup =
		(document.getElementById("f-secgroup") as HTMLSelectElement)?.value ?? "";

	const flavor = allFlavors.find((f) => f.id === flavorId);
	const flavorText = flavor ? flavorLabel(flavor) : flavorId;

	let sourceRow: string;
	if (createMode === "auto") {
		const image = allImages.find((i) => i.id === imageId);
		const imageText = image ? image.name : imageId;
		const sizeGb = flavor ? bootVolumeSizeGb(flavor.ram_mb) : 100;
		sourceRow = `イメージ: <code>${esc(imageText)}</code><br>ディスク: <code>${sizeGb}GB（新規ブートボリュームを自動作成）</code>`;
	} else {
		const vol = allBootVolumes.find((v) => v.id === volumeId);
		const volText = vol ? `${vol.name} (${vol.size_gb}GB)` : volumeId;
		sourceRow = `ブートボリューム: <code>${esc(volText)}</code>（既存・手動指定）`;
	}

	setTxt("confirm-title", "サーバーを作成しますか？");
	const body = document.getElementById("confirm-body");
	if (body) {
		body.innerHTML = `
			サーバー名: <code>${esc(name)}</code><br>
			プラン: <code>${esc(flavorText)}</code><br>
			${sourceRow}<br>
			SSHキー: <code>${esc(sshKey || "（未使用）")}</code><br>
			セキュリティグループ: <code>${esc(secGroup || "デフォルト")}</code>
		`;
	}
	document.getElementById("confirm-overlay")?.classList.add("open");
}

async function executeCreateServer(): Promise<void> {
	// confirm-ok ボタンは複数フローで共有されているため、サーバー作成画面以外で
	// 押された confirm はサーバー作成として処理しない
	if (currentView !== "create") {
		document.getElementById("confirm-overlay")?.classList.remove("open");
		return;
	}
	document.getElementById("confirm-overlay")?.classList.remove("open");

	const name =
		(document.getElementById("f-name") as HTMLInputElement)?.value ?? "";
	const password =
		(document.getElementById("f-password") as HTMLInputElement)?.value ?? "";
	const flavorId =
		(document.getElementById("f-flavor") as HTMLSelectElement)?.value ?? "";
	const imageId =
		(document.getElementById("f-image") as HTMLSelectElement)?.value ?? "";
	const sshKey =
		(document.getElementById("f-sshkey") as HTMLSelectElement)?.value ?? "";
	const secGroup =
		(document.getElementById("f-secgroup") as HTMLSelectElement)?.value ?? "";

	const volumeId =
		(document.getElementById("f-volume") as HTMLSelectElement)?.value ?? "";

	const args: Record<string, string | number> = {
		name,
		password,
		flavor_id: flavorId,
	};
	if (createMode === "auto") {
		args.image_id = imageId;
		// ConoHa制約: 512MBプランは30GB、その他は100GB必須
		const flavor = allFlavors.find((f) => f.id === flavorId);
		args.boot_volume_size_gb = flavor ? bootVolumeSizeGb(flavor.ram_mb) : 100;
	} else {
		args.boot_volume_id = volumeId;
	}
	if (sshKey) args.ssh_key_name = sshKey;
	if (secGroup) args.security_group_name = secGroup;

	try {
		const result = await app.callServerTool({
			name: "create_server",
			arguments: args,
		});
		const text = extractText(result);
		if (text) {
			const data = JSON.parse(text);
			if (data.error) {
				const msg = data.detail
					? `${data.error}: ${String(data.detail).slice(0, 300)}`
					: data.error;
				showToast(msg, "error");
				console.error("create_server error", data);
			} else {
				// 自動モードで新規ボリュームが作成された場合はその情報も通知
				if (createMode === "auto" && data.boot_volume_created) {
					const volShort = String(data.boot_volume_id ?? "").slice(0, 8);
					showToast(
						`サーバーを作成しました（ブートボリューム ${volShort}… も自動作成）`,
						"success",
					);
				} else {
					showToast("サーバーを作成しました", "success");
				}
				resetCreateForm();
				switchView("list");
				const servers = await fetchServers();
				if (servers) {
					allServers = servers;
					renderServerList();
					updateTimestamp();
				}
			}
		}
	} catch (e) {
		console.error(e);
		showToast("サーバー作成に失敗しました", "error");
	}
}

function resetCreateForm(): void {
	const fields = ["f-name", "f-password"] as const;
	for (const id of fields) {
		const el = document.getElementById(id) as HTMLInputElement | null;
		if (el) el.value = "";
	}
	ddFlavor.reset();
	ddImage.reset();
	ddVolume.reset();
	ddSshKey.reset();
	ddSecGroup.reset();
	updatePasswordUI();
}

// ──────────────────────────────────────────────
// トースト通知
// ──────────────────────────────────────────────

function showToast(msg: string, type: "success" | "error"): void {
	const toast = document.getElementById("toast");
	if (!toast) return;
	toast.textContent = msg;
	toast.className = `toast show ${type}`;
	setTimeout(() => {
		toast.classList.remove("show");
	}, 3000);
}

// ──────────────────────────────────────────────
// 認証ガイド
// ──────────────────────────────────────────────

function showAuthGuide(data: {
	message?: string;
	required_env?: string[];
	hint?: string;
}): void {
	const container = document.getElementById("server-list");
	if (!container) return;

	const envList = (data.required_env ?? [])
		.map(
			(e) =>
				`<code style="background:var(--bg2);padding:2px 6px;border-radius:3px;font-size:12px">${esc(e)}</code>`,
		)
		.join("、");

	container.innerHTML = `<div style="padding:32px 24px;text-align:center">
		<div style="font-size:16px;font-weight:700;color:var(--cyan);margin-bottom:12px">認証情報の設定が必要です</div>
		<div style="color:var(--text2);font-size:13px;line-height:1.8;max-width:480px;margin:0 auto">
			<p>${esc(data.message ?? "")}</p>
			<p style="margin-top:8px">必要な環境変数: ${envList}</p>
			<p style="margin-top:8px;color:var(--text3);font-size:12px">${esc(data.hint ?? "")}</p>
		</div>
	</div>`;
}

// ──────────────────────────────────────────────
// 共通ヘルパー
// ──────────────────────────────────────────────

function esc(s: string): string {
	return String(s)
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
	const el = document.getElementById("last-updated");
	if (el)
		el.textContent = `最終更新: ${new Date().toLocaleTimeString("ja-JP")}`;
}

// ──────────────────────────────────────────────
// イベントハンドラ
// ──────────────────────────────────────────────

// ナビゲーション
document.getElementById("btn-list")?.addEventListener("click", () => {
	switchView("list");
});
document.getElementById("btn-create")?.addEventListener("click", () => {
	switchView("create");
});
document.getElementById("btn-storage")?.addEventListener("click", () => {
	switchView("storage");
});

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

// 検索
document.getElementById("search-input")?.addEventListener("input", (e) => {
	searchQuery = (e.target as HTMLInputElement).value;
	renderServerList();
});

// パスワード入力
document.getElementById("f-password")?.addEventListener("input", () => {
	updatePasswordUI();
});

// フォーム入力 → ボタン有効化チェック
for (const id of ["f-name", "f-flavor", "f-image"]) {
	document.getElementById(id)?.addEventListener("input", updateSubmitState);
	document.getElementById(id)?.addEventListener("change", updateSubmitState);
}

// カスタムドロップダウンの値変更 → 送信ボタン有効化チェック
for (const id of ["f-flavor", "f-image", "f-volume"]) {
	document.getElementById(id)?.addEventListener("change", updateSubmitState);
}

// モード切替ボタン: auto ⇄ manual
document.getElementById("btn-mode-toggle")?.addEventListener("click", () => {
	switchCreateMode(createMode === "auto" ? "manual" : "auto");
});

// プラン変更時にイメージ一覧を絞り込む
document.getElementById("f-flavor")?.addEventListener("change", () => {
	applyImageFilter();
});

// イメージ変更時にプラン一覧をOSで絞り込む（Linuxイメージ→g2l-*、Windows→g2w-*）
document.getElementById("f-image")?.addEventListener("change", () => {
	applyFlavorFilter();
});

// 作成ボタン → 確認ダイアログ
document.getElementById("btn-create-submit")?.addEventListener("click", () => {
	showConfirmCreate();
});

// 確認ダイアログ
document.getElementById("confirm-ok")?.addEventListener("click", () => {
	void executeCreateServer();
});
document.getElementById("confirm-cancel")?.addEventListener("click", () => {
	document.getElementById("confirm-overlay")?.classList.remove("open");
});
document.getElementById("confirm-overlay")?.addEventListener("click", (e) => {
	if (e.target === e.currentTarget) {
		document.getElementById("confirm-overlay")?.classList.remove("open");
	}
});

// キャンセルボタン
document.getElementById("btn-create-cancel")?.addEventListener("click", () => {
	resetCreateForm();
	switchView("list");
});

// 詳細パネル
document.getElementById("close-detail")?.addEventListener("click", closeDetail);
document.getElementById("detail-overlay")?.addEventListener("click", (e) => {
	if (e.target === e.currentTarget) closeDetail();
});

// 詳細パネル内アクションボタン
document.getElementById("dp-actions")?.addEventListener("click", (e) => {
	const btn = (e.target as HTMLElement).closest("[data-act]") as HTMLElement;
	if (!btn) return;
	const action = btn.dataset.act;
	const serverId = btn.dataset.sid;
	const serverName = btn.dataset.sname;
	if (action && serverId && serverName) {
		showToast(`[${action}] ${serverName} — 未実装`, "error");
	}
});
