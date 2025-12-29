
export const sendMessageToBot = async (webhookUrl: string, title: string, content: string) => {
    if (!webhookUrl) return { success: false, error: 'Webhook URL missing' };

    const isDingTalk = webhookUrl.includes('dingtalk.com');
    const isFeishu = webhookUrl.includes('feishu.cn') || webhookUrl.includes('larksuite.com');

    // 探行专用安全关键字（钉钉必须匹配关键字才能发送）
    const keyword = "探行 ERP";
    const fullTitle = `${keyword} | ${title}`;

    if (isFeishu) {
        const payload = {
            msg_type: "post",
            content: {
                post: {
                    zh_cn: {
                        title: `🚀 ${fullTitle}`,
                        content: [[{ tag: "text", text: content }]]
                    }
                }
            }
        };
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return { success: response.ok };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    if (isDingTalk) {
        const payload = {
            msgtype: "markdown",
            markdown: {
                title: fullTitle,
                text: `### ${fullTitle}\n---\n${content.replace(/\n/g, '\n\n')}`
            }
        };
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return { success: response.ok };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    return { success: false, error: 'Unsupported Webhook platform' };
};

// Added sendFeishuMessage alias to fix import errors in Settings.tsx and Tracking.tsx
export const sendFeishuMessage = sendMessageToBot;
