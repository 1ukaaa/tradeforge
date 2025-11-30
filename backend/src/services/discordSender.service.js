const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("buffer");

const sendToDiscord = async (webhookUrl, payload) => {
    const form = new FormData();

    // 1. Handle Images (Base64 -> Attachments)
    if (payload.embeds && Array.isArray(payload.embeds)) {
        payload.embeds = payload.embeds.map((embed, index) => {
            if (embed.image && embed.image.url && embed.image.url.startsWith("data:image")) {
                // Extract Base64
                const matches = embed.image.url.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const buffer = Buffer.from(matches[2], "base64");
                    const ext = mimeType.split("/")[1];
                    const filename = `image_${index}.${ext}`;

                    // Append to form
                    form.append(`files[${index}]`, buffer, { filename, contentType: mimeType });

                    // Update embed to point to attachment
                    return {
                        ...embed,
                        image: { url: `attachment://${filename}` }
                    };
                }
            }
            return embed;
        });
    }

    // 2. Append JSON Payload
    form.append('payload_json', JSON.stringify(payload));

    // 3. Send Request
    const response = await axios.post(`${webhookUrl}?wait=true`, form, {
        headers: {
            ...form.getHeaders(),
        },
        timeout: 15000,
    });

    return response.data;
};

module.exports = { sendToDiscord };
