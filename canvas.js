// Get our canvas element
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

// Disable right-clicking
document.oncontextmenu = function () {
    return false;
}

// Define rectangles with children
const rectangles = [
    {
        x: 100, y: 100, width: 200, height: 150, radius: 10, hover: false, children: [
            { x: 120, y: 120, width: 60, height: 40, radius: 5, hover: false },
            { x: 200, y: 150, width: 60, height: 40, radius: 5, hover: false }
        ]
    },
    {
        x: 400, y: 300, width: 200, height: 150, radius: 10, hover: false, children: [
            { x: 420, y: 320, width: 60, height: 40, radius: 5, hover: false },
            { x: 500, y: 350, width: 60, height: 40, radius: 5, hover: false }
        ]
    }
];
let selectedRect = null;
let selectedChild = null;

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

function redrawCanvas() {
    // Set the canvas to the size of the window
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw rectangles and their children
    for (const rect of rectangles) {
        drawRoundedRect(toScreenX(rect.x), toScreenY(rect.y), rect.width * scale, rect.height * scale, rect.radius * scale, rect.hover);
        for (const child of rect.children) {
            drawRoundedRect(toScreenX(child.x), toScreenY(child.y), child.width * scale, child.height * scale, child.radius * scale, child.hover);
        }
    }

    // Draw line
    const lineStart = getIntersectionPoint(rectangles[0], rectangles[1]);
    const lineEnd = getIntersectionPoint(rectangles[1], rectangles[0]);
    drawLine(toScreenX(lineStart.x), toScreenY(lineStart.y), toScreenX(lineEnd.x), toScreenY(lineEnd.y));
}
redrawCanvas();

// If the window changes size, redraw the canvas
window.addEventListener("resize", (event) => {
    redrawCanvas();
});

// Drawing functions
function drawRoundedRect(x, y, width, height, radius, hover) {
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
    for (const rect of rectangles) {
        if (trueX > rect.x && trueX < rect.x + rect.width && trueY > rect.y && trueY < rect.y + rect.height) {
            if (!rect.hover) {
                rect.hover = true;
                hovered = true;
            }
        } else {
            if (rect.hover) {
                rect.hover = false;
                hovered = true;
            }
        }
        // Check children for hover state
        for (const child of rect.children) {
            if (trueX > child.x && trueX < child.x + child.width && trueY > child.y && trueY < child.y + child.height) {
                if (!child.hover) {
                    child.hover = true;
                    hovered = true;
                }
            } else {
                if (child.hover) {
                    child.hover = false;
                    hovered = true;
                }
            }
        }
    }

    if (hovered) {
        redrawCanvas();
    }
});
