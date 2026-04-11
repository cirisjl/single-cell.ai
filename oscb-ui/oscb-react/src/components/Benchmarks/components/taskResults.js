import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NODE_API_URL } from '../../../constants/declarations'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faSliders } from '@fortawesome/free-solid-svg-icons';
import FilterComponent from '../../publishDatasets/components/filtersComponent';
// import Pagination from '../../publishDatasets/components/tablePaginationComponent';
// import ResultsTable from '../../publishDatasets/components/tableResultsComponent';
import TreeTable from '../../common_components/treeTableComponent';

function SearchTasks({ taskType }) {
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({});

  const [visibleFacets, setVisibleFacets] = useState([]); // Will hold the keys of the facets to display
  const [showMoreFacets, setShowMoreFacets] = useState(false); // Toggle state for showing more facets
  const [activeFilters, setActiveFilters] = useState({});
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState({});


  const fetchData = async (currentPage, currentFilters, searchQuery) => {

    // console.log(taskType);
    const queryParams = new URLSearchParams({
      page: currentPage,
      task_type: taskType.task_type,
      q: searchQuery
    }).toString();

    try {
      const response = await axios.post(`${NODE_API_URL}/tasks/search?${queryParams}`,
        JSON.stringify({ filters: currentFilters }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { data } = response;

      setResults(data.results);
      setFilters(data.facets);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, activeFilters, globalSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Set initial visible facets to the first four, or fewer if there aren't four
    setVisibleFacets(Object.keys(filters).slice(0, 4));
  }, [filters]); // This will update visible facets when the filters are fetched

  const onSelectDataset = (dataset) => {
    // Get a copy of the current selected datasets from the state or props
    const currentSelectedDatasets = { ...selectedTasks };
    const benchmarksId = dataset.benchmarksId;

    if (currentSelectedDatasets[benchmarksId]) {
      // Dataset is currently selected, deselect it
      delete currentSelectedDatasets[benchmarksId];
    } else {
      // Dataset is not selected, select it
      currentSelectedDatasets[benchmarksId] = dataset;
    }

    setSelectedTasks(currentSelectedDatasets);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchData(1, activeFilters, globalSearchTerm);
    console.log("Search Handled");
  };

  const handleApplyFilters = async () => {
    fetchData(1, activeFilters, globalSearchTerm);

    // Update the list of applied filters
    const filtersList = Object.entries(activeFilters).map(([category, values]) => {
      return values.map(value => ({ category, value }));
    }).flat();
    setAppliedFilters(filtersList);
  };


  const handleRemoveFilter = (category, value) => {
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


  const toggleMoreFacets = () => {
    setShowMoreFacets(!showMoreFacets);
    // Show all facets if showMoreFacets is true, else show only the first four
    if (!showMoreFacets) {
      setVisibleFacets(Object.keys(filters));
    } else {
      setVisibleFacets(Object.keys(filters).slice(0, 4));
    }
  };



  return (
    <div className="task-builder-task">
      <div className="dialog-container">
        <div>
          <div>

            <div className='filters-and-search-container'>
              <div className='metadata-search-wrap filters-container'>
                <span className="metadata-search search-title">Search by filters <FontAwesomeIcon icon={faQuestionCircle} /></span>
                {visibleFacets.map((filterName) => (
                  <FilterComponent
                    key={filterName}
                    name={filterName}
                    options={filters[filterName]}
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
              <TreeTable data={results} onSelectDataset={onSelectDataset} selectedDatasets={selectedTasks} multiple="true" pagination={pagination} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SearchTasks;
