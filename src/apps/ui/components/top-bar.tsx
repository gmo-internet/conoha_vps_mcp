/**
 * 画面上部のブランドバー（ConoHa VPS ロゴ）
 *
 * デザイナー版 components.jsx の TopBar をそのまま React コンポーネントとして移植。
 * SVG ロゴは `?url` インポートで読み込み、viteSingleFile によりビルド時に base64 化される。
 */

import logoUrl from "../conoha_vps.svg";

export function TopBar() {
	return (
		<div className="topbar">
			<div className="topbar__brand">
				<img className="topbar__logo" src={logoUrl} alt="ConoHa VPS" />
			</div>
		</div>
	);
}
