import { useChoices } from "@/hooks/story";
import { Patches } from "@/lib/ink";

const load = () => {
	Patches.add(function () {
		const unsub = useChoices.subscribe(() => {
			setTimeout(() => {
				const lastButton = document.querySelector(
					"ul#ink-choices > li:last-child"
				) as HTMLElement;
				if (lastButton) {
					const element = document.querySelector(
						"#ink-story"
					) as HTMLElement;
					element?.scrollTo({
						top: lastButton.offsetTop,
						behavior: "smooth",
					});
				}
			}, 0);
		});
		this.cleanups.push(unsub);
	}, {});
};

export default load;
