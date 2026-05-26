/**
 * コンテナ名バリデーションの純粋関数
 *
 * @remarks
 * 「コンテナを作成」画面の入力検証ロジックを切り出し、単体テスト可能にする。
 * - 空文字 → `empty`（メッセージ無し）
 * - 文字数・文字種・重複違反 → `error`（メッセージ付き）
 * - すべての条件を満たす → `ok`
 *
 * @packageDocumentation
 */

/** バリデーション結果の状態 */
type ContainerNameValidationState = "empty" | "ok" | "error";

/** バリデーション結果 */
interface ContainerNameValidation {
	/** 結果状態 */
	state: ContainerNameValidationState;
	/** エラー時または OK 時のメッセージ（空の場合は未設定） */
	message?: string;
}

/**
 * コンテナ名を 1 回の評価でバリデーションする
 *
 * @remarks
 * - 3 文字以上 63 文字以下
 * - 英数字・ハイフン・アンダースコア・ピリオドのみ
 * - 既存名と重複しない
 *
 * @param name - 入力されたコンテナ名（未トリム）
 * @param existingNames - 既存コンテナ名の配列
 * @returns 状態とメッセージ（OK / error / empty）
 */
export function validateContainerName(
	name: string,
	existingNames: readonly string[],
): ContainerNameValidation {
	if (!name) return { state: "empty" };
	if (name.length < 3) {
		return { state: "error", message: "3文字以上で入力してください" };
	}
	if (name.length > 63) {
		return { state: "error", message: "63文字以下で入力してください" };
	}
	if (!/^[A-Za-z0-9._-]+$/.test(name)) {
		return { state: "error", message: "使用できない文字が含まれています" };
	}
	if (existingNames.includes(name)) {
		return { state: "error", message: "同じ名前のコンテナが既に存在します" };
	}
	return { state: "ok", message: "命名 OK" };
}
