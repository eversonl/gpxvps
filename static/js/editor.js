// WYSIWYG Layout Editor JavaScript

class LayoutEditor {
    constructor() {
        this.widgets = [];
        this.map = null;
        this.selectedElement = null;
        this.canvasSize = { width: 1920, height: 1080 };
        this.canvasScale = 1;
        this.nextWidgetId = 1;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.widgetTypes = {};
        this.mapSources = {};
        
        this.init();
    }

    async init() {
        await this.loadWidgetTypes();
        await this.loadMapSources();
        this.setupEventListeners();
        this.updateCanvasSize();
        this.showStatus('Layout editor loaded successfully!', 'success');
    }

    async loadWidgetTypes() {
        try {
            const response = await fetch('/api/widget_types');
            this.widgetTypes = await response.json();
            this.populateWidgetPalette();
        } catch (error) {
            console.error('Failed to load widget types:', error);
            this.showStatus('Failed to load widget types', 'error');
        }
    }

    async loadMapSources() {
        try {
            const response = await fetch('/api/map_sources');
            this.mapSources = await response.json();
            this.populateMapSources();
        } catch (error) {
            console.error('Failed to load map sources:', error);
            this.showStatus('Failed to load map sources', 'error');
        }
    }

    populateWidgetPalette() {
        const palette = document.getElementById('widget-palette');
        palette.innerHTML = '';

        Object.entries(this.widgetTypes).forEach(([type, info]) => {
            const item = document.createElement('div');
            item.className = 'palette-item';
            item.draggable = true;
            item.dataset.type = type;
            
            item.innerHTML = `
                <span class="widget-icon">${info.icon}</span>
                <span class="widget-name">${info.name}</span>
            `;

            item.addEventListener('dragstart', (e) => this.handlePaletteDragStart(e, type));
            palette.appendChild(item);
        });
    }

