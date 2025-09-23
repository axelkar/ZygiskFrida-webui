import { useState } from "react";
import { PackageChooser } from "./PackageChooser";

import "./index.css";
import {
	CONFIG_PATH,
	DEFAULT_CHILD_GATING,
	loadConfig,
	saveConfig,
	type InjectedLibrary,
	type Target,
} from "./config";

export function App() {
	const [config, setConfig] = useState(() => loadConfig());
	return (
		<main className="flex flex-col gap-2 py-4">
			<section className="px-4 flex flex-col gap-2">
				<h1 className="text-3xl text-white text-center pb-2">ZygiskFrida</h1>
				<p>
					Zygisk module allowing you to inject frida gadget in Android
					applications in a more stealthy way.
				</p>
				<ul className="list-disc list-inside">
					<li>
						The gadget is not embedded into the APK itself so APK
						Integrity/Signature checks will still pass.
					</li>
					<li>
						The process is not being ptraced like it is with{" "}
						<code>frida-server</code>. Avoiding ptrace based detection.
					</li>
					<li>Control about the injection time of the gadget.</li>
					<li>
						Allows you to load multiple arbitrary libraries into the process.
					</li>
					<li>
						<a
							className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
							href="https://github.com/lico-n/ZygiskFrida"
						>
							GitHub
						</a>
					</li>
					<li>
						Configuration file path: <code>{CONFIG_PATH}</code>.
					</li>
				</ul>
			</section>

			<section className="px-4 flex flex-col gap-2">
				<h2 className="text-2xl text-center pb-2">Configuration</h2>
				<h3 className="text-xl text-center text-gray-300 pb-2">Targets</h3>

				<ul className="flex flex-col gap-2">
					{config.targets.map((target, i) => (
						<TargetView
							key={i}
							target={target}
							setTarget={(nextTarget) =>
								setConfig({
									...config,
									targets:
										nextTarget == null
											? config.targets.filter((_target, k) => k !== i)
											: config.targets.map((target, k) =>
													k === i ? nextTarget : target,
												),
								})
							}
						/>
					))}
				</ul>

				<div className="flex justify-center gap-2">
					<button
						className="p-2 rounded-md bg-green-600 cursor-pointer text-white"
						onClick={() =>
							setConfig({
								...config,
								targets: [
									...config.targets,
									{
										app_name: "com.example.package",
										enabled: false,
										start_up_delay_ms: 0,
										injected_libraries: [
											{ path: "/data/local/tmp/re.zyg.fri/libgadget.so" },
										],
									},
								],
							})
						}
					>
						Add target
					</button>
					<button
						className="p-2 rounded-md bg-indigo-600 border-2 border-indigo-500 cursor-pointer text-white"
						onClick={() => saveConfig(config)}
					>
						Save
					</button>
				</div>
			</section>
		</main>
	);
}

export default App;

function TargetView({
	target,
	setTarget,
}: {
	target: Target;
	setTarget: (nextTarget: Target | null) => void;
}) {
	const child_gating = target.child_gating ?? DEFAULT_CHILD_GATING;
	const [packageChooserOpen, setPackageChooserOpen] = useState(false);

	return (
		<>
			<PackageChooser
				onCancel={() => setPackageChooserOpen(false)}
				onPackageChosen={(pkg) => {
					setPackageChooserOpen(false);
					setTarget({ ...target, app_name: pkg.getPackageName() });
				}}
				isOpen={packageChooserOpen}
				checkDisabled={(_pkg) => false}
			/>
			<li className="flex flex-col p-6 border-2 rounded-lg shadow-lg bg-gray-800 border-gray-700">
				<div className="mb-2 flex justify-between items-baseline">
					<div className="flex gap-2 items-baseline">
						<h5 className="text-2xl font-bold font-mono break-all tracking-tight text-white">
							{target.app_name}
						</h5>
						<button onClick={() => setPackageChooserOpen(true)}>
							{/* pencil from Heroicons, MIT licensed */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
								/>
							</svg>
						</button>
						<button onClick={() => setTarget(null)}>
							{/* trash from Heroicons, MIT licensed */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
								/>
							</svg>
						</button>
					</div>
					<input
						type="checkbox"
						style={{ transform: "scale(1.5)" }}
						checked={target.enabled}
						onChange={(e) =>
							setTarget({ ...target, enabled: e.target.checked })
						}
					/>
				</div>

				<div className="flex flex-col pl-2">
					<div className="flex flex-wrap gap-x-2">
						<h5 className="font-bold text-gray-200">Child gating:</h5>
						<input
							type="checkbox"
							checked={child_gating?.enabled}
							onChange={(e) =>
								setTarget({
									...target,
									child_gating: {
										...child_gating,
										enabled: e.target.checked,
									},
								})
							}
						/>

						<label>
							Mode:{" "}
							<select
								className="p-1 border border-gray-700 rounded-sm"
								value={child_gating.mode}
								onChange={(e) =>
									setTarget({
										...target,
										child_gating: {
											...child_gating,
											mode: e.target.value as "freeze" | "kill" | "inject",
										},
									})
								}
							>
								{["freeze", "kill", "inject"].map((mode) => (
									<option key={mode} value={mode}>
										{mode}
									</option>
								))}
							</select>
						</label>
					</div>

					<InjectedLibrariesSetting
						libs={child_gating.injected_libraries}
						set={(nextLibs) =>
							setTarget({
								...target,
								child_gating: {
									...child_gating,
									injected_libraries: nextLibs,
								},
							})
						}
					/>
				</div>

				<InjectedLibrariesSetting
					libs={target.injected_libraries}
					set={(nextLibs) =>
						setTarget({ ...target, injected_libraries: nextLibs })
					}
				/>

				<label>
					Startup delay (milliseconds):{" "}
					<input
						type="number"
						min={0}
						className="bg-indigo-950 p-1 rounded-md border-2 border-indigo-600 w-32"
						value={target.start_up_delay_ms}
						onChange={(e) =>
							setTarget({
								...target,
								start_up_delay_ms: Number(e.target.value),
							})
						}
					></input>
				</label>
			</li>
		</>
	);
}

function InjectedLibrariesSetting({
	libs,
	set,
}: {
	libs: InjectedLibrary[];
	set: (nextValue: InjectedLibrary[]) => void;
}) {
	return (
		<>
			Paths:{" "}
			<ul className="flex flex-col gap-1">
				{[...libs, null].map((lib, i) => (
					<li key={i}>
						{lib == null ? (
							<input
								value=""
								placeholder="Add"
								onChange={(e) => set([...libs, { path: e.target.value }])}
								className="bg-indigo-950 p-1 rounded-md border-2 border-indigo-600 w-full"
							/>
						) : (
							<input
								value={lib.path}
								onChange={(e) =>
									e.target.value.length === 0
										? set(libs.filter((_lib, k) => k !== i))
										: set(
												libs.map((lib, k) =>
													k === i ? { path: e.target.value } : lib,
												),
											)
								}
								className="bg-indigo-950 p-1 rounded-md border-2 border-indigo-600 w-full"
							/>
						)}
					</li>
				))}
				<li key={libs.length}></li>
			</ul>
		</>
	);
}
