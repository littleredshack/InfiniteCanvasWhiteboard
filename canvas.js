// canvas.js

// Global variables for configuration
const MIN_WIDTH = 70;
const MIN_HEIGHT = 40;
const PADDING = 10;
const TITLE_HEIGHT = 30; // Space for the title
const DEFAULT_RADIUS = 5;
const resizeMargin = 10; // Margin around the rectangle to detect resizing

// Line configuration
let lineThickness = 1;
let lineColor = '#000';
let lineType = 'solid'; // 'solid' or 'dotted'

// Get our canvas element
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

// Disable right-clicking
document.oncontextmenu = function () {
    return false;
}

// Define data with children and names (without width, height, and radius)
const data = [
    {
        x: 100, y: 100, name: 'Node 1', children: [
            { x: 120, y: 120, name: 'Node 2', children: [] },
            { x: 200, y: 150, name: 'Node 3', children: [
                { x: 220, y: 170, name: 'Node 7', children: [
                    { x: 230, y: 180, name: 'Node 8', children: [] },
                    { x: 310, y: 180, name: 'Node 10', children: [] }
                ] }
            ] }
        ]
    },
    {
        x: 400, y: 300, name: 'Node 4', children: [
            { x: 420, y: 320, name: 'Node 5', children: [
                { x: 430, y: 330, name: 'Node 9', children: [] }
            ] },
            { x: 500, y: 350, name: 'Node 6', children: [] }
        ]
    }
];

// Distance from origin
let offsetX = 0;
let offsetY = 0;

// Zoom amount
let scale = 1;

// Timer for detecting double-clicks
let clickTimer = null;
const DOUBLE_CLICK_DELAY = 300; // milliseconds

// Convert coordinates
function toScreenX(xTrue) {
    return (xTrue + offsetX) * scale;
}
function toScreenY(yTrue) {
    return (yTrue + offsetY) * scale;
}
function toTrueX(xScreen) {
    return (xScreen / scale) - offsetX;
}
function toTrueY(yScreen) {
    return (yScreen / scale) - offsetY;
}
function trueHeight() {
    return canvas.clientHeight / scale;
}
function trueWidth() {
    return canvas.clientWidth / scale;
}

// Function to calculate the dimensions of each node based on its children
function calculateNodeDimensions(node) {
    node.width = node.width || MIN_WIDTH;
    node.height = node.height || MIN_HEIGHT;
    node.radius = node.radius || DEFAULT_RADIUS;
    node.visible = true; // Ensure all nodes are initially visible
    
    if (node.children && node.children.length > 0) {
        let totalWidth = PADDING;
        let maxHeight = 0;
        node.children.forEach(child => {
            calculateNodeDimensions(child);
            totalWidth += child.width + PADDING; // Add space between children and padding
            maxHeight = Math.max(maxHeight, child.height);
        });
        node.width = Math.max(totalWidth, MIN_WIDTH);
        node.height = Math.max(maxHeight + TITLE_HEIGHT + PADDING, MIN_HEIGHT);
    }
}

function drawNode(node) {
    if (!node.visible) return;
    drawRoundedRect(toScreenX(node.x), toScreenY(node.y), node.width * scale, node.height * scale, node.radius * scale, node.hover, node.name);
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            child.parent = node;
            drawNode(child);
        });
    }
}

// Adjust positions to avoid overlapping and fit within parent
function adjustNodeWithinParent(node) {
    if (node.children && node.children.length > 0) {
        let childX = node.x + PADDING;
        node.children.forEach(child => {
            child.parent = node;
            child.x = childX;
            child.y = node.y + TITLE_HEIGHT;
            childX += child.width + PADDING;
            adjustNodeWithinParent(child);
        });
    }
}

function initialLayout() {
    data.forEach(rect => calculateNodeDimensions(rect)); // Calculate node dimensions
    data.forEach(rect => adjustNodeWithinParent(rect)); // Adjust node positions
}

function redrawCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    data.forEach(rect => drawNode(rect));

    // Additional logic for drawing connections, if necessary
    const lineStart = getIntersectionPoint(data[0], data[1]);
    const lineEnd = getIntersectionPoint(data[1], data[0]);
    drawLine(toScreenX(lineStart.x), toScreenY(lineStart.y), toScreenX(lineEnd.x), toScreenY(lineEnd.y));
}

// Drawing functions
function drawRoundedRect(x, y, width, height, radius, hover, name) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();

    if (lineType === 'dotted') {
        context.setLineDash([5, 5]);
    } else {
        context.setLineDash([]);
    }

    context.strokeStyle = lineColor;
    context.lineWidth = lineThickness;
    context.stroke();

    // Draw the name of the node
    context.font = "14px Arial";
    context.fillStyle = "#000";
    context.fillText(name, x + 5, y + 20);

    // Draw resize handle if hovered
    if (hover) {
        drawResizeHandle(x, y, width, height, radius);
    }
}