    populateMapSources() {
        const select = document.getElementById('map-source');
        if (!select) return;
        
        select.innerHTML = '';
        Object.entries(this.mapSources).forEach(([id, info]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${info.name} - ${info.description}`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        const canvas = document.getElementById('canvas');
        
        // Canvas drop events
        canvas.addEventListener('dragover', (e) => this.handleCanvasDragOver(e));
        canvas.addEventListener('drop', (e) => this.handleCanvasDrop(e));
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Document events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Map drag events
        const mapItem = document.querySelector('.map-item');
        if (mapItem) {
            mapItem.addEventListener('dragstart', (e) => this.handlePaletteDragStart(e, 'map'));
        }
    }

    handlePaletteDragStart(e, type) {
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Show position guide
        const guide = document.getElementById('position-guide');
        if (guide) guide.classList.add('active');
        
        const container = document.querySelector('.canvas-container');
        if (container) container.classList.add('drag-over');
    }

    handleCanvasDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        
        // Hide position guide
        const guide = document.getElementById('position-guide');
        if (guide) guide.classList.remove('active');
        
        const container = document.querySelector('.canvas-container');
        if (container) container.classList.remove('drag-over');
        
        // Get drop position relative to canvas
        const canvasRect = document.querySelector('.canvas-background').getBoundingClientRect();
        const x = (e.clientX - canvasRect.left) / this.canvasScale;
        const y = (e.clientY - canvasRect.top) / this.canvasScale;
        
        if (type === 'map') {
            this.addMap(x, y);
        } else {
            this.addWidget(type, x, y);
        }
    }

    addWidget(type, x, y) {
        const widgetInfo = this.widgetTypes[type];
        if (!widgetInfo) return;

        const widget = {
            id: `widget-${this.nextWidgetId++}`,
            type: type,
            label: widgetInfo.name.toUpperCase(),
            x: Math.max(0, x - widgetInfo.default_size.width / 2),
            y: Math.max(0, y - widgetInfo.default_size.height / 2),
            width: widgetInfo.default_size.width,
            height: widgetInfo.default_size.height,
            unit: widgetInfo.default_unit,
            margin: 20,
            padding: 5,
            text_shadow: 3,
            border: 5,
            border_color: '#000000b0',
            background_color: '#0000004c',
            font_size: widgetInfo.default_font_size || 18,
            text_ratio: 2.0,
            text_linespace: 2,
            label_align: 'left',
            value_align: 'right',
            at: 1000,
            duration: 9000,
            display: true,
            with_label: true,
            with_value: true,
            with_unit: true,
            with_picto: true
        };

        this.widgets.push(widget);
        this.renderWidget(widget);
        this.selectElement(widget.id, 'widget');
        this.showStatus(`Added ${widgetInfo.name} widget`, 'success');
    }

    addMap(x, y) {
        if (this.map) {
            this.showStatus('Only one map is allowed per layout', 'error');
            return;
        }

        this.map = {
            id: 'map-1',
            x: Math.max(0, x - 200),
            y: Math.max(0, y - 150),
            width: 400,
            height: 300,
            source: 6,
            zoom: 13,
            factor: 2.0,
            margin: 20,
            border: 3,
            border_color: '#000000cc',
            background_color: '#ffffff88',
            path_thick: 4.0,
            path_border: 2.0
        };

        this.renderMap();
        this.selectElement('map-1', 'map');
        this.showStatus('Added map', 'success');
    }

    renderWidget(widget) {
        const canvas = document.querySelector('.canvas-background');
        if (!canvas) return;
        
        const element = document.createElement('div');
        element.className = `canvas-widget widget-${widget.type}`;
        element.id = widget.id;
        element.style.left = `${widget.x * this.canvasScale}px`;
        element.style.top = `${widget.y * this.canvasScale}px`;
        element.style.width = `${widget.width * this.canvasScale}px`;
        element.style.height = `${widget.height * this.canvasScale}px`;
        element.style.backgroundColor = widget.background_color;
        element.style.borderColor = widget.border_color;
        element.style.borderWidth = `${widget.border}px`;
        element.textContent = `${widget.label}${widget.unit ? ' (' + widget.unit + ')' : ''}`;

        element.addEventListener('mousedown', (e) => this.handleElementMouseDown(e, widget.id, 'widget'));
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(widget.id, 'widget');
        });
        
        // Add right-click context menu for deletion
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectElement(widget.id, 'widget');
            if (confirm('Delete this widget?')) {
                this.deleteSelectedElement();
            }
        });

        canvas.appendChild(element);
    }

    renderMap() {
        if (!this.map) return;

        const canvas = document.querySelector('.canvas-background');
        if (!canvas) return;
        
        const element = document.createElement('div');
        element.className = 'canvas-map';
        element.id = this.map.id;
        element.style.left = `${this.map.x * this.canvasScale}px`;
        element.style.top = `${this.map.y * this.canvasScale}px`;
        element.style.width = `${this.map.width * this.canvasScale}px`;
        element.style.height = `${this.map.height * this.canvasScale}px`;
        element.style.borderColor = this.map.border_color;
        element.style.borderWidth = `${this.map.border}px`;
        element.textContent = `🗺️ Map (Source ${this.map.source})`;

        element.addEventListener('mousedown', (e) => this.handleElementMouseDown(e, this.map.id, 'map'));
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(this.map.id, 'map');
        });
        
        // Add right-click context menu for deletion
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectElement(this.map.id, 'map');
            if (confirm('Delete this map?')) {
                this.deleteSelectedElement();
            }
        });

        canvas.appendChild(element);
    }

    handleElementMouseDown(e, elementId, elementType) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = true;
        this.selectElement(elementId, elementType);
        
        const element = document.getElementById(elementId);
        const rect = element.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        element.classList.add('dragging');
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedElement) return;
        
        e.preventDefault();
        
        const canvas = document.querySelector('.canvas-background');
        const canvasRect = canvas.getBoundingClientRect();
        
        const x = (e.clientX - canvasRect.left - this.dragOffset.x) / this.canvasScale;
        const y = (e.clientY - canvasRect.top - this.dragOffset.y) / this.canvasScale;
        
        // Keep element within canvas bounds
        const element = this.selectedElement.type === 'widget' ? this.getSelectedWidget() : this.map;
        if (!element) return;
        
        const maxX = (this.canvasSize.width / this.canvasScale) - element.width;
        const maxY = (this.canvasSize.height / this.canvasScale) - element.height;
        
        const clampedX = Math.max(0, Math.min(x, maxX));
        const clampedY = Math.max(0, Math.min(y, maxY));
        
        element.x = clampedX;
        element.y = clampedY;
        
        if (this.selectedElement.type === 'widget') {
            this.updateWidgetPosition();
        } else if (this.selectedElement.type === 'map') {
            this.updateMapPosition();
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            
            if (this.selectedElement) {
                const element = document.getElementById(this.selectedElement.id);
                if (element) {
                    element.classList.remove('dragging');
                }
            }
        }
    }

    handleCanvasClick(e) {
        if (e.target.classList.contains('canvas-background') || e.target.classList.contains('aspect-ratio-indicator')) {
            this.clearSelection();
        }
    }

    handleKeyDown(e) {
        console.log('Key pressed:', e.key, 'Selected element:', this.selectedElement);
        
        if (e.key === 'Delete' && this.selectedElement) {
            console.log('Delete key pressed, deleting element');
            this.deleteSelectedElement();
        } else if (e.key === 'Escape') {
            console.log('Escape key pressed, clearing selection');
            this.clearSelection();
        }
    }

    selectElement(id, type) {
        console.log('selectElement called with:', id, type);
        
        // Clear previous selection
        document.querySelectorAll('.canvas-widget, .canvas-map').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new element
        const element = document.getElementById(id);
        console.log('Element found:', element);
        
        if (element) {
            element.classList.add('selected');
            this.selectedElement = { id, type };
            console.log('Selected element set to:', this.selectedElement);
            this.showProperties(type);
        } else {
            console.error('Element not found:', id);
        }
    }

    clearSelection() {
        document.querySelectorAll('.canvas-widget, .canvas-map').forEach(el => {
            el.classList.remove('selected');
        });
        this.selectedElement = null;
        this.hideProperties();
    }

    showProperties(type) {
        console.log('showProperties called with type:', type);
        
        // Hide all property panels
        document.querySelectorAll('.properties-form').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const noSelection = document.querySelector('.no-selection');
        if (noSelection) {
            noSelection.style.display = 'none';
            console.log('Hidden no-selection panel');
        }

        if (type === 'widget') {
            console.log('Showing widget properties');
            const panel = document.getElementById('widget-properties-template');
            console.log('Widget properties panel found:', panel);
            
            if (panel) {
                panel.classList.add('active');
                panel.style.display = 'block';
                console.log('Widget properties panel activated');
                this.populateWidgetProperties();
            } else {
                console.error('widget-properties-template not found');
            }
        } else if (type === 'map') {
            console.log('Showing map properties');
            const panel = document.getElementById('map-properties-template');
            console.log('Map properties panel found:', panel);
            
            if (panel) {
                panel.classList.add('active');
                panel.style.display = 'block';
                console.log('Map properties panel activated');
                // Ensure map sources are populated first
                this.populateMapSources();
                this.populateMapProperties();
            } else {
                console.error('map-properties-template not found');
            }
        }
    }

    hideProperties() {
        document.querySelectorAll('.properties-form').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const noSelection = document.querySelector('.no-selection');
        if (noSelection) noSelection.style.display = 'block';
    }

    populateWidgetProperties() {
        const widget = this.getSelectedWidget();
        if (!widget) {
            console.log('No widget selected for properties');
            return;
        }

        console.log('Populating properties for widget:', widget);

        // Populate widget type options
        const typeSelect = document.getElementById('widget-type');
        if (typeSelect) {
            typeSelect.innerHTML = '';
            Object.entries(this.widgetTypes).forEach(([type, info]) => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = info.name;
                option.selected = type === widget.type;
                typeSelect.appendChild(option);
            });
            console.log('Populated widget type dropdown');
        } else {
            console.error('widget-type element not found');
        }

        // Populate unit options
        const unitSelect = document.getElementById('widget-unit');
        if (unitSelect) {
            unitSelect.innerHTML = '';
            const widgetInfo = this.widgetTypes[widget.type];
            if (widgetInfo && widgetInfo.units) {
                widgetInfo.units.forEach(unit => {
                    const option = document.createElement('option');
                    option.value = unit;
                    option.textContent = unit || 'None';
                    option.selected = unit === widget.unit;
                    unitSelect.appendChild(option);
                });
            }
            console.log('Populated unit dropdown');
        } else {
            console.error('widget-unit element not found');
        }

        // Populate form fields
        this.setInputValue('widget-label', widget.label);
        this.setInputValue('widget-x', Math.round(widget.x));
        this.setInputValue('widget-y', Math.round(widget.y));
        this.setInputValue('widget-width', widget.width);
        this.setInputValue('widget-height', widget.height);
        this.setInputValue('widget-margin', widget.margin);
        this.setInputValue('widget-padding', widget.padding);
        this.setInputValue('widget-text-shadow', widget.text_shadow);
        this.setInputValue('widget-border-width', widget.border);
        this.setInputValue('widget-font-size', widget.font_size);
        this.setInputValue('widget-text-ratio', widget.text_ratio);
        this.setInputValue('widget-text-linespace', widget.text_linespace);
        this.setInputValue('widget-at', widget.at);
        this.setInputValue('widget-duration', widget.duration);
        
        // Dropdown selections
        this.setInputValue('widget-label-align', widget.label_align);
        this.setInputValue('widget-value-align', widget.value_align);
        
        // Checkboxes
        this.setCheckboxValue('widget-with-label', widget.with_label);
        this.setCheckboxValue('widget-with-value', widget.with_value);
        this.setCheckboxValue('widget-with-unit', widget.with_unit);
        this.setCheckboxValue('widget-with-picto', widget.with_picto);
        this.setCheckboxValue('widget-display', widget.display);

        // Color fields
        const bgHex = this.extractHexFromColor(widget.background_color);
        const borderHex = this.extractHexFromColor(widget.border_color);
        const textHex = this.extractHexFromColor(widget.text_color || '#ffffff');
        
        this.setInputValue('widget-bg-color', bgHex);
        this.setInputValue('widget-border-color', borderHex);
        this.setInputValue('widget-text-color', textHex);
        
        console.log('Widget properties populated successfully');
    }

    populateMapProperties() {
        if (!this.map) {
            console.log('No map selected for properties');
            return;
        }

        console.log('Populating properties for map:', this.map);

        this.setInputValue('map-source', this.map.source);
        this.setInputValue('map-x', Math.round(this.map.x));
        this.setInputValue('map-y', Math.round(this.map.y));
        this.setInputValue('map-width', this.map.width);
        this.setInputValue('map-height', this.map.height);
        this.setInputValue('map-zoom', this.map.zoom);
        this.setInputValue('map-factor', this.map.factor);
        this.setInputValue('map-margin', this.map.margin);
        this.setInputValue('map-border-width', this.map.border);
        this.setInputValue('map-path-thick', this.map.path_thick);
        this.setInputValue('map-path-border', this.map.path_border);

        // Colors
        const bgHex = this.extractHexFromColor(this.map.background_color);
        const borderHex = this.extractHexFromColor(this.map.border_color);
        this.setInputValue('map-bg-color', bgHex);
        this.setInputValue('map-border-color', borderHex);
        
        console.log('Map properties populated successfully');
    }

    setInputValue(id, value) {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
            console.log(`Set ${id} to:`, value);
        } else {
            console.error(`Element ${id} not found`);
        }
    }

    setCheckboxValue(id, value) {
        const input = document.getElementById(id);
        if (input) {
            input.checked = value;
            console.log(`Set ${id} checkbox to:`, value);
        } else {
            console.error(`Checkbox ${id} not found`);
        }
    }

    getSelectedWidget() {
        if (!this.selectedElement || this.selectedElement.type !== 'widget') return null;
        return this.widgets.find(w => w.id === this.selectedElement.id);
    }

    updateWidgetPosition() {
        const widget = this.getSelectedWidget();
        if (!widget) return;

        const element = document.getElementById(widget.id);
        if (element) {
            element.style.left = `${widget.x * this.canvasScale}px`;
            element.style.top = `${widget.y * this.canvasScale}px`;

            // Update form fields
            this.setInputValue('widget-x', Math.round(widget.x));
            this.setInputValue('widget-y', Math.round(widget.y));
        }
    }

    updateMapPosition() {
        if (!this.map) return;

        const element = document.getElementById(this.map.id);
        if (element) {
            element.style.left = `${this.map.x * this.canvasScale}px`;
            element.style.top = `${this.map.y * this.canvasScale}px`;

            // Update form fields
            this.setInputValue('map-x', Math.round(this.map.x));
            this.setInputValue('map-y', Math.round(this.map.y));
        }
    }

    extractHexFromColor(colorString) {
        // Extract hex from formats like #000000b0
        if (colorString && colorString.startsWith('#') && colorString.length > 7) {
            return colorString.substring(0, 7);
        }
        return colorString || '#000000';
    }

    updateCanvasSize() {
        const resolutionSelect = document.getElementById('canvas-resolution');
        if (!resolutionSelect) return;
        
        const resolution = resolutionSelect.value;
        const [width, height] = resolution.split('x').map(Number);
        
        this.canvasSize = { width, height };
        
        // Update canvas display
        const canvas = document.querySelector('.canvas-background');
        if (canvas) {
            const aspectRatio = height / width;
            const displayWidth = 800;
            const displayHeight = displayWidth * aspectRatio;
            
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;
            
            this.canvasScale = displayWidth / width;
            
            // Update position guide
            const guide = document.getElementById('position-guide');
            if (guide) {
                guide.style.width = `${displayWidth}px`;
                guide.style.height = `${displayHeight}px`;
            }
            
            // Update info display
            const canvasInfo = document.getElementById('canvas-info');
            if (canvasInfo) {
                canvasInfo.textContent = `${width} × ${height}`;
            }
            
            // Re-render all elements with new scale
            this.rerenderAllElements();
        }
    }

    rerenderAllElements() {
        this.widgets.forEach(widget => {
            const element = document.getElementById(widget.id);
            if (element) {
                element.style.left = `${widget.x * this.canvasScale}px`;
                element.style.top = `${widget.y * this.canvasScale}px`;
                element.style.width = `${widget.width * this.canvasScale}px`;
                element.style.height = `${widget.height * this.canvasScale}px`;
            }
        });
        
        if (this.map) {
            const element = document.getElementById(this.map.id);
            if (element) {
                element.style.left = `${this.map.x * this.canvasScale}px`;
                element.style.top = `${this.map.y * this.canvasScale}px`;
                element.style.width = `${this.map.width * this.canvasScale}px`;
                element.style.height = `${this.map.height * this.canvasScale}px`;
            }
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-message');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-message ${type} show`;
            
            setTimeout(() => {
                statusEl.classList.remove('show');
            }, 3000);
        }
    }

    deleteSelectedElement() {
        console.log('deleteSelectedElement called, selected:', this.selectedElement);
        
        if (!this.selectedElement) {
            console.log('No element selected for deletion');
            return;
        }

        if (this.selectedElement.type === 'widget') {
            console.log('Deleting widget:', this.selectedElement.id);
            const widgetIndex = this.widgets.findIndex(w => w.id === this.selectedElement.id);
            console.log('Widget index found:', widgetIndex);
            
            if (widgetIndex > -1) {
                this.widgets.splice(widgetIndex, 1);
                const element = document.getElementById(this.selectedElement.id);
                console.log('Widget element found:', element);
                if (element) element.remove();
                this.showStatus('Widget deleted', 'success');
            }
        } else if (this.selectedElement.type === 'map') {
            console.log('Deleting map:', this.selectedElement.id);
            this.map = null;
            const element = document.getElementById(this.selectedElement.id);
            console.log('Map element found:', element);
            if (element) element.remove();
            this.showStatus('Map deleted', 'success');
        }

        this.clearSelection();
    }
}

// Global editor instance
let editor;

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    editor = new LayoutEditor();
});
// Global functions for HTML event handlers

