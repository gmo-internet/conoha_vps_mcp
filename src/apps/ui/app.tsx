/**
 * MCP App ルートコンポーネント
 *
 * デザイナー版 app.jsx をベースに、サンプルデータを実 API（mcp-bridge）に差し替えた版。
 * - コンテナ一覧／詳細／作成の 3 ビュー
 * - 公開状態の楽観更新 + サーバー反映
 * - 削除は ConfirmModal 経由
 * - 1.8 秒で消えるトースト
 */

import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ConfirmModal } from "./components/confirm-modal.js";
import type { ContainerCardItem } from "./components/container-card.js";
import { ContainerCard } from "./components/container-card.js";
import { CreateContainer } from "./components/create-container.js";
import {
	IconLayoutGrid,
	IconLayoutRow,
	IconPlusCircle,
} from "./components/icon.js";
import type { ObjectListItem } from "./components/object-list.js";
import { ObjectList } from "./components/object-list.js";
import { TopBar } from "./components/top-bar.js";
import {
	createContainer,
	deleteContainer,
	deleteObject,
	disableWebPublish,
	enableWebPublish,
	fetchContainerPublicState,
	fetchContainers,
	fetchObjects,
	fileToBase64,
	uploadObject,
} from "./mcp-bridge.js";

type ViewState =
	| { name: "list" }
	| { name: "detail"; container: string }
	| { name: "create" };

interface ConfirmState {
	title: string;
	body: ReactNode;
	note?: string;
	confirmLabel: string;
	onConfirm: () => void;
}

type LayoutMode = "grid" | "row";

