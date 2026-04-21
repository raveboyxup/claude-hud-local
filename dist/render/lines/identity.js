import { getContextPercent, getBufferedPercent, getTotalTokens, } from "../../stdin.js";
import { coloredBar, label, getContextColor, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { t } from "../../i18n/index.js";
import { progressLabel } from "./label-align.js";
const DEBUG = process.env.DEBUG?.includes("claude-hud") || process.env.DEBUG === "*";
export function renderIdentityLine(ctx, alignLabels = false) {
    const rawPercent = getContextPercent(ctx.stdin, ctx.localModelInfo);
    const bufferedPercent = getBufferedPercent(ctx.stdin, ctx.localModelInfo);
    const autocompactMode = ctx.config?.display?.autocompactBuffer ?? "enabled";
    const percent = autocompactMode === "disabled" ? rawPercent : bufferedPercent;
    const colors = ctx.config?.colors;
    if (DEBUG && autocompactMode === "disabled") {
        console.error(`[claude-hud:context] autocompactBuffer=disabled, showing raw ${rawPercent}% (buffered would be ${bufferedPercent}%)`);
    }
    const display = ctx.config?.display;
    const contextValueMode = display?.contextValue ?? "percent";
    const contextValue = formatContextValue(ctx, percent, contextValueMode);
    const contextValueDisplay = `${getContextColor(percent, colors)}${contextValue}${RESET}`;
    let line = display?.showContextBar !== false
        ? `${progressLabel("label.context", colors, alignLabels)} ${coloredBar(percent, getAdaptiveBarWidth(), colors)} ${contextValueDisplay}`
        : `${progressLabel("label.context", colors, alignLabels)} ${contextValueDisplay}`;
    if (display?.showTokenBreakdown !== false && percent >= 85) {
        const usage = ctx.stdin.context_window?.current_usage;
        if (usage) {
            const input = formatTokens(usage.input_tokens ?? 0);
            const cache = formatTokens((usage.cache_creation_input_tokens ?? 0) +
                (usage.cache_read_input_tokens ?? 0));
            line += label(` (${t("format.in")}: ${input}, ${t("format.cache")}: ${cache})`, colors);
        }
    }
    return line;
}
function formatTokens(n) {
    if (n >= 1000000) {
        return `${(n / 1000000).toFixed(1)}M`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(0)}k`;
    }
    return n.toString();
}
function formatContextValue(ctx, percent, mode) {
    const totalTokens = getTotalTokens(ctx.stdin);
    let size = ctx.stdin.context_window?.context_window_size;
    const hasLocalModel = !!(ctx.localModelInfo && ctx.localModelInfo.contextWindow);
    if (!size || size <= 0) {
        size = ctx.localModelInfo?.contextWindow ?? 0;
    }
    if (mode === "tokens") {
        if (size > 0) {
            return `${formatTokens(totalTokens)}/${formatTokens(size)}`;
        }
        return formatTokens(totalTokens);
    }
    if (mode === "both") {
        if (size > 0) {
            return `${percent}% (${formatTokens(totalTokens)}/${formatTokens(size)})`;
        }
        return `${percent}%`;
    }
    if (mode === "remaining") {
        return `${Math.max(0, 100 - percent)}%`;
    }
    // For percent mode with local model but no token tracking, show available capacity
    if (hasLocalModel && !ctx.stdin.context_window?.context_window_size) {
        return `${formatTokens(size)} ${t("local.available")}`;
    }
    return `${percent}%`;
}
//# sourceMappingURL=identity.js.map