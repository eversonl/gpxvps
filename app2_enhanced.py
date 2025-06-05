        <font-size>16</font-size>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000aa</border-color>
        <background-color>#9c27b088</background-color>
        <text-color>#ffffffff</text-color>
    </widget>
    
    <widget x="1690" y="95" width="180" height="35" position="top-right" align="horizontal">
        <type>elevation</type>
        <n>ELEVATION</n>
        <unit>m</unit>
        <margin>12</margin>
        <padding>5</padding>
        <font-size>16</font-size>
        <text-shadow>3</text-shadow>
        <border>2</border>
        <border-color>#000000aa</border-color>
        <background-color>#795548aa</background-color>
    </widget>
    
    <map position="bottom-right" display="true">
        <source>5</source>
        <zoom>13</zoom>
        <factor>2.0</factor>
        <margin>20</margin>
        <marker>55</marker>
        <border>3</border>
        <border-color>#000000cc</border-color>
        <background-color>#ffffff88</background-color>
        <path-thick>4.0</path-thick>
        <path-border>2.0</path-border>
    </map>
</layout>'''
        
        # Advanced multi-sport layout with all widget types
        advanced_layout = '''<?xml version="1.0" encoding="UTF-8"?>
<layout>
    <!-- Advanced Multi-Sport Layout - All Widget Types Demo -->
    
    <!-- Speed cluster -->
    <widget x="40" y="40" width="160" height="40" position="left" align="vertical">
        <type>speed</type>
        <n>SPEED</n>
        <unit>kph</unit>
        <font-size>18</font-size>
        <background-color>#e53e3e88</background-color>
    </widget>
    
    <widget x="40" y="90" width="160" height="35" position="left" align="vertical">
        <type>maxspeed</type>
        <n>MAX SPEED</n>
        <unit>kph</unit>
        <font-size>16</font-size>
        <background-color>#d32f2f88</background-color>
    </widget>
    
    <widget x="40" y="135" width="160" height="35" position="left" align="vertical">
        <type>vspeed</type>
        <n>V-SPEED</n>
        <unit>mps</unit>
        <font-size>16</font-size>
        <background-color>#1976d288</background-color>
    </widget>
    
    <!-- Navigation cluster -->
    <widget x="220" y="40" width="160" height="40" position="left" align="vertical">
        <type>elevation</type>
        <n>ELEVATION</n>
        <unit>m</unit>
        <font-size>18</font-size>
        <background-color>#4caf5088</background-color>
    </widget>
    
    <widget x="220" y="90" width="160" height="35" position="left" align="vertical">
        <type>grade</type>
        <n>GRADE</n>
        <unit>%</unit>
        <font-size>16</font-size>
        <background-color>#ff980088</background-color>
    </widget>
    
    <widget x="220" y="135" width="160" height="35" position="left" align="vertical">
        <type>heading</type>
        <n>HEADING</n>
        <unit>°</unit>
        <font-size>16</font-size>
        <background-color>#78909c88</background-color>
    </widget>
    
    <!-- Biometric cluster -->
    <widget x="400" y="40" width="160" height="40" position="center" align="vertical">
        <type>heartrate</type>
        <n>HR</n>
        <unit>bpm</unit>
        <font-size>18</font-size>
        <background-color>#e91e6388</background-color>
    </widget>
    
    <widget x="400" y="90" width="160" height="35" position="center" align="vertical">
        <type>cadence</type>
        <n>CADENCE</n>
        <unit>rpm</unit>
        <font-size>16</font-size>
        <background-color>#9c27b088</background-color>
    </widget>
    
    <widget x="400" y="135" width="160" height="35" position="center" align="vertical">
        <type>temperature</type>
        <n>TEMP</n>
        <unit>celsius</unit>
        <font-size>16</font-size>
        <background-color>#607d8b88</background-color>
    </widget>
    
    <!-- Physics & Activity -->
    <widget x="580" y="40" width="160" height="40" position="center" align="vertical">
        <type>gforce</type>
        <n>G-FORCE</n>
        <unit>g</unit>
        <font-size>18</font-size>
        <background-color>#3f51b588</background-color>
    </widget>
    
    <widget x="580" y="90" width="160" height="35" position="center" align="vertical">
        <type>lap</type>
        <n>LAP</n>
        <nbr-lap>5</nbr-lap>
        <font-size>16</font-size>
        <background-color>#f4433688</background-color>
    </widget>
    
    <!-- Time & Distance cluster (top right) -->
    <widget x="1600" y="40" width="180" height="35" position="top-right" align="horizontal">
        <type>time</type>
        <n>TIME</n>
        <font-size>16</font-size>
        <background-color>#2196f388</background-color>
    </widget>
    
    <widget x="1600" y="85" width="180" height="35" position="top-right" align="horizontal">
        <type>date</type>
        <n>DATE</n>
        <format>%Y-%m-%d</format>
        <font-size>14</font-size>
        <background-color>#795548aa</background-color>
    </widget>
    
    <widget x="1600" y="130" width="180" height="35" position="top-right" align="horizontal">
        <type>distance</type>
        <n>DISTANCE</n>
        <unit>km</unit>
        <font-size>16</font-size>
        <background-color>#607d8b88</background-color>
    </widget>
    
    <!-- Position display (bottom left) -->
    <widget x="40" y="950" width="220" height="45" position="bottom-left" align="horizontal">
        <type>position</type>
        <n>POSITION</n>
        <font-size>14</font-size>
        <background-color>#37474f99</background-color>
        <text-color>#ffffffff</text-color>
    </widget>
    
    <!-- Custom text (bottom center) -->
    <widget x="860" y="980" width="200" height="30" position="bottom" align="horizontal">
        <type>text</type>
        <text>Adventure Mode Activated</text>
        <font-size>14</font-size>
        <background-color>#1a237e88</background-color>
        <text-color>#ffffffff</text-color>
    </widget>
    
    <!-- Enhanced map with all properties -->
    <map position="bottom-right" display="true">
        <source>6</source>
        <zoom>14</zoom>
        <factor>2.5</factor>
        <margin>30</margin>
        <marker>70</marker>
        <border>5</border>
        <border-color>#000000ee</border-color>
        <background-color>#ffffffaa</background-color>
        <path-thick>6.0</path-thick>
        <path-border>3.0</path-border>
    </map>
</layout>'''
        
        # Save enhanced layouts
        try:
            with open(os.path.join(LAYOUT_FOLDER, 'enhanced_skiing_complete.xml'), 'w') as f:
                f.write(enhanced_skiing_layout)
                
            with open(os.path.join(LAYOUT_FOLDER, 'enhanced_cycling_complete.xml'), 'w') as f:
                f.write(enhanced_cycling_layout)
                
            with open(os.path.join(LAYOUT_FOLDER, 'advanced_multi_sport.xml'), 'w') as f:
                f.write(advanced_layout)
                
            print("✅ Created enhanced sample layouts with all widget types and properties")
        except Exception as e:
            print(f"Error creating enhanced sample layouts: {e}")

if __name__ == '__main__':
    # Create enhanced sample layouts
    create_sample_layouts()
    print("🚀 Starting ENHANCED GPX2Video web interface...")
    print("📍 Access at: http://localhost:5151")
    print("✨ WYSIWYG Editor: http://localhost:5151/editor")
    print("🎯 New Features: 16+ widget types, enhanced properties, full gpx2video compatibility")
    app.run(host='0.0.0.0', port=5151, debug=True)
