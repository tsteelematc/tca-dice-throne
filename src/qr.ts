import jsQR from "jsqr";

//
// QR camera scanning helpers...
//

export type ScanResult = {
    text: string;
} | null;

export const stopVideoStream = (
    stream: MediaStream | null,
) => {
    stream?.getTracks().forEach(
        track => track.stop()
    );
};

export const startCameraScan = async (
    video: HTMLVideoElement,
): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
        console.error("[qr] getUserMedia not available");
        return null;
    }
    try {
        // Request a higher resolution so dense QR codes have more pixels.
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
        });
        console.log("[qr] got stream", stream);
        video.srcObject = stream;
        await video.play();
        console.log("[qr] video playing, dims:", video.videoWidth, video.videoHeight);
        return stream;
    } catch (e) {
        console.error("[qr] getUserMedia error", e);
        return null;
    }
};

//
// Decode a QR code from raw RGBA pixel data.
// jsQR expects RGBA data of exactly width*height*4 bytes.
//
const decodeQrFromPixels = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
): string | null => {
    // Guard: jsQR throws "Malformed data" if the array length
    // doesn't match width*height*4. Bail out instead of crashing.
    if (data.length !== width * height * 4) {
        return null;
    }
    const code = jsQR(
        data,
        width,
        height,
    );
    return (code as any)?.text ?? null;
};

//
// Draw the current video frame to a canvas and try to decode a QR.
// jsQR expects raw RGBA data, so we pass getImageData's output
// directly. Tries multiple scales since jsQR can be size-sensitive.
//
const decodeFrame = (
    video: HTMLVideoElement,
    width: number,
    height: number,
): string | null => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    // Diagnostic: confirm the decode loop is running and data shape.
    console.log(
        `[qr] decode attempt ${width}x${height}, dataLen=${imageData.data.length}, expected=${width * height * 4}`
    );

    // Try native resolution.
    const text = decodeQrFromPixels(imageData.data, width, height);
    if (text) {
        return text;
    }

    // Try a downscaled version (max 640 wide) — often more reliable for jsQR.
    const scale = Math.min(1, 640 / width);
    if (scale < 1) {
        const sw = Math.round(width * scale);
        const sh = Math.round(height * scale);
        const small = document.createElement("canvas");
        small.width = sw;
        small.height = sh;
        const sctx = small.getContext("2d");
        if (sctx) {
            sctx.drawImage(video, 0, 0, sw, sh);
            const smallData = sctx.getImageData(0, 0, sw, sh);
            const smallText = decodeQrFromPixels(smallData.data, sw, sh);
            if (smallText) {
                return smallText;
            }
        }
    }

    return null;
};

//
// Resolve frame dimensions from the video element, falling back
// to the stream's video track settings, then to a default size.
//
const getVideoDimensions = (
    video: HTMLVideoElement,
    stream: MediaStream | null,
): { width: number, height: number } => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        return { width: video.videoWidth, height: video.videoHeight };
    }
    const track = stream?.getVideoTracks()[0];
    const settings = track?.getSettings();
    if (settings?.width && settings?.height) {
        return { width: settings.width, height: settings.height };
    }
    return { width: 640, height: 480 };
};

//
// Continuously scan the video feed for a QR code by drawing the
// <video> element to a canvas and decoding with jsQR. Calls
// onDetect as soon as a QR is found. Returns a stop function.
//
export const scanForQr = (
    video: HTMLVideoElement,
    stream: MediaStream | null,
    onDetect: (text: string) => void,
    onStatus?: (status: string) => void,
): () => void => {
    let stopped = false;
    let lastDecode = 0;
    let statusReported = false;

    const report = (msg: string) => {
        if (!statusReported) {
            statusReported = true;
            onStatus?.(msg);
        }
    };

    const tick = () => {
        if (stopped) return;

        const now = Date.now();
        if (now - lastDecode >= 200) {
            lastDecode = now;

            const { width, height } = getVideoDimensions(video, stream);
            const text = decodeFrame(video, width, height);
            if (text) {
                onDetect(text);
                return;
            }
            report(`Scanning at ${width}x${height} — hold the QR code steady...`);
        }

        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return () => {
        stopped = true;
    };
};