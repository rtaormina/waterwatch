import { createI18n } from "vue-i18n";

const messages = {
    en: {
        Introduction: {
            title: "Introduction",
            text:
                "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam, voluptatibus" +
                "nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam tempore dolorem." +
                "Enim, et qui. Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam," +
                " voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam" +
                " tempore dolorem. Enim, et qui.",
        },
    },
    nl: {
        Introduction: {
            title: "Introductie",
            text:
                "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam, voluptatibus" +
                "nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam tempore dolorem." +
                "Enim, et qui. Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam," +
                " voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam" +
                " tempore dolorem. Enim, et qui.",
        },
    },
};

export const i18n = createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    messages,
});
