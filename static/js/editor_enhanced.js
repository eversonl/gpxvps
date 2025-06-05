`, 'error');
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
    const descInput = document.getElementById('layout-description');
    const name = nameInput ? nameInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';
    
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
        canvas_size: editor.canvasSize,
        description: description,
        created: new Date().toISOString(),
        version: '2.0.0-enhanced'
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

    // Update export stats
    const widgetCount = document.getElementById('export-widget-count');
    const mapStatus = document.getElementById('export-map-status');
    const resolution = document.getElementById('export-resolution');
    
    if (widgetCount) widgetCount.textContent = editor.widgets.length;
    if (mapStatus) mapStatus.textContent = editor.map ? 'Included' : 'None';
    if (resolution) resolution.textContent = `${editor.canvasSize.width}×${editor.canvasSize.height}`;

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
        document.execCommand('copy') || navigator.clipboard.writeText(textarea.value);
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
        a.download = 'enhanced_layout.xml';
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
        const isEnabled = canvas.classList.contains('grid-enabled');
        if (editor) {
            editor.showStatus(`Grid ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
        }
    }
}

function autoArrange() {
    if (editor) {
        editor.autoArrange();
    }
}

function zoomCanvas(factor) {
    const canvas = document.querySelector('.canvas-background');
    const zoomLevel = document.getElementById('zoom-level');
    
    if (canvas && zoomLevel) {
        const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '')) || 1;
        const newScale = Math.max(0.5, Math.min(2, currentScale * factor));
        
        canvas.style.transform = `scale(${newScale})`;
        canvas.style.transformOrigin = 'center';
        zoomLevel.textContent = `${Math.round(newScale * 100)}%`;
        
        if (editor) {
            editor.showStatus(`Zoom: ${Math.round(newScale * 100)}%`, 'info');
        }
    }
}

function deleteSelectedElement() {
    if (editor) {
        editor.deleteSelectedElement();
    }
}

function duplicateSelectedElement() {
    if (editor) {
        editor.duplicateSelectedElement();
    }
}

function resetWidget() {
    if (!editor || !editor.selectedElement || editor.selectedElement.type !== 'widget') return;
    
    const widget = editor.getSelectedWidget();
    if (!widget) return;
    
    const widgetInfo = editor.widgetTypes[widget.type];
    if (!widgetInfo) return;
    
    // Reset to default values
    widget.width = widgetInfo.default_size.width;
    widget.height = widgetInfo.default_size.height;
    widget.font_size = widgetInfo.default_font_size || 18;
    widget.margin = 15;
    widget.padding = 8;
    widget.border = 3;
    widget.background_color = editor.getWidgetColor(widget.type);
    widget.border_color = '#000000cc';
    widget.text_color = '#ffffffff';
    
    editor.renderWidget(widget);
    editor.populateWidgetProperties();
    editor.showStatus('Widget reset to defaults', 'success');
}

function resetMap() {
    if (!editor || !editor.map) return;
    
    // Reset map to default values
    editor.map.width = 400;
    editor.map.height = 300;
    editor.map.zoom = 14;
    editor.map.factor = 2.0;
    editor.map.margin = 25;
    editor.map.marker_size = 65;
    editor.map.border = 4;
    editor.map.border_color = '#000000dd';
    editor.map.background_color = '#ffffff99';
    editor.map.path_thick = 5.0;
    editor.map.path_border = 2.5;
    
    editor.renderMap();
    editor.populateMapProperties();
    editor.showStatus('Map reset to defaults', 'success');
}

