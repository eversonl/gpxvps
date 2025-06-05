let currentGeneratedLayout = null;

// Tab switching
function switchTab(tabName) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const targetContent = document.getElementById(tabName + '-content');
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Add active class to clicked tab
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Load available files and layouts
function loadFiles() {
    return fetch('/get_files')
        .then(response => response.json())
        .then(data => {
            const mp4Select = document.getElementById('mp4');
            const gpxSelect = document.getElementById('gpx');
            const layoutSelect = document.getElementById('layout');

            if (!mp4Select || !gpxSelect || !layoutSelect) {
                console.error('Required elements not found');
                return;
            }

            // Clear existing options (except first)
            mp4Select.innerHTML = '<option value="">Select existing MP4...</option>';
            gpxSelect.innerHTML = '<option value="">Select existing GPX...</option>';
            layoutSelect.innerHTML = '<option value="">Select layout...</option>';

            // Populate MP4 files
            if (data.mp4_files) {
                data.mp4_files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file;
                    option.text = file;
                    mp4Select.appendChild(option);
                });
            }

            // Populate GPX files
            if (data.gpx_files) {
                data.gpx_files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file;
                    option.text = file;
                    gpxSelect.appendChild(option);
                });
            }

            // Populate layouts
            if (data.layouts) {
                data.layouts.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file;
                    option.text = file;
                    layoutSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading files:', error);
            showStatus('Error loading files: ' + error.message, 'error');
        });
}
// Generate layout XML based on form inputs
function generateLayout() {
    console.log('Generate layout called');
    
    // Check if all required elements exist
    const requiredElements = [
        'mapSource', 'mapZoom', 'mapFactor', 'mapWidth', 'mapHeight',
        'speedUnit', 'speedWidth', 'speedHeight', 'speedPosition',
        'includeElevation', 'includeTime', 'includeDistance', 'includeAvgSpeed'
    ];
    
    for (let elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            console.warn(`Element ${elementId} not found, skipping layout generation`);
            return;
        }
    }
    
    const mapSource = document.getElementById('mapSource').value;
    const mapZoom = document.getElementById('mapZoom').value;
    const mapFactor = document.getElementById('mapFactor').value;
    const mapWidth = document.getElementById('mapWidth').value;
    const mapHeight = document.getElementById('mapHeight').value;
    
    const speedUnit = document.getElementById('speedUnit').value;
    const speedWidth = document.getElementById('speedWidth').value;
    const speedHeight = document.getElementById('speedHeight').value;
    const speedPosition = document.getElementById('speedPosition').value;
    
    const includeElevation = document.getElementById('includeElevation').checked;
    const includeTime = document.getElementById('includeTime').checked;
    const includeDistance = document.getElementById('includeDistance').checked;
    const includeAvgSpeed = document.getElementById('includeAvgSpeed').checked;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout>
    <!-- Speed Widget -->
    <widget x="50" y="50" width="${speedWidth}" height="${speedHeight}" position="${speedPosition}" align="vertical">
        <type>speed</type>
        <n>SPEED</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>${speedUnit}</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
`;

    let yOffset = 120;

    if (includeElevation) {
        xml += `
    <!-- Elevation Widget -->
    <widget x="50" y="${yOffset}" width="${speedWidth}" height="${speedHeight}" position="${speedPosition}" align="vertical">
        <type>elevation</type>
        <n>ELEVATION</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>m</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
`;
        yOffset += 70;
    }

    if (includeTime) {
        xml += `
    <!-- Time Widget -->
    <widget x="50" y="${yOffset}" width="${speedWidth}" height="${speedHeight}" position="right" align="vertical">
        <type>time</type>
        <n>TIME</n>
        <margin>10</margin>
        <padding>5</padding>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
`;
        yOffset += 70;
    }

    if (includeDistance) {
        xml += `
    <!-- Distance Widget -->
    <widget x="50" y="${yOffset}" width="${speedWidth}" height="${speedHeight}" position="${speedPosition}" align="vertical">
        <type>distance</type>
        <n>DISTANCE</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>km</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
`;
        yOffset += 70;
    }

    if (includeAvgSpeed) {
        xml += `
    <!-- Average Speed Widget -->
    <widget x="50" y="${yOffset}" width="${speedWidth}" height="${speedHeight}" position="${speedPosition}" align="vertical">
        <type>avgspeed</type>
        <n>AVG SPEED</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>${speedUnit}</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
`;
    }

    if (mapSource !== "0") {
        xml += `
    <!-- Map Widget -->
    <map x="800" y="300" width="${mapWidth}" height="${mapHeight}">
        <source>${mapSource}</source>
        <zoom>${mapZoom}</zoom>
        <factor>${mapFactor}</factor>
        <border>5</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
        <path-thick>3.0</path-thick>
        <path-border>1.5</path-border>
    </map>
`;
    }

    xml += `
</layout>`;

    const xmlOutput = document.getElementById('xmlOutput');
    const saveBtn = document.getElementById('saveLayoutBtn');
    const useBtn = document.getElementById('useLayoutBtn');

    if (xmlOutput) {
        xmlOutput.textContent = xml;
    }
    
    if (saveBtn) {
        saveBtn.style.display = 'inline-block';
    }
    
    if (useBtn) {
        useBtn.style.display = 'inline-block';
    }
    
    currentGeneratedLayout = xml;
    showStatus('Layout generated successfully!', 'success');
}

// Save layout to server
function saveLayout() {
    if (!currentGeneratedLayout) {
        showStatus('Please generate a layout first', 'error');
        return;
    }

    const layoutNameInput = document.getElementById('layoutName');
    const layoutName = layoutNameInput ? layoutNameInput.value || `custom_layout_${Date.now()}` : `custom_layout_${Date.now()}`;
    const filename = layoutName.endsWith('.xml') ? layoutName : `${layoutName}.xml`;

    fetch('/save_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename, content: currentGeneratedLayout })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatus(`Layout saved as ${filename}`, 'success');
            loadFiles(); // Refresh the layout dropdown
        } else {
            showStatus(`Error saving layout: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        showStatus(`Error saving layout: ${error.message}`, 'error');
    });
}

