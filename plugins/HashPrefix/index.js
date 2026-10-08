import { before } from "@revenge-mod/patcher";
import { findByProps } from "@revenge-mod/modules";
import { plugin } from "@revenge-mod/plugins";

interface Settings {
    enableHash: boolean;
    enableMentions: boolean;
    icons: string;
    iconChance: number;
}

const defaultSettings: Settings = {
    enableHash: true,
    enableMentions: true,
    icons: "😭, 😂, 🤣, 🥺, 🤔",
    iconChance: 30,
};

function getRandomIcon(settings: Settings): string {
    const chance = Math.max(
        0,
        Math.min(100, Number(settings.iconChance) || 0)
    );

    if (Math.random() * 100 >= chance) {
        return "";
    }

    const icons = settings.icons
        .split(",")
        .map(icon => icon.trim())
        .filter(Boolean);

    if (icons.length === 0) {
        return "";
    }

    return " " + icons[Math.floor(Math.random() * icons.length)];
}

export default plugin({
    name: "HotTypingZeisu",
    description:
        "Adds a customizable # prefix, automatic mentions and random icons.",

    authors: [
        {
            name: "zeisu",
            id: "0",
        },
    ],

    jsonStorage: {
        load: true,
        default: defaultSettings,
        file: "storage.json",
    },

    start({ jsonStorage, cleanup }) {
        const MessageActions = findByProps("sendMessage");

        if (!MessageActions?.sendMessage) {
            return;
        }

        let targetUserIds: string[] = [];

        cleanup(
            before(MessageActions, "sendMessage", (args) => {
                const message = args?.[1];

                if (!message?.content) {
                    return args;
                }

                const settings = jsonStorage.cache ?? defaultSettings;
                const content = message.content;

                const prefix = settings.enableHash ? "# " : "";

                // Auto Mentions OFF
                if (!settings.enableMentions) {
                    message.content =
                        prefix +
                        content +
                        getRandomIcon(settings);

                    return args;
                }

                // Find mentions
                const mentions = [
                    ...content.matchAll(/<@!?(\d+)>/g),
                ];

                // New mentions
                if (mentions.length > 0) {
                    targetUserIds = [
                        ...new Set(
                            mentions.map(match => match[1])
                        ),
                    ];

                    const cleanContent = content
                        .replace(/<@!?\d+>/g, "")
                        .replace(/\s+/g, " ")
                        .trim();

                    const targets = targetUserIds
                        .map(id => `<@${id}>`)
                        .join(" ");

                    message.content =
                        prefix +
                        cleanContent +
                        " " +
                        targets +
                        getRandomIcon(settings);

                    return args;
                }

                // Remembered mentions
                if (targetUserIds.length > 0) {
                    const targets = targetUserIds
                        .map(id => `<@${id}>`)
                        .join(" ");

                    message.content =
                        prefix +
                        content +
                        " " +
                        targets +
                        getRandomIcon(settings);

                    return args;
                }

                // Normal message
                message.content =
                    prefix +
                    content +
                    getRandomIcon(settings);

                return args;
            })
        );
    },

    SettingsComponent({ api }) {
        const settings =
            api.jsonStorage.use() ?? defaultSettings;

        const update = (changes: Partial<Settings>) => {
            api.jsonStorage.set(changes);
        };

        const { View, Text, Switch, TextInput } =
            api.unscoped.react.native;

        return (
            <View
                style={{
                    padding: 16,
                    gap: 16,
                }}
            >
                <View>
                    <Text>Enable #</Text>

                    <Switch
                        value={settings.enableHash}
                        onValueChange={value =>
                            update({
                                enableHash: value,
                            })
                        }
                    />
                </View>

                <View>
                    <Text>Auto Mentions</Text>

                    <Switch
                        value={settings.enableMentions}
                        onValueChange={value =>
                            update({
                                enableMentions: value,
                            })
                        }
                    />
                </View>

                <View>
                    <Text>Icons</Text>

                    <TextInput
                        value={settings.icons}
                        onChangeText={value =>
                            update({
                                icons: value,
                            })
                        }
                        placeholder="😭, 😂, 🤣, 🥺, 🤔"
                    />
                </View>

                <View>
                    <Text>Icon Chance (%)</Text>

                    <TextInput
                        value={String(settings.iconChance)}
                        keyboardType="numeric"
                        onChangeText={value => {
                            const number = Math.max(
                                0,
                                Math.min(
                                    100,
                                    Number(value) || 0
                                )
                            );

                            update({
                                iconChance: number,
                            });
                        }}
                    />
                </View>
            </View>
        );
    },
});
