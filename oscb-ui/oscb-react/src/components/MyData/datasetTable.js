import React, { useState, useEffect } from 'react';
import FilterComponent from '../publishDatasets/components/filtersComponent';
import { NODE_API_URL } from '../../constants/declarations';
import ResultsTable from '../publishDatasets/components/tableResultsComponent';
// import Pagination from '../publishDatasets/components/tablePaginationComponent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Typography, FormGroup, FormControlLabel, Checkbox, Button, Grid, Box } from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { getCookie } from '../../utils/utilFunctions';
import axios from 'axios';

const DatasetTable = ({ onSelect, isVisible, selectedDatasets, fromToolsPage, onSelectSubItem, username = null, isAdmin = false, showCheckbox = true, showEdit = true, showDelete = true, enableClick = true }) => {
  const jwtToken = getCookie('jwtToken');
  const dialogStyle = {
    display: isVisible ? 'block' : 'none',
    // ... other styles
  };
  const [loading, setLoading] = useState(false);

  const [checkedState, setCheckedState] = useState({
    private: true,
    public: false,
  });

  const navigate = useNavigate();

  const [visibleFacets, setVisibleFacets] = useState([]); // Will hold the keys of the facets to display
  const [showMoreFacets, setShowMoreFacets] = useState(false); // Toggle state for showing more facets

  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState([]);

  const handleCreateDataset = () => {
    navigate("/mydata/upload-data/");
  }

  // Function to fetch data from the API
  const fetchData = async (currentPage, currentFilters, searchQuery) => {
    setLoading(true);
    let url = "";
    try {
      if (fromToolsPage) {
        url = `${NODE_API_URL}/tools/allDatasets/search?q=${searchQuery}&page=${currentPage}&private=${checkedState.private}&public=${checkedState.public}&shared=${checkedState.shared}`;
      } else {
        url = `${NODE_API_URL}/datasets/search?q=${searchQuery}&page=${currentPage}&public=${true}&shared=${true}`;
        // url = `${NODE_API_URL}/tools/allDatasets/search?q=${searchQuery}&page=${currentPage}&private=${false}&public=${true}&shared=${true}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ filters: currentFilters }),
      });
      const data = await response.json();
      // console.log(data);
      setFilters(data.facets);
      setResults(data.results);
      setPagination(data.pagination);
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleCheckboxChange = (event) => {
    setCheckedState({ ...checkedState, [event.target.name]: event.target.checked });
  };

  const handleApplyFilters = async () => {
    setShowMoreFacets(false);
    fetchData(1, activeFilters, globalSearchTerm);

    // Update the list of applied filters
    const filtersList = Object.entries(activeFilters).map(([category, values]) => {
      return values.map(value => ({ category, value }));
    }).flat();
    setAppliedFilters(filtersList);
  };

  useEffect(() => {
    fetchData(1, activeFilters, globalSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedState]);

  useEffect(() => {
    // Set initial visible facets to the first four, or fewer if there aren't four
    const filterKeys = Object.keys(filters);
    setVisibleFacets(filterKeys.length > 0 ? filterKeys.slice(0, 4) : []);
  }, [filters]); // This will update visible facets when the filters are fetched or changed

  const toggleMoreFacets = () => {
    setShowMoreFacets(!showMoreFacets);
    // Show all facets if showMoreFacets is true, else show only the first four
    if (!showMoreFacets) {
      setVisibleFacets(Object.keys(filters));
    } else {
      setVisibleFacets(Object.keys(filters).slice(0, 4));
    }
  };

  const handleFilterChange = (filterCategory, filterValue) => {
    setActiveFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      if (newFilters[filterCategory]) {
        if (newFilters[filterCategory].includes(filterValue)) {
          // Filter is already active, so remove it
          newFilters[filterCategory] = newFilters[filterCategory].filter(v => v !== filterValue);
        } else {
          // Add the filter to the active category
          newFilters[filterCategory].push(filterValue);
        }
      } else {
        // This category hasn't been selected yet, so add a new array with this value
        newFilters[filterCategory] = [filterValue];
      }

      // If the filter category array is empty, remove the category from the filters
      if (newFilters[filterCategory].length === 0) {
        delete newFilters[filterCategory];
      }

      return newFilters;
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setShowMoreFacets(false);
    fetchData(1, activeFilters, globalSearchTerm);
    console.log("Search Handled");
  };

  const handleRemoveFilter = (category, value) => {
    setShowMoreFacets(false);
    setActiveFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      newFilters[category] = newFilters[category].filter(v => v !== value);

      if (newFilters[category].length === 0) {
        delete newFilters[category];
      }

      fetchData(1, newFilters, globalSearchTerm);
      return newFilters;
    });

    // Remove filter from the list of applied filters
    setAppliedFilters(prevFilters => prevFilters.filter(filter => !(filter.category === category && filter.value === value)));

  };

  const handleDelete = (datasetId) => {
    console.log("Delete dataset Id: ", datasetId);
    if (!window.confirm(`Are you sure to delete ${datasetId}? This action will delete all benchmarks, jobs and pre-processing results as well, and cannot be undone.`)) return;

    axios.delete(`${NODE_API_URL}/deleteDataset?datasetId=${datasetId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
      })
      .then(() => fetchData(pagination.current, activeFilters, globalSearchTerm))
      .catch(error => console.error('Error deleting dataset:', error));
  };

  return (
    <div style={dialogStyle} className="dialog-container">
      <div>
        <div>
          {fromToolsPage &&
            <div className='dataset-type-container'>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={8}>
                  <Box pl={2}>
                    <Typography variant="h6" gutterBottom>
                      <span className="metadata-search search-title">Select Datasets Category<FontAwesomeIcon icon={faQuestionCircle} /></span>
                    </Typography>
                    <FormGroup row>
                      <FormControlLabel
                        control={<Checkbox checked={checkedState.private} onChange={handleCheckboxChange} name="private" />}
                        label="My Datasets"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={checkedState.public} onChange={handleCheckboxChange} name="public" />}
                        label="Benchmarks Datasets"
                      />
                    </FormGroup>
                  </Box>
                </Grid>
                <Grid item xs={4} container justifyContent="center">
                  <Button variant="outlined" color="primary" onClick={handleCreateDataset}>
                    Upload Dataset
                  </Button>
                </Grid>
              </Grid>
            </div>
          }

          {loading ? (
            <div className="spinner-container">
              <ScaleLoader color="#36d7b7" loading={loading} />
            </div>
          ) : results && results.length > 0 ? ( // Corrected the placement of curly braces around the ternary expression
            <div>
              <div className='filters-and-search-container'>
                <div className='metadata-search-wrap filters-container'>
                  <span className="metadata-search search-title">Search by filters <FontAwesomeIcon icon={faQuestionCircle} /></span>
                  {visibleFacets.map((filterName) => (
                    <FilterComponent
                      key={filterName}
                      name={filterName}
                      options={filters[filterName]} // Ensure this is always an array
                      activeFilters={activeFilters}
                      onFilterChange={handleFilterChange}
                      className="filter"
                      onApplyFilters={handleApplyFilters}
                    />
                  ))}
                  <div className='filters-toggle-div'>
                    {Object.keys(filters).length > 4 && (
                      <button onClick={toggleMoreFacets} className='filters-toggle'>
                        <FontAwesomeIcon icon={faSliders} /> <p>{showMoreFacets ? 'Less facets' : 'More facets'}</p>
                      </button>
                    )}
                  </div>
                </div>
                <div className='study-keyword-search'>
                  <span className="text-search search-title">Search by text <FontAwesomeIcon icon={faQuestionCircle} /></span>
                  <div>
                    <form onSubmit={handleSearchSubmit} style={{
                      display: 'flex',       // Puts children in a row
                      alignItems: 'center',  // Centers them vertically
                      gap: '8px'             // Adds a small space between the input and button
                    }}>
                      <input
                        type="text"
                        autoComplete="off"
                        className="w-full dark:bg-gray-950 pl-8 form-input-alt h-9 pr-3 focus:shadow-xl"
                        placeholder="Search..."
                        value={globalSearchTerm}
                        onChange={(e) => setGlobalSearchTerm(e.target.value)}
                      />
                      <button type="submit" aria-label="Search" style={{ cursor: "pointer" }}>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                      </button>
                      {/* <svg className="absolute left-2.5 text-gray-400 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32">
                                  <path d="M30 28.59L22.45 21A11 11 0 1 0 21 22.45L28.59 30zM5 14a9 9 0 1 1 9 9a9 9 0 0 1-9-9z" fill="currentColor"></path>
                              </svg>     */}

                    </form>
                  </div>
                </div>

              </div>
              <div className='applied-filters-container'>
                {appliedFilters.length > 0 && (
                  <div className="applied-filters">
                    <p>Applied Filters:</p>
                    {appliedFilters.map((filter, index) => (
                      <div key={index} className="applied-filter">
                        {filter.category}: {filter.value}
                        <span className="cross-icon" onClick={() => handleRemoveFilter(filter.category, filter.value)}>&times;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='table-results'>
                <ResultsTable data={results} onSelectDataset={onSelect} onDeleteDataset={handleDelete} selectedDatasets={selectedDatasets} multiple={false} pagination={pagination} onSelectSubItem={onSelectSubItem} username={username} isAdmin={isAdmin} enableClick={enableClick} showCheckbox={showCheckbox} showEdit={showEdit} showDelete={showDelete} />
              </div>

            </div>
          ) : (
            <div>
              <p> No results for you search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DatasetTable;
