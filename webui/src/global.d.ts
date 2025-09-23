// TODO: contribute upstream

import "webuix/global.ts";

import {
	IntentInterface,
	PackageManagerInterface as OriginalPackageManagerInterface,
	UserManagerInterface,
} from "webuix";

interface PackageManagerInterface extends OriginalPackageManagerInterface {
	// Redefine with overloads
	getInstalledPackages(flags: number, userId: number): string;
	getInstalledPackages(flags: number): string;
	getInstalledPackages(): string;

	getApplicationInfo(
		packageName: string,
		flags: number,
		userId: number,
	): WXApplicationInfo;
	getApplicationInfo(packageName: string, flags: number): WXApplicationInfo;
	getApplicationInfo(packageName: string): WXApplicationInfo;

	getApplicationIcon(
		packageName: string,
		flags: number,
		userId: number,
	): FileInputInterfaceStream | null;
	getApplicationIcon(
		packageName: string,
		flags: number,
	): FileInputInterfaceStream | null;
	getApplicationIcon(packageName: string): FileInputInterfaceStream | null;
}

declare global {
	interface Window {
		[`$packageManager`]: PackageManagerInterface;
		[`$intent`]: IntentInterface;
		[`$userManager`]: UserManagerInterface;
	}
}
