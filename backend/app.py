import mimetypes
import re
from flask import Flask, flash, send_from_directory, jsonify, request, send_file, url_for, redirect, render_template
from flask_migrate import Migrate
from flask_cors import CORS
# from config import Config
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import base64
from io import BytesIO


# Configure MySQL connection
app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:ariwomoi@localhost/Shopokoa'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev'
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# CORS(app)
# Increase pool size and set recycle time
# app.config['SQLALCHEMY_POOL_SIZE'] = 20  # Adjust as per your application's needs
# app.config['SQLALCHEMY_POOL_RECYCLE'] = 300

db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)

# Define model for the database
class Customer(db.Model):
    id = db.Column(db.Integer)
    first_name = db.Column(db.String(60), nullable=False)
    last_name = db.Column(db.String(60), nullable=False)
    national_Id = db.Column(db.Integer, unique=True)
    email = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    business_type = db.Column(db.String(120), nullable=False)
    business_name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(20), nullable=False)
    # data = db.Column(db.LargeBinary, nullable=False)
    rendered_data = db.Column(db.Text, nullable=False)
    licence_number = db.Column(db.String(20), primary_key=True)
    # licence_image_url = db.Column(db.String(255), nullable=True)  # Store the image data as a large binary object
    licence_image = db.Column(db.LargeBinary)



    def __repr__(self):
        return f"<Customer {self.first_name} {self.last_name}>"
    
def render_file_data(data):
    if data:
        return base64.b64encode(data).decode('ascii')
    return None    

# Function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Route to download uploaded files
@app.route('/uploads/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/files', methods=['GET'])
def files():
    files = Customer.query.all()
    return render_template('files.html', files=files)

@app.route('/file/<int:file_id>', methods=['GET'])
def file(file_id):
    file = Customer.query.get_or_404(file_id)
    if file.rendered_data:
        mime_type, _ = mimetypes.guess_type(file.name)
        return send_file(BytesIO(file.data), mimetype=mime_type)
    else:
        flash(f'File {file.name} cannot be viewed.')
        return redirect(url_for('files'))

# Routes
@app.route('/customer', methods=['POST'])
def create_customer():
    form_data = request.form
    file = request.files['licence_image']
    # print("Received form data:", form_data)
    # Extracting data from the form
    first_name = form_data.get('first_name')
    last_name = form_data.get('last_name')
    phone_number = form_data.get('phone_number')
    national_Id = form_data.get('national_Id')
    # full_name = form_data.get('full_name')
    email = form_data.get('email')
    location = form_data.get('location')
    business_name = form_data.get('business_name')
    business_type = form_data.get('business_type')
    licence_number = form_data.get('licence_number')
    # licence_image_url = form_data.get('licence_image_url')
    # Retrieve the licence image file
    # if 'licence_image' not in request.files:
    #     return jsonify({'error': 'Licence image is required'}), 400
    
    licence_image = request.files['licence_image']

    # if licence_image.filename == '':
    #     return jsonify({'error': 'No selected file for licence image'}), 400
    if file:
        filename = file.filename
        # app.logger.info(f'File {filename} received for upload.')

        licence_image = file.read()
        rendered_data = render_file_data(licence_image)
        licence_number = request.form.get('licence_number', '')

        flash(f'File {filename} uploaded. licence_number: {licence_number}')
        # app.logger.info(f'File {filename} successfully uploaded.')
    else:
        flash('No file received in the request.', 'error')
        # app.logger.error('No file received in the upload request.')

#   Check if the license number already exists
#     existing_customer = Customer.query.filter_by(licence_number=licence_number).first()
#     if existing_customer:
#         return jsonify({'error': 'License number already exists'}), 400

    

    new_customer = Customer(
        national_Id=national_Id, 
        email=email, 
        first_name=first_name, 
        last_name=last_name, 
        rendered_data=rendered_data,
        phone_number=phone_number, 
        business_type=business_type, 
        business_name=business_name,
        location=location,
        licence_number=licence_number, 
        # licence_image_url=licence_image_url, 
        licence_image= licence_image
    )

    #   Check if the license number already exists
    existing_customer = Customer.query.filter_by(licence_number=licence_number).first()
    if existing_customer:
        return jsonify({'error': 'License number already exists'}), 400
    
    db.session.add(new_customer)
    db.session.commit()
    print("Customer committed successfully to the database.")
    
    return jsonify({'message': 'Customer created successfully'}), 201

