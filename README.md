# GPX2Video SaaS Web Interface

A modern web interface for the [gpx2video](https://github.com/progweb/gpx2video) project, designed to be deployed as a SaaS service.

## Features

- 🎥 **Modern Web Interface**: Beautiful, responsive UI for uploading and processing videos
- 🎨 **Layout Generator**: Visual tool for creating custom overlay layouts
- ⚙️ **Advanced Options**: Telemetry methods, timing controls, and processing options
- 🗺️ **Multiple Map Sources**: Support for various map providers including OpenTopoMap for skiing
- 🐳 **Docker Ready**: Easy deployment with Docker and Docker Compose
- 📱 **Mobile Friendly**: Responsive design that works on all devices

## Quick Start

### Option 1: Docker Deployment (Recommended)

1. Clone this repository:
```bash
git clone https://github.com/progweb/gpx2video.git
cd gpx2video
```

2. Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

3. Access the web interface at `http://your-server-ip:5151`

### Option 2: Manual Installation

1. Install dependencies:
```bash
# Install build dependencies
sudo apt-get update
sudo apt-get install build-essential cmake git pkg-config
sudo apt-get install libavcodec-dev libavformat-dev libavutil-dev libswscale-dev
sudo apt-get install libgdal-dev libproj-dev libcurl4-openssl-dev
sudo apt-get install python3 python3-pip ffmpeg

# Install Python dependencies
pip3 install flask werkzeug
```

2. Build gpx2video:
```bash
mkdir build && cd build
cmake ..
make && sudo make install
```

3. Run the web interface:
```bash
cd gpxupload
python3 app2.py
```

## Usage

### Basic Video Processing

1. **Upload Files**: Upload your MP4 video and GPX track files
2. **Select Layout**: Choose from pre-made layouts or create your own
3. **Set Timing**: Use the auto-fill feature to get video timestamp
4. **Process**: Click "Generate Video" to create your overlay video

### Layout Generator

The built-in layout generator allows you to:
- Configure map sources and positioning
- Customise widget layouts (speed, elevation, time, etc.)
- Preview generated XML layouts
- Save custom layouts for reuse

### Timing Issues Fix

If your video shows no telemetry data, the issue is likely timing:

1. **Correct Format**: Ensure start time includes seconds: `2025-02-19T11:02:22`
2. **Auto-fill**: Use the "Auto-fill from video" button for accurate timestamps
3. **Telemetry Method**: Try methods 2 (Linear) or 3 (Interpolate) for better results
4. **Offset**: Add millisecond offset if video starts after GPX recording

## Configuration

### Environment Variables

- `FLASK_ENV`: Set to `production` for deployment
- `GPX2VIDEO_CACHE_DIR`: Custom cache directory location

### Layout Folder

Place custom layout XML files in:
- Docker: Mounted as volume `/app/gpxupload/layouts`
- Manual: `gpxupload/layouts/` directory

## Docker Management

```bash
# View logs
docker-compose logs -f

# Stop service
docker-compose down

# Restart service
docker-compose restart

# Update service
git pull
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **No telemetry data**: Check timestamp format and use telemetry method 2 or 3
2. **Map tiles fail**: Try OpenTopoMap (source 6) or disable maps
3. **Processing crashes**: Use telemetry methods 2-3 and ensure cache permissions

### File Permissions

Ensure the uploads directory is writable:
```bash
chmod 755 gpxupload/uploads
chmod 755 gpxupload/layouts
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

This project follows the same license as the original gpx2video project.