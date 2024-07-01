// canvas.js

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
        x: 100, y: 100, width: 200, height: 150, radius: 10, hover: false, name: 'Node 1', children: [
            { x: 120, y: 120, width: 60, height: 40, radius: 5, hover: false, name: 'Node 2', children: [] },
            { x: 200, y: 150, width: 60, height: 40, radius: 5, hover: false, name: 'Node 3', children: [
                { x: 220, y: 170, width: 40, height: 30, radius: 5, hover: false, name: 'Node 7', children: [
                    { x: 230, y: 180, width: 30, height: 20, radius: 5, hover: false, name: 'Node 8', children: [] }
                ] }
            ] }
        ]
    },
    {
        x: 400, y: 300, width: 200, height: 150, radius: 10, hover: false, name: 'Node 4', children: [
            { x: 420, y: 320, width: 60, height: 40, radius: 5, hover: false, name: 'Node 5', children: [
                { x: 430, y: 330, width: 40, height: 30, radius: 5, hover: false, name: 'Node 9', children: [] }
            ] },
            { x: 500, y: 350, width: 60, height: 40, radius: 5, hover: false, name: 'Node 6', children: [] }
        ]
    }
];

// Distance from origin
let offsetX = 0;
let offsetY = 0;

// Zoom amount
let scale = 1;

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

function drawNode(node) {
    // console.log(`Drawing node: ${node.name} at (${node.x}, ${node.y}) with size (${node.width}, ${node.height})`);
    drawRoundedRect(toScreenX(node.x), toScreenY(node.y), node.width * scale, node.height * scale, node.radius * scale, node.hover, node.name);
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            child.parent = node;
            drawNode(child);
        });
    }
}

function adjustNodeWithinParent(node) {
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            child.parent = node;
            child.x = Math.max(node.x, Math.min(child.x, node.x + node.width - child.width));
            child.y = Math.max(node.y, Math.min(child.y, node.y + node.height - child.height));
            adjustNodeWithinParent(child);
        });
    }
}

function redrawCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    rectangles.forEach(rect => adjustNodeWithinParent(rect)); // Adjust node positions
    rectangles.forEach(rect => drawNode(rect));

    // Additional logic for drawing connections, if necessary
    const lineStart = getIntersectionPoint(rectangles[0], rectangles[1]);
    const lineEnd = getIntersectionPoint(rectangles[1], rectangles[0]);
    // console.log(`Drawing line from (${lineStart.x}, ${lineStart.y}) to (${lineEnd.x}, ${lineEnd.y})`);
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
    context.fillText(name, x + 5, y + 15);

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

    let hovered = false;
    rectangles.forEach(rect => {
        if (updateHoverState(rect, trueX, trueY)) {
            hovered = true;
        }
    });

    if (hovered) {
        redrawCanvas();
    }
});

function updateHoverState(node, trueX, trueY) {
    let isHovered = false;
    node.hover = trueX > node.x && trueX < node.x + node.width && trueY > node.y && trueY < node.y + node.height;
    if (node.hover) isHovered = true;
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            if (updateHoverState(child, trueX, trueY)) {
                isHovered = true;
            }
        });
    }
    return isHovered;
}

redrawCanvas();
window.addEventListener("resize", (event) => {
    redrawCanvas();
});
