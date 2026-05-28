/**
 * iOS 風の公開／非公開トグルスイッチ
 *
 * デザイナー版 components.jsx の Toggle を React コンポーネントとして移植。
 * クリックは親へ伝播させず、`onChange(boolean)` で次状態を通知する。
 */

interface ToggleProps {
	/** 現在の状態（true: 公開、false: 非公開） */
	value: boolean;
	/** 次状態への変更要求（楽観更新は呼び出し側で実施） */
	onChange: (next: boolean) => void;
	/** 一時的にクリックを抑止する（API 呼び出し中など） */
	disabled?: boolean;
}

export function Toggle({ value, onChange, disabled }: ToggleProps) {
	return (
		<button
			type="button"
			className="toggle"
			data-on={value ? "1" : "0"}
			disabled={disabled}
			onClick={(e) => {
				e.stopPropagation();
				if (disabled) return;
				onChange(!value);
			}}
			aria-label={
				value
					? "公開中。クリックで非公開にする"
					: "非公開。クリックで公開にする"
			}
		>
			<span className="toggle__switch" />
			<span className="toggle__label">{value ? "公開" : "非公開"}</span>
		</button>
	);
}
