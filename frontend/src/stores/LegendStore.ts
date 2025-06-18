import { defineStore } from "pinia";

export const useLegendStore = defineStore("legend", {
    /**
     * Store to save the state of the legend component.
     */
    state: () => ({
        scale: [0, 40] as [number, number],
        colorByTemp: true as boolean,
    }),
});
