import { useState } from "react";
// import { storage } from "./firebaseConfig";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [firstName, setFirstName] = useState(""); // Changed to camelCase
  const [lastName, setLastName] = useState(""); // Changed to camelCase
  const [idNo, setIdNo] = useState(""); // Changed to camelCase
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [licenseImage, setLicenseImage] = useState(null);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [businessType, setBusinessType] = useState(""); // Added state for business type
  const [validationMessage, setValidationMessage] = useState(null);
  const [error, setError] = useState(null);
  const [serializedData, setSerializedData] = useState({});

  // Toggle Serialized Data Cont
  const [toggleSDC, setToggleSDC] = useState(false);

  // Confirm Data transfer
  // const [confirmData, setConfirmData] = useState(false);

  const addDetails = async (fileURL) => {
    // e.preventDefault();

    // Check if all required fields are filled
    if (!firstName || !lastName || !idNo || !email || !phoneNumber || !location || !businessName || !licenseNumber || !businessType || !licenseImage) {
      setValidationMessage("Please fill in all the fields.");
      setError("");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('national_Id', idNo);
      formData.append('phone_number', phoneNumber);
      formData.append('email', email);
      formData.append('location', location);
      formData.append('business_name', businessName);
      formData.append('licence_number', licenseNumber);
      formData.append('business_type', businessType);
      formData.append('licence_image', licenseImage)
      formData.append('licence_image_url', fileURL);

      // Set the content type header to multipart/form-data
      const config = {
        headers: {
          'content-type': 'multipart/form-data'
        }
      };

      // Send form data for validation
      const validationResponse = await axios.post(
        "http://localhost:5000/validate",
        {
          national_Id: idNo,
          phone_number: phoneNumber,
          email: email,
          licence_number: licenseNumber,
        }
      );

      // Set validation message
      setValidationMessage('Form submitted successfully. Confirm to send');
      setError("");

      // If validation is successful, save data to the database
      if (validationResponse.data.message === "ID, phone number, and email are valid!") {
        const serializationResponse = await axios.post(
          "http://localhost:5000/submit-form",
          formData,
          config
        );

        setSerializedData(serializationResponse.data);
        setToggleSDC(true);   // Show the Serialized data container for confirmation
      } else {
        // Show the error if validation fails
        setError("Validation failed. Please check your data.");
      }
    } catch (error) {
      console.error("Error in addDetails:", error);
      setError(error.response?.data?.error || "Unknown error occurred");
    }
  };

  // const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLicenseImage(file);
    setSelectedFile(file);
  };

  // const onFileUpload = async () => {
  //   const fileURL = await uploadFileToFirebase(selectedFile);
  //   return fileURL;
  // };

  // const uploadFileToFirebase = async (file) => {
  //   try {
  //     const storageRef = ref(storage, file.name);
  //     await uploadBytes(storageRef, file);
  //     const fileURL = await getDownloadURL(storageRef);
      // console.log("File uploaded successfully. File URL:", fileURL);
  //     return fileURL;
  //   } catch (error) {
      // console.error("Error uploading file to Firebase:", error);
  //     throw error; // Re-throw the error to handle it elsewhere if needed
  //   }
  // };

  const fileData = () => {
    if (selectedFile) {
      return (
        <div>
          <h2>File Details:</h2>
          <p>File Name: {selectedFile.name}</p>
          <p>File Type: {selectedFile.type}</p>
          <p>Last Modified: {selectedFile.lastModifiedDate.toDateString()}</p>
        </div>
      );
    } else {
      return (
        
        <div>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      );
    }
  };

  const confirmTransfer = async () => {
    try {
      // const fileURL = selectedFile ? await uploadFileToFirebase(selectedFile) : "";
      // await addDetails(fileURL);
      // const formData = new FormData();
      // formData.append('licence_image', file);
      setToggleSDC(false)
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('national_Id', idNo);
      formData.append('phone_number', phoneNumber);
      formData.append('email', email);
      formData.append('location', location);
      formData.append('business_name', businessName);
      formData.append('licence_number', licenseNumber);
      formData.append('business_type', businessType);
      formData.append('licence_image', licenseImage);
      // formData.append('licence_image_url', fileURL);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      const saveResponse = await axios.post(
        "http://localhost:5000/customer",
        formData,
        config
        // {
        //   first_name: firstName,
        //   last_name: lastName,
        //   national_Id: idNo,
        //   email: email,
        //   phone_number: phoneNumber,
        //   business_type: businessType,
        //   business_name: businessName,
        //   location: location,
        //   licence_number: licenseNumber,
        //   licence_image: licenseImage,
        //   licence_image_url: fileURL
        // },
      );

      if (saveResponse && saveResponse.data) {
        if (saveResponse.status === 201) {
          setValidationMessage("");
          setError("");
          // setConfirmData(false);
          alert("Data saved successfully!");
        }
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error in confirmTransfer:", error);
      setValidationMessage("");
      setError(error.response ? error.response.data.error : "Unknown error occurred");
    }
  };

  return (
    <div>
      <div className="sticky-bar">
        <a className="logo-link" href="">
          <img id="logo" src="https://www.shopokoa.com/images/img_asset14shopokoa.png" alt="ShopOkoa Logo" loading="lazy"></img>
        </a>
      </div>
      <div className="form-page">
      <form onSubmit={(e) => {
          e.preventDefault();
          // onFileUpload();
          addDetails();
        }} className="auth-inner">
          <div className="form-heading">
              <h2>REGISTRATION <span>FORM</span></h2>
          </div>
            <div className="mb-3">
                <label>First name</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="First name"
                    name="first_name"
                    value={firstName}
                    onChange={(e) => {
                        setFirstName(e.target.value);
                    }}
                />
            </div>
            <div className="mb-3">
                <label>Last name</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Last name"
                    name="last_name"
                    value={lastName}
                    onChange={(e) => {
                        setLastName(e.target.value);
                    }}
                />
            </div>
            <div className="mb-3">
                <label>ID Number</label>
                <input
                    type="text"
                    className="form-control"
                    name="idno"
                    placeholder="Enter ID number"
                    value={idNo}
                    onChange={(e) => setIdNo(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label>Phone Number</label>
                <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label>Email</label>
                <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label>Location</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Provide location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label>Business Name</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label>License Number</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter license number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label>Business Type</label>
                <select
                    className="form-control"
                    placeholder="Choose Business Type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                >
                    <option> </option>
                    <option>Sole Proprietorship</option>
                    <option>Partnership</option>
                    <option>Private Company</option>
                    <option>Cooperation</option>
                </select>
            </div>
            {/* <div className="mb-3">
            <label>Upload License Image</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
            />
            </div> */}
            <div className="mb-3">
                <label>License Image (PDF) </label>
                <input type="file" className="file-control" accept=".pdf" onChange={handleFileChange} style={{ overflow: 'hidden' }} />
                {selectedFile && (
                <div>
                    <p>Selected File: <span onClick={() => window.open(URL.createObjectURL(selectedFile), '_blank')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{selectedFile.name}</span></p>
                    {fileData()}
                </div>
            )}
            </div>
            <div className="d-grid">
                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </div>
            {validationMessage && <p className="success">{validationMessage}</p>}
            {error && <p className="error">Error: {error}</p>}
            
        </form>
        {/* {validationMessage && <p className="success">{validationMessage}</p>}
        {error && <p className="error">Error: {error}</p>} */}
        
        

        {toggleSDC && (
          <div className="overlay">
          <div className="serialized-data-cont">
            <div>
              <pre>{JSON.stringify(serializedData, null, 2)}</pre>
            </div>
            <section>
            <button
                className="confirm-btn"
                onClick={() => {
                  confirmTransfer();
                  setToggleSDC(false);
                }}
              >
                Confirm
              </button>
              <button
                className="cancel-btn"
                onClick={() => setToggleSDC(false)}
              >
                Cancel
              </button>
            </section>
          </div></div>
        )}
      </div>
    </div>
  );
}

export default App;
