# Import necessary libraries
from flask import Flask, render_template, request, redirect, url_for, jsonify  # Add jsonify to the import


app = Flask(__name__)

# Data structure to store threads
threads = []

@app.route('/')
def index():
    return render_template('index.html', threads=threads)

# Flask app routes
@app.route('/create-thread', methods=['POST'])
def create_thread():
    title = request.form.get('title')
    content = request.form.get('content')  # Get the opening post content
    if title and content:  # Make sure both title and content are provided
        threads.append({'title': title, 'posts': [content]})  # Save the opening post along with the title
    return redirect(url_for('index'))


@app.route('/post/<int:thread_id>', methods=['POST'])
def post(thread_id):
    content = request.form.get('content')
    if content:
        threads[thread_id]['posts'].append(content)
    return jsonify(content=content)  # Return only the new post's content as JSON



if __name__ == '__main__':
    app.run(debug=True)