/** クライアント側でアップロードを受け付ける最大バイト数（MCP メッセージ制約） */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function App() {
	const [containers, setContainers] = useState<ContainerCardItem[]>([]);
	const [objects, setObjects] = useState<ObjectListItem[]>([]);
	const [view, setView] = useState<ViewState>({ name: "list" });
	const [confirm, setConfirm] = useState<ConfirmState | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const [layout, setLayout] = useState<LayoutMode>("grid");
	const [loadingContainers, setLoadingContainers] = useState(false);
	const [submittingCreate, setSubmittingCreate] = useState(false);
	const [uploadingName, setUploadingName] = useState<string | null>(null);
	const [togglingName, setTogglingName] = useState<string | null>(null);

	const toastTimerRef = useRef<number | null>(null);

	// ─── トースト ─────────────────────────────────────────────
	const flash = useCallback((msg: string) => {
		setToast(msg);
		if (toastTimerRef.current !== null) {
			window.clearTimeout(toastTimerRef.current);
		}
		toastTimerRef.current = window.setTimeout(() => {
			setToast(null);
			toastTimerRef.current = null;
		}, 1800);
	}, []);

	useEffect(() => {
		return () => {
			if (toastTimerRef.current !== null) {
				window.clearTimeout(toastTimerRef.current);
			}
		};
	}, []);

	// ─── ダークモードの自動検出 ──────────────────────────────
	useEffect(() => {
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const apply = (matches: boolean) => {
			document.documentElement.setAttribute(
				"data-theme",
				matches ? "dark" : "light",
			);
		};
		apply(mql.matches);
		const onChange = (e: MediaQueryListEvent) => apply(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	// ─── コンテナ一覧ロード ─────────────────────────────────
	const reloadContainers = useCallback(async () => {
		setLoadingContainers(true);
		try {
			const list = await fetchContainers();
			// 公開状態を並列取得して合成
			const states = await Promise.all(
				list.map((c) => fetchContainerPublicState(c.name)),
			);
			const merged: ContainerCardItem[] = list.map((c, i) => ({
				name: c.name,
				count: c.count,
				bytes: c.bytes,
				isPublic: states[i].isPublic,
				...(states[i].publicUrl && { publicUrl: states[i].publicUrl }),
			}));
			setContainers(merged);
		} finally {
			setLoadingContainers(false);
		}
	}, []);

	useEffect(() => {
		void reloadContainers();
	}, [reloadContainers]);

	// ─── オブジェクト一覧ロード ─────────────────────────────
	const reloadObjects = useCallback(async (name: string) => {
		const list = await fetchObjects(name);
		setObjects(list);
	}, []);

	// ─── アクション群 ─────────────────────────────────────────
	const openContainer = (name: string) => {
		setView({ name: "detail", container: name });
		void reloadObjects(name);
	};

	const backToList = () => {
		setView({ name: "list" });
		setObjects([]);
		void reloadContainers();
	};

	const togglePublic = async (name: string, next: boolean) => {
		setTogglingName(name);
		// 楽観更新
		setContainers((cs) =>
			cs.map((c) =>
				c.name === name
					? next
						? { ...c, isPublic: true }
						: { ...c, isPublic: false, publicUrl: undefined }
					: c,
			),
		);
		const r = next
			? await enableWebPublish(name)
			: await disableWebPublish(name);
		if (!r.ok) {
			// 失敗時はロールバック
			flash(r.error);
			await reloadContainers();
		} else {
			if (next && r.publicUrl) {
				setContainers((cs) =>
					cs.map((c) =>
						c.name === name ? { ...c, publicUrl: r.publicUrl } : c,
					),
				);
				flash(`${name} を公開しました`);
			} else {
				flash(`${name} を${next ? "公開" : "非公開化"}しました`);
			}
		}
		setTogglingName(null);
	};

	const copyUrl = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url);
			flash("URLをコピーしました");
		} catch {
			flash("コピーできませんでした");
		}
	};

	const removeContainer = (name: string) => {
		setConfirm({
			title: "コンテナを削除しますか？",
			body: (
				<>
					コンテナ「<b>{name}</b>」を削除します。
				</>
			),
			note: "空でないコンテナは削除できません。先にオブジェクトを削除してください。",
			confirmLabel: "削除する",
			onConfirm: async () => {
				setConfirm(null);
				const r = await deleteContainer(name);
				if (!r.ok) {
					flash(r.hint ?? r.error);
					return;
				}
				flash(`コンテナ「${name}」を削除しました`);
				await reloadContainers();
			},
		});
	};

	const onCreateContainer = async ({ name }: { name: string }) => {
		setSubmittingCreate(true);
		const r = await createContainer(name);
		setSubmittingCreate(false);
		if (!r.ok) {
			flash(r.error);
			return;
		}
		flash(`コンテナ「${name}」を作成しました`);
		setView({ name: "list" });
		await reloadContainers();
	};

	const removeObject = (name: string) => {
		if (view.name !== "detail") return;
		const container = view.container;
		setConfirm({
			title: "オブジェクトを削除しますか？",
			body: (
				<>
					コンテナ「<b>{container}</b>」内の「<b>{name}</b>」を削除します。
				</>
			),
			confirmLabel: "削除する",
			onConfirm: async () => {
				setConfirm(null);
				const r = await deleteObject(container, name);
				if (!r.ok) {
					flash(r.error);
					return;
				}
				flash(`「${name}」を削除しました`);
				await reloadObjects(container);
			},
		});
	};

	const onUpload = async (file: File) => {
		if (view.name !== "detail") return;
		const container = view.container;
		if (file.size > MAX_UPLOAD_BYTES) {
			flash("ファイルサイズが上限 (10 MB) を超えています");
			return;
		}
		setUploadingName(file.name);
		try {
			const base64 = await fileToBase64(file);
			const r = await uploadObject(
				container,
				file.name,
				base64,
				file.type || undefined,
			);
			if (!r.ok) {
				flash(r.error);
				return;
			}
			flash(`「${file.name}」をアップロードしました`);
			await reloadObjects(container);
		} finally {
			setUploadingName(null);
		}
	};

	// ─── 派生値 ─────────────────────────────────────────────
	const existingNames = useMemo(
		() => containers.map((c) => c.name),
		[containers],
	);
	const currentContainer =
		view.name === "detail"
			? containers.find((c) => c.name === view.container)
			: null;

	return (
		<div className="stage">
			<div className="app">
				<TopBar />

				<div className="body">
					{view.name === "list" && (
						<>
							<div className="action-row">
								<div className="count">
									コンテナ <strong>{containers.length}</strong> 件
								</div>
								<div className="action-row__right">
									{/* biome-ignore lint/a11y/useSemanticElements: <fieldset> brings unwanted default styling; div+role=group matches the designer's intended layout. */}
									<div
										className="layout-switch"
										role="group"
										aria-label="レイアウト"
									>
										<button
											type="button"
											className="layout-switch__btn"
											data-on={layout === "grid" ? "1" : "0"}
											onClick={() => setLayout("grid")}
											aria-label="2列で表示"
											aria-pressed={layout === "grid"}
											title="2列"
										>
											<IconLayoutGrid />
										</button>
										<button
											type="button"
											className="layout-switch__btn"
											data-on={layout === "row" ? "1" : "0"}
											onClick={() => setLayout("row")}
											aria-label="横長で表示"
											aria-pressed={layout === "row"}
											title="横長"
										>
											<IconLayoutRow />
										</button>
									</div>
									<button
										type="button"
										className="btn btn--primary btn--trail"
										onClick={() => setView({ name: "create" })}
									>
										コンテナ
										<span className="btn__icon">
											<IconPlusCircle />
										</span>
									</button>
								</div>
							</div>

							{loadingContainers && containers.length === 0 ? (
								<div className="empty">
									<div className="empty__title">読み込み中…</div>
								</div>
							) : containers.length === 0 ? (
								<div className="empty">
									<div className="empty__title">コンテナがありません</div>
									<div className="empty__hint">
										「コンテナ」から新しいコンテナを追加してください。
									</div>
								</div>
							) : (
								<div className="cards" data-layout={layout}>
									{containers.map((c) => (
										<ContainerCard
											key={c.name}
											container={c}
											onToggle={togglePublic}
											onDelete={removeContainer}
											onOpen={openContainer}
											onCopyUrl={copyUrl}
											togglingDisabled={togglingName === c.name}
										/>
									))}
								</div>
							)}
						</>
					)}

					{view.name === "detail" &&
						(currentContainer ? (
							<ObjectList
								container={{ name: currentContainer.name }}
								objects={objects}
								onBack={backToList}
								onDelete={removeObject}
								onUpload={onUpload}
								uploadingName={uploadingName ?? undefined}
							/>
						) : (
							<div className="empty">
								<div className="empty__title">コンテナが見つかりません</div>
								<button
									type="button"
									className="btn btn--ghost"
									style={{ marginTop: 12 }}
									onClick={backToList}
								>
									一覧へ戻る
								</button>
							</div>
						))}

					{view.name === "create" && (
						<CreateContainer
							existingNames={existingNames}
							onCancel={() => setView({ name: "list" })}
							onCreate={onCreateContainer}
							submitting={submittingCreate}
						/>
					)}
				</div>
			</div>

			{confirm && (
				<ConfirmModal
					title={confirm.title}
					body={confirm.body}
					{...(confirm.note && { note: confirm.note })}
					confirmLabel={confirm.confirmLabel}
					onCancel={() => setConfirm(null)}
					onConfirm={confirm.onConfirm}
				/>
			)}

			{toast && <div className="toast">{toast}</div>}
		</div>
	);
}
