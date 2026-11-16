import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
	StyleSheet,
	useWindowDimensions,
} from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import Animated, {
	FadeIn,
	FadeInDown,
	useReducedMotion,
} from "react-native-reanimated";
import { useMqttSensor } from "../hooks/useMqttSensor.js";
import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";
import { TempOrb } from "../components/TempOrb.js";
import { tokens } from "../theme/tokens.js";

const { color, space, radius, shadow } = tokens;
const HISTORY_PAGE_SIZE = 5;

function StatusChip({ connectionState, hasError, onRetry }) {
	const config = useMemo(() => {
		if (
			hasError ||
			connectionState === "error" ||
			connectionState === "disconnected"
		) {
			return {
				bg: color.dangerBg,
				border: color.dangerBorder,
				text: color.dangerText,
				dot: color.dangerText,
				label: "Offline",
				actionable: true,
			};
		}
		if (connectionState === "reconnecting") {
			return {
				bg: color.warnBg,
				border: color.warnBorder,
				text: color.warnText,
				dot: color.warnText,
				label: "Reconnecting…",
				actionable: false,
			};
		}
		return {
			bg: color.successBg,
			border: color.successBorder,
			text: color.successText,
			dot: color.successText,
			label: "Connected",
			actionable: false,
		};
	}, [connectionState, hasError]);

	const chip = (
		<View
			style={[
				styles.chip,
				{ backgroundColor: config.bg, borderColor: config.border },
			]}
			accessible
			accessibilityLabel={`Sensor feed ${config.label}`}
			accessibilityRole="text"
		>
			<View style={[styles.dot, { backgroundColor: config.dot }]} />
			<Text style={[styles.chipText, { color: config.text }]}>
				{config.label}
			</Text>
			{config.actionable ? (
				<Ionicons name="refresh" size={14} color={config.text} />
			) : null}
		</View>
	);

	if (config.actionable && onRetry) {
		return (
			<Pressable
				onPress={onRetry}
				accessibilityLabel="Retry sensor feed"
				accessibilityRole="button"
				accessibilityHint="Attempts to reload sensor history"
				hitSlop={8}
				style={({ pressed }) => [pressed && styles.pressed]}
			>
				{chip}
			</Pressable>
		);
	}
	return chip;
}

function SensorCard({
	title,
	value,
	unit,
	status,
	thresholdLabel,
	connectionState,
	error,
	onRetry,
	beatKey,
	motionLevel,
	alarmActive,
	alarmText,
	timestamp,
	freshness,
	active,
}) {
	return (
		<View style={styles.card}>
			<View style={styles.cardTopRow}>
				<Text style={styles.eyebrow}>{title}</Text>
				<StatusChip
					connectionState={connectionState}
					hasError={Boolean(error)}
					onRetry={onRetry}
				/>
			</View>

			<View
				style={styles.orbStage}
				accessible
				accessibilityLabel={`${title}: ${value} ${unit}${
					status ? `, ${status.label}` : ""
				}`}
			>
				<View style={styles.orbWrap}>
					<TempOrb
						tint={status?.color ?? color.text}
						beatKey={beatKey}
						motionLevel={motionLevel}
						active={active}
						dimmed={
							connectionState !== "connected" &&
							connectionState !== "reconnecting"
						}
						size={320}
					/>
					<View style={styles.orbNumber} pointerEvents="none">
						<View style={styles.orbNumberRow}>
							<Text
								style={[
									styles.temperatureText,
									{ color: status?.color ?? color.text },
								]}
								selectable
							>
								{value}
							</Text>
							<Text style={styles.unitText}>{unit}</Text>
						</View>
						{status?.label ? (
							<Text style={[styles.statusWord, { color: status.color }]}>
								{status.label}
							</Text>
						) : null}
					</View>
				</View>
			</View>

			{alarmActive ? (
				<View
					style={styles.alarmBanner}
					accessible
					accessibilityLiveRegion="assertive"
					accessibilityRole="alert"
				>
					<Ionicons name="warning" size={18} color={color.dangerText} />
					<Text style={styles.alarmText}>{alarmText}</Text>
				</View>
			) : null}

			<View style={styles.metaBlock}>
				{thresholdLabel ? (
					<View style={styles.metaRow}>
						<Ionicons
							name="speedometer-outline"
							size={15}
							color={color.text3}
						/>
						<Text style={styles.metaText}>{thresholdLabel}</Text>
					</View>
				) : null}
				{timestamp ? (
					<View style={styles.metaRow}>
						<Ionicons name="time-outline" size={15} color={color.text3} />
						<Text style={styles.metaText}>
							Last update {new Date(timestamp).toLocaleString()}
						</Text>
					</View>
				) : null}
				<View style={styles.metaRow}>
					<Ionicons name="refresh-outline" size={15} color={color.text3} />
					<Text style={styles.metaText}>{freshness}</Text>
				</View>
			</View>

			{error ? (
				<View
					style={styles.errorBanner}
					accessible
					accessibilityLiveRegion="polite"
					accessibilityLabel={`Sensor feed offline. ${error}`}
				>
					<Ionicons
						name="cloud-offline-outline"
						size={18}
						color={color.dangerText}
					/>
					<View style={styles.errorBannerTextWrap}>
						<Text style={styles.errorBannerTitle}>Sensor feed offline</Text>
						<Text style={styles.errorBannerText}>{error}</Text>
					</View>
					<Pressable
						onPress={onRetry}
						accessibilityLabel="Retry sensor feed"
						accessibilityRole="button"
						hitSlop={8}
						style={({ pressed }) => [
							styles.retryButton,
							pressed && styles.pressed,
						]}
					>
						<Text style={styles.retryText}>Retry</Text>
					</Pressable>
				</View>
			) : null}
		</View>
	);
}