# Serializer function
def serialize_form_data(first_name, last_name, phone_number, national_Id, business_type, email, location, license_number, licence_image_url):
     # Combine first name, middle name, and last name to create full name
    full_name = f"{first_name} {last_name}".strip()

    return {
        'full_name': full_name,
        'National_Id': national_Id,
        'email': email,
        'phone_number': phone_number,
        'location': location,
        'license_number': license_number,
        'business_type': business_type,
        'license_image_url': licence_image_url
        # 'licence_image': licence_image
    }

@app.route('/submit-form', methods=['POST'])
def submit_form():
    # Assuming the form data is sent as form
    # form_data = request.form

    # print("Received form data:", form_data)
    # Extracting data from the form
    # first_name = form_data.get('first_name')
    # last_name = form_data.get('last_name')
    # phoneNumber = form_data.get('phone_number')
    # national_Id = form_data.get('national_Id')
    # full_name = form_data.get('full_name')
    # email = form_data.get('email')
    # location = form_data.get('location')
    # business_name = request.form.get('business_name')
    # business_type = request.form.get('business_type')
    # licence_number = form_data.get('licence_number')
    # licence_image_url = form_data.get('licence_image_url')
    
     # Save to the database
    # new_customer = Customer(
    #     first_name=first_name,
    #     last_name=last_name,
    #     national_Id=national_Id,
    #     email=email,
    #     phone_number=phoneNumber,
    #     location=location,
    #     business_name=business_name,
    #     licence_number=licence_number,
    #     business_type=business_type,
    #     licence_image_url=licence_image_url  # Assuming license_image is stored as URL
    # )
    # db.session.add(new_customer)
    # db.session.commit()
    # Check if 'licence_image' exists in request.files
    # if 'licence_image_url' in request.files:
    #     licence_image_url = request.files['licence_image_url']
    #     # app.logger.info(f"Received file: {licence_image.filename}")
    #     # Save the file to the upload folder
    #     licence_image_url.save(os.path.join(app.config['UPLOAD_FOLDER'], licence_image_url.filename))
    #     # app.logger.info(f"File saved to: {os.path.join(app.config['UPLOAD_FOLDER'], licence_image.filename)}")
    # else:
    #     licence_image_url = None
    #     file_path = None
      
    # Ensure license_number is unique and doesn't contain invalid characters
    # sanitized_license_number = secure_filename(license_number)


    # Construct the file path without duplicating 'uploads' directory
    # file_path = os.path.join(app.config['UPLOAD_FOLDER'], f'{sanitized_license_number}.pdf')
    # Handle file uploaD
    # if licence_image_url:
    #      with open(file_path, 'wb') as f:
    #         f.write(licence_image_url.read())
            # app.logger.info(f"File written to database with licence number: {license_number}")
    
    # if 'licence_image' not in request.files:
        # return jsonify({'error': 'Licence image is required'}), 400
  
    # Serializing form data
    # serialized_data = serialize_form_data(first_name, last_name, phoneNumber, national_Id, email, location, license_number, licence_image_url)

    # return jsonify(serialized_data)
    return jsonify('Form submitted successfully. Confirm to send'), 201


# Validate ID function
def validate_id(idNo):
    # ID should be numeric and have a length of 8
    if str(idNo).isdigit() and len(str(idNo)) == 8:
        return True
    else:
        return False

# Validate phone number function
def validate_phone_number(phoneNumber):
    # Phone number should be numeric and have a length of 10 or 12
    if phoneNumber.isdigit() and len(phoneNumber) == 10 or len(phoneNumber) == 12:
        return True
    else:
        return False

# Convert phone number to international format
def convert_to_international(phoneNumber):
    if phoneNumber.startswith('0'):
        return '254' + phoneNumber[1:]
    else:
        return phoneNumber

# Validate email function
def validate_email(email):
    # Regular expression for basic email validation
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if re.match(pattern, email):
        return True
    else:
        return False

# Route for validating ID, phone number, and email
@app.route('/validate', methods=['POST'])
def validate():
    data = request.json
    idNo = data.get('national_Id')
    phoneNumber = data.get('phone_number')
    email = data.get('email')
    licence_number = data.get('licence_number')
    if not validate_id(idNo):
        return jsonify({'error': 'Invalid ID!'}), 400

    # Convert phone number to international format
    phone_number_international = convert_to_international(phoneNumber)

    if not validate_phone_number(phone_number_international):
        return jsonify({'error': 'Invalid phone number!'}), 400

    if not validate_email(email):
        return jsonify({'error': 'Invalid email!'}), 400
    
    #   Check if the license number already exists
    existing_customer = Customer.query.filter_by(licence_number=licence_number).first()
    if existing_customer:
        return jsonify({'error': 'License number already exists'}), 400


    return jsonify({'message': 'ID, phone number, and email are valid!'})

if __name__ == '__main__':
    app.run(debug=True)
