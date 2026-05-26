/**
 * コンテナ 1 件分のカード
 *
 * デザイナー版 components.jsx の ContainerCard を React コンポーネントとして移植。
 * `onOpen` でオブジェクト一覧へ遷移、`onToggle` で公開状態の切替、`onDelete` で削除、
 * `onCopyUrl` で URL クリップボードコピー。
 */

import type { KeyboardEvent, MouseEvent } from "react";
import { formatBytes } from "../format-bytes.js";
import { IconContainer, IconCopy, IconTrash } from "./icon.js";
import { Toggle } from "./toggle.js";

/** カードに表示する 1 件のコンテナ情報 */
export interface ContainerCardItem {
	/** 一意キーとなる名前 */
	name: string;
	/** オブジェクト数 */
	count: number;
	/** 合計バイト数 */
	bytes: number;
	/** Web 公開中か */
	isPublic: boolean;
	/** 公開時のフル URL（非公開時は未設定） */
	publicUrl?: string;
}

interface ContainerCardProps {
	container: ContainerCardItem;
	onToggle: (name: string, next: boolean) => void;
	onDelete: (name: string) => void;
	onOpen: (name: string) => void;
	onCopyUrl: (url: string) => void;
	/** 公開トグルを一時無効化（呼び出し中など） */
	togglingDisabled?: boolean;
}

function stop(e: MouseEvent | KeyboardEvent) {
	e.stopPropagation();
}

export function ContainerCard({
	container,
	onToggle,
	onDelete,
	onOpen,
	onCopyUrl,
	togglingDisabled,
}: ContainerCardProps) {
	const onCardClick = () => onOpen(container.name);
	const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onOpen(container.name);
		}
	};

	// 公開URL（未取得時はホスト推定不可なのでフォールバック表示は省く）
	const url = container.publicUrl;
	const displayUrl = url ? url.replace(/^https?:\/\//, "") : "";

	return (
		// biome-ignore lint/a11y/useSemanticElements: <button> cannot contain nested interactive children (Toggle, delete button, link); div+role=button is the recommended pattern here.
		<div
			className="card"
			role="button"
			tabIndex={0}
			onClick={onCardClick}
			onKeyDown={onKey}
		>
			<div className="card__head">
				<span className="card__icon">
					<IconContainer />
				</span>
				<span className="card__name" title={container.name}>
					{container.name}
				</span>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: nested interactive zone uses stop-propagation handlers to keep its own buttons functional while the parent card remains clickable. */}
				<div className="card__actions" onClick={stop} onKeyDown={stop}>
					<Toggle
						value={container.isPublic}
						onChange={(v) => onToggle(container.name, v)}
						disabled={togglingDisabled}
					/>
					<button
						type="button"
						className="icon-btn is-danger"
						onClick={() => onDelete(container.name)}
						aria-label="削除"
						title="削除"
					>
						<IconTrash />
					</button>
				</div>
			</div>

			<div className="card__meta">
				<div className="card__meta-item">
					<span className="card__meta-key">Objects</span>
					<span className="card__meta-val">
						{container.count.toLocaleString()}
					</span>
				</div>
				<div className="card__meta-item">
					<span className="card__meta-key">Size</span>
					<span className="card__meta-val">{formatBytes(container.bytes)}</span>
				</div>
			</div>

			{url && (
				// biome-ignore lint/a11y/noStaticElementInteractions: nested interactive zone uses stop-propagation handlers to keep its own anchor/copy button functional while the parent card remains clickable.
				<div className="card__url" onClick={stop} onKeyDown={stop}>
					<span className="card__url-label">URL</span>
					<a
						className="card__url-val"
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						title={url}
					>
						{displayUrl}
					</a>
					<button
						type="button"
						className="card__url-copy"
						aria-label="URLをコピー"
						title="URLをコピー"
						onClick={() => onCopyUrl(url)}
					>
						<IconCopy />
					</button>
				</div>
			)}
		</div>
	);
}
