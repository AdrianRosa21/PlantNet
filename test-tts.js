const { MsEdgeTTS, OUTPUT_FORMAT } = require("edge-tts-node");

async function test() {
  try {
    const tts = new MsEdgeTTS({});
    await tts.setMetadata("es-MX-DaliaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const readable = tts.toStream("Hola probando la conexión");

    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      readable.on("data", (data) => chunks.push(data));
      readable.on("close", () => resolve(Buffer.concat(chunks)));
      readable.on("error", reject);
    });
    console.log("Success! Buffer size:", buffer.length);
  } catch (e) {
    console.error("Error catched:", e);
  }
}
test();
