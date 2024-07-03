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
let lineStyle = 'straight'; // 'straight' or 'orthogonal'

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
        { fromId: 8, toId: 9, type: 'USES', displayFromId: 8, displayToId: 9 }
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

// Function to add visibility property to all nodes
function addVisibilityProperty(nodes) {
    nodes.forEach(node => {
        node.visible = true;
        if (node.children && node.children.length > 0) {
            addVisibilityProperty(node.children);
        }
    });
}

// Function to calculate the dimensions of each node based on its children
function calculateNodeDimensions(node) {
    node.width = node.width || MIN_WIDTH;
    node.height = node.height || MIN_HEIGHT;
    node.radius = node.radius || DEFAULT_RADIUS;
    
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
    addVisibilityProperty(data.nodes); // Add visibility property
    data.nodes.forEach(rect => calculateNodeDimensions(rect)); // Calculate node dimensions
    data.nodes.forEach(rect => adjustNodeWithinParent(rect)); // Adjust node positions
    updateEdges();
    redrawCanvas();
}

function updateEdges() {
    data.edges.forEach(edge => {
        const fromNode = findNodeById(edge.fromId);
        const toNode = findNodeById(edge.toId);

        const nextVisibleFrom = findNextVisibleAncestor(fromNode);
        const nextVisibleTo = findNextVisibleAncestor(toNode);

        if (nextVisibleFrom && nextVisibleTo) {
            edge.displayFromId = nextVisibleFrom.id;
            edge.displayToId = nextVisibleTo.id;
        }
    });
}

function drawEdge(edge) {
    const fromNode = findNodeById(edge.displayFromId);
    const toNode = findNodeById(edge.displayToId);
    if (fromNode && toNode) {
        const lineStart = { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height / 2 };
        const lineEnd = { x: toNode.x + toNode.width / 2, y: toNode.y + toNode.height / 2 };
        drawLine(toScreenX(lineStart.x), toScreenY(lineStart.y), toScreenX(lineEnd.x), toScreenY(lineEnd.y), fromNode, toNode);
    }
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

function drawLine(x0, y0, x1, y1, fromNode, toNode) {
    if (lineStyle === 'orthogonal') {
        drawOrthogonalLine(x0, y0, x1, y1, fromNode, toNode);
    } else {
        const start = getIntersectionPointWithNodeBorder(x0, y0, x1, y1, fromNode);
        const end = getIntersectionPointWithNodeBorder(x1, y1, x0, y0, toNode);

        if (lineType === 'dotted') {
            context.setLineDash([5, 5]);
        } else {
            context.setLineDash([]);
        }

        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.strokeStyle = lineColor;
        context.lineWidth = lineThickness;
        context.stroke();
    }
}

function drawOrthogonalLine(x0, y0, x1, y1, fromNode, toNode) {
    const start = getOrthogonalPointWithNodeBorder(x0, y0, x1, y1, fromNode);
    const end = getOrthogonalPointWithNodeBorder(x1, y1, x0, y0, toNode);

    if (lineType === 'dotted') {
        context.setLineDash([5, 5]);
    } else {
        context.setLineDash([]);
    }

    context.beginPath();
    context.moveTo(start.x, start.y);

    // Determine the segments for the orthogonal line
    if (start.x === fromNode.x || start.x === fromNode.x + fromNode.width) {
        // Start point is on the left or right edge
        context.lineTo((start.x + end.x) / 2,start.y);
        context.lineTo((start.x + end.x) / 2,end.y);
    } else {
        // Start point is on the top or bottom edge
        context.lineTo(start.x, (start.y + end.y) / 2);
        context.lineTo(end.x, (start.y + end.y) / 2);
    }

    context.lineTo(end.x, end.y);
    context.strokeStyle = lineColor;
    context.lineWidth = lineThickness;
    context.stroke();
}

function getOrthogonalPointWithNodeBorder(x0, y0, x1, y1, node) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Calculate potential exit points
    const points = [
        { x: node.x + node.width / 2, y: node.y }, // top center
        { x: node.x + node.width / 2, y: node.y + node.height }, // bottom center
        { x: node.x, y: node.y + node.height / 2 }, // left center
        { x: node.x + node.width, y: node.y + node.height / 2 } // right center
    ];

    // Calculate distances to (x1, y1)
    const distances = points.map(point => Math.abs(point.x - x1) + Math.abs(point.y - y1));

    // Find the point with the minimum distance
    const minDistanceIndex = distances.indexOf(Math.min(...distances));
    return points[minDistanceIndex];
}

function getPosition(point, node) {
    if (point.x === node.x) {
        return 'left';
    } else if (point.x === node.x + node.width) {
        return 'right';
    } else if (point.y === node.y) {
        return 'top';
    } else if (point.y === node.y + node.height) {
        return 'bottom';
    } else {
        return 'unknown';
    }
}