function changeCanvasResolution() {
    if (editor) {
        editor.updateCanvasSize();
    }
}

function newLayout() {
    if (confirm('Create a new layout? This will clear the current layout.')) {
        if (editor) {
            editor.widgets = [];
            editor.map = null;
            editor.clearSelection();
            const canvas = document.querySelector('.canvas-background');
            if (canvas) {
                canvas.innerHTML = '<div class="aspect-ratio-indicator">Video Preview Area</div>';
            }
            editor.nextWidgetId = 1;
            editor.showStatus('New layout created', 'success');
        }
    }
}

function loadLayout() {
    // Populate existing layouts
    fetch('/get_files')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('existing-layouts');
            if (select) {
                select.innerHTML = '';
                
                data.layouts.forEach(layout => {
                    const option = document.createElement('option');
                    option.value = layout;
                    option.textContent = layout;
                    select.appendChild(option);
                });
                
                const modal = document.getElementById('load-modal');
                if (modal) modal.style.display = 'block';
            }
        })
        .catch(error => {
            if (editor) {
                editor.showStatus('Failed to load layout list', 'error');
            }
        });
}

function confirmLoadLayout() {
    const select = document.getElementById('existing-layouts');
    const selectedLayout = select ? select.value : null;
    
    if (!selectedLayout) {
        if (editor) {
            editor.showStatus('Please select a layout', 'error');
        }
        return;
    }

    fetch(`/api/load_wysiwyg_layout?filename=${encodeURIComponent(selectedLayout)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && editor) {
                // Clear current layout
                editor.widgets = [];
                editor.map = null;
                editor.clearSelection();
                const canvas = document.querySelector('.canvas-background');
                if (canvas) {
                    canvas.innerHTML = '<div class="aspect-ratio-indicator">Video Preview Area</div>';
                }
                
                // Load new layout
                const layout = data.layout;
                
                // Set canvas size
                if (layout.canvas_size) {
                    const resolution = `${layout.canvas_size.width}x${layout.canvas_size.height}`;
                    const resolutionSelect = document.getElementById('canvas-resolution');
                    if (resolutionSelect) {
                        resolutionSelect.value = resolution;
                        editor.updateCanvasSize();
                    }
                }
                
                // Load widgets
                if (layout.widgets) {
                    layout.widgets.forEach((widgetData, index) => {
                        // Ensure widget has a proper ID
                        if (!widgetData.id) {
                            widgetData.id = `widget-${editor.nextWidgetId++}`;
                        }
                        
                        console.log('Loading widget:', widgetData);
                        editor.widgets.push(widgetData);
                        editor.renderWidget(widgetData);
                    });
                    
                    // Update next widget ID to avoid conflicts
                    editor.nextWidgetId = Math.max(editor.nextWidgetId, layout.widgets.length + 1);
                }
                
                // Load map
                if (layout.map) {
                    editor.map = layout.map;
                    editor.renderMap();
                }
                
                editor.showStatus(`Loaded layout: ${selectedLayout}`, 'success');
                closeLoadModal();
            } else {
                if (editor) {
                    editor.showStatus(`Failed to load layout: ${data.error}`, 'error');
                }
            }
        })
        .catch(error => {
            if (editor) {
                editor.showStatus('Failed to load layout', 'error');
            }
        });
}

function saveLayout() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.style.display = 'block';
        const nameInput = document.getElementById('layout-name');
        if (nameInput) nameInput.focus();
    }
}

function confirmSaveLayout() {
    const nameInput = document.getElementById('layout-name');
    const name = nameInput ? nameInput.value.trim() : '';
    
    if (!name) {
        if (editor) {
            editor.showStatus('Please enter a layout name', 'error');
        }
        return;
    }

    if (!editor) return;

    const layoutData = {
        widgets: editor.widgets,
        map: editor.map,
        canvas_size: editor.canvasSize
    };

    fetch('/api/save_wysiwyg_layout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            layout: layoutData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            editor.showStatus(`Layout saved as: ${data.filename}`, 'success');
            closeSaveModal();
        } else {
            editor.showStatus(`Failed to save: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        editor.showStatus('Failed to save layout', 'error');
    });
}

