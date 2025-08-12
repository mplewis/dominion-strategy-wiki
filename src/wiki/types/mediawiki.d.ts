// MediaWiki global object type definitions
/// <reference types="jquery" />

declare global {
	interface Window {
		mw: MediaWikiGlobal;
		$: JQueryStatic;
	}

	const mw: MediaWikiGlobal;
	const $: JQueryStatic;
}

interface MediaWikiGlobal {
	config: MediaWikiConfig;
}

interface MediaWikiConfig {
	values: {
		wgArticlePath: string;
		[key: string]: string | number | boolean | null;
	};
}

export {};
