// Mouse functions
let leftMouseDown = false;
let rightMouseDown = false;
let cursorX, cursorY, prevCursorX, prevCursorY;
let resizingRect = null;
const resizeMargin = 10; // Margin around the rectangle to detect resizing

function isInResizeZone(rect, x, y) {
    const handleRadius = rect.radius / 2;
    const handleCenterX = rect.x + rect.width - rect.radius;
    const handleCenterY = rect.y + rect.height - rect.radius;
    const distance = Math.sqrt(Math.pow(x - handleCenterX, 2) + Math.pow(y - handleCenterY, 2));
    return distance <= handleRadius;
}

function onMouseDown(event) {
    cursorX = event.pageX;
    cursorY = event.pageY;
    prevCursorX = event.pageX;
    prevCursorY = event.pageY;

    // Check if the click is within the resize zone of any rectangle
    for (const rect of rectangles) {
        const trueX = toTrueX(cursorX);
        const trueY = toTrueY(cursorY);
        if (isInResizeZone(rect, trueX, trueY)) {
            resizingRect = rect;
            leftMouseDown = true;
            return;
        }
    }

    // Check if the click is within any rectangle
    for (const rect of rectangles) {
        const trueX = toTrueX(cursorX);
        const trueY = toTrueY(cursorY);
        if (trueX > rect.x && trueX < rect.x + rect.width && trueY > rect.y && trueY < rect.y + rect.height) {
            selectedRect = rect;
            leftMouseDown = true;
            return;
        }
    }

    // Detect right clicks
    if (event.button == 2) {
        rightMouseDown = true;
        leftMouseDown = false;
    }
}

function onMouseMove(event) {
    // Get mouse position
    cursorX = event.pageX;
    cursorY = event.pageY;
    const scaledX = toTrueX(cursorX);
    const scaledY = toTrueY(cursorY);
    const prevScaledX = toTrueX(prevCursorX);
    const prevScaledY = toTrueY(prevCursorY);

    if (leftMouseDown && resizingRect) {
        // Resize the selected rectangle
        resizingRect.width += scaledX - prevScaledX;
        resizingRect.height += scaledY - prevScaledY;
        redrawCanvas();
    } else if (leftMouseDown && selectedRect) {
        // Move the selected rectangle
        selectedRect.x += scaledX - prevScaledX;
        selectedRect.y += scaledY - prevScaledY;
        redrawCanvas();
    } else if (rightMouseDown) {
        // Move the screen
        offsetX += (cursorX - prevCursorX) / scale;
        offsetY += (cursorY - prevCursorY) / scale;
        redrawCanvas();
    }
    prevCursorX = cursorX;
    prevCursorY = cursorY;
}

function onMouseUp() {
    leftMouseDown = false;
    rightMouseDown = false;
    selectedRect = null;
    resizingRect = null;
}

function onMouseWheel(event) {
    const deltaY = event.deltaY;
    const scaleAmount = -deltaY / 500;
    scale = scale * (1 + scaleAmount);

    // Zoom the page based on where the cursor is
    var distX = event.pageX / canvas.clientWidth;
    var distY = event.pageY / canvas.clientHeight;

    // Calculate how much we need to zoom
    const unitsZoomedX = trueWidth() * scaleAmount;
    const unitsZoomedY = trueHeight() * scaleAmount;

    const unitsAddLeft = unitsZoomedX * distX;
    const unitsAddTop = unitsZoomedY * distY;

    offsetX -= unitsAddLeft;
    offsetY -= unitsAddTop;

    redrawCanvas();
}

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', onMouseMove, false);
canvas.addEventListener('wheel', onMouseWheel, false);
