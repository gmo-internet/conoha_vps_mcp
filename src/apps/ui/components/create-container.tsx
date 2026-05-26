/**
 * コンテナ作成画面（一覧と切り替え表示）
 *
 * デザイナー版 components.jsx の CreateContainer を移植。
 * 入力中はバリデーション結果をリアルタイム表示し、`ok` 時のみ送信できる。
 */

import { type FormEvent, useEffect, useRef, useState } from "react";
import { validateContainerName } from "../validate-container-name.js";
import { IconAlertCircle, IconCheckCircle } from "./icon.js";

interface CreateContainerProps {
	existingNames: readonly string[];
	onCancel: () => void;
	onCreate: (params: { name: string }) => void;
	/** 送信中ロック（API 呼び出し中） */
	submitting?: boolean;
}

export function CreateContainer({
	existingNames,
	onCancel,
	onCreate,
	submitting,
}: CreateContainerProps) {
	const [name, setName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);

	const v = validateContainerName(name, existingNames);
	const canSubmit = v.state === "ok" && !submitting;

	const submit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!canSubmit) return;
		onCreate({ name });
	};

	return (
		<form className="create" onSubmit={submit} noValidate>
			<div className="create__field">
				<label htmlFor="container-name" className="create__label">
					コンテナ名<span className="create__required">（必須）</span>
				</label>
				<input
					id="container-name"
					ref={inputRef}
					className="create__input"
					placeholder="例: backups"
					value={name}
					onChange={(e) => setName(e.target.value)}
					autoComplete="off"
					spellCheck={false}
					maxLength={80}
					data-state={v.state}
					disabled={submitting}
				/>

				<ul className="create__rules">
					<li>英数字・ハイフン・アンダースコア・ピリオドのみ</li>
					<li>3文字〜63文字</li>
				</ul>

				<div className="create__validation" data-state={v.state}>
					{v.state === "ok" && (
						<>
							<span className="create__validation-icon">
								<IconCheckCircle />
							</span>
							<span>命名 OK</span>
						</>
					)}
					{v.state === "error" && (
						<>
							<span className="create__validation-icon">
								<IconAlertCircle />
							</span>
							<span>{v.message}</span>
						</>
					)}
				</div>
			</div>

			<div className="create__actions">
				<button
					type="button"
					className="btn btn--ghost"
					onClick={onCancel}
					disabled={submitting}
				>
					キャンセル
				</button>
				<button
					type="submit"
					className="btn btn--primary"
					disabled={!canSubmit}
				>
					{submitting ? "作成中…" : "コンテナを作成"}
				</button>
			</div>
		</form>
	);
}
