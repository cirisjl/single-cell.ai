import React from 'react';
import { prepareTableData } from '../../../utils/utilFunctions';

// The Table component
const TableComponent = ({ cellMetadataObs }) => {
    const data = prepareTableData(cellMetadataObs);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
    return (
        <div className="table-container">
            <table>
                <thead>
                <tr>
                    {columns.map(column => (
                    <th key={column}>{column}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map((row, index) => (
                    <tr key={index}>
                    {columns.map(column => (
                        <td key={column}>{row[column]}</td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
  };
  
  export default TableComponent;