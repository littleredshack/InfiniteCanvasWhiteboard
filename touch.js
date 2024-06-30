// Touch functions
const prevTouches = [null, null]; // Up to 2 touches
let singleTouch = false;
let doubleTouch = false;

function onTouchStart(event) {
    if (event.touches.length == 1) {
        singleTouch = true;
        doubleTouch = false;

        // Check if the touch is within any rectangle
        for (const rect of rectangles) {
            const trueX = toTrueX(event.touches[0].pageX);
            const trueY = toTrueY(event.touches[0].pageY);
            if (trueX > rect.x && trueX < rect.x + rect.width && trueY > rect.y && trueY < rect.y + rect.height) {
                selectedRect = rect;
                return;
            }
        }
    }
    if (event.touches.length >= 2) {
        singleTouch = false;
        doubleTouch = true;
    }

    // Store the last touches
    prevTouches[0] = event.touches[0];
    prevTouches[1] = event.touches[1];
}

function onTouchMove(event) {
    // Get first touch coordinates
    const touch0X = event.touches[0].pageX;
    const touch0Y = event.touches[0].pageY;
    const prevTouch0X = prevTouches[0].pageX;
    const prevTouch0Y = prevTouches[0].pageY;

    const scaledX = toTrueX(touch0X);
    const scaledY = toTrueY(touch0Y);
    const prevScaledX = toTrueX(prevTouch0X);
    const prevScaledY = toTrueY(prevTouch0Y);

    if (singleTouch && selectedRect) {
        // Move the selected rectangle
        selectedRect.x += scaledX - prevScaledX;
        selectedRect.y += scaledY - prevScaledY;
        redrawCanvas();
    }

    if (doubleTouch) {
        // Get second touch coordinates
        const touch1X = event.touches[1].pageX;
        const touch1Y = event.touches[1].pageY;
        const prevTouch1X = prevTouches[1].pageX;
        const prevTouch1Y = prevTouches[1].pageY;

        // Get midpoints
        const midX = (touch0X + touch1X) / 2;
        const midY = (touch0Y + touch1Y) / 2;
        const prevMidX = (prevTouch0X + prevTouch1X) / 2;
        const prevMidY = (prevTouch0Y + prevTouch1Y) / 2;

        // Calculate the distances between the touches
        const hypot = Math.sqrt(Math.pow((touch0X - touch1X), 2) + Math.pow((touch0Y - touch1Y), 2));
        const prevHypot = Math.sqrt(Math.pow((prevTouch0X - prevTouch1X), 2) + Math.pow((prevTouch0Y - prevTouch1Y), 2));

        // Calculate the screen scale change
        var zoomAmount = hypot / prevHypot;
        scale = scale * zoomAmount;
        const scaleAmount = 1 - zoomAmount;

        // Calculate how many pixels the midpoints have moved in the x and y direction
        const panX = midX - prevMidX;
        const panY = midY - prevMidY;
        // Scale this movement based on the zoom level
        offsetX += (panX / scale);
        offsetY += (panY / scale);

        // Get the relative position of the middle of the zoom.
        // 0, 0 would be top left. 
        // 0, 1 would be top right etc.
        var zoomRatioX = midX / canvas.clientWidth;
        var zoomRatioY = midY / canvas.clientHeight;

        // Calculate the amounts zoomed from each edge of the screen
        const unitsZoomedX = trueWidth() * scaleAmount;
        const unitsZoomedY = trueHeight() * scaleAmount;

        const unitsAddLeft = unitsZoomedX * zoomRatioX;
        const unitsAddTop = unitsZoomedY * zoomRatioY;

        offsetX += unitsAddLeft;
        offsetY += unitsAddTop;

        redrawCanvas();
    }
    prevTouches[0] = event.touches[0];
    prevTouches[1] = event.touches[1];
}

function onTouchEnd(event) {
    singleTouch = false;
    doubleTouch = false;
    selectedRect = null;
}

canvas.addEventListener('touchstart', onTouchStart);
canvas.addEventListener('touchend', onTouchEnd);
canvas.addEventListener('touchcancel', onTouchEnd);
canvas.addEventListener('touchmove', onTouchMove);
