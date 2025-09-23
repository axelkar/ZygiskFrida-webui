import type { FileInterface } from "webuix";

/** ZygiskFrida configuration */
export interface Config {
	targets: Target[];
}

/** Injection target */
export interface Target {
	/** Package name (reverse DNS notation) of the app to inject Frida to */
	app_name: string;
	/** Whether to enable the injection of Frida */
	enabled: boolean;
	/**
	 * Injection of libraries is delayed by this amount in milliseconds.
	 *
	 * There are times that you might want to delay the injection of the gadget. Some applications might run checks at start up and delaying the injection can help avoid these.
	 */
	start_up_delay_ms: number;
	/** Libraries that will be injected into the process */
	injected_libraries: InjectedLibrary[];
	/** Handling of child processes */
	child_gating?: {
		enabled: boolean;
		mode: "freeze" | "kill" | "inject";
		/** Libraries that will be injected into the process */
		injected_libraries: InjectedLibrary[];
	};
}

/** Library that is injected into a process */
export interface InjectedLibrary {
	path: string;
}

export const CONFIG_PATH = "/data/local/tmp/re.zyg.fri/config.json";
export const DEFAULT_CHILD_GATING: NonNullable<Target["child_gating"]> = {
	enabled: false,
	mode: "freeze",
	injected_libraries: [
		{
			path: "/data/local/tmp/re.zyg.fri/libgadget-child.so",
		},
	],
};

const MOCK = process.env.NODE_ENV == "development";

/**
 * Loads a ZygiskFrida configuration file.
 */
export function loadConfig(): Config {
	if (MOCK) {
		// https://github.com/lico-n/ZygiskFrida/blob/main/config.json.example
		return {
			targets: Array(2)
				.fill([
					{
						app_name: "com.example.package",
						enabled: true,
						start_up_delay_ms: 0,
						injected_libraries: [
							{
								path: "/data/local/tmp/re.zyg.fri/libgadget.so",
							},
						],
						child_gating: DEFAULT_CHILD_GATING,
					},
				])
				.flat(),
		};
	}

	// `$ZyFile` is from modid ZygiskFrida-webui
	const text = (window.$ZyFile as FileInterface).read(CONFIG_PATH);
	if (text == null)
		throw new Error("Got null when reading ZygiskFrida config file");

	return JSON.parse(text);
}

/**
 * Saves a ZygiskFrida configuration file.
 */
export function saveConfig(config: Config) {
	if (MOCK) {
		console.info("[MOCK]", "saving config:", config);
		return;
	}
	// `$ZyFile` is from modid ZygiskFrida-webui
	(window.$ZyFile as FileInterface).write(CONFIG_PATH, JSON.stringify(config));
}
