/**
 * 破壊的操作の確認モーダル
 *
 * デザイナー版 components.jsx の ConfirmModal を移植。
 * Escape キーでキャンセル、オーバーレイクリックでキャンセル。
 */

import { type ReactNode, useEffect } from "react";
import { IconWarning, IconX } from "./icon.js";

interface ConfirmModalProps {
	title: string;
	body?: ReactNode;
	note?: string;
	cancelLabel?: string;
	confirmLabel?: string;
	/** true なら破壊的（赤）ボタン */
	danger?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export function ConfirmModal({
	title,
	body,
	note,
	cancelLabel = "キャンセル",
	confirmLabel = "削除する",
	danger = true,
	onCancel,
	onConfirm,
}: ConfirmModalProps) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss is a standard modal pattern; Escape is also handled at window level above.
		<div
			className="modal-overlay"
			onClick={onCancel}
			onKeyDown={(e) => {
				if (e.key === "Escape") onCancel();
			}}
			role="presentation"
		>
			<div
				className="modal modal--confirm"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="alertdialog"
				aria-labelledby="confirm-title"
			>
				<button
					type="button"
					className="modal__close"
					onClick={onCancel}
					aria-label="閉じる"
				>
					<IconX />
				</button>
				<div className="modal__head">
					<span className="modal__warn-icon" aria-hidden="true">
						<IconWarning />
					</span>
					<div className="modal__head-text">
						<h3 className="modal__title" id="confirm-title">
							{title}
						</h3>
						{body && <p className="modal__body">{body}</p>}
						{note && <p className="modal__note">{note}</p>}
					</div>
				</div>
				<div className="modal__actions">
					<button type="button" className="btn btn--ghost" onClick={onCancel}>
						{cancelLabel}
					</button>
					<button
						type="button"
						className={danger ? "btn btn--danger" : "btn btn--primary"}
						onClick={onConfirm}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
