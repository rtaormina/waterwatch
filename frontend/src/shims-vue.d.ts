// frontend/src/shims-vue.d.ts
declare module "*.vue" {
    import type { DefineComponent } from "vue";

    // Props: any object
    // Emits: any object (you can narrow this if you list specific events)
    // Slots/attrs: unknown
    const component: DefineComponent<
        object, // instead of `{}` for props
        object, // instead of `{}` for emits
        unknown // instead of `any` for slots/attrs
    >;

    export default component;
}