function drawEdge(edge) {
    const fromNode = findNodeById(edge.displayFromId);
    const toNode = findNodeById(edge.displayToId);
    if (fromNode && toNode) {
        const lineStart = getIntersectionPointWithNodeBorder(fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height / 2, toNode.x + toNode.width / 2, toNode.y + toNode.height / 2, fromNode);
        const lineEnd = getIntersectionPointWithNodeBorder(toNode.x + toNode.width / 2, toNode.y + toNode.height / 2, fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height / 2, toNode);
        drawLine(toScreenX(lineStart.x), toScreenY(lineStart.y), toScreenX(lineEnd.x), toScreenY(lineEnd.y), fromNode, toNode);
    }
}

function getIntersectionPointWithNodeBorder(x0, y0, x1, y1, node) {
    const nodeCenterX = node.x + node.width / 2;
    const nodeCenterY = node.y + node.height / 2;
    const halfWidth = node.width / 2;
    const halfHeight = node.height / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    let t;

    // Check intersection with each side of the rectangle
    if (dx !== 0) {
        t = (halfWidth - Math.abs(nodeCenterX - x0)) / Math.abs(dx);
        if (t >= 0 && t <= 1) {
            const ix = x0 + t * dx;
            const iy = y0 + t * dy;
            if (iy >= node.y && iy <= node.y + node.height) {
                return adjustForRoundedCorners(ix, iy, node);
            }
        }
    }

    if (dy !== 0) {
        t = (halfHeight - Math.abs(nodeCenterY - y0)) / Math.abs(dy);
        if (t >= 0 && t <= 1) {
            const ix = x0 + t * dx;
            const iy = y0 + t * dy;
            if (ix >= node.x && ix <= node.x + node.width) {
                return adjustForRoundedCorners(ix, iy, node);
            }
        }
    }

    return { x: x0, y: y0 }; // Fallback if no intersection is found
}

function adjustForRoundedCorners(x, y, node) {
    const radius = node.radius;
    const left = node.x + radius;
    const right = node.x + node.width - radius;
    const top = node.y + radius;
    const bottom = node.y + node.height - radius;

    if (x < left && y < top) {
        return getIntersectionWithCircle(node.x + radius, node.y + radius, radius, x, y);
    } else if (x > right && y < top) {
        return getIntersectionWithCircle(node.x + node.width - radius, node.y + radius, radius, x, y);
    } else if (x < left && y > bottom) {
        return getIntersectionWithCircle(node.x + radius, node.y + node.height - radius, radius, x, y);
    } else if (x > right && y > bottom) {
        return getIntersectionWithCircle(node.x + node.width - radius, node.y + node.height - radius, radius, x, y);
    } else {
        return { x, y };
    }
}

function getIntersectionWithCircle(cx, cy, radius, x, y) {
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = radius / distance;
    return { x: cx + dx * scale, y: cy + dy * scale };
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

function findNextVisibleAncestor(node) {
    let currentNode = node;
    while (currentNode && !currentNode.visible) {
        currentNode = currentNode.parent;
    }
    return currentNode;
}

function toggleVisibility(node, visibility) {
    if (!node._visibilityStack) {
        node._visibilityStack = [];
    }

    if (node.children && node.children.length > 0) {
        if (typeof visibility === 'undefined') {
            visibility = !node.children[0].visible;
        }

        if (visibility) {
            // Restore previous visibility states
            const visibilityState = node._visibilityStack.pop();
            node.children.forEach((child, index) => {
                const savedState = visibilityState.find(state => state.id === child.id);
                child.visible = savedState ? savedState.visible : true;
                if (child.visible) {
                    toggleVisibility(child, child.visible); // Recursively show descendants if they were visible
                }
            });
        } else {
            // Store current visibility states and hide children
            const visibilityState = node.children.map(child => ({
                id: child.id,
                visible: child.visible
            }));
            node._visibilityStack.push(visibilityState);
            node.children.forEach(child => {
                child.visible = false;
                toggleVisibility(child, false); // Recursively hide descendants
            });
        }
    }

    // Update edges
    updateEdges();
}

// Initial layout setup
initialLayout();
updateEdges();
redrawCanvas();
window.addEventListener("resize", (event) => {
    redrawCanvas();
});

// Event listeners
canvas.addEventListener('mousemove', function(event) {
    const trueX = toTrueX(event.pageX);
    const trueY = toTrueY(event.pageY);

    clearHoverState(data.nodes);
    const hoveredNode = findHoveredNode(data.nodes, trueX, trueY);

    if (hoveredNode) {
        hoveredNode.hover = true;
        redrawCanvas();
    }
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