// Enhanced property update functions
function updateWidgetProperty(property, value) {
    if (!editor) return;
    
    const widget = editor.getSelectedWidget();
    if (!widget) return;

    // Convert value to appropriate type
    if (['margin', 'padding', 'border', 'font_size', 'text_shadow', 'text_linespace', 'at', 'duration', 'lap_target'].includes(property)) {
        value = parseInt(value) || 0;
    } else if (['text_ratio'].includes(property)) {
        value = parseFloat(value) || 1.0;
    } else if (['display', 'with_label', 'with_value', 'with_unit', 'with_picto'].includes(property)) {
        value = Boolean(value);
    }

    // Update the widget data
    widget[property] = value;

    // Update visual element
    const element = document.getElementById(widget.id);
    if (!element) return;

    if (property === 'label') {
        let content = value;
        if (widget.type === 'text' && widget.custom_text) {
            content = widget.custom_text;
        } else if (widget.unit && widget.with_unit) {
            content += ` (${widget.unit})`;
        }
        element.textContent = content;
    } else if (property === 'unit') {
        let content = widget.label;
        if (value && widget.with_unit) {
            content += ` (${value})`;
        }
        element.textContent = content;
    } else if (property === 'custom_text') {
        element.textContent = value;
    } else if (property === 'background_color') {
        element.style.backgroundColor = value;
    } else if (property === 'border_color') {
        element.style.borderColor = value;
    } else if (property === 'text_color') {
        element.style.color = value;
    } else if (property === 'border') {
        element.style.borderWidth = `${value}px`;
    } else if (property === 'font_size') {
        element.style.fontSize = `${Math.max(10, value * editor.canvasScale * 0.8)}px`;
    } else if (property === 'type') {
        // Change widget type
        const widgetInfo = editor.widgetTypes[value];
        if (widgetInfo) {
            widget.type = value;
            widget.label = widget.label || widgetInfo.name.toUpperCase();
            widget.unit = widgetInfo.default_unit || '';
            widget.background_color = editor.getWidgetColor(value);
            
            // Update visual appearance
            element.className = `canvas-widget widget-${value} ${element.classList.contains('selected') ? 'selected' : ''}`;
            element.style.backgroundColor = widget.background_color;
            
            let content = widget.label;
            if (widget.unit && widget.with_unit) {
                content += ` (${widget.unit})`;
            }
            element.textContent = content;
            
            // Update properties panel
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
        widget.x = parseInt(xInput.value) || 0;
        widget.y = parseInt(yInput.value) || 0;

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
        widget.width = parseInt(widthInput.value) || 50;
        widget.height = parseInt(heightInput.value) || 20;

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

    // Update opacity display
    const opacityDisplay = document.getElementById('bg-opacity-value');
    if (opacityDisplay) {
        opacityDisplay.textContent = Math.round((opacity / 255) * 100) + '%';
    }
}

function updateMapProperty(property, value) {
    if (!editor || !editor.map) return;

    // Convert value to appropriate type
    if (['source', 'zoom', 'margin', 'border', 'marker_size'].includes(property)) {
        editor.map[property] = parseInt(value) || 0;
    } else if (['factor', 'path_thick', 'path_border'].includes(property)) {
        editor.map[property] = parseFloat(value) || 1.0;
    } else {
        editor.map[property] = value;
    }

    // Update visual element
    const element = document.getElementById(editor.map.id);
    if (!element) return;
    
    if (property === 'source') {
        const mapInfo = editor.mapSources[value];
        element.textContent = `🗺️ ${mapInfo ? mapInfo.name : 'Map'} (${value})`;
        
        // Update description
        const description = document.getElementById('map-source-description');
        if (description && mapInfo) {
            description.textContent = mapInfo.description;
        }
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
        editor.map.x = parseInt(xInput.value) || 0;
        editor.map.y = parseInt(yInput.value) || 0;

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
        editor.map.width = parseInt(widthInput.value) || 100;
        editor.map.height = parseInt(heightInput.value) || 100;

        const element = document.getElementById(editor.map.id);
        if (element) {
            element.style.width = `${editor.map.width * editor.canvasScale}px`;
            element.style.height = `${editor.map.height * editor.canvasScale}px`;
        }
    }
}

function updateMapBackgroundOpacity(opacity) {
    if (!editor || !editor.map) return;

    const hex = editor.extractHexFromColor(editor.map.background_color);
    const alpha = parseInt(opacity).toString(16).padStart(2, '0');
    editor.map.background_color = hex + alpha;

    // Update opacity display
    const opacityDisplay = document.getElementById('map-bg-opacity-value');
    if (opacityDisplay) {
        opacityDisplay.textContent = Math.round((opacity / 255) * 100) + '%';
    }
}

// Enhanced Modal functions
function closeSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const nameInput = document.getElementById('layout-name');
    const descInput = document.getElementById('layout-description');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
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

function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Reset activity type selector
    const activitySelect = document.getElementById('activity-type');
    if (activitySelect) {
        activitySelect.value = '';
    }
}

// Enhanced modal event handling
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Enhanced keyboard shortcuts
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
        
        const templateModal = document.getElementById('template-modal');
        if (templateModal && templateModal.style.display === 'block') {
            confirmLoadTemplate();
        }
    }
    
    if (event.key === 'Escape') {
        // Close any open modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

console.log('Enhanced GPX2Video WYSIWYG Editor loaded successfully! 🎉');
console.log('Features: 16+ widget types, activity templates, enhanced properties, full gpx2video compatibility');
