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
        // Request the rear (environment-facing) camera when available,
        // and a higher resolution so dense QR codes have more pixels.
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
        });
        video.srcObject = stream;
        await video.play();
        return stream;
    } catch (e) {
        console.error("[qr] getUserMedia error", e);
        return null;
    }
};

//
// Decode a QR code from raw RGBA pixel data.
// jsQR expects RGBA data of exactly width*height*4 bytes, and
// returns the decoded string on the `data` property.
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
        { inversionAttempts: "attemptBoth" },
    );
    return code?.data ?? null;
};

//
// Draw the current video frame to a canvas and try to decode a QR.
// Tries the native resolution first, then a downscaled version,
// since jsQR can be sensitive to very large or very small images.
//
export const captureAndDecodeQr = (
    video: HTMLVideoElement,
    stream: MediaStream | null,
): string | null => {
    const { width, height } = getVideoDimensions(video, stream);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

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
// Continuously scan the camera feed for a QR code, calling
// onDetect with the decoded text as soon as one is found.
// Throttled to ~5fps to avoid burning CPU. Returns a stop function.
//
export const scanForQr = (
    video: HTMLVideoElement,
    stream: MediaStream | null,
    onDetect: (text: string) => void,
): () => void => {
    let stopped = false;
    let lastAttempt = 0;

    const tick = () => {
        if (stopped) return;

        const now = Date.now();
        if (now - lastAttempt >= 200) {
            lastAttempt = now;
            const text = captureAndDecodeQr(video, stream);
            if (text) {
                onDetect(text);
                return;
            }
        }

        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return () => {
        stopped = true;
    };
};