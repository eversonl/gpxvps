from flask import Flask, request, render_template, redirect, url_for, send_file, jsonify
import os
import subprocess
from werkzeug.utils import secure_filename
from datetime import datetime
import json

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
LAYOUT_FOLDER = '/opt/gpx2video/samples'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Check if layout folder exists
if not os.path.exists(LAYOUT_FOLDER):
    print(f"Warning: Layout folder {LAYOUT_FOLDER} does not exist!")
    print("Please ensure gpx2video is installed and samples are available.")
    # Fallback to local layouts folder
    LAYOUT_FOLDER = 'layouts'
    os.makedirs(LAYOUT_FOLDER, exist_ok=True)
    print(f"Using fallback layout folder: {LAYOUT_FOLDER}")

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

# Add the missing endpoint that your JavaScript is calling
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
    # Updated to match the HTML form field names
    gpx_file = request.files.get('gpx_file')
    video_file = request.files.get('video_file')
    layout_choice = request.form.get('layout')
    start_time = request.form.get('start_time')
    offset = request.form.get('offset', '0')
    
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
        command += ["--start-time", start_time]
    
    # Add offset if provided and not zero
    if offset and offset != "0":
        command += ["--offset", offset]
    
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
        clean_command += " video"
        
        print(f"=== RUNNING COMMAND ===")
        print(f"gpx2video command: {clean_command}")
        print(f"GPX time range: Check your GPX file - starts at 2025-02-19T10:00:33Z")
        print(f"Video start time: {start_time if start_time else 'Not specified (auto-detect)'}")
        print(f"Offset: {offset}ms")
        print(f"========================")
        
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
        
        print(f"✓ Command completed successfully")
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
        
        # Try to provide more helpful error messages
        if "Assertion" in str(e.stderr):
            # Try running without map tiles (if supported)
            print("Retrying without map functionality...")
            retry_command = [cmd for cmd in command if cmd != "video"]
            retry_command.extend(["--map-source", "none", "video"])
            
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
                print("Retry succeeded without maps")
                if os.path.exists(output_path):
                    return send_file(output_path, as_attachment=True)
            except Exception as retry_error:
                print(f"Retry also failed: {retry_error}")
            
            return f"Error: gpx2video crashed due to an internal error. This might be due to corrupted map tiles or video format issues. Map tile downloads are failing - check your internet connection or try a layout without maps.", 500
        elif "Download tile failure" in str(e.stderr):
            return f"Error: Failed to download map tiles. Check your internet connection or try again later. You might also try running: chmod -R 755 ~/.gpx2video/cache", 500
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
                
                return jsonify({'creation_time': dt.strftime('%Y-%m-%dT%H:%M')})
            except ValueError:
                # Try parsing as a different format
                try:
                    dt = datetime.strptime(creation_time, '%Y-%m-%d %H:%M:%S')
                    return jsonify({'creation_time': dt.strftime('%Y-%m-%dT%H:%M')})
                except ValueError:
                    return jsonify({'error': f'Unable to parse creation time: {creation_time}'}), 400
        
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'ffprobe failed: {str(e)}'}), 500
    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse ffprobe output'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500
    
    return jsonify({'error': 'Creation time not found in video metadata'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5151, debug=True)