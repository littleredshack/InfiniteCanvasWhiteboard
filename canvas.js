// Global variables for configuration
const MIN_WIDTH = 70;
const MIN_HEIGHT = 40;
const PADDING = 10;
const TITLE_HEIGHT = 30; // Space for the title

// Get our canvas element
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

// Disable right-clicking
document.oncontextmenu = function () {
    return false;
}

// Define rectangles with children and names
const rectangles = [
    {
        x: 100, y: 100, width: 200, height: 150, radius: 10, hover: false, visible: true, name: 'Node 1', children: [
            { x: 120, y: 120, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 2', children: [] },
            { x: 200, y: 150, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 3', children: [
                { x: 220, y: 170, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 7', children: [
                    { x: 230, y: 180, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 8', children: [] }
                ] }
            ] }
        ]
    },
    {
        x: 400, y: 300, width: 200, height: 150, radius: 10, hover: false, visible: true, name: 'Node 4', children: [
            { x: 420, y: 320, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 5', children: [
                { x: 430, y: 330, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 9', children: [] }
            ] },
            { x: 500, y: 350, width: MIN_WIDTH, height: MIN_HEIGHT, radius: 5, hover: false, visible: true, name: 'Node 6', children: [] }
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
    } else {
        node.width = Math.max(node.width, MIN_WIDTH);
        node.height = Math.max(node.height, MIN_HEIGHT);
    }
}

function drawNode(node) {
    if (!node.visible) return;
    drawRoundedRect(toScreenX(node.x), toScreenY(node.y), node.width * scale, node.height * scale, node.radius * scale, node.hover, node.name);
    if (node.visible && node.children && node.children.length > 0) {
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
    rectangles.forEach(rect => calculateNodeDimensions(rect)); // Calculate node dimensions
    rectangles.forEach(rect => adjustNodeWithinParent(rect)); // Adjust node positions
}

function redrawCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    rectangles.forEach(rect => drawNode(rect));

    // Additional logic for drawing connections, if necessary
    const lineStart = getIntersectionPoint(rectangles[0], rectangles[1]);
    const lineEnd = getIntersectionPoint(rectangles[1], rectangles[0]);
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
    context.strokeStyle = '#000';
    context.lineWidth = 2;
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
    const handleRadius = radius / 2;
    context.beginPath();
    context.arc(x + width - radius, y + height - radius, handleRadius, 0, Math.PI / 2, false);
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.stroke();
}

function drawLine(x0, y0, x1, y1) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = '#000';
    context.lineWidth = 2;
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

    clearHoverState(rectangles);
    const hoveredNode = findHoveredNode(rectangles, trueX, trueY);

    if (hoveredNode) {
        hoveredNode.hover = true;
        console.log(`Hovered node: ${hoveredNode.name}`);
    } else {
        console.log('Hovered node: None');
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

    const clickedNode = findHoveredNode(rectangles, trueX, trueY);

    if (clickedNode) {
        toggleVisibility(clickedNode);
        console.log(`Toggled visibility for descendants of node: ${clickedNode.name}`);
    }

    redrawCanvas();
}

function findHoveredNode(nodes, trueX, trueY) {
    for (const node of nodes) {
        if (trueX > node.x && trueX < node.x + node.width && trueY > node.y && trueY < node.y + node.height) {
            console.log(`Hovering on: ${node.name} at (${node.x}, ${node.y}) with size (${node.width}, ${node.height})`);
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