function exportXML() {
    if (!editor) return;

    const layoutData = {
        widgets: editor.widgets,
        map: editor.map,
        canvas_size: editor.canvasSize
    };

    // Generate XML using the backend converter
    fetch('/api/save_wysiwyg_layout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'temp_export',
            layout: layoutData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Fetch the generated XML content
            return fetch(`/get_layout_content?filename=${data.filename}`);
        }
        throw new Error('Failed to generate XML');
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const textarea = document.getElementById('export-xml');
            if (textarea) {
                textarea.value = data.content;
            }
            const modal = document.getElementById('export-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        } else {
            throw new Error(data.error);
        }
    })
    .catch(error => {
        if (editor) {
            editor.showStatus('Failed to export XML', 'error');
        }
    });
}

function copyXMLToClipboard() {
    const textarea = document.getElementById('export-xml');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        if (editor) {
            editor.showStatus('XML copied to clipboard', 'success');
        }
    }
}

function downloadXML() {
    const textarea = document.getElementById('export-xml');
    if (textarea) {
        const content = textarea.value;
        const blob = new Blob([content], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'layout.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (editor) {
            editor.showStatus('XML file downloaded', 'success');
        }
    }
}

function clearCanvas() {
    if (confirm('Clear all widgets and map from the canvas?')) {
        newLayout();
    }
}

