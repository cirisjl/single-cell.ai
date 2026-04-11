// import LeftNav from "../components/leftNav";
import DatasetTable from "../components/MyData/datasetTable";
import RightRail from "../components/RightNavigation/rightRail";
// import { getCookie } from "../utils/utilFunctions";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DIRECTUS_URL } from '../constants/declarations'
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'
import rehypeGithubAlerts from 'rehype-github-alert'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Chatbot from "../components/RightNavigation/Chatbot";

export default function MyData() {

    const filterCategory = null;
    const [selectedDatasets, setSelectedDatasets] = useState({});

    // useEffect(() => {
    //     if (getCookie('jwtToken') === undefined || getCookie('jwtToken') === '') {
    //         navigate('/routing');
    //     }
    // }, []);

    const onSelectDataset = (dataset) => {
        let datasetId = dataset.Id;
        let currentSelectedDatasets = { ...selectedDatasets };

        if (currentSelectedDatasets[datasetId]) {
            delete currentSelectedDatasets[datasetId];
        } else {
            if (filterCategory !== "integration") {
                currentSelectedDatasets = {};
            }
            currentSelectedDatasets[datasetId] = dataset;
        }
        if (filterCategory === "quality_control") {
            // Do nothing
        }
        setSelectedDatasets(currentSelectedDatasets)
    };

    // Function to handle selection of sub-items
    const onSelectSubItem = (mainItem, subItem) => {
        const mainItemId = mainItem.Id;
        let currentSelectedDatasets = { ...selectedDatasets };

        // Check if the main item is already selected
        if (currentSelectedDatasets[mainItemId]) {
            // If sub-item is already selected, deselect it
            if (currentSelectedDatasets[mainItemId].selectedSubItem?.process_id === subItem.process_id) {
                delete currentSelectedDatasets[mainItemId];
            } else {
                // Update the selected main item with the selected sub-item
                currentSelectedDatasets[mainItemId] = {
                    ...mainItem,
                    selectedSubItem: subItem
                };
            }
        } else {
            // Select the main item and the sub-item
            currentSelectedDatasets = {
                [mainItemId]: {
                    ...mainItem,
                    selectedSubItem: subItem
                }
            };
        }

        setSelectedDatasets(currentSelectedDatasets);
    };

    const [markdownText, setMarkdownText] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (index) => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    };

    let codeBlockIndex = -1;

    useEffect(() => {
        async function fetchFileData() {
            try {
                const response = await axios.get(DIRECTUS_URL + "/items/filemappings?filter[filename]=datasets");
                const data = response.data.data;

                if (data.length === 1) {
                    const fileMappingObject = data[0];
                    const fileID = fileMappingObject.fileID;
                    if (fileID !== null) {
                        fetch(DIRECTUS_URL + "/assets/" + fileID)
                            .then(response => response.text())
                            .then(data => setMarkdownText(data))
                            .catch(error => console.error('Error retrieving markdown:', error));
                    }
                }

            } catch (error) {
                console.error('Error retrieving data:', error);
            }
        }

        fetchFileData();
    }, []);

    return (
        <div className="page-container">
            <div className="left-nav">
                {/* <LeftNav /> */}
            </div>
            <div className="main-content">
                <h1>Datasets</h1>
                <div className="task-builder-task">
                    <DatasetTable
                        onSelect={onSelectDataset}
                        onClose={null}
                        isVisible={true}
                        selectedDatasets={selectedDatasets}
                        fromToolsPage={false}
                        onSelectSubItem={onSelectSubItem}
                        showCheckbox={false}
                        showEdit={false}
                        showDelete={false}
                    />
                    <p><ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeGithubAlerts]}
                        children={markdownText}
                        components={{
                            code(props) {
                                const { children, inline, className, node, ...rest } = props;
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match) {
                                    codeBlockIndex++;

                                    const currentIndex = codeBlockIndex;
                                    const codeText = String(children).replace(/\n$/, '');

                                    return (
                                        <div style={{ position: 'relative' }}>
                                            <SyntaxHighlighter
                                                {...rest}
                                                PreTag="div"
                                                children={codeText}
                                                language={match[1]}
                                                style={dark}
                                            />
                                            <CopyToClipboard text={codeText} onCopy={() => handleCopy(currentIndex)}>
                                                <button style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    right: '5px',
                                                    background: '#333',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    padding: '5px 10px',
                                                }}>{copiedIndex === currentIndex ? 'Copied!' : 'Copy'}</button>
                                            </CopyToClipboard>
                                        </div>
                                    );
                                }

                                // Fallback for inline code or unknown language
                                return (
                                    <code {...rest} className={className}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    /></p>
                </div>
            </div>
            <div className="right-rail">
                <RightRail />
                <Chatbot presetQuestions={null} />
            </div>
        </div >
    )
}