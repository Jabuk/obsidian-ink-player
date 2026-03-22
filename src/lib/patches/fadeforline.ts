import { create } from "zustand";
import createSelectors from "@/lib/utils/createSelectors";
import { Patches, InkStory } from "@/lib/ink";
import { useContents } from "@/hooks/story";

declare module "@/lib/ink" {
	interface InkStory {
		visibleLines: number;
		choicesCanShow: boolean;
	}
}

const options = {
	linedelay: 0.2,
};

type ContentComplete = {
	contentComplete: boolean;
	last_content: string;
	setContentComplete: (contentComplete: boolean) => void;
	setLastContent: (contents: string[]) => void;
};
const useContentComplete = create<ContentComplete>((set) => ({
	contentComplete: true,
	last_content: "",
	setContentComplete: (contentComplete) => set({ contentComplete }),
	setLastContent: (contents) => {
		if (contents.length === 0) {
			set({ last_content: "" });
			return;
		}
		const last_content = contents[contents.length - 1];
		set({ last_content });
	},
}));

const load = () => {
	Patches.add(function () {
		const originalChoose = this.choose;
		this.choose = function (index: number) {
			if (this.options.linedelay != 0) {
				useContentComplete.getState().setContentComplete(false);
				useContentComplete.getState().setLastContent(this.contents);
			}
			return originalChoose.call(this, index);
		};
		Object.defineProperty(this, "visibleLines", {
			get() {
				const last_content = useContentComplete.getState().last_content;
				return this.contents.lastIndexOf(last_content);
			},
		});
		Object.defineProperty(this, "choicesCanShow", {
			get() {
				return createSelectors(useContentComplete).use.contentComplete();
			},
		});

		let timer: ReturnType<typeof setTimeout> | null = null;
		const unsub = useContents.subscribe(() => {
			if (this.options.linedelay == 0) return;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				useContentComplete.getState().setContentComplete(true);
			}, (this.contents.length - this.visibleLines) * this.options.linedelay * 1000);
		});

		this.cleanups.push(() => {
			unsub();
			if (timer) clearTimeout(timer);
		});
		this.clears.push(() => {
			if (this.options.linedelay != 0)
				useContentComplete.getState().setContentComplete(false);
			useContentComplete.getState().setLastContent([]);
		});
	}, options);
};

export default load;
