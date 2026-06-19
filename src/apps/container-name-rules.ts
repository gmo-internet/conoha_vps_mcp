/**
 * コンテナ名の命名規則（単一の真実源）
 *
 * @remarks
 * オブジェクトストレージのコンテナ名に関する規則（文字数下限・上限・許可文字）を
 * 一箇所に集約する。サーバ側の zod スキーマ（apps-tools.ts の create_container）と
 * UI 側の入力検証（ui/validate-container-name.ts）の双方がこの定数を import し、
 * 規則の二重定義・乖離を防ぐ。
 *
 * この モジュールは Node 専用 / DOM 専用 API に依存しない純粋な定数のみを公開するため、
 * tsconfig.json（Node）と tsconfig.ui.json（DOM）の双方から安全に参照できる。
 *
 * @packageDocumentation
 */

/** コンテナ名の最小文字数 */
export const CONTAINER_NAME_MIN_LENGTH = 3;

/** コンテナ名の最大文字数 */
export const CONTAINER_NAME_MAX_LENGTH = 63;

/** コンテナ名で許可する文字（英数字・ピリオド・アンダースコア・ハイフン） */
export const CONTAINER_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