function toggleGrid() {
    const canvas = document.getElementById('canvas');
    if (canvas) {
        canvas.classList.toggle('grid-enabled');
    }
}

function zoomCanvas(factor) {
    const canvas = document.querySelector('.canvas-background');
    const zoomLevel = document.getElementById('zoom-level');
    
    if (canvas && zoomLevel) {
        const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '')) || 1;
        const newScale = Math.max(0.5, Math.min(2, currentScale * factor));
        
        canvas.style.transform = `scale(${newScale})`;
        zoomLevel.textContent = `${Math.round(newScale * 100)}%`;
    }
}

function deleteSelectedElement() {
    if (editor) {
        editor.deleteSelectedElement();
    }
}

function duplicateSelectedElement() {
    if (!editor || !editor.selectedElement) return;

    if (editor.selectedElement.type === 'widget') {
        const widget = editor.getSelectedWidget();
        if (widget) {
            const newWidget = { ...widget };
            newWidget.id = `widget-${editor.nextWidgetId++}`;
            newWidget.x += 20;
            newWidget.y += 20;
            editor.widgets.push(newWidget);
            editor.renderWidget(newWidget);
            editor.selectElement(newWidget.id, 'widget');
            editor.showStatus('Widget duplicated', 'success');
        }
    }
}

