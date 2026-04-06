import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return new NextResponse('No text provided', { status: 400 });
    }

    // Limpiar caracteres markdown
    const cleanText = text.replace(/[*#_]/g, '');
    
    // Dividir en trozos seguros (menor al limite de 200 de Google)
    const chunks = cleanText.match(/.{1,180}(?:[.,\n\s]|$)/g) || [cleanText];
    const buffers: Uint8Array[] = [];

    // Bajar los mp3 de a trozos y secuencialmente
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      
      const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=es-US&q=${encodeURIComponent(chunk.trim())}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        buffers.push(new Uint8Array(arrayBuffer));
      } else {
        console.warn(`Chunk failed: ${response.status} ${response.statusText}`);
      }
    }

    if (buffers.length === 0) {
      return new NextResponse('Failed to generate audio', { status: 500 });
    }

    // Concatenate Uint8Array fragments into one continuous MP3 buffer
    const totalLength = buffers.reduce((acc, val) => acc + val.length, 0);
    const joinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      joinedBuffer.set(buf, offset);
      offset += buf.length;
    }

    return new NextResponse(joinedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error("Google TTS Proxy Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
