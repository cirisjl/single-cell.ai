// DatasetDetailsTable.js
import React, { useState } from 'react';
import { Descriptions } from 'antd';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';


const DatasetDetailsTable = ({ datasetDetails, downloadFile, getFileNameFromURL }) => {
  const [copiedState, setCopiedState] = useState(false);

  const handleCopy = () => {
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000); // Reset after 2 seconds
  };

  return (
    <Descriptions title="Dataset Details" bordered column={1}>
      <Descriptions.Item label="Dataset ID"><Link to={"/mydata/view-dataset-info?datasetId=" + datasetDetails.Id} target="_blank"><strong>{datasetDetails.Id}</strong></Link>&nbsp;&nbsp;
        <CopyToClipboard text={datasetDetails.Id} onCopy={() => handleCopy()}>
          <button style={{
            // position: 'absolute',
            background: 'lightgrey',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            // padding: '5px 10px',
          }}>{copiedState ? 'Copied!' : 'Copy'}</button>
        </CopyToClipboard>
      </Descriptions.Item>
      <Descriptions.Item label="Title"><Link to={"/mydata/view-dataset-info?datasetId=" + datasetDetails.Id} target="_blank"><strong>{datasetDetails.Title}</strong></Link></Descriptions.Item>
      <Descriptions.Item label="Author">{datasetDetails.Author}</Descriptions.Item>
      <Descriptions.Item label="Reference (paper)">{datasetDetails["Reference (paper)"]}</Descriptions.Item>
      <Descriptions.Item label="DOI"><a href={datasetDetails.DOI}>{datasetDetails.DOI}</a></Descriptions.Item>
      <Descriptions.Item label="Abstract">{datasetDetails.Abstract}</Descriptions.Item>
      <Descriptions.Item label="Original Downloads"><a href={datasetDetails.Downloads}>{datasetDetails.Downloads}</a></Descriptions.Item>
      <Descriptions.Item label="Species">{datasetDetails.Species?.label || datasetDetails.Species}</Descriptions.Item>
      <Descriptions.Item label="Sample Type">{datasetDetails["Sample Type"]?.label}</Descriptions.Item>
      <Descriptions.Item label="Cell Count Estimate">{datasetDetails["Cell Count Estimate"]}</Descriptions.Item>
      <Descriptions.Item label="Organ Part">{datasetDetails["Organ Part"]?.label || datasetDetails["Organ Part"]}</Descriptions.Item>
      <Descriptions.Item label="Selected Cell Types">
        {datasetDetails["Selected Cell Types"]?.value.join(', ')}
      </Descriptions.Item>
      <Descriptions.Item label="Library Construction Method">{datasetDetails["Library Construction Method"]?.label}</Descriptions.Item>
      <Descriptions.Item label="Nucleic Acid Source">{datasetDetails["Nucleic Acid Source"]?.label}</Descriptions.Item>
      <Descriptions.Item label="Analysis Protocol">{datasetDetails["Analysis Protocol"]}</Descriptions.Item>
      <Descriptions.Item label="Disease Status (Specimen)">
        {Array.isArray(datasetDetails["Disease Status (Specimen)"])
          ? datasetDetails["Disease Status (Specimen)"].map((status, index) => (
            <span key={index}>{status.label}{index < datasetDetails["Disease Status (Specimen)"].length - 1 ? ', ' : ''}</span>
          ))
          : datasetDetails["Disease Status (Specimen)"]?.label || datasetDetails["Disease Status (Specimen)"]
        }
      </Descriptions.Item>
      <Descriptions.Item label="Development Stage">
        {Array.isArray(datasetDetails["Development Stage"])
          ? datasetDetails["Development Stage"].map((status, index) => (
            <span key={index}>{status.label}{index < datasetDetails["Development Stage"].length - 1 ? ', ' : ''}</span>
          ))
          : datasetDetails["Development Stage"]?.label || datasetDetails["Development Stage"]
        }
      </Descriptions.Item>
      <Descriptions.Item label="Source"><a href={datasetDetails["Source"]?.label}>{datasetDetails["Source"]?.label}</a></Descriptions.Item>
      <Descriptions.Item label="Submission Date">{datasetDetails["Submission Date"]}</Descriptions.Item>
      <Descriptions.Item label="AnnData File">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); downloadFile(datasetDetails["adata_path"]) }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            textAlign: 'center',
            cursor: 'pointer',
            textDecoration: 'underline',
            color: 'blue'
          }}>
          {getFileNameFromURL(datasetDetails["adata_path"]) || 'Not available'}
        </button>
      </Descriptions.Item>
    </Descriptions>
  );
};

export default DatasetDetailsTable;