export function MonitoringScreen() {
	const audioPlayer = useAudioPlayer(require("../../assets/alarm.wav"));
	const isFocused = useIsFocused();
	const { width: windowWidth } = useWindowDimensions();
	const {
		temperature,
		humidity,
		timestamp,
		connectionState,
		error: mqttError,
	} = useMqttSensor();
	const [readings, setReadings] = useState([]);
	const [historyPage, setHistoryPage] = useState(0);
	const [latestThreshold, setLatestThreshold] = useState({
		temperature: null,
		humidity: null,
	});
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [apiError, setApiError] = useState(null);
	const [activeSensorPage, setActiveSensorPage] = useState(0);
	const reduceMotion = useReducedMotion();

	const fetchReadings = useCallback(async () => {
		setLoading(true);
		setApiError(null);
		try {
			const [history, thresholds] = await Promise.all([
				Api.getSensorReadings(),
				Api.getThresholds(),
			]);
			setReadings(history ?? []);
			setHistoryPage(0);
			const latest = Array.isArray(thresholds) ? thresholds[0] : null;
			setLatestThreshold({
				temperature:
					typeof latest?.value === "number" ? latest.value : null,
				humidity:
					typeof latest?.humidity_value === "number"
						? latest.humidity_value
						: null,
			});
		} catch (err) {
			setApiError(err.message || "Couldn't load history.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			interruptionMode: "mixWithOthers",
		}).catch((error) => {
			console.error("Failed to configure alarm audio:", error);
		});
	}, []);

	const temperatureExceeded =
		typeof temperature === "number" &&
		typeof latestThreshold.temperature === "number" &&
		temperature >= latestThreshold.temperature;
	const humidityExceeded =
		typeof humidity === "number" &&
		typeof latestThreshold.humidity === "number" &&
		humidity >= latestThreshold.humidity;
	const alarmActive =
		isFocused &&
		connectionState === "connected" &&
		(temperatureExceeded || humidityExceeded);

	useEffect(() => {
		audioPlayer.loop = true;
		if (alarmActive) {
			audioPlayer.play();
		} else {
			audioPlayer.pause();
		}

		return () => audioPlayer.pause();
	}, [alarmActive, audioPlayer]);

	useFocusEffect(
		useCallback(() => {
			fetchReadings();
		}, [fetchReadings]),
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await fetchReadings();
		} finally {
			setRefreshing(false);
		}
	}, [fetchReadings]);

	const proximity = useMemo(() => {
		if (
			typeof temperature !== "number" ||
			typeof latestThreshold.temperature !== "number"
		) {
			return null;
		}
		let tone = "below threshold";
		let statusWord = "Normal";
		let statusColor = color.successText;
		if (temperature >= latestThreshold.temperature) {
			tone = "at or above threshold";
			statusWord = "Over limit";
			statusColor = color.dangerText;
		} else if (
			temperature >= latestThreshold.temperature - 2
		) {
			tone = "near threshold";
			statusWord = "Near limit";
			statusColor = color.warnText;
		}
		return {
			tone,
			statusWord,
			statusColor,
			motionLevel:
				tone === "at or above threshold"
					? "over"
					: tone === "near threshold"
						? "near"
						: "normal",
		};
	}, [temperature, latestThreshold.temperature]);

	const freshness = useMemo(() => {
		if (!Array.isArray(readings) || readings.length === 0) {
			return "No readings yet";
		}
		const first = readings[0];
		const t = new Date(first.recorded_at ?? first.timestamp ?? Date.now());
		const s = Number.isNaN(t.getTime())
			? 0
			: Math.max(0, Math.round((Date.now() - t.getTime()) / 1000));
		const rel =
			s < 10 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
		return `Updated ${rel} · ${readings.length} ${
			readings.length === 1 ? "reading" : "readings"
		}`;
	}, [readings]);

	const tempLabel =
		typeof temperature === "number" ? `${temperature.toFixed(2)}` : "--";
	const humidityLabel =
		typeof humidity === "number" ? `${humidity.toFixed(2)}` : "--";
	const humidityStatus = useMemo(() => {
		if (
			typeof humidity !== "number" ||
			typeof latestThreshold.humidity !== "number"
		) {
			return null;
		}
		if (humidityExceeded) {
			return {
				label: "Over limit",
				color: color.dangerText,
				motionLevel: "over",
			};
		}
		if (humidity >= latestThreshold.humidity - 5) {
			return {
				label: "Near limit",
				color: color.warnText,
				motionLevel: "near",
			};
		}
		return {
			label: "Normal",
			color: color.successText,
			motionLevel: "normal",
		};
	}, [humidity, humidityExceeded, latestThreshold.humidity]);
	const beatKey =
		typeof timestamp === "string" && !Number.isNaN(Date.parse(timestamp))
			? Date.parse(timestamp)
			: 0;
	const pageCount = Math.max(1, Math.ceil(readings.length / HISTORY_PAGE_SIZE));
	const paginatedReadings = readings.slice(
		historyPage * HISTORY_PAGE_SIZE,
		(historyPage + 1) * HISTORY_PAGE_SIZE,
	);

	return (
		<View style={styles.safe}>
			<ScrollView
				contentContainerStyle={styles.container}
				contentInsetAdjustmentBehavior="automatic"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={color.primary}
					/>
				}
			>
				<Animated.View
					entering={
						reduceMotion
							? FadeIn.duration(150)
							: FadeInDown.duration(tokens.motion.entering)
					}
				>
					<ScrollView
						horizontal
						pagingEnabled
						nestedScrollEnabled
						showsHorizontalScrollIndicator={false}
						decelerationRate="fast"
						style={styles.sensorCarousel}
						onMomentumScrollEnd={(event) => {
							setActiveSensorPage(
								Math.round(
									event.nativeEvent.contentOffset.x / windowWidth,
								),
							);
						}}
						accessibilityLabel="Sensor cards. Swipe horizontally to change sensor."
					>
						<View style={[styles.sensorPage, { width: windowWidth }]}>
							<SensorCard
								title="Live temperature"
								value={tempLabel}
								unit="°C"
								status={
									proximity
										? {
												label: proximity.statusWord,
												color: proximity.statusColor,
											}
										: null
								}
								thresholdLabel={
									typeof latestThreshold.temperature === "number"
										? `Threshold ${latestThreshold.temperature.toFixed(2)}°C`
										: null
								}
								connectionState={connectionState}
								error={mqttError}
								onRetry={onRefresh}
								beatKey={beatKey}
								motionLevel={proximity?.motionLevel ?? "normal"}
								alarmActive={alarmActive && temperatureExceeded}
								alarmText="Temperature is over its threshold"
								timestamp={timestamp}
								freshness={freshness}
								active={activeSensorPage === 0}
							/>
						</View>
						<View style={[styles.sensorPage, { width: windowWidth }]}>
							<SensorCard
								title="Live humidity"
								value={humidityLabel}
								unit="% RH"
								status={humidityStatus}
								thresholdLabel={
									typeof latestThreshold.humidity === "number"
										? `Threshold ${latestThreshold.humidity.toFixed(2)}% RH`
										: "Humidity alert threshold not set"
								}
								connectionState={connectionState}
								error={mqttError}
								onRetry={onRefresh}
								beatKey={beatKey}
								motionLevel={humidityStatus?.motionLevel ?? "normal"}
								alarmActive={alarmActive && humidityExceeded}
								alarmText="Humidity is over its threshold"
								timestamp={timestamp}
								freshness={freshness}
								active={activeSensorPage === 1}
							/>
						</View>
					</ScrollView>
					<View
						style={styles.sensorPager}
						accessible
						accessibilityRole="text"
						accessibilityLabel={
							activeSensorPage === 0
								? "Temperature card, 1 of 2. Swipe to view humidity."
								: "Humidity card, 2 of 2. Swipe to view temperature."
						}
					>
						<View
							style={[
								styles.pagerDot,
								activeSensorPage === 0 && styles.pagerDotActive,
							]}
						/>
						<View
							style={[
								styles.pagerDot,
								activeSensorPage === 1 && styles.pagerDotActive,
							]}
						/>
						<Text style={styles.pagerHint}>
							{activeSensorPage === 0
								? "Swipe to view humidity"
								: "Swipe to view temperature"}
						</Text>
					</View>
				</Animated.View>

				{apiError && !loading ? (
					<View
						style={styles.errorBanner}
						accessible
						accessibilityLiveRegion="polite"
						accessibilityLabel={`Couldn't load history. ${apiError}`}
					>
						<Ionicons
							name="alert-circle-outline"
							size={18}
							color={color.dangerText}
						/>
						<View style={styles.errorBannerTextWrap}>
							<Text style={styles.errorBannerTitle}>Couldn't load history</Text>
							<Text style={styles.errorBannerText}>{apiError}</Text>
						</View>
						<Pressable
							onPress={fetchReadings}
							accessibilityLabel="Retry loading history"
							accessibilityRole="button"
							hitSlop={8}
							style={({ pressed }) => [
								styles.retryButton,
								pressed && styles.pressed,
							]}
						>
							<Text style={styles.retryText}>Retry</Text>
						</Pressable>
					</View>
				) : null}

				<View style={styles.sectionHeader}>
					<View style={styles.sectionTitleRow}>
						<Text style={styles.sectionTitle}>Triggered Alarm History</Text>
						{Array.isArray(readings) && readings.length > 0 ? (
							<View style={styles.countPill}>
								<Text style={styles.countText}>
									{readings.length}{" "}
									{readings.length === 1 ? "reading" : "readings"}
								</Text>
							</View>
						) : null}
					</View>
				</View>

				<DataTable
					columns={[
						{
							key: "recorded_at",
							title: "Timestamp",
							flex: 1.5,
							// ponytail: same single-line format as threshold history
							render: (value) =>
								value ? new Date(value).toLocaleString() : "--",
						},
						{
							key: "temperature",
							title: "Temp °C",
							flex: 0.9,
							numeric: true,
							render: (value) =>
								typeof value === "number" ? Number(value).toFixed(2) : "--",
						},
						{
							key: "humidity",
							title: "Humidity %",
							flex: 0.9,
							numeric: true,
							render: (value) =>
								typeof value === "number" ? Number(value).toFixed(2) : "--",
						},
						{
							key: "threshold_value",
							title: "Thresholds",
							flex: 1.1,
							render: (value) =>
								typeof value === "number"
									? `Temp ${Number(value).toFixed(2)}°C`
									: "--",
							renderSecondary: (_value, item) =>
								typeof item.humidity_threshold_value === "number"
									? `Humidity ${Number(item.humidity_threshold_value).toFixed(2)}%`
									: null,
						},
					]}
					data={paginatedReadings}
					keyExtractor={(item) => item.id}
					loading={loading && !refreshing}
					emptyTitle="No readings yet"
					emptyMessage="Triggered readings appear here. Pull to refresh."
					emptyActionLabel="Refresh"
					onEmptyAction={fetchReadings}
				/>
				{readings.length > 0 ? (
					<View style={styles.historyPagination}>
						<Pressable
							onPress={() => setHistoryPage((page) => Math.max(0, page - 1))}
							disabled={historyPage === 0 || loading}
							accessibilityRole="button"
							accessibilityLabel="Sebelumnya"
							accessibilityState={{
								disabled: historyPage === 0 || loading,
							}}
							style={({ pressed }) => [
								styles.pageButton,
								(historyPage === 0 || loading) && styles.pageButtonDisabled,
								pressed && historyPage > 0 && styles.pressed,
							]}
						>
							<Ionicons
								name="chevron-back"
								size={16}
								color={historyPage === 0 ? color.text3 : color.primary}
							/>
							<Text
								style={[
									styles.pageButtonText,
									historyPage === 0 && styles.pageButtonTextDisabled,
								]}
							>
								Sebelumnya
							</Text>
						</Pressable>
						<Text style={styles.pageLabel}>
							Halaman {historyPage + 1} dari {pageCount}
						</Text>
						<Pressable
							onPress={() =>
								setHistoryPage((page) => Math.min(pageCount - 1, page + 1))
							}
							disabled={historyPage >= pageCount - 1 || loading}
							accessibilityRole="button"
							accessibilityLabel="Berikutnya"
							accessibilityState={{
								disabled: historyPage >= pageCount - 1 || loading,
							}}
							style={({ pressed }) => [
								styles.pageButton,
								(historyPage >= pageCount - 1 || loading) &&
									styles.pageButtonDisabled,
								pressed &&
									historyPage < pageCount - 1 &&
									!loading &&
									styles.pressed,
							]}
						>
							<Text
								style={[
									styles.pageButtonText,
									historyPage >= pageCount - 1 &&
										styles.pageButtonTextDisabled,
								]}
							>
								Berikutnya
							</Text>
							<Ionicons
								name="chevron-forward"
								size={16}
								color={
									historyPage >= pageCount - 1
										? color.text3
										: color.primary
								}
							/>
						</Pressable>
					</View>
				) : null}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: color.bg,
	},
	container: {
		padding: space.lg,
		paddingBottom: space.xxl,
		gap: space.lg,
		backgroundColor: color.bg,
	},
	card: {
		backgroundColor: color.surface,
		padding: space.xl,
		borderRadius: radius.card,
		borderCurve: "continuous",
		gap: space.md,
		borderWidth: 1,
		borderColor: color.border,
		boxShadow: shadow.card,
	},
	cardTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: space.md,
	},
	sensorCarousel: {
		marginHorizontal: -space.lg,
	},
	sensorPage: {
		paddingHorizontal: space.lg,
	},
	sensorPager: {
		flexDirection: "row",
		alignItems: "center",
		gap: space.sm,
		alignSelf: "center",
		paddingTop: space.md,
	},
	pagerDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: color.border,
	},
	pagerDotActive: {
		width: 18,
		backgroundColor: color.primary,
	},
	pagerHint: {
		fontSize: 13,
		color: color.text2,
		marginLeft: space.sm,
	},
	alarmBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: space.sm,
		backgroundColor: color.dangerBg,
		borderWidth: 1,
		borderColor: color.dangerBorder,
		borderRadius: radius.input,
		padding: space.md,
	},
	alarmText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
		color: color.dangerText,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: color.text3,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: radius.chip,
		borderCurve: "continuous",
		borderWidth: 1,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	chipText: {
		fontSize: 12,
		fontWeight: "600",
	},
	orbStage: {
		alignItems: "center",
		gap: space.sm,
		minHeight: 320,
	},
	orbWrap: {
		width: 320,
		height: 320,
		alignSelf: "center",
		position: "relative",
	},
	orbNumber: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: 2,
	},
	orbNumberRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 6,
	},
	temperatureText: {
		fontSize: 30,
		fontWeight: "700",
		color: color.text,
		fontVariant: ["tabular-nums"],
	},
	unitText: {
		fontSize: 15,
		fontWeight: "600",
		color: color.text2,
	},
	statusWord: {
		fontSize: 13,
		fontWeight: "700",
	},
	metaBlock: {
		gap: space.sm,
		marginTop: space.sm,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	metaText: {
		fontSize: 13,
		color: color.text2,
		fontVariant: ["tabular-nums"],
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		// ponytail: taller break above, table tucked under header
		marginTop: space.md,
		marginBottom: -space.sm,
	},
	sectionTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: space.sm,
	},
	sectionTitle: {
		fontSize: tokens.type.section,
		fontWeight: "700",
		color: color.text,
	},
	countPill: {
		backgroundColor: color.surface2,
		borderRadius: radius.pill,
		borderCurve: "continuous",
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	countText: {
		fontSize: 12,
		fontWeight: "600",
		color: color.text2,
		fontVariant: ["tabular-nums"],
	},
	historyPagination: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: space.sm,
		marginTop: -space.md,
	},
	pageButton: {
		minHeight: tokens.hit,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		paddingHorizontal: space.sm,
		borderRadius: radius.input,
	},
	pageButtonDisabled: {
		opacity: 0.6,
	},
	pageButtonText: {
		color: color.primary,
		fontSize: 13,
		fontWeight: "600",
	},
	pageButtonTextDisabled: {
		color: color.text3,
	},
	pageLabel: {
		color: color.text2,
		fontSize: 12,
		fontVariant: ["tabular-nums"],
	},
	errorBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: space.md,
		backgroundColor: color.dangerBg,
		borderWidth: 1,
		borderColor: color.dangerBorder,
		borderRadius: radius.input,
		borderCurve: "continuous",
		padding: space.md,
	},
	errorBannerTextWrap: {
		flex: 1,
		gap: 2,
	},
	errorBannerTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: color.dangerText,
	},
	errorBannerText: {
		fontSize: 13,
		color: color.dangerText,
	},
	retryButton: {
		minHeight: tokens.hit,
		justifyContent: "center",
		paddingHorizontal: space.md,
	},
	retryText: {
		fontSize: 14,
		fontWeight: "600",
		color: color.dangerText,
	},
	pressed: {
		opacity: 0.9,
		transform: [{ scale: 0.98 }],
	},
});
