## Project Overview
This JavaScript application creates a visualization of nested nodes on an HTML canvas. The nodes can be moved, resized, zoomed, and toggled (show/hide their descendants) through user interactions. The main components of the application are `canvas.js` and `mouse.js`.

## Key Features
- **Initial Layout Calculation**: Nodes are initially laid out with calculated dimensions based on their children. Each node's width and height are determined dynamically to ensure adequate spacing and padding.
- **Rendering Nodes**: Nodes are drawn on the canvas with rounded corners. Each node's title is displayed within the node, and resize handles appear when a node is hovered over.
- **Zooming and Panning**: The canvas supports zooming in and out based on mouse wheel interactions, and panning is supported through right-click dragging.
- **Dragging and Resizing Nodes**: Nodes can be moved within their parent node's boundaries. Resizing nodes are allowed by dragging their bottom-right corner.
- **Visibility Toggle**: Double-clicking on a node toggles the visibility of its descendants.
- **Edge Drawing**: Supports straight and orthogonal line styles, ensuring connections between nodes are visually clear and exit/enter nodes at 90 degrees to the border.

## Detailed Implementation

### `canvas.js`
- **Global Configuration**: Constants for minimum width and height, padding, title height, default radius, line configuration, and line styles are defined.
- **Canvas and Context Setup**: The canvas element and its 2D context are retrieved for drawing operations.
- **Node Data Structure**: A nested array (`data`) defines the nodes and their children. Each node contains properties such as `x`, `y`, `name`, `children`, and visibility.
- **Zoom and Pan Management**: Functions for converting between true coordinates and screen coordinates manage zooming and panning.
- **Node Dimension Calculation**: The `calculateNodeDimensions` function recursively calculates the width and height of each node based on its children, ensuring adequate spacing.
- **Node Drawing**: The `drawNode` function renders each node on the canvas, including its title and resize handle if hovered.

### Event Listeners:
- **`mousemove`**: Updates the hover state and redraws the canvas.
- **`click`**: Handles single and double-click actions, toggling node visibility on double-click.

### Toggle Visibility:
- The `toggleVisibility` function recursively toggles the visibility of a node's descendants.

### Edge Management:
- **Edge Calculation**: The `updateEdges` function updates the edges based on the visibility of nodes and their ancestors.
- **Edge Drawing**: The `drawEdge` function ensures lines end at the border of the nodes, using either straight or orthogonal lines based on the configuration.

### `mouse.js`
- **State Management**: Variables track mouse states (`leftMouseDown`, `rightMouseDown`) and selected nodes for dragging and resizing.
- **Node Selection**: The `selectNode` function recursively checks if the mouse click is within a node's boundaries to select it for moving or resizing.
- **Dragging and Resizing**:
  - The `moveNode` function updates a node's position while ensuring it stays within its parent.
  - The `resizeNode` function adjusts a node's dimensions while preventing it from flipping or exceeding parent boundaries.
- **Mouse Event Handlers**:
  - **`onMouseDown`**: Sets up the initial state for dragging or resizing.
  - **`onMouseMove`**: Handles dragging or resizing the selected node.
  - **`onMouseUp`**: Resets the mouse state.
  - **`onMouseWheel`**: Handles zooming in and out of the canvas.

### Example Usage
**Initial Setup**: When the page loads, `initialLayout` calculates the dimensions of each node, and `redrawCanvas` renders the nodes on the canvas.

**User Interactions**:
- **Hover**: Hovering over a node shows the resize handle.
- **Drag**: Clicking and dragging a node moves it within its parent's boundaries.
- **Resize**: Clicking and dragging the resize handle adjusts the node's size.
- **Zoom and Pan**: Using the mouse wheel zooms in and out, while right-click dragging pans the canvas.
- **Toggle Visibility**: Double-clicking a node toggles the visibility of its descendants.

### Code Changes and Improvements
**Initial Layout Calculation**:
- Added a function `calculateNodeDimensions` to calculate and set the width and height of each node based on its children.
- Updated the initial layout logic to position child nodes within their parent nodes.

**Rendering Enhancements**:
- Improved `drawNode` to render each node's title and resize handle.
- Enhanced the resize handle to scale based on the node's size.

**Interaction Logic**:
- Implemented dragging and resizing logic within `mouse.js`.
- Ensured nodes stay within their parent boundaries during movement and resizing.
- Added double-click functionality to toggle the visibility of a node's descendants.

**Zoom and Pan**:
- Added zoom functionality using the mouse wheel.
- Enabled panning of the canvas using right-click dragging.

**Edge Management**:
- Ensured edges update dynamically based on the visibility of nodes.
- Added support for straight and orthogonal line styles.

### Sample Code Snippets

**Node Data Structure**
```javascript
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
```

**Rendering Logic**
```javascript
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
```

**Toggle Visibility**
```javascript
function toggleVisibility(node) {
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            child.visible = !child.visible;
            toggleVisibility(child); // Recursively toggle visibility of descendants
        });
    }
}
```

**Mouse Interaction Handlers**
```javascript
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', onMouseMove, false);
canvas.addEventListener('wheel', onMouseWheel, false);
```

This explanation provides a comprehensive overview of your project, including the key features and implementation details. You can use this as a reference for any future enhancements or discussions with other developers.