// Property update functions
function updateWidgetProperty(property, value) {
    if (!editor) return;
    
    const widget = editor.getSelectedWidget();
    if (!widget) return;

    // Update the widget data
    widget[property] = value;

    // Update visual element
    const element = document.getElementById(widget.id);
    if (!element) return;

    if (property === 'label') {
        element.textContent = `${value}${widget.unit ? ' (' + widget.unit + ')' : ''}`;
        console.log('Updated widget label to:', value);
    } else if (property === 'unit') {
        element.textContent = `${widget.label}${value ? ' (' + value + ')' : ''}`;
        console.log('Updated widget unit to:', value);
    } else if (property === 'background_color') {
        element.style.backgroundColor = value;
    } else if (property === 'border_color') {
        element.style.borderColor = value;
    } else if (property === 'border') {
        element.style.borderWidth = `${value}px`;
    } else if (property === 'type') {
        // Change widget type
        const widgetInfo = editor.widgetTypes[value];
        if (widgetInfo) {
            widget.type = value;
            widget.label = widget.label || widgetInfo.name.toUpperCase();
            widget.unit = widgetInfo.default_unit;
            
            // Update visual appearance
            element.className = `canvas-widget widget-${value} ${element.classList.contains('selected') ? 'selected' : ''}`;
            element.textContent = `${widget.label}${widget.unit ? ' (' + widget.unit + ')' : ''}`;
            
            // Update unit options in properties panel
            editor.populateWidgetProperties();
        }
    }
}

