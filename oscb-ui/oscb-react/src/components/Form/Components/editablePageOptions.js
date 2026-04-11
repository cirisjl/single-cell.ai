import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NODE_API_URL } from '../../../constants/declarations';
import { getCookie, isUserAuth } from '../../../utils/utilFunctions';
import { useNavigate } from 'react-router-dom';
import './ManageOptions.css'; // Import a CSS file for styles


function ManageOptions() {
  const [options, setOptions] = useState({});
  const [username, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({}); // Track selected options
  const navigate = useNavigate();

  const [newOptionValue, setNewOptionValue] = useState(''); // New option value
  const [newOptionAbbreviation, setNewOptionAbbreviation] = useState(''); // New option abbreviation
  const [isAddOptionDialogOpen, setAddOptionDialogOpen] = useState(false);

  useEffect(() => {
    let jwtToken = getCookie('jwtToken');

    if (!jwtToken) {
      navigate("/routing");
    }

    isUserAuth(jwtToken).then((authData) => {
      if (authData.isAuth) {
        const username = authData.username;
        setUserName(username);
        setIsAdmin(authData.isAdmin);
        const apiUrl = `${NODE_API_URL}/groupedUserOptions?username=${username}&isAdmin=${authData.isAdmin}`;

        axios.get(apiUrl)
          .then((response) => {
            setOptions(response.data);
          })
          .catch((error) => {
            console.error('Error fetching data:', error);
          });
      } else {
        console.warn("Authentication failed - please login to continue.");
        navigate("/routing");
      }
    }).catch((error) => console.error(error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle option selection
  const handleSelectOption = (field, optionId) => {
    setSelectedOptions((prevSelectedOptions) => {
      const selected = prevSelectedOptions[field] || [];
      if (selected.includes(optionId)) {
        // If the option is already selected, unselect it.
        return {
          ...prevSelectedOptions,
          [field]: selected.filter((id) => id !== optionId),
        };
      } else {
        // If the option is not selected, select it.
        return {
          ...prevSelectedOptions,
          [field]: [...selected, optionId],
        };
      }
    });
    console.log(selectedOptions);
  };

  // Function to handle option deletion
  const handleDeleteSelectedOptions = (field) => {
    const selectedOptionIds = selectedOptions[field] || [];

    // Check if there are selected options to delete
    if (selectedOptionIds.length > 0) {
      const deleteApiUrl = `${NODE_API_URL}/deleteOptions`;

      // Send a DELETE request with the array of selected option IDs to delete from MongoDB
      axios
        .delete(deleteApiUrl, { data: { optionIds: selectedOptionIds } })
        .then((response) => {
          // Handle success response, e.g., update the UI to reflect the deleted options
          // After successful deletion, re-fetch the updated options and set the state
          const updatedApiUrl = `${NODE_API_URL}/groupedUserOptions?username=${username}&isAdmin=${isAdmin}`;
          axios
            .get(updatedApiUrl)
            .then((response) => {
              setOptions(response.data);
            })
            .catch((error) => {
              console.error('Error fetching updated options:', error);
            });
        })
        .catch((error) => {
          console.error('Error deleting options:', error);
        });

      // Clear the selected options after deletion
      setSelectedOptions((prevSelectedOptions) => ({
        ...prevSelectedOptions,
        [field]: [],
      }));
    }
  };

  // Function to add a new option (for Task field only)
  const handleAddOption = () => {
    // Create a new option object with the provided value and abbreviation
    const newOption = {
      name: newOptionValue,
      abbreviation: newOptionAbbreviation,
      field: 'Task', // Set the field to "Task"
      username: 'default'
    };

    // Send a POST request to add the new option to MongoDB
    const addOptionApiUrl = `${NODE_API_URL}/addTaskOption`;
    axios
      .post(addOptionApiUrl, newOption)
      .then((response) => {
        // Handle success response, e.g., update the UI to reflect the added option
        // After successful addition, re-fetch the updated options and set the state
        const updatedApiUrl = `${NODE_API_URL}/groupedUserOptions?username=${username}&isAdmin=${isAdmin}`;
        axios
          .get(updatedApiUrl)
          .then((response) => {
            setOptions(response.data);
          })
          .catch((error) => {
            console.error('Error fetching updated options:', error);
          });

        // Clear the new option input fields
        setNewOptionValue('');
        setNewOptionAbbreviation('');
        // Close the add option dialog
        setAddOptionDialogOpen(false);
      })
      .catch((error) => {
        console.error('Error adding option:', error);
      });
  };

  return (
    <div className="manage-options-container">
      <h2>Options Grouped by Field</h2>
      {Object.keys(options).map((field) => (
        <div className="field-container" key={field}>
          <h3>{field}</h3>
          <ul>
            {options[field].map((option) => (
              <li key={option._id} className="option-item">
                <input
                  type="checkbox"
                  checked={selectedOptions[field]?.includes(option._id)}
                  onChange={() => handleSelectOption(field, option._id)}
                />
                {/* Display the option name along with the abbreviation if available */}
                {option.abbreviation ? (
                  <span>
                    {option.name} - {option.abbreviation}
                  </span>
                ) : (
                  <span>{option.name}</span>
                )}
              </li>
            ))}
          </ul>
          <button onClick={() => handleDeleteSelectedOptions(field)} className="delete-button">
            Delete Selected Options
          </button>
          {isAdmin && field === 'Task' && (
            <button onClick={() => setAddOptionDialogOpen(true)} className="add-button">
              + Add
            </button>
          )}

          {/* Add New Task Option Dialog */}
          {isAddOptionDialogOpen && isAdmin && field === 'Task' && (
            <div className="overlay">
              <div className="add-option-dialog">
                <h3>Add Task Option</h3>
                <label>
                  Value:
                  <input
                    type="text"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                  />
                </label>
                <label>
                  Abbreviation:
                  <input
                    type="text"
                    value={newOptionAbbreviation}
                    onChange={(e) => setNewOptionAbbreviation(e.target.value)}
                  />
                </label>
                <button onClick={handleAddOption} className="add-button">
                  Save
                </button>
                <button onClick={() => setAddOptionDialogOpen(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


export default ManageOptions;
