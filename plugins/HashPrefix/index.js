(() => {
    const { patcher, metro } = vendetta;

    const MessageActions = metro.findByProps("sendMessage");

    if (!MessageActions?.sendMessage) return;

    patcher.before("sendMessage", MessageActions, (args) => {
        const message = args?.[1];

        if (!message?.content) return;

        const content = message.content;

        // Đã có "# " thì không thêm nữa
        if (content.startsWith("# ")) return;

        // Có "#" nhưng thiếu khoảng trắng
        if (content.startsWith("#")) {
            message.content = "# " + content.slice(1).replace(/^ +/, "");
            return;
        }

        // Bình thường → thêm "# "
        message.content = "# " + content;
    });
})();
