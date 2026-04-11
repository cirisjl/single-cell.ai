import React, { useState, useEffect, useCallback } from 'react';
import CreatableSelect from 'react-select/creatable';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { NODE_API_URL } from '../../../constants/declarations'
import RightRail from '../../RightNavigation/rightRail';
import { decompressData, getCookie, isUserAuth } from '../../../utils/utilFunctions';
import AlertMessageComponent from '../../publishDatasets/components/alertMessageComponent';
import TableComponent from '../../publishDatasets/components/labelTableComponent';


const EditCustomForm = () => {
  const [formData, setFormData] = useState(
    {
      Dataset: '',
      Downloads: '',
      Title: '',
      Author: '',
      'Reference (paper)': '',
      Abstract: '',
      DOI: '',
      Species: '',
      'Cell Count Estimate': '',
      'Sample Type': '',
      'Anatomical Entity': '',
      'Organ Part': '',
      'Model Organ': '',
      'Selected Cell Types': [],
      'Library Construction Method': '',
      'Nucleic Acid Source': '',
      'Paired End': false,
      'Analysis Protocol': '',
      'Disease Status (Specimen)': [],
      'Disease Status (Donor)': [],
      'Development Stage': [],
      'Donor Count': 0,
      'Source': '',
      'Source Key': '',
      'Submission Date': '', // Set your initial date placeholder here   
      // 'cell_metadata_head':{},
      // 'cell_metadata':{}
    },
  );

  const [options, setOptions] = useState(
    {
      Task: [],
      Author: '',
      Species: [],
      'Sample Type': [],
      'Anatomical Entity': [],
      'Organ Part': [],
      'Model Organ': [],
      'Selected Cell Types': [],
      'Library Construction Method': [],
      'Nucleic Acid Source': [],
      'Disease Status (Specimen)': [],
      'Disease Status (Donor)': [],
      'Development Stage': [],
      'Cell Count Estimate': [],
      'Source': []
    },
  )

  const [newOptions, setNewOptions] = useState([]);

  const [datasetId, setDatasetId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [username, setUsername] = useState(null);
  const [owner, setOwner] = useState(null);
  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState({});

  const location = useLocation();

  useEffect(() => {
    // Function to check authentication and set user details
    const checkAuthentication = async () => {
      if (getCookie('jwtToken') === undefined || getCookie('jwtToken') === '') {
        // Navigate to the login page
        window.location.href = '/routing';
      } else {
        try {
          const authData = await isUserAuth(getCookie('jwtToken'));
          if (authData.isAuth) {
            setUsername(authData.username);
            setIsAdmin(authData.isAdmin);
            fetchDefaultOptions();
          } else {
            console.warn("Token expired! Please login again");
            window.location.href = '/routing';
          }
        } catch (error) {
          console.error('Error during authentication:', error);
        }
      }
    };

    // Function to fetch default options
    const fetchDefaultOptions = async () => {
      try {
        const response = await fetch(`${NODE_API_URL}/options`);
        if (!response.ok) {
          console.error('Error fetching default options');
          return;
        }
        const data = await response.json();

        const optionsData = {};
        const fieldNames = [
          'Task', 'Species', 'Cell Count Estimate', 'Sample Type', 'Anatomical Entity',
          'Organ Part', 'Model Organ', 'Selected Cell Types', 'Library Construction Method',
          'Nucleic Acid Source', 'Disease Status (Specimen)', 'Disease Status (Donor)',
          'Development Stage', 'Source',
        ];

        fieldNames.forEach(fieldName => {
          if (data[fieldName]) {
            optionsData[fieldName] = data[fieldName].map(option => ({
              value: option.abbreviation,
              label: option.name
            }));
          }
        });

        setOptions(optionsData);
      } catch (error) {
        console.error('Error fetching default options:', error);
      }
    };

    // Call the authentication check function
    checkAuthentication();

    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('datasetId');
    setDatasetId(id);

    if (id) {
      // Fetch the dataset based on datasetId using axios
      axios.post(`${NODE_API_URL}/editDatasetMetadata`, { datasetId: id })
        .then(response => {
          const data = response.data;
          setOwner(data.Owner);



          // Update formData state with the response data
          setFormData({
            Dataset: data.Dataset || '',
            Downloads: data.Downloads || '',
            Title: data.Title || '',
            Author: data.Author || '',
            'Reference (paper)': data['Reference (paper)'] || '',
            Abstract: data.Abstract || '',
            DOI: data.DOI || '',
            Species: data.Species || '',
            'Cell Count Estimate': data['Cell Count Estimate'] || '',
            'Sample Type': data['Sample Type'] || '',
            'Anatomical Entity': data['Anatomical Entity'] || '',
            'Organ Part': data['Organ Part'] || '',
            'Model Organ': data['Model Organ'] || '',
            'Selected Cell Types': data['Selected Cell Types'] || [],
            'Library Construction Method': data['Library Construction Method'] || '',
            'Nucleic Acid Source': data['Nucleic Acid Source'] || '',
            'Paired End': data['Paired End'] || false,
            'Analysis Protocol': data['Analysis Protocol'] || '',
            'Disease Status (Specimen)': data['Disease Status (Specimen)'] || [],
            'Disease Status (Donor)': data['Disease Status (Donor)'] || [],
            'Development Stage': data['Development Stage'] || [],
            'Donor Count': data['Donor Count'] || 0,
            'Source': data.Source || '',
            'Source Key': data['Source Key'] || '',
            'Submission Date': data['Submission Date'] || '',
            'cell_metadata_head': data['cell_metadata_head'],
            'cell_metadata': data['cell_metadata']
          });

          setMessage(`Successfully fetched details for the dataset ID - ${id}.`);
          setHasMessage(true);
          setIsError(false);
        })
        .catch(error => {
          console.error(`Error fetching dataset details for dataset ID - ${id}:`, error);
          setMessage(`Error fetching dataset details for dataset ID - ${id}.`);
          setHasMessage(true);
          setIsError(true);
        });
    }
  }, [location.search]);

  useEffect(() => {
    if (username && owner && isAdmin) {
      if (!isAdmin && owner !== username) {
        console.warn("Unauthorized - you must be an admin or owner of the dataset to access this page");
        window.location.href = '/accessDenied';
      }
    }
  }, [username, isAdmin, owner]);


  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle CreatableSelect changes
  const handleSelectChange = (name, selectedOption) => {
    setFormData({ ...formData, [name]: selectedOption });
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setFormData({ ...formData, [name]: selectedOptions || [] });
  };

  const optionAlreadyCreated = useCallback((fieldName, inputValue) => {
    return newOptions.some(
      (option) => option.field === fieldName && option.name === inputValue
    );
  }, [newOptions]);

  const addNewOptionToMongoDB = useCallback((fieldName, optionName) => {
    axios
      .post(`${NODE_API_URL}/addNewOption`, {
        field: fieldName,
        name: optionName,
        username: username
      })
      .then((response) => {
        console.log(`New option "${optionName}" added to MongoDB for field "${fieldName}"`);
      })
      .catch((error) => {
        console.error('Error adding new option to MongoDB:', error);
      });
  }, [username]);

  const handleCreateOption = useCallback((fieldName, inputValue) => {
    // Check if the option has already been created to prevent duplicate calls
    if (!optionAlreadyCreated(fieldName, inputValue)) {
      addNewOptionToMongoDB(fieldName, inputValue);
    }

    const newOption = { value: inputValue, label: inputValue };

    // Update options state
    setOptions((prevOptions) => {
      const updatedOptions = { ...prevOptions };
      updatedOptions[fieldName] = [...(updatedOptions[fieldName] || []), newOption];
      return updatedOptions;
    });

    // Determine if the field should be treated as an array or a single value field
    setFormData((prevFormData) => {
      const isArrayField = Array.isArray(prevFormData[fieldName]);
      const updatedFormData = {
        ...prevFormData,
        [fieldName]: isArrayField
          ? [...(prevFormData[fieldName] || []), newOption] // Append to array field
          : newOption, // Set as single value for non-array field
      };
      return updatedFormData;
    });

    // Update newOptions state
    setNewOptions((prevNewOptions) => [
      ...prevNewOptions,
      { field: fieldName, name: inputValue }
    ]);
  }, [optionAlreadyCreated, addNewOptionToMongoDB]);


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Perform validation here
    let formErrors = {};
    if (!formData.Title) formErrors.Title = 'Title is required';
    if (!formData.Author) formErrors.Author = 'Author is required';
    if (!formData.Species || (formData.Species && formData.Species.value === '')) formErrors.Species = 'Species is required';
    if (!formData['Cell Count Estimate'] || (formData['Cell Count Estimate'] && formData['Cell Count Estimate'].value === '' && formData['Cell Count Estimate'].value === 0)) formErrors['Cell Count Estimate'] = 'Cell Count Estimate is required';
    if (!formData['Organ Part'] || (formData['Organ Part'] && formData['Organ Part'].value === '')) formErrors['Organ Part'] = 'Organ Part is required';
    if (!formData['Selected Cell Types'] || formData['Selected Cell Types'].length === 0 || formData['Selected Cell Types'].value === '') {
      formData['Selected Cell Types)'] = {
        'value': 'Unspecified',
        'label': ['Unspecified']
      }
    }

    if (!formData['Disease Status (Donor)'] || formData['Disease Status (Donor)'].length === 0) {
      formData['Disease Status (Donor)'] = [{
        'value': 'Unspecified',
        'label': 'Unspecified'
      }]
    }
    if (!formData['Submission Date'] && formData['Submission Date'] === '') formErrors['Submission Date'] = 'Submission date is required';

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setHasMessage(true);
      setMessage('Please fill all the required fields to submit');
      setIsError(true);
    } else {
      // Form is valid, submit the data
      setErrors({});
      let data = formData;

      data.Id = datasetId;

      console.log(data);

      try {
        const response = await axios.post(`${NODE_API_URL}/updateDatasetDetails`, formData);

        // Assuming the response is in the form { message: "success message" }
        if (response.status === 200) {
          console.log('Metadata submitted successfully');
          setMessage("Dataset Updated Successfully!");
          setHasMessage(true);
          setIsError(false);
          window.location.href = '/mydata'; // Redirect in the same tab after successful update
        }
      } catch (error) {
        console.error('Error updating the dataset:', error);
        // Check if error response exists and get the error message
        const errorMessage = error.response?.data?.error || 'Error Updating the Dataset!';
        setMessage(errorMessage);
        setHasMessage(true);
        setIsError(true);
      }
    }
  };

  return (
    <div className="eighty-twenty-grid">
      <div className="main-content">
        {hasMessage && (
          <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />
        )}
        <div className="my-form-container">
          <h2 className="form-title">Edit Metadata For Dataset Id- {datasetId}</h2>

          <form onSubmit={handleSubmit} className="form">
            {/* Dataset */}
            <div className="form-field">
              <div>
                <label className="form-label">Title:</label>
                <span className="ui-form-title-message warning"> * required, name of the dataset. </span>
              </div>
              <input
                type="text"
                name="Title"
                required
                value={formData.Title}
                onChange={handleChange}
                className={`form-input ${errors.Title ? 'error' : ''}`}
              />
              {errors.Title && <div className="error-tooltip">{errors.Title}</div>}
            </div>

            {/* Downloads */}
            <div className="form-field">
              <div>
                <label className="form-label">Downloads:</label>
              </div>
              <span className="ui-form-title-message">Download link of the original dataset. </span>
              <input
                type="text"
                name="Downloads"
                value={formData.Downloads}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <div>
                <label className="form-label">Author:</label>
                <span className="ui-form-title-message warning"> * required </span>
              </div>
              <input
                type="text"
                name="Author"
                required
                value={formData.Author}
                onChange={handleChange}
                className={`form-input ${errors.Author ? 'error' : ''}`}
              />
              {errors.Author && <div className="error-tooltip">{errors.Author}</div>}
            </div>

            <div className="form-field">
              <label className="form-label">Reference (paper):</label>
              <span className="ui-form-title-message"> Title of the reference paper. </span>
              <input
                type="text"
                name="Reference (paper)"
                value={formData['Reference (paper)']}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Abstract:</label>
              <textarea
                name="Abstract"
                value={formData.Abstract}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* DOI */}
            <div className="form-field">
              <label className="form-label">DOI:</label>
              <span className="ui-form-title-message"> Link of the reference paper. </span>
              <input
                type="text"
                name="DOI"
                value={formData.DOI}
                onChange={handleChange}
                placeholder="http://"
                className="form-input"
              />
            </div>

            {/* Species (CreatableSelect) */}
            <div className="form-field">
              <div>
                <label className="form-label">Species:</label>
                <span className="ui-form-title-message warning"> * required </span>
              </div>
              <CreatableSelect
                name="Species"
                value={formData.Species}
                isClearable
                isSearchable
                required
                onChange={(selectedOption) => handleSelectChange('Species', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Species', inputValue)}
                options={options.Species} // Set options to the fetched options
                className={`form-input ${errors.Species ? 'error' : ''}`}
              />
              {errors.Species && <div className="error-tooltip">{errors.Species}</div>}
            </div>

            {/* "Cell Count Estimate" (CreatableSelect) */}
            <div className="form-field">
              <div>
                <label className="form-label">Cell Count Estimate:</label>
                <span className="ui-form-title-message warning"> * required </span>
              </div>
              <input
                type="number"
                name="Cell Count Estimate"
                value={formData['Cell Count Estimate']}
                onChange={handleChange}
                className="form-input"
              />
              {errors['Cell Count Estimate'] && <div className="error-tooltip">{errors['Cell Count Estimate']}</div>}
            </div>

            {/* "Sample Type" (CreatableSelect) */}
            <div className="form-field">
              <label className="form-label">Sample Type:</label>
              <CreatableSelect
                name="Sample Type"
                value={formData['Sample Type']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Sample Type', selectedOption)} // Use handleSelectChange             
                onCreateOption={(inputValue) => handleCreateOption('Sample Type', inputValue)}
                options={options['Sample Type']} // Set options to the fetched options
                className={`form-input ${errors['Sample Type'] ? 'error' : ''}`}
              />
              {errors['Sample Type'] && <div className="error-tooltip">{errors['Sample Type']}</div>}
            </div>


            {/* "Anatomical Entity" (CreatableSelect) */}
            <div className="form-field">
              <div>
                <label className="form-label">Anatomical Entity:</label>
              </div>
              <CreatableSelect
                name="Anatomical Entity"
                value={formData['Anatomical Entity']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Anatomical Entity', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Anatomical Entity', inputValue)}
                options={options['Anatomical Entity']} // Set options to the fetched options
                className="form-input"
              />
            </div>

            {/* "Organ Part" (CreatableSelect) */}
            <div className="form-field">
              <div>
                <label className="form-label">Organ Part:</label>
                <span className="ui-form-title-message warning"> * required </span>
              </div>
              <CreatableSelect
                name="Organ Part"
                value={formData['Organ Part']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Organ Part', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Organ Part', inputValue)}
                options={options['Organ Part']} // Set options to the fetched options
                className={`form-input ${errors['Organ Part'] ? 'error' : ''}`}
              />
              {errors['Organ Part'] && <div className="error-tooltip">{errors['Organ Part']}</div>}
            </div>

            {/* "Model Organ" (CreatableSelect) */}
            <div className="form-field">
              <label className="form-label">Model Organ:</label>
              <CreatableSelect
                name="Model Organ"
                value={formData['Model Organ']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Model Organ', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Model Organ', inputValue)}
                options={options['Model Organ']} // Set options to the fetched options
                className="form-input"
              />
              {errors['Model Organ'] && <p className="error">{errors['Model Organ']}</p>}
            </div>

            { /* "Selected Cell Types" (CreatableSelect) */}
            <div className="form-field">
              <div>
                <label className="form-label">Cell Type Annotation:</label>
              </div>
              {formData.cell_metadata ? (
                <CreatableSelect
                  name="Selected Cell Types"
                  value={formData['Selected Cell Types']}
                  isClearable
                  isSearchable
                  onChange={(selectedOption) => handleSelectChange('Selected Cell Types', selectedOption)}
                  options={
                    Object.entries(decompressData(formData.cell_metadata)).map((entry) => ({
                      label: entry[0],
                      value: Object.values(entry[1])[0],
                    }))
                  }
                  className="form-input"
                />
              ) : (
                <p>No cell metadata available.</p>
              )}
            </div>

            { /* Label Table Container */}
            <div className="label-table-container">
              {formData.cell_metadata_head ? (
                <TableComponent cellMetadataObs={JSON.parse(formData.cell_metadata_head)} />
              ) : (
                <p>No cell metadata head available.</p>
              )}
            </div>


            {/* "Library Construction Method" (CreatableSelect) */}
            <div className="form-field">
              <label className="form-label">Library Construction Method:</label>
              <CreatableSelect
                name="Library Construction Method"
                value={formData['Library Construction Method']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Library Construction Method', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Library Construction Method', inputValue)}
                options={options['Library Construction Method']} // Set options to the fetched options
                className="form-input"
              />
            </div>

            {/* "Nucleic Acid Source" (CreatableSelect) */}
            <div className="form-field">
              <label className="form-label">Nucleic Acid Source:</label>
              <CreatableSelect
                name="Nucleic Acid Source"
                value={formData['Nucleic Acid Source']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Nucleic Acid Source', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Nucleic Acid Source', inputValue)}
                options={options['Nucleic Acid Source']} // Set options to the fetched options
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Paired End:</label>
              <div>
                <label>
                  <input
                    type="radio"
                    name="Paired End"
                    value="true"
                    checked={!formData["Paired End"] || formData["Paired End"] === "true" ? true : false}
                    onChange={handleChange}
                    className="form-input"
                  />
                  True
                </label>
                <label className="form-label">
                  <input
                    type="radio"
                    name="Paired End"
                    value="false"
                    checked={formData["Paired End"] === "false" ? true : false}
                    onChange={handleChange}
                    className="form-input"
                  />
                  False
                </label>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Analysis Protocol:</label>
              <input
                type="text"
                name="Analysis Protocol"
                value={formData['Analysis Protocol']}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* "Disease Status (Donor)" (CreatableSelect) */}
            <div className="form-field"><div>
              <label className="form-label">Disease Status (Donor):</label>
            </div>
              <CreatableSelect
                name="Disease Status (Donor)"
                value={formData['Disease Status (Donor)']}
                isMulti
                isClearable
                isSearchable
                onChange={(selectedOptions) => handleMultiSelectChange('Disease Status (Donor)', selectedOptions)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Disease Status (Donor)', inputValue)}
                options={options['Disease Status (Donor)']} // Set options to the fetched options
                className="form-input"
              />
            </div>


            {/* "Disease Status (Specimen)" (CreatableSelect) */}
            <div className="form-field"><div>
              <label className="form-label">Disease Status (Specimen):</label>
            </div>
              <CreatableSelect
                name="Disease Status (Specimen)"
                value={formData['Disease Status (Specimen)']}
                isMulti
                isClearable
                isSearchable
                onChange={(selectedOptions) => handleMultiSelectChange('Disease Status (Specimen)', selectedOptions)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Disease Status (Specimen)', inputValue)}
                options={options['Disease Status (Specimen)']} // Set options to the fetched options
                className="form-input"
              />
            </div>

            {/* "Development Stage" (CreatableSelect) */}
            <div className="form-field">
              <label className="form-label">Development Stage:</label>
              <CreatableSelect
                name="Development Stage"
                value={formData['Development Stage']}
                isMulti
                isClearable
                onChange={(selectedOptions) => handleMultiSelectChange('Development Stage', selectedOptions)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Development Stage', inputValue)}
                options={options['Development Stage']} // Set options to the fetched options
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Donor Count:</label>
              <input
                type="number"
                name="Donor Count"
                value={formData["Donor Count"]}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* "Source" (CreatableSelect) */}
            <div className="form-field">
              <label className="form-label">Source:</label>
              <CreatableSelect
                name="Source"
                value={formData['Source']}
                isClearable
                isSearchable
                onChange={(selectedOption) => handleSelectChange('Source', selectedOption)} // Use handleSelectChange              
                onCreateOption={(inputValue) => handleCreateOption('Source', inputValue)}
                options={options['Source']} // Set options to the fetched options
                className="form-input"
              />
            </div>

            {/* Source Key */}
            <div className="form-field">
              <label className="form-label">Source Key:</label>
              <input
                type="text"
                name="Source Key"
                value={formData['Source Key']}
                onChange={handleChange}
                placeholder="Enter ..."
                className="form-input"
              />
              {errors['Source Key'] && <p className="error">{errors['Source Key']}</p>}
            </div>

            <div className="form-field"><div>
              <label>Submission Date:</label>
              <span className="ui-form-title-message warning"> * required </span></div>
              <input
                type="date"
                required
                name="Submission Date"
                value={formData["Submission Date"]}
                onChange={handleChange}
                className={`form-input ${errors['Submission Date'] ? 'error' : ''}`}
              />
              {errors['Submission Date'] && <div className="error-tooltip">{errors['Submission Date']}</div>}
            </div>

            <div className='navigation-buttons'>

              <div className="next-upon-success">
                <button type="submit" className="btn btn-info button">
                  Submit
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      <div>
        {(getCookie('jwtToken') !== undefined || getCookie('jwtToken') !== '') && (<div className="right-rail">
          <RightRail />
        </div>)}
      </div>
    </div>
  );
};

export default EditCustomForm;
