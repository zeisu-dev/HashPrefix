(() => {
    const { patcher, metro } = vendetta;

    const MessageActions = metro.findByProps("sendMessage");

    if (!MessageActions?.sendMessage) return;

    const TARGET_USER_ID = "1342058450829447211";

    patcher.before("sendMessage", MessageActions, (args) => {
        const message = args?.[1];

        if (!message?.content) return;

        const content = message.content;

        message.content = `# <@${TARGET_USER_ID}> ${content}`;

        message.mentions = [
            ...(message.mentions || []),
            {
                id: String(TARGET_USER_ID)
            }
        ];
    });
})();