// Use generated layout for processing
function useLayoutForProcessing() {
    if (!currentGeneratedLayout) {
        showStatus('Please generate a layout first', 'error');
        return;
    }

    const tempLayoutName = `temp_layout_${Date.now()}.xml`;
    
    fetch('/save_layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: tempLayoutName, content: currentGeneratedLayout })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            switchTab('upload');
            loadFiles().then(() => {
                const layoutSelect = document.getElementById('layout');
                if (layoutSelect) {
                    layoutSelect.value = tempLayoutName;
                    updateCurrentLayout(tempLayoutName);
                }
                showStatus('Generated layout ready for use!', 'success');
            });
        } else {
            showStatus(`Error preparing layout: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        showStatus(`Error preparing layout: ${error.message}`, 'error');
    });
}
// Update current layout display
function updateCurrentLayout(layoutName) {
    const currentLayoutDiv = document.getElementById('current-layout');
    const layoutNameSpan = document.getElementById('layout-name');
    
    if (currentLayoutDiv && layoutNameSpan) {
        if (layoutName) {
            currentLayoutDiv.style.display = 'block';
            layoutNameSpan.textContent = layoutName;
        } else {
            currentLayoutDiv.style.display = 'none';
        }
    }
}

// Get video creation time
function getVideoTime(filename) {
    if (!filename) return;
    
    fetch(`/get_video_time?filename=${encodeURIComponent(filename)}`)
        .then(response => response.json())
        .then(data => {
            if (data.creation_time) {
                const startTimeInput = document.getElementById('start_time');
                if (startTimeInput) {
                    startTimeInput.value = data.creation_time;
                    showStatus('Auto-filled start time from video metadata (with seconds)', 'success');
                }
            } else if (data.error) {
                showStatus('Could not get video creation time: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error getting video time:', error);
            showStatus('Error getting video time: ' + error.message, 'error');
        });
}

// Show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }, 5000);
        }
    } else {
        console.log(`Status: ${message} (${type})`);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners...');
    
    // File selection handlers
    const mp4Select = document.getElementById('mp4');
    if (mp4Select) {
        mp4Select.addEventListener('change', function() {
            if (this.value) {
                const videoFileInput = document.getElementById('video_file');
                if (videoFileInput) {
                    videoFileInput.value = '';
                }
                getVideoTime(this.value);
            }
        });
    }

    const videoFileInput = document.getElementById('video_file');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const mp4Select = document.getElementById('mp4');
                if (mp4Select) {
                    mp4Select.value = '';
                }
            }
        });
    }

    const gpxSelect = document.getElementById('gpx');
    if (gpxSelect) {
        gpxSelect.addEventListener('change', function() {
            if (this.value) {
                const gpxFileInput = document.getElementById('gpx_file');
                if (gpxFileInput) {
                    gpxFileInput.value = '';
                }
            }
        });
    }

    const gpxFileInput = document.getElementById('gpx_file');
    if (gpxFileInput) {
        gpxFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const gpxSelect = document.getElementById('gpx');
                if (gpxSelect) {
                    gpxSelect.value = '';
                }
            }
        });
    }

    const layoutSelect = document.getElementById('layout');
    if (layoutSelect) {
        layoutSelect.addEventListener('change', function() {
            updateCurrentLayout(this.value);
        });
    }

    const autoFillBtn = document.getElementById('autoFillTime');
    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', function() {
            const selectedFile = mp4Select ? mp4Select.value : '';
            const uploadedFile = videoFileInput ? videoFileInput.files[0] : null;
            
            if (selectedFile) {
                getVideoTime(selectedFile);
            } else if (uploadedFile) {
                showStatus('Auto-fill only works with existing files. Please upload the file first, then select it from the dropdown.', 'error');
            } else {
                showStatus('Please select an existing video file first', 'error');
            }
        });
    }

    // Form submission
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            const videoFile = videoFileInput ? videoFileInput.files[0] : null;
            const videoSelect = mp4Select ? mp4Select.value : '';
            const gpxFile = gpxFileInput ? gpxFileInput.files[0] : null;
            const gpxSelectValue = gpxSelect ? gpxSelect.value : '';
            const layout = layoutSelect ? layoutSelect.value : '';

            // Validation
            if (!videoFile && !videoSelect) {
                e.preventDefault();
                showStatus('Please select or upload a video file', 'error');
                return;
            }

            if (!gpxFile && !gpxSelectValue) {
                e.preventDefault();
                showStatus('Please select or upload a GPX file', 'error');
                return;
            }

            if (!layout) {
                e.preventDefault();
                showStatus('Please select a layout', 'error');
                return;
            }

            showStatus('Processing video... This may take a while.', 'success');
        });
    }

    // Load files and generate initial layout if generator tab exists
    loadFiles().then(() => {
        // Only generate layout if we're on a page with the generator elements
        if (document.getElementById('mapSource')) {
            generateLayout();
        }
    });
    
    console.log('Event listeners setup complete');
});