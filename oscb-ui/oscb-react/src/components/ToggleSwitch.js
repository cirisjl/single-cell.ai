import React from "react";
  
const ToggleSwitch = ({ label , toggleSwitchForPublicDatasets, defaultValue = false}) => {
  return (
    <div>
      {label}{" "}
      <div className="toggle-switch">
        <input type="checkbox" className="checkbox" 
               name={label} id={label} defaultChecked={defaultValue} onClick={toggleSwitchForPublicDatasets} />
        <label className="label" htmlFor={label}>
          <span className="inner" />
          <span className="switch" />
        </label>
      </div>
    </div>
  );
};
  
export default ToggleSwitch;