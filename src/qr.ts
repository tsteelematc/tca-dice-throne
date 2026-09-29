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
        return null;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
        });
        video.srcObject = stream;
        await video.play();
        return stream;
    } catch {
        return null;
    }
};

export const decodeQrFromVideo = (
    video: HTMLVideoElement,
): string | null => {
    const canvas = document.createElement("canvas");
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) {
        return null;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(
        0,
        0,
        width,
        height,
    );
    const code = jsQR(
        imageData.data,
        width,
        height,
    );
    return code?.text ?? null;
};