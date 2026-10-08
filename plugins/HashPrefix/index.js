(() => {
    const { patcher, metro, storage } = vendetta;

    const MessageActions = metro.findByProps("sendMessage");

    if (!MessageActions?.sendMessage) return;

    const STORAGE_KEY = "HotTypingZeisu";

    const defaultConfig = {
        enableHash: true,
        enableMentions: true,
        icons: "😭, 😂, 🤣, 🥺, 🤔",
        iconChance: 30
    };

    let config = { ...defaultConfig };
    let targetUserIds = [];

    // ================================
    // LOAD / SAVE CONFIG
    // ================================

    async function loadConfig() {
        try {
            const saved = await storage.get(STORAGE_KEY);

            if (saved) {
                config = {
                    ...defaultConfig,
                    ...saved
                };
            }
        } catch (_) {}
    }

    async function saveConfig() {
        try {
            await storage.set(STORAGE_KEY, config);
        } catch (_) {}
    }

    loadConfig();

    // ================================
    // RANDOM ICON
    // ================================

    function getRandomIcon() {
        const chance = Math.max(
            0,
            Math.min(100, Number(config.iconChance) || 0)
        );

        if (Math.random() * 100 >= chance) {
            return "";
        }

        const iconList = String(config.icons || "")
            .split(",")
            .map(icon => icon.trim())
            .filter(Boolean);

        if (iconList.length === 0) {
            return "";
        }

        const icon =
            iconList[Math.floor(Math.random() * iconList.length)];

        return " " + icon;
    }

    // ================================
    // BUILD MESSAGE
    // ================================

    function buildMessage(content, targets = "") {
        const prefix = config.enableHash ? "# " : "";

        return (
            prefix +
            content +
            (targets ? " " + targets : "") +
            getRandomIcon()
        );
    }

    // ================================
    // SEND MESSAGE PATCH
    // ================================

    patcher.before("sendMessage", MessageActions, (args) => {
        const message = args?.[1];

        if (!message?.content) return;

        const content = message.content;

        // --------------------------------
        // MENTION SYSTEM OFF
        // --------------------------------

        if (!config.enableMentions) {
            message.content = buildMessage(content);
            return;
        }

        // --------------------------------
        // FIND MENTIONS
        // --------------------------------

        const mentions = [
            ...content.matchAll(/<@!?(\d+)>/g)
        ];

        // --------------------------------
        // NEW MENTIONS
        // --------------------------------

        if (mentions.length > 0) {
            targetUserIds = [
                ...new Set(
                    mentions.map(match => match[1])
                )
            ];

            // Remove mentions from original position
            const cleanContent = content
                .replace(/<@!?\d+>/g, "")
                .replace(/\s+/g, " ")
                .trim();

            // Move mentions to the end
            const targets = targetUserIds
                .map(id => `<@${id}>`)
                .join(" ");

            message.content = buildMessage(
                cleanContent,
                targets
            );

            return;
        }

        // --------------------------------
        // AUTO MENTION SAVED TARGETS
        // --------------------------------

        if (targetUserIds.length > 0) {
            const targets = targetUserIds
                .map(id => `<@${id}>`)
                .join(" ");

            message.content = buildMessage(
                content,
                targets
            );

            return;
        }

        // --------------------------------
        // NORMAL MESSAGE
        // --------------------------------

        message.content = buildMessage(content);
    });

    // ================================
    // SETTINGS API
    // ================================

    async function setConfig(key, value) {
        config[key] = value;
        await saveConfig();
    }

    // Expose config for Revenge settings/UI
    globalThis.HotTypingZeisu = {
        getConfig: () => ({ ...config }),

        setEnableHash: value =>
            setConfig("enableHash", Boolean(value)),

        setEnableMentions: value =>
            setConfig("enableMentions", Boolean(value)),

        setIcons: value =>
            setConfig("icons", String(value)),

        setIconChance: value =>
            setConfig(
                "iconChance",
                Math.max(
                    0,
                    Math.min(100, Number(value) || 0)
                )
            )
    };
})();
