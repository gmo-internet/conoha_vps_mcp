/**
 * MCP App クライアントスクリプト
 *
 * @remarks
 * ext-apps SDK の App クラスを使用して、
 * MCP サーバーのツールを呼び出し、UI にデータを反映します。
 *
 * @packageDocumentation
 */

import { App } from "@modelcontextprotocol/ext-apps";

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

interface VolumeData {
	id: string;
	name: string;
	status: "in-use" | "available" | "creating" | "deleting";
	size_gb: number;
	volume_type: string;
	attached_to: string | null;
	attached_server_name: string | null;
	created_at: string;
}

interface ImageData {
	id: string;
	name: string;
	status: "active" | "queued" | "saving";
	os_type: "linux" | "windows";
	min_disk_gb: number;
	size_mb: number;
	created_at: string;
}

interface SecurityGroupData {
	id: string;
	name: string;
	description: string;
	rules_count: number;
	rules: Array<{
		direction: "ingress" | "egress";
		protocol: string | null;
		port_range: string | null;
		remote_ip: string;
	}>;
	created_at: string;
}

type TabId = "servers" | "volumes" | "security" | "images";

// ──────────────────────────────────────────────
// 状態
// ──────────────────────────────────────────────

let allServers: ServerData[] = [];
let currentFilter = "all";
let currentTab: TabId = "servers";
const tabLoaded: Record<TabId, boolean> = {
	servers: false,
	volumes: false,
	security: false,
	images: false,
};

// ──────────────────────────────────────────────
// MCP App 接続
// ──────────────────────────────────────────────

/** ツール結果からテキストを抽出 */
function extractText(result: {
	content?: Array<{ type: string; [k: string]: unknown }>;
}): string | null {
	const item = result.content?.find((c) => c.type === "text");
	return item && "text" in item ? (item.text as string) : null;
}

const app = new App({ name: "ConoHa VPS", version: "0.1.0" });
app.connect();

/** 初回ツール結果を受信（list_servers の応答） */
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
				tabLoaded.servers = true;
				injectServerData(data.servers);
			}
		} catch {
			showTabError("server-tbody", 6, "データの解析に失敗しました");
		}
	}
};

// ──────────────────────────────────────────────
// データ取得
// ──────────────────────────────────────────────

