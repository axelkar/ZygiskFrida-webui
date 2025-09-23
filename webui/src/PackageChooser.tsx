import { wrapInputStream, type WXApplicationInfo } from "webuix";
import Modal from "react-modal";
import { useEffect, useRef, useState } from "react";

const MOCK = process.env.NODE_ENV == "development";

function getInstalledPackages(): WXApplicationInfo[] {
	if (MOCK)
		return Array(15)
			.fill([
				{
					getName() {
						return "foo";
					},
					getPackageName() {
						return "bar";
					},
				},
				{
					getName() {
						return "baz";
					},
					getPackageName() {
						return "baz";
					},
				},
				{
					getName() {
						return "A very long named application";
					},
					getPackageName() {
						return "com.example.ihavea.verylongname.loremipsumdolorsitamet.asdf";
					},
				},
			])
			.flat();

	const packageNames: string[] = JSON.parse(
		window.$packageManager.getInstalledPackages(),
	);
	return packageNames.map((name) =>
		window.$packageManager.getApplicationInfo(name),
	);
}

export function PackageChooser({
	onPackageChosen,
	onCancel,
	isOpen,
	checkDisabled,
}: {
	onPackageChosen: (pkg: WXApplicationInfo) => void;
	onCancel: () => void;
	isOpen: boolean;
	checkDisabled: (pkg: WXApplicationInfo) => boolean;
}) {
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onCancel}
			className="modal-content"
			overlayClassName="modal-overlay"
			closeTimeoutMS={150} // Tailwind CSS's --default-transition-duration
			ariaHideApp={false}
		>
			<PackageChooserInner
				onPackageChosen={onPackageChosen}
				checkDisabled={checkDisabled}
			/>
		</Modal>
	);
}

function PackageChooserInner({
	onPackageChosen,
	checkDisabled,
}: {
	onPackageChosen: (pkg: WXApplicationInfo) => void;
	checkDisabled: (pkg: WXApplicationInfo) => boolean;
}) {
	const [packages, _setPackages] = useState(() => getInstalledPackages());
	const [searchString, setSearchString] = useState("");

	const isSearchMatch = (string: string | null) =>
		string != null &&
		string
			.toLowerCase()
			.replace(/\s|-/g, "")
			.indexOf(searchString.toLowerCase().replace(/\s|-/g, "")) != -1;

	return (
		<div className="p-4">
			<div className="sticky top-0 bg-primary-background py-2 flex flex-col">
				<h2 className="text-2xl text-center pb-4">Choose a package</h2>
				<input
					className="bg-indigo-950 p-4 rounded-lg border-2 border-indigo-600"
					placeholder="Search"
					value={searchString}
					onChange={(e) => setSearchString(e.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-2">
				{packages
					.filter(
						(pkg) =>
							searchString.length == 0 ||
							isSearchMatch(pkg.getName()) ||
							isSearchMatch(pkg.getPackageName()),
					)
					.map((pkg) => (
						<PackageListItem
							key={pkg.getPackageName()}
							pkg={pkg}
							onPackageChosen={onPackageChosen}
							disabled={checkDisabled(pkg)}
						/>
					))}
			</div>
		</div>
	);
}

function PackageListItem({
	pkg,
	onPackageChosen,
	disabled,
}: {
	pkg: WXApplicationInfo;
	onPackageChosen: (pkg: WXApplicationInfo) => void;
	disabled: boolean;
}) {
	return (
		<button
			className={
				"p-2 rounded-lg flex justify-between items-baseline items-baseline-last flex-wrap bg-secondary-background cursor-pointer disabled:bg-secondary-background-disabled disabled:cursor-not-allowed"
			}
			disabled={disabled}
			onClick={() => onPackageChosen(pkg)}
		>
			<div className="flex gap-2 items-center">
				<PackageIconLazy
					name={pkg.getName()}
					packageName={pkg.getPackageName()}
				/>
				<h2 className="text-2xl">{pkg.getName()}</h2>
			</div>
			<div className="font-mono">{pkg.getPackageName()}</div>
		</button>
	);
}

function PackageIconLazy({
	name,
	packageName,
}: {
	name: string | null;
	packageName: string;
}) {
	const [iconUrl, setIconUrl] = useState<null | string>(null);
	const wrapperRef = useRef(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					observer.disconnect();

					async function loadIcon() {
						try {
							const iconStream =
								window.$packageManager.getApplicationIcon(packageName);
							const arrayBuffer = await wrapInputStream(iconStream).then((r) =>
								r.arrayBuffer(),
							);

							const blob = new Blob([arrayBuffer], { type: "image/png" });
							const url = URL.createObjectURL(blob);

							setIconUrl(url);
						} catch (error) {
							console.error("Icon load failed:", error);
						}
					}

					if (packageName == "bar") {
						setTimeout(() => {
							setIconUrl(
								"https://upload.wikimedia.org/wikipedia/commons/6/64/Android_logo_2019_%28stacked%29.svg",
							);
						}, 500);
					}
					if (!MOCK) loadIcon();
				}
			},
			{ rootMargin: "200px" },
		);

		// Start observing if ref exists
		if (wrapperRef.current) {
			observer.observe(wrapperRef.current);
		}

		// Cleanup
		return () => {
			if (wrapperRef.current) {
				observer.unobserve(wrapperRef.current);
			}
		};
	}, [packageName]);

	// Render placeholder or actual icon
	return (
		<div ref={wrapperRef} className="package-icon-container">
			{iconUrl ? (
				<img
					src={iconUrl}
					alt={`Icon for ${name ?? packageName}`}
					className="package-icon"
				/>
			) : (
				<div className="icon-placeholder">
					{/* Optional: show package name initial or generic icon */}
					{(name ?? packageName).charAt(0)}
				</div>
			)}
		</div>
	);
}
