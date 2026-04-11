import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';

function LeftNavComponent(props) {
  const [categories, setCategories] = useState([
    {
      category_id: 1,
      category_name: 'Analyses',
      expanded: true,
      filters: ['Data Management', 'Tools', 'Workflows', 'Job Management'],
    },
    {
      category_id: 2,
      category_name: 'Benchmarks',
      expanded: true,
      filters: ['Create New Benchmarks', 'Benchmarks'],
    },
    {
      category_id: 3,
      category_name: 'Python API',
      expanded: true,
      filters: ['Installation', 'Data Loader', 'Evaluators'],
    }
  ]);

  const handleFilterSelection = props.handleFilterSelection

  const toggleCategory = categoryId => {
    setCategories(
      categories.map(category =>
        category.category_id === categoryId
          ? { ...category, expanded: !category.expanded }
          : category
      )
    );
  };

  return (
    <nav>
      <div className='tool-panel-section'>
        {categories.map(category => (
          <div key={category.category_id} className='category-level'>
            <h3 className='category-level-header' onClick={() => toggleCategory(category.category_id)}>
              {category.category_name}
              <span className="category-icon">
                <FontAwesomeIcon
                  icon={category.expanded ? faAngleDown : faAngleRight}
                />
              </span>
            </h3>
            {category.expanded && (
              <ul
                className={`category-filters filter-level-ul ${category.expanded ? 'expanded' : 'collapsed'
                  }`}
              >
                {category.filters.map(filter => (
                  <li key={filter} className='filter-level-li' onClick={() => handleFilterSelection(filter.toLowerCase())}>{filter}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

export default LeftNavComponent;