function drawResizeHandle(x, y, width, height, radius) {
    const handleSpacing = 3; // Distance between the handles

    context.strokeStyle = lineColor;
    context.lineWidth = 1;

    // First inner curve, shifted towards the center by handleSpacing
    context.beginPath();
    context.arc(x + width - radius - handleSpacing, y + height - radius - handleSpacing, radius, 0, Math.PI / 2, false);
    context.stroke();
}

function drawLine(x0, y0, x1, y1) {
    if (lineType === 'dotted') {
        context.setLineDash([5, 5]);
    } else {
        context.setLineDash([]);
    }

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = lineColor;
    context.lineWidth = lineThickness;
    context.stroke();
}

// Calculate the intersection of the line with the rectangle's edges
function getIntersectionPoint(rect, targetRect) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const tx = targetRect.x + targetRect.width / 2;
    const ty = targetRect.y + targetRect.height / 2;

    const dx = tx - cx;
    const dy = ty - cy;

    // Potential intersection points with the rectangle's edges
    const points = [
        { x: rect.x, y: cy + (rect.x - cx) * dy / dx }, // left edge
        { x: rect.x + rect.width, y: cy + (rect.x + rect.width - cx) * dy / dx }, // right edge
        { x: cx + (rect.y - cy) * dx / dy, y: rect.y }, // top edge
        { x: cx + (rect.y + rect.height - cy) * dx / dy, y: rect.y + rect.height } // bottom edge
    ];

    // Filter points that lie within the bounds of the rectangle
    const validPoints = points.filter(point =>
        point.x >= rect.x && point.x <= rect.x + rect.width &&
        point.y >= rect.y && point.y <= rect.y + rect.height
    );

    // Find the closest valid point to the target rectangle
    let closestPoint = validPoints[0];
    let minDistance = Math.sqrt(Math.pow(closestPoint.x - targetRect.x, 2) + Math.pow(closestPoint.y - targetRect.y, 2));
    for (let i = 1; i < validPoints.length; i++) {
        const distance = Math.sqrt(Math.pow(validPoints[i].x - targetRect.x, 2) + Math.pow(validPoints[i].y - targetRect.y, 2));
        if (distance < minDistance) {
            closestPoint = validPoints[i];
            minDistance = distance;
        }
    }

    return closestPoint;
}

// Update hover state and redraw canvas
canvas.addEventListener('mousemove', function(event) {
    const trueX = toTrueX(event.pageX);
    const trueY = toTrueY(event.pageY);

    clearHoverState(data);
    const hoveredNode = findHoveredNode(data, trueX, trueY);

    if (hoveredNode) {
        hoveredNode.hover = true;
    }

    redrawCanvas();
});

canvas.addEventListener('click', function(event) {
    if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        handleDoubleClick(event);
    } else {
        clickTimer = setTimeout(() => {
            clickTimer = null;
            // Handle single click if needed
        }, DOUBLE_CLICK_DELAY);
    }
});

function handleDoubleClick(event) {
    const trueX = toTrueX(event.pageX);
    const trueY = toTrueY(event.pageY);

    const clickedNode = findHoveredNode(data, trueX, trueY);

    if (clickedNode) {
        toggleVisibility(clickedNode);
    }

    redrawCanvas();
}

function findHoveredNode(nodes, trueX, trueY) {
    for (const node of nodes) {
        if (node.visible && trueX > node.x && trueX < node.x + node.width && trueY > node.y && trueY < node.y + node.height) {
            if (node.children && node.children.length > 0) {
                const hoveredChild = findHoveredNode(node.children, trueX, trueY);
                if (hoveredChild) {
                    return hoveredChild;
                }
            }
            return node;
        }
    }
    return null;
}

function clearHoverState(nodes) {
    nodes.forEach(node => {
        node.hover = false;
        if (node.children && node.children.length > 0) {
            clearHoverState(node.children);
        }
    });
}

function toggleVisibility(node) {
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            child.visible = !child.visible;
            toggleVisibility(child); // Recursively toggle visibility of descendants
        });
    }
}

// Initial layout setup
initialLayout();
redrawCanvas();
window.addEventListener("resize", (event) => {
    redrawCanvas();
});

// Variables for mouse interactions
let leftMouseDown = false;
let rightMouseDown = false;
let cursorX, cursorY, prevCursorX, prevCursorY;
let selectedNode = null;
let resizingNode = null;

// Variables to store initial position during resizing
let initialX, initialY;

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
    node.x = Math.max(parent.x, Math.min(node.x, parent.x + parent.width - node.width));
    node.y = Math.max(parent.y, Math.min(node.y, parent.y + parent.height - node.height));
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