/** サーバー一覧を取得 */
async function fetchServers(): Promise<ServerData[] | null> {
	try {
		const args: Record<string, string> = {};
		if (currentFilter !== "all") args.status = currentFilter;
		const result = await app.callServerTool({
			name: "list_servers",
			arguments: args,
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).servers ?? null;
	} catch {
		showTabError("server-tbody", 6, "サーバー一覧の取得に失敗しました");
	}
	return null;
}

/** サーバー詳細を取得 */
async function fetchServerDetail(serverId: string): Promise<ServerData | null> {
	try {
		const result = await app.callServerTool({
			name: "get_server",
			arguments: { server_id: serverId },
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).server ?? null;
	} catch {
		showTabError("server-tbody", 6, "サーバー詳細の取得に失敗しました");
	}
	return null;
}

/** ボリューム一覧を取得 */
async function fetchVolumes(): Promise<VolumeData[] | null> {
	try {
		const result = await app.callServerTool({
			name: "list_volumes",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).volumes ?? null;
	} catch {
		showTabError("volume-tbody", 6, "ボリューム一覧の取得に失敗しました");
	}
	return null;
}

/** イメージ一覧を取得 */
async function fetchImages(): Promise<ImageData[] | null> {
	try {
		const result = await app.callServerTool({
			name: "list_images",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).images ?? null;
	} catch {
		showTabError("image-tbody", 6, "イメージ一覧の取得に失敗しました");
	}
	return null;
}

/** セキュリティグループ一覧を取得 */
async function fetchSecurityGroups(): Promise<SecurityGroupData[] | null> {
	try {
		const result = await app.callServerTool({
			name: "list_security_groups",
			arguments: {},
		});
		const text = extractText(result);
		if (text) return JSON.parse(text).security_groups ?? null;
	} catch {
		showTabError("sg-tbody", 5, "セキュリティグループの取得に失敗しました");
	}
	return null;
}

// ──────────────────────────────────────────────
// タブ切り替え
// ──────────────────────────────────────────────

const pageLabels: Record<TabId, string> = {
	servers: "server list",
	volumes: "volume list",
	security: "security groups",
	images: "image list",
};

async function switchTab(tab: TabId): Promise<void> {
	if (tab === currentTab) return;
	currentTab = tab;

	// パネル表示切替
	for (const panel of document.querySelectorAll<HTMLElement>(".tab-panel")) {
		panel.style.display = "none";
	}
	const target = document.getElementById(`tab-${tab}`);
	if (target) target.style.display = "flex";

	// ナビボタン
	for (const btn of document.querySelectorAll<HTMLElement>(".nb[data-tab]")) {
		btn.classList.toggle("on", btn.dataset.tab === tab);
	}

	// ページラベル
	setTxt("page-label", pageLabels[tab]);

	// 初回のみデータ取得
	if (!tabLoaded[tab]) {
		await loadTabData(tab);
	}

	updateTimestamp();
}

async function loadTabData(tab: TabId): Promise<void> {
	if (tab === "servers") {
		const servers = await fetchServers();
		if (servers) {
			tabLoaded.servers = true;
			injectServerData(servers);
		}
	} else if (tab === "volumes") {
		showTabLoading("volume-tbody", 6);
		const volumes = await fetchVolumes();
		if (volumes) {
			tabLoaded.volumes = true;
			renderVolumeStats(volumes);
			renderVolumeTable(volumes);
		}
	} else if (tab === "images") {
		showTabLoading("image-tbody", 6);
		const images = await fetchImages();
		if (images) {
			tabLoaded.images = true;
			renderImageStats(images);
			renderImageTable(images);
		}
	} else if (tab === "security") {
		showTabLoading("sg-tbody", 5);
		const groups = await fetchSecurityGroups();
		if (groups) {
			tabLoaded.security = true;
			renderSgStats(groups);
			renderSgTable(groups);
		}
	}
}

// ──────────────────────────────────────────────
// サーバーレンダリング
// ──────────────────────────────────────────────

function injectServerData(servers: ServerData[]): void {
	allServers = servers;
	renderServerStats(servers);
	renderServerChips(servers);
	renderServerTable(servers);
	updateTimestamp();
}

function renderServerStats(servers: ServerData[]): void {
	const counts = { running: 0, stopped: 0, building: 0 };
	for (const s of servers) {
		if (s.status in counts) counts[s.status as keyof typeof counts]++;
	}
	setTxt("st-total", String(servers.length));
	setTxt("st-running", String(counts.running));
	setTxt("st-stopped", String(counts.stopped));
	setTxt("st-building", String(counts.building));
}

function renderServerChips(servers: ServerData[]): void {
	const counts = { running: 0, stopped: 0, building: 0 };
	for (const s of servers) {
		if (s.status in counts) counts[s.status as keyof typeof counts]++;
	}
	setTxt("chip-all", `すべて (${servers.length})`);
	setTxt("chip-running", `起動中 (${counts.running})`);
	setTxt("chip-stopped", `停止中 (${counts.stopped})`);
	setTxt("chip-building", `構築中 (${counts.building})`);
}

function renderServerTable(servers: ServerData[]): void {
	const filtered =
		currentFilter === "all"
			? servers
			: servers.filter((s) => s.status === currentFilter);

	const tbody = document.getElementById("server-tbody");
	if (!tbody) return;

	if (filtered.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="6" class="loading">該当するサーバーがありません</td></tr>';
		return;
	}

	tbody.innerHTML = filtered
		.map(
			(s) => `
    <tr data-server-id="${s.id}">
      <td>
        <div class="sname">${esc(s.name)}</div>
        <div class="sid">${s.id.slice(0, 8)}-...</div>
      </td>
      <td>${statusBadge(s.status)}</td>
      <td><span class="spec"><b>${s.vcpu}</b> vCPU / <b>${s.memory_gb}</b> GB</span></td>
      <td><span class="ip-cell">${s.ipv4 ?? "—"}</span></td>
      <td><span class="rg">${esc(s.region)}</span></td>
      <td><div class="acts">${serverActions(s)}</div></td>
    </tr>
  `,
		)
		.join("");

	for (const row of tbody.querySelectorAll("tr[data-server-id]")) {
		row.addEventListener("click", () => {
			const id = (row as HTMLElement).dataset.serverId;
			if (id) void openDetail(id);
		});
	}
}

// ──────────────────────────────────────────────
// ボリュームレンダリング
// ──────────────────────────────────────────────

function renderVolumeStats(volumes: VolumeData[]): void {
	const inUse = volumes.filter((v) => v.status === "in-use").length;
	const available = volumes.filter((v) => v.status === "available").length;
	const totalSize = volumes.reduce((sum, v) => sum + v.size_gb, 0);
	setTxt("vol-total", String(volumes.length));
	setTxt("vol-inuse", String(inUse));
	setTxt("vol-available", String(available));
	setTxt("vol-size", `${totalSize} GB`);
}

function renderVolumeTable(volumes: VolumeData[]): void {
	const tbody = document.getElementById("volume-tbody");
	if (!tbody) return;

	if (volumes.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="6" class="loading">ボリュームがありません</td></tr>';
		return;
	}

	tbody.innerHTML = volumes
		.map(
			(v) => `
    <tr>
      <td>
        <div class="sname">${esc(v.name || "(名前なし)")}</div>
        <div class="sid">${v.id.slice(0, 8)}-...</div>
      </td>
      <td>${volumeBadge(v.status)}</td>
      <td><span class="spec"><b>${v.size_gb}</b> GB</span></td>
      <td><span class="ip-cell">${esc(v.volume_type || "—")}</span></td>
      <td><span class="ip-cell">${v.attached_server_name ? esc(v.attached_server_name) : v.attached_to ? `${v.attached_to.slice(0, 8)}-...` : "—"}</span></td>
      <td><span class="rg">${formatDate(v.created_at)}</span></td>
    </tr>
  `,
		)
		.join("");
}

function volumeBadge(status: string): string {
	const map: Record<string, [string, string]> = {
		"in-use": ["iu", "In-Use"],
		available: ["av", "Available"],
		creating: ["bld", "Creating"],
		deleting: ["stp", "Deleting"],
	};
	const [cls, label] = map[status] ?? ["av", status];
	return `<span class="badge ${cls}"><span class="bd"></span>${label}</span>`;
}

// ──────────────────────────────────────────────
// イメージレンダリング
// ──────────────────────────────────────────────

function renderImageStats(images: ImageData[]): void {
	const linux = images.filter((i) => i.os_type === "linux").length;
	const windows = images.filter((i) => i.os_type === "windows").length;
	const active = images.filter((i) => i.status === "active").length;
	setTxt("img-total", String(images.length));
	setTxt("img-linux", String(linux));
	setTxt("img-windows", String(windows));
	setTxt("img-active", String(active));
}

function renderImageTable(images: ImageData[]): void {
	const tbody = document.getElementById("image-tbody");
	if (!tbody) return;

	if (images.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="6" class="loading">イメージがありません</td></tr>';
		return;
	}

	tbody.innerHTML = images
		.map(
			(i) => `
    <tr>
      <td>
        <div class="sname">${esc(i.name)}</div>
        <div class="sid">${i.id.slice(0, 8)}-...</div>
      </td>
      <td>${imageBadge(i.status)}</td>
      <td><span class="badge ${i.os_type === "linux" ? "lnx" : "win"}">${i.os_type === "linux" ? "Linux" : "Windows"}</span></td>
      <td><span class="spec"><b>${i.min_disk_gb}</b> GB</span></td>
      <td><span class="spec">${i.size_mb > 0 ? `${i.size_mb} MB` : "—"}</span></td>
      <td><span class="rg">${formatDate(i.created_at)}</span></td>
    </tr>
  `,
		)
		.join("");
}

function imageBadge(status: string): string {
	const map: Record<string, [string, string]> = {
		active: ["act", "Active"],
		queued: ["que", "Queued"],
		saving: ["bld", "Saving"],
	};
	const [cls, label] = map[status] ?? ["act", status];
	return `<span class="badge ${cls}"><span class="bd"></span>${label}</span>`;
}

// ──────────────────────────────────────────────
// セキュリティグループレンダリング
// ──────────────────────────────────────────────

function renderSgStats(groups: SecurityGroupData[]): void {
	let totalRules = 0;
	let ingress = 0;
	let egress = 0;
	for (const g of groups) {
		totalRules += g.rules_count;
		for (const r of g.rules) {
			if (r.direction === "ingress") ingress++;
			else egress++;
		}
	}
	setTxt("sg-total", String(groups.length));
	setTxt("sg-rules", String(totalRules));
	setTxt("sg-ingress", String(ingress));
	setTxt("sg-egress", String(egress));
}

function renderSgTable(groups: SecurityGroupData[]): void {
	const tbody = document.getElementById("sg-tbody");
	if (!tbody) return;

	if (groups.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="5" class="loading">セキュリティグループがありません</td></tr>';
		return;
	}

	tbody.innerHTML = groups
		.map(
			(g) => `
    <tr>
      <td>
        <div class="sname">${esc(g.name)}</div>
        <div class="sid">${g.id.slice(0, 8)}-...</div>
      </td>
      <td><span class="ip-cell">${esc(g.description || "—")}</span></td>
      <td><span class="spec"><b>${g.rules_count}</b></span></td>
      <td>${renderRuleTags(g.rules)}</td>
      <td><span class="rg">${formatDate(g.created_at)}</span></td>
    </tr>
  `,
		)
		.join("");
}

function renderRuleTags(rules: SecurityGroupData["rules"]): string {
	const ingress = rules.filter((r) => r.direction === "ingress");
	const shown = ingress.slice(0, 3);
	const tags = shown
		.map((r) => {
			const proto = r.protocol ?? "any";
			const port = r.port_range ?? "*";
			return `<span class="rule-tag">${esc(proto)}:${esc(port)}</span>`;
		})
		.join("");
	const more =
		ingress.length > 3
			? `<span class="rule-tag">+${ingress.length - 3}</span>`
			: "";
	const combined = tags + more;
	return combined || '<span class="rg">—</span>';
}

// ──────────────────────────────────────────────
// 共通ヘルパー
// ──────────────────────────────────────────────

function statusBadge(status: string): string {
	const map: Record<string, [string, string]> = {
		running: ["run", "Running"],
		stopped: ["stp", "Stopped"],
		building: ["bld", "Building"],
	};
	const [cls, label] = map[status] ?? ["run", status];
	return `<span class="badge ${cls}"><span class="bd"></span>${label}</span>`;
}

function serverActions(s: ServerData): string {
	if (s.status === "running")
		return `
      <button class="ab" data-action="console" data-name="${esc(s.name)}">コンソール</button>
      <button class="ab" data-action="reboot" data-name="${esc(s.name)}">再起動</button>
      <button class="ab dg" data-action="stop" data-name="${esc(s.name)}">停止</button>
    `;
	if (s.status === "stopped")
		return `
      <button class="ab st" data-action="start" data-name="${esc(s.name)}">起動</button>
      <button class="ab" data-action="detail" data-id="${s.id}">詳細</button>
    `;
	return '<span style="font-family:var(--mono);font-size:11px;color:var(--text3)">構築中...</span>';
}

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

function formatDate(dateStr: string): string {
	if (!dateStr) return "—";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

function updateTimestamp(): void {
	const el = document.getElementById("last-updated");
	if (el)
		el.textContent = `最終更新: ${new Date().toLocaleTimeString("ja-JP")}`;
}

function showTabError(tbodyId: string, colspan: number, msg: string): void {
	const tbody = document.getElementById(tbodyId);
	if (tbody) {
		tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading" style="color:#e53e3e">${esc(msg)}</td></tr>`;
	}
}

function showTabLoading(tbodyId: string, colspan: number): void {
	const tbody = document.getElementById(tbodyId);
	if (tbody) {
		tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading">読み込み中...</td></tr>`;
	}
}

/** 認証未設定ガイドを表示 */
function showAuthGuide(data: {
	message?: string;
	required_env?: string[];
	hint?: string;
}): void {
	const tbody = document.getElementById("server-tbody");
	if (!tbody) return;

	const envList = (data.required_env ?? [])
		.map(
			(e) =>
				`<code style="background:#1a1a2e;padding:2px 6px;border-radius:3px;font-size:12px">${esc(e)}</code>`,
		)
		.join("、");

	tbody.innerHTML = `<tr><td colspan="6" style="padding:32px 24px;text-align:center">
		<div style="font-size:18px;font-weight:700;color:#00b4d8;margin-bottom:12px">認証情報の設定が必要です</div>
		<div style="color:#94a3b8;font-size:13px;line-height:1.8;max-width:480px;margin:0 auto">
			<p>${esc(data.message ?? "")}</p>
			<p style="margin-top:8px">必要な環境変数: ${envList}</p>
			<p style="margin-top:8px;color:#64748b;font-size:12px">${esc(data.hint ?? "")}</p>
		</div>
	</td></tr>`;

	setTxt("st-total", "—");
	setTxt("st-running", "—");
	setTxt("st-stopped", "—");
	setTxt("st-building", "—");
}

// ──────────────────────────────────────────────
// 詳細パネル
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
	setTxt("dp-os", s.os);
	setTxt("dp-ipv4", s.ipv4 ?? "—");
	setTxt("dp-ipv6", s.ipv6 ?? "—");
	setTxt("dp-region", `${s.region} (東京)`);
	setTxt("dp-created", s.created_at);

	const actions = document.getElementById("dp-actions");
	const warn = document.getElementById("dp-warn");
	if (actions && warn) {
		if (s.status === "stopped") {
			actions.innerHTML = `
        <button class="ob pr">▶ 起動する</button>
        <button class="ob">↺ 再構築</button>
        <button class="ob">⊞ コンソール</button>
        <button class="ob dg">✕ 削除</button>
      `;
			warn.style.display = "block";
		} else if (s.status === "running") {
			actions.innerHTML = `
        <button class="ob">↺ 再起動</button>
        <button class="ob">⊞ コンソール</button>
        <button class="ob dg">⏹ 停止</button>
        <button class="ob dg">✕ 削除</button>
      `;
			warn.style.display = "block";
		} else {
			actions.innerHTML =
				'<span style="font-family:var(--mono);font-size:11px;color:var(--text3)">構築中のため操作できません</span>';
			warn.style.display = "none";
		}
	}

	document.getElementById("detail-overlay")?.classList.add("open");
}

function closeDetail(): void {
	document.getElementById("detail-overlay")?.classList.remove("open");
}

// ──────────────────────────────────────────────
// イベントハンドラ
// ──────────────────────────────────────────────

// タブ切り替え
for (const btn of document.querySelectorAll<HTMLElement>(".nb[data-tab]")) {
	btn.addEventListener("click", () => {
		const tab = btn.dataset.tab as TabId;
		if (tab) void switchTab(tab);
	});
}

// サーバーフィルターチップ
for (const chip of document.querySelectorAll<HTMLElement>(
	".chip[data-filter]",
)) {
	chip.addEventListener("click", async () => {
		currentFilter = chip.dataset.filter ?? "all";
		for (const c of document.querySelectorAll(".chip[data-filter]")) {
			c.classList.remove("on");
		}
		chip.classList.add("on");

		const servers = await fetchServers();
		if (servers) {
			allServers = servers;
			renderServerTable(allServers);
		} else {
			renderServerTable(allServers);
		}
	});
}

// 詳細パネル
document
	.getElementById("close-detail-btn")
	?.addEventListener("click", closeDetail);

document.getElementById("detail-overlay")?.addEventListener("click", (e) => {
	if (e.target === e.currentTarget) closeDetail();
});

// テーブル内のアクションボタン委譲
document.getElementById("server-tbody")?.addEventListener("click", (e) => {
	const btn = (e.target as HTMLElement).closest("[data-action]") as HTMLElement;
	if (!btn) return;
	e.stopPropagation();
	const action = btn.dataset.action;
	const name = btn.dataset.name;
	const id = btn.dataset.id;

	if (action === "detail" && id) {
		void openDetail(id);
	} else if (name) {
		alert(`[${action}] ${name}`);
	}
});