function updateWidgetPosition() {
    if (!editor) return;
    
    const widget = editor.getSelectedWidget();
    if (!widget) return;

    const xInput = document.getElementById('widget-x');
    const yInput = document.getElementById('widget-y');
    
    if (xInput && yInput) {
        widget.x = parseInt(xInput.value);
        widget.y = parseInt(yInput.value);

        const element = document.getElementById(widget.id);
        if (element) {
            element.style.left = `${widget.x * editor.canvasScale}px`;
            element.style.top = `${widget.y * editor.canvasScale}px`;
        }
    }
}

function updateWidgetSize() {
    if (!editor) return;
    
    const widget = editor.getSelectedWidget();
    if (!widget) return;

    const widthInput = document.getElementById('widget-width');
    const heightInput = document.getElementById('widget-height');
    
    if (widthInput && heightInput) {
        widget.width = parseInt(widthInput.value);
        widget.height = parseInt(heightInput.value);

        const element = document.getElementById(widget.id);
        if (element) {
            element.style.width = `${widget.width * editor.canvasScale}px`;
            element.style.height = `${widget.height * editor.canvasScale}px`;
        }
    }
}

function updateBackgroundOpacity(opacity) {
    if (!editor) return;
    
    const widget = editor.getSelectedWidget();
    if (!widget) return;

    const hex = editor.extractHexFromColor(widget.background_color);
    const alpha = parseInt(opacity).toString(16).padStart(2, '0');
    widget.background_color = hex + alpha;

    const element = document.getElementById(widget.id);
    if (element) {
        element.style.backgroundColor = widget.background_color;
    }
}

