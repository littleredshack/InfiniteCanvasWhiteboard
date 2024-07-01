// Mouse functions
let leftMouseDown = false;
let rightMouseDown = false;
let cursorX, cursorY, prevCursorX, prevCursorY;
let resizingRect = null;
let resizingChild = null;
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

    const trueX = toTrueX(cursorX);
    const trueY = toTrueY(cursorY);

    // Check if the click is within the resize zone of any child node first
    for (const rect of rectangles) {
        for (const child of rect.children) {
            if (isInResizeZone(child, trueX, trueY)) {
                resizingChild = child;
                leftMouseDown = true;
                return;
            }
        }
    }

    // Check if the click is within the resize zone of any parent node
    for (const rect of rectangles) {
        if (isInResizeZone(rect, trueX, trueY)) {
            resizingRect = rect;
            leftMouseDown = true;
            return;
        }
    }

    // Check if the click is within any child node first
    for (const rect of rectangles) {
        for (const child of rect.children) {
            if (trueX > child.x && trueX < child.x + child.width && trueY > child.y && trueY < child.y + child.height) {
                selectedChild = child;
                leftMouseDown = true;
                return;
            }
        }
    }

    // Check if the click is within any parent node
    for (const rect of rectangles) {
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
        const newWidth = resizingRect.width + (scaledX - prevScaledX);
        const newHeight = resizingRect.height + (scaledY - prevScaledY);

        // Calculate the minimum width and height based on children
        let minWidth = 0;
        let minHeight = 0;
        for (const child of resizingRect.children) {
            const childRight = child.x + child.width - resizingRect.x;
            const childBottom = child.y + child.height - resizingRect.y;
            if (childRight > minWidth) {
                minWidth = childRight;
            }
            if (childBottom > minHeight) {
                minHeight = childBottom;
            }
        }

        resizingRect.width = Math.max(newWidth, minWidth);
        resizingRect.height = Math.max(newHeight, minHeight);

        redrawCanvas();
    } else if (leftMouseDown && resizingChild) {
        // Resize the selected child
        resizingChild.width += scaledX - prevScaledX;
        resizingChild.height += scaledY - prevScaledY;
        keepChildWithinParent(resizingChild);
        redrawCanvas();
    } else if (leftMouseDown && selectedChild) {
        // Move the selected child
        selectedChild.x += scaledX - prevScaledX;
        selectedChild.y += scaledY - prevScaledY;
        keepChildWithinParent(selectedChild);
        redrawCanvas();
    } else if (leftMouseDown && selectedRect) {
        // Move the selected rectangle and its children
        const dx = scaledX - prevScaledX;
        const dy = scaledY - prevScaledY;
        selectedRect.x += dx;
        selectedRect.y += dy;
        for (const child of selectedRect.children) {
            child.x += dx;
            child.y += dy;
        }
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
    selectedChild = null;
    resizingChild = null;
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

// Ensure the child stays within the parent's boundaries
function keepChildWithinParent(child) {
    for (const rect of rectangles) {
        if (rect.children.includes(child)) {
            child.x = Math.max(rect.x, Math.min(child.x, rect.x + rect.width - child.width));
            child.y = Math.max(rect.y, Math.min(child.y, rect.y + rect.height - child.height));
        }
    }
}

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', onMouseMove, false);
canvas.addEventListener('wheel', onMouseWheel, false);
