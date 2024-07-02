// mouse.js

// Global variables for cursor positions
let cursorX, cursorY, prevCursorX, prevCursorY;
let selectedNode = null;
let resizingNode = null;
let initialX, initialY;
let leftMouseDown = false;
let rightMouseDown = false;

function isInResizeZone(node, x, y) {
    const handleRadius = node.radius / 2;
    const handleCenterX = node.x + node.width - node.radius;
    const handleCenterY = node.y + node.height - node.radius;
    const distance = Math.sqrt(Math.pow(x - handleCenterX, 2) + Math.pow(y - handleCenterY, 2));
    return distance <= handleRadius;
}

function selectNode(node, trueX, trueY) {
    let foundNode = null;

    // Check children first
    if (node.children && node.children.length > 0) {
        for (let child of node.children) {
            foundNode = selectNode(child, trueX, trueY);
            if (foundNode) {
                return foundNode;
            }
        }
    }

    // Check current node
    if (node.visible && trueX > node.x && trueX < node.x + node.width && trueY > node.y && trueY < node.y + node.height) {
        selectedNode = node;
        resizingNode = isInResizeZone(node, trueX, trueY) ? node : null;
        return node;
    }

    return foundNode;
}

function moveNode(node, dx, dy) {
    node.x += dx;
    node.y += dy;

    // Move children nodes
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => moveNode(child, dx, dy));
    }

    keepNodeWithinParent(node);
}

function resizeNode(node, dx, dy) {
    const minWidth = Math.max(MIN_WIDTH, ...node.children.map(child => child.x - node.x + child.width));
    const minHeight = Math.max(MIN_HEIGHT, ...node.children.map(child => child.y - node.y + child.height));

    // Calculate the new width and height
    let newWidth = node.width + dx;
    let newHeight = node.height + dy;

    // Ensure the node does not flip
    newWidth = Math.max(newWidth, minWidth);
    newHeight = Math.max(newHeight, minHeight);

    // Ensure width and height are non-negative
    newWidth = Math.max(newWidth, MIN_WIDTH);
    newHeight = Math.max(newHeight, MIN_HEIGHT);

    // Ensure the node stays within the parent's boundaries
    if (node.parent) {
        const parent = node.parent;
        const maxWidth = parent.width - (node.x - parent.x);
        const maxHeight = parent.height - (node.y - parent.y);

        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        // Adjust position if resizing causes overflow
        if (node.x + newWidth > parent.x + parent.width) {
            node.x = parent.x + parent.width - newWidth;
        }
        if (node.y + newHeight > parent.y + parent.height) {
            node.y = parent.y + parent.height - newHeight;
        }
    }

    node.width = newWidth;
    node.height = newHeight;

    keepNodeWithinParent(node);
}

function keepNodeWithinParent(node) {
    if (!node.parent) return;
    const parent = node.parent;

    // Ensure the node stays within the parent's boundaries
    const originalX = node.x;
    const originalY = node.y;

    node.x = Math.max(parent.x, Math.min(node.x, parent.x + parent.width - node.width));
    node.y = Math.max(parent.y, Math.min(node.y, parent.y + parent.height - node.height));

    const dx = node.x - originalX;
    const dy = node.y - originalY;

    if (dx !== 0 || dy !== 0) {
        // Move children back if the parent node was constrained
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => moveNode(child, dx, dy));
        }
    }
}

function onMouseDown(event) {
    cursorX = event.pageX;
    cursorY = event.pageY;
    prevCursorX = event.pageX;
    prevCursorY = event.pageY;

    const trueX = toTrueX(cursorX);
    const trueY = toTrueY(cursorY);

    let foundNode = null;
    for (let rect of data) {
        rect.parent = null; // Top-level nodes don't have a parent
        foundNode = selectNode(rect, trueX, trueY);
        if (foundNode) {
            break;
        }
    }

    if (resizingNode) {
        initialX = resizingNode.x;
        initialY = resizingNode.y;
    }

    leftMouseDown = true;

    // Detect right clicks
    if (event.button == 2) {
        rightMouseDown = true;
        leftMouseDown = false;
    }
}

function onMouseMove(event) {
    cursorX = event.pageX;
    cursorY = event.pageY;
    const scaledX = toTrueX(cursorX);
    const scaledY = toTrueY(cursorY);
    const prevScaledX = toTrueX(prevCursorX);
    const prevScaledY = toTrueY(prevCursorY);

    if (leftMouseDown && selectedNode) {
        const dx = scaledX - prevScaledX;
        const dy = scaledY - prevScaledY;
        if (resizingNode) {
            resizeNode(resizingNode, dx, dy);
        } else {
            moveNode(selectedNode, dx, dy);
        }
        redrawCanvas();
    } else if (rightMouseDown) {
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
    selectedNode = null;
    resizingNode = null;
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
