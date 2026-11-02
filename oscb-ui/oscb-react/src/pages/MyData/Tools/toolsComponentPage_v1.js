import LeftNav from "../../../components/LeftNavigation/leftNav"
import ToolsDetailsComponent from "../../../components/MyData/Tools/toolsDetailsComponent";
import RightRail from "../../../components/RightNavigation/rightRail"
import React, { useState } from 'react';
import useUserAuthCheck from "../../../components/common_components/userAuthCheckComponent";


export default function ToolsComponentPage() {

    const [selectedFilter, setSelectedFilter] = useState(null);
    const [category, setCategory] = useState(null);
    // const [presetQuestions, setPresetQuestions] = useState(null);

    const handleFilterSelection = (category, filter) => {
      setSelectedFilter(category + "_" + filter);
      setCategory(category);
    };

    useUserAuthCheck();
  
    return(
        <div className="page-container">
            <div className="left-nav border-r left-nav-background">
                <LeftNav handleFilterSelection={handleFilterSelection}/>
            </div>
            {/* Render the selected filter details in the middle of the page */}
            {selectedFilter && (
              <div className="filter-details-tools main-content">
            <ToolsDetailsComponent filter={selectedFilter} category={category} />
              </div>
            )}
            {!selectedFilter && (
              <div className="tool-message">
                <p>Please select a <strong>Tool</strong> from left to start.</p>
              </div>
            )}
            <div className="right-rail">
                <RightRail/>
            </div>
        </div>
    )
}