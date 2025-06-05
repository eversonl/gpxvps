from flask import Flask, request, render_template, redirect, url_for, send_file, jsonify
import os
import subprocess
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import xml.etree.ElementTree as ET

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
LAYOUT_FOLDER = 'layouts'  # Use local layouts folder
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload and layout directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(LAYOUT_FOLDER, exist_ok=True)

# Check if we have layouts, if not create samples
if not os.path.exists(LAYOUT_FOLDER) or len([f for f in os.listdir(LAYOUT_FOLDER) if f.endswith('.xml')]) == 0:
    print(f"No layouts found in {LAYOUT_FOLDER}. Will create sample layouts on startup.")
else:
    print(f"Found layouts in: {LAYOUT_FOLDER}")

@app.route('/editor')
def editor():
    """WYSIWYG Layout Editor"""
    return render_template('editor.html')

@app.route('/api/widget_types')
def get_widget_types():
    """Get available widget types and their properties - ENHANCED VERSION"""
    widget_types = {
        # Speed widgets
        'speed': {
            'name': 'Speed',
            'icon': '🏃',
            'default_unit': 'kph',
            'units': ['kph', 'mph', 'ms'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'speed'
        },
        'avgspeed': {
            'name': 'Average Speed',
            'icon': '📊',
            'default_unit': 'kph',
            'units': ['kph', 'mph', 'ms'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'speed'
        },
        'maxspeed': {
            'name': 'Max Speed',
            'icon': '🚀',
            'default_unit': 'kph',
            'units': ['kph', 'mph', 'ms'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'speed'
        },
        'avgridespeed': {
            'name': 'Average Ride Speed',
            'icon': '🚴',
            'default_unit': 'kph',
            'units': ['kph', 'mph', 'ms'],
            'default_size': {'width': 180, 'height': 40},
            'default_font_size': 18,
            'category': 'speed'
        },
        'vspeed': {
            'name': 'Vertical Speed',
            'icon': '⬆️',
            'default_unit': 'mps',
            'units': ['mps'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'speed'
        },
        
        # Position & Navigation
        'elevation': {
            'name': 'Elevation',
            'icon': '⛰️',
            'default_unit': 'm',
            'units': ['m', 'ft'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'navigation'
        },
        'grade': {
            'name': 'Grade/Slope',
            'icon': '📐',
            'default_unit': '',
            'units': ['', '%', '°'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'navigation'
        },
        'heading': {
            'name': 'Heading',
            'icon': '🧭',
            'default_unit': '',
            'units': ['', '°'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'navigation'
        },
        'position': {
            'name': 'GPS Position',
            'icon': '📍',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 200, 'height': 50},
            'default_font_size': 14,
            'category': 'navigation'
        },
        
        # Distance & Time
        'distance': {
            'name': 'Distance',
            'icon': '📏',
            'default_unit': 'km',
            'units': ['km', 'mi', 'm', 'ft'],
            'default_size': {'width': 160, 'height': 30},
            'default_font_size': 16,
            'category': 'distance'
        },
        'time': {
            'name': 'Time',
            'icon': '⏱️',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 160, 'height': 30},
            'default_font_size': 16,
            'category': 'time'
        },
        'duration': {
            'name': 'Duration',
            'icon': '⏳',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 160, 'height': 30},
            'default_font_size': 16,
            'category': 'time'
        },
        'date': {
            'name': 'Date',
            'icon': '📅',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 180, 'height': 30},
            'default_font_size': 16,
            'category': 'time',
            'supports_format': True,
            'default_format': '%Y-%m-%d'
        },
        
        # Biometric Data
        'heartrate': {
            'name': 'Heart Rate',
            'icon': '❤️',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'biometric'
        },
        'cadence': {
            'name': 'Cadence',
            'icon': '🔄',
            'default_unit': '',
            'units': ['', 'spm'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'biometric'
        },
        
        # Environmental
        'temperature': {
            'name': 'Temperature',
            'icon': '🌡️',
            'default_unit': 'celsius',
            'units': ['celsius', 'fahrenheit', 'C', 'F'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'environmental'
        },
        
        # Physics
        'gforce': {
            'name': 'G-Force',
            'icon': '⚡',
            'default_unit': 'g',
            'units': ['g', 'mps2'],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'physics'
        },
        
        # Activity
        'lap': {
            'name': 'Lap Counter',
            'icon': '🏁',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 160, 'height': 40},
            'default_font_size': 18,
            'category': 'activity',
            'supports_lap_target': True,
            'default_lap_target': 10
        },
        
        # Custom Content
        'image': {
            'name': 'Image',
            'icon': '🖼️',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 200, 'height': 150},
            'default_font_size': 16,
            'category': 'custom',
            'supports_image': True,
            'zoom_options': ['none', 'fit', 'fill', 'crop', 'stretch'],
            'default_zoom': 'fit'
        },
        'text': {
            'name': 'Custom Text',
            'icon': '📝',
            'default_unit': '',
            'units': [''],
            'default_size': {'width': 200, 'height': 40},
            'default_font_size': 16,
            'category': 'custom',
            'supports_custom_text': True,
            'default_text': 'Custom Text'
        }
    }
    return jsonify(widget_types)

@app.route('/api/widget_categories')
def get_widget_categories():
    """Get widget categories for organized palette"""
    categories = {
        'speed': {
            'name': 'Speed & Motion',
            'icon': '🏃',
            'description': 'Speed, velocity and motion widgets'
        },
        'navigation': {
            'name': 'Navigation',
            'icon': '🧭', 
            'description': 'Position, elevation and navigation data'
        },
        'distance': {
            'name': 'Distance',
            'icon': '📏',
            'description': 'Distance and measurement widgets'
        },
        'time': {
            'name': 'Time & Date',
            'icon': '⏱️',
            'description': 'Time, date and duration widgets'
        },
        'biometric': {
            'name': 'Biometric',
            'icon': '❤️',
            'description': 'Heart rate, cadence and fitness data'
        },
        'environmental': {
            'name': 'Environmental',
            'icon': '🌡️',
            'description': 'Temperature and weather data'
        },
        'physics': {
            'name': 'Physics',
            'icon': '⚡',
            'description': 'G-force and physics measurements'
        },
        'activity': {
            'name': 'Activity',
            'icon': '🏁',
            'description': 'Lap counters and activity tracking'
        },
        'custom': {
            'name': 'Custom Content',
            'icon': '🎨',
            'description': 'Images, text and custom elements'
        }
    }
    return jsonify(categories)

@app.route('/api/map_sources')
def get_map_sources():
    """Get available map sources"""
    map_sources = {
        '0': {'name': 'None', 'description': 'No map overlay'},
        '1': {'name': 'OpenStreetMap', 'description': 'General purpose mapping'},
        '4': {'name': 'Maps-For-Free', 'description': 'Free topographic maps'},
        '5': {'name': 'OpenCycleMap', 'description': 'Cycling-focused with bike routes'},
        '6': {'name': 'OpenTopoMap', 'description': 'Topographical with contour lines'},
        '7': {'name': 'Public Transport', 'description': 'ÖPNVKarte transport maps'},
        '8': {'name': 'Google Maps', 'description': 'Google street maps'},
        '9': {'name': 'Google Satellite', 'description': 'Google satellite imagery'},
        '10': {'name': 'Google Hybrid', 'description': 'Google maps + satellite'},
        '11': {'name': 'Bing Maps', 'description': 'Microsoft Virtual Earth maps'},
        '12': {'name': 'Bing Satellite', 'description': 'Microsoft satellite imagery'},
        '13': {'name': 'Bing Hybrid', 'description': 'Microsoft maps + satellite'},
        '15': {'name': 'IGN Essentiel', 'description': 'IGN topographic maps (France)'},
        '16': {'name': 'IGN Photo', 'description': 'IGN aerial photography (France)'}
    }
    return jsonify(map_sources)

@app.route('/api/save_wysiwyg_layout', methods=['POST'])
def save_wysiwyg_layout():
    """Save a layout created in the WYSIWYG editor"""
    try:
        data = request.get_json()
        layout_name = secure_filename(data.get('name', ''))
        layout_data = data.get('layout', {})
        
        if not layout_name:
            return jsonify({'success': False, 'error': 'No layout name provided'}), 400
            
        if not layout_name.endswith('.xml'):
            layout_name += '.xml'
            
        # Convert the visual layout to XML
        xml_content = convert_visual_layout_to_xml(layout_data)
        
        # Save to layouts folder
        layout_path = os.path.join(LAYOUT_FOLDER, layout_name)
        with open(layout_path, 'w', encoding='utf-8') as f:
            f.write(xml_content)
            
        return jsonify({'success': True, 'filename': layout_name})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/load_wysiwyg_layout')
def load_wysiwyg_layout():
    """Load a layout for the WYSIWYG editor"""
    try:
        filename = request.args.get('filename')
        if not filename:
            return jsonify({'success': False, 'error': 'No filename provided'}), 400
            
        layout_path = os.path.join(LAYOUT_FOLDER, secure_filename(filename))
        
        if not os.path.exists(layout_path):
            return jsonify({'success': False, 'error': 'Layout file not found'}), 404
            
        # Parse XML and convert to visual format
        visual_layout = convert_xml_layout_to_visual(layout_path)
        
        return jsonify({'success': True, 'layout': visual_layout})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def convert_visual_layout_to_xml(layout_data):
    """Convert visual layout data to XML format with proper relative positioning"""
    root = ET.Element('layout')
    
    # Add comment
    comment = ET.Comment(' Generated by Enhanced WYSIWYG Layout Editor with Full gpx2video Support ')
    root.append(comment)
    
    # Add widgets
    for widget in layout_data.get('widgets', []):
        widget_elem = ET.SubElement(root, 'widget')
        
        # Determine relative position based on visual coordinates
        pos_data = determine_relative_position(widget, layout_data.get('canvas_size', {'width': 1920, 'height': 1080}))
        
        # Set attributes - include BOTH absolute coordinates AND relative positioning
        widget_elem.set('x', str(int(widget.get('x', 25))))
        widget_elem.set('y', str(int(widget.get('y', 45))))
        widget_elem.set('width', str(int(widget.get('width', 160))))
        widget_elem.set('height', str(int(widget.get('height', 40))))
        widget_elem.set('position', pos_data['position'])
        widget_elem.set('align', pos_data['align'])
        
        # Add timing attributes
        widget_elem.set('at', str(widget.get('at', 1000)))
        widget_elem.set('duration', str(widget.get('duration', 9000)))
        widget_elem.set('display', 'true' if widget.get('display', True) else 'false')
        
        # Add child elements - use 'name' instead of 'n'
        ET.SubElement(widget_elem, 'type').text = widget.get('type', 'speed')
        ET.SubElement(widget_elem, 'name').text = widget.get('label', widget.get('type', 'SPEED').upper())
        ET.SubElement(widget_elem, 'margin').text = str(widget.get('margin', 10))
        ET.SubElement(widget_elem, 'padding').text = str(widget.get('padding', 5))
        
        # Handle units - don't add unit tag if empty or problematic
        unit = widget.get('unit', '')
        if unit and unit not in ['bpm', 'rpm']:  # Skip problematic units
            ET.SubElement(widget_elem, 'unit').text = unit
            
        # Typography properties
        font_size = widget.get('font_size', 18)
        ET.SubElement(widget_elem, 'font-size').text = str(font_size)
        
        if widget.get('text_color'):
            ET.SubElement(widget_elem, 'text-color').text = widget.get('text_color')
        
        ET.SubElement(widget_elem, 'text-ratio').text = str(widget.get('text_ratio', 2.0))
        ET.SubElement(widget_elem, 'text-shadow').text = str(widget.get('text_shadow', 3))
        
        if widget.get('text_linespace'):
            ET.SubElement(widget_elem, 'text-linespace').text = str(widget.get('text_linespace', 2))
            
        # Layout properties
        ET.SubElement(widget_elem, 'label-align').text = widget.get('label_align', 'left')
        ET.SubElement(widget_elem, 'value-align').text = widget.get('value_align', 'right')
        
        # Visual properties
        ET.SubElement(widget_elem, 'border').text = str(widget.get('border', 5))
        ET.SubElement(widget_elem, 'border-color').text = widget.get('border_color', '#000000b0')
        ET.SubElement(widget_elem, 'background-color').text = widget.get('background_color', '#0000004c')
        
        # Display options
        ET.SubElement(widget_elem, 'with-label').text = 'true' if widget.get('with_label', True) else 'false'
        ET.SubElement(widget_elem, 'with-value').text = 'true' if widget.get('with_value', True) else 'false'
        ET.SubElement(widget_elem, 'with-unit').text = 'true' if widget.get('with_unit', True) else 'false'
        ET.SubElement(widget_elem, 'with-picto').text = 'true' if widget.get('with_picto', True) else 'false'
        
        # ENHANCED: Widget-specific properties
        widget_type = widget.get('type', 'speed')
        
        # Date format support
        if widget_type == 'date' and widget.get('format'):
            ET.SubElement(widget_elem, 'format').text = widget.get('format', '%Y-%m-%d')
        
        # Lap target support
        if widget_type == 'lap' and widget.get('lap_target'):
            ET.SubElement(widget_elem, 'nbr-lap').text = str(widget.get('lap_target', 10))
        
        # Image widget support
        if widget_type == 'image':
            if widget.get('image_source'):
                ET.SubElement(widget_elem, 'source').text = widget.get('image_source')
            zoom_option = widget.get('zoom_option', 'fit')
            if zoom_option in ['none', 'fit', 'fill', 'crop', 'stretch']:
                ET.SubElement(widget_elem, 'zoom').text = zoom_option
        
        # Custom text support
        if widget_type == 'text' and widget.get('custom_text'):
            ET.SubElement(widget_elem, 'text').text = widget.get('custom_text', 'Custom Text')
    
    # Add map if present
    if layout_data.get('map'):
        map_data = layout_data['map']
        map_elem = ET.SubElement(root, 'map')
        
        # Use relative positioning for maps
        pos_data = determine_relative_position(map_data, layout_data.get('canvas_size', {'width': 1920, 'height': 1080}))
        map_elem.set('position', pos_data['position'])
        map_elem.set('display', 'true')
        
        ET.SubElement(map_elem, 'source').text = str(map_data.get('source', 6))
        ET.SubElement(map_elem, 'zoom').text = str(map_data.get('zoom', 13))
        ET.SubElement(map_elem, 'factor').text = str(map_data.get('factor', 2.0))
        ET.SubElement(map_elem, 'margin').text = str(map_data.get('margin', 20))
        
        # ENHANCED: Additional map properties
        ET.SubElement(map_elem, 'marker').text = str(map_data.get('marker_size', 60))
        ET.SubElement(map_elem, 'border').text = str(map_data.get('border', 3))
        ET.SubElement(map_elem, 'border-color').text = map_data.get('border_color', '#000000cc')
        ET.SubElement(map_elem, 'background-color').text = map_data.get('background_color', '#ffffff88')
        
        # Path styling
        ET.SubElement(map_elem, 'path-thick').text = str(map_data.get('path_thick', 4.0))
        ET.SubElement(map_elem, 'path-border').text = str(map_data.get('path_border', 2.0))
    
    # Convert to string
    from xml.dom import minidom
    rough_string = ET.tostring(root, encoding='unicode')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="    ").replace('<?xml version="1.0" ?>', '<?xml version="1.0" encoding="UTF-8"?>')

def determine_relative_position(element, canvas_size):
    """Determine relative position based on element coordinates"""
    x = element.get('x', 0)
    y = element.get('y', 0)
    width = element.get('width', 160)
    height = element.get('height', 40)
    
    canvas_width = canvas_size['width']
    canvas_height = canvas_size['height']
    
    # Calculate center position
    center_x = x + width / 2
    center_y = y + height / 2
    
    # Determine position
    if center_x < canvas_width / 3:
        h_pos = 'left'
    elif center_x > canvas_width * 2 / 3:
        h_pos = 'right'
    else:
        h_pos = 'center'
    
    if center_y < canvas_height / 3:
        v_pos = 'top'
    elif center_y > canvas_height * 2 / 3:
        v_pos = 'bottom'
    else:
        v_pos = 'center'
    
    # Combine positions
    if h_pos == 'center' and v_pos == 'center':
        position = 'center'
        align = 'horizontal'
    elif h_pos == 'center':
        position = v_pos
        align = 'horizontal'
    elif v_pos == 'center':
        position = h_pos
        align = 'vertical'
    else:
        position = f"{v_pos}-{h_pos}"
        align = 'vertical' if len(element.get('stacked_widgets', [])) > 1 else 'horizontal'
    
    return {'position': position, 'align': align}

def convert_xml_layout_to_visual(layout_path):
    """Convert XML layout to visual format for the editor"""
    try:
        tree = ET.parse(layout_path)
        root = tree.getroot()
        
        visual_layout = {
            'widgets': [],
            'map': None,
            'canvas_size': {'width': 1920, 'height': 1080}
        }
        
        # Parse widgets
        widget_index = 0
        for widget_elem in root.findall('widget'):
            # Get position - prefer absolute coordinates if available, otherwise estimate from relative
            x_coord = int(widget_elem.get('x', 0)) if widget_elem.get('x') else 0
            y_coord = int(widget_elem.get('y', 0)) if widget_elem.get('y') else 0
            
            # If no absolute coordinates, estimate from relative position
            if x_coord == 0 and y_coord == 0:
                relative_pos = widget_elem.get('position', 'left')
                align = widget_elem.get('align', 'vertical')
                estimated_pos = estimate_position_from_relative(relative_pos, visual_layout['canvas_size'])
                
                # Stack widgets vertically if they have the same relative position
                if align == 'vertical':
                    estimated_pos['y'] += widget_index * 70  # Stack with 70px spacing
                
                x_coord = estimated_pos['x']
                y_coord = estimated_pos['y']
            
            widget = {
                'id': f'widget-{widget_index + 1}',
                'type': widget_elem.find('type').text if widget_elem.find('type') is not None else 'speed',
                'label': (widget_elem.find('name').text if widget_elem.find('name') is not None 
                         else widget_elem.find('n').text if widget_elem.find('n') is not None 
                         else 'LABEL'),
                'x': x_coord,
                'y': y_coord,
                'width': int(widget_elem.get('width', 160)),
                'height': int(widget_elem.get('height', 40)),
                'position': widget_elem.get('position', 'left'),
                'align': widget_elem.get('align', 'vertical'),
                'margin': int(widget_elem.find('margin').text) if widget_elem.find('margin') is not None else 10,
                'padding': int(widget_elem.find('padding').text) if widget_elem.find('padding') is not None else 5,
                'unit': widget_elem.find('unit').text if widget_elem.find('unit') is not None else '',
                'text_shadow': int(widget_elem.find('text-shadow').text) if widget_elem.find('text-shadow') is not None else 3,
                'border': int(widget_elem.find('border').text) if widget_elem.find('border') is not None else 2,
                'border_color': widget_elem.find('border-color').text if widget_elem.find('border-color') is not None else '#000000b0',
                'background_color': widget_elem.find('background-color').text if widget_elem.find('background-color') is not None else '#0000004c'
            }
            
            # Add font properties
            if widget_elem.find('font-size') is not None:
                widget['font_size'] = int(widget_elem.find('font-size').text)
            if widget_elem.find('text-linespace') is not None:
                widget['text_linespace'] = int(widget_elem.find('text-linespace').text)
                
            visual_layout['widgets'].append(widget)
            widget_index += 1
        
        # Parse map
        map_elem = root.find('map')
        if map_elem is not None:
            map_data = {
                'x': int(map_elem.get('x', 1400)) if map_elem.get('x') else estimate_position_from_relative(map_elem.get('position', 'top-right'), visual_layout['canvas_size'])['x'],
                'y': int(map_elem.get('y', 100)) if map_elem.get('y') else estimate_position_from_relative(map_elem.get('position', 'top-right'), visual_layout['canvas_size'])['y'],
                'width': int(map_elem.get('width', 400)) if map_elem.get('width') else 400,
                'height': int(map_elem.get('height', 300)) if map_elem.get('height') else 300,
                'position': map_elem.get('position', 'top-right'),
                'source': int(map_elem.find('source').text) if map_elem.find('source') is not None else 6,
                'zoom': int(map_elem.find('zoom').text) if map_elem.find('zoom') is not None else 13,
                'factor': float(map_elem.find('factor').text) if map_elem.find('factor') is not None else 2.0,
                'margin': int(map_elem.find('margin').text) if map_elem.find('margin') is not None else 20,
                'border': int(map_elem.find('border').text) if map_elem.find('border') is not None else 3,
                'border_color': map_elem.find('border-color').text if map_elem.find('border-color') is not None else '#000000cc',
                'background_color': map_elem.find('background-color').text if map_elem.find('background-color') is not None else '#ffffff88',
                'path_thick': float(map_elem.find('path-thick').text) if map_elem.find('path-thick') is not None else 4.0,
                'path_border': float(map_elem.find('path-border').text) if map_elem.find('path-border') is not None else 2.0
            }
            visual_layout['map'] = map_data
        
        return visual_layout
        
    except Exception as e:
        raise Exception(f"Error parsing XML layout: {str(e)}")

def estimate_position_from_relative(position, canvas_size):
    """Estimate pixel position from relative position"""
    width = canvas_size['width']
    height = canvas_size['height']
    
    positions = {
        'top-left': {'x': 50, 'y': 50},
        'top': {'x': width // 2 - 200, 'y': 50},
        'top-right': {'x': width - 450, 'y': 50},
        'left': {'x': 50, 'y': height // 2 - 150},
        'center': {'x': width // 2 - 200, 'y': height // 2 - 150},
        'right': {'x': width - 450, 'y': height // 2 - 150},
        'bottom-left': {'x': 50, 'y': height - 350},
        'bottom': {'x': width // 2 - 200, 'y': height - 350},
        'bottom-right': {'x': width - 450, 'y': height - 350}
    }
    
    return positions.get(position, {'x': width - 450, 'y': 50})

@app.route('/')
def index():
    try:
        layouts = [f for f in os.listdir(LAYOUT_FOLDER) if f.endswith('.xml')]
        print(f"Found layouts in {LAYOUT_FOLDER}: {layouts}")  # Debug output
    except (OSError, FileNotFoundError) as e:
        print(f"Error reading layout folder {LAYOUT_FOLDER}: {e}")
        layouts = []
    
    try:
        gpx_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith('.gpx')]
        video_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith('.mp4')]
    except (OSError, FileNotFoundError) as e:
        print(f"Error reading upload folder {UPLOAD_FOLDER}: {e}")
        gpx_files = []
        video_files = []
    
    return render_template('upload.html', layouts=layouts, gpx_files=gpx_files, video_files=video_files)

@app.route('/get_files')
def get_files():
    try:
        layouts = [f for f in os.listdir(LAYOUT_FOLDER) if f.endswith('.xml')]
        print(f"API: Found layouts in {LAYOUT_FOLDER}: {layouts}")  # Debug output
    except (OSError, FileNotFoundError) as e:
        print(f"API: Error reading layout folder {LAYOUT_FOLDER}: {e}")
        layouts = []
    
    try:
        gpx_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith('.gpx')]
        mp4_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith('.mp4')]
    except (OSError, FileNotFoundError) as e:
        print(f"API: Error reading upload folder {UPLOAD_FOLDER}: {e}")
        gpx_files = []
        mp4_files = []
    
    result = {
        'layouts': layouts,
        'gpx_files': gpx_files,
        'mp4_files': mp4_files,
        'layout_folder': LAYOUT_FOLDER  # Include for debugging
    }
    
    print(f"API response: {result}")  # Debug output
    return jsonify(result)

@app.route('/upload', methods=['POST'])
def upload_file():
    # Get existing form data
    gpx_file = request.files.get('gpx_file')
    video_file = request.files.get('video_file')
    layout_choice = request.form.get('layout')
    start_time = request.form.get('start_time')
    offset = request.form.get('offset', '0')
    
    # NEW: Get telemetry options from the enhanced form
    telemetry_method = request.form.get('telemetry_method')
    telemetry_rate = request.form.get('telemetry_rate', '1000')
    
    # Handle case where files are selected from dropdowns instead of uploaded
    if not gpx_file or gpx_file.filename == '':
        gpx_filename = request.form.get('gpx')
        if gpx_filename:
            gpx_path = os.path.join(app.config['UPLOAD_FOLDER'], gpx_filename)
        else:
            return 'Missing GPX file', 400
    else:
        gpx_filename = secure_filename(gpx_file.filename)
        gpx_path = os.path.join(app.config['UPLOAD_FOLDER'], gpx_filename)
        gpx_file.save(gpx_path)
    
    if not video_file or video_file.filename == '':
        video_filename = request.form.get('mp4')
        if video_filename:
            video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
        else:
            return 'Missing video file', 400
    else:
        video_filename = secure_filename(video_file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
        video_file.save(video_path)
    
    if not layout_choice:
        return 'Missing layout choice', 400
    
    # Generate output filename
    base_name = os.path.splitext(video_filename)[0]
    output_filename = f"output_{base_name}.mp4"
    output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
    
    layout_path = os.path.join(LAYOUT_FOLDER, layout_choice)
    
    # Convert relative paths to absolute paths to avoid issues
    gpx_path = os.path.abspath(gpx_path)
    video_path = os.path.abspath(video_path)
    output_path = os.path.abspath(output_path)
    layout_path = os.path.abspath(layout_path)
    
    # Build the gpx2video command
    command = [
        "gpx2video",
        "-m", video_path,
        "-g", gpx_path,
        "-l", layout_path,
        "-o", output_path
    ]
    
    # Add start time if provided
    if start_time:
        print(f"Debug: Start time from form: '{start_time}'")  # Debug output
        
        # Ensure start time includes seconds for gpx2video compatibility
        if len(start_time) == 16 and start_time.count(':') == 1:  # Format: 2025-02-19T11:02
            start_time += ':00'
            print(f"Debug: Fixed start time to include seconds: '{start_time}'")
        
        command += ["--start-time", start_time]
    
    # Add offset if provided and not zero
    if offset and offset != "0":
        command += ["--offset", offset]
    
    # NEW: Add telemetry options if provided
    if telemetry_method:
        command += ["--telemetry-method", telemetry_method]
        print(f"🔧 Using telemetry method: {telemetry_method}")
    
    if telemetry_rate and telemetry_rate != "1000":
        command += ["--telemetry-rate", telemetry_rate]
        print(f"🔧 Using telemetry rate: {telemetry_rate}ms")
    
    # Add the video command at the end
    command.append("video")
    
    try:
        # Display the clean command for debugging
        clean_command = ' '.join([
            "gpx2video",
            f"-m {os.path.basename(video_path)}",
            f"-g {os.path.basename(gpx_path)}",
            f"-l {os.path.basename(layout_path)}",
            f"-o {os.path.basename(output_path)}"
        ])
        if start_time:
            clean_command += f" --start-time {start_time}"
        if offset and offset != "0":
            clean_command += f" --offset {offset}"
        if telemetry_method:
            clean_command += f" --telemetry-method {telemetry_method}"
        if telemetry_rate and telemetry_rate != "1000":
            clean_command += f" --telemetry-rate {telemetry_rate}"
        clean_command += " video"
        
        print(f"=== RUNNING ENHANCED COMMAND ===")
        print(f"Clean command: {clean_command}")
        print(f"Full command array: {command}")
        print(f"Working directory: {os.path.dirname(os.path.abspath(__file__))}")
        print(f"Telemetry method: {telemetry_method if telemetry_method else 'Default'}")
        print(f"Telemetry rate: {telemetry_rate}ms")
        print(f"Layout file: {os.path.basename(layout_path)}")
        print(f"Layout full path: {layout_path}")
        
        # DEBUG: Check layout content and validate XML
        try:
            with open(layout_path, 'r') as f:
                layout_content = f.read()
                print(f"=== LAYOUT FILE CONTENT ===")
                print(layout_content[:500] + "..." if len(layout_content) > 500 else layout_content)
                print(f"=== END LAYOUT CONTENT ===")
                
                # Check for problematic units
                if 'bpm' in layout_content:
                    print("⚠️ WARNING: Layout contains 'bpm' unit which causes errors!")
                if 'rpm' in layout_content:
                    print("⚠️ WARNING: Layout contains 'rpm' unit which causes errors!")
                
                # Check for map presence
                if '<map' in layout_content:
                    print("✅ DEBUG: Map found in layout file")
                    # Extract map details
                    import re
                    source_match = re.search(r'<source>(\d+)</source>', layout_content)
                    position_match = re.search(r'position="([^"]+)"', layout_content)
                    
                    if source_match:
                        print(f"🗺️ DEBUG: Map source: {source_match.group(1)}")
                    if position_match:
                        print(f"📍 DEBUG: Map position: {position_match.group(1)}")
                else:
                    print("❌ DEBUG: No map found in layout file")
        except Exception as e:
            print(f"❌ DEBUG: Error reading layout file: {e}")
        
        print(f"================================")
        
        # Check and fix cache directory permissions
        cache_dir = os.path.expanduser("~/.gpx2video/cache")
        if not os.path.exists(cache_dir):
            print(f"Creating cache directory: {cache_dir}")
            os.makedirs(cache_dir, mode=0o755, exist_ok=True)
        else:
            print(f"Cache directory exists: {cache_dir}")
            # Check if we can write to it
            try:
                test_file = os.path.join(cache_dir, "test_write")
                with open(test_file, 'w') as f:
                    f.write("test")
                os.remove(test_file)
                print("Cache directory is writable")
            except Exception as e:
                print(f"Cache directory write test failed: {e}")
                # Try to fix permissions
                try:
                    os.chmod(cache_dir, 0o755)
                    for root, dirs, files in os.walk(cache_dir):
                        for d in dirs:
                            os.chmod(os.path.join(root, d), 0o755)
                        for f in files:
                            os.chmod(os.path.join(root, f), 0o644)
                    print("Fixed cache directory permissions")
                except Exception as perm_error:
                    print(f"Could not fix permissions: {perm_error}")
        
        # Set environment variables that might help with the crash
        env = os.environ.copy()
        env['OIIO_THREADS'] = '1'  # Limit OpenImageIO threads
        env['MALLOC_CHECK_'] = '0'  # Disable malloc checking that can cause issues
        env['GPX2VIDEO_CACHE_DIR'] = cache_dir  # Explicitly set cache directory
        
        # Run the command with a timeout to prevent hanging
        result = subprocess.run(
            command, 
            check=True, 
            capture_output=True, 
            text=True, 
            timeout=1800,  # 30 minute timeout
            env=env,
            cwd=os.path.dirname(os.path.abspath(__file__))  # Set working directory
        )
        
        print(f"✅ Command completed successfully")
        # Only show errors or important info, not the full verbose output
        if result.stderr and "ERROR" in result.stderr:
            print(f"Warnings/Errors: {result.stderr}")
        
        # Check if output file was created
        if os.path.exists(output_path):
            return send_file(output_path, as_attachment=True)
        else:
            return f"Output file was not created: {output_path}", 500
            
    except subprocess.TimeoutExpired:
        return "Error: Video processing timed out (30 minutes)", 500
    except subprocess.CalledProcessError as e:
        print(f"Command failed with return code: {e.returncode}")
        print(f"Command stderr: {e.stderr}")
        print(f"Command stdout: {e.stdout}")
        
        # Enhanced error handling with telemetry suggestions
        if "Assertion" in str(e.stderr):
            # Try running without map tiles (if supported)
            print("🔄 Retrying without map functionality...")
            retry_command = [cmd for cmd in command if cmd != "video"]
            
            try:
                retry_result = subprocess.run(
                    retry_command, 
                    check=True, 
                    capture_output=True, 
                    text=True, 
                    timeout=1800,
                    env=env,
                    cwd=os.path.dirname(os.path.abspath(__file__))
                )
                print("✅ Retry succeeded without maps")
                if os.path.exists(output_path):
                    return send_file(output_path, as_attachment=True)
            except Exception as retry_error:
                print(f"❌ Retry also failed: {retry_error}")
            
            return f"Error: gpx2video crashed. Try using telemetry method 2 or 3, or create a layout without maps.", 500
        elif "Download tile failure" in str(e.stderr):
            return f"Error: Failed to download map tiles. Try OpenTopoMap (source 6) or create a layout without maps.", 500
        elif "current speed is 0.000" in str(e.stdout):
            return f"Error: Speed calculation issue detected. Try telemetry method 2 or 3 with rate 1000ms.", 500
        else:
            return f"Error processing video: {str(e)}<br><br>Details: {e.stderr}", 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return f"Unexpected error: {str(e)}", 500

@app.route('/get_video_time')
def get_video_time():
    filename = request.args.get('filename')
    print(f"get_video_time called with filename: {filename}")  # Debug
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    # Use absolute path
    file_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, secure_filename(filename)))
    print(f"Looking for file at: {file_path}")  # Debug
    print(f"File exists: {os.path.exists(file_path)}")  # Debug
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")  # Debug
        # Try listing directory contents for debugging
        try:
            files_in_dir = os.listdir(UPLOAD_FOLDER)
            print(f"Files in upload directory: {files_in_dir}")
        except Exception as e:
            print(f"Could not list directory: {e}")
        return jsonify({'error': f'File not found: {file_path}'}), 404
    
    try:
        result = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', file_path],
            capture_output=True, text=True, check=True
        )
        
        metadata = json.loads(result.stdout)
        tags = metadata['format'].get('tags', {})
        
        # Try different possible tag names for creation time
        creation_time = (tags.get('creation_time') or 
                        tags.get('com.apple.quicktime.creationdate') or
                        tags.get('date'))
        
        if creation_time:
            # Handle different datetime formats
            try:
                if creation_time.endswith('Z'):
                    dt = datetime.fromisoformat(creation_time.replace('Z', '+00:00'))
                else:
                    dt = datetime.fromisoformat(creation_time)
                
                # Ensure we always include seconds in the return format for proper gpx2video compatibility
                formatted_time = dt.strftime('%Y-%m-%dT%H:%M:%S')
                print(f"Debug: Returning timestamp: {formatted_time}")  # Debug output
                return jsonify({'creation_time': formatted_time})
            except ValueError:
                # Try parsing as a different format
                try:
                    dt = datetime.strptime(creation_time, '%Y-%m-%d %H:%M:%S')
                    formatted_time = dt.strftime('%Y-%m-%dT%H:%M:%S')
                    print(f"Debug: Returning timestamp (alt format): {formatted_time}")  # Debug output
                    return jsonify({'creation_time': formatted_time})
                except ValueError:
                    return jsonify({'error': f'Unable to parse creation time: {creation_time}'}), 400
        
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'ffprobe failed: {str(e)}'}), 500
    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse ffprobe output'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500
    
    return jsonify({'error': 'Creation time not found in video metadata'}), 404

