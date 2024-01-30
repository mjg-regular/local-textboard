# Import necessary libraries
from flask import Flask, render_template, request, redirect, url_for, jsonify
import json
import os
import webbrowser
from threading import Timer
from datetime import datetime  # For timestamping posts

app = Flask(__name__)

# Data structure to store threads
threads = []

# settings for textboard
settings = {
    "title": "Local Textboard",
    "subtitle": "Autism",
    "banner": "images/banner.gif"
}

# Helper functions to load and save threads to a JSON file
def save_threads():
    with open('threads.json', 'w') as file:
        data = {"threads": threads, "settings": settings}
        json.dump(data, file)


def load_threads():
    if os.path.isfile('threads.json'):
        with open('threads.json', 'r') as file:
            data = json.load(file)
            global settings
            settings = data.get("settings", settings)  # If settings key not found, use the default settings.
            return data.get("threads", [])  # If threads key not found, return an empty list.
    return []

@app.route('/')
def index():
    return render_template('index.html', threads=threads, settings=settings)


# app.py
post_counter = 0

@app.route('/create-thread', methods=['POST'])
def create_thread():
    global post_counter
    title = request.form.get('title')
    content = request.form.get('content')  # Get the opening post content
    if title and content:  # Make sure both title and content are provided
        post_counter += 1
        threads.append({'title': title, 'posts': [{'name': 'Anonymous', 'date': datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), 'number': post_counter, 'content': content}]})  # Save the opening post along with the title, date and number
        save_threads()  # Save threads after adding new thread
    return redirect(url_for('index'))

@app.route('/post/<int:thread_id>', methods=['POST'])
def post(thread_id):
    global post_counter
    content = request.form.get('content')
    if content:
        post_counter += 1
        post = {'name': 'Anonymous', 'date': datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), 'number': post_counter, 'content': content}
        threads[thread_id]['posts'].append(post)
        save_threads()  # Save threads after adding new post
    return jsonify(post)  # Return the new post as JSON

# Update Settings
@app.route('/update-settings', methods=['POST'])
def update_settings():
    global settings
    settings["title"] = request.form.get('title')
    settings["subtitle"] = request.form.get('subtitle')
    settings["banner"] = request.form.get('banner')
    save_threads()
    return redirect(url_for('index'))


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
    global threads
    threads = []
    save_threads()
    return redirect(url_for('index'))

# Load threads and settings from file when the application starts
threads = load_threads()

def open_browser():
      webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    Timer(1, open_browser).start()
    app.run(debug=False, threaded=False)
