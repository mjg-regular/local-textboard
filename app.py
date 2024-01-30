# Import necessary libraries
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask import session
import json
import os
import webbrowser
from threading import Timer
from datetime import datetime  # For timestamping posts


app = Flask(__name__)

# Ensure 'boards' directory exists
if not os.path.exists('boards'):
    os.makedirs('boards')

# Set a secret key for sessions
app.secret_key = 'mikacute'  # Replace with a real secret key

# app.py
post_counter = 0

# Data structure to store threads
threads = []

# settings for textboard
settings = {
    "title": "Local Textboard",
    "subtitle": "Autism",
    "banner": "banner.gif"
}

# Helper functions to load and save threads to a JSON file
def save_threads():
    # Get the current board filename from the session or default to 'default.json'.
    filename = session.get('board_file', 'default.json')
    # Construct the file path relative to the location of `app.py`.
    file_path = os.path.join(os.path.dirname(__file__), 'boards', filename)
    with open(file_path, 'w') as file:
        data = {"threads": threads, "settings": settings}
        json.dump(data, file)

def load_threads(filename='default.json'):
    file_path = os.path.join(os.path.dirname(__file__), 'boards', filename)
    if not os.path.isfile(file_path):
        default_board = {
            "threads": [],
            "settings": {
                "title": "Local Textboard",
                "subtitle": "Autism simulator",
                "banner": "banner.gif"
            }
        }
        with open(file_path, 'w') as file:
            json.dump(default_board, file)
    with open(file_path, 'r') as file:
        data = json.load(file)
        global settings, post_counter, threads
        settings = data.get("settings", settings)
        threads = data.get("threads", [])
        if threads:
            post_counter = max(post['number'] for thread in threads for post in thread['posts'])
        else:
            post_counter = 0
    return threads


# Load threads and settings from file when the application starts
threads = load_threads()

@app.route('/')
def index():
    # If a board_file is specified in the query parameter, use it.
    # Otherwise, fall back to the session or default to 'default.json'.
    board_file = request.args.get('board_file', session.get('board_file', 'default.json'))
    # Store the current board filename in the session.
    session['board_file'] = board_file
    load_threads(board_file)
    return render_template('index.html', threads=threads, settings=settings)


@app.route('/create-board', methods=['POST'])
def create_board():
    # Generate a unique filename for the new board
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f'board_{timestamp}.json'

    # Define the default content for a new board
    default_board = {
        "threads": [],
        "settings": {
            "title": "MISONO MIKA",
            "subtitle": "The mika board",
            "banner": "banner.gif"
        }
    }

    # Create the new board file with default content
    with open(os.path.join('boards', filename), 'w') as file:
        json.dump(default_board, file)

    return redirect(url_for('index', board_file=filename))  # Pass the new board file as a query parameter



@app.route('/create-thread', methods=['POST'])
def create_thread():
    global post_counter, threads, settings  # Ensure we're modifying the global variables
    board_file = session.get('board_file', 'default.json')  # Get current board file from session
    threads = load_threads(board_file)  # Load threads from the current board

    title = request.form.get('title')
    content = request.form.get('content')
    if title and content:
        post_counter += 1
        threads.append({'title': title, 'posts': [{'name': 'Anonymous', 'date': datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), 'number': post_counter, 'content': content}]})
        save_threads()  # Save changes to the current board

    return redirect(url_for('index'))


@app.route('/post/<int:thread_id>', methods=['POST'])
def post(thread_id):
    global post_counter
    content = request.form.get('content')
    if content:
        post_counter += 1
        post = {'name': 'Anonymous', 'date': datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), 'number': post_counter, 'content': content}
        threads[thread_id]['posts'].append(post)
        save_threads()
    return jsonify(post)

# Update Settings
@app.route('/update-settings', methods=['POST'])
def update_settings():
    global settings
    settings["title"] = request.form.get('title')
    settings["subtitle"] = request.form.get('subtitle')
    settings["banner"] = request.form.get('banner')
    save_threads()  # This should save to the current board file based on the session
    return redirect(url_for('index'))

@app.route('/open-images-folder', methods=['GET'])
def open_images_folder():
    import subprocess
    subprocess.Popen('explorer "static\\images"')
    return redirect(url_for('index'))

@app.route('/board-list', methods=['GET'])
def board_list():
    # Using the script's directory ensures consistent file pathing
    boards_directory = os.path.join(os.path.dirname(__file__), 'boards')
    board_files = os.listdir(boards_directory)
    boards_info = []

    for filename in board_files:
        # Only process .json files
        if filename.endswith('.json'):
            file_path = os.path.join(boards_directory, filename)
            with open(file_path, 'r') as file:
                board_data = json.load(file)
                boards_info.append({'title': board_data['settings']['title'], 'filename': filename})

    return jsonify(boards_info)


@app.route('/delete-post', methods=['POST'])
def delete_post():
    global threads
    thread_id = request.form.get('thread_id', type=int)
    post_number = request.form.get('post_number', type=int)
    is_opening_post = False

    for index, thread in enumerate(threads):
        if thread['posts'][0]['number'] == post_number:
            is_opening_post = True
            del threads[index]
            break
        else:
            thread['posts'][:] = [post for post in thread['posts'] if post['number'] != post_number]

    save_threads()
    # Return indication if it was an opening post or not
    return jsonify({'is_opening_post': is_opening_post}), 204

@app.route('/delete-board', methods=['POST'])
def delete_board():
    # Get the current board filename from the session.
    current_board = session.get('board_file', 'default.json')

    # Ensure you're not trying to delete the default board
    if current_board and current_board != 'default.json':
        current_board_path = os.path.join(os.path.dirname(__file__), 'boards', current_board)

        # Check if the file exists before attempting to delete it
        if os.path.isfile(current_board_path):
            os.remove(current_board_path)
            # Clear the session variable for the current board
            session.pop('board_file', None)

    # Regardless of whether a file was deleted or not, redirect to 'default.json'
    return redirect(url_for('index', board_file='default.json'))



# Load threads and settings from file when the application starts
threads = load_threads()

def open_browser():
      webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    Timer(1, open_browser).start()
    app.run(debug=False, threaded=False)
