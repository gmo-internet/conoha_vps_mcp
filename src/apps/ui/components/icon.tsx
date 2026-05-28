/**
 * アイコンバレル
 *
 * SVG ファイル（`../icons/*.svg`）を vite-plugin-svgr 経由で React コンポーネント
 * として読み込み、名前付き再エクスポートする。コード上で個々のアイコン形状が
 * 不可視になるのを避けるため、各アイコンは独立した .svg ファイルとして
 * 配置されている（デザイナーが直接編集可能）。
 *
 * SVG 内に記述された `width`/`height`/`stroke` 等は React コンポーネントの
 * デフォルト props となり、利用側で `<IconX width={20} />` のように上書き可能。
 */

import IconAlertCircle from "../icons/alert-circle.svg?react";
import IconArrowLeft from "../icons/arrow-left.svg?react";
import IconCheckCircle from "../icons/check-circle.svg?react";
import IconContainer from "../icons/container.svg?react";
import IconCopy from "../icons/copy.svg?react";
import IconLayoutGrid from "../icons/layout-grid.svg?react";
import IconLayoutRow from "../icons/layout-row.svg?react";
import IconPlusCircle from "../icons/plus-circle.svg?react";
import IconTrash from "../icons/trash.svg?react";
import IconUpload from "../icons/upload.svg?react";
import IconUploadCircle from "../icons/upload-circle.svg?react";
import IconWarning from "../icons/warning.svg?react";
import IconX from "../icons/x.svg?react";

export {
	IconAlertCircle,
	IconArrowLeft,
	IconCheckCircle,
	IconContainer,
	IconCopy,
	IconLayoutGrid,
	IconLayoutRow,
	IconPlusCircle,
	IconTrash,
	IconUpload,
	IconUploadCircle,
	IconWarning,
	IconX,
};