function updateMapProperty(property, value) {
    console.log('updateMapProperty called:', property, value);
    if (!editor || !editor.map) {
        console.log('No editor or map available');
        return;
    }

    // Convert value to appropriate type
    if (property === 'source' || property === 'zoom' || property === 'margin' || property === 'border') {
        editor.map[property] = parseInt(value);
        console.log('Set map', property, 'to integer:', parseInt(value));
    } else if (property.includes('thick') || property.includes('border') && property !== 'border_color' || property === 'factor') {
        editor.map[property] = parseFloat(value);
    } else {
        editor.map[property] = value;
    }

    // Update visual element
    const element = document.getElementById(editor.map.id);
    if (!element) {
        console.log('Map element not found');
        return;
    }
    
    if (property === 'source') {
        element.textContent = `🗺️ Map (Source ${value})`;
        console.log('Updated map display text to show source:', value);
    } else if (property === 'border_color') {
        element.style.borderColor = value;
    } else if (property === 'border') {
        element.style.borderWidth = `${value}px`;
    }
}

function updateMapPosition() {
    if (!editor || !editor.map) return;

    const xInput = document.getElementById('map-x');
    const yInput = document.getElementById('map-y');
    
    if (xInput && yInput) {
        editor.map.x = parseInt(xInput.value);
        editor.map.y = parseInt(yInput.value);

        const element = document.getElementById(editor.map.id);
        if (element) {
            element.style.left = `${editor.map.x * editor.canvasScale}px`;
            element.style.top = `${editor.map.y * editor.canvasScale}px`;
        }
    }
}

function updateMapSize() {
    if (!editor || !editor.map) return;

    const widthInput = document.getElementById('map-width');
    const heightInput = document.getElementById('map-height');
    
    if (widthInput && heightInput) {
        editor.map.width = parseInt(widthInput.value);
        editor.map.height = parseInt(heightInput.value);

        const element = document.getElementById(editor.map.id);
        if (element) {
            element.style.width = `${editor.map.width * editor.canvasScale}px`;
            element.style.height = `${editor.map.height * editor.canvasScale}px`;
        }
    }
}

// Modal functions
function closeSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const nameInput = document.getElementById('layout-name');
    if (nameInput) {
        nameInput.value = '';
    }
}

function closeLoadModal() {
    const modal = document.getElementById('load-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Handle Enter key in modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const saveModal = document.getElementById('save-modal');
        if (saveModal && saveModal.style.display === 'block') {
            confirmSaveLayout();
        }
        
        const loadModal = document.getElementById('load-modal');
        if (loadModal && loadModal.style.display === 'block') {
            confirmLoadLayout();
        }
    }
});