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

let allServers: ServerData[] = [];
let currentFilter = "all";

/** ツール結果からテキストを抽出 */
function extractText(result: {
	content?: Array<{ type: string; [k: string]: unknown }>;
}): string | null {
	const item = result.content?.find((c) => c.type === "text");
	return item && "text" in item ? (item.text as string) : null;
}

// ──────────────────────────────────────────────
// MCP App 接続
// ──────────────────────────────────────────────

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
				injectData(data.servers);
			}
		} catch {
			showError("データの解析に失敗しました");
		}
	}
};

/** サーバー詳細をMCPツール経由で取得 */
async function fetchServerDetail(serverId: string): Promise<ServerData | null> {
	try {
		const result = await app.callServerTool({
			name: "get_server",
			arguments: { server_id: serverId },
		});
		const text = extractText(result);
		if (text) {
			const data = JSON.parse(text);
			return data.server ?? null;
		}
	} catch {
		showError("サーバー詳細の取得に失敗しました");
	}
	return null;
}

/** サーバー一覧を再取得 */
async function refreshServers(
	statusFilter?: string,
): Promise<ServerData[] | null> {
	try {
		const args: Record<string, string> = {};
		if (statusFilter && statusFilter !== "all") {
			args.status = statusFilter;
		}
		const result = await app.callServerTool({
			name: "list_servers",
			arguments: args,
		});
		const text = extractText(result);
		if (text) {
			const data = JSON.parse(text);
			return data.servers ?? null;
		}
	} catch {
		showError("サーバー一覧の取得に失敗しました");
	}
	return null;
}

// ──────────────────────────────────────────────
// レンダリング
// ──────────────────────────────────────────────

function injectData(servers: ServerData[]): void {
	allServers = servers;
	renderStats(servers);
	renderChips(servers);
	renderTable(servers);
	const el = document.getElementById("last-updated");
	if (el)
		el.textContent = `最終更新: ${new Date().toLocaleTimeString("ja-JP")}`;
}

function renderStats(servers: ServerData[]): void {
	const counts = { running: 0, stopped: 0, building: 0 };
	for (const s of servers) {
		if (s.status in counts) counts[s.status as keyof typeof counts]++;
	}
	setTxt("st-total", String(servers.length));
	setTxt("st-running", String(counts.running));
	setTxt("st-stopped", String(counts.stopped));
	setTxt("st-building", String(counts.building));
}

function renderChips(servers: ServerData[]): void {
	const counts = { running: 0, stopped: 0, building: 0 };
	for (const s of servers) {
		if (s.status in counts) counts[s.status as keyof typeof counts]++;
	}
	setTxt("chip-all", `すべて (${servers.length})`);
	setTxt("chip-running", `起動中 (${counts.running})`);
	setTxt("chip-stopped", `停止中 (${counts.stopped})`);
	setTxt("chip-building", `構築中 (${counts.building})`);
}

function renderTable(servers: ServerData[]): void {
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
      <td>${badgeHTML(s.status)}</td>
      <td><span class="spec"><b>${s.vcpu}</b> vCPU / <b>${s.memory_gb}</b> GB</span></td>
      <td><span class="ip-cell">${s.ipv4 ?? "—"}</span></td>
      <td><span class="rg">${esc(s.region)}</span></td>
      <td><div class="acts">${actionButtons(s)}</div></td>
    </tr>
  `,
		)
		.join("");

	// 行クリックで詳細表示
	for (const row of tbody.querySelectorAll("tr[data-server-id]")) {
		row.addEventListener("click", () => {
			const id = (row as HTMLElement).dataset.serverId;
			if (id) openDetail(id);
		});
	}
}

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────

function badgeHTML(status: string): string {
	const map: Record<string, [string, string]> = {
		running: ["run", "Running"],
		stopped: ["stp", "Stopped"],
		building: ["bld", "Building"],
	};
	const [cls, label] = map[status] ?? ["run", status];
	return `<span class="badge ${cls}"><span class="bd"></span>${label}</span>`;
}

function actionButtons(s: ServerData): string {
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

function showError(msg: string): void {
	const tbody = document.getElementById("server-tbody");
	if (tbody) {
		tbody.innerHTML = `<tr><td colspan="6" class="loading" style="color:#e53e3e">${esc(msg)}</td></tr>`;
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
		.map((e) => `<code style="background:#1a1a2e;padding:2px 6px;border-radius:3px;font-size:12px">${esc(e)}</code>`)
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
	if (badgeEl) badgeEl.innerHTML = badgeHTML(s.status);
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

document
	.getElementById("close-detail-btn")
	?.addEventListener("click", closeDetail);

document.getElementById("detail-overlay")?.addEventListener("click", (e) => {
	if (e.target === e.currentTarget) closeDetail();
});

for (const chip of document.querySelectorAll<HTMLElement>(
	".chip[data-filter]",
)) {
	chip.addEventListener("click", async () => {
		currentFilter = chip.dataset.filter ?? "all";
		for (const c of document.querySelectorAll(".chip[data-filter]")) {
			c.classList.remove("on");
		}
		chip.classList.add("on");

		const servers = await refreshServers();
		if (servers) {
			allServers = servers;
			renderTable(allServers);
		} else {
			renderTable(allServers);
		}
	});
}

// テーブル内のアクションボタン委譲
document.getElementById("server-tbody")?.addEventListener("click", (e) => {
	const btn = (e.target as HTMLElement).closest("[data-action]") as HTMLElement;
	if (!btn) return;
	e.stopPropagation();
	const action = btn.dataset.action;
	const name = btn.dataset.name;
	const id = btn.dataset.id;

	if (action === "detail" && id) {
		openDetail(id);
	} else if (name) {
		alert(`[${action}] ${name}`);
	}
});