@app.route('/save_layout', methods=['POST'])
def save_layout():
    """Save a generated layout to the layouts folder"""
    try:
        data = request.get_json()
        filename = secure_filename(data.get('filename', ''))
        content = data.get('content', '')
        
        if not filename:
            return jsonify({'success': False, 'error': 'No filename provided'}), 400
            
        if not content:
            return jsonify({'success': False, 'error': 'No content provided'}), 400
            
        # Ensure filename ends with .xml
        if not filename.endswith('.xml'):
            filename += '.xml'
            
        # Save to layouts folder
        layout_path = os.path.join(LAYOUT_FOLDER, filename)
        
        with open(layout_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return jsonify({'success': True, 'filename': filename})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_layout_content')
def get_layout_content():
    """Get the content of a layout file for editing"""
    try:
        filename = request.args.get('filename')
        if not filename:
            return jsonify({'success': False, 'error': 'No filename provided'}), 400
            
        layout_path = os.path.join(LAYOUT_FOLDER, secure_filename(filename))
        
        if not os.path.exists(layout_path):
            return jsonify({'success': False, 'error': 'Layout file not found'}), 404
            
        with open(layout_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return jsonify({'success': True, 'content': content})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Health check endpoint for production
@app.route('/health')
def health_check():
    """Health check endpoint for load balancers"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0-enhanced',
        'features': {
            'widget_types': len(get_widget_types().get_json()),
            'map_sources': len(get_map_sources().get_json()),
            'wysiwyg_editor': True,
            'enhanced_properties': True
        }
    })

def create_sample_layouts():
    """Create some sample layout files if the layouts folder is empty"""
    if not os.path.exists(LAYOUT_FOLDER):
        os.makedirs(LAYOUT_FOLDER, exist_ok=True)
    
    # Check if folder is empty
    existing_layouts = [f for f in os.listdir(LAYOUT_FOLDER) if f.endswith('.xml')]
    if len(existing_layouts) == 0:
        print("Creating sample layouts...")
        
        # Basic speed layout
        basic_layout = '''<?xml version="1.0" encoding="UTF-8"?>
<layout>
    <!-- Basic Speed Layout -->
    <widget x="50" y="50" width="220" height="60" position="left" align="vertical">
        <type>speed</type>
        <n>SPEED</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>kph</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
</layout>'''
        
        # Snowboarding layout
        snowboard_layout = '''<?xml version="1.0" encoding="UTF-8"?>
<layout>
    <!-- Snowboarding Layout with Terrain Map -->
    <widget x="50" y="50" width="220" height="60" position="left" align="vertical">
        <type>speed</type>
        <n>SPEED</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>kph</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
    
    <widget x="50" y="120" width="220" height="60" position="left" align="vertical">
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
    
    <widget x="50" y="190" width="220" height="60" position="right" align="vertical">
        <type>time</type>
        <n>TIME</n>
        <margin>10</margin>
        <padding>5</padding>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
    
    <map x="800" y="300" width="640" height="480">
        <source>6</source>
        <zoom>13</zoom>
        <factor>2.0</factor>
        <border>5</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
        <path-thick>3.0</path-thick>
        <path-border>1.5</path-border>
    </map>
</layout>'''
        
        # Cycling layout
        cycling_layout = '''<?xml version="1.0" encoding="UTF-8"?>
<layout>
    <!-- Cycling Layout with OpenCycleMap -->
    <widget x="50" y="50" width="220" height="60" position="left" align="vertical">
        <type>speed</type>
        <n>SPEED</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>kph</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
    
    <widget x="50" y="120" width="220" height="60" position="left" align="vertical">
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
    
    <widget x="50" y="190" width="220" height="60" position="left" align="vertical">
        <type>avgspeed</type>
        <n>AVG SPEED</n>
        <margin>10</margin>
        <padding>5</padding>
        <unit>kph</unit>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
    </widget>
    
    <widget x="50" y="260" width="220" height="60" position="left" align="vertical">
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
    
    <map x="800" y="300" width="640" height="480">
        <source>5</source>
        <zoom>13</zoom>
        <factor>2.0</factor>
        <border>5</border>
        <border-color>#000000b0</border-color>
        <background-color>#0000004c</background-color>
        <path-thick>3.0</path-thick>
        <path-border>1.5</path-border>
    </map>
</layout>'''
        
        # Save sample layouts
        try:
            with open(os.path.join(LAYOUT_FOLDER, 'basic_speed.xml'), 'w') as f:
                f.write(basic_layout)
                
            with open(os.path.join(LAYOUT_FOLDER, 'snowboarding_with_map.xml'), 'w') as f:
                f.write(snowboard_layout)
                
            with open(os.path.join(LAYOUT_FOLDER, 'cycling_with_map.xml'), 'w') as f:
                f.write(cycling_layout)
                
            print("✅ Created sample layouts: basic_speed.xml, snowboarding_with_map.xml, cycling_with_map.xml")
        except Exception as e:
            print(f"Error creating sample layouts: {e}")

if __name__ == '__main__':
    # Create sample layouts if none exist
    create_sample_layouts()
    print("🚀 Starting enhanced GPX2Video web interface...")
    print("📍 Access at: http://localhost:5151")
    app.run(host='0.0.0.0', port=5151, debug=True)
