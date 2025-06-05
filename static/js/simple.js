let currentGeneratedLayout = null;

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetContent = document.getElementById(tabName + '-content');
    if (targetContent) targetContent.classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

// Load available files and layouts
function loadFiles() {
    return fetch('/get_files')
        .then(response => response.json())
        .then(data => {
            const mp4Select = document.getElementById('mp4');
            const gpxSelect = document.getElementById('gpx');
            const layoutSelect = document.getElementById('layout');

            if (mp4Select) {
                mp4Select.innerHTML = '<option value="">Select existing MP4...</option>';
                if (data.mp4_files) {
                    data.mp4_files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.text = file;
                        mp4Select.appendChild(option);
                    });
                }
            }

            if (gpxSelect) {
                gpxSelect.innerHTML = '<option value="">Select existing GPX...</option>';
                if (data.gpx_files) {
                    data.gpx_files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.text = file;
                        gpxSelect.appendChild(option);
                    });
                }
            }

            if (layoutSelect) {
                layoutSelect.innerHTML = '<option value="">Select layout...</option>';
                if (data.layouts) {
                    data.layouts.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.text = file;
                        layoutSelect.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading files:', error);
            showStatus('Error loading files: ' + error.message, 'error');
        });
}
// Generate layout XML
function generateLayout() {
    try {
        const mapSource = document.getElementById('mapSource')?.value || '0';
        const speedUnit = document.getElementById('speedUnit')?.value || 'kph';
        const speedWidth = document.getElementById('speedWidth')?.value || '220';
        const speedHeight = document.getElementById('speedHeight')?.value || '60';
        const speedPosition = document.getElementById('speedPosition')?.value || 'left';
        
        const includeElevation = document.getElementById('includeElevation')?.checked || false;
        const includeTime = document.getElementById('includeTime')?.checked || false;
        const includeDistance = document.getElementById('includeDistance')?.checked || false;
        const includeAvgSpeed = document.getElementById('includeAvgSpeed')?.checked || false;

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout>
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
            xml += `    <widget x="50" y="${yOffset}" width="${speedWidth}" height="${speedHeight}" position="${speedPosition}" align="vertical">
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
            xml += `    <widget x="50" y="${yOffset}" width="${speedWidth}" height="${speedHeight}" position="right" align="vertical">
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

        xml += '</layout>';

        const xmlOutput = document.getElementById('xmlOutput');
        if (xmlOutput) xmlOutput.textContent = xml;
        
        const saveBtn = document.getElementById('saveLayoutBtn');
        const useBtn = document.getElementById('useLayoutBtn');
        if (saveBtn) saveBtn.style.display = 'inline-block';
        if (useBtn) useBtn.style.display = 'inline-block';
        
        currentGeneratedLayout = xml;
        showStatus('Layout generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating layout:', error);
    }
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
                    showStatus('Auto-filled start time with seconds', 'success');
                }
            } else if (data.error) {
                showStatus('Could not get video creation time: ' + data.error, 'error');
            }
        })
        .catch(error => {
            showStatus('Error getting video time: ' + error.message, 'error');
        });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Load files
    loadFiles();
    
    // Set up auto-fill button
    const autoFillBtn = document.getElementById('autoFillTime');
    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', function() {
            const selectedFile = document.getElementById('mp4')?.value;
            if (selectedFile) {
                getVideoTime(selectedFile);
            } else {
                showStatus('Please select an existing video file first', 'error');
            }
        });
    }
    
    // Generate initial layout if elements exist
    if (document.getElementById('mapSource')) {
        generateLayout();
    }
});