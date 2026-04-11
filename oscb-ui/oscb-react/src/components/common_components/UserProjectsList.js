import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';

function UserProjectsDropdown({ userProjectsList, onProjectChange, handleFocus, selectedUserProject }) {
  const [selectedProject, setSelectedProject] = useState(selectedUserProject || '');
  const [error, setError] = useState(false);

  const handleChange = (event) => {
    const project_name = event.target.value;
    setSelectedProject(project_name);
    setError(false); // No error, even if default is selected
    onProjectChange(project_name); // If empty string, means "none selected"
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="project-label">Select Project (Optional)</InputLabel>
      <Select
        labelId="project-label"
        value={selectedProject}
        label="Select Project (Optional)"
        onChange={handleChange}
        // onClick={handleClick}
        onFocus={handleFocus}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {userProjectsList.map((project) => (
          <MenuItem key={project._id} value={project.project_name}>
            {project.project_name}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>Create a project and add members to share datasets. Use the 'MANAGE PROJECT' button to create projects and manage members.</FormHelperText>
      {error && <FormHelperText>Project selection is required</FormHelperText>}
    </FormControl>
  );
}

export default UserProjectsDropdown;