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
const data = {
    nodes: [
        {
            id: 1, x: 100, y: 100, name: 'Node 1', children: [
                { id: 2, x: 120, y: 120, name: 'Node 2', children: [] },
                { id: 3, x: 200, y: 150, name: 'Node 3', children: [
                    { id: 7, x: 220, y: 170, name: 'Node 7', children: [
                        { id: 8, x: 230, y: 180, name: 'Node 8', children: [] },
                        { id: 10, x: 310, y: 180, name: 'Node 10', children: [] }
                    ] }
                ] }
            ]
        },
        {
            id: 4, x: 400, y: 300, name: 'Node 4', children: [
                { id: 5, x: 420, y: 320, name: 'Node 5', children: [
                    { id: 9, x: 430, y: 330, name: 'Node 9', children: [] }
                ] },
                { id: 6, x: 500, y: 350, name: 'Node 6', children: [] }
            ]
        }
    ],
    edges: [
        { fromId: 8, toId: 9, type: 'USES' }
    ]
};

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
    data.nodes.forEach(rect => calculateNodeDimensions(rect)); // Calculate node dimensions
    data.nodes.forEach(rect => adjustNodeWithinParent(rect)); // Adjust node positions
}

function redrawCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    data.nodes.forEach(rect => drawNode(rect));

    // Draw edges
    data.edges.forEach(edge => drawEdge(edge));

    // Additional logic for drawing connections, if necessary
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

function drawEdge(edge) {
    const fromNode = findNodeById(edge.fromId);
    const toNode = findNodeById(edge.toId);
    if (fromNode && toNode) {
        const lineStart = { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height / 2 };
        const lineEnd = { x: toNode.x + toNode.width / 2, y: toNode.y + toNode.height / 2 };
        drawLine(toScreenX(lineStart.x), toScreenY(lineStart.y), toScreenX(lineEnd.x), toScreenY(lineEnd.y));
    }
}

function findNodeById(id) {
    for (const node of data.nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const childNode = findNodeByIdRecursive(node.children, id);
            if (childNode) return childNode;
        }
    }
    return null;
}

function findNodeByIdRecursive(children, id) {
    for (const child of children) {
        if (child.id === id) return child;
        if (child.children) {
            const nestedChild = findNodeByIdRecursive(child.children, id);
            if (nestedChild) return nestedChild;
        }
    }
    return null;
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

    clearHoverState(data.nodes);
    const hoveredNode = findHoveredNode(data.nodes, trueX, trueY);

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

    const clickedNode = findHoveredNode(data.nodes, trueX, trueY);

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
