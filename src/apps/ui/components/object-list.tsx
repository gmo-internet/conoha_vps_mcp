/**
 * コンテナ詳細（オブジェクト一覧）画面
 *
 * デザイナー版 object-list.jsx の ObjectList を移植。
 * 実 API 連携: 画面上の「アップロード」ボタンで `<input type="file">` を呼び出し、
 * 親から渡された `onUpload(File)` に渡す。進捗バーは決定論的ではないため、
 * 「アップロード中…」のサーチン表示にとどめる。
 */

import { useRef } from "react";
import { formatBytes } from "../format-bytes.js";
import {
	IconArrowLeft,
	IconTrash,
	IconUpload,
	IconUploadCircle,
} from "./icon.js";

/** 表示用のコンテナサマリ */
interface ObjectListContainer {
	name: string;
}

/** 表示用のオブジェクト */
export interface ObjectListItem {
	name: string;
	bytes: number;
	content_type: string;
}

interface ObjectListProps {
	container: ObjectListContainer;
	objects: ObjectListItem[];
	onBack: () => void;
	onDelete: (name: string) => void;
	onUpload: (file: File) => void;
	/** アップロード進行中なら表示するファイル名 */
	uploadingName?: string;
}

export function ObjectList({
	container,
	objects,
	onBack,
	onDelete,
	onUpload,
	uploadingName,
}: ObjectListProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const triggerFilePick = () => {
		if (uploadingName) return;
		fileInputRef.current?.click();
	};

	return (
		<>
			{/* 操作行: 戻る / 件数 / アップロード */}
			<div className="action-row action-row--detail">
				<button
					type="button"
					className="btn btn--ghost btn--back"
					onClick={onBack}
				>
					<span className="btn__icon">
						<IconArrowLeft />
					</span>
					戻る
				</button>
				<div className="detail-title">
					<strong className="detail-title__name" title={container.name}>
						{container.name}
					</strong>
					<span className="count count--inline">
						<strong>{objects.length}</strong> 件
					</span>
				</div>
				<button
					type="button"
					className="btn btn--primary btn--trail"
					onClick={triggerFilePick}
					disabled={Boolean(uploadingName)}
				>
					アップロード
					<span className="btn__icon">
						<IconUploadCircle />
					</span>
				</button>
				<input
					ref={fileInputRef}
					type="file"
					hidden
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) onUpload(file);
						// 同じファイルを再選択しても change が発火するように値をクリア
						e.target.value = "";
					}}
				/>
			</div>

			{uploadingName ? (
				<div className="upload-row">
					<div className="upload-row__main">
						<span className="upload-row__icon">
							<IconUpload />
						</span>
						<span className="upload-row__name" title={uploadingName}>
							{uploadingName}
						</span>
						<span className="upload-row__hint">をアップロード中</span>
					</div>
				</div>
			) : null}

			{objects.length === 0 ? (
				<div className="empty">
					<div className="empty__title">オブジェクトがありません</div>
					<div className="empty__hint">
						「アップロード」からファイルを追加してください。
					</div>
				</div>
			) : (
				<div className="obj-table">
					<div className="obj-table__head">
						<div className="obj-col obj-col--name">ファイル名</div>
						<div className="obj-col obj-col--mime">MIMEタイプ</div>
						<div className="obj-col obj-col--size">サイズ</div>
						<div className="obj-col obj-col--act" />
					</div>
					<div className="obj-table__body">
						{objects.map((o) => (
							<div className="obj-row" key={o.name}>
								<div className="obj-col obj-col--name" title={o.name}>
									{o.name}
								</div>
								<div className="obj-col obj-col--mime" title={o.content_type}>
									{o.content_type}
								</div>
								<div className="obj-col obj-col--size">
									{formatBytes(o.bytes)}
								</div>
								<div className="obj-col obj-col--act">
									<button
										type="button"
										className="icon-btn is-danger"
										onClick={() => onDelete(o.name)}
										aria-label={`${o.name} を削除`}
										title="削除"
									>
										<IconTrash />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</>
	);
}
