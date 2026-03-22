import { ItemView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { createElement } from "react";
import { Root, createRoot } from "react-dom/client";
import { Ink } from "@/components";
import { useFile, useStory } from "@/hooks";
import { compiledStory } from "@/lib/markdown2story";

export const INK_STORY_VIEW = "Ink Story View";

export class InkStoryView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return INK_STORY_VIEW;
	}

	getDisplayText() {
		const filePath = useFile.getState().filePath;
		if (!filePath) return "Ink Player";
		return filePath.split("/").pop()?.replace(/\.ink$/i, "") ?? "Ink Player";
	}

	getState() {
		return { filePath: useFile.getState().filePath };
	}

	async setState(state: { filePath?: string }, result: ViewStateResult) {
		const filePath = state?.filePath;
		if (filePath && filePath !== useFile.getState().filePath) {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				const { vault } = this.app;
				const markdown = await vault.read(file);
				const resourcePath = vault.adapter
					.getResourcePath(filePath)
					.split("/")
					.slice(0, -1)
					.join("/");
				useFile.getState().init(filePath, markdown, resourcePath);
				compiledStory();
				this.leaf.updateHeader();
			}
		}
		await super.setState(state, result);
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.root.render(createElement(Ink));
	}

	async onClose() {
		const ink = useStory.getState().ink;
		if (ink) {
			try {
				const save: Record<string, unknown> = { state: ink.story.state.toJson() };
				ink.save_label.forEach((label) => {
					if (label in ink && typeof ink[label as keyof typeof ink] !== "undefined")
						save[label] = ink[label as keyof typeof ink];
				});
				localStorage.setItem(`ink-session-${ink.title}`, JSON.stringify(save));
			} catch (_) {}
			ink.dispose();
		}
	}
}
