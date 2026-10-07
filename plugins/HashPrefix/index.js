(() => {
    const { patcher, metro } = vendetta;

    const MessageActions = metro.findByProps("sendMessage");

    if (!MessageActions?.sendMessage) return;

    patcher.before("sendMessage", MessageActions, (args) => {
        const message = args?.[1];

        if (!message?.content) return;

        const content = message.content;

        if (content.startsWith("# ")) return;

        if (content.startsWith("#")) {
            message.content = "# " + content.slice(1).replace(/^ +/, "");
        } else {
            message.content = "# " + content;
        }
    });
})();
